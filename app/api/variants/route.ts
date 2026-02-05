// app/api/variants/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // <--- Denne manglede!
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { auditLog, normalizeDreamBrokerUrl } from "@/lib/api-utils";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  const userId = (session.user as any).id;

  const body = await req.json();
  const { groupId, lang, url } = body;

  // 1. Valider URL
  const cleanUrl = normalizeDreamBrokerUrl(url);
  if (!cleanUrl) return new NextResponse("Invalid DreamBroker URL", { status: 400 });

  // 2. Tjek dubletter
  const existing = await prisma.videoVariant.findUnique({
    where: { groupId_lang: { groupId, lang } }
  });
  if (existing) {
    return new NextResponse("Language already exists for this video", { status: 409 });
  }

  // 3. Opret
  const variant = await prisma.videoVariant.create({
    data: { groupId, lang, dreamBrokerUrl: cleanUrl }
  });

  // 4. Log
  await auditLog(userId, "CREATE", "VideoVariant", variant.id, { groupId, lang, url: cleanUrl });

  return NextResponse.json(variant);
}