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

import { AmbientListenControls } from "./ambient-listen-controls";
import {
  ambientListenStatusLabel,
  useAmbientListen,
} from "./ambient-listen-context";
import { ChecklistLabelActionRow } from "./checklist-label-action-row";
import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import type { Appointment } from "./types";

const WRAP_UP_CHECKBOX_TOTAL = 3;

function WrapUpRow({
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

export function WrapUpSection({
  appointment,
  layout,
}: {
  appointment: Appointment;
  layout: "mobile" | "desktop";
}) {
  const baseId = useId();
  const { listenState } = useAmbientListen();
  const ambientStopped = listenState === "stopped";

  const sectionClass =
    layout === "mobile"
      ? "block w-full rounded-xl border border-border bg-background px-4 pt-4 pb-2 shadow-sm"
      : "mb-0 block w-full rounded-lg border border-border bg-background px-6 pt-6 pb-4 shadow-sm";

  const [stopAmbientDone, setStopAmbientDone] = useState(false);
  const [wipeTabletDone, setWipeTabletDone] = useState(false);
  const [deleteHistoryDone, setDeleteHistoryDone] = useState(false);

  const [wrapCollapsed, setWrapCollapsed] = useState(false);
  const [wrapUncheckOpen, setWrapUncheckOpen] = useState(false);

  useEffect(() => {
    if (!ambientStopped) return;
    queueMicrotask(() => setStopAmbientDone(true));
  }, [ambientStopped, appointment.id, stopAmbientDone]);

  useEffect(() => {
    queueMicrotask(() => {
      setStopAmbientDone(false);
      setWipeTabletDone(false);
      setDeleteHistoryDone(false);
      setWrapCollapsed(false);
      setWrapUncheckOpen(false);
    });
  }, [appointment.id]);

  const stopAmbientRowDone = stopAmbientDone || ambientStopped;

  const wrapCheckedCount = useMemo(
    () =>
      [stopAmbientRowDone, wipeTabletDone, deleteHistoryDone].filter(Boolean)
        .length,
    [stopAmbientRowDone, wipeTabletDone, deleteHistoryDone],
  );

  const allWrapChecked = wrapCheckedCount === WRAP_UP_CHECKBOX_TOTAL;

  const checkAllWrap = useCallback(() => {
    setStopAmbientDone(true);
    setWipeTabletDone(true);
    setDeleteHistoryDone(true);
  }, []);

  const uncheckAllWrap = useCallback(() => {
    setStopAmbientDone(false);
    setWipeTabletDone(false);
    setDeleteHistoryDone(false);
    setWrapUncheckOpen(false);
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
            <span>Wrap Up</span>
            <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
              {wrapCheckedCount}/{WRAP_UP_CHECKBOX_TOTAL}
            </span>
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {!wrapCollapsed ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="shrink-0"
                onClick={() =>
                  allWrapChecked ? setWrapUncheckOpen(true) : checkAllWrap()
                }
              >
                {allWrapChecked ? "Uncheck All" : "Check All"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
              aria-expanded={!wrapCollapsed}
              aria-controls={`${baseId}-wrap-content`}
              aria-label={
                wrapCollapsed ? "Expand Wrap Up section" : "Collapse Wrap Up section"
              }
              onClick={() => setWrapCollapsed((c) => !c)}
            >
              {wrapCollapsed ? (
                <ChevronDown className="size-4" aria-hidden />
              ) : (
                <ChevronUp className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <div
          id={`${baseId}-wrap-content`}
          hidden={wrapCollapsed}
          className={cn(!wrapCollapsed && "mt-3 flex flex-col")}
        >
          <WrapUpRow
            isFirst
            checkbox={
              <Checkbox
                id={`${baseId}-stop-ambient`}
                checked={stopAmbientRowDone}
                onCheckedChange={(s) => {
                  if (s) setStopAmbientDone(true);
                  else setStopAmbientDone(false);
                }}
              />
            }
          >
            <div className="flex min-w-0 flex-col gap-2">
              <ChecklistLabelActionRow
                labelId={`${baseId}-stop-ambient`}
                checked={stopAmbientRowDone}
                actionsWhenCheckedClassName={CHECKLIST_META_WHEN_ROW_DONE}
                actions={<AmbientListenControls />}
              >
                Stop ambient listening
              </ChecklistLabelActionRow>
              <p
                className={cn(
                  textMeta,
                  stopAmbientRowDone && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                {ambientListenStatusLabel(listenState)}
              </p>
              <p
                className={cn(
                  "text-xs leading-snug text-muted-foreground",
                  stopAmbientRowDone && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                Follow unit policy for consent and documentation; this build does not
                capture audio.
              </p>
            </div>
          </WrapUpRow>

          <WrapUpRow
            checkbox={
              <Checkbox
                id={`${baseId}-wipe-tablet`}
                checked={wipeTabletDone}
                onCheckedChange={(s) => setWipeTabletDone(s === true)}
              />
            }
          >
            <label
              htmlFor={`${baseId}-wipe-tablet`}
              className={cn(
                "min-w-0 cursor-pointer wrap-break-word select-none",
                textBody,
                wipeTabletDone && "text-muted-foreground/50 line-through",
              )}
            >
              Wipe down tablet for infection control
            </label>
          </WrapUpRow>

          <WrapUpRow
            isLast
            checkbox={
              <Checkbox
                id={`${baseId}-delete-history`}
                checked={deleteHistoryDone}
                onCheckedChange={(s) => setDeleteHistoryDone(s === true)}
              />
            }
          >
            <label
              htmlFor={`${baseId}-delete-history`}
              className={cn(
                "min-w-0 cursor-pointer wrap-break-word select-none",
                textBody,
                deleteHistoryDone && "text-muted-foreground/50 line-through",
              )}
            >
              Delete tablet browser history
            </label>
          </WrapUpRow>
        </div>

        <Dialog open={wrapUncheckOpen} onOpenChange={setWrapUncheckOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Uncheck all Wrap Up items?</DialogTitle>
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
                onClick={() => setWrapUncheckOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={uncheckAllWrap}>
                Uncheck all
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
