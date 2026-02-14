import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Vi fortæller TS at det er et Promise
) {
  try {
    // 1. FIX: Vi SKAL await params i Next.js 15
    const { id } = await params;

    console.log("Forsøger at slette projekt med ID:", id);

    // 2. Find data så vi kan slette hos Mux
    const project = await prisma.embed.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
    }

    // 3. Slet Assets hos Mux
    const variants = project.groups.flatMap((g) => g.variants);
    for (const variant of variants) {
      if (variant.muxAssetId) {
        try {
          await mux.video.assets.delete(variant.muxAssetId);
          console.log("Slettede Mux Asset:", variant.muxAssetId);
        } catch (muxErr) {
          console.error("Mux sletning fejlede (kan ignoreres):", muxErr);
        }
      }
    }

    // 4. Slet i databasen
    // Takket være 'onDelete: Cascade' i dit schema, sletter den selv grupper og varianter
    await prisma.embed.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SLETNING FEJLEDE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}