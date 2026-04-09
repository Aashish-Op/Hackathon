"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "ghost"
  | "outline"
  | "secondary"
  | "warning"
  | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
  ghost:
    "bg-transparent text-foreground hover:bg-muted focus-visible:ring-violet-500",
  outline:
    "border border-border bg-card text-card-foreground hover:bg-muted focus-visible:ring-violet-500",
  secondary:
    "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-violet-500",
  warning:
    "border border-amber-500/30 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 focus-visible:ring-violet-500",
  danger:
    "border border-rose-500/30 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 focus-visible:ring-violet-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "h-10 w-10 rounded-xl p-0",
};

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button };
