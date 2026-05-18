"use client";

import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import {
  SCHEDULE_MAX_VISIBLE_LANES,
  type AppointmentBlock,
} from "./day-schedule-grid";
import { formatAppointmentStage } from "./stage-display";
import { appointmentHasRoom } from "./room-options";
import { toTitleCaseTagLabel } from "./muted-tag-badge";

export function ScheduleOverflowPopover({
  hiddenBlocks,
  selectedId,
  onSelectAppointment,
  anchorStartSlot,
  spanSlots,
  displayColumnCount,
  slotCssVar = "--cf-slot",
}: {
  hiddenBlocks: readonly AppointmentBlock[];
  selectedId: string;
  onSelectAppointment: (id: string) => void;
  anchorStartSlot: number;
  spanSlots: number;
  displayColumnCount: number;
  slotCssVar?: string;
}) {
  const [open, setOpen] = useState(false);
  const count = hiddenBlocks.length;
  if (count === 0) return null;

  const label = count === 1 ? "+1 more" : `+${count} more`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute z-30 flex min-h-7 items-center justify-center rounded-md border border-dashed border-border/80 bg-background/95 px-2 py-1 text-xs font-medium text-foreground shadow-sm",
            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          )}
          style={{
            top: `calc(${anchorStartSlot} * var(${slotCssVar}) + 2px)`,
            height: `calc(${spanSlots} * var(${slotCssVar}) - 4px)`,
            left:
              displayColumnCount > 1
                ? `calc(${SCHEDULE_MAX_VISIBLE_LANES - 1} * (100% / ${displayColumnCount}))`
                : "0",
            width: `calc(100% / ${displayColumnCount})`,
          }}
          aria-label={`${count} more concurrent appointment${count === 1 ? "" : "s"}. Open list.`}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="right"
        className="z-200 w-72 p-0"
        collisionPadding={12}
      >
        <div className="border-b border-border/60 px-3 py-2">
          <p className={cn("m-0 font-medium text-foreground", textBody)}>
            Concurrent appointments
          </p>
          <p className={cn("m-0 text-muted-foreground", textMeta)}>
            {count} visit{count === 1 ? "" : "s"} at the same time
          </p>
        </div>
        <ul className="m-0 max-h-60 list-none overflow-y-auto overscroll-contain p-1.5">
          {hiddenBlocks
            .slice()
            .sort(
              (a, b) =>
                a.startSlot - b.startSlot ||
                a.appointment.time.localeCompare(b.appointment.time),
            )
            .map(({ appointment }) => {
              const isSelected = appointment.id === selectedId;
              return (
                <li key={appointment.id} className="p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full min-w-0 flex-col gap-1 rounded-md px-3 py-2.5 text-left text-sm leading-snug transition-colors",
                      "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      isSelected && "bg-muted font-medium",
                    )}
                    onClick={() => {
                      onSelectAppointment(appointment.id);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate font-medium text-foreground">
                      {appointment.patientName}
                    </span>
                    <span className={cn("text-muted-foreground", textMeta)}>
                      {appointment.time}
                      {appointment.reason ? ` · ${appointment.reason}` : ""}
                    </span>
                    <span className={cn("text-muted-foreground", textMeta)}>
                      {formatAppointmentStage(appointment.stage)}
                      {appointmentHasRoom(appointment)
                        ? ` · ${toTitleCaseTagLabel(appointment.room)}`
                        : ""}
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
