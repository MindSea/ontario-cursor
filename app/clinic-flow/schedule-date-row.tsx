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
}: {
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  fullBleed?: boolean;
  className?: string;
  /** Sorted days that have ≥1 appointment matching toolbar filters, with counts. */
  filteredMatchDayOptions?: readonly FilteredMatchDayOption[];
  onSelectFilteredCalendarDay?: (dateKey: string) => void;
}) {
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const options = filteredMatchDayOptions ?? [];
  const matchDayKeys = new Set(options.map((o) => o.dateKey));
  const showMatchDaysControl =
    options.length > 0 &&
    onSelectFilteredCalendarDay &&
    (options.length > 1 || !matchDayKeys.has(selectedKey));

  const [panelOpen, setPanelOpen] = useState(false);
  const matchDaysTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [desktopCoords, setDesktopCoords] = useState<PanelCoords | null>(null);
  const listboxId = useId();

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
      className="m-0 max-h-[min(60vh,20rem)] list-none overflow-y-auto overscroll-contain p-1.5 text-sm leading-snug"
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

  const matchDaysLabel =
    options.length === 1
      ? "1 day matches filters"
      : `${options.length} days match filters`;

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
          "sticky top-0 z-10 m-0 grid w-full shrink-0 grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] border-b border-border/40 bg-background py-2.5",
          fullBleed ? "px-0" : "px-2",
          className,
        )}
      >
        <div className="col-start-1 row-span-2 flex items-center justify-start self-stretch">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Previous day"
            onClick={() => onShiftDay(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="col-start-2 row-start-1 flex min-h-9 min-w-0 flex-col items-center justify-center gap-1.5 px-1.5 pt-1">
          <span
            className={cn(
              "max-w-full truncate text-center font-medium",
              textBody,
            )}
          >
            {formatTimelineDayLabel(selectedDate)}
          </span>
        </div>

        <div className="col-start-3 row-span-2 flex items-center justify-end self-stretch">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Next day"
            onClick={() => onShiftDay(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="col-start-2 row-start-2 flex min-w-0 flex-wrap items-center justify-center gap-2.5 px-1.5 pb-1.5 pt-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 min-h-8 shrink-0 px-3 py-0 text-sm leading-snug font-medium text-foreground"
            onClick={onGoToday}
          >
            Today
          </Button>
          {showMatchDaysControl ? (
            fullBleed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                ref={matchDaysTriggerRef}
                className="h-8 min-h-8 shrink-0 gap-1.5 px-3 py-0 text-sm leading-snug font-medium text-foreground"
                aria-expanded={panelOpen}
                aria-controls={`${listboxId}-sheet-list`}
                aria-haspopup="dialog"
                onClick={() => setPanelOpen((o) => !o)}
              >
                <span>{matchDaysLabel}</span>
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 opacity-70 transition-transform",
                    panelOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                ref={matchDaysTriggerRef}
                className="h-8 min-h-8 shrink-0 gap-1.5 px-3 py-0 text-sm leading-snug font-medium text-foreground"
                aria-expanded={panelOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                onClick={() => setPanelOpen((o) => !o)}
              >
                <span>{matchDaysLabel}</span>
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 opacity-70 transition-transform",
                    panelOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </Button>
            )
          ) : null}
        </div>
      </div>

      {fullBleed ? (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent
            side="bottom"
            overlayClassName="z-110"
            className="z-120 max-h-[min(85dvh,28rem)] rounded-t-xl p-0 pt-3"
            showCloseButton
          >
            <SheetHeader className="shrink-0 px-5 pb-3 pt-1 text-left">
              <SheetTitle>Days with matching appointments</SheetTitle>
            </SheetHeader>
            <div
              id={`${listboxId}-sheet-list`}
              className="min-h-0 flex-1 px-5 pb-8 text-sm leading-snug text-foreground"
            >
              {matchDayList}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {desktopPortal}
    </>
  );
}
