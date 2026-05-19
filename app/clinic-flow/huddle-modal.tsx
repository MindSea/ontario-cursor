"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, UserCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { useAppointmentsStore } from "./appointments-store";
import {
  distinctPcpsForHuddle,
  formatHuddlePeriodLabel,
  markHuddleCompleted,
  markHuddlePcpViewed,
  markHuddleStarted,
  type HuddlePeriod,
  type HuddleSessionRecord,
} from "./huddle-session";
import { HuddleTaskList } from "./huddle-task-list";
import type { Appointment, HuddleTask } from "./types";
import { WorkspaceVisitReasonLine } from "./workspace-visit-reason-line";

function HuddlePatientCard({
  appointment,
  onOpenPatientProfile,
}: {
  appointment: Appointment;
  onOpenPatientProfile?: (patientId: string) => void;
}) {
  const { updateAppointment } = useAppointmentsStore();
  const tasks = appointment.huddleTasks ?? [];

  const onTasksChange = (next: HuddleTask[]) => {
    updateAppointment(appointment.id, { huddleTasks: next });
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 w-full items-center justify-between gap-2">
        <p className="flex min-w-0 flex-1 items-baseline gap-x-1.5 leading-snug">
          <span className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground">
            {appointment.patientName}
          </span>
          <span aria-hidden className="shrink-0 text-muted-foreground/60">
            ·
          </span>
          <span
            className={cn(
              "shrink-0 whitespace-nowrap tabular-nums",
              textMeta,
            )}
          >
            {appointment.time}
          </span>
        </p>
        {onOpenPatientProfile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted"
            aria-label={`Open profile for ${appointment.patientName}`}
            onClick={() => onOpenPatientProfile(appointment.patientId)}
          >
            <UserCircle className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <WorkspaceVisitReasonLine
        reason={appointment.reason}
        className="mt-1"
      />
      <div className="mt-4 border-t border-border/60 pt-4">
        <HuddleTaskList
          appointmentId={appointment.id}
          tasks={tasks}
          onTasksChange={onTasksChange}
          compact
        />
      </div>
    </article>
  );
}

export function HuddleModal({
  open,
  onOpenChange,
  dateKey,
  period,
  appointments,
  session,
  onOpenPatientProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateKey: string;
  period: HuddlePeriod;
  appointments: readonly Appointment[];
  session: HuddleSessionRecord;
  onOpenPatientProfile?: (patientId: string) => void;
}) {
  const pcps = useMemo(
    () => distinctPcpsForHuddle(appointments),
    [appointments],
  );
  const pcpListKey = useMemo(() => pcps.join("\0"), [pcps]);
  const [selectedPcp, setSelectedPcp] = useState<string | null>(null);
  const [pcpPickerVisible, setPcpPickerVisible] = useState(false);
  const navInitializedRef = useRef(false);

  const periodLabel = formatHuddlePeriodLabel(period);
  const dayLabel = format(
    new Date(`${dateKey}T12:00:00`),
    "EEEE, MMM d",
  );

  useEffect(() => {
    if (!open) return;
    markHuddleStarted(dateKey, period);
  }, [open, dateKey, period]);

  useEffect(() => {
    if (!open) {
      navInitializedRef.current = false;
      queueMicrotask(() => {
        setSelectedPcp(null);
        setPcpPickerVisible(false);
      });
      return;
    }

    if (navInitializedRef.current) return;
    navInitializedRef.current = true;

    if (pcps.length === 1) {
      const solePcp = pcps[0];
      setSelectedPcp(solePcp ?? null);
      setPcpPickerVisible(false);
      if (solePcp) markHuddlePcpViewed(dateKey, period, solePcp);
    } else {
      setPcpPickerVisible(true);
      setSelectedPcp(null);
    }
  }, [open, pcpListKey, dateKey, period, pcps]);

  const appointmentsForPcp = useMemo(() => {
    if (!selectedPcp) return [];
    return appointments.filter((a) => a.pcp === selectedPcp);
  }, [appointments, selectedPcp]);

  const selectPcp = useCallback(
    (pcp: string) => {
      setSelectedPcp(pcp);
      setPcpPickerVisible(false);
      markHuddlePcpViewed(dateKey, period, pcp);
    },
    [dateKey, period],
  );

  const handleDone = useCallback(() => {
    const viewed = session.viewedPcps;
    if (pcps.length > 1 && viewed.length < pcps.length) {
      const ok = window.confirm(
        `You have not opened every PCP panel (${viewed.length}/${pcps.length}). Finish the ${periodLabel.toLowerCase()} huddle anyway?`,
      );
      if (!ok) return;
    }
    markHuddleCompleted(dateKey, period);
    onOpenChange(false);
  }, [
    dateKey,
    onOpenChange,
    pcps.length,
    periodLabel,
    session.viewedPcps,
  ]);

  const showPcpPicker = pcpPickerVisible && pcps.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-w-none flex-col overflow-hidden p-0",
          "h-[min(92vh,54rem)] w-[min(96vw,43rem)]",
          "max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0",
        )}
      >
        <DialogTitle className="sr-only">{periodLabel} huddle</DialogTitle>
        <DialogDescription className="sr-only">
          Sync with PCPs and add huddle tasks for today&apos;s patients.
        </DialogDescription>

        <header className="relative shrink-0 border-b border-border/60 px-4 py-4 pr-12 md:px-6 md:pr-14">
          <p className={textOverline}>{periodLabel} huddle</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            {dayLabel}
          </h2>
          {!showPcpPicker && selectedPcp ? (
            <p className={cn("mt-2", textMeta)}>
              Syncing with <span className="text-foreground">{selectedPcp}</span>
              {" · "}
              {appointmentsForPcp.length} patient
              {appointmentsForPcp.length === 1 ? "" : "s"}
            </p>
          ) : (
            <p className={cn("mt-2", textMeta)}>
              Choose a PCP to review today&apos;s patients together.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 size-9 md:top-3 md:right-4"
            aria-label="Close huddle"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
          {showPcpPicker ? (
            <ul className="flex flex-col gap-2">
              {pcps.map((pcp) => {
                const count = appointments.filter((a) => a.pcp === pcp).length;
                const viewed = session.viewedPcps.includes(pcp);
                return (
                  <li key={pcp}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-between px-4 py-3 text-left"
                      onClick={() => selectPcp(pcp)}
                    >
                      <span className={cn(textBody, "font-medium")}>{pcp}</span>
                      <span className={cn(textMeta, "shrink-0 tabular-nums")}>
                        {count} patient{count === 1 ? "" : "s"}
                        {viewed ? " · opened" : ""}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col gap-4">
              {appointmentsForPcp.map((apt) => (
                <HuddlePatientCard
                  key={apt.id}
                  appointment={apt}
                  onOpenPatientProfile={onOpenPatientProfile}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3 md:px-6">
          {pcps.length > 1 && !showPcpPicker ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setPcpPickerVisible(true);
                setSelectedPcp(null);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              All PCPs
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="sm"
            className="shrink-0 border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
            onClick={handleDone}
          >
            Done with {periodLabel.toLowerCase()} huddle
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
