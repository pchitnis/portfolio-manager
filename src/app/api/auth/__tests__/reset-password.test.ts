import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    user: { update: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn().mockImplementation((arr: any[]) => Promise.all(arr)),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_new_password"),
  },
}));

vi.mock("@/lib/rate-limiter", () => ({
  resetPasswordLimiter: { check: vi.fn().mockReturnValue({ allowed: true, remaining: 4, retryAfterMs: 0 }) },
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "Too many attempts." }), { status: 429 })
  ),
}));

import { POST } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/prisma";
import { resetPasswordLimiter, rateLimitResponse } from "@/lib/rate-limiter";

function makeRequest(body: any) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resetPasswordLimiter.check as any).mockReturnValue({ allowed: true, remaining: 4, retryAfterMs: 0 });
    (prisma.$transaction as any).mockResolvedValue([{}, {}]);
  });

  it("returns 400 when token is missing", async () => {
    const res = await POST(makeRequest({ password: "newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Token and password are required");
  });

  it("returns 400 when password is too short", async () => {
    const res = await POST(makeRequest({ token: "abc", password: "123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("at least 6 characters");
  });

  it("returns 400 when token is not found", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeRequest({ token: "invalid_token", password: "newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid or expired");
  });

  it("returns 400 when token is already used", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      id: "t1",
      token: "used_token",
      used: true,
      expiresAt: new Date(Date.now() + 3600_000),
      user: { id: "user1" },
    });
    const res = await POST(makeRequest({ token: "used_token", password: "newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already been used");
  });

  it("returns 400 when token is expired", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      id: "t1",
      token: "expired_token",
      used: false,
      expiresAt: new Date(Date.now() - 1000),
      userId: "user1",
      user: { id: "user1" },
    });
    const res = await POST(makeRequest({ token: "expired_token", password: "newpass123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("expired");
  });

  it("resets password successfully with valid token", async () => {
    (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
      id: "t1",
      token: "valid_token",
      used: false,
      expiresAt: new Date(Date.now() + 3600_000),
      userId: "user1",
      user: { id: "user1" },
    });
    (prisma.$transaction as any).mockResolvedValue([{}, {}]);

    const res = await POST(makeRequest({ token: "valid_token", password: "newpass123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Password reset successfully");
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    (resetPasswordLimiter.check as any).mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 15000 });

    const res = await POST(makeRequest({ token: "abc", password: "newpass123" }));
    expect(res.status).toBe(429);
    expect(rateLimitResponse).toHaveBeenCalled();
  });
});
