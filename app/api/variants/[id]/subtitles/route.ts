import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { buildSubtitleTrackName, isSupportedSubtitleLanguage } from "@/lib/subtitles";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const limit = checkRateLimit({
      key: buildRateLimitKey("subtitles:create", req),
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
    const body = (await req.json()) as { languageCode?: string };
    const languageCode = (body.languageCode || "").trim().toLowerCase();

    if (!isSupportedSubtitleLanguage(languageCode)) {
      return NextResponse.json(
        { error: "Sproget kan ikke auto-tekstes. Vælg et sprog fra listen." },
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

    if (!variant.muxAssetId) {
      return NextResponse.json(
        { error: "Videoen er ikke færdigbehandlet endnu. Prøv igen om lidt." },
        { status: 409 }
      );
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

    // Undertekster genereres ud fra assetets lydspor, saa vi skal finde det foerst.
    const asset = await muxClient.video.assets.retrieve(variant.muxAssetId);
    const audioTrack = asset.tracks?.find((track) => track.type === "audio");

    if (!audioTrack?.id) {
      return NextResponse.json(
        { error: "Videoen har ikke et lydspor, der kan tekstes." },
        { status: 409 }
      );
    }

    const name = buildSubtitleTrackName(languageCode);

    await muxClient.video.assets.generateSubtitles(variant.muxAssetId, audioTrack.id, {
      generated_subtitles: [{ language_code: languageCode, name }],
    });

    const record = await prisma.variantSubtitle.upsert({
      where: { variantId_languageCode: { variantId, languageCode } },
      create: {
        variantId,
        organizationId: orgCtx.orgId,
        languageCode,
        name,
        source: "generated",
        status: "requested",
      },
      update: {
        status: "requested",
        errorMessage: null,
        name,
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
        action: "SUBTITLES_REQUESTED",
        target: `Bestilte undertekster (${languageCode}) på sprogversion ${variantId}`,
      },
    });

    logApiInfo(req, "Subtitles requested", {
      orgId: orgCtx.orgId,
      variantId,
      languageCode,
    });

    return NextResponse.json({ ok: true, subtitle: record });
  } catch (error) {
    logApiError(req, "Subtitle generation failed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
    }

    const { id: variantId } = await params;
    const { searchParams } = new URL(req.url);
    const languageCode = (searchParams.get("languageCode") || "").trim().toLowerCase();

    const subtitle = await prisma.variantSubtitle.findUnique({
      where: { variantId_languageCode: { variantId, languageCode } },
      select: { id: true, organizationId: true, muxTrackId: true, variant: { select: { muxAssetId: true } } },
    });

    if (!subtitle || subtitle.organizationId !== orgCtx.orgId) {
      return NextResponse.json({ error: "Underteksterne blev ikke fundet." }, { status: 404 });
    }

    if (subtitle.muxTrackId && subtitle.variant.muxAssetId) {
      try {
        await muxClient.video.assets.deleteTrack(subtitle.variant.muxAssetId, subtitle.muxTrackId);
      } catch (error) {
        // Sporet kan allerede vaere fjernet hos Mux. Vores raekke skal ryddes uanset.
        logApiWarn(req, "Mux track delete failed, removing local record anyway", {
          variantId,
          languageCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await prisma.variantSubtitle.delete({ where: { id: subtitle.id } });

    logApiInfo(req, "Subtitles removed", { orgId: orgCtx.orgId, variantId, languageCode });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError(req, "Subtitle delete failed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
