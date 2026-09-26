import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import {
  isValidCustomSubtitleLanguageCode,
  looksLikeWebVtt,
  MAX_UPLOADED_VTT_BYTES,
} from "@/lib/subtitles";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

/// Kundens egen .vtt-fil. Ingen Mux-behandling er nødvendig, saa sporet er
/// "ready" med det samme, i modsætning til de auto-genererede spor.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const limit = checkRateLimit({
      key: buildRateLimitKey("subtitles:upload", req),
      max: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.ok) {
      return rateLimitExceededResponse(limit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
    }

    const { id: variantId } = await params;
    const body = (await req.json()) as {
      languageCode?: string;
      name?: string;
      vttContent?: string;
    };

    const languageCode = (body.languageCode || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const vttContent = body.vttContent || "";

    if (!isValidCustomSubtitleLanguageCode(languageCode)) {
      return NextResponse.json(
        { error: "Sprogkoden ser ikke rigtig ud. Brug f.eks. 'da' eller 'da-dtv'." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json({ error: "Giv underteksterne et navn." }, { status: 400 });
    }

    if (Buffer.byteLength(vttContent, "utf8") > MAX_UPLOADED_VTT_BYTES) {
      return NextResponse.json({ error: "Filen er for stor." }, { status: 400 });
    }

    if (!looksLikeWebVtt(vttContent)) {
      return NextResponse.json(
        { error: "Filen ligner ikke en gyldig .vtt-fil (skal starte med 'WEBVTT')." },
        { status: 400 }
      );
    }

    const variant = await prisma.variant.findFirst({
      where: { id: variantId, organizationId: orgCtx.orgId },
      select: { id: true, muxAssetId: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Sprogversionen blev ikke fundet." }, { status: 404 });
    }

    // I modsætning til generér-flowet blokerer vi ikke, hvis der allerede
    // findes undertekster på sproget: at uploade sin egen fil er en bevidst
    // "erstat"-handling, uanset om det, der ligger der, er auto-genereret
    // eller en tidligere upload.
    const existing = await prisma.variantSubtitle.findUnique({
      where: { variantId_languageCode: { variantId, languageCode } },
      select: { source: true, muxTrackId: true },
    });

    // Mux baker et auto-genereret spor direkte ind i asset'ets HLS-manifest,
    // saa afspilleren bliver ved med at vise det, selvom vi skifter kilden i
    // vores egen database. Det rigtige spor skal fjernes hos Mux, ellers
    // "vinder" det gamle auto-sporet altid over den uploadede fil i CC-menuen.
    if (variant.muxAssetId) {
      try {
        const trackIdFromDb = existing?.source === "generated" ? existing.muxTrackId : null;
        const trackId =
          trackIdFromDb ??
          (await findMuxTextTrackId(variant.muxAssetId, languageCode));
        if (trackId) {
          await muxClient.video.assets.deleteTrack(variant.muxAssetId, trackId);
        }
      } catch (error) {
        logApiWarn(req, "Could not remove stale generated Mux track before upload", {
          variantId,
          languageCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const record = await prisma.variantSubtitle.upsert({
      where: { variantId_languageCode: { variantId, languageCode } },
      create: {
        variantId,
        organizationId: orgCtx.orgId,
        languageCode,
        name,
        source: "uploaded",
        status: "ready",
        enabled: true,
        vttContent,
      },
      update: {
        name,
        source: "uploaded",
        status: "ready",
        enabled: true,
        vttContent,
        errorMessage: null,
        muxTrackId: null,
      },
    });

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: actor?.name || actor?.email || null,
        action: "SUBTITLES_UPLOADED",
        target: `Uploadede undertekster (${languageCode}) på sprogversion ${variantId}`,
      },
    });

    logApiInfo(req, "Subtitles uploaded", {
      orgId: orgCtx.orgId,
      variantId,
      languageCode,
    });

    return NextResponse.json({ ok: true, subtitle: { ...record, vttContent: undefined } });
  } catch (error) {
    logApiError(req, "Subtitle upload failed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

/// Slaar direkte op hos Mux efter et tekstspor paa det givne sprog. Bruges som
/// sikkerhedsnet, hvis vores egen database ikke laengere kender track-id'et
/// (f.eks. hvis en tidligere sletning kun ramte vores raekke og ikke Mux).
async function findMuxTextTrackId(muxAssetId: string, languageCode: string): Promise<string | null> {
  const asset = await muxClient.video.assets.retrieve(muxAssetId);
  const track = asset.tracks?.find(
    (t) => t.type === "text" && t.language_code === languageCode
  );
  return track?.id ?? null;
}
