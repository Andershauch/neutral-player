import { describe, expect, it } from "vitest";
import { BILLING_PLANS, getBillingPlanByKey, resolvePlanKey, TRIAL_DAYS } from "@/lib/plans";

describe("plan resolution", () => {
  it("keeps legacy subscriptions working after the SPRINT-12 restructure", () => {
    // Live abonnementer kan stadig pege på de gamle nøgler.
    expect(resolvePlanKey("starter_monthly")).toBe("standard_monthly");
    expect(resolvePlanKey("pro_monthly")).toBe("standard_monthly");
    expect(resolvePlanKey("custom_monthly")).toBe("enterprise_monthly");
  });

  it("resolves current plan keys unchanged", () => {
    expect(resolvePlanKey("standard_monthly")).toBe("standard_monthly");
    expect(resolvePlanKey("kommune_monthly")).toBe("kommune_monthly");
  });

  it("rejects unknown and non-purchasable states", () => {
    expect(resolvePlanKey("trial")).toBeNull();
    expect(resolvePlanKey("expired")).toBeNull();
    expect(resolvePlanKey("noget_ukendt")).toBeNull();
  });

  it("maps a legacy key to a real plan definition", () => {
    expect(getBillingPlanByKey("pro_monthly")?.name).toBe("Standard");
  });

  it("only offers card checkout on plans that have a Stripe price", () => {
    for (const plan of BILLING_PLANS) {
      if (plan.checkoutEnabled) {
        expect(plan.stripePriceEnv).toBeTruthy();
        expect(plan.purchaseMode).toBe("checkout");
      }
    }
  });

  it("routes public-sector plans to invoicing rather than card checkout", () => {
    const kommune = getBillingPlanByKey("kommune_monthly");
    expect(kommune?.purchaseMode).toBe("invoice");
    expect(kommune?.checkoutEnabled).toBe(false);
  });

  it("runs a 10 day trial", () => {
    expect(TRIAL_DAYS).toBe(10);
  });
});
