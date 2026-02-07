import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Mangler email eller password" }, { status: 400 });
    }

    // 1. Tjek om brugeren allerede findes
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email er allerede i brug" }, { status: 400 });
    }

    // 2. Krypter passwordet (Hash det)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Opret brugeren
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "contributor", // <--- VIGTIGT: Sætter rollen til Bidragsyder
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("Registrerings fejl:", error);
    return NextResponse.json({ error: "Kunne ikke oprette bruger" }, { status: 500 });
  }
}