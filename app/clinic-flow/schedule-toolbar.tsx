"use client";

import type { MutableRefObject, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";
import {
  collectDistinctSorted,
  filterAppointmentsForScheduleToolbar,
} from "./schedule-appointment-filters";
import type { BuildingPresenceBucket } from "./schedule-building-filter";
import {
  BUILDING_PRESENCE_BUCKET_LABEL,
  BUILDING_PRESENCE_BUCKET_ORDER,
  buildingPresenceBucketsShowAll,
  buildingPresenceFilterNarrows,
} from "./schedule-building-filter";
import { SchedulePatientSearch } from "./schedule-patient-search";
import {
  SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS,
  SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS,
  SCHEDULE_BOTTOM_SHEET_HEADER_CLASS,
  SCHEDULE_BOTTOM_SHEET_TITLE_CLASS,
  SCHEDULE_SHEET_OVERLAY_CLASS,
  scheduleBottomSheetContentClass,
} from "./schedule-bottom-sheet-frame";

/** `md` breakpoint — inline schedule panel chrome vs icon + sheets. */
function useSchedulePanelInlineWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

export type ScheduleToolbarProps = {
  idPrefix: string;
  allAppointments: readonly Appointment[];
  selectedPcps: string[];
  onChangeSelectedPcps: (next: string[]) => void;
  selectedNavigators: string[];
  onChangeSelectedNavigators: (next: string[]) => void;
  selectedBuildingBuckets: BuildingPresenceBucket[];
  onChangeSelectedBuildingBuckets: (next: BuildingPresenceBucket[]) => void;
  patientSearchQuery: string;
  onPatientSearchQueryChange: (v: string) => void;
  onNavigateToAppointment: (appointment: Appointment) => void;
  /** Omit horizontal padding when a parent supplies workspace alignment (`max-w-6xl` + `px-4 md:px-8`). */
  insetWithWorkspace?: boolean;
  /** `mobileChrome`: title row + filter/search icon buttons opening sheets. `panel`: schedule panel chrome (inline from `md`, icons + sheets below). */
  layout?: "default" | "mobileChrome" | "panel";
  /** When `layout` is `mobileChrome`, shown on the left of the icon row (e.g. sidebar trigger). */
  mobileChromeLeading?: ReactNode;
  /**
   * When false, patient search is not rendered in this toolbar (e.g. desktop header hosts
   * {@link SchedulePatientSearch}). Sheets still include search when opened.
   */
  showPatientSearch?: boolean;
  /**
   * Panel icon strip (`layout="panel"` below `md`): hide search icon; open search via
   * {@link scheduleSheetsApiRef} (e.g. Clinic Flow mobile title bar).
   */
  panelDetachSearchButton?: boolean;
  /** Set by toolbar; call `openPatientSearch()` from a parent-placed control. */
  scheduleSheetsApiRef?: MutableRefObject<ScheduleSheetsApi | null>;
  /**
   * When `layout="panel"`, render only bottom-sheet portals (filters + search) so imperative
   * open still works while visible chrome is hidden (e.g. Clinic Flow mobile Workspace tab).
   */
  panelSheetsOnly?: boolean;
};

type FilterMenuId = "status" | "pcp" | "navigator";

/** Imperative hooks for schedule sheets (e.g. mobile header search icon). */
export type ScheduleSheetsApi = {
  openPatientSearch: () => void;
};

function toggleStringInList(
  list: readonly string[],
  value: string,
  on: boolean,
): string[] {
  if (on) return list.includes(value) ? [...list] : [...list, value];
  return list.filter((x) => x !== value);
}

function FilterMultiSelectDropdown({
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
  menuId: FilterMenuId;
  openMenu: FilterMenuId | null;
  setOpenMenu: (id: FilterMenuId | null) => void;
  categoryLabel: string;
  options: readonly string[];
  selected: readonly string[];
  onChangeSelected: (next: string[]) => void;
  formatOptionLabel?: (opt: string) => string;
  /** When set, controls the summary (e.g. `All` or a count). */
  formatSummary?: (selected: readonly string[]) => string;
  fullWidth?: boolean;
  /** Tighter single-line `Label: summary` for dense schedule panel (`md+`). */
  compact?: boolean;
}) {
  const open = openMenu === menuId;
  const listboxDomId = `${idPrefix}-filter-${menuId}-listbox`;

  const summary = formatSummary
    ? formatSummary(selected)
    : selected.length === 0
      ? "All"
      : `${selected.length}`;

  return (
    <div
      className={cn(
        "relative shrink-0",
        open && "z-30",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : compact
            ? "min-w-0 flex-1 basis-0"
            : "w-42 min-w-32 max-w-48",
      )}
    >
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
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxDomId}
        onClick={() => setOpenMenu(open ? null : menuId)}
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
      {open ? (
        <div
          id={listboxDomId}
          role="listbox"
          aria-multiselectable
          className={cn(
            "absolute top-full z-100 mt-1 rounded-md border border-border bg-popover py-1 text-sm leading-snug text-popover-foreground shadow-md",
            fullWidth
              ? "left-0 right-0 w-full min-w-0"
              : menuId === "navigator"
                ? "right-0 left-auto w-[min(100vw-1rem,16rem)] max-w-[min(100vw-1rem,16rem)]"
                : menuId === "pcp"
                  ? "left-1/2 w-[min(100vw-1rem,16rem)] max-w-[min(100vw-1rem,16rem)] -translate-x-1/2"
                  : "left-0 w-[min(100vw-1rem,16rem)] max-w-[min(100vw-1rem,16rem)]",
          )}
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain py-0.5">
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
        </div>
      ) : null}
    </div>
  );
}

export function ScheduleToolbar({
  idPrefix,
  allAppointments,
  selectedPcps,
  onChangeSelectedPcps,
  selectedNavigators,
  onChangeSelectedNavigators,
  selectedBuildingBuckets,
  onChangeSelectedBuildingBuckets,
  patientSearchQuery,
  onPatientSearchQueryChange,
  onNavigateToAppointment,
  insetWithWorkspace = false,
  layout = "default",
  mobileChromeLeading,
  showPatientSearch = true,
  panelDetachSearchButton = false,
  scheduleSheetsApiRef,
  panelSheetsOnly = false,
}: ScheduleToolbarProps) {
  const isMobileChrome = layout === "mobileChrome";
  const isPanel = layout === "panel";
  const panelWide = useSchedulePanelInlineWide();
  /** Wide panel: optional collapse mirrors narrow icon row + sheets (`md+`). */
  const [panelWideCollapsed, setPanelWideCollapsed] = useState(false);
  const panelUsesIconSheets = isPanel && !panelWide;
  const useSheetChrome = isMobileChrome || panelUsesIconSheets;
  /** Full-width patient search in mobile chrome, panel (any width), and filter sheets. */
  const searchFieldContainerFullWidth = isMobileChrome || isPanel;
  const filterChromeRef = useRef<HTMLDivElement>(null);
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenuId | null>(
    null,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);

  useEffect(() => {
    if (!useSheetChrome || !searchSheetOpen) return;
    const id = `${idPrefix}-patient-search`;
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [idPrefix, useSheetChrome, searchSheetOpen]);

  useEffect(() => {
    if (!openFilterMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = filterChromeRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpenFilterMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilterMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openFilterMenu]);

  const pcpOptions = useMemo(
    () => collectDistinctSorted(allAppointments.map((a) => a.pcp)),
    [allAppointments],
  );
  const navigatorOptions = useMemo(
    () => collectDistinctSorted(allAppointments.map((a) => a.navigator)),
    [allAppointments],
  );

  const visibleCount = useMemo(
    () =>
      filterAppointmentsForScheduleToolbar(allAppointments, {
        selectedPcps,
        selectedNavigators,
        selectedBuildingBuckets,
      }).length,
    [allAppointments, selectedPcps, selectedNavigators, selectedBuildingBuckets],
  );

  const afterPatientPickFromSheet = useCallback(() => {
    setOpenFilterMenu(null);
    if (useSheetChrome) {
      setFilterSheetOpen(false);
      setSearchSheetOpen(false);
    }
  }, [useSheetChrome]);

  const openPatientSearchSheet = useCallback(() => {
    setOpenFilterMenu(null);
    setFilterSheetOpen(false);
    setSearchSheetOpen(true);
  }, []);

  useEffect(() => {
    if (!scheduleSheetsApiRef) return;
    scheduleSheetsApiRef.current = {
      openPatientSearch: openPatientSearchSheet,
    };
    return () => {
      scheduleSheetsApiRef.current = null;
    };
  }, [scheduleSheetsApiRef, openPatientSearchSheet]);

  const hasActiveFilters =
    buildingPresenceFilterNarrows(selectedBuildingBuckets) ||
    selectedPcps.length > 0 ||
    selectedNavigators.length > 0;

  const clearAllFilters = useCallback(() => {
    onChangeSelectedBuildingBuckets([]);
    onChangeSelectedPcps([]);
    onChangeSelectedNavigators([]);
    setOpenFilterMenu(null);
  }, [
    onChangeSelectedBuildingBuckets,
    onChangeSelectedPcps,
    onChangeSelectedNavigators,
  ]);

  const filterDropdownControls = (opts: {
    fullWidth: boolean;
    compact?: boolean;
  }) => {
    const { fullWidth, compact = false } = opts;
    return (
      <>
        <FilterMultiSelectDropdown
          idPrefix={idPrefix}
          menuId="status"
          openMenu={openFilterMenu}
          setOpenMenu={setOpenFilterMenu}
          categoryLabel="Status"
          options={BUILDING_PRESENCE_BUCKET_ORDER}
          selected={selectedBuildingBuckets}
          onChangeSelected={(next) =>
            onChangeSelectedBuildingBuckets([...(next as BuildingPresenceBucket[])])
          }
          formatOptionLabel={(opt) =>
            BUILDING_PRESENCE_BUCKET_LABEL[opt as BuildingPresenceBucket]
          }
          formatSummary={(sel) =>
            buildingPresenceBucketsShowAll(sel as BuildingPresenceBucket[])
              ? "All"
              : `${sel.length}`
          }
          fullWidth={fullWidth}
          compact={compact}
        />
        <FilterMultiSelectDropdown
          idPrefix={idPrefix}
          menuId="pcp"
          openMenu={openFilterMenu}
          setOpenMenu={setOpenFilterMenu}
          categoryLabel="PCP"
          options={pcpOptions}
          selected={selectedPcps}
          onChangeSelected={onChangeSelectedPcps}
          fullWidth={fullWidth}
          compact={compact}
        />
        <FilterMultiSelectDropdown
          idPrefix={idPrefix}
          menuId="navigator"
          openMenu={openFilterMenu}
          setOpenMenu={setOpenFilterMenu}
          categoryLabel="Navigator"
          options={navigatorOptions}
          selected={selectedNavigators}
          onChangeSelected={onChangeSelectedNavigators}
          fullWidth={fullWidth}
          compact={compact}
        />
      </>
    );
  };

  const filterDropdownsGroupDesktop = (
    <div className="flex shrink-0 flex-nowrap items-stretch gap-3">
      {filterDropdownControls({ fullWidth: false })}
    </div>
  );

  const searchInSheet = (
    <SchedulePatientSearch
      idPrefix={idPrefix}
      allAppointments={allAppointments}
      patientSearchQuery={patientSearchQuery}
      onPatientSearchQueryChange={onPatientSearchQueryChange}
      onNavigateToAppointment={onNavigateToAppointment}
      fullWidth
      onAfterPick={afterPatientPickFromSheet}
    />
  );

  const searchInToolbar = showPatientSearch ? (
    <SchedulePatientSearch
      idPrefix={idPrefix}
      allAppointments={allAppointments}
      patientSearchQuery={patientSearchQuery}
      onPatientSearchQueryChange={onPatientSearchQueryChange}
      onNavigateToAppointment={onNavigateToAppointment}
      fullWidth={searchFieldContainerFullWidth}
    />
  ) : null;

  const filterChips = (
    <>
      {selectedBuildingBuckets.map((b) => (
        <Badge
          key={`status-${b}`}
          variant="secondary"
          className="max-w-full shrink-0 gap-0.5 py-0 pl-2 pr-0.5 font-normal"
        >
          <span className="min-w-0 truncate">
            {BUILDING_PRESENCE_BUCKET_LABEL[b]}
          </span>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${BUILDING_PRESENCE_BUCKET_LABEL[b]} status filter`}
            onClick={() =>
              onChangeSelectedBuildingBuckets(
                selectedBuildingBuckets.filter((x) => x !== b),
              )
            }
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
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
            onClick={() =>
              onChangeSelectedPcps(selectedPcps.filter((x) => x !== pcp))
            }
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
            onClick={() =>
              onChangeSelectedNavigators(
                selectedNavigators.filter((x) => x !== nav),
              )
            }
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
    </>
  );

  const matchFiltersSummaryInner = (
    <>
      <span className="font-medium text-foreground/80">{visibleCount}</span>{" "}
      appointment{visibleCount === 1 ? "" : "s"} match filters
    </>
  );

  const panelMatchCountLine = (
    <p
      className={cn(
        textMeta,
        "m-0 min-w-0 flex-1 text-left tabular-nums text-muted-foreground",
      )}
    >
      {matchFiltersSummaryInner}
    </p>
  );

  /** Chips + clear only (match count lives in the wide-panel status strip). */
  const filterSummaryChipsAndClear = (
    <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-2">
      {filterChips}
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto min-w-0 px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
        >
          Clear all filters
        </Button>
      ) : null}
    </div>
  );

  const filterSummaryRow = (
    <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-2">
      {filterChips}
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto min-w-0 px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
        >
          Clear all filters
        </Button>
      ) : null}
      {hasActiveFilters ? (
        <span className="text-muted-foreground/80" aria-hidden>
          ·
        </span>
      ) : null}
      <p
        className={cn(
          textMeta,
          "m-0 min-w-0 max-w-full tabular-nums text-muted-foreground",
        )}
      >
        <span className="font-medium text-foreground/80">{visibleCount}</span>{" "}
        appointment{visibleCount === 1 ? "" : "s"} match filters
      </p>
    </div>
  );

  const controlsRow = (
    <div className="flex min-w-0 w-full flex-col gap-4">
      {searchInToolbar}
      {filterDropdownsGroupDesktop}
    </div>
  );

  const sheetFrameClass = scheduleBottomSheetContentClass();

  const filterSearchSheets = (
    <>
      <Sheet
        open={filterSheetOpen}
        onOpenChange={(open) => {
          setFilterSheetOpen(open);
          if (!open) setOpenFilterMenu(null);
        }}
      >
        <SheetContent
          side="bottom"
          overlayClassName={SCHEDULE_SHEET_OVERLAY_CLASS}
          className={sheetFrameClass}
        >
          <SheetHeader className={SCHEDULE_BOTTOM_SHEET_HEADER_CLASS}>
            <SheetTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
              Schedule filters
            </SheetTitle>
          </SheetHeader>
          <div className={SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS}>
            <div
              ref={filterChromeRef}
              className={cn(
                SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS,
                "flex flex-col gap-4 px-2",
              )}
            >
              <div className="flex w-full min-w-0 flex-col gap-2">
                {filterDropdownControls({ fullWidth: true, compact: true })}
              </div>
              {filterSummaryChipsAndClear}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
        <SheetContent
          side="bottom"
          overlayClassName={SCHEDULE_SHEET_OVERLAY_CLASS}
          className={sheetFrameClass}
        >
          <SheetHeader className={SCHEDULE_BOTTOM_SHEET_HEADER_CLASS}>
            <SheetTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
              Patient search
            </SheetTitle>
          </SheetHeader>
          <div className={SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS}>
            <div className={cn(SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS, "px-2")}>
              {searchInSheet}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );

  const panelIconRow = (opts: {
    onOpenFilters: () => void;
    onOpenSearch: () => void;
    filtersActiveDot: boolean;
    pressedFilters: boolean;
    pressedSearch: boolean;
    hideSearchButton?: boolean;
  }) => (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background px-4 py-3",
        panelDetachSearchButton && "py-2",
        textBody,
      )}
    >
      {panelMatchCountLine}
      <div className="flex shrink-0 items-center gap-1.5">
        {!opts.hideSearchButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg"
            aria-label="Open patient search"
            aria-pressed={opts.pressedSearch}
            onClick={opts.onOpenSearch}
          >
            <Search className="size-5 text-foreground" aria-hidden />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 rounded-lg"
          aria-label={
            opts.filtersActiveDot
              ? "Open schedule filters, filters applied"
              : "Open schedule filters"
          }
          aria-pressed={opts.pressedFilters}
          onClick={opts.onOpenFilters}
        >
          <ListFilter className="size-5 text-foreground" aria-hidden />
          {opts.filtersActiveDot ? (
            <span
              className="absolute right-1 top-1 size-1.5 rounded-full bg-primary shadow-sm ring-2 ring-background"
              aria-hidden
            />
          ) : null}
        </Button>
      </div>
    </div>
  );

  if (isPanel && panelSheetsOnly) {
    return <>{filterSearchSheets}</>;
  }

  if (isPanel && panelWide && panelWideCollapsed) {
    return (
      <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background px-4 py-3">
        {panelMatchCountLine}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-3 text-sm font-medium text-foreground"
          onClick={() => setPanelWideCollapsed(false)}
        >
          Show filters
        </Button>
      </div>
    );
  }

  if (isPanel && panelWide) {
    return (
      <div
        className={cn(
          "flex min-w-0 flex-col border-b border-border/40 bg-background",
          textBody,
        )}
      >
        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-1.5">
          {panelMatchCountLine}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-3 text-sm font-medium text-foreground"
            onClick={() => {
              setOpenFilterMenu(null);
              setFilterSheetOpen(false);
              setSearchSheetOpen(false);
              setPanelWideCollapsed(true);
            }}
          >
            Hide filters
          </Button>
        </div>
        <div
          ref={filterChromeRef}
          className={cn(
            "flex min-w-0 w-full flex-col px-4 pb-3 pt-1.5",
            hasActiveFilters ? "gap-2" : "gap-0",
          )}
        >
          <div className="flex min-w-0 w-full flex-nowrap items-stretch gap-2 sm:gap-3">
            {filterDropdownControls({ fullWidth: false, compact: true })}
          </div>
          {filterSummaryChipsAndClear}
        </div>
      </div>
    );
  }

  if (isPanel && !panelWide) {
    const filtersApplied = hasActiveFilters;
    return (
      <>
        {panelIconRow({
          filtersActiveDot: filtersApplied,
          pressedFilters: filterSheetOpen,
          pressedSearch: searchSheetOpen,
          hideSearchButton: panelDetachSearchButton,
          onOpenFilters: () => {
            setSearchSheetOpen(false);
            setFilterSheetOpen(true);
          },
          onOpenSearch: () => {
            setOpenFilterMenu(null);
            setFilterSheetOpen(false);
            setSearchSheetOpen(true);
          },
        })}
        {filterSearchSheets}
      </>
    );
  }

  if (isMobileChrome) {
    const filtersApplied = hasActiveFilters;

    return (
      <>
        <div
          className={cn(
            "flex min-h-12 w-full min-w-0 shrink-0 items-center gap-3 border-b border-border/60 bg-background py-2",
            textBody,
            insetWithWorkspace ? "px-0" : "px-4",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {mobileChromeLeading}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative size-9 shrink-0 rounded-lg"
              aria-label={
                filtersApplied
                  ? "Open schedule filters, filters applied"
                  : "Open schedule filters"
              }
              onClick={() => {
                setSearchSheetOpen(false);
                setFilterSheetOpen(true);
              }}
            >
              <ListFilter className="size-5 text-foreground" aria-hidden />
              {filtersApplied ? (
                <span
                  className="absolute right-1 top-1 size-1.5 rounded-full bg-primary shadow-sm ring-2 ring-background"
                  aria-hidden
                />
              ) : null}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              aria-label="Open patient search"
              onClick={() => {
                setOpenFilterMenu(null);
                setFilterSheetOpen(false);
                setSearchSheetOpen(true);
              }}
            >
              <Search className="size-5 text-foreground" aria-hidden />
            </Button>
          </div>
        </div>

        {filterSearchSheets}
      </>
    );
  }

  return (
    <div className={cn("border-b border-border/50 bg-background", textBody)}>
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-4 py-4",
          insetWithWorkspace ? "px-0" : "px-4 md:px-6",
        )}
      >
        <div
          ref={filterChromeRef}
          className="flex min-w-0 w-full flex-col gap-4"
        >
          {controlsRow}
          {filterSummaryRow}
        </div>
      </div>
    </div>
  );
}
