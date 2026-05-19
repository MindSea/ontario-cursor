"use client";

import type { CSSProperties } from "react";

import { scheduleTileDensity } from "@/app/clinic-flow/schedule-tile-density";
import type { Appointment } from "@/app/clinic-flow/types";
import { formatArrivalClock } from "@/lib/calendar-format";
import { textBody, textCaption, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type BookingVisitTileDisplay = "compact" | "day";

/** Compact tile for week columns and Clinic Flow calendar (name + time). */
export function BookingWeekVisitTile({
  appointment,
  isSelected,
  onSelect,
  variant = "default",
  display = "compact",
  spanSlots = 4,
  embedded = false,
  className,
  style,
}: {
  appointment: Appointment;
  isSelected: boolean;
  onSelect: () => void;
  /** Week cascade stack: opaque cards, top-left labels. */
  variant?: "default" | "cascade";
  /** `compact`: 14px name, 12px time. `day`: list-view fields (no room/stage). */
  display?: BookingVisitTileDisplay;
  /** Used with `display="day"` for short vs full tile density. */
  spanSlots?: number;
  embedded?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const isCascade = variant === "cascade";
  const isDay = display === "day";
  const isShort =
    isDay &&
    scheduleTileDensity(spanSlots, appointment.estimatedDurationMins) ===
      "short";

  const timeLine = (
    <p
      className={cn(
        "m-0 min-w-0 tabular-nums text-muted-foreground",
        isDay && !isShort ? textMeta : textCaption,
      )}
      aria-label={
        appointment.checkedInAt
          ? `Appointment ${appointment.time}, arrival ${formatArrivalClock(appointment.checkedInAt)}`
          : `Appointment ${appointment.time}`
      }
    >
      <span>{appointment.time}</span>
      {isDay && appointment.checkedInAt ? (
        <>
          <span className="text-muted-foreground/65" aria-hidden>
            {" "}
            ·{" "}
          </span>
          <span className="whitespace-nowrap">
            Arrival{" "}
            <time dateTime={appointment.checkedInAt}>
              {formatArrivalClock(appointment.checkedInAt)}
            </time>
          </span>
        </>
      ) : null}
    </p>
  );

  return (
    <button
      type="button"
      data-appointment-id={appointment.id}
      onClick={onSelect}
      title={`${appointment.patientName} · ${appointment.time}`}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden text-left",
        isDay
          ? cn(
              "gap-1",
              isCascade ? "px-2 pt-1.5 pb-1" : "px-2 py-1.5",
            )
          : isCascade
            ? "items-start justify-start gap-0.5 px-1.5 pt-1.5 pb-1"
            : "justify-center gap-0.5 px-1.5 py-1",
        embedded
          ? "relative h-full w-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          : isCascade
            ? cn(
                "absolute inset-0 min-h-7 rounded-md border border-border/80 bg-background shadow-sm",
                "transition-[background-color,border-color,box-shadow] duration-100 ease-out",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/35",
                "hover:border-border hover:bg-muted hover:shadow-sm",
                "focus-visible:border-border focus-visible:bg-muted",
                isSelected &&
                  "z-20 border-border bg-muted shadow-md ring-1 ring-inset ring-primary/35",
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
      {isDay ? (
        <div className="flex min-h-0 min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              "line-clamp-1 min-w-0 font-medium",
              isShort ? "text-sm leading-tight" : textBody,
            )}
          >
            {appointment.patientName}
          </span>
          {timeLine}
          {isShort ? null : (
            <span
              className={cn(
                "line-clamp-2 min-w-0 text-muted-foreground",
                textMeta,
              )}
            >
              {appointment.reason}
            </span>
          )}
        </div>
      ) : (
        <>
          <span
            className={cn(
              "line-clamp-1 w-full font-semibold leading-tight text-foreground",
              "text-sm",
            )}
          >
            {appointment.patientName}
          </span>
          <span
            className={cn(
              "line-clamp-1 w-full leading-tight text-muted-foreground tabular-nums",
              textCaption,
            )}
          >
            {appointment.time}
          </span>
        </>
      )}
    </button>
  );
}
