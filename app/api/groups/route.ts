import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { auditLog, normalizeDreamBrokerUrl } from "@/lib/api-utils";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const { embedId, title, slug, initialLang, initialUrl } = body;

  // 1. Validering
  if (!embedId || !title || !slug) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  // Valider URL hvis den er medsendt
  let cleanUrl = null;
  if (initialUrl) {
    cleanUrl = normalizeDreamBrokerUrl(initialUrl);
    if (!cleanUrl) return new NextResponse("Invalid DreamBroker URL", { status: 400 });
  }

  // Tjek om slug er unik for dette embed
  const existingSlug = await prisma.videoGroup.findUnique({
    where: { embedId_slug: { embedId, slug } }
  });
  if (existingSlug) return new NextResponse("Slug already exists in this embed", { status: 409 });

  try {
    // 2. Transaktion: Opret Gruppe + evt. første Variant
    const result = await prisma.$transaction(async (tx) => {
      // Opret gruppe
      const group = await tx.videoGroup.create({
        data: {
          embedId,
          title,
          slug,
          // Find højeste sortOrder og læg 1 til (simpel sortering)
          sortOrder: (await tx.videoGroup.count({ where: { embedId } })) + 1
        }
      });

      // Opret variant hvis URL er med
      if (initialLang && cleanUrl) {
        await tx.videoVariant.create({
          data: {
            groupId: group.id,
            lang: initialLang,
            dreamBrokerUrl: cleanUrl
          }
        });
      }
      
      return group;
    });

    // 3. Audit Log
    await auditLog(userId, "CREATE", "VideoGroup", result.id, { 
      title, 
      slug, 
      initialVariant: initialLang ? { lang: initialLang, url: cleanUrl } : "none" 
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}