import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEditContent } from "@/lib/authz";

export async function POST(request: Request) {
  try {
    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    const newEmbed = await prisma.embed.create({
      data: {
        name: name || "Nyt Projekt",
      },
    });

    return NextResponse.json(newEmbed);
  } catch {
    return NextResponse.json({ error: "Kunne ikke oprette projekt" }, { status: 500 });
  }
}
