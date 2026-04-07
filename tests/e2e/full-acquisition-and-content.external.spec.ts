import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEST_PASSWORD = "Password123!";
const EXTERNAL_FLAG = "E2E_ENABLE_EXTERNAL_BILLING_UPLOAD";
const TEST_VIDEO_PATH = path.join(process.cwd(), "public/images/hero_video_test.mp4");
const STRIPE_CARD = {
  number: "4242424242424242",
  expiry: "1234",
  cvc: "123",
  postalCode: "2100",
  cardholderName: "External E2E",
};
const REQUIRED_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "MUX_TOKEN_ID",
  "MUX_TOKEN_SECRET",
  "NEXTAUTH_URL",
] as const;
const externalEnvMissing = REQUIRED_ENV_KEYS.filter((key) => !hasConfiguredEnv(key));
const externalEnabled = /^(1|true|yes)$/i.test(process.env[EXTERNAL_FLAG] ?? "");

test.describe("External SaaS flow (hosted checkout/upload/embed)", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!externalEnabled, `Set ${EXTERNAL_FLAG}=1 to run the external Stripe/Mux suite.`);
  test.skip(
    externalEnvMissing.length > 0,
    `Missing external E2E config for: ${externalEnvMissing.join(", ")}`
  );

  test("signup -> workspace -> hosted checkout -> mux upload -> embed", async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);

    const suffix = randomUUID().slice(0, 8);
    const email = `e2e-external-${suffix}@example.com`;
    const name = `External E2E ${suffix}`;
    const workspaceName = `External Workspace ${suffix}`;
    const projectName = `External Project ${suffix}`;
    const variantTitle = "External intro";

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

      await page.reload();
      await expect(page.getByText(/din email er bekr.*ftet/i)).toBeVisible();

      await page.getByPlaceholder(/neutral agency/i).fill(workspaceName);
      await Promise.all([
        page.waitForURL(/\/admin\/dashboard/, { timeout: 20_000 }),
        page.getByRole("button", { name: /dashboard/i }).click(),
      ]);

      await page.goto("/pricing");
      await Promise.all([
        page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 }),
        page.getByRole("button", { name: /vælg plan|vaelg plan|choose plan/i }).first().click(),
      ]);

      await completeStripeCheckout(page, email);
      await page.waitForURL(/\/admin\/dashboard\?billing=success/, { timeout: 120_000 });
      await expect(page.getByText(/tak for dit k.*b/i)).toBeVisible();

      await page.getByRole("button", { name: /nyt projekt/i }).click();
      await page.getByPlaceholder(/sommerkampagne/i).fill(projectName);
      await page.getByRole("button", { name: /opret og forts.*t/i }).click();
      await page.waitForURL(/\/admin\/embed\//, { timeout: 20_000 });

      const embed = await waitForEmbed(membership.organizationId, projectName);

      await page.getByPlaceholder(/dansk version/i).fill(variantTitle);
      await page.getByRole("button", { name: /opret version/i }).click();
      await expect(page.getByRole("heading", { name: new RegExp(variantTitle, "i") })).toBeVisible();

      const variant = await waitForVariant(membership.organizationId, embed.id, variantTitle);
      const upload = await createMuxUpload(page.request);
      await uploadVideoToMux(upload.url);
      const playbackId = await waitForMuxPlaybackId(page.request, upload.id);

      const attachResponse = await page.request.patch(`/api/variants/${variant.id}`, {
        data: { uploadId: upload.id },
      });
      expect(attachResponse.ok()).toBeTruthy();

      await expect
        .poll(async () => {
          const refreshed = await prisma.variant.findUnique({
            where: { id: variant.id },
            select: { muxPlaybackId: true },
          });
          return refreshed?.muxPlaybackId ?? null;
        }, {
          timeout: 60_000,
          intervals: [2_000, 3_000, 5_000],
        })
        .toBe(playbackId);

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

async function completeStripeCheckout(page: Page, email: string) {
  await fillVisibleInput(page, [
    'input[type="email"]',
    'input[name="email"]',
    'input[autocomplete="email"]',
  ], email).catch(() => undefined);

  await fillVisibleInput(page, [
    'input[name="cardholderName"]',
    'input[autocomplete="cc-name"]',
    'input[placeholder*="Full name on card"]',
  ], STRIPE_CARD.cardholderName).catch(() => undefined);

  await fillVisibleInputInAnyFrame(page, [
    'input[name="cardNumber"]',
    'input[name="cardnumber"]',
    'input[autocomplete="cc-number"]',
    'input[placeholder*="1234"]',
  ], STRIPE_CARD.number);

  await fillVisibleInputInAnyFrame(page, [
    'input[name="cardExpiry"]',
    'input[name="exp-date"]',
    'input[autocomplete="cc-exp"]',
    'input[placeholder*="MM"]',
  ], STRIPE_CARD.expiry);

  await fillVisibleInputInAnyFrame(page, [
    'input[name="cardCvc"]',
    'input[name="cvc"]',
    'input[autocomplete="cc-csc"]',
    'input[placeholder*="CVC"]',
  ], STRIPE_CARD.cvc);

  await fillVisibleInputInAnyFrame(page, [
    'input[name="billingPostalCode"]',
    'input[name="postalCode"]',
    'input[autocomplete="postal-code"]',
    'input[placeholder*="post"]',
  ], STRIPE_CARD.postalCode).catch(() => undefined);

  const submitButton = page
    .getByRole("button", { name: /betal|pay|subscribe|abonner|start trial|tilmeld/i })
    .first();
  await submitButton.click();
}

async function fillVisibleInput(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: "visible", timeout: 5_000 });
      await locator.fill(value);
      return;
    } catch {
      // Try the next selector.
    }
  }

  throw new Error(`Could not find a visible input for selectors: ${selectors.join(", ")}`);
}

async function fillVisibleInputInAnyFrame(page: Page, selectors: string[], value: string) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      for (const selector of selectors) {
        const locator = frame.locator(selector).first();
        try {
          await locator.waitFor({ state: "visible", timeout: 500 });
          await locator.fill(value);
          return;
        } catch {
          // Try the next selector or frame.
        }
      }
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Could not find a framed input for selectors: ${selectors.join(", ")}`);
}

async function createMuxUpload(request: APIRequestContext) {
  const response = await request.post("/api/uploads");
  expect(response.ok()).toBeTruthy();

  const data = (await response.json()) as { id: string; url: string };
  expect(data.id).toBeTruthy();
  expect(data.url).toBeTruthy();
  return data;
}

async function uploadVideoToMux(uploadUrl: string) {
  const video = fs.readFileSync(TEST_VIDEO_PATH);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
    },
    body: video,
  });

  if (!response.ok) {
    throw new Error(`Mux upload failed with status ${response.status}`);
  }
}

async function waitForMuxPlaybackId(request: APIRequestContext, uploadId: string) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await request.get(`/api/get-playback-id?uploadId=${uploadId}`);
    if (response.ok()) {
      const data = (await response.json()) as { playbackId?: string };
      if (data.playbackId) {
        return data.playbackId;
      }
    }

    await sleep(5_000);
  }

  throw new Error(`Timed out waiting for playback ID for upload ${uploadId}`);
}

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

function hasConfiguredEnv(key: string) {
  if (process.env[key]) return true;

  for (const envFile of [".env.local", ".env"]) {
    if (!fs.existsSync(envFile)) continue;
    const content = fs.readFileSync(envFile, "utf8");
    const regex = new RegExp(`^${key}=`, "m");
    if (regex.test(content)) {
      return true;
    }
  }

  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
