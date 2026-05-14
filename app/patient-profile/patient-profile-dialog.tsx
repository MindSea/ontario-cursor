"use client";

import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { getPatientProfileSeed } from "./patient-profile-seed";
import type { PatientProfileSection } from "./patient-profile-sections";
import { PatientProfileView } from "./patient-profile-view";
import {
  PatientProfileDirtyProvider,
  usePatientProfileDirty,
} from "./use-patient-profile-dirty";
import { emitPatientProfileSearchChanged } from "./use-patient-profile-url-state";

export type PatientProfileDialogProps = {
  patientId: string | null;
  section: PatientProfileSection;
  onSectionChange: (section: PatientProfileSection) => void;
  /** Closes the dialog after the dirty check passes (or when there is nothing dirty). */
  onRequestClose: () => void;
};

const DIRTY_DISCARD_MESSAGE = "You have unsaved changes. Discard them?";

export function PatientProfileDialog({
  patientId,
  section,
  onSectionChange,
  onRequestClose,
}: PatientProfileDialogProps) {
  const open = patientId != null;
  const aggregate = open ? getPatientProfileSeed(patientId) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        /* Esc / outside-click handlers below preventDefault when dirty,
         * so onOpenChange(false) only fires after a confirmed discard or
         * an external URL-driven close (browser back / link). */
        if (!next) onRequestClose();
      }}
    >
      <PatientProfileDirtyProvider>
        <PatientProfileDialogShell
          aggregate={aggregate}
          patientId={patientId}
          section={section}
          onSectionChange={onSectionChange}
          onRequestClose={onRequestClose}
        />
      </PatientProfileDirtyProvider>
    </Dialog>
  );
}

function PatientProfileDialogShell({
  aggregate,
  patientId,
  section,
  onSectionChange,
  onRequestClose,
}: {
  aggregate: ReturnType<typeof getPatientProfileSeed>;
  patientId: string | null;
  section: PatientProfileSection;
  onSectionChange: (s: PatientProfileSection) => void;
  onRequestClose: () => void;
}) {
  const dirty = usePatientProfileDirty();

  /** Returns true when the dialog may dismiss (no dirty work or user confirmed discard). */
  const confirmDirtyDiscard = useCallback((): boolean => {
    if (!dirty?.isAnyDirty()) return true;
    if (typeof window === "undefined") return true;
    return window.confirm(DIRTY_DISCARD_MESSAGE);
  }, [dirty]);

  const tryClose = useCallback(() => {
    if (confirmDirtyDiscard()) onRequestClose();
  }, [confirmDirtyDiscard, onRequestClose]);

  const blockIfDirty = useCallback(
    (event: Event) => {
      if (!confirmDirtyDiscard()) event.preventDefault();
    },
    [confirmDirtyDiscard],
  );

  /* Guard browser back / forward while editing.
   *
   * `popstate` fires AFTER the URL has already changed, so we can't truly cancel
   * it. Instead, when there is dirty work, we immediately `pushState` the dialog
   * URL back, re-emit our internal search-changed event, then prompt the user.
   *
   * The re-pushed URL matches the previous snapshot exactly, so
   * `useSyncExternalStore` in the host page reads an unchanged snapshot and
   * bails out of re-rendering — the dialog stays mounted with edits intact. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!patientId) return;
    if (!dirty) return;

    const onPopState = () => {
      if (!dirty.isAnyDirty()) return;

      const restoreParams = new URLSearchParams();
      restoreParams.set("patient", patientId);
      restoreParams.set("section", section);
      const restoreUrl = `${window.location.pathname}?${restoreParams.toString()}`;
      window.history.pushState(window.history.state, "", restoreUrl);
      emitPatientProfileSearchChanged();

      if (window.confirm(DIRTY_DISCARD_MESSAGE)) {
        onRequestClose();
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [patientId, section, dirty, onRequestClose]);

  /* Guard tab close / reload / external navigation while editing.
   *
   * Modern browsers ignore custom strings and show their own
   * "Leave site?" prompt — `preventDefault` + `returnValue = ""` is what
   * triggers it. Older browsers required a non-empty return string. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!patientId) return;
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.isAnyDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [patientId, dirty]);

  return (
    <DialogContent
      onEscapeKeyDown={blockIfDirty}
      onPointerDownOutside={blockIfDirty}
      onInteractOutside={blockIfDirty}
      className={cn(
        /* Desktop: wide centered fixed-height shell. Override Dialog defaults
         * (w-[calc(100vw-2rem)] max-w-lg p-4). */
        "flex max-w-none flex-col overflow-hidden p-0",
        "w-[min(96vw,72rem)] h-[min(92vh,54rem)]",
        /* Mobile: full-screen takeover (under md). */
        "max-md:top-0 max-md:left-0 max-md:translate-x-0 max-md:translate-y-0",
        "max-md:h-dvh max-md:max-h-dvh max-md:w-screen max-md:rounded-none max-md:border-0",
      )}
    >
      <DialogTitle className="sr-only">Patient profile</DialogTitle>
      <DialogDescription className="sr-only">
        {aggregate?.summary.displayName ?? "Patient"}
      </DialogDescription>
      {aggregate ? (
        <PatientProfileView
          key={aggregate.summary.patientId}
          aggregate={aggregate}
          activeSection={section}
          onSectionChange={onSectionChange}
          onCloseRequest={tryClose}
        />
      ) : patientId ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
          <p className="m-0 text-sm">
            No demo profile for patient id{" "}
            <span className="font-mono text-foreground">{patientId}</span>.
          </p>
          <Button type="button" variant="outline" onClick={tryClose}>
            Close
          </Button>
        </div>
      ) : null}
    </DialogContent>
  );
}
