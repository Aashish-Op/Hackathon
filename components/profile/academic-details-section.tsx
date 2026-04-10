"use client";

import { useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { FieldError } from "@/components/profile/field-error";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";

export function AcademicDetailsSection(props: {
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

  const cgpa = watch("academic.cgpa");
  const activeBacklogs = watch("academic.activeBacklogs");

  return (
    <SectionShell title="Academic Details" {...props}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input disabled={!props.isEditing} step="0.1" type="number" {...register("academic.cgpa", { valueAsNumber: true })} />
          <p className={cgpa > 7.5 ? "text-xs text-emerald-400" : cgpa >= 6 ? "text-xs text-amber-400" : "text-xs text-rose-400"}>
            {cgpa > 7.5 ? "Strong CGPA" : cgpa >= 6 ? "Moderate CGPA" : "Some companies may screen this out"}
          </p>
          <FieldError message={errors.academic?.cgpa?.message} />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} step="0.1" type="number" {...register("academic.tenthPercentage", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} step="0.1" type="number" {...register("academic.twelfthPercentage", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} type="number" {...register("academic.activeBacklogs", { valueAsNumber: true })} />
          <p className={activeBacklogs === 0 ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
            {activeBacklogs === 0 ? "No active backlog risk" : "Active backlogs can block company eligibility"}
          </p>
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} type="number" {...register("academic.historicalBacklogs", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Input disabled={!props.isEditing} {...register("academic.specialization")} placeholder="Specialization / Elective Stream" />
        </div>
        <div className="space-y-2">
          <Input disabled {...register("academic.collegeName")} />
        </div>
        <div className="space-y-2">
          <Input disabled {...register("academic.university")} />
        </div>
      </div>
    </SectionShell>
  );
}
