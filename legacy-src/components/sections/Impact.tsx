"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Quote } from "lucide-react";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { useInView } from "@/hooks/useInView";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { IMPACT_HEADING, IMPACT_METRICS, TESTIMONIAL } from "@/lib/constants";

function Sparkline({
  data,
  color,
  width = 120,
  height = 40,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(" ");

  const areaPath = `M0,${height} L${points
    .split(" ")
    .map((p) => `L${p}`)
    .join(" ")} L${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sparkGrad-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompletionRing({
  percent,
  size = 60,
  strokeWidth = 5,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const { ref, isInView } = useInView();

  return (
    <div ref={ref} className="inline-flex">
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={
            isInView
              ? { strokeDashoffset: circumference * (1 - percent / 100) }
              : { strokeDashoffset: circumference }
          }
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
    </div>
  );
}

const trendColors = {
  up: "#10B981",
  down: "#10B981",
  neutral: "#6366F1",
};

export function Impact() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="impact"
      className="relative py-24 md:py-32"
      aria-label="Impact metrics"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-indigo/[0.04] blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative">
        {/* Heading */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight">
            {IMPACT_HEADING}
          </h2>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {IMPACT_METRICS.map((metric) => (
            <motion.div
              key={metric.label}
              variants={staggerItem}
              className="glass-strong rounded-2xl p-8 border border-white/5 group hover:-translate-y-1 transition-transform duration-300 text-center relative overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {metric.trend === "up" && (
                    <TrendingUp className="h-5 w-5 text-emerald" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="h-5 w-5 text-emerald" />
                  )}
                  {metric.trend === "neutral" && (
                    <CompletionRing percent={metric.numericValue} />
                  )}
                </div>

                <div className="text-4xl font-bold font-mono text-white mb-2">
                  {metric.prefix && (
                    <span className="text-emerald">{metric.prefix} </span>
                  )}
                  <AnimatedCounter
                    target={metric.numericValue}
                    suffix={metric.suffix}
                    duration={2000}
                  />
                </div>

                <p className="text-sm text-white/50 mb-4">{metric.label}</p>

                {metric.trend !== "neutral" && (
                  <div className="flex justify-center">
                    <Sparkline
                      data={metric.sparklineData}
                      color={trendColors[metric.trend]}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="glass rounded-2xl p-8 md:p-12 max-w-3xl mx-auto relative"
        >
          <Quote className="absolute top-6 left-6 h-8 w-8 text-indigo/20" />
          <div className="relative">
            <blockquote className="text-lg md:text-xl text-white/80 leading-relaxed mb-6 pl-4 border-l-2 border-indigo/30">
              &ldquo;{TESTIMONIAL.quote}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo/20 flex items-center justify-center text-sm font-bold text-indigo">
                {TESTIMONIAL.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">
                  {TESTIMONIAL.author}
                </p>
                <p className="text-xs text-white/40">{TESTIMONIAL.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
