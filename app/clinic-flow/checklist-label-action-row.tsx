"use client";

import type { ReactNode } from "react";

import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

export type ChecklistLabelActionRowProps = {
  labelId: string;
  checked: boolean;
  /** Trailing controls (outline buttons, selects, etc.). Omit for label-only rows. */
  actions?: ReactNode;
  /** Applied to the actions container when the row checkbox is checked (e.g. opacity). */
  actionsWhenCheckedClassName?: string;
  children: ReactNode;
};

/**
 * One-line header strip: checkbox label (wraps) + right-aligned actions, top-aligned.
 * Same grid contract as Labs bundle rows for consistent workspace rhythm.
 */
export function ChecklistLabelActionRow({
  labelId,
  checked,
  actions,
  actionsWhenCheckedClassName,
  children,
}: ChecklistLabelActionRowProps) {
  if (actions === undefined || actions === null) {
    return (
      <label
        htmlFor={labelId}
        className={cn(
          "min-w-0 cursor-pointer wrap-break-word select-none",
          textBody,
          checked && "text-muted-foreground/50 line-through",
        )}
      >
        {children}
      </label>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
      <label
        htmlFor={labelId}
        className={cn(
          "min-w-0 cursor-pointer wrap-break-word select-none",
          textBody,
          checked && "text-muted-foreground/50 line-through",
        )}
      >
        {children}
      </label>
      <div
        className={cn(
          "flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2",
          checked && actionsWhenCheckedClassName,
        )}
      >
        {actions}
      </div>
    </div>
  );
}
