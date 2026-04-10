"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  email: string;
  role: "tpc_admin";
  displayName: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const payload = (await response.json()) as {
          authenticated?: boolean;
          user?: SessionUser | null;
        };

        if (!active) {
          return;
        }

        if (payload.authenticated && payload.user) {
          setUser(payload.user);
        } else {
          setUser(null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Ignore logout network issues and route user home.
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-14 text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[760px] border border-[rgba(26,26,26,0.15)] bg-[var(--paper)] p-8 md:p-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
          PROFILE
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-dm-serif-display)] text-[38px] leading-[1.1]">
          Account details
        </h1>

        {loading ? (
          <p className="mt-6 text-[15px] text-[var(--muted)]">Loading session...</p>
        ) : user ? (
          <div className="mt-7 space-y-4 text-[15px] text-[var(--ink)]">
            <div>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Name
              </p>
              <p className="mt-1">{user.displayName}</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Email
              </p>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Role
              </p>
              <p className="mt-1">{user.role}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-[rgba(26,26,26,0.12)] pt-5">
              <Link href="/" className="rounded-[4px] border border-[rgba(26,26,26,0.18)] px-5 py-2 text-sm text-[var(--ink)]">
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-[4px] bg-[var(--red)] px-5 py-2 text-sm text-[var(--paper)]"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            <p className="text-[15px] text-[var(--muted)]">You are not signed in.</p>
            <Link href="/auth" className="inline-block rounded-[4px] bg-[var(--red)] px-5 py-2 text-sm text-[var(--paper)]">
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
