import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { markOnboardingStep } from "@/lib/onboarding";

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Uautoriseret" }, { status: 401 });
    }

    const resolvedParams = await params;
    const variantId = resolvedParams.id;

    const variant = await prisma.variant.findFirst({
      where: { id: variantId, organizationId: orgCtx.orgId },
    });

    if (!variant || !variant.muxUploadId) {
      return NextResponse.json({ error: "Ingen Mux upload fundet" }, { status: 404 });
    }

    const upload = await muxClient.video.uploads.retrieve(variant.muxUploadId);

    if (upload.status === "asset_created" && upload.asset_id) {
      const asset = await muxClient.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;

      if (playbackId) {
        await prisma.variant.update({
          where: { id: variantId },
          data: {
            muxPlaybackId: playbackId,
            muxAssetId: upload.asset_id,
          },
        });

        const actor = await prisma.user.findUnique({
          where: { id: orgCtx.userId },
          select: { name: true, email: true },
        });
        await markOnboardingStep({
          orgId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          step: "variant_uploaded",
        });

        return NextResponse.json({ success: true, playbackId });
      }
    }

    return NextResponse.json({
      success: false,
      message: `Videoen er ikke klar hos Mux endnu (Status: ${upload.status})`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    console.error("Refresh error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
