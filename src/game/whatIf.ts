import { COMBAT_RULES, getShieldPercent, resolveCombat, type CombatResult } from "@/game/combat";
import { edgeParam, playerCombatEffects } from "@/game/effectTargets";
import { playerModifiers } from "@/game/modifiers";
import { OFFENSIVE_UNITS, UNIT_BASE_STATS, isEliteUnit } from "@/game/units";
import { warlordCombatMods, type WarlordRank } from "@/game/warlordRanks";
import { empirePower, findWarlord, warlordRankRules } from "@/game/warlords";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.23 : simulateur « et si » de l'administration, sur les empires réels
   (données de la prod) : chaque joueur attaque chaque autre joueur et
   chaque seigneur avec toute sa flotte, avant et après un changement
   (puissance des seigneurs, stats d'une unité, avantage de classe).
===================================================== */

export type WhatIfEmpire = Pick<PlayerState, "units" | "techLevels" | "buildings"> &
  Partial<Pick<PlayerState, "commanders" | "relics" | "talents" | "ascensions" | "synthesis" | "territory">> & { uid: string; pseudo: string; npc?: string; rank?: number };

export interface WhatIfChange {
  /** Multiplie les unités de tous les seigneurs. */
  warlordPower?: number;
  /** Multiplie l'attaque et/ou la défense d'une unité. */
  unit?: { id: string; attack?: number; defense?: number };
  /** Remplace l'avantage de classe. */
  classEdge?: number;
}

export interface WhatIfSummary {
  /** Attaques simulées entre joueurs et part gagnée par l'attaquant. */
  pvpFights: number;
  pvpWinRate: number;
  /** Par seigneur : joueurs qui le battent en l'attaquant. */
  warlords: { id: string; name: string; power: number; beatenBy: number; of: number }[];
  /** Par joueur : seigneurs battus. */
  players: { uid: string; pseudo: string; power: number; lordsBeaten: number }[];
}

const MAX_PLAYERS = 25;

function fleetOf(e: WhatIfEmpire, vsWarlord: boolean): Record<string, number> {
  return Object.fromEntries(OFFENSIVE_UNITS.filter((id) => (vsWarlord || !isEliteUnit(id)) && (e.units?.[id]?.count ?? 0) > 0).map((id) => [id, e.units[id].count]));
}

function fight(att: WhatIfEmpire, def: WhatIfEmpire, now: number): CombatResult | null {
  const lord = def.npc ? findWarlord(def.npc) : undefined;
  const fleet = fleetOf(att, !!lord);
  if (Object.keys(fleet).length === 0) return null;
  const scope = lord ? "warlord" : "pvp";
  const aFx = playerCombatEffects(att as never, scope, now);
  const dFx = playerCombatEffects(def as never, scope, now);
  const mods = lord ? warlordCombatMods(lord.personality, Math.max(1, Math.min(5, def.rank ?? 1)) as WarlordRank, "defender", fleet, warlordRankRules(), COMBAT_RULES.retreatAt) : null;
  const lordEdge = mods && (mods.edgeBonus || mods.edgeCancelled) ? { bonus: mods.edgeBonus, cancel: mods.edgeCancelled } : undefined;
  const aEdge = edgeParam(aFx);
  const dEdge = edgeParam(dFx, lordEdge);
  const defUnits = lord ? def.units : Object.fromEntries(Object.entries(def.units ?? {}).filter(([id]) => !isEliteUnit(id)));
  return resolveCombat({
    attackFactor: 1 + playerModifiers(att as never, now).attack,
    defenderPowerFactor: 1 + playerModifiers(def as never, now).defense,
    attackerUnits: att.units,
    attackerTechLevels: att.techLevels ?? {},
    attackerRepairPct: 0,
    fleet,
    defenderUnits: defUnits,
    defenderTechLevels: def.techLevels ?? {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderShieldPct: mods?.shieldIgnored ? 0 : getShieldPercent(def.buildings ?? {}) + (mods?.shieldBonus ?? 0) + dFx.shield,
    defenseFactor: mods?.defenseFactor ?? 1,
    ...(mods?.homeFleetFactor !== undefined ? { homeFleetFactor: COMBAT_RULES.homeFleetDefenseFactor * mods.homeFleetFactor } : {}),
    unitBonus: { attacker: aFx.units, defender: dFx.units },
    ...(aEdge || dEdge ? { classEdge: { ...(aEdge ? { attacker: aEdge } : {}), ...(dEdge ? { defender: dEdge } : {}) } } : {}),
  });
}

function summarize(players: WhatIfEmpire[], lords: WhatIfEmpire[], now: number): WhatIfSummary {
  let pvpFights = 0;
  let pvpWins = 0;
  for (const a of players)
    for (const d of players) {
      if (a.uid === d.uid) continue;
      const r = fight(a, d, now);
      if (!r) continue;
      pvpFights++;
      if (r.outcome === "attacker_win") pvpWins++;
    }
  const beat: Record<string, number> = {};
  const lordsBeaten: Record<string, number> = {};
  for (const p of players)
    for (const l of lords) {
      const r = fight(p, l, now);
      if (r?.outcome === "attacker_win") {
        beat[l.uid] = (beat[l.uid] ?? 0) + 1;
        lordsBeaten[p.uid] = (lordsBeaten[p.uid] ?? 0) + 1;
      }
    }
  return {
    pvpFights,
    pvpWinRate: pvpFights > 0 ? pvpWins / pvpFights : 0,
    warlords: lords.map((l) => ({ id: l.npc ?? l.uid, name: l.pseudo, power: empirePower(l), beatenBy: beat[l.uid] ?? 0, of: players.length })),
    players: players.map((p) => ({ uid: p.uid, pseudo: p.pseudo, power: empirePower(p), lordsBeaten: lordsBeaten[p.uid] ?? 0 })),
  };
}

/** Applique le changement le temps de `fn`, puis restaure les règles. */
function withChange<T>(change: WhatIfChange, lords: WhatIfEmpire[], fn: (lords: WhatIfEmpire[]) => T): T {
  const unit = change.unit ? UNIT_BASE_STATS[change.unit.id] : undefined;
  const savedUnit = unit ? { ...unit } : undefined;
  const savedEdge = COMBAT_RULES.classEdge;
  try {
    if (unit && change.unit) {
      unit.attack *= change.unit.attack ?? 1;
      unit.defense *= change.unit.defense ?? 1;
    }
    if (change.classEdge !== undefined) COMBAT_RULES.classEdge = change.classEdge;
    const k = change.warlordPower ?? 1;
    const scaled = k === 1 ? lords : lords.map((l) => ({ ...l, units: Object.fromEntries(Object.entries(l.units ?? {}).map(([id, st]) => [id, { ...st, count: Math.floor((st?.count ?? 0) * k) }])) }));
    return fn(scaled);
  } finally {
    if (unit && savedUnit) Object.assign(unit, savedUnit);
    COMBAT_RULES.classEdge = savedEdge;
  }
}

/** Avant / après un changement, sur les empires réels (les 25 joueurs les plus puissants). */
export function runWhatIf(empires: WhatIfEmpire[], change: WhatIfChange, now: number = Date.now()): { before: WhatIfSummary; after: WhatIfSummary } {
  const players = empires
    .filter((e) => !e.npc)
    .sort((a, b) => empirePower(b) - empirePower(a))
    .slice(0, MAX_PLAYERS);
  const lords = empires.filter((e) => e.npc && findWarlord(e.npc));
  const before = summarize(players, lords, now);
  const after = withChange(change, lords, (l) => summarize(players, l, now));
  return { before, after };
}
