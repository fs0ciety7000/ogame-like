import { homeDefensePower } from "@/game/combat";
import { TUTORIAL_RAID as TUTORIAL_RAID_RULES } from "@/game/story";
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
export { performLaunch, performFleetReturn, performTransportArrival, recallFleet, patrolTurnaround } from "@/game/fleets";
export { resolveSpyArrival } from "@/game/espionage";
export { ALLIANCE_RULES, allianceNextDueMs, allianceStandings, finishAllianceResearch, performAllianceAction } from "@/game/alliances";
export { stationGarrison, endGarrison } from "@/game/fleets";
export { currentSeasonId, performSeasonReward, previousSeasonId, seasonRewardFor, seasonStandings, seasonXpFor, SEASON_RULES } from "@/game/seasons";
export { collectDebris, debrisTotal, mergeDebris, recyclerCapacity } from "@/game/debris";
export { defaultQueues } from "@/game/defaults";
export { parseResetOptions, resetPlayerState } from "@/game/reset";
export { activeUltimatum, answerUltimatum, FACTIONS, factionOfLair, findFaction, PIRATE_OWNER_UID, PIRATE_RULES, pirateTick, resolveLairAssault, resolvePirateRaid } from "@/game/pirates";
export { GAME_FIELDS, QUEUE_FIELDS } from "@/game/playerFields";
export { PVP_RULES } from "@/game/pvp";
export { applyGameContent, CONTENT_SECTIONS } from "@/game/content";
export { applyStaffTitle, DEFAULT_STAFF_BY_PSEUDO, isStaffRole, normalizeStaff, STAFF_KEY } from "@/game/staff";
export { addReportComment, applyStaffUpdate, assertReportQuota, githubIssueBody, reportStatusLabel, sanitizeNewReport } from "@/game/reports";
export { addOccurrence, AUTO_ERROR_RULES, AUTO_REPORTER_ID, autoReportDescription, autoReportTitle, errorKey, errorQuotaKey, sanitizeClientError } from "@/game/errorReports";
export { acceptOffer, createOffer, describeAmount, MARKET_RULES, refundOffer, utcDayStart } from "@/game/market";
export { isFormation } from "@/game/formations";
export { assertMessageQuota, MESSAGE_RULES, sanitizeMessageText } from "@/game/messages";
export { addContribution, CHALLENGE_KEY, CHALLENGE_RULES, CHALLENGE_TYPES, challengeMetrics, challengeRanking, challengeRewardees, challengeTier, grantChallengeReward, isLeviathanWeek, normalizeChallengeState, removeChallengeTitle, startChallenge, weekWindow } from "@/game/challenges";
export { answerPact, bindingPactBetween, breakPact, DIPLOMACY_RULES, pactOpen, proposePact, sanitizePactMessage } from "@/game/diplomacy";
export { activeWarBetween, concludeWar, declareWar, scoreBattle, surrender, WAR_RULES, warSeasonBonuses, warTreasuryReward } from "@/game/wars";
export { describeGain, EXPEDITION_RULES, finishExpedition, resolveExpeditionChoice, rollExpeditionEvent } from "@/game/expeditions";
export { checkLeviathanLaunch, closeLeviathan, grantLeviathanReward, LEVIATHAN_KEY, LEVIATHAN_RULES, leviathanRanking, leviathanWindow, normalizeLeviathan, recordLeviathanTimeline, removeLeviathanTitle, resizeLeviathan, resolveLeviathanAssault, spawnLeviathan } from "@/game/leviathan";
export { completeFleetReturn } from "@/game/fleets";
export { formatInt } from "@/game/format";
export { extendUltimatums, MAINTENANCE_KEY, maintenanceShouldAutoEnd, nextMaintenance, normalizeMaintenance } from "@/game/maintenance";

import { flushState } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import type { PlayerState, QueuesState } from "@/types/game";

/** Production et files rattrapées (avant une écriture hors action de jeu). */
export function flushPlayer(player: PlayerState, queues: QueuesState, now: number) {
  return flushState({ ...player, buildings: withMissingBuildings(player.buildings, player.resources) }, queues, now);
}
export { ANOMALY_RULES, describeAnomalies, detectResourceAnomalies } from "@/game/anomalies";
export { colonyOwnerUid } from "@/game/colonies";
export {
  assertKeshEmojis,
  buyShopItem,
  checkEliteLaunch,
  closeElite,
  describeElite,
  ELITE_KEY,
  ELITE_RULES,
  eliteNotice,
  eliteRanking,
  eliteWindow,
  exchangeAmber,
  grantEliteReward,
  normalizeElite,
  releaseBounty,
  resolveBountyHunt,
  resolveEliteAssault,
  spawnElite,
  consumeBeacon,
  consumeJammer,
} from "@/game/bounties";
export { beaconReturn, bountyIdOf, unitsAwayOf } from "@/game/fleets";
export { anomalyChance, COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
export { clearDecoy, recordDecoy } from "@/game/synthesis";
export { addRelic, expeditionRelicChance, rollRelic } from "@/game/relics";
export { publicShowcase } from "@/game/profile";
export { addPassPoints } from "@/game/seasonPass";
export { grantReferral, linkReferrer, referralDue, REFERRAL_RULES } from "@/game/referral";
export { TUTORIAL_RAID } from "@/game/story";

/** v4.1 : puissance du raid scripté de Varan (un quart de la défense, gagné à coup sûr). */
export function tutorialRaidPower(player: PlayerState): number {
  return Math.max(TUTORIAL_RAID_RULES.minPower, Math.round(homeDefensePower(player.units ?? {}, player.techLevels ?? {}) * TUTORIAL_RAID_RULES.powerPct));
}
export {
  activeVendetta,
  canMessage,
  emptyRuntime,
  empirePower,
  findWarlord,
  growWarlord,
  inVendetta,
  isWarlordUid,
  lossesPower,
  nearestWarlord,
  nextAttackDelayMs,
  nextMarketDelayMs,
  openVendetta,
  pickWarlordTarget,
  recordVendettaDamage,
  settleVendettas,
  shatterWarlord,
  vendettaTitle,
  vendettaWinners,
  WARLORD_RULES,
  warlordByUid,
  warlordFleetPower,
  warlordLine,
  warlordLootCap,
  warlordOffer,
  warlordPublic,
  warlordReference,
  warlordsConfig,
  warlordsState,
  warlordTravelMs,
  warlordUid,
} from "@/game/warlords";
export { endVacation, onVacation, startVacation, VACATION_RULES } from "@/game/vacation";
export { productionHours } from "@/game/pirates";
