"use client";

import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium" | "low" | string;

const COLORS: Record<"critical" | "high" | "medium" | "low", string> = {
  critical: "#C0392B",
  high: "#E67E22",
  medium: "#F39C12",
  low: "#27AE60",
};

function normalizeSeverity(value: Severity): keyof typeof COLORS {
  const normalized = value.toLowerCase();
  if (normalized === "critical" || normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }

  return "medium";
}

export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const normalized = normalizeSeverity(severity);

  return (
    <span
      aria-hidden
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{ backgroundColor: COLORS[normalized] }}
    />
  );
}
