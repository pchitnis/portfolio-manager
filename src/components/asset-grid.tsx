"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetForm } from "@/components/asset-form";
import { useToast } from "@/components/ui/toast";
import { AssetTypeConfig } from "@/lib/asset-configs";
import { formatCurrency } from "@/lib/utils";
import { Plus, Eye, Pencil, Trash2, ArrowLeft } from "lucide-react";

interface AssetGridProps {
  config: AssetTypeConfig;
}

export function AssetGrid({ config }: AssetGridProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/assets/${config.key}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      toast("Failed to load items", "error");
    } finally {
      setLoading(false);
    }
  }, [config.key, toast]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchItems();
  }, [status, router, fetchItems]);

  const handleCreate = async (data: Record<string, any>) => {
    const res = await fetch(`/api/assets/${config.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create");
    toast(`${config.label} added successfully`);
    fetchItems();
  };

  const handleUpdate = async (data: Record<string, any>) => {
    const res = await fetch(`/api/assets/${config.key}/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update");
    toast(`${config.label} updated successfully`);
    setEditItem(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const res = await fetch(`/api/assets/${config.key}/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast(`${config.label} deleted`);
      fetchItems();
    } else {
      toast("Failed to delete", "error");
    }
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") return formatCurrency(value);
    return String(value);
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/assets")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{config.pluralLabel}</h1>
          </div>
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add {config.label}
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No {config.pluralLabel.toLowerCase()} added yet</p>
              <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first {config.label.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                    {config.gridColumns.map((col) => (
                      <th key={col.key} className="text-left p-4 text-sm font-medium text-muted-foreground">
                        {col.label}
                      </th>
                    ))}
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-sm">{idx + 1}</td>
                      {config.gridColumns.map((col) => (
                        <td key={col.key} className="p-4 text-sm">
                          {formatValue(col.key, item[col.key])}
                        </td>
                      ))}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewItem(item)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditItem(item); setFormOpen(true); }}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create / Edit Form */}
        <AssetForm
          fields={config.fields}
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditItem(null); }}
          onSubmit={editItem ? handleUpdate : handleCreate}
          initialData={editItem}
          title={config.label}
        />

        {/* View Dialog */}
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setViewItem(null)} />
            <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">{config.label} Details</h2>
              <div className="space-y-3">
                {config.fields.map((field) => (
                  <div key={field.name} className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium">
                      {formatValue(field.name, viewItem[field.name])}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
