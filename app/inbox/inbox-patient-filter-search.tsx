"use client";

import { Search, X } from "lucide-react";

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
  const fieldHeight = compact ? "h-8" : "h-9";

  return (
    <div
      className={cn(
        "relative",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : "w-full min-w-0 max-w-sm shrink-0 md:max-w-md lg:max-w-lg",
        className,
      )}
    >
      <div className={cn("relative", fieldHeight)}>
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 text-muted-foreground",
            compact ? "size-3.5" : "size-4",
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
            "h-full w-full text-sm",
            compact ? "pl-8" : "pl-9",
            showClear && "pr-9",
          )}
          autoComplete="off"
        />
        {showClear ? (
          <button
            type="button"
            className={cn(
              "absolute inset-y-0 right-0 z-10 flex w-9 items-center justify-center rounded-md text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              !hasText && "pointer-events-none invisible",
            )}
            aria-label="Clear patient search"
            tabIndex={hasText ? 0 : -1}
            onClick={() => onChange("")}
          >
            <X className="size-4 shrink-0" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
