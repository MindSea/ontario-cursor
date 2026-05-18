/** Visual density for time-grid appointment tiles. */
export type ScheduleTileDensity = "full" | "short";

/**
 * One 15-minute row cannot fit the full card (name, reason, two badges).
 * Short tiles show name + stage only.
 */
export function scheduleTileDensity(
  spanSlots: number,
  estimatedDurationMins?: number,
): ScheduleTileDensity {
  const mins = estimatedDurationMins ?? spanSlots * 15;
  if (spanSlots <= 1 || mins <= 15) return "short";
  return "full";
}
