"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parse } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { CalendarTodayIcon } from "./calendar-today-icon";
import {
  SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS,
  SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS,
  SCHEDULE_BOTTOM_SHEET_HEADER_CLASS,
  SCHEDULE_BOTTOM_SHEET_TITLE_CLASS,
  SCHEDULE_SHEET_OVERLAY_CLASS,
  scheduleBottomSheetContentClass,
} from "./schedule-bottom-sheet-frame";

export type FilteredMatchDayOption = {
  dateKey: string;
  count: number;
};

function formatTimelineDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatMatchDayLabel(dateKey: string): string {
  const d = parse(dateKey, "yyyy-MM-dd", new Date());
  return format(d, "EEE, MMM d, yyyy");
}

type PanelCoords = { top: number; left: number; width: number };

export function ScheduleDateRow({
  selectedDate,
  onShiftDay,
  onGoToday,
  fullBleed,
  className,
  filteredMatchDayOptions,
  onSelectFilteredCalendarDay,
  centerLabel,
  prevPeriodAriaLabel = "Previous day",
  nextPeriodAriaLabel = "Next day",
}: {
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  fullBleed?: boolean;
  className?: string;
  /** Sorted days that have ≥1 appointment matching toolbar filters, with counts. */
  filteredMatchDayOptions?: readonly FilteredMatchDayOption[];
  onSelectFilteredCalendarDay?: (dateKey: string) => void;
  /** When set, replaces the default single-day title (Booking week/month/year). */
  centerLabel?: string;
  prevPeriodAriaLabel?: string;
  nextPeriodAriaLabel?: string;
}) {
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const options = filteredMatchDayOptions ?? [];
  const showMatchDaysControl =
    options.length > 0 && Boolean(onSelectFilteredCalendarDay);

  const [panelOpen, setPanelOpen] = useState(false);
  const matchDaysTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [desktopCoords, setDesktopCoords] = useState<PanelCoords | null>(null);
  const listboxId = useId();
  const matchDaysDialogContentId = useId();

  const pickDay = useCallback(
    (dateKey: string) => {
      onSelectFilteredCalendarDay?.(dateKey);
      setPanelOpen(false);
    },
    [onSelectFilteredCalendarDay],
  );

  const updateDesktopPanelCoords = useCallback(() => {
    const el = matchDaysTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(288, Math.max(220, window.innerWidth - 16));
    const centerX = r.left + r.width / 2;
    const left = Math.min(
      Math.max(8, centerX - width / 2),
      window.innerWidth - width - 8,
    );
    setDesktopCoords({ top: r.bottom + 6, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!panelOpen || fullBleed) {
      setDesktopCoords(null);
      return;
    }
    updateDesktopPanelCoords();
    window.addEventListener("resize", updateDesktopPanelCoords);
    window.addEventListener("scroll", updateDesktopPanelCoords, true);
    return () => {
      window.removeEventListener("resize", updateDesktopPanelCoords);
      window.removeEventListener("scroll", updateDesktopPanelCoords, true);
    };
  }, [panelOpen, fullBleed, updateDesktopPanelCoords]);

  useEffect(() => {
    if (!panelOpen || fullBleed) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        matchDaysTriggerRef.current?.contains(t) ||
        desktopPanelRef.current?.contains(t)
      ) {
        return;
      }
      setPanelOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen, fullBleed]);

  const matchDayList = (
    <ul
      id={fullBleed ? undefined : listboxId}
      role="listbox"
      aria-label="Days with matching appointments"
      className={cn(
        "m-0 list-none p-1.5 text-sm leading-snug",
        fullBleed
          ? "max-h-none overflow-visible"
          : "max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain",
      )}
    >
      {options.map((opt) => {
        const isCurrent = opt.dateKey === selectedKey;
        return (
          <li key={opt.dateKey} role="presentation" className="p-0.5">
            <button
              type="button"
              role="option"
              aria-selected={isCurrent}
                className={cn(
                "flex w-full min-w-0 flex-col gap-1 rounded-md px-3 py-3 text-left text-sm leading-snug text-foreground transition-colors",
                isCurrent
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/70",
              )}
              onClick={() => pickDay(opt.dateKey)}
            >
              <span className="truncate">{formatMatchDayLabel(opt.dateKey)}</span>
              <span className={cn(textMeta, "text-muted-foreground")}>
                {opt.count} appointment{opt.count === 1 ? "" : "s"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  /** Visible compact label; full sentence kept for assistive text. */
  const matchDaysShortLabel =
    options.length === 1 ? "1 matching day" : `${options.length} matching days`;
  const matchDaysAriaLabel =
    options.length === 1
      ? "1 day matches filters. Open list of matching days."
      : `${options.length} days match filters. Open list of matching days.`;

  const desktopPortal =
    panelOpen &&
    !fullBleed &&
    desktopCoords &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={desktopPanelRef}
            className="pointer-events-auto z-200 max-h-[min(60vh,20rem)] overflow-hidden rounded-md border border-border bg-popover py-1 text-sm leading-snug text-popover-foreground shadow-lg"
            style={{
              position: "fixed",
              top: desktopCoords.top,
              left: desktopCoords.left,
              width: desktopCoords.width,
            }}
          >
            {matchDayList}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-10 m-0 grid w-full shrink-0 grid-cols-3 items-center border-b border-border/40 bg-background",
          fullBleed ? "min-h-10 px-1 py-1.5" : "min-h-11 px-2 py-2",
          className,
        )}
      >
        <div className="flex min-w-0 items-center justify-self-start self-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", fullBleed ? "h-8 w-8" : "h-9 w-9")}
            aria-label={prevPeriodAriaLabel}
            onClick={() => onShiftDay(-1)}
          >
            <ChevronLeft className={fullBleed ? "size-3.5" : "size-4"} aria-hidden />
          </Button>
        </div>

        <div className="flex min-w-0 max-w-full flex-col items-center justify-center justify-self-center gap-0 px-1 text-center">
          <span
            className={cn(
              "max-w-full truncate text-center font-medium leading-tight",
              textBody,
            )}
          >
            {centerLabel ?? formatTimelineDayLabel(selectedDate)}
          </span>
          {showMatchDaysControl ? (
            fullBleed ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                ref={matchDaysTriggerRef}
                className={cn(
                  "h-auto min-h-0 shrink px-1 py-0 text-xs font-normal no-underline leading-tight",
                  textMeta,
                  "text-muted-foreground hover:text-foreground",
                )}
                aria-label={matchDaysAriaLabel}
                aria-expanded={panelOpen}
                aria-controls={matchDaysDialogContentId}
                aria-haspopup="dialog"
                onClick={() => setPanelOpen((o) => !o)}
              >
                <span className="inline-flex items-center gap-1">
                  {matchDaysShortLabel}
                  <ChevronDown
                    className={cn(
                      "size-3 shrink-0 opacity-70 transition-transform",
                      panelOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                ref={matchDaysTriggerRef}
                className={cn(
                  "h-auto min-h-0 shrink px-1 py-0 text-xs font-normal no-underline",
                  textMeta,
                  "text-muted-foreground hover:text-foreground",
                )}
                aria-label={matchDaysAriaLabel}
                aria-expanded={panelOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                onClick={() => setPanelOpen((o) => !o)}
              >
                <span className="inline-flex items-center gap-1">
                  {matchDaysShortLabel}
                  <ChevronDown
                    className={cn(
                      "size-3 shrink-0 opacity-70 transition-transform",
                      panelOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </span>
              </Button>
            )
          ) : null}
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-0 self-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", fullBleed ? "h-8 w-8" : "h-9 w-9")}
            aria-label="Go to today"
            onClick={onGoToday}
          >
            <CalendarTodayIcon
              className={cn("text-foreground", fullBleed ? "size-3.5" : "size-4")}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", fullBleed ? "h-8 w-8" : "h-9 w-9")}
            aria-label={nextPeriodAriaLabel}
            onClick={() => onShiftDay(1)}
          >
            <ChevronRight className={fullBleed ? "size-3.5" : "size-4"} aria-hidden />
          </Button>
        </div>
      </div>

      {fullBleed ? (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent
            id={matchDaysDialogContentId}
            side="bottom"
            overlayClassName={SCHEDULE_SHEET_OVERLAY_CLASS}
            className={scheduleBottomSheetContentClass()}
          >
            <SheetHeader className={SCHEDULE_BOTTOM_SHEET_HEADER_CLASS}>
              <SheetTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
                Days with matching appointments
              </SheetTitle>
            </SheetHeader>
            <div className={SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS}>
              <div className={SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS}>
                {matchDayList}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {desktopPortal}
    </>
  );
}
