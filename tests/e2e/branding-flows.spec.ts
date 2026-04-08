import { randomUUID } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const prisma = hasDatabaseUrl ? new PrismaClient() : null;
const TEST_PASSWORD = "Password123!";
const ENTERPRISE_PRIMARY = "#ff6b00";
type TestPlan = "starter_monthly" | "enterprise_monthly";

const ENTERPRISE_THEME_TOKENS = {
  colors: {
    background: "#fff7ed",
    surface: "#ffffff",
    foreground: "#431407",
    muted: "#9a3412",
    line: "#fdba74",
    primary: ENTERPRISE_PRIMARY,
    primaryStrong: "#ea580c",
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
    playButtonBg: "rgba(255, 107, 0, 0.28)",
    playButtonBorder: "#ff6b00",
    playButtonHoverBg: "#ea580c",
    playButtonHoverBorder: "#ea580c",
    playButtonShadow: "0 8px 24px rgba(255, 107, 0, 0.35)",
  },
};

test.describe("Branding E2E flows", () => {
  test("starter org is blocked from enterprise branding controls", async ({ page }) => {
    test.skip(!hasDatabaseUrl, "Branding E2E krÃ¦ver DATABASE_URL.");
    const account = await createUserWithPlan("starter_monthly");

    try {
      await loginWithCredentials(page, account.email, TEST_PASSWORD);
      await page.goto("/admin/profile/branding");

      await expect(page.getByRole("heading", { level: 1, name: /Tema og designprofil/i })).toBeVisible();
      await expect(page.getByText(/Custom branding kr.*Enterprise-plan/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Gem kladde/i })).toBeDisabled();
    } finally {
      await cleanupUser(account.userId, account.organizationId, account.embedId ?? null);
    }
  });

  test("enterprise org theme is applied in admin and branding controls are enabled", async ({ page }) => {
    test.skip(!hasDatabaseUrl, "Branding E2E krÃ¦ver DATABASE_URL.");
    const account = await createUserWithPlan("enterprise_monthly", {
      themePrimary: ENTERPRISE_PRIMARY,
      createEmbed: true,
    });

    try {
      await loginWithCredentials(page, account.email, TEST_PASSWORD);
      await page.goto("/admin/dashboard");

      const appliedPrimary = await page.locator(".np-themed").evaluate((element) => {
        return getComputedStyle(element).getPropertyValue("--primary").trim();
      });

      expect(appliedPrimary).toBe(ENTERPRISE_PRIMARY);

      await page.goto("/admin/profile/branding");
      await expect(page.getByRole("heading", { level: 1, name: /Tema og designprofil/i })).toBeVisible();
      await expect(page.getByText(/Custom branding kr.*Enterprise-plan/i)).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Gem kladde/i })).toBeEnabled();
      await expect(page.getByText(/godkendt token-subset/i)).toBeVisible();
      await expect(page.getByText("Card shadow")).toHaveCount(0);
      await expect(page.getByText("Danger")).toHaveCount(0);

      await page.goto(`/embed/${account.embedId}`);
      const themedRoot = page.locator("main.np-themed");
      await themedRoot.waitFor({ state: "visible", timeout: 15_000 });
      await expect
        .poll(async () => {
          return themedRoot.evaluate((element) => {
            return getComputedStyle(element).getPropertyValue("--primary-strong").trim();
          });
        }, {
          timeout: 10_000,
          intervals: [250, 500, 1_000],
        })
        .toBe("#ea580c");

      const player = page.locator("mux-player");
      await player.waitFor({ state: "attached", timeout: 15_000 });
      await expect(player).toHaveClass(/np-mux-play-skin/);

      const playerVars = await player.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          accent: styles.getPropertyValue("--media-accent-color").trim(),
          controlBackground: styles.getPropertyValue("--media-control-background").trim(),
          focusRing: styles.getPropertyValue("--media-focus-box-shadow").trim(),
        };
      });

      expect(playerVars.accent === "" || playerVars.accent === "#ea580c").toBeTruthy();
      expect(playerVars.controlBackground === "" || playerVars.controlBackground.includes("color-mix")).toBeTruthy();
      expect(playerVars.focusRing === "" || playerVars.focusRing.includes("0 0 0 2px")).toBeTruthy();
    } finally {
      await cleanupUser(account.userId, account.organizationId, account.embedId ?? null);
    }
  });
});

async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Log ind/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });
}

async function createUserWithPlan(
  plan: TestPlan,
  options?: {
    themePrimary?: string;
    createEmbed?: boolean;
  }
) {
  const db = requirePrisma();
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-branding-${suffix}@example.com`;
  const passwordHash = await hash(TEST_PASSWORD, 12);

  const user = await db.user.create({
    data: {
      email,
      password: passwordHash,
      role: "contributor",
    },
    select: { id: true, email: true },
  });

  const organization = await db.organization.create({
    data: {
      name: `E2E Branding ${suffix}`,
      users: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
      subscriptions: {
        create: {
          plan,
          status: "active",
        },
      },
      ...(plan === "enterprise_monthly" && options?.themePrimary
        ? {
            themes: {
              create: {
                scope: "organization",
                status: "published",
                version: 1,
                name: "E2E Enterprise Theme",
                tokens: {
                  ...ENTERPRISE_THEME_TOKENS,
                  colors: {
                    ...ENTERPRISE_THEME_TOKENS.colors,
                    primary: options.themePrimary,
                  },
                },
                publishedAt: new Date(),
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });

  const embed = options?.createEmbed
    ? await db.embed.create({
        data: {
          name: `E2E Embed ${suffix}`,
          allowedDomains: "*",
          organizationId: organization.id,
          groups: {
            create: {
              name: "Main",
              sortOrder: 0,
              organizationId: organization.id,
              variants: {
                create: {
                  title: "Dansk",
                  lang: "da",
                  sortOrder: 0,
                  muxPlaybackId: "test-playback-id",
                  organizationId: organization.id,
                },
              },
            },
          },
        },
        select: { id: true },
      })
    : null;

  return {
    email: user.email,
    userId: user.id,
    organizationId: organization.id,
    embedId: embed?.id ?? null,
  };
}

async function cleanupUser(userId: string, organizationId: string, embedId: string | null) {
  const db = requirePrisma();
  if (embedId) {
    await db.embed.delete({
      where: { id: embedId },
    });
  }

  await db.organization.delete({
    where: { id: organizationId },
  });

  await db.user.delete({
    where: { id: userId },
  });
}

function requirePrisma() {
  if (!prisma) {
    throw new Error("DATABASE_URL mangler for branding E2E.");
  }

  return prisma;
}
