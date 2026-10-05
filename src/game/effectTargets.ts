import { effectTotal, isUnitSelector, setUnitTargetLabeler, type EffectGrant, type EffectLayer, type EffectScope, type EffectStat } from "@/game/effects";
import { allEffects } from "@/game/modifiers";
import { findUnit, UNITS, type UnitDef } from "@/game/units";
import { UNIT_CLASS_LABELS, unitClasses, type UnitClass } from "@/game/unitClasses";

/* =====================================================
   5.23 : effets ciblés sur des unités.

   Une grandeur « ciblée » (unitAttack, unitHp, unitCost, unitBuildTime)
   porte un sélecteur d'unités :
     (vide)             toutes les unités ;
     unit:<id>          une unité (« unit:sentinelle ») ;
     class:<classe>     une classe de combat (light, medium, heavy, support) ;
     cat:<catégorie>    les vaisseaux (attack) ou les défenses (defense).
   L'éditeur d'effets de l'admin compose stat × cible × portée × valeur ;
   reliques, technologies et officiers parlent ce même vocabulaire.
===================================================== */

export type UnitSelector = string;

const CATEGORY_LABELS: Record<string, string> = { attack: "Vaisseaux", defense: "Défenses" };

export function parseUnitSelector(sel: string | undefined): { kind: "all" | "unit" | "class" | "cat"; value: string } {
  if (!sel) return { kind: "all", value: "" };
  const [kind, value = ""] = sel.split(":");
  if ((kind === "unit" || kind === "class" || kind === "cat") && value) return { kind, value };
  return { kind: "all", value: "" };
}

/** Sélecteur valide (unité connue, classe ou catégorie existante). */
export function validUnitSelector(sel: string | undefined): boolean {
  return isUnitSelector(sel, (id) => !!findUnit(id));
}

export function unitSelectorLabel(sel: string | undefined): string {
  const p = parseUnitSelector(sel);
  if (p.kind === "unit") return findUnit(p.value)?.name ?? p.value;
  if (p.kind === "class") return `Classe ${UNIT_CLASS_LABELS[p.value as UnitClass] ?? p.value}`;
  if (p.kind === "cat") return CATEGORY_LABELS[p.value] ?? p.value;
  return "Toutes les unités";
}

setUnitTargetLabeler(unitSelectorLabel);

/** Toutes les cibles proposées par l'éditeur. */
export function unitSelectorOptions(all: UnitDef[] = UNITS): { value: string; label: string }[] {
  return [
    { value: "", label: "Toutes les unités" },
    { value: "cat:attack", label: "Vaisseaux" },
    { value: "cat:defense", label: "Défenses" },
    ...(["light", "medium", "heavy"] as const).map((c) => ({ value: `class:${c}`, label: `Classe ${UNIT_CLASS_LABELS[c]}` })),
    ...all.map((u) => ({ value: `unit:${u.id}`, label: u.name })),
  ];
}

export function selectorMatches(sel: string | undefined, unitId: string, classes: Record<string, UnitClass> = unitClasses()): boolean {
  const p = parseUnitSelector(sel);
  if (p.kind === "all") return true;
  if (p.kind === "unit") return p.value === unitId;
  if (p.kind === "class") return classes[unitId] === p.value;
  return findUnit(unitId)?.category === p.value;
}

/** Total d'une grandeur ciblée pour une unité (les deux couches, plafonds par couche). */
export function unitEffect(grants: readonly EffectGrant[], stat: EffectStat, unitId: string, scope?: EffectScope, classes: Record<string, UnitClass> = unitClasses()): number {
  const mine = grants.filter((g) => g.stat === stat && selectorMatches(g.target, unitId, classes)).map((g) => ({ ...g, target: undefined }));
  if (mine.length === 0) return 0;
  return (["tech", "empire"] as EffectLayer[]).reduce((s, layer) => s + effectTotal(mine, layer, stat, { scope }), 0);
}

/** Bonus d'attaque et de points de vie par unité, tel que resolveCombat le lit. */
export type UnitBonusTable = Record<string, { att?: number; hp?: number }>;

export interface CombatEffects {
  units: UnitBonusTable;
  /** Avantage de classe en plus. */
  edge: number;
  /** Bouclier planétaire en plus (défense de la planète). */
  shield: number;
}

export function combatEffects(grants: readonly EffectGrant[], scope: EffectScope, all: UnitDef[] = UNITS): CombatEffects {
  const units: UnitBonusTable = {};
  const relevant = grants.filter((g) => g.stat === "unitAttack" || g.stat === "unitHp");
  if (relevant.length > 0) {
    const classes = unitClasses();
    for (const u of all) {
      const att = unitEffect(relevant, "unitAttack", u.id, scope, classes);
      const hp = unitEffect(relevant, "unitHp", u.id, scope, classes);
      if (att || hp) units[u.id] = { ...(att ? { att } : {}), ...(hp ? { hp } : {}) };
    }
  }
  const both = (stat: EffectStat) => effectTotal(grants, "tech", stat, { scope }) + effectTotal(grants, "empire", stat, { scope });
  return { units, edge: both("classEdge"), shield: both("shield") };
}

/** Coût d'une unité, réductions ciblées comprises (au plus −20 % par couche). */
export function unitCostFor(unit: UnitDef, grants: readonly EffectGrant[]): { scrap: number; energy: number } {
  const k = Math.max(0, 1 - unitEffect(grants, "unitCost", unit.id));
  return { scrap: Math.ceil((unit.cost.scrap || 0) * k), energy: Math.ceil((unit.cost.energy || 0) * k) };
}

type CombatPlayer = Parameters<typeof allEffects>[0];

/** Effets de combat d'un joueur pour une portée (pvp, pve, warlord). */
export function playerCombatEffects(player: CombatPlayer, scope: EffectScope, now: number = Date.now()): CombatEffects {
  return combatEffects(allEffects(player, now), scope);
}

/** Avantage de classe d'un camp : effets du joueur, plus un éventuel trait de seigneur. */
export function edgeParam(fx: CombatEffects | undefined, extra?: { bonus?: number; cancel?: boolean }): { bonus?: number; cancel?: boolean } | undefined {
  const bonus = (fx?.edge ?? 0) + (extra?.bonus ?? 0);
  if (!(bonus > 0) && !extra?.cancel) return undefined;
  return { ...(bonus > 0 ? { bonus } : {}), ...(extra?.cancel ? { cancel: true } : {}) };
}

/** Coût d'une unité pour un joueur (technologies et couche empire). */
export function playerUnitCost(unit: UnitDef, player: CombatPlayer, now: number = Date.now()): { scrap: number; energy: number } {
  return unitCostFor(unit, allEffects(player, now));
}
