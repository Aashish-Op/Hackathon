import { format, formatDistanceToNow, isValid } from "date-fns";

export type DateInput = string | number | Date | null | undefined;

export function parseDateInput(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return isValid(parsed) ? parsed : null;
}

export function formatRelativeDate(
  value: DateInput,
  fallback = "just now",
): string {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return fallback;
  }

  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function formatShortDate(value: DateInput, fallback = "-"): string {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return fallback;
  }

  return format(parsed, "dd MMM yyyy");
}

export function formatLongDate(value: DateInput, fallback = "-"): string {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return fallback;
  }

  return format(parsed, "dd MMM yyyy, hh:mm a");
}

export function isDateOlderThanDays(value: DateInput, days: number): boolean {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return true;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return parsed.getTime() < cutoff.getTime();
}

export function toTimestamp(value: DateInput, fallback = 0): number {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return fallback;
  }

  return parsed.getTime();
}

export function formatDateForFileName(value: DateInput): string {
  const parsed = parseDateInput(value) || new Date();
  return format(parsed, "yyyy-MM-dd");
}
