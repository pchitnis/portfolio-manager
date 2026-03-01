import { describe, it, expect } from "vitest";
import { cn, formatCurrency } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats INR by default", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234.56");
  });

  it("formats USD", () => {
    const result = formatCurrency(99.9, "USD");
    expect(result).toContain("$");
    expect(result).toContain("99.90");
  });

  it("formats GBP", () => {
    const result = formatCurrency(50, "GBP");
    expect(result).toContain("£");
    expect(result).toContain("50.00");
  });

  it("handles zero", () => {
    const result = formatCurrency(0, "USD");
    expect(result).toContain("0.00");
  });

  it("handles negative amounts", () => {
    const result = formatCurrency(-100, "USD");
    expect(result).toContain("100.00");
  });

  it("falls back on invalid currency code", () => {
    const result = formatCurrency(42, "INVALID");
    expect(result).toBe("42.00");
  });
});
