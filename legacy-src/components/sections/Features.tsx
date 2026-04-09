"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Users,
  Activity,
  LayoutDashboard,
  MessageSquare,
  Compass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInView } from "@/hooks/useInView";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { FEATURES_HEADING, FEATURES_SUBHEADING, FEATURES } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  Gauge,
  Users,
  Activity,
  LayoutDashboard,
  MessageSquare,
  Compass,
};

export function Features() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="features"
      className="relative py-24 md:py-32"
      aria-label="Features"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-indigo/[0.04] blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 relative">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight mb-4">
            {FEATURES_HEADING}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {FEATURES_SUBHEADING}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <motion.div key={feature.title} variants={staggerItem}>
                <Card className="h-full group relative overflow-hidden">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo/10 border border-indigo/20 group-hover:border-indigo/40 transition-colors">
                        <Icon className="h-5 w-5 text-indigo" />
                      </div>
                      <Badge
                        color={feature.tagColor}
                        className="group-hover:scale-105 transition-transform"
                      >
                        {feature.tag}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/45 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
