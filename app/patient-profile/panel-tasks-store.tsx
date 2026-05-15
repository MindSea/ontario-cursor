"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";

import { buildPatientProfileSeedMap } from "./patient-profile-seed";
import type { LongTermPanelTask, PatientId } from "./types";

function initialTasksByPatient(): Map<PatientId, LongTermPanelTask[]> {
  const m = new Map<PatientId, LongTermPanelTask[]>();
  for (const [patientId, agg] of buildPatientProfileSeedMap()) {
    m.set(
      patientId,
      agg.panel.tasks.map((t) => ({ ...t })),
    );
  }
  return m;
}

export type PanelTasksStoreValue = {
  /** Shallow-cloned task lists per patient (canonical in-memory source). */
  tasksByPatient: ReadonlyMap<PatientId, readonly LongTermPanelTask[]>;
  /**
   * React `setState`-style updater for one patient's panel tasks. Writes
   * propagate to Patient Profile and Inbox.
   */
  updatePatientTasks: (
    patientId: PatientId,
    action: SetStateAction<readonly LongTermPanelTask[]>,
  ) => void;
};

const PanelTasksStoreContext = createContext<PanelTasksStoreValue | null>(
  null,
);

export function PanelTasksStoreProvider({ children }: { children: ReactNode }) {
  const [tasksByPatient, setTasksByPatient] = useState<
    Map<PatientId, LongTermPanelTask[]>
  >(() => initialTasksByPatient());

  const updatePatientTasks = useCallback(
    (patientId: PatientId, action: SetStateAction<readonly LongTermPanelTask[]>) => {
      setTasksByPatient((prev) => {
        const next = new Map(prev);
        const prior = next.get(patientId) ?? [];
        const draft = prior.map((t) => ({ ...t }));
        const resolved =
          typeof action === "function"
            ? action(draft).map((t) => ({ ...t }))
            : action.map((t) => ({ ...t }));
        next.set(patientId, resolved);
        return next;
      });
    },
    [],
  );

  const value = useMemo<PanelTasksStoreValue>(
    () => ({
      tasksByPatient,
      updatePatientTasks,
    }),
    [tasksByPatient, updatePatientTasks],
  );

  return (
    <PanelTasksStoreContext.Provider value={value}>
      {children}
    </PanelTasksStoreContext.Provider>
  );
}

export function usePanelTasksStore(): PanelTasksStoreValue {
  const ctx = useContext(PanelTasksStoreContext);
  if (!ctx) {
    throw new Error(
      "usePanelTasksStore must be used inside <PanelTasksStoreProvider />",
    );
  }
  return ctx;
}

/**
 * Panel tasks for a single patient, wired to the app-wide store.
 * Compatible with `PanelTasksSection` / profile panel management.
 */
export function usePatientPanelTasks(patientId: PatientId): {
  tasks: readonly LongTermPanelTask[];
  setTasks: (
    action: SetStateAction<readonly LongTermPanelTask[]>,
  ) => void;
} {
  const { tasksByPatient, updatePatientTasks } = usePanelTasksStore();
  const tasks = tasksByPatient.get(patientId) ?? [];
  const setTasks = useCallback(
    (action: SetStateAction<readonly LongTermPanelTask[]>) => {
      updatePatientTasks(patientId, action);
    },
    [patientId, updatePatientTasks],
  );
  return { tasks, setTasks };
}
