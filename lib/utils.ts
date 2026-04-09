import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const DEFAULT_REFERENCE_DATE = "2026-04-09T09:00:00+05:30";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatRelativeTime(
  dateString: string,
  referenceDate = DEFAULT_REFERENCE_DATE,
): string {
  const target = new Date(dateString);
  const reference = new Date(referenceDate);
  const deltaMs = reference.getTime() - target.getTime();

  if (deltaMs <= 0) {
    return "Just now";
  }

  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.round(deltaMs / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < day) {
    const hours = Math.round(deltaMs / hour);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < week) {
    const days = Math.round(deltaMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.round(deltaMs / week);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

export function isOlderThanDays(
  dateString: string,
  days: number,
  referenceDate = DEFAULT_REFERENCE_DATE,
): boolean {
  const target = new Date(dateString);
  const reference = new Date(referenceDate);
  const diff = reference.getTime() - target.getTime();

  return diff >= days * 24 * 60 * 60 * 1000;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDateLabel(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}
