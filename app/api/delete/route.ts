import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Mux from "@mux/mux-node";

const prisma = new PrismaClient();

// Vi opretter forbindelse til Mux
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
      // 1. Find varianten først så vi har Mux ID'et
      const variant = await prisma.variant.findUnique({ where: { id } });

      if (variant?.muxUploadId) {
        try {
          // 2. Spørg Mux om "Asset ID" ved hjælp af "Upload ID"
          const upload = await mux.video.uploads.retrieve(variant.muxUploadId);
          
          if (upload.asset_id) {
            // 3. Slet selve videoen (Asset) hos Mux
            await mux.video.assets.delete(upload.asset_id);
            console.log(`Slettede Mux Asset: ${upload.asset_id}`);
          }
        } catch (muxError) {
          // Hvis videoen allerede er slettet hos Mux, eller den fejler, logger vi det bare
          console.warn("Kunne ikke slette hos Mux (den er måske allerede væk):", muxError);
        }
      }

      // 4. Slet fra vores egen database
      await prisma.variant.delete({ where: { id: id } });
    } 
    
    // --- SLET GRUPPE (TITEL) ---
    else if (type === "group") {
      // Her burde vi ideelt set også loope igennem alle varianter og slette dem fra Mux,
      // men for nu sletter vi bare gruppen lokalt.
      // (Database "Cascade" sletter varianterne, men efterlader filerne hos Mux).
      await prisma.group.delete({ where: { id: id } });
    } 
    
    // --- SLET HELE PROJEKTET ---
    else if (type === "embed") {
      await prisma.embed.delete({ where: { id: id } });
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