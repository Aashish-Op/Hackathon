"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";
import {
  CTA_HEADING,
  CTA_SUBTEXT,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from "@/lib/constants";

export function CTA() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="cta"
      className="relative py-24 md:py-32"
      aria-label="Call to action"
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo/[0.06] blur-[120px]" />
        <div className="absolute left-1/4 bottom-0 w-[300px] h-[300px] rounded-full bg-emerald/[0.04] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="glass-strong rounded-3xl p-12 md:p-20 text-center border border-indigo/10 relative overflow-hidden"
        >
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo/[0.08] blur-[100px] pointer-events-none" />

          <div className="relative">
            <motion.h2
              variants={staggerItem}
              className="text-[clamp(1.75rem,4vw,3.5rem)] font-bold text-white tracking-tight mb-4"
            >
              {CTA_HEADING}
            </motion.h2>

            <motion.p
              variants={staggerItem}
              className="text-white/50 max-w-lg mx-auto mb-10 text-lg"
            >
              {CTA_SUBTEXT}
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" aria-label={CTA_PRIMARY}>
                {CTA_PRIMARY}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" aria-label={CTA_SECONDARY}>
                <Download className="h-4 w-4" />
                {CTA_SECONDARY}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
