"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InboxPatientFilterSearchProps = {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
  /** Matches {@link SchedulePatientSearch}: default vs compact header height. */
  size?: "default" | "compact";
  fullWidth?: boolean;
  className?: string;
  /** When set, shows a clear (X) control when `value` is non-empty. */
  showClear?: boolean;
};

/**
 * Patient-name filter field styled like `SchedulePatientSearch`, without
 * appointment suggestions — filtering semantics stay with the parent.
 */
export function InboxPatientFilterSearch({
  idPrefix,
  value,
  onChange,
  size = "default",
  fullWidth = false,
  className,
  showClear = true,
}: InboxPatientFilterSearchProps) {
  const compact = size === "compact";
  const hasText = value.trim().length > 0;

  return (
    <div
      className={cn(
        "relative",
        compact ? "min-h-8" : "min-h-9",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : "w-full min-w-0 max-w-sm shrink-0 md:max-w-md lg:max-w-lg",
        className,
      )}
    >
      <div className="relative">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground",
            compact ? "left-2 size-3.5" : "left-2.5 size-4",
          )}
          aria-hidden
        />
        <Input
          id={`${idPrefix}-patient-filter`}
          aria-label="Search by patient name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by patient name…"
          className={cn(
            "text-sm",
            fullWidth && "text-base",
            compact ? "h-8 pl-8" : "h-9 pl-9",
            showClear && hasText && "pr-9",
          )}
          autoComplete="off"
        />
        {showClear && hasText ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-0.5 z-10 size-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear patient search"
            onClick={() => onChange("")}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
