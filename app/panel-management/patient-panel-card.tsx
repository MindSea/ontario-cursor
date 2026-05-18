"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  getActiveTasksSorted,
  PanelTasksSection,
  type PanelTaskToast,
} from "@/app/patient-profile/panel-management-tasks";
import { PatientQuickActions } from "@/app/patient-profile/patient-quick-actions";
import { usePatientPanelTasks } from "@/app/patient-profile/panel-tasks-store";
import type { PatientId } from "@/app/patient-profile/types";
import { Button } from "@/components/ui/button";
import { panelTaskListColumnClass } from "@/lib/layout";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { startOfDay } from "date-fns";

export function PatientPanelCard({
  patientId,
  displayName,
  pcpDisplayName,
  navigatorDisplayName,
  showToast,
  onOpenPatientProfile,
}: {
  patientId: PatientId;
  displayName: string;
  pcpDisplayName: string;
  navigatorDisplayName: string;
  showToast: PanelTaskToast;
  onOpenPatientProfile: (patientId: PatientId) => void;
}) {
  const { tasks, setTasks } = usePatientPanelTasks(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);

  const activeCount = useMemo(
    () => getActiveTasksSorted(tasks, today).length,
    [tasks, today],
  );

  return (
    <article
      className={cn(
        panelTaskListColumnClass,
        "rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <h2
              className={cn(
                "min-w-0 truncate text-lg font-semibold leading-tight tracking-tight text-foreground",
                textBody,
              )}
            >
              {displayName}
            </h2>
            <PatientQuickActions
              patientName={displayName}
              onOpenProfile={() => onOpenPatientProfile(patientId)}
            />
          </div>
          <p className={cn("mt-1 line-clamp-2", textMeta)}>
            PCP: {pcpDisplayName}
            <span className="px-1 text-muted-foreground/70">|</span>
            Navigator: {navigatorDisplayName}
          </p>
        </div>
        {!isAdding ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="size-8 shrink-0 px-0 md:h-8 md:w-auto md:px-3"
            aria-label={`Add task for ${displayName}`}
            onClick={() => setIsAdding(true)}
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden md:inline">Add task</span>
          </Button>
        ) : null}
      </div>

      <PanelTasksSection
        tasks={tasks}
        setTasks={setTasks}
        showToast={showToast}
        embeddedInPatientCard
        isAdding={isAdding}
        onIsAddingChange={setIsAdding}
      />

      {activeCount === 0 && !isAdding ? (
        <p className={cn("mt-3 text-muted-foreground", textMeta)}>
          No active tasks.
        </p>
      ) : null}
    </article>
  );
}
