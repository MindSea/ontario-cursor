import type { Appointment } from "./types";

/**
 * Sentinel value meaning "no room assigned." Stored as a string on
 * `Appointment.room` so the data shape stays `string` everywhere; UI
 * call sites use `roomIsAssigned` to decide whether to show a chip.
 *
 * Upper-cased to match the visual style of every other room option
 * (`RM 1`, `LAB 1`, `WAIT`) — the value is also the rendered label, so
 * keeping casing consistent prevents "None" from looking like a typo
 * next to its all-caps neighbours.
 */
export const ROOM_NONE = "NONE" as const;

/**
 * Concrete (assignable) room choices, in the order they appear in the
 * Room selector. Numbered exam rooms first, then the lab room, then
 * the shared waiting room.
 *
 * Kept separate from `WORKSPACE_ROOM_OPTIONS` so selectors can render
 * a divider between concrete rooms and the `NONE` sentinel without
 * hard-coding the slice in each call site. Anywhere you want to ask
 * "is this a real, assignable room?", iterate this list.
 */
export const WORKSPACE_ROOM_OPTIONS_CONCRETE = [
  "RM 1",
  "RM 2",
  "RM 3",
  "RM 4",
  "RM 5",
  "LAB 1",
  "WAIT",
] as const;

/**
 * Full list of room choices including the `NONE` sentinel. Order is
 * meaningful — it controls the dropdown order, with `NONE` placed last
 * (after a visual separator at render time) so the "unassigned" option
 * doesn't sit above a real room in the menu.
 *
 * Most call sites should prefer the structured pair
 * `WORKSPACE_ROOM_OPTIONS_CONCRETE` + `ROOM_NONE` so a separator can
 * be rendered between them. This combined list exists for non-rendering
 * callers (validation, type narrowing).
 */
export const WORKSPACE_ROOM_OPTIONS = [
  ...WORKSPACE_ROOM_OPTIONS_CONCRETE,
  ROOM_NONE,
] as const;

export type WorkspaceRoomOption = (typeof WORKSPACE_ROOM_OPTIONS)[number];

/**
 * True when the appointment has a concrete room assignment (i.e. not
 * the `NONE` sentinel and not an empty string). Use this to gate room
 * chips/labels in lists and tiles so unassigned visits don't render an
 * empty or unhelpful "NONE" tag.
 *
 * NOTE: This is a *room-presence* check only. Stage-based hiding (e.g.
 * "don't show a room for PREVISIT") is a separate decision; combine
 * the two at the call site if both apply.
 */
export function roomIsAssigned(room: string): boolean {
  if (!room) return false;
  if (room === ROOM_NONE) return false;
  return true;
}

/** Convenience: same check, scoped to an Appointment. */
export function appointmentHasRoom(apt: Appointment): boolean {
  return roomIsAssigned(apt.room);
}
