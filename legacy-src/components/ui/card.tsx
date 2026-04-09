"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverLift?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ glow = false, hoverLift = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass rounded-2xl p-6 transition-all duration-300",
          hoverLift && "hover:-translate-y-1 hover:bg-white/[0.06]",
          glow && "animate-glow",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
