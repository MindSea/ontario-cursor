import { format } from "date-fns";

import { buildPatientProfileSeedMap } from "@/app/patient-profile/patient-profile-seed";
import type { PatientId } from "@/app/patient-profile/types";

import { intakeBundleProgressFromMissing } from "./intake-form-catalog";
import { deriveSeedCheckedInAt } from "./schedule-agenda-seed";
import type { Appointment, AppointmentStage } from "./types";

const DEFAULT_MISSING = [
  "Communication form",
  "Authorization and Consent for treatment",
] as const;

export const BOOKING_SLOT_TIMES = [
  "08:00 AM",
  "08:40 AM",
  "09:20 AM",
  "10:00 AM",
  "10:40 AM",
  "11:20 AM",
  "12:10 PM",
  "01:10 PM",
  "02:20 PM",
  "03:30 PM",
] as const;

export const BOOKING_APPOINTMENT_TYPES = [
  "Follow-up Visit",
  "Wellness Visit",
  "Post-Acute Follow-up",
  "Chronic Care Visit",
  "New Patient Visit",
] as const;

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
  estimatedDurationMins: number;
  pcp: string;
  navigator: string;
};

/** Builds a full {@link Appointment} with workspace-safe defaults for Booking create. */
export function createAppointmentFromBookingInput(
  input: CreateAppointmentInput,
): Appointment {
  const profile = buildPatientProfileSeedMap().get(input.patientId);
  if (!profile) {
    throw new Error(`Unknown patient ${input.patientId}`);
  }

  const missing = [...DEFAULT_MISSING];
  const seed: Appointment = {
    id: makeAppointmentId(),
    patientId: input.patientId,
    date: input.date,
    time: input.time,
    patientName: profile.summary.displayName,
    dateOfBirth: profile.demographics.dateOfBirth,
    room: "WAIT",
    stage: "PREVISIT",
    reason: input.reason.trim() || "Follow-up",
    appointmentType: input.appointmentType,
    estimatedDurationMins: input.estimatedDurationMins,
    pcp: input.pcp,
    navigator: input.navigator,
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

/** 15-minute grid between 8:00 AM and 4:45 PM for booking seed times. */
export function minutesToBookingClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const ap = h24 >= 12 ? "PM" : "AM";
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ap}`;
}
