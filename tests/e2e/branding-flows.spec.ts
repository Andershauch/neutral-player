import { randomUUID } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
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
    const account = await createUserWithPlan("starter_monthly");

    try {
      await loginWithCredentials(page, account.email, TEST_PASSWORD);
      await page.goto("/admin/profile/branding");

      await expect(page.getByRole("heading", { level: 1, name: /Tema og designprofil/i })).toBeVisible();
      await expect(page.getByText(/Custom branding kr.*Enterprise-plan/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /Gem kladde/i })).toBeDisabled();
    } finally {
      await cleanupUser(account.userId, account.organizationId);
    }
  });

  test("enterprise org theme is applied in admin and branding controls are enabled", async ({ page }) => {
    const account = await createUserWithPlan("enterprise_monthly", { themePrimary: ENTERPRISE_PRIMARY });

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
    } finally {
      await cleanupUser(account.userId, account.organizationId);
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
  }
) {
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-branding-${suffix}@example.com`;
  const passwordHash = await hash(TEST_PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: "contributor",
    },
    select: { id: true, email: true },
  });

  const organization = await prisma.organization.create({
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

  return {
    email: user.email,
    userId: user.id,
    organizationId: organization.id,
  };
}

async function cleanupUser(userId: string, organizationId: string) {
  await prisma.organization.delete({
    where: { id: organizationId },
  });

  await prisma.user.delete({
    where: { id: userId },
  });
}
