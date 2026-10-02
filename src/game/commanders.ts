import { GameActionError } from "@/game/errors";
import { familyIndex, getRankIndex } from "@/game/ranks";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Commandants (v4.0) : cinq officiers recrutables, deux en poste (trois au
   rang Platine). Chacun progresse dans son domaine (jusqu'au niveau 20) et
   donne un bonus tant qu'il est en poste. Le premier est offert.
===================================================== */

export type CommanderId = "admiral" | "strategist" | "engineer" | "spy" | "steward";

export interface CommanderDef {
  id: CommanderId;
  name: string;
  title: string;
  portrait: string;
  /** D'où vient son expérience. */
  domain: string;
  bonus: (level: number) => string;
}

export const COMMANDERS: CommanderDef[] = [
  {
    id: "admiral",
    name: "Rhys Calder",
    title: "Amiral",
    portrait: "/assets/commanders/admiral.webp",
    domain: "Combats gagnés en attaque, repaires, primes, Léviathan.",
    bonus: (l) => `+${l} % d'attaque de la flotte`,
  },
  {
    id: "strategist",
    name: "Ilsa Varga",
    title: "Stratège",
    portrait: "/assets/commanders/strategist.webp",
    domain: "Attaques et raids repoussés.",
    bonus: (l) => `+${l} % de défense de la base`,
  },
  {
    id: "engineer",
    name: "Noor Halim",
    title: "Ingénieure",
    portrait: "/assets/commanders/engineer.webp",
    domain: "Constructions et recherches terminées.",
    bonus: (l) => `−${l} % de temps de construction et de recherche`,
  },
  {
    id: "spy",
    name: "Sable",
    title: "Espionne",
    portrait: "/assets/commanders/spy.webp",
    domain: "Espionnages lancés, sondes ennemies repérées.",
    bonus: (l) => `+${(l * 0.2).toFixed(1).replace(".", ",")} niveau d'espionnage, +${l} % de détection, ${l * 3} % de flairer une anomalie chimique`,
  },
  {
    id: "steward",
    name: "Oswin Tarr",
    title: "Intendant",
    portrait: "/assets/commanders/steward.webp",
    domain: "Missions, contrats du jour, échanges au marché.",
    bonus: (l) => `+${l} % de production, +${l * 2} % d'entrepôt`,
  },
];

export const COMMANDER_RULES = {
  maxLevel: 20,
  /** XP cumulée pour atteindre le niveau L : xpFactor × (L − 1) × L. */
  xpFactor: 15,
  slots: 2,
  /** Poste supplémentaire à partir de cette famille de rangs. */
  extraSlotFamily: "Platine",
  /** Recrutement (après le premier, offert). */
  recruitAmber: 150,
  recruitProductionHours: 12,
  /** Délai entre deux changements d'un même poste. */
  swapCooldownHours: 24,
  /** XP d'un Dossier d'entraînement. */
  dossierXp: 200,
  /** Anomalie chimique : chance par niveau de l'Espionne (option C). */
  anomalyPerLevel: 0.03,
};

/** XP gagnée par action (seuls les officiers en poste progressent). */
export const COMMANDER_XP = {
  attackWin: 20,
  lairWin: 40,
  bountyWin: 15,
  bossAssault: 10,
  defenseWin: 25,
  raidRepelled: 20,
  defenseLost: 5,
  buildingDone: 10,
  researchDone: 10,
  spyLaunched: 5,
  probesCaught: 10,
  missionDone: 5,
  contractClaimed: 10,
  marketTrade: 5,
};

export interface CommanderState {
  xp: number;
}

export interface CommandersState {
  roster: Partial<Record<CommanderId, CommanderState>>;
  active: CommanderId[];
  /** Dernier changement de poste, par officier. */
  movedAtMs: Partial<Record<CommanderId, number>>;
  dossiers: number;
}

export function findCommander(id: unknown): CommanderDef | undefined {
  return COMMANDERS.find((c) => c.id === id);
}

export function commandersState(player: Pick<PlayerState, "commanders">): CommandersState {
  const raw = (player.commanders ?? {}) as Partial<CommandersState>;
  const roster: CommandersState["roster"] = {};
  for (const c of COMMANDERS) {
    const r = raw.roster?.[c.id];
    if (r) roster[c.id] = { xp: Math.max(0, Number(r.xp) || 0) };
  }
  const active = (Array.isArray(raw.active) ? raw.active : []).filter((id, i, a): id is CommanderId => !!roster[id as CommanderId] && a.indexOf(id) === i);
  return { roster, active, movedAtMs: raw.movedAtMs && typeof raw.movedAtMs === "object" ? raw.movedAtMs : {}, dossiers: Math.max(0, Number(raw.dossiers) || 0) };
}

export function commanderLevel(xp: number): number {
  let level = 1;
  while (level < COMMANDER_RULES.maxLevel && xp >= COMMANDER_RULES.xpFactor * level * (level + 1)) level += 1;
  return level;
}

/** XP cumulée requise pour un niveau. */
export function xpForLevel(level: number): number {
  return COMMANDER_RULES.xpFactor * (level - 1) * level;
}

export function commanderSlots(player: Pick<PlayerState, "xp">): number {
  const family = familyIndex(COMMANDER_RULES.extraSlotFamily);
  return COMMANDER_RULES.slots + (family >= 0 && getRankIndex(player.xp ?? 0) >= family ? 1 : 0);
}

/** Niveaux des officiers en poste (0 si absent). */
export function activeLevels(player: Pick<PlayerState, "commanders">): Record<CommanderId, number> {
  const st = commandersState(player);
  const out = { admiral: 0, strategist: 0, engineer: 0, spy: 0, steward: 0 } as Record<CommanderId, number>;
  for (const id of st.active) out[id] = commanderLevel(st.roster[id]?.xp ?? 0);
  return out;
}

/** XP gagnée par l'officier, s'il est en poste. Modifie le joueur. */
export function grantCommanderXp(player: PlayerState, id: CommanderId, amount: number): void {
  if (!(amount > 0)) return;
  const st = commandersState(player);
  if (!st.active.includes(id) || !st.roster[id]) return;
  st.roster[id] = { xp: (st.roster[id]?.xp ?? 0) + amount };
  player.commanders = st;
}

/** Recrutement : le premier est offert, les suivants coûtent de l'Ambre ou de la production. */
export function recruitCost(player: Pick<PlayerState, "commanders">): "free" | "paid" {
  return Object.keys(commandersState(player).roster).length === 0 ? "free" : "paid";
}

export function recruitCommander(player: PlayerState, id: unknown, pay: (method: "amber" | "production") => void, method: "amber" | "production"): CommanderDef {
  const def = findCommander(id);
  if (!def) throw new GameActionError("Officier inconnu.");
  const st = commandersState(player);
  if (st.roster[def.id]) throw new GameActionError(`${def.title} ${def.name} sert déjà dans ta flotte.`);
  if (recruitCost(player) === "paid") pay(method);
  st.roster[def.id] = { xp: 0 };
  // Un poste libre : il y entre aussitôt.
  if (st.active.length < commanderSlots(player)) st.active.push(def.id);
  player.commanders = st;
  return def;
}

/** Nomination aux postes (liste complète des officiers en poste). */
export function assignCommanders(player: PlayerState, idsIn: unknown, now: number): void {
  const st = commandersState(player);
  const ids = (Array.isArray(idsIn) ? idsIn : []).map(String).filter((id, i, a) => a.indexOf(id) === i) as CommanderId[];
  if (ids.length > commanderSlots(player)) throw new GameActionError(`${commanderSlots(player)} postes au plus.`);
  for (const id of ids) if (!st.roster[id]) throw new GameActionError("Cet officier n'est pas recruté.");
  const changed = [...ids.filter((id) => !st.active.includes(id)), ...st.active.filter((id) => !ids.includes(id))];
  const cooldown = COMMANDER_RULES.swapCooldownHours * 3600_000;
  for (const id of changed) {
    const at = st.movedAtMs[id] ?? 0;
    if (at && now - at < cooldown) {
      const def = findCommander(id);
      throw new GameActionError(`${def?.title ?? "Cet officier"} vient de changer de poste : réessaie dans ${Math.ceil((at + cooldown - now) / 3600_000)} h.`);
    }
  }
  for (const id of changed) st.movedAtMs[id] = now;
  st.active = ids;
  player.commanders = st;
}

/** Dossier d'entraînement : XP immédiate, même hors poste. */
export function trainCommander(player: PlayerState, id: unknown): number {
  const def = findCommander(id);
  if (!def) throw new GameActionError("Officier inconnu.");
  const st = commandersState(player);
  if (!st.roster[def.id]) throw new GameActionError("Cet officier n'est pas recruté.");
  if (st.dossiers <= 0) throw new GameActionError("Aucun Dossier d'entraînement : il s'en trouve au Comptoir de la Ruche.");
  if (commanderLevel(st.roster[def.id]!.xp) >= COMMANDER_RULES.maxLevel) throw new GameActionError("Cet officier a atteint le niveau maximal.");
  st.dossiers -= 1;
  st.roster[def.id] = { xp: st.roster[def.id]!.xp + COMMANDER_RULES.dossierXp };
  player.commanders = st;
  return commanderLevel(st.roster[def.id]!.xp);
}

export function addDossiers(player: PlayerState, n: number): void {
  const st = commandersState(player);
  st.dossiers += n;
  player.commanders = st;
}

/** Chance qu'une Espionne en poste flaire une anomalie chimique. */
export function anomalyChance(player: Pick<PlayerState, "commanders">): number {
  return Math.min(1, activeLevels(player).spy * COMMANDER_RULES.anomalyPerLevel);
}
