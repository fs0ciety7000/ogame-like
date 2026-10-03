import { resolveCombat, computeFleetPower } from "@/game/combat";
import { addRelic, expeditionRelicChance, relicLabel, rollRelic } from "@/game/relics";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { getRepairPercent } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import { describeGain, formatInt } from "@/game/format";
export { describeGain };
import { formationEffects } from "@/game/formations";
import { FACTIONS, pirateState, productionHours, setFactionState } from "@/game/pirates";
import { applyXpDelta } from "@/game/seasons";
import { bumpStat } from "@/game/stats";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import type { NewNotification } from "@/game/flush";
import type { Fleet } from "@/game/fleets";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Expéditions narratives (v3.1) : une flotte part 2, 4 ou 8 h dans
   l'inconnu. Deux événements sont tirés au sort, à mi-parcours puis à la
   fin. Les récompenses se comptent en heures de production du joueur, pour
   rester utiles à tous les niveaux. Une rencontre de faction demande un
   choix (30 min pour répondre, sinon le choix prudent s'applique).
===================================================== */

export const EXPEDITION_RULES = {
  minShips: 10,
  durations: [2, 4, 8],
  maxPerDay: 3,
  choiceMinutes: 30,
  xpPerHour: 60,
  /** Probabilités relatives des événements. */
  weights: { nothing: 15, deposit: 35, rare: 15, wreck: 10, ambush: 15, faction: 10 },
  /** Gisement : heures de production commune. */
  depositMinHours: 1,
  depositMaxHours: 3,
  /** Trésor : heures de production commune converties en ressources rares (50 pour 1). */
  rareMinHours: 0.5,
  rareMaxHours: 1,
  rareRate: 50,
  /** Épave : part de la flotte envoyée récupérée en unités gratuites. */
  wreckMinPct: 0.02,
  wreckMaxPct: 0.05,
  /** Embuscade : puissance adverse en part de la puissance de la flotte. */
  ambushMinPower: 0.4,
  ambushMaxPower: 0.7,
  /** Butin d'une embuscade repoussée ou d'un passage forcé (heures de production). */
  victoryLootHours: 2,
  /** Passage forcé face à une faction : puissance adverse. */
  forceMinPower: 0.5,
  forceMaxPower: 0.8,
  /** Péage demandé par une faction : heures de production commune. */
  tollHours: 1,
};

export type ExpeditionEventKind = keyof typeof EXPEDITION_RULES.weights;

export interface ExpeditionLogEntry {
  stage: 1 | 2;
  atMs: number;
  kind: ExpeditionEventKind;
  text: string;
  /** Choix fait face à une faction. */
  choice?: "toll" | "force";
}

export interface ExpeditionState {
  hours: number;
  log: ExpeditionLogEntry[];
  /** Rencontre en attente d'une décision. */
  pending: { stage: 1 | 2; factionId: string; deadlineMs: number; toll: Partial<Record<ResourceId, number>> } | null;
  formation?: string;
}

export type ExpeditionFleet = Omit<Fleet, "id"> & { id?: string; expedition: ExpeditionState };

const between = (min: number, max: number, random: () => number) => min + (max - min) * random();
const sum = (r: Partial<Record<string, number>>) => Object.values(r).reduce((a: number, b) => a + (b ?? 0), 0);

function addLoot(fleet: ExpeditionFleet, gain: Partial<Record<ResourceId, number>>) {
  const loot = { ...(fleet.loot ?? {}) };
  for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) if (n > 0) loot[res] = (loot[res] ?? 0) + Math.floor(n);
  fleet.loot = loot;
}

/** Liste lisible : « 1 200 ferraille, 300 énergie ». */
export function fleetShips(units: Record<string, number>): number {
  return Object.entries(units).reduce((a, [id, n]) => a + (id === "sonde_espionnage" ? 0 : n), 0);
}

/** Lancement : vérifie les limites et retire les vaisseaux de la base. */
export function launchExpedition(owner: PlayerState, raw: Record<string, unknown>, hoursIn: unknown, active: number, today: number, now: number, formation?: string): { attacker: PlayerState; fleet: ExpeditionFleet } {
  const hours = Number(hoursIn);
  if (!EXPEDITION_RULES.durations.includes(hours)) throw new GameActionError(`Durée d'expédition invalide (${EXPEDITION_RULES.durations.join(", ")} h).`);
  if (active > 0) throw new GameActionError("Une expédition est déjà en cours.");
  if (today >= EXPEDITION_RULES.maxPerDay) throw new GameActionError(`Limite de ${EXPEDITION_RULES.maxPerDay} expéditions par jour atteinte.`);
  const units: Record<string, number> = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    const qty = Math.floor(Number(v));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(id) || id === "sonde_espionnage") throw new GameActionError("Seuls les vaisseaux de combat et de transport partent en expédition.");
    if ((owner.units[id]?.count ?? 0) < qty) throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
    units[id] = qty;
  }
  if (fleetShips(units) < EXPEDITION_RULES.minShips) throw new GameActionError(`Il faut au moins ${EXPEDITION_RULES.minShips} vaisseaux pour une expédition.`);
  for (const [id, qty] of Object.entries(units)) owner.units[id] = { ...owner.units[id], count: owner.units[id].count - qty };
  const durationMs = hours * 3600_000;
  return {
    attacker: owner,
    fleet: {
      ownerUid: owner.uid,
      ownerPseudo: owner.pseudo,
      targetUid: owner.uid,
      targetPseudo: "Expédition",
      mission: "expedition",
      units,
      departAtMs: now,
      arriveAtMs: now + durationMs / 2,
      returnAtMs: null,
      status: "outbound",
      loot: null,
      reportId: "",
      outcome: "",
      recalled: false,
      durationMs,
      expedition: { hours, log: [], pending: null, formation: formation ?? "balanced" },
    },
  };
}

function pickEvent(random: () => number): ExpeditionEventKind {
  const entries = Object.entries(EXPEDITION_RULES.weights) as [ExpeditionEventKind, number][];
  const total = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
  let roll = random() * total;
  for (const [k, w] of entries) {
    roll -= Math.max(0, w);
    if (roll < 0) return k;
  }
  return "nothing";
}

/** Combat de la flotte d'expédition contre une puissance fixe. Les pertes sont retirées de la flotte. */
function fightFleet(player: PlayerState, fleet: ExpeditionFleet, ratio: number): { won: boolean; lost: number } {
  const fleetPower = computeFleetPower(player.units, player.techLevels, fleet.units, ["attack"]);
  const fx = formationEffects(fleet.expedition.formation);
  const combat = resolveCombat({
    ...fx,
    attackFactor: fx.attackFactor * (1 + playerModifiers(player).attack),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet: fleet.units,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: Math.max(1, Math.round(fleetPower * ratio)),
  });
  let lost = 0;
  const units = { ...fleet.units };
  for (const [id, n] of Object.entries(combat.attackerLosses)) {
    units[id] = Math.max(0, (units[id] ?? 0) - n);
    lost += n;
  }
  fleet.units = units;
  return { won: combat.outcome === "attacker_win", lost };
}

/** Tirage et application d'un événement. Renvoie le texte et, pour une rencontre, la décision attendue. */
export function rollExpeditionEvent(player: PlayerState, fleet: ExpeditionFleet, stage: 1 | 2, now: number, random: () => number): { text: string; pending: boolean } {
  const R = EXPEDITION_RULES;
  const kind = pickEvent(random);
  let text = "";
  if (kind === "nothing") {
    text = "Calme plat : rien d'intéressant dans ce secteur.";
  } else if (kind === "deposit") {
    const gain = productionHours(player, between(R.depositMinHours, R.depositMaxHours, random));
    addLoot(fleet, gain);
    text = `Gisement repéré et exploité : ${describeGain(gain)}.`;
  } else if (kind === "rare") {
    const value = sum(productionHours(player, between(R.rareMinHours, R.rareMaxHours, random)));
    const each = Math.max(1, Math.floor(value / Math.max(1, R.rareRate) / 4));
    const gain = { reinforcedSteel: each, cyberModule: each, syntheticNanites: each, aiFragment: each };
    addLoot(fleet, gain);
    text = `Trésor rare dans une station abandonnée : ${describeGain(gain)}.`;
  } else if (kind === "wreck") {
    const pct = between(R.wreckMinPct, R.wreckMaxPct, random);
    const found: Record<string, number> = {};
    for (const [id, n] of Object.entries(fleet.units)) {
      const extra = Math.floor(n * pct);
      if (extra > 0) found[id] = extra;
    }
    if (Object.keys(found).length === 0) {
      const first = Object.keys(fleet.units)[0];
      if (first) found[first] = 1;
    }
    fleet.units = Object.fromEntries(Object.entries(fleet.units).map(([id, n]) => [id, n + (found[id] ?? 0)]));
    text = `Épave remise en état : ${Object.entries(found).map(([id, n]) => `${n} ${findUnit(id)?.name ?? id}`).join(", ")} rejoignent la flotte.`;
  } else if (kind === "ambush") {
    const { won, lost } = fightFleet(player, fleet, between(R.ambushMinPower, R.ambushMaxPower, random));
    if (won) {
      const gain = productionHours(player, R.victoryLootHours);
      addLoot(fleet, gain);
      text = `Embuscade repoussée (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Butin : ${describeGain(gain)}.`;
    } else {
      text = `Embuscade ! La flotte a dû fuir (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}).`;
    }
  } else {
    const faction = FACTIONS.length > 0 ? FACTIONS[Math.floor(random() * FACTIONS.length) % FACTIONS.length] : null;
    if (!faction) {
      text = "Des signaux lointains, puis plus rien.";
    } else {
      const toll = productionHours(player, R.tollHours);
      fleet.expedition.pending = { stage, factionId: faction.id, deadlineMs: now + R.choiceMinutes * 60_000, toll };
      text = `${faction.name} barre la route et exige un péage de ${describeGain(toll)}.`;
      fleet.expedition.log = [...fleet.expedition.log, { stage, atMs: now, kind, text }];
      return { text, pending: true };
    }
  }
  fleet.expedition.log = [...fleet.expedition.log, { stage, atMs: now, kind, text }];
  return { text, pending: false };
}

/** Décision face à une faction (le joueur, ou « péage » par défaut à l'échéance). */
export function resolveExpeditionChoice(player: PlayerState, fleet: ExpeditionFleet, choiceIn: unknown, now: number, random: () => number): string {
  const pending = fleet.expedition.pending;
  if (!pending) throw new GameActionError("Aucune décision en attente pour cette expédition.");
  const choice = choiceIn === "force" ? "force" : "toll";
  const faction = FACTIONS.find((f) => f.id === pending.factionId);
  const name = faction?.name ?? "La faction";
  let text: string;
  const st = faction ? pirateState(player, faction.id) : null;
  if (choice === "toll") {
    const paid: Partial<Record<ResourceId, number>> = {};
    for (const [res, n] of Object.entries(pending.toll) as [ResourceId, number][]) {
      const take = Math.min(n, Math.max(0, Math.floor(player.resources[res] ?? 0)));
      if (take > 0) {
        player.resources[res] -= take;
        paid[res] = take;
      }
    }
    if (st) st.notoriety = Math.max(0, st.notoriety - 1);
    text = `Péage payé à ${name} (${describeGain(paid)}) : la flotte passe, et ta réputation s'améliore.`;
  } else {
    const { won, lost } = fightFleet(player, fleet, between(EXPEDITION_RULES.forceMinPower, EXPEDITION_RULES.forceMaxPower, random));
    if (st && faction) st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    if (won) {
      const gain = productionHours(player, EXPEDITION_RULES.victoryLootHours);
      addLoot(fleet, gain);
      text = `Passage forcé face à ${name} (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Butin : ${describeGain(gain)}. Ta notoriété grimpe.`;
    } else {
      text = `${name} a repoussé la flotte (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Ta notoriété grimpe.`;
    }
  }
  if (st && faction) setFactionState(player, faction.id, st);
  fleet.expedition.log = [...fleet.expedition.log, { stage: pending.stage, atMs: now, kind: "faction", text, choice }];
  fleet.expedition.pending = null;
  return text;
}

/** Fin de l'expédition : XP créditée (les survivants et le butin rentrent via completeFleetReturn). */
export function finishExpedition(player: PlayerState, fleet: ExpeditionFleet, now: number, random: () => number = Math.random): NewNotification {
  const xp = Math.round(fleet.expedition.hours * EXPEDITION_RULES.xpPerHour);
  applyXpDelta(player, xp, now);
  bumpStat(player, "expeditions");
  // v4.0 : une relique, parfois (5 % à 2 h, jusqu'à 15 % à 8 h).
  let relic = "";
  if (random() < expeditionRelicChance(fleet.expedition.hours)) {
    const item = rollRelic("expedition", now, random);
    if (addRelic(player, item)) relic = ` Relique trouvée : ${relicLabel(item)} !`;
  }
  return {
    kind: "fleet",
    title: relic ? "Expédition terminée : relique !" : "Expédition terminée",
    message: `Ta flotte est rentrée : ${describeGain(fleet.loot ?? {})} et +${xp} XP.${relic}`,
    createdAtMs: now,
    read: false,
  };
}

