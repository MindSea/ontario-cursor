import { parse } from "date-fns";

import type { AppointmentStage } from "./types";

/** Parse scheduled slot start for stable demo ordering (local calendar semantics). */
export function parseAppointmentScheduledStartMs(apt: {
  date: string;
  time: string;
}): number | null {
  try {
    const d = parse(`${apt.date} ${apt.time}`, "yyyy-MM-dd h:mm a", new Date());
    const t = d.getTime();
    return Number.isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

/**
 * Demo check-in time: PREVISIT = not yet arrived; otherwise synthetic ISO time
 * from scheduled start + id offset so arrival order is deterministic.
 */
export function deriveSeedCheckedInAt(apt: {
  id: string;
  date: string;
  time: string;
  stage: AppointmentStage;
}): string | null {
  if (apt.stage === "PREVISIT") return null;
  const base = parseAppointmentScheduledStartMs(apt);
  if (base === null) return null;
  const idNum = parseInt(apt.id, 10) || 0;
  return new Date(base + idNum * 15_000).toISOString();
}
