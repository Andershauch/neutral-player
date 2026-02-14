import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Find varianten
    const variant = await prisma.variant.findUnique({
      where: { id },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant ikke fundet" }, { status: 404 });
    }

    // 2. Slet kun hos Mux, hvis der rent faktisk ER et assetId
    if (variant.muxAssetId && variant.muxAssetId !== "") {
      try {
        await mux.video.assets.delete(variant.muxAssetId);
      } catch (muxErr) {
        console.log("Mux asset kunne ikke slettes eller findes ikke – vi fortsætter.");
      }
    }

    // 3. Slet altid fra databasen til sidst
    await prisma.variant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("FEJL VED SLETNING:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { lang } = await req.json();

    const updatedVariant = await prisma.variant.update({
      where: { id },
      data: { lang },
    });

    return NextResponse.json(updatedVariant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}