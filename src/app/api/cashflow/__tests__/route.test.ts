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
    cashFlowEntry: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { GET, POST } from "@/app/api/cashflow/route";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

describe("GET /api/cashflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/cashflow?year=2026"));
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns entries for fiscal year", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.cashFlowEntry.findMany as any).mockResolvedValue([
      { type: "inflow", category: "Salary", apr: 5000 },
    ]);

    const req = new NextRequest(new URL("http://localhost/api/cashflow?year=2026"));
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(prisma.cashFlowEntry.findMany).toHaveBeenCalledWith({
      where: { userId: "user1", fiscalYear: 2026 },
      orderBy: [{ type: "asc" }, { category: "asc" }],
    });
  });

  it("defaults to current year when no year param", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.cashFlowEntry.findMany as any).mockResolvedValue([]);

    const req = new NextRequest(new URL("http://localhost/api/cashflow"));
    await GET(req);

    const calledYear = (prisma.cashFlowEntry.findMany as any).mock.calls[0][0].where.fiscalYear;
    expect(calledYear).toBe(new Date().getFullYear());
  });
});

describe("POST /api/cashflow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/cashflow"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: [], fiscalYear: 2026 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when user no longer exists (stale JWT)", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "deleted" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/cashflow"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: [], fiscalYear: 2026 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when entries or fiscalYear missing", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user1" });

    const req = new NextRequest(new URL("http://localhost/api/cashflow"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("uses transaction to delete removed rows and upsert remaining", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user1" });
    (prisma.$transaction as any).mockImplementation(async (fn: any) => {
      return fn({
        cashFlowEntry: {
          findMany: vi.fn().mockResolvedValue([
            { id: "e1", type: "inflow", category: "Salary" },
            { id: "e2", type: "inflow", category: "Bonus" },
          ]),
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          upsert: vi.fn().mockResolvedValue({ id: "e1" }),
        },
      });
    });

    const req = new NextRequest(new URL("http://localhost/api/cashflow"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiscalYear: 2026,
        entries: [
          { type: "inflow", category: "Salary", apr: 5000, may: 5000, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0 },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
