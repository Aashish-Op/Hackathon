"use client";

import type { ProfileBuilderFormValues } from "@/types";
import { StudentIcon } from "@/components/student/icon-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfilePreviewModal({
  open,
  onClose,
  values,
}: {
  open: boolean;
  onClose: () => void;
  values: ProfileBuilderFormValues;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close profile preview"
        className="absolute inset-0 bg-background/80"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-4 overflow-y-auto rounded-3xl border border-border bg-card p-6 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              Recruiter Preview
            </p>
            <h2 className="text-2xl font-semibold text-foreground">{values.basic.fullName}</h2>
          </div>
          <Button onClick={onClose} variant="outline">
            <StudentIcon name="X" />
            Close
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Profile Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{`${values.basic.rollNumber} · ${values.basic.department}`}</p>
              <p>{`CGPA ${values.academic.cgpa}`}</p>
              <p>{`${values.projects.length} projects · ${values.certifications.length} certifications`}</p>
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {values.projects.map((project) => (
                <div key={project.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <Badge key={tech} tone="default">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
