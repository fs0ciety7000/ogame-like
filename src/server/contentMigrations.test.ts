import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultGameContent } from "@/game/content";
import { defaultAllianceEffects } from "@/game/alliances";
import { defaultFactionFugitives } from "@/game/bounties";
import { defaultMutatorDefs } from "@/game/mutators";
import { withDefaultTalents } from "@/game/talents";
import { withDefaultModuleFamilies } from "@/game/modules";
import { CLASS_UNITS, defaultUnitRoles, ELITE_UNITS, KESH_HUNTER_UNIT } from "@/game/units";
import { SYNTH_BUILDING_ID } from "@/game/buildings";
import { PASS_THEME_OLD_IMAGES, PASS_THEMES, SEASON_PORTRAITS } from "@/game/passSeasons";

/* 6.14.60 (AU27, AJ27-3, constat AJ-5) : tout contenu par défaut (unité, bâtiment, techno, relique) ajouté après la
   première liste a son entrée `appendFromDefaults` dans CONTENT_MIGRATIONS (cosmic_db.js). Sans elle, il n'apparaît
   pas sur un serveur dont l'admin a enregistré la liste avant son arrivée (CLAUDE.md, « Nouveau bâtiment, unité… »).

   ORIGINE : identifiants présents dans les listes du code avant que l'admin puisse les enregistrer (figés ici, ne pas
   allonger). Un nouvel identifiant n'y entre pas : il reçoit une migration, ou il est « toujours présent » (ajouté par
   `withFixedUnits` / `withFixedBuildings`). */
const ORIGINE: Record<string, string[]> = {
  units: ["drone_recuperateur", "sonde_espionnage", "fregate", "cargo", "sentinelle", "chasseur", "etoile_noire", "croiseur_nova", "lance_gravitationnelle", "roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur"],
  buildings: ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees", "atelier_reparation", "hangar_attaque", "hangar_defense", "entrepot", "fonderie_quantique", "synthetiseur_neuronal", "generateur_bouclier"],
  technologies: ["tech1", "tech3", "tech9", "tech20", "tech2", "tech5", "tech4", "tech6", "tech11", "tech10", "tech14", "tech8", "tech7", "tech12", "tech17", "tech13", "tech15", "tech16", "tech18", "tech21", "tech22", "tech23", "tech24", "tech25", "tech19"],
  // Liste des reliques de la 5.9 (section éditable dans l'admin), mythiques de la 5.1 comprises.
  relics: ["engrenage_varan", "ecaille_leviathan", "noyau_forge", "codex_aube", "matrice_reparation", "soute_pliee", "oeil_vesper", "racine_ferraille", "cellule_stellaire", "essaim_nanites", "cristal_memoriel", "couronne_essaim", "egide_reine", "coeur_leviathan", "couronne_ambre", "oeil_neant", "egide_stellaire"],
};

/** Toujours présents, même dans une liste personnalisée (contenu.ts : withFixedUnits, withFixedBuildings). */
const TOUJOURS: Record<string, string[]> = {
  units: [KESH_HUNTER_UNIT.id, ...ELITE_UNITS.map((u) => u.id), ...CLASS_UNITS.map((u) => u.id)],
  buildings: [SYNTH_BUILDING_ID],
  technologies: [],
  relics: [],
};

/** Identifiants ajoutés par `appendFromDefaults`, par section (lecture du texte de cosmic_db.js). */
function migrated(): Record<string, string[]> {
  const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
  const start = db.indexOf("const CONTENT_MIGRATIONS = [");
  const end = db.indexOf("\n];", start);
  const block = db.slice(start, end);
  const out: Record<string, string[]> = {};
  const re = /appendFromDefaults:\s*\[([^\]]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const before = block.slice(0, m.index);
    const keys = [...before.matchAll(/key:\s*"(\w+)"/g)];
    const key = keys[keys.length - 1]?.[1] ?? "?";
    const ids = [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1]);
    out[key] = [...(out[key] ?? []), ...ids];
  }
  return out;
}

describe("AJ27-3 : migrations des contenus ajoutés après coup", () => {
  it("lit les entrées existantes (5.5, 5.21, 5.23, 5.28, 6.5)", () => {
    const mig = migrated();
    expect(mig.technologies).toEqual(expect.arrayContaining(["tech26", "tech27", "tech30"]));
    expect(mig.units).toEqual(expect.arrayContaining(["bastion", "recolteur"]));
    expect(mig.buildings).toEqual(["cale_seche"]);
    expect(mig.relics).toEqual(expect.arrayContaining(["cle_soudure", "sceau_sentinelle", "navette_mere"]));
  });

  it("chaque identifiant par défaut hors de la première liste a sa migration (ou est toujours présent)", () => {
    const mig = migrated();
    const content = defaultGameContent() as unknown as Record<string, { id: string }[]>;
    const missing: string[] = [];
    for (const section of Object.keys(ORIGINE)) {
      const ok = new Set([...ORIGINE[section], ...TOUJOURS[section], ...(mig[section] ?? [])]);
      for (const { id } of content[section]) if (!ok.has(id)) missing.push(`${section}:${id}`);
    }
    expect(missing).toEqual([]);
  });

  it("une migration ne vise qu'un identifiant qui existe dans le code", () => {
    const mig = migrated();
    const content = defaultGameContent() as unknown as Record<string, { id: string }[]>;
    const unknown: string[] = [];
    for (const [section, ids] of Object.entries(mig)) for (const id of ids) if (!content[section]?.some((x) => x.id === id)) unknown.push(`${section}:${id}`);
    expect(unknown).toEqual([]);
  });
});

/* 6.14.72 (AU27, lot AE-L1) : nouveaux défauts des réglages sûrs. L'admin enregistre toutes les règles d'un bloc :
   la migration ne touche qu'un champ qui vaut encore l'ancien défaut, jamais un champ réglé à la main. */
function rulesMigration(id: string): { run: (data: unknown, changes: string[]) => boolean } {
  const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
  const start = db.lastIndexOf("{", db.indexOf(`id: "${id}"`));
  const end = db.indexOf("\n  },", start) + "\n  }".length;
  return new Function(`return (${db.slice(start, end)});`)();
}

describe("AE-L1 : migration rules-6.14.72", () => {
  it("prend les nouveaux défauts quand les règles enregistrées ont encore les anciens", () => {
    const data = {
      combat: { homeFleetDefenseFactor: 0.5, homeDefenseBonus: 0.15, lootPercent: 0.08 },
      pvp: { shieldAfterDefeatMs: 3_600_000, hardXpRatio: 12 },
      streak: { chest: { amber: [50, 300], common: [45_000_000, 280_000_000] } },
    };
    const changes: string[] = [];
    expect(rulesMigration("rules-6.14.72").run(data, changes)).toBe(true);
    expect(data.combat).toEqual({ homeFleetDefenseFactor: 0.75, homeDefenseBonus: 0.25, lootPercent: 0.08 });
    expect(data.pvp).toEqual({ shieldAfterDefeatMs: 10_800_000, hardXpRatio: 10 });
    expect(data.streak.chest).toEqual({ amber: [50, 300], common: [2_000_000, 12_000_000] });
    expect(changes).toHaveLength(5);
    // Les nouveaux défauts sont bien ceux du code.
    const d = defaultGameContent().rules;
    expect([d.combat.homeFleetDefenseFactor, d.combat.homeDefenseBonus, d.pvp.shieldAfterDefeatMs, d.pvp.hardXpRatio]).toEqual([0.75, 0.25, 10_800_000, 10]);
    expect(d.streak.chest.common).toEqual([2_000_000, 12_000_000]);
  });

  it("garde un réglage modifié dans l'admin et ne crée rien", () => {
    const data = { combat: { homeFleetDefenseFactor: 0.6, homeDefenseBonus: 0.15 }, pvp: { hardXpRatio: 8 }, streak: { chest: { common: [10_000_000, 50_000_000] } } };
    const changes: string[] = [];
    expect(rulesMigration("rules-6.14.72").run(data, changes)).toBe(true);
    expect(data).toEqual({ combat: { homeFleetDefenseFactor: 0.6, homeDefenseBonus: 0.25 }, pvp: { hardXpRatio: 8 }, streak: { chest: { common: [10_000_000, 50_000_000] } } });
    expect(rulesMigration("rules-6.14.72").run({}, [])).toBe(false);
    expect(rulesMigration("rules-6.14.72").run(null, [])).toBe(false);
  });
});

/* 6.14.106 (AU27, lot AE-L3, AE-15) : rattrapage relevé, même règle (seul un champ resté à l'ancien défaut change). */
describe("AE-L3 : migration rules-6.14.106", () => {
  it("rattrapage 0,25 / 0,1 → 0,5 / 0,2 ; un réglage de l'admin est gardé", () => {
    const data = { catchup: { enabled: true, maxBonus: 0.25, fullBelow: 0.1, endsAt: 0.5 } };
    const changes: string[] = [];
    expect(rulesMigration("rules-6.14.106").run(data, changes)).toBe(true);
    expect(data.catchup).toEqual({ enabled: true, maxBonus: 0.5, fullBelow: 0.2, endsAt: 0.5 });
    expect(changes).toHaveLength(2);
    const d = defaultGameContent().rules;
    expect([d.catchup.maxBonus, d.catchup.fullBelow]).toEqual([0.5, 0.2]);
    const custom = { catchup: { maxBonus: 0.3, fullBelow: 0.1 } };
    expect(rulesMigration("rules-6.14.106").run(custom, [])).toBe(true);
    expect(custom.catchup).toEqual({ maxBonus: 0.3, fullBelow: 0.2 });
    expect(rulesMigration("rules-6.14.106").run({ catchup: { maxBonus: 0.4 } }, [])).toBe(false);
    expect(rulesMigration("rules-6.14.106").run(null, [])).toBe(false);
  });
});

/* 6.14.92 : les reliques qui empruntaient l'image d'une autre ont la leur. La migration remplace l'ancienne image provisoire
   d'une liste personnalisée par celle que prend la relique par défaut (`relicImage` : /assets/relics/<id>.webp). */
describe("6.14.92 : migration relics-art-6.14.92", () => {
  it("vise des reliques par défaut sans image propre, et leur donne le chemin par défaut", () => {
    const m = rulesMigration("relics-art-6.14.92") as unknown as { key: string; patches: { id: string; field: string; from: string; to: string }[] };
    expect(m.key).toBe("relics");
    expect(m.patches.length).toBe(10);
    const relics = defaultGameContent().relics as { id: string; image?: string }[];
    for (const p of m.patches) {
      const def = relics.find((r) => r.id === p.id);
      expect(def, p.id).toBeTruthy();
      expect(def?.image, p.id).toBeUndefined();
      expect(p.field).toBe("image");
      expect(p.to).toBe(`/assets/relics/${p.id}.webp`);
      expect(p.from).not.toBe(p.to);
      expect(existsSync(`public${p.to}`), p.to).toBe(true);
    }
  });
});

/* 6.14.93 : factions, boss d'alliance et passe illustrés ; une liste ou une saison déjà enregistrée reçoit les nouvelles images,
   une image réglée à la main est gardée. */
describe("6.14.93 : migrations des illustrations (factions, boss d'alliance, passe)", () => {
  it("factions : bannière et emblème ajoutés s'ils manquent, Chœur et réglage manuel intacts", () => {
    const items = [{ id: "varan" }, { id: "cartel", emblem: "/x.webp" }, { id: "choeur" }];
    const changes: string[] = [];
    expect(rulesMigration("factions-art-6.14.93").run(items, changes)).toBe(true);
    expect(items[0]).toEqual({ id: "varan", banner: "/assets/story/varan-banner.webp", emblem: "/assets/story/varan-emblem.webp" });
    expect(items[1]).toEqual({ id: "cartel", banner: "/assets/story/cartel-banner.webp", emblem: "/x.webp" });
    expect(items[2]).toEqual({ id: "choeur" });
    const factions = defaultGameContent().factions as { id: string; banner?: string; emblem?: string }[];
    for (const id of ["varan", "gravhorn", "inquisition", "cartel", "meute"]) {
      const f = factions.find((x) => x.id === id)!;
      expect(f.banner).toBe(`/assets/story/${id}-banner.webp`);
      expect(f.emblem).toBe(`/assets/story/${id}-emblem.webp`);
      expect(existsSync(`public${f.banner}`) && existsSync(`public${f.emblem}`), id).toBe(true);
    }
  });

  it("boss d'alliance : image provisoire remplacée, image réglée gardée", () => {
    const data = { allianceBoss: { bosses: [{ id: "gravhorn", image: "/assets/story/gravhorn.webp" }, { id: "kesh", image: "/mien.webp" }] } };
    expect(rulesMigration("alliance-boss-art-6.14.93").run(data, [])).toBe(true);
    expect(data.allianceBoss.bosses.map((b) => b.image)).toEqual(["/assets/bosses/alliance-gravhorn.webp", "/mien.webp"]);
    expect(rulesMigration("alliance-boss-art-6.14.93").run({}, [])).toBe(false);
    for (const b of defaultGameContent().rules.allianceBoss.bosses) expect(existsSync(`public${b.image}`), b.id).toBe(true);
  });

  it("passe : image du thème et portrait des mois illustrés", () => {
    (globalThis as Record<string, unknown>).loadGame = () => ({ PASS_THEME_OLD_IMAGES, SEASON_PORTRAITS });
    const data = {
      seasons: [
        { id: "2026-11", theme: { id: "vide", image: PASS_THEME_OLD_IMAGES.vide }, commander: { portrait: "" } },
        { id: "2027-02", theme: { id: "colonies", image: "/mien.webp" }, commander: { portrait: "" } },
      ],
    };
    try {
      expect(rulesMigration("pass-art-6.14.93").run(data, [])).toBe(true);
    } finally {
      delete (globalThis as Record<string, unknown>).loadGame;
    }
    expect(data.seasons[0]).toEqual({ id: "2026-11", theme: { id: "vide", image: "/assets/pass/theme-vide.webp" }, commander: { portrait: "/assets/commanders/s-2026-11.webp" } });
    expect(data.seasons[1]).toEqual({ id: "2027-02", theme: { id: "colonies", image: "/mien.webp" }, commander: { portrait: "" } });
    for (const t of PASS_THEMES) {
      expect(t.image).toBe(`/assets/pass/theme-${t.id}.webp`);
      expect(existsSync(`public${t.image}`), t.id).toBe(true);
      expect(PASS_THEME_OLD_IMAGES[t.id], t.id).toBeTruthy();
    }
    for (const m of SEASON_PORTRAITS) expect(existsSync(`public/assets/commanders/s-${m}.webp`), m).toBe(true);
  });
});

/* 6.14.123 (AU27, lot AA5, AA-16) : rôles d'unités dans une liste personnalisée enregistrée avant eux. */
describe("AA5 : migration unit-roles-6.14.123", () => {
  it("une unité livrée sans rôles reçoit ceux du code ; des rôles écrits (même vides) et une unité ajoutée sont gardés", () => {
    (globalThis as Record<string, unknown>).loadGame = () => ({ defaultUnitRoles });
    const items: { id: string; roles?: string[] }[] = [{ id: "sonde_espionnage" }, { id: "cargo", roles: [] }, { id: "corvette" }, { id: "fregate" }];
    const changes: string[] = [];
    try {
      expect(rulesMigration("unit-roles-6.14.123").run(items, changes)).toBe(true);
      expect(rulesMigration("unit-roles-6.14.123").run(items, [])).toBe(false);
      expect(rulesMigration("unit-roles-6.14.123").run(null, [])).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).loadGame;
    }
    expect(items).toEqual([{ id: "sonde_espionnage", roles: ["probe", "support"] }, { id: "cargo", roles: [] }, { id: "corvette" }, { id: "fregate", roles: ["bossWeakness"] }]);
    expect(changes).toHaveLength(2);
  });
});

/* 6.14.124 (AU27, lot AA6, AA-15) : effets composés des recherches et projets d'alliance enregistrés avant eux. */
describe("AA6 : migration alliance-effects-6.14.124", () => {
  it("une recherche ou un projet livré reçoit son effet ; des effets écrits et une entrée ajoutée sont gardés", () => {
    (globalThis as Record<string, unknown>).loadGame = () => ({ defaultAllianceEffects });
    const data = {
      alliances: {
        maxMembers: 8,
        researches: [{ id: "logistique", perLevel: 0.05 }, { id: "industrie", effects: [] }, { id: "maison", perLevel: 1 }],
        projects: [{ id: "forge", perLevel: 0.02 }],
      },
    };
    const changes: string[] = [];
    try {
      expect(rulesMigration("alliance-effects-6.14.124").run(data, changes)).toBe(true);
      expect(rulesMigration("alliance-effects-6.14.124").run(data, [])).toBe(false);
      expect(rulesMigration("alliance-effects-6.14.124").run({}, [])).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).loadGame;
    }
    expect(data.alliances.researches).toEqual([{ id: "logistique", perLevel: 0.05, effects: [{ stat: "fleetSpeed" }] }, { id: "industrie", effects: [] }, { id: "maison", perLevel: 1 }]);
    expect(data.alliances.projects).toEqual([{ id: "forge", perLevel: 0.02, effects: [{ stat: "buildTime" }, { stat: "researchTime" }] }]);
    expect(changes).toHaveLength(2);
  });
});

/* 6.14.125 (AU27, lot AA7, AA-20 et AA-6) : fugitifs dans la fiche de faction, mutateurs en liste. */
describe("AA7 : migrations faction-fugitives-6.14.125 et mutators-defs-6.14.125", () => {
  it("une faction livrée reçoit ses fugitifs ; une faction ajoutée et des fugitifs écrits sont gardés", () => {
    (globalThis as Record<string, unknown>).loadGame = () => ({ defaultFactionFugitives });
    const items = [{ id: "varan", name: "Confrérie" }, { id: "choeur", fugitives: [{ name: "X", crime: "y" }] }, { id: "nouvelle", name: "Nouvelle" }];
    const changes: string[] = [];
    try {
      expect(rulesMigration("faction-fugitives-6.14.125").run(items, changes)).toBe(true);
      expect(rulesMigration("faction-fugitives-6.14.125").run(items, [])).toBe(false);
      expect(rulesMigration("faction-fugitives-6.14.125").run({}, [])).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).loadGame;
    }
    expect((items[0] as { fugitives?: unknown[] }).fugitives).toHaveLength(4);
    expect((items[0] as { fugitives?: { name: string }[] }).fugitives?.[0].name).toBe("Korr le Rouilleux");
    expect(items[1].fugitives).toEqual([{ name: "X", crime: "y" }]);
    expect((items[2] as { fugitives?: unknown }).fugitives).toBeUndefined();
    expect(changes).toEqual(["faction-fugitives-6.14.125 : varan.fugitives"]);
  });

  it("l'ancien réglage « values » devient la liste « defs » (mêmes valeurs) ; une liste écrite est gardée", () => {
    (globalThis as Record<string, unknown>).loadGame = () => ({ defaultMutatorDefs });
    const data = { mutators: { enabled: true, overrides: { "2026-10": "ruee" }, values: { ruee: [0.12], guerre: [0.1, 0.3] } as Record<string, number[]> } } as Record<string, Record<string, unknown>>;
    const changes: string[] = [];
    try {
      expect(rulesMigration("mutators-defs-6.14.125").run(data, changes)).toBe(true);
      expect(rulesMigration("mutators-defs-6.14.125").run(data, [])).toBe(false);
      expect(rulesMigration("mutators-defs-6.14.125").run({ mutators: { enabled: true } }, [])).toBe(false);
    } finally {
      delete (globalThis as Record<string, unknown>).loadGame;
    }
    const defs = data.mutators.defs as { id: string; effects: { value: number }[] }[];
    expect(defs).toHaveLength(10);
    expect(defs.find((m) => m.id === "ruee")?.effects.map((e) => e.value)).toEqual([0.12]);
    expect(defs.find((m) => m.id === "guerre")?.effects.map((e) => e.value)).toEqual([0.1, 0.3]);
    expect(defs.find((m) => m.id === "vents")?.effects.map((e) => e.value)).toEqual([0.15]);
    expect(data.mutators.values).toBeUndefined();
    expect(data.mutators.overrides).toEqual({ "2026-10": "ruee" });
    expect(changes).toHaveLength(1);
  });
});

/* 6.14.127 (AU27, lot AA9, AA-2 et AA-5) : talents et familles de modules en sections ; les anciens chiffres des règles les créent. */
describe("AA9 : migrations talents-section-6.14.127 et module-families-6.14.127", () => {
  type Saved = { key?: string; data?: unknown };
  const fakeEnv = (existing: string[]) => {
    const saved: Saved[] = [];
    const g = globalThis as Record<string, unknown>;
    g.loadGame = () => ({ withDefaultTalents, withDefaultModuleFamilies });
    g.configRecord = (_tx: unknown, key: string) => (existing.includes(key) ? { key } : null);
    g.Record = class {
      v: Saved = {};
      set(k: "key" | "data", value: unknown) {
        (this.v as Record<string, unknown>)[k] = value;
      }
    };
    const txApp = { findCollectionByNameOrId: () => ({}), save: (r: { v: Saved }) => saved.push(r.v) };
    const cleanup = () => {
      for (const k of ["loadGame", "configRecord", "Record"]) delete g[k];
    };
    return { saved, txApp, cleanup };
  };
  const run = (id: string, data: unknown, changes: string[], txApp: unknown) => (rulesMigration(id).run as (d: unknown, c: string[], t: unknown) => boolean)(data, changes, txApp);

  it("talents.perRank crée la section « talents » (mêmes valeurs) et quitte les règles ; une section écrite l'emporte", () => {
    const env = fakeEnv([]);
    const data = { talents: { maxRank: 3, perRank: { assaut: 0.03, reseau: 0.4 } } } as Record<string, Record<string, unknown>>;
    const changes: string[] = [];
    try {
      expect(run("talents-section-6.14.127", data, changes, env.txApp)).toBe(true);
      expect(run("talents-section-6.14.127", data, [], env.txApp)).toBe(false);
    } finally {
      env.cleanup();
    }
    expect(data.talents).toEqual({ maxRank: 3 });
    expect(env.saved).toHaveLength(1);
    expect(env.saved[0].key).toBe("talents");
    const list = env.saved[0].data as { id: string; effects: { value: number }[] }[];
    expect(list).toHaveLength(15);
    expect(list.find((t) => t.id === "assaut")?.effects[0].value).toBe(0.03);
    expect(list.find((t) => t.id === "reseau")?.effects[0].value).toBe(0.4);
    expect(list.find((t) => t.id === "rempart")?.effects[0].value).toBe(0.02);
    const env2 = fakeEnv(["talents"]);
    const data2 = { talents: { perRank: { assaut: 0.03 } } } as Record<string, Record<string, unknown>>;
    try {
      expect(run("talents-section-6.14.127", data2, [], env2.txApp)).toBe(true);
    } finally {
      env2.cleanup();
    }
    expect(env2.saved).toHaveLength(0);
    expect(data2.talents).toEqual({});
  });

  it("modules.familyValues crée la section « moduleFamilies » ; poids et recyclage restent dans les règles", () => {
    const env = fakeEnv([]);
    const data = { modules: { rarityWeights: { legendary: 4 }, familyValues: { armement: { epic: 0.12 } } } } as Record<string, Record<string, unknown>>;
    try {
      expect(run("module-families-6.14.127", data, [], env.txApp)).toBe(true);
      expect(run("module-families-6.14.127", data, [], env.txApp)).toBe(false);
    } finally {
      env.cleanup();
    }
    expect(data.modules).toEqual({ rarityWeights: { legendary: 4 } });
    const list = env.saved[0].data as { id: string; values: Record<string, number> }[];
    expect(env.saved[0].key).toBe("moduleFamilies");
    expect(list.find((f) => f.id === "armement")?.values).toEqual({ common: 0.04, rare: 0.07, epic: 0.12, legendary: 0.16 });
    expect(list.find((f) => f.id === "voile")?.values).toEqual({ common: 1, rare: 2, epic: 3, legendary: 4 });
  });

  it("les éléments livrés des trois sections ont leur entrée appendFromDefaults (I27)", () => {
    const mig = migrated();
    const d = defaultGameContent();
    expect(mig.talents).toEqual(d.talents.map((t) => t.id));
    expect(mig.moduleFamilies).toEqual(d.moduleFamilies.map((f) => f.id));
    expect(mig.moduleTemplates).toEqual(d.moduleTemplates.map((t) => t.id));
    // 6.14.128 : thèmes et catalogue du passe.
    expect(mig.passThemes).toEqual(d.passThemes.map((t) => t.id));
    expect([...mig.seasonCatalog].sort()).toEqual(d.seasonCatalog.map((e) => e.id).sort());
  });
});
