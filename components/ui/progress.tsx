import { cn } from "@/lib/utils";

type ProgressTone = "emerald" | "amber" | "rose" | "slate" | "violet";

export function Progress({
  value,
  tone = "violet",
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <progress
      aria-label={ariaLabel}
      className={cn("progress-bar", className)}
      data-tone={tone}
      max={100}
      value={Math.min(100, Math.max(0, value))}
    />
  );
}
