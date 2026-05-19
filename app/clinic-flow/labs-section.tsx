"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { buildLabSupplyBundles } from "./labs-supply-catalog";
import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import type { Appointment } from "./types";
import { useWorkspaceSection } from "./workspace-section-collapse-context";

const LABS_CHECKBOX_TOTAL = 1;

type BundleDisposition = "pending" | "done";

/**
 * Two-track row: supplies + orders wrap in a `minmax(0,1fr)` column; the select stays a
 * fixed-width column on the trailing edge at every breakpoint (avoids the jagged
 * flex-wrap layout from borrowing Previsit’s small-screen pattern).
 */
function LabsBundleRow({
  disposition,
  onDispositionChange,
  triggerId,
  suppliesSummary,
  ordersLabel,
}: {
  disposition: BundleDisposition;
  onDispositionChange: (v: BundleDisposition) => void;
  triggerId: string;
  suppliesSummary: string;
  ordersLabel: string;
}) {
  const rowDone = disposition === "done";

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
      <div
        className={cn(
          "min-w-0 flex flex-col gap-0.5 pr-1",
          rowDone && CHECKLIST_META_WHEN_ROW_DONE,
        )}
      >
        <p
          className={cn(
            "wrap-break-word font-medium",
            textMeta,
            "text-foreground/85",
          )}
        >
          {suppliesSummary}
        </p>
        <p className={cn("wrap-break-word", textMeta)}>{ordersLabel}</p>
      </div>
      <div
        className={cn(
          "w-28 min-w-0 shrink-0",
          rowDone && CHECKLIST_META_WHEN_ROW_DONE,
        )}
      >
        <Select
          value={disposition}
          onValueChange={(v) => {
            if (v === "pending" || v === "done") onDispositionChange(v);
          }}
        >
          <SelectTrigger id={triggerId} size="sm" className="h-8 w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-1000">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function LabsSection({
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

  const bundles = useMemo(
    () => buildLabSupplyBundles(appointment.visit.supplyReferenceLines),
    [appointment.visit.supplyReferenceLines],
  );

  const [labsComplete, setLabsComplete] = useState(false);
  const [bundleDisposition, setBundleDisposition] = useState<
    Record<string, BundleDisposition>
  >({});

  const {
    collapsed: labsCollapsed,
    toggleCollapsed: toggleLabsCollapsed,
    scrollId,
    sectionSurfaceClass,
  } = useWorkspaceSection("labs");
  const [labsUncheckOpen, setLabsUncheckOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLabsComplete(false);
      setLabsUncheckOpen(false);
      const next: Record<string, BundleDisposition> = {};
      for (const b of buildLabSupplyBundles(appointment.visit.supplyReferenceLines)) {
        next[b.key] = "pending";
      }
      setBundleDisposition(next);
    });
  }, [appointment.id, appointment.visit.supplyReferenceLines]);

  const allBundlesDone = useMemo(
    () =>
      bundles.length > 0 &&
      bundles.every((b) => (bundleDisposition[b.key] ?? "pending") === "done"),
    [bundles, bundleDisposition],
  );

  const labsParentChecked =
    bundles.length === 0 ? labsComplete : allBundlesDone;

  const labsCheckedCount = labsParentChecked ? 1 : 0;
  const allLabsChecked = labsCheckedCount === LABS_CHECKBOX_TOTAL;

  const checkAllLabs = useCallback(() => {
    setLabsComplete(true);
    setBundleDisposition((prev) => {
      const next = { ...prev };
      for (const b of bundles) {
        next[b.key] = "done";
      }
      return next;
    });
  }, [bundles]);

  const uncheckAllLabs = useCallback(() => {
    setLabsComplete(false);
    setBundleDisposition((prev) => {
      const next = { ...prev };
      for (const b of bundles) {
        next[b.key] = "pending";
      }
      return next;
    });
    setLabsUncheckOpen(false);
  }, [bundles]);

  const setBundle = useCallback((key: string, v: BundleDisposition) => {
    setBundleDisposition((prev) => ({ ...prev, [key]: v }));
  }, []);

  return (
    <section
      id={scrollId}
      className={cn(textBody, sectionClass, sectionSurfaceClass)}
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
          <span>Labs</span>
          <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
            {labsCheckedCount}/{LABS_CHECKBOX_TOTAL}
          </span>
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {!labsCollapsed ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="shrink-0"
              onClick={() =>
                allLabsChecked ? setLabsUncheckOpen(true) : checkAllLabs()
              }
            >
              {allLabsChecked ? "Uncheck All" : "Check All"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
            aria-expanded={!labsCollapsed}
            aria-controls={`${baseId}-labs-content`}
            aria-label={
              labsCollapsed ? "Expand Labs section" : "Collapse Labs section"
            }
            onClick={toggleLabsCollapsed}
          >
            {labsCollapsed ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div
        id={`${baseId}-labs-content`}
        hidden={labsCollapsed}
        className={cn(!labsCollapsed && "mt-3 flex flex-col")}
      >
        <div className="flex gap-2 py-3 pt-0">
          <div className="mt-0.5 shrink-0">
            <Checkbox
              id={`${baseId}-labs-done`}
              checked={labsParentChecked}
              onCheckedChange={(s) => {
                const on = s === true;
                if (bundles.length === 0) {
                  setLabsComplete(on);
                  return;
                }
                setLabsComplete(on);
                setBundleDisposition((prev) => {
                  const next = { ...prev };
                  for (const b of bundles) {
                    next[b.key] = on ? "done" : "pending";
                  }
                  return next;
                });
              }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label
              htmlFor={`${baseId}-labs-done`}
              className={cn(
                "min-w-0 cursor-pointer wrap-break-word select-none",
                textBody,
                labsParentChecked && "text-muted-foreground/50 line-through",
              )}
            >
              Complete lab collection
            </label>
            {bundles.length === 0 ? (
              <p
                className={cn(
                  textMeta,
                  "text-muted-foreground",
                  labsParentChecked && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                No PCP lab orders listed for this visit.
              </p>
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                {bundles.map((b) => {
                  const disposition = bundleDisposition[b.key] ?? "pending";
                  const ordersLabel = `Orders: ${b.contributingOrders.join(", ")}`;
                  return (
                    <LabsBundleRow
                      key={b.key}
                      disposition={disposition}
                      onDispositionChange={(v) => setBundle(b.key, v)}
                      triggerId={`${baseId}-bundle-${b.key}`}
                      suppliesSummary={b.suppliesSummary}
                      ordersLabel={ordersLabel}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={labsUncheckOpen} onOpenChange={setLabsUncheckOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Uncheck all labs items?</DialogTitle>
            <DialogDescription>
              This clears the lab collection checkbox and sets every supply bundle
              back to Pending (demo only).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLabsUncheckOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={uncheckAllLabs}>
              Uncheck all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
