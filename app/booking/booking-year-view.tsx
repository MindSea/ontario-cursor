"use client";

import { useMemo } from "react";
import { addMonths, format, startOfYear } from "date-fns";

import type { Appointment } from "@/app/clinic-flow/types";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function BookingYearView({
  anchor,
  appointments,
  onSelectMonth,
}: {
  anchor: Date;
  appointments: readonly Appointment[];
  onSelectMonth: (monthStart: Date) => void;
}) {
  const yearStart = startOfYear(anchor);

  const countByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      const monthKey = a.date.slice(0, 7);
      map.set(monthKey, (map.get(monthKey) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i)),
    [yearStart],
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {months.map((monthStart) => {
        const monthKey = format(monthStart, "yyyy-MM");
        const count = countByMonth.get(monthKey) ?? 0;
        return (
          <button
            key={monthKey}
            type="button"
            onClick={() => onSelectMonth(monthStart)}
            className={cn(
              "flex min-h-24 flex-col items-center justify-center rounded-lg border border-border/60 bg-card px-3 py-4 shadow-sm transition-colors hover:bg-muted/30",
            )}
          >
            <span className={cn("font-semibold text-foreground", textBody)}>
              {format(monthStart, "MMMM")}
            </span>
            <span className={cn("mt-1 tabular-nums text-muted-foreground", textMeta)}>
              {count === 0
                ? "No visits"
                : `${count} appointment${count === 1 ? "" : "s"}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
