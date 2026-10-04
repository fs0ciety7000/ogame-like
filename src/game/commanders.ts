import { GameActionError } from "@/game/errors";
import { familyIndex, getRankIndex } from "@/game/ranks";
import type { EffectGrant, EffectScope, EffectStat } from "@/game/effects";
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

const BASE_COMMANDERS: Omit<CommanderDef, "role">[] = [
  {
    id: "admiral",
    name: "Rhys Calder",
    title: "Amiral",
    portrait: "/assets/commanders/admiral.webp",
    domain: "Combats gagnés en attaque, repaires, primes, assauts sur les boss.",
    bonus: (l) => `+${l} % d'attaque de la flotte`,
  },
  {
    id: "strategist",
    name: "Ilsa Varga",
    title: "Stratège",
    portrait: "/assets/commanders/strategist.webp",
    domain: "Attaques et raids repoussés (un peu aussi après une défense perdue).",
    bonus: (l) => `+${l} % de défense de la base`,
  },
  {
    id: "engineer",
    name: "Noor Halim",
    title: "Ingénieure",
    portrait: "/assets/commanders/engineer.webp",
    domain: "Constructions (planète mère et colonies) et recherches terminées.",
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
    domain: "Missions, contrats du jour, échanges au Comptoir et au marché.",
    bonus: (l) => `+${l} % de production, +${l * 2} % d'entrepôt`,
  },
  // v5.14 : rôles rares.
  {
    id: "logistician",
    name: "Tamsin Okoro",
    title: "Logisticienne",
    portrait: "/assets/commanders/logistician.webp",
    domain: "Flottes envoyées : transports, livraisons, colonies, champs de débris.",
    bonus: (l) => `−${l} % de temps de vol, +${l} % de soute`,
    rare: true,
  },
  {
    id: "mechanic",
    name: "Brann Kessel",
    title: "Mécanicien",
    portrait: "/assets/commanders/mechanic.webp",
    domain: "Unités sorties des chantiers (planète mère et colonies).",
    bonus: (l) => `+${l} % de vaisseaux réparés, −${l} % de temps de production des unités`,
    rare: true,
  },
  {
    id: "governor",
    name: "Livia Marchetti",
    title: "Gouverneure",
    portrait: "/assets/commanders/governor.webp",
    domain: "Bâtiments terminés dans les colonies.",
    bonus: (l) => `+${l * 2} % de production et +${l * 2} % d'entrepôt dans les colonies`,
    rare: true,
  },
  {
    id: "corsair",
    name: "Dax Morrow",
    title: "Corsaire",
    portrait: "/assets/commanders/corsair.webp",
    domain: "Attaques gagnées, repaires pris, primes remplies.",
    bonus: (l) => `+${l} % de butin pillé`,
    rare: true,
  },
  {
    id: "warden",
    name: "Ysolde Grey",
    title: "Gardienne",
    portrait: "/assets/commanders/warden.webp",
    domain: "Attaques et raids repoussés.",
    bonus: (l) => `+${l} % d'entrepôt à l'abri du pillage, +${Math.floor(l * 0.2)} point${l >= 10 ? "s" : ""} de contre-espionnage`,
    rare: true,
  },
  {
    id: "diplomat",
    name: "Auren Sol",
    title: "Diplomate",
    portrait: "/assets/commanders/diplomat.webp",
    domain: "Échanges au marché, contrats entre joueurs, cadeaux envoyés.",
    bonus: (l) => `−${l * 2} % de taxe sur le marché et les cadeaux`,
    rare: true,
  },
  {
    id: "hunter",
    name: "Kaelen Voss",
    title: "Chasseur de colosses",
    portrait: "/assets/commanders/hunter.webp",
    domain: "Assauts sur les boss (mondiaux, de saison, d'alliance).",
    bonus: (l) => `+${(l * 1.5).toFixed(1).replace(".", ",").replace(",0", "")} % de dégâts contre les boss`,
    rare: true,
  },
];

export const COMMANDERS: CommanderDef[] = BASE_COMMANDERS.map((c) => ({ ...c, role: c.id as CommanderId }));

/* ---------- v5.13 : commandants de saison (dernier palier des passes générés) ---------- */

/** Part du bonus du second rôle d'un commandant de saison. */
export const SEASON_SECONDARY_SHARE = 0.5;

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
const half = (l: number) => Math.round(l * SEASON_SECONDARY_SHARE * 10) / 10;

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
    if (def.secondary) out[def.secondary] += level * SEASON_SECONDARY_SHARE;
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
 *  (le second rôle d'un commandant de saison compte à SEASON_SECONDARY_SHARE). */
export function commanderEffects(player: Pick<PlayerState, "commanders">): EffectGrant[] {
  const st = commandersState(player);
  const out: EffectGrant[] = [];
  for (const id of st.active) {
    const def = findCommander(id);
    if (!def) continue;
    const level = commanderLevel(st.roster[id]?.xp ?? 0);
    const source = { kind: "officer" as const, id: def.id, label: def.name };
    const roles: [CommanderId, number][] = [[def.role, level]];
    if (def.secondary) roles.push([def.secondary, level * SEASON_SECONDARY_SHARE]);
    for (const [role, lv] of roles) for (const e of ROLE_EFFECTS[role] ?? []) out.push({ stat: e.stat, target: e.target, value: lv * e.perLevel, layer: "empire", scope: e.scope, source });
  }
  return out;
}

/** XP gagnée par les officiers en poste de ce rôle (de base ou de saison). Modifie le joueur. */
export function grantCommanderXp(player: PlayerState, role: CommanderId, amount: number): void {
  if (!(amount > 0)) return;
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
