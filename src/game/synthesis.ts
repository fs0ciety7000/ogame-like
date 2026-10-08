import { GameActionError } from "@/game/errors";
import { spendResources } from "@/game/spending";
import { formatHours, formatInt } from "@/game/format";
import { getProductionRatesPerSecond } from "@/game/production";
import { SYNTH_BUILDING, SYNTH_BUILDING_ID } from "@/game/buildings";
import type { EffectGrant } from "@/game/effects";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Labo de synthèse (v4.0) : un bâtiment à 10 niveaux qui fabrique des
   capsules (niveau N → bonus de 5 × N %). Elles ne jouent qu'entre
   joueurs et n'apparaissent pas dans l'espionnage ; une Espionne en poste
   peut flairer une « anomalie chimique » (option C).
===================================================== */

export { SYNTH_BUILDING, SYNTH_BUILDING_ID };

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
    description: (p) => `+${p} % de défense contre la première attaque de joueur subie (${formatHours(SYNTH_RULES.activeHours)}).`,
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
    description: (p) => `Les rapports d'espionnage sur ta base montrent des défenses et une flotte faussées de ±${p} % (${formatHours(SYNTH_RULES.activeHours)}).`,
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

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const SYNTH_RULES_META = {
  pctPerLevel: { label: "Effet par niveau de capsule", unit: "%", min: 0, max: 50, hint: "5 = +5 % par niveau (niveau 10 au plus)." },
  maxStock: { label: "Capsules d'un type en réserve", min: 1, max: 20 },
  activeHours: { label: "Durée d'une capsule active", unit: "h", min: 0.5, max: 168 },
  costHoursPerLevel: { label: "Coût : production commune par niveau", unit: "h", min: 0, max: 48 },
  baseMinutes: { label: "Fabrication au niveau 1", unit: "min", min: 0, max: 1440 },
  minutesPerLevel: { label: "Fabrication : minutes par niveau en plus", unit: "min", min: 0, max: 1440 },
};

export interface SynthesisState {
  crafting: { type: CapsuleType; level: number; endsAtMs: number } | null;
  /** Niveaux des capsules en réserve, par type. */
  stock: Record<CapsuleType, number[]>;
  armor: { pct: number; untilMs: number } | null;
  veil: { pct: number; untilMs: number } | null;
  /** Vraie composition des flottes leurrées, pour l'affichage chez leur propriétaire. */
  decoys: Record<string, Record<string, number>>;
}

/** v5.14 : capsules actives sur la base (circuit d'effets, portée « pvp » :
 *  elles ne jouent qu'entre joueurs). La Carapace réactive est consommée par le combat. */
export function synthesisEffects(player: Pick<PlayerState, "synthesis">, now: number): EffectGrant[] {
  const st = synthesisState(player);
  if (!st.armor || st.armor.untilMs <= now || !(st.armor.pct > 0)) return [];
  return [{ stat: "defense", value: st.armor.pct / 100, layer: "empire", scope: "pvp", source: { kind: "capsule", id: "armor", label: CAPSULES.armor.name } }];
}

/** v5.14 : capsule ajoutée à la réserve (administration, butin). Faux si la réserve de ce type est pleine. */
export function addCapsule(player: Pick<PlayerState, "synthesis">, type: CapsuleType, level: number): boolean {
  if (!CAPSULE_TYPES.includes(type)) throw new GameActionError("Capsule inconnue.");
  const st = synthesisState(player);
  if (st.stock[type].length >= SYNTH_RULES.maxStock) return false;
  st.stock[type] = [...st.stock[type], Math.max(1, Math.min(10, Math.floor(level) || 1))];
  player.synthesis = st as PlayerState["synthesis"];
  return true;
}

export function capsulePct(level: number): number {
  return Math.max(0, Math.min(10, Math.floor(level))) * SYNTH_RULES.pctPerLevel;
}

export function synthesisState(player: Pick<PlayerState, "synthesis">): SynthesisState {
  const raw = (player.synthesis ?? {}) as Partial<SynthesisState>;
  const stock = {} as Record<CapsuleType, number[]>;
  for (const t of CAPSULE_TYPES) stock[t] = (Array.isArray(raw.stock?.[t]) ? raw.stock![t] : []).map((n) => Math.max(1, Math.min(10, Math.floor(Number(n)) || 1)));
  const crafting = raw.crafting && CAPSULE_TYPES.includes(raw.crafting.type) ? raw.crafting : null;
  const decoys = raw.decoys && typeof raw.decoys === "object" ? raw.decoys : {};
  return { crafting, stock, armor: raw.armor ?? null, veil: raw.veil ?? null, decoys };
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
  // 6.14.110 (AC-5) : dépense comptée.
  spendResources(player, cost, now, {
    message: (c) => {
      const missing = (Object.entries(c) as [ResourceId, number][]).find(([res, n]) => (player.resources[res] ?? 0) < n);
      return `Il manque ${formatInt(missing ? missing[1] - (player.resources[missing[0]] ?? 0) : 0)} ressources pour cette capsule.`;
    },
  });
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

/* ---------- capsules au lancement d'une attaque (joueur contre joueur) ---------- */

export interface LaunchCapsules {
  /** Bonus en % (enregistrés, cachés, sur la flotte). */
  boosts: { assault?: number; decoy?: number };
  /** Fausse composition affichée au défenseur (brouilleur d'approche). */
  fakeUnits: Record<string, number> | null;
}

/** Prend en réserve les capsules demandées au lancement (`true` : la plus forte, ou un niveau). */
export function takeLaunchCapsules(
  player: PlayerState,
  request: unknown,
  realUnits: Record<string, number>,
  pool: string[],
  random: () => number = Math.random,
): LaunchCapsules {
  const req = request && typeof request === "object" ? (request as Record<string, unknown>) : {};
  const out: LaunchCapsules = { boosts: {}, fakeUnits: null };
  const level = (v: unknown) => (v === true ? undefined : v);
  if (req.assault) out.boosts.assault = takeCapsule(player, "assault", level(req.assault));
  if (req.decoy) {
    out.boosts.decoy = takeCapsule(player, "decoy", level(req.decoy));
    out.fakeUnits = decoyUnits(realUnits, out.boosts.decoy, pool, random);
  }
  return out;
}

export function recordDecoy(player: PlayerState, fleetId: string, units: Record<string, number>): void {
  const st = synthesisState(player);
  st.decoys = { ...st.decoys, [fleetId]: units };
  player.synthesis = st;
}

export function clearDecoy(player: PlayerState, fleetId: string): void {
  const st = synthesisState(player);
  if (!st.decoys[fleetId]) return;
  const next = { ...st.decoys };
  delete next[fleetId];
  st.decoys = next;
  player.synthesis = st;
}

/** Composition réelle d'une flotte du joueur (le leurre ne trompe que l'adversaire). */
export function realFleetUnits(player: Pick<PlayerState, "synthesis"> | null | undefined, fleet: { id: string; units: Record<string, number> }): Record<string, number> {
  const decoy = player ? synthesisState(player).decoys[fleet.id] : undefined;
  return decoy ?? fleet.units ?? {};
}
