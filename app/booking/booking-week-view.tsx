"use client";

import { useMemo, type CSSProperties } from "react";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";

import { textBody, textCaption } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Minimum day column width when the week strip scrolls horizontally (below md). */
export const WEEK_DAY_COLUMN_MIN_NARROW = "5.5rem";

/** Corner cell aligned with day headers (same padding / line boxes). */
export function BookingWeekGutterCorner({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "box-border min-w-0 border-r border-border/20 bg-background px-1 py-1",
        className,
      )}
      style={style}
      aria-hidden
    >
      <span
        className={cn(
          "invisible block uppercase tracking-wide",
          textCaption,
        )}
      >
        Sun
      </span>
      <span className={cn("invisible font-semibold", textBody)}>May 00</span>
    </div>
  );
}

export function BookingWeekDayHeader({
  day,
  isToday,
  onSelectDay,
}: {
  day: Date;
  isToday: boolean;
  onSelectDay: (date: Date) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectDay(day)}
      className={cn(
        "box-border flex h-full min-h-0 min-w-0 flex-col justify-center border-l border-border/20 px-0.5 py-1 text-center leading-tight hover:bg-muted/40",
        isToday && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "block uppercase tracking-wide text-muted-foreground",
          textCaption,
        )}
      >
        {format(day, "EEE")}
      </span>
      <span
        className={cn(
          "font-semibold",
          textBody,
          isToday ? "text-primary" : "text-foreground",
        )}
      >
        {format(day, "MMM d")}
      </span>
    </button>
  );
}

export function useBookingWeekDays(anchor: Date) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  return { days, today };
}
