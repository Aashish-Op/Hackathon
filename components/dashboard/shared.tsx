"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  Cpu,
  Download,
  Eye,
  Gauge,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PieChart,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import {
  type BadgeTone,
  type Cluster,
  type IconName,
  CLUSTER_LABELS,
  CLUSTER_TONES,
  getPlacementTone,
  getRiskScoreTone,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const iconMap = {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Users,
  AlertTriangle,
  Zap,
  MessageSquare,
  Settings,
  HelpCircle,
  Cpu,
  Bell,
  Search,
  Sparkles,
  BadgeCheck,
  ShieldAlert,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Eye,
  Download,
  Send,
  Mail,
  Calendar,
  Building2,
  Globe,
  CheckCircle,
} satisfies Record<IconName, React.ComponentType<{ className?: string }>>;

const toneClassMap: Record<BadgeTone, string> = {
  default: "text-foreground",
  violet: "text-violet-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  slate: "text-slate-400",
  blue: "text-sky-400",
};

const sparklineToneMap: Record<BadgeTone, string> = {
  default: "var(--chart-violet)",
  violet: "var(--chart-violet)",
  emerald: "var(--chart-emerald)",
  amber: "var(--chart-amber)",
  rose: "var(--chart-rose)",
  slate: "var(--chart-slate)",
  blue: "var(--chart-blue)",
};

export function AppIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Icon = iconMap[name];

  return <Icon className={className} />;
}

export function SparkleCue({ label }: { label: string }) {
  return (
    <Badge tone="violet" className="gap-1.5">
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

export function RiskScoreBadge({ score }: { score: number }) {
  return <Badge tone={getRiskScoreTone(score)}>{`${score} / 100`}</Badge>;
}

export function ClusterBadge({ cluster }: { cluster: Cluster }) {
  return <Badge tone={CLUSTER_TONES[cluster]}>{CLUSTER_LABELS[cluster]}</Badge>;
}

export function SeverityBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <Badge role="status" tone={tone}>
      {label}
    </Badge>
  );
}

export function PlacementProbability({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-36 items-center gap-3">
      <Progress
        aria-label={`Placement probability ${value}%`}
        className={compact ? "h-1.5" : undefined}
        tone={getPlacementTone(value)}
        value={value}
      />
      <span className="min-w-12 text-right text-sm text-muted-foreground">{`${value}%`}</span>
    </div>
  );
}

export function StudentIdentity({
  name,
  secondary,
  tertiary,
}: {
  name: string;
  secondary: string;
  tertiary?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        {tertiary ? <p className="truncate text-xs text-muted-foreground">{tertiary}</p> : null}
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  delta,
  tone,
  subtitle,
  trend = "neutral",
  sparkline,
}: {
  icon: IconName;
  label: string;
  value: string;
  delta: string;
  tone: BadgeTone;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  sparkline?: number[];
}) {
  const TrendIcon =
    trend === "down" ? ArrowDownRight : trend === "neutral" ? ArrowRight : ArrowUpRight;

  return (
    <Card className="subtle-ring">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge tone={tone} className="rounded-xl px-2 py-1">
              <AppIcon className={cn("h-4 w-4", toneClassMap[tone])} name={icon} />
            </Badge>
            <CardDescription>{label}</CardDescription>
          </div>
          {sparkline ? <MiniSparkline data={sparkline} tone={tone} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-3xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendIcon className={cn("h-4 w-4", toneClassMap[tone])} />
          <span>{delta}</span>
        </div>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}

export function MiniSparkline({
  data,
  tone,
}: {
  data: number[];
  tone: BadgeTone;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = 36 - normalized * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className="h-10 w-24"
      viewBox="0 0 100 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        fill="none"
        points={points}
        stroke={sparklineToneMap[tone]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

interface TooltipEntry {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
}

function tooltipDotClass(key?: string | number) {
  const normalized = String(key ?? "").toLowerCase();

  if (normalized.includes("ready")) {
    return "bg-emerald-400";
  }

  if (
    normalized.includes("risk") ||
    normalized.includes("amber") ||
    normalized.includes("control")
  ) {
    return "bg-amber-400";
  }

  if (
    normalized.includes("unprepared") ||
    normalized.includes("critical") ||
    normalized.includes("rose")
  ) {
    return "bg-rose-400";
  }

  if (normalized.includes("medium") || normalized.includes("blue")) {
    return "bg-sky-400";
  }

  if (normalized.includes("slate") || normalized.includes("inactive")) {
    return "bg-slate-400";
  }

  return "bg-violet-400";
}

export function ChartTooltipCard({
  active,
  label,
  payload,
  formatter,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  formatter?: (value: string | number, name: string | number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.dataKey}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", tooltipDotClass(entry.dataKey ?? entry.name))} />
              <span className="text-sm text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-popover-foreground">
              {formatter && entry.value !== undefined && entry.name !== undefined
                ? formatter(entry.value, entry.name)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={cn(
        "h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function LinkButton({
  href,
  label,
  variant = "ghost",
  className,
}: {
  href: string;
  label: string;
  variant?: "default" | "ghost" | "outline" | "secondary" | "warning" | "danger";
  className?: string;
}) {
  return (
    <Link className={buttonVariants({ variant, className })} href={href}>
      {label}
    </Link>
  );
}

export function EmptySearchState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{body}</p>
        </div>
        <Button variant="outline">Clear filters</Button>
      </CardContent>
    </Card>
  );
}
