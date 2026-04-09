"use client";

import { useInView as useFramerInView } from "framer-motion";
import { useRef } from "react";

interface UseInViewOptions {
  once?: boolean;
  margin?: `${number}${"px" | "%"}`;
  amount?: number | "some" | "all";
}

export function useInView(options: UseInViewOptions = {}) {
  const { once = true, margin = "-100px" as const, amount = "some" } = options;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useFramerInView(ref, { once, margin, amount });

  return { ref, isInView };
}
