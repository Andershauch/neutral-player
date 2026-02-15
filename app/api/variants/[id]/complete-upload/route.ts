import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Din prisma instans
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { uploadId } = await req.json();

  try {
    // 1. Hent upload-info fra Mux for at få Asset ID
    const upload = await mux.video.uploads.retrieve(uploadId);
    const assetId = upload.asset_id;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ikke klar endnu" }, { status: 400 });
    }

    // 2. Hent Asset-info for at få Playback ID
    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    // 3. Opdater databasen
    const updatedVariant = await prisma.variant.update({
      where: { id: params.id },
      data: {
        muxAssetId: assetId,
        muxPlaybackId: playbackId,
        muxUploadId: uploadId,
      },
    });

    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Fejl ved opdatering" }, { status: 500 });
  }
}