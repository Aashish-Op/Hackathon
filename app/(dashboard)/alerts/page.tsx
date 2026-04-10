"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import { formatRelativeDate, parseDateInput, toTimestamp } from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { Alert, ApiEnvelope, PagedResponse, StudentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
type AlertTypeFilter = "all" | "silent_30" | "score_drop" | "cluster_change" | "no_resume" | "zero_mocks";
type StatusFilter = "unresolved" | "resolved" | "all";
type DateRangeFilter = "7d" | "30d" | "all";

type AlertGroup = {
  label: "Today" | "This week" | "Earlier";
  items: Alert[];
};

const SEVERITY_OPTIONS: Array<{ label: string; value: SeverityFilter }> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const TYPE_OPTIONS: Array<{ label: string; value: AlertTypeFilter }> = [
  { label: "All", value: "all" },
  { label: "silent_30", value: "silent_30" },
  { label: "score_drop", value: "score_drop" },
  { label: "cluster_change", value: "cluster_change" },
  { label: "no_resume", value: "no_resume" },
  { label: "zero_mocks", value: "zero_mocks" },
];

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Unresolved", value: "unresolved" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
];

const DATE_RANGE_OPTIONS: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "All", value: "all" },
];

const ALERT_TYPE_LABEL: Record<string, string> = {
  silent_30: "Silent for 30+ days",
  score_drop: "Score dropped 15 points",
  cluster_change: "Cluster changed to dropout",
  no_resume: "Resume not updated",
  zero_mocks: "Zero mock tests",
};

const SEVERITY_BAR: Record<string, string> = {
  critical: "#C0392B",
  high: "#E67E22",
  medium: "#F1C40F",
  low: "#27AE60",
};

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Request failed";
}

function toRelativeTime(dateValue?: string | null): string {
  return formatRelativeDate(dateValue, "just now");
}

function isInDateRange(timestamp: string, range: DateRangeFilter): boolean {
  if (range === "all") {
    return true;
  }

  const time = toTimestamp(timestamp, Number.NaN);
  if (Number.isNaN(time)) {
    return false;
  }

  const now = Date.now();
  const limitDays = range === "7d" ? 7 : 30;
  return now - time <= limitDays * 24 * 60 * 60 * 1000;
}

function isToday(timestamp: string): boolean {
  const date = parseDateInput(timestamp);
  if (!date) {
    return false;
  }

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(timestamp: string): boolean {
  const time = toTimestamp(timestamp, Number.NaN);
  if (Number.isNaN(time)) {
    return false;
  }

  if (isToday(timestamp)) {
    return false;
  }

  return Date.now() - time <= 7 * 24 * 60 * 60 * 1000;
}

function severityBadgeClass(severity: Alert["severity"]): string {
  if (severity === "critical") {
    return "border-red-300 bg-red-100 text-red-700";
  }

  if (severity === "high") {
    return "border-orange-300 bg-orange-100 text-orange-700";
  }

  if (severity === "medium") {
    return "border-amber-300 bg-amber-100 text-amber-700";
  }

  return "border-emerald-300 bg-emerald-100 text-emerald-700";
}

function SkeletonCard() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="absolute left-0 top-0 h-full w-1 bg-[rgba(26,26,26,0.12)]" />
      <div className="ml-3 space-y-3">
        <div className="h-5 w-24 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
        <div className="h-4 w-56 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
        <div className="h-4 w-44 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
        <div className="h-16 w-full animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
        <div className="h-9 w-44 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
      </div>
    </article>
  );
}

export default function AlertsPage() {
  usePageTitle("Risk Alerts - Vigilo");

  const router = useRouter();
  const { toast } = useToast();

  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [batchYearByStudentId, setBatchYearByStudentId] = React.useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);
  const [readingId, setReadingId] = React.useState<string | null>(null);
  const [exitingIds, setExitingIds] = React.useState<Set<string>>(new Set());

  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<AlertTypeFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("unresolved");
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRangeFilter>("30d");

  const loadAlerts = React.useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const [alertsResponse, studentsResponse] = await Promise.all([
        api.get<ApiEnvelope<PagedResponse<Alert>>>("/api/v1/alerts", {
          page: 1,
          limit: 300,
        }),
        api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
          limit: 500,
          offset: 0,
        }),
      ]);

      setAlerts(alertsResponse.data.items || []);
      const nextBatchYearMap: Record<string, number | null> = {};
      (studentsResponse.data || []).forEach((student) => {
        nextBatchYearMap[student.id] = student.batch_year ?? null;
      });
      setBatchYearByStudentId(nextBatchYearMap);
    } catch (requestError) {
      setError(toApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const unresolvedCount = React.useMemo(() => {
    return alerts.filter((item) => !item.is_resolved).length;
  }, [alerts]);

  const filteredAlerts = React.useMemo(() => {
    return alerts
      .filter((item) => {
        if (severityFilter !== "all" && item.severity !== severityFilter) {
          return false;
        }

        if (typeFilter !== "all" && item.alert_type !== typeFilter) {
          return false;
        }

        if (statusFilter === "unresolved" && item.is_resolved) {
          return false;
        }

        if (statusFilter === "resolved" && !item.is_resolved) {
          return false;
        }

        if (!isInDateRange(item.triggered_at, dateRangeFilter)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => new Date(right.triggered_at).getTime() - new Date(left.triggered_at).getTime());
  }, [alerts, dateRangeFilter, severityFilter, statusFilter, typeFilter]);

  const groupedAlerts = React.useMemo<AlertGroup[]>(() => {
    const today: Alert[] = [];
    const thisWeek: Alert[] = [];
    const earlier: Alert[] = [];

    filteredAlerts.forEach((item) => {
      if (isToday(item.triggered_at)) {
        today.push(item);
        return;
      }

      if (isThisWeek(item.triggered_at)) {
        thisWeek.push(item);
        return;
      }

      earlier.push(item);
    });

    const groups: AlertGroup[] = [
      { label: "Today", items: today },
      { label: "This week", items: thisWeek },
      { label: "Earlier", items: earlier },
    ];

    return groups.filter((group) => group.items.length > 0);
  }, [filteredAlerts]);

  const unreadAlertIds = React.useMemo(() => {
    return alerts.filter((item) => !item.is_read).map((item) => item.id);
  }, [alerts]);

  const handleMarkRead = async (alertId: string) => {
    setReadingId(alertId);

    try {
      await api.patch<ApiEnvelope<Alert>>(`/api/v1/alerts/${alertId}/read`, {});
      setAlerts((current) =>
        current.map((item) => (item.id === alertId ? { ...item, is_read: true } : item)),
      );
      toast({ title: "Alert marked as read", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Unable to mark read",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setReadingId(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    setExitingIds((current) => new Set(current).add(alertId));

    try {
      await api.patch<ApiEnvelope<Alert>>(`/api/v1/alerts/${alertId}/resolve`, {});
      window.setTimeout(() => {
        setAlerts((current) => current.filter((item) => item.id !== alertId));
        setExitingIds((current) => {
          const next = new Set(current);
          next.delete(alertId);
          return next;
        });
      }, 220);
      toast({ title: "Alert resolved", variant: "success" });
    } catch (requestError) {
      setExitingIds((current) => {
        const next = new Set(current);
        next.delete(alertId);
        return next;
      });
      toast({
        title: "Unable to resolve alert",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadAlertIds.length === 0) {
      return;
    }

    setIsMarkingAllRead(true);

    try {
      await Promise.all(
        unreadAlertIds.map((alertId) =>
          api.patch<ApiEnvelope<Alert>>(`/api/v1/alerts/${alertId}/read`, {}),
        ),
      );

      setAlerts((current) => current.map((item) => ({ ...item, is_read: true })));
      toast({ title: "All alerts marked as read", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Unable to mark all as read",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const emptyLabel = React.useMemo(() => {
    if (severityFilter !== "all") {
      return `No ${severityFilter} alerts - great news.`;
    }

    if (statusFilter === "resolved") {
      return "No resolved alerts for this range.";
    }

    if (statusFilter === "unresolved") {
      return "No unresolved alerts. Your students are on track.";
    }

    return "No alerts match the current filters.";
  }, [severityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-4xl leading-tight text-foreground">Risk Alerts</h1>
            <div className="mt-3 inline-flex items-center gap-2">
              <span className="inline-flex rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-red-700">
                {unresolvedCount} unresolved
              </span>
            </div>
          </div>

          <Button onClick={handleMarkAllRead} disabled={isMarkingAllRead || unreadAlertIds.length === 0}>
            {isMarkingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isMarkingAllRead ? "Marking..." : "Mark all read"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as AlertTypeFilter)}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={dateRangeFilter}
              onChange={(event) => setDateRangeFilter(event.target.value as DateRangeFilter)}
              className="h-10 flex-1 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void loadAlerts(true)} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadAlerts()}
            className="underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </section>
      ) : null}

      {!isLoading && filteredAlerts.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold text-[var(--ink)]">{emptyLabel}</p>
        </section>
      ) : null}

      {!isLoading && filteredAlerts.length > 0 ? (
        <section className="space-y-8">
          {groupedAlerts.map((group) => (
            <div key={group.label} className="space-y-3">
              <h2 className="font-serif text-2xl text-[var(--ink)]">{group.label}</h2>
              <div className="space-y-3">
                {group.items.map((alert) => {
                  const batchYear = batchYearByStudentId[alert.student_id];
                  const typeLabel = ALERT_TYPE_LABEL[alert.alert_type] || alert.alert_type.replaceAll("_", " ");
                  const barColor = SEVERITY_BAR[alert.severity] || "#C0392B";
                  const isExiting = exitingIds.has(alert.id);

                  return (
                    <article
                      key={alert.id}
                      className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 ${isExiting ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
                    >
                      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: barColor }} />

                      <div className="ml-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.1em] text-[var(--muted)]">{typeLabel}</p>
                            <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
                              <Link href={`/students/${alert.student_id}`} className="underline-offset-2 hover:underline">
                                {alert.student_name || "Student"}
                              </Link>
                              <span className="text-sm font-normal text-[var(--muted)]">{` • ${(alert.student_department || "Unknown").toUpperCase()} • Batch ${batchYear || "-"}`}</span>
                            </p>
                          </div>

                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] ${severityBadgeClass(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-[var(--muted)]">Triggered {toRelativeTime(alert.triggered_at)}</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--ink)]">{alert.message}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/students/${alert.student_id}`)}>
                            View Student
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => void handleResolve(alert.id)}
                            disabled={resolvingId === alert.id}
                          >
                            {resolvingId === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {resolvingId === alert.id ? "Resolving..." : "Resolve"}
                          </Button>

                          {!alert.is_read ? (
                            <button
                              type="button"
                              onClick={() => void handleMarkRead(alert.id)}
                              disabled={readingId === alert.id}
                              className="inline-flex items-center rounded-md border border-[rgba(26,26,26,0.2)] px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)] disabled:opacity-60"
                            >
                              {readingId === alert.id ? "Marking..." : "Mark Read"}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
