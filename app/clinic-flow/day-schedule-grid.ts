import type { Appointment } from "./types";

/** Minutes from midnight for the start of the clinic day grid (inclusive). */
export const DAY_GRID_START_MIN = 8 * 60;
/** First minute *after* the day grid (5:00 PM); slot rows cover 08:00–16:45. */
const DAY_GRID_END_MIN = 17 * 60;
export const SLOT_MINUTES = 15;
export const SLOT_COUNT =
  (DAY_GRID_END_MIN - DAY_GRID_START_MIN) / SLOT_MINUTES;

function parseAppointmentMinutes(clock: string): number {
  const t = clock.trim().toUpperCase().replace(/\s+/g, " ");
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return Number.NaN;
  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const ap = match[3] as "AM" | "PM";
  if (ap === "PM" && hour !== 12) hour += 12;
  if (ap === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function formatAxisSlotTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function slotIndexForAppointment(a: Appointment): number | null {
  const mins = parseAppointmentMinutes(a.time);
  if (
    Number.isNaN(mins) ||
    mins < DAY_GRID_START_MIN ||
    mins >= DAY_GRID_END_MIN
  ) {
    return null;
  }
  return Math.floor((mins - DAY_GRID_START_MIN) / SLOT_MINUTES);
}

/** Default visit block height in 15-minute slots (60 minutes). */
const DEFAULT_DURATION_SLOTS = 4;

type AppointmentBlock = {
  appointment: Appointment;
  startSlot: number;
  durationSlots: number;
};

export function buildAppointmentBlocks(
  items: readonly Appointment[],
): AppointmentBlock[] {
  const out: AppointmentBlock[] = [];
  for (const a of items) {
    const startSlot = slotIndexForAppointment(a);
    if (startSlot === null) continue;
    out.push({
      appointment: a,
      startSlot,
      durationSlots: DEFAULT_DURATION_SLOTS,
    });
  }
  return out;
}

function blocksOverlap(a: AppointmentBlock, b: AppointmentBlock): boolean {
  const aEnd = a.startSlot + a.durationSlots;
  const bEnd = b.startSlot + b.durationSlots;
  return a.startSlot < bEnd && b.startSlot < aEnd;
}

function blocksActiveAtSlot(
  blocks: readonly AppointmentBlock[],
  slot: number,
): AppointmentBlock[] {
  return blocks.filter(
    (b) => b.startSlot <= slot && slot < b.startSlot + b.durationSlots,
  );
}

/** Max simultaneous visits overlapping this block's time span (only slots inside the visit). */
function maxConcurrentDuringBlock(
  blocks: readonly AppointmentBlock[],
  b: AppointmentBlock,
): number {
  const end = b.startSlot + b.durationSlots;
  let max = 0;
  for (let t = b.startSlot; t < end; t++) {
    max = Math.max(max, blocksActiveAtSlot(blocks, t).length);
  }
  return max;
}

type AppointmentBlockLayout = {
  block: AppointmentBlock;
  laneIndex: number;
  totalLanes: number;
};

/**
 * Greedy lanes: sort by startSlot; each visit takes the lowest lane index with no time conflict
 * in that lane. Width uses only max concurrency during that visit's span (1 → full width).
 */
function assignGreedyLanes(
  blocks: readonly AppointmentBlock[],
): Map<string, number> {
  const sorted = [...blocks].sort(
    (a, x) =>
      a.startSlot - x.startSlot ||
      a.appointment.id.localeCompare(x.appointment.id),
  );
  const laneBlocks: AppointmentBlock[][] = [];
  const laneById = new Map<string, number>();

  for (const b of sorted) {
    let L = 0;
    for (;;) {
      const inLane = laneBlocks[L] ?? [];
      laneBlocks[L] = inLane;
      const conflict = inLane.some((x) => blocksOverlap(x, b));
      if (!conflict) {
        inLane.push(b);
        laneById.set(b.appointment.id, L);
        break;
      }
      L++;
    }
  }
  return laneById;
}

export function layoutGreedyLanes(
  blocks: readonly AppointmentBlock[],
): AppointmentBlockLayout[] {
  if (blocks.length === 0) return [];
  const laneById = assignGreedyLanes(blocks);
  return blocks.map((block) => {
    const laneIndex = laneById.get(block.appointment.id) ?? 0;
    const peak = maxConcurrentDuringBlock(blocks, block);
    const totalLanes = Math.max(1, peak);
    return { block, laneIndex, totalLanes };
  });
}

/** Strong line on hour rows (:00); faint on quarter rows. */
export function slotRowBorderClass(slotStartMin: number): string {
  const isHourStart = slotStartMin % 60 === 0;
  return isHourStart
    ? "border-t border-border/60"
    : "border-t border-border/20";
}
