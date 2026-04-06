import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_PASSWORD = "Password123!";
const TEST_PLAYBACK_ID = "test-playback-id";

test.describe("Full SaaS flow (signup/checkout/upload/embed)", () => {
  test("signup -> workspace -> billing fixture -> project -> variant -> embed", async ({ page }) => {
    test.setTimeout(120_000);

    const suffix = randomUUID().slice(0, 8);
    const email = `e2e-acquisition-${suffix}@example.com`;
    const name = `E2E User ${suffix}`;
    const workspaceName = `E2E Workspace ${suffix}`;
    const projectName = `E2E Project ${suffix}`;
    const variantTitle = "Dansk intro";

    let userId: string | null = null;
    let organizationId: string | null = null;
    try {
      await page.goto("/register");
      await page.locator('input[name="name"]').fill(name);
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /opret (konto|bruger)/i }).click();

      await page.waitForURL(/\/setup\/workspace/, { timeout: 20_000 });

      const user = await waitForUserByEmail(email);
      userId = user.id;

      const membership = await waitForMembership(user.id);
      organizationId = membership.organizationId;

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      await prisma.subscription.create({
        data: {
          organizationId: membership.organizationId,
          plan: "starter_monthly",
          status: "active",
        },
      });

      await page.reload();
      await expect(page.getByText(/din email er bekr.*ftet/i)).toBeVisible();

      await page.getByPlaceholder(/neutral agency/i).fill(workspaceName);
      await Promise.all([
        page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 }),
        page.getByRole("button", { name: /dashboard/i }).click(),
      ]);

      await page.getByRole("button", { name: /nyt projekt/i }).click();
      await page.getByPlaceholder(/sommerkampagne/i).fill(projectName);
      await page.getByRole("button", { name: /opret og forts.*t/i }).click();
      await page.waitForURL(/\/admin\/embed\//, { timeout: 20_000 });

      const embed = await waitForEmbed(membership.organizationId, projectName);

      await page.getByPlaceholder(/dansk version/i).fill(variantTitle);
      await page.getByRole("button", { name: /opret version/i }).click();
      await expect(page.getByRole("heading", { name: new RegExp(variantTitle, "i") })).toBeVisible();

      const variant = await waitForVariant(membership.organizationId, embed.id, variantTitle);
      await prisma.variant.update({
        where: { id: variant.id },
        data: {
          muxPlaybackId: TEST_PLAYBACK_ID,
          muxAssetId: `asset-${suffix}`,
          muxUploadId: `upload-${suffix}`,
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          userId: membership.userId,
          userName: email,
          action: "ONBOARDING_VARIANT_UPLOADED",
          target: "Onboarding: Uploadede foerste video",
        },
      });

      await page.reload();
      await expect(page.getByText(/video klar/i)).toBeVisible();

      const textareas = page.locator("textarea");
      await expect(textareas.nth(1)).toHaveValue(new RegExp(`/embed/${embed.id}`));

      await page.goto(`/embed/${embed.id}`);
      await expect(page.locator("mux-player")).toBeVisible();
    } finally {
      if (organizationId) {
        await prisma.organization.delete({
          where: { id: organizationId },
        });
      }

      if (userId) {
        await prisma.user.delete({
          where: { id: userId },
        });
      }
    }
  });
});

async function waitForUserByEmail(email: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (user) return user;
    await sleep(250);
  }

  throw new Error(`Timed out waiting for user ${email}`);
}

async function waitForMembership(userId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const membership = await prisma.organizationUser.findUnique({
      where: { userId },
      select: { organizationId: true, userId: true },
    });
    if (membership) return membership;
    await sleep(250);
  }

  throw new Error(`Timed out waiting for organization membership for ${userId}`);
}

async function waitForEmbed(organizationId: string, name: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const embed = await prisma.embed.findFirst({
      where: {
        organizationId,
        name,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (embed) return embed;
    await sleep(250);
  }

  throw new Error(`Timed out waiting for embed ${name}`);
}

async function waitForVariant(organizationId: string, embedId: string, title: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const variant = await prisma.variant.findFirst({
      where: {
        organizationId,
        title,
        group: {
          embedId,
        },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (variant) return variant;
    await sleep(250);
  }

  throw new Error(`Timed out waiting for variant ${title}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
