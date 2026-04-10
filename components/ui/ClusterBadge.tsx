"use client";

import { cn } from "@/lib/utils";

type ClusterName = "placement_ready" | "at_risk" | "silent_dropout" | string;

function normalizeCluster(cluster: ClusterName): "placement_ready" | "at_risk" | "silent_dropout" | "unknown" {
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

function labelForCluster(cluster: ReturnType<typeof normalizeCluster>): string {
  if (cluster === "placement_ready") {
    return "Placement Ready";
  }

  if (cluster === "at_risk") {
    return "At Risk";
  }

  if (cluster === "silent_dropout") {
    return "Silent Dropout";
  }

  return "Unknown";
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

  return "border-slate-300 bg-slate-100 text-slate-700";
}

export function ClusterBadge({
  cluster,
  className,
}: {
  cluster: ClusterName;
  className?: string;
}) {
  const normalized = normalizeCluster(cluster);

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        classForCluster(normalized),
        className,
      )}
    >
      {labelForCluster(normalized)}
    </span>
  );
}
