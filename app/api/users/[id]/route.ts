import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const { role: nextRole } = await req.json();

    const validRoles = ["admin", "contributor", "user"];
    if (!validRoles.includes(nextRole)) {
      return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Bruger ikke fundet" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { role: nextRole },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          action: "OPDATER_ROLLE",
          target: `Aendrede rolle for ${targetUser.email} fra ${targetUser.role} til ${nextRole}`,
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
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: "Bruger ikke fundet" }, { status: 404 });
    }

    if (userToDelete.id === session.user.id) {
      return NextResponse.json({ error: "Du kan ikke slette dig selv" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          action: "SLET_BRUGER",
          target: `Slettede bruger: ${userToDelete.name || userToDelete.email} (ID: ${id})`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
