import { describeEffect, isUnitSelector, validateValuedEffects, type EffectGrant, type ValuedEffect } from "@/game/effects";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.0 (proposals/classes-empire.md) : classes d'empire. Une identité
   choisie par le joueur : Industriel, Seigneur de guerre ou Explorateur.
   Chacune donne des effets (couche empire du circuit d'effets) et un
   avantage propre (chantier, emplacements de flotte, expédition).
   Premier choix gratuit ; changer coûte de l'Ambre, une fois par
   période (réglable : Règles → Classes d'empire).
   6.14.125 (AU27, lot AA7, constat AA-3) : la liste des classes vit dans les
   règles (`classes.defs`, éditeur dédié) ; chaque classe porte ses effets
   composés chiffrés (grandeur × cible × portée + valeur) et ses avantages.
   Une classe ajoutée dans l'admin a un effet réel, sans code.
===================================================== */

/** Identifiant de classe : ceux du jeu (« industriel », « seigneur », « explorateur ») ou une classe ajoutée dans l'admin. */
export type EmpireClassId = string;

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
  /** 6.14.125 (AA7) : effets composés chiffrés (couche empire, source « class »). */
  effects: ValuedEffect[];
  perks: EmpireClassPerks;
}

/** Classes livrées (valeurs littérales : piège « Initialisation des modules »). */
const DEFAULT_EMPIRE_CLASSES: EmpireClassDef[] = [
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

export const EMPIRE_CLASS_RULES: {
  changeAmber: number;
  changeCooldownDays: number;
  harvesterRecycleBonus: number;
  scoutExpeditionTime: number;
  defs: EmpireClassDef[];
} = {
  /** Ambre pour changer de classe (le premier choix est gratuit). */
  changeAmber: 100,
  /** Jours entre deux changements. */
  changeCooldownDays: 7,
  /** 6.5 : Récolteur, capacité de recyclage en plus de sa soute (0,25 = +25 %). */
  harvesterRecycleBonus: 0.25,
  /** 6.5 : Éclaireur lointain, durée d'expédition en moins (0,15 = −15 %). */
  scoutExpeditionTime: 0.15,
  /** 6.14.125 (AA7) : classes proposées (éditeur : Règles → Classes d'empire). Une classe livrée retirée de la liste revient
   *  à la fusion des règles (des joueurs l'ont choisie). */
  defs: structuredClone(DEFAULT_EMPIRE_CLASSES),
};

/** Classes en vigueur (règles). */
export function empireClasses(): EmpireClassDef[] {
  return Array.isArray(EMPIRE_CLASS_RULES.defs) && EMPIRE_CLASS_RULES.defs.length > 0 ? EMPIRE_CLASS_RULES.defs : DEFAULT_EMPIRE_CLASSES;
}

/** Classes livrées (copie : fusion des règles, admin, tests). */
export function defaultEmpireClasses(): EmpireClassDef[] {
  return structuredClone(DEFAULT_EMPIRE_CLASSES);
}

/** Liste enregistrée + classes livrées absentes (ajoutées en fin de liste : des joueurs peuvent les avoir choisies). */
export function withDefaultClasses(defs: unknown): EmpireClassDef[] {
  const list = Array.isArray(defs) ? (defs as EmpireClassDef[]) : [];
  const ids = new Set(list.map((c) => c?.id));
  return [...list, ...defaultEmpireClasses().filter((c) => !ids.has(c.id))];
}

const PERK_MAX: Record<keyof EmpireClassPerks, number> = { buildSlots: 3, fleetSlots: 10, expeditionsPerDay: 5 };

/** Erreurs de la liste des classes (validation des règles). */
export function validateEmpireClasses(defs: unknown, unitIds: Set<string>): string[] {
  if (defs === undefined) return [];
  if (!Array.isArray(defs)) return ["Classes : la liste des classes doit être une liste."];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const c of defs as Partial<EmpireClassDef>[]) {
    if (!c || typeof c !== "object") {
      errors.push("Classes : chaque classe est un objet.");
      continue;
    }
    const label = `Classe « ${c.name || c.id} »`;
    if (!c.id || !/^[a-z0-9_]{2,32}$/.test(c.id)) errors.push(`${label} : identifiant en minuscules, chiffres et _ (2 à 32 caractères).`);
    else if (seen.has(c.id)) errors.push(`${label} : identifiant en double.`);
    if (c.id) seen.add(c.id);
    if (!c.name?.trim()) errors.push(`${label} : nom vide.`);
    errors.push(...validateValuedEffects(label, c.effects, (sel) => isUnitSelector(sel, (id) => unitIds.has(id))));
    for (const [k, max] of Object.entries(PERK_MAX) as [keyof EmpireClassPerks, number][]) {
      const v = c.perks?.[k];
      if (v === undefined) continue;
      if (!(Number.isInteger(v) && v >= 0 && v <= max)) errors.push(`${label} : avantage « ${k} » entier entre 0 et ${max}.`);
    }
  }
  return errors;
}

export interface EmpireClassState {
  id: EmpireClassId;
  chosenAtMs: number;
  /** Changements payés depuis le premier choix. */
  changes: number;
}

export function findEmpireClass(id: string | null | undefined): EmpireClassDef | undefined {
  return empireClasses().find((c) => c.id === id);
}

export function playerEmpireClass(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined): EmpireClassDef | undefined {
  return findEmpireClass(player?.empireClass?.id);
}

/** Avantage propre de la classe (0 sans classe). */
export function empireClassPerk(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined, perk: keyof EmpireClassPerks): number {
  return Math.max(0, Math.floor(playerEmpireClass(player)?.perks?.[perk] ?? 0));
}

/** Effets de la classe (couche empire). */
export function empireClassEffects(player: Partial<Pick<PlayerState, "empireClass">> | null | undefined): EffectGrant[] {
  const def = playerEmpireClass(player);
  if (!def) return [];
  return (def.effects ?? []).map((e) => ({
    stat: e.stat,
    target: e.target,
    value: Number(e.value) || 0,
    layer: "empire" as const,
    ...(e.scope && e.scope !== "all" ? { scope: e.scope } : {}),
    source: { kind: "class" as const, id: def.id, label: def.name },
  }));
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
  if (!def.perks) return out;
  if (n(def.perks.buildSlots)) out.push(`+${n(def.perks.buildSlots)} chantier${n(def.perks.buildSlots) > 1 ? "s" : ""} de bâtiments en même temps`);
  if (n(def.perks.fleetSlots)) out.push(`+${n(def.perks.fleetSlots)} emplacement${n(def.perks.fleetSlots) > 1 ? "s" : ""} de flotte`);
  if (n(def.perks.expeditionsPerDay)) out.push(`+${n(def.perks.expeditionsPerDay)} expédition${n(def.perks.expeditionsPerDay) > 1 ? "s" : ""} par jour`);
  return out;
}

/** Effets d'une classe en phrases courtes (écran de choix, admin) : « +10 % · Production de toutes les ressources ». */
export function empireClassEffectLines(def: EmpireClassDef): string[] {
  return (def.effects ?? []).map((e) => describeEffect(e.stat, Number(e.value) || 0, e.target, e.scope));
}

/** « Les trois classes » : nombre en toutes lettres jusqu'à six (titre de la page Classe). */
export function empireClassCountWord(n: number): string {
  return ["aucune", "une", "deux", "trois", "quatre", "cinq", "six"][n] ?? String(n);
}
