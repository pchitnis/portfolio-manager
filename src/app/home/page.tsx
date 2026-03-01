"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Wallet, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Portfolio Manager
          </h1>
          <p className="text-lg text-muted-foreground">
            Track all your assets, liabilities, and net worth in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Button
            onClick={() => router.push("/assets")}
            className="h-40 text-xl flex flex-col gap-3 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Wallet className="h-10 w-10" />
            Add Assets
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="h-40 text-xl flex flex-col gap-3 border-2"
            size="lg"
          >
            <LayoutDashboard className="h-10 w-10" />
            Show Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
