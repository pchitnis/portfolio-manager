"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Home, LayoutDashboard, Wallet, ArrowLeftRight } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="text-xl font-bold text-primary">
              PortfolioManager
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/home" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link href="/assets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <Wallet className="h-4 w-4" />
                Assets
              </Link>
              <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/cashflow" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeftRight className="h-4 w-4" />
                Cash Flow
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
