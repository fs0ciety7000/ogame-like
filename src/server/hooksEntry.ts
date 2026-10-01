/* Point d'entrée compilé pour les hooks PocketBase (npm run build:hooks →
 * pocketbase/pb_hooks/cosmic_game.js). Uniquement de la logique pure :
 * les lectures/écritures en base sont faites par pb_hooks/cosmic.pb.js. */
export { performAttack } from "@/game/attack";
export {
  performPlayerAction,
  performGift,
  newPlayerProfile,
  applyLegacyBattleReport,
  applyLegacyGift,
} from "@/game/actions";
export { GameActionError } from "@/game/errors";
export { computeGameStats } from "@/game/analytics";
export { performLaunch, performFleetReturn, recallFleet, patrolTurnaround } from "@/game/fleets";
export { resolveSpyArrival } from "@/game/espionage";
export { ALLIANCE_RULES, allianceStandings, finishAllianceResearch, performAllianceAction } from "@/game/alliances";
export { stationGarrison, endGarrison } from "@/game/fleets";
export { performSeasonReward, previousSeasonId, seasonRewardFor, seasonStandings, seasonXpFor, SEASON_RULES } from "@/game/seasons";
export { collectDebris, debrisTotal, mergeDebris, recyclerCapacity } from "@/game/debris";
export { defaultQueues } from "@/game/defaults";
export { parseResetOptions, resetPlayerState } from "@/game/reset";
export { answerUltimatum, FACTIONS, factionOfLair, findFaction, PIRATE_OWNER_UID, PIRATE_RULES, pirateTick, resolveLairAssault, resolvePirateRaid } from "@/game/pirates";
export { GAME_FIELDS, QUEUE_FIELDS } from "@/game/playerFields";
export { PVP_RULES } from "@/game/pvp";
export { applyGameContent, CONTENT_SECTIONS } from "@/game/content";
export { applyStaffTitle, DEFAULT_STAFF_BY_PSEUDO, isStaffRole, normalizeStaff, STAFF_KEY } from "@/game/staff";
export { extendUltimatums, MAINTENANCE_KEY, nextMaintenance, normalizeMaintenance } from "@/game/maintenance";

import { flushState } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import type { PlayerState, QueuesState } from "@/types/game";

/** Production et files rattrapées (avant une écriture hors action de jeu). */
export function flushPlayer(player: PlayerState, queues: QueuesState, now: number) {
  return flushState({ ...player, buildings: withMissingBuildings(player.buildings, player.resources) }, queues, now);
}
