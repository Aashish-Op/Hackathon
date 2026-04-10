"use client";

import Link from "next/link";

import {
  STUDENT_AI_INSIGHTS,
  STUDENT_OVERVIEW_FACTORS,
  STUDENT_PROFILE,
  STUDENT_QUICK_ACTIONS,
  STUDENT_TPC_ALERTS,
} from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { AIInsightCard } from "@/components/student/ai-insight-card";
import { StudentIcon, type StudentIconName } from "@/components/student/icon-map";
import { PlacementScoreRing } from "@/components/student/placement-score-ring";
import { RiskBadge } from "@/components/student/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const factorToneMap = {
  complete: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  critical: "border-rose-500/20 bg-rose-500/10 text-rose-400",
} as const;

const activityCellMap = {
  0: "bg-muted",
  1: "bg-emerald-500/20",
  2: "bg-emerald-500/35",
  3: "bg-emerald-500/50",
  4: "bg-emerald-500/70",
  5: "bg-emerald-400",
} as const;

function getPlacementDelta(score: number) {
  return score >= 65 ? "+3.2% from last week" : "+3.2% from last week";
}

function getRiskLevel(score: number) {
  if (score < 40) {
    return "high" as const;
  }

  if (score < 65) {
    return "medium" as const;
  }

  return "ready" as const;
}

export default function StudentOverviewPage() {
  const activeDays = STUDENT_PROFILE.activityHeatmap.filter((day) => day.count > 0).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-card to-amber-500/10 p-1">
        <div className="rounded-[24px] border border-border bg-card/95 p-6 lg:p-8">
          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr_0.9fr] xl:items-center">
            <div className="flex justify-center">
              <PlacementScoreRing score={STUDENT_PROFILE.placementProbability} size="lg" />
            </div>

            <div className="space-y-4 text-center xl:text-left">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Your Placement Probability
              </p>
              <div className="space-y-3">
                <p className="text-6xl font-semibold tracking-tight text-foreground">
                  {`${STUDENT_PROFILE.placementProbability}%`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                  <RiskBadge level={getRiskLevel(STUDENT_PROFILE.placementProbability)} />
                  <Badge className="gap-1.5" tone="violet">
                    <StudentIcon name="Sparkles" className="h-3.5 w-3.5" />
                    {`Updated ${formatRelativeTime(
                      STUDENT_PROFILE.lastUpdated,
                      "2026-04-10T08:30:00+05:30",
                    )} by AI Engine`}
                  </Badge>
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-400">
                {getPlacementDelta(STUDENT_PROFILE.placementProbability)}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">What&apos;s affecting your score</p>
              <div className="flex flex-wrap gap-2">
                {STUDENT_OVERVIEW_FACTORS.map((factor) => (
                  <Link key={factor.id} href={factor.href}>
                    <div
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-muted ${factorToneMap[factor.status]}`}
                    >
                      {`${factor.label}: ${factor.detail}`}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STUDENT_QUICK_ACTIONS.map((action) => (
          <Card key={action.id}>
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <Badge className="rounded-xl px-2.5 py-1.5" tone={action.tone}>
                  <StudentIcon name={action.icon as StudentIconName} />
                </Badge>
                <Badge tone="violet">{action.aiConfidence}</Badge>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.subtitle}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={action.href}>
                <Button className="w-full justify-between">
                  {action.ctaLabel}
                  <StudentIcon name="ChevronRight" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>This Week&apos;s Activity Heatmap</CardTitle>
            <CardDescription>
              Your last 28 days of tasks, practice, and profile activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-7">
              {STUDENT_PROFILE.activityHeatmap.map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square rounded-md border border-border ${activityCellMap[
                    day.count as keyof typeof activityCellMap
                  ]}`}
                  title={`${day.date} - ${day.count} tasks completed`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{`Active ${activeDays}/28 days this month`}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Insights Feed</h2>
              <p className="text-sm text-muted-foreground">
                Personal nudges and growth signals for today.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {STUDENT_AI_INSIGHTS.map((insight) => (
              <AIInsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {STUDENT_TPC_ALERTS.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="space-y-4 pt-6">
              <Badge tone={alert.tone}>{alert.title}</Badge>
              <p className="text-sm leading-6 text-muted-foreground">{alert.description}</p>
              <Link href={alert.href}>
                <Button className="w-full justify-between" variant="outline">
                  {alert.actionLabel}
                  <StudentIcon name="ChevronRight" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
