"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import type { AppointmentStage } from "./types";

import {
  defaultCollapsedBySection,
  scrollWorkspaceSectionIntoView,
  WORKSPACE_SECTION_SCROLL_ID,
  workspaceSectionKeyForStage,
  type WorkspacePipelineSectionKey,
} from "./workspace-section-collapse";

type WorkspaceSectionsContextValue = {
  isCollapsed: (key: WorkspacePipelineSectionKey) => boolean;
  toggleCollapsed: (key: WorkspacePipelineSectionKey) => void;
  scrollIdFor: (key: WorkspacePipelineSectionKey) => string;
  sectionSurfaceClass: string;
};

type WorkspaceScrollRequest = {
  token: number;
  key: WorkspacePipelineSectionKey;
};

const WorkspaceSectionsContext =
  createContext<WorkspaceSectionsContextValue | null>(null);

function scrollToWorkspaceSection(
  key: WorkspacePipelineSectionKey,
  scrollContainer: HTMLElement | null | undefined,
) {
  const el = document.getElementById(WORKSPACE_SECTION_SCROLL_ID[key]);
  if (!el) return;
  if (
    !scrollWorkspaceSectionIntoView(el, {
      container: scrollContainer,
    })
  ) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function WorkspaceSectionsProvider({
  appointmentId,
  stage,
  scrollContainerRef,
  children,
}: {
  appointmentId: string;
  stage: AppointmentStage;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [collapsedBySection, setCollapsedBySection] = useState(() =>
    defaultCollapsedBySection(stage),
  );
  const [scrollRequest, setScrollRequest] =
    useState<WorkspaceScrollRequest | null>(null);

  const prevAppointmentIdRef = useRef<string | null>(null);
  const prevStageRef = useRef<AppointmentStage | null>(null);
  const scrollTokenRef = useRef(0);

  useEffect(() => {
    const appointmentChanged = prevAppointmentIdRef.current !== appointmentId;
    const stageChanged = prevStageRef.current !== stage;

    prevAppointmentIdRef.current = appointmentId;
    prevStageRef.current = stage;

    if (!appointmentChanged && !stageChanged) return;

    setCollapsedBySection(defaultCollapsedBySection(stage));

    const activeKey = workspaceSectionKeyForStage(stage);
    if (!activeKey) {
      setScrollRequest(null);
      return;
    }

    scrollTokenRef.current += 1;
    setScrollRequest({ token: scrollTokenRef.current, key: activeKey });
  }, [appointmentId, stage]);

  useLayoutEffect(() => {
    if (!scrollRequest) return;

    const { key } = scrollRequest;
    const container = scrollContainerRef?.current ?? null;

    const scroll = () => scrollToWorkspaceSection(key, container);

    scroll();
    const frame = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(frame);
  }, [scrollRequest, scrollContainerRef]);

  const isCollapsed = useCallback(
    (key: WorkspacePipelineSectionKey) => collapsedBySection[key],
    [collapsedBySection],
  );

  const toggleCollapsed = useCallback((key: WorkspacePipelineSectionKey) => {
    setCollapsedBySection((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const value = useMemo(
    (): WorkspaceSectionsContextValue => ({
      isCollapsed,
      toggleCollapsed,
      scrollIdFor: (key) => WORKSPACE_SECTION_SCROLL_ID[key],
      sectionSurfaceClass: "scroll-mt-3",
    }),
    [isCollapsed, toggleCollapsed],
  );

  return (
    <WorkspaceSectionsContext.Provider value={value}>
      {children}
    </WorkspaceSectionsContext.Provider>
  );
}

export function useWorkspaceSection(key: WorkspacePipelineSectionKey) {
  const ctx = useContext(WorkspaceSectionsContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceSection must be used within WorkspaceSectionsProvider",
    );
  }
  return {
    collapsed: ctx.isCollapsed(key),
    toggleCollapsed: () => ctx.toggleCollapsed(key),
    scrollId: ctx.scrollIdFor(key),
    sectionSurfaceClass: ctx.sectionSurfaceClass,
  };
}
