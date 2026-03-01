import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/yahoo-finance", () => ({
  getStockPrice: vi.fn(),
}));

import { GET } from "@/app/api/stocks/price/route";
import { getServerSession } from "next-auth";
import { getStockPrice } from "@/lib/yahoo-finance";

describe("GET /api/stocks/price", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/stocks/price?symbol=AAPL"));
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when symbol is missing", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    const req = new NextRequest(new URL("http://localhost/api/stocks/price"));
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns price on success", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (getStockPrice as any).mockResolvedValue(150.25);

    const req = new NextRequest(new URL("http://localhost/api/stocks/price?symbol=AAPL"));
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe("AAPL");
    expect(body.price).toBe(150.25);
  });

  it("returns 404 when price cannot be fetched", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (getStockPrice as any).mockResolvedValue(null);

    const req = new NextRequest(new URL("http://localhost/api/stocks/price?symbol=INVALID"));
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
