"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotelLogo } from "@/components/ui/hotel-logo";
import { authClient } from "@/lib/auth-client";

/**
 * /admin/login — staff/admin sign-in. Session is established via Better Auth
 * (email + password); role checks happen server-side on every protected page.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center flex flex-col items-center">
          <HotelLogo
            name="GURJA"
            subtitle="PROPERTY MANAGEMENT"
            variant="dark"
            size="lg"
            layout="stacked"
            href="/"
          />
          <h1 className="mt-6 text-lg font-semibold text-foreground">Staff Sign In</h1>
          <p className="mt-1 text-xs text-stone-500">
            Access hotel administration &amp; front desk portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
        >
          <Input
            type="email"
            name="email"
            label="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <Input
            type="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">
          Development credentials: admin@example.com / Admin123!
        </p>
      </div>
    </main>
  );
}
