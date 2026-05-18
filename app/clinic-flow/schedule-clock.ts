import { DAY_GRID_START_MIN, SLOT_MINUTES } from "./day-schedule-grid";

/** First minute after the clinic day grid (matches day-schedule-grid). */
const DAY_GRID_END_MIN = 17 * 60;

/** Ten spread times for tri-day seed (all on :00 / :15 / :30 / :45). */
export const CLINIC_SEED_SLOT_TIMES = [
  "08:00 AM",
  "08:45 AM",
  "09:30 AM",
  "10:15 AM",
  "11:00 AM",
  "11:45 AM",
  "12:30 PM",
  "01:15 PM",
  "02:30 PM",
  "03:30 PM",
] as const;

/** Clinic visits are capped at one hour in seed data and booking UI. */
export const MAX_APPOINTMENT_DURATION_MINS = 60;

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export const BOOKING_DURATION_OPTIONS = DURATION_OPTIONS;

/** Parses `h:mm AM/PM` to minutes from midnight. */
export function parseAppointmentClockToMinutes(clock: string): number {
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

export function minutesToBookingClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ap}`;
}

/** Every quarter-hour start between 08:00 and 16:45 inclusive. */
export function allClinicQuarterHourClockTimes(): readonly string[] {
  const out: string[] = [];
  for (let m = DAY_GRID_START_MIN; m < DAY_GRID_END_MIN; m += SLOT_MINUTES) {
    out.push(minutesToBookingClock(m));
  }
  return out;
}

export const BOOKING_SLOT_TIMES = allClinicQuarterHourClockTimes();

export function isQuarterHourClock(clock: string): boolean {
  const mins = parseAppointmentClockToMinutes(clock);
  if (Number.isNaN(mins)) return false;
  return mins % SLOT_MINUTES === 0;
}

/** Snaps to nearest quarter-hour within the clinic day grid. */
export function snapClockToQuarterHour(clock: string): string {
  const mins = parseAppointmentClockToMinutes(clock);
  if (Number.isNaN(mins)) return clock;

  const rounded = Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  const clamped = Math.min(
    DAY_GRID_END_MIN - SLOT_MINUTES,
    Math.max(DAY_GRID_START_MIN, rounded),
  );
  return minutesToBookingClock(clamped);
}

export function snapDurationToQuarterHourMinutes(mins: number): number {
  if (!Number.isFinite(mins) || mins <= 0) return 15;
  const snapped = Math.round(mins / SLOT_MINUTES) * SLOT_MINUTES;
  return Math.min(
    MAX_APPOINTMENT_DURATION_MINS,
    Math.max(SLOT_MINUTES, snapped),
  );
}

export function capAppointmentDurationMins(mins: number): number {
  return snapDurationToQuarterHourMinutes(mins);
}

export function isQuarterHourDuration(mins: number): boolean {
  return Number.isFinite(mins) && mins > 0 && mins % SLOT_MINUTES === 0;
}
