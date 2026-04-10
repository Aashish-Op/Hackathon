"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <TooltipContext.Provider value={value}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const context = useContext(TooltipContext);
  if (!context) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  }

  return (
    <span
      tabIndex={0}
      className={cn("cursor-help underline decoration-dotted underline-offset-4", className)}
      onMouseEnter={() => context.setOpen(true)}
      onMouseLeave={() => context.setOpen(false)}
      onFocus={() => context.setOpen(true)}
      onBlur={() => context.setOpen(false)}
      {...props}
    >
      {children}
    </span>
  );
}

export function TooltipContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(TooltipContext);
  if (!context?.open) {
    return null;
  }

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute left-1/2 top-full z-20 mt-2 w-max max-w-64 -translate-x-1/2 border border-[#1F1F2E] bg-[#11111A] px-3 py-2 text-xs text-[#D6D0C5]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
