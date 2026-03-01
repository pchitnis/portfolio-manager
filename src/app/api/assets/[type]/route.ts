import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const modelMap: Record<string, string> = {
  "bank-accounts": "bankAccount",
  "term-deposits": "termDeposit",
  stocks: "stock",
  metals: "metal",
  "real-estate": "realEstate",
  pension: "pension",
  loans: "loan",
  insurance: "insurance",
};

function getPrismaModel(type: string) {
  const modelName = modelMap[type];
  if (!modelName) return null;
  return (prisma as any)[modelName];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const model = getPrismaModel(params.type);
  if (!model) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const items = await model.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const model = getPrismaModel(params.type);
  if (!model) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();

  // Remove empty string values and convert to appropriate types
  const cleaned: Record<string, any> = { userId };
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "userId" || key === "createdAt" || key === "updatedAt") continue;
    if (value === "" || value === undefined) continue;
    cleaned[key] = value;
  }

  try {
    const item = await model.create({ data: cleaned });
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error("Prisma create error:", err);
    return NextResponse.json({ error: err.message ?? "Create failed" }, { status: 500 });
  }
}
