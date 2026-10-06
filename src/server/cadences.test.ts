import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/* 5.29 (P3) : tâches planifiées regroupées par cadence. Une étape ne doit tourner qu'une fois : soit dans
   CADENCES (cosmic_db.js), soit dans son propre cronAdd (cosmic.pb.js), jamais les deux. */

const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
const pb = readFileSync("pocketbase/pb_hooks/cosmic.pb.js", "utf8");

function stepNames(): string[] {
  const block = db.slice(db.indexOf("const CADENCES = {"), db.indexOf("function cadenceTick("));
  const out: string[] = [];
  const re = /\["(cosmic_[a-z_]+)",/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out.push(m[1]);
  return out;
}

describe("tâches planifiées par cadence", () => {
  it("chaque étape est unique et n'a plus son propre cronAdd", () => {
    const steps = stepNames();
    expect(steps.length).toBe(16);
    expect(new Set(steps).size).toBe(steps.length);
    for (const name of steps) expect(pb.includes(`cronAdd("${name}"`)).toBe(false);
  });

  it("les trois cadences sont planifiées, avec le même rythme que leurs étapes", () => {
    expect(pb).toContain(`cronAdd("cosmic_minute", "* * * * *"`);
    expect(pb).toContain(`cronAdd("cosmic_five", "*/5 * * * *"`);
    expect(pb).toContain(`cronAdd("cosmic_ten", "*/10 * * * *"`);
    expect(db).toContain("module.exports = { cadenceTick,");
  });
});
