import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { updateMany: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limiter", () => ({
  forgotPasswordLimiter: { check: vi.fn().mockReturnValue({ allowed: true, remaining: 2, retryAfterMs: 0 }) },
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "Too many attempts." }), { status: 429 })
  ),
}));

import { POST } from "@/app/api/auth/forgot-password/route";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordLimiter, rateLimitResponse } from "@/lib/rate-limiter";

function makeRequest(body: any) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (forgotPasswordLimiter.check as any).mockReturnValue({ allowed: true, remaining: 2, retryAfterMs: 0 });
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns success even when email does not exist (prevents enumeration)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "nonexistent@test.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("If that email is registered");
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends reset email when user exists", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user1", email: "user@test.com" });
    (prisma.passwordResetToken.updateMany as any).mockResolvedValue({ count: 0 });
    (prisma.passwordResetToken.create as any).mockResolvedValue({ id: "token1" });

    const res = await POST(makeRequest({ email: "user@test.com" }));
    expect(res.status).toBe(200);
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@test.com",
      expect.stringContaining("reset-password?token=")
    );
  });

  it("invalidates existing unused tokens before creating new one", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user1", email: "user@test.com" });
    (prisma.passwordResetToken.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.passwordResetToken.create as any).mockResolvedValue({ id: "token1" });

    await POST(makeRequest({ email: "user@test.com" }));
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user1", used: false },
      data: { used: true },
    });
  });

  it("returns 429 when rate limited", async () => {
    (forgotPasswordLimiter.check as any).mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 60000 });

    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(res.status).toBe(429);
    expect(rateLimitResponse).toHaveBeenCalled();
  });
});
