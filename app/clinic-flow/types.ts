export type AppointmentStage =
  | "PREVISIT"
  | "INTAKE"
  | "ROOMING"
  | "VISIT"
  | "LABS"
  | "CARE MANAGEMENT"
  | "WRAP UP";

export type IntakeFormResultSeverity = "high" | "medium" | "low";

/** One screening form row: modal table + optional `shortFlag` for the intake card summary line. */
export type IntakeFormResultRow = {
  id: string;
  formLabel: string;
  resultSummary: string;
  navigatorAction: string;
  /** Compact token for the one-line intake summary (e.g. `PHQ-9: 18`). */
  shortFlag: string;
  severity?: IntakeFormResultSeverity;
};

export type HuddleTask = {
  id: string;
  text: string;
  completed: boolean;
};

/** Patient-side portal forms (read-only in workspace). */
export type FormCompletionStatus =
  | "Completed"
  | "In Progress"
  | "Not Started";

export type Appointment = {
  id: string;
  /** Calendar day key, `yyyy-MM-dd`. */
  date: string;
  time: string;
  patientName: string;
  /** Date of birth (ISO `yyyy-MM-dd` for demo). */
  dateOfBirth: string;
  room: string;
  stage: AppointmentStage;
  reason: string;
  /** Visit template for scheduling / rooming (display). */
  appointmentType: string;
  /** Slotted visit length in minutes. */
  estimatedDurationMins: number;
  pcp: string;
  /** Single assigned navigator for the visit. */
  navigator: string;
  /** Patient-side completion of the fixed intake screening bundle (seed / server; not toggled in UI). */
  formCompletionStatus: FormCompletionStatus;
  /** Outstanding forms from the eight-form bundle (`intake-form-catalog` names); empty when none missing. */
  missingFormNames: readonly string[];
  /** Completed count for the eight intake screening forms (`formsTotalCount`). */
  formsCompleteCount: number;
  /** Always the intake screening bundle size (8). */
  formsTotalCount: number;
  /** Screening form results for this visit (seed-only; drives intake flags + results modal). */
  intakeFormResults: readonly IntakeFormResultRow[];
  huddleTasks: HuddleTask[];
  /** Registration, POCT orders, and meds-on-file for rooming (seed; POCT values entered in UI). */
  rooming: RoomingSeed;
  /** Visit workflow checklist; supply lines are read-only hints under row 4 (subset per visit). */
  visit: VisitSeed;
};

/** PCP order names for “Retrieve supplies” (one line per order; seed picks a subset). */
export type VisitSeed = {
  supplyReferenceLines: readonly string[];
};

export type RoomingPoctNumericTestType =
  | "HEMOGLOBIN_A1C"
  | "BLOOD_GLUCOSE"
  | "PT_INR"
  | "MICROALBUMIN"
  | "HEMOGLOBIN";

export type RoomingPoctDropdownTestType =
  | "URINALYSIS_DIP"
  | "STREP_FLU_COV"
  | "FECAL_OCCULT_FIT"
  | "EKG_12_LEAD"
  | "RETINAL_SCAN"
  | "SPIROMETRY"
  | "EAR_LAVAGE";

export type RoomingPoctTestType =
  | RoomingPoctNumericTestType
  | RoomingPoctDropdownTestType;

export type RoomingOrderedPoctTest = {
  id: string;
  testType: RoomingPoctTestType;
};

export type RoomingRegistrationDetails = {
  insurance: string;
  pharmacy: string;
  emergencyContact: string;
  paymentSource: string;
};

export type RoomingSeed = {
  registration: RoomingRegistrationDetails;
  orderedPoctTests: readonly RoomingOrderedPoctTest[];
  /** Multiline plain text; “X meds on file” uses count of non-empty lines. */
  medicationsOnFileMultiline: string;
};
