"use client";

import type { CSSProperties } from "react";

import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { appointmentHasRoom } from "./room-options";
import type { Appointment, AppointmentStage } from "./types";
import { MutedTagBadge, toTitleCaseTagLabel } from "./muted-tag-badge";
import { formatAppointmentStage } from "./stage-display";
import {
  scheduleTileDensity,
  type ScheduleTileDensity,
} from "./schedule-tile-density";

function StageBadgeLabel({ stage }: { stage: AppointmentStage }) {
  if (stage === "CARE MANAGEMENT") {
    return (
      <>
        <span className="block truncate @min-[11rem]/visit:hidden">
          Care Mgmt
        </span>
        <span className="hidden truncate @min-[11rem]/visit:inline">
          {formatAppointmentStage(stage)}
        </span>
      </>
    );
  }
  return (
    <span className="block truncate">{formatAppointmentStage(stage)}</span>
  );
}

/** Visit tile for the day schedule grid (matches legacy master-list styling). */
export function ScheduleVisitGridTile({
  appointment,
  isSelected,
  onSelect,
  spanSlots,
  density: densityProp,
  className,
  style,
}: {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: () => void;
  spanSlots: number;
  density?: ScheduleTileDensity;
  className?: string;
  style?: CSSProperties;
}) {
  const density =
    densityProp ??
    scheduleTileDensity(spanSlots, appointment.estimatedDurationMins);
  const isShort = density === "short";

  return (
    <button
      type="button"
      data-appointment-id={appointment.id}
      onClick={onSelect}
      className={cn(
        "@container/visit absolute flex min-h-0 flex-col overflow-hidden rounded-md border text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        isShort ? "gap-0.5 px-2.5 py-1.5" : "gap-2 px-3 py-2",
        isSelected
          ? "z-20 border-border bg-muted shadow-xl ring-1 ring-inset ring-primary/35"
          : "z-10 border-border bg-muted/30 hover:bg-muted/55",
        className,
      )}
      style={style}
    >
      {isSelected ? (
        <span
          className="pointer-events-none absolute top-0.5 bottom-0.5 left-0 w-1 rounded-l-sm bg-primary"
          aria-hidden
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "line-clamp-1 wrap-break-word font-medium",
            isShort ? "text-sm leading-tight" : textBody,
          )}
        >
          {appointment.patientName}
        </span>
        {isShort ? (
          <span className="line-clamp-1 text-xs leading-tight text-muted-foreground">
            {formatAppointmentStage(appointment.stage)}
            {appointmentHasRoom(appointment)
              ? ` · ${toTitleCaseTagLabel(appointment.room)}`
              : ""}
          </span>
        ) : (
          <span className={cn("line-clamp-2 wrap-break-word", textMeta)}>
            {appointment.reason}
          </span>
        )}
      </div>
      {isShort ? null : (
        <div
          className={cn(
            "flex w-full gap-1.5 overflow-hidden",
            "flex-col items-start",
            "@min-[10.5rem]/visit:flex-row @min-[10.5rem]/visit:flex-wrap @min-[10.5rem]/visit:items-start",
          )}
        >
          {appointmentHasRoom(appointment) ? (
            <MutedTagBadge
              surface="onMutedParent"
              className="max-w-full self-start tabular-nums"
            >
              <span className="block truncate">
                {toTitleCaseTagLabel(appointment.room)}
              </span>
            </MutedTagBadge>
          ) : null}
          <MutedTagBadge
            surface="onMutedParent"
            className="max-w-full self-start"
          >
            <StageBadgeLabel stage={appointment.stage} />
          </MutedTagBadge>
        </div>
      )}
    </button>
  );
}
