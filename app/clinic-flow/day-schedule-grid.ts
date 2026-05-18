import type { Appointment } from "./types";

/** Minutes from midnight for the start of the clinic day grid (inclusive). */
export const DAY_GRID_START_MIN = 8 * 60;
/** First minute *after* the day grid (5:00 PM); slot rows cover 08:00–16:45. */
const DAY_GRID_END_MIN = 17 * 60;
export const SLOT_MINUTES = 15;
export const SLOT_COUNT =
  (DAY_GRID_END_MIN - DAY_GRID_START_MIN) / SLOT_MINUTES;

/** Side-by-side columns before "+N more" overflow (narrow schedule column). */
export const SCHEDULE_MAX_VISIBLE_LANES = 2;

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

function durationSlotsForAppointment(a: Appointment): number {
  const mins = a.estimatedDurationMins ?? 60;
  return Math.max(1, Math.ceil(mins / SLOT_MINUTES));
}

export type AppointmentBlock = {
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
      durationSlots: durationSlotsForAppointment(a),
    });
  }
  return out;
}

export function blocksOverlap(
  a: AppointmentBlock,
  b: AppointmentBlock,
): boolean {
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

function peakConcurrencyInCluster(
  blocks: readonly AppointmentBlock[],
): number {
  if (blocks.length === 0) return 0;
  let minStart = Number.POSITIVE_INFINITY;
  let maxEnd = 0;
  for (const b of blocks) {
    minStart = Math.min(minStart, b.startSlot);
    maxEnd = Math.max(maxEnd, b.startSlot + b.durationSlots);
  }
  let peak = 0;
  for (let t = minStart; t < maxEnd; t++) {
    peak = Math.max(peak, blocksActiveAtSlot(blocks, t).length);
  }
  return peak;
}

function buildOverlapClusters(
  blocks: readonly AppointmentBlock[],
): AppointmentBlock[][] {
  const visited = new Set<number>();
  const clusters: AppointmentBlock[][] = [];

  for (let i = 0; i < blocks.length; i++) {
    if (visited.has(i)) continue;
    const cluster: AppointmentBlock[] = [];
    const stack = [i];
    visited.add(i);

    while (stack.length > 0) {
      const idx = stack.pop()!;
      cluster.push(blocks[idx]!);
      for (let j = 0; j < blocks.length; j++) {
        if (visited.has(j)) continue;
        if (blocksOverlap(blocks[idx]!, blocks[j]!)) {
          visited.add(j);
          stack.push(j);
        }
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

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
    let lane = 0;
    for (;;) {
      const inLane = laneBlocks[lane] ?? [];
      laneBlocks[lane] = inLane;
      const conflict = inLane.some((x) => blocksOverlap(x, b));
      if (!conflict) {
        inLane.push(b);
        laneById.set(b.appointment.id, lane);
        break;
      }
      lane++;
    }
  }
  return laneById;
}

export type ScheduleBlockPlacement = {
  block: AppointmentBlock;
  laneIndex: number;
  /** Column count used for `left` / `width` (1 or 2). */
  displayColumnCount: number;
  clusterPeak: number;
};

export type ScheduleOverflowGroup = {
  id: string;
  hiddenBlocks: readonly AppointmentBlock[];
  anchorStartSlot: number;
  spanSlots: number;
  displayColumnCount: number;
};

export type ScheduleGridLayout = {
  placements: ScheduleBlockPlacement[];
  overflowGroups: ScheduleOverflowGroup[];
};

export type LayoutScheduleBlocksOptions = {
  /** Default 2 (day). Week view uses 1 column + overflow. */
  maxVisibleLanes?: number;
};

/**
 * @deprecated Prefer {@link layoutScheduleLaneCascade} from `./schedule-bundle-layout`.
 * Legacy adapter for placements + separate overflow groups.
 */
export function layoutScheduleBlocks(
  blocks: readonly AppointmentBlock[],
  options?: LayoutScheduleBlocksOptions,
): ScheduleGridLayout {
  const maxVisibleLanes = options?.maxVisibleLanes ?? SCHEDULE_MAX_VISIBLE_LANES;
  const placements: ScheduleBlockPlacement[] = [];
  const overflowGroups: ScheduleOverflowGroup[] = [];

  const clusters = buildOverlapClusters(blocks);
  let clusterSeq = 0;

  for (const cluster of clusters) {
    const clusterPeak = peakConcurrencyInCluster(cluster);
    const displayColumnCount =
      clusterPeak <= 1 ? 1 : maxVisibleLanes;
    const laneById = assignGreedyLanes(cluster);

    const hidden: AppointmentBlock[] = [];
    for (const block of cluster) {
      const laneIndex = laneById.get(block.appointment.id) ?? 0;
      if (laneIndex < maxVisibleLanes) {
        placements.push({
          block,
          laneIndex,
          displayColumnCount,
          clusterPeak,
        });
      } else {
        hidden.push(block);
      }
    }

    if (hidden.length > 0) {
      const anchorStartSlot = Math.min(...hidden.map((b) => b.startSlot));
      const anchorEndSlot = Math.max(
        ...hidden.map((b) => b.startSlot + b.durationSlots),
      );
      overflowGroups.push({
        id: `overflow-${clusterSeq}`,
        hiddenBlocks: hidden,
        anchorStartSlot,
        spanSlots: Math.max(1, anchorEndSlot - anchorStartSlot),
        displayColumnCount,
      });
    }
    clusterSeq++;
  }

  return { placements, overflowGroups };
}

/** @deprecated Prefer {@link layoutScheduleBlocks}. */
export type AppointmentBlockLayout = {
  block: AppointmentBlock;
  laneIndex: number;
  totalLanes: number;
};

/** @deprecated Prefer {@link layoutScheduleBlocks}. */
export function layoutGreedyLanes(
  blocks: readonly AppointmentBlock[],
): AppointmentBlockLayout[] {
  const { placements } = layoutScheduleBlocks(blocks);
  return placements.map((p) => ({
    block: p.block,
    laneIndex: p.laneIndex,
    totalLanes: p.displayColumnCount,
  }));
}

/** Strong line on hour rows (:00); faint on quarter rows. */
export function slotRowBorderClass(slotStartMin: number): string {
  const isHourStart = slotStartMin % 60 === 0;
  return isHourStart
    ? "border-t border-border/60"
    : "border-t border-border/20";
}
