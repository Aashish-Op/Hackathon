"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import {
  DASHBOARD_HEADING,
  DASHBOARD_LABEL,
  STUDENT_DATA,
  PLACEMENT_DISTRIBUTION,
  ALERT_FEED,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const riskBadge: Record<string, { class: string; icon: LucideIcon }> = {
  safe: { class: "bg-emerald/15 text-emerald border-emerald/20", icon: CheckCircle2 },
  "at-risk": { class: "bg-amber/15 text-amber border-amber/20", icon: AlertTriangle },
  danger: { class: "bg-rose/15 text-rose border-rose/20", icon: XCircle },
};

const severityDot: Record<string, string> = {
  high: "bg-rose",
  medium: "bg-amber",
  low: "bg-emerald",
};

const chartData = [
  { name: "Ready", value: PLACEMENT_DISTRIBUTION.ready },
  { name: "At-Risk", value: PLACEMENT_DISTRIBUTION.atRisk },
  { name: "Unprepared", value: PLACEMENT_DISTRIBUTION.unprepared },
];
const CHART_COLORS = ["#10B981", "#F59E0B", "#F43F5E"];

export function Dashboard() {
  const { ref, isInView } = useInView();
  const [visibleAlertIndex, setVisibleAlertIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleAlertIndex((prev) => (prev + 1) % ALERT_FEED.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const visibleAlerts = [
    ALERT_FEED[visibleAlertIndex % ALERT_FEED.length],
    ALERT_FEED[(visibleAlertIndex + 1) % ALERT_FEED.length],
    ALERT_FEED[(visibleAlertIndex + 2) % ALERT_FEED.length],
  ];

  return (
    <section
      id="dashboard"
      className="relative py-24 md:py-32"
      aria-label="Dashboard preview"
    >
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="mx-auto max-w-7xl px-6 relative">
        {/* Header */}
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold text-white tracking-tight mb-3">
            {DASHBOARD_HEADING}
          </h2>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-indigo/60 border border-indigo/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-indigo animate-pulse-slow" />
            {DASHBOARD_LABEL}
          </span>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Student Risk Table — spans 2 cols */}
          <motion.div
            variants={staggerItem}
            className="lg:col-span-2 glass-strong rounded-2xl p-5 border border-indigo/10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/80">
                Student Risk Assessment
              </h3>
              <span className="text-xs text-white/30 font-mono">
                {STUDENT_DATA.length} students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Student risk table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2 px-3 text-xs text-white/30 font-medium">
                      Student
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-white/30 font-medium">
                      Branch
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-white/30 font-medium">
                      Risk Score
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-white/30 font-medium hidden sm:table-cell">
                      Last Active
                    </th>
                    <th className="text-left py-2 px-3 text-xs text-white/30 font-medium hidden md:table-cell">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENT_DATA.map((student, i) => {
                    const badge = riskBadge[student.riskLevel];
                    const BadgeIcon = badge.icon;
                    return (
                      <motion.tr
                        key={student.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-3">
                          <span className="text-white/80 font-medium">
                            {student.name}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-white/40 font-mono text-xs">
                            {student.branch}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              badge.class
                            )}
                          >
                            <BadgeIcon className="h-3 w-3" />
                            {student.riskScore}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <span className="text-white/30 text-xs">
                            {student.lastActive}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <span className="text-white/40 text-xs">
                            {student.action}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Donut Chart */}
            <motion.div
              variants={staggerItem}
              className="glass-strong rounded-2xl p-5 border border-indigo/10 flex-1"
            >
              <h3 className="text-sm font-semibold text-white/80 mb-2">
                Placement Readiness
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index]}
                          opacity={0.85}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 22, 41, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald" />
                  <span className="text-white/40">Ready {PLACEMENT_DISTRIBUTION.ready}%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber" />
                  <span className="text-white/40">At-Risk {PLACEMENT_DISTRIBUTION.atRisk}%</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose" />
                  <span className="text-white/40">Unprep. {PLACEMENT_DISTRIBUTION.unprepared}%</span>
                </span>
              </div>
            </motion.div>

            {/* Alert Feed */}
            <motion.div
              variants={staggerItem}
              className="glass-strong rounded-2xl p-5 border border-indigo/10 flex-1"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-indigo" />
                <h3 className="text-sm font-semibold text-white/80">
                  Recent Alerts
                </h3>
              </div>
              <div className="space-y-3 min-h-[120px]">
                <AnimatePresence mode="popLayout">
                  {visibleAlerts.map((alert) => (
                    <motion.div
                      key={`${alert.studentName}-${alert.issue}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3 p-2 rounded-lg bg-white/[0.02]"
                    >
                      <span
                        className={cn(
                          "mt-1.5 w-2 h-2 rounded-full shrink-0",
                          severityDot[alert.severity]
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-white/70 truncate">
                          <span className="font-medium text-white/90">
                            {alert.studentName}
                          </span>{" "}
                          — {alert.issue}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {alert.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
