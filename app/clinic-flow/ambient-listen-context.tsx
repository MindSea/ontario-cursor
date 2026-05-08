"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AmbientListenState =
  | "not_started"
  | "recording"
  | "paused"
  | "stopped";

export function ambientListenStatusLabel(s: AmbientListenState): string {
  if (s === "not_started") return "Not started";
  if (s === "recording") return "Recording…";
  if (s === "paused") return "Paused";
  return "Stopped";
}

type AmbientListenContextValue = {
  listenState: AmbientListenState;
  setListenState: (s: AmbientListenState) => void;
};

const AmbientListenContext = createContext<AmbientListenContextValue | null>(
  null,
);

export function AmbientListenProvider({ children }: { children: ReactNode }) {
  const [listenState, setListenState] = useState<AmbientListenState>("not_started");
  const value = useMemo(
    () => ({ listenState, setListenState }),
    [listenState],
  );
  return (
    <AmbientListenContext.Provider value={value}>
      {children}
    </AmbientListenContext.Provider>
  );
}

export function useAmbientListen(): AmbientListenContextValue {
  const ctx = useContext(AmbientListenContext);
  if (!ctx) {
    throw new Error("useAmbientListen must be used within AmbientListenProvider");
  }
  return ctx;
}
