"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ContestRatingsSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register } = useFormContext<ProfileBuilderFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "contests" });

  return (
    <SectionShell title="Coding Contest Ratings" {...props}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
            <select
              className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
              disabled={!props.isEditing}
              {...register(`contests.${index}.platform` as const)}
            >
              {STUDENT_PROFILE_OPTIONS.contestPlatforms.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Input disabled={!props.isEditing} type="number" {...register(`contests.${index}.rating` as const, { valueAsNumber: true })} />
            <Input disabled={!props.isEditing} {...register(`contests.${index}.rank` as const)} placeholder="Rank / Badge" />
            <Input disabled={!props.isEditing} type="number" {...register(`contests.${index}.percentile` as const, { valueAsNumber: true })} placeholder="Percentile" />
            <Input disabled={!props.isEditing} {...register(`contests.${index}.contestName` as const)} placeholder="Contest Name" />
            <Input disabled={!props.isEditing} type="date" {...register(`contests.${index}.date` as const)} />
            {props.isEditing ? (
              <div className="md:col-span-2">
                <Button onClick={() => remove(index)} type="button" variant="ghost">
                  Delete Entry
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {props.isEditing ? (
          <Button
            onClick={() =>
              append({
                id: `contest-${Date.now()}`,
                platform: "LeetCode",
                rating: 0,
                rank: "",
                percentile: 0,
                contestName: "",
                date: "2026-04-10",
              })
            }
            type="button"
            variant="outline"
          >
            + Add Contest Rating
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
