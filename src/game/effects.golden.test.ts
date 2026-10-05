import { describe, expect, it } from "vitest";
import { playerModifiers } from "@/game/modifiers";
import { COMMANDERS, xpForLevel } from "@/game/commanders";
import { DEFAULT_RELICS, RARITIES } from "@/game/relics";
import { TALENTS } from "@/game/talents";
import { TECH_EFFECT_LABELS, TECHNOLOGIES, techBonus, type TechEffectType } from "@/game/technologies";
import { seededRandom } from "@/game/procedural";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.14 : valeurs de référence du circuit d'effets. Instantané pris AVANT
   la migration vers effects.ts : tout écart signale un changement d'équilibrage.
===================================================== */

const FAR = Date.UTC(2100, 0, 1);

// Les cinq officiers d'origine (les rôles rares n'existaient pas lors de l'instantané).
const BASE = COMMANDERS.filter((c) => !c.rare);
// 5.21 : relique, technologies et effet ajoutés après l'instantané (hors du tirage).
const ADDED_521 = new Set(["cle_soudure", "tech27", "tech28", "tech29", "tech30", "repair_speed", // 5.23 : effets composés
  "stat", "sceau_sentinelle", "plaque_bastion", "lame_duelliste", "trophee_seigneur", "balise_traque", "compas_tacticien", "enclume_colosses", "navette_mere"]);
const RELICS = DEFAULT_RELICS.filter((t) => !ADDED_521.has(t.id));
const TECHS = TECHNOLOGIES.filter((t) => !ADDED_521.has(t.id));

function fixture(i: number): Partial<PlayerState> {
  const r = seededRandom(`golden-${i}`);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const active = [...new Set([pick(BASE).id, pick(BASE).id, pick(BASE).id])].slice(0, 1 + Math.floor(r() * 3));
  const roster = Object.fromEntries(BASE.map((c) => [c.id, { xp: xpForLevel(1 + Math.floor(r() * 20)) }]));
  const items = Array.from({ length: 4 }, (_, k) => ({ id: `r${k}`, template: pick(RELICS).id, rarity: pick(RARITIES).id, foundAtMs: 0, source: "golden" }));
  const ranks = Object.fromEntries(TALENTS.filter(() => r() < 0.4).map((t) => [t.id, 1 + Math.floor(r() * 3)]));
  const techLevels = Object.fromEntries(TECHS.filter(() => r() < 0.6).map((t) => [t.id, 1 + Math.floor(r() * Math.min(10, t.maxLevel))]));
  return {
    ascensions: Math.floor(r() * 3),
    commanders: { roster, active, movedAtMs: {}, dossiers: 0 } as never,
    relics: { items, slots: items.map((x) => x.id) } as never,
    talents: { ranks },
    territory: r() < 0.5 ? ({ pct: Math.round(r() * 10) / 100, sectors: [1], untilMs: FAR } as never) : undefined,
    techLevels,
  };
}

const HISTORIC = ["attack", "defense", "buildTime", "researchTime", "productionAll", "production", "storage", "spyLevel", "detection", "repair", "cargo", "bossDamage"];

const TECH_TARGETS: Partial<Record<TechEffectType, string[]>> = { resource_production: ["scrap", "energy", "nano", "data"], hangar_capacity: ["attack", "defense"] };

function snapshotOf(p: Partial<PlayerState>) {
  const tech: Record<string, number> = {};
  for (const type of (Object.keys(TECH_EFFECT_LABELS) as TechEffectType[]).filter((t) => !ADDED_521.has(t))) {
    tech[type] = techBonus(p.techLevels, type);
    for (const t of TECH_TARGETS[type] ?? []) tech[`${type}:${t}`] = techBonus(p.techLevels, type, t);
  }
  // Grandeurs historiques seulement (les rôles rares en ajoutent de nouvelles).
  const all = playerModifiers(p) as unknown as Record<string, unknown>;
  const mods = Object.fromEntries(HISTORIC.map((k) => [k, all[k]]));
  return round({ mods, tech });
}

/** Arrondi à 1e-9 : l'ordre des additions peut changer sans changer l'équilibrage. */
function round<T>(x: T): T {
  return JSON.parse(JSON.stringify(x), (_k, v) => (typeof v === "number" ? Math.round(v * 1e9) / 1e9 : v));
}

describe("v5.14 circuit d'effets : valeurs de référence", () => {
  it("officiers, reliques, talents, territoires et technologies", () => {
    expect(Array.from({ length: 24 }, (_, i) => snapshotOf(fixture(i)))).toMatchSnapshot();
  });
});
