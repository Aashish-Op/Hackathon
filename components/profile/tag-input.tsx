"use client";

import * as React from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StudentIcon } from "@/components/student/icon-map";

export function TagInputField<TFieldValues extends FieldValues>({
  control,
  name,
  placeholder,
  disabled = false,
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  placeholder: string;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState("");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags = Array.isArray(field.value) ? (field.value as string[]) : [];

        function addTag() {
          const next = value.trim();

          if (disabled || !next || tags.includes(next)) {
            return;
          }

          field.onChange([...tags, next]);
          setValue("");
        }

        function removeTag(tag: string) {
          field.onChange(tags.filter((entry) => entry !== tag));
        }

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} className="gap-2" tone="default">
                  {tag}
                  <button
                    aria-label={`Remove ${tag}`}
                    className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    disabled={disabled}
                    onClick={() => removeTag(tag)}
                    type="button"
                  >
                    <StudentIcon className="h-3 w-3" name="X" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                disabled={disabled}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder={placeholder}
                value={value}
              />
              <button
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
                disabled={disabled}
                onClick={addTag}
                type="button"
              >
                Add
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
