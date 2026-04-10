"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { usePageTitle } from "@/lib/hooks/use-page-title";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password. Please try again.";
const MISSING_SUPABASE_ENV_MESSAGE = "Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

type ProfileRole = "tpc_admin" | "student";

async function resolveRoleAndRedirect(userId: string, router: ReturnType<typeof useRouter>) {
  const supabase = getSupabaseBrowserClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = profile?.role as ProfileRole | undefined;

  if (role === "student") {
    router.replace("/student");
    return;
  }

  router.replace("/dashboard");
}

export default function LoginPage() {
  usePageTitle("Sign in - Vigilo");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    const prefetchedEmail = searchParams.get("email");
    if (prefetchedEmail) {
      setEmail(prefetchedEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      if (!supabaseConfigured) {
        if (active) {
          setErrorMessage(MISSING_SUPABASE_ENV_MESSAGE);
          setCheckingSession(false);
        }
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (active && session?.user) {
          await resolveRoleAndRedirect(session.user.id, router);
        }
      } catch {
        if (active) {
          setErrorMessage(MISSING_SUPABASE_ENV_MESSAGE);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [router, supabaseConfigured]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseConfigured) {
      setErrorMessage(MISSING_SUPABASE_ENV_MESSAGE);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      await resolveRoleAndRedirect(data.user.id, router);
    } catch {
      setErrorMessage(INVALID_CREDENTIALS_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[rgba(26,26,26,0.15)] bg-[var(--paper)]">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
            <span className="font-[family-name:var(--font-dm-serif-display)] text-[22px] text-[var(--ink)]">
              Vigilo
            </span>
          </Link>
          <Link href="/" className="text-sm text-[var(--muted)]">
            Back to home
          </Link>
        </div>
      </header>

      <main className="px-6 py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-[1100px] gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <section className="border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-7 md:p-9">
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
              AUTHENTICATION
            </p>
            <h1 className="mt-5 max-w-[520px] font-[family-name:var(--font-dm-serif-display)] text-[36px] leading-[1.1] md:text-[48px]">
              Sign in to the Vigilo command console.
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-[1.75] text-[var(--muted)]">
              Access at-risk cohorts, trigger interventions, and review audit trails from one secure
              workspace.
            </p>

            <div className="mt-8 space-y-4">
              <div className="border-l-2 border-[var(--red)] pl-4">
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  01
                </p>
                <p className="mt-1 text-[15px] leading-[1.6] text-[var(--ink)]">Role-based access for TPC teams</p>
              </div>
              <div className="border-l-2 border-[rgba(26,26,26,0.18)] pl-4">
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  02
                </p>
                <p className="mt-1 text-[15px] leading-[1.6] text-[var(--ink)]">
                  Secure session tokens with auditable actions
                </p>
              </div>
              <div className="border-l-2 border-[rgba(26,26,26,0.18)] pl-4">
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  03
                </p>
                <p className="mt-1 text-[15px] leading-[1.6] text-[var(--ink)]">Fast entry into daily alert queue</p>
              </div>
            </div>
          </section>

          <section className="border border-[rgba(26,26,26,0.15)] bg-[var(--paper)] p-7 md:p-9">
            <div className="mb-6 border-b border-[rgba(26,26,26,0.15)] pb-4">
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                ACCOUNT ACCESS
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-dm-serif-display)] text-[30px] leading-[1.2]">
                Welcome back
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  Work Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  required
                  className="w-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[var(--red)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="w-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[var(--red)]"
                />
              </label>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-[14px] text-[var(--muted)]">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 accent-[var(--red)]"
                  />
                  Remember session
                </label>
                <Link href="/forgot-password" className="text-[14px] text-[var(--muted)] underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={checkingSession || isSubmitting || !supabaseConfigured}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--red)] px-5 py-3 text-[15px] text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--paper)] border-t-transparent" />
                    <span>Signing In...</span>
                  </>
                ) : checkingSession ? (
                  "Checking session..."
                ) : (
                  "Sign In"
                )}
              </button>

              <div title="Coming soon">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed border border-[rgba(26,26,26,0.2)] bg-transparent px-5 py-3 text-[15px] text-[var(--ink)] opacity-60"
                >
                  Continue with SSO
                </button>
              </div>

              {errorMessage ? (
                <p className="mt-2 text-[12px] text-[var(--red)]">{errorMessage}</p>
              ) : null}
            </form>

            <div className="mt-5 border-t border-[rgba(26,26,26,0.15)] pt-5 text-center text-[14px] text-[var(--muted)]">
              <p>
                New here?{" "}
                <Link href="/register" className="text-[var(--red)]">
                  Create account
                </Link>
              </p>
              <p className="mt-2">
              Need access for your placement cell?{" "}
              <Link href="/request-access" className="text-[var(--red)]">
                Request early access
              </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
