"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type LegacyToastVariant = ToastVariant | "default";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  visible: boolean;
}

interface ToastPayload {
  title: string;
  description?: string;
  variant?: LegacyToastVariant;
}

type ToastFn = {
  (payload: ToastPayload): void;
  (title: string, variant?: ToastVariant): void;
  (title: string, description: string, variant?: ToastVariant): void;
};

interface ToastContextValue {
  toast: ToastFn;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const EXIT_DURATION_MS = 220;
const AUTO_DISMISS_MS = 4000;

function isToastVariant(value: unknown): value is ToastVariant {
  return value === "success" || value === "error" || value === "info";
}

function normalizeToastPayload(args: unknown[]): {
  title: string;
  description?: string;
  variant: ToastVariant;
} {
  const [first, second, third] = args;

  if (typeof first === "string") {
    if (typeof second === "string" && isToastVariant(second) && third === undefined) {
      return {
        title: first,
        variant: second,
      };
    }

    if (typeof second === "string") {
      return {
        title: first,
        description: second,
        variant: isToastVariant(third) ? third : "info",
      };
    }

    return {
      title: first,
      variant: "info",
    };
  }

  if (first && typeof first === "object") {
    const payload = first as ToastPayload;
    const normalizedVariant = payload.variant === "default" ? "info" : payload.variant;

    return {
      title: payload.title,
      description: payload.description,
      variant: normalizedVariant || "info",
    };
  }

  return {
    title: "Something went wrong",
    variant: "error",
  };
}

const VARIANT_STYLES: Record<ToastVariant, {
  container: string;
  iconWrap: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  info: {
    container: "border-l-4 border-l-[rgba(26,26,26,0.75)]",
    iconWrap: "bg-[rgba(26,26,26,0.1)] text-[var(--ink)]",
    icon: Sparkles,
  },
  success: {
    container: "border-l-4 border-l-emerald-600",
    iconWrap: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  error: {
    container: "border-l-4 border-l-red-600",
    iconWrap: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              visible: false,
            }
          : item,
      ),
    );

    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, EXIT_DURATION_MS);
  }, []);

  const toast = React.useCallback<ToastFn>(
    (...args: unknown[]) => {
      const payload = normalizeToastPayload(args);
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setItems((current) => [
        ...current,
        {
          id,
          title: payload.title,
          description: payload.description,
          variant: payload.variant,
          visible: false,
        },
      ]);

      window.requestAnimationFrame(() => {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  visible: true,
                }
              : item,
          ),
        );
      });

      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] max-w-[calc(100vw-1rem)] flex-col gap-3"
      >
        {items.map((item) => {
          const style = VARIANT_STYLES[item.variant];
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto rounded-xl border border-[rgba(26,26,26,0.16)] bg-card p-4 text-card-foreground shadow-[0_8px_28px_rgba(26,26,26,0.12)] backdrop-blur-xl transition-all duration-200",
                style.container,
                item.visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              onClick={() => dismiss(item.id)}
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 rounded-full p-2", style.iconWrap)}>
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
                  onClick={(event) => {
                    event.stopPropagation();
                    dismiss(item.id);
                  }}
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
