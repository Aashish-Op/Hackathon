"use client";

import { cn } from "@/lib/utils";

function toneClass(score: number): string {
  if (score < 35) {
    return "bg-red-500";
  }

  if (score <= 65) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

export function ScoreBar({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[rgba(26,26,26,0.12)]", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-300", toneClass(normalized))} style={{ width: `${normalized}%` }} />
    </div>
  );
}
