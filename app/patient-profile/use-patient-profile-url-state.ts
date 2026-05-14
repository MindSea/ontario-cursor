"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  DEFAULT_PATIENT_PROFILE_SECTION,
  isPatientProfileSection,
  type PatientProfileSection,
} from "./patient-profile-sections";

/**
 * Drives the patient profile dialog from URL query params (`patient`, `section`):
 *
 * - Refresh keeps the dialog open over the same parent shell.
 * - Browser back is a natural "close the dialog" gesture (initial open uses
 *   `pushState` so the dialog has its own history entry).
 * - Links like `/clinic-flow?patient=pat-robert&section=conversations` are shareable.
 *
 * Uses `history.pushState` / `replaceState` + a custom event instead of
 * `next/navigation` so host pages don't need a `Suspense` boundary
 * (Next 16 `useSearchParams` prerendering rule). The dialog's dirty guard
 * intercepts `popstate` and re-pushes the URL when there is unsaved work.
 */

/**
 * Internal signal so `pushState` / `replaceState` (which never fire `popstate`)
 * still notify every `useSyncExternalStore` subscriber on the same page.
 * Exposed so the dialog's popstate guard can re-emit after restoring a URL.
 */
export const PATIENT_PROFILE_SEARCH_CHANGED_EVENT =
  "patient-profile-url-state:search-changed";

export function emitPatientProfileSearchChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PATIENT_PROFILE_SEARCH_CHANGED_EVENT));
}

function getSnapshot(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", cb);
  window.addEventListener(PATIENT_PROFILE_SEARCH_CHANGED_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(PATIENT_PROFILE_SEARCH_CHANGED_EVENT, cb);
  };
}

export type PatientProfileUrlState = {
  /** `null` when no dialog should be open. */
  patientId: string | null;
  section: PatientProfileSection;
  open: (patientId: string, section?: PatientProfileSection) => void;
  close: () => void;
  setSection: (section: PatientProfileSection) => void;
};

export function usePatientProfileUrlState(): PatientProfileUrlState {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const params = new URLSearchParams(search);
  const raw = params.get("patient");
  const patientId = raw && raw.length > 0 ? raw : null;
  const rawSection = params.get("section");
  const section = isPatientProfileSection(rawSection)
    ? rawSection
    : DEFAULT_PATIENT_PROFILE_SECTION;

  const writeUrl = useCallback(
    (next: URLSearchParams, mode: "push" | "replace") => {
      if (typeof window === "undefined") return;
      const qs = next.toString();
      const url = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;
      if (mode === "push") {
        window.history.pushState(window.history.state, "", url);
      } else {
        window.history.replaceState(window.history.state, "", url);
      }
      emitPatientProfileSearchChanged();
    },
    [],
  );

  const replace = useCallback(
    (next: URLSearchParams) => writeUrl(next, "replace"),
    [writeUrl],
  );

  const open = useCallback(
    (id: string, sec?: PatientProfileSection) => {
      const current = new URLSearchParams(getSnapshot());
      const wasOpen = (current.get("patient")?.length ?? 0) > 0;
      const next = new URLSearchParams(getSnapshot());
      next.set("patient", id);
      if (sec) next.set("section", sec);
      else next.delete("section");
      /* Initial open pushes a new history entry so browser back is a natural
       * close gesture (and gives the dirty-guard a fresh entry to swallow);
       * switching profile while open just replaces in place. */
      writeUrl(next, wasOpen ? "replace" : "push");
    },
    [writeUrl],
  );

  const close = useCallback(() => {
    const next = new URLSearchParams(getSnapshot());
    next.delete("patient");
    next.delete("section");
    replace(next);
  }, [replace]);

  const setSection = useCallback(
    (sec: PatientProfileSection) => {
      const next = new URLSearchParams(getSnapshot());
      next.set("section", sec);
      replace(next);
    },
    [replace],
  );

  return { patientId, section, open, close, setSection };
}
