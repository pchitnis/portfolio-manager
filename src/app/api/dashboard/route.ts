import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStockPrice } from "@/lib/yahoo-finance";

// Simple in-memory forex rate cache (5-minute TTL)
const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
async function getForexRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const key = `${from}_${to}`;
  const cached = rateCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return cached.rate;
  const rate = await getStockPrice(`${from}${to}=X`);
  if (rate) rateCache.set(key, { rate, fetchedAt: Date.now() });
  return rate ?? 1;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const displayCurrency = request.nextUrl.searchParams.get("currency") || "INR";

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

  // Collect all unique source currencies that differ from display currency
  const allCurrencies = [
    ...bankAccounts.map((a) => a.currency || "INR"),
    ...termDeposits.map((a) => a.currency || "INR"),
    ...stocks.map((a) => a.currency || "INR"),
    ...metals.map((a) => a.currency || "INR"),
    ...realEstates.map((a) => a.currency || "INR"),
    ...pensions.map((a) => a.currency || "INR"),
    ...loans.map((a) => a.currency || "INR"),
    ...insurances.map((a) => a.currency || "INR"),
  ];
  const uniqueCurrencies = Array.from(new Set(allCurrencies)).filter((c) => c !== displayCurrency);

  // Fetch all needed forex rates in parallel
  const rateEntries = await Promise.all(
    uniqueCurrencies.map(async (from) => [from, await getForexRate(from, displayCurrency)] as [string, number])
  );
  const rates: Record<string, number> = { [displayCurrency]: 1 };
  rateEntries.forEach(([from, rate]) => { rates[from] = rate; });

  const conv = (value: number, currency: string) => value * (rates[currency || displayCurrency] ?? 1);

  const bankTotal = bankAccounts.reduce((sum, a) => sum + conv(a.currentBalance, a.currency || "INR"), 0);
  const tdTotal = termDeposits.reduce((sum, a) => sum + conv(a.currentValue ?? a.amount, a.currency || "INR"), 0);
  const stockTotal = stocks.reduce((sum, a) => sum + conv(a.currentValue ?? a.buyPrice * a.quantity, a.currency || "INR"), 0);
  const metalTotal = metals.reduce((sum, a) => sum + conv(a.currentValue ?? a.buyingPrice * a.quantity, a.currency || "INR"), 0);
  const realEstateTotal = realEstates.reduce((sum, a) => sum + conv(a.currentValue ?? a.purchasePrice, a.currency || "INR"), 0);
  const pensionTotal = pensions.reduce((sum, a) => sum + conv(a.currentValue, a.currency || "INR"), 0);
  const loanTotal = loans.reduce((sum, a) => sum + conv(a.outstandingBalance, a.currency || "INR"), 0);
  const loanTypes = ["Mortgage", "Car", "Credit card", "Retail", "Other"];
  const loansByType: Record<string, number> = {};
  for (const type of loanTypes) {
    const total = loans
      .filter((a) => a.loanType === type)
      .reduce((sum, a) => sum + conv(a.outstandingBalance, a.currency || "INR"), 0);
    if (total > 0) loansByType[type] = total;
  }
  const insuranceValue = insurances.reduce((sum, a) => sum + conv(a.currentPayoutValue, a.currency || "INR"), 0);
  const lifeInsurances = insurances.filter((i) => i.policyType === "Life");
  const lifeInsuranceCover = lifeInsurances.reduce((sum, a) => sum + conv(a.sumAssured ?? 0, a.currency || "INR"), 0);
  const lifeInsuranceByPerson: Record<string, number> = {};
  for (const policy of lifeInsurances) {
    const name = policy.insuredName;
    lifeInsuranceByPerson[name] = (lifeInsuranceByPerson[name] ?? 0) + conv(policy.sumAssured ?? 0, policy.currency || "INR");
  }

  const totalAssets = bankTotal + tdTotal + stockTotal + metalTotal + realEstateTotal + pensionTotal;
  const quickLiquid = bankTotal + tdTotal + stockTotal + metalTotal;
  const netAssetValue = totalAssets + insuranceValue - loanTotal;

  return NextResponse.json({
    netAssetValue,
    totalAssets,
    totalLiabilities: loanTotal,
    quickLiquidAssets: quickLiquid,
    lifeInsuranceCover,
    lifeInsuranceByPerson,
    loansByType,
    displayCurrency,
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
