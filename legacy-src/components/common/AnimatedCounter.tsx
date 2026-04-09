"use client";

import React from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useInView } from "@/hooks/useInView";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
  className = "",
}: AnimatedCounterProps) {
  const { ref, isInView } = useInView({ once: true, margin: "0px" });
  const { count, start } = useAnimatedCounter(target, duration);

  React.useEffect(() => {
    if (isInView) start();
  }, [isInView, start]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
