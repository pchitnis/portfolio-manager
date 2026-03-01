import { NextRequest, NextResponse } from "next/server";
import { getStockPrice } from "@/lib/yahoo-finance";

// Simple in-memory cache: key = "FROM_TO", value = { rate, fetchedAt }
const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from")?.toUpperCase();
  const to = request.nextUrl.searchParams.get("to")?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({ from, to, rate: 1 });
  }

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ from, to, rate: cached.rate, cached: true });
  }

  // Yahoo Finance forex ticker format: GBPINR=X
  const ticker = `${from}${to}=X`;
  const rate = await getStockPrice(ticker);

  if (rate === null) {
    return NextResponse.json({ error: `Could not fetch rate for ${from}/${to}` }, { status: 404 });
  }

  rateCache.set(cacheKey, { rate, fetchedAt: Date.now() });
  return NextResponse.json({ from, to, rate });
}
