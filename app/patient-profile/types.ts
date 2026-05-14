/**
 * Patient profile domain model (aggregate + panel tasks + contact/admin).
 *
 * Appointments: reuse `Appointment` from clinic flow; list rows filter with
 * `appointmentsForPatient` (`queries.ts`). Detail view renders the same workspace
 * sections as the clinic flow workspace (huddle, previsit, intake, etc.) — driven
 * by the same `Appointment` document, not duplicated fields here.
 *
 * Conversations: reuse `Conversation` from messaging; filter with
 * `conversationIncludesPatient` / `conversationsForPatient` (`queries.ts`).
 *
 * Permissions (product): all navigators may edit `PatientContactAdmin` in demo;
 * enforce on server / policy layer when wired.
 */

/** Directory `personId` when `kind === "patient"`; also `Appointment.patientId`. */
export type PatientId = string;

/** Header strip: same display strings as `WorkspacePinnedHeader` today (PCP / navigator names). */
export type PatientProfileSummary = {
  patientId: PatientId;
  displayName: string;
  pcpDisplayName: string;
  navigatorDisplayName: string;
};

export type PatientGender =
  | "female"
  | "male"
  | "non_binary"
  | "unknown"
  | "declined";

export type PatientDemographics = {
  /** ISO calendar date `yyyy-MM-dd`. */
  dateOfBirth: string;
  gender: PatientGender;
};

export type PatientCondition = {
  id: string;
  /** Problem / condition label shown in Panel Management. */
  label: string;
  /** When false, show as historical / inactive in UI. */
  isActive: boolean;
};

/**
 * Where a task originated. `"system"` tasks are machine-generated; their title and
 * description are not editable by the navigator and `"system"` cannot be picked
 * when creating or re-attributing a task.
 */
export type LongTermTaskSource = "pcp" | "system" | "navigator";

/** Long-term panel task lifecycle (no separate "blocked" stage). */
export type LongTermTaskStage =
  | "open"
  | "in_progress"
  | "waiting_on_patient"
  | "waiting_on_external"
  | "resolved";

export type LongTermPanelTask = {
  id: string;
  title: string;
  detail?: string;
  source: LongTermTaskSource;
  stage: LongTermTaskStage;
  /** When true, sorts to the top of the active list and shows a pin icon. */
  isPinned: boolean;
  /** ISO calendar date `yyyy-MM-dd`, optional. */
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  /** Present when `source === "navigator"` or navigator created on behalf of someone. */
  createdByNavigatorId?: string;
};

export type PatientPanelSection = {
  conditions: readonly PatientCondition[];
  tasks: readonly LongTermPanelTask[];
};

/**
 * Channels the patient prefers to be reached on. Scoped to the three
 * channels the navigator actually has at their disposal in this demo —
 * `"portal"` and `"other"` were removed because there's no patient
 * portal product wired up and "other" is an unanswerable label.
 */
export type PatientContactMethodPreference = "phone" | "sms" | "email";

export type PatientEmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

/**
 * Pharmacy of choice for medication-related coordination (refills, prior
 * authorizations, transfers). Address is one multiline string for demo
 * symmetry with `homeAddress`; in a real system we'd split street / city
 * / postal.
 */
export type PatientPharmacy = {
  name: string;
  address: string;
  phone: string;
};

/**
 * Primary insurance details surfaced in Contact / admin. Member ID and
 * group number are free-form strings in the demo — payer formats vary
 * widely and we don't validate.
 */
export type PatientPrimaryInsurance = {
  carrier: string;
  memberId: string;
  groupNumber: string;
};

/**
 * Contact / admin block: all fields navigators may edit (demo policy: any navigator).
 *
 * Layout note: the form groups these fields into six titled sections
 * (Contact information / Home address / Language & communication /
 * Emergency contact / Pharmacy / Primary insurance). The grouping lives
 * in the view; the shape here stays flat-ish for ease of patching.
 */
export type PatientContactAdmin = {
  mobilePhone: string;
  homePhone: string;
  email: string;
  /** Multiline street/city/province/postal as a single demo field. */
  homeAddress: string;
  primaryLanguage: string;
  translationRequired: boolean;
  contactMethodPreference: PatientContactMethodPreference;
  emergencyContact: PatientEmergencyContact;
  pharmacy: PatientPharmacy;
  primaryInsurance: PatientPrimaryInsurance;
};

/**
 * Aggregate returned by a future patient-profile loader.
 * Conversations and appointments are usually loaded via the same `patientId` queries
 * rather than embedded in this blob; included here for seed / API shape clarity.
 */
export type PatientProfileAggregate = {
  summary: PatientProfileSummary;
  demographics: PatientDemographics;
  panel: PatientPanelSection;
  contactAdmin: PatientContactAdmin;
};
