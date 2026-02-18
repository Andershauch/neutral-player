import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForMemberManagement } from "@/lib/authz";

const validRoles = ["owner", "admin", "editor", "viewer"] as const;

type OrgRole = (typeof validRoles)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgCtx = await getOrgContextForMemberManagement();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const nextRole = body?.role as OrgRole;

    if (!validRoles.includes(nextRole)) {
      return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 });
    }

    if (nextRole === "owner" && orgCtx.role !== "owner") {
      return NextResponse.json({ error: "Kun en ejer kan tildele ejer-rolle." }, { status: 403 });
    }

    const targetMembership = await prisma.organizationUser.findFirst({
      where: {
        organizationId: orgCtx.orgId,
        userId: id,
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Bruger ikke fundet" }, { status: 404 });
    }

    if (targetMembership.role === "owner" && orgCtx.role !== "owner") {
      return NextResponse.json({ error: "Kun en ejer kan ændre ejer-rollen." }, { status: 403 });
    }

    if (targetMembership.userId === orgCtx.userId && nextRole !== "owner") {
      return NextResponse.json({ error: "Du kan ikke fjerne din egen ejer-rolle." }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.$transaction([
      prisma.organizationUser.update({
        where: { id: targetMembership.id },
        data: { role: nextRole },
      }),
      prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "OPDATER_ROLLE",
          target: `Ændrede rolle for ${targetMembership.user.email} til ${nextRole}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgCtx = await getOrgContextForMemberManagement();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;

    const targetMembership = await prisma.organizationUser.findFirst({
      where: {
        organizationId: orgCtx.orgId,
        userId: id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Bruger ikke fundet" }, { status: 404 });
    }

    if (targetMembership.role === "owner") {
      return NextResponse.json({ error: "En ejer kan ikke fjernes her. Tildel først en ny ejer." }, { status: 400 });
    }

    if (targetMembership.userId === orgCtx.userId) {
      return NextResponse.json({ error: "Du kan ikke slette dig selv" }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.$transaction([
      prisma.organizationUser.delete({ where: { id: targetMembership.id } }),
      prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "SLET_BRUGER",
          target: `Fjernede bruger: ${targetMembership.user.name || targetMembership.user.email}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
