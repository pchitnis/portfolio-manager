"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldConfig } from "@/lib/asset-configs";

interface AssetFormProps {
  fields: FieldConfig[];
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any> | null;
  title: string;
}

export function AssetForm({ fields, open, onClose, onSubmit, initialData, title }: AssetFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        const defaults: Record<string, any> = {};
        fields.forEach((f) => {
          if (f.defaultValue !== undefined) {
            defaults[f.name] = f.defaultValue;
          }
        });
        setFormData(defaults);
      }
      setError("");
    }
  }, [open, initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    for (const field of fields) {
      if (field.required && !field.readOnly && !field.autoCalc) {
        const val = formData[field.name];
        if (val === undefined || val === null || val === "") {
          setError(`${field.label} is required`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Convert numeric fields
      const processed: Record<string, any> = {};
      for (const field of fields) {
        let val = formData[field.name];
        if (field.type === "number" && val !== undefined && val !== null && val !== "") {
          val = parseFloat(val);
          if (isNaN(val)) val = 0;
        }
        processed[field.name] = val;
      }
      await onSubmit(processed);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Check if a custom type field should be shown
  const shouldShowField = (field: FieldConfig): boolean => {
    if (field.name === "customType") {
      return formData["investmentType"] === "Custom";
    }
    return true;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{initialData ? `Update ${title}` : `Add New ${title}`}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {fields.map((field) => {
          if (!shouldShowField(field)) return null;
          if (field.readOnly && !initialData) return null;

          return (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && !field.readOnly && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === "select" ? (
                <Select
                  id={field.name}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={field.readOnly}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Select>
              ) : field.type === "file" ? (
                <Input
                  id={field.name}
                  type="text"
                  placeholder="File path or URL"
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  step={field.type === "number" ? "any" : undefined}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  readOnly={field.readOnly}
                  disabled={field.readOnly}
                />
              )}
            </div>
          );
        })}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Update" : "Add"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
