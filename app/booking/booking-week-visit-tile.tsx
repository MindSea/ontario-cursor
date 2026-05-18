"use client";

import type { CSSProperties } from "react";

import { formatAppointmentStage } from "@/app/clinic-flow/stage-display";
import type { Appointment } from "@/app/clinic-flow/types";
import { cn } from "@/lib/utils";

/** Compact tile for booking week columns (name + time; no badges). */
export function BookingWeekVisitTile({
  appointment,
  isSelected,
  onSelect,
  className,
  style,
}: {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const stageLabel = formatAppointmentStage(appointment.stage);

  return (
    <button
      type="button"
      data-appointment-id={appointment.id}
      onClick={onSelect}
      title={`${appointment.patientName} · ${appointment.time} · ${stageLabel}`}
      className={cn(
        "absolute flex min-h-0 min-w-0 flex-col justify-center gap-0.5 overflow-hidden rounded border px-1.5 py-1 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        isSelected
          ? "z-20 border-border bg-muted shadow-md ring-1 ring-inset ring-primary/35"
          : "z-10 border-border/70 bg-background/95 shadow-sm hover:bg-muted/50",
        className,
      )}
      style={style}
    >
      {isSelected ? (
        <span
          className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 w-0.5 rounded-l-sm bg-primary"
          aria-hidden
        />
      ) : null}
      <span className="line-clamp-1 text-xs font-semibold leading-tight text-foreground">
        {appointment.patientName}
      </span>
      <span className="line-clamp-1 text-[11px] leading-tight text-muted-foreground tabular-nums">
        {appointment.time}
      </span>
    </button>
  );
}
