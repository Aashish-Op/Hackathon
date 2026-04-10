"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudentIcon } from "@/components/student/icon-map";

const toneMap = {
  tip: "border-violet-500/20 bg-violet-500/10",
  warning: "border-amber-500/20 bg-amber-500/10",
  success: "border-emerald-500/20 bg-emerald-500/10",
} as const;

export function AIInsightCard({
  insight,
  action,
  type,
  timestamp,
}: {
  insight: string;
  action?: { label: string; href: string };
  type: "tip" | "warning" | "success";
  timestamp: string;
}) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) {
    return null;
  }

  return (
    <Card className={`overflow-hidden border-l-2 ${toneMap[type]}`}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
              <StudentIcon name="Sparkles" />
            </div>
            <div className="space-y-2">
              <p className="text-sm leading-6 text-foreground">{insight}</p>
              <p className="text-xs text-muted-foreground">{timestamp}</p>
            </div>
          </div>
          <button
            aria-label="Dismiss insight"
            className="rounded-lg p-1 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            onClick={() => setVisible(false)}
            type="button"
          >
            <StudentIcon name="X" />
          </button>
        </div>
        {action ? (
          <Link href={action.href}>
            <Button className="w-full justify-between" variant="outline">
              {action.label}
              <StudentIcon name="ChevronRight" />
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
