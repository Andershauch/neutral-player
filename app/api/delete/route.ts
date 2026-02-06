import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    // 1. Hent ID og Type fra URL'en (f.eks. ?type=variant&id=123)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!id || !type) {
      return NextResponse.json({ error: "Mangler ID eller type" }, { status: 400 });
    }

    // 2. Slet baseret på typen
    if (type === "variant") {
      // Slet en enkelt sprog-variant
      await prisma.variant.delete({
        where: { id: id },
      });
    } 
    else if (type === "group") {
      // Slet en hel titel-gruppe
      await prisma.group.delete({
        where: { id: id },
      });
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