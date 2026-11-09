import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSerialQueue } from "./serialQueue";
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from "@/types";

describe("createSerialQueue", () => {
  it("applies preference updates in order so a slow save cannot drop a later edit", async () => {
    let current: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      displayName: "A",
      units: "mg/dL",
    };
    const saved: UserPreferences[] = [];
    let releaseFirst: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const enqueue = createSerialQueue();

    const first = enqueue(async () => {
      const next = { ...current, displayName: "B" };
      current = next;
      saved.push({ ...next });
      await gate;
    });
    const second = enqueue(async () => {
      const next = { ...current, units: "mmol/L" as const };
      current = next;
      saved.push({ ...next });
    });

    releaseFirst();
    await first;
    await second;

    assert.equal(current.displayName, "B");
    assert.equal(current.units, "mmol/L");
    assert.equal(saved[0]?.displayName, "B");
    assert.equal(saved[0]?.units, "mg/dL");
    assert.equal(saved[1]?.displayName, "B");
    assert.equal(saved[1]?.units, "mmol/L");
  });

  it("keeps running after a failed task", async () => {
    const enqueue = createSerialQueue();
    const first = enqueue(async () => {
      throw new Error("disk");
    });
    const second = enqueue(async () => "ok");

    await assert.rejects(first, /disk/);
    assert.equal(await second, "ok");
  });
});
