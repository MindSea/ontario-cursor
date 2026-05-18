"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

import {
  buildAppointmentBlocks,
  DAY_GRID_START_MIN,
  formatAxisSlotTime,
  layoutScheduleBlocks,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotRowBorderClass,
} from "./day-schedule-grid";
import type { FilteredMatchDayOption } from "./schedule-date-row";
import { ScheduleDateRow } from "./schedule-date-row";
import { ScheduleOverflowPopover } from "./schedule-overflow-popover";
import { ScheduleVisitGridTile } from "./schedule-visit-grid-tile";
import type { Appointment } from "./types";

export function AppointmentMasterList({
  appointments: items,
  selectedId,
  onSelectId,
  selectedDate,
  onShiftDay,
  onGoToday,
  className,
  fullBleed = false,
  hideDateRow = false,
  filteredMatchDayOptions,
  onSelectFilteredCalendarDay,
}: {
  appointments: readonly Appointment[];
  selectedId: string;
  onSelectId: (id: string) => void;
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  className?: string;
  /** Mobile: edge-to-edge grid and tighter chrome so the calendar uses full width. */
  fullBleed?: boolean;
  /** When true, only the scrollable grid is rendered (date row is a sibling above). */
  hideDateRow?: boolean;
  filteredMatchDayOptions?: readonly FilteredMatchDayOption[];
  onSelectFilteredCalendarDay?: (dateKey: string) => void;
}) {
  const { placements, overflowGroups } = useMemo(() => {
    const blocks = buildAppointmentBlocks(items);
    return layoutScheduleBlocks(blocks);
  }, [items]);

  useEffect(() => {
    if (!selectedId) return;
    const el = document.querySelector(
      `[data-appointment-id="${CSS.escape(selectedId)}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, items]);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col",
        fullBleed && hideDateRow
          ? "w-full "
          : fullBleed
            ? "w-full "
            : "h-full flex-1",
        className,
      )}
    >
      {hideDateRow ? null : (
        <ScheduleDateRow
          selectedDate={selectedDate}
          onShiftDay={onShiftDay}
          onGoToday={onGoToday}
          fullBleed={fullBleed}
          filteredMatchDayOptions={filteredMatchDayOptions}
          onSelectFilteredCalendarDay={onSelectFilteredCalendarDay}
        />
      )}

      <div
        className={cn(
          "w-full",
          fullBleed && hideDateRow
            ? "w-full px-3 py-4 md:px-4"
            : fullBleed
              ? "min-h-0"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
        style={{ ["--cf-slot" as string]: "3.5rem" }}
      >
        <div
          className="flex min-h-0 w-full flex-row"
          style={{ minHeight: `calc(var(--cf-slot) * ${SLOT_COUNT})` }}
          role="grid"
          aria-label="Day schedule, 15-minute intervals"
        >
          <div className="flex w-14 shrink-0 flex-col border-r border-border/20">
            {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
              const slotStartMin =
                DAY_GRID_START_MIN + slotIndex * SLOT_MINUTES;
              const isHour = slotStartMin % 60 === 0;
              return (
                <div
                  key={slotStartMin}
                  role="row"
                  className={cn(
                    "flex h-14 w-full shrink-0 items-start justify-end pt-0.5 leading-none",
                    fullBleed ? "pr-1" : "pr-1.5",
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

          <div
            className={cn(
              "relative min-h-0",
              fullBleed && hideDateRow ? "w-full" : "flex-1",
            )}
            style={{ minHeight: `calc(var(--cf-slot) * ${SLOT_COUNT})` }}
            role="presentation"
          >
            <div
              className="pointer-events-none absolute inset-0 flex w-full flex-col"
              aria-hidden
            >
              {Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
                const slotStartMin =
                  DAY_GRID_START_MIN + slotIndex * SLOT_MINUTES;
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

            <div
              className={cn(
                "absolute inset-y-0",
                fullBleed ? "left-0 right-0" : "left-1 right-1",
              )}
            >
              {placements.map(({ block, laneIndex, displayColumnCount }) => {
                  const endSlot = Math.min(
                    block.startSlot + block.durationSlots,
                    SLOT_COUNT,
                  );
                  const spanSlots = Math.max(1, endSlot - block.startSlot);
                  const multi = displayColumnCount > 1;

                  return (
                    <ScheduleVisitGridTile
                      key={block.appointment.id}
                      appointment={block.appointment}
                      isSelected={block.appointment.id === selectedId}
                      spanSlots={spanSlots}
                      onSelect={() => onSelectId(block.appointment.id)}
                      style={{
                        top: `calc(${block.startSlot} * var(--cf-slot) + 2px)`,
                        height: `calc(${spanSlots} * var(--cf-slot) - 4px)`,
                        left: multi
                          ? `calc(${laneIndex} * (100% / ${displayColumnCount}))`
                          : "0",
                        width: multi
                          ? `calc(100% / ${displayColumnCount})`
                          : "100%",
                      }}
                    />
                  );
                },
              )}

              {overflowGroups.map((group) => (
                <ScheduleOverflowPopover
                  key={group.id}
                  hiddenBlocks={group.hiddenBlocks}
                  selectedId={selectedId}
                  onSelectAppointment={onSelectId}
                  anchorStartSlot={group.anchorStartSlot}
                  spanSlots={group.spanSlots}
                  displayColumnCount={group.displayColumnCount}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
