import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { markOnboardingStep } from "@/lib/onboarding";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const variantDeleteRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:variant-delete", req),
      max: 25,
      windowMs: 10 * 60 * 1000,
    });
    if (!variantDeleteRateLimit.ok) {
      return rateLimitExceededResponse(variantDeleteRateLimit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;

    const variant = await prisma.variant.findFirst({
      where: { id, organizationId: orgCtx.orgId },
    });
    if (!variant) {
      return NextResponse.json({ error: "Variant ikke fundet" }, { status: 404 });
    }

    if (variant.muxAssetId) {
      try {
        await mux.video.assets.delete(variant.muxAssetId);
      } catch {
        // Ignore stale Mux assets
      }
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.$transaction([
      prisma.variant.delete({ where: { id: variant.id } }),
      prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "SLET_VARIANT",
          target: `Variant: ${variant.title || variant.id} (${variant.lang.toUpperCase()})`,
        },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const variantUpdateRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:variant-update", req),
      max: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!variantUpdateRateLimit.ok) {
      return rateLimitExceededResponse(variantUpdateRateLimit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.variant.findFirst({
      where: { id, organizationId: orgCtx.orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Variant ikke fundet" }, { status: 404 });
    }
    const json = await req.json();
    const { lang, uploadId } = json as {
      lang?: string;
      uploadId?: string;
      posterFrameUrl?: string | null;
      title?: string | null;
    };

    if (uploadId) {
      const upload = await mux.video.uploads.retrieve(uploadId);
      const assetId = upload.asset_id;

      if (!assetId) {
        return NextResponse.json({ error: "Asset er ikke genereret endnu" }, { status: 400 });
      }

      const asset = await mux.video.assets.retrieve(assetId);
      const playbackId = asset.playback_ids?.[0]?.id;

      const actor = await prisma.user.findUnique({
        where: { id: orgCtx.userId },
        select: { name: true, email: true },
      });

      const updated = await prisma.variant.update({
        where: { id },
        data: {
          muxAssetId: assetId,
          muxPlaybackId: playbackId,
          muxUploadId: uploadId,
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "UPLOAD_VARIANT_VIDEO",
          target: `Variant ${updated.title || updated.id} (${updated.lang.toUpperCase()})`,
        },
      });

      if (updated.muxPlaybackId) {
        await markOnboardingStep({
          orgId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          step: "variant_uploaded",
        });
      }
      return NextResponse.json(updated);
    }

    if ("posterFrameUrl" in json) {
      const posterFrameUrl = (json as { posterFrameUrl?: unknown }).posterFrameUrl;

      if (posterFrameUrl !== null && typeof posterFrameUrl !== "string") {
        return NextResponse.json({ error: "Ugyldigt posterframe-format" }, { status: 400 });
      }

      let nextPoster: string | null = null;
      if (typeof posterFrameUrl === "string") {
        const trimmed = posterFrameUrl.trim();
        if (trimmed.length > 0) {
          const isDataImage = trimmed.startsWith("data:image/") && trimmed.includes(";base64,");
          const isHttpImage = /^https?:\/\//i.test(trimmed);
          if (!isDataImage && !isHttpImage) {
            return NextResponse.json({ error: "Posterframe skal være billede-URL eller data:image." }, { status: 400 });
          }
          if (trimmed.length > 450_000) {
            return NextResponse.json({ error: "Posterframe er for stort. Vælg et mindre billede." }, { status: 400 });
          }
          nextPoster = trimmed;
        }
      }

      const updated = await prisma.variant.update({
        where: { id },
        data: { posterFrameUrl: nextPoster },
      });
      return NextResponse.json(updated);
    }

    if (lang) {
      const updated = await prisma.variant.update({
        where: { id },
        data: { lang },
      });
      return NextResponse.json(updated);
    }

    if ("title" in json) {
      const rawTitle = (json as { title?: unknown }).title;
      if (rawTitle !== null && typeof rawTitle !== "string") {
        return NextResponse.json({ error: "Ugyldig titel" }, { status: 400 });
      }

      const trimmedTitle = typeof rawTitle === "string" ? rawTitle.trim() : "";
      const nextTitle = trimmedTitle.length > 0 ? trimmedTitle.slice(0, 120) : null;

      const updated = await prisma.variant.update({
        where: { id },
        data: { title: nextTitle },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ingen data sendt" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
