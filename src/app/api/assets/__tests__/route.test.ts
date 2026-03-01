import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    bankAccount: { findMany: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { GET, POST } from "@/app/api/assets/[type]/route";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

describe("GET /api/assets/[type]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const res = await GET(
      new NextRequest(new URL("http://localhost/api/assets/bank-accounts")),
      { params: { type: "bank-accounts" } }
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid asset type", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    const res = await GET(
      new NextRequest(new URL("http://localhost/api/assets/invalid")),
      { params: { type: "invalid" } }
    );
    expect(res.status).toBe(400);
  });

  it("returns assets for valid type", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findMany as any).mockResolvedValue([
      { id: "1", bankName: "Test Bank", currentBalance: 1000 },
    ]);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/assets/bank-accounts")),
      { params: { type: "bank-accounts" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].bankName).toBe("Test Bank");
  });
});

describe("POST /api/assets/[type]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName: "Test" }),
    });
    const res = await POST(req, { params: { type: "bank-accounts" } });
    expect(res.status).toBe(401);
  });

  it("returns 401 when user no longer exists in DB (stale JWT)", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "deleted-user" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName: "Test" }),
    });
    const res = await POST(req, { params: { type: "bank-accounts" } });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("session has expired");
  });

  it("strips reserved fields and empty strings", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user1" });
    (prisma.bankAccount.create as any).mockResolvedValue({ id: "new-item" });

    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "should-be-stripped",
        userId: "should-be-stripped",
        createdAt: "should-be-stripped",
        bankName: "Test Bank",
        accountNumber: "",
        currentBalance: 500,
      }),
    });
    const res = await POST(req, { params: { type: "bank-accounts" } });
    expect(res.status).toBe(201);

    const createCall = (prisma.bankAccount.create as any).mock.calls[0][0].data;
    expect(createCall.id).toBeUndefined();
    expect(createCall.createdAt).toBeUndefined();
    expect(createCall.accountNumber).toBeUndefined();
    expect(createCall.userId).toBe("user1");
    expect(createCall.bankName).toBe("Test Bank");
  });
});
