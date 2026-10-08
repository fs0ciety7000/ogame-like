import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — module JS sans types (outil de recensement des exports morts)
import { exportedNames, findDeadExports, findUnusedHookExports, stripComments } from "../../scripts/dead-exports.mjs";

/* 6.14.153 (lot R5, AJ27-11, constat AJ-14) : garde des exports morts du moteur et de src/lib.
 * Un export que rien ne lit ailleurs (pages, services, tests, src/server/hooksEntry.ts qui alimente cosmic_db.js, scripts/, e2e/,
 * hooks écrits à la main) est retiré ; une valeur lue seulement dans son module n'est plus exportée.
 * Recensement : `node scripts/dead-exports.mjs [--dir src/lib]`. */

type Report = { dead: string[]; local: string[]; total: number };

/** Exceptions justifiées : `fichier:nom` → raison. */
const ALLOWED: Record<string, string> = {
  // Missions du jour : système éteint (`DAILY_RULES.tasks = 0`) mais gardé tant que la production (5.27) les a ;
  // retrait groupé 30 jours après la mise en production (Z0), constat AJ-14.
  "src/game/dailyMissions.ts:dailyReadyCount": "missions du jour, retrait à Z0 + 30 jours",
};

describe("exports morts (6.14.153, AJ27-11)", () => {
  it("l'outil lit les déclarations, les listes et les types", () => {
    const names = exportedNames(
      "export function a() {}\nexport const B = 1;\nexport type C = string;\nexport interface D {}\nexport { e, f as g };\nexport type { H };\n",
    ) as { name: string; kind: string }[];
    expect(names).toEqual([
      { name: "a", kind: "value" },
      { name: "B", kind: "value" },
      { name: "C", kind: "type" },
      { name: "D", kind: "type" },
      { name: "e", kind: "value" },
      { name: "g", kind: "value" },
      { name: "H", kind: "type" },
    ]);
    expect(stripComments('const x = "a // b"; // nom\n/* autre */ y')).toBe('const x = "a // b"; \n y');
  });

  for (const dir of ["src/game", "src/lib"]) {
    it(`${dir} : aucun export mort ni export lu seulement dans son module, hors exceptions`, () => {
      const res = findDeadExports({ dir }) as Report;
      expect(res.total).toBeGreaterThan(100);
      expect(res.dead.filter((e) => !ALLOWED[e])).toEqual([]);
      expect(res.local.filter((e) => !ALLOWED[e])).toEqual([]);
    });
  }

  it("chaque exception est encore un candidat (sinon la retirer de la liste)", () => {
    const all = ["src/game", "src/lib"].flatMap((dir) => {
      const r = findDeadExports({ dir }) as Report;
      return [...r.dead, ...r.local];
    });
    for (const key of Object.keys(ALLOWED)) expect(all).toContain(key);
  });
});

/* 6.14.158 (lot R15, AJ27-11b) : le bundle des hooks n'embarque que ce que les hooks écrits à la main appellent.
 * Tout export de src/server/hooksEntry.ts est appelé (`.nom`) par cosmic_db.js, cosmic.pb.js, cosmic_sync.js ou
 * cosmic_updater.pb.js, hors exceptions ; tout `game.nom` (ou `loadGame().nom`) appelé dans ces hooks est exporté.
 * Recensement : `node scripts/dead-exports.mjs --hooks`. */
type HooksReport = { total: number; unused: string[]; missing: string[]; dynamic: string[] };

/** Exports de hooksEntry.ts gardés sans appel des hooks : `nom` → raison. */
const HOOKS_ALLOWED: Record<string, string> = {};

describe("exports de hooksEntry.ts (6.14.158, AJ27-11b)", () => {
  const res = findUnusedHookExports() as HooksReport;

  it("tout export est appelé par un hook écrit à la main, hors exceptions", () => {
    expect(res.total).toBeGreaterThan(500);
    expect(res.unused.filter((n) => !HOOKS_ALLOWED[n])).toEqual([]);
    for (const key of Object.keys(HOOKS_ALLOWED)) expect(res.unused).toContain(key);
  });

  it("tout nom appelé sur le bundle (game.nom, loadGame().nom) est exporté par hooksEntry.ts", () => {
    expect(res.missing).toEqual([]);
  });

  it("aucun accès dynamique au bundle (game[x]) : la garde ne saurait pas le lire", () => {
    expect(res.dynamic).toEqual([]);
  });

  it("l'outil repère un export jamais appelé, un appel non exporté et un accès dynamique", () => {
    const root = mkdtempSync(join(tmpdir(), "hooks-exports-"));
    mkdirSync(join(root, "src/server"), { recursive: true });
    mkdirSync(join(root, "pocketbase/pb_hooks"), { recursive: true });
    writeFileSync(join(root, "src/server/hooksEntry.ts"), 'export { a, b } from "@/game/x";\nexport function c() {}\n');
    writeFileSync(
      join(root, "pocketbase/pb_hooks/cosmic_db.js"),
      "function f(game, g) { game.a(); g.c(); loadGame().z(); return game[k]; }\n// game.b() en commentaire ne compte pas\n",
    );
    const r = findUnusedHookExports({ root }) as HooksReport;
    expect(r.total).toBe(3);
    expect(r.unused).toEqual(["b"]);
    expect(r.missing).toEqual(["cosmic_db.js:z"]);
    expect(r.dynamic).toEqual(["cosmic_db.js:1"]);
  });
});
