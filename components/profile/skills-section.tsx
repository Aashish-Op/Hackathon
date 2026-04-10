"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const suggestedSkills = [
  "Python",
  "Java",
  "C++",
  "React",
  "Node.js",
  "SQL",
  "Machine Learning",
  "System Design",
  "DSA",
  "AWS",
];

export function SkillsSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register } = useFormContext<ProfileBuilderFormValues>();
  const technicalArray = useFieldArray({ control, name: "skills.technical" });

  return (
    <SectionShell title="Skills" {...props}>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Technical Skills</p>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills.map((skill) => (
              <Button
                key={skill}
                disabled={!props.isEditing}
                onClick={() => {
                  if (!technicalArray.fields.some((field) => field.name === skill)) {
                    technicalArray.append({
                      id: `tech-${Date.now()}-${skill}`,
                      name: skill,
                      selfRating: 3,
                      aiRating: 2.5,
                    });
                  }
                }}
                type="button"
                variant="outline"
              >
                {skill}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {technicalArray.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-[1fr_auto_auto_auto]">
                <Input disabled={!props.isEditing} {...register(`skills.technical.${index}.name` as const)} />
                <Input disabled={!props.isEditing} type="number" {...register(`skills.technical.${index}.selfRating` as const, { valueAsNumber: true })} />
                <Input disabled type="number" {...register(`skills.technical.${index}.aiRating` as const, { valueAsNumber: true })} />
                {props.isEditing ? (
                  <Button onClick={() => technicalArray.remove(index)} type="button" variant="ghost">
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Soft Skills</p>
          <div className="grid gap-3 md:grid-cols-2">
            {["Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Presentation Skills", "Critical Thinking"].map((label, index) => (
              <div key={label} className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
                  disabled={!props.isEditing}
                  {...register(`skills.soft.${index}.level` as const)}
                >
                  <option value="yes">Yes</option>
                  <option value="developing">Developing</option>
                  <option value="no">No</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
