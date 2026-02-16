import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Mux from "@mux/mux-node";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Initialiser Mux (v9+ stil)
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Uautoriseret" }, { status: 401 });

    const resolvedParams = await params;
    const variantId = resolvedParams.id;

    // 1. Hent varianten fra databasen
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
    });

    if (!variant || !variant.muxUploadId) {
      return NextResponse.json({ error: "Ingen Mux upload fundet" }, { status: 404 });
    }

    // 2. Spørg Mux om status på denne upload (v9+ syntaks)
    const upload = await muxClient.video.uploads.retrieve(variant.muxUploadId);

    if (upload.status === "asset_created" && upload.asset_id) {
      // 3. Hvis et asset er skabt, hent detaljerne for det asset
      const asset = await muxClient.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;

      if (playbackId) {
        // 4. Opdater databasen manuelt
        await prisma.variant.update({
          where: { id: variantId },
          data: {
            muxPlaybackId: playbackId,
            muxAssetId: upload.asset_id,
          },
        });
        return NextResponse.json({ success: true, playbackId });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: `Videoen er ikke klar hos Mux endnu (Status: ${upload.status})` 
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    console.error("Refresh error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
