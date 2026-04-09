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
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  slate: "border-slate-500/20 bg-slate-500/10 text-slate-400",
  blue: "border-sky-500/20 bg-sky-500/10 text-sky-400",
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
