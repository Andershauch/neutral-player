import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // DEBUG: Se hvad frontend sender til os
    console.log("API MODTOG DATA:", body); 

    const { groupId, lang, muxUploadId, dreamBrokerUrl, title } = body;

    const variant = await prisma.variant.create({
      data: {
        groupId,
        lang,
        muxUploadId,
        dreamBrokerUrl,
        title: title || null, // Sikrer at vi gemmer titlen
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("API FEJL:", error);
    return NextResponse.json({ error: "Fejl ved oprettelse" }, { status: 500 });
  }
}