"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClinicFlowInitialState } from "./create-clinic-flow-initial-state";
import type { Appointment } from "./types";

/**
 * Application-wide appointments store.
 *
 * Owns the canonical `appointments` array so the clinic-flow workspace
 * (`/clinic-flow`) and the patient profile dialog both read from and
 * write to the same source. Without this, edits made in one surface
 * (e.g. stage / room from the profile detail) stayed local and were
 * invisible to the other.
 *
 * Schedule-level fields on `Appointment` (stage, room, checked-in
 * timestamp, `huddleTasks`, etc.) live here. Other section state
 * (previsit notes, intake form drafts, etc.) may still be local to each
 * section component. Stage, room, and huddle task changes sync across
 * clinic-flow and the patient profile.
 *
 * UI-only state (selected appointment id, mobile two-pane state) is
 * not managed here — each consumer keeps its own view state.
 *
 * The store seeds itself once per provider mount via
 * `createClinicFlowInitialState()`; refreshing the page rebuilds from
 * the rolling demo seed.
 */
export type AppointmentsStoreValue = {
  appointments: Appointment[];
  /** Initial selected id chosen by the demo seed (today's first visit, etc.). */
  initialSelectedId: string;
  /**
   * Patch one appointment in place. Replaces only the provided fields
   * and leaves everything else intact. No-op when `id` doesn't match.
   */
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  addAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
};

const AppointmentsStoreContext = createContext<AppointmentsStoreValue | null>(
  null,
);

export function AppointmentsStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  /* Build the seed exactly once per provider mount. `useState`'s lazy
   * initializer avoids recomputing on every render — important because
   * the seed builder allocates a few hundred objects across the rolling
   * 3-day window. */
  const initial = useMemo(() => createClinicFlowInitialState(), []);
  const [appointments, setAppointments] = useState<Appointment[]>(
    initial.appointments,
  );

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments((prev) => [...prev, appointment]);
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AppointmentsStoreValue>(
    () => ({
      appointments,
      initialSelectedId: initial.selectedId,
      updateAppointment,
      addAppointment,
      deleteAppointment,
    }),
    [
      appointments,
      initial.selectedId,
      updateAppointment,
      addAppointment,
      deleteAppointment,
    ],
  );

  return (
    <AppointmentsStoreContext.Provider value={value}>
      {children}
    </AppointmentsStoreContext.Provider>
  );
}

export function useAppointmentsStore(): AppointmentsStoreValue {
  const ctx = useContext(AppointmentsStoreContext);
  if (!ctx) {
    throw new Error(
      "useAppointmentsStore must be used inside <AppointmentsStoreProvider />",
    );
  }
  return ctx;
}
