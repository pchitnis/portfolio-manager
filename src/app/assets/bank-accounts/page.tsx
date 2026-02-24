"use client";
import { AssetGrid } from "@/components/asset-grid";
import { assetConfigs } from "@/lib/asset-configs";

export default function BankAccountsPage() {
  return <AssetGrid config={assetConfigs["bank-accounts"]} />;
}
