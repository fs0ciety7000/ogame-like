import { describe, expect, it } from "vitest";
import { CHANGELOG, parseChangelogFile } from "@/lib/changelog";

describe("changelog", () => {
  it("parses the front matter and body", () => {
    const e = parseChangelogFile("2026-01-02-test", "---\ndate: 2026-01-02\ntitle: Titre\n---\n## Section\n- point");
    expect(e).toEqual({ id: "2026-01-02-test", date: "2026-01-02", title: "Titre", body: "## Section\n- point" });
  });

  it("loads every file of /changelog, newest first, each with a title and a date", () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    for (const e of CHANGELOG) {
      expect(e.title, e.id).not.toBe(e.id);
      expect(e.date, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect([...CHANGELOG].sort((a, b) => b.id.localeCompare(a.id))).toEqual(CHANGELOG);
  });
});
