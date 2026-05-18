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
  variant = "default",
  embedded = false,
  className,
  style,
}: {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: () => void;
  /** Week cascade stack: opaque cards, top-left labels. */
  variant?: "default" | "cascade";
  embedded?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const stageLabel = formatAppointmentStage(appointment.stage);
  const isCascade = variant === "cascade";

  return (
    <button
      type="button"
      data-appointment-id={appointment.id}
      onClick={onSelect}
      title={`${appointment.patientName} · ${appointment.time} · ${stageLabel}`}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden text-left",
        isCascade
          ? "items-start justify-start gap-0.5 px-1.5 pt-1.5 pb-1"
          : "justify-center gap-0.5 px-1.5 py-1",
        embedded
          ? "relative h-full w-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          : isCascade
            ? cn(
                "absolute size-full min-h-7 rounded-md border border-border/80 bg-background shadow-sm",
                "transition-[background-color,border-color,box-shadow] duration-100 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                "hover:border-border hover:bg-muted hover:shadow-md hover:ring-1 hover:ring-border/90",
                "focus-visible:border-border focus-visible:bg-muted focus-visible:shadow-md",
                isSelected &&
                  "border-border bg-muted shadow-lg ring-2 ring-ring/35",
              )
            : cn(
                "absolute rounded border",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
                isSelected
                  ? "z-20 border-border bg-muted shadow-md ring-1 ring-inset ring-primary/35"
                  : "z-10 border-border/70 bg-background/95 shadow-sm hover:bg-muted/50",
              ),
        className,
      )}
      style={style}
    >
      {isSelected && !embedded ? (
        <span
          className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 w-0.5 rounded-l-sm bg-primary"
          aria-hidden
        />
      ) : null}
      <span className="line-clamp-1 w-full text-xs font-semibold leading-tight text-foreground">
        {appointment.patientName}
      </span>
      <span className="line-clamp-1 w-full text-[11px] leading-tight text-muted-foreground tabular-nums">
        {appointment.time}
      </span>
    </button>
  );
}
