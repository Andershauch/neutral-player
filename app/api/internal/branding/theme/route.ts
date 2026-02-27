import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageInternalBranding, getInternalAdminContext } from "@/lib/internal-auth";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";
import { DEFAULT_THEME_TOKENS, validateThemeTokens, type ThemeScope } from "@/lib/theme-schema";
import { resolveThemeForOrganization } from "@/lib/theme";

type ScopeConfig = {
  scope: ThemeScope;
  organizationId: string | null;
};

export async function GET(req: Request) {
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const config = getScopeConfig(req.url);
    if (!config) {
      return NextResponse.json({ error: "Mangler organizationId for organization scope." }, { status: 400 });
    }

    if (config.scope === "organization" && config.organizationId) {
      const { plan, capabilities } = await getOrgPlanAndCapabilities(config.organizationId);
      const [resolvedTheme, draftTheme, versions] = await Promise.all([
        resolveThemeForOrganization(config.organizationId),
        prisma.organizationTheme.findFirst({
          where: {
            organizationId: config.organizationId,
            scope: "organization",
            status: "draft",
          },
          orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
        }),
        prisma.organizationTheme.findMany({
          where: {
            organizationId: config.organizationId,
            scope: "organization",
          },
          orderBy: [{ version: "desc" }],
          select: {
            id: true,
            version: true,
            status: true,
            name: true,
            updatedAt: true,
            publishedAt: true,
          },
          take: 20,
        }),
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
        versions,
      });
    }

    const [publishedGlobal, draftGlobal, versions] = await Promise.all([
      prisma.organizationTheme.findFirst({
        where: {
          organizationId: null,
          scope: "global_default",
          status: "published",
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.organizationTheme.findFirst({
        where: {
          organizationId: null,
          scope: "global_default",
          status: "draft",
        },
        orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
      }),
      prisma.organizationTheme.findMany({
        where: {
          organizationId: null,
          scope: "global_default",
        },
        orderBy: [{ version: "desc" }],
        select: {
          id: true,
          version: true,
          status: true,
          name: true,
          updatedAt: true,
          publishedAt: true,
        },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      plan: "global_default",
      capabilities: { enterpriseBrandingEnabled: true },
      canUseEnterpriseBranding: true,
      defaultTokens: DEFAULT_THEME_TOKENS,
      activeTheme: {
        source: publishedGlobal ? "global" : "default",
        tokens: (publishedGlobal?.tokens as unknown as typeof DEFAULT_THEME_TOKENS) || DEFAULT_THEME_TOKENS,
      },
      draftTheme: draftGlobal,
      versions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }
    if (!canManageInternalBranding(internalCtx.role)) {
      return NextResponse.json({ error: "Kun np_super_admin kan redigere themes i internal." }, { status: 403 });
    }

    const config = getScopeConfig(req.url);
    if (!config) {
      return NextResponse.json({ error: "Mangler organizationId for organization scope." }, { status: 400 });
    }

    if (config.scope === "organization" && config.organizationId) {
      const { capabilities } = await getOrgPlanAndCapabilities(config.organizationId);
      if (!capabilities.enterpriseBrandingEnabled) {
        return NextResponse.json(
          { error: "Valgt organisation har ikke Enterprise-plan.", code: "ENTERPRISE_REQUIRED" },
          { status: 400 }
        );
      }
    }

    const body = (await req.json()) as { name?: unknown; tokens?: unknown };
    const validated = validateThemeTokens(body.tokens);
    if (!validated.ok || !validated.value) {
      return NextResponse.json({ error: "Ugyldigt theme payload.", details: validated.errors }, { status: 400 });
    }

    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const nextName = rawName ? rawName.slice(0, 80) : "Theme draft";

    const latestDraft = await prisma.organizationTheme.findFirst({
      where: {
        organizationId: config.organizationId,
        scope: config.scope,
        status: "draft",
      },
      orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
      select: { id: true },
    });

    const nextVersion = await getNextThemeVersion(config.organizationId, config.scope);
    const saved = latestDraft
      ? await prisma.organizationTheme.update({
          where: { id: latestDraft.id },
          data: {
            name: nextName,
            tokens: validated.value as unknown as Prisma.InputJsonValue,
          },
        })
      : await prisma.organizationTheme.create({
          data: {
            organizationId: config.organizationId,
            scope: config.scope,
            status: "draft",
            version: nextVersion,
            name: nextName,
            tokens: validated.value as unknown as Prisma.InputJsonValue,
          },
        });

    return NextResponse.json({ ok: true, theme: saved, actorRole: internalCtx.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }
    if (!canManageInternalBranding(internalCtx.role)) {
      return NextResponse.json({ error: "Kun np_super_admin kan publicere/rollback themes i internal." }, { status: 403 });
    }

    const config = getScopeConfig(req.url);
    if (!config) {
      return NextResponse.json({ error: "Mangler organizationId for organization scope." }, { status: 400 });
    }

    const body = (await req.json()) as { action?: unknown; themeId?: unknown };
    const action = body.action;
    if (action !== "publish" && action !== "rollback") {
      return NextResponse.json({ error: "Ugyldig handling. Brug action=publish eller action=rollback." }, { status: 400 });
    }

    const selectedThemeId = typeof body.themeId === "string" ? body.themeId.trim() : "";
    const selectedTheme = selectedThemeId
      ? await prisma.organizationTheme.findFirst({
          where: {
            id: selectedThemeId,
            organizationId: config.organizationId,
            scope: config.scope,
          },
        })
      : await prisma.organizationTheme.findFirst({
          where: {
            organizationId: config.organizationId,
            scope: config.scope,
            status: action === "publish" ? "draft" : "archived",
          },
          orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
        });

    if (!selectedTheme) {
      return NextResponse.json({ error: action === "publish" ? "Ingen draft theme fundet." : "Ingen theme fundet til rollback." }, { status: 404 });
    }

    if (action === "publish" && selectedTheme.status !== "draft") {
      return NextResponse.json({ error: "Kun draft theme kan publiceres." }, { status: 400 });
    }
    if (action === "rollback" && selectedTheme.status === "draft") {
      return NextResponse.json({ error: "Kan ikke rollback til draft theme." }, { status: 400 });
    }

    const published = await prisma.$transaction(async (tx) => {
      await tx.organizationTheme.updateMany({
        where: {
          organizationId: config.organizationId,
          scope: config.scope,
          status: "published",
        },
        data: { status: "archived" },
      });

      const next = await tx.organizationTheme.update({
        where: { id: selectedTheme.id },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });

      if (config.organizationId) {
        await tx.auditLog.create({
          data: {
            organizationId: config.organizationId,
            userId: internalCtx.userId,
            userName: internalCtx.email,
            action: action === "publish" ? "INTERNAL_PUBLISH_ORG_THEME" : "INTERNAL_ROLLBACK_ORG_THEME",
            target: `Theme ${next.name || next.id} (v${next.version})`,
          },
        });
      }

      return next;
    });

    return NextResponse.json({ ok: true, theme: published, actorRole: internalCtx.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getScopeConfig(url: string): ScopeConfig | null {
  const search = new URL(url).searchParams;
  const scope = search.get("scope") === "global_default" ? "global_default" : "organization";
  const organizationId = search.get("organizationId")?.trim() || null;

  if (scope === "organization" && !organizationId) return null;
  if (scope === "global_default") return { scope, organizationId: null };
  return { scope, organizationId };
}

async function getNextThemeVersion(organizationId: string | null, scope: ThemeScope): Promise<number> {
  const maxTheme = await prisma.organizationTheme.findFirst({
    where: { organizationId, scope },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (maxTheme?.version ?? 0) + 1;
}
