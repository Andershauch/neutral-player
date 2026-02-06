import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, lang, muxUploadId, dreamBrokerUrl } = body;

    if (!groupId || !lang) {
      return NextResponse.json({ error: "Mangler groupId eller sprog" }, { status: 400 });
    }

    // FEJLEN VAR HER: Vi bruger prisma.variant i stedet for prisma.videoVariant
    // Vi tjekker om varianten findes i forvejen
    const existing = await prisma.variant.findUnique({
      where: {
        groupId_lang: { // Dette kræver at du har @@unique([groupId, lang]) i din schema
          groupId: groupId,
          lang: lang
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Dette sprog findes allerede for denne titel" }, { status: 409 });
    }

    // Opret ny variant
    const newVariant = await prisma.variant.create({
      data: {
        groupId,
        lang,
        muxUploadId,
        dreamBrokerUrl,
      },
    });

    return NextResponse.json(newVariant);

  } catch (error) {
    console.error("Fejl ved oprettelse af variant:", error);
    return NextResponse.json({ error: "Kunne ikke oprette variant" }, { status: 500 });
  }
}