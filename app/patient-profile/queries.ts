import type { Appointment } from "@/app/clinic-flow/types";
import type { Conversation } from "@/app/messaging/types";

import type { PatientId } from "./types";

export function conversationIncludesPatient(
  conversation: Conversation,
  patientId: PatientId,
): boolean {
  return conversation.participants.some(
    (p) => p.kind === "patient" && p.personId === patientId,
  );
}

export function conversationsForPatient(
  conversations: readonly Conversation[],
  patientId: PatientId,
): Conversation[] {
  return conversations.filter((c) =>
    conversationIncludesPatient(c, patientId),
  );
}

export function appointmentsForPatient(
  appointments: readonly Appointment[],
  patientId: PatientId,
): Appointment[] {
  return appointments.filter((a) => a.patientId === patientId);
}
