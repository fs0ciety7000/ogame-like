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

function fixture(i: number): Partial<PlayerState> {
  const r = seededRandom(`golden-${i}`);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const active = [...new Set([pick(COMMANDERS).id, pick(COMMANDERS).id, pick(COMMANDERS).id])].slice(0, 1 + Math.floor(r() * 3));
  const roster = Object.fromEntries(COMMANDERS.map((c) => [c.id, { xp: xpForLevel(1 + Math.floor(r() * 20)) }]));
  const items = Array.from({ length: 4 }, (_, k) => ({ id: `r${k}`, template: pick(DEFAULT_RELICS).id, rarity: pick(RARITIES).id, foundAtMs: 0, source: "golden" }));
  const ranks = Object.fromEntries(TALENTS.filter(() => r() < 0.4).map((t) => [t.id, 1 + Math.floor(r() * 3)]));
  const techLevels = Object.fromEntries(TECHNOLOGIES.filter(() => r() < 0.6).map((t) => [t.id, 1 + Math.floor(r() * Math.min(10, t.maxLevel))]));
  return {
    ascensions: Math.floor(r() * 3),
    commanders: { roster, active, movedAtMs: {}, dossiers: 0 } as never,
    relics: { items, slots: items.map((x) => x.id) } as never,
    talents: { ranks },
    territory: r() < 0.5 ? ({ pct: Math.round(r() * 10) / 100, sectors: [1], untilMs: FAR } as never) : undefined,
    techLevels,
  };
}

const TECH_TARGETS: Partial<Record<TechEffectType, string[]>> = { resource_production: ["scrap", "energy", "nano", "data"], hangar_capacity: ["attack", "defense"] };

function snapshotOf(p: Partial<PlayerState>) {
  const tech: Record<string, number> = {};
  for (const type of Object.keys(TECH_EFFECT_LABELS) as TechEffectType[]) {
    tech[type] = techBonus(p.techLevels, type);
    for (const t of TECH_TARGETS[type] ?? []) tech[`${type}:${t}`] = techBonus(p.techLevels, type, t);
  }
  return round({ mods: playerModifiers(p), tech });
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
