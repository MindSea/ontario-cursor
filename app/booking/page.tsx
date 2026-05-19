"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";

import { useAppointmentsStore } from "@/app/clinic-flow/appointments-store";
import {
  CLINIC_FLOW_SEED_NAVIGATORS,
  CLINIC_FLOW_SEED_PCPS,
} from "@/app/clinic-flow/seed-appointments";
import { DEMO_ACCOUNT_NAVIGATOR } from "@/app/clinic-flow/schedule-constants";
import { filterAppointmentsForScheduleToolbar } from "@/app/clinic-flow/schedule-appointment-filters";
import { ScheduleFilterMultiSelectDropdown } from "@/app/clinic-flow/schedule-filter-multiselect-dropdown";
import { ScheduleDateRow } from "@/app/clinic-flow/schedule-date-row";
import type { Appointment } from "@/app/clinic-flow/types";
import { PatientProfileDialog } from "@/app/patient-profile/patient-profile-dialog";
import { usePatientProfileUrlState } from "@/app/patient-profile/use-patient-profile-url-state";
import { AppPageHeaderWithSearch } from "@/components/app-page-header-with-search";
import { fullBleedPageRootClass } from "@/lib/layout";
import { Button } from "@/components/ui/button";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { BookingAppointmentDialog } from "./booking-appointment-dialog";
import {
  appointmentDateKeyInRange,
  bookingViewRange,
  formatBookingAnchorLabel,
  shiftBookingAnchor,
  type BookingCalendarView,
} from "./booking-calendar-utils";
import {
  BookingCalendarPanel,
  BookingCalendarWeekViewport,
} from "./booking-calendar-viewport";
import { BookingDayView } from "./booking-day-view";
import { BookingFilterChips } from "./booking-filter-chips";
import { BookingFiltersSheet } from "./booking-filters-sheet";
import { BookingMonthView } from "./booking-month-view";
import { BookingViewToggle } from "./booking-view-toggle";
import {
  bookingCalendarScrollClass,
  bookingChromeContentPadClass,
  bookingChromeDateClass,
  bookingChromeFiltersClass,
  bookingChromeViewClass,
} from "./booking-sticky-stack";
import { BookingYearView } from "./booking-year-view";

const BOOKING_VIEW_STORAGE_KEY = "booking.calendarView";

function periodAriaLabels(view: BookingCalendarView): {
  prev: string;
  next: string;
} {
  switch (view) {
    case "day":
      return { prev: "Previous day", next: "Next day" };
    case "week":
      return { prev: "Previous week", next: "Next week" };
    case "month":
      return { prev: "Previous month", next: "Next month" };
    case "year":
      return { prev: "Previous year", next: "Next year" };
  }
}

export default function BookingPage() {
  const filterIdPrefix = useId();
  const {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointmentsStore();
  const patientProfile = usePatientProfileUrlState();

  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<BookingCalendarView>("week");

  useLayoutEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_VIEW_STORAGE_KEY);
      if (raw === "day" || raw === "week" || raw === "month" || raw === "year") {
        setView(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPcps, setSelectedPcps] = useState<string[]>([]);
  const [selectedNavigators, setSelectedNavigators] = useState<string[]>([
    DEMO_ACCOUNT_NAVIGATOR,
  ]);

  const [desktopFilterMenu, setDesktopFilterMenu] = useState<string | null>(
    null,
  );
  const [sheetFilterMenu, setSheetFilterMenu] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  type ToastState = { id: number; message: string };
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = toast.id;
    const t = window.setTimeout(() => {
      setToast((c) => (c && c.id === id ? null : c));
    }, 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleViewChange = useCallback((next: BookingCalendarView) => {
    setView(next);
    try {
      sessionStorage.setItem(BOOKING_VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const filteredByToolbar = useMemo(
    () =>
      filterAppointmentsForScheduleToolbar(appointments, {
        selectedPcps,
        selectedNavigators,
        selectedBuildingBuckets: [],
      }),
    [appointments, selectedPcps, selectedNavigators],
  );

  const filteredAppointments = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return filteredByToolbar;
    return filteredByToolbar.filter((a) =>
      a.patientName.toLowerCase().includes(q),
    );
  }, [filteredByToolbar, patientSearch]);

  const { start: viewStart, end: viewEnd } = useMemo(
    () => bookingViewRange(anchor, view),
    [anchor, view],
  );

  const appointmentsInView = useMemo(
    () =>
      filteredAppointments.filter((a) =>
        appointmentDateKeyInRange(a.date, viewStart, viewEnd),
      ),
    [filteredAppointments, viewStart, viewEnd],
  );

  const hasActiveFilters =
    selectedPcps.length > 0 || selectedNavigators.length > 0;

  const clearAllFilters = useCallback(() => {
    setSelectedPcps([]);
    setSelectedNavigators([]);
    setDesktopFilterMenu(null);
    setSheetFilterMenu(null);
  }, []);

  const centerLabel = formatBookingAnchorLabel(anchor, view);
  const { prev: prevAria, next: nextAria } = periodAriaLabels(view);

  const openCreate = useCallback(() => {
    setDialogMode("create");
    setEditingAppointment(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((apt: Appointment) => {
    setDialogMode("edit");
    setEditingAppointment(apt);
    setDialogOpen(true);
  }, []);

  const filterChips = hasActiveFilters ? (
    <BookingFilterChips
      selectedPcps={selectedPcps}
      onRemovePcp={(p) => setSelectedPcps(selectedPcps.filter((x) => x !== p))}
      selectedNavigators={selectedNavigators}
      onRemoveNavigator={(n) =>
        setSelectedNavigators(selectedNavigators.filter((x) => x !== n))
      }
      onClearAll={clearAllFilters}
    />
  ) : null;

  return (
    <div
      className={cn(
        fullBleedPageRootClass,
        "overflow-y-hidden max-md:overflow-y-hidden md:overflow-y-hidden",
      )}
    >
      <div className={bookingChromeFiltersClass}>
        <AppPageHeaderWithSearch
          title="Booking"
          patientSearch={patientSearch}
          onPatientSearchChange={setPatientSearch}
          filtersActive={hasActiveFilters}
          filterSheetOpen={filterSheetOpen}
          onOpenFilters={() => setFilterSheetOpen(true)}
          filtersAriaLabel="Open booking filters"
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
              options={[...CLINIC_FLOW_SEED_PCPS]}
              selected={selectedPcps}
              onChangeSelected={setSelectedPcps}
            />
            <ScheduleFilterMultiSelectDropdown
              idPrefix={filterIdPrefix}
              menuId="navigator"
              openMenu={desktopFilterMenu}
              setOpenMenu={setDesktopFilterMenu}
              categoryLabel="Navigator"
              options={[...CLINIC_FLOW_SEED_NAVIGATORS]}
              selected={selectedNavigators}
              onChangeSelected={setSelectedNavigators}
            />
          </div>
          {filterChips ? (
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              {filterChips}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={bookingChromeViewClass}
      >
        <div
          className={cn(
            bookingChromeContentPadClass,
            "flex flex-col gap-3 py-3 max-md:pt-2 md:flex-row md:items-center md:justify-between",
          )}
        >
          <BookingViewToggle
            value={view}
            onChange={handleViewChange}
            className="md:max-w-md"
          />
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden />
            New appointment
          </Button>
        </div>
      </div>

      <div className={bookingChromeDateClass}>
        <div className={bookingChromeContentPadClass}>
          <ScheduleDateRow
            selectedDate={anchor}
            centerLabel={centerLabel}
            prevPeriodAriaLabel={prevAria}
            nextPeriodAriaLabel={nextAria}
            onShiftDay={(delta) =>
              setAnchor((d) => shiftBookingAnchor(d, view, delta))
            }
            onGoToday={() => setAnchor(new Date())}
            fullBleed
            pinSticky={false}
          />
        </div>
      </div>

      {view === "day" || view === "week" ? (
        <BookingCalendarPanel>
          {view === "day" ? (
            <BookingDayView
              anchor={anchor}
              appointments={appointmentsInView}
              onSelectAppointment={openEdit}
              hasSearch={patientSearch.trim().length > 0}
              hasToolbarFilters={hasActiveFilters}
              onClearSearch={() => setPatientSearch("")}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <BookingCalendarWeekViewport
              anchor={anchor}
              appointments={appointmentsInView}
              onSelectAppointment={openEdit}
              onSelectDay={(day) => {
                setAnchor(day);
                setView("day");
              }}
            />
          )}
        </BookingCalendarPanel>
      ) : (
        <div className={bookingCalendarScrollClass}>
          <div className={bookingChromeContentPadClass}>
            {view === "month" ? (
              <BookingMonthView
                anchor={anchor}
                appointments={appointmentsInView}
                onSelectDay={(day) => {
                  setAnchor(day);
                  setView("day");
                }}
              />
            ) : null}
            {view === "year" ? (
              <BookingYearView
                anchor={anchor}
                appointments={filteredAppointments}
                onSelectMonth={(monthStart) => {
                  setAnchor(monthStart);
                  setView("month");
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      <BookingFiltersSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        idPrefix={filterIdPrefix}
        openFilterMenu={sheetFilterMenu}
        setOpenFilterMenu={setSheetFilterMenu}
        pcpOptions={[...CLINIC_FLOW_SEED_PCPS]}
        selectedPcps={selectedPcps}
        onChangeSelectedPcps={setSelectedPcps}
        navigatorOptions={[...CLINIC_FLOW_SEED_NAVIGATORS]}
        selectedNavigators={selectedNavigators}
        onChangeSelectedNavigators={setSelectedNavigators}
      />

      <BookingAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        appointment={editingAppointment}
        defaultDate={anchor}
        onSaveCreate={(apt) => {
          addAppointment(apt);
          setToast({ id: Date.now(), message: "Appointment created." });
        }}
        onSaveEdit={(id, patch) => {
          updateAppointment(id, patch);
          setToast({ id: Date.now(), message: "Appointment updated." });
        }}
        onDelete={(id) => {
          deleteAppointment(id);
          setToast({ id: Date.now(), message: "Appointment deleted." });
        }}
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
                "pointer-events-none fixed bottom-6 left-1/2 z-200 max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
                textBody,
              )}
            >
              {toast.message}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
