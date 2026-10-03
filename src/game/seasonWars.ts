import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { productionHours } from "@/game/pirates";
import { bountyState } from "@/game/bounties";
import { currentSeasonId } from "@/game/seasons";
import { COMMON_RESOURCES } from "@/game/economy";
import type { PlayerState, ResourceId } from "@/types/game";
import type { AllianceWar } from "@/game/wars";

/* =====================================================
   v5.1 : guerres de saison et coffre de guerre.

   Classement de guerre (par saison) : points des guerres d'alliance de la
   saison + 1 point par 10 000 de puissance ennemie détruite + 50 points
   par secteur tenu à la clôture. Podium : 48 / 24 / 12 h de production des
   membres versées au trésor, et un titre d'alliance.

   Coffre de guerre : chaque objectif du jour réussi y verse 10 % du bonus
   du trésor (en plus du trésor), plafonné à 30 jours de dépôts. Il sert à
   déclarer une guerre sans toucher au trésor, ou à offrir un bouclier de
   2 h à un membre (coût : 4 h de sa production).
===================================================== */

export const SEASON_WAR_RULES = {
  powerPerPoint: 10_000,
  sectorPoints: 50,
  /** Heures de production des membres versées au trésor, 1er à 3e. */
  rewardHours: [48, 24, 12],
  titles: ["Conquérants de la saison", "Stratèges de la saison", "Vétérans de la saison"],
};

export const WAR_CHEST_RULES = {
  depositPct: 0.1,
  capDays: 30,
  shieldHours: 2,
  shieldCostHours: 4,
};

type Res = Partial<Record<ResourceId, number>>;

export interface WarChest {
  resources: Res;
  /** Plafond par ressource (30 fois le dernier dépôt). */
  cap: Res;
}

export function readWarChest(raw: unknown): WarChest {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<WarChest>;
  return { resources: { ...(c.resources ?? {}) }, cap: { ...(c.cap ?? {}) } };
}

/** Objectif du jour réussi : 10 % du bonus du trésor rejoint le coffre (plafonné). */
export function depositWarChest(chest: WarChest, treasuryBonus: Res): Res {
  const added: Res = {};
  for (const [res, n] of Object.entries(treasuryBonus) as [ResourceId, number][]) {
    const part = Math.floor((n ?? 0) * WAR_CHEST_RULES.depositPct);
    if (part <= 0) continue;
    const cap = Math.max(chest.cap[res] ?? 0, part * WAR_CHEST_RULES.capDays);
    chest.cap[res] = cap;
    const before = chest.resources[res] ?? 0;
    const after = Math.min(cap, before + part);
    chest.resources[res] = after;
    if (after > before) added[res] = after - before;
  }
  return added;
}

function spend(chest: WarChest, cost: Res, what: string): void {
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) {
    if ((chest.resources[res] ?? 0) < (n ?? 0)) throw new GameActionError(`Coffre de guerre insuffisant pour ${what} : il faut ${formatInt(n ?? 0)} ${res}.`);
  }
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) chest.resources[res] = (chest.resources[res] ?? 0) - (n ?? 0);
}

/** Déclaration de guerre payée par le coffre (même coût qu'au trésor). */
export function payWarFromChest(chest: WarChest, cost: Res): void {
  spend(chest, cost, "déclarer la guerre");
}

/** Coût du bouclier offert à un membre : 4 h de sa production (ressources communes). */
export function chestShieldCost(member: Pick<PlayerState, "buildings" | "techLevels">): Res {
  const prod = productionHours(member, WAR_CHEST_RULES.shieldCostHours);
  const out: Res = {};
  for (const r of COMMON_RESOURCES) if ((prod[r] ?? 0) > 0) out[r] = Math.ceil(prod[r] ?? 0);
  return out;
}

/** Bouclier de 2 h offert par le coffre (Voile : aucune attaque ne peut le viser). */
export function grantChestShield(chest: WarChest, member: PlayerState, now: number): { cost: Res; untilMs: number } {
  const cost = chestShieldCost(member);
  spend(chest, cost, "ce bouclier");
  const st = bountyState(member);
  st.shieldUntilMs = Math.max(st.shieldUntilMs, now) + WAR_CHEST_RULES.shieldHours * 3600_000;
  member.bounties = st;
  return { cost, untilMs: st.shieldUntilMs };
}

/* ---------- classement de guerre de saison ---------- */

/** Puissance ennemie détruite pendant la saison en cours (compteur remis à zéro à chaque saison). */
export function addSeasonPower(player: PlayerState, amount: number, now: number): void {
  if (!(amount > 0)) return;
  const stats = (player.stats ?? {}) as NonNullable<PlayerState["stats"]>;
  const season = currentSeasonId(now);
  if (stats.seasonPowerId !== season) {
    stats.seasonPowerId = season;
    stats.seasonPower = 0;
  }
  stats.seasonPower = (stats.seasonPower ?? 0) + Math.round(amount);
  player.stats = stats;
}

export function seasonPowerOf(player: Pick<PlayerState, "stats">, seasonId: string): number {
  const s = player.stats as { seasonPowerId?: string; seasonPower?: number } | undefined;
  return s?.seasonPowerId === seasonId ? s.seasonPower ?? 0 : 0;
}

/** Points de guerre de chaque alliance sur les guerres de la saison (son camp dans chaque guerre). */
export function seasonWarPoints(wars: Pick<AllianceWar, "attackerId" | "defenderId" | "scoreAttacker" | "scoreDefender" | "seasonId">[], seasonId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of wars) {
    if (w.seasonId !== seasonId) continue;
    out[w.attackerId] = (out[w.attackerId] ?? 0) + (w.scoreAttacker ?? 0);
    out[w.defenderId] = (out[w.defenderId] ?? 0) + (w.scoreDefender ?? 0);
  }
  return out;
}

export interface SeasonWarStanding {
  allianceId: string;
  warPoints: number;
  power: number;
  powerPoints: number;
  sectors: number;
  score: number;
  rank: number;
}

export function seasonWarStandings(input: { warPoints: Record<string, number>; power: Record<string, number>; sectors: Record<string, number> }): SeasonWarStanding[] {
  const ids = new Set([...Object.keys(input.warPoints), ...Object.keys(input.power), ...Object.keys(input.sectors)].filter(Boolean));
  return [...ids]
    .map((allianceId) => {
      const warPoints = input.warPoints[allianceId] ?? 0;
      const power = input.power[allianceId] ?? 0;
      const powerPoints = Math.floor(power / SEASON_WAR_RULES.powerPerPoint);
      const sectors = input.sectors[allianceId] ?? 0;
      return { allianceId, warPoints, power, powerPoints, sectors, score: warPoints + powerPoints + sectors * SEASON_WAR_RULES.sectorPoints, rank: 0 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || (a.allianceId < b.allianceId ? -1 : 1))
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
