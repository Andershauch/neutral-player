import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    // Tjek at man er logget ind som admin eller bidragsyder
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "admin" && role !== "contributor") {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id, isActive } = await request.json();

    const updatedEmbed = await prisma.embed.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updatedEmbed);

  } catch (error) {
    return NextResponse.json({ error: "Kunne ikke opdatere status" }, { status: 500 });
  }
}