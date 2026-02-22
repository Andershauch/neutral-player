import { NextResponse } from "next/server";

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  key: string;
  max: number;
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
  limit: number;
}

const buckets = new Map<string, RateLimitWindow>();

export function __resetRateLimitBucketsForTests() {
  buckets.clear();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function checkRateLimit(input: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(input.key);

  if (!current || current.resetAt <= now) {
    const next: RateLimitWindow = {
      count: 1,
      resetAt: now + input.windowMs,
    };
    buckets.set(input.key, next);
    return {
      ok: true,
      retryAfterSec: Math.ceil(input.windowMs / 1000),
      remaining: Math.max(0, input.max - 1),
      limit: input.max,
    };
  }

  if (current.count >= input.max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      remaining: 0,
      limit: input.max,
    };
  }

  current.count += 1;
  buckets.set(input.key, current);
  return {
    ok: true,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    remaining: Math.max(0, input.max - current.count),
    limit: input.max,
  };
}

export function buildRateLimitKey(prefix: string, req: Request, suffix?: string): string {
  const ip = getClientIp(req);
  return `${prefix}:${ip}:${suffix ?? "default"}`;
}

export function rateLimitExceededResponse(result: RateLimitResult) {
  const res = NextResponse.json(
    {
      error: "For mange forespørgsler. Prøv igen om lidt.",
      code: "RATE_LIMITED",
      retryAfterSec: result.retryAfterSec,
    },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(result.retryAfterSec));
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return res;
}
