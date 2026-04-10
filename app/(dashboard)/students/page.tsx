"use client";
import { useRouter } from "next/navigation";
import { Download, Loader2, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import {
  formatDateForFileName,
  formatRelativeDate,
  isDateOlderThanDays,
  toTimestamp,
} from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { ApiEnvelope, Intervention, StudentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;
const DEPARTMENT_OPTIONS = ["All", "CSE", "IT", "ECE", "MECH", "CIVIL", "MBA"] as const;
const BATCH_OPTIONS = ["All", "2025", "2026"] as const;

type ClusterFilter = "all" | "placement_ready" | "at_risk" | "silent_dropout";
type SortOption = "score_asc" | "score_desc" | "name" | "last_active";

type ClusterOption = {
  label: string;
  value: ClusterFilter;
  className: string;
};

const CLUSTER_OPTIONS: ClusterOption[] = [
  {
    label: "All",
    value: "all",
    className: "border-[rgba(26,26,26,0.18)] bg-transparent text-[var(--ink)]",
  },
  {
    label: "Placement Ready",
    value: "placement_ready",
    className: "border-emerald-300 bg-emerald-100 text-emerald-700",
  },
  {
    label: "At Risk",
    value: "at_risk",
    className: "border-amber-300 bg-amber-100 text-amber-700",
  },
  {
    label: "Silent Dropout",
    value: "silent_dropout",
    className: "border-red-300 bg-red-100 text-red-700",
  },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: "Vigilo Score (asc)", value: "score_asc" },
  { label: "Score (desc)", value: "score_desc" },
  { label: "Name", value: "name" },
  { label: "Last Active", value: "last_active" },
];

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Failed to load students";
}

function getScore(student: StudentProfile): number {
  return Number(student.risk_score || 0);
}

function scoreColorClass(score: number): string {
  if (score < 35) {
    return "text-red-700";
  }

  if (score <= 65) {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

function scoreBarClass(score: number): string {
  if (score < 35) {
    return "bg-red-500";
  }

  if (score <= 65) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

function normalizeCluster(cluster: string | null | undefined): ClusterFilter {
  const value = (cluster || "").toLowerCase();

  if (value.includes("placement") || value.includes("ready")) {
    return "placement_ready";
  }

  if (value.includes("silent")) {
    return "silent_dropout";
  }

  return "at_risk";
}

function clusterLabel(value: ClusterFilter): string {
  if (value === "placement_ready") {
    return "Placement Ready";
  }

  if (value === "silent_dropout") {
    return "Silent Dropout";
  }

  return "At Risk";
}

function clusterPillClass(value: ClusterFilter): string {
  if (value === "placement_ready") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (value === "silent_dropout") {
    return "border-red-300 bg-red-100 text-red-700";
  }

  return "border-amber-300 bg-amber-100 text-amber-700";
}

function placementStatusLabel(status: string | null | undefined): "Placed" | "Unplaced" | "In Process" {
  const normalized = (status || "").toLowerCase();

  if (normalized === "placed") {
    return "Placed";
  }

  if (normalized === "in_process" || normalized === "in process") {
    return "In Process";
  }

  return "Unplaced";
}

function placementStatusClass(status: "Placed" | "Unplaced" | "In Process"): string {
  if (status === "Placed") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (status === "In Process") {
    return "border-sky-300 bg-sky-100 text-sky-700";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
}

function getLastActive(student: StudentProfile): string | null {
  return student.last_portal_login || student.score_computed_at || null;
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "V";
  const second = parts[1]?.[0] ?? "I";
  return `${first}${second}`.toUpperCase();
}

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-[rgba(26,26,26,0.1)]">
          <td className="px-3 py-3">
            <div className="h-10 w-full animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
          </td>
          <td className="px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" />
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
                <div className="h-3 w-40 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
              </div>
            </div>
          </td>
          <td className="px-3 py-3"><div className="h-3 w-16 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3">
            <div className="space-y-2">
              <div className="h-3 w-10 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
              <div className="h-2 w-24 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
            </div>
          </td>
          <td className="px-3 py-3"><div className="h-6 w-28 animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-3 w-20 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-24 animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-8 w-8 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AllStudentsPage() {
  usePageTitle("All Students - Vigilo");

  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [department, setDepartment] = React.useState<(typeof DEPARTMENT_OPTIONS)[number]>("All");
  const [cluster, setCluster] = React.useState<ClusterFilter>("all");
  const [batchYear, setBatchYear] = React.useState<(typeof BATCH_OPTIONS)[number]>("All");
  const [sortBy, setSortBy] = React.useState<SortOption>("score_desc");
  const [page, setPage] = React.useState(1);
  const [students, setStudents] = React.useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionMessage, setActionMessage] = React.useState("");
  const [openMenuFor, setOpenMenuFor] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [nudgeLoadingId, setNudgeLoadingId] = React.useState<string | null>(null);
  const [interventionLoadingId, setInterventionLoadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, cluster, batchYear, sortBy]);

  const loadStudents = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
        limit: 500,
        offset: 0,
        search: debouncedSearch || undefined,
        department: department !== "All" ? department : undefined,
        cluster: cluster !== "all" ? cluster : undefined,
        batch_year: batchYear !== "All" ? batchYear : undefined,
        sort_by: sortBy,
      });

      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(toApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [batchYear, cluster, debouncedSearch, department, sortBy]);

  React.useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filteredStudents = React.useMemo(() => {
    let next = [...students];

    if (debouncedSearch) {
      const normalized = debouncedSearch.toLowerCase();
      next = next.filter((student) => {
        return (
          student.full_name.toLowerCase().includes(normalized) ||
          student.email.toLowerCase().includes(normalized)
        );
      });
    }

    if (department !== "All") {
      next = next.filter((student) => (student.department || "").toUpperCase() === department);
    }

    if (cluster !== "all") {
      next = next.filter((student) => normalizeCluster(student.cluster) === cluster);
    }

    if (batchYear !== "All") {
      next = next.filter((student) => String(student.batch_year || "") === batchYear);
    }

    if (sortBy === "score_asc") {
      next.sort((a, b) => getScore(a) - getScore(b));
    } else if (sortBy === "score_desc") {
      next.sort((a, b) => getScore(b) - getScore(a));
    } else if (sortBy === "name") {
      next.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
      next.sort((a, b) => {
        const left = toTimestamp(getLastActive(a), 0);
        const right = toTimestamp(getLastActive(b), 0);
        return right - left;
      });
    }

    return next;
  }, [students, debouncedSearch, department, cluster, batchYear, sortBy]);

  const totalStudents = students.length;
  const totalDepartments = React.useMemo(() => {
    return new Set(
      students.map((student) => (student.department || "Unknown").toUpperCase()),
    ).size;
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const paginatedStudents = filteredStudents.slice(start, start + PAGE_SIZE);
  const showingStart = filteredStudents.length === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + PAGE_SIZE, filteredStudents.length);

  const hasActiveFilters =
    search.trim().length > 0 ||
    department !== "All" ||
    cluster !== "all" ||
    batchYear !== "All" ||
    sortBy !== "score_desc";

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDepartment("All");
    setCluster("all");
    setBatchYear("All");
    setSortBy("score_desc");
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setActionMessage("");

    try {
      const file = await api.getBlob("/api/v1/exports/students", { format: "xlsx" });
      const blobUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `vigilo-students-${formatDateForFileName(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (requestError) {
      setActionMessage(toApiErrorMessage(requestError));
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateNudge = async (event: React.MouseEvent, studentId: string) => {
    event.stopPropagation();
    setNudgeLoadingId(studentId);

    try {
      const response = await api.post<ApiEnvelope<{ message: string }>>(`/api/v1/ai/nudge/${studentId}`, {
        intervention_type: "nudge_sent",
      });
      setActionMessage(response.data?.message ? `Nudge ready: ${response.data.message.slice(0, 70)}...` : "AI nudge generated");
    } catch (requestError) {
      setActionMessage(toApiErrorMessage(requestError));
    } finally {
      setNudgeLoadingId(null);
      setOpenMenuFor(null);
    }
  };

  const handleAddIntervention = async (event: React.MouseEvent, studentId: string) => {
    event.stopPropagation();
    setInterventionLoadingId(studentId);

    try {
      await api.post<ApiEnvelope<Intervention>>("/api/v1/interventions", {
        student_id: studentId,
        intervention_type: "nudge_sent",
      });
      setActionMessage("Intervention created");
    } catch (requestError) {
      setActionMessage(toApiErrorMessage(requestError));
    } finally {
      setInterventionLoadingId(null);
      setOpenMenuFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-4xl leading-tight text-foreground">All Students</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalStudents} students tracked across {totalDepartments} departments
            </p>
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="self-start">
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_auto]">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value as (typeof DEPARTMENT_OPTIONS)[number])}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted px-2 py-1.5">
            {CLUSTER_OPTIONS.map((option) => {
              const active = cluster === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCluster(option.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-opacity ${option.className} ${active ? "opacity-100" : "opacity-55 hover:opacity-80"}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <select
            value={batchYear}
            onChange={(event) => setBatchYear(event.target.value as (typeof BATCH_OPTIONS)[number])}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {BATCH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-[var(--red)] underline-offset-2 hover:underline"
            >
              Reset filters
            </button>
          ) : (
            <span />
          )}
        </div>
      </section>

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            className="underline-offset-2 hover:underline"
            onClick={() => void loadStudents()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-xl border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] px-4 py-3 text-sm text-[var(--ink)]">
          {actionMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-[rgba(26,26,26,0.2)] bg-[var(--tint)]">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Student</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Department</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Vigilo Score</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Cluster</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Last Active</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Placement Status</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</th>
              </tr>
            </thead>

            {isLoading ? <SkeletonRows /> : null}

            {!isLoading ? (
              <tbody>
                {paginatedStudents.map((student) => {
                  const score = Math.max(0, Math.min(100, getScore(student)));
                  const clusterValue = normalizeCluster(student.cluster);
                  const status = placementStatusLabel(student.placement_status);
                  const lastActiveValue = getLastActive(student);
                  const lastActiveLabel = formatRelativeDate(lastActiveValue, "No activity");
                  const isStale = isDateOlderThanDays(lastActiveValue, 30);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => router.push(`/students/${student.id}`)}
                      className="cursor-pointer border-b border-[rgba(26,26,26,0.1)] transition-colors hover:bg-[rgba(26,26,26,0.03)]"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] text-xs font-semibold text-[var(--ink)]">
                            {toInitials(student.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--ink)]">{student.full_name}</p>
                            <p className="truncate text-xs text-[var(--muted)]">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-sm text-[var(--ink)]">{(student.department || "Unknown").toUpperCase()}</td>

                      <td className="px-3 py-3">
                        <p className={`text-sm font-semibold ${scoreColorClass(score)}`}>{score.toFixed(1)}</p>
                        <div className="mt-1 h-1.5 w-24 rounded-full bg-[rgba(26,26,26,0.12)]">
                          <div className={`h-full rounded-full ${scoreBarClass(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${clusterPillClass(clusterValue)}`}>
                          {clusterLabel(clusterValue)}
                        </span>
                      </td>

                      <td className={`px-3 py-3 text-sm ${isStale ? "text-red-700" : "text-[var(--ink)]"}`}>
                        {lastActiveLabel}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${placementStatusClass(status)}`}>
                          {status}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            onClick={() => setOpenMenuFor((current) => (current === student.id ? null : student.id))}
                            className="rounded-md border border-[rgba(26,26,26,0.2)] p-2 text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuFor === student.id ? (
                            <div className="absolute right-0 top-10 z-20 min-w-40 rounded-lg border border-[rgba(26,26,26,0.15)] bg-[var(--paper)] p-1.5 shadow-[0_8px_24px_rgba(26,26,26,0.1)]">
                              <button
                                type="button"
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  router.push(`/students/${student.id}`);
                                  setOpenMenuFor(null);
                                }}
                              >
                                View Profile
                              </button>
                              <button
                                type="button"
                                disabled={nudgeLoadingId === student.id || interventionLoadingId === student.id}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
                                onClick={(event) => {
                                  void handleGenerateNudge(event, student.id);
                                }}
                              >
                                {nudgeLoadingId === student.id ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                  </span>
                                ) : (
                                  "Generate Nudge"
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={nudgeLoadingId === student.id || interventionLoadingId === student.id}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
                                onClick={(event) => {
                                  void handleAddIntervention(event, student.id);
                                }}
                              >
                                {interventionLoadingId === student.id ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                  </span>
                                ) : (
                                  "Add Intervention"
                                )}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ) : null}
          </table>
        </div>

        {!isLoading && filteredStudents.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-lg font-semibold text-[var(--ink)]">No students found</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-md border border-[rgba(26,26,26,0.2)] px-4 py-2 text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
            >
              Reset
            </button>
          </div>
        ) : null}

        {!isLoading && filteredStudents.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-[rgba(26,26,26,0.12)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">
              Showing {showingStart}-{showingEnd} of {filteredStudents.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Prev
              </Button>
              <span className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

    </div>
  );
}
