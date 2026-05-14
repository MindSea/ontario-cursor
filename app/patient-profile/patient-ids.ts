import type { PatientId } from "./types";

/**
 * Stable `PatientId` values for clinic-flow seed visits and future messaging directory rows.
 * Must match `DirectoryPerson.id` where the same person exists (e.g. `pat-robert`).
 *
 * Note: messaging `pat-james` is "James Okafor"; clinic seed visits for "James Wilson"
 * use `pat-james-wilson` so ids stay stable without renaming demo personas.
 */
export const PATIENT_JAMES_OKAFOR = "pat-james" satisfies PatientId;
export const PATIENT_SARAH_JENKINS = "pat-sarah-jenkins" satisfies PatientId;
export const PATIENT_ROBERT_CHEN = "pat-robert" satisfies PatientId;
export const PATIENT_ELENA_RODRIGUEZ = "pat-elena-rodriguez" satisfies PatientId;
export const PATIENT_JAMES_WILSON = "pat-james-wilson" satisfies PatientId;
export const PATIENT_MARIA_GARCIA = "pat-maria-garcia" satisfies PatientId;
export const PATIENT_SAMUEL_LEE = "pat-samuel-lee" satisfies PatientId;
export const PATIENT_LINDA_WU = "pat-linda" satisfies PatientId;
export const PATIENT_DAVID_MILLER = "pat-david-miller" satisfies PatientId;
export const PATIENT_HELEN_PARK = "pat-helen-park" satisfies PatientId;
export const PATIENT_EVELYN_HART = "pat-evelyn-hart" satisfies PatientId;
