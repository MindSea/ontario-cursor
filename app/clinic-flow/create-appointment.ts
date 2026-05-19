import { format } from "date-fns";

import { buildPatientProfileSeedMap } from "@/app/patient-profile/patient-profile-seed";
import type { PatientId } from "@/app/patient-profile/types";

import { intakeBundleProgressFromMissing } from "./intake-form-catalog";
import { deriveSeedCheckedInAt } from "./schedule-agenda-seed";
import {
  BOOKING_DURATION_OPTIONS,
  BOOKING_SLOT_TIMES,
  minutesToBookingClock,
  snapClockToQuarterHour,
  snapDurationToQuarterHourMinutes,
} from "./schedule-clock";
import type { Appointment, AppointmentStage } from "./types";

export {
  BOOKING_DURATION_OPTIONS,
  BOOKING_SLOT_TIMES,
  minutesToBookingClock,
} from "./schedule-clock";

const DEFAULT_MISSING = [
  "Communication form",
  "Authorization and Consent for treatment",
] as const;

export const BOOKING_APPOINTMENT_TYPES = [
  "Follow-up Visit",
  "Wellness Visit",
  "Post-Acute Follow-up",
  "Chronic Care Visit",
  "New Patient Visit",
] as const;

export type BookingAppointmentType = (typeof BOOKING_APPOINTMENT_TYPES)[number];

/** Default visit length per booking type (quarter-hour snapped). */
export const BOOKING_APPOINTMENT_TYPE_DURATION_MINS: Record<
  BookingAppointmentType,
  number
> = {
  "Follow-up Visit": 30,
  "Wellness Visit": 45,
  "Post-Acute Follow-up": 60,
  "Chronic Care Visit": 30,
  "New Patient Visit": 60,
};

export function durationMinsForBookingAppointmentType(
  appointmentType: string,
): number {
  const mapped =
    BOOKING_APPOINTMENT_TYPE_DURATION_MINS[
      appointmentType as BookingAppointmentType
    ];
  return snapDurationToQuarterHourMinutes(mapped ?? 30);
}

function makeAppointmentId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `apt-${crypto.randomUUID()}`;
  }
  return `apt-${Date.now().toString(36)}`;
}

function minimalRooming(): Appointment["rooming"] {
  return {
    registration: {
      insurance: "",
      pharmacy: "",
      emergencyContact: "",
      paymentSource: "",
    },
    orderedPoctTests: [],
    medicationsOnFileMultiline: "",
  };
}

export type CreateAppointmentInput = {
  patientId: PatientId;
  date: string;
  time: string;
  reason: string;
  appointmentType: string;
  /** Seed may override type-based duration. */
  estimatedDurationMins?: number;
  /** Booking derives from patient profile when omitted. */
  pcp?: string;
  navigator?: string;
};

function normalizeBookingTiming(time: string, estimatedDurationMins: number) {
  return {
    time: snapClockToQuarterHour(time),
    estimatedDurationMins: snapDurationToQuarterHourMinutes(
      estimatedDurationMins,
    ),
  };
}

/** Builds a full {@link Appointment} with workspace-safe defaults for Booking create. */
export function createAppointmentFromBookingInput(
  input: CreateAppointmentInput,
): Appointment {
  const profile = buildPatientProfileSeedMap().get(input.patientId);
  if (!profile) {
    throw new Error(`Unknown patient ${input.patientId}`);
  }

  const durationMins =
    input.estimatedDurationMins ??
    durationMinsForBookingAppointmentType(input.appointmentType);
  const timing = normalizeBookingTiming(input.time, durationMins);

  const missing = [...DEFAULT_MISSING];
  const seed: Appointment = {
    id: makeAppointmentId(),
    patientId: input.patientId,
    date: input.date,
    time: timing.time,
    patientName: profile.summary.displayName,
    dateOfBirth: profile.demographics.dateOfBirth,
    room: "WAIT",
    stage: "PREVISIT",
    reason: input.reason.trim() || "Follow-up",
    appointmentType: input.appointmentType,
    estimatedDurationMins: timing.estimatedDurationMins,
    pcp: input.pcp ?? profile.summary.pcpDisplayName,
    navigator: input.navigator ?? profile.summary.navigatorDisplayName,
    checkedInAt: null,
    missingFormNames: missing,
    ...intakeBundleProgressFromMissing(missing),
    intakeFormResults: [],
    huddleTasks: [],
    rooming: minimalRooming(),
    visit: { supplyReferenceLines: [] },
    careManagement: { recommendedCadence: "PCP: Follow-up as needed" },
  };

  return {
    ...seed,
    checkedInAt: deriveSeedCheckedInAt(seed),
  };
}

export function formatBookingDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Stable id + stage for calendar seed rows (past `COMPLETED`, future `PREVISIT`). */
export function createSeedCalendarAppointment(
  input: CreateAppointmentInput & {
    id: string;
    stage: AppointmentStage;
  },
): Appointment {
  const base = createAppointmentFromBookingInput(input);
  const merged = { ...base, id: input.id, stage: input.stage };

  if (input.stage === "COMPLETED") {
    const completed = {
      ...merged,
      room: merged.room === "WAIT" ? "RM 1" : merged.room,
      missingFormNames: [] as const,
      ...intakeBundleProgressFromMissing([]),
      intakeFormResults: [],
      huddleTasks: merged.huddleTasks.map((t) => ({ ...t, completed: true })),
    };
    return {
      ...completed,
      checkedInAt: deriveSeedCheckedInAt(completed),
    };
  }

  return {
    ...merged,
    room: "WAIT",
    stage: "PREVISIT",
    checkedInAt: null,
  };
}
