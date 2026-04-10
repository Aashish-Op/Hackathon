"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

export function ChartContainer({
  children,
  className,
  height = "100%",
  width = "100%",
}: {
  children: React.ReactNode;
  className?: string;
  height?: number | `${number}%`;
  width?: number | `${number}%`;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" className={cn("h-full w-full rounded-2xl bg-muted/40", className)} />;
  }

  return <ResponsiveContainer height={height} width={width}>{children}</ResponsiveContainer>;
}
