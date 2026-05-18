"use client";

import { useMemo } from "react";
import { format } from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { FilteredResultsEmptyState } from "@/components/filtered-results-empty-state";

import { BookingDayScheduleGrid } from "./booking-day-schedule-grid";

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
    );
  }

  return (
    <BookingDayScheduleGrid
      appointments={dayAppointments}
      onSelectAppointment={onSelectAppointment}
    />
  );
}
