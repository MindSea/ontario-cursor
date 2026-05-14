"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  /** ISO calendar date `yyyy-MM-dd`, or undefined when unset. */
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  /** Trigger element. Wrapped in `Popover.Trigger asChild` so its props are forwarded. */
  children: ReactNode;
  /**
   * Extra className for the popover content. Use to lift the calendar above
   * higher-z surfaces (e.g. inside a Radix Dialog) — `z-1000` is a safe default
   * elsewhere in this app.
   */
  contentClassName?: string;
  /** Where the popover anchors relative to the trigger. */
  align?: "start" | "center" | "end";
};

const WEEK_DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/**
 * Lightweight date picker built on radix-ui Popover + date-fns. Renders a
 * single-month calendar grid and exposes a Clear shortcut when a value is
 * set. The trigger is fully controlled by the caller so it can render any
 * chip / button style.
 */
export function DatePicker({
  value,
  onChange,
  children,
  contentClassName,
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(() => parsed ?? new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const today = new Date();

  /** Re-anchor view to the selected date whenever the popover opens. */
  const handleOpenChange = (next: boolean) => {
    if (next) setViewMonth(parsed ?? new Date());
    setOpen(next);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={6}
          className={cn(
            "z-1000 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none",
            contentClassName,
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <span className="text-sm font-semibold">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 px-1 pb-1 text-center text-xs text-muted-foreground uppercase">
            {WEEK_DAY_LABELS.map((d, i) => (
              <span key={i} aria-hidden>
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 px-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = parsed ? isSameDay(day, parsed) : false;
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(format(day, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm tabular-nums transition-colors",
                    inMonth ? "text-foreground" : "text-muted-foreground/50",
                    !isSelected && "hover:bg-muted",
                    isToday &&
                      !isSelected &&
                      "ring-1 ring-inset ring-border",
                    isSelected &&
                      "bg-foreground text-background hover:bg-foreground",
                  )}
                  aria-pressed={isSelected}
                  aria-label={format(day, "EEEE, MMMM d, yyyy")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          {value ? (
            <div className="mt-2 flex items-center justify-center border-t border-border px-1 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
