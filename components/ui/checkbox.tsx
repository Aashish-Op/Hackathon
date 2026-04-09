import * as React from "react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-border bg-muted text-violet-500 accent-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
