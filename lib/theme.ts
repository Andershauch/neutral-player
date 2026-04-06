import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { getOrgPlanAndCapabilities } from "@/lib/plan-capabilities";
import { DEFAULT_THEME_TOKENS, validateThemeTokens, type ThemeTokens, type ThemeScope, type ThemeStatus } from "@/lib/theme-schema";

type ThemeRecord = {
  id: string;
  organizationId: string | null;
  scope: ThemeScope;
  status: ThemeStatus;
  version: number;
  name: string | null;
  tokens: ThemeTokens;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPublishedGlobalTheme(): Promise<ThemeRecord | null> {
  const theme = await prisma.organizationTheme.findFirst({
    where: {
      organizationId: null,
      scope: "global_default",
      status: "published",
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  return toThemeRecord(theme);
}

export async function getPublishedOrganizationTheme(orgId: string): Promise<ThemeRecord | null> {
  const theme = await prisma.organizationTheme.findFirst({
    where: {
      organizationId: orgId,
      scope: "organization",
      status: "published",
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
  return toThemeRecord(theme);
}

export async function resolveThemeForOrganization(orgId: string): Promise<{
  tokens: ThemeTokens;
  source: "default" | "global" | "organization";
  plan: string;
  enterpriseBrandingEnabled: boolean;
}> {
  const { plan, capabilities } = await getOrgPlanAndCapabilities(orgId);

  const [globalTheme, orgTheme] = await Promise.all([
    getPublishedGlobalTheme(),
    capabilities.enterpriseBrandingEnabled ? getPublishedOrganizationTheme(orgId) : Promise.resolve(null),
  ]);

  const { tokens, source } = resolveThemeTokenSource({
    defaultTokens: DEFAULT_THEME_TOKENS,
    globalTokens: readThemeTokensOrNull(globalTheme, {
      scope: "global_default",
      organizationId: null,
    }),
    organizationTokens: capabilities.enterpriseBrandingEnabled
      ? readThemeTokensOrNull(orgTheme, {
          scope: "organization",
          organizationId: orgId,
        })
      : null,
    enterpriseBrandingEnabled: capabilities.enterpriseBrandingEnabled,
  });

  return {
    tokens,
    source,
    plan,
    enterpriseBrandingEnabled: capabilities.enterpriseBrandingEnabled,
  };
}

export async function getLatestDraftThemeForOrganization(orgId: string): Promise<ThemeRecord | null> {
  const theme = await prisma.organizationTheme.findFirst({
    where: {
      organizationId: orgId,
      scope: "organization",
      status: "draft",
    },
    orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
  });
  return toThemeRecord(theme);
}

export async function getNextOrgThemeVersion(orgId: string): Promise<number> {
  const maxTheme = await prisma.organizationTheme.findFirst({
    where: { organizationId: orgId, scope: "organization" },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (maxTheme?.version ?? 0) + 1;
}

export function resolveThemeTokenSource(input: {
  defaultTokens: ThemeTokens;
  globalTokens: ThemeTokens | null;
  organizationTokens: ThemeTokens | null;
  enterpriseBrandingEnabled: boolean;
}): {
  tokens: ThemeTokens;
  source: "default" | "global" | "organization";
} {
  if (input.enterpriseBrandingEnabled && input.organizationTokens) {
    return {
      tokens: structuredClone(input.organizationTokens),
      source: "organization",
    };
  }

  if (input.globalTokens) {
    return {
      tokens: structuredClone(input.globalTokens),
      source: "global",
    };
  }

  return {
    tokens: structuredClone(input.defaultTokens),
    source: "default",
  };
}

function toThemeRecord(theme: {
  id: string;
  organizationId: string | null;
  scope: string;
  status: string;
  version: number;
  name: string | null;
  tokens: unknown;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} | null): ThemeRecord | null {
  if (!theme) return null;
  return {
    id: theme.id,
    organizationId: theme.organizationId,
    scope: theme.scope as ThemeScope,
    status: theme.status as ThemeStatus,
    version: theme.version,
    name: theme.name,
    tokens: theme.tokens as ThemeTokens,
    publishedAt: theme.publishedAt,
    createdAt: theme.createdAt,
    updatedAt: theme.updatedAt,
  };
}

function readThemeTokensOrNull(
  theme: ThemeRecord | null,
  meta: {
    scope: ThemeScope;
    organizationId: string | null;
  }
): ThemeTokens | null {
  if (!theme) return null;

  const validated = validateThemeTokens(theme.tokens);
  if (validated.ok && validated.value) {
    return validated.value;
  }

  console.warn(
    JSON.stringify({
      level: "warn",
      message: "Invalid theme payload detected. Falling back to safe theme source.",
      scope: meta.scope,
      organizationId: meta.organizationId,
      themeId: theme.id,
      errors: validated.errors,
      timestamp: new Date().toISOString(),
    })
  );
  Sentry.captureMessage("Invalid theme payload detected", {
    level: "warning",
    tags: {
      scope: meta.scope,
      themeSubsystem: "runtime-resolve",
    },
    extra: {
      organizationId: meta.organizationId,
      themeId: theme.id,
      errors: validated.errors,
    },
  });

  return null;
}
