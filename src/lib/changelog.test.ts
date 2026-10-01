import { describe, expect, it } from "vitest";
import { CHANGELOG, parseChangelogFile } from "@/lib/changelog";

describe("changelog", () => {
  it("parses the front matter and body", () => {
    const e = parseChangelogFile("2026-01-02-test", "---\nversion: 2.1.0\niteration: 7\ndate: 2026-01-02\ntitle: Titre\n---\n## Section\n- point");
    expect(e).toEqual({ id: "2026-01-02-test", version: "2.1.0", iteration: 7, date: "2026-01-02", title: "Titre", image: null, body: "## Section\n- point" });
    expect(parseChangelogFile("x", "---\ntitle: T\n---\n")).toMatchObject({ version: null, iteration: null });
  });

  it("loads every file of /changelog, newest first, each with a title and a date", () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    for (const e of CHANGELOG) {
      expect(e.title, e.id).not.toBe(e.id);
      expect(e.date, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("numbers every entry: unique iterations, versions increasing with them", () => {
    const iterations = CHANGELOG.map((e) => e.iteration);
    expect(iterations.every((i) => Number.isInteger(i)), "iteration manquante").toBe(true);
    expect(new Set(iterations).size).toBe(iterations.length);
    // Plus récente d'abord, sans trou dans la numérotation.
    expect(iterations).toEqual([...iterations].sort((a, b) => b! - a!));
    expect(Math.min(...(iterations as number[]))).toBe(1);
    expect(Math.max(...(iterations as number[]))).toBe(CHANGELOG.length);
    const semver = (v: string) => v.split(".").map(Number).reduce((acc, n) => acc * 1000 + n, 0);
    for (const e of CHANGELOG) expect(e.version, e.id).toMatch(/^\d+\.\d+\.\d+$/);
    const versions = CHANGELOG.map((e) => semver(e.version!));
    expect(versions).toEqual([...versions].sort((a, b) => b - a));
    expect(new Set(versions).size).toBe(versions.length);
  });

  it("tracks unread entries by publication order", async () => {
    const { isUnread } = await import("@/lib/changelog");
    const [latest, previous] = CHANGELOG;
    expect(isUnread(latest.id, "")).toBe(true);
    expect(isUnread(latest.id, latest.id)).toBe(false);
    if (previous) {
      expect(isUnread(latest.id, previous.id)).toBe(true);
      expect(isUnread(previous.id, latest.id)).toBe(false);
    }
  });
});
