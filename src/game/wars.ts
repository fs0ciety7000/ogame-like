import { allianceRole } from "@/game/alliances";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import type { Alliance, CombatOutcome, ResourceId } from "@/types/game";

/* =====================================================
   Guerres d'alliance (v3.2) : un fondateur ou un officier déclare la
   guerre à une autre alliance (au moins 3 membres), contre 5 M de ferraille
   et 5 M d'énergie du trésor. 12 h de préparation, puis 72 h de guerre :
   le délai entre deux attaques sur une même cible passe à 1 h entre les
   deux camps, chaque combat rapporte des points. Le vainqueur gagne un
   butin pour son trésor, un bonus d'XP de saison d'alliance et un titre.
   Le camp qui le souhaite peut se rendre.
===================================================== */

export const WAR_RULES = {
  minMembers: 3,
  costScrap: 5_000_000,
  costEnergy: 5_000_000,
  prepHours: 12,
  durationHours: 72,
  /** Délai avant de refaire la guerre au même adversaire (jours après la fin). */
  pairCooldownDays: 7,
  /** Délai entre deux attaques d'un joueur sur une même cible, pendant la guerre (h). */
  attackCooldownHours: 1,
  pointsAttackWin: 3,
  pointsDefenseWin: 2,
  /** 1 point par tranche de butin. */
  lootPerPoint: 10_000_000,
  rewardScrap: 20_000_000,
  rewardEnergy: 20_000_000,
  /** Bonus sur le score de saison d'alliance du vainqueur (0,1 = +10 %). */
  seasonBonusPct: 0.1,
  title: "Vainqueurs",
  titleDays: 7,
};

export type WarStatus = "preparing" | "active" | "ended";
export type WarSide = "attacker" | "defender";

export interface WarLogEntry {
  atMs: number;
  text: string;
}

export interface AllianceWar {
  id: string;
  attackerId: string;
  attackerName: string;
  attackerTag: string;
  defenderId: string;
  defenderName: string;
  defenderTag: string;
  declaredById: string;
  declaredByPseudo: string;
  declaredAtMs: number;
  startMs: number;
  endMs: number;
  status: WarStatus;
  scoreAttacker: number;
  scoreDefender: number;
  log: WarLogEntry[];
  winnerId: string;
  surrenderedBy: string;
  endedAtMs: number;
  rewarded: boolean;
  /** Saison (AAAA-MM) où le bonus de victoire compte. */
  seasonId: string;
  /** Fin du titre des vainqueurs. */
  titleUntilMs: number;
}

const HOUR = 3600_000;

/** Statut à un instant donné (d'après les horaires ; « ended » reste final). */
export function warStatusAt(war: Pick<AllianceWar, "status" | "startMs" | "endMs">, now: number): WarStatus {
  if (war.status === "ended") return "ended";
  if (now < war.startMs) return "preparing";
  if (now < war.endMs) return "active";
  return "ended";
}

function isRunning(war: Pick<AllianceWar, "status" | "startMs" | "endMs">, now: number) {
  return warStatusAt(war, now) !== "ended";
}

/** Guerre active (hors préparation) entre deux alliances, s'il y en a une. */
export function activeWarBetween<T extends Pick<AllianceWar, "attackerId" | "defenderId" | "status" | "startMs" | "endMs">>(wars: T[], a: string | null | undefined, b: string | null | undefined, now: number): T | null {
  if (!a || !b || a === b) return null;
  return wars.find((w) => warStatusAt(w, now) === "active" && ((w.attackerId === a && w.defenderId === b) || (w.attackerId === b && w.defenderId === a))) ?? null;
}

export function sideOf(war: Pick<AllianceWar, "attackerId" | "defenderId">, allianceId: string): WarSide | null {
  return war.attackerId === allianceId ? "attacker" : war.defenderId === allianceId ? "defender" : null;
}

/** Déclaration : vérifications et débit du trésor. Renvoie la guerre (sans id). */
export function declareWar(input: {
  actorUid: string;
  actorPseudo: string;
  own: Alliance;
  target: Alliance;
  /** Guerres (toutes) impliquant l'une ou l'autre alliance. */
  wars: Pick<AllianceWar, "attackerId" | "defenderId" | "status" | "startMs" | "endMs" | "endedAtMs">[];
  now: number;
}): { war: Omit<AllianceWar, "id">; own: Alliance } {
  const { own, target, now } = input;
  const role = allianceRole(own, input.actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent déclarer une guerre.");
  if (own.id === target.id) throw new GameActionError("Tu ne peux pas déclarer la guerre à ta propre alliance.");
  if ((target.members ?? []).length < WAR_RULES.minMembers) throw new GameActionError(`Cette alliance compte moins de ${WAR_RULES.minMembers} membres.`);
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === own.id || w.defenderId === own.id))) throw new GameActionError("Ton alliance est déjà en guerre.");
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === target.id || w.defenderId === target.id))) throw new GameActionError(`[${target.tag}] est déjà en guerre.`);
  const lastPair = input.wars
    .filter((w) => (w.attackerId === own.id && w.defenderId === target.id) || (w.attackerId === target.id && w.defenderId === own.id))
    .reduce((a, w) => Math.max(a, w.endedAtMs || w.endMs), 0);
  const wait = lastPair + WAR_RULES.pairCooldownDays * 24 * HOUR - now;
  if (lastPair > 0 && wait > 0) throw new GameActionError(`Dernière guerre contre [${target.tag}] trop récente : encore ${Math.ceil(wait / (24 * HOUR))} jour(s).`);
  const treasury = { ...(own.treasury ?? {}) } as Partial<Record<ResourceId, number>>;
  if ((treasury.scrap ?? 0) < WAR_RULES.costScrap || (treasury.energy ?? 0) < WAR_RULES.costEnergy) {
    throw new GameActionError(`Il faut ${formatInt(WAR_RULES.costScrap)} ferraille et ${formatInt(WAR_RULES.costEnergy)} énergie dans le trésor.`);
  }
  treasury.scrap = (treasury.scrap ?? 0) - WAR_RULES.costScrap;
  treasury.energy = (treasury.energy ?? 0) - WAR_RULES.costEnergy;
  const startMs = now + WAR_RULES.prepHours * HOUR;
  return {
    own: { ...own, treasury },
    war: {
      attackerId: own.id,
      attackerName: own.name,
      attackerTag: own.tag,
      defenderId: target.id,
      defenderName: target.name,
      defenderTag: target.tag,
      declaredById: input.actorUid,
      declaredByPseudo: input.actorPseudo,
      declaredAtMs: now,
      startMs,
      endMs: startMs + WAR_RULES.durationHours * HOUR,
      status: "preparing",
      scoreAttacker: 0,
      scoreDefender: 0,
      log: [{ atMs: now, text: `${input.actorPseudo} déclare la guerre à [${target.tag}] ${target.name}.` }],
      winnerId: "",
      surrenderedBy: "",
      endedAtMs: 0,
      rewarded: false,
      seasonId: "",
      titleUntilMs: 0,
    },
  };
}

/** Points d'un combat entre les deux camps (attaquant au sens du combat). */
export function scoreBattle(
  war: AllianceWar,
  attackerAllianceId: string,
  attackerPseudo: string,
  defenderPseudo: string,
  outcome: CombatOutcome,
  lootTotal: number,
  now: number,
): AllianceWar {
  const side = sideOf(war, attackerAllianceId);
  if (!side || warStatusAt(war, now) !== "active") return war;
  const other: WarSide = side === "attacker" ? "defender" : "attacker";
  let points = 0;
  let to: WarSide = side;
  let text = "";
  if (outcome === "attacker_win") {
    points = WAR_RULES.pointsAttackWin + Math.floor(Math.max(0, lootTotal) / WAR_RULES.lootPerPoint);
    text = `${attackerPseudo} l'emporte contre ${defenderPseudo} (+${points}).`;
  } else if (outcome === "defender_win") {
    points = WAR_RULES.pointsDefenseWin;
    to = other;
    text = `${defenderPseudo} repousse ${attackerPseudo} (+${points}).`;
  } else return war;
  const next = { ...war, log: [...war.log, { atMs: now, text }].slice(-100) };
  if (to === "attacker") next.scoreAttacker += points;
  else next.scoreDefender += points;
  return next;
}

/** Reddition : le camp de `allianceId` se rend, l'autre gagne. */
export function surrender(war: AllianceWar, alliance: Alliance, actorUid: string, actorPseudo: string, now: number): AllianceWar {
  const side = sideOf(war, alliance.id);
  if (!side) throw new GameActionError("Ton alliance ne participe pas à cette guerre.");
  if (!isRunning(war, now)) throw new GameActionError("Cette guerre est terminée.");
  const role = allianceRole(alliance, actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent se rendre.");
  const winnerId = side === "attacker" ? war.defenderId : war.attackerId;
  return { ...war, status: "ended", winnerId, surrenderedBy: alliance.id, endedAtMs: now, log: [...war.log, { atMs: now, text: `${actorPseudo} rend les armes au nom de [${alliance.tag}].` }] };
}

/** Échéance : vainqueur au score (égalité = pas de vainqueur). */
export function concludeWar(war: AllianceWar, now: number): AllianceWar {
  if (war.status === "ended" || now < war.endMs) return war;
  const winnerId = war.scoreAttacker > war.scoreDefender ? war.attackerId : war.scoreDefender > war.scoreAttacker ? war.defenderId : "";
  const text = winnerId ? `Fin de la guerre : victoire de [${winnerId === war.attackerId ? war.attackerTag : war.defenderTag}] (${war.scoreAttacker} – ${war.scoreDefender}).` : `Fin de la guerre : égalité (${war.scoreAttacker} – ${war.scoreDefender}).`;
  return { ...war, status: "ended", winnerId, endedAtMs: now, log: [...war.log, { atMs: now, text }] };
}

/** Récompense du vainqueur : trésor. Le titre et le bonus de saison sont posés par le serveur. */
export function warTreasuryReward(alliance: Alliance): Alliance {
  const treasury = { ...(alliance.treasury ?? {}) } as Partial<Record<ResourceId, number>>;
  treasury.scrap = (treasury.scrap ?? 0) + WAR_RULES.rewardScrap;
  treasury.energy = (treasury.energy ?? 0) + WAR_RULES.rewardEnergy;
  return { ...alliance, treasury };
}

/** Bonus de score de saison par alliance (guerres gagnées pendant la saison). */
export function warSeasonBonuses(wars: Pick<AllianceWar, "winnerId" | "seasonId">[], seasonId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of wars) if (w.winnerId && w.seasonId === seasonId) out[w.winnerId] = (out[w.winnerId] ?? 0) + WAR_RULES.seasonBonusPct;
  return out;
}
