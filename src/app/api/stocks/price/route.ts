import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStockPrice } from "@/lib/yahoo-finance";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const price = await getStockPrice(symbol);
  if (price === null) {
    return NextResponse.json({ error: "Could not fetch price" }, { status: 404 });
  }

  return NextResponse.json({ symbol, price });
}
