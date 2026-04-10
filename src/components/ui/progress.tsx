import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value?: number;
  indicatorClassName?: string;
};

export function Progress({ className, value = 0, indicatorClassName, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-none bg-[#151521]", className)}
      {...props}
    >
      <div
        className={cn("h-full bg-[var(--accent)] transition-[width] duration-500 ease-out", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
