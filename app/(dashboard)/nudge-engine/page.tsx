"use client";

import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import { formatRelativeDate } from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { ApiEnvelope, StudentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type ClusterKey = "silent_dropout" | "at_risk" | "placement_ready";
type UiInterventionType = "mock_assigned" | "counselling" | "domain_shift" | "weekly_check_in";

type BulkNudgeResult = {
  student_id: string;
  intervention_id?: string;
  message: string;
};

const CLUSTER_META: Record<
  ClusterKey,
  {
    label: string;
    description: string;
    accent: string;
    border: string;
    bg: string;
  }
> = {
  silent_dropout: {
    label: "Silent Dropout",
    description: "Students inactive 30+ days",
    accent: "#C0392B",
    border: "border-red-300",
    bg: "bg-red-100",
  },
  at_risk: {
    label: "At Risk",
    description: "Declining scores and low engagement",
    accent: "#E67E22",
    border: "border-orange-300",
    bg: "bg-orange-100",
  },
  placement_ready: {
    label: "Placement Ready",
    description: "Boost with final prep nudges",
    accent: "#27AE60",
    border: "border-emerald-300",
    bg: "bg-emerald-100",
  },
};

const INTERVENTION_OPTIONS: Array<{ label: string; value: UiInterventionType }> = [
  { label: "mock_assigned", value: "mock_assigned" },
  { label: "counselling", value: "counselling" },
  { label: "domain_shift", value: "domain_shift" },
  { label: "weekly_check_in", value: "weekly_check_in" },
];

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Request failed";
}

function normalizeCluster(cluster: string | null | undefined): ClusterKey {
  const value = (cluster || "").toLowerCase();

  if (value.includes("placement") || value.includes("ready")) {
    return "placement_ready";
  }

  if (value.includes("silent")) {
    return "silent_dropout";
  }

  return "at_risk";
}

function scoreOf(student: StudentProfile): number {
  return Number(student.risk_score || 0);
}

function lastActiveOf(student: StudentProfile): string | null {
  return student.last_portal_login || student.score_computed_at || null;
}

function toRelativeTime(dateValue?: string | null): string {
  return formatRelativeDate(dateValue, "No activity");
}

function toApiInterventionType(value: UiInterventionType): string {
  if (value === "domain_shift") {
    return "domain_shift_suggested";
  }

  return value;
}

function SkeletonClusterCard() {
  return <div className="h-36 animate-pulse rounded-xl border border-border bg-[rgba(26,26,26,0.08)]" />;
}

export default function NudgeEnginePage() {
  usePageTitle("Nudge Engine - Vigilo");

  const { toast } = useToast();

  const [students, setStudents] = React.useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [selectedClusters, setSelectedClusters] = React.useState<Set<ClusterKey>>(new Set(["silent_dropout"]));
  const [selectedInterventionType, setSelectedInterventionType] = React.useState<UiInterventionType>("weekly_check_in");

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generated, setGenerated] = React.useState<BulkNudgeResult[]>([]);
  const [isSendingAll, setIsSendingAll] = React.useState(false);
  const [sentInterventionIds, setSentInterventionIds] = React.useState<Set<string>>(new Set());

  const loadStudents = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
        limit: 500,
        offset: 0,
      });
      setStudents(response.data || []);
    } catch (requestError) {
      setError(toApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const countsByCluster = React.useMemo(() => {
    const counts: Record<ClusterKey, number> = {
      silent_dropout: 0,
      at_risk: 0,
      placement_ready: 0,
    };

    students.forEach((student) => {
      counts[normalizeCluster(student.cluster)] += 1;
    });

    return counts;
  }, [students]);

  const recipients = React.useMemo(() => {
    if (selectedClusters.size === 0) {
      return [];
    }

    return students
      .filter((student) => selectedClusters.has(normalizeCluster(student.cluster)))
      .sort((left, right) => scoreOf(left) - scoreOf(right));
  }, [selectedClusters, students]);

  const previewRecipients = recipients.slice(0, 5);
  const extraCount = Math.max(0, recipients.length - previewRecipients.length);

  const toggleCluster = (cluster: ClusterKey) => {
    setSelectedClusters((current) => {
      const next = new Set(current);
      if (next.has(cluster)) {
        next.delete(cluster);
      } else {
        next.add(cluster);
      }
      return next;
    });
  };

  const handleGenerateNudges = async () => {
    if (recipients.length === 0) {
      toast({ title: "Select at least one cluster", variant: "info" });
      return;
    }

    setIsGenerating(true);
    setGenerated([]);
    setGenerationProgress(0);

    const target = recipients.length;
    const step = Math.max(1, Math.ceil(target / 25));
    const timer = window.setInterval(() => {
      setGenerationProgress((current) => Math.min(target, current + step));
    }, 80);

    try {
      const response = await api.post<ApiEnvelope<BulkNudgeResult[]>>("/api/v1/ai/nudge/bulk", {
        student_ids: recipients.map((student) => student.id),
        intervention_type: toApiInterventionType(selectedInterventionType),
      });

      setGenerationProgress(target);
      setGenerated(response.data || []);
      setSentInterventionIds(new Set());
      toast({ title: `${response.data.length} nudges generated`, variant: "success" });
    } catch (requestError) {
      toast({
        title: "Failed to generate nudges",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      window.clearInterval(timer);
      setIsGenerating(false);
    }
  };

  const handleSendAll = async () => {
    const pendingIds = generated
      .map((item) => item.intervention_id)
      .filter((id): id is string => !!id && !sentInterventionIds.has(id));

    if (pendingIds.length === 0) {
      toast({ title: "No pending nudges to send", variant: "info" });
      return;
    }

    setIsSendingAll(true);

    try {
      const results = await Promise.allSettled(
        pendingIds.map((id) => api.patch<ApiEnvelope<unknown>>(`/api/v1/interventions/${id}/send`, {})),
      );

      const sentCount = results.filter((result) => result.status === "fulfilled").length;
      if (sentCount > 0) {
        setSentInterventionIds((current) => {
          const next = new Set(current);
          pendingIds.forEach((id, index) => {
            if (results[index]?.status === "fulfilled") {
              next.add(id);
            }
          });
          return next;
        });
        toast({ title: `${sentCount} nudges sent`, variant: "success" });
      } else {
        toast({ title: "No nudges were sent", variant: "error" });
      }
    } catch (requestError) {
      toast({
        title: "Failed to send nudges",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h1 className="font-serif text-4xl leading-tight text-foreground">Nudge Engine</h1>
        <p className="mt-2 text-sm text-muted-foreground">Generate and send personalised AI interventions at scale.</p>
      </section>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadStudents()} className="underline-offset-2 hover:underline">
            Retry
          </button>
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-[var(--ink)]">Select Recipients by Cluster</h2>

        <div className="grid gap-3 md:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonClusterCard />
              <SkeletonClusterCard />
              <SkeletonClusterCard />
            </>
          ) : (
            (Object.keys(CLUSTER_META) as ClusterKey[]).map((cluster) => {
              const isSelected = selectedClusters.has(cluster);
              const meta = CLUSTER_META[cluster];

              return (
                <button
                  key={cluster}
                  type="button"
                  onClick={() => toggleCluster(cluster)}
                  className={`rounded-xl border p-4 text-left transition-all ${isSelected ? `${meta.border} ${meta.bg}` : "border-[rgba(26,26,26,0.16)] bg-transparent hover:bg-[rgba(26,26,26,0.03)]"}`}
                >
                  <p className="font-serif text-xl text-[var(--ink)]">{meta.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{meta.description}</p>
                  <p className="mt-3 text-3xl font-semibold" style={{ color: meta.accent }}>
                    {countsByCluster[cluster]}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-[var(--ink)]">Intervention Type</h2>
        <div className="flex flex-wrap gap-2">
          {INTERVENTION_OPTIONS.map((option) => {
            const active = selectedInterventionType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedInterventionType(option.value)}
                className={`rounded-full border px-3 py-1.5 text-sm ${active ? "border-red-300 bg-red-100 text-red-700" : "border-[rgba(26,26,26,0.2)] bg-transparent text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-[var(--ink)]">Preview Recipients</h2>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-[rgba(26,26,26,0.2)] bg-[var(--tint)]">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Student</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Score</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {previewRecipients.length > 0 ? (
                previewRecipients.map((student) => (
                  <tr key={student.id} className="border-b border-[rgba(26,26,26,0.1)]">
                    <td className="px-3 py-2 text-sm text-[var(--ink)]">
                      <Link href={`/students/${student.id}`} className="underline-offset-2 hover:underline">
                        {student.full_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--ink)]">{scoreOf(student).toFixed(1)}</td>
                    <td className="px-3 py-2 text-sm text-[var(--ink)]">{toRelativeTime(lastActiveOf(student))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-[var(--muted)]">
                    Select one or more clusters to preview recipients
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {extraCount > 0 ? (
          <p className="text-sm text-[var(--muted)]">and {extraCount} more students</p>
        ) : null}

        <Button className="w-full" onClick={() => void handleGenerateNudges()} disabled={isGenerating || recipients.length === 0}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating ? `Generating personalised nudges for ${recipients.length} students...` : "Generate Nudges"}
        </Button>

        {isGenerating ? (
          <div className="rounded-lg border border-[rgba(26,26,26,0.18)] bg-[var(--tint)] px-4 py-3 text-sm text-[var(--ink)]">
            {generationProgress}/{recipients.length} generated
          </div>
        ) : null}
      </section>

      {generated.length > 0 ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-2xl text-[var(--ink)]">Results</h2>
            <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {generated.length} nudges generated successfully
            </span>
          </div>

          <div className="space-y-3">
            {generated.slice(0, 3).map((entry) => {
              const student = students.find((item) => item.id === entry.student_id);

              return (
                <article key={`${entry.student_id}-${entry.intervention_id || "no-id"}`} className="rounded-lg border border-[rgba(26,26,26,0.16)] bg-[var(--tint)] p-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{student?.full_name || "Student"}</p>
                  <p className="mt-2 border-l-2 border-[var(--red)] pl-3 text-sm leading-6 text-[var(--ink)]">{entry.message}</p>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void handleSendAll()} disabled={isSendingAll}>
              {isSendingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSendingAll ? "Sending..." : "Send All"}
            </Button>
            <Link href="/interventions?status=pending" className="text-sm text-[var(--red)] underline-offset-2 hover:underline">
              Review individually
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
