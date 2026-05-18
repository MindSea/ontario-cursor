export type FilteredResultsEntity = "patients" | "tasks" | "appointments";

export function filteredResultsEmptyMessage(
  entity: FilteredResultsEntity,
  opts: {
    hasSearch: boolean;
    hasToolbarFilters: boolean;
    /** Optional scope, e.g. `on this day` → “No appointments on this day match …”. */
    locationPhrase?: string;
  },
): string {
  const noun =
    entity === "patients"
      ? "patients"
      : entity === "tasks"
        ? "tasks"
        : "appointments";
  const loc = opts.locationPhrase ? ` ${opts.locationPhrase}` : "";

  if (opts.hasSearch && opts.hasToolbarFilters) {
    return `No ${noun}${loc} match your search or filters.`;
  }
  if (opts.hasSearch) {
    return `No ${noun}${loc} match your search.`;
  }
  return `No ${noun}${loc} match your filters.`;
}
