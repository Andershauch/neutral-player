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
    const embedId = typeof body?.embedId === "string" ? body.embedId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!embedId || !title) {
      return NextResponse.json({ error: "Mangler data" }, { status: 400 });
    }

    const newGroup = await prisma.group.create({
      data: {
        name: title,
        embedId,
      },
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error("Fejl ved oprettelse af gruppe:", error);
    return NextResponse.json({ error: "Kunne ikke oprette gruppen" }, { status: 500 });
  }
}
