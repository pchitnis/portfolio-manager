"use client";
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";

export default function TermDepositsPage() {
  return <AssetGrid config={assetConfigs["term-deposits"]} />;
}
