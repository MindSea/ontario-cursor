import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { format } from "date-fns";

import {
  buildSeedAppointments,
  CLINIC_FLOW_NAVIGATOR_PCP_ROSTER,
} from "./seed-appointments";
import { DEMO_ACCOUNT_NAVIGATOR } from "./schedule-constants";
import {
  huddleAppointmentsForPeriod,
  huddlePeriodForAppointmentTime,
} from "./huddle-session";

describe("navigator PCP roster", () => {
  it("assigns each navigator at most two PCPs", () => {
    for (const [navigator, pcps] of Object.entries(
      CLINIC_FLOW_NAVIGATOR_PCP_ROSTER,
    )) {
      assert.ok(pcps.length >= 1, navigator);
      assert.ok(pcps.length <= 2, navigator);
    }
  });

  it("gives Anna two PCPs and six visits today (3 am, 3 pm)", () => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const appointments = buildSeedAppointments().filter(
      (a) => a.date === todayKey && a.navigator === DEMO_ACCOUNT_NAVIGATOR,
    );
    const pcps = new Set(appointments.map((a) => a.pcp));
    assert.equal(pcps.size, 2);
    assert.ok(pcps.has("Dr. Ellis"));
    assert.ok(pcps.has("Dr. Aris"));

    const morning = appointments.filter(
      (a) => huddlePeriodForAppointmentTime(a.time) === "am",
    );
    const afternoon = appointments.filter(
      (a) => huddlePeriodForAppointmentTime(a.time) === "pm",
    );
    assert.equal(morning.length, 3);
    assert.equal(afternoon.length, 3);
    assert.equal(appointments.length, 6);

    const afternoonEllis = afternoon.filter((a) => a.pcp === "Dr. Ellis");
    assert.equal(afternoonEllis.length, 2);
  });
});
