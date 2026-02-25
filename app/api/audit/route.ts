import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/org-context";
import { canManageMembersRole } from "@/lib/authz";

export async function POST(req: Request) {
  try {
    const orgCtx = await getCurrentOrgContext();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    const { action, target } = await req.json();
    const normalizedAction = typeof action === "string" ? action.trim() : "";
    const normalizedTarget = typeof target === "string" ? target.trim() : "";
    if (!normalizedAction || !normalizedTarget) {
      return NextResponse.json({ error: "action og target er påkrævet" }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    const newLog = await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: actor?.name || actor?.email || null,
        action: normalizedAction,
        target: normalizedTarget,
      },
    });

    return NextResponse.json(newLog);
  } catch {
    return NextResponse.json({ error: "Kunne ikke gemme log" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const orgCtx = await getCurrentOrgContext();
    if (!orgCtx || !canManageMembersRole(orgCtx.role)) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgCtx.orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Kunne ikke hente logs" }, { status: 500 });
  }
}
