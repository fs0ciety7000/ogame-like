import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateGameContent } from "@/game/content";
import { contentChainGaps } from "@/game/contentChain";
import { seededRandom } from "@/game/contracts";
import { defaultPlayerState } from "@/game/defaults";
import { effectImpactReport } from "@/game/impact";
import {
  addModuleItem,
  buildModule,
  describeModule,
  findModuleTemplate,
  MODULE_FAMILIES,
  MODULE_RARITIES,
  MODULE_TEMPLATES,
  moduleEffects,
  moduleMountClasses,
  modulesState,
  moduleValue,
  mountModule,
  rollModulePlan,
  SIGNATURE_MODULE_RULES,
  SIGNATURE_PREFIX,
  signatureUnits,
  validateModuleContent,
  DEFAULT_MODULE_FAMILIES,
  DEFAULT_MODULE_TEMPLATES,
} from "@/game/modules";
import { DEFAULT_RELICS, defaultRelicSettings, RELIC_SOURCE_RULES, RELIC_SOURCES, relicSourceOf, RELICS, rollRelic, setRelics, validateRelics } from "@/game/relics";
import { unitClasses } from "@/game/unitClasses";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.14.133 (AU27, lot AJ27-10, constats AJ-11 et AJ-1 ; Q65, Q67) : reliques par source (poids réglable, × 3 depuis une
   source favorite) et plans de module « signature » (un porteur propre par unité), sous les plafonds du circuit d'effets. */

const NOW = Date.UTC(2026, 9, 8, 12);
const player = () => ({ ...defaultPlayerState("u1", "U1") }) as PlayerState;

afterEach(() => {
  SIGNATURE_MODULE_RULES.enabled = true;
  SIGNATURE_MODULE_RULES.chance = 0.15;
  RELIC_SOURCE_RULES.enabled = true;
  RELIC_SOURCE_RULES.sourceBoost = 3;
  applyGameContent({});
});

describe("6.14.133 : plans de module signature", () => {
  it("un par unité, sauf celles qu'une relique vise déjà ; plus aucun porteur propre manquant", () => {
    const relicTargets = DEFAULT_RELICS.filter((r) => r.custom?.target?.startsWith("unit:")).map((r) => r.custom!.target!.slice(5));
    expect(relicTargets).toEqual(["sentinelle"]);
    expect(signatureUnits().sort()).toEqual(UNITS.map((u) => u.id).filter((id) => !relicTargets.includes(id)).sort());
    expect(signatureUnits()).toHaveLength(23);
    expect(contentChainGaps().filter((g) => g.endsWith(":carrierOwn"))).toEqual([]);
  });

  it("modèle généré : nom et texte lus dans la règle, famille selon l'unité, monté sur la classe de l'unité", () => {
    const fighter = UNITS.find((u) => u.stats.attaque > 0 && signatureUnits().includes(u.id))!;
    const t = findModuleTemplate(`${SIGNATURE_PREFIX}${fighter.id}`)!;
    expect(t.unit).toBe(fighter.id);
    expect(t.name).toBe(SIGNATURE_MODULE_RULES.name.split("{name}").join(fighter.name));
    expect(t.family).toBe(SIGNATURE_MODULE_RULES.attackFamily);
    expect(moduleMountClasses(t)).toEqual([unitClasses()[fighter.id]]);
    const support = UNITS.find((u) => !(u.stats.attaque > 0) && signatureUnits().includes(u.id))!;
    expect(findModuleTemplate(`${SIGNATURE_PREFIX}${support.id}`)!.family).toBe(SIGNATURE_MODULE_RULES.supportFamily);
    // Textes réglables.
    applyGameContent({ rules: { ...currentGameContent().rules, signatureModules: { ...SIGNATURE_MODULE_RULES, name: "Sceau de {name}" } } } as never);
    expect(findModuleTemplate(`${SIGNATURE_PREFIX}${fighter.id}`)!.name).toBe(`Sceau de ${fighter.name}`);
  });

  it("effet : vise l'unité seule, valeur de la famille × le facteur ; refusé hors de sa classe", () => {
    const u = UNITS.find((x) => x.stats.attaque > 0 && signatureUnits().includes(x.id))!;
    const cls = unitClasses()[u.id];
    const other = (["light", "medium", "heavy", "support"] as const).find((c) => c !== cls)!;
    const p = player();
    addModuleItem(p, { id: "s1", template: `${SIGNATURE_PREFIX}${u.id}`, rarity: "epic", built: false, foundAtMs: NOW, source: "test" });
    buildModule(p, "s1", () => {});
    expect(() => mountModule(p, "s1", other, 0)).toThrow(/se monte sur/);
    mountModule(p, "s1", cls, 0);
    const [e] = moduleEffects(p);
    expect(e.target).toBe(`unit:${u.id}`);
    expect(e.value).toBeCloseTo(MODULE_FAMILIES[SIGNATURE_MODULE_RULES.attackFamily].values.epic * SIGNATURE_MODULE_RULES.factor, 6);
    expect(describeModule({ template: `${SIGNATURE_PREFIX}${u.id}`, rarity: "epic" })).toContain(u.name);
  });

  it("sous les plafonds : chaque ligne signature du rapport d'impact est sous le plafond (deux légendaires montés)", () => {
    const rows = effectImpactReport().filter((r) => r.target?.startsWith("unit:") && r.sources.some((s) => s.kind === "module"));
    expect(rows.length).toBe(signatureUnits().length);
    for (const r of rows) expect(r.capped, r.target).toBe(false);
  });

  it("tirage : un plan rare ou mieux sort parfois signature, jamais un commun ; chance nulle : le tirage d'avant", () => {
    SIGNATURE_MODULE_RULES.chance = 1;
    const sig = rollModulePlan("test", NOW, seededRandom("a"), "rare");
    expect(sig.template.startsWith(SIGNATURE_PREFIX)).toBe(true);
    for (let i = 0; i < 50; i++) {
      const p = rollModulePlan("test", NOW, seededRandom(`c${i}`), "common");
      if (p.rarity === "common") expect(p.template.startsWith(SIGNATURE_PREFIX)).toBe(false);
    }
    // Chance nulle : même rareté, même modèle, même identifiant qu'un tirage sans plans signature (aucun appel en plus).
    SIGNATURE_MODULE_RULES.chance = 0;
    for (let i = 0; i < 50; i++) {
      const a = rollModulePlan("test", NOW, seededRandom(`z${i}`), "rare");
      const rand = seededRandom(`z${i}`);
      const pool = MODULE_RARITIES.slice(1);
      let roll = rand() * pool.reduce((s, r) => s + r.weight, 0);
      let rarity = pool[pool.length - 1].id;
      for (const r of pool) if ((roll -= r.weight) < 0) {
        rarity = r.id;
        break;
      }
      const tpl = MODULE_TEMPLATES[Math.floor(rand() * MODULE_TEMPLATES.length) % MODULE_TEMPLATES.length].id;
      expect([a.rarity, a.template]).toEqual([rarity, tpl]);
    }
  });

  it("un plan signature trouvé ne disparaît jamais (unité retirée, plans coupés), sans effet s'il n'a plus d'unité", () => {
    const p = player();
    addModuleItem(p, { id: "g1", template: `${SIGNATURE_PREFIX}unite_disparue`, rarity: "rare", built: true, foundAtMs: NOW, source: "test" });
    SIGNATURE_MODULE_RULES.enabled = false;
    expect(modulesState(p).items.map((m) => m.id)).toEqual(["g1"]);
    expect(moduleMountClasses(findModuleTemplate(`${SIGNATURE_PREFIX}unite_disparue`))).toEqual([]);
    expect(() => mountModule(p, "g1", "light", 0)).toThrow(/n'existe plus/);
    expect(moduleValue({ template: `${SIGNATURE_PREFIX}unite_disparue`, rarity: "rare" })).toBeGreaterThan(0);
  });

  it("validation : `sig_` réservé dans les modèles ; rareté et familles connues", () => {
    expect(validateModuleContent(DEFAULT_MODULE_FAMILIES, [...DEFAULT_MODULE_TEMPLATES, { id: "sig_x", name: "X", family: "armement", description: "" }]).join(" ")).toMatch(/réservé/);
    const c = currentGameContent();
    expect(validateGameContent({ ...c, rules: { ...c.rules, signatureModules: { ...SIGNATURE_MODULE_RULES, minRarity: "mythic" } } } as never).join(" ")).toMatch(/rareté minimale/);
    expect(validateGameContent({ ...c, rules: { ...c.rules, signatureModules: { ...SIGNATURE_MODULE_RULES, attackFamily: "inconnue" } } } as never).join(" ")).toMatch(/famille « inconnue »/);
    expect(validateGameContent(c)).toEqual([]);
  });
});

describe("6.14.133 : reliques par source (AJ-11, Q67)", () => {
  it("source d'un tirage d'après son libellé", () => {
    expect(relicSourceOf("expedition")).toBe("expedition");
    expect(relicSourceOf("loot:warlord")).toBe("warlord");
    expect(relicSourceOf("vendetta:x")).toBe("warlord");
    expect(relicSourceOf("leviathan")).toBe("worldBoss");
    expect(relicSourceOf("boss:2026-11")).toBe("seasonBoss");
    expect(relicSourceOf("elite")).toBe("bounty");
    expect(relicSourceOf("weekly")).toBe("shop");
    expect(relicSourceOf("admin")).toBeNull();
    for (const s of RELIC_SOURCES) expect(relicSourceOf(`loot:${s}`) ?? s, s).toBe(s);
  });

  it("une relique tombe × 3 plus souvent depuis sa source (Trophée de seigneur en vendetta)", () => {
    const count = (source: string) => {
      let n = 0;
      for (let i = 0; i < 8000; i++) if (rollRelic(source, NOW, seededRandom(`r${i}`)).template === "trophee_seigneur") n++;
      return n / 8000;
    };
    const fromWarlord = count("vendetta:x");
    const elsewhere = count("admin");
    expect(fromWarlord / elsewhere).toBeGreaterThan(2.3);
    expect(fromWarlord / elsewhere).toBeLessThan(3.7);
  });

  it("sans source favorite (source inconnue, ou réglage coupé) : le tirage d'avant, même graine, même relique", () => {
    const old = (rand: () => number) => {
      const rarities = [
        ["common", 60],
        ["rare", 28],
        ["epic", 10],
        ["legendary", 2],
      ] as const;
      let pick = rand() * 100;
      let rarity: string = "legendary";
      for (const [id, w] of rarities) if ((pick -= w) < 0) {
        rarity = id;
        break;
      }
      const templates = RELICS.filter((t) => !t.disabled && !t.mythicOnly && (!t.legendaryOnly || rarity === "legendary"));
      return templates[Math.floor(rand() * templates.length) % templates.length].id;
    };
    for (let i = 0; i < 200; i++) expect(rollRelic("admin", NOW, seededRandom(`o${i}`)).template).toBe(old(seededRandom(`o${i}`)));
    RELIC_SOURCE_RULES.enabled = false;
    for (let i = 0; i < 200; i++) expect(rollRelic("vendetta:x", NOW, seededRandom(`v${i}`)).template).toBe(old(seededRandom(`v${i}`)));
  });

  it("poids 0 : jamais tirée au hasard ; liste enregistrée avant 6.14.133 : reprend les sources livrées, une liste vide est gardée", () => {
    const settings = defaultRelicSettings();
    setRelics(DEFAULT_RELICS.map((t) => (t.id === "soute_pliee" ? { ...t, weight: 0 } : t)), settings);
    for (let i = 0; i < 2000; i++) expect(rollRelic("expedition", NOW, seededRandom(`w${i}`)).template).not.toBe("soute_pliee");
    setRelics(
      DEFAULT_RELICS.map((t) => {
        const { sources: _s, ...rest } = t;
        return t.id === "lame_duelliste" ? { ...rest, sources: [] } : rest;
      }),
      settings,
    );
    expect(RELICS.find((t) => t.id === "trophee_seigneur")!.sources).toEqual(["warlord"]);
    expect(RELICS.find((t) => t.id === "lame_duelliste")!.sources).toEqual([]);
    setRelics(DEFAULT_RELICS, settings);
  });

  it("validation : source connue, poids entre 0 et 100", () => {
    const s = defaultRelicSettings();
    expect(validateRelics(DEFAULT_RELICS, s)).toEqual([]);
    expect(validateRelics([...DEFAULT_RELICS, { ...DEFAULT_RELICS[0], id: "x1", sources: ["lune" as never] }], s).join(" ")).toMatch(/source inconnue/);
    expect(validateRelics([...DEFAULT_RELICS, { ...DEFAULT_RELICS[0], id: "x2", weight: 500 }], s).join(" ")).toMatch(/poids de tirage/);
  });
});
