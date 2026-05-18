"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";

import { ToggleRadioFilterRow } from "@/components/toggle-radio-filter-row";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toggleRadioFilterValue } from "@/lib/toggle-radio-filter";
import { cn } from "@/lib/utils";

/**
 * Single-select filter dropdown: `Category: summary` trigger + toggleable radios.
 * Empty selection shows as “All” on the trigger (no All row in the menu).
 */
export function ScheduleFilterRadioSelectDropdown({
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
  const groupDomId = `${idPrefix}-filter-${menuId}-radiogroup`;
  const triggerMeasureRef = useRef<HTMLDivElement>(null);
  const [popoverWidthPx, setPopoverWidthPx] = useState<number | null>(null);

  const selectedValue = selected.length === 1 ? selected[0]! : null;

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
      : formatOptionLabel
        ? formatOptionLabel(selected[0]!)
        : selected[0]!;

  const applySelection = (next: string | null, closeMenu: boolean) => {
    onChangeSelected(next ? [next] : []);
    if (closeMenu) setOpenMenu(null);
  };

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
            aria-controls={open ? groupDomId : undefined}
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
          <RadioGroup
            id={groupDomId}
            value={selectedValue ?? ""}
            onValueChange={(value) => applySelection(value, true)}
            className="gap-0"
            aria-label={categoryLabel}
          >
            {options.map((opt) => {
              const itemId = `${idPrefix}-${menuId}-${opt}`;
              const checked = selectedValue === opt;
              return (
                <ToggleRadioFilterRow
                  key={opt}
                  optionValue={opt}
                  optionId={itemId}
                  checked={checked}
                  label={
                    formatOptionLabel ? (
                      <span className="wrap-break-word">{formatOptionLabel(opt)}</span>
                    ) : (
                      opt
                    )
                  }
                  onToggle={() => {
                    applySelection(
                      toggleRadioFilterValue(selectedValue, opt),
                      true,
                    );
                  }}
                />
              );
            })}
          </RadioGroup>
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
