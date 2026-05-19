"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { FilteredResultsEmptyState } from "@/components/filtered-results-empty-state";

import { BookingCalendarDayViewport } from "./booking-calendar-viewport";

export function BookingDayView({
  anchor,
  appointments,
  onSelectAppointment,
  hasSearch = false,
  hasToolbarFilters = false,
  onClearSearch,
  onClearFilters,
}: {
  anchor: Date;
  appointments: readonly Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
  hasSearch?: boolean;
  hasToolbarFilters?: boolean;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
}) {
  const dateKey = format(anchor, "yyyy-MM-dd");
  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.date === dateKey),
    [appointments, dateKey],
  );

  if (dayAppointments.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <FilteredResultsEmptyState
          entity="appointments"
          hasSearch={hasSearch}
          hasToolbarFilters={hasToolbarFilters}
          locationPhrase="on this day"
          onClearSearch={onClearSearch}
          onClearFilters={onClearFilters}
          align="center"
          className="items-center py-6 text-center [&>div:last-child]:justify-center"
        />
      </div>
    );
  }

  return (
    <BookingCalendarDayViewport
      appointments={dayAppointments}
      onSelectAppointment={onSelectAppointment}
    />
  );
}
