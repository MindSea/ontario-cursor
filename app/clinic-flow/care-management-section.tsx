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
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { ChecklistLabelActionRow } from "./checklist-label-action-row";
import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import type { Appointment } from "./types";

const CARE_MANAGEMENT_CHECKBOX_TOTAL = 3;

function CareMgmtRow({
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

export function CareManagementSection({
  appointment,
  layout,
}: {
  appointment: Appointment;
  layout: "mobile" | "desktop";
}) {
  const baseId = useId();

  const sectionClass =
    layout === "mobile"
      ? "block w-full rounded-xl border border-border bg-background px-4 pt-4 pb-2 shadow-sm"
      : "mb-0 block w-full rounded-lg border border-border bg-background px-6 pt-6 pb-4 shadow-sm";

  const [reviewFollowUp, setReviewFollowUp] = useState(false);
  const [scheduleNext, setScheduleNext] = useState(false);
  const [reviewPlanAvs, setReviewPlanAvs] = useState(false);

  const [careCollapsed, setCareCollapsed] = useState(false);
  const [careUncheckOpen, setCareUncheckOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    queueMicrotask(() => {
      setReviewFollowUp(false);
      setScheduleNext(false);
      setReviewPlanAvs(false);
      setCareCollapsed(false);
      setCareUncheckOpen(false);
    });
  }, [appointment.id]);

  const careCheckedCount = useMemo(
    () =>
      [reviewFollowUp, scheduleNext, reviewPlanAvs].filter(Boolean).length,
    [reviewFollowUp, scheduleNext, reviewPlanAvs],
  );

  const allCareChecked = careCheckedCount === CARE_MANAGEMENT_CHECKBOX_TOTAL;

  const checkAllCare = useCallback(() => {
    setReviewFollowUp(true);
    setScheduleNext(true);
    setReviewPlanAvs(true);
  }, []);

  const uncheckAllCare = useCallback(() => {
    setReviewFollowUp(false);
    setScheduleNext(false);
    setReviewPlanAvs(false);
    setCareUncheckOpen(false);
  }, []);

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
            <span>Care Management</span>
            <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
              {careCheckedCount}/{CARE_MANAGEMENT_CHECKBOX_TOTAL}
            </span>
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {!careCollapsed ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="shrink-0"
                onClick={() =>
                  allCareChecked ? setCareUncheckOpen(true) : checkAllCare()
                }
              >
                {allCareChecked ? "Uncheck All" : "Check All"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
              aria-expanded={!careCollapsed}
              aria-controls={`${baseId}-care-content`}
              aria-label={
                careCollapsed
                  ? "Expand Care Management section"
                  : "Collapse Care Management section"
              }
              onClick={() => setCareCollapsed((c) => !c)}
            >
              {careCollapsed ? (
                <ChevronDown className="size-4" aria-hidden />
              ) : (
                <ChevronUp className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <div
          id={`${baseId}-care-content`}
          hidden={careCollapsed}
          className={cn(!careCollapsed && "mt-3 flex flex-col")}
        >
          <CareMgmtRow
            isFirst
            checkbox={
              <Checkbox
                id={`${baseId}-followup`}
                checked={reviewFollowUp}
                onCheckedChange={(s) => setReviewFollowUp(s === true)}
              />
            }
          >
            <label
              htmlFor={`${baseId}-followup`}
              className={cn(
                "min-w-0 cursor-pointer wrap-break-word select-none",
                textBody,
                reviewFollowUp && "text-muted-foreground/50 line-through",
              )}
            >
              Review items and create follow-up plan
            </label>
          </CareMgmtRow>

          <CareMgmtRow
            checkbox={
              <Checkbox
                id={`${baseId}-schedule`}
                checked={scheduleNext}
                onCheckedChange={(s) => setScheduleNext(s === true)}
              />
            }
          >
            <div className="flex min-w-0 flex-col gap-2">
              <ChecklistLabelActionRow
                labelId={`${baseId}-schedule`}
                checked={scheduleNext}
                actionsWhenCheckedClassName={CHECKLIST_META_WHEN_ROW_DONE}
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    onClick={() =>
                      showToast(
                        "Scheduling will be available in a later release (demo).",
                      )
                    }
                  >
                    Start booking
                  </Button>
                }
              >
                Schedule next appointment at TSH
              </ChecklistLabelActionRow>
              <p
                className={cn(
                  textMeta,
                  scheduleNext && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                {appointment.careManagement.recommendedCadence}
              </p>
            </div>
          </CareMgmtRow>

          <CareMgmtRow
            isLast
            checkbox={
              <Checkbox
                id={`${baseId}-avs`}
                checked={reviewPlanAvs}
                onCheckedChange={(s) => setReviewPlanAvs(s === true)}
              />
            }
          >
            <label
              htmlFor={`${baseId}-avs`}
              className={cn(
                "min-w-0 cursor-pointer wrap-break-word select-none",
                textBody,
                reviewPlanAvs && "text-muted-foreground/50 line-through",
              )}
            >
              Review plan of care/AVS with patient
            </label>
          </CareMgmtRow>
        </div>

        <Dialog open={careUncheckOpen} onOpenChange={setCareUncheckOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Uncheck all Care Management items?</DialogTitle>
              <DialogDescription>
                This clears every checklist checkbox in this section for this visit
                (demo only).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCareUncheckOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={uncheckAllCare}>
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
