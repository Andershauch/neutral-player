import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    console.log("MUX WEBHOOK MODTAGET:", type);

    // Når et "Asset" (videoen) er klar, får vi playback_ids
    if (type === "video.asset.ready") {
      const assetId = data.id;
      const uploadId = data.upload_id; // Koblingen til vores database
      const playbackId = data.playback_ids?.[0]?.id;

      if (uploadId && playbackId) {
        console.log(`Opdaterer database: Upload ${uploadId} -> Playback ${playbackId}`);
        
        await prisma.variant.updateMany({
          where: { muxUploadId: uploadId },
          data: {
            muxPlaybackId: playbackId,
            muxAssetId: assetId,
          },
        });
      }
    }

    // Når en video slettes hos Mux (hvis man sletter direkte i deres dashboard)
    if (type === "video.asset.deleted") {
        await prisma.variant.updateMany({
            where: { muxAssetId: data.id },
            data: {
                muxPlaybackId: null,
                muxAssetId: null,
                muxUploadId: null
            }
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("WEBHOOK FEJL:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}