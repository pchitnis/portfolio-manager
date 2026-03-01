import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/yahoo-finance", () => ({
  getStockPrice: vi.fn().mockResolvedValue(1),
}));

const emptyResult = { findMany: vi.fn().mockResolvedValue([]) };

vi.mock("@/lib/prisma", () => ({
  default: {
    bankAccount: { findMany: vi.fn().mockResolvedValue([]) },
    termDeposit: { findMany: vi.fn().mockResolvedValue([]) },
    stock: { findMany: vi.fn().mockResolvedValue([]) },
    metal: { findMany: vi.fn().mockResolvedValue([]) },
    realEstate: { findMany: vi.fn().mockResolvedValue([]) },
    pension: { findMany: vi.fn().mockResolvedValue([]) },
    loan: { findMany: vi.fn().mockResolvedValue([]) },
    insurance: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { GET } from "@/app/api/dashboard/route";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

describe("GET /api/dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/dashboard"));
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns zeroed dashboard when no assets exist", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });

    const req = new NextRequest(new URL("http://localhost/api/dashboard?currency=INR"));
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.netAssetValue).toBe(0);
    expect(body.totalAssets).toBe(0);
    expect(body.totalLiabilities).toBe(0);
    expect(body.quickLiquidAssets).toBe(0);
    expect(body.displayCurrency).toBe("INR");
  });

  it("aggregates bank account totals", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findMany as any).mockResolvedValue([
      { currentBalance: 5000, currency: "INR" },
      { currentBalance: 3000, currency: "INR" },
    ]);

    const req = new NextRequest(new URL("http://localhost/api/dashboard?currency=INR"));
    const res = await GET(req);
    const body = await res.json();

    expect(body.breakdown.bankAccounts).toBe(8000);
    expect(body.totalAssets).toBe(8000);
    expect(body.quickLiquidAssets).toBe(8000);
  });

  it("includes loan totals in liabilities", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.loan.findMany as any).mockResolvedValue([
      { outstandingBalance: 100000, loanType: "Mortgage", currency: "INR" },
      { outstandingBalance: 20000, loanType: "Car", currency: "INR" },
    ]);

    const req = new NextRequest(new URL("http://localhost/api/dashboard?currency=INR"));
    const res = await GET(req);
    const body = await res.json();

    expect(body.totalLiabilities).toBe(120000);
    expect(body.loansByType.Mortgage).toBe(100000);
    expect(body.loansByType.Car).toBe(20000);
  });

  it("calculates net asset value as totalAssets + insuranceValue - loans", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findMany as any).mockResolvedValue([
      { currentBalance: 50000, currency: "INR" },
    ]);
    (prisma.insurance.findMany as any).mockResolvedValue([
      { currentPayoutValue: 10000, sumAssured: 500000, policyType: "Life", insuredName: "John", currency: "INR" },
    ]);
    (prisma.loan.findMany as any).mockResolvedValue([
      { outstandingBalance: 20000, loanType: "Car", currency: "INR" },
    ]);

    const req = new NextRequest(new URL("http://localhost/api/dashboard?currency=INR"));
    const res = await GET(req);
    const body = await res.json();

    // netAssetValue = totalAssets(50000) + insuranceValue(10000) - loans(20000) = 40000
    expect(body.netAssetValue).toBe(40000);
    expect(body.lifeInsuranceCover).toBe(500000);
    expect(body.lifeInsuranceByPerson.John).toBe(500000);
  });
});
