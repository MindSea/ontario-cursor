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

export type Appointment = {
  id: string;
  /** Calendar day key, `yyyy-MM-dd`. */
  date: string;
  time: string;
  patientName: string;
  room: string;
  stage: AppointmentStage;
  reason: string;
  pcp: string;
  /** Single assigned navigator for the visit. */
  navigator: string;
  huddleTasks: HuddleTask[];
};
