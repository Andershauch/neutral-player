import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRateLimitBucketsForTests,
  buildRateLimitKey,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    __resetRateLimitBucketsForTests();
  });

  it("uses x-forwarded-for when available", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("blocks after max requests in same window", () => {
    const key = "test:ip:flow";
    expect(checkRateLimit({ key, max: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit({ key, max: 2, windowMs: 60_000 }).ok).toBe(true);
    const blocked = checkRateLimit({ key, max: 2, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("builds deterministic keys from prefix/ip/suffix", () => {
    const req = new Request("http://localhost/test", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(buildRateLimitKey("auth:register", req, "user@example.com")).toBe(
      "auth:register:9.9.9.9:user@example.com"
    );
  });
});
