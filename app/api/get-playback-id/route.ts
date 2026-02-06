import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get("uploadId");

  if (!uploadId) return NextResponse.json({ error: "Mangler ID" }, { status: 400 });

  try {
    // 1. Find information om uploaden
    const upload = await mux.video.uploads.retrieve(uploadId);

    // 2. Hvis uploaden har en asset_id (betyder den er færdigbehandlet)
    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      
      // 3. Find playback ID'et
      const playbackId = asset.playback_ids?.[0]?.id;
      return NextResponse.json({ playbackId });
    }

    return NextResponse.json({ error: "Videoen behandles stadig..." }, { status: 202 });

  } catch (error) {
    return NextResponse.json({ error: "Kunne ikke finde video" }, { status: 500 });
  }
}