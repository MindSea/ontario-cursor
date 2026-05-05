import type { FormCompletionStatus } from "./types";

/**
 * The only patient-facing intake forms in this product: fixed bundle of eight
 * (cadence strings are reference-only).
 */
export const INTAKE_SCREENING_FORMS = [
  {
    name: "Authorization and Consent for treatment",
    cadence: "Annual",
  },
  { name: "Communication form", cadence: "Annual" },
  { name: "ROI form", cadence: "Annual / as needed" },
  { name: "PHQ 2/9", cadence: "Annual, unless positive at previous visit" },
  { name: "GAD 2/7", cadence: "Annual, unless positive at previous visit" },
  { name: "AAFP Social Needs", cadence: "Annual" },
  { name: "TAPS", cadence: "Annual" },
  { name: "VES-13", cadence: "Annual" },
] as const;

export const INTAKE_SCREENING_FORM_COUNT = INTAKE_SCREENING_FORMS.length;

/** Canonical names in catalog order (same strings as `missingFormNames` / result `formLabel`). */
export const INTAKE_SCREENING_FORM_NAMES: readonly string[] =
  INTAKE_SCREENING_FORMS.map((f) => f.name);

/** Derives completion fields from `missingFormNames` (must be subset of `INTAKE_SCREENING_FORM_NAMES`). */
export function intakeBundleProgressFromMissing(
  missingFormNames: readonly string[],
): {
  formCompletionStatus: FormCompletionStatus;
  formsCompleteCount: number;
  formsTotalCount: number;
} {
  const total = INTAKE_SCREENING_FORM_COUNT;
  for (const name of missingFormNames) {
    if (!INTAKE_SCREENING_FORM_NAMES.includes(name)) {
      throw new Error(`Unknown intake form in missingFormNames: ${name}`);
    }
  }
  if (missingFormNames.length > total) {
    throw new Error("missingFormNames exceeds intake bundle size");
  }
  const complete = total - missingFormNames.length;
  const formCompletionStatus: FormCompletionStatus =
    complete === 0
      ? "Not Started"
      : complete === total
        ? "Completed"
        : "In Progress";
  return {
    formCompletionStatus,
    formsCompleteCount: complete,
    formsTotalCount: total,
  };
}
