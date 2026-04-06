import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrgContextForBranding } from "@/lib/authz";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";
import { DEFAULT_THEME_TOKENS, validateThemeTokens } from "@/lib/theme-schema";
import { getLatestDraftThemeForOrganization, getNextOrgThemeVersion, resolveThemeForOrganization } from "@/lib/theme";

export async function GET(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const orgCtx = await getOrgContextForBranding();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const [{ plan, capabilities }, resolvedTheme, draftTheme] = await Promise.all([
      getOrgPlanAndCapabilities(orgCtx.orgId),
      resolveThemeForOrganization(orgCtx.orgId),
      getLatestDraftThemeForOrganization(orgCtx.orgId),
    ]);

    return NextResponse.json({
      plan,
      capabilities,
      canUseEnterpriseBranding: capabilities.enterpriseBrandingEnabled,
      defaultTokens: DEFAULT_THEME_TOKENS,
      activeTheme: {
        source: resolvedTheme.source,
        tokens: resolvedTheme.tokens,
      },
      draftTheme,
    });
  } catch (error) {
    logApiError(req, "Customer branding theme read failed", error, { area: "branding-theme", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const orgCtx = await getOrgContextForBranding();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { capabilities } = await getOrgPlanAndCapabilities(orgCtx.orgId);
    if (!capabilities.enterpriseBrandingEnabled) {
      logApiWarn(req, "Customer branding draft save blocked by plan gate", {
        area: "branding-theme",
        organizationId: orgCtx.orgId,
        requestId,
      });
      return NextResponse.json(
        { error: "Custom branding kræver Enterprise-plan.", code: "ENTERPRISE_REQUIRED" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { name?: unknown; tokens?: unknown };
    const validated = validateThemeTokens(body.tokens);
    if (!validated.ok || !validated.value) {
      logApiWarn(req, "Customer branding draft save rejected due to invalid payload", {
        area: "branding-theme",
        organizationId: orgCtx.orgId,
        requestId,
        errors: validated.errors,
      });
      return NextResponse.json({ error: "Ugyldigt theme payload.", details: validated.errors }, { status: 400 });
    }

    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const nextName = rawName ? rawName.slice(0, 80) : "Enterprise theme draft";
    const draft = await getLatestDraftThemeForOrganization(orgCtx.orgId);

    const saved = draft
      ? await prisma.organizationTheme.update({
          where: { id: draft.id },
          data: {
            name: nextName,
            tokens: validated.value as unknown as Prisma.InputJsonValue,
          },
        })
      : await prisma.organizationTheme.create({
          data: {
            organizationId: orgCtx.orgId,
            scope: "organization",
            status: "draft",
            version: await getNextOrgThemeVersion(orgCtx.orgId),
            name: nextName,
            tokens: validated.value as unknown as Prisma.InputJsonValue,
          },
        });

    logApiInfo(req, "Customer branding draft saved", {
      area: "branding-theme",
      organizationId: orgCtx.orgId,
      requestId,
      themeId: saved.id,
      themeVersion: saved.version,
    });
    return NextResponse.json({ ok: true, theme: saved });
  } catch (error) {
    logApiError(req, "Customer branding draft save failed", error, { area: "branding-theme", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const orgCtx = await getOrgContextForBranding();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { capabilities } = await getOrgPlanAndCapabilities(orgCtx.orgId);
    if (!capabilities.enterpriseBrandingEnabled) {
      logApiWarn(req, "Customer branding publish blocked by plan gate", {
        area: "branding-theme",
        organizationId: orgCtx.orgId,
        requestId,
      });
      return NextResponse.json(
        { error: "Custom branding kræver Enterprise-plan.", code: "ENTERPRISE_REQUIRED" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { action?: unknown; themeId?: unknown };
    if (body.action !== "publish") {
      return NextResponse.json({ error: "Ugyldig handling. Brug action=publish." }, { status: 400 });
    }

    const selectedThemeId = typeof body.themeId === "string" ? body.themeId.trim() : "";

    const draftTheme = selectedThemeId
      ? await prisma.organizationTheme.findFirst({
          where: {
            id: selectedThemeId,
            organizationId: orgCtx.orgId,
            scope: "organization",
            status: "draft",
          },
        })
      : await getLatestDraftThemeForOrganization(orgCtx.orgId);

    if (!draftTheme) {
      return NextResponse.json({ error: "Ingen draft theme fundet." }, { status: 404 });
    }

    const published = await prisma.$transaction(async (tx) => {
      await tx.organizationTheme.updateMany({
        where: {
          organizationId: orgCtx.orgId,
          scope: "organization",
          status: "published",
        },
        data: { status: "archived" },
      });

      const next = await tx.organizationTheme.update({
        where: { id: draftTheme.id },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: null,
          action: "PUBLISH_ORG_THEME",
          target: `Theme ${next.name || next.id} (v${next.version})`,
        },
      });

      return next;
    });

    logApiInfo(req, "Customer branding theme published", {
      area: "branding-theme",
      organizationId: orgCtx.orgId,
      requestId,
      themeId: published.id,
      themeVersion: published.version,
      source: "customer",
    });
    return NextResponse.json({ ok: true, theme: published });
  } catch (error) {
    logApiError(req, "Customer branding publish failed", error, { area: "branding-theme", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
