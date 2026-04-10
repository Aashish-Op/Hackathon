"use client";

import { useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { FieldError } from "@/components/profile/field-error";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";

export function BasicInfoSection(props: {
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

  const photoUrl = watch("basic.profilePhotoUrl");

  return (
    <SectionShell title="Basic Info" {...props}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input disabled={!props.isEditing} {...register("basic.fullName")} placeholder="Full Name" />
          <FieldError message={errors.basic?.fullName?.message} />
        </div>
        <div className="space-y-2">
          <Input disabled {...register("basic.rollNumber")} placeholder="Roll Number" />
          <FieldError message={errors.basic?.rollNumber?.message} />
        </div>
        <div className="space-y-2">
          <select
            className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
            disabled={!props.isEditing}
            {...register("basic.department")}
          >
            {STUDENT_PROFILE_OPTIONS.departments.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={errors.basic?.department?.message} />
        </div>
        <div className="space-y-2">
          <select
            className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
            disabled={!props.isEditing}
            {...register("basic.yearOfStudy")}
          >
            {STUDENT_PROFILE_OPTIONS.years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Input
            disabled={!props.isEditing}
            {...register("basic.expectedGraduation")}
            placeholder="Expected Graduation"
          />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} {...register("basic.dateOfBirth")} type="date" />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} {...register("basic.phoneNumber")} type="tel" />
          <FieldError message={errors.basic?.phoneNumber?.message} />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {STUDENT_PROFILE_OPTIONS.genders.map((gender) => (
              <label key={gender} className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  disabled={!props.isEditing}
                  type="radio"
                  value={gender}
                  {...register("basic.gender")}
                />
                <span>{gender}</span>
              </label>
            ))}
          </div>
          <FieldError message={errors.basic?.gender?.message} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Input
            disabled={!props.isEditing}
            {...register("basic.profilePhotoUrl")}
            placeholder="Profile photo URL"
          />
          <FieldError message={errors.basic?.profilePhotoUrl?.message} />
          {photoUrl ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Photo preview URL ready: {photoUrl}
            </div>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}
