"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ANALYTICS_AREA_TREND,
  ANALYTICS_DATE_RANGE,
  ANALYTICS_DEPARTMENT_RISK,
  ANALYTICS_EFFECTIVENESS,
  ANALYTICS_KPIS,
  ANALYTICS_SKILL_GAPS,
  FORECAST_TABLE,
} from "@/lib/constants";
import { ChartTooltipCard, RiskScoreBadge, StatCard } from "@/components/dashboard/shared";
import { AppIcon } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="ghost">
          <AppIcon className="h-4 w-4" name="Calendar" />
          {ANALYTICS_DATE_RANGE}
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {ANALYTICS_KPIS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Placement Probability Trend</CardTitle>
            <CardDescription>Moving readiness by cohort over the last twelve weeks.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_AREA_TREND}>
                <defs>
                  <linearGradient id="analytics-ready" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-emerald)" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="var(--chart-emerald)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="analytics-atrisk" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-amber)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--chart-amber)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="analytics-unprepared" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-rose)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--chart-rose)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={38} />
                <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                <Area dataKey="ready" fill="url(#analytics-ready)" name="Ready" stroke="var(--chart-emerald)" strokeWidth={2.5} type="monotone" />
                <Area dataKey="atRisk" fill="url(#analytics-atrisk)" name="At-Risk" stroke="var(--chart-amber)" strokeWidth={2.5} type="monotone" />
                <Area dataKey="unprepared" fill="url(#analytics-unprepared)" name="Unprepared" stroke="var(--chart-rose)" strokeWidth={2.5} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department-wise Risk Distribution</CardTitle>
            <CardDescription>Grouped view of critical, high, and medium alerts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DEPARTMENT_RISK}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="department" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipCard />} />
                <Bar dataKey="critical" fill="var(--chart-rose)" name="Critical" radius={[8, 8, 0, 0]} />
                <Bar dataKey="high" fill="var(--chart-amber)" name="High" radius={[8, 8, 0, 0]} />
                <Bar dataKey="medium" fill="var(--chart-blue)" name="Medium" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intervention Effectiveness</CardTitle>
            <CardDescription>
              Improvement rate of intervened students compared with a control group.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ANALYTICS_EFFECTIVENESS}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={38} />
                <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                <Line dataKey="intervention" dot={{ r: 3 }} name="Intervention" stroke="var(--chart-violet)" strokeWidth={3} type="monotone" />
                <Line dataKey="control" dot={{ r: 3 }} name="Control" stroke="var(--chart-amber)" strokeWidth={2.5} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Skill Gaps Across Campus</CardTitle>
            <CardDescription>Most common blockers delaying readiness.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_SKILL_GAPS} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
                <XAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} type="number" />
                <YAxis dataKey="skill" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} type="category" width={120} />
                <Tooltip content={<ChartTooltipCard formatter={(value) => `${value}%`} />} />
                <Bar dataKey="value" fill="var(--chart-violet)" name="Gap" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>AI Placement Forecast — End of Cycle</CardTitle>
          <CardDescription>
            Department-level predictions for placed versus unplaced students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Total Students</TableHead>
                <TableHead>Predicted Placed</TableHead>
                <TableHead>Predicted Unplaced</TableHead>
                <TableHead>At-Risk Count</TableHead>
                <TableHead>Confidence %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FORECAST_TABLE.map((row) => (
                <TableRow key={row.department}>
                  <TableCell className="font-medium text-foreground">{row.department}</TableCell>
                  <TableCell>{row.totalStudents}</TableCell>
                  <TableCell className="text-emerald-400">{row.predictedPlaced}</TableCell>
                  <TableCell className="text-rose-400">{row.predictedUnplaced}</TableCell>
                  <TableCell>
                    <RiskScoreBadge score={100 - row.atRiskCount} />
                  </TableCell>
                  <TableCell>{row.confidence}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
