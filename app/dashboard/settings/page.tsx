"use client";

import * as React from "react";

import {
  INTEGRATIONS,
  INTEGRATION_STATUS_TONES,
  SETTINGS_DATA,
  TPC_TEAM,
} from "@/lib/constants";
import { AppIcon, SeverityBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SettingsPage() {
  const [critical, setCritical] = React.useState(SETTINGS_DATA.aiConfiguration.thresholds.critical);
  const [highRisk, setHighRisk] = React.useState(SETTINGS_DATA.aiConfiguration.thresholds.highRisk);
  const [atRisk, setAtRisk] = React.useState(SETTINGS_DATA.aiConfiguration.thresholds.atRisk);
  const [confidenceEnabled, setConfidenceEnabled] = React.useState(
    SETTINGS_DATA.aiConfiguration.confidenceThresholdEnabled,
  );
  const [confidence, setConfidence] = React.useState(
    SETTINGS_DATA.aiConfiguration.confidenceThreshold,
  );
  const [frequency, setFrequency] = React.useState(SETTINGS_DATA.aiConfiguration.selectedFrequency);
  const [recipients, setRecipients] = React.useState(
    SETTINGS_DATA.notifications.alertRecipients,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Tune score thresholds, clustering cadence, and model confidence rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Critical (&lt; {critical})</span>
                <span className="text-muted-foreground">{critical}</span>
              </div>
              <input
                className="range-input"
                max={50}
                min={10}
                onChange={(event) => setCritical(Number(event.target.value))}
                type="range"
                value={critical}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">High Risk (&lt; {highRisk})</span>
                <span className="text-muted-foreground">{highRisk}</span>
              </div>
              <input
                className="range-input"
                max={70}
                min={20}
                onChange={(event) => setHighRisk(Number(event.target.value))}
                type="range"
                value={highRisk}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">At-Risk (&lt; {atRisk})</span>
                <span className="text-muted-foreground">{atRisk}</span>
              </div>
              <input
                className="range-input"
                max={85}
                min={35}
                onChange={(event) => setAtRisk(Number(event.target.value))}
                type="range"
                value={atRisk}
              />
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-muted/20 p-5">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Clustering frequency</p>
              <div className="flex flex-wrap gap-3">
                {SETTINGS_DATA.aiConfiguration.frequencyOptions.map((option) => (
                  <label
                    key={option}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    <input
                      checked={frequency === option}
                      className="accent-violet-500"
                      name="clustering-frequency"
                      onChange={() => setFrequency(option)}
                      type="radio"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Switch
                checked={confidenceEnabled}
                label="Enable model confidence threshold"
                onChange={(event) => setConfidenceEnabled(event.target.checked)}
              />
              <Input
                max={100}
                min={50}
                onChange={(event) => setConfidence(Number(event.target.value))}
                type="number"
                value={confidence}
              />
            </div>
            <Button variant="danger">{SETTINGS_DATA.aiConfiguration.retrainLabel}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control alert recipients and automated communication channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {SETTINGS_DATA.notifications.toggles.map((toggle) => (
              <div
                key={toggle.label}
                className="rounded-2xl border border-border bg-muted/20 p-4"
              >
                <Switch defaultChecked={toggle.enabled} label={toggle.label} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Alert recipients</p>
            <Input
              onChange={(event) => setRecipients(event.target.value)}
              value={recipients}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connected systems feeding the PlaceGuard intelligence layer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.id}
              className="rounded-2xl border border-border bg-muted/20 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-border bg-card p-3 text-violet-300">
                    <AppIcon className="h-5 w-5" name={integration.icon} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.lastSync}</p>
                  </div>
                </div>
                <SeverityBadge
                  label={integration.status}
                  tone={INTEGRATION_STATUS_TONES[integration.status]}
                />
              </div>
              <div className="mt-4">
                <Button variant="outline">Configure</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>TPC Team</CardTitle>
            <CardDescription>Officer access, student allocation, and dashboard permissions.</CardDescription>
          </div>
          <Button>Invite Officer</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TPC_TEAM.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.assignedStudents}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost">Edit</Button>
                      <Button variant="ghost">Remove</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
