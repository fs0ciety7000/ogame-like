import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { getProductionRatesPerSecond } from "@/game/production";
import type { BuildingDef } from "@/game/buildings";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Labo de synthèse (v4.0) : un bâtiment à 10 niveaux qui fabrique des
   capsules (niveau N → bonus de 5 × N %). Elles ne jouent qu'entre
   joueurs et n'apparaissent pas dans l'espionnage ; une Espionne en poste
   peut flairer une « anomalie chimique » (option C).
===================================================== */

export const SYNTH_BUILDING_ID = "labo_synthese";

/** Toujours présent, même si la liste des bâtiments est personnalisée. */
export const SYNTH_BUILDING: BuildingDef = {
  id: SYNTH_BUILDING_ID,
  name: "Labo de synthèse",
  description: "Des cuves bouillonnantes où mûrissent stimulants, carapaces et brouilleurs. Son niveau fixe la puissance des capsules (5 % par niveau).",
  image: "/assets/buildings/labo_synthese.webp",
  maxLevel: 10,
  unlockCost: { scrap: 1_500_000, energy: 800_000, data: 300_000 },
  upgrade: {
    baseCost: { scrap: 400_000, energy: 250_000, data: 100_000 },
    maxCost: { scrap: 150_000_000, energy: 90_000_000, data: 40_000_000 },
    costFromLevel: 2,
    secondsPerLevel: 5_400,
  },
};

export type CapsuleType = "assault" | "armor" | "decoy" | "veil";

export const CAPSULES: Record<CapsuleType, { name: string; short: string; description: (pct: number) => string; use: "launch" | "activate" }> = {
  assault: {
    name: "Stimulant d'assaut",
    short: "Attaque",
    description: (p) => `+${p} % d'attaque pour la prochaine attaque lancée contre un joueur.`,
    use: "launch",
  },
  armor: {
    name: "Carapace réactive",
    short: "Défense",
    description: (p) => `+${p} % de défense contre la première attaque de joueur subie (12 h).`,
    use: "activate",
  },
  decoy: {
    name: "Brouilleur d'approche",
    short: "Leurre",
    description: (p) => `Le défenseur voit une fausse composition de ta flotte (±${p} %). L'heure d'arrivée reste vraie.`,
    use: "launch",
  },
  veil: {
    name: "Brouilleur de défense",
    short: "Voile",
    description: (p) => `Les rapports d'espionnage sur ta base montrent des défenses et une flotte faussées de ±${p} % (12 h).`,
    use: "activate",
  },
};

export const CAPSULE_TYPES = Object.keys(CAPSULES) as CapsuleType[];

export const SYNTH_RULES = {
  pctPerLevel: 5,
  maxStock: 3,
  activeHours: 12,
  /** Coût : 2 h de production commune par niveau de capsule. */
  costHoursPerLevel: 2,
  /** Fabrication : 30 min au niveau 1, environ 12 h au niveau 10. */
  baseMinutes: 30,
  minutesPerLevel: 77,
};

export interface SynthesisState {
  crafting: { type: CapsuleType; level: number; endsAtMs: number } | null;
  /** Niveaux des capsules en réserve, par type. */
  stock: Record<CapsuleType, number[]>;
  armor: { pct: number; untilMs: number } | null;
  veil: { pct: number; untilMs: number } | null;
}

export function capsulePct(level: number): number {
  return Math.max(0, Math.min(10, Math.floor(level))) * SYNTH_RULES.pctPerLevel;
}

export function synthesisState(player: Pick<PlayerState, "synthesis">): SynthesisState {
  const raw = (player.synthesis ?? {}) as Partial<SynthesisState>;
  const stock = {} as Record<CapsuleType, number[]>;
  for (const t of CAPSULE_TYPES) stock[t] = (Array.isArray(raw.stock?.[t]) ? raw.stock![t] : []).map((n) => Math.max(1, Math.min(10, Math.floor(Number(n)) || 1)));
  const crafting = raw.crafting && CAPSULE_TYPES.includes(raw.crafting.type) ? raw.crafting : null;
  return { crafting, stock, armor: raw.armor ?? null, veil: raw.veil ?? null };
}

export function synthLevel(player: Pick<PlayerState, "buildings">): number {
  const b = player.buildings?.[SYNTH_BUILDING_ID];
  return b && b.unlocked !== false ? Math.max(0, b.level ?? 0) : 0;
}

export function craftSeconds(level: number): number {
  return (SYNTH_RULES.baseMinutes + (level - 1) * SYNTH_RULES.minutesPerLevel) * 60;
}

/** Coût d'une capsule : heures de production commune du joueur (au moins 1 000 de chaque). */
export function capsuleCost(player: Pick<PlayerState, "buildings" | "techLevels">, level: number): Partial<Record<ResourceId, number>> {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const hours = SYNTH_RULES.costHoursPerLevel * level;
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of ["scrap", "energy", "nano", "data"] as ResourceId[]) out[res] = Math.max(1000 * level, Math.floor((rates[res] ?? 0) * hours * 3600));
  return out;
}

/** Fabrication terminée : la capsule rejoint la réserve. Modifie le joueur. */
export function advanceSynthesis(player: PlayerState, now: number): { type: CapsuleType; level: number } | null {
  const st = synthesisState(player);
  if (!st.crafting || st.crafting.endsAtMs > now) return null;
  const done = { type: st.crafting.type, level: st.crafting.level };
  st.stock[done.type] = [...st.stock[done.type], done.level].slice(-SYNTH_RULES.maxStock);
  st.crafting = null;
  player.synthesis = st;
  return done;
}

export function craftCapsule(player: PlayerState, typeIn: unknown, levelIn: unknown, now: number): { type: CapsuleType; level: number; endsAtMs: number } {
  const type = typeIn as CapsuleType;
  if (!CAPSULE_TYPES.includes(type)) throw new GameActionError("Capsule inconnue.");
  const level = Math.floor(Number(levelIn));
  const max = synthLevel(player);
  if (max <= 0) throw new GameActionError("Il faut d'abord construire le Labo de synthèse.");
  if (!(level >= 1 && level <= max)) throw new GameActionError(`Ton Labo de synthèse fabrique des capsules jusqu'au niveau ${max}.`);
  const st = synthesisState(player);
  if (st.crafting) throw new GameActionError("Une capsule est déjà en cours de synthèse.");
  if (st.stock[type].length >= SYNTH_RULES.maxStock) throw new GameActionError(`${SYNTH_RULES.maxStock} capsules de ce type en réserve au plus.`);
  const cost = capsuleCost(player, level);
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) {
    if ((player.resources[res] ?? 0) < n) throw new GameActionError(`Il manque ${formatInt(n - (player.resources[res] ?? 0))} ressources pour cette capsule.`);
  }
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) - n;
  st.crafting = { type, level, endsAtMs: now + craftSeconds(level) * 1000 };
  player.synthesis = st;
  return st.crafting;
}

/** Prend la capsule la plus forte d'un type (ou d'un niveau précis). Renvoie son bonus en %. */
export function takeCapsule(player: PlayerState, type: CapsuleType, levelIn?: unknown): number {
  const st = synthesisState(player);
  const stock = [...st.stock[type]].sort((a, b) => b - a);
  if (stock.length === 0) throw new GameActionError(`Aucune capsule « ${CAPSULES[type].name} » en réserve.`);
  const wanted = levelIn === undefined || levelIn === null ? stock[0] : Math.floor(Number(levelIn));
  const i = stock.indexOf(wanted);
  if (i < 0) throw new GameActionError("Cette capsule n'est plus en réserve.");
  stock.splice(i, 1);
  st.stock[type] = stock;
  player.synthesis = st;
  return capsulePct(wanted);
}

/** Active une capsule de défense (carapace ou voile) pour 12 h. */
export function activateCapsule(player: PlayerState, typeIn: unknown, levelIn: unknown, now: number): number {
  const type = typeIn as CapsuleType;
  if (type !== "armor" && type !== "veil") throw new GameActionError("Cette capsule s'utilise au lancement d'une attaque.");
  const st = synthesisState(player);
  const current = st[type];
  if (current && current.untilMs > now) throw new GameActionError("Une capsule de ce type est déjà active.");
  const pct = takeCapsule(player, type, levelIn);
  const after = synthesisState(player);
  after[type] = { pct, untilMs: now + SYNTH_RULES.activeHours * 3600_000 };
  player.synthesis = after;
  return pct;
}

/** Carapace active : consommée par la première attaque de joueur subie. */
export function consumeArmor(player: PlayerState, now: number): number {
  const st = synthesisState(player);
  if (!st.armor || st.armor.untilMs <= now) return 0;
  const pct = st.armor.pct;
  st.armor = null;
  player.synthesis = st;
  return pct;
}

export function activeVeil(player: Pick<PlayerState, "synthesis">, now: number): number {
  const v = synthesisState(player).veil;
  return v && v.untilMs > now ? v.pct : 0;
}

/** Fausse composition d'une flotte (brouilleur d'approche) : chaque type
 *  varie de ±pct %, et un type peut être remplacé par un autre. */
export function decoyUnits(real: Record<string, number>, pct: number, pool: string[], random: () => number = Math.random): Record<string, number> {
  const out: Record<string, number> = {};
  const swing = pct / 100;
  for (const [id, qty] of Object.entries(real)) {
    if (!(qty > 0)) continue;
    const fake = Math.max(1, Math.round(qty * (1 + (random() * 2 - 1) * swing)));
    let target = id;
    if (pool.length > 1 && random() < swing) {
      const others = pool.filter((p) => p !== id);
      target = others[Math.floor(random() * others.length) % others.length];
    }
    out[target] = (out[target] ?? 0) + fake;
  }
  return out;
}

/** Brouilleur de défense : quantités faussées de ±pct % dans un rapport. */
export function veilCounts<T extends { count: number }>(entries: Record<string, T> | undefined, pct: number, random: () => number = Math.random): Record<string, T> | undefined {
  if (!entries) return entries;
  const swing = pct / 100;
  return Object.fromEntries(Object.entries(entries).map(([id, e]) => [id, { ...e, count: Math.max(0, Math.round(e.count * (1 + (random() * 2 - 1) * swing))) }]));
}
