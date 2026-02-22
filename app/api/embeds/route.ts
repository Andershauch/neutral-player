import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { assertLimit } from "@/lib/plan-limits";
import { markOnboardingStep } from "@/lib/onboarding";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const requestId = getRequestIdFromRequest(request);

  try {
    logApiInfo(request, "Create project started");
    const createProjectRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:embed-create", request),
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!createProjectRateLimit.ok) {
      logApiWarn(request, "Create project rate limited", {
        retryAfterSec: createProjectRateLimit.retryAfterSec,
      });
      return rateLimitExceededResponse(createProjectRateLimit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      logApiWarn(request, "Create project denied: missing content-edit context");
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const limitCheck = await assertLimit(orgCtx.orgId, "projects");
    if (!limitCheck.ok) {
      logApiWarn(request, "Create project blocked by plan limit", {
        orgId: orgCtx.orgId,
        limit: limitCheck.limit,
        used: limitCheck.used,
      });
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

    logApiInfo(request, "Create project completed", {
      orgId: orgCtx.orgId,
      embedId: newEmbed.id,
    });

    return NextResponse.json(newEmbed);
  } catch (error) {
    logApiError(request, "Create project route crashed", error);
    return NextResponse.json({ error: "Kunne ikke oprette projekt", requestId }, { status: 500 });
  }
}
