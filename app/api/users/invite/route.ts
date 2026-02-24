import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForMemberManagement } from "@/lib/authz";
import {
  createInviteToken,
  getBaseUrl,
  getInviteExpiry,
  hashInviteToken,
  inviteRoles,
  type InviteRole,
} from "@/lib/invites";
import { sendInviteEmail } from "@/lib/invite-email";
import { assertLimit } from "@/lib/plan-limits";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);

  try {
    logApiInfo(req, "Invite flow started");
    const inviteRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:invite", req),
      max: 25,
      windowMs: 10 * 60 * 1000,
    });
    if (!inviteRateLimit.ok) {
      logApiWarn(req, "Invite rate limited", { retryAfterSec: inviteRateLimit.retryAfterSec });
      return rateLimitExceededResponse(inviteRateLimit);
    }

    const orgCtx = await getOrgContextForMemberManagement();
    if (!orgCtx) {
      logApiWarn(req, "Invite denied: missing org member-management context");
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body?.role as InviteRole;

    if (!email || !inviteRoles.includes(role)) {
      logApiWarn(req, "Invite validation failed: invalid email or role", { role });
      return NextResponse.json({ error: "Ugyldig email eller rolle" }, { status: 400 });
    }

    if (role === "owner" && orgCtx.role !== "owner") {
      logApiWarn(req, "Invite denied: non-owner tried assigning owner role", {
        actorRole: orgCtx.role,
      });
      return NextResponse.json({ error: "Kun en ejer kan tildele ejer-rolle." }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const existingInOrg = await prisma.organizationUser.findFirst({
        where: { organizationId: orgCtx.orgId, userId: existingUser.id },
        select: { id: true },
      });
      if (existingInOrg) {
        logApiWarn(req, "Invite blocked: user already member of workspace", { email, orgId: orgCtx.orgId });
        return NextResponse.json({ error: "Brugeren er allerede medlem af workspace." }, { status: 409 });
      }

      const existingElsewhere = await prisma.organizationUser.findUnique({
        where: { userId: existingUser.id },
        select: { organizationId: true },
      });
      if (existingElsewhere && existingElsewhere.organizationId !== orgCtx.orgId) {
        logApiWarn(req, "Invite blocked: user already belongs to other workspace", {
          email,
          orgId: orgCtx.orgId,
          existingOrgId: existingElsewhere.organizationId,
        });
        return NextResponse.json(
          { error: "Brugeren er allerede tilknyttet et andet workspace." },
          { status: 409 }
        );
      }
    }

    await prisma.invite.deleteMany({
      where: {
        organizationId: orgCtx.orgId,
        email,
        acceptedAt: null,
      },
    });

    const seatLimit = await assertLimit(orgCtx.orgId, "seats");
    if (!seatLimit.ok) {
      logApiWarn(req, "Invite blocked by plan seat limit", {
        orgId: orgCtx.orgId,
        limit: seatLimit.limit,
        used: seatLimit.used,
      });
      return NextResponse.json(
        { error: seatLimit.error, code: seatLimit.code, limit: seatLimit.limit, used: seatLimit.used },
        { status: 402 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgCtx.orgId },
      select: { name: true },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    const rawToken = createInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = getInviteExpiry(7);
    const inviteUrl = `${getBaseUrl(req.url)}/invite/${rawToken}`;

    const invite = await prisma.invite.create({
      data: {
        organizationId: orgCtx.orgId,
        invitedByUserId: orgCtx.userId,
        email,
        role,
        tokenHash,
        expiresAt,
      },
      select: { id: true },
    });

    const inviterName = inviter?.name || inviter?.email || "En kollega";
    const workspaceName = organization?.name || "Workspace";
    const emailResult = await sendInviteEmail({
      to: email,
      inviteUrl,
      workspaceName,
      role,
      inviterName,
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgCtx.orgId,
        userId: orgCtx.userId,
        userName: inviter?.name || inviter?.email || null,
        action: "SEND_INVITE",
        target: `Inviterede ${email} som ${role}`,
      },
    });

    logApiInfo(req, "Invite completed", {
      orgId: orgCtx.orgId,
      inviteId: invite.id,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason ?? null,
    });

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      inviteUrl,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason ?? null,
    });
  } catch (error) {
    logApiError(req, "Invite route crashed", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
