import { useSyncExternalStore } from "react";

export const MOBILE_BREAKPOINT = 768;

function subscribeMobile(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerMobileSnapshot() {
  return false;
}

/** Viewport below {@link MOBILE_BREAKPOINT}px (matches Tailwind `max-md`). */
export function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getServerMobileSnapshot,
  );
}
