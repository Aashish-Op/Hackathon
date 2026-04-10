"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  STUDENT_ACTION_PLAN_HEADER,
  STUDENT_ACTION_PLAN_PROJECTION,
  STUDENT_ACTION_PLAN_TASKS,
  STUDENT_WEEKLY_CHECKLIST,
} from "@/lib/constants";
import { ChartTooltipCard } from "@/components/dashboard/shared";
import { StudentIcon, type StudentIconName } from "@/components/student/icon-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart-container";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const groupTone = {
  critical: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  high: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  medium: "border-sky-500/20 bg-sky-500/10 text-sky-400",
} as const;

export default function ActionPlanPage() {
  const completedWeeklyTasks = STUDENT_WEEKLY_CHECKLIST.filter((task) => task.completed).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Your AI Roadmap</CardTitle>
            <CardDescription>{STUDENT_ACTION_PLAN_HEADER.generatedOn}</CardDescription>
            <Badge tone="amber">{STUDENT_ACTION_PLAN_HEADER.riskLabel}</Badge>
            <p className="text-sm text-muted-foreground">{STUDENT_ACTION_PLAN_HEADER.projection}</p>
          </div>
          <Button variant="ghost">
            <StudentIcon name="Sparkles" />
            Regenerate Plan
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Placement Probability Projection</CardTitle>
          <CardDescription>
            Your likely score path with the plan versus your current trajectory.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ChartContainer>
            <LineChart data={STUDENT_ACTION_PLAN_PROJECTION}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis domain={[50, 90]} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
              <ReferenceLine stroke="var(--chart-violet)" x="Today" />
              <ReferenceLine
                label="Placement Ready Threshold"
                stroke="var(--chart-amber)"
                strokeDasharray="6 6"
                y={75}
              />
              <Line
                dataKey="plan"
                dot={{ r: 3 }}
                name="If you follow the plan"
                stroke="var(--chart-emerald)"
                strokeWidth={3}
                type="monotone"
              />
              <Line
                dataKey="current"
                dot={{ r: 3 }}
                name="Current trajectory"
                stroke="var(--chart-rose)"
                strokeDasharray="8 4"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {(["critical", "high", "medium"] as const).map((group) => (
            <Card key={group}>
              <CardHeader>
                <div className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${groupTone[group]}`}>
                  {group}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {STUDENT_ACTION_PLAN_TASKS[group].map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-border bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
                            <StudentIcon name={task.icon as StudentIconName} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.why}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="emerald">{task.impact}</Badge>
                          <Badge tone="amber">{task.due}</Badge>
                        </div>
                        <Progress
                          aria-label={`${task.title} progress`}
                          tone={group === "critical" ? "rose" : group === "high" ? "amber" : "sky"}
                          value={(task.progress / task.total) * 100}
                        />
                        <p className="text-sm text-muted-foreground">{`${task.progress}/${task.total} complete`}</p>
                      </div>
                      <Button variant={group === "critical" ? "danger" : "outline"}>
                        {task.ctaLabel}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>This Week&apos;s Tasks</CardTitle>
            <CardDescription>
              {`${completedWeeklyTasks}/${STUDENT_WEEKLY_CHECKLIST.length} tasks complete this week`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STUDENT_WEEKLY_CHECKLIST.map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4"
              >
                <Checkbox checked={task.completed} readOnly />
                <span className="text-sm leading-6 text-foreground">{task.label}</span>
              </label>
            ))}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
              Streak continuity warning: by Thursday, you should finish at least 3 tasks to keep your momentum.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
