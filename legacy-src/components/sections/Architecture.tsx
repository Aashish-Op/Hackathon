"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Database,
  ArrowRight,
  Cpu,
  Gauge,
  LayoutDashboard,
  Smartphone,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { fadeInUp, drawLine } from "@/lib/motion";
import { ARCHITECTURE_HEADING, ARCHITECTURE_BODY } from "@/lib/constants";

interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  row: number;
  col: number;
}

const nodes: ArchNode[] = [
  { id: "data", label: "Data Sources", sublabel: "LMS · Attendance · Tests", icon: Database, row: 0, col: 0 },
  { id: "ingest", label: "Ingestion Layer", sublabel: "ETL · Streaming", icon: ArrowRight, row: 0, col: 1 },
  { id: "ml", label: "ML Pipeline", sublabel: "Clustering · Scoring", icon: Cpu, row: 0, col: 2 },
  { id: "scoring", label: "Scoring Engine", sublabel: "Risk Assessment", icon: Gauge, row: 0, col: 3 },
  { id: "dashboard", label: "TPC Dashboard", sublabel: "Coordinator UI", icon: LayoutDashboard, row: 1, col: 3 },
  { id: "app", label: "Student App", sublabel: "Nudges · Alerts", icon: Smartphone, row: -1, col: 3 },
];

const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [3, 5],
];

export function Architecture() {
  const { ref, isInView } = useInView();

  return (
    <section
      id="architecture"
      className="relative py-24 md:py-32"
      aria-label="Architecture"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight mb-4">
            {ARCHITECTURE_HEADING}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {ARCHITECTURE_BODY}
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="glass-strong rounded-2xl p-8 md:p-12 border border-indigo/10 overflow-x-auto"
        >
          <div className="min-w-[700px]">
            <svg
              viewBox="0 0 900 300"
              className="w-full h-auto"
              aria-label="System architecture diagram"
            >
              {/* Edges */}
              {edges.map(([fromIdx, toIdx], i) => {
                const from = nodes[fromIdx];
                const to = nodes[toIdx];
                const x1 = 100 + from.col * 190;
                const y1 = 150 + from.row * 90;
                const x2 = 100 + to.col * 190;
                const y2 = 150 + to.row * 90;



                return (
                  <motion.path
                    key={`edge-${i}`}
                    d={
                      from.col === to.col
                        ? `M ${x1 + 70} ${y1} C ${x1 + 70} ${(y1 + y2) / 2}, ${x2 + 70} ${(y1 + y2) / 2}, ${x2 + 70} ${y2}`
                        : `M ${x1 + 70} ${y1} L ${x2} ${y2}`
                    }
                    fill="none"
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    variants={drawLine}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    transition={{ delay: 0.3 + i * 0.2, duration: 1 }}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node, i) => {
                const x = 30 + node.col * 190;
                const y = 120 + node.row * 90;
                const Icon = node.icon;

                return (
                  <motion.g
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width="140"
                      height="60"
                      rx="12"
                      fill="rgba(255,255,255,0.03)"
                      stroke="rgba(99, 102, 241, 0.2)"
                      strokeWidth="1"
                    />
                    <foreignObject x={x} y={y} width="140" height="60">
                      <div className="flex items-center gap-2 px-3 h-full">
                        <Icon className="h-4 w-4 text-indigo shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">
                            {node.label}
                          </p>
                          <p className="text-[10px] text-white/30 truncate">
                            {node.sublabel}
                          </p>
                        </div>
                      </div>
                    </foreignObject>
                  </motion.g>
                );
              })}
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
