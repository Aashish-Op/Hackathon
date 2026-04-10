"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";

import {
  STUDENT_DSA_TOPIC_BREAKDOWN,
  STUDENT_IMPROVEMENT_PLAN,
  STUDENT_PROFILE,
  STUDENT_RECOMMENDED_PROBLEMS,
  STUDENT_SKILL_CARDS,
} from "@/lib/constants";
import { ChartTooltipCard } from "@/components/dashboard/shared";
import { ProgressSpark } from "@/components/student/progress-spark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart-container";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const radarData = [
  { skill: "DSA", you: STUDENT_PROFILE.skills.dsa, batchAverage: STUDENT_PROFILE.batchAvgSkills.dsa },
  { skill: "Aptitude", you: STUDENT_PROFILE.skills.aptitude, batchAverage: STUDENT_PROFILE.batchAvgSkills.aptitude },
  { skill: "Communication", you: STUDENT_PROFILE.skills.communication, batchAverage: STUDENT_PROFILE.batchAvgSkills.communication },
  { skill: "Domain Knowledge", you: STUDENT_PROFILE.skills.domainKnowledge, batchAverage: STUDENT_PROFILE.batchAvgSkills.domainKnowledge },
  { skill: "Resume Quality", you: STUDENT_PROFILE.skills.resumeQuality, batchAverage: STUDENT_PROFILE.batchAvgSkills.resumeQuality },
  { skill: "Mock Interview Score", you: STUDENT_PROFILE.skills.mockInterviewScore, batchAverage: STUDENT_PROFILE.batchAvgSkills.mockInterviewScore },
];

export default function SkillTrackerPage() {
  const [dsaExpanded, setDsaExpanded] = React.useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Radar</CardTitle>
          <CardDescription>You vs batch average across the six placement signals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[420px]">
            <ChartContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" stroke="var(--muted-foreground)" />
                <PolarRadiusAxis stroke="var(--muted-foreground)" />
                <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                <Radar
                  dataKey="you"
                  fill="var(--chart-violet)"
                  fillOpacity={0.3}
                  name="You"
                  stroke="var(--chart-violet)"
                  strokeWidth={2}
                />
                <Radar
                  dataKey="batchAverage"
                  fill="var(--chart-slate)"
                  fillOpacity={0.2}
                  name="Batch Average"
                  stroke="var(--chart-slate)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
              You
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Batch Average
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STUDENT_SKILL_CARDS.map((skill) => {
          const tone = skill.currentScore >= 66 ? "emerald" : skill.currentScore >= 41 ? "amber" : "rose";
          const difference = skill.currentScore - skill.batchAverage;

          return (
            <Card key={skill.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{skill.label}</CardTitle>
                    <CardDescription>{skill.diagnosis}</CardDescription>
                  </div>
                  <Badge tone={tone}>{skill.currentScore}</Badge>
                </div>
                <div className="space-y-2">
                  <Progress aria-label={`${skill.label} score`} tone={tone} value={skill.currentScore} />
                  <p className={difference >= 0 ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>
                    {difference >= 0
                      ? `+${difference} pts above batch`
                      : `${difference} pts below batch`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressSpark
                  color={tone === "rose" ? "rose" : tone === "amber" ? "amber" : "emerald"}
                  data={skill.trend}
                />
                <Button variant="outline">{skill.actionLabel}</Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card id="dsa">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>DSA Deep Dive</CardTitle>
              <CardDescription>
                Topic-wise performance and recommended practice areas.
              </CardDescription>
            </div>
            <Button onClick={() => setDsaExpanded((current) => !current)} variant="ghost">
              {dsaExpanded ? "Hide Breakdown" : "Expand Breakdown"}
            </Button>
          </CardHeader>
          {dsaExpanded ? (
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Problems Solved</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STUDENT_DSA_TOPIC_BREAKDOWN.map((topic) => (
                    <TableRow key={topic.topic}>
                      <TableCell className="font-medium text-foreground">{topic.topic}</TableCell>
                      <TableCell>{topic.solved}</TableCell>
                      <TableCell>{topic.accuracy}</TableCell>
                      <TableCell>
                        <Badge tone={topic.tone as "emerald" | "amber" | "rose"}>{topic.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Recommended LeetCode list</p>
                <div className="flex flex-wrap gap-2">
                  {STUDENT_RECOMMENDED_PROBLEMS.map((problem) => (
                    <Badge key={problem} tone="violet">
                      {problem}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improvement Plan</CardTitle>
            <CardDescription>
              Following this plan can improve your DSA score by approximately 18 points in 4 weeks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {STUDENT_IMPROVEMENT_PLAN.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-4 w-4 rounded-full ${step.completed ? "bg-emerald-400" : "bg-violet-400"}`} />
                  {index < STUDENT_IMPROVEMENT_PLAN.length - 1 ? (
                    <div className="mt-2 h-full w-px bg-border" />
                  ) : null}
                </div>
                <div className="pb-6">
                  <p className="text-sm font-medium text-foreground">{step.week}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{step.task}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
