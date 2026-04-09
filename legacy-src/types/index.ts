export interface NavLink {
  label: string;
  href: string;
}

export interface HeroStat {
  value: string;
  numericValue: number;
  suffix: string;
  label: string;
}

export interface ProblemCard {
  icon: string;
  title: string;
  description: string;
}

export interface TimelineStep {
  label: string;
  status: "danger" | "warning" | "neutral" | "success";
}

export interface HowItWorksStep {
  number: number;
  icon: string;
  title: string;
  description: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  tag: string;
  tagColor: "indigo" | "emerald" | "amber" | "rose" | "cyan";
}

export interface StudentRow {
  name: string;
  branch: string;
  riskScore: number;
  riskLevel: "safe" | "at-risk" | "danger";
  lastActive: string;
  action: string;
}

export interface AlertItem {
  studentName: string;
  issue: string;
  severity: "high" | "medium" | "low";
  time: string;
}

export interface MetricCard {
  value: string;
  numericValue: number;
  prefix: string;
  suffix: string;
  label: string;
  trend: "up" | "down" | "neutral";
  sparklineData: number[];
}

export interface ArchitectureNode {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}
