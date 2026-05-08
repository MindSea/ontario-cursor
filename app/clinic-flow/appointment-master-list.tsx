"use client";

import { useEffect, useMemo } from "react";

import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment, AppointmentStage } from "./types";
import { MutedTagBadge, toTitleCaseTagLabel } from "./muted-tag-badge";
import { formatAppointmentStage } from "./stage-display";

import {
  buildAppointmentBlocks,
  DAY_GRID_START_MIN,
  formatAxisSlotTime,
  layoutGreedyLanes,
  SLOT_COUNT,
  SLOT_MINUTES,
  slotRowBorderClass,
} from "./day-schedule-grid";
import { ScheduleDateRow } from "./schedule-date-row";

/**
 * Care Management: abbreviated when the visit card is narrow; full title-case label when wider.
 */
function StageBadgeLabel({ stage }: { stage: AppointmentStage }) {
  if (stage === "CARE MANAGEMENT") {
    return (
      <>
        <span className="block truncate @min-[11rem]/visit:hidden">
          Care Mgmt
        </span>
        <span className="hidden truncate @min-[11rem]/visit:inline">
          {formatAppointmentStage(stage)}
        </span>
      </>
    );
  }
  if (stage === "COMPLETED") {
    return (
      <>
        <span className="block truncate @min-[11rem]/visit:hidden">Done</span>
        <span className="hidden truncate @min-[11rem]/visit:inline">
          {formatAppointmentStage(stage)}
        </span>
      </>
    );
  }
  return (
    <span className="block truncate">{formatAppointmentStage(stage)}</span>
  );
}

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
}) {
  const blockLayouts = useMemo(() => {
    const blocks = buildAppointmentBlocks(items);
    return layoutGreedyLanes(blocks);
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
        />
      )}

      <div
        className={cn(
          "w-full ",
          fullBleed && hideDateRow
            ? "w-full "
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
          aria-label="Day schedule, 15-minute intervals, 60-minute visits"
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
              {blockLayouts.map(({ block, laneIndex, totalLanes }) => {
                const endSlot = Math.min(
                  block.startSlot + block.durationSlots,
                  SLOT_COUNT,
                );
                const spanSlots = Math.max(1, endSlot - block.startSlot);
                const isSelected = block.appointment.id === selectedId;
                const multi = totalLanes > 1;

                return (
                  <button
                    key={block.appointment.id}
                    type="button"
                    data-appointment-id={block.appointment.id}
                    onClick={() => onSelectId(block.appointment.id)}
                    className={cn(
                      "@container/visit absolute flex min-h-0 flex-col gap-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                      isSelected
                        ? "z-10 border-border bg-muted shadow-xl ring-1 ring-inset ring-primary/35"
                        : "z-10 border-border bg-muted/30 hover:bg-muted/45",
                    )}
                    style={{
                      top: `calc(${block.startSlot} * var(--cf-slot) + 2px)`,
                      height: `calc(${spanSlots} * var(--cf-slot) - 4px)`,
                      left: multi
                        ? `calc(${laneIndex} * (100% / ${totalLanes}))`
                        : "0",
                      width: multi ? `calc(100% / ${totalLanes})` : "100%",
                    }}
                  >
                    {isSelected ? (
                      <span
                        className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 w-1 rounded-l-sm bg-primary"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        "line-clamp-1 wrap-break-word pl-1 font-medium",
                        textBody,
                      )}
                    >
                      {block.appointment.patientName}
                    </span>
                    <span
                      className={cn(
                        "line-clamp-2 wrap-break-word pl-1",
                        textMeta,
                      )}
                    >
                      {block.appointment.reason}
                    </span>
                    <div
                      className={cn(
                        "flex w-full gap-1 overflow-hidden pl-1",
                        "flex-col items-start",
                        "@min-[10.5rem]/visit:flex-row @min-[10.5rem]/visit:flex-wrap @min-[10.5rem]/visit:items-start",
                      )}
                    >
                      <MutedTagBadge
                        surface="onMutedParent"
                        className="max-w-full self-start tabular-nums"
                      >
                        <span className="block truncate">
                          {toTitleCaseTagLabel(block.appointment.room)}
                        </span>
                      </MutedTagBadge>
                      <MutedTagBadge
                        surface="onMutedParent"
                        className="max-w-full self-start"
                      >
                        <StageBadgeLabel stage={block.appointment.stage} />
                      </MutedTagBadge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
