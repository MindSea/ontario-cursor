import { format } from "date-fns";

import type { Appointment } from "./types";
import { extendAppointmentsForBookingCalendar } from "./extend-appointments-for-booking";
import { buildSeedAppointments } from "./seed-appointments";

/** Single seed build + selection aligned to “today” so refresh does not flash wrong workspace/selection. */
export function createClinicFlowInitialState(): {
  appointments: Appointment[];
  selectedId: string;
} {
  const appointments = extendAppointmentsForBookingCalendar(
    buildSeedAppointments(),
  );
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const selectedId =
    appointments.find((a) => a.date === todayKey)?.id ??
    appointments[0]?.id ??
    "";
  return { appointments, selectedId };
}
