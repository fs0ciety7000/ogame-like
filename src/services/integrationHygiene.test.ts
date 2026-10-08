import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/* 6.14.151 (R3, constat RV-6 de la revue AU28) : hygiène de la suite d'intégration, vérifiée sans serveur.
   - Une écriture de section de `game_config` coûte 0,7 à 2,2 s sur le montage local (garde serveur `guardContentConfig`,
     chargement du jeu) : un test qui en fait plus de 3 porte un délai explicite d'au moins 20 s (5 s par défaut).
   - Jamais `resetContentSection` sur une section posée par la suite (règles rapides, factions) : il supprime
     l'enregistrement, et les tests suivants tournaient avec les vols par défaut (404 en fin de suite jusqu'en 6.14.150).
     `keepSection(key)` garde la section et la remet telle quelle. */

const src = readFileSync("src/services/pocketbase.integration.test.ts", "utf8");

/** Tests de premier niveau de la suite : titre → corps (jusqu'au test suivant). */
function topTests(text: string): { title: string; body: string }[] {
  const re = /\n {2}it\("((?:[^"\\]|\\.)*)"/g;
  const starts: { at: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) starts.push({ at: m.index, title: m[1] });
  return starts.map((s, i) => ({ title: s.title, body: text.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : text.length) }));
}

/** Écritures de `game_config` (sections de contenu et états) repérables dans le texte d'un test. */
const WRITES = /saveContentSection\(|resetContentSection\(|\bput\(|collection\("game_config"\)\.(?:update|create|delete)\(|withoutPassSeasons\(|keepSection\(/g;

/** Délai explicite d'un test (`}, 30_000);` en fin de corps), en millisecondes ; 0 sans délai. */
function timeoutOf(body: string): number {
  const end = body.lastIndexOf("\n  }");
  const m = /^\n {2}\}(?:,\s*([0-9_]+))?\);/.exec(body.slice(end));
  return m?.[1] ? Number(m[1].replace(/_/g, "")) : 0;
}

const tests = topTests(src);

describe("hygiène de la suite d'intégration (R3)", () => {
  it("le balayage trouve les tests de la suite", () => {
    expect(tests.length).toBeGreaterThan(100);
    expect(tests.some((t) => t.title.startsWith("registers two players"))).toBe(true);
    expect(timeoutOf(tests.find((t) => t.title.startsWith("v4.2 warlords"))!.body)).toBe(20_000);
  });

  it("un test qui écrit plus de 3 sections de configuration porte un délai explicite d'au moins 20 s", () => {
    const missing = tests
      .map((t) => ({ title: t.title, writes: (t.body.match(WRITES) ?? []).length, timeout: timeoutOf(t.body) }))
      .filter((t) => t.writes > 3 && t.timeout < 20_000)
      .map((t) => `${t.title.slice(0, 80)} (${t.writes} écritures, délai ${t.timeout || "par défaut"})`);
    expect(missing).toEqual([]);
  });

  it("aucun test ne supprime les règles rapides ni les factions posées par la suite", () => {
    expect(src).not.toMatch(/resetContentSection\("(?:rules|factions)"\)/);
    // La fin de suite ne tolère plus un enregistrement disparu en route.
    expect(src).toMatch(/if \(createdRulesId\) await admin\.collection\("game_config"\)\.delete\(createdRulesId\);/);
  });
});
