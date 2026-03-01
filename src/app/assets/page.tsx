"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Landmark,
  TrendingUp,
  CircleDollarSign,
  Home,
  Briefcase,
  CreditCard,
  Shield,
  ArrowLeft,
} from "lucide-react";

const assetTypes = [
  { key: "bank-accounts", label: "Bank Accounts", icon: Building2, color: "text-indigo-600 bg-indigo-50" },
  { key: "term-deposits", label: "Term Deposits", icon: Landmark, color: "text-blue-600 bg-blue-50" },
  { key: "stocks", label: "Stocks & Funds", icon: TrendingUp, color: "text-green-600 bg-green-50" },
  { key: "metals", label: "Metal", icon: CircleDollarSign, color: "text-yellow-600 bg-yellow-50" },
  { key: "real-estate", label: "Real Estate", icon: Home, color: "text-amber-600 bg-amber-50" },
  { key: "pension", label: "Pension", icon: Briefcase, color: "text-teal-600 bg-teal-50" },
  { key: "loans", label: "Loans", icon: CreditCard, color: "text-red-600 bg-red-50" },
  { key: "insurance", label: "Life Insurance", icon: Shield, color: "text-purple-600 bg-purple-50" },
];

export default function AssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-1 rounded hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">Add My Assets</h1>
        </div>
        <p className="text-center text-muted-foreground mb-8">Select an asset category to manage</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assetTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.key}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/assets/${type.key}`)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <div className={`p-3 rounded-full ${type.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{type.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
