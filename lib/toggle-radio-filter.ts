/** Clicking the active option clears selection; otherwise selects that option. */
export function toggleRadioFilterValue<T extends string>(
  current: T | null | undefined,
  option: T,
): T | null {
  return current === option ? null : option;
}
