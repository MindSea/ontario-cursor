"use client";

import { useMemo } from "react";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
} from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { textCaption } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { monthGridDays } from "./booking-calendar-utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BookingMonthView({
  anchor,
  appointments,
  onSelectDay,
}: {
  anchor: Date;
  appointments: readonly Appointment[];
  onSelectDay: (date: Date) => void;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const gridDays = useMemo(() => monthGridDays(anchor), [anchor]);

  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className={cn(
              "py-1 text-center font-medium text-muted-foreground",
              textCaption,
            )}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const count = countByDate.get(key) ?? 0;
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-start rounded-md border px-1 py-1.5 text-center transition-colors",
                inMonth
                  ? "border-border/50 bg-card hover:bg-muted/40"
                  : "border-transparent bg-transparent text-muted-foreground/50 hover:bg-muted/20",
                isToday && "ring-1 ring-primary/40",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday ? "text-primary" : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              {count > 0 ? (
                <span
                  className={cn(
                    "mt-1 rounded-full bg-primary/10 px-1.5 py-0.5 tabular-nums text-primary",
                    textCaption,
                  )}
                >
                  {count}
                </span>
              ) : (
                <span className="mt-1 h-5" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
