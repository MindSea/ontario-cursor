"use client";

import { useMemo } from "react";

import { buildAppointmentBlocks } from "./day-schedule-grid";
import {
  layoutScheduleLaneCascade,
  type ScheduleCalendarLayoutMode,
  type ScheduleLaneCascadePlacement,
} from "./schedule-bundle-layout";
import { ScheduleCascadeCard } from "./schedule-cascade-card";
import type { Appointment } from "./types";

function groupPlacementsByAppointment(
  placements: readonly ScheduleLaneCascadePlacement[],
): ScheduleLaneCascadePlacement[][] {
  const byId = new Map<string, ScheduleLaneCascadePlacement[]>();

  for (const placement of placements) {
    const id = placement.block.appointment.id;
    const list = byId.get(id) ?? [];
    list.push(placement);
    byId.set(id, list);
  }

  return [...byId.values()].map((segments) =>
    [...segments].sort((a, b) => a.segmentStartSlot - b.segmentStartSlot),
  );
}

export function ScheduleBundleGrid({
  appointments,
  layoutMode,
  selectedId,
  onSelectAppointment,
  slotCssVar = "--cf-slot",
}: {
  appointments: readonly Appointment[];
  layoutMode: ScheduleCalendarLayoutMode;
  selectedId: string;
  onSelectAppointment: (id: string) => void;
  slotCssVar?: string;
  /** @deprecated Popovers removed; lane stacks surface every visit. */
  weekFlyoutSide?: "left" | "right";
}) {
  const blocks = useMemo(
    () => buildAppointmentBlocks(appointments),
    [appointments],
  );

  const placements = useMemo(
    () => layoutScheduleLaneCascade(blocks, layoutMode),
    [blocks, layoutMode],
  );

  const cards = useMemo(
    () => groupPlacementsByAppointment(placements),
    [placements],
  );

  return (
    <>
      {cards.map((segments) => (
        <ScheduleCascadeCard
          key={segments[0]!.block.appointment.id}
          segments={segments}
          selectedId={selectedId}
          onSelectAppointment={onSelectAppointment}
          slotCssVar={slotCssVar}
        />
      ))}
    </>
  );
}
