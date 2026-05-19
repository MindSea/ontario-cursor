"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
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
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { ChecklistLabelActionRow } from "./checklist-label-action-row";
import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import { MutedTagBadge } from "./muted-tag-badge";
import type {
  Appointment,
  IntakeFormResultRow,
  IntakeFormResultSeverity,
} from "./types";
import { useWorkspaceSection } from "./workspace-section-collapse-context";

/** Interactive checklist rows (checkboxes only). */
const INTAKE_CHECKBOX_TOTAL = 6;

function IntakeRow({
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

function formatDob(dobIso: string): string {
  try {
    return format(parseISO(dobIso), "MMM d, yyyy");
  } catch {
    return dobIso;
  }
}

function sortFormResults(
  rows: readonly IntakeFormResultRow[],
): IntakeFormResultRow[] {
  const rank: Record<IntakeFormResultSeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return [...rows].sort((a, b) => {
    const ra = a.severity !== undefined ? rank[a.severity] : 99;
    const rb = b.severity !== undefined ? rank[b.severity] : 99;
    if (ra !== rb) return ra - rb;
    return a.formLabel.localeCompare(b.formLabel);
  });
}

function severityChip(
  severity: IntakeFormResultRow["severity"],
): string | null {
  if (!severity) return null;
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  return "Low";
}

export function IntakeSection({
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

  const sectionClass =
    layout === "mobile"
      ? "block w-full rounded-xl border border-border bg-background px-4 pt-4 pb-2 shadow-sm"
      : "mb-0 block w-full rounded-lg border border-border bg-background px-6 pt-6 pb-4 shadow-sm";

  const [confirmIdChecked, setConfirmIdChecked] = useState(false);
  const [tabletNeededChecked, setTabletNeededChecked] = useState(false);
  const [tabletId, setTabletId] = useState("");
  const [wifiHelpChecked, setWifiHelpChecked] = useState(false);
  const [assistFormsChecked, setAssistFormsChecked] = useState(false);
  const [resultsReviewedChecked, setResultsReviewedChecked] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [escortedChecked, setEscortedChecked] = useState(false);
  const {
    collapsed: intakeCollapsed,
    toggleCollapsed: toggleIntakeCollapsed,
    scrollId,
    sectionSurfaceClass,
  } = useWorkspaceSection("intake");
  const [intakeUncheckOpen, setIntakeUncheckOpen] = useState(false);

  const resultsPanelId = `${baseId}-intake-results-panel`;

  const allFormsComplete = appointment.missingFormNames.length === 0;

  const intakeCheckedCount = useMemo(
    () =>
      [
        confirmIdChecked,
        tabletNeededChecked,
        wifiHelpChecked,
        assistFormsChecked || allFormsComplete,
        resultsReviewedChecked,
        escortedChecked,
      ].filter(Boolean).length,
    [
      confirmIdChecked,
      tabletNeededChecked,
      wifiHelpChecked,
      assistFormsChecked,
      resultsReviewedChecked,
      escortedChecked,
      allFormsComplete,
    ],
  );

  const checkAllIntake = useCallback(() => {
    setConfirmIdChecked(true);
    setTabletNeededChecked(true);
    setWifiHelpChecked(true);
    setAssistFormsChecked(true);
    setResultsReviewedChecked(true);
    setEscortedChecked(true);
  }, []);

  const uncheckAllIntake = useCallback(() => {
    setConfirmIdChecked(false);
    setTabletNeededChecked(false);
    setWifiHelpChecked(false);
    setAssistFormsChecked(false);
    setResultsReviewedChecked(false);
    setEscortedChecked(false);
    setResultsExpanded(false);
    setIntakeUncheckOpen(false);
  }, []);

  const allIntakeChecked = intakeCheckedCount === INTAKE_CHECKBOX_TOTAL;

  const missingFormsLine = useMemo(() => {
    if (appointment.missingFormNames.length === 0) return null;
    return `Missing: ${appointment.missingFormNames.join(", ")}`;
  }, [appointment.missingFormNames]);

  useEffect(() => {
    if (!allFormsComplete) return;
    queueMicrotask(() => setAssistFormsChecked(true));
  }, [allFormsComplete, appointment.id, assistFormsChecked]);

  const sortedFormResults = useMemo(
    () => sortFormResults(appointment.intakeFormResults),
    [appointment.intakeFormResults],
  );
  const shortFlagSummaryLine = useMemo(() => {
    if (sortedFormResults.length === 0) return "";
    return sortedFormResults.map((r) => r.shortFlag).join(" · ");
  }, [sortedFormResults]);

  const hasIntakeResultRows = sortedFormResults.length > 0;

  useEffect(() => {
    if (hasIntakeResultRows) return;
    queueMicrotask(() => setResultsExpanded(false));
  }, [hasIntakeResultRows]);

  useEffect(() => {
    if (!intakeCollapsed) return;
    queueMicrotask(() => setResultsExpanded(false));
  }, [intakeCollapsed]);

  const tabletInputClass = cn(
    "h-8 placeholder:text-muted-foreground",
    textBody,
  );

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
          <span>Intake</span>
          <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
            {intakeCheckedCount}/{INTAKE_CHECKBOX_TOTAL}
          </span>
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {!intakeCollapsed ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="shrink-0"
              onClick={() =>
                allIntakeChecked ? setIntakeUncheckOpen(true) : checkAllIntake()
              }
            >
              {allIntakeChecked ? "Uncheck All" : "Check All"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
            aria-expanded={!intakeCollapsed}
            aria-controls={`${baseId}-intake-content`}
            aria-label={
              intakeCollapsed
                ? "Expand Intake section"
                : "Collapse Intake section"
            }
            onClick={toggleIntakeCollapsed}
          >
            {intakeCollapsed ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div
        id={`${baseId}-intake-content`}
        hidden={intakeCollapsed}
        className={cn(!intakeCollapsed && "mt-3 flex flex-col")}
      >
        <IntakeRow
          isFirst
          checkbox={
            <Checkbox
              id={`${baseId}-confirm`}
              checked={confirmIdChecked}
              onCheckedChange={(s) => setConfirmIdChecked(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-confirm`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              confirmIdChecked && "text-muted-foreground/50 line-through",
            )}
          >
            Confirm patient name and birthday
          </label>
          <p className={cn(textMeta, confirmIdChecked && CHECKLIST_META_WHEN_ROW_DONE)}>
            {formatDob(appointment.dateOfBirth)}
          </p>
        </IntakeRow>

        <IntakeRow
          checkbox={
            <Checkbox
              id={`${baseId}-tablet`}
              checked={tabletNeededChecked}
              onCheckedChange={(s) => setTabletNeededChecked(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-tablet`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              tabletNeededChecked && "text-muted-foreground/50 line-through",
            )}
          >
            Give them a TSH tablet if needed
          </label>
          <Input
            value={tabletId}
            onChange={(e) => setTabletId(e.target.value)}
            placeholder="Tablet ID / number (optional)"
            className={tabletInputClass}
            aria-label="Tablet ID / number"
          />
        </IntakeRow>

        <IntakeRow
          checkbox={
            <Checkbox
              id={`${baseId}-wifi`}
              checked={wifiHelpChecked}
              onCheckedChange={(s) => setWifiHelpChecked(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-wifi`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              wifiHelpChecked && "text-muted-foreground/50 line-through",
            )}
          >
            Help them connect to TSH WiFi and download app
          </label>
        </IntakeRow>

        <IntakeRow
          checkbox={
            <Checkbox
              id={`${baseId}-forms`}
              checked={assistFormsChecked || allFormsComplete}
              onCheckedChange={(s) => setAssistFormsChecked(s === true)}
            />
          }
        >
          <div className="flex min-w-0 flex-col gap-2">
            <ChecklistLabelActionRow
              labelId={`${baseId}-forms`}
              checked={assistFormsChecked || allFormsComplete}
              actionsWhenCheckedClassName={CHECKLIST_META_WHEN_ROW_DONE}
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
            >
              Assist patient with completing forms if needed
            </ChecklistLabelActionRow>
            <span
              className={cn(
                "flex min-w-0 flex-wrap items-center gap-2",
                (assistFormsChecked || allFormsComplete) && CHECKLIST_META_WHEN_ROW_DONE,
              )}
            >
              <MutedTagBadge className="max-w-full">
                {appointment.formCompletionStatus}
              </MutedTagBadge>
              <MutedTagBadge className="tabular-nums">
                {appointment.formsCompleteCount}/{appointment.formsTotalCount} Forms
              </MutedTagBadge>
            </span>
            {missingFormsLine ? (
              <p
                className={cn(
                  textMeta,
                  (assistFormsChecked || allFormsComplete) && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                {missingFormsLine}
              </p>
            ) : (
              <p
                className={cn(
                  textMeta,
                  (assistFormsChecked || allFormsComplete) && CHECKLIST_META_WHEN_ROW_DONE,
                )}
              >
                All forms are completed.
              </p>
            )}
          </div>
        </IntakeRow>

        <IntakeRow
          checkbox={
            <Checkbox
              id={`${baseId}-results`}
              checked={resultsReviewedChecked}
              onCheckedChange={(s) => setResultsReviewedChecked(s === true)}
            />
          }
        >
          <div className="flex min-w-0 flex-col gap-2">
            <ChecklistLabelActionRow
              labelId={`${baseId}-results`}
              checked={resultsReviewedChecked}
              actionsWhenCheckedClassName={CHECKLIST_META_WHEN_ROW_DONE}
              actions={
                hasIntakeResultRows ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    aria-expanded={resultsExpanded}
                    aria-controls={resultsPanelId}
                    onClick={() => setResultsExpanded((o) => !o)}
                  >
                    {resultsExpanded ? "Less detail" : "More detail"}
                  </Button>
                ) : undefined
              }
            >
              View form results
            </ChecklistLabelActionRow>
          </div>

          {!resultsExpanded ? (
            <p
              className={cn(
                "min-w-0 truncate",
                textMeta,
                resultsReviewedChecked && CHECKLIST_META_WHEN_ROW_DONE,
              )}
              title={
                shortFlagSummaryLine ||
                "No flagged answers found."
              }
            >
              {shortFlagSummaryLine
                ? shortFlagSummaryLine
                : "No flagged answers found."}
            </p>
          ) : null}

          {resultsExpanded && hasIntakeResultRows ? (
            <div
              id={resultsPanelId}
              role="region"
              aria-label="Intake screening results"
              className={cn(
                "min-w-0 overflow-hidden rounded-md border border-border/60 bg-muted/15",
                resultsReviewedChecked && CHECKLIST_META_WHEN_ROW_DONE,
              )}
            >
              <div className="max-h-[min(60vh,24rem)] min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain">
                <div className="min-w-0 overflow-x-auto">
                  <table className="w-full min-w-md border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className={cn(
                            "sticky top-0 z-10 border-b border-border/60 bg-background px-3 py-2 text-left font-medium shadow-sm",
                            textBody,
                          )}
                        >
                          Form
                        </th>
                        <th
                          scope="col"
                          className={cn(
                            "sticky top-0 z-10 border-b border-border/60 bg-background px-3 py-2 text-left font-medium shadow-sm",
                            textBody,
                          )}
                        >
                          Result
                        </th>
                        <th
                          scope="col"
                          className={cn(
                            "sticky top-0 z-10 border-b border-border/60 bg-background px-3 py-2 text-left font-medium shadow-sm",
                            textBody,
                          )}
                        >
                          Context
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFormResults.map((row) => {
                        const sev = severityChip(row.severity);
                        return (
                          <tr key={row.id}>
                            <td className="align-top border-b border-border/40 px-3 py-2.5">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                {sev ? (
                                  <MutedTagBadge className="shrink-0">
                                    {sev}
                                  </MutedTagBadge>
                                ) : null}
                                <span
                                  className={cn(
                                    "min-w-0 wrap-break-word",
                                    textBody,
                                  )}
                                >
                                  {row.formLabel}
                                </span>
                              </div>
                            </td>
                            <td
                              className={cn(
                                "align-top border-b border-border/40 px-3 py-2.5 wrap-break-word",
                                textBody,
                              )}
                            >
                              {row.resultSummary}
                            </td>
                            <td
                              className={cn(
                                "align-top border-b border-border/40 px-3 py-2.5 wrap-break-word",
                                textMeta,
                              )}
                            >
                              {row.navigatorAction}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </IntakeRow>

        <IntakeRow
          checkbox={
            <Checkbox
              id={`${baseId}-escort`}
              checked={escortedChecked}
              onCheckedChange={(s) => setEscortedChecked(s === true)}
            />
          }
          isLast
        >
          <label
            htmlFor={`${baseId}-escort`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              escortedChecked && "text-muted-foreground/50 line-through",
            )}
          >
            Assist patient to exam room
          </label>
        </IntakeRow>
      </div>

      <Dialog open={intakeUncheckOpen} onOpenChange={setIntakeUncheckOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Uncheck all intake items?</DialogTitle>
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
              onClick={() => setIntakeUncheckOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={uncheckAllIntake}
            >
              Uncheck all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast ? (
        <div className="mt-3 rounded-md border border-border/50 bg-muted/40 px-3 py-2">
          <p className={textBody}>{toast}</p>
        </div>
      ) : null}
    </section>
  );
}

