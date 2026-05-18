"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";

import {
  BOOKING_APPOINTMENT_TYPES,
  BOOKING_DURATION_OPTIONS,
  BOOKING_SLOT_TIMES,
  createAppointmentFromBookingInput,
  formatBookingDateInput,
} from "@/app/clinic-flow/create-appointment";
import {
  snapClockToQuarterHour,
  snapDurationToQuarterHourMinutes,
} from "@/app/clinic-flow/schedule-clock";
import {
  CLINIC_FLOW_SEED_NAVIGATORS,
  CLINIC_FLOW_SEED_PCPS,
} from "@/app/clinic-flow/seed-appointments";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

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
  const [durationMins, setDurationMins] = useState("30");
  const [pcp, setPcp] = useState("");
  const [navigator, setNavigator] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        setDurationMins(
          String(
            snapDurationToQuarterHourMinutes(
              appointment.estimatedDurationMins,
            ),
          ),
        );
        setPcp(appointment.pcp);
        setNavigator(appointment.navigator);
        return;
      }
      setPatientId("");
      setDate(formatBookingDateInput(defaultDate));
      setTime(BOOKING_SLOT_TIMES[0]);
      setReason("");
      setAppointmentType(BOOKING_APPOINTMENT_TYPES[0]);
      setDurationMins("30");
      setPcp("");
      setNavigator("");
    });
  }, [open, mode, appointment, defaultDate, formKey]);

  const onPatientChange = (id: PatientId) => {
    setPatientId(id);
    const row = roster.find((r) => r.patientId === id);
    if (row) {
      setPcp(row.pcpDisplayName);
      setNavigator(row.navigatorDisplayName);
    }
  };

  const handleSubmit = () => {
    const rawMins = Number.parseInt(durationMins, 10);
    if (
      !patientId ||
      !date ||
      !time ||
      !Number.isFinite(rawMins) ||
      rawMins < 1
    ) {
      return;
    }
    const snappedTime = snapClockToQuarterHour(time);
    const snappedMins = snapDurationToQuarterHourMinutes(rawMins);
    if (mode === "create") {
      onSaveCreate(
        createAppointmentFromBookingInput({
          patientId,
          date,
          time: snappedTime,
          reason,
          appointmentType,
          estimatedDurationMins: snappedMins,
          pcp: pcp || roster.find((r) => r.patientId === patientId)!.pcpDisplayName,
          navigator:
            navigator ||
            roster.find((r) => r.patientId === patientId)!.navigatorDisplayName,
        }),
      );
    } else if (appointment) {
      const row = roster.find((r) => r.patientId === patientId);
      onSaveEdit(appointment.id, {
        patientId,
        date,
        time: snappedTime,
        reason: reason.trim() || appointment.reason,
        appointmentType,
        estimatedDurationMins: snappedMins,
        pcp,
        navigator,
        patientName: row?.displayName ?? appointment.patientName,
        dateOfBirth: row
          ? format(parseISO(row.dateOfBirth), "yyyy-MM-dd")
          : appointment.dateOfBirth,
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
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div key={formKey} className={cn("grid gap-3", textBody)}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="booking-patient">
              Patient
            </label>
            <Select
              value={patientId || undefined}
              onValueChange={(v) => onPatientChange(v as PatientId)}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="booking-date">
                Date
              </label>
              <Input
                id="booking-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
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

          <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="booking-duration">
                Duration
              </label>
              <Select value={durationMins} onValueChange={setDurationMins}>
                <SelectTrigger id="booking-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  {BOOKING_DURATION_OPTIONS.map((mins) => (
                    <SelectItem key={mins} value={String(mins)}>
                      {mins} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="booking-pcp">
                PCP
              </label>
              <Select value={pcp} onValueChange={setPcp}>
                <SelectTrigger id="booking-pcp" className="w-full">
                  <SelectValue placeholder="PCP" />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  {CLINIC_FLOW_SEED_PCPS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="booking-nav">
                Navigator
              </label>
              <Select value={navigator} onValueChange={setNavigator}>
                <SelectTrigger id="booking-nav" className="w-full">
                  <SelectValue placeholder="Navigator" />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  {CLINIC_FLOW_SEED_NAVIGATORS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
