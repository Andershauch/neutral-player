import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForMemberManagement } from "@/lib/authz";
import { createInviteToken, getBaseUrl, getInviteExpiry, hashInviteToken } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/invite-email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgCtx = await getOrgContextForMemberManagement();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const invite = await prisma.invite.findFirst({
      where: {
        id,
        organizationId: orgCtx.orgId,
        acceptedAt: null,
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitationen blev ikke fundet." }, { status: 404 });
    }

    if (invite.role === "owner" && orgCtx.role !== "owner") {
      return NextResponse.json({ error: "Kun en ejer kan gensende en ejer-invitation." }, { status: 403 });
    }

    const rawToken = createInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = getInviteExpiry(7);
    const inviteUrl = `${getBaseUrl(req.url)}/invite/${rawToken}`;

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        tokenHash,
        expiresAt,
      },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    const inviterName = inviter?.name || inviter?.email || "En kollega";
    const emailResult = await sendInviteEmail({
      to: invite.email,
      inviteUrl,
      workspaceName: invite.organization.name,
      role: invite.role,
      inviterName,
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: inviter?.name || inviter?.email || null,
        action: "RESEND_INVITE",
        target: `Gensendte invitation til ${invite.email} som ${invite.role}`,
      },
    });

    return NextResponse.json({
      success: true,
      inviteUrl,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orgCtx = await getOrgContextForMemberManagement();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const invite = await prisma.invite.findFirst({
      where: {
        id,
        organizationId: orgCtx.orgId,
        acceptedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitationen blev ikke fundet." }, { status: 404 });
    }

    if (invite.role === "owner" && orgCtx.role !== "owner") {
      return NextResponse.json({ error: "Kun en ejer kan annullere en ejer-invitation." }, { status: 403 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.$transaction([
      prisma.invite.delete({ where: { id: invite.id } }),
      prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "CANCEL_INVITE",
          target: `Annullerede invitation til ${invite.email} som ${invite.role}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
