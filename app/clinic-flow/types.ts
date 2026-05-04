export type AppointmentStage =
  | "PREVISIT"
  | "INTAKE"
  | "ROOMING"
  | "VISIT"
  | "LABS"
  | "CARE MANAGEMENT"
  | "WRAP UP";

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
  /** Patient-side form completion (seed / server; not toggled in UI). */
  formCompletionStatus: FormCompletionStatus;
  /** Outstanding form names (Title Case); empty when none missing. */
  missingFormNames: readonly string[];
  /** Completed count for `formsTotalCount` portal forms. */
  formsCompleteCount: number;
  formsTotalCount: number;
  huddleTasks: HuddleTask[];
};
