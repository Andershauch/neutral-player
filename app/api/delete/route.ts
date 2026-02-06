import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Mux from "@mux/mux-node";

const prisma = new PrismaClient();

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ error: "Mangler ID eller type" }, { status: 400 });
    }

    // --- SLET ENKELT VARIANT (VIDEO) ---
    if (type === "variant") {
      const variant = await prisma.variant.findUnique({ where: { id } });

      if (variant?.muxUploadId) {
        try {
          // RETTELSE HER: Vi tilføjer 'as string' for at gøre TypeScript glad
          const upload = await mux.video.uploads.retrieve(variant.muxUploadId as string);
          
          if (upload.asset_id) {
            await mux.video.assets.delete(upload.asset_id);
            console.log(`Slettede Mux Asset: ${upload.asset_id}`);
          }
        } catch (muxError) {
          console.warn("Kunne ikke slette hos Mux (den er måske allerede væk):", muxError);
        }
      }

      await prisma.variant.delete({ where: { id: id } });
    } 
    
    // --- SLET GRUPPE (TITEL) ---
    else if (type === "group") {
      await prisma.group.delete({ where: { id: id } });
    } 
    
    // --- SLET HELE PROJEKTET ---
    else if (type === "embed") {
      await prisma.embed.delete({ where: { id: id } });
    }

    // --- SLET BRUGER ---
    else if (type === "user") {
        await prisma.user.delete({ where: { id: id } });
    }
    
    else {
      return NextResponse.json({ error: "Ugyldig type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Fejl ved sletning:", error);
    return NextResponse.json({ error: "Kunne ikke slette elementet" }, { status: 500 });
  }
}