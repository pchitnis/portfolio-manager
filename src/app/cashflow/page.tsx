"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { Plus, Save, Trash2 } from "lucide-react";

const months = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"];
const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

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

  const initializeDefaults = useCallback(() => {
    const makeRow = (type: "inflow" | "outflow", category: string): CashFlowRow => {
      const row: CashFlowRow = { type, category };
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

          // Merge with defaults
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
    const row: CashFlowRow = { type, category: `New ${type} item` };
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

  const formatNum = (n: number) => (n === 0 ? "" : n.toLocaleString());

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderTable = (
    title: string,
    rows: CashFlowRow[],
    setRows: React.Dispatch<React.SetStateAction<CashFlowRow[]>>,
    type: "inflow" | "outflow"
  ) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button variant="outline" size="sm" onClick={() => addRow(type)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left min-w-[180px] sticky left-0 bg-muted/50">Particulars</th>
              {monthLabels.map((m) => (
                <th key={m} className="border p-2 text-right min-w-[90px]">{m}</th>
              ))}
              <th className="border p-2 text-right min-w-[100px] font-bold">Total</th>
              <th className="border p-2 w-10"></th>
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
                <td className="border p-2 text-right font-medium bg-muted/30">
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
            {/* Totals row */}
            <tr className="bg-muted/50 font-bold">
              <td className="border p-2 sticky left-0 bg-muted/50">Total {title}</td>
              {months.map((m) => (
                <td key={m} className="border p-2 text-right">
                  {getColumnTotal(rows, m).toLocaleString()}
                </td>
              ))}
              <td className="border p-2 text-right">
                {rows.reduce((sum, row) => sum + getRowTotal(row), 0).toLocaleString()}
              </td>
              <td className="border p-1"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Net cash flow row
  const netCashFlow = months.map((m) => getColumnTotal(inflowRows, m) - getColumnTotal(outflowRows, m));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <Card className="p-4">
          {renderTable("Inflow", inflowRows, setInflowRows, "inflow")}
          {renderTable("Outflow", outflowRows, setOutflowRows, "outflow")}

          {/* Net Cash Flow */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="bg-blue-50 font-bold text-blue-800">
                  <td className="border p-2 min-w-[180px] sticky left-0 bg-blue-50">Net Cashflow</td>
                  {netCashFlow.map((val, idx) => (
                    <td
                      key={idx}
                      className={`border p-2 text-right min-w-[90px] ${val < 0 ? "text-red-600" : "text-green-700"}`}
                    >
                      {val.toLocaleString()}
                    </td>
                  ))}
                  <td className={`border p-2 text-right min-w-[100px] ${netCashFlow.reduce((a, b) => a + b, 0) < 0 ? "text-red-600" : "text-green-700"}`}>
                    {netCashFlow.reduce((a, b) => a + b, 0).toLocaleString()}
                  </td>
                  <td className="border p-1 w-10"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
