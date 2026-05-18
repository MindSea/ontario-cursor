import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "date-fns";

import { extendAppointmentsForBookingCalendar } from "./extend-appointments-for-booking";
import { MAX_APPOINTMENT_DURATION_MINS } from "./schedule-clock";
import { buildSeedAppointments } from "./seed-appointments";

describe("buildSeedAppointments", () => {
  it("assigns each patient at most once per calendar day", () => {
    const appointments = buildSeedAppointments();
    const byDatePatient = new Map<string, number>();

    for (const a of appointments) {
      const key = `${a.date}:${a.patientId}`;
      byDatePatient.set(key, (byDatePatient.get(key) ?? 0) + 1);
    }

    for (const [key, count] of byDatePatient) {
      assert.equal(count, 1, `expected one visit for ${key}, got ${count}`);
    }
  });

  it("caps visit duration at 60 minutes", () => {
    const appointments = buildSeedAppointments();
    for (const a of appointments) {
      assert.ok(
        (a.estimatedDurationMins ?? 0) <= MAX_APPOINTMENT_DURATION_MINS,
        `${a.id} duration ${a.estimatedDurationMins}`,
      );
    }
  });

  it("includes the morning staircase overlap on today", () => {
    const appointments = buildSeedAppointments();
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const stair = appointments.filter(
      (a) =>
        a.date === todayKey &&
        ["08:00 AM", "08:15 AM", "08:30 AM", "09:00 AM"].includes(a.time),
    );
    assert.equal(stair.length, 4);
    assert.ok(
      stair.every((a) => a.estimatedDurationMins === 60),
      "staircase visits are 60 minutes",
    );
  });
});

describe("extendAppointmentsForBookingCalendar", () => {
  it("does not add a second visit for the same patient on the same day", () => {
    const base = buildSeedAppointments();
    const extended = extendAppointmentsForBookingCalendar(base);
    const byDatePatient = new Map<string, number>();
    for (const a of extended) {
      const key = `${a.date}:${a.patientId}`;
      byDatePatient.set(key, (byDatePatient.get(key) ?? 0) + 1);
    }
    for (const [key, count] of byDatePatient) {
      assert.equal(count, 1, `expected one visit for ${key}, got ${count}`);
    }
  });
});
