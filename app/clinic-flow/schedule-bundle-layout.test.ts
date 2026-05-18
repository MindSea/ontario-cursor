import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAppointmentBlocks } from "./day-schedule-grid";
import {
  assignGreedyLanes,
  lanesUsedInCluster,
  layoutScheduleLaneCascade,
  layoutScheduleWeekCascade,
  maxVisibleColumnsForLayoutMode,
  startGroupHasStaggeredOverlap,
} from "./schedule-bundle-layout";
import { cascadeLanePositionStyle } from "./schedule-cascade-card";
import type { Appointment } from "./types";

function apt(
  partial: Pick<Appointment, "id" | "time" | "estimatedDurationMins"> &
    Partial<Appointment>,
): Appointment {
  return {
    id: partial.id,
    date: "2026-05-18",
    time: partial.time,
    patientId: partial.id,
    patientName: partial.id,
    dateOfBirth: "1950-01-01",
    room: "RM 1",
    stage: "PREVISIT",
    reason: "Visit",
    appointmentType: "Follow-up",
    estimatedDurationMins: partial.estimatedDurationMins,
    pcp: "Dr. Test",
    navigator: "Anna",
    ...partial,
  } as Appointment;
}

const MORNING_STAIRCASE = [
  apt({ id: "sarah", time: "08:00 AM", estimatedDurationMins: 60 }),
  apt({ id: "robert", time: "08:15 AM", estimatedDurationMins: 60 }),
  apt({ id: "james", time: "08:30 AM", estimatedDurationMins: 60 }),
  apt({ id: "maria", time: "09:00 AM", estimatedDurationMins: 60 }),
  apt({ id: "elena", time: "09:30 AM", estimatedDurationMins: 30 }),
] as const;

describe("assignGreedyLanes", () => {
  it("assigns stable lane indices by start order", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "sarah", time: "08:00 AM", estimatedDurationMins: 60 }),
      apt({ id: "robert", time: "08:15 AM", estimatedDurationMins: 60 }),
    ]);
    const lanes = assignGreedyLanes(blocks);

    assert.equal(lanes.get("sarah"), 0);
    assert.equal(lanes.get("robert"), 1);
    assert.equal(lanesUsedInCluster(lanes), 2);
  });
});

describe("startGroupHasStaggeredOverlap", () => {
  it("is false for a pure same-start trio", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "a", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "b", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "c", time: "02:00 PM", estimatedDurationMins: 30 }),
    ]);

    assert.equal(startGroupHasStaggeredOverlap(blocks, blocks[0]!.startSlot), false);
  });

  it("is true when david joins a 2:00 cluster", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "helen", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "evelyn", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "david", time: "02:15 PM", estimatedDurationMins: 60 }),
    ]);

    assert.equal(
      startGroupHasStaggeredOverlap(blocks, blocks[0]!.startSlot),
      true,
    );
  });
});

describe("layoutScheduleLaneCascade", () => {
  it("renders a lone visit at full width on clinic day", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "linda", time: "11:45 AM", estimatedDurationMins: 30 }),
    ]);
    const placements = layoutScheduleLaneCascade(blocks, "day-narrow");

    assert.equal(placements.length, 1);
    assert.equal(placements[0]!.columnCount, 1);
    assert.equal(placements[0]!.useFullColumnEqualSplit, false);

    const style = cascadeLanePositionStyle({
      block: placements[0]!.block,
      columnIndex: placements[0]!.columnIndex,
      columnCount: placements[0]!.columnCount,
      slotCssVar: "--cf-slot",
      spanSlots: 2,
      raised: false,
    });
    assert.equal(style.width, "calc(100% / 1)");
  });

  it("keeps sarah in lane 0 across the morning staircase cluster", () => {
    const blocks = buildAppointmentBlocks([...MORNING_STAIRCASE]);
    const placements = layoutScheduleLaneCascade(blocks, "day-narrow");
    const sarah = placements.find((p) => p.block.appointment.id === "sarah")!;

    assert.equal(sarah.columnIndex, 0);
    assert.equal(sarah.columnCount, 3);
    assert.equal(sarah.segmentCount, 1);
    assert.equal(sarah.useFullColumnEqualSplit, false);
  });

  it("splits four same-start visits equally across the column", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "a", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "b", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "c", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "d", time: "02:00 PM", estimatedDurationMins: 30 }),
    ]);
    const placements = layoutScheduleLaneCascade(blocks, "day-narrow");

    assert.equal(placements.length, 4);
    assert.ok(placements.every((p) => p.useFullColumnEqualSplit));
    assert.equal(placements[0]!.columnCount, 4);
  });

  it("uses lanes for a 2:00 trio once david overlaps at 2:15", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "helen", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "evelyn", time: "02:00 PM", estimatedDurationMins: 45 }),
      apt({ id: "samuel", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "david", time: "02:15 PM", estimatedDurationMins: 60 }),
    ]);
    const placements = layoutScheduleLaneCascade(blocks, "day-narrow");
    const david = placements.find((p) => p.block.appointment.id === "david")!;
    const helen = placements.find((p) => p.block.appointment.id === "helen")!;

    assert.equal(david.columnIndex, 3);
    assert.equal(david.columnCount, 4);
    assert.equal(helen.useFullColumnEqualSplit, false);
    assert.equal(helen.columnCount, 4);
  });

  it("splits two same-start visits 50/50 in week view", () => {
    const blocks = buildAppointmentBlocks([
      apt({ id: "a", time: "02:00 PM", estimatedDurationMins: 30 }),
      apt({ id: "b", time: "02:00 PM", estimatedDurationMins: 30 }),
    ]);
    const cascade = layoutScheduleWeekCascade(blocks);

    assert.equal(cascade.length, 2);
    assert.ok(cascade.every((p) => p.useFullColumnEqualSplit));
  });

  it("emits one placement per appointment", () => {
    const blocks = buildAppointmentBlocks([...MORNING_STAIRCASE]);
    const placements = layoutScheduleLaneCascade(blocks, "day-narrow");

    assert.equal(placements.length, MORNING_STAIRCASE.length);
    assert.ok(placements.every((p) => p.segmentCount === 1));
  });

  it("shows all lanes on day views without overflow cap", () => {
    assert.equal(maxVisibleColumnsForLayoutMode("day-narrow"), 32);
    assert.equal(maxVisibleColumnsForLayoutMode("day-wide"), 32);
  });
});
