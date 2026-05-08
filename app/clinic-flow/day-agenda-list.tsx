"use client";

import { useEffect } from "react";
import { format, parseISO } from "date-fns";

import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";
import { MutedTagBadge, toTitleCaseTagLabel } from "./muted-tag-badge";
import { partitionAgendaDay } from "./schedule-agenda";
import type { FilteredMatchDayOption } from "./schedule-date-row";
import { ScheduleDateRow } from "./schedule-date-row";
import { formatAppointmentStage } from "./stage-display";

function formatArrivalClock(iso: string): string {
  try {
    return format(parseISO(iso), "h:mm a");
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
  const { arrived, expected } = partitionAgendaDay(items);

  useEffect(() => {
    if (!selectedId) return;
    const el = document.querySelector(
      `[data-appointment-id="${CSS.escape(selectedId)}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, items]);

  const rowButtonClass = (isSelected: boolean) =>
    cn(
      "flex w-full min-w-0 flex-col gap-2 rounded-md border px-4 py-3.5 text-left transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      isSelected
        ? "border-border bg-muted shadow-sm ring-1 ring-inset ring-primary/35"
        : "border-border/60 bg-background hover:bg-muted/40",
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
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className={cn("min-w-0 font-medium", textBody)}>
                {apt.patientName}
              </span>
              <span
                className={cn(
                  textMeta,
                  "shrink-0 tabular-nums text-muted-foreground",
                )}
              >
                {apt.time}
                {apt.checkedInAt ? (
                  <>
                    <span className="text-muted-foreground/70" aria-hidden>
                      {" "}
                      ·{" "}
                    </span>
                    {formatArrivalClock(apt.checkedInAt)}
                  </>
                ) : null}
              </span>
            </div>
            <span
              className={cn("line-clamp-2", textMeta, "text-muted-foreground")}
            >
              {apt.reason}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <MutedTagBadge surface="onMutedParent" className="tabular-nums">
              {toTitleCaseTagLabel(apt.room)}
            </MutedTagBadge>
            <MutedTagBadge surface="onMutedParent">
              {formatAppointmentStage(apt.stage)}
            </MutedTagBadge>
          </div>
        </button>
      </div>
    );
  };

  const section = (title: string, rows: Appointment[]) => (
    <section className="flex flex-col gap-3">
      <h2
        className={cn(
          "m-0 mb-1 text-sm font-semibold text-foreground",
          textBody,
        )}
      >
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className={cn("m-0 py-3", textMeta, "text-muted-foreground")}>
          None for this day.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
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
            fullBleed ? "px-4 pb-8" : "px-3 pb-6",
          )}
        >
          {section("Checked in", arrived)}
          {section("Not yet arrived", expected)}
        </div>
      </div>
    </div>
  );
}
