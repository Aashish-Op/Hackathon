import { cn } from "@/lib/utils";

const markerClasses = {
  0: "left-0",
  5: "left-[5%]",
  10: "left-[10%]",
  15: "left-[15%]",
  20: "left-[20%]",
  25: "left-[25%]",
  30: "left-[30%]",
  35: "left-[35%]",
  40: "left-[40%]",
  45: "left-[45%]",
  50: "left-[50%]",
  55: "left-[55%]",
  60: "left-[60%]",
  65: "left-[65%]",
  70: "left-[70%]",
  75: "left-[75%]",
  80: "left-[80%]",
  85: "left-[85%]",
  90: "left-[90%]",
  95: "left-[95%]",
  100: "left-[100%]",
} as const;

function roundToFive(value: number): keyof typeof markerClasses {
  const clamped = Math.max(0, Math.min(100, value));
  const rounded = Math.round(clamped / 5) * 5;
  return rounded as keyof typeof markerClasses;
}

export function CohortPercentileBar({
  percentile,
  label,
}: {
  percentile: number;
  label: string;
}) {
  const markerClass = markerClasses[roundToFive(percentile)];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-sm font-semibold text-sky-300">{`Top ${percentile}%`}</p>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full border border-border">
        <div className="grid h-full grid-cols-3">
          <div className="bg-rose-500/40" />
          <div className="bg-amber-500/40" />
          <div className="bg-emerald-500/40" />
        </div>
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
            markerClass,
          )}
        >
          <div className="flex flex-col items-center">
            <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-violet-400" />
            <span className="mt-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
              You
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
