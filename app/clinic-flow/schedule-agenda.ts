import { parseAppointmentScheduledStartMs } from "./schedule-agenda-seed";
import type { Appointment } from "./types";

function sortByScheduledTimeThenId(a: Appointment, b: Appointment): number {
  const ta = parseAppointmentScheduledStartMs(a) ?? 0;
  const tb = parseAppointmentScheduledStartMs(b) ?? 0;
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

function sortByArrivalThenId(a: Appointment, b: Appointment): number {
  const ca = a.checkedInAt
    ? new Date(a.checkedInAt).getTime()
    : Number.MAX_SAFE_INTEGER;
  const cb = b.checkedInAt
    ? new Date(b.checkedInAt).getTime()
    : Number.MAX_SAFE_INTEGER;
  if (ca !== cb) return ca - cb;
  return a.id.localeCompare(b.id);
}

/** Completed visits first by arrival time, then scheduled start. */
function sortCompletedThenId(a: Appointment, b: Appointment): number {
  const ta =
    (a.checkedInAt ? new Date(a.checkedInAt).getTime() : null) ??
    parseAppointmentScheduledStartMs(a) ??
    0;
  const tb =
    (b.checkedInAt ? new Date(b.checkedInAt).getTime() : null) ??
    parseAppointmentScheduledStartMs(b) ??
    0;
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

/**
 * Day agenda sections: expected (not checked in), in progress (checked in, not
 * completed), completed (`COMPLETED` stage — includes checkout even if arrival is unset).
 */
export function partitionAgendaDay(appointments: readonly Appointment[]): {
  expected: Appointment[];
  inProgress: Appointment[];
  completed: Appointment[];
} {
  const expected: Appointment[] = [];
  const inProgress: Appointment[] = [];
  const completed: Appointment[] = [];

  for (const apt of appointments) {
    if (apt.stage === "COMPLETED") {
      completed.push(apt);
    } else if (apt.checkedInAt) {
      inProgress.push(apt);
    } else {
      expected.push(apt);
    }
  }

  expected.sort(sortByScheduledTimeThenId);
  inProgress.sort(sortByArrivalThenId);
  completed.sort(sortCompletedThenId);

  return { expected, inProgress, completed };
}
