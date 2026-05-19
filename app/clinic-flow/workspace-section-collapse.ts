import type { AppointmentStage } from "./types";

/** Pipeline sections below the huddle card (stable scroll targets). */
export const WORKSPACE_PIPELINE_SECTION_KEYS = [
  "previsit",
  "intake",
  "rooming",
  "visit",
  "labs",
  "care-management",
  "wrap-up",
] as const;

export type WorkspacePipelineSectionKey =
  (typeof WORKSPACE_PIPELINE_SECTION_KEYS)[number];

export const WORKSPACE_SECTION_SCROLL_ID: Record<
  WorkspacePipelineSectionKey,
  string
> = {
  previsit: "workspace-section-previsit",
  intake: "workspace-section-intake",
  rooming: "workspace-section-rooming",
  visit: "workspace-section-visit",
  labs: "workspace-section-labs",
  "care-management": "workspace-section-care-management",
  "wrap-up": "workspace-section-wrap-up",
};

export function workspaceSectionKeyForStage(
  stage: AppointmentStage,
): WorkspacePipelineSectionKey | null {
  switch (stage) {
    case "PREVISIT":
      return "previsit";
    case "INTAKE":
      return "intake";
    case "ROOMING":
      return "rooming";
    case "VISIT":
      return "visit";
    case "LABS":
      return "labs";
    case "CARE MANAGEMENT":
      return "care-management";
    case "WRAP UP":
      return "wrap-up";
    case "COMPLETED":
      return null;
  }
}

export function defaultCollapsedBySection(
  stage: AppointmentStage,
): Record<WorkspacePipelineSectionKey, boolean> {
  const active = workspaceSectionKeyForStage(stage);
  return {
    previsit: active !== "previsit",
    intake: active !== "intake",
    rooming: active !== "rooming",
    visit: active !== "visit",
    labs: active !== "labs",
    "care-management": active !== "care-management",
    "wrap-up": active !== "wrap-up",
  };
}

/** Workspace tab panel / desktop column that scrolls pipeline sections. */
export const WORKSPACE_SCROLL_CONTAINER_ATTR = "data-workspace-scroll-container";

export const WORKSPACE_SCROLL_CONTAINER_SELECTOR = `[${WORKSPACE_SCROLL_CONTAINER_ATTR}]`;

export function isWorkspaceScrollContainer(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  return (
    overflowY === "auto" ||
    overflowY === "scroll" ||
    overflowY === "overlay"
  );
}

export function workspaceSectionScrollTopFromRects({
  containerScrollTop,
  containerScrollHeight,
  containerClientHeight,
  containerViewportTop,
  sectionViewportTop,
  scrollMarginTop = 0,
}: {
  containerScrollTop: number;
  containerScrollHeight: number;
  containerClientHeight: number;
  containerViewportTop: number;
  sectionViewportTop: number;
  scrollMarginTop?: number;
}): number {
  const top =
    sectionViewportTop -
    containerViewportTop +
    containerScrollTop -
    scrollMarginTop;
  const maxTop = Math.max(0, containerScrollHeight - containerClientHeight);
  return Math.min(Math.max(0, top), maxTop);
}

export function workspaceSectionScrollTop(
  container: HTMLElement,
  section: HTMLElement,
): number {
  const containerRect = container.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();
  const scrollMarginTop =
    Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
  return workspaceSectionScrollTopFromRects({
    containerScrollTop: container.scrollTop,
    containerScrollHeight: container.scrollHeight,
    containerClientHeight: container.clientHeight,
    containerViewportTop: containerRect.top,
    sectionViewportTop: sectionRect.top,
    scrollMarginTop,
  });
}

export function resolveWorkspaceScrollContainer(
  section: HTMLElement,
): HTMLElement | null {
  const labeled = section.closest(WORKSPACE_SCROLL_CONTAINER_SELECTOR);
  if (labeled instanceof HTMLElement && isWorkspaceScrollContainer(labeled)) {
    return labeled;
  }
  let parent = section.parentElement;
  while (parent) {
    if (isWorkspaceScrollContainer(parent)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function scrollWorkspaceSectionIntoView(
  section: HTMLElement,
  options?: {
    container?: HTMLElement | null;
    behavior?: ScrollBehavior;
  },
): boolean {
  const container =
    options?.container ?? resolveWorkspaceScrollContainer(section);
  if (!container) return false;
  container.scrollTo({
    top: workspaceSectionScrollTop(container, section),
    behavior: options?.behavior ?? "smooth",
  });
  return true;
}
