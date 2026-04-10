"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> & {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
};

export function Slider({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: SliderProps) {
  const minValue = typeof min === "number" ? min : Number(min ?? 0);
  const maxValue = typeof max === "number" ? max : Number(max ?? 100);
  const stepValue = typeof step === "number" ? step : Number(step ?? 1);

  const initial = defaultValue?.[0] ?? minValue;
  const [internalValue, setInternalValue] = useState(initial);

  const current = value?.[0] ?? internalValue;
  const percent = useMemo(() => {
    if (maxValue === minValue) return 0;
    const ratio = (current - minValue) / (maxValue - minValue);
    return Math.max(0, Math.min(100, ratio * 100));
  }, [current, maxValue, minValue]);

  return (
    <input
      type="range"
      min={minValue}
      max={maxValue}
      step={stepValue}
      value={current}
      disabled={disabled}
      className={cn("vigilo-slider h-1.5 w-full appearance-none rounded-none", className)}
      style={{
        background: `linear-gradient(to right, var(--red) 0%, var(--red) ${percent}%, rgba(26,26,26,0.18) ${percent}%, rgba(26,26,26,0.18) 100%)`,
      }}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (value === undefined) {
          setInternalValue(next);
        }
        onValueChange?.([next]);
      }}
      {...props}
    />
  );
}
