import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ComponentProps<"input">, "type"> {
  label: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => (
    <label className={cn("inline-flex items-center gap-3", className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="relative h-6 w-11 rounded-full bg-muted transition-colors duration-150 peer-checked:bg-violet-600 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition-transform before:duration-150 peer-checked:before:translate-x-5" />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  ),
);
Switch.displayName = "Switch";
