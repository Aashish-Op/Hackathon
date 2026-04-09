"use client";

import * as React from "react";

import { ALERT_FILTERS, ALERT_QUEUE, BRAND_DETAILS, RISK_ALERT_STATS, SEVERITY_TONES } from "@/lib/constants";
import {
  RiskScoreBadge,
  SeverityBadge,
  SparkleCue,
  StatCard,
  StudentIdentity,
} from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const filterOrder = {
  critical: 0,
  high: 1,
  medium: 2,
} as const;

const statusToneMap = {
  Pending: "slate",
  Assigned: "amber",
  "In Review": "violet",
} as const;

const borderToneMap = {
  critical: "bg-rose-400",
  high: "bg-amber-400",
  medium: "bg-sky-400",
} as const;

export default function RiskAlertsPage() {
  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("All");

  const filteredAlerts = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return ALERT_QUEUE.filter((alert) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        alert.studentName.toLowerCase().includes(normalizedSearch) ||
        alert.rollNo.toLowerCase().includes(normalizedSearch) ||
        alert.department.toLowerCase().includes(normalizedSearch) ||
        alert.reason.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Critical" && alert.severity === "critical") ||
        (activeFilter === "High" && alert.severity === "high") ||
        (activeFilter === "Medium" && alert.severity === "medium") ||
        (activeFilter === "Unassigned" && alert.assignedTo === "Unassigned") ||
        (activeFilter === "My Queue" && alert.assignedTo === BRAND_DETAILS.currentOfficer);

      return matchesSearch && matchesFilter;
    }).sort((left, right) => filterOrder[left.severity] - filterOrder[right.severity]);
  }, [activeFilter, search]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {RISK_ALERT_STATS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {ALERT_FILTERS.map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  variant={activeFilter === filter ? "secondary" : "ghost"}
                >
                  {filter}
                </Button>
              ))}
            </div>
            <Input
              className="lg:max-w-sm"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, roll no, department, or reason"
              value={search}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="overflow-hidden">
            <CardContent className="grid gap-4 p-0 lg:grid-cols-[8px_minmax(0,1fr)]">
              <div className={borderToneMap[alert.severity]} />
              <div className="space-y-4 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StudentIdentity
                        name={alert.studentName}
                        secondary={alert.rollNo}
                        tertiary={alert.department}
                      />
                      <Badge tone="slate">{alert.department}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">{alert.reason}</p>
                        <SparkleCue label="AI generated" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {alert.signals.map((signal) => (
                          <Badge key={signal} tone="default">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px]">
                    <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Risk Score
                      </p>
                      <RiskScoreBadge score={alert.riskScore} />
                    </div>
                    <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Assigned To
                      </p>
                      <p className="text-sm font-medium text-foreground">{alert.assignedTo}</p>
                      <SeverityBadge label={alert.status} tone={statusToneMap[alert.status]} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge
                      label={alert.severity.toUpperCase()}
                      tone={SEVERITY_TONES[alert.severity]}
                    />
                    <p className="text-sm text-muted-foreground">{alert.flaggedLabel}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">Assign</Button>
                    <Button variant="ghost">Send Nudge</Button>
                    <Button variant="ghost">Mark Resolved</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
