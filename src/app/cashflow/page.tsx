"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import {
  PieChart, Pie, Cell, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Line, ComposedChart,
} from "recharts";

const months = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"];
const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const INFLOW_CATEGORY_OPTIONS = [
  "Salary",
  "Rental income",
  "Return on investment",
  "Maturity of investment",
  "Other income",
];

const OUTFLOW_CATEGORY_OPTIONS = [
  "Home loan",
  "Rent",
  "Loan repayment",
  "Bills",
  "Education",
  "Shopping",
  "Food and other essential",
  "Medical",
  "Insurance",
  "Other",
];

const defaultInflowCategories = [
  "Person 1 income",
  "Person 2 income",
  "Person 1 bonus",
  "Person 2 bonus",
  "Interest payment",
  "Rental income",
  "Maturity amount",
  "Other income 1",
  "Other income 2",
];

const defaultOutflowCategories = [
  "Home 1 EMI",
  "Home 2 EMI",
  "Property taxes",
  "Internet",
  "Mobile",
  "TV license",
  "Water bill",
  "Energy",
  "Fuel",
  "Subscription 1",
  "Insurance premium 1",
  "Insurance premium 2",
  "Other insurance",
  "Kids Education",
  "Own education",
  "Retail loan EMI",
  "Friends & Family",
  "Travel",
  "Tourism",
  "Misc",
  "Shopping",
  "Additional 1",
  "Additional 2",
];

interface CashFlowRow {
  type: "inflow" | "outflow";
  category: string;
  categoryType?: string;
  [key: string]: any;
}

export default function CashFlowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [inflowRows, setInflowRows] = useState<CashFlowRow[]>([]);
  const [outflowRows, setOutflowRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);

  const initializeDefaults = useCallback(() => {
    const makeRow = (type: "inflow" | "outflow", category: string): CashFlowRow => {
      const row: CashFlowRow = { type, category, categoryType: "" };
      months.forEach((m) => (row[m] = 0));
      return row;
    };
    setInflowRows(defaultInflowCategories.map((c) => makeRow("inflow", c)));
    setOutflowRows(defaultOutflowCategories.map((c) => makeRow("outflow", c)));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/cashflow?year=${fiscalYear}`);
      if (res.ok) {
        const entries = await res.json();
        if (entries.length === 0) {
          initializeDefaults();
        } else {
          const inflows = entries.filter((e: any) => e.type === "inflow");
          const outflows = entries.filter((e: any) => e.type === "outflow");

          const inflowCats = new Set(inflows.map((e: any) => e.category));
          const outflowCats = new Set(outflows.map((e: any) => e.category));

          const allInflows = [...inflows];
          defaultInflowCategories.forEach((c) => {
            if (!inflowCats.has(c)) {
              const row: any = { type: "inflow", category: c };
              months.forEach((m) => (row[m] = 0));
              allInflows.push(row);
            }
          });

          const allOutflows = [...outflows];
          defaultOutflowCategories.forEach((c) => {
            if (!outflowCats.has(c)) {
              const row: any = { type: "outflow", category: c };
              months.forEach((m) => (row[m] = 0));
              allOutflows.push(row);
            }
          });

          setInflowRows(allInflows);
          setOutflowRows(allOutflows);
        }
      }
    } catch {
      initializeDefaults();
    } finally {
      setLoading(false);
    }
  }, [fiscalYear, initializeDefaults]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchData();
  }, [status, router, fetchData]);

  const updateCell = (
    rows: CashFlowRow[],
    setRows: React.Dispatch<React.SetStateAction<CashFlowRow[]>>,
    idx: number,
    month: string,
    value: string
  ) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [month]: parseFloat(value) || 0 };
    setRows(updated);
  };

  const addRow = (type: "inflow" | "outflow") => {
    const row: CashFlowRow = { type, category: `New ${type} item`, categoryType: "" };
    months.forEach((m) => (row[m] = 0));
    if (type === "inflow") {
      setInflowRows((prev) => [...prev, row]);
    } else {
      setOutflowRows((prev) => [...prev, row]);
    }
  };

  const removeRow = (type: "inflow" | "outflow", idx: number) => {
    if (type === "inflow") {
      setInflowRows((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setOutflowRows((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const renameCategory = (
    rows: CashFlowRow[],
    setRows: React.Dispatch<React.SetStateAction<CashFlowRow[]>>,
    idx: number,
    name: string
  ) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], category: name };
    setRows(updated);
  };

  const getRowTotal = (row: CashFlowRow) => {
    return months.reduce((sum, m) => sum + (parseFloat(row[m]) || 0), 0);
  };

  const getColumnTotal = (rows: CashFlowRow[], month: string) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row[month]) || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allEntries = [...inflowRows, ...outflowRows].map((row) => ({
        type: row.type,
        category: row.category,
        categoryType: row.categoryType || null,
        apr: row.apr || 0,
        may: row.may || 0,
        jun: row.jun || 0,
        jul: row.jul || 0,
        aug: row.aug || 0,
        sep: row.sep || 0,
        oct: row.oct || 0,
        nov: row.nov || 0,
        dec: row.dec || 0,
        jan: row.jan || 0,
        feb: row.feb || 0,
        mar: row.mar || 0,
      }));

      const res = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: allEntries, fiscalYear }),
      });

      if (res.ok) {
        toast("Cash flow saved successfully");
      } else {
        toast("Failed to save", "error");
      }
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderTable = (
    title: string,
    rows: CashFlowRow[],
    setRows: React.Dispatch<React.SetStateAction<CashFlowRow[]>>,
    type: "inflow" | "outflow",
    categoryOptions: string[] = [],
    emptyLabel = "-- Select --"
  ) => {
    const showCategory = categoryOptions.length > 0;
    return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button variant="outline" size="sm" onClick={() => addRow(type)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col className="w-[150px]" />
            {showCategory && <col className="w-[160px]" />}
            {months.map((m) => <col key={m} className="w-[72px]" />)}
            <col className="w-[80px]" />
            <col className="w-[36px]" />
          </colgroup>
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left sticky left-0 bg-muted/50">Particulars</th>
              {showCategory && <th className="border p-2 text-left">Category</th>}
              {monthLabels.map((m) => (
                <th key={m} className="border p-2 text-center">{m}</th>
              ))}
              <th className="border p-2 text-center font-bold">Total</th>
              <th className="border p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/20">
                <td className="border p-1 sticky left-0 bg-white">
                  <input
                    type="text"
                    value={row.category}
                    onChange={(e) => renameCategory(rows, setRows, idx, e.target.value)}
                    className="w-full px-1 py-0.5 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded"
                  />
                </td>
                {showCategory && (
                  <td className="border p-1">
                    <select
                      value={row.categoryType || ""}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[idx] = { ...updated[idx], categoryType: e.target.value };
                        setRows(updated);
                      }}
                      className="w-full px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      <option value="">{emptyLabel}</option>
                      {categoryOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                )}
                {months.map((m) => (
                  <td key={m} className="border p-1">
                    <input
                      type="number"
                      value={row[m] || ""}
                      onChange={(e) => updateCell(rows, setRows, idx, m, e.target.value)}
                      className="w-full px-1 py-0.5 text-sm text-right border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded"
                      placeholder="0"
                    />
                  </td>
                ))}
                <td className="border p-2 text-right font-medium bg-muted/30 text-xs">
                  {getRowTotal(row).toLocaleString()}
                </td>
                <td className="border p-1 text-center">
                  <button
                    onClick={() => removeRow(type, idx)}
                    className="text-red-400 hover:text-red-600"
                    title="Remove row"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-muted/50 font-bold">
              <td className="border p-2 sticky left-0 bg-muted/50">Total {title}</td>
              {showCategory && <td className="border p-2"></td>}
              {months.map((m) => (
                <td key={m} className="border p-2 text-center">
                  {getColumnTotal(rows, m).toLocaleString()}
                </td>
              ))}
              <td className="border p-2 text-center">
                {rows.reduce((sum, row) => sum + getRowTotal(row), 0).toLocaleString()}
              </td>
              <td className="border p-1"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  const netCashFlow = months.map((m) => getColumnTotal(inflowRows, m) - getColumnTotal(outflowRows, m));

  // Chart data derived from rows
  const cashflowChartData = monthLabels.map((label, idx) => {
    const inflow = getColumnTotal(inflowRows, months[idx]);
    const outflow = getColumnTotal(outflowRows, months[idx]);
    return { month: label, Inflow: inflow, Outflow: outflow, "Net Cash Flow": inflow - outflow };
  });
  const hasCashflowData = cashflowChartData.some((d) => d.Inflow > 0 || d.Outflow > 0);

  const spendingData = (() => {
    const grouped: Record<string, number> = {};
    outflowRows.forEach((row) => {
      const key = row.categoryType || "Other";
      const value = months.reduce((sum, m) => sum + (parseFloat(row[m]) || 0), 0);
      grouped[key] = (grouped[key] || 0) + value;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  })();

  const incomeData = (() => {
    const grouped: Record<string, number> = {};
    inflowRows.forEach((row) => {
      const key = row.categoryType || "Other income";
      const value = months.reduce((sum, m) => sum + (parseFloat(row[m]) || 0), 0);
      grouped[key] = (grouped[key] || 0) + value;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  })();

  const pieLegendFormatter = (value: string, entry: any) => {
    const pct = entry?.payload?.percent;
    return (
      <span style={{ fontSize: 10 }}>
        {value}{pct != null ? ` ${(pct * 100).toFixed(0)}%` : ""}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-4 py-8">

        {/* Header + Collapsible Statement */}
        <div className="mb-6">
          {/* Clickable header bar */}
          <button
            className="w-full flex items-center justify-between bg-white border rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
            onClick={() => setStatementOpen((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); router.back(); }}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold group-hover:text-primary transition-colors">
                Cash Flow Statement
              </h1>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                FY {fiscalYear}
              </span>
              {!statementOpen && (
                <span className="text-xs text-muted-foreground italic">Click to expand</span>
              )}
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Select
                value={String(fiscalYear)}
                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                className="w-32"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>FY {y}</option>
                ))}
              </Select>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
              {statementOpen
                ? <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                : <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              }
            </div>
          </button>

          {/* Collapsible table body */}
          {statementOpen && (
            <Card className="p-4 mt-2 rounded-t-none border-t-0">
              {renderTable("Inflow", inflowRows, setInflowRows, "inflow", INFLOW_CATEGORY_OPTIONS)}
              {renderTable("Outflow", outflowRows, setOutflowRows, "outflow", OUTFLOW_CATEGORY_OPTIONS, "Other")}

              {/* Net Cash Flow row */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[150px]" />
                    <col className="w-[160px]" />
                    {months.map((m) => <col key={m} className="w-[72px]" />)}
                    <col className="w-[80px]" />
                    <col className="w-[36px]" />
                  </colgroup>
                  <tbody>
                    <tr className="bg-blue-50 font-bold text-blue-800">
                      <td className="border p-2 sticky left-0 bg-blue-50">Net Cashflow</td>
                      <td className="border p-2"></td>
                      {netCashFlow.map((val, idx) => (
                        <td
                          key={idx}
                          className={`border p-2 text-center ${val < 0 ? "text-red-600" : "text-green-700"}`}
                        >
                          {val.toLocaleString()}
                        </td>
                      ))}
                      <td className={`border p-2 text-center ${netCashFlow.reduce((a, b) => a + b, 0) < 0 ? "text-red-600" : "text-green-700"}`}>
                        {netCashFlow.reduce((a, b) => a + b, 0).toLocaleString()}
                      </td>
                      <td className="border p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Charts — three columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Combined Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Inflow vs Outflow &amp; Net Cash Flow Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCashflowData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={cashflowChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis fontSize={10} tickFormatter={(v) => formatCurrency(v)} width={70} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend
                      wrapperStyle={{ fontSize: 10 }}
                      payload={[
                        { value: "Inflow", type: "square", color: "#10b981" },
                        { value: "Outflow", type: "square", color: "#ef4444" },
                        { value: "Net Cash Flow", type: "line", color: "#3b82f6" },
                      ]}
                    />
                    <Bar dataKey="Inflow" fill="#10b981" opacity={0.85} />
                    <Bar dataKey="Outflow" fill="#ef4444" opacity={0.85} />
                    <Line type="monotone" dataKey="Net Cash Flow" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No cash flow data yet — add values above and save.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Annual Income Analysis */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Annual Income Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      label={({ percent }) => percent && percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ""}
                      labelLine={false}
                    >
                      {incomeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} formatter={pieLegendFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No income data yet — add inflow values above and save.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Annual Spending Analysis */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Annual Spending Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {spendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      label={({ percent }) => percent && percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ""}
                      labelLine={false}
                    >
                      {spendingData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} formatter={pieLegendFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No spending data yet — add outflow values above and save.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
