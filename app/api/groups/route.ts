import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { embedId, title, slug } = body;

    // Simpel validering
    if (!embedId || !title || !slug) {
      return NextResponse.json({ error: "Mangler data" }, { status: 400 });
    }

    // Vi forsøger at oprette gruppen direkte i databasen (tabellen hedder 'group')
    const newGroup = await prisma.group.create({
      data: {
        name: title,    // Husk: Databasen kalder feltet 'name'
        slug: slug,
        embedId: embedId,
      },
    });

    return NextResponse.json(newGroup);

  } catch (error: any) {
    console.error("Fejl ved oprettelse af gruppe:", error);

    // Hvis fejlkoden er P2002, betyder det "Unik værdi findes allerede" (vores slug regel)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Denne slug bruges allerede i dette projekt. Vælg en anden." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Kunne ikke oprette gruppen" }, { status: 500 });
  }
}