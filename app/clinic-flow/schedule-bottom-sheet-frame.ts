import { cn } from "@/lib/utils";

/** Overlay z-index so sheets sit above clinic-flow chrome. */
export const SCHEDULE_SHEET_OVERLAY_CLASS = "z-[110]";

/** Header row: title + divider; pairs with default Sheet close (X) in `SheetContent`. */
export const SCHEDULE_BOTTOM_SHEET_HEADER_CLASS =
  "shrink-0 border-b border-border/50 px-5 pb-3 pt-1 text-left";

export const SCHEDULE_BOTTOM_SHEET_TITLE_CLASS = "text-base leading-snug";

/** Outer body wrapper below the header divider. */
export const SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS =
  "flex min-h-0 flex-1 flex-col px-3 pb-6 pt-2";

/** Scroll region inside the body wrapper. */
export const SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm leading-snug text-foreground";

/**
 * Bottom sheet shell (~80% viewport). Uses `!h` / `!min-h` because `SheetContent`
 * defaults to `h-auto` for `side="bottom"`, which otherwise prevents tall sheets.
 */
export function scheduleBottomSheetContentClass(contentZ = "z-[120]") {
  return cn(
    contentZ,
    "flex !h-[80dvh] !min-h-[80dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-xl bg-background p-0 pt-3 text-foreground",
  );
}
