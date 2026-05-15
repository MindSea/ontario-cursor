"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function toggleStringInList(
  list: readonly string[],
  value: string,
  on: boolean,
): string[] {
  if (on) return list.includes(value) ? [...list] : [...list, value];
  return list.filter((x) => x !== value);
}

/**
 * Multi-select dropdown: `Category: summary` trigger + checkbox list +
 * clear row. Shared by schedule toolbar and Inbox filters.
 */
export function ScheduleFilterMultiSelectDropdown({
  idPrefix,
  menuId,
  openMenu,
  setOpenMenu,
  categoryLabel,
  options,
  selected,
  onChangeSelected,
  formatOptionLabel,
  formatSummary,
  fullWidth = false,
  compact = false,
}: {
  idPrefix: string;
  menuId: string;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  categoryLabel: string;
  options: readonly string[];
  selected: readonly string[];
  onChangeSelected: (next: string[]) => void;
  formatOptionLabel?: (opt: string) => string;
  formatSummary?: (selected: readonly string[]) => string;
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const open = openMenu === menuId;
  const listboxDomId = `${idPrefix}-filter-${menuId}-listbox`;
  const triggerMeasureRef = useRef<HTMLDivElement>(null);
  const [popoverWidthPx, setPopoverWidthPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      queueMicrotask(() => setPopoverWidthPx(null));
      return;
    }
    const el = triggerMeasureRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setPopoverWidthPx(Math.round(w * 1000) / 1000);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const summary = formatSummary
    ? formatSummary(selected)
    : selected.length === 0
      ? "All"
      : `${selected.length}`;

  return (
    <div
      ref={triggerMeasureRef}
      className={cn(
        "relative shrink-0",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : compact
            ? "min-w-0 flex-1 basis-0"
            : "w-42 min-w-32 max-w-48",
      )}
    >
      <Popover
        open={open}
        onOpenChange={(next) => setOpenMenu(next ? menuId : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-full min-w-0 justify-between gap-1",
              compact
                ? "h-9 min-h-9 px-2.5 py-0"
                : "h-9 gap-1.5 px-3",
            )}
            aria-haspopup="listbox"
            aria-controls={open ? listboxDomId : undefined}
          >
            <span className="min-w-0 truncate text-left text-sm leading-snug">
              <span className="text-muted-foreground">{categoryLabel}</span>
              <span className="text-muted-foreground">: </span>
              <span
                className={cn(
                  "tabular-nums text-foreground",
                  compact && "font-semibold",
                )}
              >
                {summary}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "shrink-0 text-muted-foreground transition-transform",
                compact ? "size-3 opacity-80" : "size-3.5",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          style={
            popoverWidthPx != null
              ? { width: popoverWidthPx, minWidth: popoverWidthPx, maxWidth: "none" }
              : undefined
          }
          className={cn(
            "z-130",
            "min-w-0 rounded-md border border-border bg-popover p-0 text-sm leading-snug text-popover-foreground shadow-md",
            popoverWidthPx == null && "min-w-48 max-w-[min(100vw-1rem,20rem)]",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            id={listboxDomId}
            role="listbox"
            aria-multiselectable
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(s) =>
                    onChangeSelected(
                      toggleStringInList(selected, opt, s === true),
                    )
                  }
                />
                <span className="min-w-0 wrap-break-word leading-snug">
                  {formatOptionLabel ? formatOptionLabel(opt) : opt}
                </span>
              </label>
            ))}
          </div>
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-full justify-center text-sm leading-snug text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChangeSelected([]);
                setOpenMenu(null);
              }}
            >
              Clear filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
