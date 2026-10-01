import { getProductionRatesPerSecond } from "@/game/production";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings, BUILDINGS, effectiveBuildingLevel, getRepairPercent } from "@/game/buildings";
import { computeFullPower, getShieldPercent, homeDefensePower, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { COMMON_RESOURCES, protectedAmount } from "@/game/economy";
import { ALLIANCE_RULES, allianceShieldBonus } from "@/game/alliances";
import { applyXpDelta } from "@/game/seasons";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { OFFENSIVE_UNITS } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import type { BattleReport, PlayerState, QueuesState, ResourceId, Units } from "@/types/game";

/* =====================================================
   Factions hostiles (v2.0, généralisé en v2.1) : des factions contrôlées
   par le jeu inscrivent un empire sur leur liste, exigent un tribut, puis
   attaquent en cas de refus. Chaque faction est une fiche de données
   (section de contenu « factions », modifiable dans l'administration) :
   déclencheur, tribut, cible et force du raid, primes, repaire.

   Une seule menace à la fois par joueur. La Notoriété et le repaire sont
   propres à chaque faction.
===================================================== */

export type FactionTrigger = "wealth" | "aggression";
export type RaidTarget = "base" | "fleet";

export interface FactionDef {
  id: string;
  enabled: boolean;
  name: string;
  leader: string;
  enforcer: string;
  /** Illustration (chemin public ou URL d'un fichier envoyé). */
  art: string;
  /** Couleur d'accent : ember, gold, cyan, mint, danger. */
  color: string;
  /** Récit (paragraphes séparés par une ligne vide). */
  story: string;
  ultimatum: {
    title: string;
    /** Réplique du chef ; {pseudo} est remplacé par le pseudo du joueur. */
    quote: string;
    signature: string;
    payLabel: string;
  };
  trigger: {
    type: FactionTrigger;
    /** Délai entre deux inscriptions (tirage uniforme), en heures. */
    minIntervalHours: number;
    maxIntervalHours: number;
    /** Richesse : seuls les joueurs actifs récemment sont visés. */
    activeWithinHours: number;
    /** Agression : victoires contre des joueurs sur la période. */
    minVictories: number;
    windowDays: number;
  };
  tribute: {
    /** production : heures de production ; plunder : part du butin récent. */
    basis: "production" | "plunder";
    hours: number;
    plunderPct: number;
    /** Plancher en heures de production (base « plunder »). */
    minHours: number;
  };
  answerHours: number;
  raidTravelHours: number;
  raid: {
    /** base : défenses + flotte à quai ; fleet : la flotte à quai seule. */
    target: RaidTarget;
    basePct: number;
    perNotorietyPct: number;
    maxNotoriety: number;
    floorPower: number;
    floorPerBuildingLevel: number;
    lootPct: number;
    lootKind: "common" | "rare";
  };
  bounty: { hours: number; rare: number; xp: number; debrisPerPower: number };
  lair: { name: string; raidsNeeded: number; pct: number; rewardHours: number; rare: number; xp: number; title: string };
}

export const DEFAULT_FACTIONS: FactionDef[] = [
  {
    id: "varan",
    enabled: true,
    name: "Confrérie du Vide",
    leader: "Capitaine Orsk Varan",
    enforcer: "Le Silencieux",
    art: "/assets/story/varan.webp",
    color: "ember",
    story:
      "Depuis l'effondrement des routes commerciales, une flotte sans bannière rôde aux confins de la galaxie : la Confrérie du Vide.\n\n" +
      "Son chef, le capitaine Orsk Varan, ancien officier impérial à la barbe grise, tient à jour une tablette lumineuse : la Liste, les empires trop riches pour être prudents. Ses ordres sont exécutés par le Silencieux, un colosse au masque respiratoire dont personne n'a jamais entendu la voix. Quand son doigt se pose sur toi, ton nom vient d'entrer sur la Liste.\n\n" +
      "Varan laisse toujours un choix : payer le tribut, ou voir le Silencieux venir le chercher lui-même.",
    ultimatum: {
      title: "« Ton nom est sur ma Liste. »",
      quote:
        "{pseudo}… Ton empire brille un peu trop dans le noir. Le Silencieux t'a désigné, et il ne se trompe jamais. Verse ta part à la Confrérie, et nous t'oublierons. Refuse, et il viendra la prendre lui-même.",
      signature: "Capitaine Orsk Varan",
      payLabel: "Payer le tribut",
    },
    trigger: { type: "wealth", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7 },
    tribute: { basis: "production", hours: 6, plunderPct: 0, minHours: 0 },
    answerHours: 12,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.7, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "common" },
    bounty: { hours: 4, rare: 0, xp: 25, debrisPerPower: 1 },
    lair: { name: "Repaire de Varan", raidsNeeded: 5, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Fléau de la Confrérie" },
  },
  {
    id: "gravhorn",
    enabled: true,
    name: "Syndicat Gravhorn",
    leader: "Oggrath le Pisteur",
    enforcer: "L'Unité Ambre",
    art: "/assets/story/gravhorn.webp",
    color: "gold",
    story:
      "On ne fuit pas le Syndicat. On le paie, ou on devient son trophée.\n\n" +
      "Les Gravhorns sont une espèce de chasseurs à la peau tachetée et cornue, dont les antennes captent la peur à des parsecs de distance. Ils ne pillent pas au hasard : ils exécutent des contrats. Chaque empire que tu dévastes peut, en secret, déposer une prime sur ta tête.\n\n" +
      "Le contrat est confié à Oggrath le Pisteur, vétéran au regard las qui a déjà tout vu. Il ne se déplace jamais seul : à ses côtés marche l'Unité Ambre, une combinaison orange à visière tactique dont personne ne sait ce qu'elle abrite. Sa visière affiche déjà ta flotte.",
    ultimatum: {
      title: "« Il y a un contrat sur ta tête. »",
      quote:
        "{pseudo}. Tes victimes ont payé cher pour te voir tomber. Moi, je suis un professionnel : rachète ton contrat, et l'Unité Ambre range ses armes. Sinon, elle vient pour tes vaisseaux. Pas pour tes murs. Pour tes vaisseaux.",
      signature: "Oggrath le Pisteur",
      payLabel: "Racheter le contrat",
    },
    trigger: { type: "aggression", minIntervalHours: 48, maxIntervalHours: 72, activeWithinHours: 72, minVictories: 3, windowDays: 7 },
    tribute: { basis: "plunder", hours: 0, plunderPct: 0.5, minHours: 4 },
    answerHours: 8,
    raidTravelHours: 1.5,
    raid: { target: "fleet", basePct: 0.8, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "rare" },
    bounty: { hours: 0, rare: 200, xp: 40, debrisPerPower: 1 },
    lair: { name: "Chambre des Contrats", raidsNeeded: 4, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Chasseur de chasseurs" },
  },
];

/** Registre courant (remplacé par applyGameContent). */
export const FACTIONS: FactionDef[] = [];
export function setFactions(defs: FactionDef[]) {
  FACTIONS.splice(0, FACTIONS.length, ...defs);
}
setFactions(structuredClone(DEFAULT_FACTIONS));

export function findFaction(id: string): FactionDef | undefined {
  return FACTIONS.find((f) => f.id === id);
}

/** Interrupteur général (règles « pirates »). */
export const PIRATE_RULES = { enabled: true };

export const PIRATE_OWNER_UID = "pirates";
/** Cible d'un assaut de repaire : lair_<faction>. */
export function lairUid(factionId: string): string {
  return `lair_${factionId}`;
}
export function factionOfLair(uid: string): string {
  return uid.startsWith("lair_") ? uid.slice(5) : uid === "pirates_lair" ? "varan" : "";
}

export interface PirateUltimatum {
  tribute: Partial<Record<ResourceId, number>>;
  issuedAtMs: number;
  expiresAtMs: number;
}

export interface PirateState {
  notoriety: number;
  repelled: number;
  lairOpen: boolean;
  nextListAtMs: number;
  ultimatum: PirateUltimatum | null;
  raidUntilMs: number;
  raidsWon: number;
  raidsLost: number;
  tributesPaid: number;
  lairsTaken: number;
}

/** État de toutes les factions d'un joueur (avec migration de l'ancien
 *  format v2.0, où l'état de Varan était stocké à plat). */
export type FactionStates = Record<string, PirateState>;

function normalize(p: Partial<PirateState> | undefined, maxNotoriety = 8): PirateState {
  return {
    notoriety: Math.max(0, Math.min(maxNotoriety, p?.notoriety ?? 0)),
    repelled: p?.repelled ?? 0,
    lairOpen: p?.lairOpen ?? false,
    nextListAtMs: p?.nextListAtMs ?? 0,
    ultimatum: p?.ultimatum ?? null,
    raidUntilMs: p?.raidUntilMs ?? 0,
    raidsWon: p?.raidsWon ?? 0,
    raidsLost: p?.raidsLost ?? 0,
    tributesPaid: p?.tributesPaid ?? 0,
    lairsTaken: p?.lairsTaken ?? 0,
  };
}

function isLegacy(raw: unknown): boolean {
  return !!raw && typeof raw === "object" && ("notoriety" in raw || "nextListAtMs" in raw);
}

export function factionStates(player: Pick<PlayerState, "pirates">): FactionStates {
  const raw = (player.pirates ?? {}) as Record<string, unknown>;
  const out: FactionStates = {};
  if (isLegacy(raw)) out.varan = normalize(raw as Partial<PirateState>);
  else for (const [id, st] of Object.entries(raw)) out[id] = normalize(st as Partial<PirateState>);
  return out;
}

export function pirateState(player: Pick<PlayerState, "pirates">, factionId = "varan"): PirateState {
  return factionStates(player)[factionId] ?? normalize(undefined);
}

function setState(player: PlayerState, factionId: string, st: PirateState) {
  player.pirates = { ...factionStates(player), [factionId]: st };
}

/** Ultimatum en attente (une seule menace à la fois). */
export function activeUltimatum(player: Pick<PlayerState, "pirates">, now: number): { faction: FactionDef; ultimatum: PirateUltimatum } | null {
  for (const [id, st] of Object.entries(factionStates(player))) {
    const faction = findFaction(id);
    if (faction && st.ultimatum && st.ultimatum.expiresAtMs > now) return { faction, ultimatum: st.ultimatum };
  }
  return null;
}

function hours(h: number): number {
  return h * 3600_000;
}

export function nextListDelay(faction: FactionDef, random: () => number): number {
  const span = Math.max(0, faction.trigger.maxIntervalHours - faction.trigger.minIntervalHours);
  return hours(faction.trigger.minIntervalHours + random() * span);
}

/** Heures de production des ressources communes (prime, tribut). */
export function productionHours(player: Pick<PlayerState, "buildings" | "techLevels">, h: number): Partial<Record<ResourceId, number>> {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMON_RESOURCES) {
    const n = Math.floor((rates[res] ?? 0) * h * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}

function total(r: Partial<Record<ResourceId, number>>): number {
  return Object.values(r).reduce((a: number, b) => a + (b ?? 0), 0);
}

/** Puissance défensive d'une base (sans garnisons). */
export function defensivePower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return homeDefensePower(player.units ?? {}, player.techLevels ?? {});
}

/** Puissance de la flotte à quai engagée à 100 % (cible « flotte »). */
export function homeFleetPower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return computeFullPower(player.units ?? {}, player.techLevels ?? {}, OFFENSIVE_UNITS, ["attack", "defense"]);
}

/** Ce que vise la faction : la base entière ou la flotte à quai. */
export function targetPower(faction: FactionDef, player: Pick<PlayerState, "units" | "techLevels">): number {
  return faction.raid.target === "fleet" ? homeFleetPower(player) : defensivePower(player);
}

export function raidPower(faction: FactionDef, player: PlayerState, notoriety: number): number {
  const levels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const floor = faction.raid.floorPower + faction.raid.floorPerBuildingLevel * levels;
  const pct = faction.raid.basePct + faction.raid.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, targetPower(faction, player) * pct));
}

/** Activité guerrière récente d'un joueur (calculée par le serveur). */
export interface AggressionStats {
  victories: number;
  plunder: Partial<Record<ResourceId, number>>;
}

export function tributeFor(faction: FactionDef, player: PlayerState, aggression: AggressionStats | null): Partial<Record<ResourceId, number>> {
  if (faction.tribute.basis === "production") return productionHours(player, faction.tribute.hours);
  const fromPlunder: Partial<Record<ResourceId, number>> = {};
  for (const [res, v] of Object.entries(aggression?.plunder ?? {}) as [ResourceId, number][]) {
    const n = Math.floor((v ?? 0) * faction.tribute.plunderPct);
    if (n > 0) fromPlunder[res] = n;
  }
  const floor = productionHours(player, faction.tribute.minHours);
  return total(fromPlunder) >= total(floor) ? fromPlunder : floor;
}

function note(kind: NewNotification["kind"], title: string, message: string, now: number): NewNotification {
  return { kind, title, message, createdAtMs: now, read: false };
}

export interface PirateTickOutput {
  changed: boolean;
  /** Raid à lancer (ultimatum expiré sans réponse). */
  raid: { factionId: string; power: number; arriveAtMs: number } | null;
  notifications: NewNotification[];
}

/** Passage périodique du serveur, toutes factions confondues. Modifie
 *  `player.pirates`. `force` : inscription immédiate par une faction donnée. */
export function pirateTick(
  player: PlayerState,
  now: number,
  options: { random?: () => number; aggression?: AggressionStats | null; force?: string | null } = {},
): PirateTickOutput {
  const random = options.random ?? Math.random;
  const out: PirateTickOutput = { changed: false, raid: null, notifications: [] };
  if (!PIRATE_RULES.enabled) return out;
  const states = factionStates(player);
  if (isLegacy(player.pirates)) {
    player.pirates = states;
    out.changed = true;
  }

  // 1. Ultimatums expirés : le raid part.
  for (const faction of FACTIONS) {
    const st = states[faction.id];
    if (st?.ultimatum && now >= st.ultimatum.expiresAtMs) {
      out.raid = launchRaid(player, faction, st, now, random);
      out.changed = true;
      out.notifications.push(
        note("fleet", `${faction.enforcer} arrive`, `Tu n'as pas répondu à ${faction.leader} : raid dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min.`, now),
      );
      return out;
    }
  }

  // 2. Une seule menace à la fois.
  const busy = Object.values(states).some((st) => (st.ultimatum && st.ultimatum.expiresAtMs > now) || st.raidUntilMs > now);
  if (busy) return out;

  for (const faction of FACTIONS) {
    if (!faction.enabled) continue;
    const forced = options.force === faction.id;
    if (options.force && !forced) continue;
    const st = states[faction.id] ?? normalize(undefined);
    if (!st.nextListAtMs && !forced) {
      // Premier passage : on fixe la date de la première inscription.
      st.nextListAtMs = now + (faction.trigger.type === "aggression" ? hours(12) : nextListDelay(faction, random));
      setState(player, faction.id, st);
      out.changed = true;
      continue;
    }
    const triggered =
      faction.trigger.type === "aggression"
        ? (options.aggression?.victories ?? 0) >= faction.trigger.minVictories
        : now - (player.resourcesUpdatedAtMs ?? 0) <= hours(faction.trigger.activeWithinHours);
    const eligible = forced || (now >= st.nextListAtMs && now - (player.createdAtMs ?? 0) >= hours(72) && triggered);
    if (!eligible) continue;
    const tribute = tributeFor(faction, player, options.aggression ?? null);
    st.ultimatum = { tribute, issuedAtMs: now, expiresAtMs: now + hours(faction.answerHours) };
    setState(player, faction.id, st);
    out.changed = true;
    out.notifications.push(
      note(
        "fleet",
        faction.ultimatum.title.replace(/[«»"]/g, "").trim(),
        `${faction.leader} exige ${formatInt(total(tribute))} ressources. Réponds avant ${faction.answerHours} h, ou ${faction.enforcer} viendra se servir.`,
        now,
      ),
    );
    return out; // une seule inscription par passage
  }
  return out;
}

function launchRaid(player: PlayerState, faction: FactionDef, st: PirateState, now: number, random: () => number) {
  const power = raidPower(faction, player, st.notoriety);
  const arriveAtMs = now + hours(faction.raidTravelHours);
  st.ultimatum = null;
  st.raidUntilMs = arriveAtMs;
  st.nextListAtMs = arriveAtMs + nextListDelay(faction, random);
  setState(player, faction.id, st);
  return { factionId: faction.id, power, arriveAtMs };
}

/** Réponse du joueur à l'ultimatum en cours (production rattrapée avant). */
export function answerUltimatum(
  player: PlayerState,
  answer: "pay" | "refuse",
  now: number,
  random: () => number = Math.random,
): { raid: { factionId: string; power: number; arriveAtMs: number } | null; notifications: NewNotification[] } {
  const active = activeUltimatum(player, now);
  if (!active) throw new GameActionError("Aucun ultimatum en attente.");
  const { faction } = active;
  const st = pirateState(player, faction.id);
  const tribute = active.ultimatum.tribute;
  if (answer === "pay") {
    for (const [res, amount] of Object.entries(tribute) as [ResourceId, number][]) {
      if ((player.resources[res] ?? 0) < amount) throw new GameActionError("Tu n'as pas de quoi payer : refuse, ou trouve les ressources à temps.");
    }
    for (const [res, amount] of Object.entries(tribute) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) - amount;
    st.ultimatum = null;
    st.tributesPaid += 1;
    st.nextListAtMs = now + nextListDelay(faction, random);
    setState(player, faction.id, st);
    return { raid: null, notifications: [note("fleet", "Tribut payé", `${faction.leader} te laisse en paix… pour l'instant.`, now)] };
  }
  const raid = launchRaid(player, faction, st, now, random);
  return {
    raid,
    notifications: [note("fleet", "Tu as refusé", `${faction.enforcer} est en route : impact dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min. Prépare-toi !`, now)],
  };
}

/* ---------- arrivée d'un raid ---------- */

export interface PirateRaidOutput {
  player: PlayerState;
  queues: QueuesState;
  combat: CombatResult;
  loot: Partial<Record<ResourceId, number>>;
  bounty: Partial<Record<ResourceId, number>>;
  debris: { scrap: number; energy: number };
  report: Omit<BattleReport, "id">;
  notifications: NewNotification[];
}

const RARE: ResourceId[] = RESOURCE_LIST.filter((r) => r.rarity === "rare").map((r) => r.id);

export function resolvePirateRaid(
  faction: FactionDef,
  playerIn: PlayerState,
  queuesIn: QueuesState,
  power: number,
  garrisons: (CombatGarrison & { ownerUid: string; ownerPseudo: string })[],
  now: number,
): PirateRaidOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player, faction.id);
  const fleetOnly = faction.raid.target === "fleet";
  // Cible « flotte » : les défenses ne combattent pas, les vaisseaux à 100 %.
  const defenderUnits: Units = fleetOnly
    ? Object.fromEntries(Object.entries(player.units ?? {}).filter(([id]) => OFFENSIVE_UNITS.includes(id)))
    : player.units ?? {};
  const combat = resolveCombat({
    attackerUnits: {},
    attackerTechLevels: {},
    attackerRepairPct: 0,
    fleet: {},
    attackerPowerOverride: power,
    defenderUnits,
    defenderTechLevels: player.techLevels ?? {},
    defenderRepairPct: getRepairPercent(player.buildings),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
    defenderResources: {},
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    homeFleetFactor: fleetOnly ? 1 : undefined,
  });
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - lost);
  }

  const loot: Partial<Record<ResourceId, number>> = {};
  let bounty: Partial<Record<ResourceId, number>> = {};
  let debris = { scrap: 0, energy: 0 };
  const notifications: NewNotification[] = [...flushed.notifications];
  st.raidUntilMs = 0;

  if (combat.outcome === "attacker_win") {
    const kinds = faction.raid.lootKind === "rare" ? RARE : COMMON_RESOURCES;
    for (const res of kinds) {
      const exposed = Math.max(0, (player.resources[res] ?? 0) - protectedAmount(player.buildings, res));
      const taken = Math.floor(exposed * faction.raid.lootPct);
      if (taken > 0) {
        loot[res] = taken;
        player.resources[res] = (player.resources[res] ?? 0) - taken;
      }
    }
    st.raidsLost += 1;
    st.notoriety = Math.max(0, st.notoriety - 1);
    player.lastDefeatAtMs = now;
    notifications.push(note("combat-defender", `Victoire de ${faction.name}`, `${faction.enforcer} a eu le dessus et emporté ${formatInt(total(loot))} ressources.`, now));
  } else {
    bounty = productionHours(player, faction.bounty.hours);
    for (const r of RARE) if (faction.bounty.rare > 0) bounty[r] = (bounty[r] ?? 0) + faction.bounty.rare;
    for (const [res, amount] of Object.entries(bounty) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, faction.bounty.xp, now);
    const destroyed = power * combat.attackerLossPercent;
    debris = { scrap: Math.floor(destroyed * faction.bounty.debrisPerPower), energy: Math.floor((destroyed * faction.bounty.debrisPerPower) / 2) };
    st.raidsWon += 1;
    st.repelled += 1;
    st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    player.victories = (player.victories ?? 0) + 1;
    const lairNow = !st.lairOpen && st.repelled >= faction.lair.raidsNeeded;
    if (lairNow) st.lairOpen = true;
    notifications.push(
      note(
        "combat-defender",
        combat.outcome === "draw" ? `${faction.name} repoussé de justesse` : `${faction.name} repoussé !`,
        `Prime : ${formatInt(total(bounty))} ressources et +${faction.bounty.xp} XP. Notoriété ${st.notoriety}.`,
        now,
      ),
    );
    if (lairNow) notifications.push(note("fleet", `${faction.lair.name} localisé`, "Sa position a fuité : lance l'assaut depuis la page Menaces !", now));
  }
  setState(player, faction.id, st);

  const report: Omit<BattleReport, "id"> = {
    attackerUid: PIRATE_OWNER_UID,
    attackerPseudo: `${faction.enforcer} (${faction.name})`,
    defenderUid: player.uid,
    defenderPseudo: player.pseudo,
    timestamp: now,
    outcome: combat.outcome,
    attackerPower: combat.attackerPower,
    defenderPower: combat.defenderPower,
    attackerLossPercent: combat.attackerLossPercent,
    defenderLossPercent: combat.defenderLossPercent,
    attackerLosses: {},
    attackerRecovered: {},
    defenderLosses: combat.defenderLosses,
    defenderRecovered: combat.defenderRecovered,
    loot,
    defenderProcessed: false,
    defenderApplied: true,
    attackerXpDelta: 0,
    defenderXpDelta: combat.outcome === "attacker_win" ? 0 : faction.bounty.xp,
    garrisons: garrisons.map((g, i) => ({ ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: combat.garrisonLosses?.[i] ?? {} })),
  };
  return { player, queues: flushed.queues, combat, loot, bounty, debris, report, notifications };
}

/* ---------- repaires ---------- */

export function lairPower(faction: FactionDef, player: PlayerState): number {
  return Math.round(Math.max(faction.raid.floorPower * 3, targetPower(faction, player) * faction.lair.pct));
}

export function checkLairLaunch(faction: FactionDef | undefined, player: PlayerState, fleet: Record<string, unknown>): Record<string, number> {
  if (!faction) throw new GameActionError("Repaire inconnu.");
  if (!pirateState(player, faction.id).lairOpen) throw new GameActionError(`${faction.lair.name} n'est pas encore localisé.`);
  const units: Record<string, number> = {};
  for (const [id, v] of Object.entries(fleet ?? {})) {
    const qty = Math.floor(Number(v));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(id)) throw new GameActionError("Seules les unités d'attaque peuvent être envoyées.");
    units[id] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
  return units;
}

export interface LairAssaultOutput {
  player: PlayerState;
  queues: QueuesState;
  combat: CombatResult;
  survivors: Record<string, number>;
  report: Omit<BattleReport, "id">;
  notifications: NewNotification[];
}

export function resolveLairAssault(faction: FactionDef, playerIn: PlayerState, queuesIn: QueuesState, fleet: Record<string, number>, power: number, now: number): LairAssaultOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player, faction.id);
  const combat = resolveCombat({
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: getRepairPercent(player.buildings),
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
  if (combat.outcome === "attacker_win") {
    const reward = productionHours(player, faction.lair.rewardHours);
    for (const r of RARE) reward[r] = (reward[r] ?? 0) + faction.lair.rare;
    for (const [res, amount] of Object.entries(reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, faction.lair.xp, now);
    const title = faction.lair.title;
    if (title && !(player.titles ?? []).some((t) => t.label === title)) {
      player.titles = [...(player.titles ?? []), { label: title, seasonId: `faction:${faction.id}`, rank: 1 }];
      if (!player.activeTitle) player.activeTitle = title;
    }
    st.lairOpen = false;
    st.repelled = 0;
    st.notoriety = 0;
    st.lairsTaken += 1;
    player.victories = (player.victories ?? 0) + 1;
    notifications.push(
      note(
        "combat-attacker",
        `${faction.lair.name} est tombé !`,
        `Butin : ${formatInt(total(reward))} ressources, +${faction.lair.xp} XP${title ? ` et le titre « ${title} »` : ""}. ${faction.leader} s'est enfui… la traque continue.`,
        now,
      ),
    );
  } else {
    player.defeats = (player.defeats ?? 0) + 1;
    notifications.push(note("combat-attacker", "Assaut repoussé", `Les défenses du ${faction.lair.name} ont tenu. Les survivants rentrent.`, now));
  }
  setState(player, faction.id, st);
  const report: Omit<BattleReport, "id"> = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: lairUid(faction.id),
    defenderPseudo: faction.lair.name,
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
    attackerXpDelta: combat.outcome === "attacker_win" ? faction.lair.xp : 0,
    defenderXpDelta: 0,
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications };
}

/** Validation des fiches de factions (administration). */
export function validateFactions(defs: FactionDef[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const f of defs) {
    const label = `Faction ${f.name || f.id}`;
    if (!/^[a-z0-9_]+$/.test(f.id ?? "")) errors.push(`${label} : identifiant « ${f.id} » invalide (minuscules, chiffres, _).`);
    if (seen.has(f.id)) errors.push(`${label} : identifiant en double.`);
    seen.add(f.id);
    if (!(f.trigger.maxIntervalHours >= f.trigger.minIntervalHours)) errors.push(`${label} : délai maximal inférieur au délai minimal.`);
    if (!(f.answerHours > 0)) errors.push(`${label} : délai de réponse invalide.`);
    if (!(f.lair.raidsNeeded >= 1)) errors.push(`${label} : nombre de raids avant le repaire invalide.`);
  }
  return errors;
}
