"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  STUDENT_AI_INSIGHT_SHEET,
  STUDENT_NAV_SECTIONS,
  STUDENT_PAGE_META,
  STUDENT_PROFILE,
  STUDENT_PROFILE_COMPLETION_CARD,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/components/student/risk-badge";
import { StudentIcon, type StudentIconName } from "@/components/student/icon-map";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navIconMap = {
  LayoutDashboard: "LayoutDashboard",
  TrendingUp: "TrendingUp",
  Zap: "Zap",
  UserCircle: "UserCircle",
  Brain: "Brain",
  Mic: "Mic",
  Trophy: "Trophy",
  Bell: "Bell",
  MessageSquare: "MessageSquare",
  Users: "UserCircle",
  Gauge: "Brain",
  BadgeCheck: "Trophy",
} as const satisfies Record<string, StudentIconName>;

function getPageMeta(pathname: string) {
  return STUDENT_PAGE_META.find((item) => item.href === pathname) ?? STUDENT_PAGE_META[0];
}

function getPlacementToneClass(score: number) {
  if (score < 40) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-400";
  }

  if (score < 65) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
}

function getRiskLevel(score: number) {
  if (score < 40) {
    return "high" as const;
  }

  if (score < 65) {
    return "medium" as const;
  }

  return "ready" as const;
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageMeta = getPageMeta(pathname);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [insightOpen, setInsightOpen] = React.useState(false);

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();

        if (window.innerWidth >= 1024) {
          setDesktopCollapsed((current) => !current);
        } else {
          setMobileOpen((current) => !current);
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b border-border p-4">
        <div className={cn("flex items-center gap-4", desktopCollapsed && "lg:flex-col")}>
          <div className="rounded-full border border-amber-500/20 p-1">
            <Avatar className="h-16 w-16 text-lg" name={STUDENT_PROFILE.name} />
          </div>
          <div className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
            <p className="truncate text-base font-semibold text-foreground">
              {STUDENT_PROFILE.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {`${STUDENT_PROFILE.rollNo} - ${STUDENT_PROFILE.department}`}
            </p>
            <Badge className="mt-2" tone="slate">
              {STUDENT_PROFILE.batchYear}
            </Badge>
          </div>
        </div>
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-medium",
            getPlacementToneClass(STUDENT_PROFILE.placementProbability),
            desktopCollapsed && "lg:hidden",
          )}
        >
          {`${STUDENT_PROFILE.placementProbability}% Placement Ready`}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 scrollbar-subtle">
        <div className="space-y-6">
          {STUDENT_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <p
                className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
                  desktopCollapsed && "lg:hidden",
                )}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href.startsWith("/student/notifications") &&
                      pathname === "/student/notifications");
                  const iconName =
                    navIconMap[item.icon as keyof typeof navIconMap] ?? "LayoutDashboard";
                  const badgeTone = (item.badgeTone ?? "default") as React.ComponentProps<
                    typeof Badge
                  >["tone"];

                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-150",
                        active
                          ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
                        desktopCollapsed && "justify-center lg:px-0",
                      )}
                      href={item.href}
                    >
                      <StudentIcon name={iconName} className="shrink-0" />
                      <span className={cn("flex-1", desktopCollapsed && "lg:hidden")}>
                        {item.label}
                      </span>
                      {item.badgeCount ? (
                        <Badge className={cn(desktopCollapsed && "lg:hidden")} tone={badgeTone}>
                          {item.label === "Profile Builder"
                            ? `${item.badgeCount}%`
                            : item.badgeCount}
                        </Badge>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="42"
                  stroke="var(--border)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="42"
                  stroke="var(--chart-violet)"
                  strokeDasharray="264"
                  strokeDashoffset="69"
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                {`${STUDENT_PROFILE_COMPLETION_CARD.completion}%`}
              </div>
            </div>
            <div className={cn("space-y-2", desktopCollapsed && "lg:hidden")}>
              <p className="text-sm font-medium text-foreground">Profile Complete</p>
              <p className="text-sm text-amber-400">
                {STUDENT_PROFILE_COMPLETION_CARD.attentionText}
              </p>
              <Button size="sm">{STUDENT_PROFILE_COMPLETION_CARD.actionLabel}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-border bg-card/80 backdrop-blur-xl lg:block",
            desktopCollapsed ? "lg:w-24" : "lg:w-80",
          )}
        >
          {sidebar}
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close sidebar"
              className="absolute inset-0 bg-background/80"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <div className="absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-border bg-card/95 backdrop-blur-xl">
              {sidebar}
            </div>
          </div>
        ) : null}

        {insightOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              aria-label="Close AI insight panel"
              className="absolute inset-0 bg-background/70"
              onClick={() => setInsightOpen(false)}
              type="button"
            />
            <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-border bg-card/95 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex rounded-full bg-violet-500/10 p-2 text-violet-400">
                    <StudentIcon name="Sparkles" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {STUDENT_AI_INSIGHT_SHEET.headline}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {STUDENT_AI_INSIGHT_SHEET.summary}
                  </p>
                </div>
                <button
                  aria-label="Dismiss AI insight"
                  className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  onClick={() => setInsightOpen(false)}
                  type="button"
                >
                  <StudentIcon name="X" />
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {STUDENT_AI_INSIGHT_SHEET.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm leading-6 text-foreground"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    aria-label="Toggle sidebar"
                    className="lg:hidden"
                    onClick={() => setMobileOpen(true)}
                    size="icon"
                    variant="outline"
                  >
                    <StudentIcon name="Menu" />
                  </Button>
                  <Button
                    aria-label="Toggle sidebar"
                    className="hidden lg:inline-flex"
                    onClick={() => setDesktopCollapsed((current) => !current)}
                    size="icon"
                    variant="outline"
                  >
                    <StudentIcon name="Menu" />
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground lg:text-xl">
                      {pageMeta.title}
                    </p>
                    <p className="hidden text-sm text-muted-foreground md:block">
                      {pageMeta.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3">
                  <button
                    aria-label="Search student portal"
                    className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <StudentIcon name="Search" />
                  </button>
                  <button
                    aria-label="Notifications"
                    className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <StudentIcon name="Bell" />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </button>
                  <Badge className="hidden gap-2 sm:inline-flex" tone="amber">
                    <StudentIcon name="Flame" className="h-3.5 w-3.5" />
                    {`${STUDENT_PROFILE.streak} day streak`}
                  </Badge>
                  <Button onClick={() => setInsightOpen(true)}>
                    <StudentIcon name="Sparkles" />
                    <span className="hidden sm:inline">AI Insight</span>
                  </Button>
                  <div className="hidden sm:block">
                    <Avatar name={STUDENT_PROFILE.name} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <RiskBadge level={getRiskLevel(STUDENT_PROFILE.placementProbability)} />
                <Badge tone="violet">{`${STUDENT_PROFILE.profileCompletion}% profile complete`}</Badge>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
