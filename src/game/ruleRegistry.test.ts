import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, defaultGameContent, RULE_GROUP_LABELS, validateRules } from "@/game/content";
import { REGISTERED_RULES, ruleFieldMeta, ruleGroupMeta } from "@/game/ruleRegistry";
import { HISTORICAL_RULES_META, type RuleFieldMeta } from "@/game/ruleMeta";
import { applyRhythmSwitch, RHYTHM_RULES } from "@/game/rhythm";
import { VACATION_RULES } from "@/game/vacation";
import { BOUNTY_RULES } from "@/game/bounties";

/* 6.9.1 : registre des réglages (règle n° 2). */

const SOURCES = import.meta.glob(["./*.ts", "!./*.test.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Objets `*_RULES` volontairement hors de l'admin : limites techniques ou accesseurs vers un groupe réglable. */
const NOT_GAME_RULES = new Set([
  "BLOG_RULES", // limites de l'éditeur du blog
  "PASSKEY_RULES", // sécurité des clés d'accès
  "AUTO_ERROR_RULES", // remontée automatique des erreurs
  "ANOMALY_RULES", // contient une clé de stockage
  "AUCTION_HISTORY_RULES", // accesseurs vers « auctions »
  "AUCTION_WATCH_RULES", // accesseurs vers « auctions »
  "CLASS_UNIT_RULES", // accesseurs vers « classes »
  "LAIR_LOCATE_RULES", // accesseurs vers « pirates »
  // Réglés par leur propre section de contenu (onglet dédié de l'admin) :
  "COMMANDER_RULES", // Officiers
  "RARE_OFFICER_RULES", // Officiers
  "LOOT_TOKEN_RULES", // Tables de butin
  "RELIC_RULES", // Reliques
  "PASS_RULES", // Passe
  "DEFAULT_RANK_RULES", // Seigneurs (rangs et traits)
]);

afterEach(() => applyGameContent({}));

describe("6.9.1 registre des réglages", () => {
  it("chaque groupe du registre : libellé, valeurs JSON pures, sans accesseur", () => {
    for (const [k, r] of Object.entries(REGISTERED_RULES)) {
      expect(RULE_GROUP_LABELS[k], k).toBe(r.label);
      const t = r.target();
      expect(Object.values(Object.getOwnPropertyDescriptors(t)).some((d) => d.get), k).toBe(false);
      expect(JSON.parse(JSON.stringify(t)), k).toEqual(t);
      expect((currentGameContent().rules as unknown as Record<string, unknown>)[k], k).toEqual(t);
    }
  });

  it("un réglage s'applique ; un réglage partiel garde le reste (sous-objets compris)", () => {
    const tiers = structuredClone(BOUNTY_RULES.tiers);
    applyGameContent({ rules: { vacation: { maxDays: 30 }, bounties: { tiers: { 1: { pct: 0.7 } } } } } as never);
    expect(VACATION_RULES.maxDays).toBe(30);
    expect(VACATION_RULES.minDays).toBe(2);
    const t1 = (BOUNTY_RULES.tiers as Record<string, Record<string, unknown>>)["1"];
    expect(t1.pct).toBe(0.7);
    expect(t1.label).toBe((tiers as Record<string, Record<string, unknown>>)["1"].label);
    applyGameContent({});
    expect(VACATION_RULES.maxDays).toBe(21);
  });

  it("validation de type sur les groupes du registre", () => {
    const r = currentGameContent().rules;
    expect(validateRules({ ...r, vacation: { ...r.vacation, maxDays: "trente" } } as never).join(" ")).toMatch(/Mode vacances/);
    expect(validateRules({ ...r, territories: { ...r.territories, cols: 8 } } as never).join(" ")).toMatch(/grille reste 6 × 4/);
  });

  it("garde : tout objet `*_RULES` du moteur est réglable dans l'admin", () => {
    const wired = SOURCES["./content.ts"] + SOURCES["./ruleRegistry.ts"];
    const missing: string[] = [];
    for (const [file, src] of Object.entries(SOURCES)) {
      const re = /^export const ([A-Z][A-Z0-9_]*_RULES)\b/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) if (!NOT_GAME_RULES.has(m[1]) && !new RegExp(`\\b${m[1]}\\b`).test(wired)) missing.push(`${file.slice(2)} ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });

  /* 6.14.95 (AU27, lot AA2 : AA-24, AA-28) : métadonnées des réglages. */
  it("garde : chaque champ de chaque groupe du registre a un libellé, et rien que des champs existants", () => {
    const missing: string[] = [];
    const unknown: string[] = [];
    for (const [group, r] of Object.entries(REGISTERED_RULES)) {
      const meta = r.meta() as Record<string, RuleFieldMeta>;
      const target = r.target() as Record<string, unknown>;
      for (const key of Object.keys(target)) if (!meta[key]?.label?.trim()) missing.push(`${group}.${key}`);
      for (const key of Object.keys(meta)) if (!(key in target)) unknown.push(`${group}.${key}`);
    }
    expect(missing).toEqual([]);
    expect(unknown).toEqual([]);
  });

  it("garde : métadonnées JSON pures, bornes cohérentes, chaque défaut dans ses bornes", () => {
    const defaults = defaultGameContent().rules as unknown as Record<string, Record<string, unknown>>;
    const groups = [...Object.keys(REGISTERED_RULES), ...Object.keys(HISTORICAL_RULES_META)];
    const bad: string[] = [];
    for (const group of groups) {
      const meta = ruleGroupMeta(group) as Record<string, RuleFieldMeta>;
      expect(JSON.parse(JSON.stringify(meta)), group).toEqual(meta);
      for (const [key, m] of Object.entries(meta)) {
        const d = defaults[group]?.[key];
        if (d === undefined) bad.push(`${group}.${key} : champ absent des défauts`);
        if ((m.min !== undefined || m.max !== undefined) && typeof d !== "number") bad.push(`${group}.${key} : bornes sur un champ non numérique`);
        if (m.min !== undefined && m.max !== undefined && m.min > m.max) bad.push(`${group}.${key} : min > max`);
        if (typeof d === "number" && ((m.min !== undefined && d < m.min) || (m.max !== undefined && d > m.max))) bad.push(`${group}.${key} : défaut ${d} hors de [${m.min} ; ${m.max}]`);
      }
    }
    expect(bad).toEqual([]);
    // Aucun refus sur les défauts, ni après la bascule du rythme (valeurs visées comprises).
    expect(validateRules(defaultGameContent().rules)).toEqual([]);
    const switched = applyRhythmSwitch(defaultGameContent(), defaultGameContent().buildings, RHYTHM_RULES.switchAt + 1);
    expect(switched.rules.research.lateTimeFactor).toBe(RHYTHM_RULES.researchLateTimeFactor);
    expect(validateRules(switched.rules)).toEqual([]);
  });

  it("une valeur hors des bornes déclarées est refusée, avec son libellé", () => {
    const r = currentGameContent().rules;
    expect(ruleFieldMeta("phalanx", "rangePerLevel")?.label).toMatch(/Portée/);
    const errs = validateRules({ ...r, phalanx: { ...r.phalanx, rangePerLevel: 500 } } as never).join(" ");
    expect(errs).toMatch(/Lunes : phalange : « Portée par niveau de lune » \(rangePerLevel\) doit être entre 0 et 200/);
    expect(validateRules({ ...r, vacation: { ...r.vacation, productionFactor: 1 } } as never)).toEqual([]);
    expect(validateRules({ ...r, fleets: { ...r.fleets, mapSize: 5 } } as never).join(" ")).toMatch(/Taille de la carte/);
  });
});
