"use client";

import { useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { MultiSelectGroup } from "@/components/profile/multi-select-group";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function JobPreferencesSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register, watch, setValue } = useFormContext<ProfileBuilderFormValues>();
  const ctcRange = watch("preferences.ctcRange");

  return (
    <SectionShell title="Job Preferences" {...props}>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Target Roles</p>
          <MultiSelectGroup
            control={control}
            disabled={!props.isEditing}
            name="preferences.targetRoles"
            options={STUDENT_PROFILE_OPTIONS.targetRoles}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Preferred Domain</p>
          <MultiSelectGroup
            control={control}
            disabled={!props.isEditing}
            name="preferences.preferredDomains"
            options={STUDENT_PROFILE_OPTIONS.preferredDomains}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Preferred Location</p>
          <MultiSelectGroup
            control={control}
            disabled={!props.isEditing}
            name="preferences.preferredLocations"
            options={STUDENT_PROFILE_OPTIONS.preferredLocations}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            disabled={!props.isEditing}
            type="number"
            value={ctcRange[0]}
            onChange={(event) =>
              setValue("preferences.ctcRange", [Number(event.target.value), ctcRange[1]], {
                shouldDirty: true,
              })
            }
          />
          <Input
            disabled={!props.isEditing}
            type="number"
            value={ctcRange[1]}
            onChange={(event) =>
              setValue("preferences.ctcRange", [ctcRange[0], Number(event.target.value)], {
                shouldDirty: true,
              })
            }
          />
        </div>
        <p className="text-sm text-sky-300">{`INR ${ctcRange[0]}-${ctcRange[1]} LPA`}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Switch
            checked={watch("preferences.openToRelocation")}
            disabled={!props.isEditing}
            label="Open to relocation"
            onChange={(event) =>
              setValue("preferences.openToRelocation", event.target.checked, {
                shouldDirty: true,
              })
            }
          />
          <select
            className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
            disabled={!props.isEditing}
            {...register("preferences.noticePeriod")}
          >
            {STUDENT_PROFILE_OPTIONS.noticePeriods.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Work Mode Preference</p>
          <div className="flex flex-wrap gap-3">
            {STUDENT_PROFILE_OPTIONS.workModes.map((mode) => (
              <label key={mode} className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  disabled={!props.isEditing}
                  type="radio"
                  value={mode}
                  {...register("preferences.workModePreference")}
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-foreground">
          {`Based on your skills, you match ${watch("preferences.aiMatchScore")}% with SDE roles at Product companies.`}
        </div>
      </div>
    </SectionShell>
  );
}
