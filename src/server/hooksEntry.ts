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
export { fleetDelayMs, performLaunch, performFleetReturn, performTransportArrival, recallFleet, patrolTurnaround } from "@/game/fleets";
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
export { applyStaffTitle, BALANCE_EXCLUDED_PSEUDOS, DEFAULT_STAFF_BY_PSEUDO, isStaffRole, normalizeStaff, STAFF_KEY } from "@/game/staff";
export { addReportComment, applyStaffUpdate, assertReportQuota, githubIssueBody, reportStatusLabel, sanitizeNewReport } from "@/game/reports";
export { addOccurrence, AUTO_ERROR_RULES, AUTO_REPORTER_ID, autoReportDescription, autoReportTitle, errorKey, errorQuotaKey, sanitizeClientError } from "@/game/errorReports";
export { acceptOffer, buyOrderPaid, createOffer, describeAmount, fillBuyOrder, MARKET_RULES, offerReserved, refundOffer, utcDayStart } from "@/game/market";
export { RESOURCE_LIST } from "@/game/resources";
export { addAmberToPot, addToPot, emptyServerPot, giftTax, normalizeServerPot, SERVER_POT_KEY, takeAmberFromPot, takeFromPot } from "@/game/serverPot";
export { isFormation } from "@/game/formations";
export { assertMessageQuota, MESSAGE_RULES, sanitizeMessageText } from "@/game/messages";
export { addContribution, CHALLENGE_KEY, CHALLENGE_RULES, CHALLENGE_TYPES, challengeMetrics, challengeRanking, challengeClaimable, challengeRewardees, challengeTier, challengeTierIndex, claimChallengeReward, grantChallengeReward, unclaimedRewardees, isLeviathanWeek, normalizeChallengeState, removeChallengeTitle, startChallenge, weekWindow } from "@/game/challenges";
export { BOSS_HISTORY_KEY, bossHistoryEntry, normalizeBossHistory, pushBossHistory } from "@/game/bossHistory";
export { answerPact, bindingPactBetween, breakPact, DIPLOMACY_RULES, pactOpen, proposePact, sanitizePactMessage } from "@/game/diplomacy";
export { activeWarBetween, concludeWar, declareWar, scoreBattle, surrender, WAR_RULES, warSeasonBonuses, warTreasuryReward } from "@/game/wars";
export { describeGain, EXPEDITION_RULES, finishExpedition, resolveExpeditionChoice, rollExpeditionEvent } from "@/game/expeditions";
export { checkLeviathanLaunch, closeLeviathan, grantLeviathanReward, LEVIATHAN_KEY, LEVIATHAN_RULES, leviathanRanking, leviathanSchedule, leviathanWindow, inferKilledBy, rescheduleBoss, endingReminderDue, normalizeLeviathan, recordLeviathanTimeline, removeLeviathanTitle, resizeLeviathan, reactToBossFeed, resolveLeviathanAssault, seasonBossFlightMinutes, spawnLeviathan, worldBossForStart, worldBossName, worldBossOf, worldBossTitle } from "@/game/leviathan";
export { completeFleetReturn } from "@/game/fleets";
export { formatInt } from "@/game/format";
export { extendUltimatums, MAINTENANCE_KEY, maintenanceShouldAutoEnd, maintenanceShouldAutoStart, nextMaintenance, normalizeMaintenance, scheduleMaintenance, startScheduledMaintenance } from "@/game/maintenance";

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
export { anomalyChance, COMMANDER_XP, grantCommanderXp, RARE_OFFICER_RULES, rollRareOfficer, adminGrantOfficer } from "@/game/commanders";
export { clearDecoy, recordDecoy } from "@/game/synthesis";
export { addRelic, expeditionRelicChance, grantMythicRelic, makeRelic, mythicFor, relicLabel, rollRelic } from "@/game/relics";
export { addCapsule, CAPSULES } from "@/game/synthesis";
export { describeLoot, LOOT_TABLES, rollLoot } from "@/game/loot";
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
  adaptWarlord,
  warlordPowerAlerts,
  recordWarlordHistory,
  inVendetta,
  isWarlordUid,
  lossesPower,
  nearestWarlord,
  nextAttackDelayMs,
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
  warlordPublic,
  warlordReference,
  warlordsConfig,
  warlordsState,
  warlordTravelMs,
  warlordUid,
  warlordRankRules,
  ascendantRelic,
} from "@/game/warlords";
export { addThreat, dropRank, rankOf, RANK_NAMES, RANK_NUMERALS } from "@/game/warlordRanks";
export { recordVendettaWin, refreshEliteUnlocks } from "@/game/eliteUnits";
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
export { compileGazette, GAZETTE_KEY, gazetteDue, gazettePrevious, gazetteSince, gazetteSnapshots, gazetteState, publishGazette } from "@/game/gazette";
export {
  bossMonthOf,
  checkSeasonBossLaunch,
  chronicleMonthId,
  chroniclesConfig,
  grantSeasonBossReward,
  SEASON_BOSS_KEY,
  SEASON_BOSS_RULES,
  seasonBossSchedule,
  seasonBossWindow,
  spawnSeasonBoss,
} from "@/game/chronicles";
export { bossesFoughtBy, claimCodexCategory, CODEX_TITLE, codexEntries, codexProgress, foughtWarlords, grantCodexTitle } from "@/game/codex";
export { ALLIANCE_DAILY_RULES, dailyMemberOf, dailyPhase, dailyTreasuryBonus, previousSummary, proposeDaily, readDaily, startDaily, updateDailyProgress, voteDaily } from "@/game/allianceDaily";
export { parisDay } from "@/game/retention";
export { allianceRole, canDiplomacy, canDiplomacyIn, removeMember } from "@/game/alliances";
export { acceptTradeContract, cancelTradeContract, completeTradeContract, contractDeposit, createTradeContract, failTradeContract, TRADE_CONTRACT_RULES } from "@/game/tradeContracts";
export { computeTerritories, SECTOR_COUNT, sectorLabel, sectorOf, TERRITORY_RULES } from "@/game/territories";
export { closeTerritoryWar, isTerritoryWarActive, normalizeTerritoryWar, openTerritoryWar, scoreHoldHour, scoreTerritoryWar, TERRITORY_WAR_KEY, TERRITORY_WAR_RULES, territoryWarRewards, territoryWarWindow } from "@/game/territoryWar";
export { addSeasonPower, chestShieldCost, depositWarChest, grantChestShield, readWarChest, SEASON_WAR_RULES, seasonPowerOf, seasonWarPoints, seasonWarStandings, WAR_CHEST_RULES } from "@/game/seasonWars";
export { cleanNewPseudo, pseudoLogin, RENAME_RULES, renamePlayer } from "@/game/rename";
export { computeLiveBalance } from "@/game/balance/diagnostics";
export { currentGameContent, validateGameContent, validateRules } from "@/game/content";
export { episodeUnlockMs } from "@/game/chronicles";
export { BOSS_REMINDERS, bossEndLabel, bossWindows, eveReminderDue, parisRelativeLabel, parisWhenLabel } from "@/game/events";
export { autoDraftMonths, findPassSeason, generatePassSeason, hasFullChallenges, regenerateChallenges, nextMonthId, PASS_SEASONS_SECTION, passSeasonAllowed, publishPassSeason, upsertPassSeason } from "@/game/passSeasons";
export { chapterDifficulty, parisDayOfMonth, generateChapter, monthsToGenerate, normalizeProcedural, PROCEDURAL_KEY, proposeAchievementTiers, worldDigest } from "@/game/procedural";
export { clearOfficerCooldowns, finishAllTimers, grantResources } from "@/game/adminTools";
export { BALANCE_HISTORY_KEY, balanceSnapshot, pushSnapshot } from "@/game/balance/history";
export { defaultGameContent } from "@/game/content";
export { getProductionRatesPerSecond } from "@/game/production";
export { COMMON_RESOURCES } from "@/game/economy";
export { ALLIANCE_SAGA_KEY, ALLIANCE_SAGA_RULES, generateAllianceSaga, readAllianceSaga, sagaMonthId, sagaOf, sagaPoints, sagaProgress, sagaStandings } from "@/game/allianceSaga";
// v5.8 : devblog (pages rendues par PocketBase).
export { blogPostFromRecord, publicPosts, shortHash, slugify, isPublic } from "@/game/blog";
export { renderBlogList, renderBlogPost, renderBlogNotFound, renderBlogRss, renderBlogSitemap, renderBlogRobots } from "@/game/blogPages";
export { BLOG_CSS, BLOG_JS } from "@/game/blogStyles";
export { GAME_EMOJIS, normalizeCustomEmojis, EMOJIS_KEY } from "@/game/emojis";
export { KESH_EMOJIS } from "@/game/bounties";
export { BLOG_WELCOME } from "@/game/blogWelcome";
export { challengeFromBytes, cleanPasskeyName, clientChallenge, PASSKEY_RULES, PasskeyError, utf8Encode as passkeyUtf8, verifyAssertion, verifyRegistration } from "@/game/webauthn";
export { CONTESTS_KEY, contestAmberPurse, contestPhase, contestPrizes, contestPurse, normalizeContests, pruneContests, refreshContest, validateContest } from "@/game/contests";
export { broadcastTargets, validateBroadcast } from "@/game/broadcast";
export { ALLIANCE_CHALLENGE_KEY, ALLIANCE_CHALLENGE_REWARDS, allianceChallengeReward, findAllianceChallenge, normalizeAllianceChallenge, refreshAllianceChallenge, startAllianceChallengeWeek } from "@/game/allianceChallenge";
export { allianceWeekId } from "@/game/allianceBoss";
export { championTitle, grantLeagueTitle, leagueInfo, LEAGUES_KEY, leagueTick, leagueWeekLabel, normalizeLeagues } from "@/game/leagues";
export { applySpin, bossTokens, CASINO_KEY, casinoOpen, casinoOpeningId, challengeTokens, claimDailyTokens, giveTitle, grantTokens, removeTitle, rollTournament, scoreSpin, tokensLabel, tournamentResult, jackpotAmounts, normalizeCasino, normalizeCasinoSettings, playerCasino, recordWin, reelsFor, rollOutcome, validateCasinoSettings } from "@/game/casino";
export { LOGIC_VERSION, PB_SCHEMA } from "@/game/logicVersion";
export { addVitals, cronStatus, cronSummary, normalizeCronMetrics, recordCronRun, sanitizeVitals, vitalsReport, METRICS_KEYS } from "@/game/serverMetrics";
export { upcomingMaintenance } from "@/game/maintenance";
export { activeBan, allowedWhileBanned, banMessage, banPlayer, MODERATION_KEYS, normalizeBans, pruneBans, unbanPlayer } from "@/game/moderation";
export { ANNOUNCEMENTS_KEY, findPoll, normalizeAnnouncementSettings } from "@/game/announcements";
export { tally, validateVote } from "@/game/polls";
export { activeMute, addReport, CHAT_MODERATION_KEYS, cleanGlobalMessage, filterText, GLOBAL_CHAT_RULES, normalizeFilter, normalizeMutes, rateLimitError } from "@/game/globalChat";

export { computeCatchup, developmentScore } from "@/game/catchup";
export { lootTokensThisWeek } from "@/game/loot";
export { campaignsState, inSegment, instrumentHtml, MAIL_CAMPAIGNS_KEY, MAIL_HISTORY_MAX, MAIL_SCHEDULE_KEY, MAIL_SCHEDULE_MAX, normalizeSegment, scheduleState, trackCampaign } from "@/game/mailSegments";
export { canGoDeeper, deepLegMs, expeditionDepth, offerDeeper, resolveDeeper } from "@/game/expeditions";
export { signTreaty } from "@/game/pirates";
// 5.17.1 : audit de l'XP et de l'activité des joueurs (administration).
export { activityProfile, auditFlags, battlePairs, bestTotals, ledgerCovers, ledgerSince, ledgerTotals, missionXpCeiling, notifSource, notifXp, percentiles, windowMs, XP_SOURCE_LABELS } from "@/game/xpAudit";
export { MISSIONS } from "@/game/missions";
export { missionRewardFactor } from "@/game/events";
export { ONLINE_MS } from "@/game/retention";
// 5.18 : solde d'Ambre modifiable par l'administration.
export { adminSetAmber } from "@/game/bounties";
export { applyBossWear } from "@/game/workshop";
export { findUnit, OFFENSIVE_UNITS } from "@/game/units";
export { AUCTION_HISTORY_KEY, AUCTION_RULES, canCancel, creditBid, normalizeAuctionHistory, recordSale, validateWatch, watchersFor, currencyLabel, recordAuctionStat, debitBid, giveLot, placeBid, settleAuction, takeLot, validateListing } from "@/game/auctions";
