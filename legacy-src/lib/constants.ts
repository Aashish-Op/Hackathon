import type {
  NavLink,
  HeroStat,
  ProblemCard,
  TimelineStep,
  HowItWorksStep,
  Feature,
  StudentRow,
  AlertItem,
  MetricCard,
  Testimonial,
} from "@/types";

/* ─── Navigation ───────────────────────────────────────────── */

export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "Demo", href: "#dashboard" },
];

export const SITE_NAME = "PlaceGuard";
export const SITE_TAGLINE = "AI-Powered Placement Intelligence";

/* ─── Hero ─────────────────────────────────────────────────── */

export const HERO_EYEBROW = "AI-Powered · Placement Intelligence";
export const HERO_HEADLINE = "No Student Gets Left Behind.";
export const HERO_SUBHEADLINE =
  "PlaceGuard AI detects silent drop-outs before it's too late — giving your TPC the tools to intervene, engage, and place every student.";
export const HERO_CTA_PRIMARY = "See Live Demo";
export const HERO_CTA_SECONDARY = "View Architecture";

export const HERO_STATS: HeroStat[] = [
  {
    value: "94%",
    numericValue: 94,
    suffix: "%",
    label: "Placement prediction accuracy",
  },
  {
    value: "3x",
    numericValue: 3,
    suffix: "x",
    label: "Faster TPC intervention",
  },
  {
    value: "2,400+",
    numericValue: 2400,
    suffix: "+",
    label: "At-risk students identified",
  },
];

/* ─── Problem ──────────────────────────────────────────────── */

export const PROBLEM_HEADING = "The Silent Crisis in Campus Placements";

export const PROBLEM_CARDS: ProblemCard[] = [
  {
    icon: "EyeOff",
    title: "Invisible Risk",
    description:
      "Students who aren't failing but aren't preparing — invisible to coordinators until it's too late.",
  },
  {
    icon: "BellOff",
    title: "No Early Warning",
    description:
      "TPC has no system to flag disengagement until it's placement season and opportunities have passed.",
  },
  {
    icon: "Clock",
    title: "Manual & Reactive",
    description:
      "Intervention only happens after students miss opportunities, not before — a cycle of lost potential.",
  },
];

export const TIMELINE_STEPS: TimelineStep[] = [
  { label: "Enrolled", status: "neutral" },
  { label: "Disengaged", status: "warning" },
  { label: "Unprepared", status: "danger" },
  { label: "Missed Opportunity", status: "danger" },
  { label: "PlaceGuard Intercepts", status: "success" },
  { label: "Placed ✓", status: "success" },
];

/* ─── How It Works ─────────────────────────────────────────── */

export const HOW_IT_WORKS_HEADING = "How PlaceGuard AI Works";

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    icon: "Database",
    title: "Ingest",
    description:
      "PlaceGuard connects to your LMS, attendance systems, mock test platforms, and activity logs — building a 360° student profile in real time.",
  },
  {
    number: 2,
    icon: "Brain",
    title: "Analyze",
    description:
      "Our ML pipeline clusters students into Placement-Ready, At-Risk, and Unprepared segments using behavioral, academic, and engagement signals.",
  },
  {
    number: 3,
    icon: "Zap",
    title: "Intervene",
    description:
      "TPC receives prioritized alerts. Students receive personalized nudges. The system recommends targeted actions — mock interviews, domain shifts, and training modules.",
  },
];

/* ─── Features ─────────────────────────────────────────────── */

export const FEATURES_HEADING = "AI Capabilities";
export const FEATURES_SUBHEADING =
  "Six intelligent systems working together to ensure no student falls through the cracks.";

export const FEATURES: Feature[] = [
  {
    icon: "Gauge",
    title: "Risk Scoring Engine",
    description:
      "Every student gets a 0–100 placement probability score updated daily based on 40+ signals.",
    tag: "Predictive AI",
    tagColor: "indigo",
  },
  {
    icon: "Users",
    title: "Student Segmentation",
    description:
      "K-means clustering groups students into actionable cohorts automatically — no manual tagging.",
    tag: "Unsupervised ML",
    tagColor: "cyan",
  },
  {
    icon: "Activity",
    title: "Engagement Tracking",
    description:
      "Login frequency, resource access, test attempts — all behavioral signals analyzed in real time.",
    tag: "Behavioral Analytics",
    tagColor: "emerald",
  },
  {
    icon: "LayoutDashboard",
    title: "TPC Intervention Panel",
    description:
      "Coordinator dashboard with ranked student list and one-click action triggers for each student.",
    tag: "Dashboard",
    tagColor: "indigo",
  },
  {
    icon: "MessageSquare",
    title: "Smart Nudge Engine",
    description:
      "Personalized WhatsApp/email nudges auto-generated per student risk level and learning style.",
    tag: "NLP",
    tagColor: "amber",
  },
  {
    icon: "Compass",
    title: "Domain Shift Advisor",
    description:
      "AI recommends role pivots when a student's current path shows low placement probability.",
    tag: "Recommendation",
    tagColor: "rose",
  },
];

/* ─── Dashboard ────────────────────────────────────────────── */

export const DASHBOARD_HEADING = "Built for TPC Coordinators";
export const DASHBOARD_LABEL = "Live Dashboard Preview";

export const STUDENT_DATA: StudentRow[] = [
  {
    name: "Arjun Mehta",
    branch: "CSE",
    riskScore: 87,
    riskLevel: "safe",
    lastActive: "2h ago",
    action: "No action needed",
  },
  {
    name: "Priya Sharma",
    branch: "ECE",
    riskScore: 52,
    riskLevel: "at-risk",
    lastActive: "3d ago",
    action: "Schedule mock interview",
  },
  {
    name: "Rahul Desai",
    branch: "ME",
    riskScore: 28,
    riskLevel: "danger",
    lastActive: "2w ago",
    action: "Urgent: Contact student",
  },
  {
    name: "Sneha Iyer",
    branch: "IT",
    riskScore: 91,
    riskLevel: "safe",
    lastActive: "1h ago",
    action: "No action needed",
  },
  {
    name: "Karthik Nair",
    branch: "CSE",
    riskScore: 44,
    riskLevel: "at-risk",
    lastActive: "5d ago",
    action: "Assign domain shift review",
  },
  {
    name: "Ananya Reddy",
    branch: "ECE",
    riskScore: 19,
    riskLevel: "danger",
    lastActive: "3w ago",
    action: "Urgent: TPC coordinator call",
  },
];

export const PLACEMENT_DISTRIBUTION = {
  ready: 42,
  atRisk: 35,
  unprepared: 23,
};

export const ALERT_FEED: AlertItem[] = [
  {
    studentName: "Rahul Desai",
    issue: "3‑week inactivity detected",
    severity: "high",
    time: "2 min ago",
  },
  {
    studentName: "Priya Sharma",
    issue: "Low mock test score (32/100)",
    severity: "medium",
    time: "15 min ago",
  },
  {
    studentName: "Karthik Nair",
    issue: "Missed 3 consecutive workshops",
    severity: "medium",
    time: "1 hr ago",
  },
  {
    studentName: "Ananya Reddy",
    issue: "Zero resume uploads this semester",
    severity: "high",
    time: "3 hr ago",
  },
  {
    studentName: "Vikram Singh",
    issue: "Dropped from mock interview pool",
    severity: "high",
    time: "5 hr ago",
  },
];

/* ─── Impact ───────────────────────────────────────────────── */

export const IMPACT_HEADING = "What Changes When You Can See the Invisible";

export const IMPACT_METRICS: MetricCard[] = [
  {
    value: "34%",
    numericValue: 34,
    prefix: "↑",
    suffix: "%",
    label: "Overall Placement Rate Increase",
    trend: "up",
    sparklineData: [20, 25, 22, 28, 35, 42, 50, 54],
  },
  {
    value: "78%",
    numericValue: 78,
    prefix: "↓",
    suffix: "%",
    label: "Reduction in Late Interventions",
    trend: "down",
    sparklineData: [90, 85, 72, 60, 45, 30, 22, 18],
  },
  {
    value: "100%",
    numericValue: 100,
    prefix: "",
    suffix: "%",
    label: "Student Coverage Achieved",
    trend: "neutral",
    sparklineData: [40, 55, 65, 72, 80, 88, 95, 100],
  },
];

export const TESTIMONIAL: Testimonial = {
  quote:
    "PlaceGuard identified 47 at-risk students in our pilot. 39 of them got placed. Without it, they'd have been statistics.",
  author: "Dr. Anita Mehra",
  role: "TPC Director, VIT Pune",
};

/* ─── Architecture ─────────────────────────────────────────── */

export const ARCHITECTURE_HEADING = "Enterprise-Grade Architecture";
export const ARCHITECTURE_BODY =
  "Built on a microservices backbone with real-time data pipelines, secure role-based access, and LMS-agnostic connectors.";

/* ─── CTA ──────────────────────────────────────────────────── */

export const CTA_HEADING = "Ready to Place Every Student?";
export const CTA_SUBTEXT =
  "Join 12+ institutions already using PlaceGuard AI in their placement season.";
export const CTA_PRIMARY = "Request Early Access";
export const CTA_SECONDARY = "Download Pitch Deck";

/* ─── Footer ───────────────────────────────────────────────── */

export const FOOTER_TAGLINE =
  "AI-powered early warning system for campus placements.";
export const FOOTER_NOTE = "Built for Hackathon 2025";
export const FOOTER_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Documentation", href: "#" },
  { label: "Contact", href: "#" },
];
