import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Find varianten
    const variant = await prisma.variant.findUnique({
      where: { id },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant ikke fundet" }, { status: 404 });
    }

    // 2. Slet kun hos Mux, hvis der rent faktisk ER et assetId
    if (variant.muxAssetId && variant.muxAssetId !== "") {
      try {
        await mux.video.assets.delete(variant.muxAssetId);
      } catch (muxErr) {
        console.log("Mux asset kunne ikke slettes eller findes ikke – vi fortsætter.");
      }
    }

    // 3. Slet altid fra databasen til sidst
    await prisma.variant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("FEJL VED SLETNING:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const { lang, uploadId } = json;

    // Hvis der kommer et uploadId, skal vi hente info fra Mux
    if (uploadId) {
      const upload = await mux.video.uploads.retrieve(uploadId);
      const assetId = upload.asset_id;

      if (!assetId) {
        return NextResponse.json({ error: "Asset er ikke genereret endnu" }, { status: 400 });
      }

      const asset = await mux.video.assets.retrieve(assetId);
      const playbackId = asset.playback_ids?.[0]?.id;

      const updated = await prisma.variant.update({
        where: { id },
        data: {
          muxAssetId: assetId,
          muxPlaybackId: playbackId,
          muxUploadId: uploadId,
        },
      });
      return NextResponse.json(updated);
    }

    // Hvis der kun kommer sprog (din gamle logik)
    if (lang) {
      const updated = await prisma.variant.update({
        where: { id },
        data: { lang },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Ingen data sendt" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH FEJL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}