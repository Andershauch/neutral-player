import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { markOnboardingStep } from "@/lib/onboarding";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { lang, uploadId } = json;

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

    if (lang) {
      const updated = await prisma.variant.update({
        where: { id },
        data: { lang },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ingen data sendt" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
