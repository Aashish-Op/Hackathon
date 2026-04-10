import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border-[var(--ink)] bg-transparent text-[var(--ink)]",
  secondary: "border-[var(--muted)] bg-transparent text-[var(--muted)]",
  destructive: "border-[var(--red)] bg-transparent text-[var(--red)]",
} as const;

type BadgeVariant = keyof typeof badgeVariants;

export type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[3px] border px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.08em]",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
