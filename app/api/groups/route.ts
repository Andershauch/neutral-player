import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";

export async function POST(request: Request) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await request.json();
    const embedId = typeof body?.embedId === "string" ? body.embedId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!embedId || !title) {
      return NextResponse.json({ error: "Mangler data" }, { status: 400 });
    }

    const embed = await prisma.embed.findFirst({
      where: {
        id: embedId,
        organizationId: orgCtx.orgId,
      },
      select: { id: true },
    });

    if (!embed) {
      return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
    }

    const newGroup = await prisma.group.create({
      data: {
        name: title,
        embedId,
        organizationId: orgCtx.orgId,
      },
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error("Fejl ved oprettelse af gruppe:", error);
    return NextResponse.json({ error: "Kunne ikke oprette gruppen" }, { status: 500 });
  }
}
