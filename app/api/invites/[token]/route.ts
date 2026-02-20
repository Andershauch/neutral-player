import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { hashInviteToken, isInviteRole } from "@/lib/invites";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tokenHash = hashInviteToken(token);

    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!invite || !isInviteRole(invite.role)) {
      return NextResponse.json({ status: "invalid" }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({
        status: "accepted",
        email: invite.email,
        role: invite.role,
        organizationName: invite.organization.name,
      });
    }

    if (invite.expiresAt < new Date()) {
      const hasAccount = Boolean(
        await prisma.user.findUnique({
          where: { email: invite.email.toLowerCase() },
          select: { id: true },
        })
      );
      return NextResponse.json({
        status: "expired",
        email: invite.email,
        role: invite.role,
        organizationName: invite.organization.name,
        expiresAt: invite.expiresAt,
        hasAccount,
      });
    }

    const hasAccount = Boolean(
      await prisma.user.findUnique({
        where: { email: invite.email.toLowerCase() },
        select: { id: true },
      })
    );

    return NextResponse.json({
      status: "pending",
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization.name,
      expiresAt: invite.expiresAt,
      hasAccount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Du skal logge ind først." }, { status: 401 });
    }

    const { token } = await params;
    const tokenHash = hashInviteToken(token);

    const invite = await prisma.invite.findUnique({
      where: { tokenHash },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invite || !isInviteRole(invite.role)) {
      return NextResponse.json({ error: "Invitationen findes ikke." }, { status: 404 });
    }

    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Invitationen er allerede accepteret." }, { status: 409 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitationen er udløbet." }, { status: 410 });
    }

    const sessionEmail = session.user.email.trim().toLowerCase();
    if (sessionEmail !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: `Du er logget ind som ${session.user.email}, men invitationen er sendt til ${invite.email}.` },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Bruger findes ikke." }, { status: 404 });
    }

    const existingMembership = await prisma.organizationUser.findUnique({
      where: { userId: user.id },
      select: { id: true, organizationId: true },
    });

    if (existingMembership && existingMembership.organizationId !== invite.organizationId) {
      return NextResponse.json(
        { error: "Din konto er allerede tilknyttet et andet workspace." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (!existingMembership) {
        await tx.organizationUser.create({
          data: {
            organizationId: invite.organizationId,
            userId: user.id,
            role: invite.role,
          },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          organizationId: invite.organizationId,
          userId: user.id,
          userName: user.name || user.email,
          action: "ACCEPT_INVITE",
          target: `Accepterede invitation som ${invite.role}`,
        },
      });
    });

    return NextResponse.json({ success: true, organizationName: invite.organization.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
