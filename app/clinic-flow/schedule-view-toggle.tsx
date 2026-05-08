"use client";

import { CalendarDays, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type ScheduleViewMode = "grid" | "agenda";

export function ScheduleViewToggle({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: ScheduleViewMode;
  onChange: (next: ScheduleViewMode) => void;
  className?: string;
  /** Tighter height for narrow mobile chrome. */
  compact?: boolean;
}) {
  const h = compact ? "h-8" : "h-9";
  return (
    <div
      className={cn("flex w-full min-w-0 gap-1 p-0.5", className)}
      role="group"
      aria-label="Calendar and list display"
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "flex-1 gap-1.5 rounded-md border shadow-none ring-0",
          h,
          value === "grid"
            ? "border-border/70 bg-background font-semibold text-foreground shadow-sm"
            : "border-transparent text-muted-foreground hover:bg-muted/55 hover:text-foreground",
        )}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        <CalendarDays className="size-4 shrink-0 opacity-90" aria-hidden />
        <span
          className={cn(
            textMeta,
            value === "grid" ? "font-semibold text-foreground" : "font-medium",
          )}
        >
          Calendar
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          "flex-1 gap-1.5 rounded-md border shadow-none ring-0",
          h,
          value === "agenda"
            ? "border-border/70 bg-background font-semibold text-foreground shadow-sm"
            : "border-transparent text-muted-foreground hover:bg-muted/55 hover:text-foreground",
        )}
        aria-pressed={value === "agenda"}
        onClick={() => onChange("agenda")}
      >
        <List className="size-4 shrink-0 opacity-90" aria-hidden />
        <span
          className={cn(
            textMeta,
            value === "agenda" ? "font-semibold text-foreground" : "font-medium",
          )}
        >
          List
        </span>
      </Button>
    </div>
  );
}
