"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { Plus, X } from "lucide-react";

import { PatientProfileDialog } from "@/app/patient-profile/patient-profile-dialog";
import { TaskAddForm } from "@/app/patient-profile/panel-management-tasks";
import { listPatientsForPanelInbox } from "@/app/patient-profile/patient-profile-seed";
import { usePanelTasksStore } from "@/app/patient-profile/panel-tasks-store";
import { usePatientProfileUrlState } from "@/app/patient-profile/use-patient-profile-url-state";
import type { LongTermPanelTask, PatientId } from "@/app/patient-profile/types";
import { ScheduleFilterMultiSelectDropdown } from "@/app/clinic-flow/schedule-filter-multiselect-dropdown";
import {
  InboxDueDateFilterDropdown,
  summaryForDueDateFilter,
  type InboxDatePreset,
} from "./inbox-due-date-filter";
import { InboxHeaderWithSearch } from "./inbox-header-with-search";
import { InboxTaskBoard, type InboxTaskRow } from "./inbox-task-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

function taskMatchesDueDatePreset(
  dueDate: string | undefined,
  preset: InboxDatePreset,
  customFrom: string | undefined,
  customTo: string | undefined,
  today: Date,
): boolean {
  const t0 = startOfDay(today);
  if (preset === "all") return true;
  if (!dueDate) return false;
  const d = startOfDay(parseISO(dueDate));
  if (preset === "today") return isSameDay(d, t0);
  if (preset === "next3") {
    const end = startOfDay(addDays(t0, 2));
    return d.getTime() >= t0.getTime() && d.getTime() <= end.getTime();
  }
  if (preset === "custom") {
    if (!customFrom?.trim() || !customTo?.trim()) return true;
    const a = startOfDay(parseISO(customFrom));
    const b = startOfDay(parseISO(customTo));
    const lo = a <= b ? a : b;
    const hi = a <= b ? b : a;
    return d.getTime() >= lo.getTime() && d.getTime() <= hi.getTime();
  }
  return true;
}

export default function InboxPage() {
  const filterIdPrefix = useId();
  const { tasksByPatient, updatePatientTasks } = usePanelTasksStore();
  const patientProfile = usePatientProfileUrlState();

  const roster = useMemo(() => listPatientsForPanelInbox(), []);
  const rosterById = useMemo(() => {
    const m = new Map(roster.map((r) => [r.patientId, r]));
    return m;
  }, [roster]);

  const pcpOptions = useMemo(
    () =>
      [...new Set(roster.map((r) => r.pcpDisplayName))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [roster],
  );
  const navigatorOptions = useMemo(
    () =>
      [...new Set(roster.map((r) => r.navigatorDisplayName))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [roster],
  );

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPcps, setSelectedPcps] = useState<string[]>([]);
  const [selectedNavigators, setSelectedNavigators] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<InboxDatePreset>("all");
  const [customFrom, setCustomFrom] = useState<string | undefined>(undefined);
  const [customTo, setCustomTo] = useState<string | undefined>(undefined);

  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addPatientId, setAddPatientId] = useState<PatientId | "">("");

  type ToastAction = { label: string; onClick: () => void };
  type ToastState = { id: number; message: string; action?: ToastAction };
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const lifetime = toast.action ? 6000 : 2400;
    const id = toast.id;
    const t = window.setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, lifetime);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      setToast({ id: Date.now() + Math.random(), message, action });
    },
    [],
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  const hasDueDateFilter = datePreset !== "all";
  const hasActiveFilters =
    selectedPcps.length > 0 ||
    selectedNavigators.length > 0 ||
    hasDueDateFilter;

  const clearAllFilters = useCallback(() => {
    setSelectedPcps([]);
    setSelectedNavigators([]);
    setDatePreset("all");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setOpenFilterMenu(null);
  }, []);

  const filteredRows = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    const rows: InboxTaskRow[] = [];
    for (const [patientId, taskList] of tasksByPatient) {
      const meta = rosterById.get(patientId);
      if (!meta) continue;
      if (q && !meta.displayName.toLowerCase().includes(q)) continue;
      if (
        selectedPcps.length > 0 &&
        !selectedPcps.includes(meta.pcpDisplayName)
      ) {
        continue;
      }
      if (
        selectedNavigators.length > 0 &&
        !selectedNavigators.includes(meta.navigatorDisplayName)
      ) {
        continue;
      }

      for (const task of taskList) {
        if (
          !taskMatchesDueDatePreset(
            task.dueDate,
            datePreset,
            customFrom,
            customTo,
            today,
          )
        ) {
          continue;
        }
        rows.push({
          patientId,
          displayName: meta.displayName,
          pcpDisplayName: meta.pcpDisplayName,
          navigatorDisplayName: meta.navigatorDisplayName,
          task,
        });
      }
    }
    return rows;
  }, [
    tasksByPatient,
    rosterById,
    patientSearch,
    selectedPcps,
    selectedNavigators,
    datePreset,
    customFrom,
    customTo,
    today,
  ]);

  const handleAddFromInbox = useCallback(
    (task: LongTermPanelTask) => {
      if (!addPatientId) return;
      updatePatientTasks(addPatientId, (prev) => [...prev, task]);
      setIsAdding(false);
      setAddPatientId("");
    },
    [addPatientId, updatePatientTasks],
  );

  const patientSelectForAdd = (
    <div className="min-w-0">
      <Select
        value={addPatientId || undefined}
        onValueChange={(v) => setAddPatientId(v as PatientId)}
      >
        <SelectTrigger
          className="h-9 w-full"
          aria-label="Patient for new task"
        >
          <SelectValue placeholder="Patient" />
        </SelectTrigger>
        <SelectContent className="z-1000">
          {roster.map((r) => (
            <SelectItem key={r.patientId} value={r.patientId}>
              {r.displayName} — DOB{" "}
              {format(parseISO(r.dateOfBirth), "MMM d, yyyy")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background text-foreground",
        "max-md:fixed max-md:inset-0 max-md:z-0 max-md:h-dvh max-md:max-h-dvh max-md:overflow-hidden max-md:overscroll-none",
        "md:static md:z-auto md:h-full",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-30 shrink-0 border-b border-border/50 bg-background max-md:border-border/60",
        )}
      >
        <InboxHeaderWithSearch
          patientSearch={patientSearch}
          onPatientSearchChange={setPatientSearch}
        />

        <div
          className={cn(
            "max-md:px-3 max-md:pb-2 max-md:pt-1",
            "md:mx-auto md:max-w-6xl md:px-8 md:pb-3 md:pt-0",
          )}
        >
          <div className="mb-3 flex min-w-0 w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-stretch">
            <ScheduleFilterMultiSelectDropdown
              idPrefix={filterIdPrefix}
              menuId="pcp"
              openMenu={openFilterMenu}
              setOpenMenu={setOpenFilterMenu}
              categoryLabel="PCP"
              options={pcpOptions}
              selected={selectedPcps}
              onChangeSelected={setSelectedPcps}
              fullWidth={false}
              compact={false}
            />
            <ScheduleFilterMultiSelectDropdown
              idPrefix={filterIdPrefix}
              menuId="navigator"
              openMenu={openFilterMenu}
              setOpenMenu={setOpenFilterMenu}
              categoryLabel="Navigator"
              options={navigatorOptions}
              selected={selectedNavigators}
              onChangeSelected={setSelectedNavigators}
              fullWidth={false}
              compact={false}
            />
            <InboxDueDateFilterDropdown
              idPrefix={filterIdPrefix}
              preset={datePreset}
              onPresetChange={setDatePreset}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              openMenu={openFilterMenu}
              setOpenMenu={setOpenFilterMenu}
              menuId="due"
              fullWidth={false}
              compact={false}
            />
          </div>

          {hasActiveFilters ? (
            <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 md:mb-0">
              {selectedPcps.map((pcp) => (
                <Badge
                  key={`pcp-${pcp}`}
                  variant="secondary"
                  className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
                >
                  <span className="min-w-0 truncate">{pcp}</span>
                  <button
                    type="button"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${pcp} from PCP filter`}
                    onClick={() =>
                      setSelectedPcps(selectedPcps.filter((x) => x !== pcp))
                    }
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </Badge>
              ))}
              {selectedNavigators.map((nav) => (
                <Badge
                  key={`nav-${nav}`}
                  variant="secondary"
                  className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
                >
                  <span className="min-w-0 truncate">{nav}</span>
                  <button
                    type="button"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${nav} from navigator filter`}
                    onClick={() =>
                      setSelectedNavigators(
                        selectedNavigators.filter((x) => x !== nav),
                      )
                    }
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </Badge>
              ))}
              {hasDueDateFilter ? (
                <Badge
                  variant="secondary"
                  className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
                >
                  <span className="min-w-0 truncate">
                    Due:{" "}
                    {summaryForDueDateFilter(datePreset, customFrom, customTo)}
                  </span>
                  <button
                    type="button"
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove due date filter"
                    onClick={() => {
                      setDatePreset("all");
                      setCustomFrom(undefined);
                      setCustomTo(undefined);
                    }}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto min-w-0 px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
          "max-md:px-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-2",
          "md:mx-auto md:max-w-6xl md:px-8 md:py-4",
        )}
      >
        <InboxTaskBoard
          rows={filteredRows}
          showToast={showToast}
          addButtonSlot={
            !isAdding ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="size-4" aria-hidden />
                Add task
              </Button>
            ) : null
          }
          addForm={
            isAdding ? (
              <TaskAddForm
                patientSelector={patientSelectForAdd}
                submitDisabled={!addPatientId}
                titleAutoFocus={Boolean(addPatientId)}
                onAdd={handleAddFromInbox}
                onCancel={() => {
                  setIsAdding(false);
                  setAddPatientId("");
                }}
                today={today}
              />
            ) : null
          }
          onOpenPatientProfile={(id) => patientProfile.open(id, "panel")}
        />
      </div>

      <PatientProfileDialog
        patientId={patientProfile.patientId}
        section={patientProfile.section}
        onSectionChange={patientProfile.setSection}
        onRequestClose={patientProfile.close}
      />

      {toast && typeof document !== "undefined"
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none fixed bottom-6 left-1/2 z-200 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
                textBody,
              )}
            >
              <span className="min-w-0 flex-1">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                  className="pointer-events-auto shrink-0 rounded-md px-2 py-1 text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
