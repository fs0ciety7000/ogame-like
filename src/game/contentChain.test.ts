import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { applyAchievementPace, CONTENT_ACHIEVEMENT_RULES, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { CHAIN_KIND_LABELS, CHAIN_LINK_LABELS, chainRowScore, contentChainGaps, contentChainReport, PALETTE_KINDS, type ChainKind } from "@/game/contentChain";
import { COLONY_SPECS, RARE_DEPOSITS } from "@/game/colonies";
import { empireClasses } from "@/game/empireClass";
import { MODULE_TEMPLATES } from "@/game/modules";
import { RELICS } from "@/game/relics";
import { TALENTS } from "@/game/talents";
import { UNITS } from "@/game/units";

/**
 * 6.14.11 (lot C1), renforcée en 6.14.114 (AJ27-4) : garde de la chaîne de contenu (WORKFLOW.md §7, CLAUDE.md règle n° 4).
 * Chaque manque connu a son lot de rattrapage (feuille de route `docs/proposals/feuille-de-route-2030-automne.md`). Un manque
 * nouveau fait échouer le test : compléter la chaîne du contenu ajouté, ou, si le manque est voulu, l'ajouter ici avec son lot.
 * Un manque comblé doit sortir de la liste (corriger plutôt qu'empiler).
 * `*` remplace l'identifiant quand tout un type de contenu manque le maillon (un rattrapage le règle d'un coup).
 */
const each = (kind: ChainKind, ids: string[], link: string, why: string): Record<string, string> => Object.fromEntries(ids.map((id) => [`${kind}:${id}:${link}`, why]));

const KNOWN_GAPS: Record<string, string> = {
  // AJ-1 : succès propre par unité et par bâtiment : comblé par les succès dérivés (6.14.129, AJ27-6).
  // AJ-1 : porteur propre par unité (QJ2 : plan de module « signature »). Seule la Sentinelle a le sien (Sceau des Sentinelles).
  ...each(
    "unit",
    ["drone_recuperateur", "sonde_espionnage", "fregate", "cargo", "chasseur", "etoile_noire", "croiseur_nova", "lance_gravitationnelle", "roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur", "bastion", "batterie_essaim", "vaisseau_atelier", "traqueur_kesh", "chasse_fantome", "brise_rempart", "lame_ecarlate", "recolteur", "croiseur_raid", "eclaireur_lointain"],
    "carrierOwn",
    "AJ27-10 : porteurs « signature » par unité (plans de module ou reliques)",
  ),
  // AJ-9 : Ctrl+K étendu à tous les types (6.14.130, AJ27-8).
  // AJ-4 : talents, modules et classes d'empire sans fiche de Codex ni succès propre.
  "talent:*:codex": "AJ27-9 : Codex « Doctrines »",
  "talent:*:achievementMastery": "AJ27-9 : succès « Spécialiste » (une branche complète)",
  "module:*:codex": "AJ27-9 : Codex « Arsenal »",
  "class:*:codex": "AJ27-9 : Codex « Doctrines »",
  "class:*:achievementEntry": "AJ27-9 : succès de classe d'empire (entrée)",
  "class:*:achievementMastery": "AJ27-9 : succès de classe d'empire (maîtrise)",
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
    // 6.14.114 (AJ27-4) : colonies (biomes et spécialisations), talents, modules, classes d'empire.
    expect(count("colony")).toBe(RARE_DEPOSITS.length + COLONY_SPECS.length);
    expect(count("talent")).toBe(TALENTS.length);
    expect(count("module")).toBe(MODULE_TEMPLATES.length);
    expect(count("class")).toBe(empireClasses().length);
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

  it("chaque manque connu dit son lot de rattrapage", () => {
    for (const [k, why] of Object.entries(KNOWN_GAPS)) expect(why, k).toMatch(/^(AJ27|É30|AA|AE)-?[0-9A-Za-z]+/);
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

  it("une unité ajoutée sans porteur propre fait échouer la garde (préréglage et succès générés, 6.14.123 et 6.14.129)", () => {
    UNITS.push({ ...UNITS[0], id: "corvette_essai", name: "Corvette d'essai" });
    try {
      // 6.14.123 (AA5, AA-18) : préréglages d'effets générés pour une unité ajoutée (attaque et PV) : le maillon est rempli.
      // Avant l'application du contenu, ses succès dérivés n'existent pas encore : le succès propre manque.
      expect(contentChainGaps().filter((g) => !known(g)).sort()).toEqual(["unit:corvette_essai:achievementOwn", "unit:corvette_essai:carrierOwn"]);
      // 6.14.129 (AJ27-6) : à l'application du contenu (comme `applyGameContent`), elle reçoit « Escadre » et « Maître ».
      applyAchievementPace();
      expect(contentChainGaps().filter((g) => !known(g)).sort()).toEqual(["unit:corvette_essai:carrierOwn"]);
    } finally {
      UNITS.pop();
      applyAchievementPace();
    }
  });

  it("les succès coupés comptent comme un maillon manquant", () => {
    setAchievements([]);
    expect(contentChainGaps()).toContain("unit:chasseur:achievementEntry");
    // 6.14.129 : les succès dérivés par contenu restent (setAchievements les ajoute) : le succès propre est là…
    expect(contentChainGaps()).not.toContain("unit:sonde_espionnage:achievementOwn");
    // … sauf s'ils sont coupés dans les règles : la sonde perd alors son succès propre (« espionnages » est un succès écrit).
    CONTENT_ACHIEVEMENT_RULES.enabled = false;
    try {
      applyAchievementPace();
      expect(contentChainGaps()).toContain("unit:sonde_espionnage:achievementOwn");
      expect(contentChainGaps()).toContain("building:entrepot:achievementOwn");
    } finally {
      CONTENT_ACHIEVEMENT_RULES.enabled = true;
      applyAchievementPace();
    }
  });
});

describe("6.14.114 (AJ27-4) : maillons renforcés et panneau d'admin", () => {
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));

  it("porteur propre : la relique qui vise l'unité compte, une classe ne suffit pas", () => {
    const rows = contentChainReport();
    const unit = (id: string) => rows.find((r) => r.kind === "unit" && r.id === id)!;
    expect(unit("sentinelle").links.carrierOwn).toBe(true);
    expect(unit("chasseur").links.effectCarrier).toBe(true);
    expect(unit("chasseur").links.carrierOwn).toBe(false);
  });

  it("succès propre seulement pour les unités et les bâtiments (QJ1)", () => {
    const rows = contentChainReport();
    for (const r of rows) {
      const expected = r.kind === "unit" || r.kind === "building";
      expect(r.links.achievementOwn !== null, `${r.kind}:${r.id}`).toBe(expected);
    }
  });

  it("une relique ajoutée dans l'admin entre dans le bilan, et un porteur propre comble le maillon de son unité", () => {
    const base = RELICS.find((r) => r.id === "sceau_sentinelle")!;
    RELICS.push({ ...base, id: "moteur_corvette_essai", name: "Moteur d'essai", custom: { ...base.custom!, target: "unit:chasseur" } });
    try {
      const rows = contentChainReport();
      expect(rows.some((r) => r.kind === "relic" && r.id === "moteur_corvette_essai")).toBe(true);
      expect(rows.find((r) => r.kind === "unit" && r.id === "chasseur")!.links.carrierOwn).toBe(true);
    } finally {
      RELICS.pop();
    }
  });

  it("Ctrl+K : chaque type déclaré trouvable est bien lu par la palette", () => {
    const src = readFileSync("src/components/layout/CommandPalette.tsx", "utf8");
    // 6.14.130 (AJ27-8) : les autres types passent par `matchPaletteContent` (paletteContent.ts), vérifié contenu par contenu.
    const content = "matchPaletteContent(";
    const registry: Record<ChainKind, string> = {
      unit: "UNITS.filter(",
      building: "BUILDINGS.filter(",
      tech: "TECHNOLOGIES.filter(",
      relic: content,
      worldBoss: content,
      allianceBoss: content,
      seasonBoss: content,
      colony: content,
      talent: content,
      module: content,
      class: content,
    };
    for (const k of PALETTE_KINDS) expect(src, k).toContain(registry[k]);
    expect([...PALETTE_KINDS].sort()).toEqual(Object.keys(CHAIN_KIND_LABELS).sort());
  });

  it("libellés de chaque type et maillon ; bilan par ligne", () => {
    const rows = contentChainReport();
    for (const r of rows) {
      expect(CHAIN_KIND_LABELS[r.kind]).toBeTruthy();
      for (const l of Object.keys(r.links)) expect(CHAIN_LINK_LABELS[l as keyof typeof CHAIN_LINK_LABELS], l).toBeTruthy();
      const s = chainRowScore(r);
      expect(s.ok).toBeLessThanOrEqual(s.expected);
    }
  });

  it("le panneau « Chaîne de contenu » est monté dans Admin → Équilibrage", () => {
    const balance = readFileSync("src/pages/admin/BalancePanel.tsx", "utf8");
    expect(balance).toContain("<ContentChainSection");
    const panel = readFileSync("src/pages/admin/ContentChainSection.tsx", "utf8");
    expect(panel).toContain("contentChainReport()");
  });
});
