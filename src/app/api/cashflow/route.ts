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

  // Verify user exists in DB (catches stale JWT after DB migrations)
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign out and sign in again." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { entries, fiscalYear } = body;

  if (!entries || !fiscalYear) {
    return NextResponse.json({ error: "entries and fiscalYear are required" }, { status: 400 });
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      // Delete rows that the user removed (present in DB but not in submitted payload)
      const submittedKeys = new Set(
        entries.map((e: any) => `${e.type}|${e.category}`)
      );
      const existing = await tx.cashFlowEntry.findMany({
        where: { userId, fiscalYear },
        select: { id: true, type: true, category: true },
      });
      const toDelete = existing
        .filter((e) => !submittedKeys.has(`${e.type}|${e.category}`))
        .map((e) => e.id);
      if (toDelete.length > 0) {
        await tx.cashFlowEntry.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Upsert remaining/updated entries
      const upserted = [];
      for (const entry of entries) {
        const result = await tx.cashFlowEntry.upsert({
          where: {
            userId_type_category_fiscalYear: {
              userId,
              type: entry.type,
              category: entry.category,
              fiscalYear,
            },
          },
          update: {
            categoryType: entry.categoryType || null,
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
            categoryType: entry.categoryType || null,
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
        upserted.push(result);
      }
      return upserted;
    });

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Cashflow save error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to save" }, { status: 500 });
  }
}
