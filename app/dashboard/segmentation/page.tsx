"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  INACTIVE_CLUSTER,
  SEGMENTATION_CLUSTER_CARDS,
  SEGMENTATION_RADAR_DATA,
  SEGMENTATION_SCHEDULE,
} from "@/lib/constants";
import { AppIcon, ChartTooltipCard, SparkleCue } from "@/components/dashboard/shared";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const toneClassMap = {
  emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  amber: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  rose: "text-rose-400 border-rose-500/20 bg-rose-500/10",
} as const;

export default function SegmentationPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Cluster Runtime</CardTitle>
            <CardDescription>
              Last clustered: {SEGMENTATION_SCHEDULE.lastClustered} · Next run: {SEGMENTATION_SCHEDULE.nextRun}
            </CardDescription>
          </div>
          <Button>
            <AppIcon className="h-4 w-4" name="Cpu" />
            {SEGMENTATION_SCHEDULE.actionLabel}
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-3">
        {SEGMENTATION_CLUSTER_CARDS.map((cluster) => (
          <Card key={cluster.id}>
            <CardHeader>
              <div className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassMap[cluster.tone]}`}>
                {cluster.label}
              </div>
              <CardTitle className="text-4xl">{cluster.count}</CardTitle>
              <CardDescription>{`Avg placement probability: ${cluster.avgProbability}`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">{cluster.traits}</p>
              <div className="h-44 rounded-2xl border border-border bg-muted/30 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cluster.departments}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="department" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltipCard />} />
                    <Bar dataKey="value" fill={`var(--chart-${cluster.tone})`} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2">
                {cluster.actions.map((action) => (
                  <Button key={action} variant={action.includes("Bulk") ? "warning" : "outline"}>
                    {action}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Inactive Cluster</CardTitle>
            <CardDescription>{INACTIVE_CLUSTER.description}</CardDescription>
          </div>
          <Button variant="warning">{INACTIVE_CLUSTER.actionLabel}</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <SparkleCue label={`${INACTIVE_CLUSTER.count} students flagged for re-engagement`} />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-subtle">
            {INACTIVE_CLUSTER.students.map((student) => (
              <div
                key={student}
                className="flex min-w-36 items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3"
              >
                <Avatar name={student} />
                <p className="text-sm font-medium text-foreground">{student}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Skill Comparison</CardTitle>
          <CardDescription>
            Relative skill coverage across ready, at-risk, and unprepared clusters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={SEGMENTATION_RADAR_DATA}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" stroke="var(--muted-foreground)" />
                <PolarRadiusAxis stroke="var(--muted-foreground)" />
                <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                <Radar
                  dataKey="ready"
                  fill="var(--chart-emerald)"
                  fillOpacity={0.2}
                  name="Ready"
                  stroke="var(--chart-emerald)"
                  strokeWidth={2}
                />
                <Radar
                  dataKey="atRisk"
                  fill="var(--chart-amber)"
                  fillOpacity={0.2}
                  name="At-Risk"
                  stroke="var(--chart-amber)"
                  strokeWidth={2}
                />
                <Radar
                  dataKey="unprepared"
                  fill="var(--chart-rose)"
                  fillOpacity={0.2}
                  name="Unprepared"
                  stroke="var(--chart-rose)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Ready
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              At-Risk
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Unprepared
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
