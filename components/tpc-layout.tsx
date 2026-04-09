"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Bell, Menu, Search } from "lucide-react";

import {
  BRAND_DETAILS,
  BRAND_INITIAL,
  BRAND_NAME,
  NAV_SECTIONS,
  PAGE_META,
} from "@/lib/constants";
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

export function TPCLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const currentPage = getPageMeta(pathname);
  const isDashboardPage = pathname === "/dashboard";

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();

        if (window.innerWidth >= 1024) {
          setDesktopCollapsed((current) => !current);
        } else {
          setMobileOpen((current) => !current);
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="space-y-5 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-lg font-semibold text-violet-400 ai-glow">
            {BRAND_INITIAL}
          </div>
          <div className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
            <p className="truncate text-sm font-semibold text-foreground">{BRAND_NAME}</p>
            <Badge tone="violet" className="mt-1">
              {BRAND_DETAILS.roleLabel}
            </Badge>
          </div>
        </div>
        <div className={cn(desktopCollapsed && "lg:hidden")}>
          <Input placeholder={BRAND_DETAILS.sidebarSearchPlaceholder} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 scrollbar-subtle">
        <div className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-2">
              <p
                className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground",
                  desktopCollapsed && "lg:hidden",
                )}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-150",
                        isActive
                          ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
                        desktopCollapsed && "justify-center lg:px-0",
                      )}
                      href={item.href}
                    >
                      <AppIcon className="h-4 w-4 shrink-0" name={item.icon} />
                      <span className={cn("flex-1", desktopCollapsed && "lg:hidden")}>
                        {item.label}
                      </span>
                      {item.badgeCount ? (
                        <Badge
                          className={cn("shrink-0", desktopCollapsed && "lg:hidden")}
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
            <div className={cn("min-w-0", desktopCollapsed && "lg:hidden")}>
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
            "hidden border-r border-border bg-card/75 backdrop-blur-xl lg:block",
            desktopCollapsed ? "lg:w-24" : "lg:w-80",
          )}
        >
          {sidebarContent}
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
                    className="lg:hidden"
                    onClick={() => setMobileOpen(true)}
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <Button
                    aria-label="Toggle sidebar"
                    className="hidden lg:inline-flex"
                    onClick={() => setDesktopCollapsed((current) => !current)}
                    size="icon"
                    variant="outline"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-foreground lg:text-xl">
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
                  <button
                    aria-label="Notifications"
                    className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                      {BRAND_DETAILS.notificationCount}
                    </span>
                  </button>
                  <div className="hidden sm:block">
                    <Avatar name={BRAND_DETAILS.currentOfficer} />
                  </div>
                  <Button
                    onClick={() =>
                      toast({
                        title: BRAND_DETAILS.runScanToast.title,
                        description: BRAND_DETAILS.runScanToast.description,
                        variant: "success",
                      })
                    }
                  >
                    <AppIcon className="h-4 w-4" name="Cpu" />
                    <span className="hidden sm:inline">{BRAND_DETAILS.runScanLabel}</span>
                  </Button>
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
