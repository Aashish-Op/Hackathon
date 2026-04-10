import type {
  AchievementBadge,
  ActionPlanTask,
  ActivityBreakdownPoint,
  Certificate,
  CohortComparisonRow,
  ContestRating,
  ExperienceEntry,
  ImprovementPlanStep,
  LeaderboardEntry,
  MockInterviewAttempt,
  NotificationItem,
  OverviewFactor,
  ProfileBuilderFormValues,
  ProfileSection,
  ProfileSectionMeta,
  Project,
  PublicProfileLink,
  QuickActionCard,
  SkillCardData,
  SoftSkillEntry,
  StudentInsight,
  StudentProfileRecord,
  TpcAlert,
} from "@/types";

export const BRAND_NAME = "PlaceGuard AI";
export const BRAND_INITIAL = "P";
export const REFERENCE_DATE = "2026-04-09T09:00:00+05:30";

export type RiskLevel = "critical" | "high" | "medium" | "low";
export type Cluster = "ready" | "at-risk" | "unprepared" | "inactive";
export type BadgeTone =
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "blue"
  | "sky"
  | "yellow"
  | "default";
export type IconName =
  | "LayoutDashboard"
  | "TrendingUp"
  | "PieChart"
  | "Users"
  | "AlertTriangle"
  | "Zap"
  | "MessageSquare"
  | "Settings"
  | "HelpCircle"
  | "Cpu"
  | "Bell"
  | "Search"
  | "Sparkles"
  | "BadgeCheck"
  | "ShieldAlert"
  | "Gauge"
  | "ArrowUpRight"
  | "ArrowDownRight"
  | "ArrowRight"
  | "Eye"
  | "Download"
  | "Send"
  | "Mail"
  | "Calendar"
  | "Building2"
  | "Globe"
  | "CheckCircle";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  riskScore: number;
  cluster: Cluster;
  placementProbability: number;
  lastActive: string;
  mockAttempts: number;
  skills: {
    dsa: number;
    aptitude: number;
    communication: number;
    domainKnowledge: number;
    resumeQuality: number;
    mockInterviewScore: number;
  };
  triggers: string[];
  interventionStatus?: "none" | "pending" | "active" | "completed";
}

export interface NavSection {
  title: string;
  items: Array<{
    label: string;
    href: string;
    icon: IconName;
    badgeCount?: number;
    badgeTone?: BadgeTone;
  }>;
}

export interface PageMeta {
  href: string;
  title: string;
  description: string;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  delta: string;
  icon: IconName;
  tone: BadgeTone;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  sparkline?: number[];
}

export interface DashboardAlertRow {
  id: string;
  studentName: string;
  riskScore: number;
  triggerReason: string;
  department: string;
  lastActiveLabel: string;
  severity: "Critical" | "High" | "Medium";
  actionLabel: "Intervene" | "View";
}

export interface AlertQueueItem {
  id: string;
  studentName: string;
  rollNo: string;
  department: string;
  severity: "critical" | "high" | "medium";
  reason: string;
  riskScore: number;
  signals: string[];
  assignedTo: string;
  status: "Pending" | "Assigned" | "In Review";
  flaggedLabel: string;
}

export interface InterventionCardData {
  id: string;
  studentId: string;
  type:
    | "Mock Interview Session"
    | "DSA Crash Course"
    | "Resume Review"
    | "Domain Shift"
    | "1:1 Counseling"
    | "Aptitude Bootcamp";
  assignedOfficer: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: "Critical" | "High" | "Medium";
  createdDate: string;
  dueDate: string;
  aiRecommendation: string;
  progressNote?: string;
}

export interface NudgeTemplateData {
  id: string;
  name: string;
  tone: BadgeTone;
  preview: string;
  channels: Array<"WhatsApp" | "Email" | "In-App">;
  lastUsed: string;
  useCount: number;
}

export interface NudgeRecord {
  id: string;
  studentId: string;
  templateId: string;
  channel: "WhatsApp" | "Email" | "In-App";
  sentAt: string;
  status: "Delivered" | "Opened" | "Responded" | "Failed";
  responseSnippet?: string;
}

export interface IntegrationCardData {
  id: string;
  name: string;
  icon: IconName;
  status: "Connected" | "Disconnected";
  lastSync: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Coordinator" | "Viewer";
  assignedStudents: number;
}

const baseDate = new Date(REFERENCE_DATE);

function isoDaysAgo(days: number, hourOffset = 0): string {
  const next = new Date(baseDate);
  next.setHours(next.getHours() - hourOffset - days * 24);
  return next.toISOString();
}

function isoHoursAgo(hours: number): string {
  const next = new Date(baseDate);
  next.setHours(next.getHours() - hours);
  return next.toISOString();
}

function skills(
  dsa: number,
  aptitude: number,
  communication: number,
  domainKnowledge: number,
  resumeQuality: number,
  mockInterviewScore: number,
) {
  return {
    dsa,
    aptitude,
    communication,
    domainKnowledge,
    resumeQuality,
    mockInterviewScore,
  };
}

export const CLUSTER_LABELS: Record<Cluster, string> = {
  ready: "Ready",
  "at-risk": "At-Risk",
  unprepared: "Unprepared",
  inactive: "Inactive",
};

export const CLUSTER_TONES: Record<Cluster, BadgeTone> = {
  ready: "emerald",
  "at-risk": "amber",
  unprepared: "rose",
  inactive: "slate",
};

export const SEVERITY_TONES: Record<AlertQueueItem["severity"], BadgeTone> = {
  critical: "rose",
  high: "amber",
  medium: "blue",
};

export const INTERVENTION_STATUS_TONES: Record<
  InterventionCardData["status"],
  BadgeTone
> = {
  Pending: "slate",
  "In Progress": "amber",
  Completed: "emerald",
};

export const NUDGE_STATUS_TONES: Record<NudgeRecord["status"], BadgeTone> = {
  Delivered: "blue",
  Opened: "amber",
  Responded: "emerald",
  Failed: "rose",
};

export const INTEGRATION_STATUS_TONES: Record<
  IntegrationCardData["status"],
  BadgeTone
> = {
  Connected: "emerald",
  Disconnected: "rose",
};

export function getRiskScoreTone(score: number): BadgeTone {
  if (score <= 40) {
    return "rose";
  }

  if (score <= 60) {
    return "amber";
  }

  return "emerald";
}

export function getPlacementTone(probability: number): "emerald" | "amber" | "rose" {
  if (probability > 65) {
    return "emerald";
  }

  if (probability >= 40) {
    return "amber";
  }

  return "rose";
}

export const BRAND_DETAILS = {
  roleLabel: "TPC Admin",
  sidebarSearchPlaceholder: "Search students, pages, insights...",
  aiStatusLabel: "AI Engine · Active",
  aiStatusUpdatedLabel: "Updated 3 mins ago",
  notificationCount: 7,
  overviewTabs: ["Overview", "Students", "Alerts"],
  topbarSearchLabel: "Search dashboard",
  runScanLabel: "Run AI Scan",
  runScanToast: {
    title: "AI scan initiated",
    description: "Results expected in approximately 2 minutes.",
  },
  currentOfficer: "Dr. Anita Mehra",
};

export const PAGE_META: PageMeta[] = [
  {
    href: "/dashboard",
    title: "Placement Intelligence Overview",
    description:
      "AI-led signals, placement probability trends, and intervention readiness across the campus.",
  },
  {
    href: "/dashboard/analytics",
    title: "Placement Trend Intelligence",
    description:
      "Trend analysis, campus risk distribution, forecast coverage, and intervention impact insights.",
  },
  {
    href: "/dashboard/segmentation",
    title: "AI Student Clustering",
    description:
      "Cluster-level understanding of readiness, disengagement, and silent-risk patterns.",
  },
  {
    href: "/dashboard/students",
    title: "All Students Registry",
    description:
      "Unified student records with placement probability, cluster tagging, and recent activity signals.",
  },
  {
    href: "/dashboard/risk-alerts",
    title: "High-Priority Intervention Queue",
    description:
      "Prioritized alerts sorted by severity so coordinators can act before students fall behind.",
  },
  {
    href: "/dashboard/interventions",
    title: "Intervention Management",
    description:
      "Assignment, monitoring, and outcome tracking for student-specific and batch interventions.",
  },
  {
    href: "/dashboard/nudges",
    title: "Automated Student Communication",
    description:
      "Templates, delivery performance, and personalized outreach across WhatsApp, email, and in-app channels.",
  },
  {
    href: "/dashboard/settings",
    title: "System Settings",
    description:
      "AI thresholds, clustering cadence, notifications, integrations, and TPC team management.",
  },
  {
    href: "/dashboard/help",
    title: "Support Center",
    description:
      "Operating guides, escalation pathways, and model usage notes for TPC officers.",
  },
];

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Analytics", href: "/dashboard/analytics", icon: "TrendingUp" },
      { label: "Segmentation", href: "/dashboard/segmentation", icon: "PieChart" },
    ],
  },
  {
    title: "STUDENTS",
    items: [
      { label: "All Students", href: "/dashboard/students", icon: "Users" },
      {
        label: "Risk Alerts",
        href: "/dashboard/risk-alerts",
        icon: "AlertTriangle",
        badgeCount: 10,
        badgeTone: "rose",
      },
      {
        label: "Interventions",
        href: "/dashboard/interventions",
        icon: "Zap",
        badgeCount: 34,
        badgeTone: "amber",
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      { label: "Nudge Engine", href: "/dashboard/nudges", icon: "MessageSquare" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
      { label: "Help", href: "/dashboard/help", icon: "HelpCircle" },
    ],
  },
];

export const DASHBOARD_METRICS: StatCardData[] = [
  {
    id: "placement-probability",
    label: "Placement Probability Avg",
    value: "67.3%",
    delta: "+2.1% this week",
    subtitle: "Campus average across all active cohorts",
    icon: "Gauge",
    tone: "violet",
    trend: "up",
  },
  {
    id: "high-risk",
    label: "High-Risk Students",
    value: "143",
    delta: "+12 since Monday",
    subtitle: "Require counselor or faculty attention",
    icon: "ShieldAlert",
    tone: "rose",
    trend: "up",
  },
  {
    id: "interventions-active",
    label: "Interventions Active",
    value: "89",
    delta: "34 pending review",
    subtitle: "Open actions across TPC officers",
    icon: "Zap",
    tone: "amber",
    trend: "neutral",
  },
  {
    id: "placement-ready",
    label: "Placement-Ready Students",
    value: "412",
    delta: "+28 this month",
    subtitle: "Meeting readiness thresholds today",
    icon: "BadgeCheck",
    tone: "emerald",
    trend: "up",
  },
];

export const DASHBOARD_RISK_DISTRIBUTION = [
  { department: "CSE", ready: 92, atRisk: 58, unprepared: 31 },
  { department: "IT", ready: 74, atRisk: 46, unprepared: 25 },
  { department: "ECE", ready: 63, atRisk: 61, unprepared: 47 },
  { department: "MECH", ready: 51, atRisk: 54, unprepared: 43 },
  { department: "CIVIL", ready: 36, atRisk: 41, unprepared: 38 },
  { department: "MBA", ready: 96, atRisk: 37, unprepared: 20 },
];

export const DASHBOARD_PROBABILITY_TREND = [
  { week: "W1", average: 61.2, ready: 72.8, atRisk: 48.1 },
  { week: "W2", average: 62.7, ready: 73.6, atRisk: 48.8 },
  { week: "W3", average: 63.8, ready: 74.9, atRisk: 49.5 },
  { week: "W4", average: 64.4, ready: 75.8, atRisk: 50.2 },
  { week: "W5", average: 65.6, ready: 77.1, atRisk: 51.3 },
  { week: "W6", average: 66.1, ready: 78.3, atRisk: 52.5 },
  { week: "W7", average: 66.9, ready: 79.1, atRisk: 53.6 },
  { week: "W8", average: 67.3, ready: 80.4, atRisk: 54.1 },
];

export const DASHBOARD_SEGMENTS = [
  { id: "ready", label: "Placement-Ready", count: 412, percentage: 33, tone: "emerald" as const },
  { id: "at-risk", label: "At-Risk", count: 349, percentage: 28, tone: "amber" as const },
  { id: "unprepared", label: "Unprepared", count: 224, percentage: 18, tone: "rose" as const },
  { id: "inactive", label: "Inactive", count: 262, percentage: 21, tone: "slate" as const },
];

export const DASHBOARD_CONFIDENCE = {
  label: "AI Confidence Score",
  value: "91.4%",
};

export const DASHBOARD_RECENT_ALERTS: DashboardAlertRow[] = [
  {
    id: "alert-001",
    studentName: "Arjun Mehta",
    riskScore: 23,
    triggerReason: "Zero mock attempts in 3 weeks",
    department: "CSE",
    lastActiveLabel: "21 days ago",
    severity: "Critical",
    actionLabel: "Intervene",
  },
  {
    id: "alert-002",
    studentName: "Priya Sharma",
    riskScore: 31,
    triggerReason: "Skills gap: DSA weak",
    department: "IT",
    lastActiveLabel: "8 days ago",
    severity: "High",
    actionLabel: "Intervene",
  },
  {
    id: "alert-003",
    studentName: "Rohit Nair",
    riskScore: 42,
    triggerReason: "Low aptitude score trend",
    department: "ECE",
    lastActiveLabel: "3 days ago",
    severity: "Medium",
    actionLabel: "View",
  },
  {
    id: "alert-004",
    studentName: "Sneha Kulkarni",
    riskScore: 18,
    triggerReason: "No profile update + inactive",
    department: "MECH",
    lastActiveLabel: "32 days ago",
    severity: "Critical",
    actionLabel: "Intervene",
  },
  {
    id: "alert-005",
    studentName: "Vivek Joshi",
    riskScore: 37,
    triggerReason: "Rejected in 4 mock interviews",
    department: "CSE",
    lastActiveLabel: "5 days ago",
    severity: "High",
    actionLabel: "Intervene",
  },
  {
    id: "alert-006",
    studentName: "Ananya Rao",
    riskScore: 55,
    triggerReason: "Missing domain skills for target role",
    department: "MBA",
    lastActiveLabel: "1 day ago",
    severity: "Medium",
    actionLabel: "View",
  },
  {
    id: "alert-007",
    studentName: "Karan Patel",
    riskScore: 29,
    triggerReason: "Skipped 6 consecutive webinars",
    department: "IT",
    lastActiveLabel: "14 days ago",
    severity: "Critical",
    actionLabel: "Intervene",
  },
  {
    id: "alert-008",
    studentName: "Divya Menon",
    riskScore: 44,
    triggerReason: "Resume score below threshold",
    department: "CIVIL",
    lastActiveLabel: "6 days ago",
    severity: "Medium",
    actionLabel: "View",
  },
];

export const STUDENT_STATS: StatCardData[] = [
  {
    id: "students-total",
    label: "Total Enrolled",
    value: "1,247",
    delta: "+53 this quarter",
    subtitle: "Final-year students under monitoring",
    icon: "Users",
    tone: "violet",
  },
  {
    id: "students-active",
    label: "Active This Week",
    value: "892",
    delta: "71.5% engagement rate",
    subtitle: "Logged in or took at least one action",
    icon: "TrendingUp",
    tone: "emerald",
  },
  {
    id: "students-risk",
    label: "Avg Risk Score",
    value: "61.8",
    delta: "-1.9 vs last week",
    subtitle: "Higher is healthier in PlaceGuard scoring",
    icon: "ShieldAlert",
    tone: "amber",
    trend: "up",
  },
  {
    id: "students-placed",
    label: "Placed This Cycle",
    value: "318",
    delta: "+22 since Friday",
    subtitle: "Offers secured in the current drive",
    icon: "BadgeCheck",
    tone: "emerald",
  },
];

export const STUDENT_FILTERS = {
  searchPlaceholder: "Search by name, roll no, or department",
  departments: ["All Departments", "CSE", "IT", "ECE", "MECH", "CIVIL", "MBA"],
  riskLevels: ["All Risk Levels", "Safe", "At-Risk", "High-Risk"],
  clusters: ["All Clusters", "Ready", "At-Risk", "Unprepared", "Inactive"],
  lastActive: ["Any Time", "Active in 3 Days", "Active in 7 Days", "Inactive 14+ Days"],
  sortOptions: ["Risk Score ↑", "Risk Score ↓", "Last Active", "Name"],
};

export const STUDENTS: Student[] = [
  {
    id: "stu-001",
    name: "Aarav Khanna",
    rollNo: "23CSE017",
    department: "CSE",
    riskScore: 82,
    cluster: "ready",
    placementProbability: 88,
    lastActive: isoHoursAgo(14),
    mockAttempts: 5,
    skills: skills(86, 80, 78, 82, 90, 84),
    triggers: ["Consistent coding streak", "Resume complete"],
    interventionStatus: "completed",
  },
  {
    id: "stu-002",
    name: "Ishita Menon",
    rollNo: "23IT041",
    department: "IT",
    riskScore: 74,
    cluster: "ready",
    placementProbability: 79,
    lastActive: isoHoursAgo(9),
    mockAttempts: 4,
    skills: skills(73, 70, 81, 76, 88, 77),
    triggers: ["Daily portal activity", "Strong communication"],
    interventionStatus: "none",
  },
  {
    id: "stu-003",
    name: "Nikhil Chatterjee",
    rollNo: "23ECE026",
    department: "ECE",
    riskScore: 46,
    cluster: "at-risk",
    placementProbability: 52,
    lastActive: isoDaysAgo(4),
    mockAttempts: 2,
    skills: skills(38, 57, 63, 59, 69, 48),
    triggers: ["Low mock cadence", "DSA confidence falling"],
    interventionStatus: "pending",
  },
  {
    id: "stu-004",
    name: "Sana Shaikh",
    rollNo: "23MEC012",
    department: "MECH",
    riskScore: 28,
    cluster: "unprepared",
    placementProbability: 24,
    lastActive: isoDaysAgo(16),
    mockAttempts: 0,
    skills: skills(22, 34, 45, 31, 40, 18),
    triggers: ["No mock interviews", "Resume incomplete", "Low attendance"],
    interventionStatus: "active",
  },
  {
    id: "stu-005",
    name: "Devansh Patel",
    rollNo: "23CIV008",
    department: "CIVIL",
    riskScore: 21,
    cluster: "inactive",
    placementProbability: 18,
    lastActive: isoDaysAgo(24),
    mockAttempts: 0,
    skills: skills(20, 26, 41, 33, 28, 12),
    triggers: ["Inactive 24 days", "No tests attempted"],
    interventionStatus: "pending",
  },
  {
    id: "stu-006",
    name: "Kavya Reddy",
    rollNo: "23CSE054",
    department: "CSE",
    riskScore: 57,
    cluster: "at-risk",
    placementProbability: 61,
    lastActive: isoDaysAgo(2),
    mockAttempts: 2,
    skills: skills(61, 58, 72, 64, 71, 55),
    triggers: ["Mock interview gaps", "Sporadic portal activity"],
    interventionStatus: "active",
  },
  {
    id: "stu-007",
    name: "Rohit Nair",
    rollNo: "23ECE043",
    department: "ECE",
    riskScore: 42,
    cluster: "at-risk",
    placementProbability: 49,
    lastActive: isoDaysAgo(3),
    mockAttempts: 1,
    skills: skills(44, 41, 58, 51, 62, 43),
    triggers: ["Low aptitude trend", "Only one mock attempt"],
    interventionStatus: "pending",
  },
  {
    id: "stu-008",
    name: "Ananya Rao",
    rollNo: "23MBA031",
    department: "MBA",
    riskScore: 69,
    cluster: "ready",
    placementProbability: 74,
    lastActive: isoHoursAgo(20),
    mockAttempts: 3,
    skills: skills(62, 70, 79, 76, 83, 72),
    triggers: ["Strong resume", "Responsive to nudges"],
    interventionStatus: "none",
  },
  {
    id: "stu-009",
    name: "Vivek Joshi",
    rollNo: "23CSE079",
    department: "CSE",
    riskScore: 37,
    cluster: "unprepared",
    placementProbability: 39,
    lastActive: isoDaysAgo(5),
    mockAttempts: 4,
    skills: skills(39, 46, 60, 44, 58, 27),
    triggers: ["Rejected in 4 mock interviews", "Confidence dip"],
    interventionStatus: "active",
  },
  {
    id: "stu-010",
    name: "Divya Menon",
    rollNo: "23CIV019",
    department: "CIVIL",
    riskScore: 44,
    cluster: "at-risk",
    placementProbability: 43,
    lastActive: isoDaysAgo(6),
    mockAttempts: 1,
    skills: skills(35, 48, 61, 46, 33, 40),
    triggers: ["Resume score below threshold", "Weak aptitude consistency"],
    interventionStatus: "pending",
  },
  {
    id: "stu-011",
    name: "Arjun Mehta",
    rollNo: "23CSE021",
    department: "CSE",
    riskScore: 23,
    cluster: "unprepared",
    placementProbability: 28,
    lastActive: isoDaysAgo(21),
    mockAttempts: 0,
    skills: skills(25, 32, 42, 38, 51, 17),
    triggers: ["Zero mock attempts in 3 weeks", "Silent disengagement"],
    interventionStatus: "pending",
  },
  {
    id: "stu-012",
    name: "Priya Sharma",
    rollNo: "23IT014",
    department: "IT",
    riskScore: 31,
    cluster: "unprepared",
    placementProbability: 36,
    lastActive: isoDaysAgo(8),
    mockAttempts: 1,
    skills: skills(29, 48, 62, 44, 58, 37),
    triggers: ["Skills gap in DSA", "Low mock consistency"],
    interventionStatus: "active",
  },
  {
    id: "stu-013",
    name: "Sneha Kulkarni",
    rollNo: "23MEC024",
    department: "MECH",
    riskScore: 18,
    cluster: "inactive",
    placementProbability: 15,
    lastActive: isoDaysAgo(32),
    mockAttempts: 0,
    skills: skills(18, 27, 39, 29, 24, 11),
    triggers: ["Inactive 32 days", "No profile updates"],
    interventionStatus: "pending",
  },
  {
    id: "stu-014",
    name: "Karan Patel",
    rollNo: "23IT052",
    department: "IT",
    riskScore: 29,
    cluster: "inactive",
    placementProbability: 22,
    lastActive: isoDaysAgo(14),
    mockAttempts: 0,
    skills: skills(32, 35, 46, 37, 44, 20),
    triggers: ["Skipped 6 webinars", "No mock attempts"],
    interventionStatus: "pending",
  },
  {
    id: "stu-015",
    name: "Farhan Ali",
    rollNo: "23MBA017",
    department: "MBA",
    riskScore: 63,
    cluster: "ready",
    placementProbability: 68,
    lastActive: isoDaysAgo(1),
    mockAttempts: 3,
    skills: skills(54, 66, 82, 75, 78, 69),
    triggers: ["Improved aptitude trend", "Consistent recruiter activity"],
    interventionStatus: "none",
  },
  {
    id: "stu-016",
    name: "Bhavya Iyer",
    rollNo: "23ECE037",
    department: "ECE",
    riskScore: 71,
    cluster: "ready",
    placementProbability: 77,
    lastActive: isoHoursAgo(18),
    mockAttempts: 4,
    skills: skills(68, 73, 74, 79, 80, 75),
    triggers: ["Strong domain scores", "Mock interview momentum"],
    interventionStatus: "completed",
  },
  {
    id: "stu-017",
    name: "Manish Yadav",
    rollNo: "23MEC031",
    department: "MECH",
    riskScore: 54,
    cluster: "at-risk",
    placementProbability: 58,
    lastActive: isoDaysAgo(7),
    mockAttempts: 2,
    skills: skills(49, 56, 63, 58, 65, 53),
    triggers: ["Activity dipping", "Needs more mock practice"],
    interventionStatus: "active",
  },
  {
    id: "stu-018",
    name: "Neha Borkar",
    rollNo: "23CIV027",
    department: "CIVIL",
    riskScore: 66,
    cluster: "ready",
    placementProbability: 69,
    lastActive: isoDaysAgo(2),
    mockAttempts: 3,
    skills: skills(58, 69, 75, 71, 82, 64),
    triggers: ["Resume improved 19 points", "High webinar completion"],
    interventionStatus: "completed",
  },
  {
    id: "stu-019",
    name: "Gautam Dutta",
    rollNo: "23CSE091",
    department: "CSE",
    riskScore: 48,
    cluster: "at-risk",
    placementProbability: 51,
    lastActive: isoDaysAgo(9),
    mockAttempts: 2,
    skills: skills(51, 50, 68, 56, 63, 49),
    triggers: ["Inconsistent coding rounds", "Low response to nudges"],
    interventionStatus: "pending",
  },
  {
    id: "stu-020",
    name: "Pooja Nair",
    rollNo: "23IT088",
    department: "IT",
    riskScore: 77,
    cluster: "ready",
    placementProbability: 83,
    lastActive: isoHoursAgo(6),
    mockAttempts: 5,
    skills: skills(79, 74, 81, 78, 88, 82),
    triggers: ["Daily preparation streak", "Strong mock performance"],
    interventionStatus: "none",
  },
  {
    id: "stu-021",
    name: "Saurabh Singh",
    rollNo: "23MBA044",
    department: "MBA",
    riskScore: 34,
    cluster: "unprepared",
    placementProbability: 33,
    lastActive: isoDaysAgo(11),
    mockAttempts: 1,
    skills: skills(28, 39, 57, 46, 48, 35),
    triggers: ["Low aptitude percentile", "Minimal interview practice"],
    interventionStatus: "active",
  },
  {
    id: "stu-022",
    name: "Meera Krishnan",
    rollNo: "23CSE102",
    department: "CSE",
    riskScore: 84,
    cluster: "ready",
    placementProbability: 91,
    lastActive: isoHoursAgo(5),
    mockAttempts: 6,
    skills: skills(89, 82, 84, 86, 92, 88),
    triggers: ["Top recruiter shortlist", "Excellent mock interview scores"],
    interventionStatus: "completed",
  },
  {
    id: "stu-023",
    name: "Harshit Verma",
    rollNo: "23ECE064",
    department: "ECE",
    riskScore: 58,
    cluster: "at-risk",
    placementProbability: 62,
    lastActive: isoDaysAgo(3),
    mockAttempts: 2,
    skills: skills(55, 59, 67, 61, 66, 57),
    triggers: ["Sporadic engagement", "Needs stronger resume positioning"],
    interventionStatus: "pending",
  },
  {
    id: "stu-024",
    name: "Lavanya Pillai",
    rollNo: "23IT097",
    department: "IT",
    riskScore: 62,
    cluster: "ready",
    placementProbability: 67,
    lastActive: isoDaysAgo(4),
    mockAttempts: 3,
    skills: skills(65, 61, 75, 63, 72, 60),
    triggers: ["Improving trajectory", "Strong workshop attendance"],
    interventionStatus: "active",
  },
  {
    id: "stu-025",
    name: "Yashika Jain",
    rollNo: "23CIV035",
    department: "CIVIL",
    riskScore: 26,
    cluster: "inactive",
    placementProbability: 19,
    lastActive: isoDaysAgo(27),
    mockAttempts: 0,
    skills: skills(19, 31, 43, 35, 30, 15),
    triggers: ["Inactive 27 days", "No LMS or portal activity"],
    interventionStatus: "pending",
  },
];

export const RISK_ALERT_STATS: StatCardData[] = [
  {
    id: "critical-alerts",
    label: "Critical Alerts",
    value: "38",
    delta: "+6 this morning",
    subtitle: "Students requiring immediate outreach",
    icon: "ShieldAlert",
    tone: "rose",
  },
  {
    id: "high-priority",
    label: "High Priority",
    value: "64",
    delta: "Across 6 departments",
    subtitle: "Needs assignment within 24 hours",
    icon: "AlertTriangle",
    tone: "amber",
  },
  {
    id: "pending-review",
    label: "Pending Review",
    value: "34",
    delta: "9 in coordinator queue",
    subtitle: "Waiting for action validation",
    icon: "Zap",
    tone: "violet",
  },
  {
    id: "resolved-today",
    label: "Resolved Today",
    value: "17",
    delta: "+4 vs yesterday",
    subtitle: "Alerts closed after intervention",
    icon: "CheckCircle",
    tone: "emerald",
  },
];

export const ALERT_FILTERS = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Unassigned",
  "My Queue",
];

export const ALERT_QUEUE: AlertQueueItem[] = [
  {
    id: "queue-001",
    studentName: "Arjun Mehta",
    rollNo: "23CSE021",
    department: "CSE",
    severity: "critical",
    reason: "No engagement for 28 days",
    riskScore: 18,
    signals: ["0 mock tests", "DSA: 12%", "Resume: incomplete"],
    assignedTo: "Unassigned",
    status: "Pending",
    flaggedLabel: "Flagged 2 hours ago by AI Engine",
  },
  {
    id: "queue-002",
    studentName: "Sneha Kulkarni",
    rollNo: "23MEC024",
    department: "MECH",
    severity: "critical",
    reason: "No profile completion and 32-day inactivity",
    riskScore: 19,
    signals: ["No logins", "Resume missing", "Attendance drop"],
    assignedTo: "Vijayalakshmi Rao",
    status: "Assigned",
    flaggedLabel: "Flagged 4 hours ago by AI Engine",
  },
  {
    id: "queue-003",
    studentName: "Karan Patel",
    rollNo: "23IT052",
    department: "IT",
    severity: "critical",
    reason: "Skipped 6 consecutive webinars",
    riskScore: 24,
    signals: ["0 mock tests", "No webinar joins", "No nudge response"],
    assignedTo: "Unassigned",
    status: "Pending",
    flaggedLabel: "Flagged 6 hours ago by AI Engine",
  },
  {
    id: "queue-004",
    studentName: "Priya Sharma",
    rollNo: "23IT014",
    department: "IT",
    severity: "high",
    reason: "Skills gap widening in DSA",
    riskScore: 31,
    signals: ["DSA: 34%", "2 rejected coding rounds", "Mock score: 39"],
    assignedTo: "Dr. Anita Mehra",
    status: "In Review",
    flaggedLabel: "Flagged 9 hours ago by AI Engine",
  },
  {
    id: "queue-005",
    studentName: "Vivek Joshi",
    rollNo: "23CSE079",
    department: "CSE",
    severity: "high",
    reason: "Rejected in 4 mock interviews",
    riskScore: 37,
    signals: ["Mock feedback poor", "Confidence slump", "High retake count"],
    assignedTo: "Rahul Banerjee",
    status: "Assigned",
    flaggedLabel: "Flagged 11 hours ago by AI Engine",
  },
  {
    id: "queue-006",
    studentName: "Saurabh Singh",
    rollNo: "23MBA044",
    department: "MBA",
    severity: "high",
    reason: "Aptitude percentile dropped below 40",
    riskScore: 34,
    signals: ["Aptitude: 38%", "No improvement in 2 weeks", "Low portal activity"],
    assignedTo: "Unassigned",
    status: "Pending",
    flaggedLabel: "Flagged 13 hours ago by AI Engine",
  },
  {
    id: "queue-007",
    studentName: "Divya Menon",
    rollNo: "23CIV019",
    department: "CIVIL",
    severity: "high",
    reason: "Resume quality below threshold",
    riskScore: 40,
    signals: ["Resume: 33%", "No portfolio", "No mock interview bookings"],
    assignedTo: "Vijayalakshmi Rao",
    status: "Assigned",
    flaggedLabel: "Flagged 18 hours ago by AI Engine",
  },
  {
    id: "queue-008",
    studentName: "Rohit Nair",
    rollNo: "23ECE043",
    department: "ECE",
    severity: "medium",
    reason: "Low aptitude score trend over 3 weeks",
    riskScore: 42,
    signals: ["Aptitude: 44%", "Missed quiz", "Low consistency"],
    assignedTo: "Dr. Anita Mehra",
    status: "In Review",
    flaggedLabel: "Flagged 22 hours ago by AI Engine",
  },
  {
    id: "queue-009",
    studentName: "Harshit Verma",
    rollNo: "23ECE064",
    department: "ECE",
    severity: "medium",
    reason: "Resume positioning lagging behind cluster",
    riskScore: 51,
    signals: ["Resume: 58%", "Needs project framing", "Sporadic mock feedback"],
    assignedTo: "Rahul Banerjee",
    status: "Assigned",
    flaggedLabel: "Flagged 1 day ago by AI Engine",
  },
  {
    id: "queue-010",
    studentName: "Lavanya Pillai",
    rollNo: "23IT097",
    department: "IT",
    severity: "medium",
    reason: "Improving, but still under target mock frequency",
    riskScore: 55,
    signals: ["Mock attempts: 3", "Needs confidence coaching", "Resume at 72%"],
    assignedTo: "Unassigned",
    status: "Pending",
    flaggedLabel: "Flagged 1 day ago by AI Engine",
  },
];

export const SEGMENTATION_SCHEDULE = {
  lastClustered: "Today, 6:02 AM",
  nextRun: "Tomorrow 6:00 AM",
  actionLabel: "Re-run Clustering",
};

export const SEGMENTATION_CLUSTER_CARDS = [
  {
    id: "ready",
    label: "Placement Ready",
    count: 412,
    avgProbability: "81.2%",
    traits: "Strong DSA, 3+ mock interviews, active daily, resume complete",
    tone: "emerald" as const,
    departments: [
      { department: "CSE", value: 116 },
      { department: "MBA", value: 88 },
      { department: "IT", value: 79 },
      { department: "ECE", value: 64 },
      { department: "CIVIL", value: 35 },
    ],
    actions: ["View All"],
  },
  {
    id: "at-risk",
    label: "At-Risk",
    count: 349,
    avgProbability: "48.7%",
    traits: "Moderate skills, low mock frequency, sporadic engagement",
    tone: "amber" as const,
    departments: [
      { department: "ECE", value: 79 },
      { department: "MECH", value: 68 },
      { department: "IT", value: 61 },
      { department: "CSE", value: 57 },
      { department: "CIVIL", value: 48 },
    ],
    actions: ["View All", "Bulk Intervene"],
  },
  {
    id: "unprepared",
    label: "Unprepared",
    count: 224,
    avgProbability: "21.3%",
    traits: "Skill gaps in core areas, very low activity, incomplete profiles",
    tone: "rose" as const,
    departments: [
      { department: "MECH", value: 54 },
      { department: "ECE", value: 49 },
      { department: "IT", value: 41 },
      { department: "CIVIL", value: 40 },
      { department: "CSE", value: 32 },
    ],
    actions: ["View All", "Bulk Alert TPC"],
  },
];

export const INACTIVE_CLUSTER = {
  count: 262,
  description:
    "Last seen more than 14 days ago. No test, login, or resource activity recorded.",
  actionLabel: "Send Re-engagement Nudge to All",
  students: [
    "Sneha Kulkarni",
    "Devansh Patel",
    "Karan Patel",
    "Yashika Jain",
    "Arjun Mehta",
    "Saurabh Singh",
    "Nidhi Bansal",
    "Ritesh Kulkarni",
  ],
};

export const SEGMENTATION_RADAR_DATA = [
  { skill: "DSA", ready: 82, atRisk: 54, unprepared: 26 },
  { skill: "Aptitude", ready: 76, atRisk: 57, unprepared: 34 },
  { skill: "Communication", ready: 79, atRisk: 63, unprepared: 45 },
  { skill: "Domain Knowledge", ready: 78, atRisk: 59, unprepared: 37 },
  { skill: "Resume Quality", ready: 86, atRisk: 65, unprepared: 31 },
  { skill: "Mock Interview Score", ready: 81, atRisk: 52, unprepared: 23 },
];

export const INTERVENTION_TABS = ["All", "Pending", "In Progress", "Completed"];

export const INTERVENTION_STATS: StatCardData[] = [
  {
    id: "interventions-total",
    label: "Total Interventions",
    value: "126",
    delta: "+11 this week",
    subtitle: "Individual student actions tracked",
    icon: "Zap",
    tone: "violet",
  },
  {
    id: "interventions-pending",
    label: "Pending Assignment",
    value: "34",
    delta: "Needs coordinator allocation",
    subtitle: "Awaiting owner mapping",
    icon: "AlertTriangle",
    tone: "slate",
  },
  {
    id: "interventions-active",
    label: "In Progress",
    value: "52",
    delta: "18 due this week",
    subtitle: "Active counselor and faculty actions",
    icon: "TrendingUp",
    tone: "amber",
  },
  {
    id: "interventions-success",
    label: "Success Rate",
    value: "68.4%",
    delta: "+6.8% vs last month",
    subtitle: "Students improved after action plans",
    icon: "BadgeCheck",
    tone: "emerald",
  },
];

export const INTERVENTIONS: InterventionCardData[] = [
  {
    id: "int-001",
    studentId: "stu-011",
    type: "Mock Interview Session",
    assignedOfficer: "Unassigned",
    status: "Pending",
    priority: "Critical",
    createdDate: "06 Apr 2026",
    dueDate: "10 Apr 2026",
    aiRecommendation: "AI suggested based on zero mock attempts and low confidence trend",
  },
  {
    id: "int-002",
    studentId: "stu-012",
    type: "DSA Crash Course",
    assignedOfficer: "Rahul Banerjee",
    status: "In Progress",
    priority: "High",
    createdDate: "05 Apr 2026",
    dueDate: "12 Apr 2026",
    aiRecommendation: "AI suggested based on DSA score gap versus placed cohort",
    progressNote: "Student completed arrays and recursion track; next checkpoint on graphs.",
  },
  {
    id: "int-003",
    studentId: "stu-010",
    type: "Resume Review",
    assignedOfficer: "Vijayalakshmi Rao",
    status: "Pending",
    priority: "High",
    createdDate: "07 Apr 2026",
    dueDate: "11 Apr 2026",
    aiRecommendation: "AI suggested based on resume quality below cluster average",
  },
  {
    id: "int-004",
    studentId: "stu-004",
    type: "1:1 Counseling",
    assignedOfficer: "Dr. Anita Mehra",
    status: "In Progress",
    priority: "Critical",
    createdDate: "04 Apr 2026",
    dueDate: "10 Apr 2026",
    aiRecommendation: "AI suggested based on silent disengagement and missing profile data",
    progressNote: "Initial counseling done. Family contact requested for attendance follow-up.",
  },
  {
    id: "int-005",
    studentId: "stu-021",
    type: "Aptitude Bootcamp",
    assignedOfficer: "Rahul Banerjee",
    status: "In Progress",
    priority: "High",
    createdDate: "03 Apr 2026",
    dueDate: "14 Apr 2026",
    aiRecommendation: "AI suggested based on aptitude percentile under 40th percentile",
    progressNote: "Bootcamp attendance 2/4 sessions. Improvement seen in speed rounds.",
  },
  {
    id: "int-006",
    studentId: "stu-009",
    type: "Mock Interview Session",
    assignedOfficer: "Vijayalakshmi Rao",
    status: "In Progress",
    priority: "High",
    createdDate: "05 Apr 2026",
    dueDate: "13 Apr 2026",
    aiRecommendation: "AI suggested based on repeated mock interview rejections",
    progressNote: "Working on storytelling and clarity for project walkthroughs.",
  },
  {
    id: "int-007",
    studentId: "stu-013",
    type: "1:1 Counseling",
    assignedOfficer: "Unassigned",
    status: "Pending",
    priority: "Critical",
    createdDate: "02 Apr 2026",
    dueDate: "09 Apr 2026",
    aiRecommendation: "AI suggested based on prolonged inactivity and missing resume data",
  },
  {
    id: "int-008",
    studentId: "stu-014",
    type: "Domain Shift",
    assignedOfficer: "Dr. Anita Mehra",
    status: "Pending",
    priority: "High",
    createdDate: "07 Apr 2026",
    dueDate: "15 Apr 2026",
    aiRecommendation: "AI suggested based on interest and skill-fit mismatch for current role targets",
  },
  {
    id: "int-009",
    studentId: "stu-017",
    type: "Mock Interview Session",
    assignedOfficer: "Vijayalakshmi Rao",
    status: "Completed",
    priority: "Medium",
    createdDate: "28 Mar 2026",
    dueDate: "04 Apr 2026",
    aiRecommendation: "AI suggested based on moderate communication gap before recruiter drive",
  },
  {
    id: "int-010",
    studentId: "stu-019",
    type: "Resume Review",
    assignedOfficer: "Rahul Banerjee",
    status: "Completed",
    priority: "Medium",
    createdDate: "27 Mar 2026",
    dueDate: "03 Apr 2026",
    aiRecommendation: "AI suggested based on low response to nudges and weak resume framing",
  },
  {
    id: "int-011",
    studentId: "stu-023",
    type: "Resume Review",
    assignedOfficer: "Vijayalakshmi Rao",
    status: "Pending",
    priority: "Medium",
    createdDate: "08 Apr 2026",
    dueDate: "16 Apr 2026",
    aiRecommendation: "AI suggested based on resume positioning behind cluster benchmarks",
  },
  {
    id: "int-012",
    studentId: "stu-007",
    type: "Aptitude Bootcamp",
    assignedOfficer: "Rahul Banerjee",
    status: "In Progress",
    priority: "Medium",
    createdDate: "01 Apr 2026",
    dueDate: "12 Apr 2026",
    aiRecommendation: "AI suggested based on falling aptitude trend over three weeks",
    progressNote: "Student improved timed tests from 41 to 52. Follow-up mock scheduled.",
  },
];

export const BATCH_INTERVENTIONS = [
  {
    label: "DSA Workshop",
    description: "67 students need DSA improvement",
    actionLabel: "Schedule",
  },
  {
    label: "Aptitude Bootcamp",
    description: "43 students below 40th percentile",
    actionLabel: "Schedule",
  },
  {
    label: "Mock Interview Drive",
    description: "89 students with 0 mock attempts",
    actionLabel: "Schedule",
  },
];

export const ANALYTICS_DATE_RANGE = "Last 30 Days";

export const ANALYTICS_KPIS: StatCardData[] = [
  {
    id: "placement-rate",
    label: "Overall Placement Rate",
    value: "73.2%",
    delta: "+4.1%",
    subtitle: "Placed or final-round students",
    icon: "TrendingUp",
    tone: "emerald",
    sparkline: [61, 63, 65, 66, 68, 70, 71, 73],
  },
  {
    id: "time-to-intervention",
    label: "Avg Time to Intervention",
    value: "6.3 days",
    delta: "-1.2 days",
    subtitle: "From risk flag to first action",
    icon: "Zap",
    tone: "violet",
    sparkline: [8.1, 7.9, 7.6, 7.2, 7, 6.8, 6.5, 6.3],
  },
  {
    id: "nudge-response",
    label: "Nudge Response Rate",
    value: "61.4%",
    delta: "+8.2%",
    subtitle: "Student replies across channels",
    icon: "MessageSquare",
    tone: "amber",
    sparkline: [42, 44, 48, 51, 54, 57, 59, 61],
  },
  {
    id: "highest-risk",
    label: "Dept with Highest Risk",
    value: "ECE",
    delta: "43 critical",
    subtitle: "Critical alerts currently open",
    icon: "AlertTriangle",
    tone: "rose",
    sparkline: [31, 34, 35, 37, 39, 40, 42, 43],
  },
];

export const ANALYTICS_AREA_TREND = [
  { week: "W1", ready: 72, atRisk: 49, unprepared: 24 },
  { week: "W2", ready: 73, atRisk: 48, unprepared: 24 },
  { week: "W3", ready: 74, atRisk: 49, unprepared: 23 },
  { week: "W4", ready: 75, atRisk: 50, unprepared: 23 },
  { week: "W5", ready: 76, atRisk: 51, unprepared: 22 },
  { week: "W6", ready: 78, atRisk: 52, unprepared: 22 },
  { week: "W7", ready: 79, atRisk: 52, unprepared: 21 },
  { week: "W8", ready: 80, atRisk: 53, unprepared: 21 },
  { week: "W9", ready: 80, atRisk: 54, unprepared: 20 },
  { week: "W10", ready: 81, atRisk: 54, unprepared: 20 },
  { week: "W11", ready: 81, atRisk: 55, unprepared: 19 },
  { week: "W12", ready: 82, atRisk: 56, unprepared: 19 },
];

export const ANALYTICS_DEPARTMENT_RISK = [
  { department: "CSE", critical: 18, high: 23, medium: 16 },
  { department: "IT", critical: 14, high: 19, medium: 13 },
  { department: "ECE", critical: 43, high: 30, medium: 18 },
  { department: "MECH", critical: 25, high: 22, medium: 16 },
  { department: "CIVIL", critical: 21, high: 18, medium: 14 },
  { department: "MBA", critical: 12, high: 14, medium: 9 },
];

export const ANALYTICS_EFFECTIVENESS = [
  { week: "W1", intervention: 41, control: 24 },
  { week: "W2", intervention: 43, control: 25 },
  { week: "W3", intervention: 46, control: 26 },
  { week: "W4", intervention: 48, control: 28 },
  { week: "W5", intervention: 51, control: 29 },
  { week: "W6", intervention: 54, control: 31 },
  { week: "W7", intervention: 55, control: 32 },
  { week: "W8", intervention: 57, control: 33 },
  { week: "W9", intervention: 59, control: 34 },
  { week: "W10", intervention: 61, control: 35 },
  { week: "W11", intervention: 63, control: 36 },
  { week: "W12", intervention: 65, control: 37 },
];

export const ANALYTICS_SKILL_GAPS = [
  { skill: "DSA", value: 68 },
  { skill: "Aptitude", value: 54 },
  { skill: "System Design", value: 47 },
  { skill: "Communication", value: 39 },
  { skill: "Resume Quality", value: 35 },
];

export const FORECAST_TABLE = [
  { department: "CSE", totalStudents: 284, predictedPlaced: 228, predictedUnplaced: 56, atRiskCount: 41, confidence: 94 },
  { department: "IT", totalStudents: 241, predictedPlaced: 182, predictedUnplaced: 59, atRiskCount: 39, confidence: 92 },
  { department: "ECE", totalStudents: 226, predictedPlaced: 141, predictedUnplaced: 85, atRiskCount: 63, confidence: 89 },
  { department: "MECH", totalStudents: 196, predictedPlaced: 117, predictedUnplaced: 79, atRiskCount: 54, confidence: 87 },
  { department: "CIVIL", totalStudents: 148, predictedPlaced: 78, predictedUnplaced: 70, atRiskCount: 46, confidence: 86 },
  { department: "MBA", totalStudents: 152, predictedPlaced: 118, predictedUnplaced: 34, atRiskCount: 24, confidence: 93 },
];

export const NUDGE_STATS: StatCardData[] = [
  {
    id: "nudges-total",
    label: "Total Nudges Sent",
    value: "1,483",
    delta: "+92 today",
    subtitle: "Across WhatsApp, email, and in-app",
    icon: "Send",
    tone: "violet",
  },
  {
    id: "nudges-response",
    label: "Response Rate",
    value: "61.4%",
    delta: "+8.2% vs last month",
    subtitle: "Students replying or taking action",
    icon: "MessageSquare",
    tone: "emerald",
  },
  {
    id: "nudges-opened",
    label: "Opened",
    value: "1,104",
    delta: "74.4% open rate",
    subtitle: "Messages opened across all channels",
    icon: "Mail",
    tone: "amber",
  },
  {
    id: "nudges-pending",
    label: "Pending",
    value: "72",
    delta: "23 scheduled for tomorrow",
    subtitle: "Queued and waiting for delivery",
    icon: "Bell",
    tone: "slate",
  },
];

export const NUDGE_TEMPLATES: NudgeTemplateData[] = [
  {
    id: "tpl-001",
    name: "Inactivity Alert",
    tone: "slate",
    preview: "Hey [Name], we noticed you have not logged in for X days. Let us get you back on track.",
    channels: ["WhatsApp", "Email", "In-App"],
    lastUsed: "08 Apr 2026",
    useCount: 214,
  },
  {
    id: "tpl-002",
    name: "Mock Interview Reminder",
    tone: "violet",
    preview: "Your placement probability can improve by 18% with a mock session. Book one today.",
    channels: ["WhatsApp", "Email"],
    lastUsed: "09 Apr 2026",
    useCount: 173,
  },
  {
    id: "tpl-003",
    name: "Skill Gap Alert",
    tone: "amber",
    preview: "We identified gaps in [Skill]. Here is a recommended course and a quick action plan.",
    channels: ["WhatsApp", "Email", "In-App"],
    lastUsed: "07 Apr 2026",
    useCount: 196,
  },
  {
    id: "tpl-004",
    name: "Resume Incomplete",
    tone: "rose",
    preview: "Your resume score is [X]/100. Here is what is missing before your next recruiter review.",
    channels: ["Email", "In-App"],
    lastUsed: "05 Apr 2026",
    useCount: 128,
  },
  {
    id: "tpl-005",
    name: "Motivation Boost",
    tone: "emerald",
    preview: "You are 73% of the way to placement-ready. Keep going, your recent effort is showing up.",
    channels: ["WhatsApp", "In-App"],
    lastUsed: "08 Apr 2026",
    useCount: 147,
  },
  {
    id: "tpl-006",
    name: "Domain Shift Suggestion",
    tone: "blue",
    preview: "Based on your profile, [New Domain] may be a stronger fit. Here is why and what to do next.",
    channels: ["Email", "In-App"],
    lastUsed: "04 Apr 2026",
    useCount: 63,
  },
];

export const NUDGE_FEED: NudgeRecord[] = [
  {
    id: "nudge-001",
    studentId: "stu-012",
    templateId: "tpl-003",
    channel: "WhatsApp",
    sentAt: "12 mins ago",
    status: "Responded",
    responseSnippet: "I joined the DSA playlist and booked a mock for Friday.",
  },
  {
    id: "nudge-002",
    studentId: "stu-010",
    templateId: "tpl-004",
    channel: "Email",
    sentAt: "42 mins ago",
    status: "Opened",
    responseSnippet: "Downloaded resume checklist.",
  },
  {
    id: "nudge-003",
    studentId: "stu-013",
    templateId: "tpl-001",
    channel: "In-App",
    sentAt: "1 hour ago",
    status: "Delivered",
  },
  {
    id: "nudge-004",
    studentId: "stu-023",
    templateId: "tpl-005",
    channel: "WhatsApp",
    sentAt: "2 hours ago",
    status: "Opened",
  },
  {
    id: "nudge-005",
    studentId: "stu-014",
    templateId: "tpl-006",
    channel: "Email",
    sentAt: "3 hours ago",
    status: "Failed",
    responseSnippet: "Mailbox bounced. Retry recommended with alternate channel.",
  },
  {
    id: "nudge-006",
    studentId: "stu-007",
    templateId: "tpl-002",
    channel: "WhatsApp",
    sentAt: "5 hours ago",
    status: "Delivered",
  },
];

export const NUDGE_COMPOSER = {
  studentModes: ["Select Students", "By Cluster"],
  clusters: ["Placement Ready", "At-Risk", "Unprepared", "Inactive"],
  templates: NUDGE_TEMPLATES.map((template) => template.name),
  channels: ["WhatsApp", "Email", "In-App"],
  schedulingModes: ["Send Now", "Schedule"],
  preview:
    "Hi Priya, our AI model noticed your DSA readiness is lagging behind your target role. Complete the linked crash course and book one mock interview this week to improve your placement probability.",
};

export const SETTINGS_DATA = {
  aiConfiguration: {
    thresholds: {
      critical: 30,
      highRisk: 50,
      atRisk: 65,
    },
    frequencyOptions: ["Daily", "Weekly", "Manual"],
    selectedFrequency: "Daily",
    confidenceThresholdEnabled: true,
    confidenceThreshold: 91,
    retrainLabel: "Re-train Model",
  },
  notifications: {
    toggles: [
      { label: "Email alerts for Critical students", enabled: true },
      { label: "WhatsApp nudges", enabled: true },
      { label: "Daily digest", enabled: true },
      { label: "Weekly report", enabled: false },
    ],
    alertRecipients: "anita.mehra@placeguard.ai, tpc-core@placeguard.ai",
  },
};

export const INTEGRATIONS: IntegrationCardData[] = [
  {
    id: "intg-001",
    name: "LMS (Moodle)",
    icon: "Building2",
    status: "Connected",
    lastSync: "Today, 5:42 AM",
  },
  {
    id: "intg-002",
    name: "Attendance System",
    icon: "Building2",
    status: "Connected",
    lastSync: "Today, 6:10 AM",
  },
  {
    id: "intg-003",
    name: "Mock Test Platform",
    icon: "Globe",
    status: "Connected",
    lastSync: "Today, 6:18 AM",
  },
  {
    id: "intg-004",
    name: "HR Portal",
    icon: "Globe",
    status: "Disconnected",
    lastSync: "07 Apr 2026, 8:12 PM",
  },
];

export const TPC_TEAM: TeamMember[] = [
  {
    id: "team-001",
    name: "Dr. Anita Mehra",
    email: "anita.mehra@placeguard.ai",
    role: "Admin",
    assignedStudents: 184,
  },
  {
    id: "team-002",
    name: "Rahul Banerjee",
    email: "rahul.banerjee@placeguard.ai",
    role: "Coordinator",
    assignedStudents: 173,
  },
  {
    id: "team-003",
    name: "Vijayalakshmi Rao",
    email: "vijayalakshmi.rao@placeguard.ai",
    role: "Coordinator",
    assignedStudents: 162,
  },
  {
    id: "team-004",
    name: "Sonal Kapadia",
    email: "sonal.kapadia@placeguard.ai",
    role: "Viewer",
    assignedStudents: 0,
  },
];

export const HELP_CENTER = {
  heading: "TPC Help & Model Ops",
  sections: [
    {
      title: "Runbook",
      body: "Check the intervention queue twice a day, assign critical alerts within 6 hours, and review AI confidence drift every Friday.",
    },
    {
      title: "Escalation",
      body: "Escalate students with 3 unanswered nudges and 21+ days inactivity to the faculty coordinator and class mentor.",
    },
    {
      title: "Model Notes",
      body: "Risk scores update every morning at 6:00 AM after LMS, attendance, and mock data sync completes.",
    },
  ],
};

const studentBaseDate = new Date("2026-04-10T08:30:00+05:30");

function studentDateOffset(daysAgo: number): string {
  const next = new Date(studentBaseDate);
  next.setDate(next.getDate() - daysAgo);
  return next.toISOString().split("T")[0] ?? "";
}

const heatmapCounts = [
  0, 1, 0, 2, 3, 1, 0,
  2, 4, 0, 1, 3, 2, 0,
  5, 4, 3, 0, 1, 2, 4,
  0, 2, 1, 3, 5, 4, 2,
];

export const STUDENT_PAGE_META = [
  {
    href: "/student",
    title: "Your Placement Dashboard",
    description: "Personal placement score, AI signals, and your next best actions.",
  },
  {
    href: "/student/progress",
    title: "Your Growth Journey",
    description: "Weekly and monthly progress across probability, skills, and consistency.",
  },
  {
    href: "/student/action-plan",
    title: "Your AI Roadmap",
    description: "Priority actions that move your placement probability upward.",
  },
  {
    href: "/student/profile-builder",
    title: "Your Placement Profile",
    description: "Build a recruiter-ready profile that improves your visibility and score.",
  },
  {
    href: "/student/skill-tracker",
    title: "Know Your Gaps",
    description: "Skill benchmarking, trendlines, and focused improvement plans.",
  },
  {
    href: "/student/mock-interviews",
    title: "Practice & Improve",
    description: "Track mock performance, feedback, and book your next session.",
  },
  {
    href: "/student/achievements",
    title: "Your Milestones",
    description: "Badges, certifications, leaderboard context, and unlocked progress.",
  },
  {
    href: "/student/notifications",
    title: "Alerts & Nudges from TPC",
    description: "Supportive reminders, TPC alerts, and AI nudges in one feed.",
  },
];

export const STUDENT_NAV_SECTIONS = [
  {
    title: "MY DASHBOARD",
    items: [
      { label: "Overview", href: "/student", icon: "LayoutDashboard" },
      {
        label: "My Progress",
        href: "/student/progress",
        icon: "TrendingUp",
        badgeCount: 2,
        badgeTone: "sky",
      },
      {
        label: "Action Plan",
        href: "/student/action-plan",
        icon: "Zap",
        badgeCount: 5,
        badgeTone: "amber",
      },
    ],
  },
  {
    title: "MY PROFILE",
    items: [
      {
        label: "Profile Builder",
        href: "/student/profile-builder",
        icon: "UserCircle",
        badgeCount: 74,
        badgeTone: "violet",
      },
      { label: "Skill Tracker", href: "/student/skill-tracker", icon: "Brain" },
      {
        label: "Mock Interviews",
        href: "/student/mock-interviews",
        icon: "Mic",
      },
      { label: "Achievements", href: "/student/achievements", icon: "Trophy" },
    ],
  },
  {
    title: "NOTIFICATIONS",
    items: [
      {
        label: "TPC Alerts",
        href: "/student/notifications?filter=tpc",
        icon: "Bell",
        badgeCount: 3,
        badgeTone: "rose",
      },
      {
        label: "All Notifications",
        href: "/student/notifications",
        icon: "MessageSquare",
        badgeCount: 10,
        badgeTone: "violet",
      },
    ],
  },
];

export const STUDENT_PROFILE: StudentProfileRecord = {
  id: "STU-2024-047",
  name: "Arjun Mehta",
  rollNo: "21CSE047",
  department: "CSE",
  year: 4,
  cgpa: 7.2,
  placementProbability: 67,
  riskScore: 43,
  cluster: "at-risk",
  streak: 12,
  profileCompletion: 74,
  batchYear: "2024 Batch",
  lastUpdated: "2026-04-10T06:30:00+05:30",
  weeklyProgress: [
    { week: "W1", probability: 52, dsa: 28, aptitude: 45, mock: 0 },
    { week: "W2", probability: 55, dsa: 30, aptitude: 48, mock: 0 },
    { week: "W3", probability: 58, dsa: 34, aptitude: 51, mock: 1 },
    { week: "W4", probability: 56, dsa: 32, aptitude: 50, mock: 1 },
    { week: "W5", probability: 60, dsa: 36, aptitude: 53, mock: 2 },
    { week: "W6", probability: 63, dsa: 34, aptitude: 55, mock: 2 },
    { week: "W7", probability: 65, dsa: 36, aptitude: 57, mock: 2 },
    { week: "W8", probability: 67, dsa: 34, aptitude: 59, mock: 2 },
  ],
  monthlyProgress: [
    { month: "Nov", probability: 48, tasksCompleted: 12 },
    { month: "Dec", probability: 53, tasksCompleted: 18 },
    { month: "Jan", probability: 58, tasksCompleted: 22 },
    { month: "Feb", probability: 62, tasksCompleted: 19 },
    { month: "Mar", probability: 65, tasksCompleted: 25 },
    { month: "Apr", probability: 67, tasksCompleted: 9 },
  ],
  skills: {
    dsa: 34,
    aptitude: 59,
    communication: 72,
    domainKnowledge: 61,
    resumeQuality: 72,
    mockInterviewScore: 54,
  },
  batchAvgSkills: {
    dsa: 52,
    aptitude: 61,
    communication: 65,
    domainKnowledge: 58,
    resumeQuality: 68,
    mockInterviewScore: 61,
  },
  activityHeatmap: heatmapCounts.map((count, index) => ({
    date: studentDateOffset(27 - index),
    count,
  })),
};

export const STUDENT_OVERVIEW_FACTORS: OverviewFactor[] = [
  {
    id: "factor-resume",
    label: "Resume",
    status: "complete",
    detail: "Complete",
    href: "/student/profile-builder#resume",
  },
  {
    id: "factor-mock",
    label: "Mock Interviews",
    status: "critical",
    detail: "0 attempts this month",
    href: "/student/mock-interviews",
  },
  {
    id: "factor-dsa",
    label: "DSA",
    status: "warning",
    detail: "34% proficiency",
    href: "/student/skill-tracker#dsa",
  },
  {
    id: "factor-linkedin",
    label: "LinkedIn",
    status: "complete",
    detail: "Connected",
    href: "/student/profile-builder#links",
  },
  {
    id: "factor-activity",
    label: "Activity",
    status: "warning",
    detail: "Low engagement",
    href: "/student/progress#consistency",
  },
];

export const STUDENT_QUICK_ACTIONS: QuickActionCard[] = [
  {
    id: "quick-mock",
    title: "Take a Mock Interview",
    subtitle: "0 attempts this month · +12% score boost",
    ctaLabel: "Book Now",
    href: "/student/mock-interviews",
    icon: "Mic",
    tone: "violet",
    aiConfidence: "91% confidence",
  },
  {
    id: "quick-dsa",
    title: "Complete DSA Module",
    subtitle: "34% → target 70% · 14 days left",
    ctaLabel: "Start Module",
    href: "/student/skill-tracker#dsa",
    icon: "Code",
    tone: "amber",
    aiConfidence: "88% confidence",
  },
  {
    id: "quick-resume",
    title: "Update Resume",
    subtitle: "Last updated 23 days ago",
    ctaLabel: "Edit Resume",
    href: "/student/profile-builder#resume",
    icon: "FileText",
    tone: "sky",
    aiConfidence: "85% confidence",
  },
  {
    id: "quick-leetcode",
    title: "Solve 5 LeetCode Problems",
    subtitle: "Streak: 2 days",
    ctaLabel: "Open Tracker",
    href: "/student/skill-tracker#dsa",
    icon: "Terminal",
    tone: "emerald",
    aiConfidence: "82% confidence",
  },
];

export const STUDENT_AI_INSIGHTS: StudentInsight[] = [
  {
    id: "insight-001",
    insight: "Your aptitude score improved 11% after last week's practice set.",
    action: { label: "Keep Momentum", href: "/student/progress" },
    type: "success",
    timestamp: "20 mins ago",
  },
  {
    id: "insight-002",
    insight: "67 students in your batch have higher mock interview scores — scheduling one now would help.",
    action: { label: "Schedule Mock", href: "/student/mock-interviews" },
    type: "warning",
    timestamp: "1 hour ago",
  },
  {
    id: "insight-003",
    insight: "Companies visiting next month require System Design knowledge — gap detected in your profile.",
    action: { label: "View Action Plan", href: "/student/action-plan" },
    type: "tip",
    timestamp: "3 hours ago",
  },
  {
    id: "insight-004",
    insight: "Your GitHub activity dropped to 0 commits this week. Recruiters notice consistency signals.",
    action: { label: "Update Profile", href: "/student/profile-builder#links" },
    type: "warning",
    timestamp: "6 hours ago",
  },
];

export const STUDENT_AI_INSIGHT_SHEET = {
  headline: "Today's AI Analysis",
  summary:
    "Your placement probability is holding at 67%, but DSA readiness slipped by 2 points this week because coding-round activity stayed low.",
  bullets: [
    "Aptitude improved 11% after your latest practice set.",
    "Resume quality is stable, but quantified outcomes are still missing.",
    "Two mock interviews in the next 14 days would add the biggest score lift.",
  ],
};

export const STUDENT_PROFILE_COMPLETION_CARD = {
  completion: 74,
  attentionText: "3 sections need attention",
  actionLabel: "Complete Profile",
};

export const STUDENT_TPC_ALERTS: TpcAlert[] = [
  {
    id: "tpc-001",
    title: "TPC has flagged you for intervention",
    description: "A focused plan has been prepared for you in Action Plan.",
    actionLabel: "Check Action Plan",
    href: "/student/action-plan",
    tone: "rose",
  },
  {
    id: "tpc-002",
    title: "Mock Interview Drive scheduled for Apr 18",
    description: "Register by Apr 15 to reserve an AI interviewer slot.",
    actionLabel: "Register",
    href: "/student/mock-interviews",
    tone: "amber",
  },
  {
    id: "tpc-003",
    title: "Resume Review slot available",
    description: "Two faculty-led review slots are open tomorrow afternoon.",
    actionLabel: "Book Slot",
    href: "/student/profile-builder#resume",
    tone: "violet",
  },
];

export const STUDENT_PROGRESS_RANGES = [
  "This Week",
  "This Month",
  "Last 3 Months",
  "All Time",
];

export const STUDENT_ACTIVITY_BREAKDOWN_CURRENT: ActivityBreakdownPoint[] = [
  { day: "Mon", leetCode: 2, mockTests: 0, courses: 1, profileUpdates: 0 },
  { day: "Tue", leetCode: 1, mockTests: 1, courses: 1, profileUpdates: 0 },
  { day: "Wed", leetCode: 4, mockTests: 1, courses: 2, profileUpdates: 1 },
  { day: "Thu", leetCode: 2, mockTests: 0, courses: 1, profileUpdates: 1 },
  { day: "Fri", leetCode: 3, mockTests: 1, courses: 0, profileUpdates: 0 },
  { day: "Sat", leetCode: 2, mockTests: 0, courses: 1, profileUpdates: 0 },
  { day: "Sun", leetCode: 1, mockTests: 0, courses: 0, profileUpdates: 0 },
];

export const STUDENT_ACTIVITY_BREAKDOWN_PREVIOUS: ActivityBreakdownPoint[] = [
  { day: "Mon", leetCode: 1, mockTests: 0, courses: 0, profileUpdates: 0 },
  { day: "Tue", leetCode: 1, mockTests: 0, courses: 1, profileUpdates: 0 },
  { day: "Wed", leetCode: 2, mockTests: 0, courses: 1, profileUpdates: 0 },
  { day: "Thu", leetCode: 1, mockTests: 0, courses: 0, profileUpdates: 0 },
  { day: "Fri", leetCode: 2, mockTests: 1, courses: 0, profileUpdates: 0 },
  { day: "Sat", leetCode: 0, mockTests: 0, courses: 1, profileUpdates: 0 },
  { day: "Sun", leetCode: 1, mockTests: 0, courses: 0, profileUpdates: 0 },
];

export const STUDENT_MONTHLY_SUMMARY = [
  { label: "Problems Solved", value: "47", delta: "+12 from last month", tone: "violet" },
  { label: "Mock Interviews", value: "2", delta: "+1", tone: "amber" },
  { label: "Courses Completed", value: "1", delta: "Same as last month", tone: "sky" },
  { label: "Profile Score", value: "74%", delta: "+6%", tone: "emerald" },
];

export const STUDENT_COHORT_COMPARISON: CohortComparisonRow[] = [
  { skill: "DSA", yourScore: 34, batchAverage: 52, percentile: 26 },
  { skill: "Aptitude", yourScore: 59, batchAverage: 61, percentile: 48 },
  { skill: "Communication", yourScore: 72, batchAverage: 65, percentile: 68 },
  { skill: "Domain Knowledge", yourScore: 61, batchAverage: 58, percentile: 57 },
  { skill: "Resume Quality", yourScore: 72, batchAverage: 68, percentile: 63 },
  { skill: "Mock Interview", yourScore: 54, batchAverage: 61, percentile: 41 },
];

export const STUDENT_STREAK_INSIGHT =
  "Consistent students are 2.3× more likely to get placed. Keep your streak alive this week.";

export const STUDENT_SKILL_CARDS: SkillCardData[] = [
  {
    id: "dsa",
    label: "DSA",
    icon: "Code2",
    currentScore: 34,
    trend: [28, 30, 34, 32, 36, 34, 36, 34],
    delta: -2,
    batchAverage: 52,
    percentile: 26,
    diagnosis: "Low due to 0 mock coding rounds and weak Trees/Graphs practice.",
    actionLabel: "Practice DSA →",
  },
  {
    id: "aptitude",
    label: "Aptitude",
    icon: "Brain",
    currentScore: 59,
    trend: [45, 48, 51, 50, 53, 55, 57, 59],
    delta: 4,
    batchAverage: 61,
    percentile: 48,
    diagnosis: "Improving after timed practice, but speed still trails your batch.",
    actionLabel: "Take Aptitude Quiz →",
  },
  {
    id: "communication",
    label: "Communication",
    icon: "Mic",
    currentScore: 72,
    trend: [61, 63, 66, 68, 69, 70, 71, 72],
    delta: 3,
    batchAverage: 65,
    percentile: 68,
    diagnosis: "Strong HR-round performance and concise storytelling are helping here.",
    actionLabel: "Refine HR Answers →",
  },
  {
    id: "domainKnowledge",
    label: "Domain Knowledge",
    icon: "Cpu",
    currentScore: 61,
    trend: [49, 51, 54, 57, 58, 59, 60, 61],
    delta: 2,
    batchAverage: 58,
    percentile: 57,
    diagnosis: "Core CS concepts are stable, but System Design coverage is still light.",
    actionLabel: "Study Core Topics →",
  },
  {
    id: "resumeQuality",
    label: "Resume Quality",
    icon: "FileText",
    currentScore: 72,
    trend: [61, 62, 64, 66, 69, 70, 71, 72],
    delta: 1,
    batchAverage: 68,
    percentile: 63,
    diagnosis: "Content is solid, but quantified outcomes could still be sharper.",
    actionLabel: "Edit Resume →",
  },
  {
    id: "mockInterviewScore",
    label: "Mock Interview Score",
    icon: "MessageSquare",
    currentScore: 54,
    trend: [0, 0, 41, 43, 49, 52, 54, 54],
    delta: 0,
    batchAverage: 61,
    percentile: 41,
    diagnosis: "No recent mocks means your score is lagging behind the batch average.",
    actionLabel: "Book Mock →",
  },
];

export const STUDENT_DSA_TOPIC_BREAKDOWN = [
  { topic: "Arrays", solved: 24, accuracy: "87%", status: "Strong", tone: "emerald" },
  { topic: "Linked Lists", solved: 8, accuracy: "62%", status: "Practice", tone: "amber" },
  { topic: "Trees", solved: 3, accuracy: "40%", status: "Weak", tone: "rose" },
  { topic: "Graphs", solved: 0, accuracy: "—", status: "Not started", tone: "rose" },
  { topic: "DP", solved: 1, accuracy: "30%", status: "Weak", tone: "rose" },
  { topic: "Sorting", solved: 18, accuracy: "91%", status: "Strong", tone: "emerald" },
];

export const STUDENT_RECOMMENDED_PROBLEMS = [
  "Binary Tree Level Order Traversal",
  "Number of Islands",
  "Course Schedule",
  "House Robber",
  "Merge Intervals",
];

export const STUDENT_IMPROVEMENT_PLAN: ImprovementPlanStep[] = [
  { id: "step-1", week: "Week 1", task: "Solve 10 Tree problems on LeetCode (Easy)", completed: false },
  { id: "step-2", week: "Week 2", task: "Complete Graph module on Striver's Sheet", completed: false },
  { id: "step-3", week: "Week 3", task: "Attempt 2 mock coding rounds", completed: false },
  { id: "step-4", week: "Week 4", task: "Revisit DP basics and solve 5 problems", completed: false },
];

export const STUDENT_MOCK_STATS = [
  { label: "Total Attempts", value: "2", delta: "Across the past 6 weeks", tone: "violet" },
  { label: "Avg Score", value: "54/100", delta: "Up 7 points vs first attempt", tone: "amber" },
  { label: "Best Score", value: "67/100", delta: "Technical DSA round", tone: "emerald" },
  { label: "Scheduled", value: "1", delta: "Upcoming this week", tone: "violet" },
];

export const STUDENT_UPCOMING_MOCK = {
  dateLabel: "Apr 18, 2026 · 2:00 PM",
  type: "Technical Round — DSA + System Design",
  interviewer: "AI Interviewer",
  countdown: "3 days 4 hours remaining",
};

export const STUDENT_MOCK_ATTEMPTS: MockInterviewAttempt[] = [
  {
    id: "mock-001",
    date: "Apr 02, 2026",
    type: "DSA Round",
    score: 67,
    feedbackSummary: "Good problem solving, but execution slowed under time pressure.",
    strengths: ["Arrays", "Sorting"],
    improvements: ["Time management", "Graphs"],
    scoreBreakdown: [
      { label: "Problem Solving", value: 72 },
      { label: "Coding Accuracy", value: 68 },
      { label: "Communication", value: 61 },
      { label: "Optimization", value: 57 },
    ],
    questionReview: [
      "Solved the first array problem cleanly with correct edge case handling.",
      "Needed hints during the graph traversal problem.",
      "Optimization explanation was not fully articulated.",
    ],
    aiTips: [
      "Practice one timed graph question every alternate day.",
      "Verbally state complexity before writing code.",
    ],
  },
  {
    id: "mock-002",
    date: "Mar 20, 2026",
    type: "Aptitude",
    score: 54,
    feedbackSummary: "Average performance with strong verbal but slow quantitative speed.",
    strengths: ["Verbal reasoning", "Pattern detection"],
    improvements: ["Quant speed", "Data interpretation"],
    scoreBreakdown: [
      { label: "Quantitative", value: 49 },
      { label: "Logical", value: 58 },
      { label: "Verbal", value: 63 },
      { label: "Time Management", value: 46 },
    ],
    questionReview: [
      "Missed two DI questions due to time pressure.",
      "Handled logical puzzles well.",
    ],
    aiTips: ["Use 20-minute timed drills for quantitative speed."],
  },
  {
    id: "mock-003",
    date: "Mar 10, 2026",
    type: "HR Round",
    score: 78,
    feedbackSummary: "Excellent communication and strong self-awareness.",
    strengths: ["Communication", "Clarity"],
    improvements: ["Quantifying achievements"],
    scoreBreakdown: [
      { label: "Confidence", value: 82 },
      { label: "Storytelling", value: 79 },
      { label: "Role Alignment", value: 76 },
      { label: "Achievement Framing", value: 70 },
    ],
    questionReview: [
      "Strong introduction and clear project narrative.",
      "Needs more quantified impact examples.",
    ],
    aiTips: ["Prepare 3 quantified project stories before recruiter rounds."],
  },
  {
    id: "mock-004",
    date: "Feb 21, 2026",
    type: "System Design",
    score: 49,
    feedbackSummary: "Good intuition, but design depth and trade-offs were underdeveloped.",
    strengths: ["Requirement clarification"],
    improvements: ["Scalability", "Trade-offs"],
    scoreBreakdown: [
      { label: "Requirements", value: 65 },
      { label: "Architecture", value: 48 },
      { label: "Trade-offs", value: 41 },
      { label: "Communication", value: 56 },
    ],
    questionReview: [
      "Captured requirements correctly but missed cache/database trade-offs.",
    ],
    aiTips: ["Review 2 beginner system design patterns this week."],
  },
  {
    id: "mock-005",
    date: "Feb 08, 2026",
    type: "Full Stack",
    score: 58,
    feedbackSummary: "Balanced skills overall, but deployment and testing details were light.",
    strengths: ["Frontend architecture", "API design"],
    improvements: ["Testing", "Deployment"],
    scoreBreakdown: [
      { label: "Frontend", value: 66 },
      { label: "Backend", value: 61 },
      { label: "Testing", value: 48 },
      { label: "DevOps", value: 42 },
    ],
    questionReview: [
      "Strong API explanations but light on CI/CD detail.",
    ],
    aiTips: ["Add deployment notes to one project and revisit test strategy."],
  },
];

export const STUDENT_BOOK_MOCK_OPTIONS = {
  types: ["DSA Coding", "Aptitude", "HR", "System Design", "Full Stack", "Domain"],
  slots: ["Apr 18 · 2:00 PM", "Apr 18 · 5:00 PM", "Apr 19 · 11:00 AM", "Apr 20 · 4:00 PM"],
};

export const STUDENT_ACTION_PLAN_HEADER = {
  generatedOn: "Generated by AI on Apr 10, 2026",
  riskLabel: "AT-RISK — 67% placement probability",
  projection: "Complete this plan to reach 80%+ probability in 6 weeks",
};

export const STUDENT_ACTION_PLAN_PROJECTION = [
  { week: "Today", plan: 67, current: 67 },
  { week: "Week 1", plan: 70, current: 65 },
  { week: "Week 2", plan: 72, current: 64 },
  { week: "Week 3", plan: 75, current: 63 },
  { week: "Week 4", plan: 77, current: 62 },
  { week: "Week 5", plan: 79, current: 61 },
  { week: "Week 6", plan: 82, current: 60 },
];

export const STUDENT_ACTION_PLAN_TASKS: Record<
  "critical" | "high" | "medium",
  ActionPlanTask[]
> = {
  critical: [
    {
      id: "plan-001",
      title: "Complete 3 Mock Interviews",
      why: "0 attempts this month creates a significant score penalty.",
      impact: "+12% placement probability",
      due: "Within 2 weeks",
      ctaLabel: "Book Mock",
      href: "/student/mock-interviews",
      icon: "Mic",
      progress: 0,
      total: 3,
    },
    {
      id: "plan-002",
      title: "Practice DSA — 30 problems",
      why: "DSA score 34% is below the cutoff for your target companies.",
      impact: "+8% probability",
      due: "14 days",
      ctaLabel: "Open LeetCode",
      href: "/student/skill-tracker#dsa",
      icon: "Code",
      progress: 8,
      total: 30,
    },
  ],
  high: [
    {
      id: "plan-003",
      title: "Update Resume",
      why: "Last updated 23 days ago and ATS score is 72%.",
      impact: "+5% probability",
      due: "This week",
      ctaLabel: "Edit Resume",
      href: "/student/profile-builder#resume",
      icon: "FileText",
      progress: 0,
      total: 1,
    },
    {
      id: "plan-004",
      title: "Add 2 projects to profile",
      why: "Only 1 project is visible for your current role target.",
      impact: "+4% probability",
      due: "10 days",
      ctaLabel: "Update Projects",
      href: "/student/profile-builder#projects",
      icon: "FolderOpen",
      progress: 1,
      total: 2,
    },
  ],
  medium: [
    {
      id: "plan-005",
      title: "Complete AWS Fundamentals course",
      why: "Cloud fundamentals are increasingly common in product company screens.",
      impact: "+3% probability",
      due: "3 weeks",
      ctaLabel: "Open Course",
      href: "/student/action-plan",
      icon: "Cpu",
      progress: 0,
      total: 1,
    },
    {
      id: "plan-006",
      title: "Solve 10 System Design questions",
      why: "System Design is now appearing in final technical rounds.",
      impact: "+3% probability",
      due: "3 weeks",
      ctaLabel: "Review Topics",
      href: "/student/skill-tracker",
      icon: "Terminal",
      progress: 2,
      total: 10,
    },
    {
      id: "plan-007",
      title: "Register for upcoming campus drive",
      why: "Registration closes before your next plan milestone ends.",
      impact: "Keeps you eligible",
      due: "2 days",
      ctaLabel: "Register",
      href: "/student/notifications",
      icon: "BadgeCheck",
      progress: 0,
      total: 1,
    },
  ],
};

export const STUDENT_WEEKLY_CHECKLIST = [
  { id: "wk-1", label: "Solve 5 LeetCode problems (DSA)", completed: false },
  { id: "wk-2", label: "Update LinkedIn profile", completed: true },
  { id: "wk-3", label: "Attempt 1 mock interview", completed: false },
  { id: "wk-4", label: "Complete Arrays module", completed: false },
  { id: "wk-5", label: "Add internship to profile", completed: false },
];

export const STUDENT_ACHIEVEMENT_STATS = [
  { label: "Badges Earned", value: "8", delta: "2 unlocked this month", tone: "yellow" },
  { label: "Certifications", value: "3", delta: "1 added recently", tone: "emerald" },
  { label: "Streak Record", value: "21 days", delta: "Current streak 12 days", tone: "amber" },
  { label: "Rank in Batch", value: "#156 / 412", delta: "Top 38%", tone: "violet" },
];

export const STUDENT_BADGES: AchievementBadge[] = [
  { id: "badge-001", name: "First Mock", description: "Completed your first mock interview", icon: "Mic", tone: "violet", earned: true, earnedDate: "Mar 20, 2026" },
  { id: "badge-002", name: "Problem Solver", description: "Solved 25+ LeetCode problems", icon: "Code", tone: "emerald", earned: true, earnedDate: "Mar 28, 2026" },
  { id: "badge-003", name: "Profile Pro", description: "Profile reached 75% completion", icon: "Users", tone: "sky", earned: true, earnedDate: "Apr 01, 2026" },
  { id: "badge-004", name: "Streak Master", description: "Hit a 21-day activity streak", icon: "Zap", tone: "amber", earned: true, earnedDate: "Apr 03, 2026" },
  { id: "badge-005", name: "Resume Ready", description: "Resume ATS score crossed 70%", icon: "BadgeCheck", tone: "emerald", earned: true, earnedDate: "Apr 04, 2026" },
  { id: "badge-006", name: "Networked", description: "Connected 3+ public profiles", icon: "Globe", tone: "violet", earned: true, earnedDate: "Apr 06, 2026" },
  { id: "badge-007", name: "Interview Ace", description: "Score 90+ in a mock", icon: "Mic", tone: "slate", earned: false, unlockCriteria: "Reach 90/100 in any mock round" },
  { id: "badge-008", name: "Top Performer", description: "Enter top 10% in your batch", icon: "TrendingUp", tone: "slate", earned: false, unlockCriteria: "Reach top 10% placement readiness percentile" },
  { id: "badge-009", name: "Placement Ready", description: "Cross 80% placement probability", icon: "BadgeCheck", tone: "slate", earned: false, unlockCriteria: "Reach 80% probability" },
  { id: "badge-010", name: "DSA Expert", description: "Push DSA score to 85+", icon: "Gauge", tone: "slate", earned: false, unlockCriteria: "Reach 85 DSA score" },
  { id: "badge-011", name: "Certified", description: "Add 5+ certifications", icon: "ShieldAlert", tone: "slate", earned: false, unlockCriteria: "Upload five certifications" },
  { id: "badge-012", name: "Consistent", description: "Maintain a 30-day streak", icon: "Sparkles", tone: "slate", earned: false, unlockCriteria: "Stay active for 30 days in a row" },
];

export const STUDENT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Batch-014", placementProbability: 93, score: 91, mockCount: 8 },
  { rank: 2, name: "Batch-038", placementProbability: 92, score: 90, mockCount: 7 },
  { rank: 3, name: "Batch-126", placementProbability: 90, score: 88, mockCount: 7 },
  { rank: 4, name: "Batch-077", placementProbability: 89, score: 87, mockCount: 6 },
  { rank: 5, name: "Batch-219", placementProbability: 88, score: 86, mockCount: 6 },
  { rank: 6, name: "Batch-142", placementProbability: 87, score: 85, mockCount: 6 },
  { rank: 7, name: "Batch-266", placementProbability: 86, score: 84, mockCount: 5 },
  { rank: 8, name: "Batch-055", placementProbability: 85, score: 84, mockCount: 5 },
  { rank: 9, name: "Batch-309", placementProbability: 84, score: 83, mockCount: 5 },
  { rank: 10, name: "Batch-181", placementProbability: 84, score: 82, mockCount: 4 },
  { rank: 156, name: "Arjun Mehta", placementProbability: 67, score: 43, mockCount: 2, isCurrentStudent: true },
];

export const STUDENT_NOTIFICATION_FILTERS = [
  "All",
  "TPC Alerts",
  "AI Nudges",
  "Reminders",
  "System",
];

export const STUDENT_NOTIFICATION_STATS = [
  { label: "Unread", value: "3", tone: "rose" },
  { label: "From TPC", value: "3", tone: "amber" },
  { label: "AI Nudges", value: "4", tone: "violet" },
  { label: "System", value: "2", tone: "slate" },
];

export const STUDENT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "note-001",
    type: "tpc",
    title: "You have been flagged as At-Risk",
    description: "An intervention has been assigned to help you improve your placement readiness.",
    timestamp: "2 hours ago",
    unread: true,
    actionLabel: "View Action Plan",
    href: "/student/action-plan",
  },
  {
    id: "note-002",
    type: "ai",
    title: "You have not attempted any mock interview this month",
    description: "Your score dropped 3% because mock activity is now below your batch average.",
    timestamp: "5 hours ago",
    unread: true,
    actionLabel: "Book Mock",
    href: "/student/mock-interviews",
  },
  {
    id: "note-003",
    type: "ai",
    title: "Three companies visiting next month require DSA above 60%",
    description: "You are currently at 34%. Start the DSA plan to close the gap.",
    timestamp: "8 hours ago",
    unread: true,
    actionLabel: "Open Skill Tracker",
    href: "/student/skill-tracker#dsa",
  },
  {
    id: "note-004",
    type: "reminder",
    title: "Mock Interview Drive registration closes in 2 days",
    description: "Reserve a slot now to avoid missing the April drive.",
    timestamp: "11 hours ago",
    unread: false,
    actionLabel: "Register",
    href: "/student/mock-interviews",
  },
  {
    id: "note-005",
    type: "achievement",
    title: "You earned the ‘Profile Pro’ badge!",
    description: "Your profile crossed the 75% completeness mark.",
    timestamp: "1 day ago",
    unread: false,
  },
  {
    id: "note-006",
    type: "tpc",
    title: "Resume review slot available",
    description: "Faculty reviewers are available tomorrow. Book before Apr 15.",
    timestamp: "1 day ago",
    unread: false,
    actionLabel: "Go to Profile",
    href: "/student/profile-builder#resume",
  },
  {
    id: "note-007",
    type: "ai",
    title: "Your GitHub activity has been 0 for 2 weeks",
    description: "Recruiters often use GitHub consistency as a trust signal for technical depth.",
    timestamp: "2 days ago",
    unread: false,
    actionLabel: "Go to Profile",
    href: "/student/profile-builder#links",
  },
  {
    id: "note-008",
    type: "reminder",
    title: "Complete your weekly tasks — 3 remaining",
    description: "Finishing this week's checklist keeps your streak and your probability moving up.",
    timestamp: "2 days ago",
    unread: false,
    actionLabel: "View Action Plan",
    href: "/student/action-plan",
  },
  {
    id: "note-009",
    type: "system",
    title: "Your placement probability updated: 67% (+3.2% from last week)",
    description: "This update was calculated after your latest aptitude activity and profile changes.",
    timestamp: "3 days ago",
    unread: false,
  },
  {
    id: "note-010",
    type: "tpc",
    title: "Mandatory pre-placement orientation on Apr 20",
    description: "Attendance is required for the next campus drive shortlist.",
    timestamp: "3 days ago",
    unread: false,
  },
];

export const PROFILE_SECTION_ORDER: ProfileSection[] = [
  "basic",
  "academic",
  "resume",
  "links",
  "contests",
  "certifications",
  "projects",
  "experience",
  "skills",
  "preferences",
  "additional",
];

export const PROFILE_SECTION_META: ProfileSectionMeta[] = [
  { id: "basic", title: "Basic Info", completion: 100, status: "complete" },
  { id: "academic", title: "Academic Details", completion: 88, status: "partial", aiTip: "CGPA is above average, but clearing active backlog risk would improve company eligibility." },
  { id: "resume", title: "Resume", completion: 78, status: "partial", aiTip: "Quantified achievements and fresher resume updates can add quick wins here." },
  { id: "links", title: "Public Profiles", completion: 75, status: "partial", aiTip: "Complete the GitHub and LeetCode links to improve your technical signal." },
  { id: "contests", title: "Coding Contest Ratings", completion: 60, status: "partial" },
  { id: "certifications", title: "Certifications", completion: 70, status: "partial" },
  { id: "projects", title: "Projects", completion: 55, status: "partial", aiTip: "Adding one more project can improve recruiter confidence for SDE roles." },
  { id: "experience", title: "Internships / Experience", completion: 72, status: "partial" },
  { id: "skills", title: "Skills", completion: 80, status: "partial", aiTip: "Your self-ratings are slightly higher than your AI-evidenced activity for DSA." },
  { id: "preferences", title: "Job Preferences", completion: 90, status: "partial" },
  { id: "additional", title: "Emergency / Additional", completion: 82, status: "partial" },
];

export const PUBLIC_PROFILE_LINKS: PublicProfileLink[] = [
  { id: "link-linkedin", platform: "LinkedIn", icon: "Network", tone: "sky", url: "https://www.linkedin.com/in/arjun-mehta-dev", visibility: "public", verified: true },
  { id: "link-github", platform: "GitHub", icon: "FolderGit2", tone: "slate", url: "https://github.com/arjunmehta-dev", visibility: "public", verified: true },
  { id: "link-leetcode", platform: "LeetCode", icon: "Code2", tone: "amber", url: "", visibility: "private", verified: false },
  { id: "link-hackerrank", platform: "HackerRank", icon: "Terminal", tone: "emerald", url: "https://www.hackerrank.com/arjun_mehta", visibility: "public", verified: true },
  { id: "link-codechef", platform: "CodeChef", icon: "ChefHat", tone: "amber", url: "", visibility: "private", verified: false },
  { id: "link-codeforces", platform: "Codeforces", icon: "Cpu", tone: "violet", url: "", visibility: "private", verified: false },
  { id: "link-portfolio", platform: "Portfolio/Website", icon: "Globe", tone: "sky", url: "https://arjunmehta.dev", visibility: "public", verified: true },
  { id: "link-gfg", platform: "GeeksforGeeks", icon: "BookOpen", tone: "emerald", url: "", visibility: "private", verified: false },
];

export const CONTEST_RATINGS: ContestRating[] = [
  { id: "contest-001", platform: "LeetCode", rating: 1568, rank: "Knight", percentile: 71, contestName: "Weekly Contest 398", date: "2026-03-18" },
  { id: "contest-002", platform: "Codeforces", rating: 1187, rank: "Pupil", percentile: 58, contestName: "Codeforces Round 944", date: "2026-02-26" },
  { id: "contest-003", platform: "CodeChef", rating: 1672, rank: "3★", percentile: 63, contestName: "Starters 121", date: "2026-03-30" },
];

export const STUDENT_CERTIFICATIONS: Certificate[] = [
  { id: "cert-001", name: "AWS Cloud Practitioner Essentials", organization: "AWS Training", issueDate: "2025-11-12", credentialId: "AWS-CP-8832", url: "https://www.credly.com/badges/aws-cloud-practitioner", category: "Cloud", relevance: "relevant" },
  { id: "cert-002", name: "Full Stack Web Development", organization: "Coursera", issueDate: "2025-08-20", credentialId: "COUR-FSWD-1021", url: "https://coursera.org/verify/full-stack-web", category: "Web Dev", relevance: "relevant" },
  { id: "cert-003", name: "SQL for Data Analysis", organization: "Udemy", issueDate: "2025-10-14", credentialId: "UDEMY-SQL-882", url: "https://www.udemy.com/certificate/sql-data", category: "Database", relevance: "suggested" },
];

export const STUDENT_PROJECTS: Project[] = [
  {
    id: "project-001",
    title: "Campus Placement Tracker",
    description: "Built a role-based platform to track company drives, shortlist status, and placement metrics for 600+ students.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
    demoUrl: "https://placement-tracker-demo.vercel.app",
    githubUrl: "https://github.com/arjunmehta-dev/placement-tracker",
    type: "Academic",
    startDate: "2025-07",
    endDate: "2025-10",
    teamSize: 3,
    achievement: "Reduced coordinator follow-up time by 40% with real-time status views.",
  },
  {
    id: "project-002",
    title: "Expense Insight Dashboard",
    description: "Created a personal finance dashboard with trend forecasting, category budgets, and goal-based savings insights.",
    techStack: ["React", "Node.js", "MongoDB", "Chart.js"],
    demoUrl: "https://expense-insight.app",
    githubUrl: "https://github.com/arjunmehta-dev/expense-insight",
    type: "Personal",
    startDate: "2025-11",
    ongoing: true,
    teamSize: 1,
    achievement: "Improved dashboard load time by 40% through query batching.",
  },
];

export const STUDENT_EXPERIENCE: ExperienceEntry[] = [
  {
    id: "exp-001",
    companyName: "ByteForge Labs",
    role: "Frontend Engineering Intern",
    employmentType: "Internship",
    startDate: "2025-05",
    endDate: "2025-07",
    location: "Pune",
    remote: true,
    description: "Built internal analytics dashboards and improved component performance in a React codebase used by the customer success team.",
    stipend: 25000,
    offerLetterUrl: "https://example.com/byteforge-offer",
    skillsUsed: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
  },
];

export const STUDENT_TECHNICAL_SKILLS = [
  { id: "tech-001", name: "Python", selfRating: 4, aiRating: 3.6 },
  { id: "tech-002", name: "Java", selfRating: 3, aiRating: 2.8 },
  { id: "tech-003", name: "C++", selfRating: 3, aiRating: 2.5 },
  { id: "tech-004", name: "React", selfRating: 4, aiRating: 3.8 },
  { id: "tech-005", name: "Node.js", selfRating: 3, aiRating: 3.1 },
  { id: "tech-006", name: "SQL", selfRating: 4, aiRating: 3.4 },
  { id: "tech-007", name: "Machine Learning", selfRating: 2, aiRating: 1.8 },
  { id: "tech-008", name: "System Design", selfRating: 2, aiRating: 1.6 },
  { id: "tech-009", name: "DSA", selfRating: 4, aiRating: 2.3 },
  { id: "tech-010", name: "AWS", selfRating: 2, aiRating: 1.9 },
];

export const STUDENT_SOFT_SKILLS: SoftSkillEntry[] = [
  { id: "soft-001", label: "Communication", level: "yes" },
  { id: "soft-002", label: "Leadership", level: "developing" },
  { id: "soft-003", label: "Teamwork", level: "yes" },
  { id: "soft-004", label: "Problem Solving", level: "yes" },
  { id: "soft-005", label: "Time Management", level: "developing" },
  { id: "soft-006", label: "Presentation Skills", level: "yes" },
  { id: "soft-007", label: "Critical Thinking", level: "yes" },
];

export const STUDENT_PROFILE_OPTIONS = {
  departments: ["CSE", "IT", "ECE", "MECH", "CIVIL", "MBA"],
  years: ["1st", "2nd", "3rd", "4th"],
  genders: ["Male", "Female", "Other", "Prefer not to say"],
  employmentTypes: ["Internship", "Part-time", "Full-time", "Contract"],
  projectTypes: ["Academic", "Personal", "Open Source", "Freelance", "Internship"],
  certificateCategories: ["Cloud", "DSA", "Web Dev", "AI/ML", "Database", "Soft Skills", "Other"],
  contestPlatforms: ["LeetCode", "Codeforces", "CodeChef", "HackerRank", "AtCoder"],
  targetRoles: ["SDE", "Data Analyst", "ML Engineer", "Product Manager", "Business Analyst", "DevOps", "UI/UX", "Consultant", "Core Engineering"],
  preferredDomains: ["Product", "Service", "Startup", "FAANG", "PSU", "Research"],
  preferredLocations: ["Mumbai", "Bengaluru", "Hyderabad", "Pune", "Delhi", "Remote", "Anywhere"],
  categories: ["General", "OBC", "SC", "ST", "EWS"],
  noticePeriods: ["Immediate", "15 days", "30 days", "60 days"],
  workModes: ["In-Office", "Hybrid", "Remote", "No Preference"],
};

export const STUDENT_PROFILE_FORM_DEFAULTS: ProfileBuilderFormValues = {
  basic: {
    fullName: "Arjun Mehta",
    rollNumber: "21CSE047",
    department: "CSE",
    yearOfStudy: "4th",
    expectedGraduation: "Jun 2026",
    dateOfBirth: "2003-11-04",
    phoneNumber: "9876543210",
    gender: "Male",
    profilePhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
  academic: {
    cgpa: 7.2,
    tenthPercentage: 88.4,
    twelfthPercentage: 84.2,
    activeBacklogs: 1,
    historicalBacklogs: 2,
    specialization: "Artificial Intelligence",
    collegeName: "Pune Institute of Computer Engineering",
    university: "Savitribai Phule Pune University",
  },
  resume: {
    resumeLink: "https://drive.google.com/file/d/arjun-mehta-resume/view",
    atsScore: 72,
    lastUpdated: "2026-03-18",
    checklist: [
      { id: "resume-001", label: "Contact info present", completed: false },
      { id: "resume-002", label: "Work experience section", completed: true },
      { id: "resume-003", label: "Skills section", completed: true },
      { id: "resume-004", label: "Quantified achievements", completed: false },
      { id: "resume-005", label: "Action verbs used", completed: false },
      { id: "resume-006", label: "Appropriate length (1 page)", completed: false },
    ],
  },
  links: PUBLIC_PROFILE_LINKS,
  contests: CONTEST_RATINGS,
  certifications: STUDENT_CERTIFICATIONS,
  projects: STUDENT_PROJECTS,
  experience: STUDENT_EXPERIENCE,
  skills: {
    technical: STUDENT_TECHNICAL_SKILLS,
    soft: STUDENT_SOFT_SKILLS,
  },
  preferences: {
    targetRoles: ["SDE", "Product Manager"],
    preferredDomains: ["Product", "Startup"],
    preferredLocations: ["Pune", "Bengaluru", "Remote"],
    ctcRange: [6, 12],
    openToRelocation: true,
    noticePeriod: "Immediate",
    workModePreference: "Hybrid",
    aiMatchScore: 73,
  },
  additional: {
    fatherName: "Rakesh Mehta",
    motherName: "Pooja Mehta",
    parentContactNumber: "9812345678",
    permanentAddress: "A-204, Shivtara Residency, Wakad, Pune, Maharashtra",
    category: "General",
    differentlyAbled: false,
    differentlyAbledDetails: "",
    passportAvailable: true,
    languages: ["English", "Hindi", "Marathi"],
    hobbies: ["Chess", "Running", "Tech blogging"],
  },
};
