import { rareRewardScale } from "@/game/economy";
import { getProductionRatesPerSecond } from "@/game/production";
import { GameActionError } from "@/game/errors";
import { applyXpDelta } from "@/game/seasons";
import type { PlayerState, ResourceId } from "@/types/game";
import { formatInt } from "@/game/format";
import { grantTokens } from "@/game/casino";
import { parisDay } from "@/game/retention";
import { NAV_UNLOCK_RULES, navPageOpen } from "@/game/navUnlock";

/* =====================================================
   Contrats quotidiens : 3 objectifs par jour (minuit UTC), tirés au sort
   pour chaque joueur. Terminer les 3 fait avancer la série de jours
   consécutifs (+10 % de récompense par jour, jusqu'à +50 %) ; tous les
   7 jours de série, un coffre bonus. Une relance gratuite par jour.
===================================================== */

export type ContractType =
  | "upgrade_building"
  | "research"
  | "build_units"
  | "win_attack"
  | "win_defense"
  | "missions"
  | "gift"
  | "spend"
  // 6.2 (lot N) : objectifs repris des missions du jour.
  | "spy"
  | "market";

export interface Contract {
  id: string;
  type: ContractType;
  target: number;
  progress: number;
  claimed: boolean;
}

export interface ContractsState {
  day: string;
  items: Contract[];
  /** Jours consécutifs où tous les objectifs du jour ont été terminés. */
  streak: number;
  lastCompletedDay: string | null;
  rerolled: boolean;
}

/* 6.2 (lot N, proposals/quotidien-fusion.md) : contrats et missions du jour fusionnés en 4 objectifs du jour,
   remis à zéro à minuit (heure de Paris). Totaux par jour inchangés : 360 rares × échelle, 60 XP, 5 jetons. */
export const CONTRACT_RULES = {
  perDay: 4,
  streakBonusPerDay: 0.1,
  streakBonusMax: 0.5,
  chestEvery: 7,
  xpPerContract: 15,
  rarePerContract: 90,
  /** 6.2 : jetons du casino par objectif, et en plus quand tous sont faits. */
  tokensPerContract: 1,
  allDoneTokens: 1,
  chestRare: 1500,
  chestXp: 150,
};

export const CONTRACT_LABELS: Record<ContractType, (target: number) => string> = {
  upgrade_building: (n) => `Lancer ${n} amélioration${n > 1 ? "s" : ""} de bâtiment`,
  research: (n) => `Lancer ${n} recherche${n > 1 ? "s" : ""}`,
  build_units: (n) => `Construire ${n} unités`,
  win_attack: (n) => `Gagner ${n} attaque${n > 1 ? "s" : ""}`,
  win_defense: (n) => `Repousser ${n} attaque${n > 1 ? "s" : ""}`,
  missions: (n) => `Terminer ${n} missions`,
  gift: (n) => `Envoyer ${n} don${n > 1 ? "s" : ""} de ressources`,
  spend: (n) => `Dépenser ${formatInt(n)} ressources`,
  spy: (n) => `Lancer ${n} sonde${n > 1 ? "s" : ""} d'espionnage`,
  market: (n) => `Acheter ${n} offre${n > 1 ? "s" : ""} au marché`,
};

const ALL_TYPES: ContractType[] = ["upgrade_building", "research", "build_units", "win_attack", "win_defense", "missions", "gift", "spend", "spy", "market"];
/* 6.14.79 (DP-L4, invariant I31, Q158) : un objectif d'un **nouveau** jour n'est tiré que parmi les systèmes ouverts du joueur
   (menu progressif, `navUnlock`). Page(s) où l'objectif se fait ; un type absent se fait sur une page toujours visible
   (Bâtiments, Labo, Unités, Ressources). Le tirage du jour en cours n'est jamais refait. */
export const CONTRACT_PAGES: Partial<Record<ContractType, string[]>> = {
  win_attack: ["/game/galaxie"],
  win_defense: ["/game/combats"],
  missions: ["/game/missions"],
  gift: ["/game/commerce"],
  spy: ["/game/galaxie"],
  market: ["/game/commerce"],
};

/** Types d'objectifs que le joueur peut tirer (tous si `navUnlock.filterContracts` est à faux ou hors du menu progressif). */
export function openContractTypes(player: PlayerState, now: number): ContractType[] {
  if (!NAV_UNLOCK_RULES.filterContracts) return [...ALL_TYPES];
  return ALL_TYPES.filter((t) => (CONTRACT_PAGES[t] ?? []).every((page) => navPageOpen(player, page, { now })));
}

const RARES: ResourceId[] = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
const DAY_MS = 24 * 3600 * 1000;

/** Jour des objectifs (6.2 : heure de Paris, comme les missions du jour d'avant). */
export function contractDay(now: number): string {
  return parisDay(now);
}

function previousDay(day: string): string {
  return contractDay(Date.parse(`${day}T00:00:00Z`) - DAY_MS);
}

/** Hachage déterministe (uid + jour) : mêmes contrats sur le client et le serveur. */
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function targetFor(type: ContractType, player: PlayerState): number {
  switch (type) {
    case "build_units":
      return 20;
    case "missions":
      return 2;
    case "spy":
      return 2;
    case "spend": {
      // Une heure de production commune, au minimum 5 000.
      const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
      const perHour = ((rates.scrap ?? 0) + (rates.energy ?? 0) + (rates.nano ?? 0) + (rates.data ?? 0)) * 3600;
      return Math.max(5000, Math.round(perHour / 1000) * 1000);
    }
    default:
      return 1;
  }
}

function makeContract(type: ContractType, player: PlayerState, day: string, index: number): Contract {
  return { id: `${day}-${index}-${type}`, type, target: targetFor(type, player), progress: 0, claimed: false };
}

/** Contrats du jour (générés au premier passage de la journée). */
export function ensureContracts(player: PlayerState, now: number): ContractsState {
  const day = contractDay(now);
  const current = player.contracts;
  if (current && current.day === day) {
    // 6.2 : bascule de 3 à 4 objectifs dans la journée, sans rien retirer.
    if (current.items.length < CONTRACT_RULES.perDay) {
      const used = new Set(current.items.map((c) => c.type));
      const rand = seededRandom(`${player.uid}:${day}:extra`);
      const pool = openContractTypes(player, now).filter((t) => !used.has(t));
      while (current.items.length < CONTRACT_RULES.perDay && pool.length > 0) {
        const type = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        current.items.push(makeContract(type, player, day, current.items.length));
      }
    }
    return current;
  }

  const rand = seededRandom(`${player.uid}:${day}`);
  // I31 : un nouveau jour ne tire que parmi les systèmes ouverts (4 types toujours ouverts : le compte est plein dès J0).
  const pool = openContractTypes(player, now);
  const items: Contract[] = [];
  for (let i = 0; i < CONTRACT_RULES.perDay && pool.length > 0; i++) {
    const type = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    items.push(makeContract(type, player, day, i));
  }
  // Série interrompue si la veille n'a pas été complétée.
  const keepsStreak = current?.lastCompletedDay === previousDay(day);
  player.contracts = {
    day,
    items,
    streak: keepsStreak ? current?.streak ?? 0 : 0,
    lastCompletedDay: current?.lastCompletedDay ?? null,
    rerolled: false,
  };
  return player.contracts;
}

/** Fait avancer les contrats du type donné. */
export function recordContract(player: PlayerState, type: ContractType, amount: number, now: number): void {
  if (!(amount > 0)) return;
  const state = ensureContracts(player, now);
  for (const c of state.items) {
    if (c.type === type && !c.claimed) c.progress = Math.min(c.target, c.progress + amount);
  }
}

/** Multiplicateur lié au développement (comme les missions). */
function developmentScale(player: PlayerState): number {
  return rareRewardScale(player);
}

export function streakBonus(streak: number): number {
  return Math.min(CONTRACT_RULES.streakBonusMax, streak * CONTRACT_RULES.streakBonusPerDay);
}

/** Récompense d'un contrat (ressource rare tournante + XP), bonus de série inclus. */
export function contractReward(player: PlayerState, contract: Contract): Record<string, number> {
  const state = player.contracts;
  const multiplier = (1 + streakBonus(state?.streak ?? 0)) * developmentScale(player);
  const index = Number(contract.id.split("-")[3] ?? 0) || 0;
  const rare = RARES[(index + contract.type.length) % RARES.length];
  return {
    [rare]: Math.round(CONTRACT_RULES.rarePerContract * multiplier),
    xp: Math.round(CONTRACT_RULES.xpPerContract * (1 + streakBonus(state?.streak ?? 0))),
  };
}

export function chestReward(player: PlayerState): Record<string, number> {
  const scale = developmentScale(player);
  const out: Record<string, number> = { xp: CONTRACT_RULES.chestXp };
  for (const r of RARES) out[r] = Math.round(CONTRACT_RULES.chestRare * scale);
  return out;
}

function grant(player: PlayerState, reward: Record<string, number>, now: number) {
  for (const [res, amount] of Object.entries(reward)) {
    if (res === "xp") applyXpDelta(player, amount, now, "contract");
    else player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) + amount;
  }
}

export interface ClaimResult {
  reward: Record<string, number>;
  dayCompleted: boolean;
  chest: Record<string, number> | null;
  /** 6.2 : jetons du casino versés. */
  tokens?: number;
}

export function claimContract(player: PlayerState, contractId: string, now: number): ClaimResult {
  const state = ensureContracts(player, now);
  const contract = state.items.find((c) => c.id === contractId);
  if (!contract) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (contract.claimed) throw new GameActionError("Récompense déjà récupérée.");
  if (contract.progress < contract.target) throw new GameActionError("Contrat pas encore rempli.");

  const reward = contractReward(player, contract);
  grant(player, reward, now);
  contract.claimed = true;
  // 6.2 : un jeton du casino par objectif (repris des missions du jour).
  let tokens = Math.max(0, Math.floor(CONTRACT_RULES.tokensPerContract));

  let chest: Record<string, number> | null = null;
  const dayCompleted = state.items.every((c) => c.claimed);
  if (dayCompleted) {
    state.streak = state.lastCompletedDay === previousDay(state.day) ? state.streak + 1 : 1;
    state.lastCompletedDay = state.day;
    if (state.streak % CONTRACT_RULES.chestEvery === 0) {
      chest = chestReward(player);
      grant(player, chest, now);
    }
    tokens += Math.max(0, Math.floor(CONTRACT_RULES.allDoneTokens));
  }
  if (tokens > 0) grantTokens(player, tokens);
  return { reward, dayCompleted, chest, tokens };
}

/** Remplace un contrat non réclamé (une fois par jour). */
export function rerollContract(player: PlayerState, contractId: string, now: number): Contract {
  const state = ensureContracts(player, now);
  if (state.rerolled) throw new GameActionError("Tu as déjà relancé un contrat aujourd'hui.");
  const index = state.items.findIndex((c) => c.id === contractId);
  if (index < 0) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (state.items[index].claimed) throw new GameActionError("Ce contrat est déjà terminé.");
  const used = new Set(state.items.map((c) => c.type));
  // I31 : la relance est un nouveau tirage, parmi les systèmes ouverts ; sans autre objectif ouvert, elle reste disponible.
  const pool = openContractTypes(player, now).filter((t) => !used.has(t));
  if (pool.length === 0) throw new GameActionError("Aucun autre objectif n'est encore ouvert : ta relance reste disponible.");
  const rand = seededRandom(`${player.uid}:${state.day}:reroll`);
  const type = pool[Math.floor(rand() * pool.length)];
  const next = makeContract(type, player, state.day, index);
  next.id = `${state.day}-${index}-${type}-r`;
  state.items[index] = next;
  state.rerolled = true;
  return next;
}
