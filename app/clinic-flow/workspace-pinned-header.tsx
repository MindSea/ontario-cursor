"use client";

import { BellRing, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { Appointment, AppointmentStage } from "./types";

const WORKSPACE_STAGE_OPTIONS: { value: AppointmentStage; label: string }[] = [
  { value: "PREVISIT", label: "Previsit" },
  { value: "INTAKE", label: "Intake" },
  { value: "ROOMING", label: "Rooming" },
  { value: "VISIT", label: "Visit" },
  { value: "LABS", label: "Labs" },
  { value: "CARE MANAGEMENT", label: "Care Management" },
  { value: "WRAP UP", label: "Wrap Up" },
];

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
  return (
    <header
      className={cn(
        "m-0 w-full min-w-full border-b border-border/60 bg-background",
        className,
      )}
    >
      {/* Padding inside header so border-b spans full viewport width on the outer <header>. */}
      <div className="px-4 pb-4 pt-4 md:px-6 md:pb-4 md:pt-6">
        <div className="table w-full table-fixed border-separate border-spacing-0">
          <div className="table-cell min-w-0 max-w-full align-top">
            <div className="flex w-full min-w-0 flex-col gap-2 md:gap-3">
              <div className="min-w-0 w-full">
                <h2 className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {appointment.patientName}
                </h2>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  PCP: {appointment.pcp}
                  <span className="px-1 text-muted-foreground/70">|</span>
                  Navigator: {appointment.navigator}
                </p>
                <div className="mt-1.5 block w-full min-w-0 md:mt-2">
                  <p className="truncate text-sm leading-snug text-foreground">
                    <span className="font-medium text-muted-foreground">
                      Reason for Visit:{" "}
                    </span>
                    {appointment.reason}
                  </p>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:gap-3">
                <div className="flex min-w-0 w-full flex-row gap-2 md:w-auto md:shrink-0">
                  <div className="flex-1 md:flex-none md:max-w-[200px]">
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
                        {WORKSPACE_STAGE_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 md:flex-none md:max-w-[200px]">
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
                </div>
                <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <MessageSquare className="size-3.5" aria-hidden />
                    Message PCP
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <BellRing className="size-3.5" aria-hidden />
                    Signal PCP
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
