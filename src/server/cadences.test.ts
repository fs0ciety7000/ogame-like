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
    // 6.14.111 (AC-E) : + cosmic_mail_queue (campagnes d'e-mails par lots, cadence minute). 6.14.145 (PB-L4) : + cosmic_hangar_queue.
    expect(steps.length).toBe(18);
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

describe("6.14.111 (AC-E) : verrou par cadence et e-mails par lots", () => {
  const tick = db.slice(db.indexOf("function cadenceTick("), db.indexOf("function readServerMetric("));
  it("une cadence tient un verrou en mémoire partagée, compte ses passages sautés et le rend à la fin", () => {
    expect(tick).toContain("game.cadenceBusy(");
    expect(tick).toContain("game.recordCronSkip(");
    expect(tick).toContain("$app.store().set(key, now)");
    expect(tick).toMatch(/finally \{[\s\S]*\$app\.store\(\)\.remove\(key\)/);
  });

  it("l'envoi des campagnes est la dernière étape de la cadence minute, plus aucune dans la cadence de 5 min", () => {
    const block = db.slice(db.indexOf("const CADENCES = {"), db.indexOf("function cadenceTick("));
    const minute = block.slice(block.indexOf("minute:"), block.indexOf("five:"));
    const five = block.slice(block.indexOf("five:"), block.indexOf("ten:"));
    expect(minute.lastIndexOf('["cosmic_')).toBe(minute.indexOf('["cosmic_mail_queue"'));
    expect(five).not.toMatch(/sendCampaign|mailQueueTick/);
  });

  it("les échéances collectives attendent pendant une maintenance (Q77)", () => {
    const block = db.slice(db.indexOf("const CADENCES = {"), db.indexOf("function cadenceTick("));
    for (const step of ["cosmic_wars", "cosmic_leviathan", "cosmic_allianceboss", "cosmic_seasonboss", "cosmic_territory_war"]) {
      expect(block).toMatch(new RegExp(`\\["${step}", \\(\\) => deadlinesOnHold\\(\\) \\|\\|`));
    }
    // Les flottes continuent.
    expect(block).not.toMatch(/\["cosmic_fleets", \(\) => deadlinesOnHold/);
  });
});

describe("6.14.135 (AC-H) : « Lancer maintenant » une étape de cadence", () => {
  const fn = db.slice(db.indexOf("function adminRunTask("), db.indexOf("function readServerMetric("));
  it("route admin protégée, étapes des cadences seulement", () => {
    expect(pb).toContain('routerAdd("POST", "/api/cosmic/admin/run-task"');
    expect(fn).toContain('if (!isGameAdmin(e)) throw new ForbiddenError(');
    expect(fn).toMatch(/CADENCES\[c\]\.steps\.forEach/);
    expect(fn).toContain("BadRequestError(");
    expect(db).toMatch(/module\.exports = \{[^}]*\badminRunTask\b/);
  });

  it("respecte le verrou de sa cadence (6.14.111) : refus 409 si elle tourne, verrou pris puis rendu", () => {
    expect(fn).toContain("CADENCE_LOCK_PREFIX + cadence");
    expect(fn).toContain("game.cadenceBusy(");
    expect(fn).toContain("e.json(409");
    expect(fn).toContain("$app.store().set(key, now)");
    expect(fn).toMatch(/finally \{[\s\S]*\$app\.store\(\)\.remove\(key\)/);
    // Le passage est mesuré comme un passage planifié (métriques, page Santé).
    expect(fn).toContain("timedCron(name, c.spec, step[1])");
  });

  it("laisse une ligne au journal d'administration", () => {
    expect(fn).toContain('findCollectionByNameOrId("admin_logs")');
    expect(fn).toContain('action: "run"');
    expect(fn).toContain('targetCollection: "server_tasks"');
  });

  it("la page Santé reçoit la liste des étapes lançables", () => {
    const metrics = db.slice(db.indexOf("function adminMetrics("), db.indexOf("function publicStatus("));
    expect(metrics).toContain("runnable: runnableTasks()");
  });
});
