"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { DashboardCard } from "@/components/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { DashboardData } from "@/types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Building2,
  Landmark,
  TrendingUp,
  CircleDollarSign,
  Home,
  Briefcase,
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const monthKeys = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"];
const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch(`/api/cashflow?year=${new Date().getFullYear()}`).then((r) => r.json()),
      ])
        .then(([d, cf]) => {
          setData(d);
          setCashflowData(Array.isArray(cf) ? cf : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <DashboardCard
            title="My Net Asset Value"
            amount={data.netAssetValue}
            variant="positive"
          />
          <DashboardCard
            title="Combined Life Insurance Cover"
            amount={data.lifeInsuranceCover}
            variant="info"
            expandable
            expanded={expandedSections["insurance"]}
            onToggle={() => toggleSection("insurance")}
          >
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push("/assets/insurance")}
            >
              View All Policies
            </Button>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Assets */}
          <DashboardCard
            title="Total Assets"
            amount={data.totalAssets}
            variant="positive"
            expandable
            expanded={expandedSections["assets"]}
            onToggle={() => toggleSection("assets")}
          >
            <div className="grid grid-cols-1 gap-2">
              {assetBreakdownItems.map((item) => {
                const Icon = item.icon;
                const amount = data.breakdown[item.key as keyof typeof data.breakdown];
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
                    <span className="text-sm font-medium">{formatCurrency(amount)}</span>
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
            expandable
            expanded={expandedSections["liabilities"]}
            onToggle={() => toggleSection("liabilities")}
          >
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push("/assets/loans")}
            >
              View All Loans
            </Button>
          </DashboardCard>

          {/* Quick Liquid Assets */}
          <DashboardCard
            title="Quick Liquid Assets"
            amount={data.quickLiquidAssets}
            variant="default"
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
                      <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                    </div>
                  );
                })}
            </div>
          </DashboardCard>
        </div>

        {/* Asset Allocation Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const pieData = assetBreakdownItems
                  .map((item) => ({
                    name: item.label,
                    value: data.breakdown[item.key as keyof typeof data.breakdown],
                  }))
                  .filter((d) => d.value > 0);
                if (pieData.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-8">No assets to display</p>;
                }
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>

          {/* Cash Flow Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Inflow vs Outflow</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const inflows = cashflowData.filter((e) => e.type === "inflow");
                const outflows = cashflowData.filter((e) => e.type === "outflow");
                const chartData = monthLabels.map((label, idx) => {
                  const key = monthKeys[idx];
                  const inflowTotal = inflows.reduce((sum: number, e: any) => sum + (e[key] || 0), 0);
                  const outflowTotal = outflows.reduce((sum: number, e: any) => sum + (e[key] || 0), 0);
                  return { month: label, Inflow: inflowTotal, Outflow: outflowTotal };
                });
                const hasData = chartData.some((d) => d.Inflow > 0 || d.Outflow > 0);
                if (!hasData) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-2">No cash flow data yet</p>
                      <Button variant="outline" size="sm" onClick={() => router.push("/cashflow")}>
                        Set up Cash Flow
                      </Button>
                    </div>
                  );
                }
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Inflow" fill="#10b981" />
                      <Bar dataKey="Outflow" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Net Cash Flow Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Net Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const inflows = cashflowData.filter((e) => e.type === "inflow");
              const outflows = cashflowData.filter((e) => e.type === "outflow");
              const chartData = monthLabels.map((label, idx) => {
                const key = monthKeys[idx];
                const inflowTotal = inflows.reduce((sum: number, e: any) => sum + (e[key] || 0), 0);
                const outflowTotal = outflows.reduce((sum: number, e: any) => sum + (e[key] || 0), 0);
                return { month: label, "Net Cash Flow": inflowTotal - outflowTotal };
              });
              const hasData = chartData.some((d) => d["Net Cash Flow"] !== 0);
              if (!hasData) {
                return <p className="text-sm text-muted-foreground text-center py-8">No cash flow data yet</p>;
              }
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Net Cash Flow" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>

        {/* Spending Analysis Pie */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Annual Spending Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const outflows = cashflowData.filter((e) => e.type === "outflow");
              const categoryTotals = outflows.map((e) => ({
                name: e.category,
                value: monthKeys.reduce((sum: number, k: string) => sum + (e[k] || 0), 0),
              })).filter((d) => d.value > 0);
              if (categoryTotals.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-8">No spending data yet</p>;
              }
              return (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={categoryTotals} cx="50%" cy="50%" outerRadius={140} dataKey="value" label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}>
                      {categoryTotals.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => Number(value).toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
