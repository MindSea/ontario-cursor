"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ListFilter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";
import { filterAppointmentsByPatientNameSubstring } from "./patient-search-match";
import {
  collectDistinctSorted,
  filterAppointmentsForScheduleToolbar,
} from "./schedule-appointment-filters";
import type { BuildingPresenceBucket } from "./schedule-building-filter";
import {
  BUILDING_PRESENCE_BUCKET_LABEL,
  BUILDING_PRESENCE_BUCKET_ORDER,
  appointmentInBuilding,
} from "./schedule-building-filter";

const PATIENT_SEARCH_DEBOUNCE_MS = 200;

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
  /** `mobileChrome`: toolbar above mobile tabs; collapsible filters; full-width dropdowns when open. */
  layout?: "default" | "mobileChrome";
  /** When `layout` is `mobileChrome`, shown on the left of the icon row (e.g. sidebar trigger). */
  mobileChromeLeading?: ReactNode;
};

type FilterMenuId = "status" | "pcp" | "navigator";

function toggleStringInList(
  list: readonly string[],
  value: string,
  on: boolean,
): string[] {
  if (on) return list.includes(value) ? [...list] : [...list, value];
  return list.filter((x) => x !== value);
}

/** Both status buckets selected = no filter (same as empty). */
function normalizeBuildingBuckets(
  next: readonly BuildingPresenceBucket[],
): BuildingPresenceBucket[] {
  if (
    next.length === BUILDING_PRESENCE_BUCKET_ORDER.length &&
    BUILDING_PRESENCE_BUCKET_ORDER.every((b) => next.includes(b))
  ) {
    return [];
  }
  return [...next];
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
  fullWidth = false,
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
  fullWidth?: boolean;
}) {
  const open = openMenu === menuId;
  const listboxDomId = `${idPrefix}-filter-${menuId}-listbox`;

  const summary =
    selected.length === 0 ? "All" : `${selected.length} selected`;

  return (
    <div
      className={cn(
        "relative shrink-0",
        open && "z-30",
        fullWidth
          ? "w-full min-w-0 max-w-none"
          : "w-[10.5rem] min-w-[8rem] max-w-[12rem]",
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full min-w-0 justify-between gap-1.5 px-2.5"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxDomId}
        onClick={() => setOpenMenu(open ? null : menuId)}
      >
        <span className="min-w-0 truncate text-left text-sm">
          <span className="text-muted-foreground">{categoryLabel}</span>
          <span className="text-muted-foreground">: </span>
          <span className="text-foreground">{summary}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
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
            "absolute left-0 top-full z-[100] mt-1 rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md",
            textBody,
            fullWidth
              ? "right-0 w-full min-w-0"
              : "w-[min(100vw-2rem,16rem)] max-w-[min(100vw-2rem,16rem)]",
          )}
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain py-0.5">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted"
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
          <div className="border-t border-border/60 p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-center text-sm text-muted-foreground hover:text-foreground"
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

function formatDobForList(isoDob: string): string {
  try {
    return format(parseISO(isoDob), "MMM d, yyyy");
  } catch {
    return isoDob;
  }
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
}: ScheduleToolbarProps) {
  const isMobileChrome = layout === "mobileChrome";
  const listboxId = `${idPrefix}-patient-listbox`;
  const comboRef = useRef<HTMLDivElement>(null);
  const filterChromeRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenuId | null>(
    null,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQuery(patientSearchQuery.trim());
    }, PATIENT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [patientSearchQuery]);

  useEffect(() => {
    if (patientSearchQuery.trim()) return;
    queueMicrotask(() => setPanelOpen(false));
  }, [patientSearchQuery]);

  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = comboRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [panelOpen]);

  useEffect(() => {
    if (!isMobileChrome || !searchSheetOpen) return;
    const id = `${idPrefix}-patient-search`;
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [idPrefix, isMobileChrome, searchSheetOpen]);

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

  const nameMatches = useMemo(() => {
    const raw = filterAppointmentsByPatientNameSubstring(
      allAppointments,
      debouncedQuery,
    );
    return [...raw].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      const t = a.time.localeCompare(b.time, undefined, { numeric: true });
      if (t !== 0) return t;
      return a.id.localeCompare(b.id);
    });
  }, [allAppointments, debouncedQuery]);

  const showSuggestions =
    panelOpen && debouncedQuery.length >= 2;

  const pickAppointment = useCallback(
    (apt: Appointment) => {
      onPatientSearchQueryChange("");
      setPanelOpen(false);
      setOpenFilterMenu(null);
      if (isMobileChrome) {
        setFilterSheetOpen(false);
        setSearchSheetOpen(false);
      }
      onNavigateToAppointment(apt);
    },
    [isMobileChrome, onNavigateToAppointment, onPatientSearchQueryChange],
  );

  const hasActiveFilters =
    selectedBuildingBuckets.length > 0 ||
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

  const filterDropdownControls = (fullWidth: boolean) => (
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
          onChangeSelectedBuildingBuckets(
            normalizeBuildingBuckets(next as BuildingPresenceBucket[]),
          )
        }
        formatOptionLabel={(opt) =>
          BUILDING_PRESENCE_BUCKET_LABEL[opt as BuildingPresenceBucket]
        }
        fullWidth={fullWidth}
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
      />
    </>
  );

  const filterDropdownsGroupDesktop = (
    <div className="flex shrink-0 flex-nowrap items-stretch gap-2">
      {filterDropdownControls(false)}
    </div>
  );

  const patientSearchField = (
    <div
      ref={comboRef}
      className={cn(
        "relative min-h-9",
        isMobileChrome
          ? "w-full min-w-0 max-w-none"
          : "w-full min-w-0 max-w-[15rem] shrink-0 md:max-w-xs lg:max-w-sm",
      )}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={`${idPrefix}-patient-search`}
          role="combobox"
          aria-label="Patient search"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={patientSearchQuery}
          onChange={(e) => {
            onPatientSearchQueryChange(e.target.value);
            setPanelOpen(true);
          }}
          onFocus={() => setPanelOpen(true)}
          placeholder="Search by patient name…"
          className="h-9 pl-9"
          autoComplete="off"
        />
      </div>
      {showSuggestions ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-100 mt-1 max-h-60 min-w-0 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md",
          )}
        >
          {nameMatches.length === 0 ? (
            <li
              role="presentation"
              className={cn("px-3 py-2", textMeta, "text-muted-foreground")}
            >
              No matching patients
            </li>
          ) : (
            nameMatches.map((apt) => (
              <li key={apt.id} role="presentation" className="min-w-0">
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted",
                    textBody,
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickAppointment(apt)}
                >
                  <span className="font-medium text-foreground">
                    {apt.patientName}
                  </span>
                  <span className={cn(textMeta, "text-muted-foreground")}>
                    DOB {formatDobForList(apt.dateOfBirth)}
                  </span>
                  <span className={cn(textMeta, "line-clamp-2 text-muted-foreground")}>
                    {format(parseISO(apt.date), "EEE MMM d")} · {apt.time} ·{" "}
                    {apt.reason}
                  </span>
                  <span className={cn("text-[11px] leading-tight text-muted-foreground")}>
                    {appointmentInBuilding(apt.stage) ? "In building" : "Not in building"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );

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
                normalizeBuildingBuckets(
                  selectedBuildingBuckets.filter((x) => x !== b),
                ),
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

  const filterSummaryRow = (
    <div className="flex min-w-0 flex-nowrap items-center justify-start gap-2 overflow-x-auto">
      {filterChips}
      {hasActiveFilters ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto shrink-0 px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
        >
          Clear all filters
        </Button>
      ) : null}
      {hasActiveFilters ? (
        <span
          className="shrink-0 text-muted-foreground/80"
          aria-hidden
        >
          ·
        </span>
      ) : null}
      <p
        className={cn(
          textMeta,
          "m-0 shrink-0 whitespace-nowrap tabular-nums text-muted-foreground",
        )}
      >
        <span className="font-medium text-foreground/80">{visibleCount}</span>{" "}
        appointment{visibleCount === 1 ? "" : "s"} match filters
      </p>
    </div>
  );

  const filterSummaryRowMobileSheet = (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {filterChips}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {hasActiveFilters ? (
          <>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto shrink-0 px-0 py-0 text-sm text-muted-foreground hover:text-foreground"
              onClick={clearAllFilters}
            >
              Clear all filters
            </Button>
            <span className="shrink-0 text-muted-foreground/80" aria-hidden>
              ·
            </span>
          </>
        ) : null}
        <p
          className={cn(
            textMeta,
            "m-0 min-w-0 tabular-nums text-muted-foreground",
          )}
        >
          <span className="font-medium text-foreground/80">{visibleCount}</span>{" "}
          appointment{visibleCount === 1 ? "" : "s"} match filters
        </p>
      </div>
    </div>
  );

  const controlsRow = (
    <div className="flex min-w-0 w-full flex-nowrap items-center justify-between gap-2">
      {filterDropdownsGroupDesktop}
      {patientSearchField}
    </div>
  );

  if (isMobileChrome) {
    const sheetOverlayZ = "z-[110]";
    const sheetContentZ = "z-[120]";
    const sheetFrameClass = cn(
      sheetContentZ,
      "flex min-h-[80dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-xl p-0 pt-2",
    );

    const filtersApplied = hasActiveFilters;

    return (
      <>
        <div
          className={cn(
            "flex h-12 w-full min-w-0 shrink-0 items-center gap-2 border-b border-border/60 bg-background",
            textBody,
            insetWithWorkspace ? "px-0" : "px-4",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {mobileChromeLeading}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
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

        <Sheet
          open={filterSheetOpen}
          onOpenChange={(open) => {
            setFilterSheetOpen(open);
            if (!open) setOpenFilterMenu(null);
          }}
        >
          <SheetContent
            side="bottom"
            overlayClassName={sheetOverlayZ}
            className={sheetFrameClass}
          >
            <SheetHeader className="shrink-0 text-left">
              <SheetTitle>Schedule filters</SheetTitle>
            </SheetHeader>
            <div
              ref={filterChromeRef}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6"
            >
              <div className="flex w-full min-w-0 flex-col gap-2">
                {filterDropdownControls(true)}
              </div>
              {filterSummaryRowMobileSheet}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
          <SheetContent
            side="bottom"
            overlayClassName={sheetOverlayZ}
            className={sheetFrameClass}
          >
            <SheetHeader className="shrink-0 text-left">
              <SheetTitle>Patient search</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              {patientSearchField}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className={cn("border-b border-border/50 bg-background", textBody)}>
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 py-2",
          insetWithWorkspace ? "px-0" : "px-4 md:px-6",
        )}
      >
        <div
          ref={filterChromeRef}
          className="flex min-w-0 w-full flex-col gap-2"
        >
          {controlsRow}
          {filterSummaryRow}
        </div>
      </div>
    </div>
  );
}
