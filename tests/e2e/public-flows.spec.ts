import { expect, test } from "@playwright/test";

test("landing -> pricing flow works", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Neutral/i })).toBeVisible();
  await page.getByRole("link", { name: /Se planer/i }).first().click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(page.getByRole("heading", { level: 1, name: /Vælg din plan/i })).toBeVisible();
});

test("register page renders signup fields", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel(/Navn/i)).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("login page shows oauth and credentials options", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Microsoft" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Log ind/i })).toBeVisible();
});
