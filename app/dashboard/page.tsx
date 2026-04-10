"use client";

import * as React from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLiveDashboardData } from "@/lib/dashboard/use-live-dashboard-data";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { formatCompactNumber } from "@/lib/utils";
import {
  AppIcon,
  ChartTooltipCard,
  RiskScoreBadge,
  SeverityBadge,
  SparkleCue,
  StatCard,
} from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const segmentToneClasses = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  slate: "bg-slate-400",
} as const;

const segmentFillClasses = {
  emerald: "fill-chart-emerald",
  amber: "fill-chart-amber",
  rose: "fill-chart-rose",
  slate: "fill-chart-slate",
} as const;

const severityToneMap = {
  Critical: "rose",
  High: "amber",
  Medium: "blue",
} as const;

function priorityFromRisk(score: number): "Critical" | "High" | "Medium" {
  if (score <= 35) {
    return "Critical";
  }

  if (score <= 55) {
    return "High";
  }

  return "Medium";
}

function MetricCardSkeleton() {
  return (
    <Card className="subtle-ring">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-44 animate-pulse rounded bg-muted" />
        <div className="h-3 w-52 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  usePageTitle("Dashboard - Vigilo");

  const {
    dashboardConfidence,
    dashboardMetrics,
    dashboardProbabilityTrend,
    dashboardRiskDistribution,
    dashboardSegments,
    dashboardTabAlerts,
    dashboardTabStudents,
    isLoading,
  } = useLiveDashboardData();

  const [activeTableTab, setActiveTableTab] = React.useState<"students" | "alerts">("students");

  const totalStudents = dashboardSegments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4" id="overview">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <MetricCardSkeleton key={index} />)
          : dashboardMetrics.map((metric, index) => (
              <div key={metric.id} className="relative">
                {index === 0 ? (
                  <Badge
                    className="absolute right-4 top-4 z-10 border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
                    tone="emerald"
                  >
                    Live
                  </Badge>
                ) : null}
                <StatCard {...metric} />
              </div>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Risk Distribution by Department</CardTitle>
            <CardDescription>
              Ready, at-risk, and unprepared cohorts by department.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardRiskDistribution}>
                  <defs>
                    <linearGradient id="risk-ready" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-emerald)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--chart-emerald)" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="risk-amber" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-amber)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--chart-amber)" stopOpacity="0.35" />
                    </linearGradient>
                    <linearGradient id="risk-rose" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-rose)" stopOpacity="1" />
                      <stop offset="100%" stopColor="var(--chart-rose)" stopOpacity="0.35" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="department" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipCard />} />
                  <Bar dataKey="placement_ready" fill="url(#risk-ready)" name="Placement Ready" radius={[8, 8, 0, 0]} stackId="risk" />
                  <Bar dataKey="at_risk" fill="url(#risk-amber)" name="At-Risk" radius={[8, 8, 0, 0]} stackId="risk" />
                  <Bar dataKey="silent_dropout" fill="url(#risk-rose)" name="Silent Dropout" radius={[8, 8, 0, 0]} stackId="risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Placement Ready
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                At-Risk
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                Silent Dropout
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Placement Probability Trend</CardTitle>
            <CardDescription>
              Eight-week movement across the campus and key cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardProbabilityTrend}>
                <defs>
                  <linearGradient id="probability-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-violet)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--chart-violet)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  content={<ChartTooltipCard formatter={(value) => `${value}%`} />}
                />
                <Area dataKey="all_students" fill="url(#probability-area)" stroke="none" />
                <Line dataKey="all_students" dot={{ r: 3 }} name="All Students" stroke="var(--chart-violet)" strokeWidth={3} type="monotone" />
                <Line dataKey="placement_ready" dot={{ r: 3 }} name="Placement Ready" stroke="var(--chart-emerald)" strokeWidth={2.5} type="monotone" />
                <Line dataKey="at_risk" dot={{ r: 3 }} name="At-Risk" stroke="var(--chart-amber)" strokeWidth={2.5} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section id="students">
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Student Segmentation</CardTitle>
              <CardDescription>
                Placement readiness mix across the monitored cohort.
              </CardDescription>
            </div>
            <SparkleCue label={`${dashboardConfidence.label}: ${dashboardConfidence.value}`} />
          </CardHeader>
          <CardContent className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
            <div className="relative mx-auto h-[320px] w-full max-w-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardSegments}
                    cx="50%"
                    cy="50%"
                    dataKey="count"
                    innerRadius={92}
                    outerRadius={132}
                    paddingAngle={3}
                  >
                    {dashboardSegments.map((segment) => (
                      <Cell key={segment.id} className={segmentFillClasses[segment.tone]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipCard formatter={(value) => formatCompactNumber(Number(value))} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total Students</p>
                <p className="mt-2 text-4xl font-semibold text-foreground">{formatCompactNumber(totalStudents)}</p>
              </div>
            </div>

            <div className="space-y-5">
              {dashboardSegments.map((segment) => (
                <div key={segment.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${segmentToneClasses[segment.tone]}`} />
                      <div>
                        <p className="font-medium text-foreground">{segment.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCompactNumber(segment.count)} students
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground">{segment.percentage}%</p>
                  </div>
                  <Progress
                    aria-label={`${segment.label} share ${segment.percentage}%`}
                    tone={segment.tone}
                    value={segment.percentage}
                  />
                </div>
              ))}

              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <AppIcon className="h-4 w-4" name="Sparkles" />
                  <span>{dashboardConfidence.label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{dashboardConfidence.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="alerts">
        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                {activeTableTab === "students" ? "Silent Dropout Watchlist" : "Recent AI Alerts"}
              </CardTitle>
              <CardDescription>
                {activeTableTab === "students"
                  ? "Live students feed from silent_dropout cluster (top 10)."
                  : "Latest unresolved alerts surfaced by the early warning model."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 rounded-full px-3"
                onClick={() => setActiveTableTab("students")}
                size="sm"
                variant={activeTableTab === "students" ? "default" : "outline"}
              >
                Students
              </Button>
              <Button
                className="h-8 rounded-full px-3"
                onClick={() => setActiveTableTab("alerts")}
                size="sm"
                variant={activeTableTab === "alerts" ? "default" : "outline"}
              >
                Alerts
              </Button>
              <Badge tone="violet" className="gap-1.5">
                <AppIcon className="h-3.5 w-3.5" name="Sparkles" />
                Prioritized by AI engine
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {activeTableTab === "students" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Cluster</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardTabStudents.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground" colSpan={7}>
                        No silent dropout students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardTabStudents.map((student) => {
                      const priority = priorityFromRisk(student.riskScore);

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-foreground">{student.studentName}</TableCell>
                          <TableCell>
                            <RiskScoreBadge score={student.riskScore} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.clusterLabel}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell className="text-muted-foreground">{student.lastActiveLabel}</TableCell>
                          <TableCell>
                            <SeverityBadge label={priority} tone={severityToneMap[priority]} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost">View</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Trigger Reason</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardTabAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground" colSpan={7}>
                        No unresolved alerts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dashboardTabAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium text-foreground">{alert.studentName}</TableCell>
                        <TableCell>
                          <RiskScoreBadge score={alert.riskScore} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{alert.triggerReason}</TableCell>
                        <TableCell>{alert.department}</TableCell>
                        <TableCell className="text-muted-foreground">{alert.lastActiveLabel}</TableCell>
                        <TableCell>
                          <SeverityBadge label={alert.severity} tone={severityToneMap[alert.severity]} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant={alert.actionLabel === "Intervene" ? "warning" : "ghost"}>
                            {alert.actionLabel}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
