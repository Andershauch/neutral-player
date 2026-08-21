import { describe, expect, it } from "vitest";
import { getPlanLimits } from "@/lib/plan-limits";

describe("plan limits", () => {
  it("limits the resources Mux actually bills for", () => {
    const standard = getPlanLimits("standard_monthly");
    expect(standard.storageMinutes).toBe(1_000);
    expect(standard.deliveryMinutesPerMonth).toBe(50_000);
    expect(standard.seats).toBe(10);

    const kommune = getPlanLimits("kommune_monthly");
    expect(kommune.storageMinutes).toBe(5_000);
    expect(kommune.deliveryMinutesPerMonth).toBe(250_000);
    expect(kommune.seats).toBeNull();
  });

  it("leaves enterprise uncapped so volume can follow the agreement", () => {
    expect(getPlanLimits("enterprise_monthly")).toEqual({
      projects: null,
      variants: null,
      seats: null,
      storageMinutes: null,
      deliveryMinutesPerMonth: null,
    });
  });

  it("gives the trial room to test without carrying real volume", () => {
    const trial = getPlanLimits("trial");
    expect(trial.storageMinutes).toBe(60);
    expect(trial.projects).toBe(3);
  });

  it("locks everything down once the trial has expired", () => {
    const expired = getPlanLimits("expired");
    expect(expired.storageMinutes).toBe(0);
    expect(expired.deliveryMinutesPerMonth).toBe(0);
    expect(expired.projects).toBe(0);
  });

  it("falls back to trial limits for an unknown plan", () => {
    expect(getPlanLimits("noget_ukendt")).toEqual(getPlanLimits("trial"));
  });
});
