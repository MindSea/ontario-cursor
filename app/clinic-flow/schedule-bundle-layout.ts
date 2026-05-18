import {
  blocksOverlap,
  type AppointmentBlock,
} from "./day-schedule-grid";

/** Adaptive visible column caps per calendar surface. */
export type ScheduleCalendarLayoutMode =
  | "week"
  | "day-compact"
  | "day-narrow"
  | "day-wide";

/** Max side-by-side lanes (no overflow popover; all visits render). */
export function maxVisibleColumnsForLayoutMode(
  mode: ScheduleCalendarLayoutMode,
): number {
  switch (mode) {
    case "week":
    case "day-compact":
      return 1;
    case "day-narrow":
    case "day-wide":
      return 32;
  }
}

export type ScheduleLaneCascadePlacement = {
  id: string;
  block: AppointmentBlock;
  /** Segment top (equals block.startSlot). */
  segmentStartSlot: number;
  segmentDurationSlots: number;
  /** Lane index or same-start column index (left → right). */
  columnIndex: number;
  /** Lane count or same-start group size for width. */
  columnCount: number;
  /** Left-to-right index among visits with the same start slot. */
  sameStartColumnIndex: number;
  /** Total visits sharing this block's start slot. */
  sameStartColumnCount: number;
  /** Same-start group with no staggered overlap: equal slices for the whole visit. */
  useFullColumnEqualSplit: boolean;
  /** Always 0 — one tile per visit (no width-reflow segments). */
  segmentIndex: number;
  /** Always 1. */
  segmentCount: number;
};

/** Start time ascending; at the same start, longest visit first. */
function sortBlocksForSameStartGroup(
  a: AppointmentBlock,
  b: AppointmentBlock,
): number {
  return (
    b.durationSlots - a.durationSlots ||
    a.appointment.time.localeCompare(b.appointment.time) ||
    a.appointment.id.localeCompare(b.appointment.id)
  );
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

function groupBlocksByStartSlot(
  blocks: readonly AppointmentBlock[],
): Map<number, AppointmentBlock[]> {
  const byStart = new Map<number, AppointmentBlock[]>();
  for (const block of blocks) {
    const list = byStart.get(block.startSlot) ?? [];
    list.push(block);
    byStart.set(block.startSlot, list);
  }
  return byStart;
}

/** Greedy lane assignment: earliest start first, stable lane index per visit. */
export function assignGreedyLanes(
  cluster: readonly AppointmentBlock[],
): Map<string, number> {
  const sorted = [...cluster].sort(
    (a, b) =>
      a.startSlot - b.startSlot ||
      a.appointment.id.localeCompare(b.appointment.id),
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

export function lanesUsedInCluster(laneById: ReadonlyMap<string, number>): number {
  let max = 0;
  for (const lane of laneById.values()) {
    max = Math.max(max, lane + 1);
  }
  return Math.max(1, max);
}

/** True when a different-start visit overlaps this same-start group. */
export function startGroupHasStaggeredOverlap(
  cluster: readonly AppointmentBlock[],
  startSlot: number,
): boolean {
  const group = cluster.filter((b) => b.startSlot === startSlot);
  if (group.length <= 1) return false;

  const groupEnd = Math.max(
    ...group.map((b) => b.startSlot + b.durationSlots),
  );

  for (const other of cluster) {
    if (other.startSlot === startSlot) continue;
    const otherEnd = other.startSlot + other.durationSlots;
    if (other.startSlot < groupEnd && otherEnd > startSlot) {
      return true;
    }
  }
  return false;
}

/**
 * Week / compact: single-column cascade; same-start pairs split 50/50.
 * Day views: same-start equal split when no staggered overlap; else stable lanes.
 */
export function layoutScheduleLaneCascade(
  blocks: readonly AppointmentBlock[],
  layoutMode: ScheduleCalendarLayoutMode,
): ScheduleLaneCascadePlacement[] {
  const maxVisible = maxVisibleColumnsForLayoutMode(layoutMode);
  const useLaneLayout = maxVisible > 1;
  const clusters = buildOverlapClusters(blocks);
  const placements: ScheduleLaneCascadePlacement[] = [];

  clusters.forEach((cluster, clusterSeq) => {
    const laneById = assignGreedyLanes(cluster);
    const displayColumnCount = Math.min(
      lanesUsedInCluster(laneById),
      maxVisible,
    );
    const byStart = groupBlocksByStartSlot(cluster);

    for (const startGroup of byStart.values()) {
      const sorted = [...startGroup].sort(sortBlocksForSameStartGroup);
      const sameStartColumnCount = sorted.length;
      const staggered =
        useLaneLayout &&
        sameStartColumnCount > 1 &&
        startGroupHasStaggeredOverlap(cluster, sorted[0]!.startSlot);
      const useFullColumnEqualSplit =
        sameStartColumnCount > 1 && !staggered;

      sorted.forEach((block, sameStartColumnIndex) => {
        if (useFullColumnEqualSplit) {
          placements.push({
            id: `slot-${clusterSeq}-${block.startSlot}-${block.appointment.id}`,
            block,
            segmentStartSlot: block.startSlot,
            segmentDurationSlots: block.durationSlots,
            columnIndex: sameStartColumnIndex,
            columnCount: sameStartColumnCount,
            sameStartColumnIndex,
            sameStartColumnCount,
            useFullColumnEqualSplit: true,
            segmentIndex: 0,
            segmentCount: 1,
          });
          return;
        }

        const laneIndex = useLaneLayout
          ? (laneById.get(block.appointment.id) ?? 0)
          : 0;

        placements.push({
          id: `slot-${clusterSeq}-${block.startSlot}-${block.appointment.id}`,
          block,
          segmentStartSlot: block.startSlot,
          segmentDurationSlots: block.durationSlots,
          columnIndex: laneIndex,
          columnCount: useLaneLayout ? displayColumnCount : 1,
          sameStartColumnIndex,
          sameStartColumnCount,
          useFullColumnEqualSplit: false,
          segmentIndex: 0,
          segmentCount: 1,
        });
      });
    }
  });

  return placements.sort(
    (a, b) =>
      a.block.startSlot - b.block.startSlot ||
      a.columnIndex - b.columnIndex ||
      a.id.localeCompare(b.id),
  );
}

/** @deprecated Use {@link maxVisibleColumnsForLayoutMode}. */
export function trackCapForLayoutMode(mode: ScheduleCalendarLayoutMode): number {
  return maxVisibleColumnsForLayoutMode(mode);
}

/** @deprecated Use {@link layoutScheduleLaneCascade} with `week` layout mode. */
export type ScheduleCascadePlacement = ScheduleLaneCascadePlacement;

/** @deprecated Use {@link layoutScheduleLaneCascade} with `week` layout mode. */
export function layoutScheduleWeekCascade(
  blocks: readonly AppointmentBlock[],
): ScheduleLaneCascadePlacement[] {
  return layoutScheduleLaneCascade(blocks, "week");
}
