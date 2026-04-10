"use client";

import Link from "next/link";
import * as React from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { api, type ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { ApiEnvelope, ClusterDistribution, ClusterDistributionItem, StudentProfile } from "@/lib/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { ClusterBadge } from "@/components/ui/ClusterBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentAvatar } from "@/components/ui/StudentAvatar";
import { useToast } from "@/components/ui/toast";

type ClusterKey = "placement_ready" | "at_risk" | "silent_dropout";

type ClusterCardData = {
  cluster: ClusterKey;
  count: number;
  avgScore: number;
};

type ScatterPoint = {
  id: string;
  name: string;
  department: string;
  score: number;
  probability: number;
  cluster: ClusterKey;
  z: number;
};

type ThresholdRow = {
  id: string;
  name: string;
  department: string;
  score: number;
  pointsToAtRisk: number;
  recommendedAction: string;
};

const CLUSTER_META: Record<
  ClusterKey,
  {
    label: string;
    colorClass: string;
    chartColor: string;
  }
> = {
  placement_ready: {
    label: "Placement Ready",
    colorClass: "text-emerald-700",
    chartColor: "#27AE60",
  },
  at_risk: {
    label: "At Risk",
    colorClass: "text-amber-700",
    chartColor: "#E67E22",
  },
  silent_dropout: {
    label: "Silent Dropout",
    colorClass: "text-red-700",
    chartColor: "#C0392B",
  },
};

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

function normalizeCluster(cluster: string | null | undefined): ClusterKey {
  const value = (cluster || "").toLowerCase();

  if (value.includes("placement") || value.includes("ready")) {
    return "placement_ready";
  }

  if (value.includes("silent") || value.includes("dropout")) {
    return "silent_dropout";
  }

  return "at_risk";
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const objectData = data as { items?: unknown[] };
    if (Array.isArray(objectData.items)) {
      return objectData.items;
    }
  }

  return [];
}

function extractClusterItems(data: unknown): ClusterDistributionItem[] {
  if (Array.isArray(data)) {
    return data as ClusterDistributionItem[];
  }

  if (data && typeof data === "object") {
    const distribution = data as ClusterDistribution;
    if (Array.isArray(distribution.items)) {
      return distribution.items;
    }
  }

  return [];
}

function scoreOf(student: StudentProfile): number {
  return clamp(toNumber(student.risk_score, 0), 0, 100);
}

function probabilityOf(student: StudentProfile): number {
  const raw = toNumber(student.placement_probability, 0);
  if (raw <= 1) {
    return clamp(raw * 100, 0, 100);
  }

  return clamp(raw, 0, 100);
}

function buildClusterCards(distributionData: unknown, students: StudentProfile[]): ClusterCardData[] {
  const counts: Record<ClusterKey, number> = {
    placement_ready: 0,
    at_risk: 0,
    silent_dropout: 0,
  };

  extractClusterItems(distributionData).forEach((item) => {
    const cluster = normalizeCluster(item.cluster);
    counts[cluster] = Math.max(0, Math.round(toNumber(item.count, 0)));
  });

  const groupedScores: Record<ClusterKey, number[]> = {
    placement_ready: [],
    at_risk: [],
    silent_dropout: [],
  };

  students.forEach((student) => {
    const cluster = normalizeCluster(student.cluster);
    groupedScores[cluster].push(scoreOf(student));

    if (counts[cluster] === 0) {
      counts[cluster] += 1;
    }
  });

  return (["placement_ready", "at_risk", "silent_dropout"] as const).map((cluster) => {
    const scores = groupedScores[cluster];
    const avgScore = scores.length > 0 ? round(scores.reduce((sum, value) => sum + value, 0) / scores.length, 1) : 0;

    return {
      cluster,
      count: counts[cluster],
      avgScore,
    };
  });
}

function buildScatterPoints(students: StudentProfile[]): ScatterPoint[] {
  return students.map((student, index) => ({
    id: student.id || `student-${index}`,
    name: student.full_name || "Student",
    department: (student.department || "Unknown").toUpperCase(),
    score: scoreOf(student),
    probability: probabilityOf(student),
    cluster: normalizeCluster(student.cluster),
    z: 64,
  }));
}

function recommendedAction(score: number): string {
  if (score < 20) {
    return "Urgent counselling + parent outreach";
  }

  if (score < 28) {
    return "1:1 counselling and weekly mock plan";
  }

  return "Targeted mock + nudge campaign";
}

function buildThresholdRows(points: ScatterPoint[]): ThresholdRow[] {
  return points
    .filter((point) => point.cluster === "silent_dropout")
    .sort((left, right) => Math.abs(left.score - 35) - Math.abs(right.score - 35))
    .slice(0, 5)
    .map((point) => ({
      id: point.id,
      name: point.name,
      department: point.department,
      score: round(point.score, 1),
      pointsToAtRisk: round(Math.max(35 - point.score, 0), 1),
      recommendedAction: recommendedAction(point.score),
    }));
}

function ScatterPointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="w-64 rounded-xl border border-border bg-card p-3 text-sm shadow-[0_10px_24px_rgba(26,26,26,0.12)]">
      <p className="font-semibold text-foreground">{point.name}</p>
      <p className="text-xs text-muted-foreground">{point.department}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span>Score</span>
        <span className="font-medium text-foreground">{point.score.toFixed(1)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span>Placement Probability</span>
        <span className="font-medium text-foreground">{point.probability.toFixed(1)}%</span>
      </div>
      <div className="mt-2">
        <ClusterBadge cluster={point.cluster} />
      </div>
      <a className="mt-3 inline-block text-xs font-medium text-[var(--red)] underline-offset-2 hover:underline" href={`/students/${point.id}`}>
        View profile -&gt;
      </a>
    </div>
  );
}

export default function SegmentationPage() {
  usePageTitle("Segmentation - Vigilo");

  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [clusterCards, setClusterCards] = React.useState<ClusterCardData[]>([]);
  const [scatterPoints, setScatterPoints] = React.useState<ScatterPoint[]>([]);
  const [thresholdRows, setThresholdRows] = React.useState<ThresholdRow[]>([]);

  const loadSegmentation = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [distributionResponse, studentsResponse] = await Promise.all([
        api.get<ApiEnvelope<ClusterDistribution>>("/api/v1/analytics/cluster-distribution"),
        api.get<ApiEnvelope<StudentProfile[]>>("/api/v1/students", {
          limit: 500,
          offset: 0,
        }),
      ]);

      const students = extractArray(studentsResponse.data) as StudentProfile[];
      const points = buildScatterPoints(students);

      setClusterCards(buildClusterCards(distributionResponse.data, students));
      setScatterPoints(points);
      setThresholdRows(buildThresholdRows(points));
    } catch (requestError) {
      const message = toApiErrorMessage(requestError);
      setError(message);
      toast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadSegmentation();
  }, [loadSegmentation]);

  const placementReadyPoints = scatterPoints.filter((point) => point.cluster === "placement_ready");
  const atRiskPoints = scatterPoints.filter((point) => point.cluster === "at_risk");
  const silentDropoutPoints = scatterPoints.filter((point) => point.cluster === "silent_dropout");

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => void loadSegmentation()}>
            Retry
          </Button>
        </div>
      ) : null}

      <ErrorBoundary>
        <section className="grid gap-6 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-4 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))
            : clusterCards.map((card) => (
                <Card key={card.cluster}>
                  <CardHeader>
                    <ClusterBadge cluster={card.cluster} />
                    <CardTitle className={`text-4xl ${CLUSTER_META[card.cluster].colorClass}`}>
                      {card.count}
                    </CardTitle>
                    <CardDescription>{CLUSTER_META[card.cluster].label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Average score: {card.avgScore.toFixed(1)}</p>
                  </CardContent>
                </Card>
              ))}
        </section>
      </ErrorBoundary>

      <ErrorBoundary>
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Cluster Scatter Plot</CardTitle>
              <CardDescription>
                X axis is Vigilo Score and Y axis is placement probability. Each dot represents one student.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="h-[460px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 20, bottom: 8, left: 6 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                      <XAxis
                        type="number"
                        dataKey="score"
                        name="Vigilo Score"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis
                        type="number"
                        dataKey="probability"
                        name="Placement Probability"
                        unit="%"
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                      />
                      <ZAxis type="number" dataKey="z" range={[64, 64]} />
                      <Tooltip cursor={{ strokeDasharray: "4 4" }} content={<ScatterPointTooltip />} />
                      <Scatter data={placementReadyPoints} fill={CLUSTER_META.placement_ready.chartColor} fillOpacity={0.5} name="Placement Ready" />
                      <Scatter data={atRiskPoints} fill={CLUSTER_META.at_risk.chartColor} fillOpacity={0.5} name="At Risk" />
                      <Scatter data={silentDropoutPoints} fill={CLUSTER_META.silent_dropout.chartColor} fillOpacity={0.5} name="Silent Dropout" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Cluster boundary legend</p>
                <p className="mt-2">Placement Ready: sustained high score and strong placement probability trajectory.</p>
                <p>At Risk: moderate score band with declining readiness indicators.</p>
                <p>Silent Dropout: low score and weak engagement signals requiring immediate intervention.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </ErrorBoundary>

      <ErrorBoundary>
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Closest to Threshold (Silent Dropout)</CardTitle>
              <CardDescription>Top five students nearest to the at-risk threshold of score 35.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(26,26,26,0.2)] bg-[var(--tint)]">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Current Score</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Points to At-Risk</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recommended Action</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-3">
                          <Skeleton className="h-24 w-full" />
                        </td>
                      </tr>
                    ) : thresholdRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No silent-dropout students found for threshold analysis.
                        </td>
                      </tr>
                    ) : (
                      thresholdRows.map((row) => (
                        <tr key={row.id} className="border-b border-[rgba(26,26,26,0.1)]">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <StudentAvatar name={row.name} cluster="silent_dropout" size="sm" />
                              <div>
                                <Link href={`/students/${row.id}`} className="text-sm font-medium text-foreground underline-offset-2 hover:underline">
                                  {row.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">{row.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-foreground">{row.score.toFixed(1)}</p>
                            <ScoreBar score={row.score} className="mt-1 w-28" />
                          </td>
                          <td className="px-3 py-3 text-sm text-foreground">{row.pointsToAtRisk.toFixed(1)}</td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">{row.recommendedAction}</td>
                          <td className="px-3 py-3 text-right">
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => toast(`Intervention queued for ${row.name}`, "success")}
                            >
                              Intervene
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </ErrorBoundary>
    </div>
  );
}
