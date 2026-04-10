"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { api, type ApiError } from "@/lib/api";
import { formatLongDate } from "@/lib/date";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AnalyticsOverview,
  ApiEnvelope,
  Intervention,
  PagedResponse,
  StudentMeResponse,
  VigiloScore,
} from "@/lib/types";

type ProfileRole = "tpc_admin" | "student";

type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role: ProfileRole;
};

type AdminStats = {
  totalStudents: number;
  openAlerts: number;
  activeInterventions: number;
};

type StudentSnapshot = {
  score: number;
  cluster: string;
  lastLogin: string;
};

function formatLastLogin(dateValue?: string | null): string {
  return formatLongDate(dateValue, "No recent login");
}

function scoreToneClass(score: number): string {
  if (score >= 70) {
    return "text-emerald-700";
  }

  if (score >= 40) {
    return "text-amber-700";
  }

  return "text-red-700";
}

function roleBadgeClass(role: ProfileRole): string {
  if (role === "tpc_admin") {
    return "bg-red-100 text-red-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function clusterBadgeClass(cluster: string): string {
  const normalized = cluster.toLowerCase();

  if (normalized.includes("ready")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("risk")) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  return "border-red-200 bg-red-100 text-red-700";
}

function errorMessageFrom(value: unknown): string {
  const maybeApiError = value as ApiError | undefined;
  return maybeApiError?.message || "Unable to load profile data";
}

export default function DashboardProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [studentSnapshot, setStudentSnapshot] = useState<StudentSnapshot | null>(null);

  const initials = useMemo(() => {
    if (!profile?.full_name) {
      return "VI";
    }

    const parts = profile.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "V";
    const second = parts[1]?.[0] ?? "I";
    return `${first}${second}`.toUpperCase();
  }, [profile?.full_name]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login");
          return;
        }

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", session.user.id)
          .single();

        if (!profileRow || !profileRow.role) {
          throw { message: "Profile not found", status: 404 } satisfies ApiError;
        }

        const normalizedRole = profileRow.role === "student" ? "student" : "tpc_admin";
        const profileData: ProfileRecord = {
          id: profileRow.id,
          full_name: profileRow.full_name || "Vigilo User",
          email: profileRow.email || session.user.email || "",
          role: normalizedRole,
        };

        if (!active) {
          return;
        }

        setProfile(profileData);

        if (normalizedRole === "tpc_admin") {
          const [overviewRes, interventionRes] = await Promise.all([
            api.get<ApiEnvelope<AnalyticsOverview>>("/api/v1/analytics/overview"),
            api.get<ApiEnvelope<PagedResponse<Intervention>>>("/api/v1/interventions", {
              page: 1,
              limit: 200,
            }),
          ]);

          const activeInterventions = interventionRes.data.items.filter(
            (item) => item.status !== "completed",
          ).length;

          if (!active) {
            return;
          }

          setAdminStats({
            totalStudents: overviewRes.data.total_students,
            openAlerts: overviewRes.data.alerts_open,
            activeInterventions,
          });
        } else {
          const [meRes, scoreRes] = await Promise.all([
            api.get<ApiEnvelope<StudentMeResponse>>("/api/v1/students/me"),
            api.get<ApiEnvelope<VigiloScore>>(`/api/v1/scores/${profileData.id}/latest`),
          ]);

          if (!active) {
            return;
          }

          setStudentSnapshot({
            score: Number(scoreRes.data.score || 0),
            cluster: String(scoreRes.data.cluster || "unknown"),
            lastLogin: formatLastLogin(meRes.data.student_profile?.last_portal_login),
          });
        }
      } catch (requestError) {
        if (active) {
          setError(errorMessageFrom(requestError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Profile</p>
        <h1 className="mt-3 font-[family-name:var(--font-dm-serif-display)] text-4xl leading-tight text-foreground">
          Account details
        </h1>

        {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading profile...</p> : null}

        {!loading && error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

        {!loading && !error && profile ? (
          <div className="mt-7 space-y-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
                  {initials}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] ${roleBadgeClass(profile.role)}`}
              >
                {profile.role === "tpc_admin" ? "TPC Admin" : "Student"}
              </span>
            </div>

            {profile.role === "tpc_admin" && adminStats ? (
              <div className="grid gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total Students</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{adminStats.totalStudents}</p>
                </article>
                <article className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Open Alerts</p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">{adminStats.openAlerts}</p>
                </article>
                <article className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Active Interventions</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{adminStats.activeInterventions}</p>
                </article>
              </div>
            ) : null}

            {profile.role === "student" && studentSnapshot ? (
              <div className="rounded-xl border border-border bg-background p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Vigilo Score</p>
                <p className={`mt-2 text-5xl font-semibold ${scoreToneClass(studentSnapshot.score)}`}>
                  {studentSnapshot.score}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] ${clusterBadgeClass(studentSnapshot.cluster)}`}
                  >
                    {studentSnapshot.cluster.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">Last login: {studentSnapshot.lastLogin}</span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-border pt-5">
              <Link href="/dashboard" className="rounded-[4px] border border-[rgba(26,26,26,0.18)] px-5 py-2 text-sm text-[var(--ink)]">
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-[4px] bg-[var(--red)] px-5 py-2 text-sm text-[var(--paper)]"
              >
                Logout
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
