import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

/// TASK-11.8: minimal, additive shell-smoke guardrails. Asserts that the
/// right shell class renders per surface (public / customer admin /
/// internal), so a future refactor that accidentally drops a shell wrapper
/// fails fast here instead of only being caught by a human noticing the
/// look-and-feel drifted. Deliberately not exhaustive visual QA — see
/// docs/saas-roadmap.md TASK-11.8 for what's covered elsewhere.

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const prisma = hasDatabaseUrl ? new PrismaClient() : null;
const TEST_PASSWORD = "Password123!";

function requirePrisma(): PrismaClient {
  if (!prisma) throw new Error("DATABASE_URL mangler.");
  return prisma;
}

test("public shell renders on a public page", async ({ page }) => {
  await page.goto("/pricing");
  // PublicPageShell renders <div>, not <main> — a <header> descendant of
  // <main> loses its implicit "banner" landmark role (HTML-AAM), which
  // public-flows.spec.ts already depends on. See components/public/PublicPageShell.tsx.
  await expect(page.locator("div.np-page-shell.np-default-theme")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("customer admin shell renders after login", async ({ page }) => {
  test.skip(!hasDatabaseUrl, "Shell-smoke for admin kræver DATABASE_URL.");
  const db = requirePrisma();
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-shell-admin-${suffix}@example.com`;
  const passwordHash = await hash(TEST_PASSWORD, 12);

  const user = await db.user.create({
    data: { email, password: passwordHash, role: "contributor" },
    select: { id: true },
  });
  const organization = await db.organization.create({
    data: {
      name: `E2E Shell ${suffix}`,
      users: { create: { userId: user.id, role: "owner" } },
      subscriptions: { create: { plan: "starter_monthly", status: "active" } },
    },
    select: { id: true },
  });

  try {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Log ind/i }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });

    await expect(page.locator(".np-themed")).toBeVisible();
  } finally {
    await db.organization.delete({ where: { id: organization.id } });
    await db.user.delete({ where: { id: user.id } });
  }
});

test("internal admin shell renders and is visually distinct from customer admin", async ({ page }) => {
  test.skip(!hasDatabaseUrl, "Shell-smoke for internal kræver DATABASE_URL.");
  const db = requirePrisma();
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-shell-internal-${suffix}@example.com`;
  const passwordHash = await hash(TEST_PASSWORD, 12);

  const user = await db.user.create({
    data: { email, password: passwordHash, role: "np_super_admin" },
    select: { id: true },
  });

  try {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Log ind/i }).click();
    await page.waitForLoadState("networkidle");

    await page.goto("/internal");
    await expect(page.locator(".np-internal-shell")).toBeVisible();

    // TASK-11.6: internal admins accent-kicker skal vaere den graphite
    // .np-ops-accent-tone, ikke kundefladens blaa --primary.
    const kickerColor = await page
      .locator(".np-internal-shell .np-ops-accent")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    expect(kickerColor).toBe("rgb(51, 65, 85)");
  } finally {
    await db.user.delete({ where: { id: user.id } });
  }
});
