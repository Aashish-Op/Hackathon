"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
  className?: string;
}

const colorMap = {
  indigo: "bg-indigo/15 text-indigo-light border-indigo/20",
  emerald: "bg-emerald/15 text-emerald-light border-emerald/20",
  amber: "bg-amber/15 text-amber-light border-amber/20",
  rose: "bg-rose/15 text-rose-light border-rose/20",
  cyan: "bg-cyan/15 text-cyan border-cyan/20",
};

export function Badge({ children, color = "indigo", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all duration-300",
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
