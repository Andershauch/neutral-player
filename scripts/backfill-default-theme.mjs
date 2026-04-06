import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_THEME_TOKENS = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    foreground: "#0f172a",
    muted: "#64748b",
    line: "#e2e8f0",
    primary: "#2563eb",
    primaryStrong: "#1d4ed8",
    successBg: "#ecfdf5",
    successFg: "#047857",
    warningBg: "#fffbeb",
    warningFg: "#b45309",
    danger: "#dc2626",
  },
  typography: {
    fontFamily: "Apex New",
    headingWeight: 700,
    bodyWeight: 400,
  },
  radius: {
    card: "2rem",
    pill: "0.75rem",
  },
  shadows: {
    card: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  player: {
    playButtonBg: "rgba(0, 0, 0, 0.45)",
    playButtonBorder: "rgba(255, 255, 255, 0.8)",
    playButtonHoverBg: "#ff5ca8",
    playButtonHoverBorder: "#ff5ca8",
    playButtonShadow: "0 8px 24px rgba(255, 92, 168, 0.35)",
  },
};

async function main() {
  const [existingPublished, latestTheme, organizationCount] = await Promise.all([
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
      },
      orderBy: { version: "desc" },
      select: { version: true },
    }),
    prisma.organization.count(),
  ]);

  if (existingPublished) {
    console.log(
      JSON.stringify(
        {
          status: "noop",
          themeId: existingPublished.id,
          publishedAt: existingPublished.publishedAt?.toISOString() ?? null,
          organizationsCoveredByRuntimeFallback: organizationCount,
        },
        null,
        2
      )
    );
    return;
  }

  const created = await prisma.organizationTheme.create({
    data: {
      organizationId: null,
      scope: "global_default",
      status: "published",
      version: (latestTheme?.version ?? 0) + 1,
      name: "Neutral Default",
      tokens: DEFAULT_THEME_TOKENS,
      publishedAt: new Date(),
    },
  });

  console.log(
    JSON.stringify(
      {
        status: "created",
        themeId: created.id,
        version: created.version,
        organizationsCoveredByRuntimeFallback: organizationCount,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[theme-backfill] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
