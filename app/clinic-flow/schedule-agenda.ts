import { parseAppointmentScheduledStartMs } from "./schedule-agenda-seed";
import type { Appointment } from "./types";

function sortByScheduledTimeThenId(a: Appointment, b: Appointment): number {
  const ta = parseAppointmentScheduledStartMs(a) ?? 0;
  const tb = parseAppointmentScheduledStartMs(b) ?? 0;
  if (ta !== tb) return ta - tb;
  return a.id.localeCompare(b.id);
}

/** Checked in (by arrival time) vs not yet arrived (by scheduled time). */
export function partitionAgendaDay(appointments: readonly Appointment[]): {
  arrived: Appointment[];
  expected: Appointment[];
} {
  const arrived: Appointment[] = [];
  const expected: Appointment[] = [];
  for (const apt of appointments) {
    if (apt.checkedInAt) arrived.push(apt);
    else expected.push(apt);
  }
  arrived.sort((a, b) => {
    const ca = new Date(a.checkedInAt!).getTime();
    const cb = new Date(b.checkedInAt!).getTime();
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });
  expected.sort(sortByScheduledTimeThenId);
  return { arrived, expected };
}
