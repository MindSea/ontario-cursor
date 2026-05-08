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

import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import { MutedTagBadge } from "./muted-tag-badge";
import type { Appointment } from "./types";

const VISIT_CHECKBOX_TOTAL = 4;

function VisitRow({
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

export function VisitSection({
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

  const [handOffPcp, setHandOffPcp] = useState(false);
  const [reenterRoom, setReenterRoom] = useState(false);
  const [returnAfterPcp, setReturnAfterPcp] = useState(false);
  const [suppliesDone, setSuppliesDone] = useState(false);

  const [visitCollapsed, setVisitCollapsed] = useState(false);
  const [visitUncheckOpen, setVisitUncheckOpen] = useState(false);

  const supplyLines = appointment.visit.supplyReferenceLines;

  useEffect(() => {
    queueMicrotask(() => {
      setHandOffPcp(false);
      setReenterRoom(false);
      setReturnAfterPcp(false);
      setSuppliesDone(false);
      setVisitCollapsed(false);
      setVisitUncheckOpen(false);
    });
  }, [appointment.id]);

  const visitCheckedCount = useMemo(
    () =>
      [handOffPcp, reenterRoom, returnAfterPcp, suppliesDone].filter(Boolean)
        .length,
    [handOffPcp, reenterRoom, returnAfterPcp, suppliesDone],
  );

  const checkAllVisit = useCallback(() => {
    setHandOffPcp(true);
    setReenterRoom(true);
    setReturnAfterPcp(true);
    setSuppliesDone(true);
  }, []);

  const uncheckAllVisit = useCallback(() => {
    setHandOffPcp(false);
    setReenterRoom(false);
    setReturnAfterPcp(false);
    setSuppliesDone(false);
    setVisitUncheckOpen(false);
  }, []);

  const allVisitChecked = visitCheckedCount === VISIT_CHECKBOX_TOTAL;

  return (
    <section className={cn(textBody, sectionClass)} aria-labelledby={`${baseId}-title`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3
          id={`${baseId}-title`}
          className={cn(
            textOverline,
            "flex min-w-0 flex-nowrap items-baseline gap-x-2",
          )}
        >
          <span>Visit</span>
          <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
            {visitCheckedCount}/{VISIT_CHECKBOX_TOTAL}
          </span>
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {!visitCollapsed ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="shrink-0"
              onClick={() =>
                allVisitChecked ? setVisitUncheckOpen(true) : checkAllVisit()
              }
            >
              {allVisitChecked ? "Uncheck All" : "Check All"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
            aria-expanded={!visitCollapsed}
            aria-controls={`${baseId}-visit-content`}
            aria-label={
              visitCollapsed ? "Expand Visit section" : "Collapse Visit section"
            }
            onClick={() => setVisitCollapsed((c) => !c)}
          >
            {visitCollapsed ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div
        id={`${baseId}-visit-content`}
        hidden={visitCollapsed}
        className={cn(!visitCollapsed && "mt-3 flex flex-col")}
      >
        <VisitRow
          isFirst
          checkbox={
            <Checkbox
              id={`${baseId}-handoff`}
              checked={handOffPcp}
              onCheckedChange={(s) => setHandOffPcp(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-handoff`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              handOffPcp && "text-muted-foreground/50 line-through",
            )}
          >
            Hand off to PCP
          </label>
        </VisitRow>

        <VisitRow
          checkbox={
            <Checkbox
              id={`${baseId}-reenter`}
              checked={reenterRoom}
              onCheckedChange={(s) => setReenterRoom(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-reenter`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              reenterRoom && "text-muted-foreground/50 line-through",
            )}
          >
            Re-enter room for testing/support if required
          </label>
        </VisitRow>

        <VisitRow
          checkbox={
            <Checkbox
              id={`${baseId}-return`}
              checked={returnAfterPcp}
              onCheckedChange={(s) => setReturnAfterPcp(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-return`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              returnAfterPcp && "text-muted-foreground/50 line-through",
            )}
          >
            Return to exam room once PCP is done
          </label>
        </VisitRow>

        <VisitRow
          isLast
          checkbox={
            <Checkbox
              id={`${baseId}-supplies`}
              checked={suppliesDone}
              onCheckedChange={(s) => setSuppliesDone(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-supplies`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              suppliesDone && "text-muted-foreground/50 line-through",
            )}
          >
            Retrieve supplies needed to complete the visit
          </label>
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center justify-start gap-2",
              suppliesDone && CHECKLIST_META_WHEN_ROW_DONE,
            )}
          >
            {supplyLines.length > 0 ? (
              supplyLines.map((line, i) => (
                <MutedTagBadge
                  key={`${baseId}-supply-${i}`}
                  className="max-w-full wrap-break-word"
                >
                  {line}
                </MutedTagBadge>
              ))
            ) : (
              <span className={cn(textMeta, "text-muted-foreground")}>none</span>
            )}
            <p className={cn("w-full", textMeta, "text-muted-foreground")}>
              Tube collection and per-bundle status are tracked in Labs.
            </p>
          </div>
        </VisitRow>
      </div>

      <Dialog open={visitUncheckOpen} onOpenChange={setVisitUncheckOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Uncheck all visit items?</DialogTitle>
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
              onClick={() => setVisitUncheckOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={uncheckAllVisit}
            >
              Uncheck all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
