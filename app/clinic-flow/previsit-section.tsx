"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NotesTextarea } from "@/components/ui/notes-textarea";
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { MutedTagBadge } from "./muted-tag-badge";
import type { Appointment } from "./types";

type TransportStatus =
  | "Not Requested"
  | "Scheduled"
  | "En Route"
  | "Arrived";

/** Interactive checklist rows (checkboxes only). */
const PREVISIT_CHECKBOX_TOTAL = 5;

/** When the row checkbox is checked, secondary lines ease back slightly (title carries “done”). */
const PREVISIT_META_WHEN_ROW_DONE = "opacity-70";

/** Subtle emphasis for inline numerics (duration minutes, med count). */
const PREVISIT_NUM_EMPHASIS = "tabular-nums font-medium text-foreground/80";

function ReadonlyStatusBadge({ label }: { label: string }) {
  return <MutedTagBadge className="max-w-full">{label}</MutedTagBadge>;
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

const previsitItemTitleClass = cn(
  "min-w-0 cursor-pointer break-words select-none",
  textBody,
);

/**
 * With actions: title stays `w-fit` beside a cluster of tags + buttons. The cluster uses
 * `items-center` so badges line up with taller outline buttons; below `lg` the cluster
 * wraps with the title. From `lg` up, actions are absolute on the right; `pr-56` reserves space.
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

  /** Width follows content so tags sit next to the title; min-w-0 still allows wrapping when tight. */
  const titleClusterWidth = "w-fit min-w-0 max-w-full";

  if (!actions) {
    return (
      <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
        <label
          htmlFor={titleId}
          className={cn(titleClass, leftExtra ? titleClusterWidth : null)}
        >
          {title}
        </label>
        {leftExtra ? (
          <span
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-2",
              extraWrapClass,
            )}
          >
            {leftExtra}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative min-w-0 lg:pr-56">
      <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-2">
        <label htmlFor={titleId} className={cn(titleClass, titleClusterWidth)}>
          {title}
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
          {leftExtra ? (
            <span
              className={cn(
                "flex shrink-0 flex-wrap items-center gap-2",
                extraWrapClass,
              )}
            >
              {leftExtra}
            </span>
          ) : null}
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center justify-start gap-2",
              "lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2 lg:justify-end",
              "lg:max-w-[min(22rem,calc(100%-0.5rem))]",
            )}
          >
            {actions}
          </div>
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
  const [previsitCollapsed, setPrevisitCollapsed] = useState(false);
  const [previsitUncheckOpen, setPrevisitUncheckOpen] = useState(false);

  const previsitCheckedCount = useMemo(
    () =>
      [
        item1Checked,
        item2Checked,
        item3Checked,
        item4Checked,
        item5Checked,
      ].filter(Boolean).length,
    [
      item1Checked,
      item2Checked,
      item3Checked,
      item4Checked,
      item5Checked,
    ],
  );

  const checkAllPrevisit = useCallback(() => {
    setItem1Checked(true);
    setItem2Checked(true);
    setItem3Checked(true);
    setItem4Checked(true);
    setItem5Checked(true);
  }, []);

  const uncheckAllPrevisit = useCallback(() => {
    setItem1Checked(false);
    setItem2Checked(false);
    setItem3Checked(false);
    setItem4Checked(false);
    setItem5Checked(false);
    setPrevisitUncheckOpen(false);
  }, []);

  const allPrevisitChecked = previsitCheckedCount === PREVISIT_CHECKBOX_TOTAL;

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

  const inputSm = cn("h-8 placeholder:text-muted-foreground", textBody);

  return (
    <div className="min-w-0 w-full">
      <section
        className={cn(textBody, sectionClass)}
        aria-labelledby={`${baseId}-title`}
      >
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h3
            id={`${baseId}-title`}
            className={cn(
              textOverline,
              "flex min-w-0 flex-nowrap items-baseline gap-x-2",
            )}
          >
            <span>Previsit</span>
            <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
              {previsitCheckedCount}/{PREVISIT_CHECKBOX_TOTAL}
            </span>
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {!previsitCollapsed ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="shrink-0"
                onClick={() =>
                  allPrevisitChecked
                    ? setPrevisitUncheckOpen(true)
                    : checkAllPrevisit()
                }
              >
                {allPrevisitChecked ? "Uncheck All" : "Check All"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
              aria-expanded={!previsitCollapsed}
              aria-controls={`${baseId}-previsit-content`}
              aria-label={
                previsitCollapsed
                  ? "Expand Previsit section"
                  : "Collapse Previsit section"
              }
              onClick={() => setPrevisitCollapsed((c) => !c)}
            >
              {previsitCollapsed ? (
                <ChevronDown className="size-4" aria-hidden />
              ) : (
                <ChevronUp className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <div
          id={`${baseId}-previsit-content`}
          hidden={previsitCollapsed}
          className={cn(!previsitCollapsed && "mt-3 flex flex-col")}
        >
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
            />
            <p
              className={cn(
                textMeta,
                item1Checked && PREVISIT_META_WHEN_ROW_DONE,
              )}
            >
              Last attempt: {lastAttemptLabel}
            </p>
            <NotesTextarea
              value={item1Notes}
              onChange={(e) => setItem1Notes(e.target.value)}
              placeholder="Add confirmation note…"
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
                  <MutedTagBadge className="tabular-nums">
                    {appointment.formsCompleteCount}/
                    {appointment.formsTotalCount} Forms
                  </MutedTagBadge>
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
                  textMeta,
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
                    textMeta,
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
                    textMeta,
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
                  textMeta,
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
                textMeta,
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
                textMeta,
                item5Checked && PREVISIT_META_WHEN_ROW_DONE,
              )}
            >
              <span className={PREVISIT_NUM_EMPHASIS}>{medsOnFile}</span> meds on
              file
            </p>
            <NotesTextarea
              value={medNotes}
              onChange={(e) => setMedNotes(e.target.value)}
              placeholder="Notes on meds/barriers…"
              aria-label="Medication notes"
            />
          </PrevisitRow>
        </div>

        <Dialog open={previsitUncheckOpen} onOpenChange={setPrevisitUncheckOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Uncheck all previsit items?</DialogTitle>
              <DialogDescription>
                This clears every checklist checkbox in this section for this
                visit (demo only).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrevisitUncheckOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={uncheckAllPrevisit}
              >
                Uncheck all
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-6 left-1/2 z-200 max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
            textBody,
          )}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
