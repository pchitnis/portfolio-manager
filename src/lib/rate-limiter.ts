interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {
    const interval = setInterval(() => this.cleanup(), 60_000);
    if (typeof interval === "object" && "unref" in interval) {
      interval.unref();
    }
  }

  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1, retryAfterMs: 0 };
    }

    if (entry.count < this.maxAttempts) {
      entry.count++;
      return { allowed: true, remaining: this.maxAttempts - entry.count, retryAfterMs: 0 };
    }

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  private cleanup() {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    });
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSecs = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many attempts. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSecs),
      },
    }
  );
}

// Pre-configured limiters for auth endpoints
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);       // 5 attempts / 15 min
export const registerLimiter = new RateLimiter(3, 60 * 60 * 1000);    // 3 attempts / 1 hour
export const forgotPasswordLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts / 1 hour
export const resetPasswordLimiter = new RateLimiter(5, 15 * 60 * 1000);  // 5 attempts / 15 min
