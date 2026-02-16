import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    const { action, target } = await req.json();

    const newLog = await prisma.auditLog.create({
      data: {
        userId: session.user.id || null,
        userName: session.user.name || session.user.email || "System",
        action,
        target,
      },
    });

    return NextResponse.json(newLog);
  } catch {
    return NextResponse.json({ error: "Kunne ikke gemme log" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== "admin" && role !== "contributor")) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente logs" }, { status: 500 });
  }
}
