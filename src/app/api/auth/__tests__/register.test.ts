import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

vi.mock("@/lib/rate-limiter", () => ({
  registerLimiter: { check: vi.fn().mockReturnValue({ allowed: true, remaining: 2, retryAfterMs: 0 }) },
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "Too many attempts. Please try again later." }), { status: 429 })
  ),
}));

import { POST } from "@/app/api/auth/register/route";
import prisma from "@/lib/prisma";
import { registerLimiter, rateLimitResponse } from "@/lib/rate-limiter";

function makeRequest(body: any) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (registerLimiter.check as any).mockReturnValue({ allowed: true, remaining: 2, retryAfterMs: 0 });
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "123456" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Email and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await POST(makeRequest({ email: "test@test.com", password: "123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("at least 6 characters");
  });

  it("returns 409 when email already exists", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "existing" });
    const res = await POST(makeRequest({ email: "existing@test.com", password: "123456" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already registered");
  });

  it("returns 201 on successful registration", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({ id: "new-user" });

    const res = await POST(makeRequest({
      email: "new@test.com",
      password: "password123",
      country: "IN",
      currency: "INR",
    }));
    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "new@test.com",
        password: "hashed_password",
        country: "IN",
        currency: "INR",
      }),
    });
  });

  it("returns 429 when rate limited", async () => {
    (registerLimiter.check as any).mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30000 });

    const res = await POST(makeRequest({ email: "test@test.com", password: "123456" }));
    expect(res.status).toBe(429);
    expect(rateLimitResponse).toHaveBeenCalled();
  });
});
