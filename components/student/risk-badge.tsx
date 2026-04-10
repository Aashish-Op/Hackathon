import { Badge } from "@/components/ui/badge";

const riskToneMap = {
  critical: "rose",
  high: "rose",
  medium: "amber",
  low: "slate",
  ready: "emerald",
} as const;

const riskLabelMap = {
  critical: "Critical",
  high: "High-Risk",
  medium: "At-Risk",
  low: "Inactive",
  ready: "Placement Ready",
} as const;

export function RiskBadge({
  level,
}: {
  level: "critical" | "high" | "medium" | "low" | "ready";
}) {
  return (
    <Badge className="gap-2" tone={riskToneMap[level]}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
      {riskLabelMap[level]}
    </Badge>
  );
}
