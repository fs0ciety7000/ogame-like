import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { contentChainGaps, contentChainReport } from "@/game/contentChain";
import { UNITS } from "@/game/units";

/**
 * 6.14.11 (lot C1) : garde de la chaîne de contenu (WORKFLOW.md §7, CLAUDE.md règle n° 4).
 * Chaque manque connu a son lot de rattrapage (docs/proposals/chaine-contenu.md). Un manque nouveau fait échouer le test :
 * compléter la chaîne du contenu ajouté, ou, si le manque est voulu, l'ajouter ici avec son lot.
 * Un manque comblé doit sortir de la liste (corriger plutôt qu'empiler).
 * `*` remplace l'identifiant quand tout un type de contenu manque le maillon (un rattrapage le règle d'un coup).
 */
const KNOWN_GAPS: Record<string, string> = {
  "allianceBoss:*:achievementEntry": "C4 : succès des boss d'alliance (mesure à créer)",
  "unit:sonde_espionnage:effectPreset": "C3 : préréglages des unités",
  "unit:cargo:effectPreset": "C3",
  "unit:roquette:effectPreset": "C3",
  "unit:traqueur_kesh:effectPreset": "C3",
  "unit:chasse_fantome:effectPreset": "C3",
  "unit:brise_rempart:effectPreset": "C3",
  "unit:lame_ecarlate:effectPreset": "C3",
  "unit:recolteur:effectPreset": "C3",
  "unit:croiseur_raid:effectPreset": "C3",
  "unit:eclaireur_lointain:effectPreset": "C3",
};

const known = (gap: string) => {
  const [kind, , link] = gap.split(":");
  return gap in KNOWN_GAPS || `${kind}:*:${link}` in KNOWN_GAPS;
};

describe("6.14.11 : chaîne de contenu", () => {
  // setup.ts vide les succès avant chaque test : on recharge ceux par défaut.
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));

  it("couvre tout le contenu par défaut", () => {
    const rows = contentChainReport();
    const count = (k: string) => rows.filter((r) => r.kind === k).length;
    expect(count("unit")).toBe(UNITS.length);
    for (const k of ["building", "tech", "relic", "worldBoss", "allianceBoss", "seasonBoss"]) expect(count(k)).toBeGreaterThan(0);
  });

  it("aucun maillon manquant hors des manques connus", () => {
    expect(contentChainGaps().filter((g) => !known(g))).toEqual([]);
  });

  it("chaque manque connu existe encore (sinon le retirer de la liste)", () => {
    const gaps = contentChainGaps();
    const stale = Object.keys(KNOWN_GAPS).filter((k) => {
      const [kind, id, link] = k.split(":");
      return !gaps.some((g) => {
        const [gk, gi, gl] = g.split(":");
        return gk === kind && gl === link && (id === "*" || gi === id);
      });
    });
    expect(stale).toEqual([]);
  });

  it("un manque sur tout un type couvre bien chaque contenu de ce type", () => {
    const rows = contentChainReport();
    for (const k of Object.keys(KNOWN_GAPS).filter((x) => x.split(":")[1] === "*")) {
      const [kind, , link] = k.split(":");
      const ofKind = rows.filter((r) => r.kind === kind);
      // Si une partie seulement du type a le maillon, la liste doit nommer les contenus un par un.
      expect(ofKind.every((r) => r.links[link as keyof typeof r.links] === false), k).toBe(true);
    }
  });

  it("une unité ajoutée sans préréglage d'effet fait échouer la garde", () => {
    UNITS.push({ ...UNITS[0], id: "corvette_essai", name: "Corvette d'essai" });
    try {
      expect(contentChainGaps().filter((g) => !known(g))).toEqual(["unit:corvette_essai:effectPreset"]);
    } finally {
      UNITS.pop();
    }
  });

  it("les succès coupés comptent comme un maillon manquant", () => {
    setAchievements([]);
    expect(contentChainGaps()).toContain("unit:chasseur:achievementEntry");
  });
});
