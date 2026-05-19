import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale";

/** SSR-safe day title (no year), e.g. "Sunday, May 18". */
export function formatScheduleDayLabel(date: Date): string {
  return format(date, "EEEE, MMMM d", { locale: enUS });
}

/** SSR-safe day title with year, e.g. "Sunday, May 18, 2026". */
export function formatScheduleDayLabelWithYear(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy", { locale: enUS });
}

/** Check-in time for agenda / booking tiles, e.g. "09:15 AM". */
export function formatArrivalClock(iso: string): string {
  try {
    return format(parseISO(iso), "hh:mm a");
  } catch {
    return "—";
  }
}
