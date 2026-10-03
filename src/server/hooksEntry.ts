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
export { acceptOffer, buyOrderPaid, createOffer, describeAmount, fillBuyOrder, MARKET_RULES, offerReserved, refundOffer, utcDayStart } from "@/game/market";
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
export { addRelic, expeditionRelicChance, grantMythicRelic, mythicFor, rollRelic } from "@/game/relics";
export { publicShowcase } from "@/game/profile";
export { addPassPoints, PASS_POINTS } from "@/game/seasonPass";
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
export {
  ALLIANCE_BOSS_RULES,
  allianceBossDef,
  allianceBossRefund,
  callAllianceBoss,
  checkAllianceBossLaunch,
  grantAllianceBossReward,
  normalizeAllianceBoss,
} from "@/game/allianceBoss";
export {
  archiveCoalition,
  checkCoalitionTrigger,
  COALITION_RULES,
  coalitionRanking,
  empowerWarlord,
  grantCoalitionReward,
  readCoalitions,
  recordCoalitionDamage,
  settleCoalition,
  writeCoalitions,
} from "@/game/coalition";
export { compileGazette, GAZETTE_KEY, gazetteDue, gazetteState, publishGazette } from "@/game/gazette";
export {
  bossMonthOf,
  checkSeasonBossLaunch,
  chronicleMonthId,
  chroniclesConfig,
  grantSeasonBossReward,
  SEASON_BOSS_KEY,
  SEASON_BOSS_RULES,
  seasonBossWindow,
  spawnSeasonBoss,
} from "@/game/chronicles";
export { CODEX_TITLE, codexEntries, codexProgress, foughtWarlords, grantCodexTitle } from "@/game/codex";
export { ALLIANCE_DAILY_RULES, dailyMemberOf, dailyPhase, dailyTreasuryBonus, previousSummary, proposeDaily, readDaily, startDaily, updateDailyProgress, voteDaily } from "@/game/allianceDaily";
export { parisDay } from "@/game/retention";
export { allianceRole, canDiplomacy } from "@/game/alliances";
export { acceptTradeContract, cancelTradeContract, completeTradeContract, contractDeposit, createTradeContract, failTradeContract, TRADE_CONTRACT_RULES } from "@/game/tradeContracts";
export { computeTerritories, SECTOR_COUNT, sectorOf, TERRITORY_RULES } from "@/game/territories";
export { addSeasonPower, chestShieldCost, depositWarChest, grantChestShield, readWarChest, SEASON_WAR_RULES, seasonPowerOf, seasonWarPoints, seasonWarStandings, WAR_CHEST_RULES } from "@/game/seasonWars";
export { pseudoLogin, RENAME_RULES, renamePlayer } from "@/game/rename";
export { computeLiveBalance } from "@/game/balance/diagnostics";
export { currentGameContent, validateGameContent } from "@/game/content";
export { episodeUnlockMs } from "@/game/chronicles";
export { chapterDifficulty, generateChapter, monthsToGenerate, normalizeProcedural, PROCEDURAL_KEY, proposeAchievementTiers, worldDigest } from "@/game/procedural";
export { clearOfficerCooldowns, finishAllTimers, grantResources } from "@/game/adminTools";
export { BALANCE_HISTORY_KEY, balanceSnapshot, pushSnapshot } from "@/game/balance/history";
export { defaultGameContent } from "@/game/content";
