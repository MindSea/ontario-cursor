import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  getDay,
  max,
  min,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { listPatientsForPanelInbox } from "@/app/patient-profile/patient-profile-seed";

import { createSeedCalendarAppointment } from "./create-appointment";
import {
  capAppointmentDurationMins,
  minutesToBookingClock,
} from "./schedule-clock";
import type { Appointment } from "./types";

const MONTHS_BACK = 6;
const FORWARD_DAYS = 90;
const APPOINTMENTS_PER_MONTH_MIN = 18;
const APPOINTMENTS_PER_MONTH_MAX = 28;
const MAX_VISITS_PER_PATIENT_PER_MONTH = 2;

const CLINIC_DAY_START_MIN = 8 * 60;
const CLINIC_DAY_END_MIN = 17 * 60;
const SLOT_STEP_MIN = 15;

const FOLLOW_UP_REASONS = [
  "Routine follow-up",
  "Blood pressure recheck",
  "Medication review",
  "Diabetes management",
  "Post-visit follow-up",
] as const;

const CHRONIC_REASONS = [
  "Chronic care management",
  "COPD follow-up",
  "Heart failure monitoring",
] as const;

/** Deterministic integer in [min, max] from a numeric seed. */
function seededInt(seed: number, minVal: number, maxVal: number): number {
  const x = Math.abs((seed * 1103515245 + 12345) | 0);
  return minVal + (x % (maxVal - minVal + 1));
}

function countByMonth(appointments: readonly Appointment[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of appointments) {
    const key = a.date.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function bookingDateRange(today: Date): { start: Date; end: Date } {
  const start = startOfMonth(addMonths(today, -MONTHS_BACK));
  const forwardEnd = startOfDay(addDays(today, FORWARD_DAYS));
  const yearEnd = startOfDay(endOfYear(today));
  const end = forwardEnd.getTime() <= yearEnd.getTime() ? forwardEnd : yearEnd;
  return { start, end };
}

function monthOverlapsRange(
  monthStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const monthEnd = endOfMonth(monthStart);
  return monthStart <= rangeEnd && monthEnd >= rangeStart;
}

function targetCountForMonth(
  monthStart: Date,
  today: Date,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const monthEnd = endOfMonth(monthStart);
  const effectiveStart = max([monthStart, rangeStart]);
  const effectiveEnd = min([monthEnd, rangeEnd]);
  if (effectiveStart > effectiveEnd) return 0;

  const daysInMonth =
    differenceInCalendarDays(monthEnd, monthStart) + 1;
  const activeDays =
    differenceInCalendarDays(effectiveEnd, effectiveStart) + 1;
  const fraction = activeDays / daysInMonth;

  const mk = monthStart.getFullYear() * 100 + monthStart.getMonth();
  const base = seededInt(
    mk,
    APPOINTMENTS_PER_MONTH_MIN,
    APPOINTMENTS_PER_MONTH_MAX,
  );

  const midMonth = addDays(monthStart, 14);
  const daysFromToday = differenceInCalendarDays(midMonth, startOfDay(today));

  if (daysFromToday > 60) {
    return Math.max(2, Math.round(base * 0.2 * fraction));
  }
  if (daysFromToday > 30) {
    return Math.max(8, Math.round(base * 0.55 * fraction));
  }
  if (daysFromToday < -120) {
    return Math.max(12, Math.round(base * 0.75 * fraction));
  }
  return Math.max(0, Math.round(base * fraction));
}

function pickWeekdayInMonth(
  monthStart: Date,
  rangeStart: Date,
  rangeEnd: Date,
  attemptSeed: number,
): string | null {
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;

  for (let t = 0; t < daysInMonth * 2; t++) {
    const dayNum = seededInt(attemptSeed + t, 1, daysInMonth);
    const dayDate = addDays(monthStart, dayNum - 1);
    const dow = getDay(dayDate);
    if (dow === 0 || dow === 6) continue;

    const dayStart = startOfDay(dayDate);
    if (dayStart < rangeStart || dayStart > rangeEnd) continue;

    return format(dayDate, "yyyy-MM-dd");
  }
  return null;
}

function hashSeed(...parts: (string | number)[]): number {
  let h = 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(h);
}

function pickTimeForSeed(seed: number): string {
  const slotCount = Math.floor(
    (CLINIC_DAY_END_MIN - CLINIC_DAY_START_MIN) / SLOT_STEP_MIN,
  );
  const slotIndex = seededInt(seed, 0, slotCount - 1);
  const minutes = CLINIC_DAY_START_MIN + slotIndex * SLOT_STEP_MIN;
  return minutesToBookingClock(minutes);
}

function pickVisitKind(
  daysFromToday: number,
  seed: number,
): { appointmentType: string; reason: string; durationMins: number } {
  if (daysFromToday > 55) {
    return {
      appointmentType: "Wellness Visit",
      reason: "Medicare Annual Wellness",
      durationMins: 45,
    };
  }

  const roll = seededInt(seed, 0, 9);
  if (roll <= 4) {
    return {
      appointmentType: "Follow-up Visit",
      reason: FOLLOW_UP_REASONS[seededInt(seed + 1, 0, FOLLOW_UP_REASONS.length - 1)]!,
      durationMins: capAppointmentDurationMins(
        seededInt(seed + 2, 2, 4) * 15,
      ),
    };
  }
  if (roll <= 7) {
    return {
      appointmentType: "Chronic Care Visit",
      reason: CHRONIC_REASONS[seededInt(seed + 3, 0, CHRONIC_REASONS.length - 1)]!,
      durationMins: 30,
    };
  }
  if (roll === 8) {
    return {
      appointmentType: "Post-Acute Follow-up",
      reason: "Post-discharge follow-up",
      durationMins: 30,
    };
  }
  return {
    appointmentType: "New Patient Visit",
    reason: "New patient intake",
    durationMins: 60,
  };
}

/**
 * Adds roster-based calendar visits for Booking: ~18–28/month in range,
 * past visits completed, near-future PREVISIT, no dates beyond ~90 days or
 * end of year. Does not clone the tri-day patient×time grid.
 */
export function extendAppointmentsForBookingCalendar(
  appointments: readonly Appointment[],
): Appointment[] {
  const roster = listPatientsForPanelInbox();
  if (roster.length === 0) {
    return [...appointments];
  }

  const today = startOfDay(new Date());
  const todayKey = format(today, "yyyy-MM-dd");
  const { start: rangeStart, end: rangeEnd } = bookingDateRange(today);

  const usedSlotByDate = new Set<string>();
  const usedPatientByDate = new Set<string>();
  for (const a of appointments) {
    usedSlotByDate.add(`${a.date}:${a.time}`);
    usedPatientByDate.add(`${a.date}:${a.patientId}`);
  }

  const monthCounts = countByMonth(appointments);
  const patientMonthVisits = new Map<string, number>();

  const extra: Appointment[] = [];
  let monthCursor = startOfMonth(rangeStart);

  while (monthCursor <= rangeEnd) {
    if (!monthOverlapsRange(monthCursor, rangeStart, rangeEnd)) {
      monthCursor = addMonths(monthCursor, 1);
      continue;
    }

    const mk = format(monthCursor, "yyyy-MM");
    const target = targetCountForMonth(
      monthCursor,
      today,
      rangeStart,
      rangeEnd,
    );
    const existing = monthCounts.get(mk) ?? 0;
    let toAdd = Math.max(0, target - existing);

    let attempt = 0;
    const maxAttempts = 400;

    while (toAdd > 0 && attempt < maxAttempts) {
      attempt++;
      const dateKey = pickWeekdayInMonth(
        monthCursor,
        rangeStart,
        rangeEnd,
        monthCursor.getFullYear() * 10000 +
          monthCursor.getMonth() * 100 +
          attempt,
      );
      if (!dateKey) break;

      const time = pickTimeForSeed(hashSeed(dateKey, attempt, "time"));
      const slotKey = `${dateKey}:${time}`;
      if (usedSlotByDate.has(slotKey)) continue;

      const patient =
        roster[
          seededInt(
            attempt + dateKey.length + mk.length,
            0,
            roster.length - 1,
          )
        ]!;

      const patientDayKey = `${dateKey}:${patient.patientId}`;
      if (usedPatientByDate.has(patientDayKey)) continue;

      const visitDate = startOfDay(parseISO(dateKey));
      const daysFromToday = differenceInCalendarDays(visitDate, today);
      const isPast = dateKey < todayKey;

      const patientMonthKey = `${mk}:${patient.patientId}`;
      const visitsThisMonth = patientMonthVisits.get(patientMonthKey) ?? 0;
      if (visitsThisMonth >= MAX_VISITS_PER_PATIENT_PER_MONTH) continue;

      const kind = pickVisitKind(
        isPast ? -Math.abs(daysFromToday) : daysFromToday,
        attempt + patient.patientId.length,
      );

      const apt = createSeedCalendarAppointment({
        id: `bk-${mk}-${extra.length}`,
        patientId: patient.patientId,
        date: dateKey,
        time,
        reason: kind.reason,
        appointmentType: kind.appointmentType,
        estimatedDurationMins: capAppointmentDurationMins(kind.durationMins),
        pcp: patient.pcpDisplayName,
        navigator: patient.navigatorDisplayName,
        stage: isPast ? "COMPLETED" : "PREVISIT",
      });

      extra.push(apt);
      usedSlotByDate.add(slotKey);
      usedPatientByDate.add(patientDayKey);
      patientMonthVisits.set(patientMonthKey, visitsThisMonth + 1);
      monthCounts.set(mk, (monthCounts.get(mk) ?? 0) + 1);
      toAdd--;
    }

    monthCursor = addMonths(monthCursor, 1);
  }

  return [...appointments, ...extra];
}
