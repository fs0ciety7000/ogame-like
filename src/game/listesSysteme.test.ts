import { afterEach, describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { buildSlots } from "@/game/buildPlan";
import { applyGameContent, defaultGameContent, validateGameContent, validateRules } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { defaultEmpireClasses, empireClasses, empireClassEffects, type EmpireClassDef } from "@/game/empireClass";
import { chooseEmpireClass } from "@/game/empireClassChoose";
import { fleetSlots } from "@/game/fleets";
import { playerModifiers } from "@/game/modifiers";
import { bountyFugitives, fugitiveAt, generateBoard } from "@/game/bounties";
import { defaultMutatorDefs, MUTATOR_RULES, mutatorEffects, mutatorFor, mutatorList, validateMutatorRules } from "@/game/mutators";
import { DEFAULT_FACTIONS, type FactionDef } from "@/game/pirates";
import { ARCHETYPES, chapterArchetypes, generateChapter, worldDigest } from "@/game/procedural";
import { generateAllianceSaga } from "@/game/allianceSaga";
import { effectImpactReport } from "@/game/impact";
import type { PlayerState } from "@/types/game";

/* 6.14.125 (AU27, lot AA7, constats AA-3, AA-6, AA-20) : listes système éditables. Classes d'empire et mutateurs en effets
   composés chiffrés, fugitifs dans la fiche de faction, archétype de repli pour une faction ajoutée. À contenu par défaut, les
   valeurs sont celles d'avant le lot (comparaison complète faite sur l'arbre d'avant : classes, 60 mois de mutateurs,
   144 tableaux de primes, 31 chapitres et sagas, 0 différence) ; ce fichier fige les points clés. */

const NOW = Date.UTC(2026, 9, 7, 12);

function player(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Liste"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 1, unlocked: true };
  return p;
}

afterEach(() => {
  applyGameContent({});
  MUTATOR_RULES.enabled = false;
});

/** Fugitifs d'avant la 6.14.125 (liste FUGITIVES, dans l'ordre : un contrat garde l'indice de son fugitif). */
const OLD_FUGITIVES = [
  "Korr le Rouilleux", "Mira Tessane", "Le Borgne Halvik", "Drest Oumane", "Vrask Deux-Cornes", "Ulla la Muette", "Thokk Sang-Gris", "Brenna Kesh-Tueuse",
  "Frère Anselme Dor", "Sœur Ilvane", "Le Diacre Morrow", "Inquisitrice Talas", "Rico Vant", "Lady Sabre", "Doc Ferro", "Les Jumeaux Kalis",
  "Grenn Croc-Noir", "Skarra", "Vieux Loup Odrik", "Fenra Œil-Rouge", "L'Écho Vashtar", "Maître-Chantre Ilos",
];

describe("AA7 : à contenu par défaut, rien ne change", () => {
  it("classes : mêmes effets et mêmes avantages", () => {
    applyGameContent({});
    expect(empireClasses().map((c) => [c.id, c.effects, c.perks])).toEqual([
      ["industriel", [{ stat: "productionAll", value: 0.1 }, { stat: "buildTime", value: 0.08 }, { stat: "storage", value: 0.1 }], { buildSlots: 1 }],
      ["seigneur", [{ stat: "attack", value: 0.05 }, { stat: "loot", value: 0.15 }, { stat: "unitTime", value: 0.1 }], { fleetSlots: 2 }],
      ["explorateur", [{ stat: "researchTime", value: 0.08 }, { stat: "cargo", value: 0.15 }, { stat: "spyLevel", value: 1 }], { expeditionsPerDay: 1 }],
    ]);
    const p = player();
    chooseEmpireClass(p, "industriel", NOW);
    expect(playerModifiers(p, NOW)).toMatchObject({ productionAll: 0.1, buildTime: 0.08, storage: 0.1 });
  });

  it("mutateurs : mêmes tirages et mêmes effets ; fugitifs : même liste ; archétypes : même liste", () => {
    applyGameContent({});
    MUTATOR_RULES.enabled = true;
    // Tirages d'octobre 2026 à septembre 2027, relevés avant le lot.
    const months = Array.from({ length: 12 }, (_, i) => (i < 3 ? `2026-${10 + i}` : `2027-${String(i - 2).padStart(2, "0")}`));
    // 6.14.136 (AP-L9) : ancien tirage relu avec `noRepeatMonths` 0 ; le tirage sans répétition (dès 2027-01) garde octobre à janvier.
    MUTATOR_RULES.noRepeatMonths = 0;
    expect(months.map((m) => mutatorFor(m)?.id)).toEqual(["vents", "guerre", "chantiers", "soutes", "rempart", "marchands", "vents", "savoir", "rempart", "guerre", "rempart", "marchands"]);
    MUTATOR_RULES.noRepeatMonths = 6;
    expect(months.slice(0, 4).map((m) => mutatorFor(m)?.id)).toEqual(["vents", "guerre", "chantiers", "soutes"]);
    expect(mutatorList().map((m) => m.id)).toEqual(["ruee", "chantiers", "savoir", "vents", "guerre", "rempart", "marchands", "chantiers_navals", "soutes", "chasse"]);
    expect(bountyFugitives().map((f) => f.name)).toEqual(OLD_FUGITIVES);
    expect(generateBoard("u1", 100, 5).map((c) => fugitiveAt(c.fugitive).name).every((n) => OLD_FUGITIVES.includes(n))).toBe(true);
    expect(chapterArchetypes()).toBe(ARCHETYPES);
  });
});

describe("AA7 : classes d'empire éditables (AA-3)", () => {
  const marchand: EmpireClassDef = {
    id: "marchand",
    name: "Marchand",
    emoji: "💱",
    tagline: "Tu vends cher.",
    effects: [
      { stat: "tradeTax", value: 0.2 },
      { stat: "unitAttack", target: "class:light", scope: "pve", value: 0.1 },
    ],
    perks: { fleetSlots: 1, buildSlots: 1 },
  };

  it("une classe ajoutée dans l'admin a un effet réel (effets et avantages)", () => {
    applyGameContent({ rules: { classes: { defs: [...defaultEmpireClasses(), marchand] } } } as never);
    const p = player();
    const before = { fleet: fleetSlots(p), build: buildSlots(p) };
    chooseEmpireClass(p, "marchand", NOW);
    expect(playerModifiers(p, NOW).tradeTax).toBeCloseTo(0.2);
    expect(empireClassEffects(p).find((g) => g.stat === "unitAttack")).toMatchObject({ target: "class:light", scope: "pve", value: 0.1, source: { kind: "class", id: "marchand" } });
    expect(fleetSlots(p)).toBe(before.fleet + 1);
    expect(buildSlots(p)).toBe(before.build + 1);
    expect(effectImpactReport().some((r) => r.sources.some((s) => s.kind === "class" && s.label === "Marchand"))).toBe(true);
  });

  it("une classe livrée retirée de la liste revient ; une valeur réglée s'applique", () => {
    const defs = defaultEmpireClasses().filter((c) => c.id !== "seigneur");
    defs[0] = { ...defs[0], effects: [{ stat: "productionAll", value: 0.12 }] };
    applyGameContent({ rules: { classes: { defs } } } as never);
    expect(empireClasses().map((c) => c.id)).toEqual(["industriel", "explorateur", "seigneur"]);
    const p = player();
    chooseEmpireClass(p, "industriel", NOW);
    expect(playerModifiers(p, NOW).productionAll).toBeCloseTo(0.12);
  });

  it("refuse une classe mal formée et un vaisseau d'une classe inconnue", () => {
    const bad = (patch: Partial<EmpireClassDef>) => validateRules({ classes: { ...defaultGameContent().rules.classes, defs: [...defaultEmpireClasses(), { ...marchand, ...patch }] } } as never);
    expect(bad({})).toEqual([]);
    expect(bad({ effects: [] }).join(" ")).toMatch(/au moins un effet/);
    expect(bad({ effects: [{ stat: "buildTime", value: 0.95 }] }).join(" ")).toMatch(/entre 0 et 0,9/);
    expect(bad({ effects: [{ stat: "nope" as never, value: 0.1 }] }).join(" ")).toMatch(/inconnue/);
    expect(bad({ id: "Marchand!" }).join(" ")).toMatch(/identifiant/);
    expect(bad({ perks: { fleetSlots: 50 } }).join(" ")).toMatch(/avantage/);
    expect(bad({ id: "industriel" }).join(" ")).toMatch(/en double/);
    const content = defaultGameContent();
    const units = content.units.map((u) => (u.id === "recolteur" ? { ...u, empireClass: "inconnue" } : u));
    expect(validateGameContent({ ...content, units }).join(" ")).toMatch(/classe d'empire « inconnue » inconnue/);
  });
});

describe("AA7 : mutateurs éditables (AA-6)", () => {
  it("un mutateur ajouté a un effet réel et une description construite depuis ses effets", () => {
    const defs = [...defaultMutatorDefs(), { id: "abondance", name: "Abondance", emoji: "🌾", flavor: "Les silos débordent", effects: [{ stat: "storage" as const, value: 0.3 }, { stat: "production" as const, target: "scrap", value: 0.05 }] }];
    applyGameContent({ rules: { mutators: { enabled: true, overrides: { "2026-10": "abondance" }, defs } } } as never);
    const m = mutatorFor("2026-10");
    expect(m?.description).toBe("Les silos débordent : +30 % de capacité des entrepôts et +5 % de production de ferraille.");
    expect(mutatorEffects(NOW).map((g) => [g.stat, g.target, g.value])).toEqual([
      ["storage", undefined, 0.3],
      ["production", "scrap", 0.05],
    ]);
    expect(playerModifiers(player(), NOW).storage).toBeCloseTo(0.3);
  });

  it("des règles enregistrées avec l'ancien « values » donnent les mutateurs livrés à ces valeurs", () => {
    applyGameContent({ rules: { mutators: { enabled: true, overrides: { "2026-10": "guerre" }, values: { guerre: [0.1, 0.3] } } } } as never);
    expect(mutatorFor("2026-10")?.description).toBe("Le secteur s'embrase : +10 % d'attaque et +30 % de butin pillé.");
    expect(mutatorList()).toHaveLength(10);
  });

  it("refuse une liste mal formée", () => {
    const one = (patch: object) => validateMutatorRules({ enabled: true, overrides: {}, defs: [{ id: "x1", name: "X", emoji: "", effects: [{ stat: "cargo", value: 0.1 }], ...patch }] });
    expect(one({})).toEqual([]);
    expect(one({ effects: [] }).join(" ")).toMatch(/au moins un effet/);
    expect(one({ id: "none" }).join(" ")).toMatch(/identifiant/);
    expect(validateMutatorRules({ enabled: true, overrides: { "2026-10": "absent" }, defs: defaultMutatorDefs() }).join(" ")).toMatch(/inconnu/);
    expect(validateMutatorRules({ enabled: true, overrides: {}, defs: [] }).join(" ")).toMatch(/au moins un mutateur/);
  });
});

describe("AA7 : factions ajoutées dans l'admin (AA-20)", () => {
  const ordre: FactionDef = {
    ...structuredClone(DEFAULT_FACTIONS[0]),
    id: "ordre",
    name: "Ordre du Néant",
    leader: "Prieur Kael",
    enforcer: "La Lame grise",
    color: "cyan",
    story: "L'Ordre vient du vide.\n\nIl ne pardonne pas.",
    fugitives: [{ name: "Frère Oss", crime: "a béni le pillage" }],
  };

  it("les fugitifs viennent de la fiche de faction ; une faction ajoutée entre au tableau des primes", () => {
    applyGameContent({ factions: [...structuredClone(DEFAULT_FACTIONS), ordre] });
    const names = bountyFugitives().map((f) => f.name);
    expect(names.slice(0, 22)).toEqual(OLD_FUGITIVES);
    expect(bountyFugitives()[22]).toEqual({ name: "Frère Oss", factionId: "ordre", crime: "a béni le pillage" });
    // Fiche enregistrée avant la 6.14.125 (sans fugitifs) : ceux de la faction livrée.
    const legacy = structuredClone(DEFAULT_FACTIONS).map((f) => ({ ...f, fugitives: undefined }));
    applyGameContent({ factions: legacy });
    expect(bountyFugitives().map((f) => f.name)).toEqual(OLD_FUGITIVES);
    // Aucune faction n'a de fugitif : les fugitifs livrés (le tableau n'est jamais vide).
    applyGameContent({ factions: structuredClone(DEFAULT_FACTIONS).map((f) => ({ ...f, fugitives: [] })) });
    expect(bountyFugitives()).toHaveLength(22);
  });

  it("une faction active sans archétype reçoit un archétype de repli, tiré par les chapitres et les sagas", () => {
    // Sans suivre le thème du passe (sinon le thème choisit la faction) : le tirage peut tomber sur la faction ajoutée.
    applyGameContent({ factions: [...structuredClone(DEFAULT_FACTIONS), ordre, { ...ordre, id: "dormante", enabled: false }], rules: { chronicleGen: { followPassTheme: false } } } as never);
    const list = chapterArchetypes();
    expect(list.map((a) => a.id)).toEqual([...ARCHETYPES.map((a) => a.id), "ordre"]);
    const fallback = list.at(-1)!;
    expect(fallback).toMatchObject({ faction: "la faction Ordre du Néant", accent: "#7fd1ff", lore: ["L'Ordre vient du vide.", "Il ne pardonne pas."] });
    const digest = worldDigest([], NOW);
    const months = Array.from({ length: 48 }, (_, i) => `${2027 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
    expect(months.some((m) => generateChapter({ monthId: m, digest, existing: [], now: NOW }).auto?.archetype === "ordre")).toBe(true);
    expect(months.some((m) => generateAllianceSaga(m, digest, 1, NOW).lore.includes("la faction Ordre du Néant"))).toBe(true);
    // Le thème du passe peut désigner la faction ajoutée.
    expect(validateRules({ chronicleGen: { ...defaultGameContent().rules.chronicleGen, themeArchetypes: { vide: "ordre" } } } as never).join(" ")).not.toMatch(/inconnue/);
  });

  it("refuse un fugitif sans nom", () => {
    expect(validateGameContent({ ...defaultGameContent(), factions: [...structuredClone(DEFAULT_FACTIONS), { ...ordre, fugitives: [{ name: " ", crime: "" }] }] }).join(" ")).toMatch(/fugitif n° 1 sans nom/);
  });
});
