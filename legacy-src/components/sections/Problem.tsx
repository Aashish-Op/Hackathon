"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { EyeOff, BellOff, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInView } from "@/hooks/useInView";
import { staggerContainer, staggerItem, fadeInUp, drawLine } from "@/lib/motion";
import { PROBLEM_HEADING, PROBLEM_CARDS, TIMELINE_STEPS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  EyeOff,
  BellOff,
  Clock,
};

const statusColors: Record<string, string> = {
  neutral: "bg-white/20 text-white/60 border-white/10",
  warning: "bg-amber/20 text-amber border-amber/30",
  danger: "bg-rose/20 text-rose border-rose/30",
  success: "bg-emerald/20 text-emerald border-emerald/30",
};

const dotColors: Record<string, string> = {
  neutral: "bg-white/40",
  warning: "bg-amber",
  danger: "bg-rose",
  success: "bg-emerald",
};

export function Problem() {
  const { ref, isInView } = useInView();
  const { ref: timelineRef, isInView: timelineInView } = useInView({ margin: "-50px" });

  return (
    <section
      id="problem"
      className="relative py-24 md:py-32"
      aria-label="Problem statement"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-rose/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Heading */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight">
            {PROBLEM_HEADING}
          </h2>
        </motion.div>

        {/* Problem Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {PROBLEM_CARDS.map((card) => {
            const Icon = iconMap[card.icon];
            return (
              <motion.div key={card.title} variants={staggerItem}>
                <Card className="relative overflow-hidden h-full border-l-2 border-l-rose/40">
                  {/* Red glow on left */}
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-rose/[0.08] to-transparent pointer-events-none" />
                  <div className="relative">
                    <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-rose/10">
                      <Icon className="h-5 w-5 text-rose" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Timeline */}
        <motion.div
          ref={timelineRef}
          variants={fadeInUp}
          initial="hidden"
          animate={timelineInView ? "visible" : "hidden"}
          className="relative"
        >
          <div className="glass rounded-2xl p-8 overflow-x-auto">
            <p className="text-xs text-white/40 font-mono mb-6 uppercase tracking-widest">
              Student Journey Without vs. With PlaceGuard
            </p>

            {/* SVG Timeline Line */}
            <div className="relative flex items-center justify-between min-w-[600px]">
              {/* Background line */}
              <svg
                className="absolute top-5 left-0 w-full h-2"
                viewBox="0 0 1000 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.line
                  x1="20"
                  y1="4"
                  x2="980"
                  y2="4"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  variants={drawLine}
                  initial="hidden"
                  animate={timelineInView ? "visible" : "hidden"}
                />
                <motion.line
                  x1="20"
                  y1="4"
                  x2="980"
                  y2="4"
                  stroke="url(#timelineGradient)"
                  strokeWidth="2"
                  variants={drawLine}
                  initial="hidden"
                  animate={timelineInView ? "visible" : "hidden"}
                />
                <defs>
                  <linearGradient id="timelineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Timeline Steps */}
              {TIMELINE_STEPS.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    timelineInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 20 }
                  }
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  className="flex flex-col items-center gap-3 relative z-10"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${statusColors[step.status]}`}>
                    <div className={`w-3 h-3 rounded-full ${dotColors[step.status]}`} />
                  </div>
                  <span className="text-xs text-white/60 text-center max-w-[100px] leading-tight">
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
