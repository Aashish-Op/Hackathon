"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { SectionShell } from "@/components/profile/section-shell";
import { TagInputField } from "@/components/profile/tag-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProjectsSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register, watch } = useFormContext<ProfileBuilderFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "projects" });

  return (
    <SectionShell title="Projects" {...props}>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const description = watch(`projects.${index}.description` as const) ?? "";

          return (
            <div key={field.id} className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input disabled={!props.isEditing} {...register(`projects.${index}.title` as const)} placeholder="Project Title" />
                <select
                  className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
                  disabled={!props.isEditing}
                  {...register(`projects.${index}.type` as const)}
                >
                  {STUDENT_PROFILE_OPTIONS.projectTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Textarea disabled={!props.isEditing} {...register(`projects.${index}.description` as const)} maxLength={200} />
                <p className="text-xs text-muted-foreground">{`${description.length}/200 characters`}</p>
              </div>
              <TagInputField
                control={control}
                disabled={!props.isEditing}
                name={`projects.${index}.techStack` as const}
                placeholder="Add tech stack"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input disabled={!props.isEditing} {...register(`projects.${index}.demoUrl` as const)} placeholder="Live Demo URL" />
                <Input disabled={!props.isEditing} {...register(`projects.${index}.githubUrl` as const)} placeholder="GitHub URL" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input disabled={!props.isEditing} type="month" {...register(`projects.${index}.startDate` as const)} />
                <Input disabled={!props.isEditing} type="month" {...register(`projects.${index}.endDate` as const)} />
                <Input disabled={!props.isEditing} type="number" {...register(`projects.${index}.teamSize` as const, { valueAsNumber: true })} placeholder="Team Size" />
              </div>
              <Input disabled={!props.isEditing} {...register(`projects.${index}.achievement` as const)} placeholder="Key achievement" />
              {props.isEditing ? (
                <Button onClick={() => remove(index)} type="button" variant="ghost">
                  Remove Project
                </Button>
              ) : null}
            </div>
          );
        })}
        {props.isEditing ? (
          <Button
            onClick={() =>
              append({
                id: `project-${Date.now()}`,
                title: "",
                description: "",
                techStack: [],
                demoUrl: "",
                githubUrl: "",
                type: "Personal",
                startDate: "2026-04",
                endDate: "",
                ongoing: false,
                teamSize: 1,
                achievement: "",
              })
            }
            type="button"
            variant="outline"
          >
            + Add Project
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
