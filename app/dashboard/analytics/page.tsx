"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type ApiError } from "@/lib/api";
import { formatShortDate } from "@/lib/date";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type {
  AnalyticsOverview,
  ApiEnvelope,
  DepartmentBreakdown,
  ImpactSimulation,
  ScoreTrend,
  StudentProfile,
} from "@/lib/types";
import { ChartTooltipCard } from "@/components/dashboard/shared";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type HistogramBucket = {
  bucket: string;
  count: number;
  fill: string;
};

type DepartmentTableRow = {
  department: string;
  students: number;
  placed: number;
  placementRate: number;
  avgScore: number;
  atRisk: number;
};

type TrendRow = {
  week: string;
  placement_ready: number;
  at_risk: number;
  silent_dropout: number;
};

const HISTOGRAM_BUCKETS: Array<{ label: string; min: number; max: number; fill: string }> = [
  { label: "0-20", min: 0, max: 20, fill: "#C0392B" },
  { label: "20-40", min: 20, max: 40, fill: "#E67E22" },
  { label: "40-60", min: 40, max: 60, fill: "#F39C12" },
  { label: "60-80", min: 60, max: 80, fill: "#27AE60" },
  { label: "80-100", min: 80, max: 101, fill: "#1F7A3A" },
];

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Something went wrong";
}

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

function toWeekLabel(rawDate: string, fallbackIndex: number): string {
  return formatShortDate(rawDate, `W${fallbackIndex + 1}`);
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const objectData = data as {
      items?: unknown[];
      points?: unknown[];
      trend?: unknown[];
      rows?: unknown[];
    };

    if (Array.isArray(objectData.items)) {
      return objectData.items;
    }

    if (Array.isArray(objectData.points)) {
      return objectData.points;
    }

    if (Array.isArray(objectData.trend)) {
      return objectData.trend;
    }

    if (Array.isArray(objectData.rows)) {
      return objectData.rows;
    }
  }

  return [];
}

function buildHistogram(students: StudentProfile[]): HistogramBucket[] {
  const counts = HISTOGRAM_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    count: 0,
    fill: bucket.fill,
  }));

  students.forEach((student) => {
    const score = clamp(toNumber(student.risk_score, 0), 0, 100);
    const bucketIndex = HISTOGRAM_BUCKETS.findIndex(
      (bucket) => score >= bucket.min && score < bucket.max,
    );

    if (bucketIndex >= 0) {
      counts[bucketIndex].count += 1;
    }
  });

  return counts;
}

function buildDepartmentRows(data: unknown): DepartmentTableRow[] {
  return extractArray(data)
    .map((entry) => {
      const row = entry as DepartmentBreakdown;
      const students = Math.max(0, Math.round(toNumber(row.student_count, 0)));
      const placed = Math.max(0, Math.round(toNumber(row.placed_count, 0)));
      const placementRate = students > 0 ? round((placed / students) * 100, 1) : 0;

      return {
        department: row.department || "Unknown",
        students,
        placed,
        placementRate,
        avgScore: round(clamp(toNumber(row.avg_score, 0), 0, 100), 1),
        atRisk: Math.max(0, Math.round(toNumber(row.at_risk_count, 0))),
      };
    })
    .sort((left, right) => left.placementRate - right.placementRate);
}

function placementRateClass(rate: number): string {
  if (rate < 40) {
    return "text-red-700";
  }

  if (rate <= 70) {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

function buildTrend(data: unknown): { rows: TrendRow[]; lastScanWeek: string | null } {
  let rawData: unknown = data;
  let explicitLastScan: string | null = null;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const objectData = data as {
      items?: unknown[];
      last_ai_scan_week?: string;
      last_scan_week?: string;
      last_ai_scan_at?: string;
      last_scan_at?: string;
    };

    if (Array.isArray(objectData.items)) {
      rawData = objectData.items;
    }

    explicitLastScan =
      objectData.last_ai_scan_week ||
      objectData.last_scan_week ||
      objectData.last_ai_scan_at ||
      objectData.last_scan_at ||
      null;
  }

  const rows = extractArray(rawData)
    .map((entry) => {
      const point = entry as ScoreTrend & {
        week?: string;
      };

      return {
        date: point.date || point.week || "",
        avgScore: clamp(toNumber(point.all_students, toNumber(point.avg_score, 0)), 0, 100),
        placementReady: clamp(toNumber(point.placement_ready, toNumber(point.avg_score, 0) + 12), 0, 100),
        atRisk: clamp(toNumber(point.at_risk, toNumber(point.avg_score, 0) - 10), 0, 100),
        silentDropout: clamp(toNumber(point.silent_dropout, 100 - toNumber(point.avg_score, 0)), 0, 100),
      };
    })
    .filter((point) => point.date.length > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-8)
    .map((point, index) => ({
      week: toWeekLabel(point.date, index),
      placement_ready: round(point.placementReady, 1),
      at_risk: round(point.atRisk, 1),
      silent_dropout: round(point.silentDropout, 1),
    }));

  if (rows.length === 0) {
    return {
      rows,
      lastScanWeek: null,
    };
  }

  if (!explicitLastScan) {
    return {
      rows,
      lastScanWeek: rows[rows.length - 1].week,
    };
  }

  const scanDate = new Date(explicitLastScan);
  const resolvedWeek = Number.isNaN(scanDate.getTime())
    ? explicitLastScan
    : formatShortDate(scanDate, explicitLastScan);

  const matchingWeek = rows.find((row) => row.week === resolvedWeek)?.week;

  return {
    rows,
    lastScanWeek: matchingWeek || rows[rows.length - 1].week,
  };
}

function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = React.useState(target);
  const previousRef = React.useRef(target);

  React.useEffect(() => {
    const start = previousRef.current;
    const end = target;
    previousRef.current = target;

    let animationFrame = 0;
    let animationStart: number | null = null;

    const step = (timestamp: number) => {
      if (animationStart === null) {
        animationStart = timestamp;
      }

      const progress = Math.min((timestamp - animationStart) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    animationFrame = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [duration, target]);

  return display;
}

export default function AnalyticsPage() {
  usePageTitle("Analytics - Vigilo");

  const { toast } = useToast();
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [departmentRows, setDepartmentRows] = React.useState<DepartmentTableRow[]>([]);
  const [histogramData, setHistogramData] = React.useState<HistogramBucket[]>(
    HISTOGRAM_BUCKETS.map((bucket) => ({ bucket: bucket.label, count: 0, fill: bucket.fill })),
  );
  const [trendRows, setTrendRows] = React.useState<TrendRow[]>([]);
  const [lastScanWeek, setLastScanWeek] = React.useState<string | null>(null);

  const [topN, setTopN] = React.useState(50);
  const [debouncedTopN, setDebouncedTopN] = React.useState(50);
  const [impact, setImpact] = React.useState<ImpactSimulation | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isImpactLoading, setIsImpactLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [overviewResponse, departmentResponse, studentsResponse, trendResponse] = await Promise.all([
        api.get<ApiEnvelope<AnalyticsOverview>>("/api/v1/analytics/overview"),
        api.get<ApiEnvelope<DepartmentBreakdown[]>>("/api/v1/analytics/department-breakdown"),
        api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
          limit: 500,
          offset: 0,
        }),
        api.get<ApiEnvelope<ScoreTrend[] | { items?: ScoreTrend[]; last_ai_scan_week?: string; last_scan_week?: string; last_ai_scan_at?: string }>>("/api/v1/analytics/score-trend"),
      ]);

      setOverview(overviewResponse.data);
      setDepartmentRows(buildDepartmentRows(departmentResponse.data));

      const studentRows = extractArray(studentsResponse.data) as StudentProfile[];
      setHistogramData(buildHistogram(studentRows));

      const trend = buildTrend(trendResponse.data);
      setTrendRows(trend.rows);
      setLastScanWeek(trend.lastScanWeek);
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadImpact = React.useCallback(
    async (value: number) => {
      setIsImpactLoading(true);

      try {
        const response = await api.get<ApiEnvelope<ImpactSimulation>>("/api/v1/analytics/impact-simulation", {
          top_n: value,
        });

        setImpact(response.data);
      } catch (requestError) {
        toast(toApiErrorMessage(requestError), "error");
      } finally {
        setIsImpactLoading(false);
      }
    },
    [toast],
  );

  React.useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTopN(topN);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [topN]);

  React.useEffect(() => {
    void loadImpact(debouncedTopN);
  }, [debouncedTopN, loadImpact]);

  const currentRate = useAnimatedNumber(impact?.current_rate || 0);
  const projectedRate = useAnimatedNumber(impact?.projected_rate || 0);

  const departmentsTracked = departmentRows.length;

  const cards = [
    {
      label: "Overall placement rate",
      value: `${round(clamp(toNumber(overview?.placement_rate, 0), 0, 100), 1)}%`,
      subtitle: "From current placement outcomes",
    },
    {
      label: "Average Vigilo Score",
      value: round(clamp(toNumber(overview?.avg_vigilo_score, 0), 0, 100), 1).toFixed(1),
      subtitle: "Latest score snapshot",
    },
    {
      label: "Students placed",
      value: compact(Math.max(0, Math.round(toNumber(overview?.placed_count, 0)))),
      subtitle: "Students with placed status",
    },
    {
      label: "Departments tracked",
      value: compact(departmentsTracked),
      subtitle: "Departments in analytics stream",
    },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => void loadAnalytics()}>
            Retry
          </Button>
        </div>
      ) : null}

      <ErrorBoundary>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-4 w-36" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))
            : cards.map((card) => (
                <Card key={card.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{card.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-foreground">{card.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
        </section>
      </ErrorBoundary>

      <ErrorBoundary>
        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution Histogram</CardTitle>
              <CardDescription>Latest Vigilo scores grouped into five ranges.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="bucket" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipCard />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {histogramData.map((bucket) => (
                        <Cell key={bucket.bucket} fill={bucket.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Placement rate is sorted from lowest to highest.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Placement Rate</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>At Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : departmentRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No department data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    departmentRows.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell className="font-medium text-foreground">{row.department}</TableCell>
                        <TableCell>{row.students}</TableCell>
                        <TableCell>{row.placed}</TableCell>
                        <TableCell className={placementRateClass(row.placementRate)}>{row.placementRate.toFixed(1)}%</TableCell>
                        <TableCell>{row.avgScore.toFixed(1)}</TableCell>
                        <TableCell>{row.atRisk}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </ErrorBoundary>

      <ErrorBoundary>
        <section>
          <Card className="border-red-500/30 bg-[linear-gradient(120deg,rgba(192,57,43,0.08),rgba(245,240,232,0.9))]">
            <CardHeader>
              <CardTitle>Impact Simulation</CardTitle>
              <CardDescription>
                If TPC intervenes on top N at-risk students, what happens to placement outcomes?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>If TPC intervenes on top N at-risk students</span>
                  <span className="font-semibold text-foreground">{topN}</span>
                </div>
                <Slider
                  min={10}
                  max={200}
                  step={10}
                  value={[topN]}
                  onValueChange={(value) => setTopN(value[0] || 10)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Current</p>
                  <p className="mt-2 text-4xl font-semibold text-foreground">{currentRate.toFixed(1)}%</p>
                </div>

                <p className="text-center text-2xl font-semibold text-[var(--red)]">-&gt;</p>

                <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-emerald-700">Projected</p>
                  <p className="mt-2 text-4xl font-semibold text-emerald-700">{projectedRate.toFixed(1)}%</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {isImpactLoading
                  ? "Updating simulation..."
                  : `Potentially ${compact(Math.round(toNumber(impact?.students_impacted, 0)))} students can be impacted in this cycle.`}
              </p>
            </CardContent>
          </Card>
        </section>
      </ErrorBoundary>

      <ErrorBoundary>
        <section>
          <Card>
            <CardHeader>
              <CardTitle>8-Week Score Trend</CardTitle>
              <CardDescription>Placement-ready, at-risk, and silent-dropout trajectories.</CardDescription>
            </CardHeader>
            <CardContent className="h-[380px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : trendRows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendRows}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="week" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={40} />
                    <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                    {lastScanWeek ? (
                      <ReferenceLine
                        x={lastScanWeek}
                        stroke="#C0392B"
                        strokeDasharray="6 6"
                        label={{ value: "Last AI scan", position: "insideTopRight", fill: "#C0392B", fontSize: 11 }}
                      />
                    ) : null}
                    <Line dataKey="placement_ready" name="Placement Ready" stroke="#27AE60" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                    <Line dataKey="at_risk" name="At Risk" stroke="#E67E22" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                    <Line dataKey="silent_dropout" name="Silent Dropout" stroke="#C0392B" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>
      </ErrorBoundary>
    </div>
  );
}
