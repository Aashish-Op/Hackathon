"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiEnvelope, StudentMeResponse } from "@/lib/types";

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Failed to load profile";
}

function toDisplayName(candidate?: string | null): string {
  if (!candidate) {
    return "Student";
  }

  return candidate.trim() || "Student";
}

export default function StudentGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [studentName, setStudentName] = React.useState("Student");
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    const loadStudentName = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const fallbackName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email ||
          "Student";

        setStudentName(toDisplayName(fallbackName));

        try {
          const response = await api.get<ApiEnvelope<StudentMeResponse>>("/api/v1/students/me");

          if (!active) {
            return;
          }

          setStudentName(toDisplayName(response.data?.profile?.full_name || fallbackName));
        } catch {
          if (active) {
            setStudentName(toDisplayName(fallbackName));
          }
        }
      } catch (error) {
        if (active) {
          console.error("Failed to resolve student session:", toApiErrorMessage(error));
          router.replace("/login");
        }
      }
    };

    void loadStudentName();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-30 border-b border-[rgba(26,26,26,0.15)] bg-[var(--paper)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/student/dashboard" className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
            <span className="font-[family-name:var(--font-dm-serif-display)] text-[22px] text-[var(--ink)]">
              Vigilo
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <p className="max-w-[160px] truncate text-sm text-[var(--muted-foreground)] sm:max-w-none">
              {studentName}
            </p>
            <button
              className="rounded-lg border border-[rgba(26,26,26,0.18)] px-3 py-1.5 text-sm text-[var(--ink)] transition hover:bg-[var(--tint)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleLogout}
              type="button"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
