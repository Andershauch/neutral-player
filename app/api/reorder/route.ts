import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { items } = await request.json(); // Vi forventer en liste: [{id: "1", sortOrder: 0}, {id: "2", sortOrder: 1}]

    // Vi bruger en 'transaction' for at sikre, at enten lykkes alle opdateringer, eller ingen af dem.
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.group.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fejl ved sortering:", error);
    return NextResponse.json({ error: "Kunne ikke gemme rækkefølgen" }, { status: 500 });
  }
}