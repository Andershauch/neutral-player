import { describe, expect, it } from "vitest";
import { getPlanLimits } from "@/lib/plan-limits";

describe("plan limits", () => {
  it("returns expected limits for free/starter/pro", () => {
    expect(getPlanLimits("free")).toEqual({ projects: 1, variants: 10, seats: 1 });
    expect(getPlanLimits("starter_monthly")).toEqual({ projects: 3, variants: 50, seats: 5 });
    expect(getPlanLimits("pro_monthly")).toEqual({ projects: null, variants: null, seats: 25 });
  });

  it("falls back to free limits for unknown plan", () => {
    expect(getPlanLimits("enterprise_unknown")).toEqual({ projects: 1, variants: 10, seats: 1 });
  });
});
