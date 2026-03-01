"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CURRENCY_GROUPED_OPTIONS } from "@/lib/currencies";

const countries = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "EU", name: "Europe", currency: "EUR" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "SG", name: "Singapore", currency: "SGD" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    country: "US",
    currency: "USD",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    setForm((prev) => ({
      ...prev,
      country: countryCode,
      currency: country?.currency || prev.currency,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          country: form.country,
          currency: form.currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Create Account</CardTitle>
          <CardDescription>Register to start tracking your portfolio</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+1 234 567 8900"
                value={form.mobile}
                onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                id="country"
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select
                id="currency"
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              >
                {CURRENCY_GROUPED_OPTIONS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
