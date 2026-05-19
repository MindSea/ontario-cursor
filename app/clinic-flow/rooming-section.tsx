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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { AmbientListenControls } from "./ambient-listen-controls";
import {
  ambientListenStatusLabel,
  useAmbientListen,
} from "./ambient-listen-context";
import { ChecklistLabelActionRow } from "./checklist-label-action-row";
import { CHECKLIST_META_WHEN_ROW_DONE } from "./checklist-workspace-styles";
import { getRoomingPoctDefinition } from "./rooming-poct-catalog";
import type { Appointment } from "./types";
import { useWorkspaceSection } from "./workspace-section-collapse-context";

const ROOMING_CHECKBOX_TOTAL = 7;

function RoomingRow({
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

function medsOnFileCount(multiline: string): number {
  return multiline
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length;
}

function regDisplay(text: string): { text: string; isNone: boolean } {
  const t = text.trim();
  return t.length > 0 ? { text: t, isNone: false } : { text: "none", isNone: true };
}

function RegistrationField({ label, text }: { label: string; text: string }) {
  const d = regDisplay(text);
  return (
    <div className="min-w-0">
      <p className={cn("font-medium text-foreground/80", textMeta)}>{label}</p>
      <p
        className={cn(
          "mt-1.5 whitespace-pre-wrap wrap-break-word",
          textBody,
          d.isNone && "text-muted-foreground",
        )}
      >
        {d.text}
      </p>
    </div>
  );
}

export function RoomingSection({
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

  const inputSm = cn("h-8 placeholder:text-muted-foreground", textBody);

  const { listenState, setListenState } = useAmbientListen();

  const [ambientDone, setAmbientDone] = useState(false);

  const [registrationDone, setRegistrationDone] = useState(false);
  const [vitalsDone, setVitalsDone] = useState(false);
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [temp, setTemp] = useState("");
  const [weight, setWeight] = useState("");
  const [bg, setBg] = useState("");
  const [resp, setResp] = useState("");
  const [asthma, setAsthma] = useState("");
  const [tobacco, setTobacco] = useState("");
  const [vitalsNotes, setVitalsNotes] = useState("");

  const [poctDone, setPoctDone] = useState(false);
  const [poctValues, setPoctValues] = useState<Record<string, string>>({});

  const [medRecDone, setMedRecDone] = useState(false);
  const [medRecNotes, setMedRecNotes] = useState("");

  const [callPcpDone, setCallPcpDone] = useState(false);
  const [careMgmtDone, setCareMgmtDone] = useState(false);

  const {
    collapsed: roomingCollapsed,
    toggleCollapsed: toggleRoomingCollapsed,
    scrollId,
    sectionSurfaceClass,
  } = useWorkspaceSection("rooming");
  const [roomingUncheckOpen, setRoomingUncheckOpen] = useState(false);

  const orderedPoctTests = appointment.rooming.orderedPoctTests;

  const ambientStopped = listenState === "stopped";

  const vitalsInputsComplete = useMemo(() => {
    const f = (s: string) => s.trim().length > 0;
    return (
      f(bp) &&
      f(hr) &&
      f(spo2) &&
      f(temp) &&
      f(weight) &&
      f(bg) &&
      f(resp) &&
      f(asthma) &&
      f(tobacco)
    );
  }, [bp, hr, spo2, temp, weight, bg, resp, asthma, tobacco]);

  const poctInputsComplete = useMemo(() => {
    if (orderedPoctTests.length === 0) return false;
    return orderedPoctTests.every(
      (row) => (poctValues[row.id] ?? "").trim().length > 0,
    );
  }, [orderedPoctTests, poctValues]);

  useEffect(() => {
    if (!ambientStopped) return;
    queueMicrotask(() => setAmbientDone(true));
  }, [ambientStopped, appointment.id, ambientDone]);

  useEffect(() => {
    if (!vitalsInputsComplete) return;
    queueMicrotask(() => setVitalsDone(true));
  }, [vitalsInputsComplete, appointment.id, vitalsDone]);

  useEffect(() => {
    if (!poctInputsComplete) return;
    queueMicrotask(() => setPoctDone(true));
  }, [poctInputsComplete, appointment.id, poctDone]);

  useEffect(() => {
    queueMicrotask(() => {
      setAmbientDone(false);
      setRegistrationDone(false);
      setVitalsDone(false);
      setBp("");
      setHr("");
      setSpo2("");
      setTemp("");
      setWeight("");
      setBg("");
      setResp("");
      setAsthma("");
      setTobacco("");
      setVitalsNotes("");
      setPoctDone(false);
      setPoctValues({});
      setMedRecDone(false);
      setMedRecNotes("");
      setCallPcpDone(false);
      setCareMgmtDone(false);
      setRoomingUncheckOpen(false);
    });
  }, [appointment.id]);

  const medCount = useMemo(
    () => medsOnFileCount(appointment.rooming.medicationsOnFileMultiline),
    [appointment.rooming.medicationsOnFileMultiline],
  );

  const roomingCheckedCount = useMemo(
    () =>
      [
        ambientDone || ambientStopped,
        registrationDone,
        vitalsDone || vitalsInputsComplete,
        poctDone || poctInputsComplete,
        medRecDone,
        callPcpDone,
        careMgmtDone,
      ].filter(Boolean).length,
    [
      ambientDone,
      ambientStopped,
      registrationDone,
      vitalsDone,
      vitalsInputsComplete,
      poctDone,
      poctInputsComplete,
      medRecDone,
      callPcpDone,
      careMgmtDone,
    ],
  );

  const checkAllRooming = useCallback(() => {
    setAmbientDone(true);
    setRegistrationDone(true);
    setVitalsDone(true);
    setPoctDone(true);
    setMedRecDone(true);
    setCallPcpDone(true);
    setCareMgmtDone(true);
  }, []);

  const uncheckAllRooming = useCallback(() => {
    setAmbientDone(false);
    setListenState("not_started");
    setRegistrationDone(false);
    setVitalsDone(false);
    setBp("");
    setHr("");
    setSpo2("");
    setTemp("");
    setWeight("");
    setBg("");
    setResp("");
    setAsthma("");
    setTobacco("");
    setPoctDone(false);
    setPoctValues({});
    setMedRecDone(false);
    setCallPcpDone(false);
    setCareMgmtDone(false);
    setRoomingUncheckOpen(false);
  }, [setListenState]);

  const allRoomingChecked = roomingCheckedCount === ROOMING_CHECKBOX_TOTAL;

  const ambientRowDone = ambientDone || ambientStopped;
  const vitalsRowDone = vitalsDone || vitalsInputsComplete;
  const poctRowDone = poctDone || poctInputsComplete;

  const setPoctField = useCallback((rowId: string, value: string) => {
    setPoctValues((prev) => ({ ...prev, [rowId]: value }));
  }, []);

  const reg = appointment.rooming.registration;

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
          <span>Rooming</span>
          <span className="font-normal normal-case tabular-nums text-xs leading-none text-muted-foreground">
            {roomingCheckedCount}/{ROOMING_CHECKBOX_TOTAL}
          </span>
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {!roomingCollapsed ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="shrink-0"
              onClick={() =>
                allRoomingChecked ? setRoomingUncheckOpen(true) : checkAllRooming()
              }
            >
              {allRoomingChecked ? "Uncheck All" : "Check All"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:bg-transparent dark:aria-expanded:hover:bg-muted/50"
            aria-expanded={!roomingCollapsed}
            aria-controls={`${baseId}-rooming-content`}
            aria-label={
              roomingCollapsed ? "Expand Rooming section" : "Collapse Rooming section"
            }
            onClick={toggleRoomingCollapsed}
          >
            {roomingCollapsed ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <div
        id={`${baseId}-rooming-content`}
        hidden={roomingCollapsed}
        className={cn(!roomingCollapsed && "mt-3 flex flex-col")}
      >
        <RoomingRow
          isFirst
          checkbox={
            <Checkbox
              id={`${baseId}-ambient-done`}
              checked={ambientRowDone}
              onCheckedChange={(s) => {
                if (s) setAmbientDone(true);
                else {
                  setAmbientDone(false);
                  setListenState("not_started");
                }
              }}
            />
          }
        >
          <div className="flex min-w-0 flex-col gap-2">
            <ChecklistLabelActionRow
              labelId={`${baseId}-ambient-done`}
              checked={ambientRowDone}
              actionsWhenCheckedClassName={CHECKLIST_META_WHEN_ROW_DONE}
              actions={<AmbientListenControls />}
            >
              Ambient listening
            </ChecklistLabelActionRow>
            <p
              className={cn(
                textMeta,
                ambientRowDone && CHECKLIST_META_WHEN_ROW_DONE,
              )}
            >
              {ambientListenStatusLabel(listenState)}
            </p>
            <p
              className={cn(
                "text-xs leading-snug text-muted-foreground",
                ambientRowDone && CHECKLIST_META_WHEN_ROW_DONE,
              )}
            >
              Follow unit policy for consent and documentation; this build does not
              capture audio.
            </p>
          </div>
        </RoomingRow>

        <RoomingRow
          checkbox={
            <Checkbox
              id={`${baseId}-reg`}
              checked={registrationDone}
              onCheckedChange={(s) => setRegistrationDone(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-reg`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              registrationDone && "text-muted-foreground/50 line-through",
            )}
          >
            Validate registration details
          </label>
          <div
            className={cn(
              "grid grid-cols-1 gap-y-4 gap-x-4 lg:grid-cols-2 lg:gap-x-8",
              registrationDone && CHECKLIST_META_WHEN_ROW_DONE,
            )}
          >
            <RegistrationField label="Insurance" text={reg.insurance} />
            <RegistrationField label="Pharmacy" text={reg.pharmacy} />
            <RegistrationField label="Emergency contact" text={reg.emergencyContact} />
            <RegistrationField label="Payment source" text={reg.paymentSource} />
          </div>
        </RoomingRow>

        <RoomingRow
          checkbox={
            <Checkbox
              id={`${baseId}-vitals`}
              checked={vitalsRowDone}
              onCheckedChange={(s) => {
                if (s) setVitalsDone(true);
                else {
                  setVitalsDone(false);
                  if (vitalsInputsComplete) {
                    setBp("");
                    setHr("");
                    setSpo2("");
                    setTemp("");
                    setWeight("");
                    setBg("");
                    setResp("");
                    setAsthma("");
                    setTobacco("");
                  }
                }
              }}
            />
          }
        >
          <label
            htmlFor={`${baseId}-vitals`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              vitalsRowDone && "text-muted-foreground/50 line-through",
            )}
          >
            Conduct visit related vital signs
          </label>
          <div
            className={cn(
              "grid grid-cols-1 gap-y-4 gap-x-4 md:grid-cols-2 md:gap-x-5 xl:grid-cols-3 xl:gap-x-6",
              vitalsRowDone && CHECKLIST_META_WHEN_ROW_DONE,
            )}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Blood pressure{" "}
                <span className="text-muted-foreground">(mmHg)</span>
              </span>
              <Input
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Blood pressure mmHg"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Heart rate <span className="text-muted-foreground">(bpm)</span>
              </span>
              <Input
                value={hr}
                onChange={(e) => setHr(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Heart rate bpm"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Oxygen saturation{" "}
                <span className="text-muted-foreground">(%)</span>
              </span>
              <Input
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Oxygen saturation percent"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Temperature <span className="text-muted-foreground">(°F)</span>
              </span>
              <Input
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Temperature Fahrenheit"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Weight <span className="text-muted-foreground">(lb)</span>
              </span>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Weight pounds"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Blood glucose{" "}
                <span className="text-muted-foreground">(mg/dL)</span>
              </span>
              <Input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Blood glucose mg per dL"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>
                Respiration{" "}
                <span className="text-muted-foreground">(/min)</span>
              </span>
              <Input
                value={resp}
                onChange={(e) => setResp(e.target.value)}
                placeholder="Enter value"
                className={inputSm}
                aria-label="Respiration per minute"
              />
            </div>
          </div>
          <div
            className={cn(
              "mt-1 grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-border/40",
              vitalsRowDone && CHECKLIST_META_WHEN_ROW_DONE,
            )}
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>Asthma</span>
              <Select value={asthma || undefined} onValueChange={setAsthma}>
                <SelectTrigger size="sm" className="h-8 w-full min-w-0">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className={textMeta}>Tobacco</span>
              <Select value={tobacco || undefined} onValueChange={setTobacco}>
                <SelectTrigger size="sm" className="h-8 w-full min-w-0">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className="z-1000">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <NotesTextarea
            value={vitalsNotes}
            onChange={(e) => setVitalsNotes(e.target.value)}
            placeholder="Vitals notes…"
            aria-label="Vitals notes"
          />
        </RoomingRow>

        <RoomingRow
          checkbox={
            <Checkbox
              id={`${baseId}-poct`}
              checked={poctRowDone}
              onCheckedChange={(s) => {
                if (s) setPoctDone(true);
                else {
                  setPoctDone(false);
                  if (poctInputsComplete) setPoctValues({});
                }
              }}
            />
          }
        >
          <label
            htmlFor={`${baseId}-poct`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              poctRowDone && "text-muted-foreground/50 line-through",
            )}
          >
            Conduct visit related POCT and diagnostics
          </label>
          <div
            className={cn(
              "grid grid-cols-1 gap-y-4 gap-x-4 md:grid-cols-2 md:gap-x-5 xl:grid-cols-3 xl:gap-x-6",
              poctRowDone && CHECKLIST_META_WHEN_ROW_DONE,
            )}
          >
            {orderedPoctTests.map((row) => {
              const def = getRoomingPoctDefinition(row.testType);
              const v = poctValues[row.id] ?? "";
              if (def.kind === "numeric") {
                return (
                  <div key={row.id} className="flex min-w-0 flex-col gap-1.5">
                    <span className={textMeta}>
                      {def.label}{" "}
                      <span className="text-muted-foreground">({def.unit})</span>
                    </span>
                    <Input
                      value={v}
                      onChange={(e) => setPoctField(row.id, e.target.value)}
                      placeholder="Enter value"
                      className={inputSm}
                      type="text"
                      inputMode={def.decimal ? "decimal" : "numeric"}
                      aria-label={`${def.label} ${def.unit}`}
                    />
                  </div>
                );
              }
              return (
                <div key={row.id} className="flex min-w-0 flex-col gap-1.5">
                  <span className={textMeta}>{def.label}</span>
                  <Select
                    value={v || undefined}
                    onValueChange={(nv) => setPoctField(row.id, nv)}
                  >
                    <SelectTrigger size="sm" className="h-8 w-full min-w-0">
                      <SelectValue placeholder="Select result…" />
                    </SelectTrigger>
                    <SelectContent className="z-1000">
                      {def.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </RoomingRow>

        <RoomingRow
          checkbox={
            <Checkbox
              id={`${baseId}-meds`}
              checked={medRecDone}
              onCheckedChange={(s) => setMedRecDone(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-meds`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              medRecDone && "text-muted-foreground/50 line-through",
            )}
          >
            Conduct medication reconciliation
          </label>
          <p className={cn(textMeta, medRecDone && CHECKLIST_META_WHEN_ROW_DONE)}>
            <span className="tabular-nums font-medium text-foreground/80">
              {medCount}
            </span>{" "}
            meds on file
          </p>
          {appointment.rooming.medicationsOnFileMultiline.trim() ? (
            <pre
              className={cn(
                "whitespace-pre-wrap wrap-break-word rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm",
                medRecDone && CHECKLIST_META_WHEN_ROW_DONE,
              )}
            >
              {appointment.rooming.medicationsOnFileMultiline}
            </pre>
          ) : null}
          <NotesTextarea
            value={medRecNotes}
            onChange={(e) => setMedRecNotes(e.target.value)}
            placeholder="Medication reconciliation notes…"
            aria-label="Medication reconciliation notes"
          />
        </RoomingRow>

        <RoomingRow
          checkbox={
            <Checkbox
              id={`${baseId}-pcp`}
              checked={callPcpDone}
              onCheckedChange={(s) => setCallPcpDone(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-pcp`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              callPcpDone && "text-muted-foreground/50 line-through",
            )}
          >
            Call PCP
          </label>
        </RoomingRow>

        <RoomingRow
          isLast
          checkbox={
            <Checkbox
              id={`${baseId}-care`}
              checked={careMgmtDone}
              onCheckedChange={(s) => setCareMgmtDone(s === true)}
            />
          }
        >
          <label
            htmlFor={`${baseId}-care`}
            className={cn(
              "min-w-0 cursor-pointer wrap-break-word select-none",
              textBody,
              careMgmtDone && "text-muted-foreground/50 line-through",
            )}
          >
            Review Care Management action items
          </label>
        </RoomingRow>
      </div>

      <Dialog open={roomingUncheckOpen} onOpenChange={setRoomingUncheckOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Uncheck all rooming items?</DialogTitle>
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
              onClick={() => setRoomingUncheckOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={uncheckAllRooming}
            >
              Uncheck all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
