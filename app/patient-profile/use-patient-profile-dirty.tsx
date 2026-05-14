"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/**
 * Lightweight registry so each editable subform (Contact/Admin today; tasks /
 * conversations next) can report its own dirty state to the dialog shell.
 *
 * Storing the set in a ref avoids re-rendering the whole profile on every keystroke;
 * the dialog reads via `isAnyDirty()` only when the user attempts to dismiss.
 */
type DirtyState = {
  setDirty: (key: string, isDirty: boolean) => void;
  isAnyDirty: () => boolean;
};

const PatientProfileDirtyCtx = createContext<DirtyState | null>(null);

export function PatientProfileDirtyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dirtyRef = useRef<Set<string>>(new Set());

  const setDirty = useCallback((key: string, isDirty: boolean) => {
    if (isDirty) dirtyRef.current.add(key);
    else dirtyRef.current.delete(key);
  }, []);

  const isAnyDirty = useCallback(() => dirtyRef.current.size > 0, []);

  const value = useMemo<DirtyState>(
    () => ({ setDirty, isAnyDirty }),
    [setDirty, isAnyDirty],
  );

  return (
    <PatientProfileDirtyCtx.Provider value={value}>
      {children}
    </PatientProfileDirtyCtx.Provider>
  );
}

export function usePatientProfileDirty(): DirtyState | null {
  return useContext(PatientProfileDirtyCtx);
}

/** Reflect `isDirty` into the surrounding dialog dirty registry under `key`. */
export function useDirtyRegistration(key: string, isDirty: boolean): void {
  const ctx = usePatientProfileDirty();
  useEffect(() => {
    if (!ctx) return;
    ctx.setDirty(key, isDirty);
    return () => {
      ctx.setDirty(key, false);
    };
  }, [ctx, key, isDirty]);
}
