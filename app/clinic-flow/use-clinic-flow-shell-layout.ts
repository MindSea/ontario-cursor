"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** At md+ viewport, use the tabbed mobile shell when the main column is narrower than this. */
export const CLINIC_FLOW_INSET_MOBILE_THRESHOLD_PX = 920;

/**
 * Measures the clinic-flow root width. Defaults to `insetNarrow === false` so a wide desktop
 * refresh does not flash the mobile shell — container-query-based visibility could match while
 * inline-size was still 0 before the first layout pass.
 */
export function useClinicFlowShellLayout() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [insetNarrow, setInsetNarrow] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      setInsetNarrow(
        root.clientWidth < CLINIC_FLOW_INSET_MOBILE_THRESHOLD_PX,
      );
    };

    const ro = new ResizeObserver(sync);
    ro.observe(root);
    sync();

    return () => ro.disconnect();
  }, []);

  return { rootRef, insetNarrow };
}
