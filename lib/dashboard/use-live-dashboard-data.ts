"use client";

import * as React from "react";

import { api } from "@/lib/api";
import { formatRelativeDate, formatShortDate, toTimestamp } from "@/lib/date";
import {
  fallbackDashboardViewData,
  type DashboardViewData,
} from "@/lib/dashboard/dashboard-view";
import type {
  Alert,
  AnalyticsOverview,
  ApiEnvelope,
  DepartmentBreakdown,
  PagedResponse,
  ScoreTrend,
  StudentProfile,
} from "@/lib/types";

interface DashboardLiveApiResponse {
  success: boolean;
  data?: DashboardViewData;
  message?: string;
}

type DashboardDepartmentBreakdown = DepartmentBreakdown & {
  placement_ready?: number;
  at_risk?: number;
  silent_dropout?: number;
};

type DashboardScoreTrend = ScoreTrend & {
  all_students?: number;
  at_risk?: number;
  placement_ready?: number;
};

export interface DashboardTabStudent {
  id: string;
  studentName: string;
  riskScore: number;
  department: string;
  clusterLabel: string;
  lastActiveLabel: string;
}

export interface DashboardTabAlert {
  id: string;
  studentName: string;
  riskScore: number;
  triggerReason: string;
  department: string;
  lastActiveLabel: string;
  severity: "Critical" | "High" | "Medium";
  actionLabel: "Intervene" | "View";
}

export interface DashboardOverviewCounts {
  totalStudents: number;
  placedCount: number;
  atRiskCount: number;
  silentDropoutCount: number;
  placementRate: number;
  avgVigiloScore: number;
  alertsOpen: number;
}

const DASHBOARD_REFRESH_EVENT = "vigilo-dashboard-refresh";
const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function relativeFromNow(dateString: string | null | undefined): string {
  return formatRelativeDate(dateString, "just now");
}

function severityLabel(severity: Alert["severity"] | undefined): "Critical" | "High" | "Medium" {
  if (severity === "critical") {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  return "Medium";
}

function clusterLabel(cluster: string | null | undefined): string {
  if (cluster === "placement_ready") {
    return "Placement Ready";
  }

  if (cluster === "at_risk") {
    return "At-Risk";
  }

  if (cluster === "silent_dropout") {
    return "Silent Dropout";
  }

  return "Unknown";
}

function mapFallbackStudentsToDashboardRows(students: DashboardViewData["students"]): DashboardTabStudent[] {
  return students.slice(0, 10).map((student) => ({
    id: student.id,
    studentName: student.name,
    riskScore: clamp(Math.round(toNumber(student.riskScore, 50)), 0, 100),
    department: student.department,
    clusterLabel: clusterLabel(
      student.cluster === "ready"
        ? "placement_ready"
        : student.cluster === "at-risk"
          ? "at_risk"
          : "silent_dropout",
    ),
    lastActiveLabel: relativeFromNow(student.lastActive),
  }));
}

function mapStudentsToDashboardRows(students: StudentProfile[]): DashboardTabStudent[] {
  return students
    .slice()
    .sort((left, right) => toNumber(left.risk_score, 0) - toNumber(right.risk_score, 0))
    .slice(0, 10)
    .map((student) => ({
      id: student.id,
      studentName: student.full_name || "Student",
      riskScore: clamp(Math.round(toNumber(student.risk_score, 50)), 0, 100),
      department: student.department || "Unknown",
      clusterLabel: clusterLabel(student.cluster),
      lastActiveLabel: relativeFromNow(student.last_portal_login || student.score_computed_at),
    }));
}

function mapFallbackAlertsToDashboardRows(alerts: DashboardViewData["dashboardRecentAlerts"]): DashboardTabAlert[] {
  return alerts.slice(0, 10).map((alert) => ({
    id: alert.id,
    studentName: alert.studentName,
    riskScore: alert.riskScore,
    triggerReason: alert.triggerReason,
    department: alert.department,
    lastActiveLabel: alert.lastActiveLabel,
    severity: alert.severity,
    actionLabel: alert.actionLabel,
  }));
}

function mapAlertsToDashboardRows(alerts: Alert[]): DashboardTabAlert[] {
  return alerts
    .slice()
    .sort(
      (left, right) =>
        toTimestamp(right.triggered_at, 0) - toTimestamp(left.triggered_at, 0),
    )
    .slice(0, 10)
    .map((alert) => ({
      id: alert.id,
      studentName: alert.student_name || "Student",
      riskScore: clamp(Math.round(toNumber(alert.student_risk_score, 50)), 0, 100),
      triggerReason: alert.message || "Signal detected by AI engine",
      department: alert.student_department || "Unknown",
      lastActiveLabel: relativeFromNow(alert.triggered_at),
      severity: severityLabel(alert.severity),
      actionLabel:
        alert.severity === "critical" || alert.severity === "high"
          ? "Intervene"
          : "View",
    }));
}

function mapOverviewCounts(
  overview: AnalyticsOverview | null,
  currentData: DashboardViewData,
): DashboardOverviewCounts {
  if (!overview) {
    const totalFromSegments = currentData.dashboardSegments.reduce(
      (sum, segment) => sum + toNumber(segment.count, 0),
      0,
    );
    const alertsOpen = toNumber(currentData.riskAlertStats[2]?.value?.replace(/,/g, ""), 0);

    return {
      totalStudents: totalFromSegments,
      placedCount: 0,
      atRiskCount: toNumber(currentData.dashboardSegments[1]?.count, 0),
      silentDropoutCount: toNumber(currentData.dashboardSegments[3]?.count, 0),
      placementRate: toNumber(currentData.dashboardMetrics[0]?.value?.replace("%", ""), 0),
      avgVigiloScore: 0,
      alertsOpen,
    };
  }

  return {
    totalStudents: Math.max(0, Math.round(toNumber(overview.total_students, 0))),
    placedCount: Math.max(0, Math.round(toNumber(overview.placed_count, 0))),
    atRiskCount: Math.max(0, Math.round(toNumber(overview.at_risk_count, 0))),
    silentDropoutCount: Math.max(0, Math.round(toNumber(overview.silent_dropout_count, 0))),
    placementRate: round(clamp(toNumber(overview.placement_rate, 0), 0, 100), 1),
    avgVigiloScore: round(clamp(toNumber(overview.avg_vigilo_score, 0), 0, 100), 1),
    alertsOpen: Math.max(0, Math.round(toNumber(overview.alerts_open, 0))),
  };
}

function mapDashboardMetricsFromOverview(
  metrics: DashboardViewData["dashboardMetrics"],
  overview: DashboardOverviewCounts,
): DashboardViewData["dashboardMetrics"] {
  const placementReady = Math.max(
    overview.totalStudents - overview.atRiskCount - overview.silentDropoutCount,
    0,
  );
  const highRisk = overview.atRiskCount + overview.silentDropoutCount;

  return [
    {
      ...metrics[0],
      value: `${overview.placementRate}%`,
      delta: `${overview.avgVigiloScore}% avg vigilo score`,
      subtitle: "Live analytics overview snapshot",
    },
    {
      ...metrics[1],
      value: compact(highRisk),
      delta: `${compact(overview.alertsOpen)} open alerts`,
      subtitle: "At-risk and silent-dropout students",
    },
    {
      ...metrics[2],
      value: compact(overview.atRiskCount),
      delta: `${compact(overview.silentDropoutCount)} silent dropout`,
      subtitle: "Students that need active intervention",
    },
    {
      ...metrics[3],
      value: compact(placementReady),
      delta: `${compact(overview.placedCount)} placed`,
      subtitle: "Students currently in placement-ready cluster",
    },
  ];
}

function mapRiskDistribution(
  fallbackData: DashboardViewData["dashboardRiskDistribution"],
  breakdown: DashboardDepartmentBreakdown[] | null,
): DashboardViewData["dashboardRiskDistribution"] {
  if (!breakdown || breakdown.length === 0) {
    return fallbackData.map((item) => ({
      ...item,
      placement_ready: toNumber((item as { placement_ready?: number }).placement_ready, item.ready),
      at_risk: toNumber((item as { at_risk?: number }).at_risk, item.atRisk),
      silent_dropout: toNumber((item as { silent_dropout?: number }).silent_dropout, item.unprepared),
    }));
  }

  return breakdown.map((entry) => {
    const total = Math.max(0, Math.round(toNumber(entry.student_count, 0)));
    const placementReady = Math.max(
      0,
      Math.round(toNumber(entry.placement_ready, toNumber(entry.placed_count, 0))),
    );
    const atRisk = Math.max(
      0,
      Math.round(toNumber(entry.at_risk, toNumber(entry.at_risk_count, 0))),
    );
    const silentDropout = Math.max(
      0,
      Math.round(toNumber(entry.silent_dropout, Math.max(total - placementReady - atRisk, 0))),
    );

    return {
      department: entry.department || "Unknown",
      placement_ready: placementReady,
      at_risk: atRisk,
      silent_dropout: silentDropout,
      ready: placementReady,
      atRisk,
      unprepared: silentDropout,
    };
  });
}

function mapScoreTrend(
  fallbackData: DashboardViewData["dashboardProbabilityTrend"],
  trend: DashboardScoreTrend[] | null,
): DashboardViewData["dashboardProbabilityTrend"] {
  if (!trend || trend.length === 0) {
    return fallbackData.map((point) => ({
      ...point,
      all_students: toNumber((point as { all_students?: number }).all_students, point.average),
      at_risk: toNumber((point as { at_risk?: number }).at_risk, point.atRisk),
      placement_ready: toNumber((point as { placement_ready?: number }).placement_ready, point.ready),
    }));
  }

  const sorted = trend
    .filter((entry) => !!entry.date)
    .sort((left, right) =>
      String(left.date || "").localeCompare(String(right.date || "")),
    )
    .slice(-8);

  return sorted.map((entry, index) => {
    const allStudents = round(
      clamp(toNumber(entry.all_students, toNumber(entry.avg_score, 0)), 0, 100),
      1,
    );
    const atRisk = round(
      clamp(toNumber(entry.at_risk, allStudents - 10), 0, 100),
      1,
    );
    const placementReady = round(
      clamp(toNumber(entry.placement_ready, allStudents + 10), 0, 100),
      1,
    );

    const date = entry.date ? new Date(entry.date) : null;
    const week =
      date && !Number.isNaN(date.getTime()) ? formatShortDate(date, `W${index + 1}`) : `W${index + 1}`;

    return {
      week,
      all_students: allStudents,
      at_risk: atRisk,
      placement_ready: placementReady,
      average: allStudents,
      atRisk,
      ready: placementReady,
    };
  });
}

function readLiveDashboardPayload(body: unknown): DashboardViewData | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as DashboardLiveApiResponse;
  if (!payload.success || !payload.data) {
    return null;
  }

  return payload.data;
}

export function triggerLiveDashboardRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT));
}

export function useLiveDashboardData() {
  const [data, setData] = React.useState<DashboardViewData>(fallbackDashboardViewData);
  const [overviewCounts, setOverviewCounts] =
    React.useState<DashboardOverviewCounts>(() =>
      mapOverviewCounts(null, fallbackDashboardViewData),
    );
  const [dashboardTabStudents, setDashboardTabStudents] = React.useState<DashboardTabStudent[]>(
    mapFallbackStudentsToDashboardRows(fallbackDashboardViewData.students),
  );
  const [dashboardTabAlerts, setDashboardTabAlerts] = React.useState<DashboardTabAlert[]>(
    mapFallbackAlertsToDashboardRows(fallbackDashboardViewData.dashboardRecentAlerts),
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasLoadedRef = React.useRef(false);

  const load = React.useCallback(async (silent: boolean) => {
    if (!hasLoadedRef.current && !silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const [
      liveDashboardResult,
      overviewResult,
      riskBreakdownResult,
      trendResult,
      studentsTabResult,
      alertsTabResult,
    ] = await Promise.allSettled([
      fetch("/api/dashboard/live", {
        cache: "no-store",
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load aggregated dashboard data");
        }
        return readLiveDashboardPayload(await response.json());
      }),
      api.get<ApiEnvelope<AnalyticsOverview>>("/api/v1/analytics/overview"),
      api.get<ApiEnvelope<DashboardDepartmentBreakdown[]>>(
        "/api/v1/analytics/department-breakdown",
      ),
      api.get<ApiEnvelope<DashboardScoreTrend[]>>("/api/v1/analytics/score-trend"),
      api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
        cluster: "silent_dropout",
        limit: 10,
        sort: "score_asc",
      }),
      api.get<ApiEnvelope<PagedResponse<Alert>>>("/api/v1/alerts", {
        is_resolved: false,
        limit: 10,
        page: 1,
      }),
    ]);

    try {
      const liveData =
        liveDashboardResult.status === "fulfilled" && liveDashboardResult.value
          ? liveDashboardResult.value
          : fallbackDashboardViewData;

      const overview =
        overviewResult.status === "fulfilled" ? overviewResult.value.data : null;
      const departmentBreakdown =
        riskBreakdownResult.status === "fulfilled" ? riskBreakdownResult.value.data : null;
      const scoreTrend = trendResult.status === "fulfilled" ? trendResult.value.data : null;
      const studentsTab =
        studentsTabResult.status === "fulfilled" ? studentsTabResult.value.data : null;
      const alertsTab =
        alertsTabResult.status === "fulfilled"
          ? alertsTabResult.value.data.items || []
          : null;

      const nextOverviewCounts = mapOverviewCounts(overview, liveData);

      const nextData: DashboardViewData = {
        ...liveData,
        dashboardMetrics: mapDashboardMetricsFromOverview(
          liveData.dashboardMetrics,
          nextOverviewCounts,
        ),
        dashboardRiskDistribution: mapRiskDistribution(
          liveData.dashboardRiskDistribution,
          departmentBreakdown,
        ),
        dashboardProbabilityTrend: mapScoreTrend(
          liveData.dashboardProbabilityTrend,
          scoreTrend,
        ),
      };

      setData(nextData);
      setOverviewCounts(nextOverviewCounts);
      setDashboardTabStudents(
        studentsTab
          ? mapStudentsToDashboardRows(studentsTab)
          : mapFallbackStudentsToDashboardRows(nextData.students),
      );
      setDashboardTabAlerts(
        alertsTab
          ? mapAlertsToDashboardRows(alertsTab)
          : mapFallbackAlertsToDashboardRows(nextData.dashboardRecentAlerts),
      );
      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load dashboard data";
      setError(message);
      setData(fallbackDashboardViewData);
      setOverviewCounts(mapOverviewCounts(null, fallbackDashboardViewData));
      setDashboardTabStudents(
        mapFallbackStudentsToDashboardRows(fallbackDashboardViewData.students),
      );
      setDashboardTabAlerts(
        mapFallbackAlertsToDashboardRows(fallbackDashboardViewData.dashboardRecentAlerts),
      );
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refetch = React.useCallback(async () => {
    await load(true);
  }, [load]);

  React.useEffect(() => {
    let cancelled = false;

    const loadAndGuard = async (silent: boolean) => {
      if (cancelled) {
        return;
      }

      await load(silent);
    };

    void loadAndGuard(false);

    const intervalId = window.setInterval(() => {
      void loadAndGuard(true);
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    const onGlobalRefresh = () => {
      void loadAndGuard(true);
    };

    window.addEventListener(DASHBOARD_REFRESH_EVENT, onGlobalRefresh);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, onGlobalRefresh);
    };
  }, [load]);

  return {
    ...data,
    overviewCounts,
    dashboardTabStudents,
    dashboardTabAlerts,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
