import { beforeEach, describe, expect, it } from "vitest";
import { addReminder, REMINDERS_MAX, removeReminder, useRemindersStore } from "@/lib/reminders";

describe("rappels personnels (5.16)", () => {
  beforeEach(() => useRemindersStore.setState({ list: [] }));
  it("ajout sans doublon, suppression, plafond", () => {
    addReminder({ kind: "storage", pct: 90 });
    addReminder({ kind: "storage", pct: 90 });
    addReminder({ kind: "online", uid: "u1", pseudo: "Alpha" });
    expect(useRemindersStore.getState().list.map((r) => r.id)).toEqual(["storage-90", "online-u1"]);
    removeReminder("storage-90");
    expect(useRemindersStore.getState().list).toHaveLength(1);
    for (let i = 0; i < 20; i++) addReminder({ kind: "online", uid: `x${i}`, pseudo: `X${i}` });
    expect(useRemindersStore.getState().list.length).toBe(REMINDERS_MAX);
  });
});
