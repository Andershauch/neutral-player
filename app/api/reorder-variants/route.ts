import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEditContent } from "@/lib/authz";

export async function POST(request: Request) {
  try {
    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Ugyldigt payload" }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.variant.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fejl ved sortering af varianter:", error);
    return NextResponse.json({ error: "Kunne ikke gemme raekkefolgen" }, { status: 500 });
  }
}
