"use client";

import { format } from "date-fns";
import { useMemo, useState, useSyncExternalStore } from "react";

import { DEMO_ACCOUNT_NAVIGATOR } from "./schedule-constants";
import {
  currentHuddlePeriod,
  distinctPcpsForHuddle,
  getHuddleSessionSnapshot,
  getServerHuddleSessionSnapshot,
  huddleAppointmentsForPeriod,
  isHuddleButtonVisible,
  subscribeHuddleSessions,
  type HuddlePeriod,
  type HuddleSessionRecord,
} from "./huddle-session";
import type { Appointment } from "./types";

function useHuddleSessionRecord(
  dateKey: string,
  period: HuddlePeriod,
): HuddleSessionRecord {
  return useSyncExternalStore(
    subscribeHuddleSessions,
    () => getHuddleSessionSnapshot(dateKey, period),
    getServerHuddleSessionSnapshot,
  );
}

export function useHuddleFlow({
  appointments,
  selectedDateKey,
  navigator = DEMO_ACCOUNT_NAVIGATOR,
}: {
  appointments: readonly Appointment[];
  selectedDateKey: string;
  navigator?: string;
}) {
  const [huddleOpen, setHuddleOpen] = useState(false);

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const isViewingToday = selectedDateKey === todayKey;
  const period: HuddlePeriod = currentHuddlePeriod();

  const session = useHuddleSessionRecord(todayKey, period);

  const huddleAppointments = useMemo(
    () =>
      huddleAppointmentsForPeriod(
        appointments,
        todayKey,
        navigator,
        period,
      ),
    [appointments, todayKey, navigator, period],
  );

  const showHuddleButton = isHuddleButtonVisible({
    isViewingToday,
    hasPatients: huddleAppointments.length > 0,
  });

  const huddleButton = showHuddleButton
    ? { onClick: () => setHuddleOpen(true) }
    : null;

  return {
    huddleOpen,
    setHuddleOpen,
    huddleButton,
    huddleModal: {
      dateKey: todayKey,
      period,
      appointments: huddleAppointments,
      session,
    },
  };
}
