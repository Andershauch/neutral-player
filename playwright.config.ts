import fs from "node:fs";
import { defineConfig } from "@playwright/test";

const configuredBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXTAUTH_URL ??
  readLocalEnvValue("PLAYWRIGHT_BASE_URL") ??
  readLocalEnvValue("NEXTAUTH_URL");
const localBaseUrl =
  configuredBaseUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredBaseUrl)
    ? configuredBaseUrl
    : "http://127.0.0.1:3000";

function readLocalEnvValue(key: string) {
  for (const envFile of [".env.local", ".env"]) {
    if (!fs.existsSync(envFile)) continue;

    const content = fs.readFileSync(envFile, "utf8");
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    if (match?.[1]) {
      return match[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return null;
}

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: localBaseUrl,
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: localBaseUrl,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
