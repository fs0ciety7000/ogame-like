import type { EffectGrant, EffectStat } from "@/game/effects";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.0 (proposals/classes-empire.md) : classes d'empire. Une identité
   choisie par le joueur : Industriel, Seigneur de guerre ou Explorateur.
   Chacune donne des effets (couche empire du circuit d'effets) et un
   avantage propre (chantier, emplacements de flotte, expédition).
   Premier choix gratuit ; changer coûte de l'Ambre, une fois par
   période (réglable : Règles → Classes d'empire).
===================================================== */

export type EmpireClassId = "industriel" | "seigneur" | "explorateur";

export interface EmpireClassPerks {
  /** Chantiers de bâtiments en plus (buildSlots). */
  buildSlots?: number;
  /** Emplacements de flotte en plus (fleetSlots). */
  fleetSlots?: number;
  /** Expéditions par jour en plus. */
  expeditionsPerDay?: number;
}

export interface EmpireClassDef {
  id: EmpireClassId;
  name: string;
  emoji: string;
  /** Phrase d'accroche (qui joue cette classe). */
  tagline: string;
  effects: { stat: EffectStat; value: number; target?: string }[];
  perks: EmpireClassPerks;
}

export const EMPIRE_CLASSES: EmpireClassDef[] = [
  {
    id: "industriel",
    name: "Industriel",
    emoji: "🏭",
    tagline: "Tu bâtis vite et tu produis plus. Ton empire grandit pendant que les autres se battent.",
    effects: [
      { stat: "productionAll", value: 0.1 },
      { stat: "buildTime", value: 0.08 },
      { stat: "storage", value: 0.1 },
    ],
    perks: { buildSlots: 1 },
  },
  {
    id: "seigneur",
    name: "Seigneur de guerre",
    emoji: "⚔️",
    tagline: "Tu frappes souvent et tu repars les soutes pleines.",
    effects: [
      { stat: "attack", value: 0.05 },
      { stat: "loot", value: 0.15 },
      { stat: "unitTime", value: 0.1 },
    ],
    perks: { fleetSlots: 2 },
  },
  {
    id: "explorateur",
    name: "Explorateur",
    emoji: "🧭",
    tagline: "Tu cherches plus loin : recherches rapides, soutes larges, une expédition de plus chaque jour.",
    effects: [
      { stat: "researchTime", value: 0.08 },
      { stat: "cargo", value: 0.15 },
      { stat: "spyLevel", value: 1 },
    ],
    perks: { expeditionsPerDay: 1 },
  },
];

export const EMPIRE_CLASS_RULES = {
  /** Ambre pour changer de classe (le premier choix est gratuit). */
  changeAmber: 100,
  /** Jours entre deux changements. */
  changeCooldownDays: 7,
  /** 6.5 : Récolteur, capacité de recyclage en plus de sa soute (0,25 = +25 %). */
  harvesterRecycleBonus: 0.25,
  /** 6.5 : Éclaireur lointain, durée d'expédition en moins (0,15 = −15 %). */
  scoutExpeditionTime: 0.15,
};

export interface EmpireClassState {
  id: EmpireClassId;
  chosenAtMs: number;
  /** Changements payés depuis le premier choix. */
  changes: number;
}

export function findEmpireClass(id: string | null | undefined): EmpireClassDef | undefined {
  return EMPIRE_CLASSES.find((c) => c.id === id);
}

export function playerEmpireClass(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined): EmpireClassDef | undefined {
  return findEmpireClass(player?.empireClass?.id);
}

/** Avantage propre de la classe (0 sans classe). */
export function empireClassPerk(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined, perk: keyof EmpireClassPerks): number {
  return Math.max(0, Math.floor(playerEmpireClass(player)?.perks[perk] ?? 0));
}

/** Effets de la classe (couche empire). */
export function empireClassEffects(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined): EffectGrant[] {
  const def = playerEmpireClass(player);
  if (!def) return [];
  return def.effects.map((e) => ({ stat: e.stat, target: e.target, value: e.value, layer: "empire" as const, source: { kind: "class" as const, id: def.id, label: def.name } }));
}

/** Heure à partir de laquelle un changement est possible (0 = tout de suite). */
export function empireClassReadyAt(player: Partial<Pick<PlayerState, "empireClass">>): number {
  const st = player.empireClass;
  return st ? st.chosenAtMs + Math.max(0, EMPIRE_CLASS_RULES.changeCooldownDays) * 86_400_000 : 0;
}

/** Prix du prochain choix : 0 pour le premier. */
export function empireClassPrice(player: Partial<Pick<PlayerState, "empireClass">>): number {
  return player.empireClass ? Math.max(0, Math.floor(EMPIRE_CLASS_RULES.changeAmber)) : 0;
}

/** Avantages propres, en phrases courtes (écran de choix). */
export function empireClassPerkLines(def: EmpireClassDef): string[] {
  const out: string[] = [];
  const n = (x: number | undefined) => Math.max(0, Math.floor(x ?? 0));
  if (n(def.perks.buildSlots)) out.push(`+${n(def.perks.buildSlots)} chantier${n(def.perks.buildSlots) > 1 ? "s" : ""} de bâtiments en même temps`);
  if (n(def.perks.fleetSlots)) out.push(`+${n(def.perks.fleetSlots)} emplacement${n(def.perks.fleetSlots) > 1 ? "s" : ""} de flotte`);
  if (n(def.perks.expeditionsPerDay)) out.push(`+${n(def.perks.expeditionsPerDay)} expédition par jour`);
  return out;
}
