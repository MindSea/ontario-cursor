"use client";

import type { Appointment } from "@/app/clinic-flow/types";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function BookingAppointmentTile({
  appointment,
  onClick,
  compact = false,
}: {
  appointment: Appointment;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 flex-col gap-0.5 rounded-md border border-border/70 bg-muted/35 px-2 py-1.5 text-left shadow-sm transition-colors",
        "hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        compact && "py-1",
      )}
    >
      <span className={cn("truncate font-medium text-foreground", textBody)}>
        {appointment.patientName}
      </span>
      <span className={cn("truncate", textMeta)}>
        {appointment.time}
        {!compact ? (
          <>
            <span className="text-muted-foreground/60"> · </span>
            {appointment.appointmentType}
          </>
        ) : null}
      </span>
    </button>
  );
}
