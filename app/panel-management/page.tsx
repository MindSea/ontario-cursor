"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { ScheduleFilterMultiSelectDropdown } from "@/app/clinic-flow/schedule-filter-multiselect-dropdown";
import { PatientProfileDialog } from "@/app/patient-profile/patient-profile-dialog";
import { listPatientsForPanelInbox } from "@/app/patient-profile/patient-profile-seed";
import { usePatientProfileUrlState } from "@/app/patient-profile/use-patient-profile-url-state";
import { AppPageHeaderWithSearch } from "@/components/app-page-header-with-search";
import { FilteredResultsEmptyState } from "@/components/filtered-results-empty-state";
import { fullBleedPageRootClass, panelTaskListColumnClass } from "@/lib/layout";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { PanelManagementBoard } from "./panel-management-board";
import { PanelManagementFilterChips } from "./panel-management-filter-chips";
import { PanelManagementFiltersSheet } from "./panel-management-filters-sheet";

export default function PanelManagementPage() {
  const filterIdPrefix = useId();
  const patientProfile = usePatientProfileUrlState();
  const roster = useMemo(() => listPatientsForPanelInbox(), []);

  const pcpOptions = useMemo(
    () =>
      [...new Set(roster.map((r) => r.pcpDisplayName))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [roster],
  );
  const navigatorOptions = useMemo(
    () =>
      [...new Set(roster.map((r) => r.navigatorDisplayName))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [roster],
  );

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPcps, setSelectedPcps] = useState<string[]>([]);
  const [selectedNavigators, setSelectedNavigators] = useState<string[]>([]);

  const [desktopFilterMenu, setDesktopFilterMenu] = useState<string | null>(
    null,
  );
  const [sheetFilterMenu, setSheetFilterMenu] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  type ToastAction = { label: string; onClick: () => void };
  type ToastState = { id: number; message: string; action?: ToastAction };
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const lifetime = toast.action ? 6000 : 2400;
    const id = toast.id;
    const t = window.setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, lifetime);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      setToast({ id: Date.now() + Math.random(), message, action });
    },
    [],
  );

  const hasActiveFilters =
    selectedPcps.length > 0 || selectedNavigators.length > 0;

  const clearAllFilters = useCallback(() => {
    setSelectedPcps([]);
    setSelectedNavigators([]);
    setDesktopFilterMenu(null);
    setSheetFilterMenu(null);
  }, []);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    return roster.filter((r) => {
      if (q && !r.displayName.toLowerCase().includes(q)) return false;
      if (
        selectedPcps.length > 0 &&
        !selectedPcps.includes(r.pcpDisplayName)
      ) {
        return false;
      }
      if (
        selectedNavigators.length > 0 &&
        !selectedNavigators.includes(r.navigatorDisplayName)
      ) {
        return false;
      }
      return true;
    });
  }, [roster, patientSearch, selectedPcps, selectedNavigators]);

  const filterChips = hasActiveFilters ? (
    <PanelManagementFilterChips
      selectedPcps={selectedPcps}
      onRemovePcp={(pcp) =>
        setSelectedPcps(selectedPcps.filter((x) => x !== pcp))
      }
      selectedNavigators={selectedNavigators}
      onRemoveNavigator={(nav) =>
        setSelectedNavigators(selectedNavigators.filter((x) => x !== nav))
      }
      onClearAll={clearAllFilters}
    />
  ) : null;

  return (
    <div className={fullBleedPageRootClass}>
      <div className="sticky top-0 z-30 shrink-0 border-b border-border/50 bg-background max-md:border-border/60">
        <AppPageHeaderWithSearch
          title="Panel Management"
          patientSearch={patientSearch}
          onPatientSearchChange={setPatientSearch}
          filtersActive={hasActiveFilters}
          filterSheetOpen={filterSheetOpen}
          onOpenFilters={() => setFilterSheetOpen(true)}
          filtersAriaLabel="Open panel filters"
        />

        {hasActiveFilters ? (
          <div className="max-md:border-b max-md:border-border/40 max-md:px-3 max-md:py-2 md:hidden">
            {filterChips}
          </div>
        ) : null}

        <div
          className={cn(
            "hidden md:block",
            "md:mx-auto md:max-w-6xl md:px-8 md:pt-3 md:pb-2",
          )}
        >
          <div className="mb-2 flex min-w-0 w-full flex-row flex-wrap items-stretch gap-3">
            <ScheduleFilterMultiSelectDropdown
              idPrefix={filterIdPrefix}
              menuId="pcp"
              openMenu={desktopFilterMenu}
              setOpenMenu={setDesktopFilterMenu}
              categoryLabel="PCP"
              options={pcpOptions}
              selected={selectedPcps}
              onChangeSelected={setSelectedPcps}
              fullWidth={false}
              compact={false}
            />
            <ScheduleFilterMultiSelectDropdown
              idPrefix={filterIdPrefix}
              menuId="navigator"
              openMenu={desktopFilterMenu}
              setOpenMenu={setDesktopFilterMenu}
              categoryLabel="Navigator"
              options={navigatorOptions}
              selected={selectedNavigators}
              onChangeSelected={setSelectedNavigators}
              fullWidth={false}
              compact={false}
            />
          </div>
          {filterChips}
        </div>
      </div>

      <div
        className={cn(
          "w-full min-w-0 flex-1",
          "max-md:px-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-md:pt-3",
          "md:mx-auto md:max-w-6xl md:px-8 md:pb-4 md:pt-3",
        )}
      >
        {filteredPatients.length === 0 ? (
          <div className={panelTaskListColumnClass}>
            <FilteredResultsEmptyState
              entity="patients"
              align="center"
              hasSearch={patientSearch.trim().length > 0}
              hasToolbarFilters={hasActiveFilters}
              onClearSearch={() => setPatientSearch("")}
              onClearFilters={clearAllFilters}
            />
          </div>
        ) : (
          <PanelManagementBoard
            patients={filteredPatients}
            showToast={showToast}
            onOpenPatientProfile={(id) => patientProfile.open(id, "panel")}
          />
        )}
      </div>

      <PanelManagementFiltersSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        idPrefix={filterIdPrefix}
        openFilterMenu={sheetFilterMenu}
        setOpenFilterMenu={setSheetFilterMenu}
        pcpOptions={pcpOptions}
        selectedPcps={selectedPcps}
        onChangeSelectedPcps={setSelectedPcps}
        navigatorOptions={navigatorOptions}
        selectedNavigators={selectedNavigators}
        onChangeSelectedNavigators={setSelectedNavigators}
      />

      <PatientProfileDialog
        patientId={patientProfile.patientId}
        section={patientProfile.section}
        onSectionChange={patientProfile.setSection}
        onRequestClose={patientProfile.close}
      />

      {toast && typeof document !== "undefined"
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none fixed bottom-6 left-1/2 z-200 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
                textBody,
              )}
            >
              <span className="min-w-0 flex-1">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                  className="pointer-events-auto shrink-0 rounded-md px-2 py-1 text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
