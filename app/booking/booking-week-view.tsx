"use client";

import { useMemo } from "react";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { textBody, textCaption } from "@/lib/typography";
import { cn } from "@/lib/utils";

import {
  BOOKING_SLOT_HEIGHT,
  BOOKING_SLOT_HEIGHT_VAR,
  BookingScheduleDayColumn,
  BookingScheduleTimeAxis,
} from "./booking-day-schedule-grid";

export function BookingWeekView({
  anchor,
  appointments,
  onSelectAppointment,
  onSelectDay,
}: {
  anchor: Date;
  appointments: readonly Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  onSelectDay: (date: Date) => void;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const list = map.get(apt.date) ?? [];
      list.push(apt);
      map.set(apt.date, list);
    }
    return map;
  }, [appointments]);

  return (
    <div
      className="overflow-x-auto overscroll-x-contain"
      style={{ [BOOKING_SLOT_HEIGHT_VAR as string]: BOOKING_SLOT_HEIGHT }}
    >
      <div className="min-w-[52rem]">
        <div className="mb-0 grid grid-cols-[3.5rem_repeat(7,minmax(6.5rem,1fr))]">
          <div className="border-b border-border/40" aria-hidden />
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isToday = isSameDay(day, today);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  "border-b border-border/40 px-1 py-1.5 text-center hover:bg-muted/40",
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
          })}
        </div>

        <div className="flex min-h-0 w-full flex-row">
          <BookingScheduleTimeAxis />
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const list = byDate.get(key) ?? [];
            return (
              <div
                key={key}
                className="min-w-0 flex-1 overflow-hidden border-l border-border/20"
              >
                <BookingScheduleDayColumn
                  appointments={list}
                  onSelectAppointment={onSelectAppointment}
                  viewMode="week"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
