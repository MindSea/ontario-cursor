import { differenceInYears, parse } from "date-fns";

/** Age in full years from an ISO calendar DOB (`yyyy-MM-dd`). */
export function patientAgeFromDateOfBirth(
  dateOfBirth: string,
  referenceDate: Date = new Date(),
): number {
  const dob = parse(dateOfBirth, "yyyy-MM-dd", referenceDate);
  return differenceInYears(referenceDate, dob);
}
