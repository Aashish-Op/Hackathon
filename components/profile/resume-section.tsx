"use client";

import { useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { SectionShell } from "@/components/profile/section-shell";
import { FieldError } from "@/components/profile/field-error";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function ResumeSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<ProfileBuilderFormValues>();

  const resumeLink = watch("resume.resumeLink");
  const atsScore = watch("resume.atsScore");
  const checklist = watch("resume.checklist");

  return (
    <SectionShell title="Resume" {...props}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Input disabled={!props.isEditing} {...register("resume.resumeLink")} placeholder="Resume public link" />
          <FieldError message={errors.resume?.resumeLink?.message} />
        </div>
        {resumeLink ? (
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="font-medium text-foreground">Resume preview</p>
            <p className="mt-1 text-sm text-muted-foreground">{resumeLink}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={atsScore >= 70 ? "emerald" : "amber"}>{`${atsScore}/100 ATS Score`}</Badge>
              <Badge tone="amber">Last updated 23 days ago</Badge>
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <p className="text-sm font-medium text-foreground">AI resume checklist</p>
          <div className="mt-3 space-y-2">
            {checklist.map((item, index) => (
              <label key={item.id} className="flex items-center gap-3 text-sm text-foreground">
                <input
                  disabled={!props.isEditing}
                  type="checkbox"
                  {...register(`resume.checklist.${index}.completed` as const)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
