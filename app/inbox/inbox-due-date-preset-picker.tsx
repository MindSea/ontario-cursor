"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type { InboxDatePreset } from "./inbox-due-date-filter";

const PRESETS: { key: InboxDatePreset; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "next3", label: "Next 3 days" },
  { key: "custom", label: "Custom range" },
];

/** Chip styling aligned with task `DueDateChip` neutral (`none`) tone. */
const RANGE_PICKER_CHIP =
  "inline-flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-base text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

export function InboxDueDatePresetPicker({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onClear,
  onPresetApplied,
  showClearRow = true,
  className,
}: {
  preset: InboxDatePreset;
  onPresetChange: (p: InboxDatePreset) => void;
  customFrom: string | undefined;
  customTo: string | undefined;
  onCustomFromChange: (v: string | undefined) => void;
  onCustomToChange: (v: string | undefined) => void;
  onClear: () => void;
  onPresetApplied?: () => void;
  showClearRow?: boolean;
  className?: string;
}) {
  const handleValueChange = (value: string) => {
    const key = value as InboxDatePreset;
    onPresetChange(key);
    if (key !== "custom") {
      onCustomFromChange(undefined);
      onCustomToChange(undefined);
      onPresetApplied?.();
    }
  };

  return (
    <div className={cn("min-w-0", className)}>
      <RadioGroup
        value={preset}
        onValueChange={handleValueChange}
        className="gap-0"
        aria-label="Due date filter"
      >
        {PRESETS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted"
          >
            <RadioGroupItem value={key} id={`due-preset-${key}`} />
            <label
              htmlFor={`due-preset-${key}`}
              className="min-w-0 flex-1 cursor-pointer text-sm leading-snug font-normal"
            >
              {label}
            </label>
          </div>
        ))}
      </RadioGroup>
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
      {showClearRow ? (
        <div className="border-t border-border/60 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-center text-sm leading-snug text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            Clear filter
          </Button>
        </div>
      ) : null}
    </div>
  );
}
