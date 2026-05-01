"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatTimelineDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ScheduleDateRow({
  selectedDate,
  onShiftDay,
  onGoToday,
  fullBleed,
  className,
}: {
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  fullBleed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "m-0 grid h-9 w-full shrink-0 grid-cols-[auto_1fr_auto] items-center border-b border-border/40 bg-background",
        fullBleed ? "px-0" : "px-1",
        className,
      )}
    >
      <div className="flex justify-start">
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
      <div className="flex items-center justify-center gap-2 px-1">
        <span className=" truncate text-center text-sm font-medium whitespace-nowrap text-foreground">
          {formatTimelineDayLabel(selectedDate)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs font-medium"
          onClick={onGoToday}
        >
          Today
        </Button>
      </div>
      <div className="flex justify-end">
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
    </div>
  );
}
