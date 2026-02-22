import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { assertLimit } from "@/lib/plan-limits";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const variantCreateRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:variant-create", req),
      max: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!variantCreateRateLimit.ok) {
      return rateLimitExceededResponse(variantCreateRateLimit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await req.json();
    const { embedId, groupId, lang, title } = body;
    const limitCheck = await assertLimit(orgCtx.orgId, "variants");
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, code: limitCheck.code, limit: limitCheck.limit, used: limitCheck.used },
        { status: 402 }
      );
    }

    let targetGroupId = groupId;

    if (!targetGroupId && embedId) {
      const existingGroup = await prisma.group.findFirst({
        where: { embedId, organizationId: orgCtx.orgId },
      });

      if (existingGroup) {
        targetGroupId = existingGroup.id;
      } else {
        const embed = await prisma.embed.findFirst({
          where: { id: embedId, organizationId: orgCtx.orgId },
          select: { id: true },
        });

        if (!embed) {
          return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
        }

        const newGroup = await prisma.group.create({
          data: {
            name: "Standard",
            embedId,
            organizationId: orgCtx.orgId,
          },
        });
        targetGroupId = newGroup.id;
      }
    }

    if (!targetGroupId) {
      return NextResponse.json({ error: "groupId eller embedId mangler" }, { status: 400 });
    }

    const group = await prisma.group.findFirst({
      where: { id: targetGroupId, organizationId: orgCtx.orgId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Gruppen findes ikke" }, { status: 404 });
    }

    const variant = await prisma.variant.create({
      data: {
        groupId: targetGroupId,
        lang: lang || "da",
        title,
        views: 0,
        organizationId: orgCtx.orgId,
      },
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
        action: "OPRET_VARIANT",
        target: `Variant: ${variant.title || variant.id} (${variant.lang.toUpperCase()})`,
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
