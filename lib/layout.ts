import { cn } from "@/lib/utils";

/**
 * Shared layout caps so task lists read the same in the patient profile
 * panel section and on Inbox (page chrome may stay wider at max-w-6xl).
 */

/** Max width for panel management / inbox task lists (~48rem). */
export const panelTaskListMaxWidthClass = "max-w-3xl";

/** Centered task column inside a wider workspace (e.g. Inbox at max-w-6xl). */
export const panelTaskListColumnClass = `mx-auto w-full min-w-0 ${panelTaskListMaxWidthClass}`;

/**
 * Root scroller for Inbox, Panel Management, Booking, etc. Reserves scrollbar
 * gutter so filtering/search does not shift content when overflow toggles.
 */
export const fullBleedPageRootClass = cn(
  "flex min-h-0 flex-1 flex-col bg-background text-foreground",
  "max-md:fixed max-md:inset-0 max-md:z-0 max-md:h-dvh max-md:max-h-dvh max-md:overflow-y-auto max-md:overscroll-y-auto",
  "md:static md:z-auto md:h-full md:overflow-y-auto md:overscroll-y-auto",
  "[scrollbar-gutter:stable]",
);
