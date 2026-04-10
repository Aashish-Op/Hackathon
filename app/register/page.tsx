"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { usePageTitle } from "@/lib/hooks/use-page-title";

const DEFAULT_ERROR_MESSAGE = "Unable to create account. Please try again.";

export default function RegisterPage() {
  usePageTitle("Create account - Vigilo");

  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"tpc_admin" | "student">("tpc_admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(payload.error || DEFAULT_ERROR_MESSAGE);
        return;
      }

      setSuccessMessage(payload.message || "Account created. Redirecting to login...");
      window.setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email.trim())}`);
      }, 850);
    } catch {
      setErrorMessage(DEFAULT_ERROR_MESSAGE);
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
          <Link href="/login" className="text-sm text-[var(--muted)]">
            Back to login
          </Link>
        </div>
      </header>

      <main className="px-6 py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-[1100px] gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <section className="border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-7 md:p-9">
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
              CREATE ACCOUNT
            </p>
            <h1 className="mt-5 max-w-[520px] font-[family-name:var(--font-dm-serif-display)] text-[36px] leading-[1.1] md:text-[48px]">
              Create your Vigilo account.
            </h1>
            <p className="mt-5 max-w-[520px] text-[16px] leading-[1.75] text-[var(--muted)]">
              Register once, then sign in from the login page to access your dashboard.
            </p>
          </section>

          <section className="border border-[rgba(26,26,26,0.15)] bg-[var(--paper)] p-7 md:p-9">
            <div className="mb-6 border-b border-[rgba(26,26,26,0.15)] pb-4">
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                REGISTRATION
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-dm-serif-display)] text-[30px] leading-[1.2]">
                Set up account
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  Full Name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  required
                  minLength={2}
                  className="w-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[var(--red)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  Work Email
                </span>
                <input
                  type="email"
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[var(--red)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  Account Type
                </span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value === "student" ? "student" : "tpc_admin")}
                  className="h-11 w-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] px-4 text-[15px] outline-none transition-colors focus:border-[var(--red)]"
                >
                  <option value="tpc_admin">TPC Admin</option>
                  <option value="student">Student</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[var(--red)] px-5 py-3 text-[15px] text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--paper)] border-t-transparent" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              {errorMessage ? <p className="mt-2 text-[12px] text-[var(--red)]">{errorMessage}</p> : null}
              {successMessage ? <p className="mt-2 text-[12px] text-emerald-700">{successMessage}</p> : null}
            </form>

            <div className="mt-5 border-t border-[rgba(26,26,26,0.15)] pt-5 text-center text-[14px] text-[var(--muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--red)]">
                Sign in
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
