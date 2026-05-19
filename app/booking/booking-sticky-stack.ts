import { cn } from "@/lib/utils";

/** Non-scrolling chrome band (full-width divider). */
export const bookingChromeBandClass = cn(
  "shrink-0 w-full min-w-0 overflow-x-hidden bg-background",
);

/** Filter chrome (search + filters). */
export const bookingChromeFiltersClass = cn(
  bookingChromeBandClass,
  "border-b border-border/50 max-md:border-border/60",
);

/** View toggle + primary actions. */
export const bookingChromeViewClass = cn(
  bookingChromeBandClass,
  "border-b border-border/40",
);

/** Period navigation (chevrons, label, today). */
export const bookingChromeDateClass = cn(
  bookingChromeBandClass,
  "border-b border-border/40",
);

/** Shared horizontal padding / max width for booking content. */
export const bookingChromeContentPadClass = cn(
  "mx-auto w-full min-w-0 max-w-6xl",
  "max-md:px-3 md:px-8",
);

/** Gap between date navigation and calendar content (matches Messaging). */
export const bookingContentBelowDateClass = cn(
  "flex min-h-0 min-w-0 flex-1 flex-col",
  "max-md:pt-1 md:pt-4",
);

/** Wraps day/week calendar panels (messaging-style bordered viewport). */
export const bookingCalendarPanelOuterClass = cn(
  bookingContentBelowDateClass,
  bookingChromeContentPadClass,
  "max-md:pb-3 md:pb-4",
);

export const bookingCalendarPanelClass = cn(
  "@container/booking-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
  "max-md:rounded-none max-md:border-0",
  "md:rounded-lg md:border md:border-border/60",
);

/** Scroll surface inside the calendar panel (time + appointment grid). */
export const bookingCalendarViewportScrollClass = cn(
  "relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain",
  "[-webkit-overflow-scrolling:touch]",
);

/** Month/year: classic page scroll below chrome. */
export const bookingCalendarScrollClass = cn(
  bookingContentBelowDateClass,
  "overflow-x-hidden overflow-y-auto overscroll-contain",
  "max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pb-3",
  "md:mx-auto md:w-full md:max-w-6xl md:px-8 md:pb-4",
);
