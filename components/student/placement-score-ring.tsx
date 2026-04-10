"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { wrapper: "h-32 w-32", radius: 42, strokeWidth: 10, score: "text-2xl", sub: "text-[10px]" },
  md: { wrapper: "h-44 w-44", radius: 58, strokeWidth: 12, score: "text-4xl", sub: "text-xs" },
  lg: { wrapper: "h-56 w-56", radius: 72, strokeWidth: 14, score: "text-5xl", sub: "text-sm" },
} as const;

function resolveRingTone(score: number) {
  if (score < 40) {
    return {
      label: "HIGH-RISK",
      stroke: "var(--chart-rose)",
      text: "text-rose-400",
    };
  }

  if (score < 65) {
    return {
      label: "AT-RISK",
      stroke: "var(--chart-amber)",
      text: "text-amber-400",
    };
  }

  return {
    label: "READY",
    stroke: "var(--chart-emerald)",
    text: "text-emerald-400",
  };
}

export function PlacementScoreRing({
  score,
  size,
}: {
  score: number;
  size: "sm" | "md" | "lg";
}) {
  const [animatedScore, setAnimatedScore] = React.useState(0);
  const config = sizeMap[size];
  const tone = resolveRingTone(score);
  const circumference = 2 * Math.PI * config.radius;

  React.useEffect(() => {
    let frame = 0;
    let animationFrame = 0;
    const totalFrames = 36;

    const tick = () => {
      frame += 1;
      const nextValue = Math.round((score * frame) / totalFrames);
      setAnimatedScore(nextValue);

      if (frame < totalFrames) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", config.wrapper)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          fill="none"
          r={config.radius}
          stroke="var(--border)"
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx="90"
          cy="90"
          fill="none"
          r={config.radius}
          stroke={tone.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={config.strokeWidth}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className={cn("font-semibold text-foreground", config.score)}>{animatedScore}</p>
        <p className={cn("font-mono text-muted-foreground", config.sub)}>/100</p>
        <p className={cn("mt-2 text-[11px] font-semibold tracking-[0.22em]", tone.text)}>
          {tone.label}
        </p>
      </div>
    </div>
  );
}
