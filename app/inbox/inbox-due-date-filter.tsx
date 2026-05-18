"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { InboxDueDatePresetPicker } from "./inbox-due-date-preset-picker";

export type InboxDatePreset = "all" | "today" | "next3" | "custom";

const PRESET_LABEL: Record<Exclude<InboxDatePreset, "custom">, string> = {
  all: "All",
  today: "Today",
  next3: "Next 3 days",
};

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
  popoverClassName,
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
  /** Extra classes for popover content (e.g. lift above a bottom sheet). */
  popoverClassName?: string;
}) {
  const open = openMenu === menuId;
  const listboxDomId = `${idPrefix}-due-date-filter`;
  const triggerMeasureRef = useRef<HTMLDivElement>(null);
  const [popoverWidthPx, setPopoverWidthPx] = useState<number | null>(null);

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
            popoverClassName,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <InboxDueDatePresetPicker
            preset={preset}
            onPresetChange={onPresetChange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={onCustomFromChange}
            onCustomToChange={onCustomToChange}
            onClear={() => {
              onPresetChange("all");
              onCustomFromChange(undefined);
              onCustomToChange(undefined);
            }}
            onPresetApplied={() => setOpenMenu(null)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
