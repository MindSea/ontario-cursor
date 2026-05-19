"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import {
  BookingWeekVisitTile,
  type BookingVisitTileDisplay,
} from "@/app/booking/booking-week-visit-tile";
import { cn } from "@/lib/utils";

import { SLOT_COUNT } from "./day-schedule-grid";
import type { ScheduleLaneCascadePlacement } from "./schedule-bundle-layout";

const CASCADE_Z_BASE = 10;
const CASCADE_Z_RAISED = 100;

const SLOT_HEIGHT_FALLBACK = "3.5rem";

function slotCssVarExpr(slotCssVar: string): string {
  return `var(${slotCssVar}, ${SLOT_HEIGHT_FALLBACK})`;
}

function slotHeightCalc(spanSlots: number, slotCssVar: string): string {
  return `calc(${spanSlots} * ${slotCssVarExpr(slotCssVar)} - 4px)`;
}

export function cascadeStackZIndex(raised: boolean): number {
  if (raised) return CASCADE_Z_RAISED;
  return CASCADE_Z_BASE;
}

function segmentSpanSlots(
  placement: Pick<
    ScheduleLaneCascadePlacement,
    "segmentStartSlot" | "segmentDurationSlots"
  >,
): number {
  return Math.max(
    1,
    Math.min(
      placement.segmentDurationSlots,
      SLOT_COUNT - placement.segmentStartSlot,
    ),
  );
}

/** Equal horizontal slices for a same-start group (full column width). */
export function cascadeEqualColumnPositionStyle({
  block,
  sameStartColumnIndex,
  sameStartColumnCount,
  slotCssVar,
  spanSlots,
  raised,
}: {
  block: ScheduleLaneCascadePlacement["block"];
  sameStartColumnIndex: number;
  sameStartColumnCount: number;
  slotCssVar: string;
  spanSlots: number;
  raised: boolean;
}): CSSProperties {
  const count = Math.max(1, sameStartColumnCount);
  const index = sameStartColumnIndex;

  return {
    top: `calc(${block.startSlot} * ${slotCssVarExpr(slotCssVar)} + 2px)`,
    height: slotHeightCalc(spanSlots, slotCssVar),
    left: `calc(100% / ${count} * ${index})`,
    width: `calc(100% / ${count})`,
    zIndex: cascadeStackZIndex(raised),
  };
}

/** Stable lane column for staggered overlap (full visit height). */
export function cascadeLanePositionStyle({
  block,
  columnIndex,
  columnCount,
  slotCssVar,
  spanSlots,
  raised,
}: {
  block: ScheduleLaneCascadePlacement["block"];
  columnIndex: number;
  columnCount: number;
  slotCssVar: string;
  spanSlots: number;
  raised: boolean;
}): CSSProperties {
  const count = Math.max(1, columnCount);
  const index = Math.min(columnIndex, count - 1);

  return {
    top: `calc(${block.startSlot} * ${slotCssVarExpr(slotCssVar)} + 2px)`,
    height: slotHeightCalc(spanSlots, slotCssVar),
    left: `calc(100% / ${count} * ${index})`,
    width: `calc(100% / ${count})`,
    zIndex: cascadeStackZIndex(raised),
  };
}

export function cascadeSegmentPositionStyle(
  placement: Pick<
    ScheduleLaneCascadePlacement,
    | "block"
    | "columnIndex"
    | "columnCount"
    | "sameStartColumnIndex"
    | "sameStartColumnCount"
    | "useFullColumnEqualSplit"
  > & {
    slotCssVar: string;
    spanSlots: number;
    raised: boolean;
  },
): CSSProperties {
  const {
    block,
    columnIndex,
    columnCount,
    sameStartColumnIndex,
    sameStartColumnCount,
    useFullColumnEqualSplit,
    slotCssVar,
    spanSlots,
    raised,
  } = placement;

  if (useFullColumnEqualSplit) {
    return cascadeEqualColumnPositionStyle({
      block,
      sameStartColumnIndex,
      sameStartColumnCount,
      slotCssVar,
      spanSlots,
      raised,
    });
  }

  return cascadeLanePositionStyle({
    block,
    columnIndex,
    columnCount,
    slotCssVar,
    spanSlots,
    raised,
  });
}

/** @deprecated Use {@link cascadeLanePositionStyle}. */
export const cascadeConcurrentFillPositionStyle = cascadeLanePositionStyle;

/** Head segment carries the visit label (real start slot). */
export function isHeadSegment(placement: ScheduleLaneCascadePlacement): boolean {
  return placement.segmentStartSlot === placement.block.startSlot;
}

export function ScheduleCascadeCard({
  segments,
  selectedId,
  onSelectAppointment,
  slotCssVar,
  tileDisplay = "compact",
  className,
}: {
  segments: readonly ScheduleLaneCascadePlacement[];
  selectedId: string;
  onSelectAppointment: (id: string) => void;
  slotCssVar: string;
  tileDisplay?: BookingVisitTileDisplay;
  className?: string;
}) {
  const [hoverRaised, setHoverRaised] = useState(false);
  const [canHover, setCanHover] = useState(false);

  const placement = segments[0]!;
  const appointment = placement.block.appointment;
  const isSelected = appointment.id === selectedId;
  const raised = isSelected || (canHover && hoverRaised);
  const spanSlots = segmentSpanSlots(placement);
  const positionStyle = cascadeSegmentPositionStyle({
    ...placement,
    slotCssVar,
    spanSlots,
    raised,
  });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div
      className={cn("appointment-card group/card absolute min-h-7", className)}
      style={positionStyle}
      data-appointment-id={appointment.id}
      onMouseEnter={() => {
        if (canHover) setHoverRaised(true);
      }}
      onMouseLeave={() => {
        if (canHover) setHoverRaised(false);
      }}
    >
      <BookingWeekVisitTile
        variant="cascade"
        display={tileDisplay}
        spanSlots={spanSlots}
        appointment={appointment}
        isSelected={isSelected}
        onSelect={() => onSelectAppointment(appointment.id)}
      />
    </div>
  );
}
