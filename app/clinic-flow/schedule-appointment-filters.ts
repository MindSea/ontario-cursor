import type { Appointment } from "./types";

import type { BuildingPresenceBucket } from "./schedule-building-filter";
import { appointmentMatchesSelectedBuildingBuckets } from "./schedule-building-filter";

export function collectDistinctSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function filterAppointmentsForScheduleToolbar(
  appointments: readonly Appointment[],
  opts: {
    selectedPcps: readonly string[];
    selectedNavigators: readonly string[];
    selectedBuildingBuckets: readonly BuildingPresenceBucket[];
  },
): Appointment[] {
  return appointments.filter((a) => {
    if (opts.selectedPcps.length > 0 && !opts.selectedPcps.includes(a.pcp)) {
      return false;
    }
    if (
      opts.selectedNavigators.length > 0 &&
      !opts.selectedNavigators.includes(a.navigator)
    ) {
      return false;
    }
    if (
      !appointmentMatchesSelectedBuildingBuckets(
        a,
        opts.selectedBuildingBuckets,
      )
    ) {
      return false;
    }
    return true;
  });
}
