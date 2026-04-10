"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function SkeletonRow({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-[rgba(26,26,26,0.1)]", className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-3 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-[rgba(26,26,26,0.08)]" />
        </td>
      ))}
    </tr>
  );
}
