"use client";

import { useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { SectionShell } from "@/components/profile/section-shell";
import { TagInputField } from "@/components/profile/tag-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function AdditionalDetailsSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register, setValue, watch } = useFormContext<ProfileBuilderFormValues>();

  return (
    <SectionShell title="Emergency / Additional" {...props}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input disabled={!props.isEditing} {...register("additional.fatherName")} placeholder="Father's Name" />
        <Input disabled={!props.isEditing} {...register("additional.motherName")} placeholder="Mother's Name" />
        <Input disabled={!props.isEditing} {...register("additional.parentContactNumber")} placeholder="Parent Contact Number" />
        <select
          className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
          disabled={!props.isEditing}
          {...register("additional.category")}
        >
          {STUDENT_PROFILE_OPTIONS.categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="md:col-span-2">
          <Textarea disabled={!props.isEditing} {...register("additional.permanentAddress")} />
        </div>
        <Switch
          checked={watch("additional.differentlyAbled")}
          disabled={!props.isEditing}
          label="Differently Abled"
          onChange={(event) =>
            setValue("additional.differentlyAbled", event.target.checked, { shouldDirty: true })
          }
        />
        <Switch
          checked={watch("additional.passportAvailable")}
          disabled={!props.isEditing}
          label="Passport available"
          onChange={(event) =>
            setValue("additional.passportAvailable", event.target.checked, { shouldDirty: true })
          }
        />
        {watch("additional.differentlyAbled") ? (
          <Input
            disabled={!props.isEditing}
            {...register("additional.differentlyAbledDetails")}
            placeholder="Specify details"
          />
        ) : null}
        <div className="md:col-span-2">
          <TagInputField
            control={control}
            disabled={!props.isEditing}
            name="additional.languages"
            placeholder="Add language"
          />
        </div>
        <div className="md:col-span-2">
          <TagInputField
            control={control}
            disabled={!props.isEditing}
            name="additional.hobbies"
            placeholder="Add hobby or interest"
          />
        </div>
      </div>
    </SectionShell>
  );
}
