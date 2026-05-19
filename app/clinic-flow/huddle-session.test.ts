import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  huddlePeriodForAppointmentTime,
  isHuddleButtonVisible,
  parseAppointmentMinutes,
} from "./huddle-session";

describe("parseAppointmentMinutes", () => {
  it("parses 12-hour clock strings", () => {
    assert.equal(parseAppointmentMinutes("08:30 AM"), 8 * 60 + 30);
    assert.equal(parseAppointmentMinutes("02:00 PM"), 14 * 60);
  });
});

describe("huddlePeriodForAppointmentTime", () => {
  it("assigns morning visits to am", () => {
    assert.equal(huddlePeriodForAppointmentTime("09:00 AM"), "am");
  });

  it("assigns afternoon visits to pm", () => {
    assert.equal(huddlePeriodForAppointmentTime("02:00 PM"), "pm");
  });
});

describe("isHuddleButtonVisible", () => {
  it("hides when not viewing today", () => {
    assert.equal(
      isHuddleButtonVisible({
        isViewingToday: false,
        hasPatients: true,
      }),
      false,
    );
  });

  it("shows when viewing today with patients in the current block", () => {
    assert.equal(
      isHuddleButtonVisible({
        isViewingToday: true,
        hasPatients: true,
      }),
      true,
    );
  });

  it("hides when there are no patients in the current block", () => {
    assert.equal(
      isHuddleButtonVisible({
        isViewingToday: true,
        hasPatients: false,
      }),
      false,
    );
  });
});
