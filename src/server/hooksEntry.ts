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
export { collectDebris, debrisTotal, mergeDebris, recyclerCapacity } from "@/game/debris";
export { defaultQueues } from "@/game/defaults";
export { GAME_FIELDS, QUEUE_FIELDS } from "@/game/playerFields";
export { PVP_RULES } from "@/game/pvp";
export { applyGameContent, CONTENT_SECTIONS } from "@/game/content";
