"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import {
  HERO_EYEBROW,
  HERO_HEADLINE,
  HERO_SUBHEADLINE,
  HERO_CTA_PRIMARY,
  HERO_STATS,
} from "@/lib/constants";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50"
      aria-label="Hero section"
    >
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-100/30 blur-[120px]" />
      </div>

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-3xl px-6 text-center pt-20"
      >
        {/* Eyebrow Badge */}
        <motion.div variants={scaleIn} className="mb-8">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 backdrop-blur-sm">
            {HERO_EYEBROW}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.1] tracking-tight text-gray-900 mb-6"
        >
          {HERO_HEADLINE}
        </motion.h1>

        {/* Subheading */}
        <motion.div
          variants={fadeInUp}
          className="mx-auto max-w-2xl mb-10"
        >
          <p className="text-lg text-gray-600 leading-relaxed">
            {HERO_SUBHEADLINE}
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={fadeInUp} className="mb-16">
          <button className="px-8 py-3.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2">
            {HERO_CTA_PRIMARY}
          </button>
        </motion.div>

        {/* Stats Section (optional) */}
        {HERO_STATS && HERO_STATS.length > 0 && (
          <motion.div
            variants={staggerContainer}
            className="text-xs text-gray-500 tracking-widest uppercase"
          >
            <p>INDIA BUILDS WITH SARVAM</p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
