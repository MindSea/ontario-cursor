import type { RoomingPoctTestType } from "./types";

export type RoomingPoctFieldKind = "numeric" | "dropdown";

export type RoomingPoctDropdownOption = {
  value: string;
  label: string;
};

export type RoomingPoctDefinition =
  | {
      testType: RoomingPoctTestType;
      kind: "numeric";
      label: string;
      unit: string;
      /** Prefer decimal input (step 0.1); false = whole numbers reasonable. */
      decimal: boolean;
    }
  | {
      testType: RoomingPoctTestType;
      kind: "dropdown";
      label: string;
      options: readonly RoomingPoctDropdownOption[];
    };

const NUM = (
  testType: RoomingPoctTestType,
  label: string,
  unit: string,
  decimal: boolean,
): RoomingPoctDefinition => ({
  testType,
  kind: "numeric",
  label,
  unit,
  decimal,
});

const DD = (
  testType: RoomingPoctTestType,
  label: string,
  options: readonly RoomingPoctDropdownOption[],
): RoomingPoctDefinition => ({
  testType,
  kind: "dropdown",
  label,
  options,
});

/** Full catalog keyed by stable `testType` (seed + Add test). */
export const ROOMING_POCT_BY_TYPE: Record<
  RoomingPoctTestType,
  RoomingPoctDefinition
> = {
  HEMOGLOBIN_A1C: NUM("HEMOGLOBIN_A1C", "Hemoglobin A1C", "%", true),
  BLOOD_GLUCOSE: NUM("BLOOD_GLUCOSE", "Blood glucose", "mg/dL", true),
  PT_INR: NUM("PT_INR", "PT/INR", "INR", true),
  MICROALBUMIN: NUM("MICROALBUMIN", "Microalbumin", "mg/g", false),
  HEMOGLOBIN: NUM("HEMOGLOBIN", "Hemoglobin", "g/dL", true),
  URINALYSIS_DIP: DD("URINALYSIS_DIP", "Urinalysis (Dip)", [
    { value: "clean", label: "Clean" },
    { value: "abnormal", label: "Abnormal" },
  ]),
  STREP_FLU_COV: DD("STREP_FLU_COV", "Strep A / Flu / COVID", [
    { value: "negative", label: "Negative" },
    { value: "positive", label: "Positive" },
  ]),
  FECAL_OCCULT_FIT: DD("FECAL_OCCULT_FIT", "Fecal occult (FIT)", [
    { value: "negative", label: "Negative" },
    { value: "positive", label: "Positive" },
  ]),
  EKG_12_LEAD: DD("EKG_12_LEAD", "12-Lead EKG", [
    { value: "pending", label: "Pending" },
    { value: "finalized", label: "Finalized" },
    { value: "refused", label: "Refused" },
  ]),
  RETINAL_SCAN: DD("RETINAL_SCAN", "Retinal scan", [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "technical_issue", label: "Technical issue" },
  ]),
  SPIROMETRY: DD("SPIROMETRY", "Spirometry", [
    { value: "pending", label: "Pending" },
    { value: "satisfactory", label: "Satisfactory" },
    { value: "attempted", label: "Attempted" },
  ]),
  EAR_LAVAGE: DD("EAR_LAVAGE", "Ear lavage", [
    { value: "pending", label: "Pending" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "bilateral", label: "Bilateral" },
  ]),
} as const satisfies Record<
  RoomingPoctTestType,
  RoomingPoctDefinition
>;

export const ALL_ROOMING_POCT_TEST_TYPES = Object.keys(
  ROOMING_POCT_BY_TYPE,
) as RoomingPoctTestType[];

export function getRoomingPoctDefinition(
  testType: RoomingPoctTestType,
): RoomingPoctDefinition {
  return ROOMING_POCT_BY_TYPE[testType];
}
