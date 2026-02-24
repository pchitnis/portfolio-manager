import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const year = request.nextUrl.searchParams.get("year");
  const fiscalYear = year ? parseInt(year) : new Date().getFullYear();

  const entries = await prisma.cashFlowEntry.findMany({
    where: { userId, fiscalYear },
    orderBy: [{ type: "asc" }, { category: "asc" }],
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { entries, fiscalYear } = body;

  if (!entries || !fiscalYear) {
    return NextResponse.json({ error: "entries and fiscalYear are required" }, { status: 400 });
  }

  // Upsert all entries
  const results = [];
  for (const entry of entries) {
    const result = await prisma.cashFlowEntry.upsert({
      where: {
        userId_type_category_fiscalYear: {
          userId,
          type: entry.type,
          category: entry.category,
          fiscalYear,
        },
      },
      update: {
        apr: entry.apr || 0,
        may: entry.may || 0,
        jun: entry.jun || 0,
        jul: entry.jul || 0,
        aug: entry.aug || 0,
        sep: entry.sep || 0,
        oct: entry.oct || 0,
        nov: entry.nov || 0,
        dec: entry.dec || 0,
        jan: entry.jan || 0,
        feb: entry.feb || 0,
        mar: entry.mar || 0,
      },
      create: {
        userId,
        type: entry.type,
        category: entry.category,
        fiscalYear,
        apr: entry.apr || 0,
        may: entry.may || 0,
        jun: entry.jun || 0,
        jul: entry.jul || 0,
        aug: entry.aug || 0,
        sep: entry.sep || 0,
        oct: entry.oct || 0,
        nov: entry.nov || 0,
        dec: entry.dec || 0,
        jan: entry.jan || 0,
        feb: entry.feb || 0,
        mar: entry.mar || 0,
      },
    });
    results.push(result);
  }

  return NextResponse.json(results);
}
