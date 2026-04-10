import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeTone =
  | "default"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "blue";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-border bg-muted text-muted-foreground",
  violet: "border-red-500/25 bg-red-500/10 text-red-700",
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  amber: "border-amber-500/25 bg-amber-500/12 text-amber-700",
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-700",
  slate: "border-slate-500/25 bg-slate-500/10 text-slate-700",
  blue: "border-sky-500/25 bg-sky-500/10 text-sky-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: BadgeTone;
  variant?: "default" | "outline";
}

export function Badge({
  className,
  tone = "default",
  variant = "outline",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
        variant === "outline" ? toneClasses[tone] : "bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
