"use client";

import * as React from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (payload: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ title, description, variant }: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current, { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[80] flex w-full max-w-sm flex-col gap-3"
      >
        {items.map((item) => {
          const isSuccess = item.variant === "success";
          const Icon = isSuccess ? CheckCircle2 : Sparkles;

          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto rounded-2xl border bg-card p-4 text-card-foreground backdrop-blur-xl",
                isSuccess ? "border-emerald-500/20" : "border-violet-500/20",
              )}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-full p-2",
                    isSuccess
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-violet-500/10 text-violet-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  onClick={() => dismiss(item.id)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToasterProvider");
  }

  return context;
}
