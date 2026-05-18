"use client";

import { useMemo } from "react";

import {
  buildAppointmentBlocks,
  DAY_GRID_START_MIN,
  formatAxisSlotTime,
  layoutScheduleBlocks,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotRowBorderClass,
} from "@/app/clinic-flow/day-schedule-grid";
import { ScheduleOverflowPopover } from "@/app/clinic-flow/schedule-overflow-popover";
import { ScheduleVisitGridTile } from "@/app/clinic-flow/schedule-visit-grid-tile";
import type { Appointment } from "@/app/clinic-flow/types";
import { cn } from "@/lib/utils";

import { BookingWeekVisitTile } from "./booking-week-visit-tile";

export const BOOKING_SLOT_HEIGHT_VAR = "--bk-slot";
export const BOOKING_SLOT_HEIGHT = "3.5rem";

export type BookingScheduleViewMode = "day" | "week";

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
  const isWeek = viewMode === "week";

  const { placements, overflowGroups } = useMemo(() => {
    const blocks = buildAppointmentBlocks(appointments);
    return layoutScheduleBlocks(blocks, {
      maxVisibleLanes: isWeek ? 1 : undefined,
    });
  }, [appointments, isWeek]);

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

      <div className="absolute inset-y-0 left-0.5 right-0.5">
        {placements.map(({ block, laneIndex, displayColumnCount }) => {
          const endSlot = Math.min(
            block.startSlot + block.durationSlots,
            SLOT_COUNT,
          );
          const spanSlots = Math.max(1, endSlot - block.startSlot);
          const multi = displayColumnCount > 1;
          const positionStyle = {
            top: `calc(${block.startSlot} * var(${BOOKING_SLOT_HEIGHT_VAR}) + 2px)`,
            height: `calc(${spanSlots} * var(${BOOKING_SLOT_HEIGHT_VAR}) - 4px)`,
            left: multi
              ? `calc(${laneIndex} * (100% / ${displayColumnCount}))`
              : "0",
            width: multi ? `calc(100% / ${displayColumnCount})` : "100%",
          };

          if (isWeek) {
            return (
              <BookingWeekVisitTile
                key={block.appointment.id}
                appointment={block.appointment}
                isSelected={block.appointment.id === selectedId}
                onSelect={() => onSelectAppointment(block.appointment)}
                style={positionStyle}
              />
            );
          }

          return (
            <ScheduleVisitGridTile
              key={block.appointment.id}
              appointment={block.appointment}
              isSelected={block.appointment.id === selectedId}
              spanSlots={spanSlots}
              onSelect={() => onSelectAppointment(block.appointment)}
              style={positionStyle}
            />
          );
        })}

        {overflowGroups.map((group) => (
          <ScheduleOverflowPopover
            key={group.id}
            hiddenBlocks={group.hiddenBlocks}
            selectedId={selectedId}
            onSelectAppointment={(id) => {
              const apt = appointments.find((a) => a.id === id);
              if (apt) onSelectAppointment(apt);
            }}
            anchorStartSlot={group.anchorStartSlot}
            spanSlots={group.spanSlots}
            displayColumnCount={group.displayColumnCount}
            slotCssVar={BOOKING_SLOT_HEIGHT_VAR}
          />
        ))}
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
