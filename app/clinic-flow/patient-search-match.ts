import { format, isValid, parse } from "date-fns";

import type { Appointment } from "./types";

export function normalizePatientSearchName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Name-only match; min two characters after normalize on the query. */
export function filterAppointmentsByPatientNameSubstring(
  appointments: readonly Appointment[],
  rawQuery: string,
): Appointment[] {
  const q = normalizePatientSearchName(rawQuery);
  if (q.length < 2) return [];
  return appointments.filter((a) => {
    const n = normalizePatientSearchName(a.patientName);
    return n.includes(q) || q.includes(n);
  });
}

/** Returns `yyyy-MM-dd` when input can be parsed, else null. */
export function parseFlexibleDobToIso(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const isoTry = parse(raw, "yyyy-MM-dd", new Date());
  if (isValid(isoTry)) return format(isoTry, "yyyy-MM-dd");
  const us = parse(raw, "M/d/yyyy", new Date());
  if (isValid(us)) return format(us, "yyyy-MM-dd");
  const us2 = parse(raw, "MM/dd/yyyy", new Date());
  if (isValid(us2)) return format(us2, "yyyy-MM-dd");
  return null;
}

export function patientMatchesSearch(
  apt: Appointment,
  nameQuery: string,
  dobIso: string,
): boolean {
  const nq = normalizePatientSearchName(nameQuery);
  if (nq.length < 2) return false;
  const pn = normalizePatientSearchName(apt.patientName);
  if (!pn.includes(nq) && !nq.includes(pn)) return false;
  return apt.dateOfBirth === dobIso;
}

export function findPatientSearchMatches(
  appointments: readonly Appointment[],
  nameQuery: string,
  dobRaw: string,
): { matches: Appointment[]; dobIso: string | null; error: string | null } {
  const dobIso = parseFlexibleDobToIso(dobRaw);
  if (!dobIso) {
    return {
      matches: [],
      dobIso: null,
      error: "Enter a valid date of birth (or use the date picker).",
    };
  }
  const matches = appointments.filter((a) =>
    patientMatchesSearch(a, nameQuery, dobIso),
  );
  return { matches, dobIso, error: null };
}
