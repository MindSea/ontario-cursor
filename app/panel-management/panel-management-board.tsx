"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";

import {
  comparePatientsByActiveTasks,
  getActiveTasksSorted,
  type PanelTaskToast,
} from "@/app/patient-profile/panel-management-tasks";
import { usePanelTasksStore } from "@/app/patient-profile/panel-tasks-store";
import type { PatientId } from "@/app/patient-profile/types";
import { panelTaskListColumnClass } from "@/lib/layout";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { startOfDay } from "date-fns";

import { PatientPanelCard } from "./patient-panel-card";

export type PanelPatientRow = {
  patientId: PatientId;
  displayName: string;
  pcpDisplayName: string;
  navigatorDisplayName: string;
};

export function PanelManagementBoard({
  patients,
  showToast,
  onOpenPatientProfile,
}: {
  patients: readonly PanelPatientRow[];
  showToast: PanelTaskToast;
  onOpenPatientProfile: (patientId: PatientId) => void;
}) {
  const { tasksByPatient } = usePanelTasksStore();
  const [showIdlePatients, setShowIdlePatients] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);

  const { withActiveTasks, withoutActiveTasks } = useMemo(() => {
    const activeList: PanelPatientRow[] = [];
    const idleList: PanelPatientRow[] = [];
    for (const p of patients) {
      const tasks = tasksByPatient.get(p.patientId) ?? [];
      if (getActiveTasksSorted(tasks, today).length > 0) {
        activeList.push(p);
      } else {
        idleList.push(p);
      }
    }
    activeList.sort((a, b) =>
      comparePatientsByActiveTasks(
        tasksByPatient.get(a.patientId) ?? [],
        tasksByPatient.get(b.patientId) ?? [],
        a.displayName,
        b.displayName,
        today,
      ),
    );
    idleList.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { withActiveTasks: activeList, withoutActiveTasks: idleList };
  }, [patients, tasksByPatient, today]);

  return (
    <div className="max-md:pt-2">
      {withActiveTasks.length > 0 ? (
        <section aria-label="Active tasks">
          <div
            className={cn(
              panelTaskListColumnClass,
              "mb-3 flex min-h-7 flex-wrap items-center gap-2",
            )}
          >
            <h3 className={cn("m-0 font-medium text-foreground", textBody)}>
              Active tasks{" "}
              <span className="font-normal text-muted-foreground">
                ({withActiveTasks.length})
              </span>
            </h3>
          </div>
          <ul className="m-0 list-none space-y-3 p-0">
            {withActiveTasks.map((p) => (
              <li key={p.patientId}>
                <PatientPanelCard
                  patientId={p.patientId}
                  displayName={p.displayName}
                  pcpDisplayName={p.pcpDisplayName}
                  navigatorDisplayName={p.navigatorDisplayName}
                  showToast={showToast}
                  onOpenPatientProfile={onOpenPatientProfile}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {withoutActiveTasks.length > 0 ? (
        <div className={cn(withActiveTasks.length > 0 && "mt-3")}>
          <h3 className={cn("m-0", panelTaskListColumnClass)}>
            <button
              type="button"
              onClick={() => setShowIdlePatients((v) => !v)}
              className={cn(
                "group flex w-full items-center gap-1.5 rounded-md py-1 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                textBody,
              )}
              aria-expanded={showIdlePatients}
            >
              {showIdlePatients ? (
                <ChevronDown
                  className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden
                />
              ) : (
                <ChevronRightIcon
                  className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden
                />
              )}
              <span>
                No active tasks{" "}
                <span className="font-normal text-muted-foreground">
                  ({withoutActiveTasks.length})
                </span>
              </span>
            </button>
          </h3>
          {showIdlePatients ? (
            <ul className="m-0 mt-2 list-none space-y-3 p-0">
              {withoutActiveTasks.map((p) => (
                <li key={p.patientId}>
                  <PatientPanelCard
                    patientId={p.patientId}
                    displayName={p.displayName}
                    pcpDisplayName={p.pcpDisplayName}
                    navigatorDisplayName={p.navigatorDisplayName}
                    showToast={showToast}
                    onOpenPatientProfile={onOpenPatientProfile}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
