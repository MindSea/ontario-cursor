/**
 * Patient profile section identity used by the centered dialog (left rail on desktop,
 * top tabs on mobile) and by the URL `section=` query parameter.
 */
export type PatientProfileSection =
  | "panel"
  | "conversations"
  | "appointments"
  | "contact";

export const PATIENT_PROFILE_SECTIONS: readonly {
  id: PatientProfileSection;
  label: string;
}[] = [
  { id: "panel", label: "Panel management" },
  { id: "conversations", label: "Conversations" },
  { id: "appointments", label: "Appointments" },
  { id: "contact", label: "Contact / admin" },
] as const;

export const DEFAULT_PATIENT_PROFILE_SECTION: PatientProfileSection = "panel";

export function isPatientProfileSection(
  value: string | null | undefined,
): value is PatientProfileSection {
  return (
    value === "panel" ||
    value === "conversations" ||
    value === "appointments" ||
    value === "contact"
  );
}
