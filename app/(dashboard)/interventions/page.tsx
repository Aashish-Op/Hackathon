"use client";

import { X, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { api, type ApiError } from "@/lib/api";
import { formatRelativeDate, toTimestamp } from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { ApiEnvelope, Intervention, PagedResponse, StudentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type StatusFilter = "all" | "pending" | "sent" | "acknowledged" | "completed";
type TypeFilter =
  | "all"
  | "nudge_sent"
  | "meeting_scheduled"
  | "domain_shift_suggested"
  | "mock_assigned"
  | "counselling"
  | "weekly_check_in"
  | "weekly_recommendation";
type DateRangeFilter = "7d" | "30d" | "all";

type ActionState = {
  sendId: string | null;
  deleteId: string | null;
};

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Acknowledged", value: "acknowledged" },
  { label: "Completed", value: "completed" },
];

const TYPE_OPTIONS: Array<{ label: string; value: TypeFilter }> = [
  { label: "All", value: "all" },
  { label: "Nudge Sent", value: "nudge_sent" },
  { label: "Meeting Scheduled", value: "meeting_scheduled" },
  { label: "Domain Shift", value: "domain_shift_suggested" },
  { label: "Mock Assigned", value: "mock_assigned" },
  { label: "Counselling", value: "counselling" },
  { label: "Weekly Check In", value: "weekly_check_in" },
  { label: "Weekly Recommendation", value: "weekly_recommendation" },
];

const DATE_RANGE_OPTIONS: Array<{ label: string; value: DateRangeFilter }> = [
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "All", value: "all" },
];

const MODAL_TYPE_OPTIONS: Array<{ label: string; value: Exclude<TypeFilter, "all"> }> = [
  { label: "Nudge Sent", value: "nudge_sent" },
  { label: "Meeting Scheduled", value: "meeting_scheduled" },
  { label: "Domain Shift Suggested", value: "domain_shift_suggested" },
  { label: "Mock Assigned", value: "mock_assigned" },
  { label: "Counselling", value: "counselling" },
  { label: "Weekly Check In", value: "weekly_check_in" },
  { label: "Weekly Recommendation", value: "weekly_recommendation" },
];

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Request failed";
}

function toInterventionLabel(value: string): string {
  const map: Record<string, string> = {
    nudge_sent: "Nudge Sent",
    meeting_scheduled: "Meeting Scheduled",
    domain_shift_suggested: "Domain Shift",
    mock_assigned: "Mock Assigned",
    counselling: "Counselling",
    weekly_check_in: "Weekly Check In",
    weekly_recommendation: "Weekly Recommendation",
  };

  return map[value] || value.replaceAll("_", " ");
}

function statusPillClass(status: string): string {
  if (status === "completed") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (status === "acknowledged") {
    return "border-amber-300 bg-amber-100 text-amber-700";
  }

  if (status === "sent") {
    return "border-sky-300 bg-sky-100 text-sky-700";
  }

  return "border-slate-300 bg-slate-100 text-slate-700";
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
  const days = range === "7d" ? 7 : 30;
  return now - time <= days * 24 * 60 * 60 * 1000;
}

function SkeletonTable() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-[rgba(26,26,26,0.1)]">
          <td className="px-3 py-3"><div className="h-4 w-40 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-28 animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-6 w-24 animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-4 w-64 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-4 w-20 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-4 w-20 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
          <td className="px-3 py-3"><div className="h-8 w-56 animate-pulse rounded bg-[rgba(26,26,26,0.08)]" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function InterventionsPage() {
  usePageTitle("Interventions - Vigilo");

  const router = useRouter();
  const { toast } = useToast();

  const [interventions, setInterventions] = React.useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [search, setSearch] = React.useState("");
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRangeFilter>("30d");

  const [actions, setActions] = React.useState<ActionState>({ sendId: null, deleteId: null });

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createStudentSearch, setCreateStudentSearch] = React.useState("");
  const [createDebouncedSearch, setCreateDebouncedSearch] = React.useState("");
  const [studentOptions, setStudentOptions] = React.useState<StudentProfile[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentProfile | null>(null);
  const [createInterventionType, setCreateInterventionType] = React.useState<Exclude<TypeFilter, "all">>("nudge_sent");
  const [createMessage, setCreateMessage] = React.useState("");
  const [aiGeneratedMessage, setAiGeneratedMessage] = React.useState("");
  const [isGeneratingAIMessage, setIsGeneratingAIMessage] = React.useState(false);
  const [isCreatingIntervention, setIsCreatingIntervention] = React.useState(false);

  const [completeTarget, setCompleteTarget] = React.useState<Intervention | null>(null);
  const [completeNotes, setCompleteNotes] = React.useState("");
  const [isCompleting, setIsCompleting] = React.useState(false);

  const loadInterventions = React.useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await api.get<ApiEnvelope<PagedResponse<Intervention>>>("/api/v1/interventions", {
        page: 1,
        limit: 300,
      });

      setInterventions(response.data.items || []);
    } catch (requestError) {
      setError(toApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void loadInterventions();
  }, [loadInterventions]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setCreateDebouncedSearch(createStudentSearch.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [createStudentSearch]);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      if (!isCreateModalOpen || createDebouncedSearch.length < 2) {
        setStudentOptions([]);
        return;
      }

      setIsSearchingStudents(true);

      try {
        const response = await api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
          search: createDebouncedSearch,
          limit: 8,
          offset: 0,
        });

        if (active) {
          setStudentOptions(response.data || []);
        }
      } catch {
        if (active) {
          setStudentOptions([]);
          setError("Failed to search students");
        }
      } finally {
        if (active) {
          setIsSearchingStudents(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [createDebouncedSearch, isCreateModalOpen]);

  const visibleInterventions = React.useMemo(() => {
    return interventions
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        if (typeFilter !== "all" && item.intervention_type !== typeFilter) {
          return false;
        }

        const searchText = search.trim().toLowerCase();
        if (searchText) {
          const combined = `${item.student_name || ""} ${item.student_department || ""}`.toLowerCase();
          if (!combined.includes(searchText)) {
            return false;
          }
        }

        if (!isInDateRange(item.created_at, dateRangeFilter)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  }, [dateRangeFilter, interventions, search, statusFilter, typeFilter]);

  const resetCreateModal = () => {
    setCreateStudentSearch("");
    setCreateDebouncedSearch("");
    setStudentOptions([]);
    setSelectedStudent(null);
    setCreateInterventionType("nudge_sent");
    setCreateMessage("");
    setAiGeneratedMessage("");
    setIsGeneratingAIMessage(false);
  };

  const openCreateModal = () => {
    resetCreateModal();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateModal();
  };

  const handleGenerateMessage = async () => {
    if (!selectedStudent) {
      toast({ title: "Select a student first", variant: "info" });
      return;
    }

    setIsGeneratingAIMessage(true);

    try {
      const response = await api.post<ApiEnvelope<{ message: string }>>(`/api/v1/ai/nudge/${selectedStudent.id}`, {
        intervention_type: createInterventionType,
      });

      const message = response.data.message || "";
      setAiGeneratedMessage(message);
      setCreateMessage(message);
      toast({ title: "AI nudge generated", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Failed to generate with AI",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsGeneratingAIMessage(false);
    }
  };

  const handleCreateIntervention = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedStudent) {
      toast({ title: "Please select a student", variant: "error" });
      return;
    }

    setIsCreatingIntervention(true);

    try {
      await api.post<ApiEnvelope<Intervention>>("/api/v1/interventions", {
        student_id: selectedStudent.id,
        intervention_type: createInterventionType,
        custom_message: createMessage.trim() || undefined,
        ai_generated_message: aiGeneratedMessage || undefined,
      });

      toast({ title: "Intervention created", variant: "success" });
      closeCreateModal();
      await loadInterventions(true);
    } catch (requestError) {
      toast({
        title: "Failed to create intervention",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsCreatingIntervention(false);
    }
  };

  const handleSend = async (interventionId: string) => {
    setActions((current) => ({ ...current, sendId: interventionId }));

    try {
      await api.patch<ApiEnvelope<Intervention>>(`/api/v1/interventions/${interventionId}/send`, {});
      setInterventions((current) =>
        current.map((item) =>
          item.id === interventionId
            ? {
                ...item,
                status: "sent",
                sent_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      toast({ title: "Intervention sent", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Failed to send intervention",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setActions((current) => ({ ...current, sendId: null }));
    }
  };

  const handleDelete = async (interventionId: string) => {
    setActions((current) => ({ ...current, deleteId: interventionId }));

    try {
      await api.delete<ApiEnvelope<Intervention>>(`/api/v1/interventions/${interventionId}`);
      setInterventions((current) => current.filter((item) => item.id !== interventionId));
      toast({ title: "Intervention deleted", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Failed to delete intervention",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setActions((current) => ({ ...current, deleteId: null }));
    }
  };

  const handleComplete = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!completeTarget) {
      return;
    }

    setIsCompleting(true);

    try {
      await api.patch<ApiEnvelope<Intervention>>(`/api/v1/interventions/${completeTarget.id}/complete`, {
        notes: completeNotes.trim() || undefined,
      });

      setInterventions((current) =>
        current.map((item) =>
          item.id === completeTarget.id
            ? {
                ...item,
                status: "completed",
                notes: completeNotes,
              }
            : item,
        ),
      );

      setCompleteTarget(null);
      setCompleteNotes("");
      toast({ title: "Intervention completed", variant: "success" });
    } catch (requestError) {
      toast({
        title: "Failed to complete intervention",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-serif text-4xl leading-tight text-foreground">Interventions</h1>
              <span className="mt-3 inline-flex rounded-full border border-[rgba(26,26,26,0.2)] bg-[var(--tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                {visibleInterventions.length} visible
              </span>
            </div>

            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              New Intervention
            </Button>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-4">
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

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Input
              placeholder="Search student"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

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
              <Button variant="outline" size="sm" onClick={() => void loadInterventions(true)} disabled={isRefreshing}>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void loadInterventions()} className="underline-offset-2 hover:underline">
              Retry
            </button>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead>
                <tr className="border-b border-[rgba(26,26,26,0.2)] bg-[var(--tint)]">
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Student</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Message Preview</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Created</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Sent At</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Actions</th>
                </tr>
              </thead>

              {isLoading ? <SkeletonTable /> : null}

              {!isLoading ? (
                <tbody>
                  {visibleInterventions.map((item) => {
                    const messagePreview = (item.custom_message || item.ai_generated_message || "No message").slice(0, 80);

                    return (
                      <tr key={item.id} className="border-b border-[rgba(26,26,26,0.1)]">
                        <td className="px-3 py-3 text-sm text-[var(--ink)]">
                          <p className="font-medium">{item.student_name || "Student"}</p>
                          <p className="text-xs text-[var(--muted)]">{(item.student_department || "Unknown").toUpperCase()}</p>
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-full border border-[rgba(26,26,26,0.2)] bg-[var(--tint)] px-2.5 py-1 text-xs text-[var(--ink)]">
                            {toInterventionLabel(item.intervention_type)}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusPillClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-sm italic text-[var(--muted)]">{messagePreview || "No message"}</td>
                        <td className="px-3 py-3 text-sm text-[var(--ink)]">{formatRelativeDate(item.created_at, "-")}</td>
                        <td className="px-3 py-3 text-sm text-[var(--ink)]">{item.sent_at ? formatRelativeDate(item.sent_at, "-") : "-"}</td>

                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {item.status === "pending" ? (
                              <Button
                                size="sm"
                                onClick={() => void handleSend(item.id)}
                                disabled={actions.sendId === item.id}
                              >
                                {actions.sendId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {actions.sendId === item.id ? "Sending..." : "Send"}
                              </Button>
                            ) : null}

                            <Button size="sm" variant="outline" onClick={() => router.push(`/students/${item.student_id}`)}>
                              View
                            </Button>

                            {item.status !== "completed" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCompleteTarget(item);
                                  setCompleteNotes(item.notes || "");
                                }}
                              >
                                Complete
                              </Button>
                            ) : null}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleDelete(item.id)}
                              disabled={actions.deleteId === item.id}
                            >
                              {actions.deleteId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {actions.deleteId === item.id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : null}
            </table>
          </div>

          {!isLoading && visibleInterventions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-lg font-semibold text-[var(--ink)]">No interventions yet. Use the Nudge Engine to start.</p>
            </div>
          ) : null}
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,26,26,0.45)] px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-3xl text-[var(--ink)]">New Intervention</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Create a targeted intervention and optionally generate message content with AI.</p>
              </div>
              <button type="button" onClick={closeCreateModal} className="rounded-md border border-[rgba(26,26,26,0.2)] p-2 text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleCreateIntervention}>
              <div className="relative">
                <label className="mb-2 block text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Student</label>
                <Input
                  placeholder="Search student by name or email..."
                  value={selectedStudent ? `${selectedStudent.full_name} (${selectedStudent.email})` : createStudentSearch}
                  onChange={(event) => {
                    setSelectedStudent(null);
                    setCreateStudentSearch(event.target.value);
                  }}
                />

                {!selectedStudent && createDebouncedSearch.length >= 2 ? (
                  <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] p-1">
                    {isSearchingStudents ? (
                      <p className="px-3 py-2 text-sm text-[var(--muted)]">Searching...</p>
                    ) : studentOptions.length > 0 ? (
                      studentOptions.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          className="block w-full rounded-md px-3 py-2 text-left text-sm text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]"
                          onClick={() => {
                            setSelectedStudent(student);
                            setCreateStudentSearch("");
                            setCreateDebouncedSearch("");
                          }}
                        >
                          <span className="font-medium">{student.full_name}</span>
                          <span className="block text-xs text-[var(--muted)]">{student.email}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-[var(--muted)]">No students found</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Intervention Type</label>
                  <select
                    value={createInterventionType}
                    onChange={(event) => setCreateInterventionType(event.target.value as Exclude<TypeFilter, "all">)}
                    className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground focus:outline-none"
                  >
                    {MODAL_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button type="button" className="w-full" onClick={() => void handleGenerateMessage()} disabled={isGeneratingAIMessage || !selectedStudent}>
                    {isGeneratingAIMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isGeneratingAIMessage ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Message</label>
                <Textarea
                  value={createMessage}
                  onChange={(event) => setCreateMessage(event.target.value)}
                  placeholder="Optional custom message"
                  className="min-h-28"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingIntervention || !selectedStudent}>
                  {isCreatingIntervention ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isCreatingIntervention ? "Creating..." : "Create Intervention"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {completeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,26,26,0.45)] px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[rgba(26,26,26,0.2)] bg-[var(--paper)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-[var(--ink)]">Complete Intervention</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Add optional completion notes for this intervention.</p>
              </div>
              <button type="button" onClick={() => setCompleteTarget(null)} className="rounded-md border border-[rgba(26,26,26,0.2)] p-2 text-[var(--ink)] hover:bg-[rgba(26,26,26,0.04)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleComplete}>
              <Textarea
                value={completeNotes}
                onChange={(event) => setCompleteNotes(event.target.value)}
                placeholder="Completion notes"
                className="min-h-24"
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCompleteTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCompleting}>
                  {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isCompleting ? "Saving..." : "Mark Completed"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
