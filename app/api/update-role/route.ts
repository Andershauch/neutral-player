import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    // 1. Tjek sikkerhed: Er den der kalder funktionen selv Admin?
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    // 2. Hent data fra frontend
    const body = await request.json();
    const { userId, newRole } = body;

    // Simpel validering af roller
    const validRoles = ["admin", "contributor", "user"];
    if (!validRoles.includes(newRole)) {
        return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 });
    }

    // 3. Opdater brugeren i databasen
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Fejl ved rolle-skift:", error);
    return NextResponse.json({ error: "Kunne ikke opdatere rolle" }, { status: 500 });
  }
}