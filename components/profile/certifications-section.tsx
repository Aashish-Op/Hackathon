"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { STUDENT_PROFILE_OPTIONS } from "@/lib/constants";
import { SectionShell } from "@/components/profile/section-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CertificationsSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const { control, register } = useFormContext<ProfileBuilderFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications",
  });

  return (
    <SectionShell title="Certifications" {...props}>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-2xl border border-border bg-muted/20 p-4">
            <div className="space-y-3">
              <Input disabled={!props.isEditing} {...register(`certifications.${index}.name` as const)} placeholder="Certificate Name" />
              <Input disabled={!props.isEditing} {...register(`certifications.${index}.organization` as const)} placeholder="Issuing Organization" />
              <div className="grid gap-3 md:grid-cols-2">
                <Input disabled={!props.isEditing} type="date" {...register(`certifications.${index}.issueDate` as const)} />
                <Input disabled={!props.isEditing} type="date" {...register(`certifications.${index}.expiryDate` as const)} />
              </div>
              <select
                className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
                disabled={!props.isEditing}
                {...register(`certifications.${index}.category` as const)}
              >
                {STUDENT_PROFILE_OPTIONS.certificateCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input disabled={!props.isEditing} {...register(`certifications.${index}.url` as const)} placeholder="Certificate URL" />
              {props.isEditing ? (
                <Button onClick={() => remove(index)} type="button" variant="ghost">
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {props.isEditing ? (
        <>
          <Button onClick={() => setSheetOpen(true)} type="button" variant="outline">
            + Add Certificate
          </Button>
          {sheetOpen ? (
            <div className="fixed inset-0 z-50">
              <button
                aria-label="Close certificate sheet"
                className="absolute inset-0 bg-background/80"
                onClick={() => setSheetOpen(false)}
                type="button"
              />
              <div className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-border bg-card p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Add Certificate</h3>
                  <Button
                    onClick={() => {
                      append({
                        id: `cert-${Date.now()}`,
                        name: "New Certificate",
                        organization: "Organization",
                        issueDate: "2026-04-10",
                        expiryDate: "",
                        noExpiry: false,
                        credentialId: "",
                        url: "",
                        category: "Other",
                        relevance: "suggested",
                      });
                      setSheetOpen(false);
                    }}
                    type="button"
                  >
                    Add Empty Certificate
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </SectionShell>
  );
}
