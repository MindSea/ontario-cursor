import type { AppointmentStage } from "./types";

/** Title-case labels for `AppointmentStage` values (UI display). */
export const STAGE_TITLE_LABEL: Record<AppointmentStage, string> = {
  PREVISIT: "Previsit",
  INTAKE: "Intake",
  ROOMING: "Rooming",
  VISIT: "Visit",
  LABS: "Labs",
  "CARE MANAGEMENT": "Care Management",
  "WRAP UP": "Wrap Up",
};

export function formatAppointmentStage(stage: AppointmentStage): string {
  return STAGE_TITLE_LABEL[stage];
}

/** Stable order for stage pickers and lists. */
export const APPOINTMENT_STAGE_ORDER: readonly AppointmentStage[] = [
  "PREVISIT",
  "INTAKE",
  "ROOMING",
  "VISIT",
  "LABS",
  "CARE MANAGEMENT",
  "WRAP UP",
] as const;
