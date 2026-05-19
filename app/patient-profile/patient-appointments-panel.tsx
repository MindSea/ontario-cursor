"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parse } from "date-fns";
import { ChevronLeft } from "lucide-react";

import { AmbientListenProvider } from "@/app/clinic-flow/ambient-listen-context";
import { useAppointmentsStore } from "@/app/clinic-flow/appointments-store";
import { CareManagementSection } from "@/app/clinic-flow/care-management-section";
import { IntakeSection } from "@/app/clinic-flow/intake-section";
import { LabsSection } from "@/app/clinic-flow/labs-section";
import { PrevisitSection } from "@/app/clinic-flow/previsit-section";
import { RoomingSection } from "@/app/clinic-flow/rooming-section";
import { VisitSection } from "@/app/clinic-flow/visit-section";
import { WorkspaceHuddleCard } from "@/app/clinic-flow/workspace-huddle-card";
import { WrapUpSection } from "@/app/clinic-flow/wrap-up-section";
import { WorkspaceSectionsProvider } from "@/app/clinic-flow/workspace-section-collapse-context";
import {
  ROOM_NONE,
  WORKSPACE_ROOM_OPTIONS_CONCRETE,
} from "@/app/clinic-flow/room-options";
import {
  APPOINTMENT_STAGE_ORDER,
  formatAppointmentStage,
} from "@/app/clinic-flow/stage-display";
import type { Appointment, AppointmentStage } from "@/app/clinic-flow/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { appointmentSortKey } from "./patient-profile-demo-data";
import { appointmentsForPatient } from "./queries";

/**
 * In-profile Appointments UI. Master/detail split that mirrors the
 * Conversations panel:
 *   - Left column: scrolling list of appointments for this patient.
 *   - Right column: detail header (date/time/reason + stage/room) +
 *     the eight workspace section components inside an
 *     AmbientListenProvider keyed by appointment id.
 *
 * Reads from / writes to `useAppointmentsStore` so stage and room
 * changes made here are visible inside the clinic-flow workspace, and
 * vice versa. Internal section state (huddle checks, previsit notes,
 * etc.) remains local to each section instance — that's already how
 * clinic-flow models it.
 *
 * Only UI state (selected appointment id, mobile two-pane state) is
 * kept local. The parent (`PatientProfileView`) keeps this component
 * mounted across tab switches so the selected visit + mobile pane
 * survive the switch.
 */
export type PatientAppointmentsPanelProps = {
  patientId: string;
};

export function PatientAppointmentsPanel({
  patientId,
}: PatientAppointmentsPanelProps) {
  const store = useAppointmentsStore();

  /* Filtered + sorted view of the store, scoped to this patient. The
   * store changes whenever stage/room are edited (here or in clinic-
   * flow), so this memo refreshes immediately on either side. */
  const appointments = useMemo(() => {
    return [...appointmentsForPatient(store.appointments, patientId)].sort(
      (a, b) => appointmentSortKey(b) - appointmentSortKey(a),
    );
  }, [store.appointments, patientId]);

  /* Derived-active pattern (same as messaging): `selectedId` is intent,
   * `activeId` is what we render. Falling back inside `useMemo` instead
   * of a `useEffect` avoids a cascading render when the selected visit
   * is filtered out or the patient changes. */
  const [selectedId, setSelectedId] = useState<string | null>(
    () => appointments[0]?.id ?? null,
  );
  const activeId = useMemo<string | null>(() => {
    if (selectedId && appointments.some((a) => a.id === selectedId)) {
      return selectedId;
    }
    return appointments[0]?.id ?? null;
  }, [selectedId, appointments]);

  const activeAppointment = useMemo(
    () => appointments.find((a) => a.id === activeId) ?? null,
    [appointments, activeId],
  );

  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const selectAppointment = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!isMd) setMobileShowDetail(true);
    },
    [isMd],
  );

  return (
    /* Outer wrapper mirrors /messaging's body padding (and the
     * Conversations panel): full-bleed on mobile with a 4px top
     * breathing slice; capped at max-w-6xl on desktop. */
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-1 flex-col",
        "max-md:px-0 max-md:pt-1 max-md:pb-3",
        "md:mx-auto md:max-w-6xl md:px-8 md:py-4",
      )}
    >
      {appointments.length === 0 ? (
        <div className="p-4 md:p-6">
          <p className={cn("m-0 text-muted-foreground", textMeta)}>
            No appointments for this patient in the rolling demo schedule.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden md:flex-row",
            "max-md:rounded-none max-md:border-0",
            "md:rounded-lg md:border md:border-border/60",
          )}
        >
          {/* List column — same 22rem basis as the messaging inbox so
           * the detail column lands at the same width across both
           * patient-profile tabs. */}
          <div
            className={cn(
              "flex min-h-0 w-full min-w-0 flex-col overflow-hidden md:shrink-0 md:grow-0 md:basis-[min(100%,22rem)] md:max-w-[min(100%,22rem)]",
              !isMd && mobileShowDetail && "hidden",
            )}
          >
            <AppointmentsListColumn
              appointments={appointments}
              activeId={activeId}
              onSelect={selectAppointment}
            />
          </div>

          {/* Detail column. Keyed by activeId so AmbientListenProvider
           * resets per-appointment + each section's local state remounts
           * with the new appointment id. */}
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:min-w-0",
              !isMd && !mobileShowDetail && "hidden",
              isMd && "border-border/60 md:border-l",
            )}
          >
            <AppointmentDetail
              key={activeAppointment?.id ?? "none"}
              appointment={activeAppointment}
              isMobile={!isMd}
              showMobileBack={!isMd && mobileShowDetail}
              onMobileBack={() => setMobileShowDetail(false)}
              onUpdateAppointment={store.updateAppointment}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List column                                                         */
/* ------------------------------------------------------------------ */

type AppointmentsListColumnProps = {
  appointments: readonly Appointment[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

function AppointmentsListColumn({
  appointments,
  activeId,
  onSelect,
}: AppointmentsListColumnProps) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="m-0 list-none p-0">
          {appointments.map((apt) => {
            const isActive = apt.id === activeId;
            return (
              <li
                key={apt.id}
                className="border-b border-border/40 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onSelect(apt.id)}
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-0.5 px-3 py-3 text-left transition-colors md:px-4",
                    isActive
                      ? "bg-muted/80"
                      : "hover:bg-muted/45 active:bg-muted/55",
                  )}
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        "font-medium tabular-nums text-foreground",
                        textBody,
                      )}
                    >
                      {formatListDate(apt.date)}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums text-muted-foreground",
                        textMeta,
                      )}
                    >
                      {apt.time}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "line-clamp-2 wrap-break-word text-foreground",
                      textBody,
                    )}
                  >
                    {apt.reason}
                  </span>
                  {/* Stage as plain text, per spec. */}
                  <span className={cn("text-muted-foreground", textMeta)}>
                    {formatAppointmentStage(apt.stage)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail column                                                       */
/* ------------------------------------------------------------------ */

type AppointmentDetailProps = {
  appointment: Appointment | null;
  isMobile: boolean;
  showMobileBack: boolean;
  onMobileBack: () => void;
  onUpdateAppointment: (id: string, patch: Partial<Appointment>) => void;
};

function AppointmentDetail({
  appointment,
  isMobile,
  showMobileBack,
  onMobileBack,
  onUpdateAppointment,
}: AppointmentDetailProps) {
  const workspaceScrollRef = useRef<HTMLDivElement>(null);

  if (!appointment) {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-12 text-center text-muted-foreground md:px-4">
        <p className={cn("m-0 max-w-sm", textMeta)}>
          Choose an appointment from the list.
        </p>
      </div>
    );
  }

  const day = parse(appointment.date, "yyyy-MM-dd", new Date());
  const dateLabel = format(day, "MMM d, yyyy");
  const sectionLayout = isMobile ? "mobile" : "desktop";

  /* Build the workspace sections in the same order as
   * clinic-flow-desktop.tsx so this is a faithful 1:1 of the workspace
   * body. Each section is keyed by `${appointment.id}-...` so when the
   * user switches visits the section state resets, matching the
   * workspace behavior. */
  const sections = (
    <>
      <WorkspaceHuddleCard
        key={`${appointment.id}-huddle`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <PrevisitSection
        key={`${appointment.id}-previsit`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <IntakeSection
        key={`${appointment.id}-intake`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <RoomingSection
        key={`${appointment.id}-rooming`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <VisitSection
        key={`${appointment.id}-visit`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <LabsSection
        key={`${appointment.id}-labs`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <CareManagementSection
        key={`${appointment.id}-care`}
        appointment={appointment}
        layout={sectionLayout}
      />
      <WrapUpSection
        key={`${appointment.id}-wrap`}
        appointment={appointment}
        layout={sectionLayout}
      />
    </>
  );

  return (
    /* AmbientListenProvider keyed by appointment id (the outer parent
     * is also keyed) — required because WorkspaceHuddleCard reads from
     * the ambient-listen context. Resetting per visit keeps the demo
     * controls fresh for each appointment. */
    <AmbientListenProvider key={appointment.id}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        {/* Pinned 2-row header (same layout on mobile + desktop).
         *
         * Row 1: chevron (mobile only) + `Date · Time · Reason` text.
         * Row 2: Stage + Room selectors, left-aligned.
         *
         * Why two rows everywhere: the reason gets long ("Post-Hospital
         * Follow-up (CHF Exacerbation)") and shared-row truncation
         * with the selectors clipped useful context off the title. The
         * appointments list column has no top header bar, so making
         * the detail header taller costs no cross-column alignment.
         *
         * Mechanically: a single `flex-wrap` row with `gap-y-2` between
         * wrapped rows. The selectors block is `basis-full`, which
         * forces it to wrap below the title regardless of viewport.
         * The title block is `flex-1 min-w-0` so it absorbs the row's
         * available width and truncates only if a narrow viewport
         * leaves no choice. */}
        <div
          className={cn(
            /* `items-start` (rather than `items-center`) so the back
             * chevron stays anchored to the top of the wrapped title
             * block — i.e. next to the date line, not vertically
             * centered between the date line and the wrapped reason
             * line. In single-line cases (desktop, short reasons) the
             * chevron isn't rendered, so the change is mobile-only in
             * practice. */
            "flex w-full shrink-0 flex-wrap items-start gap-x-2 gap-y-2 border-b border-border/60 bg-background",
            "max-md:px-3 max-md:py-2",
            "md:px-4 md:py-2",
            textBody,
          )}
        >
          {showMobileBack ? (
            /* `mt-[-7px]` aligns the chevron's icon center with the
             * first text line of the title (not the centerline of the
             * whole 36px button, which sits 7px below the first text
             * line center).
             *
             * Derivation: chevron button is `size-9` (36px) with a
             * `size-5` (20px) icon centered, so the icon center is
             * 18px down from the button's top edge. The title's first
             * text line center is ~11px down from its top edge
             * (text-base + leading-snug → ~22px line-height). With
             * `items-start` on the outer flex both items top-align at
             * y=0; shifting the chevron container up by 18-11 = 7px
             * makes the icon center coincide with the first text line
             * center. The 7px of upward overflow lives inside the
             * wrapper's `py-2` (8px), so it doesn't escape the box. */
            <div className="mt-[-7px] flex w-9 shrink-0 items-center justify-center md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-lg"
                aria-label="Back to appointments list"
                onClick={onMobileBack}
              >
                <ChevronLeft className="size-5 text-foreground" aria-hidden />
              </Button>
            </div>
          ) : null}
          <DetailTitleText
            dateLabel={dateLabel}
            time={appointment.time}
            reason={appointment.reason}
          />
          {/* `basis-full` forces this row onto its own line below the
           * title — the inner flex laying out Stage + Room is then
           * naturally left-aligned (no `justify-*` needed).
           *
           * `max-md:pl-11` (44px = chevron w-9 + gap-x-2) on the
           * mobile path indents the selectors to start at the same x
           * as the date text above (which is preceded by the
           * back-chevron's 36px slot + 8px gap). Gated on
           * `showMobileBack` so the indent only applies when the
           * chevron is actually present. Desktop has no chevron, so
           * no indent and selectors stay at container-left. */}
          <div
            className={cn(
              "flex w-full shrink-0 basis-full items-center gap-2",
              showMobileBack && "max-md:pl-11",
            )}
          >
            <StageSelect
              value={appointment.stage}
              onChange={(stage) =>
                onUpdateAppointment(appointment.id, { stage })
              }
            />
            <RoomSelect
              value={appointment.room}
              onChange={(room) => onUpdateAppointment(appointment.id, { room })}
            />
          </div>
        </div>

        {/* Scrolling sections body. Matches the workspace's `max-w-6xl
         * + px-8` body so the section cards have the same widths as
         * /clinic-flow. */}
        <div
          ref={workspaceScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-8 md:py-6">
            <WorkspaceSectionsProvider
              appointmentId={appointment.id}
              stage={appointment.stage}
              scrollContainerRef={workspaceScrollRef}
            >
              <div className="flex flex-col gap-4 md:gap-6">{sections}</div>
            </WorkspaceSectionsProvider>
          </div>
        </div>
      </div>
    </AmbientListenProvider>
  );
}

function DetailTitleText({
  dateLabel,
  time,
  reason,
}: {
  dateLabel: string;
  time: string;
  reason: string;
}) {
  /* Plain inline-text title (not a flex row). Each piece is a regular
   * `<span>`, so the reason wraps at word boundaries when the row runs
   * out of room — date and time are `whitespace-nowrap` so they never
   * break mid-value.
   *
   * Why not flex+truncate: a flex row's `flex-1 min-w-0 truncate`
   * reason ellipsizes on narrow viewports ("Follow-up (..."), which
   * hides useful information. Letting it wrap costs at most one extra
   * line on small screens and keeps the full reason readable; on
   * desktop nothing wraps and the layout is identical. */
  return (
    <p className="m-0 min-w-0 flex-1 leading-snug">
      <span className="font-medium whitespace-nowrap tabular-nums text-foreground">
        {dateLabel}
      </span>
      <span aria-hidden className="text-muted-foreground/60">
        {" · "}
      </span>
      <span className="whitespace-nowrap tabular-nums text-muted-foreground">
        {time}
      </span>
      <span aria-hidden className="text-muted-foreground/60">
        {" · "}
      </span>
      <span className="text-muted-foreground">{reason}</span>
    </p>
  );
}

function StageSelect({
  value,
  onChange,
}: {
  value: AppointmentStage;
  onChange: (stage: AppointmentStage) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AppointmentStage)}>
      <SelectTrigger
        size="sm"
        aria-label="Stage"
        className="h-8 w-auto min-w-34"
      >
        <SelectValue placeholder="Stage" />
      </SelectTrigger>
      {/* `z-1000` matches the workspace pinned header selectors so the
       * popover stacks above the patient profile dialog (`z-116`). */}
      <SelectContent className="z-1000">
        {APPOINTMENT_STAGE_ORDER.map((stageValue) => (
          <SelectItem key={stageValue} value={stageValue}>
            {formatAppointmentStage(stageValue)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RoomSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (room: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label="Room"
        className="h-8 w-auto min-w-24"
      >
        <SelectValue placeholder="Room" />
      </SelectTrigger>
      <SelectContent className="z-1000">
        {/* Concrete rooms first, then a visual divider, then `NONE`.
         * The divider makes "no room assigned" read as a distinct
         * choice rather than a 7th room in the list. Mirrors the
         * workspace pinned header's Room selector. */}
        {WORKSPACE_ROOM_OPTIONS_CONCRETE.map((room) => (
          <SelectItem key={room} value={room}>
            {room}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={ROOM_NONE}>{ROOM_NONE}</SelectItem>
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatListDate(dateKey: string): string {
  const day = parse(dateKey, "yyyy-MM-dd", new Date());
  return format(day, "MMM d, yyyy");
}
