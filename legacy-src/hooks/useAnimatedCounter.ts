"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedCounter(
  target: number,
  duration: number = 2000,
  startOnMount: boolean = false
): { count: number; start: () => void; ref: React.RefObject<HTMLElement | null> } {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(startOnMount);
  const ref = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number>(0);

  const start = () => setHasStarted(true);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hasStarted, target, duration]);

  return { count, start, ref };
}
