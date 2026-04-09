"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" && [
            "bg-gray-900 text-white",
            "hover:bg-gray-800 active:bg-gray-950 shadow-lg hover:shadow-xl",
            "active:scale-[0.98]",
          ],
          variant === "ghost" && [
            "bg-transparent text-gray-700 border border-gray-300",
            "hover:bg-gray-100 hover:border-gray-400",
            "active:scale-[0.98]",
          ],
          size === "sm" && "px-4 py-2 text-xs font-medium",
          size === "md" && "px-6 py-2.5 text-sm",
          size === "lg" && "px-8 py-3.5 text-base",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
