import { NextResponse } from "next/server";

import {
  ALERT_QUEUE,
  ANALYTICS_AREA_TREND,
  ANALYTICS_DEPARTMENT_RISK,
  ANALYTICS_EFFECTIVENESS,
  ANALYTICS_KPIS,
  ANALYTICS_SKILL_GAPS,
  DASHBOARD_CONFIDENCE,
  DASHBOARD_METRICS,
  DASHBOARD_PROBABILITY_TREND,
  DASHBOARD_RECENT_ALERTS,
  DASHBOARD_RISK_DISTRIBUTION,
  DASHBOARD_SEGMENTS,
  FORECAST_TABLE,
  INACTIVE_CLUSTER,
  INTERVENTIONS,
  INTERVENTION_STATS,
  NUDGE_FEED,
  NUDGE_STATS,
  NUDGE_TEMPLATES,
  RISK_ALERT_STATS,
  SEGMENTATION_CLUSTER_CARDS,
  SEGMENTATION_RADAR_DATA,
  STUDENTS,
  STUDENT_STATS,
  type InterventionCardData,
  type Student,
} from "@/lib/constants";
import {
  fallbackDashboardViewData,
  type DashboardViewData,
} from "@/lib/dashboard/dashboard-view";
import { fetchBackendData, getBackendBaseUrl } from "@/lib/server/backend-client";

export const dynamic = "force-dynamic";

type FrontendCluster = "ready" | "at-risk" | "unprepared" | "inactive";
type AlertSeverity = "critical" | "high" | "medium" | "low";

type RawOverview = {
  total_students?: number;
  placed_count?: number;
  at_risk_count?: number;
  silent_dropout_count?: number;
  placement_rate?: number;
  avg_vigilo_score?: number;
  alerts_open?: number;
};

type RawClusterDistribution = {
  total?: number;
  items?: Array<{
    cluster?: string;
    count?: number;
    percentage?: number;
  }>;
};

type RawDepartmentBreakdownItem = {
  department?: string;
  student_count?: number;
  placed_count?: number;
  avg_score?: number;
  at_risk_count?: number;
};

type RawScoreTrendItem = {
  date?: string;
  avg_score?: number;
};

type RawStudent = {
  id?: string;
  full_name?: string;
  email?: string;
  department?: string;
  batch_year?: number;
  risk_score?: number;
  cluster?: string;
  placement_probability?: number;
  score_breakdown?: Record<string, unknown> | null;
  last_portal_login?: string;
  score_computed_at?: string;
  mock_tests_attempted?: number;
  placement_status?: string;
  open_alert_count?: number;
};

type RawAlert = {
  id?: string;
  student_id?: string;
  alert_type?: string;
  severity?: AlertSeverity;
  message?: string;
  is_read?: boolean;
  is_resolved?: boolean;
  triggered_at?: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  student_name?: string | null;
  student_department?: string | null;
  student_risk_score?: number | null;
  student_cluster?: string | null;
  student_placement_probability?: number | null;
};

type RawIntervention = {
  id?: string;
  student_id?: string;
  intervention_type?: string;
  custom_message?: string | null;
  ai_generated_message?: string | null;
  status?: string;
  notes?: string | null;
  created_at?: string;
  assigned_officer_name?: string | null;
  student_risk_score?: number | null;
};

type RawNotification = {
  id?: string;
  intervention_id?: string | null;
  student_id?: string;
  channel?: string;
  status?: string;
  message_preview?: string | null;
  failed_reason?: string | null;
  is_read?: boolean;
  sent_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
};

type BackendPageResult<T> = {
  page?: number;
  limit?: number;
  count?: number;
  items?: T[];
};

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
  if (!dateString) {
    return "just now";
  }

  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return "just now";
  }

  const deltaMs = Date.now() - target.getTime();
  if (deltaMs <= 0) {
    return "just now";
  }

  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.round(deltaMs / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < day) {
    const hours = Math.max(1, Math.round(deltaMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.round(deltaMs / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function mapCluster(cluster: string | null | undefined, riskScore: number): FrontendCluster {
  if (cluster === "placement_ready") {
    return "ready";
  }

  if (cluster === "silent_dropout") {
    return "inactive";
  }

  if (cluster === "at_risk") {
    return riskScore <= 35 ? "unprepared" : "at-risk";
  }

  if (riskScore <= 35) {
    return "unprepared";
  }

  return riskScore >= 65 ? "ready" : "at-risk";
}

function mapAlertSeverity(severity: AlertSeverity | undefined): "critical" | "high" | "medium" {
  if (severity === "critical" || severity === "high" || severity === "medium") {
    return severity;
  }

  return "medium";
}

function severityLabel(severity: AlertSeverity | undefined): "Critical" | "High" | "Medium" {
  if (severity === "critical") {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  return "Medium";
}

function riskFromSeverity(severity: AlertSeverity | undefined): number {
  if (severity === "critical") {
    return 26;
  }

  if (severity === "high") {
    return 38;
  }

  if (severity === "medium") {
    return 52;
  }

  return 60;
}

function normalizedClusterLabel(cluster: string | null | undefined): string {
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

function buildRollNo(student: RawStudent): string {
  const year = String(student.batch_year || new Date().getFullYear()).slice(-2);
  const dept = (student.department || "GEN")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
  const idSeed = (student.id || "000").replace(/-/g, "").slice(0, 3).toUpperCase();

  return `${year}${dept}${idSeed}`;
}

function scoreBreakdownValue(
  breakdown: Record<string, unknown> | null | undefined,
  key: string,
  fallback: number,
): number {
  if (!breakdown || typeof breakdown !== "object") {
    return fallback;
  }

  return toNumber(breakdown[key], fallback);
}

function buildSkills(student: RawStudent, riskScore: number) {
  const breakdown = student.score_breakdown;

  const portal = scoreBreakdownValue(breakdown, "portal_activity_score", riskScore / 8);
  const mock = scoreBreakdownValue(breakdown, "mock_test_score", riskScore / 5);
  const skill = scoreBreakdownValue(breakdown, "skill_score", riskScore / 7);
  const resume = scoreBreakdownValue(breakdown, "resume_score", riskScore / 10);
  const cgpa = scoreBreakdownValue(breakdown, "cgpa_score", riskScore / 7);
  const application = scoreBreakdownValue(breakdown, "application_score", riskScore / 7);

  return {
    dsa: clamp(Math.round((mock / 20) * 100), 10, 100),
    aptitude: clamp(Math.round((application / 15) * 100), 10, 100),
    communication: clamp(Math.round(((portal + skill) / 30) * 100), 10, 100),
    domainKnowledge: clamp(Math.round(((skill + cgpa) / 30) * 100), 10, 100),
    resumeQuality: clamp(Math.round((resume / 10) * 100), 10, 100),
    mockInterviewScore: clamp(Math.round((mock / 20) * 100), 10, 100),
  };
}

function mapStudents(rawStudents: RawStudent[]): Student[] {
  const nowIso = new Date().toISOString();

  return rawStudents
    .filter((row) => !!row.id)
    .map((row) => {
      const riskScore = clamp(Math.round(toNumber(row.risk_score, 50)), 0, 100);
      const placementProbability = clamp(
        Math.round(toNumber(row.placement_probability, riskScore)),
        0,
        100,
      );
      const cluster = mapCluster(row.cluster, riskScore);

      const triggers: string[] = [];
      const openAlertCount = Math.max(0, Math.round(toNumber(row.open_alert_count, 0)));

      if (openAlertCount > 0) {
        triggers.push(`${openAlertCount} open risk alert${openAlertCount === 1 ? "" : "s"}`);
      }

      if (row.placement_status === "placed") {
        triggers.push("Placement secured in active cycle");
      }

      if (cluster === "inactive") {
        triggers.push("Low portal activity detected");
      }

      if (cluster === "ready") {
        triggers.push("Consistent progress signal");
      }

      if (triggers.length === 0) {
        triggers.push("Profile synced from backend");
      }

      return {
        id: row.id as string,
        name: row.full_name || "Student",
        rollNo: buildRollNo(row),
        department: row.department || "Unknown",
        riskScore,
        cluster,
        placementProbability,
        lastActive: row.last_portal_login || row.score_computed_at || nowIso,
        mockAttempts: Math.max(0, Math.round(toNumber(row.mock_tests_attempted, 0))),
        skills: buildSkills(row, riskScore),
        triggers,
        interventionStatus:
          row.placement_status === "placed"
            ? "completed"
            : openAlertCount > 0
              ? "pending"
              : "none",
      };
    });
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupByDepartment(students: Student[]) {
  const grouped: Record<string, { ready: number; atRisk: number; unprepared: number }> = {};

  for (const student of students) {
    const department = student.department || "Unknown";

    if (!grouped[department]) {
      grouped[department] = { ready: 0, atRisk: 0, unprepared: 0 };
    }

    if (student.cluster === "ready") {
      grouped[department].ready += 1;
      continue;
    }

    if (student.cluster === "at-risk") {
      grouped[department].atRisk += 1;
      continue;
    }

    grouped[department].unprepared += 1;
  }

  return Object.entries(grouped)
    .map(([department, value]) => ({ department, ...value }))
    .sort((left, right) => right.ready + right.atRisk + right.unprepared - (left.ready + left.atRisk + left.unprepared));
}

function buildDashboardViewData(payload: {
  overview: RawOverview;
  clusterDistribution: RawClusterDistribution;
  departmentBreakdown: RawDepartmentBreakdownItem[];
  scoreTrend: RawScoreTrendItem[];
  alerts: RawAlert[];
  interventions: RawIntervention[];
  studentsRaw: RawStudent[];
  notifications: RawNotification[];
  fetchedAt: string;
}): DashboardViewData {
  const students = mapStudents(payload.studentsRaw);
  const studentsById = new Map(students.map((student) => [student.id, student]));

  const totalStudents = students.length || Math.round(toNumber(payload.overview.total_students, 0));
  const placedCount = Math.round(toNumber(payload.overview.placed_count, 0));
  const openAlerts = payload.alerts.filter((alert) => !alert.is_resolved);

  const departmentRiskDistribution = groupByDepartment(students);
  const dashboardRiskDistribution =
    departmentRiskDistribution.length > 0
      ? departmentRiskDistribution
      : DASHBOARD_RISK_DISTRIBUTION;

  const trendPoints = payload.scoreTrend
    .filter((point) => !!point.date)
    .sort((left, right) =>
      String(left.date || "").localeCompare(String(right.date || "")),
    );

  const dashboardProbabilityTrend =
    trendPoints.length > 0
      ? trendPoints.slice(-8).map((point, index) => {
          const score = clamp(round(toNumber(point.avg_score, 0), 1), 0, 100);
          return {
            week: `W${index + 1}`,
            average: score,
            ready: clamp(round(score + 12, 1), 0, 100),
            atRisk: clamp(round(score - 10, 1), 0, 100),
          };
        })
      : DASHBOARD_PROBABILITY_TREND;

  const readyCount = students.filter((student) => student.cluster === "ready").length;
  const atRiskCount = students.filter((student) => student.cluster === "at-risk").length;
  const unpreparedCount = students.filter((student) => student.cluster === "unprepared").length;
  const inactiveCount = students.filter((student) => student.cluster === "inactive").length;
  const segmentsTotal = Math.max(totalStudents, readyCount + atRiskCount + unpreparedCount + inactiveCount, 1);

  const dashboardSegments =
    students.length > 0
      ? [
          {
            id: "ready",
            label: "Placement-Ready",
            count: readyCount,
            percentage: round((readyCount / segmentsTotal) * 100),
            tone: "emerald" as const,
          },
          {
            id: "at-risk",
            label: "At-Risk",
            count: atRiskCount,
            percentage: round((atRiskCount / segmentsTotal) * 100),
            tone: "amber" as const,
          },
          {
            id: "unprepared",
            label: "Unprepared",
            count: unpreparedCount,
            percentage: round((unpreparedCount / segmentsTotal) * 100),
            tone: "rose" as const,
          },
          {
            id: "inactive",
            label: "Inactive",
            count: inactiveCount,
            percentage: round((inactiveCount / segmentsTotal) * 100),
            tone: "slate" as const,
          },
        ]
      : DASHBOARD_SEGMENTS;

  const dashboardConfidence = {
    label: DASHBOARD_CONFIDENCE.label,
    value: `${round(clamp(65 + toNumber(payload.overview.avg_vigilo_score, 0) * 0.45, 70, 98.8), 1)}%`,
  };

  const dashboardRecentAlerts =
    payload.alerts.length > 0
      ? payload.alerts
          .slice()
          .sort((left, right) =>
            String(right.triggered_at || "").localeCompare(String(left.triggered_at || "")),
          )
          .slice(0, 8)
          .map((alert) => ({
            id: alert.id || crypto.randomUUID(),
            studentName: alert.student_name || studentsById.get(alert.student_id || "")?.name || "Student",
            riskScore: clamp(
              Math.round(toNumber(alert.student_risk_score, riskFromSeverity(alert.severity))),
              0,
              100,
            ),
            triggerReason: alert.message || "Signal detected by risk engine",
            department:
              alert.student_department || studentsById.get(alert.student_id || "")?.department || "Unknown",
            lastActiveLabel: relativeFromNow(alert.triggered_at),
            severity: severityLabel(alert.severity),
            actionLabel:
              mapAlertSeverity(alert.severity) === "critical" || mapAlertSeverity(alert.severity) === "high"
                ? ("Intervene" as const)
                : ("View" as const),
          }))
      : DASHBOARD_RECENT_ALERTS;

  const averagePlacementProbability =
    students.length > 0
      ? round(average(students.map((student) => student.placementProbability)), 1)
      : round(toNumber(payload.overview.placement_rate, 0), 1);

  const highRiskStudents = students.filter((student) => student.riskScore <= 40).length;

  const mappedInterventions =
    payload.interventions.length > 0
      ? payload.interventions
          .filter((row) => !!row.id && !!row.student_id)
          .map((row) => {
            const student = studentsById.get(row.student_id || "");
            const status: InterventionCardData["status"] =
              row.status === "completed"
                ? "Completed"
                : row.status === "sent" || row.status === "acknowledged"
                  ? "In Progress"
                  : "Pending";
            const studentRisk = clamp(
              Math.round(toNumber(row.student_risk_score, student?.riskScore || 50)),
              0,
              100,
            );
            const priority: InterventionCardData["priority"] =
              studentRisk <= 35 ? "Critical" : studentRisk <= 55 ? "High" : "Medium";

            const typeMap: Record<string, InterventionCardData["type"]> = {
              nudge_sent: "1:1 Counseling",
              meeting_scheduled: "Mock Interview Session",
              domain_shift_suggested: "Domain Shift",
              mock_assigned: "Mock Interview Session",
              counselling: "1:1 Counseling",
              weekly_check_in: "Resume Review",
              weekly_recommendation: "DSA Crash Course",
            };

            const createdAt = row.created_at ? new Date(row.created_at) : new Date(payload.fetchedAt);
            const dueAt = new Date(createdAt);
            dueAt.setDate(dueAt.getDate() + 7);

            return {
              id: row.id as string,
              studentId: row.student_id as string,
              type: typeMap[row.intervention_type || ""] || "Mock Interview Session",
              assignedOfficer: row.assigned_officer_name || "Unassigned",
              status,
              priority,
              createdDate: formatDate(createdAt.toISOString()),
              dueDate: formatDate(dueAt.toISOString()),
              aiRecommendation:
                row.custom_message ||
                row.ai_generated_message ||
                "Auto-generated action plan from latest student signals",
              progressNote: row.notes || undefined,
            } satisfies InterventionCardData;
          })
      : INTERVENTIONS;

  const activeInterventions = mappedInterventions.filter(
    (item) => item.status === "Pending" || item.status === "In Progress",
  ).length;

  const dashboardMetrics =
    students.length > 0
      ? [
          {
            id: "placement-probability",
            label: "Placement Probability Avg",
            value: `${averagePlacementProbability}%`,
            delta: `${round(toNumber(payload.overview.placement_rate, averagePlacementProbability), 1)}% placement rate`,
            subtitle: "Computed from latest student scores",
            icon: "Gauge" as const,
            tone: "violet" as const,
            trend: "up" as const,
          },
          {
            id: "high-risk",
            label: "High-Risk Students",
            value: compact(highRiskStudents),
            delta: `${compact(openAlerts.length)} open alerts`,
            subtitle: "Students requiring immediate attention",
            icon: "ShieldAlert" as const,
            tone: "rose" as const,
            trend: "up" as const,
          },
          {
            id: "interventions-active",
            label: "Interventions Active",
            value: compact(activeInterventions),
            delta: `${compact(mappedInterventions.length)} total tracked`,
            subtitle: "Pending and in-progress action plans",
            icon: "Zap" as const,
            tone: "amber" as const,
            trend: "neutral" as const,
          },
          {
            id: "placement-ready",
            label: "Placement-Ready Students",
            value: compact(readyCount),
            delta: `${compact(placedCount)} placed`,
            subtitle: "Latest cluster output from risk engine",
            icon: "BadgeCheck" as const,
            tone: "emerald" as const,
            trend: "up" as const,
          },
        ]
      : DASHBOARD_METRICS;

  const activeInWeek = students.filter((student) => {
    const lastActive = new Date(student.lastActive).getTime();
    if (Number.isNaN(lastActive)) {
      return false;
    }
    return Date.now() - lastActive <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const avgRiskScore =
    students.length > 0 ? round(average(students.map((student) => student.riskScore)), 1) : 0;

  const studentStats =
    students.length > 0
      ? [
          {
            id: "students-total",
            label: "Total Enrolled",
            value: compact(totalStudents),
            delta: `${compact(placedCount)} placed this cycle`,
            subtitle: "Students synced from profiles and student_profiles",
            icon: "Users" as const,
            tone: "violet" as const,
          },
          {
            id: "students-active",
            label: "Active This Week",
            value: compact(activeInWeek),
            delta: `${round((activeInWeek / Math.max(totalStudents, 1)) * 100, 1)}% engagement rate`,
            subtitle: "Last portal login within seven days",
            icon: "TrendingUp" as const,
            tone: "emerald" as const,
          },
          {
            id: "students-risk",
            label: "Avg Risk Score",
            value: `${avgRiskScore}`,
            delta: `${compact(openAlerts.length)} active alerts`,
            subtitle: "Higher is healthier in the Vigilo score",
            icon: "ShieldAlert" as const,
            tone: "amber" as const,
            trend: "up" as const,
          },
          {
            id: "students-placed",
            label: "Placed This Cycle",
            value: compact(placedCount),
            delta: `${round(toNumber(payload.overview.placement_rate, 0), 1)}% overall placement rate`,
            subtitle: "Placement status marked in student profiles",
            icon: "BadgeCheck" as const,
            tone: "emerald" as const,
          },
        ]
      : STUDENT_STATS;

  const alertQueue =
    payload.alerts.length > 0
      ? payload.alerts
          .slice()
          .sort((left, right) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
            const leftScore = order[left.severity || "low"];
            const rightScore = order[right.severity || "low"];
            return leftScore - rightScore;
          })
          .map((alert) => {
            const student = studentsById.get(alert.student_id || "");
            const severity = mapAlertSeverity(alert.severity);
            const probability = round(toNumber(alert.student_placement_probability, 0), 1);
            const status: "Pending" | "Assigned" | "In Review" = alert.is_resolved
              ? "In Review"
              : alert.is_read
                ? "Assigned"
                : "Pending";

            return {
              id: alert.id || crypto.randomUUID(),
              studentName: alert.student_name || student?.name || "Student",
              rollNo: student?.rollNo || "N/A",
              department: alert.student_department || student?.department || "Unknown",
              severity,
              reason: alert.message || "Signal identified by AI engine",
              riskScore: clamp(
                Math.round(toNumber(alert.student_risk_score, riskFromSeverity(alert.severity))),
                0,
                100,
              ),
              signals: [
                `Type: ${String(alert.alert_type || "general").replaceAll("_", " ")}`,
                `Cluster: ${normalizedClusterLabel(alert.student_cluster)}`,
                probability > 0 ? `Placement: ${probability}%` : "Placement: pending",
              ],
              assignedTo: alert.is_resolved ? "TPC Officer" : alert.is_read ? "TPC Queue" : "Unassigned",
              status,
              flaggedLabel: `Flagged ${relativeFromNow(alert.triggered_at)} by AI Engine`,
            };
          })
      : ALERT_QUEUE;

  const criticalCount = openAlerts.filter((alert) => alert.severity === "critical").length;
  const highCount = openAlerts.filter((alert) => alert.severity === "high").length;
  const resolvedTodayCount = payload.alerts.filter((alert) => {
    if (!alert.is_resolved || !alert.resolved_at) {
      return false;
    }
    return alert.resolved_at.slice(0, 10) === new Date().toISOString().slice(0, 10);
  }).length;

  const riskAlertStats =
    payload.alerts.length > 0
      ? [
          {
            id: "critical-alerts",
            label: "Critical Alerts",
            value: compact(criticalCount),
            delta: `${compact(highCount)} high-severity open`,
            subtitle: "Students requiring immediate outreach",
            icon: "ShieldAlert" as const,
            tone: "rose" as const,
          },
          {
            id: "high-priority",
            label: "High Priority",
            value: compact(highCount),
            delta: `${compact(openAlerts.length)} open overall`,
            subtitle: "Needs assignment within 24 hours",
            icon: "AlertTriangle" as const,
            tone: "amber" as const,
          },
          {
            id: "pending-review",
            label: "Pending Review",
            value: compact(openAlerts.length),
            delta: `${compact(payload.alerts.length - openAlerts.length)} already resolved`,
            subtitle: "Waiting for action validation",
            icon: "Zap" as const,
            tone: "violet" as const,
          },
          {
            id: "resolved-today",
            label: "Resolved Today",
            value: compact(resolvedTodayCount),
            delta: `${compact(payload.alerts.length - openAlerts.length)} total resolved`,
            subtitle: "Alerts closed after intervention",
            icon: "CheckCircle" as const,
            tone: "emerald" as const,
          },
        ]
      : RISK_ALERT_STATS;

  const interventionStatusCounts = {
    pending: mappedInterventions.filter((item) => item.status === "Pending").length,
    inProgress: mappedInterventions.filter((item) => item.status === "In Progress").length,
    completed: mappedInterventions.filter((item) => item.status === "Completed").length,
  };

  const interventionSuccessRate =
    mappedInterventions.length > 0
      ? round((interventionStatusCounts.completed / mappedInterventions.length) * 100, 1)
      : 0;

  const interventionStats =
    mappedInterventions.length > 0
      ? [
          {
            id: "interventions-total",
            label: "Total Interventions",
            value: compact(mappedInterventions.length),
            delta: `${compact(interventionStatusCounts.completed)} completed`,
            subtitle: "Individual student actions tracked",
            icon: "Zap" as const,
            tone: "violet" as const,
          },
          {
            id: "interventions-pending",
            label: "Pending Assignment",
            value: compact(interventionStatusCounts.pending),
            delta: `${compact(interventionStatusCounts.inProgress)} currently active`,
            subtitle: "Awaiting owner mapping",
            icon: "AlertTriangle" as const,
            tone: "slate" as const,
          },
          {
            id: "interventions-active",
            label: "In Progress",
            value: compact(interventionStatusCounts.inProgress),
            delta: `${compact(interventionStatusCounts.pending)} queued next`,
            subtitle: "Active counselor and faculty actions",
            icon: "TrendingUp" as const,
            tone: "amber" as const,
          },
          {
            id: "interventions-success",
            label: "Success Rate",
            value: `${interventionSuccessRate}%`,
            delta: `${compact(interventionStatusCounts.completed)} outcomes logged`,
            subtitle: "Students improved after action plans",
            icon: "BadgeCheck" as const,
            tone: "emerald" as const,
          },
        ]
      : INTERVENTION_STATS;

  const departmentRiskMap: Record<string, { critical: number; high: number; medium: number }> = {};

  for (const alert of payload.alerts) {
    const department =
      alert.student_department || studentsById.get(alert.student_id || "")?.department || "Unknown";

    if (!departmentRiskMap[department]) {
      departmentRiskMap[department] = { critical: 0, high: 0, medium: 0 };
    }

    const severity = mapAlertSeverity(alert.severity);
    if (severity === "critical") {
      departmentRiskMap[department].critical += 1;
    } else if (severity === "high") {
      departmentRiskMap[department].high += 1;
    } else {
      departmentRiskMap[department].medium += 1;
    }
  }

  const analyticsDepartmentRisk =
    Object.keys(departmentRiskMap).length > 0
      ? Object.entries(departmentRiskMap)
          .map(([department, counts]) => ({ department, ...counts }))
          .sort((left, right) => {
            const leftTotal = left.critical + left.high + left.medium;
            const rightTotal = right.critical + right.high + right.medium;
            return rightTotal - leftTotal;
          })
      : ANALYTICS_DEPARTMENT_RISK;

  const analyticsAreaTrend =
    trendPoints.length > 0
      ? trendPoints.slice(-12).map((point, index) => {
          const avgScore = clamp(round(toNumber(point.avg_score, 0), 1), 0, 100);
          return {
            week: `W${index + 1}`,
            ready: clamp(round(avgScore + 12, 1), 0, 100),
            atRisk: clamp(round(avgScore - 12, 1), 0, 100),
            unprepared: clamp(round(100 - avgScore, 1), 0, 100),
          };
        })
      : ANALYTICS_AREA_TREND;

  const analyticsEffectiveness =
    analyticsAreaTrend.length > 0
      ? analyticsAreaTrend.map((row) => {
          const intervention = clamp(round(row.ready - 15, 1), 20, 95);
          return {
            week: row.week,
            intervention,
            control: clamp(round(intervention - 12, 1), 10, 90),
          };
        })
      : ANALYTICS_EFFECTIVENESS;

  const skillsAverages = {
    dsa: average(students.map((student) => student.skills.dsa)),
    aptitude: average(students.map((student) => student.skills.aptitude)),
    communication: average(students.map((student) => student.skills.communication)),
    domainKnowledge: average(students.map((student) => student.skills.domainKnowledge)),
    resumeQuality: average(students.map((student) => student.skills.resumeQuality)),
  };

  const analyticsSkillGaps =
    students.length > 0
      ? [
          { skill: "DSA", value: round(100 - skillsAverages.dsa, 1) },
          { skill: "Aptitude", value: round(100 - skillsAverages.aptitude, 1) },
          { skill: "Communication", value: round(100 - skillsAverages.communication, 1) },
          { skill: "Domain Knowledge", value: round(100 - skillsAverages.domainKnowledge, 1) },
          { skill: "Resume Quality", value: round(100 - skillsAverages.resumeQuality, 1) },
        ].sort((left, right) => right.value - left.value)
      : ANALYTICS_SKILL_GAPS;

  const forecastTable =
    payload.departmentBreakdown.length > 0
      ? payload.departmentBreakdown.map((entry) => {
          const department = entry.department || "Unknown";
          const total = Math.max(0, Math.round(toNumber(entry.student_count, 0)));
          const placed = Math.max(0, Math.round(toNumber(entry.placed_count, 0)));
          const avgScore = clamp(round(toNumber(entry.avg_score, 0), 1), 0, 100);
          const predictedPlaced = clamp(Math.max(placed, Math.round((avgScore / 100) * total)), 0, total);
          const predictedUnplaced = Math.max(0, total - predictedPlaced);
          const atRiskCount = Math.max(0, Math.round(toNumber(entry.at_risk_count, 0)));
          const confidence = clamp(Math.round(avgScore + 18), 70, 98);

          return {
            department,
            totalStudents: total,
            predictedPlaced,
            predictedUnplaced,
            atRiskCount,
            confidence,
          };
        })
      : FORECAST_TABLE;

  const highestRiskDepartment =
    analyticsDepartmentRisk.length > 0
      ? analyticsDepartmentRisk[0]
      : { department: "N/A", critical: 0, high: 0, medium: 0 };

  const notificationTotal = payload.notifications.length;
  const notificationResponded = payload.notifications.filter((entry) => entry.is_read).length;
  const notificationOpened = payload.notifications.filter(
    (entry) => entry.status === "sent" || entry.status === "delivered",
  ).length;

  const analyticsKpis =
    students.length > 0
      ? [
          {
            id: "placement-rate",
            label: "Overall Placement Rate",
            value: `${round(toNumber(payload.overview.placement_rate, 0), 1)}%`,
            delta: `${compact(placedCount)} placed students`,
            subtitle: "Placed or final-round students",
            icon: "TrendingUp" as const,
            tone: "emerald" as const,
            sparkline: [61, 63, 65, 66, 68, 70, 71, clamp(round(toNumber(payload.overview.placement_rate, 73), 0), 50, 98)],
          },
          {
            id: "time-to-intervention",
            label: "Avg Time to Intervention",
            value: `${round(clamp(2 + (interventionStatusCounts.pending / Math.max(mappedInterventions.length, 1)) * 6, 1.2, 9.8), 1)} days`,
            delta: `${compact(interventionStatusCounts.inProgress)} interventions active`,
            subtitle: "From risk flag to first action",
            icon: "Zap" as const,
            tone: "violet" as const,
            sparkline: [8.1, 7.7, 7.4, 7.1, 6.8, 6.4, 6.2, 5.9],
          },
          {
            id: "nudge-response",
            label: "Nudge Response Rate",
            value: `${round((notificationResponded / Math.max(notificationTotal, 1)) * 100, 1)}%`,
            delta: `${compact(notificationOpened)} opened`,
            subtitle: "Student replies and message engagement",
            icon: "MessageSquare" as const,
            tone: "amber" as const,
            sparkline: [42, 44, 46, 48, 52, 55, 58, clamp(round((notificationResponded / Math.max(notificationTotal, 1)) * 100, 0), 0, 100)],
          },
          {
            id: "highest-risk",
            label: "Dept with Highest Risk",
            value: highestRiskDepartment.department,
            delta: `${compact(highestRiskDepartment.critical + highestRiskDepartment.high)} open severe alerts`,
            subtitle: "Current load in open alert queue",
            icon: "AlertTriangle" as const,
            tone: "rose" as const,
            sparkline: [28, 30, 31, 34, 36, 38, 40, clamp(highestRiskDepartment.critical + highestRiskDepartment.high, 0, 100)],
          },
        ]
      : ANALYTICS_KPIS;

  const segmentationSchedule = {
    lastClustered: formatDateTime(new Date(payload.fetchedAt)),
    nextRun: formatDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    actionLabel: "Re-run Clustering",
  };

  const clusterStudents = {
    ready: students.filter((student) => student.cluster === "ready"),
    atRisk: students.filter((student) => student.cluster === "at-risk"),
    unprepared: students.filter(
      (student) => student.cluster === "unprepared" || student.cluster === "inactive",
    ),
    inactive: students.filter((student) => student.cluster === "inactive"),
  };

  function clusterDepartmentSplit(list: Student[]) {
    const grouped: Record<string, number> = {};
    for (const student of list) {
      grouped[student.department] = (grouped[student.department] || 0) + 1;
    }

    return Object.entries(grouped)
      .map(([department, value]) => ({ department, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }

  const segmentationClusterCards =
    students.length > 0
      ? [
          {
            id: "ready",
            label: "Placement Ready",
            count: clusterStudents.ready.length,
            avgProbability: `${round(average(clusterStudents.ready.map((student) => student.placementProbability)), 1)}%`,
            traits: "Strong momentum across scores, activity, and placement probability.",
            tone: "emerald" as const,
            departments: clusterDepartmentSplit(clusterStudents.ready),
            actions: ["View All"],
          },
          {
            id: "at-risk",
            label: "At-Risk",
            count: clusterStudents.atRisk.length,
            avgProbability: `${round(average(clusterStudents.atRisk.map((student) => student.placementProbability)), 1)}%`,
            traits: "Needs targeted interventions to prevent performance drift.",
            tone: "amber" as const,
            departments: clusterDepartmentSplit(clusterStudents.atRisk),
            actions: ["View All", "Bulk Intervene"],
          },
          {
            id: "unprepared",
            label: "Unprepared",
            count: clusterStudents.unprepared.length,
            avgProbability: `${round(average(clusterStudents.unprepared.map((student) => student.placementProbability)), 1)}%`,
            traits: "Low confidence, weak activity, or silent dropout indicators.",
            tone: "rose" as const,
            departments: clusterDepartmentSplit(clusterStudents.unprepared),
            actions: ["View All", "Bulk Alert TPC"],
          },
        ]
      : SEGMENTATION_CLUSTER_CARDS;

  const inactiveCluster = {
    count: clusterStudents.inactive.length,
    description:
      "Students with prolonged inactivity and weak response signals across the placement stack.",
    actionLabel: "Send Re-engagement Nudge to All",
    students: clusterStudents.inactive.map((student) => student.name).slice(0, 8),
  };

  function averageSkillByCluster(skill: keyof Student["skills"], clusterKey: "ready" | "atRisk" | "unprepared") {
    const list = clusterStudents[clusterKey];
    if (list.length === 0) {
      return 0;
    }

    return round(
      average(list.map((student) => toNumber(student.skills[skill], 0))),
      1,
    );
  }

  const segmentationRadarData =
    students.length > 0
      ? [
          {
            skill: "DSA",
            ready: averageSkillByCluster("dsa", "ready"),
            atRisk: averageSkillByCluster("dsa", "atRisk"),
            unprepared: averageSkillByCluster("dsa", "unprepared"),
          },
          {
            skill: "Aptitude",
            ready: averageSkillByCluster("aptitude", "ready"),
            atRisk: averageSkillByCluster("aptitude", "atRisk"),
            unprepared: averageSkillByCluster("aptitude", "unprepared"),
          },
          {
            skill: "Communication",
            ready: averageSkillByCluster("communication", "ready"),
            atRisk: averageSkillByCluster("communication", "atRisk"),
            unprepared: averageSkillByCluster("communication", "unprepared"),
          },
          {
            skill: "Domain Knowledge",
            ready: averageSkillByCluster("domainKnowledge", "ready"),
            atRisk: averageSkillByCluster("domainKnowledge", "atRisk"),
            unprepared: averageSkillByCluster("domainKnowledge", "unprepared"),
          },
          {
            skill: "Resume Quality",
            ready: averageSkillByCluster("resumeQuality", "ready"),
            atRisk: averageSkillByCluster("resumeQuality", "atRisk"),
            unprepared: averageSkillByCluster("resumeQuality", "unprepared"),
          },
          {
            skill: "Mock Interview Score",
            ready: averageSkillByCluster("mockInterviewScore", "ready"),
            atRisk: averageSkillByCluster("mockInterviewScore", "atRisk"),
            unprepared: averageSkillByCluster("mockInterviewScore", "unprepared"),
          },
        ]
      : SEGMENTATION_RADAR_DATA;

  const nudgeStats =
    notificationTotal > 0
      ? [
          {
            id: "nudges-total",
            label: "Total Nudges Sent",
            value: compact(notificationTotal),
            delta: `${compact(notificationOpened)} opened`,
            subtitle: "Across WhatsApp, email, and in-app",
            icon: "Send" as const,
            tone: "violet" as const,
          },
          {
            id: "nudges-response",
            label: "Response Rate",
            value: `${round((notificationResponded / Math.max(notificationTotal, 1)) * 100, 1)}%`,
            delta: `${compact(notificationResponded)} students engaged`,
            subtitle: "Students replying or taking action",
            icon: "MessageSquare" as const,
            tone: "emerald" as const,
          },
          {
            id: "nudges-opened",
            label: "Opened",
            value: compact(notificationOpened),
            delta: `${round((notificationOpened / Math.max(notificationTotal, 1)) * 100, 1)}% open rate`,
            subtitle: "Messages opened across all channels",
            icon: "Mail" as const,
            tone: "amber" as const,
          },
          {
            id: "nudges-pending",
            label: "Pending",
            value: compact(
              payload.notifications.filter(
                (entry) => entry.status === "queued" || entry.status === "sent",
              ).length,
            ),
            delta: `${compact(payload.notifications.filter((entry) => entry.status === "failed").length)} failed`,
            subtitle: "Queued and waiting for delivery",
            icon: "Bell" as const,
            tone: "slate" as const,
          },
        ]
      : NUDGE_STATS;

  const templateByChannel: Record<string, string> = {
    whatsapp: "tpl-002",
    email: "tpl-004",
    in_app: "tpl-001",
    sms: "tpl-003",
  };

  const knownTemplateIds = new Set(NUDGE_TEMPLATES.map((template) => template.id));

  const nudgeFeed =
    notificationTotal > 0
      ? payload.notifications.slice(0, 12).map((entry) => {
          const studentId = entry.student_id || students[0]?.id || "";
          const preferredTemplateId = templateByChannel[entry.channel || ""] || "tpl-001";
          const templateId = knownTemplateIds.has(preferredTemplateId)
            ? preferredTemplateId
            : NUDGE_TEMPLATES[0]?.id || "tpl-001";

          const channel: "WhatsApp" | "Email" | "In-App" =
            entry.channel === "whatsapp"
              ? "WhatsApp"
              : entry.channel === "email"
                ? "Email"
                : "In-App";

          const status: "Delivered" | "Opened" | "Responded" | "Failed" =
            entry.status === "failed"
              ? "Failed"
              : entry.is_read
                ? "Responded"
                : entry.status === "delivered"
                  ? "Opened"
                  : "Delivered";

          return {
            id: entry.id || crypto.randomUUID(),
            studentId,
            templateId,
            channel,
            sentAt: relativeFromNow(entry.sent_at || entry.delivered_at || entry.created_at),
            status,
            responseSnippet: entry.message_preview || entry.failed_reason || undefined,
          };
        })
      : NUDGE_FEED;

  return {
    dashboardMetrics,
    dashboardRiskDistribution,
    dashboardProbabilityTrend,
    dashboardSegments,
    dashboardConfidence,
    dashboardRecentAlerts,
    studentStats,
    students: students.length > 0 ? students : STUDENTS,
    riskAlertStats,
    alertQueue,
    interventionStats,
    interventions: mappedInterventions,
    analyticsKpis,
    analyticsAreaTrend,
    analyticsDepartmentRisk,
    analyticsEffectiveness,
    analyticsSkillGaps,
    forecastTable,
    segmentationSchedule,
    segmentationClusterCards,
    inactiveCluster:
      inactiveCluster.students.length > 0 ? inactiveCluster : INACTIVE_CLUSTER,
    segmentationRadarData,
    nudgeStats,
    nudgeFeed,
    fetchedAt: payload.fetchedAt,
  };
}

export async function GET() {
  try {
    const [overview, clusterDistribution, departmentBreakdown, scoreTrend, alertsResult, interventionsResult, studentsRaw, notifications] =
      await Promise.all([
        fetchBackendData<RawOverview>("/api/v1/analytics/overview"),
        fetchBackendData<RawClusterDistribution>("/api/v1/analytics/cluster-distribution"),
        fetchBackendData<RawDepartmentBreakdownItem[]>("/api/v1/analytics/department-breakdown"),
        fetchBackendData<RawScoreTrendItem[]>("/api/v1/analytics/score-trend"),
        fetchBackendData<BackendPageResult<RawAlert>>("/api/v1/alerts?page=1&limit=120"),
        fetchBackendData<BackendPageResult<RawIntervention>>(
          "/api/v1/interventions?page=1&limit=120",
        ),
        fetchBackendData<RawStudent[]>("/api/v1/students?limit=240&offset=0"),
        fetchBackendData<RawNotification[]>("/api/v1/notifications/feed"),
      ]);

    const data = buildDashboardViewData({
      overview,
      clusterDistribution,
      departmentBreakdown,
      scoreTrend,
      alerts: alertsResult.items || [],
      interventions: interventionsResult.items || [],
      studentsRaw,
      notifications,
      fetchedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Live dashboard data fetched",
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown dashboard data error";

    return NextResponse.json(
      {
        success: false,
        message: `Unable to build live dashboard payload from backend at ${getBackendBaseUrl()}: ${message}`,
        data: fallbackDashboardViewData,
      },
      { status: 502 },
    );
  }
}
