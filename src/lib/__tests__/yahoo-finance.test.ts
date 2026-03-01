import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStockPrice } from "@/lib/yahoo-finance";

describe("getStockPrice", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns price on successful response", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { regularMarketPrice: 150.25 } }],
        },
      }),
    });

    const price = await getStockPrice("AAPL");
    expect(price).toBe(150.25);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("returns null when response is not ok", async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });

    const price = await getStockPrice("INVALID");
    expect(price).toBeNull();
  });

  it("returns null when data structure is unexpected", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ chart: { result: [] } }),
    });

    const price = await getStockPrice("AAPL");
    expect(price).toBeNull();
  });

  it("returns null on fetch error", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const price = await getStockPrice("AAPL");
    expect(price).toBeNull();
  });

  it("encodes symbol in URL", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: { result: [{ meta: { regularMarketPrice: 10 } }] },
      }),
    });

    await getStockPrice("BTC-USD");
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain("BTC-USD");
  });
});
