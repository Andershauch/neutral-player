import { test } from "@playwright/test";

const hasFullE2EEnv =
  process.env.E2E_TEST_EMAIL &&
  process.env.E2E_TEST_PASSWORD &&
  process.env.E2E_BASE_URL;

test.describe("Full SaaS flow (signup/checkout/upload/embed)", () => {
  test.skip(!hasFullE2EEnv, "Kræver dedikeret E2E testkonto + eksterne service credentials.");

  test("signup -> checkout -> upload -> embed (placeholder for staged rollout)", async () => {
    // Denne test er bevidst markeret som staged.
    // Den aktiveres i et separat E2E-miljø med testkonto og Stripe/Mux fixtures.
  });
});
