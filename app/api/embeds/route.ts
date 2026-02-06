import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    const newEmbed = await prisma.embed.create({
      data: {
        name: name || "Nyt Projekt",
      },
    });

    return NextResponse.json(newEmbed);
  } catch (error) {
    return NextResponse.json({ error: "Kunne ikke oprette projekt" }, { status: 500 });
  }
}