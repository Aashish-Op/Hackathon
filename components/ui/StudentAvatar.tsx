"use client";

import { cn, getInitials } from "@/lib/utils";

type Cluster = "placement_ready" | "at_risk" | "silent_dropout" | string;
type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

function normalizeCluster(cluster: Cluster): "placement_ready" | "at_risk" | "silent_dropout" | "unknown" {
  const value = (cluster || "").toLowerCase();

  if (value.includes("placement") || value.includes("ready")) {
    return "placement_ready";
  }

  if (value.includes("silent") || value.includes("dropout")) {
    return "silent_dropout";
  }

  if (value.includes("risk")) {
    return "at_risk";
  }

  return "unknown";
}

function classForCluster(cluster: ReturnType<typeof normalizeCluster>): string {
  if (cluster === "placement_ready") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  if (cluster === "at_risk") {
    return "border-amber-300 bg-amber-100 text-amber-700";
  }

  if (cluster === "silent_dropout") {
    return "border-red-300 bg-red-100 text-red-700";
  }

  return "border-border bg-muted text-foreground";
}

export function StudentAvatar({
  name,
  cluster,
  size = "md",
  className,
}: {
  name: string;
  cluster?: Cluster;
  size?: AvatarSize;
  className?: string;
}) {
  const normalizedCluster = normalizeCluster(cluster || "");

  return (
    <div
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold",
        SIZE_CLASS[size],
        classForCluster(normalizedCluster),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
