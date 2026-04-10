"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type StatusTone = "idle" | "error" | "success" | "info";

type AuthStatus = {
  tone: StatusTone;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loadingPasswordSignIn, setLoadingPasswordSignIn] = useState(false);
  const [loadingSsoSignIn, setLoadingSsoSignIn] = useState(false);
  const [checkingExistingSession, setCheckingExistingSession] = useState(true);
  const [status, setStatus] = useState<AuthStatus>({ tone: "idle", message: "" });

  useEffect(() => {
    let active = true;

    const loadExistingSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { authenticated?: boolean };
        if (active && payload.authenticated) {
          router.replace("/");
        }
      } catch {
        // Ignore session-check errors and keep auth form available.
      } finally {
        if (active) {
          setCheckingExistingSession(false);
        }
      }
    };

    void loadExistingSession();
    return () => {
      active = false;
    };
  }, [router]);

  const runLogin = async (provider: "password" | "sso") => {
    const activeEmail = email.trim();

    if (!EMAIL_PATTERN.test(activeEmail)) {
      setStatus({ tone: "error", message: "Enter a valid work email to continue." });
      return;
    }

    if (provider === "password" && password.length < 8) {
      setStatus({ tone: "error", message: "Password must be at least 8 characters." });
      return;
    }

    setStatus({ tone: "info", message: provider === "sso" ? "Connecting to SSO..." : "Signing in..." });

    if (provider === "password") {
      setLoadingPasswordSignIn(true);
    } else {
      setLoadingSsoSignIn(true);
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: activeEmail,
          password,
          provider,
          remember,
        }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus({ tone: "error", message: payload.error ?? "Unable to sign in." });
        return;
      }

      setStatus({ tone: "success", message: payload.message ?? "Signed in. Redirecting..." });
      window.setTimeout(() => {
        router.push("/");
      }, 450);
    } catch {
      setStatus({ tone: "error", message: "Network error. Please try again." });
    } finally {
      setLoadingPasswordSignIn(false);
      setLoadingSsoSignIn(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runLogin("password");
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
                <button
                  type="button"
                  onClick={() => setStatus({ tone: "info", message: "Password reset link sent to your email." })}
                  className="text-[14px] text-[var(--muted)] underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={checkingExistingSession || loadingPasswordSignIn || loadingSsoSignIn}
                className="mt-2 w-full rounded-[4px] bg-[var(--red)] px-5 py-3 text-[15px] text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingExistingSession ? "Checking session..." : loadingPasswordSignIn ? "Signing In..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => runLogin("sso")}
                disabled={checkingExistingSession || loadingPasswordSignIn || loadingSsoSignIn}
                className="w-full border border-[rgba(26,26,26,0.2)] bg-transparent px-5 py-3 text-[15px] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSsoSignIn ? "Connecting..." : "Continue with SSO"}
              </button>
            </form>

            <div aria-live="polite" className="mt-4 min-h-6 text-[14px]">
              {status.tone === "error" ? <p className="text-[var(--red)]">{status.message}</p> : null}
              {status.tone === "success" ? <p className="text-[var(--ink)]">{status.message}</p> : null}
              {status.tone === "info" ? <p className="text-[var(--muted)]">{status.message}</p> : null}
            </div>

            <div className="mt-2 border-t border-[rgba(26,26,26,0.15)] pt-5 text-center text-[14px] text-[var(--muted)]">
              Need access for your placement cell?{" "}
              <Link href="/#final-cta" className="text-[var(--red)]">
                Request early access
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
