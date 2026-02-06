import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request: Request) {
  // DEBUG: Denne besked skal komme frem i din VS Code terminal, når du trykker upload
  console.log("🟢 API blev kaldt! Starter Mux upload...");

  try {
    const directUpload = await mux.video.uploads.create({
      cors_origin: "*", 
      new_asset_settings: {
        playback_policy: ["public"], 
      },
    });

    console.log("✅ Mux svarede succesfuldt:", directUpload.id);

    return NextResponse.json({
      id: directUpload.id,
      url: directUpload.url,
    });

  } catch (error) {
    console.error("🔴 Fejl i API:", error);
    return NextResponse.json({ error: "Kunne ikke starte upload" }, { status: 500 });
  }
}