"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";

import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import {
  compareActiveTasks,
  compareResolvedTasks,
  dueTone,
  type PanelTaskToast,
  TaskRow,
} from "@/app/patient-profile/panel-management-tasks";
import { usePanelTasksStore } from "@/app/patient-profile/panel-tasks-store";
import type { LongTermPanelTask, LongTermTaskStage, PatientId } from "@/app/patient-profile/types";
import { startOfDay } from "date-fns";

export type InboxTaskRow = {
  patientId: PatientId;
  displayName: string;
  pcpDisplayName: string;
  navigatorDisplayName: string;
  task: LongTermPanelTask;
};

function taskAttribution(
  row: InboxTaskRow,
  onOpenPatientProfile: (patientId: PatientId) => void,
): ReactNode {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <button
        type="button"
        className="m-0 max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left font-medium text-primary underline-offset-2 hover:underline"
        onClick={() => onOpenPatientProfile(row.patientId)}
      >
        {row.displayName}
      </button>
      <span className="text-muted-foreground/50" aria-hidden>
        ·
      </span>
      <span>
        PCP:{" "}
        <span className="text-foreground">{row.pcpDisplayName}</span>
      </span>
      <span className="text-muted-foreground/50" aria-hidden>
        ·
      </span>
      <span>
        Navigator:{" "}
        <span className="text-foreground">{row.navigatorDisplayName}</span>
      </span>
    </span>
  );
}

export function InboxTaskBoard({
  rows,
  showToast,
  addButtonSlot,
  addForm,
  onOpenPatientProfile,
}: {
  rows: readonly InboxTaskRow[];
  showToast: PanelTaskToast;
  addButtonSlot?: ReactNode;
  /** Inline add-task card under the Active tasks header (mirrors profile panel). */
  addForm?: ReactNode;
  onOpenPatientProfile: (patientId: PatientId) => void;
}) {
  const { tasksByPatient, updatePatientTasks } = usePanelTasksStore();
  const [showResolved, setShowResolved] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  const { active, resolved, overdueCount } = useMemo(() => {
    const activeList: InboxTaskRow[] = [];
    const resolvedList: InboxTaskRow[] = [];
    for (const r of rows) {
      if (r.task.stage === "resolved") resolvedList.push(r);
      else activeList.push(r);
    }
    activeList.sort((a, b) => compareActiveTasks(a.task, b.task, today));
    resolvedList.sort((a, b) => compareResolvedTasks(a.task, b.task));
    const overdue = activeList.filter(
      (r) => dueTone(r.task.dueDate, today) === "overdue",
    ).length;
    return { active: activeList, resolved: resolvedList, overdueCount: overdue };
  }, [rows, today]);

  const handleUpdate = useCallback(
    (patientId: PatientId, taskId: string, patch: Partial<LongTermPanelTask>) => {
      updatePatientTasks(patientId, (prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
    },
    [updatePatientTasks],
  );

  const resolveWithUndo = useCallback(
    (
      patientId: PatientId,
      id: string,
      previousStage: LongTermTaskStage,
      previousResolvedAt: string | undefined,
    ) => {
      updatePatientTasks(patientId, (prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                stage: "resolved",
                resolvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
      showToast("Task resolved.", {
        label: "Undo",
        onClick: () => {
          updatePatientTasks(patientId, (prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    stage: previousStage,
                    resolvedAt: previousResolvedAt,
                    updatedAt: new Date().toISOString(),
                  }
                : t,
            ),
          );
        },
      });
    },
    [updatePatientTasks, showToast],
  );

  const handleStageChange = useCallback(
    (patientId: PatientId, taskId: string, nextStage: LongTermTaskStage) => {
      const task = tasksByPatient.get(patientId)?.find((t) => t.id === taskId);
      if (!task) return;
      if (nextStage === "resolved" && task.stage !== "resolved") {
        resolveWithUndo(patientId, taskId, task.stage, task.resolvedAt);
        return;
      }
      const patch: Partial<LongTermPanelTask> = { stage: nextStage };
      if (nextStage !== "resolved" && task.resolvedAt) {
        patch.resolvedAt = undefined;
      }
      handleUpdate(patientId, taskId, patch);
    },
    [handleUpdate, resolveWithUndo, tasksByPatient],
  );

  const handleDelete = useCallback(
    (patientId: PatientId, taskId: string) => {
      const list = tasksByPatient.get(patientId);
      const idx = list?.findIndex((t) => t.id === taskId) ?? -1;
      if (idx === -1 || !list) return;
      const removed = list[idx];
      updatePatientTasks(patientId, (prev) => prev.filter((t) => t.id !== taskId));
      showToast("Task deleted.", {
        label: "Undo",
        onClick: () => {
          updatePatientTasks(patientId, (prev) => {
            const next = [...prev];
            next.splice(Math.min(idx, next.length), 0, removed);
            return next;
          });
        },
      });
    },
    [updatePatientTasks, showToast, tasksByPatient],
  );

  return (
    <div>
      <div className="mb-2 flex min-h-7 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className={cn("m-0 font-medium text-foreground", textBody)}>
            Active tasks{" "}
            <span className="font-normal text-muted-foreground">
              ({active.length})
            </span>
          </h3>
          {overdueCount > 0 ? (
            <span
              className={cn(
                "inline-flex h-5 items-center rounded-full bg-destructive/10 px-2 text-sm font-medium leading-none",
                "text-destructive",
              )}
            >
              {overdueCount} overdue
            </span>
          ) : null}
        </div>
        {addButtonSlot ?? null}
      </div>

      {addForm ? <div className="mb-3">{addForm}</div> : null}

      {active.length === 0 ? (
        <p className={cn("text-muted-foreground", textMeta)}>
          No active tasks match your filters.
        </p>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {active.map((row) => (
            <li key={`${row.patientId}:${row.task.id}`}>
              <TaskRow
                task={row.task}
                today={today}
                attribution={taskAttribution(row, onOpenPatientProfile)}
                onChange={(patch) => handleUpdate(row.patientId, row.task.id, patch)}
                onStageChange={(s) =>
                  handleStageChange(row.patientId, row.task.id, s)
                }
                onDelete={() => handleDelete(row.patientId, row.task.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {resolved.length > 0 ? (
        <div className="mt-4">
          <h3 className="m-0">
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className={cn(
                "group flex w-full items-center gap-1.5 rounded-md py-1 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                textBody,
              )}
              aria-expanded={showResolved}
            >
              {showResolved ? (
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
                Resolved tasks{" "}
                <span className="font-normal text-muted-foreground">
                  ({resolved.length})
                </span>
              </span>
            </button>
          </h3>
          {showResolved ? (
            <ul className="m-0 mt-2 list-none space-y-2 p-0">
              {resolved.map((row) => (
                <li key={`${row.patientId}:${row.task.id}`}>
                  <TaskRow
                    task={row.task}
                    today={today}
                    attribution={taskAttribution(row, onOpenPatientProfile)}
                    onChange={(patch) =>
                      handleUpdate(row.patientId, row.task.id, patch)
                    }
                    onStageChange={(s) =>
                      handleStageChange(row.patientId, row.task.id, s)
                    }
                    onDelete={() => handleDelete(row.patientId, row.task.id)}
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
