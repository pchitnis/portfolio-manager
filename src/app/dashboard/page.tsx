"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { DashboardCard } from "@/components/dashboard-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { DashboardData } from "@/types";
import { PRIORITY_CURRENCIES, OTHER_CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import {
  Building2,
  Landmark,
  TrendingUp,
  CircleDollarSign,
  Home,
  Briefcase,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

const assetBreakdownItems = [
  { key: "bankAccounts", label: "Bank Accounts", icon: Building2, route: "/assets/bank-accounts" },
  { key: "termDeposits", label: "Term Deposits", icon: Landmark, route: "/assets/term-deposits" },
  { key: "stocks", label: "Stocks & Funds", icon: TrendingUp, route: "/assets/stocks" },
  { key: "metals", label: "Metals", icon: CircleDollarSign, route: "/assets/metals" },
  { key: "realEstate", label: "Real Estate", icon: Home, route: "/assets/real-estate" },
  { key: "pension", label: "Pension", icon: Briefcase, route: "/assets/pension" },
];

const liquidItems = ["bankAccounts", "termDeposits", "stocks", "metals"];
const LS_KEY = "dashboard_display_currency";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData & { displayCurrency?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [displayCurrency, setDisplayCurrency] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LS_KEY) || "INR";
    }
    return "INR";
  });

  const fetchDashboard = useCallback(async (currency: string) => {
    setConverting(true);
    try {
      const res = await fetch(`/api/dashboard?currency=${currency}`);
      const d = await res.json();
      setData(d);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setConverting(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchDashboard(displayCurrency);
  }, [status, router, fetchDashboard, displayCurrency]);

  const handleCurrencyChange = (currency: string) => {
    setDisplayCurrency(currency);
    localStorage.setItem(LS_KEY, currency);
    fetchDashboard(currency);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fmt = (amount: number) => {
    try { return formatCurrency(amount, displayCurrency); } catch { return `${getCurrencySymbol(displayCurrency)}${amount.toFixed(2)}`; }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header with currency selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {converting && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Display in</span>
              <Select
                value={displayCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-52"
              >
                <optgroup label="Popular">
                  {PRIORITY_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} – {c.name} ({c.symbol})</option>
                  ))}
                </optgroup>
                <optgroup label="Other Currencies">
                  {OTHER_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} – {c.name} ({c.symbol})</option>
                  ))}
                </optgroup>
              </Select>
            </div>
          </div>
        </div>

        {/* Top Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <DashboardCard
            title="My Net Asset Value"
            amount={data.netAssetValue}
            variant="positive"
            currency={displayCurrency}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Assets */}
          <DashboardCard
            title="Total Assets"
            amount={data.totalAssets}
            variant="positive"
            currency={displayCurrency}
            expandable
            expanded={expandedSections["assets"]}
            onToggle={() => toggleSection("assets")}
          >
            <div className="grid grid-cols-1 gap-2">
              {assetBreakdownItems.map((item) => {
                const Icon = item.icon;
                const amount = data.breakdown[item.key as keyof typeof data.breakdown];
                const pct = data.totalAssets > 0 ? (amount / data.totalAssets) * 100 : 0;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => router.push(item.route)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{fmt(amount)}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Liabilities */}
          <DashboardCard
            title="Liabilities"
            amount={data.totalLiabilities}
            variant="negative"
            currency={displayCurrency}
            expandable
            expanded={expandedSections["liabilities"]}
            onToggle={() => toggleSection("liabilities")}
          >
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(data.loansByType).map(([type, amount]) => {
                const pct = data.totalLiabilities > 0 ? (amount / data.totalLiabilities) * 100 : 0;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => router.push("/assets/loans")}
                  >
                    <span className="text-sm">{type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{fmt(amount)}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(data.loansByType).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No loans recorded</p>
              )}
            </div>
          </DashboardCard>

          {/* Highly Liquid Assets */}
          <DashboardCard
            title="Highly Liquid Asset"
            subtitle="Excludes real estate and pension"
            amount={data.quickLiquidAssets}
            variant="default"
            currency={displayCurrency}
            expandable
            expanded={expandedSections["liquid"]}
            onToggle={() => toggleSection("liquid")}
          >
            <div className="grid grid-cols-1 gap-2">
              {assetBreakdownItems
                .filter((i) => liquidItems.includes(i.key))
                .map((item) => {
                  const Icon = item.icon;
                  const amount = data.breakdown[item.key as keyof typeof data.breakdown];
                  const pct = data.quickLiquidAssets > 0 ? (amount / data.quickLiquidAssets) * 100 : 0;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => router.push(item.route)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{fmt(amount)}</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </DashboardCard>
        </div>

        {/* Combined Life Insurance Cover */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Life Insurance Cover"
          amount={data.lifeInsuranceCover}
          variant="info"
          currency={displayCurrency}
          expandable
          expanded={expandedSections["insurance"]}
          onToggle={() => toggleSection("insurance")}
        >
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(data.lifeInsuranceByPerson).map(([name, amount]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => router.push("/assets/insurance")}
              >
                <span className="text-sm">{name}</span>
                <span className="text-sm font-medium">{fmt(amount)}</span>
              </div>
            ))}
            {Object.keys(data.lifeInsuranceByPerson).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No life insurance policies recorded</p>
            )}
          </div>
        </DashboardCard>
        </div>

      </main>
    </div>
  );
}
