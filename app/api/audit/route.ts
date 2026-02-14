import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Sørg for at stien passer til din lib mappe

// POST: Gem en ny hændelse i loggen
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vi tjekker om brugeren er logget ind
    if (!session || !session.user) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    console.log("Eksisterende Prisma modeller:", Object.keys(prisma));

    const { action, target } = await req.json();
    // Her bruger vi as any for at tvinge TS til at acceptere id, 
    // hvis din d.ts fil ikke fanges med det samme
    const userId = (session.user as any).id;

    const newLog = await (prisma as any).auditLog.create({
      data: {
        userId: (session.user as any).id || "ukendt",
        userName: session.user.name || session.user.email || "System",
        action: action,
        target: target,
      },
    });

    return NextResponse.json(newLog);
  } catch (error) {
    console.error("Audit log fejl:", error);
    return NextResponse.json({ error: "Kunne ikke gemme log" }, { status: 500 });
  }
}

// GET: Hent de seneste logs til visning på dashboardet
export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Vi henter de 50 nyeste
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Kunne ikke hente logs" }, { status: 500 });
  }
}