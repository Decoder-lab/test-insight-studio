import { format } from "date-fns";

/** `2 Nov 2026, 14:05` in the viewer's time zone. Falls back to the raw text for an unparseable value. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, "d MMM yyyy, HH:mm");
}

/** `2 Nov 2026`. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, "d MMM yyyy");
}
