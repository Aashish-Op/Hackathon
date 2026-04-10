"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  STUDENT_BOOK_MOCK_OPTIONS,
  STUDENT_MOCK_ATTEMPTS,
  STUDENT_MOCK_STATS,
  STUDENT_UPCOMING_MOCK,
} from "@/lib/constants";
import { ChartTooltipCard } from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart-container";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function MockInterviewsPage() {
  const [expandedAttempt, setExpandedAttempt] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState(STUDENT_BOOK_MOCK_OPTIONS.types[0]);
  const [selectedSlot, setSelectedSlot] = React.useState(STUDENT_BOOK_MOCK_OPTIONS.slots[0]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STUDENT_MOCK_STATS.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
              <Badge tone={item.tone as "violet" | "amber" | "emerald"}>{item.delta}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-violet-500/10">
        <CardHeader>
          <CardTitle>Upcoming Mock</CardTitle>
          <CardDescription>
            Your next practice interview is already on the calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-3xl font-semibold text-foreground">
                {STUDENT_UPCOMING_MOCK.dateLabel}
              </p>
              <p className="text-sm text-muted-foreground">{STUDENT_UPCOMING_MOCK.type}</p>
              <Badge tone="violet">{STUDENT_UPCOMING_MOCK.interviewer}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Reschedule</Button>
              <Button disabled>Join Session</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Countdown</p>
            <p className="mt-3 text-4xl font-semibold text-foreground">
              {STUDENT_UPCOMING_MOCK.countdown}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Attempts</CardTitle>
          <CardDescription>
            Review what went well and what to improve before your next mock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Feedback Summary</TableHead>
                <TableHead>Strengths</TableHead>
                <TableHead>Improvements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENT_MOCK_ATTEMPTS.map((attempt) => (
                <React.Fragment key={attempt.id}>
                  <TableRow>
                    <TableCell>{attempt.date}</TableCell>
                    <TableCell>{attempt.type}</TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          attempt.score >= 67
                            ? "emerald"
                            : attempt.score >= 54
                              ? "amber"
                              : "rose"
                        }
                      >
                        {`${attempt.score}/100`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {attempt.feedbackSummary}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {attempt.strengths.join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {attempt.improvements.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() =>
                          setExpandedAttempt((current) =>
                            current === attempt.id ? null : attempt.id,
                          )
                        }
                        variant="ghost"
                      >
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedAttempt === attempt.id ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="grid gap-6 rounded-2xl border border-border bg-muted/20 p-5 xl:grid-cols-[1fr_1fr]">
                          <div className="space-y-4">
                            <div className="h-52">
                              <ChartContainer>
                                <BarChart data={attempt.scoreBreakdown}>
                                  <CartesianGrid
                                    stroke="var(--border)"
                                    strokeDasharray="4 4"
                                    vertical={false}
                                  />
                                  <XAxis
                                    axisLine={false}
                                    dataKey="label"
                                    stroke="var(--muted-foreground)"
                                    tickLine={false}
                                  />
                                  <YAxis
                                    axisLine={false}
                                    stroke="var(--muted-foreground)"
                                    tickLine={false}
                                  />
                                  <Tooltip
                                    content={
                                      <ChartTooltipCard formatter={(value) => `${value}/100`} />
                                    }
                                  />
                                  <Bar
                                    dataKey="value"
                                    fill="var(--chart-violet)"
                                    radius={[8, 8, 0, 0]}
                                  />
                                </BarChart>
                              </ChartContainer>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">
                                Question-by-question review
                              </p>
                              {attempt.questionReview.map((item) => (
                                <p key={item} className="text-sm leading-6 text-muted-foreground">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">AI tips</p>
                              {attempt.aiTips.map((tip) => (
                                <div
                                  key={tip}
                                  className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-foreground"
                                >
                                  {tip}
                                </div>
                              ))}
                            </div>
                            <Button>Retry this type</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Book New Mock</CardTitle>
          <CardDescription>
            Select a round type, choose a slot, and leave context for the interviewer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Mock type</p>
              <div className="flex flex-wrap gap-2">
                {STUDENT_BOOK_MOCK_OPTIONS.types.map((type) => (
                  <Button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    variant={selectedType === type ? "secondary" : "ghost"}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Available slots</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {STUDENT_BOOK_MOCK_OPTIONS.slots.map((slot) => (
                  <Button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    variant={selectedSlot === slot ? "secondary" : "outline"}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {`Selected: ${selectedType} - ${selectedSlot}`}
            </div>
            <Textarea placeholder="Notes to interviewer..." />
            <Button>Schedule Mock</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
