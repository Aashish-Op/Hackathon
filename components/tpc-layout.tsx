"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Bell, Loader2, Menu, Search } from "lucide-react";

import { api, type ApiError } from "@/lib/api";
import { formatRelativeDate } from "@/lib/date";
import {
  BRAND_DETAILS,
  BRAND_INITIAL,
  BRAND_NAME,
  NAV_SECTIONS,
  PAGE_META,
} from "@/lib/constants";
import {
  triggerLiveDashboardRefresh,
  useLiveDashboardData,
} from "@/lib/dashboard/use-live-dashboard-data";
import type { Alert, ApiEnvelope, PagedResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AppIcon } from "@/components/dashboard/shared";

function getPageMeta(pathname: string) {
  return PAGE_META.find((item) => item.href === pathname) ?? PAGE_META[0];
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function toApiErrorMessage(error: unknown): string {
  const typed = error as ApiError | undefined;
  return typed?.message || "Request failed";
}

function relativeFromNow(dateString: string | null | undefined): string {
  return formatRelativeDate(dateString, "just now");
}

function parseUnreadCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (value && typeof value === "object") {
    const objectValue = value as {
      count?: number;
      unread_count?: number;
      unread?: number;
    };

    const next =
      objectValue.unread_count ?? objectValue.count ?? objectValue.unread ?? 0;
    if (Number.isFinite(next)) {
      return Math.max(0, Math.round(next));
    }
  }

  return 0;
}

function severityTone(severity: Alert["severity"]): "rose" | "amber" | "blue" {
  if (severity === "critical") {
    return "rose";
  }

  if (severity === "high") {
    return "amber";
  }

  return "blue";
}

function severityLabel(severity: Alert["severity"]): "Critical" | "High" | "Medium" {
  if (severity === "critical") {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  return "Medium";
}

export function TPCLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { overviewCounts } = useLiveDashboardData();
  const { toast } = useToast();
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showScanConfirm, setShowScanConfirm] = React.useState(false);
  const [isRunningScan, setIsRunningScan] = React.useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = React.useState(0);
  const [notificationItems, setNotificationItems] = React.useState<Alert[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement | null>(null);
  const currentPage = getPageMeta(pathname);
  const isDashboardPage = pathname === "/dashboard";

  const alertBadgeCount = overviewCounts.alertsOpen;
  const interventionBadgeCount =
    overviewCounts.atRiskCount + overviewCounts.silentDropoutCount;
  const notificationBadgeCount = notificationUnreadCount;
  const notificationBadgeLabel =
    notificationBadgeCount > 99 ? "99+" : String(notificationBadgeCount);

  const navSections = React.useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.href === "/alerts") {
            return {
              ...item,
              badgeCount: alertBadgeCount,
            };
          }

          if (item.href === "/interventions") {
            return {
              ...item,
              badgeCount: interventionBadgeCount,
            };
          }

          return item;
        }),
      })),
    [alertBadgeCount, interventionBadgeCount],
  );

  React.useEffect(() => {
    setMobileOpen(false);
    setIsNotificationsOpen(false);
    setShowScanConfirm(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();

        if (window.innerWidth >= 768) {
          setDesktopCollapsed((current) => !current);
        } else {
          setMobileOpen((current) => !current);
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const loadNotifications = React.useCallback(async (silent: boolean) => {
    if (!silent) {
      setIsNotificationsLoading(true);
    }

    try {
      const [unreadResponse, alertsResponse] = await Promise.all([
        api.get<ApiEnvelope<number | { count?: number; unread_count?: number; unread?: number }>>(
          "/api/v1/alerts/unread/count",
        ),
        api.get<ApiEnvelope<PagedResponse<Alert>>>("/api/v1/alerts", {
          is_resolved: false,
          limit: 5,
          page: 1,
        }),
      ]);

      setNotificationUnreadCount(parseUnreadCount(unreadResponse.data));
      setNotificationItems(alertsResponse.data.items || []);
    } catch (requestError) {
      if (!silent) {
        toast({
          title: "Unable to load notifications",
          description: toApiErrorMessage(requestError),
          variant: "error",
        });
      }
    } finally {
      if (!silent) {
        setIsNotificationsLoading(false);
      }
    }
  }, [toast]);

  React.useEffect(() => {
    void loadNotifications(false);

    const intervalId = window.setInterval(() => {
      void loadNotifications(true);
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadNotifications]);

  React.useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!notificationRef.current) {
        return;
      }

      if (!notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isNotificationsOpen]);

  const handleRunScan = async () => {
    setIsRunningScan(true);

    try {
      const response = await api.post<ApiEnvelope<{ message?: string }>>(
        "/api/v1/ai/score/recompute-all",
        {},
      );

      toast({
        title: "AI scan started",
        description:
          response.data?.message || "Vigilo will refresh with updated scores shortly.",
        variant: "success",
      });

      setShowScanConfirm(false);
      triggerLiveDashboardRefresh();
      void loadNotifications(true);
    } catch (requestError) {
      toast({
        title: "Unable to run AI scan",
        description: toApiErrorMessage(requestError),
        variant: "error",
      });
    } finally {
      setIsRunningScan(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="space-y-5 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-lg font-semibold text-red-700 ai-glow">
            {BRAND_INITIAL}
          </div>
          <div className={cn("min-w-0", desktopCollapsed && "md:hidden")}>
            <p className="truncate text-sm font-semibold text-foreground font-[family-name:var(--font-dm-serif-display)]">{BRAND_NAME}</p>
            <Badge tone="violet" className="mt-1">
              {BRAND_DETAILS.roleLabel}
            </Badge>
          </div>
        </div>
        <div className={cn(desktopCollapsed && "md:hidden")}>
          <Input placeholder={BRAND_DETAILS.sidebarSearchPlaceholder} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 scrollbar-subtle">
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p
                className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground",
                  desktopCollapsed && "md:hidden",
                )}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-150",
                        isActive
                          ? "border-red-500/25 bg-red-500/10 text-red-700"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
                        desktopCollapsed && "justify-center md:px-0",
                      )}
                      href={item.href}
                    >
                      <AppIcon className="h-4 w-4 shrink-0" name={item.icon} />
                      <span className={cn("flex-1", desktopCollapsed && "md:hidden")}>
                        {item.label}
                      </span>
                      {item.badgeCount ? (
                        <Badge
                          className={cn("shrink-0", desktopCollapsed && "md:hidden")}
                          tone={item.badgeTone ?? "default"}
                        >
                          {item.badgeCount}
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
        <div className="rounded-2xl border border-emerald-500/20 bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <div className={cn("min-w-0", desktopCollapsed && "md:hidden")}>
              <p className="text-sm font-medium text-foreground">{BRAND_DETAILS.aiStatusLabel}</p>
              <p className="text-xs text-muted-foreground">{BRAND_DETAILS.aiStatusUpdatedLabel}</p>
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
            "hidden border-r border-border bg-card/75 backdrop-blur-xl md:block",
            desktopCollapsed ? "md:w-24" : "md:w-80",
          )}
        >
          {sidebarContent}
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close sidebar"
              className="absolute inset-0 bg-background/80"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <div className="absolute left-0 top-0 h-full w-80 max-w-[88vw] border-r border-border bg-card/95 backdrop-blur-xl">
              {sidebarContent}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    aria-label="Toggle sidebar"
                    className="md:hidden"
                    onClick={() => setMobileOpen(true)}
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Button
                    aria-label="Toggle sidebar"
                    className="hidden md:inline-flex"
                    onClick={() => setDesktopCollapsed((current) => !current)}
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground lg:text-xl font-[family-name:var(--font-dm-serif-display)]">
                      {currentPage.title}
                    </p>
                    <p className="hidden text-sm text-muted-foreground md:block">
                      {currentPage.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3">
                  <button
                    aria-label={BRAND_DETAILS.topbarSearchLabel}
                    className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <div className="relative" ref={notificationRef}>
                    <button
                      aria-label="Notifications"
                      className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                      onClick={() => setIsNotificationsOpen((current) => !current)}
                      type="button"
                    >
                      <Bell className="h-4 w-4" />
                      {notificationBadgeCount > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                          {notificationBadgeLabel}
                        </span>
                      ) : null}
                    </button>

                    {isNotificationsOpen ? (
                      <div className="absolute right-0 top-full z-40 mt-2 w-[360px] max-w-[90vw] rounded-2xl border border-border bg-card p-3 shadow-[0_12px_32px_rgba(26,26,26,0.16)]">
                        <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2">
                          <p className="text-sm font-semibold text-foreground">Unresolved Alerts</p>
                          <Badge tone="rose">{notificationBadgeLabel}</Badge>
                        </div>

                        <div className="max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-subtle">
                          {isNotificationsLoading ? (
                            <div className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                              Loading notifications...
                            </div>
                          ) : notificationItems.length === 0 ? (
                            <div className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                              No unresolved alerts.
                            </div>
                          ) : (
                            notificationItems.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {item.student_name || "Student"}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                      {item.message}
                                    </p>
                                  </div>
                                  <Badge tone={severityTone(item.severity)}>
                                    {severityLabel(item.severity)}
                                  </Badge>
                                </div>
                                <p className="mt-1.5 text-[11px] text-muted-foreground">
                                  {relativeFromNow(item.triggered_at)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="hidden sm:block">
                    <Avatar name={BRAND_DETAILS.currentOfficer} />
                  </div>
                  {showScanConfirm ? (
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                      <span className="hidden px-2 text-xs text-muted-foreground md:inline">
                        Confirm scan?
                      </span>
                      <Button
                        onClick={() => setShowScanConfirm(false)}
                        size="sm"
                        variant="ghost"
                        disabled={isRunningScan}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRunScan}
                        size="sm"
                        disabled={isRunningScan}
                      >
                        {isRunningScan ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppIcon className="h-4 w-4" name="Cpu" />}
                        {isRunningScan ? "Running..." : "Confirm"}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => setShowScanConfirm(true)}>
                      <AppIcon className="h-4 w-4" name="Cpu" />
                      <span className="hidden sm:inline">{BRAND_DETAILS.runScanLabel}</span>
                    </Button>
                  )}
                </div>
              </div>

              {isDashboardPage ? (
                <div className="flex flex-wrap items-center gap-2">
                  {BRAND_DETAILS.overviewTabs.map((item) => {
                    const href =
                      item === "Overview"
                        ? "#overview"
                        : item === "Students"
                          ? "#students"
                          : "#alerts";

                    return (
                      <Link
                        key={item}
                        className={buttonVariants({ variant: "ghost", className: "border border-transparent hover:border-border" })}
                        href={href}
                      >
                        {item}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
