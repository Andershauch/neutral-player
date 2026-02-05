import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth"; // Juster sti afh af setup
import { auditLog } from "@/lib/api-utils";
import { authOptions } from "@/lib/auth"; // Din next-auth config

const prisma = new PrismaClient();

// GET: Liste til Admin Dashboard
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const embeds = await prisma.embed.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { groups: true } } // Vi viser antal videoer i oversigten
    }
  });

  return NextResponse.json(embeds);
}

// POST: Opret ny Embed
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  
  // Antag session.user.id findes (afhænger af NextAuth callback)
  const userId = (session.user as any).id; 

  const body = await req.json();
  const { name, defaultLang } = body;

  if (!name) return new NextResponse("Name required", { status: 400 });

  const newEmbed = await prisma.embed.create({
    data: {
      name,
      defaultLang: defaultLang || "da"
    }
  });

  // Log handlingen
  await auditLog(userId, "CREATE", "Embed", newEmbed.id, { name });

  return NextResponse.json(newEmbed);
}