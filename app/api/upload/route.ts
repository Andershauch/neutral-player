import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request: Request) {
  try {
    // Vi skal bruge denne upload URL for at browseren kan sende filen direkte til Mux
    const upload = await mux.video.uploads.create({
      cors_origin: "*", // Tillad upload fra alle steder (gør det nemt)
      new_asset_settings: {
        playback_policy: ["public"], // Videoen må ses af alle
      },
    });

    // Returner upload-linket til frontend
    return NextResponse.json({ 
      uploadUrl: upload.url, 
      uploadId: upload.id 
    });

  } catch (error) {
    console.error("Fejl ved oprettelse af upload:", error);
    return NextResponse.json({ error: "Kunne ikke starte upload" }, { status: 500 });
  }
}