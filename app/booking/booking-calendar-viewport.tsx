"use client";

import { useMemo, type CSSProperties } from "react";
import { format, isSameDay } from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { cn } from "@/lib/utils";

import {
  BOOKING_SLOT_HEIGHT,
  BOOKING_SLOT_HEIGHT_VAR,
  BOOKING_WEEK_HEADER_ROW_HEIGHT,
  bookingScheduleGridHeight,
  BookingScheduleDayColumn,
  BookingScheduleTimeAxis,
} from "./booking-day-schedule-grid";
import {
  bookingCalendarPanelClass,
  bookingCalendarPanelOuterClass,
  bookingCalendarViewportScrollClass,
} from "./booking-sticky-stack";
import {
  BookingWeekDayHeader,
  BookingWeekGutterCorner,
  useBookingWeekDays,
} from "./booking-week-view";

import "./booking-week-container.css";

const TIME_GUTTER_CLASS = "w-14 shrink-0";

const stickyCornerClass =
  "sticky left-0 top-0 z-40 shrink-0 bg-background";

const stickyDayHeaderRowClass =
  "sticky top-0 z-40 w-full min-w-0 shrink-0 bg-background";

const stickyTimeGutterDayClass =
  "sticky left-0 z-20 shrink-0 self-start bg-background";

/** Below the day-of-week band so times slide under the header, not over it. */
const stickyTimeGutterWeekClass =
  "sticky left-0 z-10 shrink-0 self-start bg-background";

function slotStyle(): CSSProperties {
  return { [BOOKING_SLOT_HEIGHT_VAR]: BOOKING_SLOT_HEIGHT } as CSSProperties;
}

function weekDayGridHeightStyle(height: string): CSSProperties {
  return { height, minHeight: height };
}

export function BookingCalendarPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={bookingCalendarPanelOuterClass}>
      <div className={cn(bookingCalendarPanelClass, className)}>{children}</div>
    </div>
  );
}

/** Day view: pinned time column, vertical scroll in the panel. */
export function BookingCalendarDayViewport({
  appointments,
  onSelectAppointment,
}: {
  appointments: readonly Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
}) {
  const gridHeight = bookingScheduleGridHeight(BOOKING_SLOT_HEIGHT_VAR);

  return (
    <div
      className={cn(
        bookingCalendarViewportScrollClass,
        "overflow-x-hidden overflow-y-auto",
      )}
      role="region"
      aria-label="Day schedule"
    >
      <div
        className="flex w-full min-w-0"
        style={{ ...slotStyle(), minHeight: gridHeight }}
      >
        <div className={cn(stickyTimeGutterDayClass, TIME_GUTTER_CLASS)}>
          <BookingScheduleTimeAxis className="border-r border-border/20" />
        </div>
        <div
          className="relative min-w-0 flex-1"
          style={{ height: gridHeight, minHeight: gridHeight }}
        >
          <BookingScheduleDayColumn
            appointments={appointments}
            onSelectAppointment={onSelectAppointment}
            viewMode="day"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Week view: one scroll surface (X + Y when the panel is narrow). Layout mode
 * follows @container booking-panel width (accounts for sidebar), not viewport.
 */
export function BookingCalendarWeekViewport({
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
  const { days, today } = useBookingWeekDays(anchor);
  const gridHeight = bookingScheduleGridHeight(BOOKING_SLOT_HEIGHT_VAR);

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
      className={cn(bookingCalendarViewportScrollClass, "booking-week-scroll")}
      role="region"
      aria-label="Week schedule"
    >
      <div className="booking-week-strip inline-block align-top" style={slotStyle()}>
        <div
          className={cn(
            stickyDayHeaderRowClass,
            "booking-week-header-row flex border-b border-border/40",
          )}
        >
          <BookingWeekGutterCorner
            className={cn(stickyCornerClass, TIME_GUTTER_CLASS)}
            style={{ height: BOOKING_WEEK_HEADER_ROW_HEIGHT }}
          />
          <div
            className="booking-week-day-grid min-w-0 flex-1"
            style={weekDayGridHeightStyle(BOOKING_WEEK_HEADER_ROW_HEIGHT)}
          >
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              return (
                <BookingWeekDayHeader
                  key={`hdr-${key}`}
                  day={day}
                  isToday={isSameDay(day, today)}
                  onSelectDay={onSelectDay}
                />
              );
            })}
          </div>
        </div>

        <div className="booking-week-body-row flex">
          <div className={cn(stickyTimeGutterWeekClass, TIME_GUTTER_CLASS)}>
            <BookingScheduleTimeAxis className="border-r border-border/20" />
          </div>
          <div
            className="booking-week-day-grid min-w-0 flex-1"
            style={weekDayGridHeightStyle(gridHeight)}
          >
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const list = byDate.get(key) ?? [];
              return (
                <div
                  key={`col-${key}`}
                  className="relative min-h-0 overflow-hidden border-l border-border/20"
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
    </div>
  );
}
