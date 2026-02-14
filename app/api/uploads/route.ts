import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vi tjekker her om nøglerne overhovedet findes
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { variantId } = body;

    console.log("Forsøger at starte upload for variant:", variantId);

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      console.error("MANGLER MUX NØGLER I .ENV");
      return NextResponse.json({ error: "Mux konfiguration mangler på serveren" }, { status: 500 });
    }

    // 1. Opret Direct Upload hos Mux
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
      },
      cors_origin: "*", 
    });

    console.log("Mux Upload URL modtaget:", upload.url.substring(0, 30) + "...");

    // 2. Opdater databasen
    await prisma.variant.update({
      where: { id: variantId },
      data: { muxUploadId: upload.id },
    });

    return NextResponse.json({ url: upload.url });
  } catch (error: any) {
    // Dette vil nu dukke op i din VS Code terminal
    console.error("DETALJERET MUX FEJL:", error);
    return NextResponse.json({ error: error.message || "Interen serverfejl" }, { status: 500 });
  }
}