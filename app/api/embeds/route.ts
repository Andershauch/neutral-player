import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { assertLimit } from "@/lib/plan-limits";
import { markOnboardingStep } from "@/lib/onboarding";

export async function POST(request: Request) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const limitCheck = await assertLimit(orgCtx.orgId, "projects");
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, code: limitCheck.code, limit: limitCheck.limit, used: limitCheck.used },
        { status: 402 }
      );
    }

    const newEmbed = await prisma.embed.create({
      data: {
        name: name || "Nyt Projekt",
        organizationId: orgCtx.orgId,
      },
    });

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });
    await markOnboardingStep({
      orgId: orgCtx.orgId,
      userId: orgCtx.userId,
      userName: actor?.name || actor?.email || null,
      step: "project_created",
    });

    return NextResponse.json(newEmbed);
  } catch {
    return NextResponse.json({ error: "Kunne ikke oprette projekt" }, { status: 500 });
  }
}
