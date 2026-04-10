"use client";

import * as React from "react";

import { formatRelativeDate, isDateOlderThanDays, parseDateInput } from "@/lib/date";
import { cn } from "@/lib/utils";

export function RelativeTime({
  value,
  className,
  fallback = "-",
}: {
  value: string | Date | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const date = React.useMemo(() => parseDateInput(value), [value]);
  const [label, setLabel] = React.useState(fallback);
  const [isStale, setIsStale] = React.useState(false);

  React.useEffect(() => {
    if (!date) {
      setLabel(fallback);
      setIsStale(false);
      return;
    }

    const apply = () => {
      setLabel(formatRelativeDate(date, fallback));
      setIsStale(isDateOlderThanDays(date, 30));
    };

    apply();
    const intervalId = window.setInterval(apply, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [date, fallback]);

  if (!date) {
    return <span className={cn("text-sm text-muted-foreground", className)}>{fallback}</span>;
  }

  return (
    <span className={cn("text-sm", isStale ? "text-red-700" : "text-muted-foreground", className)}>
      {label}
    </span>
  );
}
