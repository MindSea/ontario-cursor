import { format } from "date-fns";
import { enUS } from "date-fns/locale";

/** SSR-safe day title (no year), e.g. "Sunday, May 18". */
export function formatScheduleDayLabel(date: Date): string {
  return format(date, "EEEE, MMMM d", { locale: enUS });
}

/** SSR-safe day title with year, e.g. "Sunday, May 18, 2026". */
export function formatScheduleDayLabelWithYear(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy", { locale: enUS });
}
