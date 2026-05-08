import type { Appointment, AppointmentStage } from "./types";

/** Checkbox values for the schedule status row (same OR semantics as PCP / navigator). */
export type BuildingPresenceBucket = "in_building" | "not_in_building";

export const BUILDING_PRESENCE_BUCKET_ORDER: readonly BuildingPresenceBucket[] =
  ["in_building", "not_in_building"];

export const BUILDING_PRESENCE_BUCKET_LABEL: Record<
  BuildingPresenceBucket,
  string
> = {
  in_building: "In building",
  not_in_building: "Not in building",
};

export function appointmentInBuilding(stage: AppointmentStage): boolean {
  return stage !== "PREVISIT" && stage !== "COMPLETED";
}

export function buildingPresenceBucketForAppointment(
  apt: Appointment,
): BuildingPresenceBucket {
  return appointmentInBuilding(apt.stage) ? "in_building" : "not_in_building";
}

/** Every bucket selected OR none selected — same as no restriction on this axis. */
export function buildingPresenceBucketsShowAll(
  selectedBuckets: readonly BuildingPresenceBucket[],
): boolean {
  if (selectedBuckets.length === 0) return true;
  const set = new Set(selectedBuckets);
  return BUILDING_PRESENCE_BUCKET_ORDER.every((b) => set.has(b));
}

/** True when the status filter actually narrows the schedule (not “all” / both). */
export function buildingPresenceFilterNarrows(
  selectedBuckets: readonly BuildingPresenceBucket[],
): boolean {
  return !buildingPresenceBucketsShowAll(selectedBuckets);
}

/** Empty `selectedBuckets` means no filter on this axis (show all). */
export function appointmentMatchesSelectedBuildingBuckets(
  apt: Appointment,
  selectedBuckets: readonly BuildingPresenceBucket[],
): boolean {
  if (buildingPresenceBucketsShowAll(selectedBuckets)) return true;
  const inBuilding = appointmentInBuilding(apt.stage);
  return selectedBuckets.some((b) =>
    b === "in_building" ? inBuilding : !inBuilding,
  );
}
