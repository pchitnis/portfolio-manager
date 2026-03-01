import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to maxAttempts", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(false);
  });

  it("tracks remaining attempts correctly", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("ip1").remaining).toBe(2);
    expect(limiter.check("ip1").remaining).toBe(1);
    expect(limiter.check("ip1").remaining).toBe(0);
  });

  it("returns retryAfterMs when blocked", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.check("ip1"); // use the one allowed
    const result = limiter.check("ip1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it("resets after window expires", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);
    expect(limiter.check("ip2").allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("uses x-real-ip as fallback", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("trims whitespace from forwarded IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "  10.0.0.1  , 10.0.0.2" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 status", async () => {
    const res = rateLimitResponse(30_000);
    expect(res.status).toBe(429);
  });

  it("sets Retry-After header in seconds", async () => {
    const res = rateLimitResponse(30_000);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("rounds up Retry-After to nearest second", async () => {
    const res = rateLimitResponse(1_500);
    expect(res.headers.get("Retry-After")).toBe("2");
  });

  it("returns JSON error message", async () => {
    const res = rateLimitResponse(5_000);
    const body = await res.json();
    expect(body.error).toBe("Too many attempts. Please try again later.");
  });
});
