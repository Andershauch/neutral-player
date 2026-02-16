import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === "video.asset.ready") {
      const assetId = data.id;
      const uploadId = data.upload_id;
      const playbackId = data.playback_ids?.[0]?.id;

      if (uploadId && playbackId) {
        await prisma.variant.updateMany({
          where: { muxUploadId: uploadId },
          data: {
            muxPlaybackId: playbackId,
            muxAssetId: assetId,
          },
        });
      }
    }

    if (type === "video.asset.deleted") {
      await prisma.variant.updateMany({
        where: { muxAssetId: data.id },
        data: {
          muxPlaybackId: null,
          muxAssetId: null,
          muxUploadId: null,
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
