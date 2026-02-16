import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { canEditContent } from "@/lib/authz";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;

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

    const variants = project.groups.flatMap((g) => g.variants);
    for (const variant of variants) {
      if (variant.muxAssetId) {
        try {
          await mux.video.assets.delete(variant.muxAssetId);
        } catch (muxErr) {
          console.error("Mux sletning fejlede (kan ignoreres):", muxErr);
        }
      }
    }

    await prisma.embed.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SLETNING FEJLEDE:", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
