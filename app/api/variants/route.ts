import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("API MODTOG DATA:", body);

    const { embedId, groupId, lang, title } = body;

    let targetGroupId = groupId;

    // Hvis vi ikke har fået et groupId, men har et embedId (fra et helt nyt projekt)
    if (!targetGroupId && embedId) {
      // Find den første gruppe i projektet eller opret en "Standard" gruppe
      const existingGroup = await prisma.group.findFirst({
        where: { embedId: embedId }
      });

      if (existingGroup) {
        targetGroupId = existingGroup.id;
      } else {
        // Opret en ny gruppe automatisk, hvis projektet er tomt
        const newGroup = await prisma.group.create({
          data: {
            name: "Standard",
            embedId: embedId
          }
        });
        targetGroupId = newGroup.id;
      }
    }

    // Nu har vi med sikkerhed et targetGroupId
    if (!targetGroupId) {
      return NextResponse.json({ error: "groupId eller embedId mangler" }, { status: 400 });
    }

    const variant = await prisma.variant.create({
      data: {
        groupId: targetGroupId,
        lang: lang || "da",
        title: title,
        // Vi initialiserer visninger til 0
        views: 0
      }
    });

    return NextResponse.json(variant);
  } catch (error: any) {
    console.error("API FEJL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}