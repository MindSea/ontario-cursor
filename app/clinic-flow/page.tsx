"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";

import type { Appointment } from "./types";

import { shiftCalendarDay } from "./calendar-utils";
import { ClinicFlowDesktop } from "./clinic-flow-desktop";
import { ClinicFlowMobile } from "./clinic-flow-mobile";
import { buildSeedAppointments } from "./seed-appointments";

export default function ClinicFlowPage() {
  const [appointments, setAppointments] = useState(buildSeedAppointments);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedId, setSelectedId] = useState("1");
  const [mobileTab, setMobileTab] = useState<"schedule" | "workspace">(
    "schedule",
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const selectedDateKey = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate],
  );
  const appointmentsForGrid = useMemo(
    () => appointments.filter((a) => a.date === selectedDateKey),
    [appointments, selectedDateKey],
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

  return (
    <div className="w-full bg-background font-sans text-foreground max-md:block max-md:min-h-dvh max-md:w-full max-md:overflow-x-hidden md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col">
      <ClinicFlowMobile
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
      />

      <ClinicFlowDesktop
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
      />
    </div>
  );
}
