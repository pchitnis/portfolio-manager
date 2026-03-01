import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/yahoo-finance", () => ({
  getStockPrice: vi.fn(),
}));

import { GET } from "@/app/api/forex/rate/route";
import { getStockPrice } from "@/lib/yahoo-finance";

describe("GET /api/forex/rate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when from or to is missing", async () => {
    const req = new NextRequest(new URL("http://localhost/api/forex/rate?from=USD"));
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns rate 1 when from equals to", async () => {
    const req = new NextRequest(new URL("http://localhost/api/forex/rate?from=USD&to=USD"));
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rate).toBe(1);
    expect(getStockPrice).not.toHaveBeenCalled();
  });

  it("fetches rate from Yahoo Finance", async () => {
    (getStockPrice as any).mockResolvedValue(83.5);
    const req = new NextRequest(new URL("http://localhost/api/forex/rate?from=USD&to=INR"));
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rate).toBe(83.5);
    expect(body.from).toBe("USD");
    expect(body.to).toBe("INR");
    expect(getStockPrice).toHaveBeenCalledWith("USDINR=X");
  });

  it("returns 404 when rate cannot be fetched", async () => {
    (getStockPrice as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/forex/rate?from=XYZ&to=ABC"));
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("uppercases currency codes", async () => {
    (getStockPrice as any).mockResolvedValue(1.1);
    const req = new NextRequest(new URL("http://localhost/api/forex/rate?from=usd&to=eur"));
    const res = await GET(req);
    const body = await res.json();
    expect(body.from).toBe("USD");
    expect(body.to).toBe("EUR");
  });
});
