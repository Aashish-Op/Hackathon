"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Database, Brain, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { staggerContainer, staggerItem, fadeInUp, drawLine } from "@/lib/motion";
import { HOW_IT_WORKS_HEADING, HOW_IT_WORKS_STEPS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  Database,
  Brain,
  Zap,
};

export function HowItWorks() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32"
      aria-label="How it works"
    >
      {/* Ambient glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[600px] rounded-full bg-indigo/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Heading */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-20"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight">
            {HOW_IT_WORKS_HEADING}
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          {/* Connecting line between steps */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.line
                x1="0.5"
                y1="0"
                x2="0.5"
                y2="100%"
                stroke="rgba(99, 102, 241, 0.2)"
                strokeWidth="1"
                strokeDasharray="6 6"
                variants={drawLine}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              />
            </svg>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {HOW_IT_WORKS_STEPS.map((step, index) => {
              const Icon = iconMap[step.icon];
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  variants={staggerItem}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                    isEven ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "lg:text-right" : "lg:text-left"}`}>
                    <div className={`inline-block ${isEven ? "lg:ml-auto" : ""}`}>
                      <div className="glass rounded-2xl p-8 max-w-md relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        {/* Ghost number */}
                        <span className="absolute -top-4 -right-2 text-[120px] font-bold text-white/[0.03] leading-none pointer-events-none select-none">
                          {step.number}
                        </span>

                        <div className="relative">
                          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo/10 border border-indigo/20">
                            <Icon className="h-6 w-6 text-indigo" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-3">
                            {step.title}
                          </h3>
                          <p className="text-sm text-white/50 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-navy-800 border-2 border-indigo/40 z-10 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-indigo animate-pulse-slow" />
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
