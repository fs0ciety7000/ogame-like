import { describe, expect, it } from "vitest";
import { isConversationArchived, setConversationArchived } from "@/game/messages";

describe("archives des messages privés (5.26.2)", () => {
  it("une conversation archivée revient au prochain message", () => {
    const archive = setConversationArchived(undefined, "b", true, 1000);
    expect(isConversationArchived({ uid: "b", last: { createdAtMs: 900 } as never }, archive)).toBe(true);
    expect(isConversationArchived({ uid: "b", last: { createdAtMs: 1500 } as never }, archive)).toBe(false);
    expect(isConversationArchived({ uid: "c", last: { createdAtMs: 900 } as never }, archive)).toBe(false);
    expect(setConversationArchived(archive, "b", false, 2000)).toEqual({});
  });

  it("garde 100 conversations archivées au plus (les plus récentes)", () => {
    let a: Record<string, number> = {};
    for (let i = 0; i < 120; i++) a = setConversationArchived(a, `u${i}`, true, i);
    expect(Object.keys(a)).toHaveLength(100);
    expect(a.u0).toBeUndefined();
    expect(a.u119).toBe(119);
  });
});
