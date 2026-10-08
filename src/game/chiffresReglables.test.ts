import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, defaultGameContent, validateGameContent, validateRules } from "@/game/content";
import { BOUNTY_SHOP_RULES, findShopItem, nextPatronTier, PATRON_TIERS, patronTier, SHOP_ITEMS } from "@/game/bounties";
import { DEFAULT_TALENTS, TALENTS, talentDescription, talentEffects } from "@/game/talents";
import { COLONY_SPECS, colonySpecEffects } from "@/game/colonies";
import { MODULE_FAMILIES, MODULE_RARITIES, moduleValue } from "@/game/modules";
import { LEAGUE_TIERS } from "@/game/leagues";
import { CHALLENGE_TYPES, startChallenge } from "@/game/challenges";
import { WEEKLY_OFFERS, WEEKLY_STOCK_RULES } from "@/game/weeklyStock";
import { PATRON_RULES } from "@/game/patrons";
import { PASS_OVERFLOW } from "@/game/seasonPass";
import { EFFECT_PRESET_RULES, findEffectPreset } from "@/game/effectCatalog";
import { UNIT_AUDIT_RULES } from "@/game/unitClasses";
import { warlordAlertRatio, warlordPowerAlerts } from "@/game/warlords";
import { pvpAttackBand } from "@/game/balance/diagnostics";
import { costValue, rareValue } from "@/game/balance/analysis";
import { REGISTERED_RULES } from "@/game/ruleRegistry";

/* =====================================================
   6.14.104 (AU27, lot AA3 : constats AA-1 à AA-13, AA-29, AA-32) : chiffres
   en dur rendus réglables, valeurs inchangées. Les valeurs attendues
   ci-dessous sont celles du code avant le lot (relevé du 2026-10-07) : un
   défaut qui change fait échouer ce test.
===================================================== */

afterEach(() => applyGameContent({}));

const SHOP_PRICES = {
  accelerator: 30, boost: 80, jammer: 50, beacon: 60, shield: 150, dossier: 40, phantom: 40, painkiller: 50, reroll: 70, priority: 60, pheromone: 90,
  vendettaToken: 120, blueprint: 600, planner: 600, title: 120, frame: 200, emblem: 150, emojis: 80, nameColor: 120, keshReaction: 60, roomBanner: 80, planetFx: 200,
};
const TALENT_PER_RANK = {
  rendement: 0.02, fonderies: 0.02, reacteurs: 0.02, nanoforges: 0.02, archivistes: 0.02, assaut: 0.02, rempart: 0.02, ateliers: 0.02, sentinelles: 0.02,
  reseau: 0.2, chantiers: 0.02, laboratoires: 0.02, entrepots: 0.02, soutes: 0.02, intendance: 0.02,
};
const SPECS = {
  forge: { production: 1.25, deposit: 0.8 },
  extraction: { production: 0.9, deposit: 1.6 },
  bastion: { production: 0.9, hangar: 1.5, defenseTime: 0.7 },
  depot: { storage: 1.6 },
};
const RARITY = { common: [60, 1], rare: [28, 3], epic: [10, 8], legendary: [2, 20] };
const FAMILY_VALUES = {
  armement: { common: 0.04, rare: 0.07, epic: 0.11, legendary: 0.16 },
  blindage: { common: 0.05, rare: 0.08, epic: 0.12, legendary: 0.18 },
  soute: { common: 0.04, rare: 0.07, epic: 0.11, legendary: 0.16 },
  propulsion: { common: 0.03, rare: 0.05, epic: 0.08, legendary: 0.12 },
  voile: { common: 1, rare: 2, epic: 3, legendary: 4 },
};
const DIVISIONS = { bronze: [1, 0.25], argent: [1, 0.25], or: [2, 0.2], platine: [2, 0.15], diamant: [3, 0.1], mythique: [4, 0.05] };
const PER_ACTIVE = { raids: 3, missions: 25, units: 400, market: 2_000_000, expeditions: 6, bounties: 8 };
const PATRONS = { bronze: 25, argent: 100, or: 500, grand: 2000 };
const BUDGETS = {
  unit: { relic: 2.5, tech: 0.03, officer: 0.01 },
  group: { relic: 1.5, tech: 0.02, officer: 0.006 },
  wide: { relic: 1, tech: 0.01, officer: 0.004 },
  edge: { relic: 0.5, tech: 0.005, officer: 0.002 },
  elite: { relic: 1, tech: 0.01, officer: 0.004 },
};

describe("6.14.104 AA3 : chiffres des listes fixes réglables, défauts inchangés", () => {
  it("les défauts des règles valent les anciens chiffres du code", () => {
    expect(BOUNTY_SHOP_RULES.prices).toEqual(SHOP_PRICES);
    // 6.14.127 (AA9) : valeurs par rang dans la section « talents » (effets composés).
    expect(Object.fromEntries(DEFAULT_TALENTS.map((t) => [t.id, t.effects[0].value]))).toEqual(TALENT_PER_RANK);
    expect((REGISTERED_RULES.colonySpec.target() as { specs: unknown }).specs).toEqual(SPECS);
    expect(WEEKLY_STOCK_RULES.tokensBag).toBe(25);
    expect(PATRON_RULES.tiers).toEqual(PATRONS);
    expect(PASS_OVERFLOW.capsuleAmber).toBe(15);
    expect(EFFECT_PRESET_RULES.budgets).toEqual(BUDGETS);
    expect([UNIT_AUDIT_RULES.warlordAlertRatio, UNIT_AUDIT_RULES.pvpAttackLow, UNIT_AUDIT_RULES.pvpAttackHigh, UNIT_AUDIT_RULES.rareValue]).toEqual([1.5, 40, 65, 50]);
  });

  it("les listes lisent les mêmes chiffres qu'avant (prix, valeurs, textes)", () => {
    expect(Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i.price]))).toEqual(SHOP_PRICES);
    expect(Object.fromEntries(TALENTS.map((t) => [t.id, t.effects[0].value]))).toEqual(TALENT_PER_RANK);
    for (const s of COLONY_SPECS) expect(colonySpecEffects({ spec: s.id }), s.id).toEqual({ production: 1, deposit: 1, storage: 1, hangar: 1, defenseTime: 1, ...SPECS[s.id] });
    expect(Object.fromEntries(MODULE_RARITIES.map((r) => [r.id, [r.weight, r.recycleAmber]]))).toEqual(RARITY);
    expect(Object.fromEntries(Object.entries(MODULE_FAMILIES).map(([k, f]) => [k, f.values]))).toEqual(FAMILY_VALUES);
    expect(Object.fromEntries(LEAGUE_TIERS.map((t) => [t.id, [t.tokens, t.placementPct]]))).toEqual(DIVISIONS);
    expect(Object.fromEntries(Object.entries(CHALLENGE_TYPES).map(([k, c]) => [k, c.perActive]))).toEqual(PER_ACTIVE);
    expect(Object.fromEntries(PATRON_TIERS.map((t) => [t.id, t.at]))).toEqual(PATRONS);
    expect(findEffectPreset("sentinelle_attaque")?.suggest).toEqual(BUDGETS.unit);
    expect(findEffectPreset("defenses_pv")?.suggest).toEqual(BUDGETS.wide);
    expect(warlordAlertRatio()).toBe(1.5);
    expect(pvpAttackBand()).toEqual({ low: 40, high: 65 });
    expect(rareValue()).toBe(50);
    // Textes : identiques à l'ancien code tant que les réglages sont ceux par défaut.
    expect(findShopItem("accelerator")?.description).toBe("Une construction de bâtiment en cours se termine 1 h plus tôt.");
    expect(findShopItem("boost")?.description).toBe("Production +20 % pendant 24 h (cumulable dans le temps).");
    expect(findShopItem("shield")?.description).toBe("Bouclier de 6 h contre les attaques de joueurs. Une fois par semaine ; attaquer le lève.");
    expect(findShopItem("title")?.name).toBe("Titre « Chasseur de l'Essaim »");
    expect(findShopItem("dossier")?.description).toBe("+200 XP pour l'officier de ton choix, même hors poste (page Commandants).");
    expect(findShopItem("priority")?.description).toBe("Ton prochain contrat de livraison passe en tête des contrats visibles pendant 24 h. 3 en réserve au plus.");
    expect(COLONY_SPECS.map((s) => s.summary)).toEqual([
      "Ressources communes +25 %, gisement rare −20 %.",
      "Gisement rare +60 %, ressources communes −10 %.",
      "Hangar de défense +50 % et défenses 30 % plus rapides, production −10 %.",
      "Entrepôt +60 % : la colonie stocke plus longtemps sans perte.",
    ]);
    expect(talentDescription(TALENTS.find((t) => t.id === "reseau")!)).toBe("Niveau d'espionnage (+0,2 par rang).");
    expect(WEEKLY_OFFERS.find((o) => o.id === "tokens")?.description).toBe("25 jetons pour la machine à sous du pot commun.");
  });

  it("un réglage de l'admin s'applique aux listes et aux textes", () => {
    applyGameContent({
      rules: {
        bountyShop: { prices: { boost: 99 }, boostHours: 12 },
        economy: { keshBoostPct: 0.3 },
        talents: { perRank: { assaut: 0.03 } },
        colonySpec: { specs: { forge: { production: 1.3 } } },
        modules: { rarityWeights: { legendary: 4 }, familyValues: { armement: { epic: 0.12 } } },
        leagues: { tiers: { mythique: { tokens: 5 } } },
        weeklyChallenge: { perActive: { raids: 4 } },
        weeklyStock: { tokensBag: 30 },
        patrons: { tiers: { or: 600 } },
        passOverflow: { capsuleAmber: 20 },
        effectPresets: { budgets: { unit: { tech: 0.04 } } },
        unitAudit: { warlordAlertRatio: 2, rareValue: 40 },
      },
    } as never);
    expect(findShopItem("boost")?.price).toBe(99);
    expect(findShopItem("boost")?.description).toBe("Production +30 % pendant 12 h (cumulable dans le temps).");
    expect(findShopItem("accelerator")?.price).toBe(30); // le reste des prix garde son défaut
    // 6.14.127 (AA9) : ancien réglage `rules.talents.perRank` lu tant que la section « talents » n'est pas enregistrée.
    expect(TALENTS.find((t) => t.id === "assaut")?.effects[0].value).toBe(0.03);
    expect(talentEffects({ talents: { ranks: { assaut: 2 } } } as never)[0].value).toBeCloseTo(0.06);
    expect(colonySpecEffects({ spec: "forge" })).toMatchObject({ production: 1.3, deposit: 0.8 });
    expect(COLONY_SPECS[0].summary).toBe("Ressources communes +30 %, gisement rare −20 %.");
    expect(MODULE_RARITIES.find((r) => r.id === "legendary")?.weight).toBe(4);
    expect(MODULE_RARITIES.find((r) => r.id === "common")?.weight).toBe(60);
    expect(moduleValue({ template: "canons_surcharges", rarity: "epic" })).toBe(0.12);
    expect(moduleValue({ template: "canons_surcharges", rarity: "rare" })).toBe(0.07);
    expect(LEAGUE_TIERS.find((t) => t.id === "mythique")).toMatchObject({ tokens: 5, placementPct: 0.05 });
    expect(CHALLENGE_TYPES.raids.perActive).toBe(4);
    const ch = startChallenge(1_900_000_000_000, 10);
    expect(ch.target).toBe(CHALLENGE_TYPES[ch.type].perActive * 10);
    expect(WEEKLY_OFFERS.find((o) => o.id === "tokens")?.description).toBe("30 jetons pour la machine à sous du pot commun.");
    expect(WEEKLY_STOCK_RULES.prices.tokens).toBe(120); // champ voisin gardé
    expect(PATRON_TIERS.map((t) => t.at)).toEqual([25, 100, 600, 2000]);
    expect(patronTier(550)?.id).toBe("argent");
    expect(nextPatronTier(550)?.at).toBe(600);
    expect(PATRON_RULES.top).toBe(10);
    expect(PASS_OVERFLOW.capsuleAmber).toBe(20);
    expect(findEffectPreset("sentinelle_attaque")?.suggest).toEqual({ relic: 2.5, tech: 0.04, officer: 0.01 });
    expect(warlordPowerAlerts([{ id: "w", name: "W", power: 190 }], [100, 100]).alerts).toHaveLength(0); // ×1,9 < ×2
    expect(costValue({ scrap: 10, reinforcedSteel: 1 })).toBe(50);
    applyGameContent({});
    expect(findShopItem("boost")?.price).toBe(80);
    expect(warlordPowerAlerts([{ id: "w", name: "W", power: 190 }], [100, 100]).alerts).toHaveLength(1);
  });

  it("validation : chiffres des listes fixes hors bornes refusés", () => {
    const r = currentGameContent().rules as unknown as Record<string, Record<string, unknown>>;
    const errs = (patch: Record<string, unknown>) => validateRules({ ...r, ...patch } as never).join(" ");
    expect(validateRules(defaultGameContent().rules)).toEqual([]);
    expect(errs({ bountyShop: { ...r.bountyShop, prices: { ...(r.bountyShop.prices as object), boost: 0 } } })).toMatch(/prix de « boost »/);
    const talents = DEFAULT_TALENTS.map((t) => (t.id === "assaut" ? { ...t, effects: [{ ...t.effects[0], value: 0.5 }] } : t));
    expect(validateGameContent({ ...currentGameContent(), talents }).join(" ")).toMatch(/Doctrine d'assaut : effet n° 1, valeur par rang entre 0 et 0,25/);
    expect(errs({ colonySpec: { ...r.colonySpec, specs: { ...(r.colonySpec.specs as object), depot: { storage: 9 } } } })).toMatch(/« depot », multiplicateur « storage »/);
    expect(errs({ modules: { ...r.modules, rarityWeights: { common: 0, rare: 0, epic: 0, legendary: 0 } } })).toMatch(/au moins un non nul/);
    expect(errs({ leagues: { ...r.leagues, tiers: { ...(r.leagues.tiers as object), bronze: { tokens: 1, placementPct: 0.5 } } } })).toMatch(/elles doivent faire 100 %/);
    expect(errs({ patrons: { ...r.patrons, tiers: { bronze: 25, argent: 600, or: 500, grand: 2000 } } })).toMatch(/croissants/);
    expect(errs({ weeklyStock: { ...r.weeklyStock, tokensBag: 0 } })).toMatch(/sac de jetons/);
  });

  it("bornes croisées (Q260) : minimum ≤ maximum, seuils dans l'ordre", () => {
    const r = currentGameContent().rules as unknown as Record<string, Record<string, unknown>>;
    const errs = (group: string, patch: Record<string, unknown>) => validateRules({ ...r, [group]: { ...r[group], ...patch } } as never).join(" ");
    expect(errs("warlords", { travelMinHours: 6, travelMaxHours: 5 })).toMatch(/« Trajet minimal » \(travelMinHours\) doit être inférieur ou égal à « Trajet maximal » \(travelMaxHours\)/);
    expect(errs("chatRooms", { nameMin: 20, nameMax: 10 })).toMatch(/nameMin/);
    expect(errs("rename", { minLength: 15, maxLength: 10 })).toMatch(/minLength/);
    expect(errs("bossPhases", { shieldPct: 0.5, ripostePct: 0.5 })).toMatch(/shieldPct\) doit être inférieur à/);
    expect(errs("expeditions", { depositMinHours: 4, depositMaxHours: 3 })).toMatch(/depositMinHours/);
    expect(errs("expeditions", { forceMinPower: 0.9, forceMaxPower: 0.8 })).toMatch(/forceMinPower/);
    expect(errs("unitAudit", { pvpAttackLow: 70 })).toMatch(/pvpAttackLow/);
    expect(errs("jumpGate", { cooldownMinHours: 30 })).toMatch(/cooldownMinHours/);
    // Égalité permise hors seuils stricts ; un réglage partiel est fusionné avant le contrôle.
    expect(validateRules({ warlords: { travelMinHours: 5 } } as never)).toEqual([]);
    expect(validateRules({ warlords: { travelMinHours: 6 } } as never).join(" ")).toMatch(/travelMinHours/);
  });
});
