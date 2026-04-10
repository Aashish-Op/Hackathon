"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  STUDENT_ACTIVITY_BREAKDOWN_CURRENT,
  STUDENT_ACTIVITY_BREAKDOWN_PREVIOUS,
  STUDENT_COHORT_COMPARISON,
  STUDENT_MONTHLY_SUMMARY,
  STUDENT_PROFILE,
  STUDENT_PROGRESS_RANGES,
  STUDENT_SKILL_CARDS,
  STUDENT_STREAK_INSIGHT,
} from "@/lib/constants";
import { ChartTooltipCard } from "@/components/dashboard/shared";
import { CohortPercentileBar } from "@/components/student/cohort-percentile-bar";
import { ProgressSpark } from "@/components/student/progress-spark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart-container";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function buildTimeline(range: string) {
  if (range === "This Week") {
    return STUDENT_PROFILE.weeklyProgress.slice(-4).map((point, index) => ({
      label: point.week,
      probability: point.probability,
      event: index === 1 ? "Mock Interview taken" : index === 3 ? "Course completed" : "",
    }));
  }

  if (range === "This Month") {
    return STUDENT_PROFILE.weeklyProgress.map((point, index) => ({
      label: point.week,
      probability: point.probability,
      event: index === 2 ? "Mock Interview taken" : index === 5 ? "Course completed" : "",
    }));
  }

  const monthly = range === "Last 3 Months" ? STUDENT_PROFILE.monthlyProgress.slice(-3) : STUDENT_PROFILE.monthlyProgress;
  return monthly.map((point, index) => ({
    label: point.month,
    probability: point.probability,
    event: index === 0 ? "Resume refreshed" : index === monthly.length - 1 ? "Aptitude improved" : "",
  }));
}

function bestDay(data: typeof STUDENT_ACTIVITY_BREAKDOWN_CURRENT) {
  const best = [...data].sort(
    (left, right) =>
      right.leetCode +
      right.mockTests +
      right.courses +
      right.profileUpdates -
      (left.leetCode + left.mockTests + left.courses + left.profileUpdates),
  )[0];

  const total =
    best.leetCode + best.mockTests + best.courses + best.profileUpdates;
  return `${best.day} (${total} tasks)`;
}

export default function StudentProgressPage() {
  const [range, setRange] = React.useState(STUDENT_PROGRESS_RANGES[1]);
  const [comparisonWeek, setComparisonWeek] = React.useState<"current" | "previous">(
    "current",
  );

  const timelineData = React.useMemo(() => buildTimeline(range), [range]);
  const activeActivityData =
    comparisonWeek === "current"
      ? STUDENT_ACTIVITY_BREAKDOWN_CURRENT
      : STUDENT_ACTIVITY_BREAKDOWN_PREVIOUS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STUDENT_PROGRESS_RANGES.map((item) => (
          <Button
            key={item}
            onClick={() => setRange(item)}
            variant={range === item ? "secondary" : "ghost"}
          >
            {item}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Placement Probability Timeline</CardTitle>
          <CardDescription>
            Your probability trend shifts with the selected time range.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[380px]">
          <ChartContainer>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="student-progress-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-emerald)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--chart-emerald)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
              <ReferenceLine
                label="Placement Ready Threshold"
                stroke="var(--chart-amber)"
                strokeDasharray="6 6"
                y={75}
              />
              {timelineData
                .filter((point) => point.event)
                .map((point) => (
                  <ReferenceLine
                    key={point.label}
                    label={point.event}
                    stroke="var(--chart-violet)"
                    strokeDasharray="4 4"
                    x={point.label}
                  />
                ))}
              <Area
                dataKey="probability"
                fill="url(#student-progress-area)"
                name="Probability"
                stroke="var(--chart-emerald)"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STUDENT_SKILL_CARDS.map((skill) => {
          const trendData =
            range === "This Week"
              ? skill.trend.slice(-4)
              : range === "This Month"
                ? skill.trend
                : range === "Last 3 Months"
                  ? [...skill.trend.slice(0, 2), ...skill.trend.slice(-3)]
                  : skill.trend;

          const tone = skill.currentScore >= 66 ? "emerald" : skill.currentScore >= 41 ? "amber" : "rose";

          return (
            <Card key={skill.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{skill.label}</CardTitle>
                    <CardDescription>{`vs Batch Avg: ${skill.batchAverage}%`}</CardDescription>
                  </div>
                  <Badge tone={tone}>{`Top ${skill.percentile}%`}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-semibold ${tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : "text-rose-400"}`}>
                    {skill.currentScore}
                  </p>
                  <Badge tone={skill.delta >= 0 ? "emerald" : "rose"}>
                    {`${skill.delta >= 0 ? "+" : ""}${skill.delta} pts`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress aria-label={`${skill.label} score`} tone={tone} value={skill.currentScore} />
                <ProgressSpark color={tone === "rose" ? "rose" : tone === "amber" ? "amber" : "emerald"} data={trendData} />
                <p className="text-sm text-muted-foreground">{skill.diagnosis}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Tasks completed by activity type this week.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setComparisonWeek("current")}
                variant={comparisonWeek === "current" ? "secondary" : "ghost"}
              >
                Current Week
              </Button>
              <Button
                onClick={() => setComparisonWeek("previous")}
                variant={comparisonWeek === "previous" ? "secondary" : "ghost"}
              >
                Previous Week
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[300px]">
              <ChartContainer>
                <BarChart data={activeActivityData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipCard />} />
                  <Bar dataKey="leetCode" fill="var(--chart-violet)" name="LeetCode" radius={[6, 6, 0, 0]} stackId="tasks" />
                  <Bar dataKey="mockTests" fill="var(--chart-amber)" name="Mock Tests" radius={[6, 6, 0, 0]} stackId="tasks" />
                  <Bar dataKey="courses" fill="var(--chart-sky)" name="Courses" radius={[6, 6, 0, 0]} stackId="tasks" />
                  <Bar dataKey="profileUpdates" fill="var(--chart-emerald)" name="Profile Updates" radius={[6, 6, 0, 0]} stackId="tasks" />
                </BarChart>
              </ChartContainer>
            </div>
            <p className="text-sm text-muted-foreground">{`Best day: ${bestDay(activeActivityData)}`}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {STUDENT_MONTHLY_SUMMARY.map((item) => (
              <Card key={item.label}>
                <CardContent className="space-y-2 pt-6">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                  <Badge tone={item.tone as "violet" | "amber" | "sky" | "emerald"}>
                    {item.delta}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card id="consistency">
            <CardHeader>
              <CardTitle>Streak & Consistency</CardTitle>
              <CardDescription>
                Activity consistency is one of the strongest leading indicators in your batch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-4xl font-semibold text-amber-300">12 days</p>
                  <p className="text-sm text-muted-foreground">Current streak</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">21 days</p>
                  <p className="text-sm text-muted-foreground">Longest streak</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Weekly consistency score: 6/7 days active this week</p>
              <div className="grid grid-cols-7 gap-2">
                {STUDENT_PROFILE.activityHeatmap.slice(-28).map((day) => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-md border border-border ${day.count === 0 ? "bg-muted" : day.count <= 2 ? "bg-emerald-500/25" : day.count <= 4 ? "bg-emerald-500/55" : "bg-emerald-400"}`}
                  />
                ))}
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm leading-6 text-foreground">
                {STUDENT_STREAK_INSIGHT}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cohort Comparison</CardTitle>
            <CardDescription>See where you stand relative to your batch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <CohortPercentileBar
              label="You are in the top 42% of your batch for placement readiness"
              percentile={42}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Your Score</TableHead>
                  <TableHead>Batch Avg</TableHead>
                  <TableHead>Percentile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENT_COHORT_COMPARISON.map((row) => (
                  <TableRow key={row.skill}>
                    <TableCell className="font-medium text-foreground">{row.skill}</TableCell>
                    <TableCell>{row.yourScore}</TableCell>
                    <TableCell>{row.batchAverage}</TableCell>
                    <TableCell>{`Top ${row.percentile}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
