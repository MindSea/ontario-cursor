import { parse } from "date-fns";

import type { Appointment } from "./types";

export type HuddlePeriod = "am" | "pm";

export type HuddleSessionRecord = {
  startedAt: string | null;
  completedAt: string | null;
  /** PCP names the navigator opened during this session. */
  viewedPcps: string[];
};

export type HuddleButtonProminence = "hidden" | "due" | "in_progress" | "complete";

/** @deprecated Use {@link isHuddleButtonVisible} — styling no longer varies by session state. */
export type HuddleButtonVisibility = "hidden" | "visible";

const STORAGE_KEY = "clinic-flow.huddleSessions";

/** Visit times before noon belong to the morning huddle block. */
const NOON_MINUTES = 12 * 60;

/** Local-time windows when the huddle entry is shown as due (not yet started). */
export const HUDDLE_WINDOW = {
  am: { startHour: 5, endHour: 12 },
  pm: { startHour: 12, endHour: 18 },
} as const;

export function parseAppointmentMinutes(time: string): number {
  try {
    const parsed = parse(time.trim(), "h:mm a", new Date());
    return parsed.getHours() * 60 + parsed.getMinutes();
  } catch {
    return 0;
  }
}

export function huddlePeriodForAppointmentTime(time: string): HuddlePeriod {
  return parseAppointmentMinutes(time) < NOON_MINUTES ? "am" : "pm";
}

export function currentHuddlePeriod(now = new Date()): HuddlePeriod {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes < NOON_MINUTES ? "am" : "pm";
}

export function formatHuddlePeriodLabel(period: HuddlePeriod): string {
  return period === "am" ? "Morning" : "Afternoon";
}

export function isWithinHuddleWindow(
  period: HuddlePeriod,
  now = new Date(),
): boolean {
  const hour = now.getHours();
  const { startHour, endHour } = HUDDLE_WINDOW[period];
  return hour >= startHour && hour < endHour;
}

type SessionsByDay = Record<
  string,
  Partial<Record<HuddlePeriod, HuddleSessionRecord>>
>;

/** Cached empty session — same reference for SSR and `useSyncExternalStore`. */
const SERVER_HUDDLE_SESSION: HuddleSessionRecord = {
  startedAt: null,
  completedAt: null,
  viewedPcps: [],
};

export function getServerHuddleSessionSnapshot(): HuddleSessionRecord {
  return SERVER_HUDDLE_SESSION;
}

/** @deprecated Prefer {@link getServerHuddleSessionSnapshot} for store reads. */
export function emptyHuddleSession(): HuddleSessionRecord {
  return SERVER_HUDDLE_SESSION;
}

let clientSnapshotCache: {
  cacheKey: string;
  snapshot: HuddleSessionRecord;
} | null = null;

function huddleSessionCacheKey(
  dateKey: string,
  period: HuddlePeriod,
  record: HuddleSessionRecord,
): string {
  return `${dateKey}|${period}|${record.startedAt ?? ""}|${record.completedAt ?? ""}|${record.viewedPcps.join("\0")}`;
}

/** Stable snapshot for `useSyncExternalStore` — reuses reference when storage unchanged. */
export function getHuddleSessionSnapshot(
  dateKey: string,
  period: HuddlePeriod,
): HuddleSessionRecord {
  const day = readAllSessions()[dateKey];
  const record = day?.[period];
  if (!record) return SERVER_HUDDLE_SESSION;

  const normalized: HuddleSessionRecord = {
    startedAt: record.startedAt ?? null,
    completedAt: record.completedAt ?? null,
    viewedPcps: [...(record.viewedPcps ?? [])],
  };
  const cacheKey = huddleSessionCacheKey(dateKey, period, normalized);
  if (clientSnapshotCache?.cacheKey === cacheKey) {
    return clientSnapshotCache.snapshot;
  }
  clientSnapshotCache = { cacheKey, snapshot: normalized };
  return normalized;
}

const huddleSessionListeners = new Set<() => void>();

export function subscribeHuddleSessions(onStoreChange: () => void): () => void {
  huddleSessionListeners.add(onStoreChange);
  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) onStoreChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      huddleSessionListeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    huddleSessionListeners.delete(onStoreChange);
  };
}

export function notifyHuddleSessionsChanged() {
  clientSnapshotCache = null;
  for (const listener of huddleSessionListeners) listener();
}

function readAllSessions(): SessionsByDay {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SessionsByDay;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllSessions(sessions: SessionsByDay) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    notifyHuddleSessionsChanged();
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function getHuddleSession(
  dateKey: string,
  period: HuddlePeriod,
): HuddleSessionRecord {
  const day = readAllSessions()[dateKey];
  const record = day?.[period];
  if (!record) return SERVER_HUDDLE_SESSION;
  return {
    startedAt: record.startedAt ?? null,
    completedAt: record.completedAt ?? null,
    viewedPcps: [...(record.viewedPcps ?? [])],
  };
}

function updateHuddleSession(
  dateKey: string,
  period: HuddlePeriod,
  updater: (prev: HuddleSessionRecord) => HuddleSessionRecord,
) {
  const all = readAllSessions();
  const prev = getHuddleSession(dateKey, period);
  const next = updater(prev);
  all[dateKey] = { ...all[dateKey], [period]: next };
  writeAllSessions(all);
  return next;
}

export function markHuddleStarted(dateKey: string, period: HuddlePeriod) {
  return updateHuddleSession(dateKey, period, (prev) => ({
    ...prev,
    startedAt: prev.startedAt ?? new Date().toISOString(),
  }));
}

export function markHuddleCompleted(dateKey: string, period: HuddlePeriod) {
  return updateHuddleSession(dateKey, period, (prev) => ({
    ...prev,
    completedAt: new Date().toISOString(),
  }));
}

export function markHuddlePcpViewed(
  dateKey: string,
  period: HuddlePeriod,
  pcp: string,
) {
  return updateHuddleSession(dateKey, period, (prev) => ({
    ...prev,
    viewedPcps: prev.viewedPcps.includes(pcp)
      ? prev.viewedPcps
      : [...prev.viewedPcps, pcp],
  }));
}

export function huddleAppointmentsForPeriod(
  appointments: readonly Appointment[],
  dateKey: string,
  navigator: string,
  period: HuddlePeriod,
): Appointment[] {
  return appointments
    .filter(
      (a) =>
        a.date === dateKey &&
        a.navigator === navigator &&
        huddlePeriodForAppointmentTime(a.time) === period,
    )
    .sort(
      (a, b) =>
        parseAppointmentMinutes(a.time) - parseAppointmentMinutes(b.time),
    );
}

export function distinctPcpsForHuddle(
  appointments: readonly Appointment[],
): string[] {
  const set = new Set<string>();
  for (const apt of appointments) set.add(apt.pcp);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function isHuddleButtonVisible({
  isViewingToday,
  hasPatients,
}: {
  isViewingToday: boolean;
  hasPatients: boolean;
}): boolean {
  return isViewingToday && hasPatients;
}

/** @deprecated Use {@link isHuddleButtonVisible}. */
export function resolveHuddleButtonProminence({
  isViewingToday,
  hasPatients,
}: {
  isViewingToday: boolean;
  hasPatients: boolean;
  session?: HuddleSessionRecord;
  period?: HuddlePeriod;
  now?: Date;
}): HuddleButtonProminence {
  return isHuddleButtonVisible({ isViewingToday, hasPatients })
    ? "due"
    : "hidden";
}
