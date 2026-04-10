"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import {
  formatLongDate,
  formatRelativeDate,
  isDateOlderThanDays,
  toTimestamp,
} from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type {
  ActivityLog,
  Alert,
  ApiEnvelope,
  Intervention,
  StudentProfile,
  VigiloScore,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type StudentDetailResponse = {
  profile: StudentProfile;
  student_profile: {
    id: string;
    cgpa?: number | null;
    active_backlogs?: number;
    internship_count?: number;
    mock_tests_attempted?: number;
    mock_avg_score?: number | null;
    certifications_count?: number;
    placement_status?: string | null;
    company_placed?: string | null;
    last_portal_login?: string | null;
    resume_updated_at?: string | null;
  } | null;
};

type AlertsPaged = {
  page: number;
  limit: number;
  count: number;
  items: Alert[];
};

type InterventionType = "mock_assigned" | "counselling" | "domain_shift_suggested" | "nudge_sent";

const INTERVENTION_OPTIONS: InterventionType[] = [
  "mock_assigned",
  "counselling",
  "domain_shift_suggested",
  "nudge_sent",
];

const BREAKDOWN_PARTS: Array<{ key: string; label: string; color: string }> = [
  { key: "portal_activity_score", label: "Portal Activity", color: "bg-sky-500" },
  { key: "mock_test_score", label: "Mock Tests", color: "bg-violet-500" },
  { key: "skill_score", label: "Skills", color: "bg-emerald-500" },
  { key: "resume_score", label: "Resume", color: "bg-teal-500" },
  { key: "cgpa_score", label: "CGPA", color: "bg-amber-500" },
  { key: "application_score", label: "Applications", color: "bg-rose-500" },
  { key: "internship_score", label: "Internships", color: "bg-indigo-500" },
];

const ACTIVITY_COLOR: Record<string, string> = {
  portal_login: "bg-sky-500",
  mock_test: "bg-violet-500",
  skill_added: "bg-emerald-500",
  job_applied: "bg-amber-500",
  resume_update: "bg-teal-500",
};

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Failed to load student data";
}

function scoreColor(score: number): string {
  if (score < 35) {
    return "text-red-700";
  }

  if (score <= 65) {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

function clusterClass(cluster: string): string {
  const normalized = cluster.toLowerCase();

  if (normalized.includes("ready")) {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("silent")) {
    return "border-red-300 bg-red-100 text-red-700";
  }

  return "border-amber-300 bg-amber-100 text-amber-700";
}

function placementClass(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === "placed") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (normalized === "in_process" || normalized === "in process") {
    return "border-sky-300 bg-sky-100 text-sky-700";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

function toRelativeTime(dateValue?: string | null): string {
  return formatRelativeDate(dateValue, "No data");
}

function inactiveOver30(dateValue?: string | null): boolean {
  return isDateOlderThanDays(dateValue, 30);
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "V";
  const second = parts[1]?.[0] ?? "I";
  return `${first}${second}`.toUpperCase();
}

function friendlyActivity(activityType: string): string {
  return activityType.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(dateValue?: string | null): string {
  return formatLongDate(dateValue, "-");
}

function scoreBreakdown(score: VigiloScore | null): Array<{ key: string; label: string; value: number; color: string }> {
  const breakdown = (score?.score_breakdown || {}) as Record<string, unknown>;

  return BREAKDOWN_PARTS.map((entry) => ({
    ...entry,
    value: Number(breakdown[entry.key] || 0),
  })).filter((entry) => entry.value > 0);
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
      </div>
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-[rgba(26,26,26,0.06)]" />
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [detail, setDetail] = React.useState<StudentDetailResponse | null>(null);
  const [score, setScore] = React.useState<VigiloScore | null>(null);
  const [activities, setActivities] = React.useState<ActivityLog[]>([]);
  const [interventions, setInterventions] = React.useState<Intervention[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  const [interventionType, setInterventionType] = React.useState<InterventionType>("nudge_sent");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedMessage, setGeneratedMessage] = React.useState("");
  const [isEditingMessage, setIsEditingMessage] = React.useState(false);
  const [editableMessage, setEditableMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isRecomputing, setIsRecomputing] = React.useState(false);
  const [resolvingAlertId, setResolvingAlertId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentRes, scoreRes, activityRes, interventionRes, alertRes] = await Promise.all([
        api.get<ApiEnvelope<StudentDetailResponse>>(`/api/v1/students/${studentId}`),
        api.get<ApiEnvelope<VigiloScore>>(`/api/v1/scores/${studentId}/latest`),
        api.get<ApiEnvelope<ActivityLog[]>>(`/api/v1/students/${studentId}/activity`, { limit: 50 }),
        api.get<ApiEnvelope<Intervention[]>>(`/api/v1/interventions/${studentId}`),
        api.get<ApiEnvelope<AlertsPaged>>("/api/v1/alerts", {
          student_id: studentId,
          is_resolved: false,
          page: 1,
          limit: 20,
        }),
      ]);

      setDetail(studentRes.data);
      setScore(scoreRes.data);
      setActivities((activityRes.data || []).slice(0, 10));
      const sortedInterventions = [...(interventionRes.data || [])].sort((a, b) => {
        return toTimestamp(b.created_at, 0) - toTimestamp(a.created_at, 0);
      });
      setInterventions(sortedInterventions);
      setAlerts(alertRes.data.items || []);
    } catch (requestError) {
      setError(toApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRecomputeScore = async () => {
    setIsRecomputing(true);

    try {
      const response = await api.post<ApiEnvelope<VigiloScore>>(`/api/v1/scores/recompute/${studentId}`);
      setScore(response.data);
      toast("Score updated successfully", "success");
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message || "Something went wrong", "error");
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleGenerateNudge = async () => {
    setIsGenerating(true);

    try {
      const response = await api.post<ApiEnvelope<{ message: string }>>(`/api/v1/ai/nudge/${studentId}`, {
        intervention_type: interventionType,
      });
      const message = response.data.message || "";
      setGeneratedMessage(message);
      setEditableMessage(message);
      toast("AI nudge generated", "success");
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message || "Something went wrong", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNudge = async () => {
    if (!generatedMessage) {
      return;
    }

    setIsSending(true);

    try {
      const createRes = await api.post<ApiEnvelope<Intervention>>("/api/v1/interventions", {
        student_id: studentId,
        intervention_type: interventionType,
        custom_message: isEditingMessage ? editableMessage : generatedMessage,
        ai_generated_message: generatedMessage,
      });

      const interventionId = createRes.data.id;
      await api.patch<ApiEnvelope<Intervention>>(`/api/v1/interventions/${interventionId}/send`, {});

      await loadData();
      toast("Nudge sent to student", "success");
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message || "Something went wrong", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    setResolvingAlertId(alertId);

    try {
      await api.patch<ApiEnvelope<Alert>>(`/api/v1/alerts/${alertId}/resolve`, {});
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
      toast("Alert resolved", "success");
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message || "Something went wrong", "error");
    } finally {
      setResolvingAlertId(null);
    }
  };

  const latestSentNudge = interventions.find((item) => !!item.sent_at);
  const scoreValue = Number(score?.score || 0);
  const placementProbabilityRaw = Number(score?.placement_probability || 0);
  const placementProbability = placementProbabilityRaw <= 1 ? placementProbabilityRaw * 100 : placementProbabilityRaw;

  const parts = scoreBreakdown(score);
  const partsTotal = Math.max(1, parts.reduce((sum, part) => sum + part.value, 0));

  const profile = detail?.profile;
  const studentProfile = detail?.student_profile;
  usePageTitle(profile?.full_name ? `${profile.full_name} - Vigilo` : "Student - Vigilo");

  const lastSeen = studentProfile?.last_portal_login || profile?.last_portal_login || score?.computed_at;
  const inactivityRed = inactiveOver30(lastSeen);
  const displayCluster = String(score?.cluster || profile?.cluster || "at_risk").replaceAll("_", " ");
  const placementStatus = String(studentProfile?.placement_status || profile?.placement_status || "unplaced");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/students")}
          className="inline-flex items-center gap-1 rounded-md border border-[rgba(26,26,26,0.18)] px-3 py-2 text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>Failed to load student data</span>
          <button type="button" className="underline" onClick={() => void loadData()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <DetailSkeleton /> : null}

      {!loading && detail && profile ? (
        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold ${clusterClass(displayCluster)}`}>
                    {toInitials(profile.full_name)}
                  </div>
                  <div>
                    <h1 className="font-serif text-[28px] leading-tight text-[var(--ink)]">{profile.full_name}</h1>
                    <p className="text-sm text-[var(--muted)]">{profile.email}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {(profile.department || "Unknown").toUpperCase()} · Batch {profile.batch_year || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] ${clusterClass(displayCluster)}`}>
                    {displayCluster}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] ${placementClass(placementStatus)}`}>
                    {placementStatus.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <p className={`mt-4 text-sm ${inactivityRed ? "text-red-700" : "text-[var(--muted)]"}`}>
                Last active {toRelativeTime(lastSeen)}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-lg border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">CGPA</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{studentProfile?.cgpa ?? "-"}</p>
                </article>
                <article className="rounded-lg border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Internships</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{studentProfile?.internship_count ?? 0}</p>
                </article>
                <article className="rounded-lg border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Mock Tests</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{studentProfile?.mock_tests_attempted ?? 0}</p>
                </article>
                <article className="rounded-lg border border-border bg-background px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Certifications</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{studentProfile?.certifications_count ?? 0}</p>
                </article>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Vigilo Score</p>
                  <p className={`mt-2 text-[72px] leading-[0.95] font-semibold ${scoreColor(scoreValue)}`}>
                    {scoreValue.toFixed(1)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Placement Probability: {placementProbability.toFixed(1)}%
                  </p>
                </div>

                <Button onClick={handleRecomputeScore} disabled={isRecomputing}>
                  {isRecomputing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isRecomputing ? "Recomputing..." : "Recompute Score"}
                </Button>
              </div>

              <div className="mt-5">
                <div className="flex h-3 overflow-hidden rounded-full border border-border bg-[rgba(26,26,26,0.08)]">
                  {parts.map((part) => {
                    const width = (part.value / partsTotal) * 100;
                    return <div key={part.key} className={part.color} style={{ width: `${width}%` }} />;
                  })}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {parts.map((part) => (
                    <div key={part.key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${part.color}`} />
                        <span className="text-xs text-[var(--muted)]">{part.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--ink)]">{part.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">Activity Timeline</h2>
              <div className="mt-4 space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No recent activity</p>
                ) : (
                  activities.slice(0, 10).map((item) => {
                    const color = ACTIVITY_COLOR[item.activity_type] || "bg-slate-400";
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2.5">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[var(--ink)]">{friendlyActivity(item.activity_type)}</p>
                          <p className="text-xs text-[var(--muted)]">{toRelativeTime(item.logged_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">AI Nudge Generator</h2>

              <div className="mt-4 space-y-3">
                <select
                  value={interventionType}
                  onChange={(event) => setInterventionType(event.target.value as InterventionType)}
                  className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
                >
                  {INTERVENTION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <Button onClick={handleGenerateNudge} disabled={isGenerating} className="w-full">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isGenerating ? "Vigilo is writing..." : "Generate AI Nudge"}
                </Button>
              </div>

              {generatedMessage ? (
                <div className="mt-4 rounded-md border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-4">
                  <div className="border-l-2 border-[var(--red)] pl-3">
                    {isEditingMessage ? (
                      <Textarea value={editableMessage} onChange={(event) => setEditableMessage(event.target.value)} className="min-h-28 bg-[var(--paper)]" />
                    ) : (
                      <p className="font-serif text-[15px] leading-7 text-[var(--ink)]">{generatedMessage}</p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button onClick={handleSendNudge} disabled={isSending}>
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isSending ? "Sending..." : "Send to Student"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMessage((current) => !current)}
                      className="text-sm text-[var(--red)] underline-offset-2 hover:underline"
                    >
                      {isEditingMessage ? "Done" : "Edit"}
                    </button>
                  </div>
                </div>
              ) : null}

              <p className="mt-4 text-xs text-[var(--muted)]">
                Last sent nudge: {latestSentNudge?.sent_at ? formatDateTime(latestSentNudge.sent_at) : "Not sent yet"}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">Open Alerts</h2>

              <div className="mt-4 space-y-3">
                {alerts.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    No active alerts
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="rounded-md border border-border bg-background px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${alert.severity === "critical" ? "bg-red-500" : alert.severity === "high" ? "bg-amber-500" : "bg-sky-500"}`} />
                          <p className="text-sm font-medium text-[var(--ink)]">{alert.alert_type.replaceAll("_", " ")}</p>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-[var(--red)] underline-offset-2 hover:underline disabled:opacity-60"
                          disabled={resolvingAlertId === alert.id}
                          onClick={() => void handleResolveAlert(alert.id)}
                        >
                          {resolvingAlertId === alert.id ? "Resolving..." : "Resolve"}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">{toRelativeTime(alert.triggered_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[var(--ink)]">Intervention History</h2>
                <Link href="/dashboard/interventions" className="text-xs text-[var(--red)] underline-offset-2 hover:underline">
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {interventions.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-md border border-border bg-background px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--ink)]">{item.intervention_type.replaceAll("_", " ")}</p>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${item.status === "completed" ? "border-emerald-300 bg-emerald-100 text-emerald-700" : item.status === "pending" ? "border-amber-300 bg-amber-100 text-amber-700" : "border-slate-300 bg-slate-100 text-slate-700"}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.created_at)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                      {(item.custom_message || item.ai_generated_message || "No message").slice(0, 60)}
                    </p>
                  </div>
                ))}

                {interventions.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No intervention history</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
