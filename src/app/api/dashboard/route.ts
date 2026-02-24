import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const [bankAccounts, termDeposits, stocks, metals, realEstates, pensions, loans, insurances] =
    await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.termDeposit.findMany({ where: { userId } }),
      prisma.stock.findMany({ where: { userId } }),
      prisma.metal.findMany({ where: { userId } }),
      prisma.realEstate.findMany({ where: { userId } }),
      prisma.pension.findMany({ where: { userId } }),
      prisma.loan.findMany({ where: { userId } }),
      prisma.insurance.findMany({ where: { userId } }),
    ]);

  const bankTotal = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const tdTotal = termDeposits.reduce((sum, a) => sum + (a.currentValue ?? a.amount), 0);
  const stockTotal = stocks.reduce((sum, a) => sum + (a.currentValue ?? a.buyPrice * a.quantity), 0);
  const metalTotal = metals.reduce((sum, a) => sum + (a.currentValue ?? a.buyingPrice * a.quantity), 0);
  const realEstateTotal = realEstates.reduce((sum, a) => sum + ((a.currentValue ?? a.purchasePrice) - a.mortgageAmount), 0);
  const pensionTotal = pensions.reduce((sum, a) => sum + a.currentValue, 0);
  const loanTotal = loans.reduce((sum, a) => sum + a.outstandingBalance, 0);
  const insuranceValue = insurances.reduce((sum, a) => sum + a.currentPayoutValue, 0);
  const lifeInsuranceCover = insurances
    .filter((i) => i.policyType === "Life")
    .reduce((sum, a) => sum + (a.sumAssured ?? 0), 0);

  const totalAssets = bankTotal + tdTotal + stockTotal + metalTotal + realEstateTotal + pensionTotal;
  const quickLiquid = bankTotal + tdTotal + stockTotal + metalTotal;
  const netAssetValue = totalAssets + insuranceValue - loanTotal;

  return NextResponse.json({
    netAssetValue,
    totalAssets,
    totalLiabilities: loanTotal,
    quickLiquidAssets: quickLiquid,
    lifeInsuranceCover,
    breakdown: {
      bankAccounts: bankTotal,
      termDeposits: tdTotal,
      stocks: stockTotal,
      metals: metalTotal,
      realEstate: realEstateTotal,
      pension: pensionTotal,
      loans: loanTotal,
      insuranceValue,
    },
  });
}
