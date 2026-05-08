"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** When the main inset is narrower than this, use the mobile shell (tabs + chrome). */
export const CLINIC_FLOW_INSET_MOBILE_THRESHOLD_PX = 920;

const VIEWPORT_MOBILE_MAX_PX = 767;

export function useClinicFlowShellLayout() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [insetNarrow, setInsetNarrow] = useState(false);
  const [viewportMobile, setViewportMobile] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mq = window.matchMedia(`(max-width: ${VIEWPORT_MOBILE_MAX_PX}px)`);
    const syncViewport = () => setViewportMobile(mq.matches);
    syncViewport();
    mq.addEventListener("change", syncViewport);

    const ro = new ResizeObserver(() => {
      setInsetNarrow(root.clientWidth < CLINIC_FLOW_INSET_MOBILE_THRESHOLD_PX);
    });
    ro.observe(root);
    setInsetNarrow(root.clientWidth < CLINIC_FLOW_INSET_MOBILE_THRESHOLD_PX);

    return () => {
      mq.removeEventListener("change", syncViewport);
      ro.disconnect();
    };
  }, []);

  const showMobileShell = viewportMobile || insetNarrow;

  return { rootRef, showMobileShell };
}
