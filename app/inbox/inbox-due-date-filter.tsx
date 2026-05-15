"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type InboxDatePreset = "all" | "today" | "next3" | "custom";

const PRESET_LABEL: Record<Exclude<InboxDatePreset, "custom">, string> = {
  all: "All",
  today: "Today",
  next3: "Next 3 days",
};

/** Chip styling aligned with task `DueDateChip` neutral (`none`) tone. */
const RANGE_PICKER_CHIP =
  "inline-flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

export function summaryForDueDateFilter(
  preset: InboxDatePreset,
  customFrom: string | undefined,
  customTo: string | undefined,
): string {
  if (preset === "custom") {
    if (customFrom?.trim() && customTo?.trim()) {
      try {
        const a = format(parseISO(customFrom), "MMM d, yyyy");
        const b = format(parseISO(customTo), "MMM d, yyyy");
        return `${a} – ${b}`;
      } catch {
        return `${customFrom} – ${customTo}`;
      }
    }
    return "Custom";
  }
  return PRESET_LABEL[preset];
}

export function InboxDueDateFilterDropdown({
  idPrefix,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  openMenu,
  setOpenMenu,
  menuId,
  fullWidth = false,
  compact = false,
}: {
  idPrefix: string;
  preset: InboxDatePreset;
  onPresetChange: (p: InboxDatePreset) => void;
  customFrom: string | undefined;
  customTo: string | undefined;
  onCustomFromChange: (v: string | undefined) => void;
  onCustomToChange: (v: string | undefined) => void;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  menuId: string;
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const open = openMenu === menuId;
  const listboxDomId = `${idPrefix}-due-date-filter`;
  const triggerMeasureRef = useRef<HTMLDivElement>(null);
  const [popoverWidthPx, setPopoverWidthPx] = useState<number | null>(null);
  const radioName = `${idPrefix}-due-date-preset`;

  useLayoutEffect(() => {
    if (!open) {
      queueMicrotask(() => setPopoverWidthPx(null));
      return;
    }
    const el = triggerMeasureRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setPopoverWidthPx(Math.round(w * 1000) / 1000);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const summary = summaryForDueDateFilter(preset, customFrom, customTo);

  const presets: { key: InboxDatePreset; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "next3", label: "Next 3 days" },
    { key: "custom", label: "Custom range" },
  ];

  return (
    <div
      ref={triggerMeasureRef}
      className={cn(
        "relative shrink-0",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : compact
            ? "min-w-0 flex-1 basis-0"
            : "w-42 min-w-32 max-w-48",
      )}
    >
      <Popover
        open={open}
        onOpenChange={(next) => setOpenMenu(next ? menuId : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-full min-w-0 justify-between gap-1",
              compact
                ? "h-9 min-h-9 px-2.5 py-0"
                : "h-9 gap-1.5 px-3",
            )}
            aria-haspopup="dialog"
            aria-controls={open ? listboxDomId : undefined}
          >
            <span className="min-w-0 truncate text-left text-sm leading-snug">
              <span className="text-muted-foreground">Due date</span>
              <span className="text-muted-foreground">: </span>
              <span
                className={cn(
                  "tabular-nums text-foreground",
                  compact && "font-semibold",
                )}
              >
                {summary}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "shrink-0 text-muted-foreground transition-transform",
                compact ? "size-3 opacity-80" : "size-3.5",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          id={listboxDomId}
          style={
            popoverWidthPx != null
              ? { width: popoverWidthPx, minWidth: popoverWidthPx, maxWidth: "none" }
              : undefined
          }
          className={cn(
            "z-130",
            "min-w-0 rounded-md border border-border bg-popover p-0 text-sm leading-snug text-popover-foreground shadow-md",
            popoverWidthPx == null && "min-w-48 max-w-[min(100vw-1rem,20rem)]",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <fieldset className="m-0 max-h-60 overflow-y-auto overscroll-contain border-0 p-0">
            <legend className="sr-only">Due date filter</legend>
            {presets.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-muted"
              >
                <input
                  type="radio"
                  name={radioName}
                  value={key}
                  checked={preset === key}
                  className="size-4 shrink-0 accent-foreground"
                  onChange={() => {
                    onPresetChange(key);
                    if (key !== "custom") {
                      onCustomFromChange(undefined);
                      onCustomToChange(undefined);
                      setOpenMenu(null);
                    }
                  }}
                />
                <span className="min-w-0 leading-snug">{label}</span>
              </label>
            ))}
          </fieldset>
          {preset === "custom" ? (
            <div className="space-y-3 border-t border-border/60 p-3">
              <div className="grid gap-1.5">
                <span className="text-muted-foreground text-xs">From</span>
                <DatePicker
                  value={customFrom}
                  onChange={onCustomFromChange}
                  contentClassName="z-1000"
                >
                  <button
                    type="button"
                    className={RANGE_PICKER_CHIP}
                    aria-label="Custom range start date"
                  >
                    <CalendarIcon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    {customFrom ? (
                      <span className="min-w-0 truncate tabular-nums text-foreground">
                        {format(parseISO(customFrom), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span>Select date</span>
                    )}
                  </button>
                </DatePicker>
              </div>
              <div className="grid gap-1.5">
                <span className="text-muted-foreground text-xs">To</span>
                <DatePicker
                  value={customTo}
                  onChange={onCustomToChange}
                  contentClassName="z-1000"
                >
                  <button
                    type="button"
                    className={RANGE_PICKER_CHIP}
                    aria-label="Custom range end date"
                  >
                    <CalendarIcon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    {customTo ? (
                      <span className="min-w-0 truncate tabular-nums text-foreground">
                        {format(parseISO(customTo), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span>Select date</span>
                    )}
                  </button>
                </DatePicker>
              </div>
            </div>
          ) : null}
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-center text-sm leading-snug text-muted-foreground hover:text-foreground"
              onClick={() => {
                onPresetChange("all");
                onCustomFromChange(undefined);
                onCustomToChange(undefined);
                setOpenMenu(null);
              }}
            >
              Clear filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
