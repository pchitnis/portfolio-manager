"use client";
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";

export default function RealEstatePage() {
  return <AssetGrid config={assetConfigs["real-estate"]} />;
}
