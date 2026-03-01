import { describe, it, expect } from "vitest";
import {
  PRIORITY_CURRENCIES,
  OTHER_CURRENCIES,
  ALL_CURRENCIES,
  getCurrencyByCode,
  getCurrencySymbol,
  CURRENCY_GROUPED_OPTIONS,
} from "@/lib/currencies";

describe("PRIORITY_CURRENCIES", () => {
  it("has exactly 4 entries", () => {
    expect(PRIORITY_CURRENCIES).toHaveLength(4);
  });

  it("includes INR, USD, GBP, EUR", () => {
    const codes = PRIORITY_CURRENCIES.map((c) => c.code);
    expect(codes).toEqual(["INR", "USD", "GBP", "EUR"]);
  });

  it("each entry has code, symbol, and name", () => {
    for (const c of PRIORITY_CURRENCIES) {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.name).toBeTruthy();
    }
  });
});

describe("ALL_CURRENCIES", () => {
  it("combines priority and other currencies", () => {
    expect(ALL_CURRENCIES.length).toBe(PRIORITY_CURRENCIES.length + OTHER_CURRENCIES.length);
  });

  it("has no duplicate codes", () => {
    const codes = ALL_CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("getCurrencyByCode", () => {
  it("finds a priority currency", () => {
    const result = getCurrencyByCode("USD");
    expect(result).toEqual({ code: "USD", symbol: "$", name: "US Dollar" });
  });

  it("finds a non-priority currency", () => {
    const result = getCurrencyByCode("JPY");
    expect(result?.code).toBe("JPY");
  });

  it("returns undefined for unknown code", () => {
    expect(getCurrencyByCode("XYZ")).toBeUndefined();
  });
});

describe("getCurrencySymbol", () => {
  it("returns symbol for known currency", () => {
    expect(getCurrencySymbol("INR")).toBe("₹");
    expect(getCurrencySymbol("GBP")).toBe("£");
  });

  it("falls back to code for unknown currency", () => {
    expect(getCurrencySymbol("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("CURRENCY_GROUPED_OPTIONS", () => {
  it("has two groups", () => {
    expect(CURRENCY_GROUPED_OPTIONS).toHaveLength(2);
    expect(CURRENCY_GROUPED_OPTIONS[0].label).toBe("Popular");
    expect(CURRENCY_GROUPED_OPTIONS[1].label).toBe("Other Currencies");
  });

  it("Popular group has 4 options matching priority currencies", () => {
    expect(CURRENCY_GROUPED_OPTIONS[0].options).toHaveLength(4);
  });

  it("each option has value and label", () => {
    for (const group of CURRENCY_GROUPED_OPTIONS) {
      for (const opt of group.options) {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
      }
    }
  });
});
