"use client";

import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import * as React from "react";

import { api, type ApiError } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ApiEnvelope,
  Notification as VigiloNotification,
  PagedResponse,
  PlacementDrive,
  StudentMeResponse,
  VigiloScore,
} from "@/lib/types";
import { useToast } from "@/components/ui/toast";

type SkillGap = {
  skill_name: string;
  student_proficiency: string;
  peer_avg_proficiency: number;
  gap: number;
};

type RecommendationPayload = {
  skill_gaps: SkillGap[];
  suggested_action: string;
  message: string;
};

type RecommendationAction = {
  id: string;
  title: string;
  reason: string;
};

type DriveDetailsPayload = {
  drive: PlacementDrive;
  my_application_status?: string | null;
};

const SCORE_COMPONENTS: Array<{ key: string; label: string; max: number }> = [
  { key: "portal_activity_score", label: "Portal Activity", max: 15 },
  { key: "mock_test_score", label: "Mock Tests", max: 20 },
  { key: "skill_score", label: "Skills", max: 15 },
  { key: "resume_score", label: "Resume", max: 10 },
  { key: "cgpa_score", label: "CGPA", max: 15 },
  { key: "application_score", label: "Applications", max: 15 },
  { key: "internship_score", label: "Internships", max: 10 },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Something went wrong";
}

function toRelativeTime(timestamp?: string | null): string {
  if (!timestamp) {
    return "just now";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "just now";
  }

  const diff = Date.now() - date.getTime();
  if (diff <= 0) {
    return "just now";
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (diff < day) {
    const hours = Math.max(1, Math.floor(diff / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diff / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toReadableDate(timestamp?: string | null): string {
  if (!timestamp) {
    return "TBD";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "Student";
}

function greetingByTime(date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "afternoon";
  }

  return "evening";
}

function scoreTone(score: number): {
  gaugeStroke: string;
  textClass: string;
  clusterClass: string;
} {
  if (score < 35) {
    return {
      gaugeStroke: "#C0392B",
      textClass: "text-red-700",
      clusterClass: "text-red-700",
    };
  }

  if (score <= 65) {
    return {
      gaugeStroke: "#E67E22",
      textClass: "text-amber-700",
      clusterClass: "text-amber-700",
    };
  }

  return {
    gaugeStroke: "#27AE60",
    textClass: "text-emerald-700",
    clusterClass: "text-emerald-700",
  };
}

function normalizeProbability(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (value <= 1) {
    return clamp(value * 100);
  }

  return clamp(value);
}

function toClusterText(clusterValue?: string | null): string {
  const normalized = (clusterValue || "").toLowerCase();

  if (normalized.includes("placement") || normalized.includes("ready")) {
    return "You're Placement Ready";
  }

  if (normalized.includes("silent") || normalized.includes("dropout")) {
    return "You're In Silent Dropout Zone";
  }

  if (normalized.includes("risk")) {
    return "You're At Risk";
  }

  return "You're On Track";
}

function toInterventionLabel(value: string): string {
  const map: Record<string, string> = {
    nudge_sent: "Follow your latest nudge",
    meeting_scheduled: "Book a mentoring check-in",
    domain_shift_suggested: "Explore stronger-fit domains",
    mock_assigned: "Complete 2 mock tests",
    counselling: "Attend counselling support session",
    weekly_check_in: "Submit your weekly check-in",
    weekly_recommendation: "Follow this week's recommendation",
  };

  return map[value] || "Take your next placement action";
}

function toInterventionReason(value: string, department?: string | null): string {
  const departmentLabel = department || "your batch";
  const map: Record<string, string> = {
    nudge_sent: "A quick response keeps your progress momentum high this week.",
    meeting_scheduled: "A mentor session can unblock slow areas before they affect your score.",
    domain_shift_suggested: "Exploring stronger-fit roles can improve your placement probability.",
    mock_assigned: `Your mock performance is still below placed peers in ${departmentLabel}.`,
    counselling: "Early coaching helps prevent prolonged disengagement.",
    weekly_check_in: "Regular check-ins improve consistency and score stability.",
    weekly_recommendation: "This recommendation is tuned to your current score signals.",
  };

  return map[value] || "This action can directly improve your readiness this week.";
}

function toAverageProficiencyLabel(peerAverage: number): string {
  if (peerAverage >= 2.5) {
    return "Advanced";
  }

  if (peerAverage >= 1.5) {
    return "Intermediate";
  }

  return "Beginner";
}

function proficiencyPillClass(label: string): string {
  const normalized = label.toLowerCase();

  if (normalized.includes("advanced")) {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("intermediate")) {
    return "border-amber-300 bg-amber-100 text-amber-700";
  }

  return "border-red-300 bg-red-100 text-red-700";
}

function scoreBarClass(percent: number): string {
  if (percent < 35) {
    return "bg-red-600";
  }

  if (percent <= 65) {
    return "bg-amber-600";
  }

  return "bg-emerald-600";
}

function toWeekKey(date = new Date()): string {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date.getTime() - jan1.getTime()) / 86_400_000);
  const weekNumber = Math.ceil((dayOffset + jan1.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function actionStorageKey(studentId: string): string {
  return `vigilo-actions:${studentId}:${toWeekKey()}`;
}

function safeParseChecks(raw: string | null): Record<string, boolean> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function deriveWeeklyActions(
  recommendation: RecommendationPayload | null,
  department?: string | null,
): RecommendationAction[] {
  const actions: RecommendationAction[] = [];

  if (recommendation?.suggested_action) {
    actions.push({
      id: `suggested-${recommendation.suggested_action}`,
      title: toInterventionLabel(recommendation.suggested_action),
      reason: toInterventionReason(recommendation.suggested_action, department),
    });
  }

  (recommendation?.skill_gaps || []).slice(0, 2).forEach((skill) => {
    actions.push({
      id: `skill-gap-${skill.skill_name}`,
      title: `Improve ${skill.skill_name}`,
      reason: `${skill.skill_name} is ${skill.gap.toFixed(1)} levels behind placed peers in ${department || "your department"}.`,
    });
  });

  if (recommendation?.message) {
    actions.push({
      id: "message-summary",
      title: "Follow your personalised AI plan",
      reason: recommendation.message,
    });
  }

  const defaults: RecommendationAction[] = [
    {
      id: "default-mocks",
      title: "Complete 2 mock tests",
      reason: "Mock performance is one of the strongest score boosters this week.",
    },
    {
      id: "default-profile",
      title: "Refresh your resume profile",
      reason: "A recent resume update improves your readiness and drive eligibility.",
    },
    {
      id: "default-apply",
      title: "Apply to one upcoming drive",
      reason: "Consistent applications increase placement outcomes over time.",
    },
  ];

  defaults.forEach((fallback) => {
    if (actions.length < 3) {
      actions.push(fallback);
    }
  });

  return actions.slice(0, 3).map((item, index) => ({
    ...item,
    id: `${item.id}-${index + 1}`,
  }));
}

function resolveScoreDelta(history: VigiloScore[]): number | null {
  if (history.length < 2) {
    return null;
  }

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const latest = history[0];

  const baseline = history.find((item) => {
    const computed = new Date(item.computed_at).getTime();
    return Number.isFinite(computed) && now - computed >= oneWeekMs;
  });

  const comparison = baseline || history[1];
  return Number((latest.score - comparison.score).toFixed(1));
}

function CircularGauge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(score) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative h-[220px] w-[220px]">
      <svg className="h-full w-full" viewBox="0 0 220 220" role="img" aria-label={`Vigilo score ${Math.round(score)}`}>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(26,26,26,0.12)" strokeWidth="16" />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={tone.gaugeStroke}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 110 110)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={`font-[family-name:var(--font-dm-serif-display)] text-5xl leading-none ${tone.textClass}`}>
          {Math.round(score)}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Vigilo Score
        </p>
      </div>
    </div>
  );
}

function ActionsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
          <div className="mt-4 h-5 w-5 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
        </div>
      ))}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { toast } = useToast();

  const [studentId, setStudentId] = React.useState<string | null>(null);
  const [authName, setAuthName] = React.useState("Student");

  const [studentData, setStudentData] = React.useState<StudentMeResponse["profile"] | null>(null);
  const [latestScore, setLatestScore] = React.useState<VigiloScore | null>(null);
  const [scoreDelta, setScoreDelta] = React.useState<number | null>(null);
  const [recommendation, setRecommendation] = React.useState<RecommendationPayload | null>(null);
  const [notifications, setNotifications] = React.useState<VigiloNotification[]>([]);
  const [drives, setDrives] = React.useState<PlacementDrive[]>([]);
  const [appliedDriveIds, setAppliedDriveIds] = React.useState<string[]>([]);

  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [isActionsLoading, setIsActionsLoading] = React.useState(true);
  const [isDrivesLoading, setIsDrivesLoading] = React.useState(true);
  const [isNotificationsLoading, setIsNotificationsLoading] = React.useState(true);
  const [isApplyingDrive, setIsApplyingDrive] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const [actionChecks, setActionChecks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (!session?.user) {
          window.location.href = "/login";
          return;
        }

        setStudentId(session.user.id);
        const nameFromAuth =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email ||
          "Student";
        setAuthName(nameFromAuth);
      } catch {
        if (active) {
          window.location.href = "/login";
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const loadDashboardData = React.useCallback(async () => {
    if (!studentId) {
      return;
    }

    setError("");
    setIsBootstrapping(true);
    setIsActionsLoading(true);
    setIsDrivesLoading(true);
    setIsNotificationsLoading(true);

    const mePromise = api.get<ApiEnvelope<StudentMeResponse>>("/api/v1/students/me");
    const scorePromise = api.get<ApiEnvelope<VigiloScore>>(`/api/v1/scores/${studentId}/latest`);
    const historyPromise = api.get<ApiEnvelope<VigiloScore[]>>(`/api/v1/scores/${studentId}/history`);
    const recommendationPromise = api.get<ApiEnvelope<RecommendationPayload>>(
      `/api/v1/ai/student/${studentId}/recommendation`,
    );
    const notificationsPromise = api.get<ApiEnvelope<PagedResponse<VigiloNotification>>>(
      `/api/v1/notifications/student/${studentId}`,
      {
        status: "delivered",
        page: 1,
        limit: 5,
      },
    );
    const drivesPromise = api.get<ApiEnvelope<PagedResponse<PlacementDrive>>>("/api/v1/drives", {
      status: "upcoming",
      page: 1,
      limit: 3,
    });

    const [
      meResult,
      scoreResult,
      historyResult,
      recommendationResult,
      notificationsResult,
      drivesResult,
    ] = await Promise.allSettled([
      mePromise,
      scorePromise,
      historyPromise,
      recommendationPromise,
      notificationsPromise,
      drivesPromise,
    ]);

    let hadFailure = false;

    if (meResult.status === "fulfilled") {
      const payload = meResult.value.data;
      setStudentData(payload.profile || null);
    } else {
      hadFailure = true;
    }

    if (scoreResult.status === "fulfilled") {
      setLatestScore(scoreResult.value.data || null);
    } else {
      setLatestScore(null);
      hadFailure = true;
    }

    if (historyResult.status === "fulfilled") {
      const rows = Array.isArray(historyResult.value.data) ? historyResult.value.data : [];
      setScoreDelta(resolveScoreDelta(rows));
    } else {
      setScoreDelta(null);
    }

    if (recommendationResult.status === "fulfilled") {
      setRecommendation(recommendationResult.value.data || null);
    } else {
      setRecommendation(null);
      hadFailure = true;
    }
    setIsActionsLoading(false);

    if (notificationsResult.status === "fulfilled") {
      setNotifications(notificationsResult.value.data.items || []);
    } else {
      setNotifications([]);
      hadFailure = true;
    }
    setIsNotificationsLoading(false);

    if (drivesResult.status === "fulfilled") {
      const nextDrives = (drivesResult.value.data.items || []).slice(0, 3);
      setDrives(nextDrives);

      const detailResults = await Promise.allSettled(
        nextDrives.map((drive) => api.get<ApiEnvelope<DriveDetailsPayload>>(`/api/v1/drives/${drive.id}`)),
      );
      const appliedIds = detailResults.flatMap((detail, index) => {
        if (detail.status !== "fulfilled") {
          return [] as string[];
        }

        return detail.value.data.my_application_status ? [nextDrives[index].id] : [];
      });
      setAppliedDriveIds(appliedIds);
    } else {
      setDrives([]);
      setAppliedDriveIds([]);
      hadFailure = true;
    }
    setIsDrivesLoading(false);

    if (hadFailure) {
      setError("Some sections failed to load. Please retry.");
    }

    setIsBootstrapping(false);
  }, [studentId]);

  React.useEffect(() => {
    if (!studentId) {
      return;
    }

    void loadDashboardData();
  }, [loadDashboardData, studentId]);

  const weeklyActions = React.useMemo(
    () => deriveWeeklyActions(recommendation, studentData?.department),
    [recommendation, studentData?.department],
  );

  React.useEffect(() => {
    if (!studentId) {
      return;
    }

    const storageKey = actionStorageKey(studentId);
    setActionChecks(safeParseChecks(window.localStorage.getItem(storageKey)));
  }, [studentId, weeklyActions]);

  const handleToggleAction = (actionId: string, checked: boolean) => {
    if (!studentId) {
      return;
    }

    const storageKey = actionStorageKey(studentId);
    const next = {
      ...actionChecks,
      [actionId]: checked,
    };

    setActionChecks(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const handleApplyNow = async (driveId: string) => {
    if (appliedDriveIds.includes(driveId)) {
      return;
    }

    setIsApplyingDrive(driveId);

    try {
      await api.post(`/api/v1/drives/${driveId}/apply`);
      setAppliedDriveIds((current) => (current.includes(driveId) ? current : [...current, driveId]));
      toast({
        title: "Application submitted",
        description: "Your application is in the queue.",
        variant: "success",
      });
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      if (message.toLowerCase().includes("already applied")) {
        setAppliedDriveIds((current) => (current.includes(driveId) ? current : [...current, driveId]));
        toast({
          title: "Already applied",
          description: "This drive is already in your applications.",
          variant: "info",
        });
      } else {
        toast({
          title: "Could not apply",
          description: message,
          variant: "error",
        });
      }
    } finally {
      setIsApplyingDrive(null);
    }
  };

  const resolvedName = studentData?.full_name || authName;
  const greetingName = toFirstName(resolvedName || "Student");
  const score = Number(latestScore?.score || 0);
  const tone = scoreTone(score);
  const placementProbability = normalizeProbability(latestScore?.placement_probability);
  const clusterText = toClusterText(latestScore?.cluster || studentData?.cluster);

  const scoreBreakdown = (latestScore?.score_breakdown || {}) as Record<string, unknown>;
  const breakdownItems = SCORE_COMPONENTS.map((component) => {
    const rawValue = Number(scoreBreakdown[component.key] || 0);
    const value = Number.isFinite(rawValue) ? rawValue : 0;
    const percent = clamp((value / component.max) * 100);

    return {
      ...component,
      value,
      percent,
    };
  });

  return (
    <div className="space-y-6 pb-8">
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{error}</p>
            <button
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm hover:bg-red-100"
              onClick={() => void loadDashboardData()}
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--tint)] p-5 md:p-7">
        {isBootstrapping ? (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-[rgba(26,26,26,0.1)]" />
              <div className="h-10 w-3/4 animate-pulse rounded bg-[rgba(26,26,26,0.1)]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[rgba(26,26,26,0.1)]" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-[rgba(26,26,26,0.1)]" />
            </div>
            <div className="mx-auto h-[220px] w-[220px] animate-pulse rounded-full bg-[rgba(26,26,26,0.08)]" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Student Dashboard</p>
              <h1 className="font-[family-name:var(--font-dm-serif-display)] text-4xl leading-tight md:text-5xl">
                Good {greetingByTime()}, {greetingName}.
              </h1>
              <p className={`text-xl font-medium ${tone.clusterClass}`}>{clusterText}</p>
              <p className="text-[15px] text-[var(--muted-foreground)]">
                {placementProbability.toFixed(0)}% placement probability
              </p>
              {scoreDelta !== null ? (
                <p className={`text-sm font-medium ${scoreDelta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {scoreDelta >= 0 ? "↑" : "↓"} {scoreDelta >= 0 ? "+" : ""}
                  {scoreDelta.toFixed(1)} points since last week
                </p>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">No prior weekly score available yet.</p>
              )}
            </div>

            <div className="mx-auto">
              <CircularGauge score={score} />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--card)] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--red)]" />
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl">Your 3 actions this week</h2>
        </div>

        {isActionsLoading ? (
          <ActionsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {weeklyActions.map((action) => {
              const checked = Boolean(actionChecks[action.id]);
              return (
                <article
                  key={action.id}
                  className="rounded-2xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4 transition hover:border-[rgba(26,26,26,0.24)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-[var(--ink)]">{action.title}</h3>
                    <input
                      checked={checked}
                      className="mt-1 h-4 w-4 accent-[var(--red)]"
                      onChange={(event) => handleToggleAction(action.id, event.target.checked)}
                      type="checkbox"
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {action.reason}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--card)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl">Skill Gap vs Batch Average</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {studentData?.department || "Your"} batch average
          </p>

          <div className="mt-4 space-y-3">
            {(recommendation?.skill_gaps || []).length === 0 ? (
              <p className="rounded-xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                Skill benchmark data will appear after your next recommendation cycle.
              </p>
            ) : (
              recommendation?.skill_gaps.map((gap) => {
                const studentLabel = (gap.student_proficiency || "beginner").replace(/^./, (char) => char.toUpperCase());
                const peerLabel = toAverageProficiencyLabel(gap.peer_avg_proficiency);

                return (
                  <div key={gap.skill_name} className="rounded-xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-[var(--ink)]">{gap.skill_name}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${proficiencyPillClass(studentLabel)}`}
                      >
                        You: {studentLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Batch average: {peerLabel} ({gap.peer_avg_proficiency.toFixed(1)})
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--card)] p-5 md:p-6">
          <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl">Score Breakdown</h2>
          <div className="mt-4 space-y-4">
            {breakdownItems.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--ink)]">{item.label}</span>
                  <span className="font-medium text-[var(--muted-foreground)]">
                    {item.value.toFixed(1)} / {item.max}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(26,26,26,0.12)]">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarClass(item.percent)}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--card)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl">Messages from your TPC</h2>

        <div className="mt-4 space-y-3">
          {isNotificationsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
              </div>
            ))
          ) : notifications.length === 0 ? (
            <p className="rounded-xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Your TPC has not sent any messages yet.
            </p>
          ) : (
            notifications.map((item) => {
              const unread = item.is_read === false;
              return (
                <article
                  key={item.id}
                  className={`rounded-xl border bg-[var(--paper)] p-4 ${
                    unread
                      ? "border-red-300 border-l-4 border-l-[var(--red)]"
                      : "border-[rgba(26,26,26,0.12)]"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-[var(--ink)]">
                    {item.message_preview || "New intervention update from your TPC."}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                    {toRelativeTime(item.delivered_at || item.sent_at || item.created_at)}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgba(26,26,26,0.14)] bg-[var(--card)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-dm-serif-display)] text-2xl">Upcoming drives</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isDrivesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
                <div className="mt-5 h-9 w-full animate-pulse rounded bg-[rgba(26,26,26,0.09)]" />
              </div>
            ))
          ) : drives.length === 0 ? (
            <p className="col-span-full rounded-xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              No upcoming drives are open right now.
            </p>
          ) : (
            drives.map((drive) => {
              const isApplied = appliedDriveIds.includes(drive.id);
              const isSubmitting = isApplyingDrive === drive.id;

              return (
                <article key={drive.id} className="rounded-2xl border border-[rgba(26,26,26,0.12)] bg-[var(--paper)] p-4">
                  <p className="font-semibold text-[var(--ink)]">{drive.company_name}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{drive.role}</p>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">Package: {drive.package_lpa} LPA</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">Date: {toReadableDate(drive.drive_date)}</p>

                  <div className="mt-4">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Applied ✓
                      </span>
                    ) : (
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--red)] px-3 py-2 text-sm text-[var(--paper)] transition hover:bg-[#a93226] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        onClick={() => void handleApplyNow(drive.id)}
                        type="button"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          "Apply Now"
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
