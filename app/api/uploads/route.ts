import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: Request) {
  try {
    // 1. Tjek miljøvariabler
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.error("Mangler MUX credentials i Vercel!");
      return NextResponse.json({ error: "Missing Mux credentials" }, { status: 500 });
    }

    // 2. Opret Direct Upload hos Mux
    const upload = await mux.video.uploads.create({
      cors_origin: "*", // Eller din specifikke vercel domæne
      new_asset_settings: {
        playback_policy: ["public"],
      },
    });

    // 3. Returner svar (Sørg for det er gyldig JSON)
    return NextResponse.json({
      id: upload.id,
      url: upload.url,
    });
  } catch (error: any) {
    console.error("MUX API FEJL:", error);
    return NextResponse.json({ 
      error: "Mux upload failed", 
      details: error.message 
    }, { status: 500 });
  }
}