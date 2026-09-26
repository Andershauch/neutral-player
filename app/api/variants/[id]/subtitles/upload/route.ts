import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import {
  isValidCustomSubtitleLanguageCode,
  looksLikeWebVtt,
  MAX_UPLOADED_VTT_BYTES,
} from "@/lib/subtitles";
import { getRequestIdFromRequest, logApiError, logApiInfo } from "@/lib/observability";

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
      select: { id: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Sprogversionen blev ikke fundet." }, { status: 404 });
    }

    const existing = await prisma.variantSubtitle.findUnique({
      where: { variantId_languageCode: { variantId, languageCode } },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== "errored") {
      return NextResponse.json(
        { error: "Der findes allerede undertekster på det sprog." },
        { status: 409 }
      );
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
