"use client";

import { useEffect } from "react";
import { format, parseISO } from "date-fns";

import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { appointmentHasRoom } from "./room-options";
import type { Appointment } from "./types";
import { MutedTagBadge, toTitleCaseTagLabel } from "./muted-tag-badge";
import { partitionAgendaDay } from "./schedule-agenda";
import type { FilteredMatchDayOption } from "./schedule-date-row";
import { ScheduleDateRow } from "./schedule-date-row";
import { formatAppointmentStage } from "./stage-display";

function formatArrivalClock(iso: string): string {
  try {
    return format(parseISO(iso), "hh:mm a");
  } catch {
    return "—";
  }
}

export function DayAgendaList({
  appointments: items,
  selectedId,
  onSelectId,
  selectedDate,
  onShiftDay,
  onGoToday,
  onUpdateAppointment: _onUpdateAppointment,
  className,
  fullBleed = false,
  hideDateRow = false,
  filteredMatchDayOptions,
  onSelectFilteredCalendarDay,
}: {
  appointments: readonly Appointment[];
  selectedId: string;
  onSelectId: (id: string) => void;
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  onUpdateAppointment: (id: string, patch: Partial<Appointment>) => void;
  className?: string;
  fullBleed?: boolean;
  hideDateRow?: boolean;
  filteredMatchDayOptions?: readonly FilteredMatchDayOption[];
  onSelectFilteredCalendarDay?: (dateKey: string) => void;
}) {
  const { expected, inProgress, completed } = partitionAgendaDay(items);

  useEffect(() => {
    if (!selectedId) return;
    const el = document.querySelector(
      `[data-appointment-id="${CSS.escape(selectedId)}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, items]);

  const rowButtonClass = (isSelected: boolean) =>
    cn(
      "flex w-full min-w-0 flex-col gap-2 rounded-md border px-3 py-3.5 text-left shadow-sm transition-colors md:px-4",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      isSelected
        ? "border-border bg-muted shadow-md ring-1 ring-inset ring-primary/35"
        : "border-border/70 bg-muted/35 hover:bg-muted/55",
    );

  const renderRow = (apt: Appointment) => {
    const isSelected = apt.id === selectedId;
    return (
      <div key={apt.id} className="flex min-w-0 flex-col">
        <button
          type="button"
          data-appointment-id={apt.id}
          onClick={() => onSelectId(apt.id)}
          className={cn(rowButtonClass(isSelected), "min-w-0 w-full")}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className={cn("min-w-0 font-medium", textBody)}>
              {apt.patientName}
            </span>
            <p
              className={cn(
                "m-0 min-w-0 tabular-nums text-muted-foreground",
                textMeta,
              )}
              aria-label={
                apt.checkedInAt
                  ? `Appointment ${apt.time}, arrival ${formatArrivalClock(apt.checkedInAt)}`
                  : `Appointment ${apt.time}`
              }
            >
              <span>{apt.time}</span>
              {apt.checkedInAt ? (
                <>
                  <span className="text-muted-foreground/65" aria-hidden>
                    {" "}
                    ·{" "}
                  </span>
                  <span className="whitespace-nowrap">
                    Arrival{" "}
                    <time dateTime={apt.checkedInAt}>
                      {formatArrivalClock(apt.checkedInAt)}
                    </time>
                  </span>
                </>
              ) : null}
            </p>
            <span
              className={cn("line-clamp-2", textMeta, "text-muted-foreground")}
            >
              {apt.reason}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* Hide the room chip when the visit has no concrete room
             * assignment (the `NONE` sentinel or a blank string). A
             * literal "NONE" tag in the agenda list adds noise without
             * adding information. */}
            {appointmentHasRoom(apt) ? (
              <MutedTagBadge surface="onMutedParent" className="tabular-nums">
                {toTitleCaseTagLabel(apt.room)}
              </MutedTagBadge>
            ) : null}
            <MutedTagBadge surface="onMutedParent">
              {formatAppointmentStage(apt.stage)}
            </MutedTagBadge>
          </div>
        </button>
      </div>
    );
  };

  const section = (title: string, rows: Appointment[], emptyHint: string) => (
    <section className="flex flex-col gap-4">
      <h2
        className={cn(
          "m-0 text-sm font-semibold text-foreground",
          textBody,
        )}
      >
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className={cn("m-0 py-3", textMeta, "text-muted-foreground")}>
          {emptyHint}
        </p>
      ) : (
        <div className="flex flex-col space-y-5">
          {rows.map((apt) => renderRow(apt))}
        </div>
      )}
    </section>
  );

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col",
        fullBleed && hideDateRow ? "w-full" : "h-full flex-1",
        className,
      )}
    >
      {hideDateRow ? null : (
        <ScheduleDateRow
          selectedDate={selectedDate}
          onShiftDay={onShiftDay}
          onGoToday={onGoToday}
          fullBleed={fullBleed}
          filteredMatchDayOptions={filteredMatchDayOptions}
          onSelectFilteredCalendarDay={onSelectFilteredCalendarDay}
        />
      )}
      <div
        className={cn(
          "w-full",
          fullBleed && hideDateRow
            ? "w-full"
            : fullBleed
              ? "min-h-0"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-10 py-4",
            fullBleed ? "bg-muted/15 px-3 pb-8 md:px-4" : "px-3 pb-6",
          )}
        >
          {section(
            "Expected",
            expected,
            "No upcoming arrivals for this day.",
          )}
          {section(
            "In progress",
            inProgress,
            "No patients checked in yet.",
          )}
          {section(
            "Completed",
            completed,
            "No completed visits for this day.",
          )}
        </div>
      </div>
    </div>
  );
}
