"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { MessageSquare, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";

type TransportStatus =
  | "Not Requested"
  | "Scheduled"
  | "En Route"
  | "Arrived";

/** Muted meta lines (missing forms, last attempt, duration copy, etc.). */
const PREVISIT_SECONDARY = "text-xs leading-snug text-muted-foreground";

/** When the row checkbox is checked, secondary lines ease back slightly (title carries “done”). */
const PREVISIT_META_WHEN_ROW_DONE = "opacity-70";

/** Subtle emphasis for inline numerics (duration minutes, med count). */
const PREVISIT_NUM_EMPHASIS = "tabular-nums font-medium text-foreground/80";

function ReadonlyStatusBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="secondary"
      className="h-5 min-h-5 w-fit max-w-full shrink-0 rounded-md border-0 bg-muted px-2 py-0 text-xs font-medium leading-tight text-muted-foreground"
    >
      {label}
    </Badge>
  );
}

function PrevisitRow({
  isFirst,
  isLast,
  checkbox,
  children,
}: {
  isFirst?: boolean;
  isLast?: boolean;
  checkbox: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 py-3",
        isFirst && "pt-0",
        !isLast && "border-b border-border/40",
      )}
    >
      <div className="mt-0.5 shrink-0">{checkbox}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

const previsitItemTitleClass =
  "min-w-0 cursor-pointer break-words text-sm leading-snug text-foreground select-none";

/**
 * With actions: below `lg`, title is on its own row then pills + actions share a row.
 * From `lg` up, the title uses the full width inside `pr-*` (not squeezed beside pills),
 * pills sit on a second row, and actions stay absolutely on the right.
 */
function PrevisitItemHeader({
  titleId,
  title,
  leftExtra,
  actions,
  checked = false,
}: {
  titleId: string;
  title: string;
  leftExtra?: ReactNode;
  actions?: ReactNode;
  checked?: boolean;
}) {
  const titleClass = cn(
    previsitItemTitleClass,
    checked && "text-muted-foreground/50 line-through",
  );
  const extraWrapClass = cn(checked && PREVISIT_META_WHEN_ROW_DONE);

  if (!actions) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <label htmlFor={titleId} className={titleClass}>
          {title}
        </label>
        {leftExtra ? (
          <span className={cn("min-w-0", extraWrapClass)}>{leftExtra}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Below lg: title row, then pills + buttons (reliable on tablet / narrow desktop). */}
      <div className="flex min-w-0 flex-col gap-2 lg:hidden">
        <label htmlFor={titleId} className={titleClass}>
          {title}
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          {leftExtra ? (
            <span className={cn("min-w-0", extraWrapClass)}>{leftExtra}</span>
          ) : null}
          {actions}
        </div>
      </div>

      {/* lg+: title uses full row width inside reserved gutter; pills below; actions absolute. */}
      <div className="relative hidden lg:block">
        <div className="min-w-0 pr-56">
          <label htmlFor={titleId} className={cn(titleClass, "block")}>
            {title}
          </label>
          {leftExtra ? (
            <div
              className={cn(
                "mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
                extraWrapClass,
              )}
            >
              {leftExtra}
            </div>
          ) : null}
        </div>
        <div className="absolute top-1/2 right-0 flex w-auto max-w-[min(22rem,calc(100%-0.5rem))] -translate-y-1/2 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      </div>
    </div>
  );
}

export function PrevisitSection({
  appointment,
  layout,
}: {
  appointment: Appointment;
  layout: "mobile" | "desktop";
}) {
  const baseId = useId();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const [item1Checked, setItem1Checked] = useState(false);
  const [item1Notes, setItem1Notes] = useState("");
  const lastAttemptLabel = "Jan 14, 2026 · 4:12 PM";

  const [item2Checked, setItem2Checked] = useState(false);

  const [item3Checked, setItem3Checked] = useState(false);
  const [transportStatus, setTransportStatus] =
    useState<TransportStatus>("Not Requested");
  const [ridePickerOpen, setRidePickerOpen] = useState(false);
  const etaLabel = "Driver: 4m away";

  const [item4Checked, setItem4Checked] = useState(false);

  const [item5Checked, setItem5Checked] = useState(false);
  const [medNotes, setMedNotes] = useState("");
  const medsOnFile = useMemo(() => {
    const n = parseInt(appointment.id, 10);
    if (Number.isNaN(n)) return 8;
    return 5 + (n % 6) + 3;
  }, [appointment.id]);

  const missingFormsLine = useMemo(() => {
    if (appointment.missingFormNames.length === 0) return null;
    return `Missing: ${appointment.missingFormNames.join(", ")}`;
  }, [appointment.missingFormNames]);

  const sectionClass =
    layout === "mobile"
      ? "block w-full rounded-xl border border-border bg-background px-4 pt-4 pb-2 shadow-sm"
      : "mb-0 block w-full rounded-lg border border-border bg-background px-6 pt-6 pb-4 shadow-sm";

  const inputSm = cn(
    "h-8 text-sm md:text-sm placeholder:text-muted-foreground",
  );

  return (
    <>
      <section
        className={cn("text-sm", sectionClass)}
        aria-labelledby={`${baseId}-title`}
      >
        <h3
          id={`${baseId}-title`}
          className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
        >
          Previsit
        </h3>

        <div className="mt-3 flex flex-col">
          {/* Item 1 */}
          <PrevisitRow
            isFirst
            checkbox={
              <Checkbox
                id={`${baseId}-i1`}
                checked={item1Checked}
                onCheckedChange={(s) => setItem1Checked(s === true)}
              />
            }
          >
            <PrevisitItemHeader
              titleId={`${baseId}-i1`}
              title="Confirm appointment 24 hours in advance"
              checked={item1Checked}
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="shrink-0 gap-1"
                    onClick={() =>
                      showToast(`Calling ${appointment.patientName} (demo).`)
                    }
                  >
                    <Phone className="size-3 shrink-0" aria-hidden />
                    Call
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="shrink-0 gap-1"
                    onClick={() =>
                      showToast(
                        `Message to ${appointment.patientName} (demo).`,
                      )
                    }
                  >
                    <MessageSquare className="size-3 shrink-0" aria-hidden />
                    Message
                  </Button>
                </>
              }
            />
            <p
              className={cn(
                PREVISIT_SECONDARY,
                item1Checked && PREVISIT_META_WHEN_ROW_DONE,
              )}
            >
              Last attempt: {lastAttemptLabel}
            </p>
            <Input
              value={item1Notes}
              onChange={(e) => setItem1Notes(e.target.value)}
              placeholder="Add confirmation note…"
              className={inputSm}
              aria-label="Confirmation note"
            />
          </PrevisitRow>

          {/* Item 2 */}
          <PrevisitRow
            checkbox={
              <Checkbox
                id={`${baseId}-i2`}
                checked={item2Checked}
                onCheckedChange={(s) => setItem2Checked(s === true)}
              />
            }
          >
            <PrevisitItemHeader
              titleId={`${baseId}-i2`}
              title="Encourage completion of forms"
              checked={item2Checked}
              leftExtra={
                <>
                  <ReadonlyStatusBadge
                    label={appointment.formCompletionStatus}
                  />
                  <Badge
                    variant="secondary"
                    className="h-5 min-h-5 rounded-md border-0 bg-muted px-2 py-0 text-xs font-medium tabular-nums leading-tight text-muted-foreground"
                  >
                    {appointment.formsCompleteCount}/
                    {appointment.formsTotalCount} Forms
                  </Badge>
                </>
              }
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="shrink-0"
                  onClick={() => showToast("Form link resent (demo).")}
                >
                  Resend link
                </Button>
              }
            />
            {missingFormsLine ? (
              <p
                className={cn(
                  PREVISIT_SECONDARY,
                  item2Checked && PREVISIT_META_WHEN_ROW_DONE,
                )}
              >
                {missingFormsLine}
              </p>
            ) : null}
          </PrevisitRow>

          {/* Item 3 */}
          <PrevisitRow
            checkbox={
              <Checkbox
                id={`${baseId}-i3`}
                checked={item3Checked}
                onCheckedChange={(s) => setItem3Checked(s === true)}
              />
            }
          >
            <PrevisitItemHeader
              titleId={`${baseId}-i3`}
              title="Schedule transportation if needed"
              checked={item3Checked}
              leftExtra={<ReadonlyStatusBadge label={transportStatus} />}
              actions={
                transportStatus === "Not Requested" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="shrink-0"
                      aria-expanded={ridePickerOpen}
                      onClick={() => setRidePickerOpen((o) => !o)}
                    >
                      Book ride
                    </Button>
                    {ridePickerOpen ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setTransportStatus("Scheduled");
                            setRidePickerOpen(false);
                            showToast("UberX booked (demo).");
                          }}
                        >
                          UberX
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setTransportStatus("Scheduled");
                            setRidePickerOpen(false);
                            showToast("Uber Assist booked (demo).");
                          }}
                        >
                          Uber Assist
                        </Button>
                      </>
                    ) : null}
                  </>
                ) : null
              }
            />
            {transportStatus === "Scheduled" ? (
              <>
                <p
                  className={cn(
                    PREVISIT_SECONDARY,
                    item3Checked && PREVISIT_META_WHEN_ROW_DONE,
                  )}
                >
                  Ride booked.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={() => {
                    setTransportStatus("En Route");
                    showToast("Driver en route (demo).");
                  }}
                >
                  Simulate: driver en route
                </Button>
              </>
            ) : null}
            {transportStatus === "En Route" ? (
              <>
                <p
                  className={cn(
                    PREVISIT_SECONDARY,
                    item3Checked && PREVISIT_META_WHEN_ROW_DONE,
                  )}
                >
                  {etaLabel}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={() => {
                    setTransportStatus("Arrived");
                    showToast("Patient arrived (demo).");
                  }}
                >
                  Simulate: arrived
                </Button>
              </>
            ) : null}
            {transportStatus === "Arrived" ? (
              <p
                className={cn(
                  PREVISIT_SECONDARY,
                  item3Checked && PREVISIT_META_WHEN_ROW_DONE,
                )}
              >
                Patient has arrived.
              </p>
            ) : null}
          </PrevisitRow>

          {/* Item 4 */}
          <PrevisitRow
            checkbox={
              <Checkbox
                id={`${baseId}-i4`}
                checked={item4Checked}
                onCheckedChange={(s) => setItem4Checked(s === true)}
              />
            }
          >
            <PrevisitItemHeader
              titleId={`${baseId}-i4`}
              title="Provide guidance on length of visit"
              checked={item4Checked}
            />
            <p
              className={cn(
                PREVISIT_SECONDARY,
                item4Checked && PREVISIT_META_WHEN_ROW_DONE,
              )}
            >
              Estimated duration:{" "}
              <span className={PREVISIT_NUM_EMPHASIS}>
                {appointment.estimatedDurationMins}
              </span>{" "}
              mins
            </p>
          </PrevisitRow>

          {/* Item 5 */}
          <PrevisitRow
            isLast
            checkbox={
              <Checkbox
                id={`${baseId}-i5`}
                checked={item5Checked}
                onCheckedChange={(s) => setItem5Checked(s === true)}
              />
            }
          >
            <PrevisitItemHeader
              titleId={`${baseId}-i5`}
              title="Ask them to bring their medications in"
              checked={item5Checked}
            />
            <p
              className={cn(
                PREVISIT_SECONDARY,
                item5Checked && PREVISIT_META_WHEN_ROW_DONE,
              )}
            >
              <span className={PREVISIT_NUM_EMPHASIS}>{medsOnFile}</span> meds on
              file
            </p>
            <Input
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              placeholder="Notes on meds/barriers…"
              className={inputSm}
              aria-label="Medication notes"
            />
          </PrevisitRow>
        </div>
      </section>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-200 max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-2 text-center text-sm text-foreground shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
