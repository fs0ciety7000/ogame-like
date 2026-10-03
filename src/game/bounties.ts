import { allianceSiegeFactor } from "@/game/alliances";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { addDossiers, COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import { addPassPoints } from "@/game/seasonPass";
import { getRepairPercent, withMissingBuildings } from "@/game/buildings";
import { computeFleetPower, computeFullPower, pveAttackFactor, resolveCombat, type CombatResult } from "@/game/combat";
import { contractDay, seededRandom } from "@/game/contracts";
import { KESH_BOOST_PCT } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { flushState, type NewNotification } from "@/game/flush";
import { formatInt } from "@/game/format";
import { formationEffects } from "@/game/formations";
import { RESOURCE_LIST } from "@/game/resources";
import { applyXpDelta } from "@/game/seasons";
import { bumpStat } from "@/game/stats";
import { KESH_HUNTER_UNIT, OFFENSIVE_UNITS } from "@/game/units";
import type { BattleReport, PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   Chasseurs de primes (v3.9) : les Kesh'Vaar, essaim insectoïde allié,
   paient en Ambre de Ruche la capture des fugitifs qui ont pillé leur
   Ruche-Mère. Tableau de 3 contrats renouvelé toutes les 8 h, 4 primes
   par jour, réputation en 5 rangs, Comptoir de la Ruche, et une proie
   d'élite chaque semaine pour tout le serveur.
   L'Ambre ne s'échange pas entre joueurs.
===================================================== */

export type BountyTier = 1 | 2 | 3 | 4;

export const BOUNTY_RULES = {
  dailyLimit: 4,
  refreshHours: 8,
  /** Un échec laisse la prime ouverte une fois de plus. */
  retries: 1,
  /** +10 % d'Ambre par rang au-delà du premier. */
  amberPerRank: 0.1,
  tiers: {
    1: { label: "Traque", pct: 0.5, minMinutes: 20, maxMinutes: 40, xp: 60, amber: 10, rep: 1, floor: 200, minRank: 1 },
    2: { label: "Chasse", pct: 0.8, minMinutes: 40, maxMinutes: 60, xp: 120, amber: 25, rep: 2, floor: 500, minRank: 1 },
    3: { label: "Proie majeure", pct: 1.1, minMinutes: 60, maxMinutes: 90, xp: 250, amber: 60, rep: 4, floor: 1200, minRank: 3 },
    4: { label: "Élite", pct: 1.25, minMinutes: 75, maxMinutes: 90, xp: 400, amber: 120, rep: 6, floor: 3000, minRank: 5 },
  } as Record<BountyTier, { label: string; pct: number; minMinutes: number; maxMinutes: number; xp: number; amber: number; rep: number; floor: number; minRank: number }>,
  ranks: [
    { name: "Larve", at: 0 },
    { name: "Éclaireur", at: 10 },
    { name: "Traqueur", at: 30 },
    { name: "Lame de l'Essaim", at: 70 },
    { name: "Main de la Reine", at: 150 },
  ],
  exchange: { rarePerAmber: 40, weeklyCap: 100 },
};

export const KESH = {
  name: "Kesh'Vaar",
  full: "L'Essaim de la Traque",
  leader: "Vashka, Matriarche-Chasseuse",
  currency: "Ambre de Ruche",
  art: "/assets/bounties/vashka.webp",
  hunters: "/assets/bounties/hunters.webp",
  banner: "/assets/bounties/banner.webp",
  emblem: "/assets/bounties/emblem.webp",
  amberIcon: "/assets/bounties/amber.webp",
  story:
    "Il y a trois cycles, les pirates de la Confrérie et les traqueurs du Syndicat Gravhorn ont pillé la Ruche-Mère de Kesh. La Reine est tombée, ses œufs ont été vendus aux quatre coins du secteur.\n\n" +
    "Les survivants ont prêté le Serment de la Traque : chaque coupable sera retrouvé. Mais l'Essaim est trop affaibli pour chasser seul. Il engage les commandants humains et les paie en Ambre de Ruche, la résine sacrée qui ne se fabrique ni ne s'achète.\n\n" +
    "Vashka, Matriarche-Chasseuse, tient le tableau des primes. Plus tu rapportes de proies, plus l'Essaim t'élève dans sa hiérarchie.",
};

/* ---------- fugitifs ---------- */

export interface Fugitive {
  name: string;
  factionId: string;
  crime: string;
}

export const FUGITIVES: Fugitive[] = [
  { name: "Korr le Rouilleux", factionId: "varan", crime: "a vendu les coordonnées de la Ruche-Mère à la Confrérie" },
  { name: "Mira Tessane", factionId: "varan", crime: "a tracé la route du pillage à travers les nébuleuses" },
  { name: "Le Borgne Halvik", factionId: "varan", crime: "a revendu trois œufs royaux à des collectionneurs" },
  { name: "Drest Oumane", factionId: "varan", crime: "a ouvert le feu sur les nourrices de la Ruche" },
  { name: "Vrask Deux-Cornes", factionId: "gravhorn", crime: "expose des larves comme trophées de chasse" },
  { name: "Ulla la Muette", factionId: "gravhorn", crime: "a piégé l'escorte de la Reine" },
  { name: "Thokk Sang-Gris", factionId: "gravhorn", crime: "a brisé les sceaux d'ambre du sanctuaire" },
  { name: "Brenna Kesh-Tueuse", factionId: "gravhorn", crime: "porte un collier d'antennes kesh'vaar" },
  { name: "Frère Anselme Dor", factionId: "inquisition", crime: "a brûlé les archives chantées de la Ruche" },
  { name: "Sœur Ilvane", factionId: "inquisition", crime: "dissèque des œufs pour l'Aube Blanche" },
  { name: "Le Diacre Morrow", factionId: "inquisition", crime: "a déclaré l'Essaim « hérésie vivante »" },
  { name: "Inquisitrice Talas", factionId: "inquisition", crime: "a scellé une couvée dans un reliquaire" },
  { name: "Rico Vant", factionId: "cartel", crime: "vend des œufs au marché noir de Néon" },
  { name: "Lady Sabre", factionId: "cartel", crime: "a fait fondre de l'Ambre sacrée en bijoux" },
  { name: "Doc Ferro", factionId: "cartel", crime: "distille un stimulant à partir de gelée royale" },
  { name: "Les Jumeaux Kalis", factionId: "cartel", crime: "blanchissent les gains du pillage" },
  { name: "Grenn Croc-Noir", factionId: "meute", crime: "collectionne les mandibules des guerrières" },
  { name: "Skarra", factionId: "meute", crime: "a dévoré un nid entier d'éclaireurs" },
  { name: "Vieux Loup Odrik", factionId: "meute", crime: "a guidé la Meute jusqu'aux couvoirs" },
  { name: "Fenra Œil-Rouge", factionId: "meute", crime: "chasse les ouvrières pour le sport" },
  { name: "L'Écho Vashtar", factionId: "choeur", crime: "a réduit au silence le chant de la Reine" },
  { name: "Maître-Chantre Ilos", factionId: "choeur", crime: "garde un œuf royal dans sa cathédrale" },
];

export const ELITE_FUGITIVES: Fugitive[] = [
  { name: "Sarghul Vex, le Marchand d'Œufs", factionId: "cartel", crime: "a vendu la couvée royale au plus offrant" },
  { name: "Kaïra Voss, la Briseuse de Ruche", factionId: "varan", crime: "a commandé l'assaut sur la Ruche-Mère" },
  { name: "L'Archiviste Pâle", factionId: "inquisition", crime: "détient le dernier œuf de la Reine" },
  { name: "Moloch-7", factionId: "meute", crime: "a dévoré trois nids en une nuit" },
  { name: "Capitaine Draven Hale", factionId: "gravhorn", crime: "a escorté la cargaison volée hors du secteur" },
  { name: "La Veuve d'Ambre", factionId: "choeur", crime: "fait commerce d'Ambre sacrée volée" },
];

/* ---------- état du joueur ---------- */

export interface BountyContract {
  id: string;
  tier: BountyTier;
  fugitive: number;
  minutes: number;
  status: "open" | "hunting";
  tries: number;
}

export interface BountyState {
  amber: number;
  amberEarned: number;
  reputation: number;
  board: BountyContract[];
  /** Créneau de 8 h du tableau actuel. */
  slot: number;
  day: string;
  doneToday: number;
  completed: number;
  failed: number;
  /** Échange contre des ressources rares (plafond hebdomadaire). */
  exchangeWeek: string;
  exchanged: number;
  /** Objets du Comptoir. */
  boostUntilMs: number;
  jammers: number;
  beacons: number;
  shieldUntilMs: number;
  shieldBoughtAtMs: number;
  /** Plan, titre, cadre, emblème, emojis. */
  owned: string[];
}

export function emptyBountyState(): BountyState {
  return {
    amber: 0,
    amberEarned: 0,
    reputation: 0,
    board: [],
    slot: -1,
    day: "",
    doneToday: 0,
    completed: 0,
    failed: 0,
    exchangeWeek: "",
    exchanged: 0,
    boostUntilMs: 0,
    jammers: 0,
    beacons: 0,
    shieldUntilMs: 0,
    shieldBoughtAtMs: 0,
    owned: [],
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function bountyState(player: Pick<PlayerState, "bounties">): BountyState {
  const raw = (player.bounties ?? {}) as Partial<BountyState>;
  const base = emptyBountyState();
  return {
    ...base,
    ...raw,
    amber: Math.max(0, num(raw.amber)),
    amberEarned: num(raw.amberEarned),
    reputation: num(raw.reputation),
    board: Array.isArray(raw.board) ? raw.board.filter((c) => c && BOUNTY_RULES.tiers[c.tier as BountyTier]) : [],
    slot: raw.slot === undefined ? -1 : num(raw.slot),
    doneToday: num(raw.doneToday),
    owned: Array.isArray(raw.owned) ? raw.owned.map(String) : [],
  };
}

/* ---------- réputation ---------- */

/** Rang (1 à 5) pour une réputation donnée. */
export function bountyRank(reputation: number): number {
  let rank = 1;
  BOUNTY_RULES.ranks.forEach((r, i) => {
    if (reputation >= r.at) rank = i + 1;
  });
  return rank;
}

export function rankName(rank: number): string {
  return BOUNTY_RULES.ranks[Math.max(0, Math.min(BOUNTY_RULES.ranks.length - 1, rank - 1))].name;
}

/** Progression vers le rang suivant (null au rang maximal). */
export function nextRank(reputation: number): { name: string; at: number; progress: number } | null {
  const rank = bountyRank(reputation);
  const next = BOUNTY_RULES.ranks[rank];
  if (!next) return null;
  const from = BOUNTY_RULES.ranks[rank - 1].at;
  return { name: next.name, at: next.at, progress: Math.min(1, (reputation - from) / Math.max(1, next.at - from)) };
}

export function amberFor(tier: BountyTier, rank: number): number {
  return Math.round(BOUNTY_RULES.tiers[tier].amber * (1 + BOUNTY_RULES.amberPerRank * (rank - 1)));
}

/* ---------- tableau des contrats ---------- */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function boardSlot(now: number): number {
  return Math.floor(now / (BOUNTY_RULES.refreshHours * HOUR));
}

export function nextRefreshMs(now: number): number {
  return (boardSlot(now) + 1) * BOUNTY_RULES.refreshHours * HOUR;
}

/** Niveaux proposés selon le rang : 3 contrats, un 4e (élite) au rang 5. */
export function boardTiers(rank: number): BountyTier[] {
  if (rank >= BOUNTY_RULES.tiers[4].minRank) return [1, 2, 3, 4];
  if (rank >= BOUNTY_RULES.tiers[3].minRank) return [1, 2, 3];
  return [1, 2, 2];
}

/** Contrats d'un créneau : mêmes tirages côté client et serveur. */
export function generateBoard(uid: string, slot: number, rank: number, exclude: number[] = []): BountyContract[] {
  const rand = seededRandom(`${uid}:bounty:${slot}`);
  const used = new Set(exclude);
  return boardTiers(rank).map((tier, i) => {
    let fugitive = Math.floor(rand() * FUGITIVES.length);
    for (let guard = 0; used.has(fugitive) && guard < FUGITIVES.length; guard++) fugitive = (fugitive + 1) % FUGITIVES.length;
    used.add(fugitive);
    const t = BOUNTY_RULES.tiers[tier];
    const minutes = t.minMinutes + Math.round(rand() * (t.maxMinutes - t.minMinutes));
    return { id: `${slot}-${i}`, tier, fugitive, minutes, status: "open" as const, tries: 0 };
  });
}

/** Renouvelle le tableau (nouveau créneau) et le compteur du jour. Les
 *  contrats en cours de traque sont conservés. Modifie `st`. */
export function refreshBounties(st: BountyState, uid: string, now: number): BountyState {
  const day = contractDay(now);
  if (st.day !== day) {
    st.day = day;
    st.doneToday = 0;
  }
  const slot = boardSlot(now);
  if (st.slot !== slot) {
    const hunting = st.board.filter((c) => c.status === "hunting");
    st.board = [...hunting, ...generateBoard(uid, slot, bountyRank(st.reputation), hunting.map((c) => c.fugitive))];
    st.slot = slot;
  }
  return st;
}

/** Tableau à jour, sans modifier le joueur (affichage). */
export function viewBounties(player: Pick<PlayerState, "uid" | "bounties">, now: number): BountyState {
  return refreshBounties(structuredClone(bountyState(player)), player.uid, now);
}

/* ---------- lancement et combat ---------- */

/** Puissance d'attaque de la flotte du joueur (vaisseaux à quai). */
export function hunterPower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return computeFullPower(player.units ?? {}, player.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]);
}

/** Puissance du fugitif : part de la puissance d'attaque de toute la flotte
 *  à quai (vaisseaux envoyés compris), avec un plancher par niveau. */
export function fugitivePower(tier: BountyTier, player: Pick<PlayerState, "units" | "techLevels">): number {
  const t = BOUNTY_RULES.tiers[tier];
  return Math.round(Math.max(t.floor, hunterPower(player) * t.pct));
}

export function bountyTarget(contract: Pick<BountyContract, "id">): string {
  return `bounty_${contract.id}`;
}

/** Vérifie le lancement d'une prime et réserve le contrat. Appelée avant que
 *  les vaisseaux quittent la base (la puissance du fugitif les compte). */
export function startBounty(player: PlayerState, contractId: string, now: number): { contract: BountyContract; power: number; fugitive: Fugitive } {
  const st = refreshBounties(bountyState(player), player.uid, now);
  const contract = st.board.find((c) => c.id === contractId);
  if (!contract) throw new GameActionError("Ce contrat n'est plus au tableau.");
  if (contract.status !== "open") throw new GameActionError("Une flotte traque déjà ce fugitif.");
  if (st.doneToday >= BOUNTY_RULES.dailyLimit) throw new GameActionError(`${BOUNTY_RULES.dailyLimit} primes par jour : l'Essaim te recontactera demain.`);
  if (bountyRank(st.reputation) < BOUNTY_RULES.tiers[contract.tier].minRank) throw new GameActionError("Ton rang dans l'Essaim est trop bas pour cette prime.");
  const power = fugitivePower(contract.tier, player);
  contract.status = "hunting";
  st.doneToday += 1;
  player.bounties = st;
  return { contract, power, fugitive: FUGITIVES[contract.fugitive] ?? FUGITIVES[0] };
}

export interface BountyHuntOutput {
  player: PlayerState;
  queues: QueuesState;
  combat: CombatResult;
  survivors: Record<string, number>;
  report: Omit<BattleReport, "id">;
  notifications: NewNotification[];
  success: boolean;
  amber: number;
  xp: number;
}

/** Combat contre le fugitif (vaisseaux remis « à bord » par l'appelant). */
export function resolveBountyHunt(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  contractId: string,
  fleet: Record<string, number>,
  power: number,
  now: number,
  formation?: string,
): BountyHuntOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = refreshBounties(bountyState(player), player.uid, now);
  const contract = st.board.find((c) => c.id === contractId);
  const tier: BountyTier = contract?.tier ?? 1;
  const fugitive = FUGITIVES[contract?.fugitive ?? 0] ?? FUGITIVES[0];
  const fx = formationEffects(formation);
  const combat = resolveCombat({
    ...fx,
    attackFactor: fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: power,
  });
  const survivors: Record<string, number> = {};
  for (const [id, qty] of Object.entries(fleet)) survivors[id] = Math.max(0, qty - (combat.attackerLosses[id] ?? 0));
  const notifications: NewNotification[] = [...flushed.notifications];
  const success = combat.outcome === "attacker_win";
  const t = BOUNTY_RULES.tiers[tier];
  let amber = 0;
  let xp = 0;
  if (success) {
    const rankBefore = bountyRank(st.reputation);
    amber = amberFor(tier, rankBefore);
    xp = t.xp;
    st.amber += amber;
    st.amberEarned += amber;
    st.reputation += t.rep;
    st.completed += 1;
    st.board = st.board.filter((c) => c.id !== contractId);
    applyXpDelta(player, xp, now);
    bumpStat(player, "bounties");
    grantCommanderXp(player, "admiral", COMMANDER_XP.bountyWin);
    addPassPoints(player, "bounty", now);
    player.victories = (player.victories ?? 0) + 1;
    notifications.push(note(`${fugitive.name} capturé !`, `Prime « ${t.label} » remplie : +${xp} XP et ${amber} Ambre de Ruche.`, now));
    const rankAfter = bountyRank(st.reputation);
    if (rankAfter > rankBefore) {
      notifications.push(note(`Nouveau rang : ${rankName(rankAfter)}`, rankUpMessage(rankAfter), now));
    }
  } else {
    st.failed += 1;
    player.defeats = (player.defeats ?? 0) + 1;
    if (contract) {
      contract.tries += 1;
      if (contract.tries > BOUNTY_RULES.retries) st.board = st.board.filter((c) => c.id !== contractId);
      else contract.status = "open";
    }
    const retry = !!contract && contract.tries <= BOUNTY_RULES.retries;
    notifications.push(note(`${fugitive.name} s'est échappé`, `Ta flotte n'a pas pu le maîtriser.${retry ? " La prime reste ouverte une dernière fois." : " Le contrat est perdu."}`, now));
  }
  player.bounties = st;
  const report: Omit<BattleReport, "id"> = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: `bounty_${contractId}`,
    defenderPseudo: fugitive.name,
    timestamp: now,
    outcome: combat.outcome,
    attackerPower: combat.attackerPower,
    defenderPower: combat.defenderPower,
    attackerLossPercent: combat.attackerLossPercent,
    defenderLossPercent: combat.defenderLossPercent,
    attackerLosses: combat.attackerLosses,
    attackerRecovered: combat.attackerRecovered,
    defenderLosses: {},
    defenderRecovered: {},
    loot: null,
    defenderProcessed: true,
    defenderApplied: true,
    attackerXpDelta: xp,
    defenderXpDelta: 0,
    attackerFleet: fleet,
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications, success, amber, xp };
}

/** Flotte rappelée avant le contact : la prime redevient disponible. */
export function releaseBounty(player: PlayerState, contractId: string): void {
  const st = bountyState(player);
  const contract = st.board.find((c) => c.id === contractId);
  if (contract && contract.status === "hunting") contract.status = "open";
  player.bounties = st;
}

function rankUpMessage(rank: number): string {
  if (rank === BOUNTY_RULES.tiers[3].minRank) return "L'Essaim te confie désormais les proies majeures (★★★).";
  if (rank === BOUNTY_RULES.tiers[4].minRank) return "La Reine elle-même te reconnaît : les primes d'élite (★★★★) te sont ouvertes.";
  return `L'Essaim te verse ${Math.round(BOUNTY_RULES.amberPerRank * (rank - 1) * 100)} % d'Ambre en plus par prime.`;
}

function note(title: string, message: string, now: number): NewNotification {
  return { kind: "bounty", title, message, createdAtMs: now, read: false, link: "/game/primes" };
}

/* ---------- Comptoir de la Ruche ---------- */

export type ShopItemId = "accelerator" | "boost" | "jammer" | "beacon" | "shield" | "dossier" | "blueprint" | "title" | "frame" | "emblem" | "emojis";

export interface ShopItem {
  id: ShopItemId;
  name: string;
  price: number;
  group: "consumable" | "unit" | "cosmetic";
  description: string;
}

export const BOUNTY_SHOP_RULES = {
  acceleratorMinutes: 60,
  boostPct: KESH_BOOST_PCT,
  boostHours: 24,
  maxCharges: 3,
  shieldHours: 6,
  shieldCooldownDays: 7,
  title: "Chasseur de l'Essaim",
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "accelerator", name: "Accélérateur de chantier", price: 30, group: "consumable", description: "Une construction de bâtiment en cours se termine 1 h plus tôt." },
  { id: "boost", name: "Gelée de la Reine", price: 80, group: "consumable", description: "Production +20 % pendant 24 h (cumulable dans le temps)." },
  { id: "jammer", name: "Brouilleur d'essaim", price: 50, group: "consumable", description: "Le prochain espionnage reçu échoue : les sondes rentrent sans rapport. 3 en réserve au plus." },
  { id: "beacon", name: "Balise de repli", price: 60, group: "consumable", description: "Ramène aussitôt une flotte en vol à la base, avec sa cargaison. 3 en réserve au plus." },
  { id: "shield", name: "Voile de chitine", price: 150, group: "consumable", description: "Bouclier de 6 h contre les attaques de joueurs. Une fois par semaine ; attaquer le lève." },
  { id: "dossier", name: "Dossier d'entraînement", price: 40, group: "consumable", description: "+200 XP pour l'officier de ton choix, même hors poste (page Commandants)." },
  { id: "blueprint", name: "Plan du Traqueur Kesh", price: 600, group: "unit", description: "Débloque le Traqueur Kesh au chantier : rapide, +50 % d'attaque contre les PNJ." },
  { id: "title", name: "Titre « Chasseur de l'Essaim »", price: 120, group: "cosmetic", description: "Un titre à afficher à côté de ton nom." },
  { id: "frame", name: "Cadre de chitine", price: 200, group: "cosmetic", description: "Cadre ambré autour de ta fiche publique." },
  { id: "emblem", name: "Emblème de l'Essaim", price: 150, group: "cosmetic", description: "L'emblème kesh'vaar sur ta fiche publique." },
  { id: "emojis", name: "Emojis Kesh'Vaar", price: 80, group: "cosmetic", description: "4 emojis exclusifs pour les discussions." },
];

export function findShopItem(id: unknown): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

const ONE_TIME: ShopItemId[] = ["blueprint", "title", "frame", "emblem", "emojis"];

export function owns(st: Pick<BountyState, "owned">, id: ShopItemId): boolean {
  return st.owned.includes(id);
}

/** Pourquoi l'objet ne peut pas être acheté (null s'il peut l'être). */
export function shopBlocker(player: Pick<PlayerState, "bounties"> & Partial<Pick<PlayerState, "units">>, item: ShopItem, now: number, queues?: Pick<QueuesState, "buildingUpgrades">): string | null {
  const st = bountyState(player);
  if (ONE_TIME.includes(item.id) && owns(st, item.id)) return "Déjà acquis.";
  if ((item.id === "jammer" && st.jammers >= BOUNTY_SHOP_RULES.maxCharges) || (item.id === "beacon" && st.beacons >= BOUNTY_SHOP_RULES.maxCharges)) {
    return `${BOUNTY_SHOP_RULES.maxCharges} en réserve au plus.`;
  }
  if (item.id === "shield") {
    const ready = st.shieldBoughtAtMs + BOUNTY_SHOP_RULES.shieldCooldownDays * DAY;
    if (st.shieldBoughtAtMs && now < ready) return `Disponible à nouveau dans ${Math.ceil((ready - now) / DAY)} j.`;
  }
  if (item.id === "accelerator" && queues && !Object.values(queues.buildingUpgrades ?? {}).some((u) => u && u.endTime > now)) return "Aucune construction en cours.";
  if (st.amber < item.price) return "Pas assez d'Ambre.";
  return null;
}

/** Achat au Comptoir (le joueur doit être rattrapé à `now`). */
export function buyShopItem(player: PlayerState, queues: QueuesState, itemId: unknown, now: number, buildingId?: string): { message: string } {
  const item = findShopItem(itemId);
  if (!item) throw new GameActionError("Objet inconnu.");
  const blocker = shopBlocker(player, item, now, queues);
  if (blocker) throw new GameActionError(blocker);
  const st = bountyState(player);
  let message = `${item.name} : acquis.`;
  switch (item.id) {
    case "accelerator": {
      const entries = Object.entries(queues.buildingUpgrades ?? {}).filter(([, u]) => u && u.endTime > now);
      const chosen = entries.find(([id]) => id === buildingId) ?? entries.sort((a, b) => a[1]!.endTime - b[1]!.endTime)[0];
      const entry = chosen[1]!;
      entry.endTime = Math.max(now, entry.endTime - BOUNTY_SHOP_RULES.acceleratorMinutes * 60_000);
      message = "Chantier accéléré d'une heure.";
      break;
    }
    case "boost":
      st.boostUntilMs = Math.max(now, st.boostUntilMs) + BOUNTY_SHOP_RULES.boostHours * HOUR;
      message = "Gelée de la Reine : production +20 % pendant 24 h.";
      break;
    case "jammer":
      st.jammers += 1;
      message = "Brouilleur en place : le prochain espionnage échouera.";
      break;
    case "beacon":
      st.beacons += 1;
      message = "Balise de repli prête : utilise-la depuis une flotte en vol.";
      break;
    case "shield":
      st.shieldUntilMs = now + BOUNTY_SHOP_RULES.shieldHours * HOUR;
      st.shieldBoughtAtMs = now;
      message = "Voile de chitine actif pendant 6 h.";
      break;
    case "dossier":
      addDossiers(player, 1);
      message = "Dossier d'entraînement rangé : remets-le à un officier depuis la page Commandants.";
      break;
    case "blueprint":
      player.units[KESH_HUNTER_UNIT.id] = { level: 1, count: player.units[KESH_HUNTER_UNIT.id]?.count ?? 0 };
      message = "Plan du Traqueur Kesh reçu : le vaisseau est disponible au chantier.";
      break;
    case "title":
      if (!(player.titles ?? []).some((t) => t.label === BOUNTY_SHOP_RULES.title)) {
        player.titles = [...(player.titles ?? []), { label: BOUNTY_SHOP_RULES.title, seasonId: "kesh", rank: 1 }];
      }
      player.activeTitle = BOUNTY_SHOP_RULES.title;
      break;
  }
  if (ONE_TIME.includes(item.id)) st.owned = [...st.owned, item.id];
  st.amber -= item.price;
  player.bounties = st;
  return { message };
}

/** Semaine UTC (lundi) pour le plafond d'échange. */
function weekId(now: number): string {
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY) * DAY;
  return new Date(midnight - ((day + 6) % 7) * DAY).toISOString().slice(0, 10);
}

export function exchangeLeft(player: Pick<PlayerState, "bounties">, now: number): number {
  const st = bountyState(player);
  return BOUNTY_RULES.exchange.weeklyCap - (st.exchangeWeek === weekId(now) ? st.exchanged : 0);
}

/** Échange d'Ambre contre des ressources rares (sens unique). */
export function exchangeAmber(player: PlayerState, amountIn: unknown, now: number): Partial<Record<ResourceId, number>> {
  const amount = Math.floor(Number(amountIn));
  if (!(amount > 0)) throw new GameActionError("Quantité invalide.");
  const st = bountyState(player);
  const week = weekId(now);
  if (st.exchangeWeek !== week) {
    st.exchangeWeek = week;
    st.exchanged = 0;
  }
  if (amount > BOUNTY_RULES.exchange.weeklyCap - st.exchanged) throw new GameActionError(`Plafond : ${BOUNTY_RULES.exchange.weeklyCap} Ambre échangés par semaine.`);
  if (amount > st.amber) throw new GameActionError("Pas assez d'Ambre.");
  const gain: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) {
    if (r.rarity !== "rare") continue;
    gain[r.id] = amount * BOUNTY_RULES.exchange.rarePerAmber;
    player.resources[r.id] = (player.resources[r.id] ?? 0) + gain[r.id]!;
  }
  st.amber -= amount;
  st.exchanged += amount;
  player.bounties = st;
  return gain;
}

/* ---------- effets des objets ---------- */

export function bountyBoostEnd(player: Pick<PlayerState, "bounties">): number {
  return num((player.bounties as Partial<BountyState> | undefined)?.boostUntilMs);
}

export function shieldUntil(player: Pick<PlayerState, "bounties">): number {
  return num((player.bounties as Partial<BountyState> | undefined)?.shieldUntilMs);
}

/** Attaquer lève le Voile de chitine. */
export function dropShield(player: PlayerState, now: number): void {
  const st = bountyState(player);
  if (st.shieldUntilMs > now) {
    st.shieldUntilMs = now;
    player.bounties = st;
  }
}

/** Consomme un brouilleur (true si l'espionnage échoue). */
export function consumeJammer(player: PlayerState): boolean {
  const st = bountyState(player);
  if (st.jammers <= 0) return false;
  st.jammers -= 1;
  player.bounties = st;
  return true;
}

/** Consomme une balise de repli. */
export function consumeBeacon(player: PlayerState): void {
  const st = bountyState(player);
  if (st.beacons <= 0) throw new GameActionError("Aucune balise de repli : achète-en au Comptoir de la Ruche.");
  st.beacons -= 1;
  player.bounties = st;
}

/** Emojis exclusifs (rendus pour tous, utilisables par leurs seuls détenteurs). */
export const KESH_EMOJIS = [
  { code: "kesh_gg", url: "/assets/bounties/emoji-gg.webp" },
  { code: "kesh_ok", url: "/assets/bounties/emoji-ok.webp" },
  { code: "kesh_joie", url: "/assets/bounties/emoji-joie.webp" },
  { code: "kesh_top", url: "/assets/bounties/emoji-top.webp" },
];

/** Refuse les emojis Kesh'Vaar à qui ne possède pas le pack. */
export function assertKeshEmojis(player: Pick<PlayerState, "bounties">, text: string): void {
  if (!/:kesh_[a-z]+:/.test(text)) return;
  if (KESH_EMOJIS.some((e) => text.includes(`:${e.code}:`)) && !owns(bountyState(player), "emojis")) {
    throw new GameActionError("Les emojis Kesh'Vaar s'obtiennent au Comptoir de la Ruche.");
  }
}

/* ---------- proie d'élite de la semaine (tout le serveur) ---------- */

export const ELITE_KEY = "bounty_elite";

export const ELITE_RULES = {
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs. */
  hpFactor: 1,
  minHp: 50_000,
  /** Un assaut toutes les N heures par joueur. */
  cooldownHours: 12,
  flightMinutes: 45,
  lossPct: 0.1,
  /** Rang minimal dans l'Essaim. */
  minRank: 2,
  /** Part minimale des points de structure pour être récompensé. */
  minShare: 0.005,
  killed: { xp: 300, amber: 150, rep: 8 },
  failed: { xp: 100, amber: 50, rep: 3 },
};

export interface EliteHunt {
  id: string;
  fugitive: number;
  startMs: number;
  endMs: number;
  maxHp: number;
  hp: number;
  status: "active" | "killed" | "failed";
  endedAtMs: number;
  rewarded: boolean;
  contributions: Record<string, { pseudo: string; damage: number; assaults: number; lastLaunchMs: number }>;
}

export function eliteWindow(now: number): { id: string; startMs: number; endMs: number } {
  const id = weekId(now);
  const startMs = Date.parse(`${id}T00:00:00Z`);
  return { id: `elite-${id}`, startMs, endMs: startMs + 7 * DAY };
}

export function normalizeElite(raw: unknown): EliteHunt | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<EliteHunt>;
  if (!r.id || !(num(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    fugitive: num(r.fugitive),
    startMs: num(r.startMs),
    endMs: num(r.endMs),
    maxHp: num(r.maxHp),
    hp: num(r.hp),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    endedAtMs: num(r.endedAtMs),
    rewarded: !!r.rewarded,
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
  };
}

export function spawnElite(now: number, activePlayers: Pick<PlayerState, "units" | "techLevels">[]): EliteHunt {
  const w = eliteWindow(now);
  let h = 0;
  for (const c of w.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const total = activePlayers.reduce((sum, p) => sum + hunterPower(p), 0);
  const maxHp = Math.round(Math.max(ELITE_RULES.minHp, total * ELITE_RULES.hpFactor));
  return { id: w.id, fugitive: h % ELITE_FUGITIVES.length, startMs: w.startMs, endMs: w.endMs, maxHp, hp: maxHp, status: "active", endedAtMs: 0, rewarded: false, contributions: {} };
}

export function eliteActive(state: EliteHunt | null, now: number): boolean {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs && state.hp > 0;
}

/** Prochain assaut possible pour ce joueur (0 = tout de suite). */
export function eliteReadyAt(state: EliteHunt | null, uid: string): number {
  const last = state?.contributions[uid]?.lastLaunchMs ?? 0;
  return last ? last + ELITE_RULES.cooldownHours * HOUR : 0;
}

export function checkEliteLaunch(state: EliteHunt | null, player: Pick<PlayerState, "uid" | "pseudo" | "bounties">, now: number): EliteHunt {
  if (!state || !eliteActive(state, now)) throw new GameActionError("Aucune proie d'élite à traquer en ce moment.");
  if (bountyRank(bountyState(player).reputation) < ELITE_RULES.minRank) throw new GameActionError(`Il faut le rang ${rankName(ELITE_RULES.minRank)} dans l'Essaim pour traquer la proie d'élite.`);
  const ready = eliteReadyAt(state, player.uid);
  if (ready > now) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil((ready - now) / 60_000)} min.`);
  const c = state.contributions[player.uid] ?? { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: 0 };
  return { ...state, contributions: { ...state.contributions, [player.uid]: { ...c, pseudo: player.pseudo, lastLaunchMs: now } } };
}

export function resolveEliteAssault(
  state: EliteHunt,
  player: PlayerState,
  fleet: Record<string, number>,
  formation: string | undefined,
  now: number,
): { state: EliteHunt; damage: number; survivors: Record<string, number>; lost: Record<string, number>; killed: boolean } {
  const fx = formationEffects(formation);
  const power = Math.round(
    computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack) * (1 + playerModifiers(player).bossDamage),
  );
  const active = eliteActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = withRepairBonus(getRepairPercent(player.buildings), player);
  const lossPct = Math.min(1, ELITE_RULES.lossPct * fx.attackerLossFactor);
  const survivors: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const gone = raw - Math.floor(raw * repair);
    if (gone > 0) lost[id] = gone;
    survivors[id] = qty - gone;
  }
  const c = state.contributions[player.uid] ?? { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: now };
  const hp = state.hp - damage;
  const killed = active && hp <= 0;
  return {
    state: {
      ...state,
      hp: Math.max(0, hp),
      status: killed ? "killed" : state.status,
      endedAtMs: killed ? now : state.endedAtMs,
      contributions: active ? { ...state.contributions, [player.uid]: { ...c, pseudo: player.pseudo, damage: c.damage + damage, assaults: c.assaults + 1 } } : state.contributions,
    },
    damage,
    survivors,
    lost,
    killed,
  };
}

/** Échéance : la proie s'enfuit si elle n'est pas tombée. */
export function closeElite(state: EliteHunt, now: number): EliteHunt {
  if (state.status === "active" && now >= state.endMs) return { ...state, status: "failed", endedAtMs: now };
  return state;
}

export function eliteRanking(state: EliteHunt): { uid: string; pseudo: string; damage: number; assaults: number }[] {
  return Object.entries(state.contributions)
    .filter(([, c]) => c.damage > 0)
    .map(([uid, c]) => ({ uid, pseudo: c.pseudo, damage: c.damage, assaults: c.assaults }))
    .sort((a, b) => b.damage - a.damage);
}

export function eliteRewardees(state: EliteHunt): string[] {
  if (state.status === "active") return [];
  return eliteRanking(state)
    .filter((c) => c.damage >= state.maxHp * ELITE_RULES.minShare)
    .map((c) => c.uid);
}

/** Récompense d'un participant (appliquée à `player`). */
export function grantEliteReward(state: EliteHunt, player: PlayerState, now: number, random: () => number = Math.random): { xp: number; amber: number; relic?: string } {
  if (!eliteRewardees(state).includes(player.uid)) return { xp: 0, amber: 0 };
  const r = state.status === "killed" ? ELITE_RULES.killed : ELITE_RULES.failed;
  const st = bountyState(player);
  st.amber += r.amber;
  st.amberEarned += r.amber;
  st.reputation += r.rep;
  player.bounties = st;
  applyXpDelta(player, r.xp, now);
  // v4.0 : proie abattue, une relique rare au moins pour chaque chasseur récompensé.
  if (state.status === "killed") {
    const item = rollRelic("elite", now, random, "rare");
    if (addRelic(player, item)) return { xp: r.xp, amber: r.amber, relic: relicLabel(item) };
  }
  return { xp: r.xp, amber: r.amber };
}

export function describeElite(state: EliteHunt): Fugitive {
  return ELITE_FUGITIVES[state.fugitive % ELITE_FUGITIVES.length];
}

export function eliteNotice(state: EliteHunt, reward: { xp: number; amber: number; relic?: string }, now: number): NewNotification {
  const f = describeElite(state);
  return note(
    state.status === "killed" ? `${f.name} est tombé` : `${f.name} s'est enfui`,
    reward.amber > 0
      ? `Ta part de la traque : +${formatInt(reward.xp)} XP et ${reward.amber} Ambre de Ruche.${reward.relic ? ` Relique : ${reward.relic} !` : ""}`
      : "Ta part des dégâts était trop faible pour une récompense.",
    now,
  );
}
