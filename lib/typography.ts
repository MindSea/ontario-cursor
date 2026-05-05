/**
 * App-wide type scale (16px / 14px / 12px at default root).
 * Use these in `cn()` so primary vs secondary stays consistent.
 */

/** Primary reading text — checkbox labels, row titles, main copy (~16px). */
export const textBody =
  "text-base leading-snug text-foreground";

/** Secondary / descriptive lines under a title (~14px). */
export const textMeta =
  "text-sm leading-snug text-muted-foreground";

/** Compact chrome: time ticks and similar (~12px). Badges use `text-sm` in `components/ui/badge`. */
export const textCaption =
  "text-xs leading-snug text-muted-foreground";

/** Overline section labels (HUDDLE / PREVISIT card headers, ~12px). */
export const textOverline =
  "text-xs font-bold leading-none tracking-wider text-muted-foreground uppercase";
