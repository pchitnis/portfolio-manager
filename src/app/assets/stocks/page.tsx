"use client";
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";

export default function StocksPage() {
  return <AssetGrid config={assetConfigs["stocks"]} />;
}
