"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Button } from "@/components/ui/button";

export function MultiSelectGroup<TFieldValues extends FieldValues>({
  control,
  name,
  options,
  disabled = false,
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = Array.isArray(field.value) ? (field.value as string[]) : [];

        return (
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const selected = value.includes(option);

              return (
                <Button
                  key={option}
                  disabled={disabled}
                  onClick={() =>
                    field.onChange(
                      selected
                        ? value.filter((entry) => entry !== option)
                        : [...value, option],
                    )
                  }
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        );
      }}
    />
  );
}
