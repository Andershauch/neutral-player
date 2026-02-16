import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canEditContent } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await req.json();
    const { embedId, groupId, lang, title } = body;

    let targetGroupId = groupId;

    if (!targetGroupId && embedId) {
      const existingGroup = await prisma.group.findFirst({ where: { embedId } });

      if (existingGroup) {
        targetGroupId = existingGroup.id;
      } else {
        const newGroup = await prisma.group.create({
          data: {
            name: "Standard",
            embedId,
          },
        });
        targetGroupId = newGroup.id;
      }
    }

    if (!targetGroupId) {
      return NextResponse.json({ error: "groupId eller embedId mangler" }, { status: 400 });
    }

    const variant = await prisma.variant.create({
      data: {
        groupId: targetGroupId,
        lang: lang || "da",
        title,
        views: 0,
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
