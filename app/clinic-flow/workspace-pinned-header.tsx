"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, MessageSquare, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment, AppointmentStage } from "./types";
import {
  APPOINTMENT_STAGE_ORDER,
  formatAppointmentStage,
} from "./stage-display";

const WORKSPACE_ROOM_OPTIONS = [
  "RM 1",
  "RM 2",
  "RM 3",
  "RM 4",
  "RM 5",
  "LAB 1",
  "WAIT",
] as const;

export function WorkspacePinnedHeader({
  appointment,
  onStageChange,
  onRoomChange,
  className,
}: {
  appointment: Appointment;
  onStageChange: (stage: AppointmentStage) => void;
  onRoomChange: (room: string) => void;
  className?: string;
}) {
  const [patientActionToast, setPatientActionToast] = useState<string | null>(
    null,
  );
  const showPatientActionToast = useCallback((message: string) => {
    setPatientActionToast(message);
  }, []);

  useEffect(() => {
    if (!patientActionToast) return;
    const t = window.setTimeout(() => setPatientActionToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [patientActionToast]);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 m-0 w-full min-w-0 border-b border-border/60 bg-background",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl min-w-0 px-3 pb-4 pt-4 md:px-8 md:pb-4 md:pt-6">
        <div className="table w-full table-fixed border-separate border-spacing-0">
          <div className="table-cell min-w-0 max-w-full align-top">
            <div className="flex w-full min-w-0 flex-col gap-2 md:gap-3">
              <div className="min-w-0 w-full">
                <div className="flex min-w-0 w-full items-center justify-start gap-2">
                  <h2 className="min-w-0 shrink truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    {appointment.patientName}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 bg-transparent hover:bg-muted"
                      aria-label={`Call patient ${appointment.patientName}`}
                      onClick={() =>
                        showPatientActionToast(
                          `Calling ${appointment.patientName} (demo).`,
                        )
                      }
                    >
                      <Phone className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 bg-transparent hover:bg-muted"
                      aria-label={`Message patient ${appointment.patientName}`}
                      onClick={() =>
                        showPatientActionToast(
                          `Message to ${appointment.patientName} (demo).`,
                        )
                      }
                    >
                      <MessageSquare className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <p className={cn("mt-1 line-clamp-1", textMeta)}>
                  PCP: {appointment.pcp}
                  <span className="px-1 text-muted-foreground/70">|</span>
                  Navigator: {appointment.navigator}
                </p>
                <div className="mt-1.5 block w-full min-w-0 md:mt-2">
                  <p className={cn("truncate", textBody)}>
                    <span className="font-medium text-muted-foreground">
                      Reason for Visit:{" "}
                    </span>
                    {appointment.reason}
                  </p>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-2 md:gap-x-3 md:gap-y-2">
                <div className="min-w-0 w-[min(100%,11rem)] shrink-0 sm:w-44 md:w-auto md:max-w-[200px]">
                  <Select
                    value={appointment.stage}
                    onValueChange={(v) => onStageChange(v as AppointmentStage)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-full md:max-w-[200px]"
                    >
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent className="z-1000">
                      {APPOINTMENT_STAGE_ORDER.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatAppointmentStage(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 w-[min(100%,6.5rem)] shrink-0 sm:w-28 md:w-auto md:max-w-[200px]">
                  <Select value={appointment.room} onValueChange={onRoomChange}>
                    <SelectTrigger
                      size="sm"
                      className="h-8 w-full md:max-w-[200px]"
                    >
                      <SelectValue placeholder="Room" />
                    </SelectTrigger>
                    <SelectContent className="z-1000">
                      {WORKSPACE_ROOM_OPTIONS.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  <MessageSquare className="size-3.5" aria-hidden />
                  Message PCP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <BellRing className="size-3.5" aria-hidden />
                  Signal PCP
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {patientActionToast ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-6 left-1/2 z-200 max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
            textBody,
          )}
        >
          {patientActionToast}
        </div>
      ) : null}
    </header>
  );
}
