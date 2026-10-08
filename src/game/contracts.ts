import { rareRewardScale } from "@/game/economy";
import { getProductionRatesPerSecond } from "@/game/production";
import { GameActionError } from "@/game/errors";
import { applyXpDelta } from "@/game/seasons";
import type { PlayerState, ResourceId } from "@/types/game";
import { formatInt } from "@/game/format";
import { grantTokens } from "@/game/casino";
import { parisDay } from "@/game/retention";
import { NAV_UNLOCK_RULES, navPageOpen } from "@/game/navUnlock";
import { onSpend } from "@/game/spending";
import { actionAvailable, actionOfContract, contentName, contentObjective, onTrackedAction, parseContentObjective, TRACKED_ACTIONS, trackedActionsEnabled, type ContentFamily, type StaticObjective } from "@/game/trackedActions";
import { hasContentAccess } from "@/game/novelty";
import { UNITS } from "@/game/units";
import { BUILDINGS } from "@/game/buildings";
import { TECHNOLOGIES } from "@/game/technologies";

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
  | "market"
  // 6.14.121 (AP-L7) : actions du registre des actions suivies (porte de saut, convoi de colonie), proposées seulement au
  // joueur qui peut les faire (porte ouverte, route de colonie).
  | "gate_jump"
  | "colony_convoy"
  // 6.14.131 (AU27, AJ27-7) : expédition, recyclage, et objectifs paramétrés par contenu (« Construire 20 × Frégate »,
  // « Rechercher Armement », « Améliorer l'Entrepôt ») : poids 0 par défaut, proposés seulement pour un contenu ouvert au joueur.
  | "expedition"
  | "recycle"
  | "unit_content"
  | "research_content"
  | "building_content";

export interface Contract {
  id: string;
  type: ContractType;
  target: number;
  progress: number;
  claimed: boolean;
  /** 6.14.131 (AJ27-7) : contenu visé par un objectif paramétré (`unit_content`… : identifiant d'unité, techno ou bâtiment). */
  content?: string;
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
  /** 6.14.109 (AU27, AP-L5, constat AP-9, Q87) : poids de tirage par type (0 = jamais tiré, 1 = normal). Tous égaux : tirage
   *  uniforme, identique à celui d'avant (même graine, même résultat). « Repousser une attaque » est passif : 0,5. */
  weights: {
    upgrade_building: 1,
    research: 1,
    build_units: 1,
    win_attack: 1,
    win_defense: 0.5,
    missions: 1,
    gift: 1,
    spend: 1,
    spy: 1,
    market: 1,
    // 6.14.121 (AP-L7) : tirés seulement pour un joueur qui peut les faire ; un compte sans lune ni route tire comme avant.
    gate_jump: 0.5,
    colony_convoy: 0.5,
    // 6.14.131 (AJ27-7) : poids 0 par défaut (aucun tirage ne change), activables dans l'admin.
    expedition: 0,
    recycle: 0,
    unit_content: 0,
    research_content: 0,
    building_content: 0,
  } as Record<ContractType, number>,
  /** 6.14.109 (AP-L5) : quantité demandée par type (avant : `targetFor` en dur) ; « Dépenser » suit `spendHours` et `spendMin`. */
  targets: {
    upgrade_building: 1,
    research: 1,
    build_units: 20,
    win_attack: 1,
    win_defense: 1,
    missions: 2,
    gift: 1,
    spy: 2,
    market: 1,
    gate_jump: 1,
    colony_convoy: 2,
    expedition: 1,
    recycle: 1,
    unit_content: 20,
    research_content: 1,
    building_content: 1,
  } as Partial<Record<ContractType, number>>,
  /** « Dépenser » : heures de production commune du joueur, au moins `spendMin` (arrondi au millier). */
  spendHours: 1,
  spendMin: 5000,
  /** 6.14.109 (Q87) : un raid de faction repoussé compte aussi pour « Repousser une attaque ». */
  defenseCountsFactionRaids: true,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const CONTRACT_RULES_META = {
  perDay: { label: "Objectifs du jour", min: 1, max: 10 },
  streakBonusPerDay: { label: "Bonus de série par jour", unit: "part", min: 0, max: 1, hint: "0,1 = +10 % de récompense par jour de série." },
  streakBonusMax: { label: "Bonus de série maximal", unit: "part", min: 0, max: 2 },
  chestEvery: { label: "Coffre tous les N jours de série", unit: "j", min: 1, max: 60 },
  xpPerContract: { label: "XP par objectif", unit: "XP", min: 0, max: 10_000 },
  rarePerContract: { label: "Ressources rares par objectif", min: 0, max: 1_000_000, hint: "Avant l'échelle de progression du joueur." },
  tokensPerContract: { label: "Jetons par objectif", unit: "jetons", min: 0, max: 20 },
  allDoneTokens: { label: "Jetons en plus quand tous sont faits", unit: "jetons", min: 0, max: 20 },
  chestRare: { label: "Coffre : chaque ressource rare", min: 0, max: 10_000_000 },
  chestXp: { label: "Coffre : XP", unit: "XP", min: 0, max: 100_000 },
  weights: { label: "Poids de tirage par type", hint: "0 = jamais tiré, 1 = normal, 2 = deux fois plus souvent. Tous égaux : tirage uniforme (celui d'avant la 6.14.109). Un type dont la page est fermée au joueur n'est jamais tiré (I31)." },
  targets: { label: "Quantité demandée par type", hint: "Nombre d'actions à faire dans la journée (« Dépenser » : voir les heures de production)." },
  spendHours: { label: "« Dépenser » : heures de production commune", unit: "h", min: 0.1, max: 48 },
  spendMin: { label: "« Dépenser » : au moins", min: 0, max: 100_000_000 },
  defenseCountsFactionRaids: { label: "Un raid de faction repoussé compte pour « Repousser une attaque »", hint: "Décoché : seule une attaque de joueur ou de seigneur repoussée compte (avant la 6.14.109)." },
};

/** 6.14.109 (AP-L5) : poids de tirage d'un type (réglage absent ou illisible : 1). */
export function contractWeight(type: ContractType): number {
  const w = Number((CONTRACT_RULES.weights as Partial<Record<ContractType, number>> | undefined)?.[type]);
  return Number.isFinite(w) ? Math.max(0, w) : 1;
}

/** 6.14.109 : part de chance d'un type au premier tirage d'un compte où tout est ouvert (aide de l'admin). */
export function contractDrawShare(type: ContractType): number {
  const total = ALL_TYPES.reduce((a, t) => a + contractWeight(t), 0);
  return total > 0 ? contractWeight(type) / total : 0;
}

/**
 * 6.14.109 (AP-L5) : index tiré dans `pool` (types de poids > 0). Poids tous égaux : `floor(rand() × taille)`, le tirage d'avant
 * (un seul appel à `rand`, même graine, même résultat) ; sinon tirage pondéré, un seul appel aussi.
 */
function drawIndex(pool: ContractType[], rand: () => number): number {
  const w = pool.map(contractWeight);
  if (w.every((x) => x === w[0])) return Math.floor(rand() * pool.length);
  const total = w.reduce((a, x) => a + x, 0);
  let r = rand() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r < 0) return i;
  }
  return pool.length - 1;
}

/** Types tirables : ouverts pour le joueur (I31) et de poids > 0. */
function drawableTypes(player: PlayerState, now: number): ContractType[] {
  return openContractTypes(player, now).filter((t) => contractWeight(t) > 0);
}

export const CONTRACT_LABELS: Record<ContractType, (target: number) => string> = {
  upgrade_building: (n) => `Lancer ${n} amélioration${n > 1 ? "s" : ""} de bâtiment`,
  research: (n) => `Lancer ${n} recherche${n > 1 ? "s" : ""}`,
  build_units: (n) => `Construire ${n} unités`,
  win_attack: (n) => `Gagner ${n} attaque${n > 1 ? "s" : ""}`,
  // 6.14.109 (Q87) : le libellé dit si les raids de faction comptent (lu dans la règle à l'usage).
  win_defense: (n) => `Repousser ${n} attaque${n > 1 ? "s" : ""}${CONTRACT_RULES.defenseCountsFactionRaids ? ` (joueur ou raid de faction)` : ""}`,
  missions: (n) => `Terminer ${n} missions`,
  gift: (n) => `Envoyer ${n} don${n > 1 ? "s" : ""} de ressources`,
  spend: (n) => `Dépenser ${formatInt(n)} ressources`,
  spy: (n) => `Lancer ${n} sonde${n > 1 ? "s" : ""} d'espionnage`,
  market: (n) => `Acheter ${n} offre${n > 1 ? "s" : ""} au marché`,
  gate_jump: (n) => `Ramener ${n} flotte${n > 1 ? "s" : ""} par la porte de saut`,
  colony_convoy: (n) => `Faire arriver ${n} convoi${n > 1 ? "s" : ""} de colonie`,
  expedition: (n) => `Terminer ${n} expédition${n > 1 ? "s" : ""}`,
  recycle: (n) => `Recycler ${n} champ${n > 1 ? "s" : ""} de débris`,
  unit_content: (n) => `Construire ${n} unités désignées`,
  research_content: (n) => `Lancer ${n} niveau${n > 1 ? "x" : ""} d'une recherche désignée`,
  building_content: (n) => `Lancer ${n} amélioration${n > 1 ? "s" : ""} d'un bâtiment désigné`,
};

/* ---------- 6.14.131 (AU27, AJ27-7) : objectifs paramétrés par contenu ---------- */

/** Famille du registre des actions suivies d'un type paramétré (null : type ordinaire). */
export const CONTENT_CONTRACT_FAMILY: Partial<Record<ContractType, ContentFamily>> = { unit_content: "unit", research_content: "research", building_content: "building" };

/** Textes des types paramétrés : `{n}` (quantité), `{name}` (contenu visé). */
const CONTENT_CONTRACT_TEXT: Record<ContentFamily, (n: number, name: string) => string> = {
  unit: (n, name) => `Construire ${n} × ${name}`,
  research: (n, name) => `Lancer ${n} niveau${n > 1 ? "x" : ""} de recherche : ${name}`,
  building: (n, name) => `Lancer ${n} amélioration${n > 1 ? "s" : ""} : ${name}`,
};

/** Libellé d'un objectif du jour (avec son contenu visé pour un type paramétré). */
export function contractLabel(c: Pick<Contract, "type" | "target" | "content">): string {
  const family = CONTENT_CONTRACT_FAMILY[c.type];
  if (family && c.content) return CONTENT_CONTRACT_TEXT[family](c.target, contentName(family, c.content));
  return (CONTRACT_LABELS[c.type] ?? ((n: number) => `Objectif × ${n}`))(c.target);
}

/**
 * Contenus qu'un joueur peut viser aujourd'hui (jamais un contenu verrouillé, I31) : unité débloquée (hors élite), recherche
 * ouverte sous son niveau maximal, bâtiment ouvert sous son niveau maximal. Ordre du registre en vigueur (tirage stable).
 */
export function contractContentCandidates(player: PlayerState, family: ContentFamily): string[] {
  const p = { units: player.units ?? {}, techLevels: player.techLevels ?? {}, buildings: player.buildings ?? ({} as PlayerState["buildings"]) };
  if (family === "unit") return UNITS.filter((u) => !u.elite && hasContentAccess(p, contentObjective("unit", u.id))).map((u) => u.id);
  if (family === "research") return TECHNOLOGIES.filter((t) => (Number(p.techLevels[t.id]) || 0) < t.maxLevel && hasContentAccess(p, contentObjective("research", t.id))).map((t) => t.id);
  return BUILDINGS.filter((b) => (Number(p.buildings[b.id as keyof PlayerState["buildings"]]?.level) || 0) < b.maxLevel && hasContentAccess(p, contentObjective("building", b.id))).map((b) => b.id);
}

/** Type conditionnel (proposé seulement à certains joueurs) : il ne compte pas dans le minimum de types de l'admin. */
export function conditionalContractType(type: string): boolean {
  return actionOfContract(type) !== null || type in CONTENT_CONTRACT_FAMILY;
}

/** 6.14.121 : les types du registre des actions suivies viennent après ceux d'avant (ordre de tirage d'origine inchangé). */
const ALL_TYPES: ContractType[] = ["upgrade_building", "research", "build_units", "win_attack", "win_defense", "missions", "gift", "spend", "spy", "market", "gate_jump", "colony_convoy", "expedition", "recycle", "unit_content", "research_content", "building_content"];
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
  // 6.14.121 (AP-L7) : page déclarée par le registre des actions suivies.
  gate_jump: [TRACKED_ACTIONS.gateJump.page],
  colony_convoy: [TRACKED_ACTIONS.colonyConvoy.page],
  // 6.14.131 (AJ27-7) : expédition, recyclage (pages déclarées par le registre).
  expedition: [TRACKED_ACTIONS.expedition.page],
  recycle: [TRACKED_ACTIONS.recycle.page],
};

/** Types d'objectifs que le joueur peut tirer (tous si `navUnlock.filterContracts` est à faux ou hors du menu progressif). */
export function openContractTypes(player: PlayerState, now: number): ContractType[] {
  // 6.14.121 (AP-L7) : un type du registre n'est proposé que si le joueur peut faire l'action (porte ouverte, route de colonie),
  // et que les actions 6.14.121 sont actives (`trackedActions.enabled`).
  const doable = ALL_TYPES.filter((t) => {
    // 6.14.131 (AJ27-7) : un type paramétré n'est proposé que si le joueur a un contenu ouvert à viser.
    const family = CONTENT_CONTRACT_FAMILY[t];
    if (family) return trackedActionsEnabled() && contractContentCandidates(player, family).length > 0;
    const action = actionOfContract(t);
    return !action || (trackedActionsEnabled() && actionAvailable(action as StaticObjective, player));
  });
  if (!NAV_UNLOCK_RULES.filterContracts) return doable;
  return doable.filter((t) => (CONTRACT_PAGES[t] ?? []).every((page) => navPageOpen(player, page, { now })));
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

/** Hachage déterministe (uid + jour) : mêmes contrats sur le client et le serveur.
 *  6.14.149 (AU27, AP-13) : ex-`seededRandom` de contracts.ts, renommé pour ne plus porter le nom du tirage des générateurs
 *  (`procedural.seededRandom`, autre algorithme). Même algorithme, mêmes graines : aucun tirage ne change, rien n'est stocké. */
export function dailyRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** 6.14.109 (AP-L5) : quantité demandée, lue dans `CONTRACT_RULES.targets` (avant : en dur, mêmes valeurs). */
function targetFor(type: ContractType, player: PlayerState): number {
  if (type === "spend") {
    // `spendHours` heures de production commune, au minimum `spendMin` (défaut : 1 h, 5 000).
    const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
    const perHour = ((rates.scrap ?? 0) + (rates.energy ?? 0) + (rates.nano ?? 0) + (rates.data ?? 0)) * 3600;
    const hours = Math.max(0, Number(CONTRACT_RULES.spendHours) || 0);
    return Math.max(Math.max(0, Number(CONTRACT_RULES.spendMin) || 0), Math.round((perHour * hours) / 1000) * 1000, 1);
  }
  const t = Number(CONTRACT_RULES.targets?.[type]);
  return Number.isFinite(t) && t >= 1 ? Math.floor(t) : 1;
}

function makeContract(type: ContractType, player: PlayerState, day: string, index: number, rand?: () => number): Contract {
  const c: Contract = { id: `${day}-${index}-${type}`, type, target: targetFor(type, player), progress: 0, claimed: false };
  // 6.14.131 (AJ27-7) : contenu visé, tiré parmi ceux ouverts au joueur (un appel de plus au tirage, seulement pour ce type :
  // à poids 0 par défaut, jamais tiré, la suite du tirage d'avant ne change pas).
  const family = CONTENT_CONTRACT_FAMILY[type];
  if (family && rand) {
    const list = contractContentCandidates(player, family);
    if (list.length > 0) c.content = list[Math.floor(rand() * list.length) % list.length];
  }
  return c;
}

/** Contrats du jour (générés au premier passage de la journée). */
export function ensureContracts(player: PlayerState, now: number): ContractsState {
  const day = contractDay(now);
  const current = player.contracts;
  if (current && current.day === day) {
    // 6.2 : bascule de 3 à 4 objectifs dans la journée, sans rien retirer.
    if (current.items.length < CONTRACT_RULES.perDay) {
      const used = new Set(current.items.map((c) => c.type));
      const rand = dailyRandom(`${player.uid}:${day}:extra`);
      const pool = drawableTypes(player, now).filter((t) => !used.has(t));
      while (current.items.length < CONTRACT_RULES.perDay && pool.length > 0) {
        const type = pool.splice(drawIndex(pool, rand), 1)[0];
        current.items.push(makeContract(type, player, day, current.items.length, rand));
      }
    }
    return current;
  }

  const rand = dailyRandom(`${player.uid}:${day}`);
  // I31 : un nouveau jour ne tire que parmi les systèmes ouverts (4 types toujours ouverts : le compte est plein dès J0).
  // 6.14.109 (AP-L5) : et parmi les types de poids > 0, au prorata de leur poids (poids égaux : tirage d'avant).
  const pool = drawableTypes(player, now);
  const items: Contract[] = [];
  for (let i = 0; i < CONTRACT_RULES.perDay && pool.length > 0; i++) {
    const type = pool.splice(drawIndex(pool, rand), 1)[0];
    items.push(makeContract(type, player, day, i, rand));
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
  const pool = drawableTypes(player, now).filter((t) => !used.has(t));
  if (pool.length === 0) throw new GameActionError("Aucun autre objectif n'est encore ouvert : ta relance reste disponible.");
  const rand = dailyRandom(`${player.uid}:${state.day}:reroll`);
  const type = pool[drawIndex(pool, rand)];
  const next = makeContract(type, player, state.day, index, rand);
  next.id = `${state.day}-${index}-${type}-r`;
  state.items[index] = next;
  state.rerolled = true;
  return next;
}

// 6.14.110 (AC-D) : toute dépense (`spendResources`) compte pour l'objectif du jour « Dépenser ».
onSpend((player, total, now) => recordContract(player, "spend", total, now));
// 6.14.121 (AP-L7) : une action du registre liée à un objectif du jour le fait avancer.
onTrackedAction("contracts", (player, key, now, times) => {
  const type = typeof key === "string" && key in TRACKED_ACTIONS ? TRACKED_ACTIONS[key as StaticObjective].contract : undefined;
  if (type) recordContract(player, type as ContractType, times, now);
  // 6.14.131 (AJ27-7) : objectif paramétré qui vise ce contenu (unité lancée, niveau de recherche, amélioration).
  const c = parseContentObjective(key);
  if (c && player.contracts?.day === contractDay(now)) {
    for (const item of player.contracts.items) {
      if (!item.claimed && item.content === c.id && CONTENT_CONTRACT_FAMILY[item.type] === c.family) item.progress = Math.min(item.target, item.progress + times);
    }
  }
});
