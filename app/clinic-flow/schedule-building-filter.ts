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

/** Empty `selectedBuckets` means no filter on this axis (show all). */
export function appointmentMatchesSelectedBuildingBuckets(
  apt: Appointment,
  selectedBuckets: readonly BuildingPresenceBucket[],
): boolean {
  if (selectedBuckets.length === 0) return true;
  const inBuilding = appointmentInBuilding(apt.stage);
  return selectedBuckets.some((b) =>
    b === "in_building" ? inBuilding : !inBuilding,
  );
}
