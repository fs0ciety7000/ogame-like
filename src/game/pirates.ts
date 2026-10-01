import { getProductionRatesPerSecond } from "@/game/production";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings, BUILDINGS, effectiveBuildingLevel, getRepairPercent } from "@/game/buildings";
import { getShieldPercent, homeDefensePower, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { COMMON_RESOURCES, protectedAmount } from "@/game/economy";
import { ALLIANCE_RULES, allianceShieldBonus } from "@/game/alliances";
import { applyXpDelta } from "@/game/seasons";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { BattleReport, PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   La Liste de Varan (v2.0) : la Confrérie du Vide, menée par le capitaine
   Orsk Varan et son exécuteur, le Silencieux, inscrit régulièrement un
   empire sur sa Liste. Il paie un tribut, ou le Silencieux vient se servir.
   Les raids repoussés font monter la Notoriété ; au bout de quelques-uns,
   le repaire de Varan devient attaquable.
===================================================== */

export const PIRATE_RULES = {
  enabled: true,
  /** Délai entre deux inscriptions sur la Liste (tirage uniforme), en heures. */
  minIntervalHours: 72,
  maxIntervalHours: 96,
  /** Seuls les joueurs actifs récemment sont visés. */
  activeWithinHours: 72,
  /** Tribut : heures de production des ressources communes. */
  tributeHours: 6,
  /** Délai de réponse à l'ultimatum. */
  answerHours: 12,
  /** Trajet du raid après un refus. */
  raidTravelHours: 2,
  /** Force du raid : puissance défensive × (base + parPoint × Notoriété). */
  basePct: 0.7,
  perNotorietyPct: 0.1,
  maxNotoriety: 8,
  /** Force minimale (bases sans défense) : fixe + par niveau de bâtiment. */
  floorPower: 300,
  floorPerBuildingLevel: 40,
  /** Pillage en cas de défaite : part des ressources communes. */
  lootPct: 0.1,
  /** Raid repoussé : prime (heures de production), XP, débris par point de puissance détruit. */
  bountyHours: 4,
  bountyXp: 25,
  debrisPerPower: 1,
  /** Repaire de Varan. */
  raidsForLair: 5,
  lairPct: 1.5,
  lairRewardHours: 24,
  lairRare: 300,
  lairXp: 100,
  lairTitle: "Fléau de la Confrérie",
};

export const PIRATE_OWNER_UID = "pirates";
export const PIRATE_LAIR_UID = "pirates_lair";
export const PIRATE_RAIDER = "Le Silencieux";
export const PIRATE_LAIR_NAME = "Repaire de Varan";

export interface PirateUltimatum {
  tribute: Partial<Record<ResourceId, number>>;
  issuedAtMs: number;
  expiresAtMs: number;
}

export interface PirateState {
  notoriety: number;
  /** Raids repoussés depuis le dernier assaut du repaire. */
  repelled: number;
  lairOpen: boolean;
  nextListAtMs: number;
  ultimatum: PirateUltimatum | null;
  /** Un raid est en route (évite d'en lancer un second). */
  raidUntilMs: number;
  raidsWon: number;
  raidsLost: number;
  tributesPaid: number;
  lairsTaken: number;
}

export function pirateState(player: Pick<PlayerState, "pirates">): PirateState {
  const p = player.pirates;
  return {
    notoriety: Math.max(0, Math.min(PIRATE_RULES.maxNotoriety, p?.notoriety ?? 0)),
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

function hours(h: number): number {
  return h * 3600_000;
}

export function nextListDelay(random: () => number): number {
  const span = Math.max(0, PIRATE_RULES.maxIntervalHours - PIRATE_RULES.minIntervalHours);
  return hours(PIRATE_RULES.minIntervalHours + random() * span);
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

/** Puissance défensive actuelle d'une base (sans garnisons). */
export function defensivePower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return homeDefensePower(player.units ?? {}, player.techLevels ?? {});
}

/** Force du raid du Silencieux contre ce joueur. */
export function raidPower(player: PlayerState, notoriety: number): number {
  const levels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const floor = PIRATE_RULES.floorPower + PIRATE_RULES.floorPerBuildingLevel * levels;
  const pct = PIRATE_RULES.basePct + PIRATE_RULES.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, defensivePower(player) * pct));
}

function note(kind: NewNotification["kind"], title: string, message: string, now: number): NewNotification {
  return { kind, title, message, createdAtMs: now, read: false };
}

export interface PirateTickOutput {
  changed: boolean;
  /** Raid à lancer (refus implicite : l'ultimatum a expiré). */
  raid: { power: number; arriveAtMs: number } | null;
  notifications: NewNotification[];
}

/** Passage périodique du serveur : inscription sur la Liste, expiration de
 *  l'ultimatum (raid lancé). Modifie `player.pirates`. */
export function pirateTick(player: PlayerState, now: number, random: () => number = Math.random, force = false): PirateTickOutput {
  const out: PirateTickOutput = { changed: false, raid: null, notifications: [] };
  if (!PIRATE_RULES.enabled) return out;
  const st = pirateState(player);

  if (st.ultimatum && now >= st.ultimatum.expiresAtMs) {
    const raid = launchRaid(player, st, now, random);
    out.raid = raid;
    out.changed = true;
    out.notifications.push(
      note("fleet", "Le Silencieux arrive", `Tu n'as pas répondu à Varan : un raid pirate frappera ta base dans ${Math.max(1, Math.round(PIRATE_RULES.raidTravelHours * 60))} min.`, now),
    );
    return out;
  }
  if (!st.nextListAtMs && !force) {
    st.nextListAtMs = now + nextListDelay(random);
    player.pirates = st;
    out.changed = true;
    return out;
  }
  // force : inscription immédiate demandée par l'administration.
  const eligible =
    !st.ultimatum &&
    st.raidUntilMs <= now &&
    (force ||
      (now >= st.nextListAtMs &&
    now - (player.createdAtMs ?? 0) >= hours(72) &&
    now - (player.resourcesUpdatedAtMs ?? 0) <= hours(PIRATE_RULES.activeWithinHours)));
  if (!eligible) return out;
  const tribute = productionHours(player, PIRATE_RULES.tributeHours);
  st.ultimatum = { tribute, issuedAtMs: now, expiresAtMs: now + hours(PIRATE_RULES.answerHours) };
  player.pirates = st;
  out.changed = true;
  out.notifications.push(
    note(
      "fleet",
      "Ton nom est sur la Liste",
      `Le capitaine Varan exige un tribut de ${formatInt(Object.values(tribute).reduce((a, b) => a + (b ?? 0), 0))} ressources. Réponds avant ${PIRATE_RULES.answerHours} h, ou le Silencieux viendra se servir.`,
      now,
    ),
  );
  return out;
}

function launchRaid(player: PlayerState, st: PirateState, now: number, random: () => number): { power: number; arriveAtMs: number } {
  const power = raidPower(player, st.notoriety);
  const arriveAtMs = now + hours(PIRATE_RULES.raidTravelHours);
  st.ultimatum = null;
  st.raidUntilMs = arriveAtMs;
  st.nextListAtMs = arriveAtMs + nextListDelay(random);
  player.pirates = st;
  return { power, arriveAtMs };
}

/** Réponse du joueur à l'ultimatum (production rattrapée avant). */
export function answerUltimatum(
  player: PlayerState,
  answer: "pay" | "refuse",
  now: number,
  random: () => number = Math.random,
): { raid: { power: number; arriveAtMs: number } | null; notifications: NewNotification[] } {
  const st = pirateState(player);
  if (!st.ultimatum || now >= st.ultimatum.expiresAtMs) throw new GameActionError("Aucun ultimatum en attente.");
  if (answer === "pay") {
    for (const [res, amount] of Object.entries(st.ultimatum.tribute) as [ResourceId, number][]) {
      if ((player.resources[res] ?? 0) < amount) throw new GameActionError("Tu n'as pas de quoi payer le tribut : refuse, ou trouve les ressources à temps.");
    }
    for (const [res, amount] of Object.entries(st.ultimatum.tribute) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) - amount;
    st.ultimatum = null;
    st.tributesPaid += 1;
    st.nextListAtMs = now + nextListDelay(random);
    player.pirates = st;
    return { raid: null, notifications: [note("fleet", "Tribut payé", "Varan raye ton nom de la Liste… pour l'instant.", now)] };
  }
  const raid = launchRaid(player, st, now, random);
  return {
    raid,
    notifications: [note("fleet", "Tu as refusé", `Le Silencieux et ses corsaires sont en route : impact dans ${Math.round(PIRATE_RULES.raidTravelHours * 60)} min. Prépare tes défenses !`, now)],
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

export function resolvePirateRaid(
  playerIn: PlayerState,
  queuesIn: QueuesState,
  power: number,
  garrisons: (CombatGarrison & { ownerUid: string; ownerPseudo: string })[],
  now: number,
): PirateRaidOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player);
  const combat = resolveCombat({
    attackerUnits: {},
    attackerTechLevels: {},
    attackerRepairPct: 0,
    fleet: {},
    attackerPowerOverride: power,
    defenderUnits: player.units ?? {},
    defenderTechLevels: player.techLevels ?? {},
    defenderRepairPct: getRepairPercent(player.buildings),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
    defenderResources: {},
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
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
    for (const res of COMMON_RESOURCES) {
      const exposed = Math.max(0, (player.resources[res] ?? 0) - protectedAmount(player.buildings, res));
      const taken = Math.floor(exposed * PIRATE_RULES.lootPct);
      if (taken > 0) {
        loot[res] = taken;
        player.resources[res] = (player.resources[res] ?? 0) - taken;
      }
    }
    st.raidsLost += 1;
    st.notoriety = Math.max(0, st.notoriety - 1);
    player.lastDefeatAtMs = now;
    notifications.push(note("combat-defender", "Pillé par la Confrérie", `Le Silencieux a forcé tes défenses et emporté ${formatInt(Object.values(loot).reduce((a, b) => a + (b ?? 0), 0))} ressources.`, now));
  } else {
    bounty = productionHours(player, PIRATE_RULES.bountyHours);
    for (const [res, amount] of Object.entries(bounty) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, PIRATE_RULES.bountyXp, now);
    const destroyed = power * combat.attackerLossPercent;
    debris = { scrap: Math.floor(destroyed * PIRATE_RULES.debrisPerPower), energy: Math.floor((destroyed * PIRATE_RULES.debrisPerPower) / 2) };
    st.raidsWon += 1;
    st.repelled += 1;
    st.notoriety = Math.min(PIRATE_RULES.maxNotoriety, st.notoriety + 1);
    player.victories = (player.victories ?? 0) + 1;
    const lairNow = !st.lairOpen && st.repelled >= PIRATE_RULES.raidsForLair;
    if (lairNow) st.lairOpen = true;
    notifications.push(
      note(
        "combat-defender",
        combat.outcome === "draw" ? "Raid pirate repoussé de justesse" : "Raid pirate repoussé !",
        `Prime : ${formatInt(Object.values(bounty).reduce((a, b) => a + (b ?? 0), 0))} ressources et +${PIRATE_RULES.bountyXp} XP. Notoriété ${st.notoriety}.`,
        now,
      ),
    );
    if (lairNow) notifications.push(note("fleet", "Le repaire de Varan est localisé", "Après tant d'échecs, la position du repaire a fuité. Lance l'assaut depuis la page Menaces !", now));
  }
  player.pirates = st;

  const report: Omit<BattleReport, "id"> = {
    attackerUid: PIRATE_OWNER_UID,
    attackerPseudo: `${PIRATE_RAIDER} (Confrérie du Vide)`,
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
    defenderXpDelta: combat.outcome === "attacker_win" ? 0 : PIRATE_RULES.bountyXp,
    garrisons: garrisons.map((g, i) => ({ ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: combat.garrisonLosses?.[i] ?? {} })),
  };
  return { player, queues: flushed.queues, combat, loot, bounty, debris, report, notifications };
}

/* ---------- repaire de Varan ---------- */

/** Puissance du repaire, fixée au lancement de l'assaut. */
export function lairPower(player: PlayerState): number {
  return Math.round(Math.max(PIRATE_RULES.floorPower * 3, defensivePower(player) * PIRATE_RULES.lairPct));
}

export function checkLairLaunch(player: PlayerState, fleet: Record<string, unknown>): Record<string, number> {
  if (!pirateState(player).lairOpen) throw new GameActionError("Le repaire de Varan n'est pas encore localisé.");
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

/** Assaut du repaire : les unités de la flotte (déjà parties) combattent la
 *  puissance fixée au lancement. Récompense et titre en cas de victoire. */
export function resolveLairAssault(playerIn: PlayerState, queuesIn: QueuesState, fleet: Record<string, number>, power: number, now: number): LairAssaultOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player);
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
    const reward = productionHours(player, PIRATE_RULES.lairRewardHours);
    for (const r of ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"] as ResourceId[]) reward[r] = (reward[r] ?? 0) + PIRATE_RULES.lairRare;
    for (const [res, amount] of Object.entries(reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, PIRATE_RULES.lairXp, now);
    const title = PIRATE_RULES.lairTitle;
    if (title && !(player.titles ?? []).some((t) => t.label === title)) {
      player.titles = [...(player.titles ?? []), { label: title, seasonId: "pirates", rank: 1 }];
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
        "Le repaire de Varan est tombé !",
        `Butin du repaire : ${formatInt(Object.values(reward).reduce((a, b) => a + (b ?? 0), 0))} ressources, +${PIRATE_RULES.lairXp} XP et le titre « ${title} ». Varan s'est enfui… la Liste continue.`,
        now,
      ),
    );
  } else {
    player.defeats = (player.defeats ?? 0) + 1;
    notifications.push(note("combat-attacker", "Assaut repoussé", "Les défenses du repaire ont tenu. Les survivants rentrent ; le repaire reste localisé.", now));
  }
  player.pirates = st;
  const report: Omit<BattleReport, "id"> = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: PIRATE_LAIR_UID,
    defenderPseudo: PIRATE_LAIR_NAME,
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
    attackerXpDelta: combat.outcome === "attacker_win" ? PIRATE_RULES.lairXp : 0,
    defenderXpDelta: 0,
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications };
}
