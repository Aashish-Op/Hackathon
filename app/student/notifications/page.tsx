"use client";

import * as React from "react";

import {
  STUDENT_NOTIFICATION_FILTERS,
  STUDENT_NOTIFICATION_STATS,
  STUDENT_NOTIFICATIONS,
} from "@/lib/constants";
import { StudentIcon } from "@/components/student/icon-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const typeToneMap = {
  tpc: { tone: "amber", icon: "AlertTriangle" },
  ai: { tone: "violet", icon: "Sparkles" },
  reminder: { tone: "sky", icon: "Clock" },
  achievement: { tone: "yellow", icon: "Trophy" },
  system: { tone: "slate", icon: "Settings" },
} as const;

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = React.useState("All");
  const [items, setItems] = React.useState(STUDENT_NOTIFICATIONS);

  const filteredItems = items.filter((item) => {
    if (activeFilter === "All") {
      return true;
    }

    if (activeFilter === "TPC Alerts") {
      return item.type === "tpc";
    }

    if (activeFilter === "AI Nudges") {
      return item.type === "ai";
    }

    if (activeFilter === "Reminders") {
      return item.type === "reminder";
    }

    return item.type === "system";
  });

  function markAsRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STUDENT_NOTIFICATION_STATS.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
              <Badge tone={item.tone as "rose" | "amber" | "violet" | "slate"}>{item.label}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {STUDENT_NOTIFICATION_FILTERS.map((filter) => (
          <Button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            variant={activeFilter === filter ? "secondary" : "ghost"}
          >
            {filter}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.map((item) => {
          const config = typeToneMap[item.type];

          return (
            <Card key={item.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-2 ${config.tone === "amber" ? "bg-amber-500/10 text-amber-400" : config.tone === "violet" ? "bg-violet-500/10 text-violet-400" : config.tone === "sky" ? "bg-sky-500/10 text-sky-400" : config.tone === "yellow" ? "bg-yellow-500/10 text-yellow-400" : "bg-slate-500/10 text-slate-400"}`}>
                      <StudentIcon name={config.icon} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        {item.unread ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : null}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.actionLabel ? <Button variant="outline">{item.actionLabel}</Button> : null}
                    <Button onClick={() => markAsRead(item.id)} variant="ghost">
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
