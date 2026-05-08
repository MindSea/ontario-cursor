"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { format, parse } from "date-fns";

import type { Appointment } from "./types";

import { shiftCalendarDay } from "./calendar-utils";
import { ClinicFlowDesktop } from "./clinic-flow-desktop";
import { ClinicFlowMobile } from "./clinic-flow-mobile";
import { useClinicFlowShellLayout } from "./use-clinic-flow-shell-layout";
import { buildSeedAppointments } from "./seed-appointments";
import { filterAppointmentsForScheduleToolbar } from "./schedule-appointment-filters";
import type { BuildingPresenceBucket } from "./schedule-building-filter";
import { buildingPresenceBucketForAppointment } from "./schedule-building-filter";
import { DEMO_ACCOUNT_NAVIGATOR } from "./schedule-constants";

export default function ClinicFlowPage() {
  const [appointments, setAppointments] = useState(() =>
    buildSeedAppointments(),
  );
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedId, setSelectedId] = useState("2");
  const [mobileTab, setMobileTab] = useState<"schedule" | "workspace">(
    "schedule",
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [selectedPcps, setSelectedPcps] = useState<string[]>([]);
  const [selectedNavigators, setSelectedNavigators] = useState<string[]>([
    DEMO_ACCOUNT_NAVIGATOR,
  ]);
  const [selectedBuildingBuckets, setSelectedBuildingBuckets] = useState<
    BuildingPresenceBucket[]
  >(["in_building"]);

  const [patientSearchQuery, setPatientSearchQuery] = useState("");

  const toolbarIdDesk = useId();
  const toolbarIdMobile = useId();

  const selectedDateKey = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate],
  );

  const appointmentsPassingFilters = useMemo(
    () =>
      filterAppointmentsForScheduleToolbar(appointments, {
        selectedPcps,
        selectedNavigators,
        selectedBuildingBuckets,
      }),
    [appointments, selectedPcps, selectedNavigators, selectedBuildingBuckets],
  );

  const appointmentsForGrid = useMemo(
    () =>
      appointmentsPassingFilters.filter((a) => a.date === selectedDateKey),
    [appointmentsPassingFilters, selectedDateKey],
  );

  const selectedAppointment = useMemo(
    () => appointments.find((a) => a.id === selectedId) ?? null,
    [appointments, selectedId],
  );

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const shiftSelectedDate = (deltaDays: number) => {
    setSelectedDate((d) => shiftCalendarDay(d, deltaDays));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleNavigateToAppointment = useCallback((apt: Appointment) => {
    setSelectedNavigators((prev) =>
      prev.length === 0 || prev.includes(apt.navigator)
        ? prev
        : [...prev, apt.navigator],
    );
    setSelectedPcps((prev) =>
      prev.length === 0 || prev.includes(apt.pcp) ? prev : [...prev, apt.pcp],
    );
    setSelectedBuildingBuckets((prev) => {
      const bucket = buildingPresenceBucketForAppointment(apt);
      if (prev.length === 0 || prev.includes(bucket)) return prev;
      return [...prev, bucket];
    });
    setSelectedDate(parse(apt.date, "yyyy-MM-dd", new Date()));
    setSelectedId(apt.id);
    setPatientSearchQuery("");
    setMobileTab("workspace");
  }, []);

  useEffect(() => {
    if (appointmentsForGrid.some((a) => a.id === selectedId)) return;
    const next =
      appointmentsForGrid[0]?.id ?? appointmentsPassingFilters[0]?.id;
    if (!next) return;
    queueMicrotask(() => setSelectedId(next));
  }, [appointmentsForGrid, appointmentsPassingFilters, selectedId]);

  const scheduleToolbarDeskProps = {
    idPrefix: toolbarIdDesk,
    allAppointments: appointments,
    selectedPcps,
    onChangeSelectedPcps: setSelectedPcps,
    selectedNavigators,
    onChangeSelectedNavigators: setSelectedNavigators,
    selectedBuildingBuckets,
    onChangeSelectedBuildingBuckets: setSelectedBuildingBuckets,
    patientSearchQuery,
    onPatientSearchQueryChange: setPatientSearchQuery,
    onNavigateToAppointment: handleNavigateToAppointment,
  };

  const scheduleToolbarMobileProps = {
    ...scheduleToolbarDeskProps,
    idPrefix: toolbarIdMobile,
  };

  const { rootRef, showMobileShell } = useClinicFlowShellLayout();

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background font-sans text-foreground"
    >
      <ClinicFlowMobile
        className={showMobileShell ? "flex" : "hidden"}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        selectedDate={selectedDate}
        onShiftDay={shiftSelectedDate}
        onGoToday={goToToday}
        selectedAppointment={selectedAppointment}
        appointmentsForGrid={appointmentsForGrid}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        onSwitchToWorkspaceTab={() => setMobileTab("workspace")}
        onUpdateAppointment={updateAppointment}
        scheduleToolbarProps={scheduleToolbarMobileProps}
      />

      <ClinicFlowDesktop
        className={showMobileShell ? "hidden" : "flex"}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebarVisible={() => setIsSidebarVisible((v) => !v)}
        appointmentsForGrid={appointmentsForGrid}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        selectedDate={selectedDate}
        onShiftDay={shiftSelectedDate}
        onGoToday={goToToday}
        selectedAppointment={selectedAppointment}
        onUpdateAppointment={updateAppointment}
        scheduleToolbarProps={scheduleToolbarDeskProps}
      />
    </div>
  );
}
