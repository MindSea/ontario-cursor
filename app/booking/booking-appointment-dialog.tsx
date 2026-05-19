"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";

import {
  BOOKING_APPOINTMENT_TYPES,
  BOOKING_SLOT_TIMES,
  createAppointmentFromBookingInput,
  durationMinsForBookingAppointmentType,
  formatBookingDateInput,
} from "@/app/clinic-flow/create-appointment";
import { snapClockToQuarterHour } from "@/app/clinic-flow/schedule-clock";
import type { Appointment } from "@/app/clinic-flow/types";
import { listPatientsForPanelInbox } from "@/app/patient-profile/patient-profile-seed";
import type { PatientId } from "@/app/patient-profile/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Matches {@link SelectTrigger} `default` size for aligned date/time row. */
const bookingFieldTriggerClass = cn(
  "flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base whitespace-nowrap transition-colors outline-none select-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "dark:bg-input/30 dark:hover:bg-input/50",
);

export function BookingAppointmentDialog({
  open,
  onOpenChange,
  mode,
  appointment,
  defaultDate,
  onSaveCreate,
  onSaveEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  appointment: Appointment | null;
  defaultDate: Date;
  onSaveCreate: (appointment: Appointment) => void;
  onSaveEdit: (id: string, patch: Partial<Appointment>) => void;
  onDelete: (id: string) => void;
}) {
  const roster = useMemo(() => listPatientsForPanelInbox(), []);

  const [patientId, setPatientId] = useState<PatientId | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string>(BOOKING_SLOT_TIMES[0]);
  const [reason, setReason] = useState("");
  const [appointmentType, setAppointmentType] = useState<string>(
    BOOKING_APPOINTMENT_TYPES[0],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedPatient = useMemo(
    () => roster.find((r) => r.patientId === patientId),
    [roster, patientId],
  );

  const durationMins = durationMinsForBookingAppointmentType(appointmentType);

  const formKey = open
    ? mode === "edit" && appointment
      ? appointment.id
      : `create-${formatBookingDateInput(defaultDate)}`
    : "closed";

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setConfirmDelete(false);
      if (mode === "edit" && appointment) {
        setPatientId(appointment.patientId);
        setDate(appointment.date);
        setTime(snapClockToQuarterHour(appointment.time));
        setReason(appointment.reason);
        setAppointmentType(appointment.appointmentType);
        return;
      }
      setPatientId("");
      setDate(formatBookingDateInput(defaultDate));
      setTime(BOOKING_SLOT_TIMES[0]);
      setReason("");
      setAppointmentType(BOOKING_APPOINTMENT_TYPES[0]);
    });
  }, [open, mode, appointment, defaultDate, formKey]);

  const handleSubmit = () => {
    if (!patientId || !date || !time) return;

    const row = roster.find((r) => r.patientId === patientId);
    if (!row) return;

    const snappedTime = snapClockToQuarterHour(time);
    const estimatedDurationMins =
      durationMinsForBookingAppointmentType(appointmentType);

    if (mode === "create") {
      onSaveCreate(
        createAppointmentFromBookingInput({
          patientId,
          date,
          time: snappedTime,
          reason,
          appointmentType,
        }),
      );
    } else if (appointment) {
      onSaveEdit(appointment.id, {
        patientId,
        date,
        time: snappedTime,
        reason: reason.trim() || appointment.reason,
        appointmentType,
        estimatedDurationMins,
        pcp: row.pcpDisplayName,
        navigator: row.navigatorDisplayName,
        patientName: row.displayName,
        dateOfBirth: format(parseISO(row.dateOfBirth), "yyyy-MM-dd"),
      });
    }
    onOpenChange(false);
  };

  const title =
    mode === "create" ? "New appointment" : "Edit appointment";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmDelete(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="gap-2 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div key={formKey} className={cn("mt-4 grid gap-3", textBody)}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="booking-patient">
              Patient
            </label>
            <Select
              value={patientId || undefined}
              onValueChange={(v) => setPatientId(v as PatientId)}
              disabled={mode === "edit"}
            >
              <SelectTrigger id="booking-patient" className="w-full">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent className="z-1000">
                {roster.map((r) => (
                  <SelectItem key={r.patientId} value={r.patientId}>
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPatient ? (
              <p className={cn("m-0", textMeta)}>
                PCP: {selectedPatient.pcpDisplayName}
                <span className="text-muted-foreground/65" aria-hidden>
                  {" "}
                  ·{" "}
                </span>
                Navigator: {selectedPatient.navigatorDisplayName}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid min-w-0 gap-1.5">
              <span className="text-sm font-medium" id="booking-date-label">
                Date
              </span>
              <DatePicker
                value={date || undefined}
                onChange={(next) => {
                  if (next) setDate(next);
                }}
                contentClassName="z-1000"
              >
                <button
                  type="button"
                  id="booking-date"
                  aria-labelledby="booking-date-label"
                  className={cn(
                    bookingFieldTriggerClass,
                    !date && "text-muted-foreground",
                  )}
                >
                  <span className="min-w-0 truncate text-left tabular-nums">
                    {date ? (
                      format(parseISO(date), "MMM d, yyyy")
                    ) : (
                      "Select date"
                    )}
                  </span>
                  <CalendarIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </DatePicker>
            </div>
            <div className="grid min-w-0 gap-1.5">
              <label className="text-sm font-medium" htmlFor="booking-time">
                Time
              </label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="booking-time" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  {BOOKING_SLOT_TIMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="booking-reason">
              Reason
            </label>
            <Input
              id="booking-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Visit reason"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="booking-type">
              Type
            </label>
            <Select value={appointmentType} onValueChange={setAppointmentType}>
              <SelectTrigger id="booking-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-1000">
                {BOOKING_APPOINTMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={cn("m-0", textMeta)}>
              Duration: {durationMins} min
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {mode === "edit" && appointment ? (
            confirmDelete ? (
              <div className="flex w-full flex-wrap gap-2 sm:mr-auto">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(appointment.id);
                    onOpenChange(false);
                  }}
                >
                  Confirm delete
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Back
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            )
          ) : (
            <span className="hidden sm:block sm:mr-auto" />
          )}
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
