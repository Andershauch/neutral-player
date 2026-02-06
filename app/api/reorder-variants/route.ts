import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { items } = await request.json(); // Vi forventer liste af {id, sortOrder}

    // Transaction sikrer at alle opdateres på én gang
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.variant.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fejl ved sortering af varianter:", error);
    return NextResponse.json({ error: "Kunne ikke gemme rækkefølgen" }, { status: 500 });
  }
}