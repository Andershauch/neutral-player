import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Defineret som Promise
) {
  try {
    // 1. Pak params ud med await (Vigtigt i nyeste Next.js)
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log("PATCH anmodning modtaget for ID:", id);

    // 2. Tjek session
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("Ingen session fundet");
      return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Body modtaget:", body);

    // 3. Opdater databasen med det udtrukne ID
    const updated = await prisma.embed.update({
      where: { id: id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.allowedDomains !== undefined && { allowedDomains: body.allowedDomains }),
      },
    });

    console.log("Opdatering lykkedes for:", id);
    return NextResponse.json(updated);

  } catch (error: any) {
    console.error("DETALJERET FEJL I API:", error);
    return NextResponse.json(
      { error: "Database fejl", details: error.message },
      { status: 500 }
    );
  }
}

// GET handleren skal have samme tur for at undgå fejl i fremtiden
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Uautoriseret" }, { status: 401 });

    const embed = await prisma.embed.findUnique({
      where: { id: id },
      include: {
        groups: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!embed) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });

    return NextResponse.json(embed);
  } catch (error) {
    return NextResponse.json({ error: "Fejl ved hentning" }, { status: 500 });
  }
}