import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  notificationFlagsMatch,
  withLinkedNotifications,
} from "./notificationPrefs";
import { DEFAULT_USER_PREFERENCES } from "@/types";

describe("withLinkedNotifications", () => {
  it("turns both switches on and off together", () => {
    const on = withLinkedNotifications(DEFAULT_USER_PREFERENCES, true);
    assert.equal(on.notificationsEnabled, true);
    assert.equal(on.reminderSettings?.enabled, true);
    assert.equal(notificationFlagsMatch(on), true);

    const off = withLinkedNotifications(on, false);
    assert.equal(off.notificationsEnabled, false);
    assert.equal(off.reminderSettings?.enabled, false);
    assert.deepEqual(off.reminderSettings?.times, ["09:00", "21:00"]);
    assert.deepEqual(off.reminderSettings?.types, ["glucose"]);
  });

  it("keeps a custom schedule when the switches are linked", () => {
    const next = withLinkedNotifications(
      {
        ...DEFAULT_USER_PREFERENCES,
        notificationsEnabled: true,
        reminderSettings: {
          enabled: false,
          times: ["07:15"],
          types: ["hemoglobin"],
        },
      },
      false,
    );

    assert.equal(next.notificationsEnabled, false);
    assert.equal(next.reminderSettings?.enabled, false);
    assert.deepEqual(next.reminderSettings?.times, ["07:15"]);
    assert.deepEqual(next.reminderSettings?.types, ["hemoglobin"]);
    assert.equal(notificationFlagsMatch(next), true);
  });
});

describe("notificationFlagsMatch", () => {
  it("is false when profile and reminders disagree", () => {
    assert.equal(
      notificationFlagsMatch({
        ...DEFAULT_USER_PREFERENCES,
        notificationsEnabled: true,
        reminderSettings: {
          enabled: false,
          times: ["09:00"],
          types: ["glucose"],
        },
      }),
      false,
    );
    assert.equal(notificationFlagsMatch(DEFAULT_USER_PREFERENCES), true);
  });
});
