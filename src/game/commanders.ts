import { GameActionError } from "@/game/errors";
import { familyIndex, getRankIndex } from "@/game/ranks";
import { describeEffect, EFFECT_STATS, formatEffectValue, validateComposedEffect, type EffectGrant, type EffectScope, type EffectStat } from "@/game/effects";
import { validUnitSelector } from "@/game/effectTargets";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Commandants (v4.0) : cinq officiers recrutables, deux en poste (trois au
   rang Platine). Chacun progresse dans son domaine (jusqu'au niveau 20) et
   donne un bonus tant qu'il est en poste. Le premier est offert.
===================================================== */

/** Les douze rôles (domaines de bonus). Les cinq premiers se recrutent ;
 *  v5.14 : les sept suivants se débloquent au dernier palier d'un passe (commandant
 *  de saison) ou, très rarement, sur un boss. */
export type CommanderId =
  | "admiral"
  | "strategist"
  | "engineer"
  | "spy"
  | "steward"
  | "logistician"
  | "mechanic"
  | "governor"
  | "corsair"
  | "warden"
  | "diplomat"
  | "hunter";
export const RECRUITABLE_ROLES: CommanderId[] = ["admiral", "strategist", "engineer", "spy", "steward"];
export const RARE_ROLES: CommanderId[] = ["logistician", "mechanic", "governor", "corsair", "warden", "diplomat", "hunter"];
export const COMMANDER_ROLES: CommanderId[] = [...RECRUITABLE_ROLES, ...RARE_ROLES];

/** v5.13 : un officier est un des cinq de base, ou un commandant de saison (« s-AAAA-MM »). */
export type OfficerId = string;

export interface CommanderDef {
  id: OfficerId;
  name: string;
  title: string;
  portrait: string;
  /** D'où vient son expérience. */
  domain: string;
  bonus: (level: number) => string;
  /** Rôle principal (pour un officier de base : lui-même). */
  role: CommanderId;
  /** v5.14 : rôle rare, jamais recruté (palier 30 d'un passe, butin de boss). */
  rare?: boolean;
  /** v5.13 : commandant de saison — second rôle (à moitié), passe d'origine, histoire. */
  secondary?: CommanderId;
  season?: { seasonId: string; label: string };
  lore?: string;
}

const BASE_COMMANDERS: Omit<CommanderDef, "role" | "bonus">[] = [
  {
    id: "admiral",
    name: "Rhys Calder",
    title: "Amiral",
    portrait: "/assets/commanders/admiral.webp",
    domain: "Combats gagnés en attaque, repaires, primes, assauts sur les boss.",
  },
  {
    id: "strategist",
    name: "Ilsa Varga",
    title: "Stratège",
    portrait: "/assets/commanders/strategist.webp",
    domain: "Attaques et raids repoussés (un peu aussi après une défense perdue).",
  },
  {
    id: "engineer",
    name: "Noor Halim",
    title: "Ingénieure",
    portrait: "/assets/commanders/engineer.webp",
    domain: "Constructions (planète mère et colonies) et recherches terminées.",
  },
  {
    id: "spy",
    name: "Sable",
    title: "Espionne",
    portrait: "/assets/commanders/spy.webp",
    domain: "Espionnages lancés, sondes ennemies repérées.",
  },
  {
    id: "steward",
    name: "Oswin Tarr",
    title: "Intendant",
    portrait: "/assets/commanders/steward.webp",
    domain: "Missions, objectifs du jour, échanges au Comptoir et au marché.",
  },
  // v5.14 : rôles rares.
  {
    id: "logistician",
    name: "Tamsin Okoro",
    title: "Logisticienne",
    portrait: "/assets/commanders/logistician.webp",
    domain: "Flottes envoyées : transports, livraisons, colonies, champs de débris.",
    rare: true,
  },
  {
    id: "mechanic",
    name: "Brann Kessel",
    title: "Mécanicien",
    portrait: "/assets/commanders/mechanic.webp",
    domain: "Unités sorties des chantiers (planète mère et colonies) et Atelier de réparation.",
    rare: true,
  },
  {
    id: "governor",
    name: "Livia Marchetti",
    title: "Gouverneure",
    portrait: "/assets/commanders/governor.webp",
    domain: "Bâtiments terminés dans les colonies.",
    rare: true,
  },
  {
    id: "corsair",
    name: "Dax Morrow",
    title: "Corsaire",
    portrait: "/assets/commanders/corsair.webp",
    domain: "Attaques gagnées, repaires pris, primes remplies.",
    rare: true,
  },
  {
    id: "warden",
    name: "Ysolde Grey",
    title: "Gardienne",
    portrait: "/assets/commanders/warden.webp",
    domain: "Attaques et raids repoussés.",
    rare: true,
  },
  {
    id: "diplomat",
    name: "Auren Sol",
    title: "Diplomate",
    portrait: "/assets/commanders/diplomat.webp",
    domain: "Échanges au marché, contrats entre joueurs, cadeaux envoyés.",
    rare: true,
  },
  {
    id: "hunter",
    name: "Kaelen Voss",
    title: "Chasseur de colosses",
    portrait: "/assets/commanders/hunter.webp",
    domain: "Assauts sur les boss (mondiaux, de saison, d'alliance).",
    rare: true,
  },
];

// v5.14 : le texte du bonus est lu dans ROLE_EFFECTS (un réglage de l'administration s'y reflète).
export const COMMANDERS: CommanderDef[] = BASE_COMMANDERS.map((c) => ({ ...c, role: c.id as CommanderId, bonus: (l: number) => roleBonusText(c.id as CommanderId, l) }));

/** « Attaque +5 %, Production de toutes les ressources (colonies) +4 % » au niveau l. */
export function roleBonusText(role: CommanderId, l: number): string {
  const parts = (ROLE_EFFECTS[role] ?? []).map((e) => (e.target || (e.scope && e.scope !== "colonies") ? describeEffect(e.stat, e.perLevel * l, e.target, e.scope) : `${EFFECT_STATS[e.stat].label}${e.scope === "colonies" ? " (colonies)" : ""} ${formatEffectValue(e.stat, e.perLevel * l)}`));
  if (role === "spy") parts.push(`${Math.round(l * COMMANDER_RULES.anomalyPerLevel * 100)} % de flairer une anomalie chimique`);
  return parts.join(", ");
}

/* ---------- v5.13 : commandants de saison (dernier palier des passes générés) ---------- */

/** 6.9.5 (AU8) : réglages des officiers hors onglet Officiers (registre « officerTuning ») : part du second rôle d'un
 *  commandant de saison, bonus d'XP de la Phéromone de recrutement (Comptoir). */
export const OFFICER_TUNING_RULES = { seasonSecondaryShare: 0.5, pheromonePct: 0.25 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const OFFICER_TUNING_RULES_META = {
  seasonSecondaryShare: { label: "Commandant de saison : force du second rôle", unit: "part", min: 0, max: 1, hint: "Part de l'effet d'un officier ordinaire (0,5 = moitié)." },
  pheromonePct: { label: "Phéromone : XP des officiers en plus", unit: "part", min: 0, max: 2, hint: "0,25 = +25 % d'XP pendant la durée réglée au Comptoir de la Ruche." },
};

/** Ce qu'un passe de saison décrit (données enregistrées, voir passSeasons.ts). */
export interface SeasonCommanderDef {
  id: string;
  name: string;
  title: string;
  portrait: string;
  primary: CommanderId;
  secondary: CommanderId;
  lore: string;
  seasonId: string;
  seasonLabel: string;
}

export const SEASON_COMMANDERS: CommanderDef[] = [];

const ROLE_DEF = (role: CommanderId) => COMMANDERS.find((c) => c.id === role)!;
const half = (l: number) => Math.round(l * OFFICER_TUNING_RULES.seasonSecondaryShare * 10) / 10;

export function seasonCommanderDef(s: SeasonCommanderDef): CommanderDef {
  const a = ROLE_DEF(s.primary);
  const b = ROLE_DEF(s.secondary);
  return {
    id: s.id,
    name: s.name,
    title: s.title,
    portrait: s.portrait || a.portrait,
    domain: a.domain,
    role: s.primary,
    secondary: s.secondary,
    season: { seasonId: s.seasonId, label: s.seasonLabel },
    lore: s.lore,
    bonus: (l) => `${a.bonus(l)} ; ${b.bonus(half(l)).replace(/(\d)\.(\d)/g, "$1,$2")}`,
  };
}

/** Catalogue des commandants de saison publiés (appliqué avec le contenu). */
export function setSeasonCommanders(list: SeasonCommanderDef[]): void {
  SEASON_COMMANDERS.splice(0, SEASON_COMMANDERS.length, ...list.filter((s) => s.id && COMMANDER_ROLES.includes(s.primary) && COMMANDER_ROLES.includes(s.secondary)).map(seasonCommanderDef));
}

export function allCommanders(): CommanderDef[] {
  return [...COMMANDERS, ...SEASON_COMMANDERS];
}

export const isSeasonOfficer = (id: string) => /^s-/.test(id);

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
  // v5.14 : rôles rares.
  fleetDispatched: 5,
  unitsBuilt: 5,
  giftSent: 5,
  playerContract: 10,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const COMMANDER_XP_META = {
  attackWin: { label: "Attaque gagnée", unit: "XP", min: 0, max: 1000, hint: "XP d'officier gagnée par l'officier concerné à chaque action." },
  lairWin: { label: "Repaire pirate vaincu", unit: "XP", min: 0, max: 1000 },
  bountyWin: { label: "Prime remplie", unit: "XP", min: 0, max: 1000 },
  bossAssault: { label: "Assaut de boss", unit: "XP", min: 0, max: 1000 },
  defenseWin: { label: "Défense réussie", unit: "XP", min: 0, max: 1000 },
  raidRepelled: { label: "Raid repoussé", unit: "XP", min: 0, max: 1000 },
  defenseLost: { label: "Défense perdue", unit: "XP", min: 0, max: 1000 },
  buildingDone: { label: "Bâtiment terminé", unit: "XP", min: 0, max: 1000 },
  researchDone: { label: "Recherche terminée", unit: "XP", min: 0, max: 1000 },
  spyLaunched: { label: "Espionnage lancé", unit: "XP", min: 0, max: 1000 },
  probesCaught: { label: "Sondes ennemies abattues", unit: "XP", min: 0, max: 1000 },
  missionDone: { label: "Mission terminée", unit: "XP", min: 0, max: 1000 },
  contractClaimed: { label: "Objectif du jour réclamé", unit: "XP", min: 0, max: 1000 },
  marketTrade: { label: "Échange au marché", unit: "XP", min: 0, max: 1000 },
  fleetDispatched: { label: "Flotte envoyée", unit: "XP", min: 0, max: 1000 },
  unitsBuilt: { label: "Unités produites (par tranche de 10)", unit: "XP", min: 0, max: 1000 },
  giftSent: { label: "Cadeau envoyé", unit: "XP", min: 0, max: 1000 },
  playerContract: { label: "Contrat de livraison rempli", unit: "XP", min: 0, max: 1000 },
};

/** v5.6 : ce qui fait progresser chaque officier (affiché sur sa fiche). */
export const COMMANDER_SOURCES: Record<CommanderId, { label: string; xp: number }[]> = {
  admiral: [
    { label: "Attaque gagnée", xp: COMMANDER_XP.attackWin },
    { label: "Repaire pris", xp: COMMANDER_XP.lairWin },
    { label: "Prime Kesh'Vaar remplie", xp: COMMANDER_XP.bountyWin },
    { label: "Assaut sur un boss", xp: COMMANDER_XP.bossAssault },
  ],
  strategist: [
    { label: "Attaque repoussée", xp: COMMANDER_XP.defenseWin },
    { label: "Raid de faction repoussé", xp: COMMANDER_XP.raidRepelled },
    { label: "Attaque ou raid subi et perdu", xp: COMMANDER_XP.defenseLost },
  ],
  engineer: [
    { label: "Bâtiment terminé (planète mère ou colonie)", xp: COMMANDER_XP.buildingDone },
    { label: "Recherche terminée", xp: COMMANDER_XP.researchDone },
  ],
  spy: [
    { label: "Espionnage lancé", xp: COMMANDER_XP.spyLaunched },
    { label: "Sondes ennemies repérées", xp: COMMANDER_XP.probesCaught },
  ],
  steward: [
    { label: "Mission terminée", xp: COMMANDER_XP.missionDone },
    { label: "Contrat du jour récupéré", xp: COMMANDER_XP.contractClaimed },
    { label: "Échange au Comptoir ou au marché", xp: COMMANDER_XP.marketTrade },
  ],
  logistician: [{ label: "Flotte envoyée (transport, livraison, colonie, débris)", xp: COMMANDER_XP.fleetDispatched }],
  mechanic: [{ label: "Lot d'unités terminé", xp: COMMANDER_XP.unitsBuilt }],
  governor: [{ label: "Bâtiment terminé dans une colonie", xp: COMMANDER_XP.buildingDone }],
  corsair: [
    { label: "Attaque gagnée", xp: COMMANDER_XP.attackWin },
    { label: "Repaire pris", xp: COMMANDER_XP.lairWin },
    { label: "Prime Kesh'Vaar remplie", xp: COMMANDER_XP.bountyWin },
  ],
  warden: [
    { label: "Attaque repoussée", xp: COMMANDER_XP.defenseWin },
    { label: "Raid de faction repoussé", xp: COMMANDER_XP.raidRepelled },
  ],
  diplomat: [
    { label: "Échange au marché", xp: COMMANDER_XP.marketTrade },
    { label: "Contrat entre joueurs honoré", xp: COMMANDER_XP.playerContract },
    { label: "Cadeau envoyé", xp: COMMANDER_XP.giftSent },
  ],
  hunter: [{ label: "Assaut sur un boss", xp: COMMANDER_XP.bossAssault }],
};

export interface CommanderState {
  xp: number;
}

export interface CommandersState {
  roster: Record<OfficerId, CommanderState>;
  active: OfficerId[];
  /** Dernier changement de poste, par officier. */
  movedAtMs: Record<OfficerId, number>;
  dossiers: number;
}

export function findCommander(id: unknown): CommanderDef | undefined {
  return COMMANDERS.find((c) => c.id === id) ?? SEASON_COMMANDERS.find((c) => c.id === id);
}

export function commandersState(player: Pick<PlayerState, "commanders">): CommandersState {
  const raw = (player.commanders ?? {}) as Partial<CommandersState>;
  const roster: CommandersState["roster"] = {};
  for (const [id, r] of Object.entries(raw.roster ?? {})) {
    // Un commandant de saison est gardé même si son passe n'est plus au catalogue (il revient avec lui).
    if (r && (findCommander(id) || isSeasonOfficer(id))) roster[id] = { xp: Math.max(0, Number(r.xp) || 0) };
  }
  const active = (Array.isArray(raw.active) ? raw.active : []).map(String).filter((id, i, a) => !!roster[id] && a.indexOf(id) === i);
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

/** Niveaux cumulés par rôle des officiers en poste (0 si absent).
 *  v5.13 : un commandant de saison compte pour son rôle principal, et à moitié pour le second. */
export function activeLevels(player: Pick<PlayerState, "commanders">): Record<CommanderId, number> {
  const st = commandersState(player);
  const out = Object.fromEntries(COMMANDER_ROLES.map((r) => [r, 0])) as Record<CommanderId, number>;
  for (const id of st.active) {
    const def = findCommander(id);
    if (!def) continue;
    const level = commanderLevel(st.roster[id]?.xp ?? 0);
    out[def.role] += level;
    if (def.secondary) out[def.secondary] += level * OFFICER_TUNING_RULES.seasonSecondaryShare;
  }
  return out;
}

/** v5.14 : effets de chaque rôle, par niveau (circuit d'effets, couche empire). */
export interface RoleEffect {
  stat: EffectStat;
  perLevel: number;
  target?: string;
  scope?: EffectScope;
}

export const ROLE_EFFECTS: Record<CommanderId, RoleEffect[]> = {
  admiral: [{ stat: "attack", perLevel: 0.01 }],
  strategist: [{ stat: "defense", perLevel: 0.01 }],
  engineer: [
    { stat: "buildTime", perLevel: 0.01 },
    { stat: "researchTime", perLevel: 0.01 },
  ],
  spy: [
    { stat: "spyLevel", perLevel: 0.2 },
    { stat: "detection", perLevel: 0.01 },
  ],
  steward: [
    { stat: "productionAll", perLevel: 0.01 },
    { stat: "storage", perLevel: 0.02 },
  ],
  logistician: [
    { stat: "fleetSpeed", perLevel: 0.01 },
    { stat: "cargo", perLevel: 0.01 },
  ],
  mechanic: [
    { stat: "repair", perLevel: 0.01 },
    { stat: "unitTime", perLevel: 0.01 },
    // 5.21 : le Mécanicien fait aussi tourner l'Atelier plus vite.
    { stat: "repairSpeed", perLevel: 0.03 },
  ],
  governor: [
    { stat: "productionAll", perLevel: 0.02, scope: "colonies" },
    { stat: "storage", perLevel: 0.02, scope: "colonies" },
  ],
  corsair: [{ stat: "loot", perLevel: 0.01 }],
  warden: [
    { stat: "protectedStorage", perLevel: 0.01 },
    { stat: "counterSpy", perLevel: 0.2 },
  ],
  diplomat: [{ stat: "tradeTax", perLevel: 0.02 }],
  hunter: [{ stat: "bossDamage", perLevel: 0.015 }],
};

/** v5.14 : effets des officiers en poste, un par officier et par effet de rôle
 *  (le second rôle d'un commandant de saison compte à OFFICER_TUNING_RULES.seasonSecondaryShare). */
export function commanderEffects(player: Pick<PlayerState, "commanders">): EffectGrant[] {
  const st = commandersState(player);
  const out: EffectGrant[] = [];
  for (const id of st.active) {
    const def = findCommander(id);
    if (!def) continue;
    const level = commanderLevel(st.roster[id]?.xp ?? 0);
    const source = { kind: "officer" as const, id: def.id, label: def.name };
    const roles: [CommanderId, number][] = [[def.role, level]];
    if (def.secondary) roles.push([def.secondary, level * OFFICER_TUNING_RULES.seasonSecondaryShare]);
    for (const [role, lv] of roles) for (const e of ROLE_EFFECTS[role] ?? []) out.push({ stat: e.stat, target: e.target, value: lv * e.perLevel, layer: "empire", scope: e.scope, source });
  }
  return out;
}

/** XP gagnée par les officiers en poste de ce rôle (de base ou de saison). Modifie le joueur. */

export function grantCommanderXp(player: PlayerState, role: CommanderId, amount: number): void {
  if (!(amount > 0)) return;
  // 5.26.3 : Phéromone de recrutement (Comptoir) : bonus d'XP tant qu'elle dure. Le joueur est
  // rattrapé avant chaque action : resourcesUpdatedAtMs vaut l'instant présent.
  const pheromone = Number((player.bounties as { pheromoneUntilMs?: number } | undefined)?.pheromoneUntilMs) || 0;
  if (pheromone > (player.resourcesUpdatedAtMs ?? 0)) amount = Math.round(amount * (1 + OFFICER_TUNING_RULES.pheromonePct));
  const st = commandersState(player);
  const ids = st.active.filter((id) => findCommander(id)?.role === role && st.roster[id]);
  if (ids.length === 0) return;
  for (const id of ids) st.roster[id] = { xp: (st.roster[id]?.xp ?? 0) + amount };
  player.commanders = st;
}

/** v5.13 : commandant de saison débloqué (dernier palier du passe). Faux s'il sert déjà. */
export function unlockSeasonCommander(player: PlayerState, id: string): boolean {
  const def = findCommander(id);
  if (!def?.season) return false;
  const st = commandersState(player);
  if (st.roster[id]) return false;
  st.roster[id] = { xp: 0 };
  if (st.active.length < commanderSlots(player)) st.active.push(id);
  player.commanders = st;
  return true;
}

/* ---------- v5.14 : officier rare trouvé sur un boss ---------- */

export const RARE_OFFICER_RULES = {
  /** Chance par participant à un boss abattu. */
  participant: 0.002,
  /** Chance pour les trois premiers en dégâts. */
  podium: 0.005,
};

/** Officiers rares que le joueur n'a pas encore. */
export function missingRareOfficers(player: Pick<PlayerState, "commanders">): CommanderDef[] {
  const st = commandersState(player);
  return COMMANDERS.filter((c) => c.rare && !st.roster[c.id]);
}

/** Tirage d'un officier rare (butin de boss). Rend l'officier débloqué, ou null. */
export function rollRareOfficer(player: PlayerState, chance: number, random: () => number = Math.random): CommanderDef | null {
  const pool = missingRareOfficers(player);
  if (pool.length === 0 || !(random() < chance)) return null;
  const def = pool[Math.floor(random() * pool.length) % pool.length];
  const st = commandersState(player);
  st.roster[def.id] = { xp: 0 };
  if (st.active.length < commanderSlots(player)) st.active.push(def.id);
  player.commanders = st;
  return def;
}

/** Recrutement : le premier est offert, les suivants coûtent de l'Ambre ou de la production. */
export function recruitCost(player: Pick<PlayerState, "commanders">): "free" | "paid" {
  return Object.keys(commandersState(player).roster).length === 0 ? "free" : "paid";
}

export function recruitCommander(player: PlayerState, id: unknown, pay: (method: "amber" | "production") => void, method: "amber" | "production"): CommanderDef {
  const def = findCommander(id);
  if (!def) throw new GameActionError("Officier inconnu.");
  if (def.season) throw new GameActionError(`${def.title} ${def.name} se gagne au dernier palier du passe de ${def.season.label}.`);
  if (def.rare) throw new GameActionError(`${def.title} ${def.name} ne se recrute pas : son rôle se débloque au dernier palier d'un passe, ou très rarement sur un boss.`);
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
  const ids = (Array.isArray(idsIn) ? idsIn : []).map(String).filter((id, i, a) => a.indexOf(id) === i);
  if (ids.length > commanderSlots(player)) throw new GameActionError(`${commanderSlots(player)} postes au plus.`);
  for (const id of ids) if (!st.roster[id]) throw new GameActionError("Cet officier n'est pas recruté.");
  const changed = [...ids.filter((id) => !st.active.includes(id)), ...st.active.filter((id) => !ids.includes(id))];
  // v5.5 : aucun délai sur un compte test.
  const cooldown = player.testMode ? 0 : COMMANDER_RULES.swapCooldownHours * 3600_000;
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

/* =====================================================
   v5.14 : réglages des officiers (section de contenu « officers ») :
   noms et titres, effets par niveau de chaque rôle, règles de recrutement
   et chances de trouver un officier rare sur un boss.
===================================================== */

export interface OfficerRoleOverride {
  name?: string;
  title?: string;
  /** Valeur par niveau de chaque effet du rôle, dans l'ordre de ROLE_EFFECTS. */
  perLevel?: number[];
  /** 5.23 : effets composés ajoutés au rôle (grandeur × cible × portée, valeur par niveau). */
  extra?: RoleEffect[];
}

export interface OfficersConfig {
  roles?: Partial<Record<CommanderId, OfficerRoleOverride>>;
  rules?: Partial<Pick<typeof COMMANDER_RULES, "slots" | "recruitAmber" | "recruitProductionHours" | "swapCooldownHours" | "dossierXp" | "anomalyPerLevel">>;
  rareDrop?: Partial<typeof RARE_OFFICER_RULES>;
}

export const OFFICER_RULE_KEYS = ["slots", "recruitAmber", "recruitProductionHours", "swapCooldownHours", "dossierXp", "anomalyPerLevel"] as const;

const DEFAULT_ROLE_EFFECTS: Record<CommanderId, RoleEffect[]> = JSON.parse(JSON.stringify(ROLE_EFFECTS));
const DEFAULT_COMMANDER_RULES = { ...COMMANDER_RULES };
const DEFAULT_RARE_OFFICER_RULES = { ...RARE_OFFICER_RULES };
const DEFAULT_NAMES = Object.fromEntries(COMMANDERS.map((c) => [c.id, { name: c.name, title: c.title }])) as Record<string, { name: string; title: string }>;

export function defaultOfficersConfig(): OfficersConfig {
  return {};
}

/** Effets par défaut d'un rôle (affichage de l'administration). */
export function defaultRoleEffects(role: CommanderId): RoleEffect[] {
  return DEFAULT_ROLE_EFFECTS[role] ?? [];
}

export function setOfficers(cfg: OfficersConfig | undefined): void {
  for (const role of COMMANDER_ROLES) {
    const o = cfg?.roles?.[role];
    ROLE_EFFECTS[role] = [
      ...DEFAULT_ROLE_EFFECTS[role].map((e, i) => {
        const v = Number(o?.perLevel?.[i]);
        return { ...e, perLevel: Number.isFinite(v) && v >= 0 ? v : e.perLevel };
      }),
      ...(o?.extra ?? []).filter((e) => e && e.stat in EFFECT_STATS && Number.isFinite(e.perLevel) && e.perLevel > 0),
    ];
    const def = COMMANDERS.find((c) => c.id === role);
    if (def) {
      def.name = o?.name?.trim() || DEFAULT_NAMES[role].name;
      def.title = o?.title?.trim() || DEFAULT_NAMES[role].title;
    }
  }
  Object.assign(COMMANDER_RULES, DEFAULT_COMMANDER_RULES);
  for (const k of OFFICER_RULE_KEYS) {
    const v = Number(cfg?.rules?.[k]);
    if (cfg?.rules?.[k] !== undefined && Number.isFinite(v)) (COMMANDER_RULES as Record<string, unknown>)[k] = v;
  }
  Object.assign(RARE_OFFICER_RULES, DEFAULT_RARE_OFFICER_RULES, cfg?.rareDrop ?? {});
}

export function validateOfficers(cfg: OfficersConfig | undefined): string[] {
  const errors: string[] = [];
  if (!cfg) return errors;
  for (const [role, o] of Object.entries(cfg.roles ?? {})) {
    if (!COMMANDER_ROLES.includes(role as CommanderId)) {
      errors.push(`Officiers : rôle « ${role} » inconnu.`);
      continue;
    }
    for (const v of o?.perLevel ?? []) if (!(typeof v === "number" && v >= 0 && v <= 1)) errors.push(`Officiers, ${DEFAULT_NAMES[role].title} : valeur par niveau entre 0 et 1 (0,01 = 1 %).`);
    for (const e of o?.extra ?? []) {
      for (const m of validateComposedEffect(e, validUnitSelector)) errors.push(`Officiers, ${DEFAULT_NAMES[role].title} : ${m}.`);
      if (!(typeof e?.perLevel === "number" && e.perLevel > 0 && e.perLevel <= 1)) errors.push(`Officiers, ${DEFAULT_NAMES[role].title} : effet ajouté, valeur par niveau entre 0 et 1.`);
    }
  }
  const r = cfg.rules ?? {};
  const int = (v: unknown, min: number) => v === undefined || (Number.isInteger(v) && (v as number) >= min);
  if (!int(r.slots, 1)) errors.push("Officiers : postes ≥ 1.");
  if (!int(r.recruitAmber, 0)) errors.push("Officiers : coût en Ambre entier ≥ 0.");
  if (r.recruitProductionHours !== undefined && !(r.recruitProductionHours >= 0)) errors.push("Officiers : heures de production ≥ 0.");
  if (r.swapCooldownHours !== undefined && !(r.swapCooldownHours >= 0)) errors.push("Officiers : délai de changement de poste ≥ 0.");
  if (!int(r.dossierXp, 1)) errors.push("Officiers : XP d'un dossier entière ≥ 1.");
  for (const k of ["participant", "podium"] as const) {
    const v = cfg.rareDrop?.[k];
    if (v !== undefined && !(v >= 0 && v <= 0.2)) errors.push("Officiers rares : chance sur un boss entre 0 et 0,2 (20 %).");
  }
  return errors;
}

/** v5.14 : officier offert par l'équipe (rare ou de saison compris). Faux s'il sert déjà. */
export function adminGrantOfficer(player: PlayerState, id: string): CommanderDef {
  const def = findCommander(id);
  if (!def) throw new GameActionError("Officier inconnu.");
  const st = commandersState(player);
  if (st.roster[def.id]) throw new GameActionError(`${def.title} ${def.name} sert déjà dans cet état-major.`);
  st.roster[def.id] = { xp: 0 };
  if (st.active.length < commanderSlots(player)) st.active.push(def.id);
  player.commanders = st;
  return def;
}
