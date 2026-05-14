"use client";

import { useMemo } from "react";
import { parse } from "date-fns";

import { appointmentHasRoom } from "@/app/clinic-flow/room-options";
import { buildSeedAppointments } from "@/app/clinic-flow/seed-appointments";
import type { Appointment } from "@/app/clinic-flow/types";
import {
  buildMessagingSeed,
  CURRENT_USER_ID,
} from "@/app/messaging/seed-messaging";
import type {
  Conversation,
  DirectoryPerson,
  Message,
} from "@/app/messaging/types";

export type PatientProfileClinicMessagingDemo = {
  appointments: Appointment[];
  directory: DirectoryPerson[];
  conversations: Conversation[];
  messages: Message[];
  currentUser: DirectoryPerson;
};

export function usePatientProfileClinicMessagingDemo(): PatientProfileClinicMessagingDemo {
  return useMemo(() => {
    const appointments = buildSeedAppointments();
    const { directory, conversations, messages } = buildMessagingSeed();
    const currentUser =
      directory.find((d) => d.id === CURRENT_USER_ID) ?? directory[0]!;
    return {
      appointments,
      directory,
      conversations,
      messages,
      currentUser,
    };
  }, []);
}

export function conversationLastActivityMs(
  conversationId: string,
  messages: readonly Message[],
): number {
  let max = 0;
  for (const m of messages) {
    if (m.conversationId !== conversationId) continue;
    const t = new Date(m.sentAt).getTime();
    if (t > max) max = t;
  }
  return max;
}

export function conversationPreviewSnippet(
  messages: readonly Message[],
  conversationId: string,
): string {
  const list = messages.filter((m) => m.conversationId === conversationId);
  if (list.length === 0) return "No messages yet";
  const last = list.reduce((a, b) =>
    new Date(a.sentAt) > new Date(b.sentAt) ? a : b,
  );
  if (last.deletedAt) return "Message removed";
  const text = last.body.trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

/** Descending sort: newest visit first. */
export function appointmentSortKey(apt: Appointment): number {
  const day = parse(apt.date, "yyyy-MM-dd", new Date());
  const at = parse(apt.time, "h:mm a", day);
  return at.getTime();
}

/**
 * Whether the visit should surface its room in summary chips.
 *
 * Two reasons we suppress the room badge:
 *   - The stage doesn't usefully imply a room (`PREVISIT` is pre-arrival
 *     and `COMPLETED` is post-visit, where the room is no longer
 *     informative).
 *   - The visit has no room assigned (`NONE` sentinel or blank).
 *
 * Stage-only check is separate from assignment-only check
 * (`appointmentHasRoom`) so callers can compose them differently —
 * the room *selector* in the detail header still renders for any
 * stage; only summary chips use this combined gate.
 */
export function appointmentShowsRoom(apt: Appointment): boolean {
  if (apt.stage === "PREVISIT" || apt.stage === "COMPLETED") return false;
  return appointmentHasRoom(apt);
}
