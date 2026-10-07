// 6.14.93 (AJ27-1, constat AJ-7) : les chiffres écrits dans les fiches systèmes et le GDD suivent le code.
// Un agent lit la fiche avant de coder (règle n° 1, point 5) : un chiffre faux l'envoie sur une mauvaise piste.
// Quand un de ces tests échoue, on met la phrase du .md à jour avec le code (pas l'inverse).
import { readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { COMBAT_RULES } from "@/game/combat";
import { applyGameContent } from "@/game/content";
import { MODULE_TEMPLATES } from "@/game/modules";
import { UNITS } from "@/game/units";

const read = (path: string) => readFileSync(path, "utf8");

/** Premier nombre capturé par `re` dans le fichier, sinon l'échec cite le fichier. */
function numberIn(path: string, re: RegExp): number {
  const m = re.exec(read(path));
  expect(m, `${path} : phrase introuvable (${re})`).not.toBeNull();
  return Number(m![1]);
}

describe("docs remises au code (AJ27-1)", () => {
  beforeEach(() => {
    setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
    applyGameContent({});
  });

  it("plafond du sauvetage de l'Atelier = combat.repairCap", () => {
    const pct = Math.round(COMBAT_RULES.repairCap * 100);
    for (const path of ["docs/GAME_DESIGN.md", "docs/systems/atelier-cale-seche.md"]) {
      expect(numberIn(path, /plafond global (\d+) %/), path).toBe(pct);
    }
  });

  it("nombre d'unités par défaut", () => {
    expect(numberIn("docs/systems/unites-hangars.md", /(\d+) unités par défaut/)).toBe(UNITS.length);
  });

  it("nombre de succès par défaut (écrits et dérivés)", () => {
    const path = "docs/systems/progression.md";
    expect(numberIn(path, /(\d+) succès par défaut/), path).toBe(ACHIEVEMENTS.length);
    expect(numberIn(path, /\((\d+) écrits/), path).toBe(DEFAULT_ACHIEVEMENTS.length);
  });

  it("nombre de modèles de modules", () => {
    expect(numberIn("docs/systems/bonus-effets.md", /(\d+) modèles \(inventaire/)).toBe(MODULE_TEMPLATES.length);
  });

  it("nombre de tâches planifiées (cronAdd)", () => {
    const crons = (read("pocketbase/pb_hooks/cosmic.pb.js").match(/^cronAdd\(/gm) ?? []).length;
    expect(numberIn("docs/systems/qol-outils.md", /(\d+) tâches planifiées/)).toBe(crons);
  });

  it("aucun identifiant disparu cité dans les fiches systèmes", () => {
    const gone = ["MAX_CONCURRENT_RESEARCH"];
    for (const f of readdirSync("docs/systems").filter((n) => n.endsWith(".md"))) {
      const text = read(`docs/systems/${f}`);
      for (const id of gone) expect(text.includes(id), `docs/systems/${f} cite ${id}`).toBe(false);
    }
  });

  it("journal du GDD (§8) dans l'ordre des versions", () => {
    const sec = read("docs/GAME_DESIGN.md").split("## 8. Journal des audits")[1] ?? "";
    let last = [0, 0, 0];
    for (const line of sec.split("\n")) {
      const m = /^\| [^|]+ \| (\d+)\.(\d+)\.(\d+) /.exec(line);
      if (!m) continue;
      const v = m.slice(1).map(Number);
      const before = v[0] - last[0] || v[1] - last[1] || v[2] - last[2];
      expect(before >= 0, `GDD §8 : ${v.join(".")} après ${last.join(".")}`).toBe(true);
      last = v;
    }
  });

  it("une feuille de route « en cours » a encore un lot à livrer", () => {
    for (const f of readdirSync("docs/proposals").filter((n) => n.startsWith("feuille-de-route-"))) {
      const text = read(`docs/proposals/${f}`);
      if (!/^Statut : \*\*en cours\*\*/m.test(text)) continue;
      const lots = text.split("\n").filter((l) => /^\| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$/.test(l) && !/^\| (#|:--)/.test(l));
      expect(lots.some((l) => !/livr/i.test(l.split("|").slice(-2, -1)[0] ?? "")), `${f} : tout est livré, statut à changer`).toBe(true);
    }
  });
});
