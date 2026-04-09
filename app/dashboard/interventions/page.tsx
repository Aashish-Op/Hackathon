"use client";

import * as React from "react";

import {
  BATCH_INTERVENTIONS,
  INTERVENTIONS,
  INTERVENTION_STATS,
  INTERVENTION_STATUS_TONES,
  INTERVENTION_TABS,
  STUDENTS,
} from "@/lib/constants";
import {
  RiskScoreBadge,
  SeverityBadge,
  SparkleCue,
  StatCard,
  StudentIdentity,
} from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const priorityToneMap = {
  Critical: "rose",
  High: "amber",
  Medium: "blue",
} as const;

export default function InterventionsPage() {
  const [activeTab, setActiveTab] = React.useState("All");

  const visibleInterventions = React.useMemo(
    () =>
      INTERVENTIONS.filter(
        (intervention) => activeTab === "All" || intervention.status === activeTab,
      ),
    [activeTab],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Intervention Management</CardTitle>
            <CardDescription>
              Assignment queue and active student plans coordinated by TPC officers.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERVENTION_TABS.map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant={activeTab === tab ? "secondary" : "ghost"}
              >
                {tab}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {INTERVENTION_STATS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {visibleInterventions.map((intervention) => {
          const student = STUDENTS.find((entry) => entry.id === intervention.studentId);

          if (!student) {
            return null;
          }

          return (
            <Card key={intervention.id}>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <StudentIdentity
                    name={student.name}
                    secondary={`${student.rollNo} · ${student.department}`}
                    tertiary={student.triggers[0]}
                  />
                  <RiskScoreBadge score={student.riskScore} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="violet">{intervention.type}</Badge>
                  <SparkleCue label="AI suggested based on skill gap analysis" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assigned officer</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {intervention.assignedOfficer}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SeverityBadge
                        label={intervention.status}
                        tone={INTERVENTION_STATUS_TONES[intervention.status]}
                      />
                      <SeverityBadge
                        label={intervention.priority}
                        tone={priorityToneMap[intervention.priority]}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">{intervention.aiRecommendation}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Created</p>
                    <p className="mt-2 text-sm text-foreground">{intervention.createdDate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Due</p>
                    <p className="mt-2 text-sm text-foreground">{intervention.dueDate}</p>
                  </div>
                </div>

                {intervention.status === "In Progress" ? (
                  <Textarea defaultValue={intervention.progressNote} placeholder="Add progress note..." />
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">Reassign</Button>
                  <Button variant="ghost">Mark Complete</Button>
                  <Button variant="ghost">View Student</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Batch Interventions</CardTitle>
          <CardDescription>
            Cohort-level actions suggested by the AI engine for repeatable skill gaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {BATCH_INTERVENTIONS.map((recommendation) => (
            <div
              key={recommendation.label}
              className="rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{recommendation.label}</p>
                  <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                </div>
                <Button variant="outline">Schedule</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
