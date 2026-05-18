"use client";

import {
  DAY_GRID_START_MIN,
  formatAxisSlotTime,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotRowBorderClass,
} from "@/app/clinic-flow/day-schedule-grid";
import { ScheduleBundleGrid } from "@/app/clinic-flow/schedule-bundle-grid";
import type { ScheduleCalendarLayoutMode } from "@/app/clinic-flow/schedule-bundle-layout";
import type { Appointment } from "@/app/clinic-flow/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const BOOKING_SLOT_HEIGHT_VAR = "--bk-slot";
export const BOOKING_SLOT_HEIGHT = "3.5rem";

export type BookingScheduleViewMode = "day" | "week";

function layoutModeForBookingView(
  viewMode: BookingScheduleViewMode,
  isMobile: boolean,
): ScheduleCalendarLayoutMode {
  if (viewMode === "week") return "week";
  return isMobile ? "day-compact" : "day-wide";
}

export function BookingScheduleTimeAxis({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-14 shrink-0 flex-col border-r border-border/20",
        className,
      )}
    >
      {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
        const slotStartMin = DAY_GRID_START_MIN + slotIndex * SLOT_MINUTES;
        const isHour = slotStartMin % 60 === 0;
        return (
          <div
            key={slotStartMin}
            role="row"
            className={cn(
              "flex h-14 w-full shrink-0 items-start justify-end pt-0.5 leading-none pr-1",
              slotRowBorderClass(slotStartMin),
            )}
          >
            <span
              className={cn(
                "whitespace-nowrap tabular-nums text-xs leading-none",
                isHour
                  ? "font-semibold text-foreground"
                  : "font-normal text-muted-foreground/70",
              )}
            >
              {formatAxisSlotTime(slotStartMin)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BookingScheduleDayColumn({
  appointments,
  onSelectAppointment,
  selectedId = "",
  viewMode = "day",
  className,
}: {
  appointments: readonly Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  selectedId?: string;
  viewMode?: BookingScheduleViewMode;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const layoutMode = layoutModeForBookingView(viewMode, isMobile);

  return (
    <div
      className={cn("relative min-h-0 min-w-0 flex-1", className)}
      style={{ minHeight: `calc(var(${BOOKING_SLOT_HEIGHT_VAR}) * ${SLOT_COUNT})` }}
      role="presentation"
    >
      <div
        className="pointer-events-none absolute inset-0 flex w-full flex-col"
        aria-hidden
      >
        {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
          const slotStartMin = DAY_GRID_START_MIN + slotIndex * SLOT_MINUTES;
          return (
            <div
              key={slotStartMin}
              className={cn(
                "flex h-14 w-full shrink-0 flex-row",
                slotRowBorderClass(slotStartMin),
              )}
            />
          );
        })}
      </div>

      <div className="absolute inset-y-0 left-0.5 right-0.5 overflow-hidden">
        <ScheduleBundleGrid
          appointments={appointments}
          layoutMode={layoutMode}
          selectedId={selectedId}
          onSelectAppointment={(id) => {
            const apt = appointments.find((a) => a.id === id);
            if (apt) onSelectAppointment(apt);
          }}
          slotCssVar={BOOKING_SLOT_HEIGHT_VAR}
        />
      </div>
    </div>
  );
}

export function BookingDayScheduleGrid({
  appointments,
  onSelectAppointment,
  showTimeAxis = true,
  className,
}: {
  appointments: readonly Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  showTimeAxis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full min-w-0", className)}
      style={{ [BOOKING_SLOT_HEIGHT_VAR as string]: BOOKING_SLOT_HEIGHT }}
    >
      <div
        className="flex min-h-0 w-full flex-row"
        style={{
          minHeight: `calc(var(${BOOKING_SLOT_HEIGHT_VAR}) * ${SLOT_COUNT})`,
        }}
        role="grid"
        aria-label="Day schedule, 15-minute intervals"
      >
        {showTimeAxis ? <BookingScheduleTimeAxis /> : null}
        <BookingScheduleDayColumn
          appointments={appointments}
          onSelectAppointment={onSelectAppointment}
          viewMode="day"
        />
      </div>
    </div>
  );
}
