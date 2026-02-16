import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { canEditContent } from "@/lib/authz";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { uploadId } = await req.json();
    const { id } = await params;

    const upload = await mux.video.uploads.retrieve(uploadId);
    const assetId = upload.asset_id;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ikke klar endnu" }, { status: 400 });
    }

    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    const updatedVariant = await prisma.variant.update({
      where: { id },
      data: {
        muxAssetId: assetId,
        muxPlaybackId: playbackId,
        muxUploadId: uploadId,
      },
    });

    return NextResponse.json(updatedVariant);
  } catch {
    return NextResponse.json({ error: "Fejl ved opdatering" }, { status: 500 });
  }
}
