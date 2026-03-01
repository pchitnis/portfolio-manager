"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldConfig } from "@/lib/asset-configs";
import { Info, Loader2, Paperclip, X, FileText } from "lucide-react";

interface AssetFormProps {
  fields: FieldConfig[];
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any> | null;
  title: string;
}

type PriceStatus = "idle" | "fetching" | "success" | "fallback";

const FREQUENCY_MAP: Record<string, number> = {
  Monthly: 12,
  Quarterly: 4,
  "Semi-annually": 2,
  Annually: 1,
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function calcNextDueDate(
  frequency: string,
  day: string,
  month: string,
  qMonths: string[]
): string | null {
  const dayNum = parseInt(day);
  if (!dayNum || !frequency) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === "Monthly") {
    let candidate = new Date(today.getFullYear(), today.getMonth(), dayNum);
    if (candidate <= today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, dayNum);
    return candidate.toISOString().split("T")[0];
  }

  if (frequency === "Annually" && month) {
    const mIdx = MONTHS.indexOf(month);
    if (mIdx === -1) return null;
    let candidate = new Date(today.getFullYear(), mIdx, dayNum);
    if (candidate <= today) candidate = new Date(today.getFullYear() + 1, mIdx, dayNum);
    return candidate.toISOString().split("T")[0];
  }

  if (frequency === "Quarterly") {
    const validMonths = qMonths.map((m) => MONTHS.indexOf(m)).filter((i) => i !== -1);
    if (validMonths.length === 0) return null;
    const candidates = validMonths
      .flatMap((mIdx) => [
        new Date(today.getFullYear(), mIdx, dayNum),
        new Date(today.getFullYear() + 1, mIdx, dayNum),
      ])
      .filter((d) => d > today)
      .sort((a, b) => a.getTime() - b.getTime());
    if (candidates.length === 0) return null;
    return candidates[0].toISOString().split("T")[0];
  }

  return null;
}

function calcCompoundInterest(principal: number, annualRate: number, frequency: string, startDate: string): number | null {
  if (!principal || !annualRate || !startDate) return null;
  const n = FREQUENCY_MAP[frequency] || 1;
  const r = annualRate / 100;
  const start = new Date(startDate);
  const today = new Date();
  const t = (today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (t < 0) return null;
  return parseFloat((principal * Math.pow(1 + r / n, n * t)).toFixed(2));
}

export function AssetForm({ fields, open, onClose, onSubmit, initialData, title }: AssetFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [priceStatus, setPriceStatus] = useState<PriceStatus>("idle");
  const [calcStatus, setCalcStatus] = useState<"idle" | "calculated">("idle");
  const [fileUploads, setFileUploads] = useState<Record<string, string[]>>({});
  const [fileUploading, setFileUploading] = useState(false);
  const [dueDateStatus, setDueDateStatus] = useState<"idle" | "suggested">("idle");
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Find the field with autoFetchPrice config (if any)
  const autoFetchField = fields.find((f) => f.autoFetchPrice);
  const symbolFieldName = autoFetchField?.autoFetchPrice?.symbolField ?? "";
  const quantityFieldName = autoFetchField?.autoFetchPrice?.quantityField ?? "";
  const fallbackPriceFieldName = autoFetchField?.autoFetchPrice?.fallbackPriceField ?? "";

  // Find the field with autoCalcCompound config (if any)
  const autoCalcField = fields.find((f) => f.autoCalcCompound);
  const compoundConfig = autoCalcField?.autoCalcCompound;

  // Find the field with autoSuggestNextDue config (if any)
  const nextDueField = fields.find((f) => f.autoSuggestNextDue);
  const nextDueConfig = nextDueField?.autoSuggestNextDue;

  // Derived values tracked for the price-fetch effect
  const symbolValue = symbolFieldName ? String(formData[symbolFieldName] ?? "") : "";
  const quantityValue = quantityFieldName ? String(formData[quantityFieldName] ?? "") : "";

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
      // Initialise file uploads from existing data
      const initFiles: Record<string, string[]> = {};
      fields.filter((f) => f.type === "file").forEach((f) => {
        const raw = initialData?.[f.name];
        if (raw) {
          try { initFiles[f.name] = JSON.parse(raw); } catch { initFiles[f.name] = [raw]; }
        } else {
          initFiles[f.name] = [];
        }
      });
      setFileUploads(initFiles);
      setError("");
      setFieldErrors({});
      setPriceStatus("idle");
      setCalcStatus("idle");
      setDueDateStatus("idle");
    }
  }, [open, initialData, fields]);

  // Auto-fetch live price when symbol or quantity changes
  useEffect(() => {
    if (!open || !autoFetchField?.autoFetchPrice) return;
    if (!symbolValue.trim()) return;

    const { apiPath } = autoFetchField.autoFetchPrice;
    const qty = parseFloat(quantityValue) || 0;
    const fallbackPrice = parseFloat(String(formData[fallbackPriceFieldName])) || 0;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    setPriceStatus("fetching");

    fetchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${apiPath}?symbol=${encodeURIComponent(symbolValue.trim())}`);
        if (!res.ok) throw new Error("Price fetch failed");

        const data = await res.json();
        const value = parseFloat((data.price * qty).toFixed(4));
        setFormData((prev) => ({ ...prev, [autoFetchField.name]: value }));
        setPriceStatus("success");
      } catch {
        const fallbackValue = parseFloat((fallbackPrice * qty).toFixed(4));
        setFormData((prev) => ({ ...prev, [autoFetchField.name]: fallbackValue }));
        setPriceStatus("fallback");
      }
    }, 800);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolValue, quantityValue, open]);

  // Auto-calculate compound interest for term deposits
  useEffect(() => {
    if (!open || !autoCalcField || !compoundConfig) return;
    const principal = parseFloat(String(formData[compoundConfig.principalField] ?? "")) || 0;
    const rate = parseFloat(String(formData[compoundConfig.rateField] ?? "")) || 0;
    const frequency = String(formData[compoundConfig.frequencyField] ?? "");
    const startDate = String(formData[compoundConfig.startDateField] ?? "");
    const result = calcCompoundInterest(principal, rate, frequency, startDate);
    if (result !== null) {
      setFormData((prev) => ({ ...prev, [autoCalcField.name]: result }));
      setCalcStatus("calculated");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData[compoundConfig?.principalField ?? ""],
    formData[compoundConfig?.rateField ?? ""],
    formData[compoundConfig?.frequencyField ?? ""],
    formData[compoundConfig?.startDateField ?? ""],
    open,
  ]);

  // Auto-suggest next due date from payment schedule
  useEffect(() => {
    if (!open || !nextDueField || !nextDueConfig) return;
    const frequency = String(formData[nextDueConfig.frequencyField] ?? "");
    const day = String(formData[nextDueConfig.dayField] ?? "");
    const month = String(formData[nextDueConfig.monthField] ?? "");
    const qMonths = [
      String(formData[nextDueConfig.qMonth1Field] ?? ""),
      String(formData[nextDueConfig.qMonth2Field] ?? ""),
      String(formData[nextDueConfig.qMonth3Field] ?? ""),
      String(formData[nextDueConfig.qMonth4Field] ?? ""),
    ].filter(Boolean);
    const suggested = calcNextDueDate(frequency, day, month, qMonths);
    if (suggested) {
      setFormData((prev) => ({ ...prev, [nextDueField.name]: suggested }));
      setDueDateStatus("suggested");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData[nextDueConfig?.frequencyField ?? ""],
    formData[nextDueConfig?.dayField ?? ""],
    formData[nextDueConfig?.monthField ?? ""],
    formData[nextDueConfig?.qMonth1Field ?? ""],
    formData[nextDueConfig?.qMonth2Field ?? ""],
    formData[nextDueConfig?.qMonth3Field ?? ""],
    formData[nextDueConfig?.qMonth4Field ?? ""],
    open,
  ]);

  const handleChange = (name: string, value: any, isBadInput?: boolean) => {
    // Validate number fields: no negative values, max 2 decimal places, no alphabets
    const field = fields.find((f) => f.name === name);
    if (field?.type === "number") {
      if (isBadInput) {
        setFieldErrors((prev) => ({ ...prev, [name]: "Please enter positive numbers only. Alphabets are not allowed." }));
        return; // keep previous valid value
      }
      if (value !== "" && value !== null && value !== undefined) {
        const strVal = String(value);
        if (parseFloat(strVal) < 0) {
          setFieldErrors((prev) => ({ ...prev, [name]: "Please enter a positive number." }));
          value = "0";
        } else {
          const dotIdx = strVal.indexOf(".");
          if (dotIdx !== -1 && strVal.length - dotIdx - 1 > 2) {
            setFieldErrors((prev) => ({ ...prev, [name]: "Maximum 2 decimal places allowed." }));
            value = parseFloat(parseFloat(strVal).toFixed(2));
          } else {
            setFieldErrors((prev) => { const e = { ...prev }; delete e[name]; return e; });
          }
        }
      } else {
        setFieldErrors((prev) => { const e = { ...prev }; delete e[name]; return e; });
      }
    } else if (field?.type === "text" && typeof value === "string" && value.length >= 256) {
      setFieldErrors((prev) => ({ ...prev, [name]: "Maximum 256 characters allowed." }));
    } else {
      setFieldErrors((prev) => { const e = { ...prev }; delete e[name]; return e; });
    }

    // When Quarter 1 month changes, auto-populate Q2/Q3/Q4 (+3 months each)
    if (nextDueConfig && name === nextDueConfig.qMonth1Field) {
      const q1Idx = MONTHS.indexOf(value);
      if (q1Idx !== -1) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          [nextDueConfig.qMonth2Field]: MONTHS[q1Idx + 3] ?? prev[nextDueConfig.qMonth2Field],
          [nextDueConfig.qMonth3Field]: MONTHS[q1Idx + 6] ?? prev[nextDueConfig.qMonth3Field],
          [nextDueConfig.qMonth4Field]: MONTHS[q1Idx + 9] ?? prev[nextDueConfig.qMonth4Field],
        }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    // If user manually edits the auto-calc field, clear the calculated indicator
    if (autoCalcField && name === autoCalcField.name) {
      setCalcStatus("idle");
    }
    // If user manually edits the next due date, clear the suggested indicator
    if (nextDueField && name === nextDueField.name) {
      setDueDateStatus("idle");
    }
  };

  const handleFileSelect = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existing = fileUploads[fieldName] ?? [];
    const totalAllowed = 5 - existing.length;
    if (totalAllowed <= 0) {
      setError("Maximum 5 files allowed");
      return;
    }
    const selected = Array.from(files).slice(0, totalAllowed);
    setFileUploading(true);
    setError("");
    try {
      const fd = new FormData();
      selected.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFileUploads((prev) => ({ ...prev, [fieldName]: [...existing, ...data.paths] }));
    } catch {
      setError("File upload failed. Please try again.");
    } finally {
      setFileUploading(false);
      if (fileInputRefs.current[fieldName]) fileInputRefs.current[fieldName]!.value = "";
    }
  };

  const removeFile = (fieldName: string, index: number) => {
    setFileUploads((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields (skip hidden fields)
    for (const field of fields) {
      if (field.required && !field.readOnly && !field.autoCalc && shouldShowField(field)) {
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
        if (field.type === "file") {
          const paths = fileUploads[field.name] ?? [];
          processed[field.name] = paths.length > 0 ? JSON.stringify(paths) : null;
          continue;
        }
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

  // Check if a field should be shown based on showWhen config or legacy customType logic
  const shouldShowField = (field: FieldConfig): boolean => {
    if (field.showWhen) {
      return field.showWhen.values.includes(String(formData[field.showWhen.field] ?? ""));
    }
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
          if (field.readOnly && !field.autoFetchPrice && !initialData) return null;

          const isAutoFetch = !!field.autoFetchPrice;
          const isAutoCalc = !!field.autoCalcCompound;
          const isNextDue = !!field.autoSuggestNextDue;

          return (
            <div key={field.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && !field.readOnly && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {isAutoFetch && priceStatus === "fetching" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {isAutoFetch && priceStatus === "success" && (
                  <span className="text-xs font-medium text-green-600">● Live</span>
                )}
                {isAutoFetch && priceStatus === "fallback" && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium text-amber-600 cursor-help"
                    title="Live price could not be fetched. Showing buy price × quantity."
                  >
                    <Info className="h-3.5 w-3.5" />
                    Estimated
                  </span>
                )}
                {isAutoCalc && calcStatus === "calculated" && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 cursor-help"
                    title="Calculated using compound interest formula. You can override this value manually."
                  >
                    <Info className="h-3.5 w-3.5" />
                    Auto-calculated
                  </span>
                )}
                {isNextDue && dueDateStatus === "suggested" && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 cursor-help"
                    title="Suggested based on your payment schedule. You can override this date manually."
                  >
                    <Info className="h-3.5 w-3.5" />
                    Suggested
                  </span>
                )}
              </div>

              {field.type === "select" ? (
                <Select
                  id={field.name}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={field.readOnly}
                >
                  <option value="">Select...</option>
                  {field.groupedOptions
                    ? field.groupedOptions.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </optgroup>
                      ))
                    : field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))
                  }
                </Select>
              ) : field.type === "file" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={fileUploading || (fileUploads[field.name]?.length ?? 0) >= 5}
                      onClick={() => fileInputRefs.current[field.name]?.click()}
                    >
                      {fileUploading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                      ) : (
                        <><Paperclip className="h-4 w-4 mr-2" />Attach Files</>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {fileUploads[field.name]?.length ?? 0}/5 files
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[field.name] = el; }}
                      onChange={(e) => handleFileSelect(field.name, e.target.files)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                  {(fileUploads[field.name]?.length ?? 0) > 0 && (
                    <div className="space-y-1 mt-2">
                      {fileUploads[field.name].map((filePath, idx) => {
                        const fileName = filePath.split("/").pop() ?? filePath;
                        const displayName = fileName.replace(/^\d+-/, "");
                        return (
                          <div key={idx} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a
                              href={filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 truncate text-blue-600 hover:underline"
                            >
                              {displayName}
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile(field.name, idx)}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  min={field.type === "number" ? "0" : undefined}
                  maxLength={field.type === "text" ? 256 : undefined}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value, (e.target as HTMLInputElement).validity?.badInput)}
                  readOnly={field.readOnly}
                  disabled={field.readOnly}
                  className={fieldErrors[field.name] ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
              )}
              {fieldErrors[field.name] && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors[field.name]}</p>
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
