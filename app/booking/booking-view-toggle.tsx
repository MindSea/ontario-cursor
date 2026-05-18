"use client";

import { Button } from "@/components/ui/button";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { BookingCalendarView } from "./booking-calendar-utils";

const VIEWS: { id: BookingCalendarView; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export function BookingViewToggle({
  value,
  onChange,
  className,
}: {
  value: BookingCalendarView;
  onChange: (v: BookingCalendarView) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5",
        className,
      )}
      role="group"
      aria-label="Calendar view"
    >
      {VIEWS.map((v) => (
        <Button
          key={v.id}
          type="button"
          variant="ghost"
          className={cn(
            "h-8 flex-1 rounded-md px-2 text-sm shadow-none",
            value === v.id
              ? "bg-background font-semibold text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
          )}
          aria-pressed={value === v.id}
          onClick={() => onChange(v.id)}
        >
          <span className={textMeta}>{v.label}</span>
        </Button>
      ))}
    </div>
  );
}
