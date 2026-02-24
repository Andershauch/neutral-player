import { NextResponse } from "next/server";
import { getCurrentOrgContext } from "@/lib/org-context";
import { prisma } from "@/lib/prisma";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

export async function PATCH(req: Request) {
  const requestId = getRequestIdFromRequest(req);

  try {
    logApiInfo(req, "Workspace update started");

    const orgCtx = await getCurrentOrgContext();
    if (!orgCtx) {
      logApiWarn(req, "Workspace update denied: missing org context");
      return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
    }

    const body = (await req.json()) as { name?: string };
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    if (!rawName || rawName.length < 2) {
      logApiWarn(req, "Workspace update validation failed: name too short", {
        orgId: orgCtx.orgId,
      });
      return NextResponse.json({ error: "Workspace-navn skal være mindst 2 tegn." }, { status: 400 });
    }

    const name = rawName.slice(0, 80);
    await prisma.organization.update({
      where: { id: orgCtx.orgId },
      data: { name },
    });

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: actor?.name || actor?.email || null,
        action: "OPDATER_WORKSPACE_NAVN",
        target: `Workspace-navn opdateret til: ${name}`,
      },
    });

    logApiInfo(req, "Workspace update completed", {
      orgId: orgCtx.orgId,
      name,
    });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    logApiError(req, "Workspace update route crashed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
