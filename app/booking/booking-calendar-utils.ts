import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type BookingCalendarView = "day" | "week" | "month" | "year";

export function shiftBookingAnchor(
  anchor: Date,
  view: BookingCalendarView,
  delta: number,
): Date {
  switch (view) {
    case "day":
      return addDays(anchor, delta);
    case "week":
      return addWeeks(anchor, delta);
    case "month":
      return addMonths(anchor, delta);
    case "year":
      return addYears(anchor, delta);
  }
}

export function formatBookingAnchorLabel(
  anchor: Date,
  view: BookingCalendarView,
): string {
  switch (view) {
    case "day":
      return anchor.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "week": {
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      const end = endOfWeek(anchor, { weekStartsOn: 0 });
      const sameMonth = start.getMonth() === end.getMonth();
      const startStr = format(start, sameMonth ? "MMM d" : "MMM d, yyyy");
      const endStr = format(end, "MMM d, yyyy");
      return `${startStr} – ${endStr}`;
    }
    case "month":
      return format(anchor, "MMMM yyyy");
    case "year":
      return format(anchor, "yyyy");
  }
}

export function bookingViewRange(
  anchor: Date,
  view: BookingCalendarView,
): { start: Date; end: Date } {
  switch (view) {
    case "day": {
      const start = new Date(anchor);
      start.setHours(0, 0, 0, 0);
      const end = new Date(anchor);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "week":
      return {
        start: startOfWeek(anchor, { weekStartsOn: 0 }),
        end: endOfWeek(anchor, { weekStartsOn: 0 }),
      };
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case "year":
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
  }
}

export function appointmentDateKeyInRange(
  dateKey: string,
  start: Date,
  end: Date,
): boolean {
  const d = parse(dateKey, "yyyy-MM-dd", new Date());
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

export function monthGridDays(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}
