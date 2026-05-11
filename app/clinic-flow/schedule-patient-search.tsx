"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";
import { filterAppointmentsByPatientNameSubstring } from "./patient-search-match";
import { appointmentInBuilding } from "./schedule-building-filter";

function formatDobForList(isoDob: string): string {
  try {
    return format(parseISO(isoDob), "MMM d, yyyy");
  } catch {
    return isoDob;
  }
}

const PATIENT_SEARCH_DEBOUNCE_MS = 200;

export type SchedulePatientSearchProps = {
  idPrefix: string;
  allAppointments: readonly Appointment[];
  patientSearchQuery: string;
  onPatientSearchQueryChange: (v: string) => void;
  onNavigateToAppointment: (appointment: Appointment) => void;
  /** When false, use constrained max-width (toolbar default layout). */
  fullWidth?: boolean;
  /** Merged onto the outer wrapper (e.g. header width). */
  className?: string;
  /** After a suggestion is chosen (clear query, navigate); e.g. close sheets. */
  onAfterPick?: () => void;
  /** Shorter control (e.g. desktop header next to schedule toggle). */
  size?: "default" | "compact";
};

export function SchedulePatientSearch({
  idPrefix,
  allAppointments,
  patientSearchQuery,
  onPatientSearchQueryChange,
  onNavigateToAppointment,
  fullWidth = false,
  className,
  onAfterPick,
  size = "default",
}: SchedulePatientSearchProps) {
  const compact = size === "compact";
  const listboxId = `${idPrefix}-patient-listbox`;
  const comboRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(patientSearchQuery.trim());
    }, PATIENT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [patientSearchQuery]);

  useEffect(() => {
    if (patientSearchQuery.trim()) return;
    queueMicrotask(() => setPanelOpen(false));
  }, [patientSearchQuery]);

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = comboRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [panelOpen]);

  const nameMatches = useMemo(() => {
    const raw = filterAppointmentsByPatientNameSubstring(
      allAppointments,
      debouncedQuery,
    );
    return [...raw].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      const t = a.time.localeCompare(b.time, undefined, { numeric: true });
      if (t !== 0) return t;
      return a.id.localeCompare(b.id);
    });
  }, [allAppointments, debouncedQuery]);

  const showSuggestions = panelOpen && debouncedQuery.length >= 2;

  const pickAppointment = useCallback(
    (apt: Appointment) => {
      onPatientSearchQueryChange("");
      setPanelOpen(false);
      onAfterPick?.();
      onNavigateToAppointment(apt);
    },
    [onAfterPick, onNavigateToAppointment, onPatientSearchQueryChange],
  );

  return (
    <div
      ref={comboRef}
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
          id={`${idPrefix}-patient-search`}
          role="combobox"
          aria-label="Patient search"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={patientSearchQuery}
          onChange={(e) => {
            onPatientSearchQueryChange(e.target.value);
            setPanelOpen(true);
          }}
          onFocus={() => setPanelOpen(true)}
          placeholder="Search by patient name…"
          className={cn(
            "text-sm",
            compact ? "h-8 pl-8" : "h-9 pl-9",
          )}
          autoComplete="off"
        />
      </div>
      {showSuggestions ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute top-full right-0 left-0 z-100 mt-1 max-h-60 min-w-0 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover py-1 text-sm leading-snug text-popover-foreground shadow-md",
          )}
        >
          {nameMatches.length === 0 ? (
            <li
              role="presentation"
              className={cn("px-3 py-2", textMeta, "text-muted-foreground")}
            >
              No matching patients
            </li>
          ) : (
            nameMatches.map((apt) => (
              <li key={apt.id} role="presentation" className="min-w-0">
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-0.5 px-3 py-2 text-left text-sm leading-snug hover:bg-muted",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickAppointment(apt)}
                >
                  <span className="font-medium text-foreground">
                    {apt.patientName}
                  </span>
                  <span className={cn(textMeta, "text-muted-foreground")}>
                    DOB {formatDobForList(apt.dateOfBirth)}
                  </span>
                  <span className={cn(textMeta, "line-clamp-2 text-muted-foreground")}>
                    {format(parseISO(apt.date), "EEE MMM d")} · {apt.time} ·{" "}
                    {apt.reason}
                  </span>
                  <span className="text-sm leading-snug text-muted-foreground">
                    {appointmentInBuilding(apt.stage)
                      ? "In building"
                      : "Not in building"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
