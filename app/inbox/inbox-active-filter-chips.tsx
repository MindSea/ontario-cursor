"use client";

import { X } from "lucide-react";

import {
  summaryForDueDateFilter,
  type InboxDatePreset,
} from "./inbox-due-date-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function InboxActiveFilterChips({
  selectedPcps,
  onRemovePcp,
  selectedNavigators,
  onRemoveNavigator,
  datePreset,
  customFrom,
  customTo,
  onClearDueDate,
  onClearAll,
  hasDueDateFilter,
}: {
  selectedPcps: readonly string[];
  onRemovePcp: (pcp: string) => void;
  selectedNavigators: readonly string[];
  onRemoveNavigator: (nav: string) => void;
  datePreset: InboxDatePreset;
  customFrom: string | undefined;
  customTo: string | undefined;
  onClearDueDate: () => void;
  onClearAll: () => void;
  hasDueDateFilter: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      {selectedPcps.map((pcp) => (
        <Badge
          key={`pcp-${pcp}`}
          variant="secondary"
          className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
        >
          <span className="min-w-0 truncate">{pcp}</span>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${pcp} from PCP filter`}
            onClick={() => onRemovePcp(pcp)}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
      {selectedNavigators.map((nav) => (
        <Badge
          key={`nav-${nav}`}
          variant="secondary"
          className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
        >
          <span className="min-w-0 truncate">{nav}</span>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${nav} from navigator filter`}
            onClick={() => onRemoveNavigator(nav)}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
      {hasDueDateFilter ? (
        <Badge
          variant="secondary"
          className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
        >
          <span className="min-w-0 truncate">
            Due: {summaryForDueDateFilter(datePreset, customFrom, customTo)}
          </span>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Remove due date filter"
            onClick={onClearDueDate}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ) : null}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto min-w-0 px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
        onClick={onClearAll}
      >
        Clear all filters
      </Button>
    </div>
  );
}
