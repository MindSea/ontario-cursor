"use client";

import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ListFilter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  buildingPresenceFilterNarrows,
  buildingPresenceFilterTriggerSummary,
} from "./schedule-building-filter";
import { ScheduleFilterMultiSelectDropdown } from "./schedule-filter-multiselect-dropdown";
import { ScheduleFilterRadioSelectDropdown } from "./schedule-filter-radio-select-dropdown";
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
  /** Omit horizontal padding when a parent supplies workspace alignment (`max-w-6xl` + `px-3 md:px-8`). */
  insetWithWorkspace?: boolean;
  /** `mobileChrome`: title row + filter/search icon buttons opening sheets. `panel`: schedule panel chrome (inline from `md`, icons + sheets below). */
  layout?: "default" | "mobileChrome" | "panel";
  /** When `layout` is `mobileChrome`, shown on the left of the icon row (e.g. sidebar trigger). */
  mobileChromeLeading?: ReactNode;
  /**
   * When false, patient search is not rendered in this toolbar (e.g. desktop header hosts
   * {@link SchedulePatientSearch} directly).
   */
  showPatientSearch?: boolean;
  /**
   * Panel icon strip (`layout="panel"` below `md`): hide the search
   * icon entirely. Search is handled by the parent (Clinic Flow mobile
   * title bar uses its own inline-expand affordance, so the panel
   * chrome shouldn't duplicate it).
   */
  panelDetachSearchButton?: boolean;
  /**
   * When `layout="panel"`, render only the filters bottom-sheet portal
   * so the imperative open still works while visible chrome is hidden
   * (e.g. Clinic Flow mobile Workspace tab — filters still openable
   * from the schedule tab's icon row).
   */
  panelSheetsOnly?: boolean;
};

type FilterMenuId = "status" | "pcp" | "navigator";

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
  panelSheetsOnly = false,
}: ScheduleToolbarProps) {
  const isMobileChrome = layout === "mobileChrome";
  const isPanel = layout === "panel";
  const panelWide = useSchedulePanelInlineWide();
  /** Wide panel: optional collapse mirrors narrow icon row + sheets (`md+`). */
  const [panelWideCollapsed, setPanelWideCollapsed] = useState(false);
  /** Full-width patient search in mobile chrome and panel (any width). */
  const searchFieldContainerFullWidth = isMobileChrome || isPanel;
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenuId | null>(
    null,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  /* Outside-click / Esc dismissal is delegated to Radix Popover inside
   * `ScheduleFilterMultiSelectDropdown`. `openFilterMenu` state is still
   * tracked in the toolbar so that only one filter dropdown can be open at a
   * time and so toolbar-level teardowns (sheet close, panel collapse,
   * clear-all) can force-close it. */

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

  /**
   * True when at least one axis narrows the schedule. Status chips are
   * suppressed when both building buckets are selected (same as "All");
   * that state must not light the filter dot or show "Clear all filters".
   */
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
        <ScheduleFilterRadioSelectDropdown
          idPrefix={idPrefix}
          menuId="status"
          openMenu={openFilterMenu}
          setOpenMenu={(id) => setOpenFilterMenu(id as FilterMenuId | null)}
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
            buildingPresenceFilterTriggerSummary(sel as BuildingPresenceBucket[])
          }
          fullWidth={fullWidth}
          compact={compact}
        />
        <ScheduleFilterMultiSelectDropdown
          idPrefix={idPrefix}
          menuId="pcp"
          openMenu={openFilterMenu}
          setOpenMenu={(id) => setOpenFilterMenu(id as FilterMenuId | null)}
          categoryLabel="PCP"
          options={pcpOptions}
          selected={selectedPcps}
          onChangeSelected={onChangeSelectedPcps}
          fullWidth={fullWidth}
          compact={compact}
        />
        <ScheduleFilterMultiSelectDropdown
          idPrefix={idPrefix}
          menuId="navigator"
          openMenu={openFilterMenu}
          setOpenMenu={(id) => setOpenFilterMenu(id as FilterMenuId | null)}
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
      {buildingPresenceFilterNarrows(selectedBuildingBuckets)
        ? selectedBuildingBuckets.map((b) => (
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
          ))
        : null}
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

  /**
   * Filters bottom sheet. Patient search used to live in a sibling
   * sheet here; on mobile that's been replaced by an inline
   * expand-in-title-bar UX owned by `ClinicFlowMobile`, so this is the
   * only sheet the toolbar still owns.
   */
  const filterSheetPortal = (
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
  );

  const panelIconRow = (opts: {
    onOpenFilters: () => void;
    filtersActiveDot: boolean;
    pressedFilters: boolean;
    /** When true, the search affordance is provided by the parent
     * (Clinic Flow mobile title bar) so this row only renders filters. */
    hideSearchButton?: boolean;
  }) => (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background px-3 py-3",
        panelDetachSearchButton && "py-2",
        textBody,
      )}
    >
      {panelMatchCountLine}
      <div className="flex shrink-0 items-center gap-1.5">
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
    return filterSheetPortal;
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
              setPanelWideCollapsed(true);
            }}
          >
            Hide filters
          </Button>
        </div>
        <div
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
          hideSearchButton: panelDetachSearchButton,
          onOpenFilters: () => {
            setFilterSheetOpen(true);
          },
        })}
        {filterSheetPortal}
      </>
    );
  }

  if (isMobileChrome) {
    const filtersApplied = hasActiveFilters;

    return (
      <>
        <div
          className={cn(
            "flex h-12 w-full min-w-0 shrink-0 items-center gap-3 border-b border-border/60 bg-background",
            textBody,
            insetWithWorkspace ? "px-0" : "px-3 md:px-4",
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
          </div>
        </div>

        {filterSheetPortal}
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
        <div className="flex min-w-0 w-full flex-col gap-4">
          {controlsRow}
          {filterSummaryRow}
        </div>
      </div>
    </div>
  );
}
