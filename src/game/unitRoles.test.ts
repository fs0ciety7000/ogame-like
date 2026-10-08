import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_UNITS, defaultUnitRoles, findUnit, hasUnitRole, OFFENSIVE_UNITS, resolveUnitRoles, setUnits, UNITS, unitsWithRole, type UnitDef } from "@/game/units";
import { counterEspionage, counterSpyUnitIds, isProbeUnit, primaryProbeUnitId, probeUnitIds, SPY_RULES } from "@/game/espionage";
import { DEBRIS_RULES, isRecyclerUnit, recyclerCapacity, recyclerUnitIds } from "@/game/debris";
import { bossWeakness, bossWeaknessPool } from "@/game/leviathan";
import { combatUnits } from "@/game/balance/analysis";
import { allEffectPresets, generatedUnitPresets } from "@/game/effectCatalog";
import { playerUnitCost } from "@/game/effectTargets";
import { performPlayerAction } from "@/game/actions";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { launchSpy } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

/* 6.14.123 (AU27, lot AA5, constats AA-16 à AA-18) : rôles d'unités lus à la place des identifiants en dur, préréglages
   d'effets générés pour une unité ajoutée, coût d'unité en toutes ressources. À contenu par défaut, rien ne change. */

const reset = () => applyGameContent(defaultGameContent());
afterEach(reset);

const player = (): PlayerState => {
  const p = defaultPlayerState("u1", "Essai") as PlayerState;
  p.units = Object.fromEntries(UNITS.map((u) => [u.id, { level: 3, count: 500 }]));
  return p;
};

describe("AA5 : rôles par défaut (non-régression)", () => {
  it("les unités livrées ont les rôles des anciennes listes d'identifiants", () => {
    expect(probeUnitIds()).toEqual(["sonde_espionnage"]);
    expect(primaryProbeUnitId()).toBe(SPY_RULES.probeUnitId);
    expect(recyclerUnitIds()).toEqual([DEBRIS_RULES.recyclerUnitId]);
    expect(counterSpyUnitIds()).toEqual([SPY_RULES.sentinelUnitId]);
    expect(unitsWithRole("transport")).toEqual(["cargo"]);
    // Ancien SUPPORT_UNITS (balance/analysis.ts).
    expect(unitsWithRole("support").sort()).toEqual(["drone_recuperateur", "recolteur", "sonde_espionnage", "traqueur_kesh", "vaisseau_atelier"]);
    // Ancien WEAKNESS_POOL (leviathan.ts), dans le même ordre (vaisseaux seulement).
    expect(unitsWithRole("bossWeakness").sort()).toEqual(["chasseur", "croiseur_nova", "etoile_noire", "fregate", "intercepteur", "lance_gravitationnelle"]);
    expect(bossWeaknessPool()).toEqual(["fregate", "chasseur", "croiseur_nova", "etoile_noire"]);
  });

  it("faiblesse de boss, soutien et recyclage : mêmes résultats qu'avant les rôles", () => {
    const old = ["fregate", "chasseur", "intercepteur", "croiseur_nova", "lance_gravitationnelle", "etoile_noire"].filter((id) => OFFENSIVE_UNITS.includes(id));
    for (let i = 0; i < 40; i++) {
      let h = 0;
      for (const ch of `combat${i}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      expect(bossWeakness({ id: `combat${i}` })).toBe(old[h % old.length]);
    }
    const oldSupport = ["sonde_espionnage", "drone_recuperateur", "traqueur_kesh", "vaisseau_atelier", "recolteur"];
    expect(combatUnits().map((u) => u.id)).toEqual(UNITS.filter((u) => !oldSupport.includes(u.id)).map((u) => u.id));
    expect(UNITS.filter((u) => isRecyclerUnit(u.id)).map((u) => u.id)).toEqual(["drone_recuperateur", "recolteur"]);
    expect(UNITS.filter((u) => isProbeUnit(u.id)).map((u) => u.id)).toEqual(["sonde_espionnage"]);
  });

  it("une liste enregistrée avant les rôles les reprend des unités par défaut ; une liste vide est gardée", () => {
    const legacy = DEFAULT_UNITS.map(({ roles: _roles, ...u }) => {
      void _roles;
      return u as UnitDef;
    });
    setUnits(legacy);
    expect(probeUnitIds()).toEqual(["sonde_espionnage"]);
    expect(findUnit("cargo")?.roles).toEqual(["transport"]);
    setUnits(DEFAULT_UNITS.map((u) => (u.id === "sonde_espionnage" ? { ...u, roles: [] } : u)));
    expect(hasUnitRole("sonde_espionnage", "probe")).toBe(false);
    // Aucune unité au rôle : repli sur l'identifiant des règles.
    expect(probeUnitIds()).toEqual([SPY_RULES.probeUnitId]);
    expect(resolveUnitRoles({ id: "inconnue" })).toEqual([]);
    expect(defaultUnitRoles("drone_recuperateur")).toEqual(["recycler", "support"]);
  });
});

describe("AA5 : une unité ajoutée prend son rôle d'une case à cocher", () => {
  const custom = (patch: Partial<UnitDef>): UnitDef => ({ ...structuredClone(findUnit("sonde_espionnage")!), id: "sonde_furtive", name: "Sonde furtive", roles: ["probe"], ...patch });

  it("sonde : espionne, ne combat pas ; contre-espionnage et recyclage", () => {
    const content = defaultGameContent();
    content.units = [...content.units, custom({}), { ...structuredClone(findUnit("cargo")!), id: "benne", name: "Benne", roles: ["recycler", "counterSpy"] }];
    applyGameContent(content);
    expect(probeUnitIds()).toEqual(["sonde_espionnage", "sonde_furtive"]);
    expect(isProbeUnit("sonde_furtive")).toBe(true);
    expect(recyclerUnitIds()).toEqual(["drone_recuperateur", "benne"]);
    expect(counterSpyUnitIds()).toEqual(["sentinelle", "benne"]);
    const p = player();
    const target = defaultPlayerState("u2", "Cible") as PlayerState;
    expect(() => launchSpy(p, target, { sonde_furtive: 3 }, 0)).not.toThrow();
    expect(() => launchSpy(player(), target, { fregate: 3 }, 0)).toThrow();
    // Capacité de ramassage : la soute de la Benne compte.
    expect(recyclerCapacity(p, { benne: 10 })).toBeGreaterThan(0);
    // Contre-espionnage : les Bennes à quai comptent comme des Sentinelles.
    const withBenne = player();
    const without = player();
    without.units.benne = { level: 1, count: 0 };
    without.units.sentinelle = { level: 1, count: 0 };
    withBenne.units.sentinelle = { level: 1, count: 0 };
    withBenne.units.benne = { level: 1, count: 100_000 };
    expect(counterEspionage(withBenne)).toBeGreaterThan(counterEspionage(without));
    expect(validateGameContent(content)).toEqual([]);
  });

  it("un rôle inconnu est refusé par la validation du contenu", () => {
    const content = defaultGameContent();
    content.units = [...content.units, custom({ roles: ["sonde" as never] })];
    expect(validateGameContent(content).join(" ")).toContain("rôle « sonde » inconnu");
  });

  it("faiblesse de boss : une unité ajoutée avec le rôle entre dans la liste, rangée par coût", () => {
    const content = defaultGameContent();
    content.units = [...content.units, { ...structuredClone(findUnit("fregate")!), id: "corvette", name: "Corvette", cost: { scrap: 2000, energy: 1000 }, roles: ["bossWeakness"] }];
    applyGameContent(content);
    expect(bossWeaknessPool()).toEqual(["fregate", "chasseur", "corvette", "croiseur_nova", "etoile_noire"]);
  });
});

describe("AA5 : préréglages d'effets générés (AA-18)", () => {
  it("contenu par défaut : aucun préréglage généré (chaque unité a les siens)", () => {
    expect(generatedUnitPresets()).toEqual([]);
  });

  it("une unité ajoutée a ses préréglages d'attaque et de PV", () => {
    const content = defaultGameContent();
    content.units = [...content.units, { ...structuredClone(findUnit("fregate")!), id: "corvette", name: "Corvette", roles: [] }];
    applyGameContent(content);
    const ids = generatedUnitPresets().map((x) => x.id);
    expect(ids).toEqual(["auto_corvette_attaque", "auto_corvette_pv"]);
    const preset = allEffectPresets().find((x) => x.id === "auto_corvette_pv")!;
    expect(preset.effect).toEqual({ stat: "unitHp", target: "unit:corvette" });
    expect(preset.suggest.relic).toBeGreaterThan(0);
  });
});

describe("AA5 : coût d'unité en toutes ressources (AA-17)", () => {
  it("une unité qui coûte une ressource rare la fait payer, et la rend à moitié à la revente", () => {
    const content = defaultGameContent();
    content.units = content.units.map((u) => (u.id === "fregate" ? { ...u, cost: { scrap: 1000, energy: 500, nano: 40 } } : u));
    applyGameContent(content);
    expect(playerUnitCost(findUnit("fregate")!, player(), 0)).toEqual({ scrap: 1000, energy: 500, nano: 40 });
    const NOW = 1_800_000_000_000;
    const base = { ...defaultPlayerState("a", "A"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW } as PlayerState;
    base.resources = { ...base.resources, scrap: 1e9, energy: 1e9, nano: 1000 };
    base.units = { fregate: { level: 1, count: 0 } } as PlayerState["units"];
    const built = performPlayerAction(base, defaultQueues(), { type: "buildUnits", unitId: "fregate", qty: 2 }, NOW).player;
    expect(built.resources.nano).toBe(1000 - 80);
    built.units.fregate = { level: 1, count: 2 };
    const sold = performPlayerAction(built, defaultQueues(), { type: "sellUnits", unitId: "fregate", qty: 2 }, NOW).player;
    expect(sold.resources.nano).toBe(1000 - 80 + 40);
  });
});

/* Garde : un identifiant d'unité écrit en dur n'est permis que dans les fichiers ci-dessous (contenu ou repli justifié).
   Une nouvelle règle de jeu qui vise une unité lit un rôle (`hasUnitRole`, `unitsWithRole`) ou une règle réglable. */
const ALLOWED: Record<string, string> = {
  "src/game/units.ts": "définitions des unités (contenu par défaut)",
  "src/game/worldBosses.ts": "faiblesses déclarées par chaque boss (contenu, réglable dans l'admin)",
  "src/game/technologies.ts": "cibles des technologies (contenu, réglable)",
  "src/game/effectCatalog.ts": "préréglages écrits pour chaque unité livrée (les unités ajoutées ont des préréglages générés)",
  "src/game/warlordRanks.ts": "unités d'élite contre chaque personnalité (liste fixe d'unités toujours présentes)",
  "src/game/classUnits.ts": "vaisseaux de classe (liste fixe d'unités toujours présentes, règles de classe)",
  "src/game/espionage.ts": "repli `probeUnitId` / `sentinelUnitId` si aucune unité n'a le rôle (réglable)",
  "src/game/debris.ts": "repli `recyclerUnitId` si aucune unité n'a le rôle (réglable)",
  "src/game/onboarding.ts": "tutoriel écrit avec la version (AA-Q3 : textes d'interface)",
  "src/game/emojis.ts": "émojis du chat nommés d'après des unités (cosmétique)",
  "src/game/balance/progressionSim.ts": "simulateur de progression (outil, profil de joueur type)",
  "pocketbase/pb_hooks/cosmic_db.js": "migrations de contenu historiques (CONTENT_MIGRATIONS)",
};

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "test") sources(path, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && !/\.d\.ts$/.test(name)) out.push(path);
  }
  return out;
}

describe("AA5 : garde des identifiants d'unités en dur", () => {
  it("aucun identifiant d'unité écrit en dur hors des fichiers justifiés", () => {
    // « cargo » et « bastion » sont aussi une grandeur d'effet, une spécialité de colonie et un projet : comparaisons seulement.
    const ids = DEFAULT_UNITS.map((u) => u.id).filter((id) => id !== "cargo" && id !== "bastion");
    const literal = new RegExp(`["'\`](${ids.join("|")})["'\`]`);
    const compare = /(===|!==)\s*"(cargo|bastion)"/;
    const offenders: string[] = [];
    for (const file of [...sources("src"), "pocketbase/pb_hooks/cosmic_db.js", "pocketbase/pb_hooks/cosmic.pb.js"]) {
      const rel = file.replace(/\\/g, "/");
      if (ALLOWED[rel]) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (literal.test(line) || compare.test(line)) offenders.push(`${rel}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
