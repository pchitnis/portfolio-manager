"use client";
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";

export default function LoansPage() {
  return <AssetGrid config={assetConfigs["loans"]} />;
}
