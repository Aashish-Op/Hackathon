"use client";

import * as React from "react";
import { Bell, Mail, MessageSquare, Send } from "lucide-react";

import {
  NUDGE_COMPOSER,
  NUDGE_FEED,
  NUDGE_STATS,
  NUDGE_STATUS_TONES,
  NUDGE_TEMPLATES,
  STUDENTS,
} from "@/lib/constants";
import {
  SeverityBadge,
  StatCard,
  StudentIdentity,
  SelectField,
} from "@/components/dashboard/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const toneMap = {
  WhatsApp: MessageSquare,
  Email: Mail,
  "In-App": Bell,
} as const;

export default function NudgesPage() {
  const [studentMode, setStudentMode] = React.useState(NUDGE_COMPOSER.studentModes[0]);
  const [template, setTemplate] = React.useState(NUDGE_COMPOSER.templates[1]);
  const [scheduleMode, setScheduleMode] = React.useState(NUDGE_COMPOSER.schedulingModes[0]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {NUDGE_STATS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nudge Templates</CardTitle>
            <CardDescription>High-performing message templates by placement signal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NUDGE_TEMPLATES.map((templateItem) => (
              <div
                key={templateItem.id}
                className="rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={templateItem.tone}>{templateItem.name}</Badge>
                      <div className="flex flex-wrap gap-2">
                        {templateItem.channels.map((channel) => {
                          const Icon = toneMap[channel];

                          return (
                            <Badge key={channel} tone="default" className="gap-1.5">
                              <Icon className="h-3.5 w-3.5" />
                              {channel}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{templateItem.preview}</p>
                    <p className="text-xs text-muted-foreground">
                      Last used {templateItem.lastUsed} · Used {templateItem.useCount} times
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost">Preview</Button>
                    <Button variant="outline">Edit</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Nudges Feed</CardTitle>
            <CardDescription>Delivery outcomes and latest student responses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NUDGE_FEED.map((record) => {
              const student = STUDENTS.find((entry) => entry.id === record.studentId);
              const templateItem = NUDGE_TEMPLATES.find((entry) => entry.id === record.templateId);

              if (!student || !templateItem) {
                return null;
              }

              const Icon = toneMap[record.channel];

              return (
                <div
                  key={record.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <StudentIdentity
                      name={student.name}
                      secondary={templateItem.name}
                      tertiary={record.sentAt}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="default" className="gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {record.channel}
                      </Badge>
                      <SeverityBadge
                        label={record.status}
                        tone={NUDGE_STATUS_TONES[record.status]}
                      />
                    </div>
                  </div>
                  {record.responseSnippet ? (
                    <p className="mt-3 text-sm text-muted-foreground">{record.responseSnippet}</p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Compose Nudge</CardTitle>
          <CardDescription>
            Personalize, schedule, and send nudges to students or clusters.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {NUDGE_COMPOSER.studentModes.map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setStudentMode(mode)}
                  variant={studentMode === mode ? "secondary" : "ghost"}
                >
                  {mode}
                </Button>
              ))}
            </div>
            <SelectField
              aria-label="Choose student cluster"
              onChange={() => undefined}
              options={
                studentMode === "By Cluster"
                  ? NUDGE_COMPOSER.clusters
                  : STUDENTS.slice(0, 8).map((student) => `${student.name} · ${student.rollNo}`)
              }
              value={
                studentMode === "By Cluster"
                  ? NUDGE_COMPOSER.clusters[1]
                  : `${STUDENTS[0]?.name ?? ""} · ${STUDENTS[0]?.rollNo ?? ""}`
              }
            />
            <SelectField
              aria-label="Choose nudge template"
              onChange={setTemplate}
              options={NUDGE_COMPOSER.templates}
              value={template}
            />
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Channels</p>
              <div className="flex flex-wrap gap-4">
                {NUDGE_COMPOSER.channels.map((channel) => (
                  <label key={channel} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox defaultChecked />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Delivery</p>
              <div className="flex flex-wrap gap-2">
                {NUDGE_COMPOSER.schedulingModes.map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setScheduleMode(mode)}
                    variant={scheduleMode === mode ? "secondary" : "ghost"}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                {scheduleMode === "Schedule"
                  ? "Queued for 10 Apr 2026 · 09:30 AM"
                  : "Message will be dispatched immediately after approval."}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
            <div className="space-y-1">
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>Personalized message rendered from the selected template.</CardDescription>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <p className="text-sm leading-6 text-foreground">{NUDGE_COMPOSER.preview}</p>
            </div>
            <Button>
              <Send className="h-4 w-4" />
              Send Nudge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
