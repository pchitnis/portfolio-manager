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
  { params }: { params: { type: string; id: string } }
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
  const item = await model.findFirst({
    where: { id: params.id, userId },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
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

  // Verify ownership
  const existing = await model.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "userId" || key === "createdAt" || key === "updatedAt") continue;
    if (value === "") {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }

  const updated = await model.update({
    where: { id: params.id },
    data: cleaned,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
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

  // Verify ownership
  const existing = await model.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await model.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Deleted successfully" });
}
