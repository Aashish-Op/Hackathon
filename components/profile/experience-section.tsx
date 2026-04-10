"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { SectionShell } from "@/components/profile/section-shell";
import { TagInputField } from "@/components/profile/tag-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ExperienceSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register } = useFormContext<ProfileBuilderFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "experience" });

  return (
    <SectionShell title="Internships / Experience" {...props}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={!props.isEditing} {...register(`experience.${index}.companyName` as const)} placeholder="Company Name" />
              <Input disabled={!props.isEditing} {...register(`experience.${index}.role` as const)} placeholder="Role / Designation" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
                disabled={!props.isEditing}
                {...register(`experience.${index}.employmentType` as const)}
              >
                {STUDENT_PROFILE_OPTIONS.employmentTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input disabled={!props.isEditing} {...register(`experience.${index}.location` as const)} placeholder="Location" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input disabled={!props.isEditing} type="month" {...register(`experience.${index}.startDate` as const)} />
              <Input disabled={!props.isEditing} type="month" {...register(`experience.${index}.endDate` as const)} />
            </div>
            <Textarea disabled={!props.isEditing} {...register(`experience.${index}.description` as const)} />
            <TagInputField
              control={control}
              disabled={!props.isEditing}
              name={`experience.${index}.skillsUsed` as const}
              placeholder="Add skills used"
            />
            {props.isEditing ? (
              <Button onClick={() => remove(index)} type="button" variant="ghost">
                Remove Experience
              </Button>
            ) : null}
          </div>
        ))}
        {props.isEditing ? (
          <Button
            onClick={() =>
              append({
                id: `exp-${Date.now()}`,
                companyName: "",
                role: "",
                employmentType: "Internship",
                startDate: "2026-04",
                endDate: "",
                present: false,
                location: "",
                remote: false,
                description: "",
                stipend: 0,
                offerLetterUrl: "",
                skillsUsed: [],
              })
            }
            type="button"
            variant="outline"
          >
            + Add Experience
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
