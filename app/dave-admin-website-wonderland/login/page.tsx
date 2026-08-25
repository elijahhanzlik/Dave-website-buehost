"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { ActionButton, Card, Field, inputClass } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      );
      setLoading(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dave-admin-website-wonderland/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="flex flex-col justify-end bg-primary-dark px-8 py-12 lg:flex-1 lg:px-16 lg:pb-[72px]">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold">
          Private
        </p>
        <h1 className="mt-3 font-display text-[38px] font-bold leading-[1.05] text-cream lg:text-[52px]">
          Your website,
          <br />
          behind the scenes
        </h1>
        <p className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-cream/65">
          Change your artwork, your writing and where your work is hanging.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 lg:w-[540px] lg:shrink-0 lg:px-16">
        <h2 className="font-display text-[34px] font-bold text-admin-ink">
          Sign in
        </h2>
        <p className="mb-8 mt-2.5 text-[15px] leading-relaxed text-admin-muted">
          The email and password set up with your site.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
              <p className="text-[15px] font-semibold text-admin-danger">
                That did not sign you in.
              </p>
              <p className="mt-1 text-sm text-admin-muted">{error}</p>
            </Card>
          )}

          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </Field>

          <ActionButton
            type="submit"
            disabled={loading}
            full
            align="stretch"
            label={loading ? "Signing in…" : "Sign in"}
            hint="You will land on your dashboard."
            icon={
              loading ? <Loader2 size={18} className="animate-spin" /> : undefined
            }
          />
        </form>
      </div>
    </main>
  );
}
