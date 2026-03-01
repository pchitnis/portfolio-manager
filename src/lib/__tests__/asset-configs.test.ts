import { describe, it, expect } from "vitest";
import { assetConfigs } from "@/lib/asset-configs";

const EXPECTED_TYPES = [
  "bank-accounts",
  "term-deposits",
  "stocks",
  "metals",
  "real-estate",
  "pension",
  "loans",
  "insurance",
];

describe("assetConfigs", () => {
  it("has all 8 asset types", () => {
    expect(Object.keys(assetConfigs).sort()).toEqual(EXPECTED_TYPES.sort());
  });

  for (const type of EXPECTED_TYPES) {
    describe(type, () => {
      it("has required properties", () => {
        const config = assetConfigs[type];
        expect(config.key).toBe(type);
        expect(config.label).toBeTruthy();
        expect(config.pluralLabel).toBeTruthy();
        expect(config.prismaModel).toBeTruthy();
        expect(config.fields.length).toBeGreaterThan(0);
        expect(config.gridColumns.length).toBeGreaterThan(0);
      });

      it("has a currency field", () => {
        const config = assetConfigs[type];
        const currencyField = config.fields.find((f) => f.name === "currency");
        expect(currencyField).toBeDefined();
        expect(currencyField!.type).toBe("select");
      });
    });
  }
});

describe("real-estate computed columns", () => {
  it("computes netAssetValue correctly", () => {
    const config = assetConfigs["real-estate"];
    const navCol = config.gridColumns.find((c) => c.key === "netAssetValue");
    expect(navCol).toBeDefined();
    expect(navCol!.computed).toBeDefined();

    const result = navCol!.computed!({
      currentValue: 500000,
      purchasePrice: 400000,
      mortgageAmount: 200000,
    });
    expect(result).toBe(300000); // 500000 - 200000
  });

  it("falls back to purchasePrice when currentValue is null", () => {
    const config = assetConfigs["real-estate"];
    const navCol = config.gridColumns.find((c) => c.key === "netAssetValue");

    const result = navCol!.computed!({
      currentValue: null,
      purchasePrice: 400000,
      mortgageAmount: 100000,
    });
    expect(result).toBe(300000); // 400000 - 100000
  });

  it("treats null mortgage as 0", () => {
    const config = assetConfigs["real-estate"];
    const navCol = config.gridColumns.find((c) => c.key === "netAssetValue");

    const result = navCol!.computed!({
      currentValue: 500000,
      purchasePrice: 400000,
      mortgageAmount: null,
    });
    expect(result).toBe(500000); // 500000 - 0
  });
});
