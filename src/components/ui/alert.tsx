import { forwardRef } from "react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const alertVariants = {
  default: "border-[#1F1F2E] bg-[#101019] text-[#F0EDE6]",
  warning: "border-[#F59E0B] bg-[#1A1407] text-[#F8E5BE]",
  destructive: "border-[#EF4444] bg-[#240C0C] text-[#F8C7C7]",
} as const;

type AlertVariant = keyof typeof alertVariants;

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn("w-full border px-4 py-3", alertVariants[variant], className)}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 text-sm font-semibold", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";
