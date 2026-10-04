// FICHIER GÉNÉRÉ par `npm run build:hooks` depuis src/game — ne pas modifier à la main.

if (typeof structuredClone === "undefined") {
  var structuredClone = function (v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
}
if (!Object.entries) Object.entries = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); };
if (!Object.values) Object.values = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (e) { o[e[0]] = e[1]; }); return o; };
if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { var s = String(this); c = c === undefined ? " " : String(c); while (s.length < n) s = c + s; return s.slice(-Math.max(n, String(this).length)); };

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/server/hooksEntry.ts
var hooksEntry_exports = {};
__export(hooksEntry_exports, {
  ALLIANCE_BOSS_RULES: () => ALLIANCE_BOSS_RULES,
  ALLIANCE_DAILY_RULES: () => ALLIANCE_DAILY_RULES,
  ALLIANCE_RULES: () => ALLIANCE_RULES,
  ALLIANCE_SAGA_KEY: () => ALLIANCE_SAGA_KEY,
  ALLIANCE_SAGA_RULES: () => ALLIANCE_SAGA_RULES,
  ANOMALY_RULES: () => ANOMALY_RULES,
  AUTO_ERROR_RULES: () => AUTO_ERROR_RULES,
  AUTO_REPORTER_ID: () => AUTO_REPORTER_ID,
  BALANCE_HISTORY_KEY: () => BALANCE_HISTORY_KEY,
  BLOG_CSS: () => BLOG_CSS,
  BLOG_JS: () => BLOG_JS,
  BLOG_WELCOME: () => BLOG_WELCOME,
  CHALLENGE_KEY: () => CHALLENGE_KEY,
  CHALLENGE_RULES: () => CHALLENGE_RULES,
  CHALLENGE_TYPES: () => CHALLENGE_TYPES,
  COALITION_RULES: () => COALITION_RULES,
  CODEX_TITLE: () => CODEX_TITLE,
  COMMANDER_XP: () => COMMANDER_XP,
  COMMON_RESOURCES: () => COMMON_RESOURCES2,
  CONTENT_SECTIONS: () => CONTENT_SECTIONS,
  DEFAULT_STAFF_BY_PSEUDO: () => DEFAULT_STAFF_BY_PSEUDO,
  DIPLOMACY_RULES: () => DIPLOMACY_RULES,
  ELITE_KEY: () => ELITE_KEY,
  ELITE_RULES: () => ELITE_RULES,
  EMOJIS_KEY: () => EMOJIS_KEY,
  EXPEDITION_RULES: () => EXPEDITION_RULES,
  FACTIONS: () => FACTIONS,
  GAME_EMOJIS: () => GAME_EMOJIS,
  GAME_FIELDS: () => GAME_FIELDS,
  GAZETTE_KEY: () => GAZETTE_KEY,
  GameActionError: () => GameActionError,
  KESH_EMOJIS: () => KESH_EMOJIS,
  LEVIATHAN_KEY: () => LEVIATHAN_KEY,
  LEVIATHAN_RULES: () => LEVIATHAN_RULES,
  MAINTENANCE_KEY: () => MAINTENANCE_KEY,
  MARKET_MAKER_ID: () => MARKET_MAKER_ID,
  MARKET_MAKER_PSEUDO: () => MARKET_MAKER_PSEUDO,
  MARKET_RULES: () => MARKET_RULES,
  MESSAGE_RULES: () => MESSAGE_RULES,
  PASSKEY_RULES: () => PASSKEY_RULES,
  PASS_POINTS: () => PASS_POINTS,
  PIRATE_OWNER_UID: () => PIRATE_OWNER_UID,
  PIRATE_RULES: () => PIRATE_RULES,
  PROCEDURAL_KEY: () => PROCEDURAL_KEY,
  PVP_RULES: () => PVP_RULES,
  PasskeyError: () => PasskeyError,
  QUEUE_FIELDS: () => QUEUE_FIELDS,
  REFERRAL_RULES: () => REFERRAL_RULES,
  RENAME_RULES: () => RENAME_RULES,
  SEASON_BOSS_KEY: () => SEASON_BOSS_KEY,
  SEASON_BOSS_RULES: () => SEASON_BOSS_RULES,
  SEASON_RULES: () => SEASON_RULES,
  SEASON_WAR_RULES: () => SEASON_WAR_RULES,
  SECTOR_COUNT: () => SECTOR_COUNT,
  STAFF_KEY: () => STAFF_KEY,
  TERRITORY_RULES: () => TERRITORY_RULES,
  TRADE_CONTRACT_RULES: () => TRADE_CONTRACT_RULES,
  TUTORIAL_RAID: () => TUTORIAL_RAID,
  VACATION_RULES: () => VACATION_RULES,
  WARLORD_RULES: () => WARLORD_RULES,
  WAR_CHEST_RULES: () => WAR_CHEST_RULES,
  WAR_RULES: () => WAR_RULES,
  acceptOffer: () => acceptOffer,
  acceptTradeContract: () => acceptTradeContract,
  activeUltimatum: () => activeUltimatum,
  activeVendetta: () => activeVendetta,
  activeWarBetween: () => activeWarBetween,
  addContribution: () => addContribution,
  addOccurrence: () => addOccurrence,
  addPassPoints: () => addPassPoints,
  addRelic: () => addRelic,
  addReportComment: () => addReportComment,
  addSeasonPower: () => addSeasonPower,
  allianceBossDef: () => allianceBossDef,
  allianceBossRefund: () => allianceBossRefund,
  allianceNextDueMs: () => allianceNextDueMs,
  allianceRole: () => allianceRole,
  allianceStandings: () => allianceStandings,
  anomalyChance: () => anomalyChance,
  answerPact: () => answerPact,
  answerUltimatum: () => answerUltimatum,
  applyGameContent: () => applyGameContent,
  applyLegacyBattleReport: () => applyLegacyBattleReport,
  applyLegacyGift: () => applyLegacyGift,
  applyStaffTitle: () => applyStaffTitle,
  applyStaffUpdate: () => applyStaffUpdate,
  archiveCoalition: () => archiveCoalition,
  assertKeshEmojis: () => assertKeshEmojis,
  assertMessageQuota: () => assertMessageQuota,
  assertReportQuota: () => assertReportQuota,
  autoReportDescription: () => autoReportDescription,
  autoReportTitle: () => autoReportTitle,
  balanceSnapshot: () => balanceSnapshot,
  beaconReturn: () => beaconReturn,
  bindingPactBetween: () => bindingPactBetween,
  blogPostFromRecord: () => blogPostFromRecord,
  bossMonthOf: () => bossMonthOf,
  bountyIdOf: () => bountyIdOf,
  breakPact: () => breakPact,
  buyOrderPaid: () => buyOrderPaid,
  buyShopItem: () => buyShopItem,
  callAllianceBoss: () => callAllianceBoss,
  canDiplomacy: () => canDiplomacy,
  canMessage: () => canMessage,
  cancelTradeContract: () => cancelTradeContract,
  challengeFromBytes: () => challengeFromBytes,
  challengeMetrics: () => challengeMetrics,
  challengeRanking: () => challengeRanking,
  challengeRewardees: () => challengeRewardees,
  challengeTier: () => challengeTier,
  chapterDifficulty: () => chapterDifficulty,
  checkAllianceBossLaunch: () => checkAllianceBossLaunch,
  checkCoalitionTrigger: () => checkCoalitionTrigger,
  checkEliteLaunch: () => checkEliteLaunch,
  checkLeviathanLaunch: () => checkLeviathanLaunch,
  checkSeasonBossLaunch: () => checkSeasonBossLaunch,
  chestShieldCost: () => chestShieldCost,
  chronicleMonthId: () => chronicleMonthId,
  chroniclesConfig: () => chroniclesConfig,
  cleanNewPseudo: () => cleanNewPseudo,
  cleanPasskeyName: () => cleanPasskeyName,
  clearDecoy: () => clearDecoy,
  clearOfficerCooldowns: () => clearOfficerCooldowns,
  clientChallenge: () => clientChallenge,
  closeElite: () => closeElite,
  closeLeviathan: () => closeLeviathan,
  coalitionRanking: () => coalitionRanking,
  codexEntries: () => codexEntries,
  codexProgress: () => codexProgress,
  collectDebris: () => collectDebris,
  colonyOwnerUid: () => colonyOwnerUid,
  compileGazette: () => compileGazette,
  completeFleetReturn: () => completeFleetReturn,
  completeTradeContract: () => completeTradeContract,
  computeGameStats: () => computeGameStats,
  computeLiveBalance: () => computeLiveBalance,
  computeTerritories: () => computeTerritories,
  concludeWar: () => concludeWar,
  consumeBeacon: () => consumeBeacon,
  consumeJammer: () => consumeJammer,
  contractDeposit: () => contractDeposit,
  createOffer: () => createOffer,
  createTradeContract: () => createTradeContract,
  currentGameContent: () => currentGameContent,
  currentSeasonId: () => currentSeasonId,
  dailyMemberOf: () => dailyMemberOf,
  dailyPhase: () => dailyPhase,
  dailyTreasuryBonus: () => dailyTreasuryBonus,
  debrisTotal: () => debrisTotal,
  declareWar: () => declareWar,
  defaultGameContent: () => defaultGameContent,
  defaultQueues: () => defaultQueues,
  depositWarChest: () => depositWarChest,
  describeAmount: () => describeAmount,
  describeAnomalies: () => describeAnomalies,
  describeElite: () => describeElite,
  describeGain: () => describeGain,
  detectResourceAnomalies: () => detectResourceAnomalies,
  eliteNotice: () => eliteNotice,
  eliteRanking: () => eliteRanking,
  eliteWindow: () => eliteWindow,
  empirePower: () => empirePower,
  empowerWarlord: () => empowerWarlord,
  emptyRuntime: () => emptyRuntime,
  endGarrison: () => endGarrison,
  endVacation: () => endVacation,
  episodeUnlockMs: () => episodeUnlockMs,
  errorKey: () => errorKey,
  errorQuotaKey: () => errorQuotaKey,
  exchangeAmber: () => exchangeAmber,
  expeditionRelicChance: () => expeditionRelicChance,
  extendUltimatums: () => extendUltimatums,
  factionOfLair: () => factionOfLair,
  failTradeContract: () => failTradeContract,
  fillBuyOrder: () => fillBuyOrder,
  findFaction: () => findFaction,
  findWarlord: () => findWarlord,
  finishAllTimers: () => finishAllTimers,
  finishAllianceResearch: () => finishAllianceResearch,
  finishExpedition: () => finishExpedition,
  flushPlayer: () => flushPlayer,
  formatInt: () => formatInt,
  foughtWarlords: () => foughtWarlords,
  gazetteDue: () => gazetteDue,
  gazetteState: () => gazetteState,
  generateAllianceSaga: () => generateAllianceSaga,
  generateChapter: () => generateChapter,
  getProductionRatesPerSecond: () => getProductionRatesPerSecond,
  githubIssueBody: () => githubIssueBody,
  grantAllianceBossReward: () => grantAllianceBossReward,
  grantChallengeReward: () => grantChallengeReward,
  grantChestShield: () => grantChestShield,
  grantCoalitionReward: () => grantCoalitionReward,
  grantCodexTitle: () => grantCodexTitle,
  grantCommanderXp: () => grantCommanderXp,
  grantEliteReward: () => grantEliteReward,
  grantLeviathanReward: () => grantLeviathanReward,
  grantMythicRelic: () => grantMythicRelic,
  grantReferral: () => grantReferral,
  grantResources: () => grantResources,
  grantSeasonBossReward: () => grantSeasonBossReward,
  growWarlord: () => growWarlord,
  inVendetta: () => inVendetta,
  isFormation: () => isFormation,
  isLeviathanWeek: () => isLeviathanWeek,
  isMarketMaker: () => isMarketMaker,
  isPublic: () => isPublic,
  isStaffRole: () => isStaffRole,
  isWarlordUid: () => isWarlordUid,
  leviathanRanking: () => leviathanRanking,
  leviathanWindow: () => leviathanWindow,
  linkReferrer: () => linkReferrer,
  lossesPower: () => lossesPower,
  maintenanceShouldAutoEnd: () => maintenanceShouldAutoEnd,
  marketMakerPlayer: () => marketMakerPlayer,
  mergeDebris: () => mergeDebris,
  monthsToGenerate: () => monthsToGenerate,
  mythicFor: () => mythicFor,
  nearestWarlord: () => nearestWarlord,
  newPlayerProfile: () => newPlayerProfile,
  nextAttackDelayMs: () => nextAttackDelayMs,
  nextMaintenance: () => nextMaintenance,
  nextMarketDelayMs: () => nextMarketDelayMs,
  normalizeAllianceBoss: () => normalizeAllianceBoss,
  normalizeChallengeState: () => normalizeChallengeState,
  normalizeCustomEmojis: () => normalizeCustomEmojis,
  normalizeElite: () => normalizeElite,
  normalizeLeviathan: () => normalizeLeviathan,
  normalizeMaintenance: () => normalizeMaintenance,
  normalizeProcedural: () => normalizeProcedural,
  normalizeStaff: () => normalizeStaff,
  offerReserved: () => offerReserved,
  onVacation: () => onVacation,
  openVendetta: () => openVendetta,
  pactOpen: () => pactOpen,
  parisDay: () => parisDay,
  parseResetOptions: () => parseResetOptions,
  passkeyUtf8: () => utf8Encode,
  patrolTurnaround: () => patrolTurnaround,
  performAllianceAction: () => performAllianceAction,
  performAttack: () => performAttack,
  performFleetReturn: () => performFleetReturn,
  performGift: () => performGift,
  performLaunch: () => performLaunch,
  performPlayerAction: () => performPlayerAction,
  performSeasonReward: () => performSeasonReward,
  performTransportArrival: () => performTransportArrival,
  pickWarlordTarget: () => pickWarlordTarget,
  pirateTick: () => pirateTick,
  planMakerOffers: () => planMakerOffers,
  previousSeasonId: () => previousSeasonId,
  previousSummary: () => previousSummary,
  productionHours: () => productionHours,
  proposeAchievementTiers: () => proposeAchievementTiers,
  proposeDaily: () => proposeDaily,
  proposePact: () => proposePact,
  pseudoLogin: () => pseudoLogin,
  publicPosts: () => publicPosts,
  publicShowcase: () => publicShowcase,
  publishGazette: () => publishGazette,
  pushSnapshot: () => pushSnapshot,
  readAllianceSaga: () => readAllianceSaga,
  readCoalitions: () => readCoalitions,
  readDaily: () => readDaily,
  readWarChest: () => readWarChest,
  recallFleet: () => recallFleet,
  recordCoalitionDamage: () => recordCoalitionDamage,
  recordDecoy: () => recordDecoy,
  recordLeviathanTimeline: () => recordLeviathanTimeline,
  recordVendettaDamage: () => recordVendettaDamage,
  recyclerCapacity: () => recyclerCapacity,
  referralDue: () => referralDue,
  refundOffer: () => refundOffer,
  releaseBounty: () => releaseBounty,
  removeChallengeTitle: () => removeChallengeTitle,
  removeLeviathanTitle: () => removeLeviathanTitle,
  renamePlayer: () => renamePlayer,
  renderBlogList: () => renderBlogList,
  renderBlogNotFound: () => renderBlogNotFound,
  renderBlogPost: () => renderBlogPost,
  renderBlogRobots: () => renderBlogRobots,
  renderBlogRss: () => renderBlogRss,
  renderBlogSitemap: () => renderBlogSitemap,
  reportStatusLabel: () => reportStatusLabel,
  resetPlayerState: () => resetPlayerState,
  resizeLeviathan: () => resizeLeviathan,
  resolveBountyHunt: () => resolveBountyHunt,
  resolveEliteAssault: () => resolveEliteAssault,
  resolveExpeditionChoice: () => resolveExpeditionChoice,
  resolveLairAssault: () => resolveLairAssault,
  resolveLeviathanAssault: () => resolveLeviathanAssault,
  resolvePirateRaid: () => resolvePirateRaid,
  resolveSpyArrival: () => resolveSpyArrival,
  rollExpeditionEvent: () => rollExpeditionEvent,
  rollRelic: () => rollRelic,
  sagaMonthId: () => sagaMonthId,
  sagaOf: () => sagaOf,
  sagaPoints: () => sagaPoints,
  sagaProgress: () => sagaProgress,
  sagaStandings: () => sagaStandings,
  sanitizeClientError: () => sanitizeClientError,
  sanitizeMessageText: () => sanitizeMessageText,
  sanitizeNewReport: () => sanitizeNewReport,
  sanitizePactMessage: () => sanitizePactMessage,
  scoreBattle: () => scoreBattle,
  seasonBossWindow: () => seasonBossWindow,
  seasonPowerOf: () => seasonPowerOf,
  seasonRewardFor: () => seasonRewardFor,
  seasonStandings: () => seasonStandings,
  seasonWarPoints: () => seasonWarPoints,
  seasonWarStandings: () => seasonWarStandings,
  seasonXpFor: () => seasonXpFor,
  sectorOf: () => sectorOf,
  settleCoalition: () => settleCoalition,
  settleVendettas: () => settleVendettas,
  shatterWarlord: () => shatterWarlord,
  shortHash: () => shortHash,
  slugify: () => slugify,
  spawnElite: () => spawnElite,
  spawnLeviathan: () => spawnLeviathan,
  spawnSeasonBoss: () => spawnSeasonBoss,
  startChallenge: () => startChallenge,
  startDaily: () => startDaily,
  startVacation: () => startVacation,
  stationGarrison: () => stationGarrison,
  surrender: () => surrender,
  tutorialRaidPower: () => tutorialRaidPower,
  unitsAwayOf: () => unitsAwayOf,
  updateDailyProgress: () => updateDailyProgress,
  utcDayStart: () => utcDayStart,
  validateGameContent: () => validateGameContent,
  vendettaTitle: () => vendettaTitle,
  vendettaWinners: () => vendettaWinners,
  verifyAssertion: () => verifyAssertion,
  verifyRegistration: () => verifyRegistration,
  voteDaily: () => voteDaily,
  warSeasonBonuses: () => warSeasonBonuses,
  warTreasuryReward: () => warTreasuryReward,
  warlordByUid: () => warlordByUid,
  warlordFleetPower: () => warlordFleetPower,
  warlordLine: () => warlordLine,
  warlordLootCap: () => warlordLootCap,
  warlordOffer: () => warlordOffer,
  warlordPublic: () => warlordPublic,
  warlordReference: () => warlordReference,
  warlordTravelMs: () => warlordTravelMs,
  warlordUid: () => warlordUid,
  warlordsConfig: () => warlordsConfig,
  warlordsState: () => warlordsState,
  weekWindow: () => weekWindow,
  worldDigest: () => worldDigest,
  writeCoalitions: () => writeCoalitions
});
module.exports = __toCommonJS(hooksEntry_exports);

// src/game/technologies.ts
var ENDGAME_TECH_IDS = ["tech21", "tech22", "tech23", "tech24", "tech25"];
var TECH_EFFECT_DEFAULTS = {
  energy_efficiency: 0.1,
  unit_attack: 0.1,
  unit_defense: 0.1,
  building_discount: 0.05,
  resource_production: 0.1,
  storage_capacity: 0.1,
  protected_storage: 0.02,
  fleet_speed: 0.05,
  cargo_capacity: 0.1,
  building_time: 0.05,
  unit_time: 0.05,
  research_time: 0.05,
  fleet_upkeep: 0.05,
  counter_spy: 1,
  hangar_capacity: 0.05
};
var TECH_REDUCTION_CAP = 0.75;
var TECH_EFFECT_LABELS = {
  unlock_recipe: "D\xE9bloque des recettes (niveau = nombre de recettes)",
  energy_efficiency: "Production de toutes les ressources (% par niveau)",
  unit_attack: "Attaque de toutes les unit\xE9s (% par niveau)",
  unit_defense: "D\xE9fense de toutes les unit\xE9s (% par niveau)",
  building_discount: "Co\xFBt des b\xE2timents (\u2212% par niveau)",
  unlock_hangars: "D\xE9bloque les b\xE2timents li\xE9s (ancien nom de unlock_buildings)",
  unlock_buildings: "D\xE9bloque des b\xE2timents",
  unlock_next_level: "D\xE9bloque puis am\xE9liore une unit\xE9 (niveau = niveau de l'unit\xE9)",
  unlock_defense_units: "Pr\xE9requis pour des unit\xE9s de d\xE9fense (aucun effet direct)",
  unlock_attack_units: "Pr\xE9requis pour des unit\xE9s d'attaque (aucun effet direct)",
  resource_production: "Production d'une ressource (% par niveau)",
  storage_capacity: "Capacit\xE9 des entrep\xF4ts (% par niveau)",
  protected_storage: "Part de l'entrep\xF4t \xE0 l'abri du pillage (points de % par niveau)",
  fleet_speed: "Temps de vol des flottes (\u2212% par niveau)",
  cargo_capacity: "Cargaison des vaisseaux (% par niveau)",
  building_time: "Temps de construction des b\xE2timents (\u2212% par niveau)",
  unit_time: "Temps de construction des unit\xE9s (\u2212% par niveau)",
  research_time: "Temps de recherche (\u2212% par niveau)",
  fleet_upkeep: "Entretien de la flotte (\u2212% par niveau)",
  counter_spy: "Contre-espionnage (points par niveau)",
  hangar_capacity: "Capacit\xE9 des hangars d'attaque ou de d\xE9fense (% par niveau)"
};
var NUMERIC_TECH_EFFECTS = Object.keys(TECH_EFFECT_DEFAULTS);
var CAPPED_TECH_EFFECTS = ["building_discount", "fleet_speed", "building_time", "unit_time", "research_time", "fleet_upkeep", "protected_storage"];
var DEFAULT_TECHNOLOGIES = [
  { id: "tech1", nom: "Analyse de mat\xE9riaux", desc: "D\xE9bloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Am\xE9lioration \xE9nerg\xE9tique", desc: "Augmente l'efficacit\xE9 des g\xE9n\xE9rateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone r\xE9cup\xE9rateur", desc: "D\xE9bloque le Drone r\xE9cup\xE9rateur, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
  { id: "tech20", nom: "Espionnage", desc: "D\xE9bloque la Sonde d'espionnage, puis l'am\xE9liore : chaque niveau rend tes rapports plus complets et prot\xE8ge mieux ta base des sondes adverses.", maxLevel: 10, baseCost: { scrap: 300, energy: 150, data: 50 }, baseTime: 60, effect: "unlock_next_level", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech2", nom: "Blindage avanc\xE9", desc: "Renforce la r\xE9sistance des unit\xE9s.", maxLevel: 10, baseCost: { scrap: 300, nano: 50 }, baseTime: 60, effect: "unit_defense", prereq: { tech8: 1, tech14: 4 } },
  { id: "tech5", nom: "Puissance d'attaque", desc: "Augmente la puissance d'attaque de toutes les unit\xE9s.", maxLevel: 10, baseCost: { energy: 200, nano: 100 }, baseTime: 50, effect: "unit_attack", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech4", nom: "Optimisation industrielle", desc: "R\xE9duit le co\xFBt des am\xE9liorations de b\xE2timents.", maxLevel: 10, baseCost: { scrap: 400, data: 50 }, baseTime: 90, effect: "building_discount", prereq: { tech1: 5, tech3: 4 } },
  { id: "tech6", nom: "Infrastructure spatiale", desc: "D\xE9bloque les hangars orbitaux.", maxLevel: 1, baseCost: { scrap: 800, energy: 400, nano: 200 }, baseTime: 120, effect: "unlock_hangars", prereq: { tech4: 3, tech3: 5 } },
  { id: "tech11", nom: "Cargo", desc: "D\xE9bloque le Cargo, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 300, syntheticNanites: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech9: 3, tech6: 1 } },
  { id: "tech10", nom: "Fr\xE9gate", desc: "D\xE9bloque la Fr\xE9gate, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 400, energy: 100, cyberModule: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3, tech3: 2 } },
  { id: "tech14", nom: "Roquette", desc: "D\xE9bloque la Roquette, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 250, nano: 80 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3 } },
  { id: "tech8", nom: "Syst\xE8mes d\xE9fensifs", desc: "D\xE9bloque les unit\xE9s de d\xE9fense renforc\xE9es.", maxLevel: 4, baseCost: { scrap: 500, nano: 200, data: 100 }, baseTime: 70, effect: "unlock_defense_units", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech7", nom: "Armes exp\xE9rimentales", desc: "D\xE9bloque les unit\xE9s d'attaque avanc\xE9es.", maxLevel: 5, baseCost: { energy: 600, nano: 300, data: 150 }, baseTime: 75, effect: "unlock_attack_units", prereq: { tech5: 6, tech1: 8 } },
  { id: "tech12", nom: "Sentinelle", desc: "D\xE9bloque la Sentinelle, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 400, syntheticNanites: 150, cyberModule: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 1, tech2: 6 } },
  { id: "tech17", nom: "Batterie Anti-a\xE9rienne", desc: "D\xE9bloque la Batterie anti-a\xE9rienne, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 500, syntheticNanites: 200, nano: 150 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 2, tech14: 5 } },
  { id: "tech13", nom: "Chasseur", desc: "D\xE9bloque le Chasseur, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 600, energy: 300, syntheticNanites: 250 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech10: 5, tech7: 1, tech1: 14 } },
  { id: "tech15", nom: "Canon \xE0 impulsion", desc: "D\xE9bloque le Canon \xE0 impulsion, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { energy: 800, nano: 400, syntheticNanites: 200 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech7: 2, tech3: 7 } },
  { id: "tech16", nom: "Canon plasma", desc: "D\xE9bloque le Canon plasma, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { energy: 1200, nano: 600, data: 300, aiFragment: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech15: 5, tech7: 4, tech1: 10 } },
  { id: "tech18", nom: "Intercepteur", desc: "D\xE9bloque l'Intercepteur, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 1e3, syntheticNanites: 500, data: 400, aiFragment: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech13: 5, tech16: 2, tech1: 15 } },
  // v3.6 : technologies de fin de partie, entre le Canon plasma / l'Intercepteur et l'Étoile noire.
  { id: "tech21", nom: "M\xE9tallurgie quantique", desc: "Alliages stabilis\xE9s \xE0 l'\xE9chelle quantique : +2 % de d\xE9fense des unit\xE9s par niveau. D\xE9bloque la Fonderie quantique.", maxLevel: 10, baseCost: { scrap: 2e5, nano: 1e5, reinforcedSteel: 400, cyberModule: 200 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unit_defense", value: 0.02 }, { type: "unlock_buildings" }], prereq: { tech1: 16, tech2: 8, tech16: 3 } },
  { id: "tech22", nom: "Cortex neuronal", desc: "R\xE9seaux de calcul organiques : \u22122 % de temps de recherche et +1 contre-espionnage par niveau. D\xE9bloque le Synth\xE9tiseur neuronal.", maxLevel: 10, baseCost: { data: 3e5, energy: 15e4, aiFragment: 300, syntheticNanites: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "research_time", value: 0.02 }, { type: "counter_spy", value: 1 }, { type: "unlock_buildings" }], prereq: { tech1: 17, tech20: 6, tech18: 3 } },
  { id: "tech23", nom: "Champs de confinement", desc: "Contenir l'\xE9nergie, prot\xE9ger les stocks : +1 point de stock \xE0 l'abri du pillage par niveau. D\xE9bloque le G\xE9n\xE9rateur de bouclier plan\xE9taire.", maxLevel: 10, baseCost: { energy: 3e5, nano: 2e5, reinforcedSteel: 300, syntheticNanites: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "protected_storage", value: 0.01 }, { type: "unlock_buildings" }], prereq: { tech1: 16, tech8: 4, tech17: 5 } },
  { id: "tech24", nom: "Propulsion \xE0 antimati\xE8re", desc: "D\xE9bloque le Croiseur Nova, puis l'am\xE9liore (+250 attaque et d\xE9fense par niveau). \u22122 % de temps de vol par niveau.", maxLevel: 10, baseCost: { scrap: 4e5, energy: 4e5, aiFragment: 500, cyberModule: 500 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unlock_next_level", target: "croiseur_nova" }, { type: "fleet_speed", value: 0.02 }], prereq: { tech1: 17, tech18: 5, tech11: 6, tech21: 2 } },
  { id: "tech25", nom: "Lance gravitationnelle", desc: "D\xE9bloque la Lance gravitationnelle, puis l'am\xE9liore : +150 attaque et d\xE9fense par niveau.", maxLevel: 10, baseCost: { nano: 4e5, data: 3e5, reinforcedSteel: 500, aiFragment: 300 }, baseTime: 600, costGrowth: 2.4, effects: [{ type: "unlock_next_level", target: "lance_gravitationnelle" }], prereq: { tech1: 17, tech16: 6, tech23: 3 } },
  // v5.5 : demandée par les joueurs, hangars pleins en fin de partie.
  { id: "tech26", nom: "Extension des hangars", desc: "Modules d'amarrage repliables : +5 % de places dans les hangars d'attaque et de d\xE9fense par niveau (+50 % au niveau 10).", maxLevel: 10, baseCost: { scrap: 15e4, nano: 8e4, reinforcedSteel: 200, cyberModule: 200 }, baseTime: 600, costGrowth: 2.2, effects: [{ type: "hangar_capacity", value: 0.05, target: "attack" }, { type: "hangar_capacity", value: 0.05, target: "defense" }], prereq: { tech6: 1, tech1: 12 } },
  { id: "tech19", nom: "\xC9toile noire", desc: "D\xE9bloque l'\xC9toile noire, puis l'am\xE9liore : +1 700 attaque et +1 700 d\xE9fense par niveau.", maxLevel: 10, baseCost: { reinforcedSteel: 1e3, syntheticNanites: 1e3, cyberModule: 1e3, aiFragment: 1e3 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5, tech1: 18 } }
];
var TECHNOLOGIES = [...DEFAULT_TECHNOLOGIES];
function setTechnologies(defs) {
  TECHNOLOGIES.splice(0, TECHNOLOGIES.length, ...defs);
}
function techEffects(tech) {
  if (tech.effects && tech.effects.length > 0) return tech.effects;
  if (!tech.effect) return [];
  const type = tech.effect === "unlock_hangars" ? "unlock_buildings" : tech.effect;
  return [tech.effectValue === void 0 ? { type } : { type, value: tech.effectValue }];
}
function effectValuePerLevel(effect) {
  var _a, _b;
  return (_b = (_a = effect.value) != null ? _a : TECH_EFFECT_DEFAULTS[effect.type]) != null ? _b : 0;
}
function techBonus(techLevels2, type, target) {
  var _a;
  if (!techLevels2) return 0;
  let total2 = 0;
  for (const tech of TECHNOLOGIES) {
    const level3 = (_a = techLevels2[tech.id]) != null ? _a : 0;
    if (level3 <= 0) continue;
    for (const e3 of techEffects(tech)) {
      if (e3.type !== type && !(type === "unlock_buildings" && e3.type === "unlock_hangars")) continue;
      if (target !== void 0 && e3.target !== target) continue;
      total2 += level3 * effectValuePerLevel(e3);
    }
  }
  return CAPPED_TECH_EFFECTS.includes(type) ? Math.min(TECH_REDUCTION_CAP, Math.max(0, total2)) : total2;
}
function techReductionFactor(techLevels2, type) {
  return 1 - techBonus(techLevels2, type);
}
function buildingsUnlockedByTech(techId, buildings) {
  var _a;
  const tech = findTech(techId);
  const ids = new Set(buildings.filter((b) => b.unlockedByTech === techId).map((b) => b.id));
  for (const e3 of tech ? techEffects(tech) : []) if (e3.type === "unlock_buildings" || e3.type === "unlock_hangars") for (const id of (_a = e3.targets) != null ? _a : []) ids.add(id);
  return [...ids];
}
var MAX_CONCURRENT_RESEARCH = 4;
var COST_GROWTH = 2.7;
var TIME_GROWTH = 1.67;
function findTech(id) {
  return TECHNOLOGIES.find((t) => t.id === id);
}
function getTechCost(tech, level3) {
  var _a;
  const growth = (_a = tech.costGrowth) != null ? _a : COST_GROWTH;
  const factor = Math.pow(growth, level3 - 1);
  const cost = {};
  for (const [res, amount3] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(amount3 * factor);
  }
  return cost;
}
function getTechAmberCost(tech) {
  const n = Number(tech.amberCost);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
function getTechTime(tech, level3) {
  return Math.floor(tech.baseTime * Math.pow(TIME_GROWTH, level3 - 1));
}
var BLUEPRINT_UNITS = /* @__PURE__ */ new Map();
function blueprintsRequiredBy(tech) {
  return techEffects(tech).filter((e3) => e3.type === "unlock_next_level" && e3.target && BLUEPRINT_UNITS.has(e3.target)).map((e3) => e3.target);
}
function checkPrereqs(tech, levels, ownedPlans = []) {
  const list = Object.entries(tech.prereq).map(([reqId, reqLevel]) => {
    var _a, _b, _c;
    const current2 = (_a = levels[reqId]) != null ? _a : 0;
    return { id: reqId, nom: (_c = (_b = findTech(reqId)) == null ? void 0 : _b.nom) != null ? _c : reqId, requis: reqLevel, actuel: current2, valide: current2 >= reqLevel, kind: "tech" };
  });
  for (const unitId of blueprintsRequiredBy(tech)) {
    const owned = ownedPlans.includes(unitId);
    list.push({ id: `plan:${unitId}`, nom: `Plan : ${BLUEPRINT_UNITS.get(unitId)}`, requis: 1, actuel: owned ? 1 : 0, valide: owned, kind: "plan" });
  }
  return { valid: list.every((r) => r.valide), list };
}
var EFFECT_MAX_PER_LEVEL = {
  building_discount: 0.5,
  fleet_speed: 0.5,
  building_time: 0.5,
  unit_time: 0.5,
  research_time: 0.5,
  fleet_upkeep: 0.5,
  protected_storage: 0.5,
  counter_spy: 10,
  hangar_capacity: 0.5
};
function validateTechEffect(label3, e3, refs) {
  var _a, _b;
  const errors = [];
  if (!(e3.type in TECH_EFFECT_LABELS)) return [`${label3} : effet \xAB ${e3.type} \xBB inconnu.`];
  if (e3.type === "resource_production" && (!e3.target || !refs.resources.has(e3.target))) errors.push(`${label3} : ressource vis\xE9e manquante ou inconnue.`);
  if (e3.type === "hangar_capacity" && e3.target !== "attack" && e3.target !== "defense") errors.push(`${label3} : hangar vis\xE9 manquant (attaque ou d\xE9fense).`);
  if (e3.type === "unlock_next_level" && e3.target && !refs.unitIds.has(e3.target)) errors.push(`${label3} : unit\xE9 \xAB ${e3.target} \xBB inexistante.`);
  for (const id of (_a = e3.targets) != null ? _a : []) if (!refs.buildingIds.has(id)) errors.push(`${label3} : b\xE2timent \xAB ${id} \xBB inexistant.`);
  if (e3.value !== void 0) {
    const max = (_b = EFFECT_MAX_PER_LEVEL[e3.type]) != null ? _b : 5;
    if (!Number.isFinite(e3.value) || e3.value < 0 || e3.value > max) errors.push(`${label3} : valeur par niveau de \xAB ${TECH_EFFECT_LABELS[e3.type]} \xBB entre 0 et ${max}.`);
  }
  return errors;
}

// src/game/units.ts
var KESH_HUNTER_UNIT = {
  id: "traqueur_kesh",
  name: "Traqueur Kesh",
  image: "/assets/units/traqueur_kesh.webp",
  maxLevel: 1,
  description: "Chasseur organique des Kesh'Vaar, coque de chitine ambr\xE9e. Rapide, et redoutable contre tous les PNJ : +50 % d'attaque contre les seigneurs de guerre, les menaces, les primes, les boss et le L\xE9viathan, en attaque comme en d\xE9fense.",
  cost: { scrap: 6e3, energy: 3e3 },
  stats: { attaque: 420, defense: 90, vitesse: 12, cargo: 20 },
  category: "attack",
  unlockTech: "",
  hangarSpace: 25,
  blueprint: true
};
function ownedBlueprints(player) {
  var _a, _b;
  return ((_b = (_a = player.bounties) == null ? void 0 : _a.owned) == null ? void 0 : _b.includes("blueprint")) ? [KESH_HUNTER_UNIT.id] : [];
}
var KESH_PVE_BONUS = 0.5;
var UNIT_LEVEL_BONUS_DEFAULT = 5;
var DEFAULT_UNITS = [
  {
    id: "drone_recuperateur",
    name: "Drone r\xE9cup\xE9rateur",
    image: "/assets/units/drone_recuperateur.webp",
    maxLevel: 10,
    description: "Petit drone autonome con\xE7u pour r\xE9cup\xE9rer des ressources dispers\xE9es.",
    cost: { scrap: 500, energy: 200 },
    stats: { attaque: 15, defense: 5, vitesse: 5, cargo: 10 },
    category: "attack",
    unlockTech: "tech9",
    hangarSpace: 1
  },
  {
    id: "sonde_espionnage",
    name: "Sonde d'espionnage",
    image: "/assets/units/sonde_espionnage.webp",
    maxLevel: 10,
    description: "Sonde furtive et tr\xE8s rapide : rapporte les ressources, la flotte et les plans d'un autre joueur. Plus tu en envoies, plus le rapport est complet.",
    cost: { scrap: 300, energy: 150 },
    stats: { attaque: 0, defense: 2, vitesse: 20, cargo: 0 },
    category: "attack",
    unlockTech: "tech20",
    hangarSpace: 1
  },
  {
    id: "fregate",
    name: "Fr\xE9gate",
    image: "/assets/units/fregate.webp",
    maxLevel: 10,
    description: "Vaisseau polyvalent, \xE9quilibr\xE9 entre attaque et d\xE9fense.",
    cost: { scrap: 1e3, energy: 500 },
    stats: { attaque: 100, defense: 20, vitesse: 3, cargo: 5 },
    category: "attack",
    unlockTech: "tech10",
    hangarSpace: 1
  },
  {
    id: "cargo",
    name: "Cargo",
    image: "/assets/units/cargo.webp",
    maxLevel: 10,
    description: "Transporteur massif con\xE7u pour d\xE9placer de grandes quantit\xE9s de ressources.",
    cost: { scrap: 1200, energy: 300 },
    stats: { attaque: 50, defense: 10, vitesse: 3, cargo: 50 },
    category: "attack",
    unlockTech: "tech11",
    hangarSpace: 1
  },
  {
    id: "sentinelle",
    name: "Sentinelle",
    image: "/assets/units/sentinelle.webp",
    maxLevel: 10,
    description: "Unit\xE9 offensive sp\xE9cialis\xE9e dans la d\xE9tection et la protection.",
    cost: { scrap: 800, energy: 400 },
    stats: { attaque: 120, defense: 30, vitesse: 1, detection: 10, cargo: 0 },
    category: "attack",
    unlockTech: "tech12",
    hangarSpace: 1
  },
  {
    id: "chasseur",
    name: "Chasseur",
    image: "/assets/units/chasseur.webp",
    maxLevel: 10,
    description: "Vaisseau rapide con\xE7u pour les attaques \xE9clairs.",
    cost: { scrap: 1500, energy: 800 },
    stats: { attaque: 245, defense: 10, vitesse: 8, cargo: 5 },
    category: "attack",
    unlockTech: "tech13",
    // v5.4 : 20 places (29 ATK/place, dix fois moins que les autres) → 2.
    hangarSpace: 2
  },
  {
    id: "etoile_noire",
    name: "\xC9toile Noire",
    image: "/assets/units/etoile_noire.webp",
    maxLevel: 10,
    description: "Arme ultime. Capacit\xE9 de destruction massive.",
    cost: { scrap: 5e4, energy: 3e4 },
    stats: { attaque: 500, defense: 500, vitesse: 1, cargo: 1e3 },
    category: "attack",
    unlockTech: "tech19",
    // v5.4 : 200 → 80 places : arme ultime par place (≈ 395 ATK/place au niveau 10).
    hangarSpace: 80,
    // 200 places et l'entretien de 200 sentinelles : elle gagne beaucoup plus
    // par niveau que les autres (15 800 ATK/DEF au niveau 10).
    levelBonus: 1700
  },
  // v3.6 : unités de fin de partie.
  {
    id: "croiseur_nova",
    name: "Croiseur Nova",
    image: "/assets/units/croiseur_nova.webp",
    maxLevel: 10,
    description: "Croiseur de ligne propuls\xE9 par un c\u0153ur d'antimati\xE8re. Assez rapide pour frapper, assez blind\xE9 pour encaisser.",
    cost: { scrap: 15e3, energy: 9e3 },
    stats: { attaque: 1500, defense: 1e3, vitesse: 6, cargo: 300 },
    category: "attack",
    unlockTech: "tech24",
    hangarSpace: 20,
    levelBonus: 250
  },
  {
    id: "lance_gravitationnelle",
    name: "Lance gravitationnelle",
    image: "/assets/units/lance_gravitationnelle.webp",
    maxLevel: 10,
    description: "Projecteur orbital qui \xE9crase les coques ennemies sous un puits de gravit\xE9.",
    cost: { scrap: 18e3, energy: 12e3 },
    stats: { attaque: 600, defense: 1200, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech25",
    // v5.4 : 8 → 12 places (1 189 ATK+DEF/place, 2,4 fois la Batterie AA) : aligné sur l'Étoile Noire.
    hangarSpace: 12,
    levelBonus: 150
  },
  {
    id: "roquette",
    name: "Roquette",
    image: "/assets/units/roquette.webp",
    maxLevel: 10,
    description: "Arme simple mais efficace pour saturer une zone.",
    cost: { scrap: 200, energy: 100 },
    stats: { attaque: 60, defense: 0, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech14",
    hangarSpace: 1
  },
  {
    id: "canon_impulsion",
    name: "Canon \xE0 impulsion",
    image: "/assets/units/canon_impulsion.webp",
    maxLevel: 10,
    description: "Canon \xE9nerg\xE9tique puissant, id\xE9al contre les cibles blind\xE9es.",
    // v5.4 : moins cher que la Batterie AA, qu'il ne bat pas (2000/1200 avant).
    cost: { scrap: 1200, energy: 600 },
    stats: { attaque: 80, defense: 10, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech15",
    hangarSpace: 1
  },
  {
    id: "canon_plasma",
    name: "Canon Plasma",
    image: "/assets/units/canon_plasma.webp",
    maxLevel: 10,
    description: "Arme lourde tirant des projectiles de plasma surchauff\xE9.",
    // v5.4 : entre le Canon à impulsion et la Batterie AA (2500/1500 avant).
    cost: { scrap: 1500, energy: 750 },
    stats: { attaque: 105, defense: 20, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech16",
    hangarSpace: 1
  },
  {
    id: "batterie_aa",
    name: "Batterie Anti-A\xE9rienne",
    image: "/assets/units/batterie_aa.webp",
    maxLevel: 10,
    description: "D\xE9fense sp\xE9cialis\xE9e contre les unit\xE9s rapides et a\xE9riennes.",
    cost: { scrap: 1800, energy: 900 },
    stats: { attaque: 135, defense: 15, vitesse: 0, cargo: 0 },
    category: "defense",
    unlockTech: "tech17",
    hangarSpace: 1
  },
  {
    id: "intercepteur",
    name: "Intercepteur",
    image: "/assets/units/intercepteur.webp",
    maxLevel: 10,
    description: "Vaisseau ultra-rapide con\xE7u pour intercepter les cibles prioritaires.",
    cost: { scrap: 2e3, energy: 1200 },
    stats: { attaque: 255, defense: 60, vitesse: 12, cargo: 5 },
    category: "defense",
    unlockTech: "tech18",
    // v5.4 : 20 places → 2 (aligné sur la Batterie AA par place).
    hangarSpace: 2
  },
  KESH_HUNTER_UNIT
];
var UNITS = [];
var UNIT_BASE_STATS = {};
var UNIT_TO_TECH = {};
var OFFENSIVE_UNITS = [];
var DEFENSIVE_UNITS = [];
function setUnits(defs) {
  UNITS.splice(0, UNITS.length, ...defs);
  for (const key of Object.keys(UNIT_BASE_STATS)) delete UNIT_BASE_STATS[key];
  for (const key of Object.keys(UNIT_TO_TECH)) delete UNIT_TO_TECH[key];
  BLUEPRINT_UNITS.clear();
  for (const u of defs) {
    if (u.blueprint) BLUEPRINT_UNITS.set(u.id, u.name);
    UNIT_BASE_STATS[u.id] = { attack: u.stats.attaque, defense: u.stats.defense, perLevel: unitLevelBonus(u) };
    if (u.unlockTech) UNIT_TO_TECH[u.id] = u.unlockTech;
  }
  OFFENSIVE_UNITS.splice(0, OFFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "attack").map((u) => u.id));
  DEFENSIVE_UNITS.splice(0, DEFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "defense").map((u) => u.id));
}
setUnits(DEFAULT_UNITS);
function unitLevelBonus(u) {
  return typeof u.levelBonus === "number" && Number.isFinite(u.levelBonus) && u.levelBonus >= 0 ? u.levelBonus : UNIT_LEVEL_BONUS_DEFAULT;
}
function findUnit(id) {
  return UNITS.find((u) => u.id === id);
}
function getUnitBuildTime(unit, techLevels2) {
  const total2 = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  const base = unit.buildTime && unit.buildTime > 0 ? unit.buildTime : Math.max(3, Math.ceil(total2 / 100));
  return techLevels2 ? Math.max(1, Math.round(base * techReductionFactor(techLevels2, "unit_time"))) : base;
}

// src/game/format.ts
function formatInt(value) {
  const n = Math.round(Number(value) || 0);
  const digits = String(Math.abs(n));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += "\u202F";
    out += digits[i];
  }
  return n < 0 ? `-${out}` : out;
}
function describeGain(gain) {
  const names = { scrap: "ferraille", energy: "\xE9nergie", nano: "nanocomposants", data: "donn\xE9es", reinforcedSteel: "acier renforc\xE9", cyberModule: "modules", syntheticNanites: "nanites", aiFragment: "fragments d'IA" };
  const parts = Object.entries(gain).filter(([, v]) => (v != null ? v : 0) > 0).map(([k, v]) => {
    var _a;
    return `${formatInt(v != null ? v : 0)} ${(_a = names[k]) != null ? _a : k}`;
  });
  return parts.length ? parts.join(", ") : "rien";
}

// src/game/resources.ts
var RESOURCE_LIST = [
  { id: "scrap", name: "Ferraille", emoji: "\u{1F529}", rarity: "common" },
  { id: "energy", name: "\xC9nergie instable", emoji: "\u26A1", rarity: "common" },
  { id: "nano", name: "Nanocomposants", emoji: "\u{1F9EC}", rarity: "common" },
  { id: "data", name: "Donn\xE9es anciennes", emoji: "\u{1F4E1}", rarity: "common" },
  { id: "reinforcedSteel", name: "Acier renforc\xE9", emoji: "\u{1F6E0}\uFE0F", rarity: "rare" },
  { id: "cyberModule", name: "Module cybern\xE9tique", emoji: "\u{1F9E9}", rarity: "rare" },
  { id: "syntheticNanites", name: "Nanites synth\xE9tiques", emoji: "\u{1F916}", rarity: "rare" },
  { id: "aiFragment", name: "Fragment d'IA", emoji: "\u{1F9E0}", rarity: "rare" }
];
function getTradeRate(sellId, buyId) {
  const sell = RESOURCE_LIST.find((r) => r.id === sellId);
  const buy = RESOURCE_LIST.find((r) => r.id === buyId);
  if (!sell || !buy) return 1;
  if (sell.rarity === "common" && buy.rarity === "rare") return 0.01;
  if (sell.rarity === "rare" && buy.rarity === "common") return 50;
  return 1;
}
function canAffordAll(resources, costs) {
  return Object.entries(costs).every(([res, val]) => {
    var _a;
    return ((_a = resources[res]) != null ? _a : 0) >= (val != null ? val : 0);
  });
}

// src/game/buildings.ts
var ENDGAME_PRODUCTION = [1, 1, 2, 2, 3, 4, 5, 6, 8, 10];
var PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500, 625, 781, 977, 1221, 1526, 1907, 2384, 2980, 3725, 4657];
function tier2(common, commonMax, rare, rareMax) {
  return {
    fromLevel: 11,
    baseCost: __spreadValues(__spreadValues({}, common), rare),
    maxCost: __spreadValues(__spreadValues({}, commonMax), rareMax),
    baseSeconds: 3 * 3600,
    secondsPerLevel: 3600
  };
}
var extractorUpgrade = (rare) => ({
  baseCost: { scrap: 50, energy: 20 },
  maxCost: { scrap: 25e5, energy: 18e5 },
  costFromLevel: 1,
  secondsPerLevel: 600,
  tier2: tier2({ scrap: 5e6, energy: 3e6 }, { scrap: 5e8, energy: 3e8 }, { [rare]: 2e4 }, { [rare]: 2e6 })
});
var hangarUpgrade = (rares) => ({
  baseCost: { scrap: 300, energy: 150 },
  maxCost: { scrap: 5e6, energy: 75e5 },
  costFromLevel: 1,
  secondsPerLevel: 900,
  tier2: tier2(
    { scrap: 8e6, energy: 8e6 },
    { scrap: 7e8, energy: 7e8 },
    { [rares[0]]: 15e3, [rares[1]]: 15e3 },
    { [rares[0]]: 15e5, [rares[1]]: 15e5 }
  )
});
var DEFAULT_BUILDINGS = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "R\xE9cup\xE8re automatiquement de la ferraille dans les d\xE9bris environnants.",
    image: "/assets/buildings/extracteur_ferraille.webp",
    maxLevel: 20,
    startsUnlocked: true,
    upgrade: extractorUpgrade("reinforcedSteel"),
    production: { resource: "scrap", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "reacteur_instable",
    name: "R\xE9acteur instable",
    description: "G\xE9n\xE8re de l'\xE9nergie brute, au prix d'une certaine instabilit\xE9.",
    image: "/assets/buildings/reacteur_instable.webp",
    maxLevel: 20,
    unlockCost: { scrap: 500 },
    upgrade: extractorUpgrade("cyberModule"),
    production: { resource: "energy", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synth\xE9tise des nanocomposants \xE0 partir de mati\xE8res recycl\xE9es.",
    image: "/assets/buildings/extracteur_nanocomposants.webp",
    maxLevel: 20,
    unlockCost: { energy: 500 },
    upgrade: extractorUpgrade("syntheticNanites"),
    production: { resource: "nano", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "archives_fracturees",
    name: "Archives fractur\xE9es",
    description: "Fouille des donn\xE9es anciennes dans des serveurs endommag\xE9s.",
    image: "/assets/buildings/archives_fracturees.webp",
    maxLevel: 20,
    unlockCost: { nano: 500 },
    upgrade: extractorUpgrade("aiFragment"),
    production: { resource: "data", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "atelier_reparation",
    name: "Atelier de r\xE9paration",
    description: "R\xE9pare une partie des unit\xE9s perdues apr\xE8s chaque combat.",
    image: "/assets/buildings/atelier_reparation.webp",
    maxLevel: 20,
    unlockCost: { reinforcedSteel: 20, cyberModule: 20, syntheticNanites: 20, aiFragment: 20 },
    upgrade: {
      baseCost: { nano: 1e3, data: 1e3 },
      maxCost: { nano: 1e7, data: 95e5 },
      costFromLevel: 2,
      secondsPerLevel: 1200,
      tier2: tier2(
        { nano: 1e7, data: 1e7 },
        { nano: 8e8, data: 8e8 },
        { reinforcedSteel: 1e4, cyberModule: 1e4, syntheticNanites: 1e4, aiFragment: 1e4 },
        { reinforcedSteel: 1e6, cyberModule: 1e6, syntheticNanites: 1e6, aiFragment: 1e6 }
      )
    },
    // 5 % par niveau jusqu'au niveau 10 (50 %), puis 2 % par niveau (70 % au niveau 20).
    effect: { type: "repair", perLevel: 0.05, max: 0.7, bonusFromLevel: 11, bonusPerLevel: 0.02 }
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s offensives.",
    image: "/assets/buildings/hangar_attaque.webp",
    maxLevel: 20,
    unlockedByTech: "tech6",
    upgrade: hangarUpgrade(["reinforcedSteel", "cyberModule"]),
    effect: { type: "hangar", category: "attack", perLevel: 2e3 }
  },
  {
    id: "hangar_defense",
    name: "Hangar de d\xE9fense",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s d\xE9fensives.",
    image: "/assets/buildings/hangar_defense.webp",
    maxLevel: 20,
    unlockedByTech: "tech6",
    upgrade: hangarUpgrade(["syntheticNanites", "aiFragment"]),
    effect: { type: "hangar", category: "defense", perLevel: 2e3 }
  },
  {
    id: "entrepot",
    name: "Entrep\xF4t",
    description: "Stocke les ressources communes. Plein, la production s'arr\xEAte ; une partie du stock est \xE0 l'abri du pillage.",
    image: "/assets/buildings/entrepot.webp",
    maxLevel: 20,
    startsUnlocked: true,
    upgrade: {
      baseCost: { scrap: 2e4, energy: 1e4 },
      maxCost: { scrap: 2e7, energy: 1e7 },
      costFromLevel: 2,
      secondsPerLevel: 600,
      tier2: tier2({ scrap: 3e7, energy: 15e6 }, { scrap: 4e8, energy: 2e8 }, {}, {})
    },
    effect: { type: "storage", base: 2e6, growth: 1.6 }
  },
  // v3.6 : bâtiments de fin de partie, débloqués par les nouvelles technologies.
  {
    id: "fonderie_quantique",
    name: "Fonderie quantique",
    description: "Forge de l'acier renforc\xE9 \xE0 partir de mati\xE8re stabilis\xE9e \xE0 l'\xE9chelle quantique : une production continue de ressource rare.",
    image: "/assets/buildings/fonderie_quantique.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech21",
    upgrade: { baseCost: { scrap: 2e7, energy: 1e7, cyberModule: 2e4 }, maxCost: { scrap: 15e8, energy: 8e8, cyberModule: 2e6 }, costFromLevel: 2, secondsPerLevel: 10800 },
    production: { resource: "reinforcedSteel", perSecond: ENDGAME_PRODUCTION }
  },
  {
    id: "synthetiseur_neuronal",
    name: "Synth\xE9tiseur neuronal",
    description: "Un cortex de cristal cultive des fragments d'IA, jour et nuit : une production continue de ressource rare.",
    image: "/assets/buildings/synthetiseur_neuronal.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech22",
    upgrade: { baseCost: { data: 2e7, nano: 1e7, syntheticNanites: 2e4 }, maxCost: { data: 15e8, nano: 8e8, syntheticNanites: 2e6 }, costFromLevel: 2, secondsPerLevel: 10800 },
    production: { resource: "aiFragment", perSecond: ENDGAME_PRODUCTION }
  },
  {
    id: "generateur_bouclier",
    name: "G\xE9n\xE9rateur de bouclier plan\xE9taire",
    description: "Un d\xF4me d'\xE9nergie hexagonal renforce le bouclier de la base au-del\xE0 de ce que permettent les hangars.",
    image: "/assets/buildings/generateur_bouclier.webp",
    maxLevel: 10,
    endgame: true,
    unlockedByTech: "tech23",
    upgrade: { baseCost: { energy: 3e7, scrap: 2e7, reinforcedSteel: 2e4 }, maxCost: { energy: 2e9, scrap: 13e8, reinforcedSteel: 2e6 }, costFromLevel: 2, secondsPerLevel: 10800 },
    effect: { type: "shield", perLevel: 5e-3, max: 0.05 }
  }
];
var SYNTH_BUILDING_ID = "labo_synthese";
var SYNTH_BUILDING = {
  id: SYNTH_BUILDING_ID,
  name: "Labo de synth\xE8se",
  description: "Des cuves bouillonnantes o\xF9 m\xFBrissent stimulants, carapaces et brouilleurs. Son niveau fixe la puissance des capsules (5 % par niveau).",
  image: "/assets/buildings/labo_synthese.webp",
  maxLevel: 10,
  endgame: true,
  unlockCost: { scrap: 15e5, energy: 8e5, data: 3e5 },
  upgrade: {
    baseCost: { scrap: 4e5, energy: 25e4, data: 1e5 },
    maxCost: { scrap: 15e7, energy: 9e7, data: 4e7 },
    costFromLevel: 2,
    secondsPerLevel: 5400
  }
};
DEFAULT_BUILDINGS.push(SYNTH_BUILDING);
function withFixedBuildings(defs) {
  return defs.some((b) => b.id === SYNTH_BUILDING_ID) ? defs : [...defs, SYNTH_BUILDING];
}
var BUILDINGS = [];
var LOCKABLE_BUILDINGS = [];
var BUILDING_UNLOCK_COST = {};
var PRODUCTION_RESOURCE_BY_BUILDING = {};
function setBuildings(defs) {
  var _a;
  BUILDINGS.splice(0, BUILDINGS.length, ...defs);
  LOCKABLE_BUILDINGS.splice(
    0,
    LOCKABLE_BUILDINGS.length,
    ...defs.filter((b) => b.production && !b.startsUnlocked && !b.unlockedByTech).map((b) => b.id)
  );
  for (const key of Object.keys(BUILDING_UNLOCK_COST)) delete BUILDING_UNLOCK_COST[key];
  for (const key of Object.keys(PRODUCTION_RESOURCE_BY_BUILDING)) delete PRODUCTION_RESOURCE_BY_BUILDING[key];
  for (const b of defs) {
    const entries = Object.entries((_a = b.unlockCost) != null ? _a : {}).filter(([, v]) => (v != null ? v : 0) > 0);
    const items = entries.map(([resource, amount3]) => {
      var _a2, _b;
      return { resource, amount: amount3, label: (_b = (_a2 = RESOURCE_LIST.find((r) => r.id === resource)) == null ? void 0 : _a2.name) != null ? _b : resource };
    });
    if (items.length === 1) BUILDING_UNLOCK_COST[b.id] = items[0];
    else if (items.length > 1) BUILDING_UNLOCK_COST[b.id] = { multi: true, resources: items };
    if (b.production) PRODUCTION_RESOURCE_BY_BUILDING[b.id] = b.production.resource;
  }
}
setBuildings(DEFAULT_BUILDINGS);
function findBuilding(id) {
  return BUILDINGS.find((b) => b.id === id);
}
function productionPerSecond(buildingId, level3) {
  var _a, _b, _c, _d;
  if (level3 <= 0) return 0;
  const table = (_c = (_b = (_a = findBuilding(buildingId)) == null ? void 0 : _a.production) == null ? void 0 : _b.perSecond) != null ? _c : [];
  return (_d = table[Math.min(level3, table.length) - 1]) != null ? _d : 0;
}
function geometricCost(baseCost, maxCost, fromLevel, toLevel, level3) {
  var _a;
  const steps = Math.max(1, toLevel - fromLevel);
  const cost = {};
  for (const [res, base] of Object.entries(baseCost)) {
    const target = (_a = maxCost[res]) != null ? _a : base;
    const rate = base > 0 ? Math.pow(target / base, 1 / steps) : 1;
    cost[res] = Math.floor(base * Math.pow(rate, level3 - fromLevel));
  }
  return cost;
}
function tierFor(building, level3) {
  const t2 = building.upgrade.tier2;
  return t2 && level3 >= t2.fromLevel ? t2 : null;
}
function getBuildingUpgradeCost(building, nextLevel) {
  const { baseCost, maxCost, costFromLevel, tier2: tier22 } = building.upgrade;
  const t2 = tierFor(building, nextLevel);
  if (t2) return geometricCost(t2.baseCost, t2.maxCost, t2.fromLevel, building.maxLevel, nextLevel);
  const lastLevel = tier22 ? Math.min(building.maxLevel, tier22.fromLevel - 1) : building.maxLevel;
  return geometricCost(baseCost, maxCost, costFromLevel, lastLevel, nextLevel);
}
function applyBuildingDiscount(cost, discount) {
  if (!discount) return cost;
  const out = __spreadValues({}, cost);
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (typeof val === "number") {
      out[key] = Math.max(0, Math.floor(val * (1 - discount)));
    }
  }
  return out;
}
function getBuildingUpgradeTime(building, nextLevel) {
  const t2 = tierFor(building, nextLevel);
  if (t2) return t2.baseSeconds + (nextLevel - t2.fromLevel) * t2.secondsPerLevel;
  return (nextLevel - 1) * building.upgrade.secondsPerLevel;
}
function getRepairPercent(buildings) {
  var _a;
  let pct5 = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "repair") continue;
    pct5 += repairPercentAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  return pct5;
}
function repairPercentAt(effect, level3) {
  var _a;
  const from = effect.bonusFromLevel;
  const base = from ? Math.min(level3, from - 1) * effect.perLevel : level3 * effect.perLevel;
  const bonus = from ? Math.max(0, level3 - from + 1) * ((_a = effect.bonusPerLevel) != null ? _a : effect.perLevel) : 0;
  return Math.max(0, Math.min(effect.max, base + bonus));
}
function getStorageCapacity(buildings, techLevels2) {
  var _a;
  let capacity = 0;
  let hasStorage = false;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "storage") continue;
    hasStorage = true;
    capacity += storageCapacityAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  return hasStorage ? Math.floor(capacity * (1 + techBonus(techLevels2, "storage_capacity"))) : Infinity;
}
function storageCapacityAt(effect, level3) {
  return level3 > 0 ? Math.floor(effect.base * Math.pow(effect.growth, level3)) : 0;
}
function getUnitCapacity(buildings, category, techLevels2) {
  var _a, _b, _c;
  let capacity = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "hangar" || b.effect.category !== category) continue;
    capacity += ((_c = (_b = buildings[b.id]) == null ? void 0 : _b.level) != null ? _c : 0) * b.effect.perLevel;
  }
  const bonus = techLevels2 ? techBonus(techLevels2, "hangar_capacity", category) : 0;
  return bonus > 0 ? Math.floor(capacity * (1 + bonus)) : capacity;
}
function effectiveBuildingLevel(buildings, id) {
  var _a;
  const state = buildings[id];
  return (state == null ? void 0 : state.unlocked) ? (_a = state.level) != null ? _a : 0 : 0;
}
function defaultBuildings() {
  return Object.fromEntries(BUILDINGS.map((b) => [b.id, { level: 1, unlocked: !!b.startsUnlocked }]));
}
function withMissingBuildings(buildings, resources) {
  var _a;
  const out = __spreadValues({}, buildings != null ? buildings : {});
  for (const b of BUILDINGS) {
    if (out[b.id]) continue;
    let level3 = 1;
    if (((_a = b.effect) == null ? void 0 : _a.type) === "storage" && resources) {
      const biggest = Math.max(0, ...RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => {
        var _a2;
        return (_a2 = resources[r.id]) != null ? _a2 : 0;
      }));
      while (level3 < b.maxLevel && storageCapacityAt(b.effect, level3) < biggest) level3++;
    }
    out[b.id] = { level: level3, unlocked: !!b.startsUnlocked };
  }
  return out;
}

// src/game/combat.ts
var COMBAT_RULES = {
  /** Part des ressources rares du défenseur pillée par un attaquant vainqueur. */
  lootPercent: 0.08,
  /** Part des ressources communes pillée (ferraille, énergie, nano, données). */
  lootPercentCommon: 0.1,
  /** Bonus de puissance du défenseur, qui se bat chez lui. */
  homeDefenseBonus: 0.15,
  /** Bouclier du Hangar de défense : part de la puissance d'attaque absorbée par niveau… */
  shieldPerLevel: 75e-4,
  /** …plafonnée à cette valeur. */
  shieldMax: 0.15,
  /** Vaisseaux à quai : ils soutiennent la défense avec cette part de leur
   *  puissance, et subissent la même part des pertes. Réglé pour viser
   *  55–60 % de victoires attaquantes (simulation sur les combats réels). */
  homeFleetDefenseFactor: 0.1,
  /** Part des défenses détruites reconstruites gratuitement après le combat. */
  defenseRebuildPct: 0.6,
  /* v3.0 — formations d'attaque (choisies au lancement). */
  /** Assaut : attaque +10 %, pertes subies +15 %. */
  assaultAttack: 0.1,
  assaultLosses: 0.15,
  /** Prudente : attaque −10 %, pertes subies −25 %. */
  cautiousAttack: -0.1,
  cautiousLosses: -0.25,
  /** Raid : attaque −15 %, cargaison +30 %. */
  raidAttack: -0.15,
  raidCargo: 0.3,
  /* v3.0 — postures de la base (défenseur). */
  /** Bunker : défenses +8 %, vaisseaux à quai hors combat. */
  bunkerDefense: 0.08,
  /** Riposte : vaisseaux à quai engagés à 25 %. */
  riposteHomeFleet: 0.25,
  /** Délai entre deux changements de posture (h). */
  postureCooldownHours: 1
};
function getShieldPercent(buildings, allianceBonus = 0) {
  var _a, _b;
  let levels = 0;
  let extra = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) === "hangar" && b.effect.category === "defense") levels += effectiveBuildingLevel(buildings, b.id);
    if (((_b = b.effect) == null ? void 0 : _b.type) === "shield") extra += Math.min(b.effect.max, effectiveBuildingLevel(buildings, b.id) * b.effect.perLevel);
  }
  return Math.min(COMBAT_RULES.shieldMax + allianceBonus, levels * COMBAT_RULES.shieldPerLevel + allianceBonus) + extra;
}
var RARE_RESOURCES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
var COMMON_RESOURCES = ["scrap", "energy", "nano", "data"];
function fleetCargoCapacity(units, fleet, techLevels2) {
  var _a, _b, _c;
  let total2 = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const def3 = findUnit(id);
    const level3 = (_b = (_a = units[id]) == null ? void 0 : _a.level) != null ? _b : 0;
    if (!def3 || qty <= 0 || level3 <= 0) continue;
    total2 += ((_c = def3.stats.cargo) != null ? _c : 0) * level3 * qty;
  }
  return Math.floor(total2 * (1 + techBonus(techLevels2, "cargo_capacity")));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function unitStat(units, techLevels2, unitId, stat) {
  var _a, _b, _c, _d;
  const def3 = UNIT_BASE_STATS[unitId];
  const base = (_a = def3 == null ? void 0 : def3[stat]) != null ? _a : 0;
  const level3 = (_c = (_b = units[unitId]) == null ? void 0 : _b.level) != null ? _c : 0;
  if (level3 <= 0) return 0;
  let value = base + (level3 - 1) * ((_d = def3 == null ? void 0 : def3.perLevel) != null ? _d : 5);
  if (stat === "attack") value *= 1 + techBonus(techLevels2, "unit_attack");
  if (stat === "defense") value *= 1 + techBonus(techLevels2, "unit_defense");
  return value;
}
function computeFleetPower(units, techLevels2, fleet, stats) {
  let total2 = 0;
  for (const id in fleet) {
    const qty = fleet[id];
    if (qty <= 0) continue;
    let value = 0;
    stats.forEach((s) => value += unitStat(units, techLevels2, id, s));
    total2 += value * qty;
  }
  return total2;
}
function pveAttackFactor(units, techLevels2, fleet) {
  var _a;
  const hunters = (_a = fleet[KESH_HUNTER_UNIT.id]) != null ? _a : 0;
  if (!(hunters > 0)) return 1;
  const all = computeFleetPower(units, techLevels2, fleet, ["attack"]);
  if (!(all > 0)) return 1;
  return 1 + KESH_PVE_BONUS * computeFleetPower(units, techLevels2, { [KESH_HUNTER_UNIT.id]: hunters }, ["attack"]) / all;
}
function pveHomeDefenseFactor(units, techLevels2, homeFleetFactor = COMBAT_RULES.homeFleetDefenseFactor, defenseFactor = 1) {
  var _a, _b;
  const hunters = (_b = (_a = units[KESH_HUNTER_UNIT.id]) == null ? void 0 : _a.count) != null ? _b : 0;
  if (!(hunters > 0)) return 1;
  const base = homeDefensePower(units, techLevels2, homeFleetFactor, defenseFactor);
  if (!(base > 0)) return 1;
  const extra = KESH_PVE_BONUS * computeFleetPower(units, techLevels2, { [KESH_HUNTER_UNIT.id]: hunters }, ["attack"]) * homeFleetFactor * (1 + COMBAT_RULES.homeDefenseBonus);
  return 1 + extra / base;
}
function computeFullPower(units, techLevels2, idList, stats) {
  let total2 = 0;
  idList.forEach((id) => {
    var _a, _b;
    const count2 = (_b = (_a = units[id]) == null ? void 0 : _a.count) != null ? _b : 0;
    let value = 0;
    stats.forEach((s) => value += unitStat(units, techLevels2, id, s));
    total2 += value * count2;
  });
  return total2;
}
function homeDefensePower(units, techLevels2, homeFleetFactor = COMBAT_RULES.homeFleetDefenseFactor, defenseFactor = 1) {
  return (computeFullPower(units, techLevels2, DEFENSIVE_UNITS, ["attack", "defense"]) * defenseFactor + computeFullPower(units, techLevels2, OFFENSIVE_UNITS, ["attack", "defense"]) * homeFleetFactor) * (1 + COMBAT_RULES.homeDefenseBonus);
}
function resolveCombat(params) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;
  const shield = Math.max(0, Math.min(0.95, (_a = params.defenderShieldPct) != null ? _a : 0));
  const attackerPower = ((_b = params.attackerPowerOverride) != null ? _b : computeFleetPower(attackerUnits, attackerTechLevels, fleet, ["attack"])) * ((_c = params.attackFactor) != null ? _c : 1) * (1 - shield);
  const garrisons = (_d = params.garrisons) != null ? _d : [];
  const garrisonFactor = (_e = params.garrisonFactor) != null ? _e : 0.5;
  const garrisonPower = garrisons.reduce((sum3, g) => sum3 + computeFleetPower(g.units, g.techLevels, g.fleet, ["attack", "defense"]) * garrisonFactor, 0);
  const homeFactor = (_f = params.homeFleetFactor) != null ? _f : COMBAT_RULES.homeFleetDefenseFactor;
  const defenderPower = ((_h = params.defenderPowerOverride) != null ? _h : homeDefensePower(defenderUnits, defenderTechLevels, homeFactor, (_g = params.defenseFactor) != null ? _g : 1) + garrisonPower) * Math.max(0, (_i = params.defenderPowerFactor) != null ? _i : 1);
  const totalPower = attackerPower + defenderPower;
  const diffRatio = totalPower > 0 ? Math.abs(attackerPower - defenderPower) / totalPower : 0;
  let outcome;
  if (attackerPower > defenderPower) outcome = "attacker_win";
  else if (attackerPower < defenderPower) outcome = "defender_win";
  else outcome = "draw";
  const winnerLossPct = clamp(0.3 * (1 - diffRatio), 0.05, 0.3);
  const loserLossPct = clamp(0.3 + 0.4 * diffRatio, 0.3, 0.7);
  let attackerLossPct, defenderLossPct;
  if (outcome === "attacker_win") {
    attackerLossPct = winnerLossPct;
    defenderLossPct = loserLossPct;
  } else if (outcome === "defender_win") {
    attackerLossPct = loserLossPct;
    defenderLossPct = winnerLossPct;
  } else {
    attackerLossPct = 0.3;
    defenderLossPct = 0.3;
  }
  if (params.attackerLossFactor !== void 0) attackerLossPct = Math.min(1, attackerLossPct * Math.max(0, params.attackerLossFactor));
  if (attackerPower > 0) attackerLossPct = Math.min(attackerLossPct, defenderPower / attackerPower);
  if (defenderPower > 0) defenderLossPct = Math.min(defenderLossPct, attackerPower / defenderPower);
  const attackerLosses = {};
  const attackerRecovered = {};
  for (const unitId in fleet) {
    const sent = fleet[unitId];
    const rawLost = Math.floor(sent * attackerLossPct);
    const recovered = Math.floor(rawLost * attackerRepairPct);
    const effectiveLost = rawLost - recovered;
    if (rawLost > 0) {
      attackerLosses[unitId] = effectiveLost;
      attackerRecovered[unitId] = recovered;
    }
  }
  const defenderLosses = {};
  const defenderRecovered = {};
  const defenderRebuilt = {};
  [...DEFENSIVE_UNITS, ...OFFENSIVE_UNITS].forEach((unitId) => {
    var _a2, _b2;
    const count2 = (_b2 = (_a2 = defenderUnits[unitId]) == null ? void 0 : _a2.count) != null ? _b2 : 0;
    const isDefense = DEFENSIVE_UNITS.includes(unitId);
    const rawLost = Math.floor(count2 * defenderLossPct * (isDefense ? 1 : homeFactor));
    if (rawLost <= 0) return;
    const recovered = Math.floor(rawLost * (isDefense ? COMBAT_RULES.defenseRebuildPct : defenderRepairPct));
    defenderLosses[unitId] = rawLost - recovered;
    defenderRecovered[unitId] = recovered;
    if (isDefense && recovered > 0) defenderRebuilt[unitId] = recovered;
  });
  const garrisonLosses = garrisons.map((g) => {
    const lost = {};
    for (const [unitId, qty] of Object.entries(g.fleet)) {
      const n = Math.floor(qty * defenderLossPct * garrisonFactor);
      if (n > 0) lost[unitId] = Math.min(qty, n);
    }
    return lost;
  });
  const survivors = {};
  for (const [unitId, sent] of Object.entries(fleet)) survivors[unitId] = Math.max(0, sent - ((_j = attackerLosses[unitId]) != null ? _j : 0));
  const cargoCapacity = Math.floor(fleetCargoCapacity(attackerUnits, survivors, attackerTechLevels) * ((_k = params.cargoFactor) != null ? _k : 1));
  let loot = null;
  if (outcome === "attacker_win") {
    const wanted = {};
    let total2 = 0;
    for (const res of [...COMMON_RESOURCES, ...RARE_RESOURCES]) {
      const base = RARE_RESOURCES.includes(res) ? COMBAT_RULES.lootPercent : COMBAT_RULES.lootPercentCommon;
      const pct5 = Math.min(1, base * ((_l = params.lootMultiplier) != null ? _l : 1));
      const amount3 = Math.floor(Math.max(0, (_m = defenderResources[res]) != null ? _m : 0) * pct5);
      wanted[res] = amount3;
      total2 += amount3;
    }
    const ratio = total2 > cargoCapacity ? cargoCapacity / total2 : 1;
    loot = {};
    const entries = Object.entries(wanted);
    for (const [res, amount3] of entries) loot[res] = Math.floor(amount3 * ratio);
    let left = Math.min(total2, Math.floor(cargoCapacity)) - entries.reduce((s, [res]) => {
      var _a2;
      return s + ((_a2 = loot[res]) != null ? _a2 : 0);
    }, 0);
    const byRemainder = entries.map(([res, amount3]) => ({ res, frac: amount3 * ratio - Math.floor(amount3 * ratio) })).sort((a, b) => b.frac - a.frac);
    for (const { res } of byRemainder) {
      if (left <= 0) break;
      if (((_n = loot[res]) != null ? _n : 0) < ((_o = wanted[res]) != null ? _o : 0)) {
        loot[res] = ((_p = loot[res]) != null ? _p : 0) + 1;
        left--;
      }
    }
  }
  return {
    outcome,
    attackerPower,
    defenderPower,
    attackerLossPercent: attackerLossPct,
    defenderLossPercent: defenderLossPct,
    attackerLosses,
    attackerRecovered,
    defenderLosses,
    defenderRecovered,
    loot,
    cargoCapacity,
    shieldPercent: shield,
    defenderRebuilt,
    garrisonLosses,
    garrisonPower
  };
}

// src/game/story.ts
var STORY_SPEAKERS = {
  vashka: { name: "Vashka", role: "Matriarche-Chasseuse \xB7 Essaim Kesh'Vaar", image: "/assets/bounties/vashka.webp", color: "#ffd86b" },
  varan: { name: "Capitaine Orsk Varan", role: "Confr\xE9rie du Vide", image: "/assets/story/varan.webp", color: "#ff7a45" },
  // v4.3 : voix des Chroniques mensuelles.
  kor: { name: "Madame Vashti Kor", role: "Cartel N\xE9on", image: "/assets/story/cartel.webp", color: "#ff5fd2" },
  ilyon: { name: "Cantor Ilyon", role: "D\xE9serteur du Ch\u0153ur", image: "/assets/warlords/ilyon.webp", color: "#b18cff" },
  nerea: { name: "S\u0153ur N\xE9r\xE9a des \xC9chos", role: "Marchande", image: "/assets/warlords/nerea.webp", color: "#d6b4ff" },
  brannoc: { name: "Brannoc Demi-Barbe", role: "Seigneur de guerre", image: "/assets/warlords/brannoc.webp", color: "#ff9a5c" },
  lysa: { name: "Lysa Ferro", role: "La Comptable", image: "/assets/warlords/lysa.webp", color: "#ffb347" },
  vesper: { name: "L'Archonte Vesper", role: "Le Ch\u0153ur Silencieux", image: "/assets/story/choeur.webp", color: "#9fd8ff" },
  // v4.7 : voix des Chroniques de janvier à mars 2027.
  kragmor: { name: "Kragmor Corne-Fendue", role: "Mercenaire Gravhorn", image: "/assets/warlords/kragmor.webp", color: "#7fd1ff" },
  maru: { name: "Le Proph\xE8te Maru", role: "Culte du L\xE9viathan", image: "/assets/warlords/maru.webp", color: "#7dff9a" }
};
var TUTORIAL_RAID = { factionId: "varan", trigger: "rockets10", powerPct: 0.25, minPower: 5, delayMinutes: 2 };
var TUTORIAL_TITLE = "Recrue de Vashka";

// src/game/errors.ts
var GameActionError = class extends Error {
};

// src/game/events.ts
var EVENT_RULES = {
  rotationEnabled: true,
  bossMonthly: true,
  startHour: 18,
  rotation: ["tempete_ferraille", "chantiers_acceleres", "recherche_eclair", "chasse_tresor", "guerre_ouverte"],
  types: [
    {
      id: "tempete_ferraille",
      name: "Temp\xEAte de ferraille",
      emoji: "\u{1F32A}\uFE0F",
      description: "+50 % de production de ferraille et de nanocomposants.",
      effects: { production: { scrap: 1.5, nano: 1.5 } }
    },
    {
      id: "chantiers_acceleres",
      name: "Chantiers acc\xE9l\xE9r\xE9s",
      emoji: "\u{1F3D7}\uFE0F",
      description: "\u221225 % de temps de construction des b\xE2timents lanc\xE9s pendant l'\xE9v\xE9nement.",
      effects: { buildTime: 0.75 }
    },
    {
      id: "recherche_eclair",
      name: "Recherche \xE9clair",
      emoji: "\u{1F52C}",
      description: "\u221225 % de temps de recherche pour les recherches lanc\xE9es pendant l'\xE9v\xE9nement.",
      effects: { researchTime: 0.75 }
    },
    {
      id: "chasse_tresor",
      name: "Chasse au tr\xE9sor",
      emoji: "\u{1F48E}",
      description: "+50 % de r\xE9compenses pour les missions termin\xE9es pendant l'\xE9v\xE9nement.",
      effects: { missionRewards: 1.5 }
    },
    {
      id: "guerre_ouverte",
      name: "Guerre ouverte",
      emoji: "\u2694\uFE0F",
      description: "Butin +50 % et 50 % du co\xFBt des vaisseaux d\xE9truits laiss\xE9s en d\xE9bris.",
      effects: { loot: 1.5, debrisPercent: 0.5 }
    }
  ],
  scheduled: []
};
var HOUR = 36e5;
var DAY = 24 * HOUR;
var REFERENCE_FRIDAY = Date.UTC(2026, 0, 2);
function lastSundayAt1Utc(year, month2) {
  const d = new Date(Date.UTC(year, month2 + 1, 0, 1));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}
function parisOffsetMs(utcMs) {
  const year = new Date(utcMs).getUTCFullYear();
  const summer = utcMs >= lastSundayAt1Utc(year, 2) && utcMs < lastSundayAt1Utc(year, 9);
  return (summer ? 2 : 1) * HOUR;
}
function parisLocalToUtc(localMs) {
  return localMs - parisOffsetMs(localMs - 2 * HOUR);
}
function findEventType(id) {
  return EVENT_RULES.types.find((t) => t.id === id);
}
function weekendWindow(now, weeksAhead = 0) {
  const local = now + parisOffsetMs(now);
  const localMidnight = Math.floor(local / DAY) * DAY;
  const daysSinceFriday = (new Date(local).getUTCDay() - 5 + 7) % 7;
  const friday = localMidnight - daysSinceFriday * DAY + weeksAhead * 7 * DAY;
  return {
    startMs: parisLocalToUtc(friday + EVENT_RULES.startHour * HOUR),
    endMs: parisLocalToUtc(friday + 3 * DAY),
    week: Math.round((friday - REFERENCE_FRIDAY) / (7 * DAY)),
    firstOfMonth: new Date(friday).getUTCDate() <= 7
  };
}
function rotationEvent(window) {
  const list = EVENT_RULES.rotation.filter((id) => findEventType(id));
  if (!EVENT_RULES.rotationEnabled || list.length === 0) return null;
  if (EVENT_RULES.bossMonthly && window.firstOfMonth) return null;
  const type = findEventType(list[(window.week % list.length + list.length) % list.length]);
  return { key: `${type.id}:${window.startMs}`, type, startMs: window.startMs, endMs: window.endMs, scheduled: false };
}
function scheduledEvents() {
  var _a;
  return ((_a = EVENT_RULES.scheduled) != null ? _a : []).map((s) => {
    const type = findEventType(s.type);
    return type && s.endMs > s.startMs ? { key: `${s.id}:${s.startMs}`, type, startMs: s.startMs, endMs: s.endMs, scheduled: true } : null;
  }).filter((e3) => e3 !== null);
}
function eventAt(now) {
  const scheduled = scheduledEvents().find((e3) => e3.startMs <= now && now < e3.endMs);
  if (scheduled) return scheduled;
  const rotation = rotationEvent(weekendWindow(now));
  return rotation && rotation.startMs <= now && now < rotation.endMs ? rotation : null;
}
function eventBoundaries(from, to) {
  const points = /* @__PURE__ */ new Set();
  for (const e3 of scheduledEvents()) {
    if (e3.startMs > from && e3.startMs < to) points.add(e3.startMs);
    if (e3.endMs > from && e3.endMs < to) points.add(e3.endMs);
  }
  if (EVENT_RULES.rotationEnabled) {
    for (let w = 0; ; w++) {
      const win = weekendWindow(from, w);
      if (win.startMs >= to) break;
      if (win.startMs > from) points.add(win.startMs);
      if (win.endMs > from && win.endMs < to) points.add(win.endMs);
      if (w > 60) break;
    }
  }
  return [...points].sort((a, b) => a - b);
}
function productionMultipliers(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.production) != null ? _b : {};
}
function buildTimeFactor(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.buildTime) != null ? _b : 1;
}
function researchTimeFactor(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.researchTime) != null ? _b : 1;
}
function missionRewardFactor(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.missionRewards) != null ? _b : 1;
}
function lootFactor(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.loot) != null ? _b : 1;
}
function eventDebrisPercent(now) {
  var _a, _b;
  return (_b = (_a = eventAt(now)) == null ? void 0 : _a.type.effects.debrisPercent) != null ? _b : null;
}

// src/game/ranks.ts
var rank = (id, name, family, xp) => ({ id, name, family, xp, image: `/assets/ranks/${id}.webp` });
var tiers = (prefix, family, xps) => [
  rank(`${prefix}3`, `${family} III`, family, xps[0]),
  rank(`${prefix}2`, `${family} II`, family, xps[1]),
  rank(`${prefix}1`, `${family} I`, family, xps[2])
];
var DEFAULT_RANKS = [
  rank("non_classe", "Non class\xE9", "Non class\xE9", 0),
  ...tiers("fer", "Fer", [100, 250, 500]),
  ...tiers("bronze", "Bronze", [900, 1400, 2e3]),
  ...tiers("argent", "Argent", [3e3, 4200, 5600]),
  ...tiers("or", "Or", [7500, 1e4, 13e3]),
  ...tiers("platine", "Platine", [17e3, 22e3, 28e3]),
  ...tiers("emeraude", "\xC9meraude", [36e3, 45e3, 56e3]),
  ...tiers("diamant", "Diamant", [7e4, 87e3, 107e3]),
  ...tiers("maitre", "Ma\xEEtre", [13e4, 16e4, 195e3]),
  rank("grand_maitre", "Grand Ma\xEEtre", "Grand Ma\xEEtre", 24e4),
  rank("challenger", "Challenger", "Challenger", 32e4),
  rank("elite", "\xC9lite", "\xC9lite", 42e4)
];
var RANKS = [];
function setRanks(defs) {
  RANKS.splice(0, RANKS.length, ...[...defs].sort((a, b) => a.xp - b.xp));
}
setRanks(structuredClone(DEFAULT_RANKS));
function getRankIndex(xp) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if ((xp != null ? xp : 0) >= RANKS[i].xp) index = i;
  }
  return index;
}
function getRank(xp) {
  var _a;
  return (_a = RANKS[getRankIndex(xp)]) != null ? _a : DEFAULT_RANKS[0];
}
function familyIndex(family) {
  return RANKS.findIndex((r) => r.family === family);
}
function validateRanks(defs) {
  var _a, _b;
  const errors = [];
  if (defs.length === 0) return ["Rangs : au moins un rang est n\xE9cessaire."];
  const seen = /* @__PURE__ */ new Set();
  for (const r of defs) {
    const label3 = `Rang ${r.name || r.id}`;
    if (!/^[a-z0-9_]+$/.test((_a = r.id) != null ? _a : "")) errors.push(`${label3} : identifiant \xAB ${r.id} \xBB invalide (minuscules, chiffres, _).`);
    if (seen.has(r.id)) errors.push(`${label3} : identifiant en double.`);
    seen.add(r.id);
    if (!((_b = r.name) == null ? void 0 : _b.trim())) errors.push(`${label3} : nom manquant.`);
    if (!(r.xp >= 0)) errors.push(`${label3} : XP requise invalide.`);
  }
  if (!defs.some((r) => r.xp === 0)) errors.push("Rangs : il faut un rang \xE0 0 XP (le rang de d\xE9part).");
  const xps = defs.map((r) => r.xp);
  if (new Set(xps).size !== xps.length) errors.push("Rangs : deux rangs ont la m\xEAme XP requise.");
  return errors;
}

// src/game/commanders.ts
var COMMANDERS = [
  {
    id: "admiral",
    name: "Rhys Calder",
    title: "Amiral",
    portrait: "/assets/commanders/admiral.webp",
    domain: "Combats gagn\xE9s en attaque, repaires, primes, assauts sur les boss.",
    bonus: (l) => `+${l} % d'attaque de la flotte`
  },
  {
    id: "strategist",
    name: "Ilsa Varga",
    title: "Strat\xE8ge",
    portrait: "/assets/commanders/strategist.webp",
    domain: "Attaques et raids repouss\xE9s (un peu aussi apr\xE8s une d\xE9fense perdue).",
    bonus: (l) => `+${l} % de d\xE9fense de la base`
  },
  {
    id: "engineer",
    name: "Noor Halim",
    title: "Ing\xE9nieure",
    portrait: "/assets/commanders/engineer.webp",
    domain: "Constructions (plan\xE8te m\xE8re et colonies) et recherches termin\xE9es.",
    bonus: (l) => `\u2212${l} % de temps de construction et de recherche`
  },
  {
    id: "spy",
    name: "Sable",
    title: "Espionne",
    portrait: "/assets/commanders/spy.webp",
    domain: "Espionnages lanc\xE9s, sondes ennemies rep\xE9r\xE9es.",
    bonus: (l) => `+${(l * 0.2).toFixed(1).replace(".", ",")} niveau d'espionnage, +${l} % de d\xE9tection, ${l * 3} % de flairer une anomalie chimique`
  },
  {
    id: "steward",
    name: "Oswin Tarr",
    title: "Intendant",
    portrait: "/assets/commanders/steward.webp",
    domain: "Missions, contrats du jour, \xE9changes au Comptoir et au march\xE9.",
    bonus: (l) => `+${l} % de production, +${l * 2} % d'entrep\xF4t`
  }
];
var COMMANDER_RULES = {
  maxLevel: 20,
  /** XP cumulée pour atteindre le niveau L : xpFactor × (L − 1) × L. */
  xpFactor: 15,
  slots: 2,
  /** Poste supplémentaire à partir de cette famille de rangs. */
  extraSlotFamily: "Platine",
  /** Recrutement (après le premier, offert). */
  recruitAmber: 150,
  recruitProductionHours: 12,
  /** Délai entre deux changements d'un même poste. */
  swapCooldownHours: 24,
  /** XP d'un Dossier d'entraînement. */
  dossierXp: 200,
  /** Anomalie chimique : chance par niveau de l'Espionne (option C). */
  anomalyPerLevel: 0.03
};
var COMMANDER_XP = {
  attackWin: 20,
  lairWin: 40,
  bountyWin: 15,
  bossAssault: 10,
  defenseWin: 25,
  raidRepelled: 20,
  defenseLost: 5,
  buildingDone: 10,
  researchDone: 10,
  spyLaunched: 5,
  probesCaught: 10,
  missionDone: 5,
  contractClaimed: 10,
  marketTrade: 5
};
var COMMANDER_SOURCES = {
  admiral: [
    { label: "Attaque gagn\xE9e", xp: COMMANDER_XP.attackWin },
    { label: "Repaire pris", xp: COMMANDER_XP.lairWin },
    { label: "Prime Kesh'Vaar remplie", xp: COMMANDER_XP.bountyWin },
    { label: "Assaut sur un boss", xp: COMMANDER_XP.bossAssault }
  ],
  strategist: [
    { label: "Attaque repouss\xE9e", xp: COMMANDER_XP.defenseWin },
    { label: "Raid de faction repouss\xE9", xp: COMMANDER_XP.raidRepelled },
    { label: "Attaque ou raid subi et perdu", xp: COMMANDER_XP.defenseLost }
  ],
  engineer: [
    { label: "B\xE2timent termin\xE9 (plan\xE8te m\xE8re ou colonie)", xp: COMMANDER_XP.buildingDone },
    { label: "Recherche termin\xE9e", xp: COMMANDER_XP.researchDone }
  ],
  spy: [
    { label: "Espionnage lanc\xE9", xp: COMMANDER_XP.spyLaunched },
    { label: "Sondes ennemies rep\xE9r\xE9es", xp: COMMANDER_XP.probesCaught }
  ],
  steward: [
    { label: "Mission termin\xE9e", xp: COMMANDER_XP.missionDone },
    { label: "Contrat du jour r\xE9cup\xE9r\xE9", xp: COMMANDER_XP.contractClaimed },
    { label: "\xC9change au Comptoir ou au march\xE9", xp: COMMANDER_XP.marketTrade }
  ]
};
function findCommander(id) {
  return COMMANDERS.find((c) => c.id === id);
}
function commandersState(player) {
  var _a, _b;
  const raw = (_a = player.commanders) != null ? _a : {};
  const roster = {};
  for (const c of COMMANDERS) {
    const r = (_b = raw.roster) == null ? void 0 : _b[c.id];
    if (r) roster[c.id] = { xp: Math.max(0, Number(r.xp) || 0) };
  }
  const active = (Array.isArray(raw.active) ? raw.active : []).filter((id, i, a) => !!roster[id] && a.indexOf(id) === i);
  return { roster, active, movedAtMs: raw.movedAtMs && typeof raw.movedAtMs === "object" ? raw.movedAtMs : {}, dossiers: Math.max(0, Number(raw.dossiers) || 0) };
}
function commanderLevel(xp) {
  let level3 = 1;
  while (level3 < COMMANDER_RULES.maxLevel && xp >= COMMANDER_RULES.xpFactor * level3 * (level3 + 1)) level3 += 1;
  return level3;
}
function commanderSlots(player) {
  var _a;
  const family = familyIndex(COMMANDER_RULES.extraSlotFamily);
  return COMMANDER_RULES.slots + (family >= 0 && getRankIndex((_a = player.xp) != null ? _a : 0) >= family ? 1 : 0);
}
function activeLevels(player) {
  var _a, _b;
  const st = commandersState(player);
  const out = { admiral: 0, strategist: 0, engineer: 0, spy: 0, steward: 0 };
  for (const id of st.active) out[id] = commanderLevel((_b = (_a = st.roster[id]) == null ? void 0 : _a.xp) != null ? _b : 0);
  return out;
}
function grantCommanderXp(player, id, amount3) {
  var _a, _b;
  if (!(amount3 > 0)) return;
  const st = commandersState(player);
  if (!st.active.includes(id) || !st.roster[id]) return;
  st.roster[id] = { xp: ((_b = (_a = st.roster[id]) == null ? void 0 : _a.xp) != null ? _b : 0) + amount3 };
  player.commanders = st;
}
function recruitCost(player) {
  return Object.keys(commandersState(player).roster).length === 0 ? "free" : "paid";
}
function recruitCommander(player, id, pay2, method) {
  const def3 = findCommander(id);
  if (!def3) throw new GameActionError("Officier inconnu.");
  const st = commandersState(player);
  if (st.roster[def3.id]) throw new GameActionError(`${def3.title} ${def3.name} sert d\xE9j\xE0 dans ta flotte.`);
  if (recruitCost(player) === "paid") pay2(method);
  st.roster[def3.id] = { xp: 0 };
  if (st.active.length < commanderSlots(player)) st.active.push(def3.id);
  player.commanders = st;
  return def3;
}
function assignCommanders(player, idsIn, now) {
  var _a, _b;
  const st = commandersState(player);
  const ids = (Array.isArray(idsIn) ? idsIn : []).map(String).filter((id, i, a) => a.indexOf(id) === i);
  if (ids.length > commanderSlots(player)) throw new GameActionError(`${commanderSlots(player)} postes au plus.`);
  for (const id of ids) if (!st.roster[id]) throw new GameActionError("Cet officier n'est pas recrut\xE9.");
  const changed = [...ids.filter((id) => !st.active.includes(id)), ...st.active.filter((id) => !ids.includes(id))];
  const cooldown = player.testMode ? 0 : COMMANDER_RULES.swapCooldownHours * 36e5;
  for (const id of changed) {
    const at = (_a = st.movedAtMs[id]) != null ? _a : 0;
    if (at && now - at < cooldown) {
      const def3 = findCommander(id);
      throw new GameActionError(`${(_b = def3 == null ? void 0 : def3.title) != null ? _b : "Cet officier"} vient de changer de poste : r\xE9essaie dans ${Math.ceil((at + cooldown - now) / 36e5)} h.`);
    }
  }
  for (const id of changed) st.movedAtMs[id] = now;
  st.active = ids;
  player.commanders = st;
}
function trainCommander(player, id) {
  const def3 = findCommander(id);
  if (!def3) throw new GameActionError("Officier inconnu.");
  const st = commandersState(player);
  if (!st.roster[def3.id]) throw new GameActionError("Cet officier n'est pas recrut\xE9.");
  if (st.dossiers <= 0) throw new GameActionError("Aucun Dossier d'entra\xEEnement : il s'en trouve au Comptoir de la Ruche.");
  if (commanderLevel(st.roster[def3.id].xp) >= COMMANDER_RULES.maxLevel) throw new GameActionError("Cet officier a atteint le niveau maximal.");
  st.dossiers -= 1;
  st.roster[def3.id] = { xp: st.roster[def3.id].xp + COMMANDER_RULES.dossierXp };
  player.commanders = st;
  return commanderLevel(st.roster[def3.id].xp);
}
function addDossiers(player, n) {
  const st = commandersState(player);
  st.dossiers += n;
  player.commanders = st;
}
function anomalyChance(player) {
  return Math.min(1, activeLevels(player).spy * COMMANDER_RULES.anomalyPerLevel);
}

// src/game/stats.ts
function playerStats(player) {
  var _a;
  return (_a = player.stats) != null ? _a : {};
}
function bumpStat(player, key, n = 1) {
  var _a, _b, _c;
  if (!(n > 0)) return;
  player.stats = __spreadProps(__spreadValues({}, (_a = player.stats) != null ? _a : {}), { [key]: ((_c = (_b = player.stats) == null ? void 0 : _b[key]) != null ? _c : 0) + n });
}
function setStat(player, key, value) {
  var _a;
  player.stats = __spreadProps(__spreadValues({}, (_a = player.stats) != null ? _a : {}), { [key]: value });
}
function recordThreat(player, factionId) {
  var _a, _b, _c;
  const s = __spreadValues({}, (_a = player.stats) != null ? _a : {});
  s.ultimatums = ((_b = s.ultimatums) != null ? _b : 0) + 1;
  s.threatenedBy = [.../* @__PURE__ */ new Set([...(_c = s.threatenedBy) != null ? _c : [], factionId])];
  player.stats = s;
}
function recordMission(player, day) {
  var _a, _b, _c, _d;
  const s = __spreadValues({}, (_a = player.stats) != null ? _a : {});
  s.missions = ((_b = s.missions) != null ? _b : 0) + 1;
  s.missionDayCount = s.missionDay === day ? ((_c = s.missionDayCount) != null ? _c : 0) + 1 : 1;
  s.missionDay = day;
  s.bestMissionDay = Math.max((_d = s.bestMissionDay) != null ? _d : 0, s.missionDayCount);
  player.stats = s;
}
function parisHour(now) {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const lastSunday = (month2) => {
    const last = new Date(Date.UTC(y, month2 + 1, 0));
    return Date.UTC(y, month2, last.getUTCDate() - last.getUTCDay(), 1);
  };
  const summer = now >= lastSunday(2) && now < lastSunday(9);
  return (d.getUTCHours() + (summer ? 2 : 1)) % 24;
}

// src/game/alliances.ts
var ALLIANCE_RULES = {
  maxMembers: 6,
  /** Versement : au plus cette part du stock d'une ressource du trésor. */
  distributionMaxPct: 0.2,
  /** Versements par jour (UTC) pour toute l'alliance. */
  distributionsPerDay: 10,
  /** Coût du niveau n : base × croissance^(n−1). */
  researchCommonCost: 5e7,
  researchRareCost: 1e6,
  researchGrowth: 2,
  researchHoursPerLevel: 12,
  /** Garnison : part de la puissance d'attaque engagée en défense. */
  garrisonPower: 0.5,
  garrisonMinHours: 1,
  garrisonMaxHours: 24,
  maxGarrisonsPerHost: 3,
  /** Onglet Renseignement : rapports des membres sur cette période. */
  sharedReportsDays: 7,
  sharedReportsMax: 50,
  /** Saison : somme des XP de saison des N meilleurs membres. */
  seasonTopMembers: 5,
  seasonRewardHours: 8,
  seasonTitle: "Alli\xE9 champion",
  researches: [
    { id: "logistique", name: "Logistique f\xE9d\xE9r\xE9e", emoji: "\u{1F6F0}\uFE0F", description: "R\xE9duit le temps de vol de toutes les flottes des membres.", perLevel: 0.05, maxLevel: 5 },
    { id: "industrie", name: "Industrie coop\xE9rative", emoji: "\u{1F3ED}", description: "Augmente la production de toutes les ressources des membres.", perLevel: 0.03, maxLevel: 5 },
    { id: "brouillage", name: "R\xE9seau de brouillage", emoji: "\u{1F4E1}", description: "Ajoute des points de contre-espionnage \xE0 chaque membre.", perLevel: 1, maxLevel: 5 },
    { id: "bouclier", name: "Bouclier f\xE9d\xE9ral", emoji: "\u{1F6E1}\uFE0F", description: "Renforce le bouclier des bases des membres, au-del\xE0 du plafond habituel.", perLevel: 0.01, maxLevel: 5 }
  ],
  /** v3.3 : projets (méga-structures). Coût du palier n : base × croissance^(n−1). */
  projectCommonCost: 5e8,
  projectRareCost: 5e6,
  projectGrowth: 2,
  /** Construction du palier n : n × ce nombre d'heures, une fois financé. */
  projectHoursPerLevel: 24,
  projects: [
    { id: "forge", name: "Anneau-forge", emoji: "\u{1F528}", description: "R\xE9duit la dur\xE9e des constructions et des recherches des membres.", perLevel: 0.02, maxLevel: 5 },
    { id: "siege", name: "Batterie de si\xE8ge", emoji: "\u{1F3AF}", description: "Augmente l'attaque des membres contre le L\xE9viathan et les repaires pirates.", perLevel: 0.04, maxLevel: 5 },
    { id: "bastion", name: "Bastion f\xE9d\xE9ral", emoji: "\u{1F3F0}", description: "Met \xE0 l'abri du pillage une part suppl\xE9mentaire des stocks des membres.", perLevel: 0.02, maxLevel: 5 }
  ]
};
var MAX_DIPLOMATS = 2;
function canDiplomacy(role) {
  return role === "founder" || role === "officer" || role === "diplomat";
}
var RESOURCE_IDS = new Set(RESOURCE_LIST.map((r) => r.id));
function findAllianceResearch(id) {
  return ALLIANCE_RULES.researches.find((r) => r.id === id);
}
function allianceRole(alliance, uid) {
  var _a, _b;
  if (!((_a = alliance.members) == null ? void 0 : _a.includes(uid))) return null;
  if (alliance.createdBy === uid) return "founder";
  const r = (_b = alliance.roles) == null ? void 0 : _b[uid];
  return r === "officer" ? "officer" : r === "diplomat" ? "diplomat" : "member";
}
function level(levels, id) {
  var _a;
  const def3 = findAllianceResearch(id);
  return Math.max(0, Math.min((_a = def3 == null ? void 0 : def3.maxLevel) != null ? _a : 0, Math.floor(Number(levels == null ? void 0 : levels[id]) || 0)));
}
function allianceFlightFactor(levels, techLevels2) {
  var _a, _b;
  return Math.max(0.1, (1 - level(levels, "logistique") * ((_b = (_a = findAllianceResearch("logistique")) == null ? void 0 : _a.perLevel) != null ? _b : 0)) * techReductionFactor(techLevels2, "fleet_speed"));
}
function allianceProductionFactor(levels) {
  var _a, _b;
  return 1 + level(levels, "industrie") * ((_b = (_a = findAllianceResearch("industrie")) == null ? void 0 : _a.perLevel) != null ? _b : 0);
}
function allianceCounterSpy(levels) {
  var _a, _b;
  return level(levels, "brouillage") * ((_b = (_a = findAllianceResearch("brouillage")) == null ? void 0 : _a.perLevel) != null ? _b : 0);
}
function allianceShieldBonus(levels) {
  var _a, _b;
  return level(levels, "bouclier") * ((_b = (_a = findAllianceResearch("bouclier")) == null ? void 0 : _a.perLevel) != null ? _b : 0);
}
var projectKey = (id) => `projet_${id}`;
function findAllianceProject(id) {
  return ALLIANCE_RULES.projects.find((p) => p.id === id);
}
function memberProjectLevel(levels, id) {
  var _a;
  const def3 = findAllianceProject(id);
  return Math.max(0, Math.min((_a = def3 == null ? void 0 : def3.maxLevel) != null ? _a : 0, Math.floor(Number(levels == null ? void 0 : levels[projectKey(id)]) || 0)));
}
function projectEffect(levels, id) {
  var _a, _b;
  return memberProjectLevel(levels, id) * ((_b = (_a = findAllianceProject(id)) == null ? void 0 : _a.perLevel) != null ? _b : 0);
}
function allianceForgeFactor(levels) {
  return Math.max(0.5, 1 - projectEffect(levels, "forge"));
}
function allianceSiegeFactor(levels) {
  return 1 + projectEffect(levels, "siege");
}
function allianceBastionBonus(levels) {
  return projectEffect(levels, "bastion");
}
function newAlliance(founder, nameIn, tagIn, now) {
  const name = String(nameIn != null ? nameIn : "").trim();
  const tag = String(tagIn != null ? tagIn : "").trim().toUpperCase();
  if (name.length < 3 || name.length > 40) throw new GameActionError("Le nom doit contenir entre 3 et 40 caract\xE8res.");
  if (!/^[A-Z0-9]{2,5}$/.test(tag)) throw new GameActionError("Le tag doit contenir 2 \xE0 5 lettres ou chiffres.");
  return {
    name,
    tag,
    createdBy: founder.uid,
    createdAtMs: now,
    members: [founder.uid],
    memberPseudos: { [founder.uid]: founder.pseudo },
    roles: {},
    treasury: {},
    research: {},
    activeResearch: null,
    distributions: { day: "", count: 0 }
  };
}
function addMember(alliance, player) {
  if (alliance.members.includes(player.uid)) throw new GameActionError("Tu es d\xE9j\xE0 membre de cette alliance.");
  if (alliance.members.length >= ALLIANCE_RULES.maxMembers) throw new GameActionError(`Cette alliance est compl\xE8te (${ALLIANCE_RULES.maxMembers} membres).`);
  return __spreadProps(__spreadValues({}, alliance), { members: [...alliance.members, player.uid], memberPseudos: __spreadProps(__spreadValues({}, alliance.memberPseudos), { [player.uid]: player.pseudo }) });
}
function removeMember(alliance, uid) {
  var _a, _b;
  if (!alliance.members.includes(uid)) throw new GameActionError("Ce joueur n'est pas membre de l'alliance.");
  const members = alliance.members.filter((m) => m !== uid);
  if (members.length === 0) return null;
  const memberPseudos = __spreadValues({}, alliance.memberPseudos);
  delete memberPseudos[uid];
  const roles = __spreadValues({}, (_a = alliance.roles) != null ? _a : {});
  delete roles[uid];
  let createdBy = alliance.createdBy;
  if (createdBy === uid) {
    createdBy = (_b = members.find((m) => roles[m] === "officer")) != null ? _b : members[0];
    delete roles[createdBy];
  }
  return __spreadProps(__spreadValues({}, alliance), { members, memberPseudos, roles, createdBy });
}
function kickMember(alliance, actorUid, targetUid) {
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur peut exclure un membre.");
  if (actorUid === targetUid) throw new GameActionError("Tu ne peux pas t'exclure toi-m\xEAme.");
  return removeMember(alliance, targetUid);
}
function setOfficer(alliance, actorUid, targetUid, officer) {
  return setRole(alliance, actorUid, targetUid, officer ? "officer" : "member");
}
function setRole(alliance, actorUid, targetUid, role) {
  var _a;
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur g\xE8re les r\xF4les.");
  if (!alliance.members.includes(targetUid) || targetUid === alliance.createdBy) throw new GameActionError("Ce joueur ne peut pas changer de r\xF4le.");
  if (role !== "officer" && role !== "diplomat" && role !== "member") throw new GameActionError("R\xF4le inconnu.");
  const roles = __spreadValues({}, (_a = alliance.roles) != null ? _a : {});
  if (role === "diplomat" && roles[targetUid] !== "diplomat" && Object.values(roles).filter((r) => r === "diplomat").length >= MAX_DIPLOMATS) {
    throw new GameActionError(`${MAX_DIPLOMATS} diplomates au plus par alliance.`);
  }
  if (role === "member") delete roles[targetUid];
  else roles[targetUid] = role;
  return __spreadProps(__spreadValues({}, alliance), { roles });
}
function parseAmounts(raw) {
  const out = {};
  for (const [res, value] of Object.entries(raw != null ? raw : {})) {
    const n = Math.floor(Number(value));
    if (!RESOURCE_IDS.has(res) || !Number.isFinite(n) || n <= 0) continue;
    out[res] = n;
  }
  if (Object.keys(out).length === 0) throw new GameActionError("Indique au moins un montant.");
  return out;
}
function deposit(alliance, player, amounts) {
  var _a, _b, _c, _d;
  if (!alliance.members.includes(player.uid)) throw new GameActionError("Tu n'es pas membre de cette alliance.");
  const treasury = __spreadValues({}, (_a = alliance.treasury) != null ? _a : {});
  for (const [res, amount3] of Object.entries(amounts)) {
    if (((_b = player.resources[res]) != null ? _b : 0) < amount3) throw new GameActionError("Ressources insuffisantes pour ce d\xE9p\xF4t.");
  }
  for (const [res, amount3] of Object.entries(amounts)) {
    player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) - amount3;
    treasury[res] = ((_d = treasury[res]) != null ? _d : 0) + amount3;
  }
  return __spreadProps(__spreadValues({}, alliance), { treasury });
}
function utcDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}
function distribute(alliance, actorUid, targetUid, amounts, now) {
  var _a, _b, _c, _d;
  const role = allianceRole(alliance, actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent verser le tr\xE9sor.");
  if (!alliance.members.includes(targetUid)) throw new GameActionError("Ce joueur n'est pas membre de l'alliance.");
  const day = utcDay(now);
  const count2 = ((_a = alliance.distributions) == null ? void 0 : _a.day) === day ? alliance.distributions.count : 0;
  if (count2 >= ALLIANCE_RULES.distributionsPerDay) throw new GameActionError(`Limite de ${ALLIANCE_RULES.distributionsPerDay} versements par jour atteinte.`);
  const treasury = __spreadValues({}, (_b = alliance.treasury) != null ? _b : {});
  for (const [res, amount3] of Object.entries(amounts)) {
    const max = Math.floor(((_c = treasury[res]) != null ? _c : 0) * ALLIANCE_RULES.distributionMaxPct);
    if (amount3 > max) {
      throw new GameActionError(`Un versement est limit\xE9 \xE0 ${Math.round(ALLIANCE_RULES.distributionMaxPct * 100)} % du stock du tr\xE9sor (${max} pour cette ressource).`);
    }
  }
  for (const [res, amount3] of Object.entries(amounts)) treasury[res] = ((_d = treasury[res]) != null ? _d : 0) - amount3;
  return __spreadProps(__spreadValues({}, alliance), { treasury, distributions: { day, count: count2 + 1 } });
}
function allianceResearchCost(nextLevel) {
  const factor = Math.pow(ALLIANCE_RULES.researchGrowth, Math.max(0, nextLevel - 1));
  const cost = {};
  for (const r of RESOURCE_LIST) cost[r.id] = Math.round((r.rarity === "rare" ? ALLIANCE_RULES.researchRareCost : ALLIANCE_RULES.researchCommonCost) * factor);
  return cost;
}
function allianceResearchSeconds(nextLevel) {
  return Math.round(ALLIANCE_RULES.researchHoursPerLevel * nextLevel * 3600);
}
function startAllianceResearch(alliance, actorUid, researchId, now) {
  var _a, _b, _c;
  const role = allianceRole(alliance, actorUid);
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers lancent les recherches.");
  const def3 = findAllianceResearch(researchId);
  if (!def3) throw new GameActionError("Recherche inconnue.");
  if (alliance.activeResearch) throw new GameActionError("Une recherche d'alliance est d\xE9j\xE0 en cours.");
  const next = level(alliance.research, def3.id) + 1;
  if (next > def3.maxLevel) throw new GameActionError("Niveau maximum atteint.");
  const cost = allianceResearchCost(next);
  const treasury = __spreadValues({}, (_a = alliance.treasury) != null ? _a : {});
  for (const [res, amount3] of Object.entries(cost)) {
    if (((_b = treasury[res]) != null ? _b : 0) < amount3) throw new GameActionError("Le tr\xE9sor ne suffit pas pour cette recherche.");
  }
  for (const [res, amount3] of Object.entries(cost)) treasury[res] = ((_c = treasury[res]) != null ? _c : 0) - amount3;
  return __spreadProps(__spreadValues({}, alliance), { treasury, activeResearch: { id: def3.id, level: next, endTime: now + allianceResearchSeconds(next) * 1e3 } });
}
function completeAllianceResearch(alliance, now) {
  var _a;
  const active = alliance.activeResearch;
  if (!active || active.endTime > now) return { alliance, completed: null };
  return {
    alliance: __spreadProps(__spreadValues({}, alliance), { research: __spreadProps(__spreadValues({}, (_a = alliance.research) != null ? _a : {}), { [active.id]: active.level }), activeResearch: null }),
    completed: { id: active.id, level: active.level }
  };
}
function allianceProjectCost(nextLevel) {
  const factor = Math.pow(ALLIANCE_RULES.projectGrowth, Math.max(0, nextLevel - 1));
  const cost = {};
  for (const r of RESOURCE_LIST) cost[r.id] = Math.round((r.rarity === "rare" ? ALLIANCE_RULES.projectRareCost : ALLIANCE_RULES.projectCommonCost) * factor);
  return cost;
}
function allianceProjectSeconds(nextLevel) {
  return Math.round(ALLIANCE_RULES.projectHoursPerLevel * nextLevel * 3600);
}
function projectState(alliance, id) {
  var _a, _b;
  const raw = (_a = alliance.projects) == null ? void 0 : _a[id];
  return { level: Math.max(0, Math.floor(Number(raw == null ? void 0 : raw.level) || 0)), funded: __spreadValues({}, (_b = raw == null ? void 0 : raw.funded) != null ? _b : {}), buildEndMs: Number(raw == null ? void 0 : raw.buildEndMs) || 0 };
}
function memberLevels(alliance) {
  var _a;
  const out = __spreadValues({}, (_a = alliance == null ? void 0 : alliance.research) != null ? _a : {});
  for (const def3 of ALLIANCE_RULES.projects) {
    const level3 = alliance ? projectState(alliance, def3.id).level : 0;
    if (level3 > 0) out[projectKey(def3.id)] = level3;
  }
  return out;
}
function contributionValue(amounts) {
  return Object.entries(amounts).reduce((a, [res, n]) => {
    var _a;
    return a + (n != null ? n : 0) * (((_a = RESOURCE_LIST.find((r) => r.id === res)) == null ? void 0 : _a.rarity) === "rare" ? 100 : 1);
  }, 0);
}
function fundAllianceProject(alliance, actor, projectId, source, amounts, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const def3 = findAllianceProject(projectId);
  if (!def3) throw new GameActionError("Projet inconnu.");
  const role = allianceRole(alliance, actor.uid);
  if (!role) throw new GameActionError("Tu n'es pas membre de cette alliance.");
  if (source === "treasury" && role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers puisent dans le tr\xE9sor.");
  const state = projectState(alliance, def3.id);
  if (state.buildEndMs > 0) throw new GameActionError("Ce palier est d\xE9j\xE0 en construction.");
  const next = state.level + 1;
  if (next > def3.maxLevel) throw new GameActionError("Ce projet est achev\xE9.");
  const cost = allianceProjectCost(next);
  const pool = source === "treasury" ? __spreadValues({}, (_a = alliance.treasury) != null ? _a : {}) : actor.resources;
  const used = {};
  for (const [res, amount3] of Object.entries(amounts)) {
    const missing = Math.max(0, ((_b = cost[res]) != null ? _b : 0) - ((_c = state.funded[res]) != null ? _c : 0));
    const n = Math.min(amount3, missing);
    if (n <= 0) continue;
    if (((_d = pool[res]) != null ? _d : 0) < n) throw new GameActionError(source === "treasury" ? "Le tr\xE9sor ne suffit pas pour ce versement." : "Ressources insuffisantes pour ce versement.");
    used[res] = n;
  }
  if (Object.keys(used).length === 0) throw new GameActionError("Ces ressources sont d\xE9j\xE0 r\xE9unies pour ce palier.");
  for (const [res, n] of Object.entries(used)) {
    pool[res] = ((_e = pool[res]) != null ? _e : 0) - n;
    state.funded[res] = ((_f = state.funded[res]) != null ? _f : 0) + n;
  }
  const complete = Object.entries(cost).every(([res, n]) => {
    var _a2;
    return ((_a2 = state.funded[res]) != null ? _a2 : 0) >= n;
  });
  const started = complete ? now + allianceProjectSeconds(next) * 1e3 : null;
  const nextState = complete ? { level: state.level, funded: {}, buildEndMs: started } : state;
  const contributors = __spreadValues({}, (_g = alliance.projectContributors) != null ? _g : {});
  if (source === "self") contributors[actor.uid] = ((_h = contributors[actor.uid]) != null ? _h : 0) + contributionValue(used);
  return {
    alliance: __spreadProps(__spreadValues({}, alliance), {
      treasury: source === "treasury" ? pool : alliance.treasury,
      projects: __spreadProps(__spreadValues({}, (_i = alliance.projects) != null ? _i : {}), { [def3.id]: nextState }),
      projectContributors: contributors
    }),
    used,
    started
  };
}
function completeAllianceProjects(alliance, now) {
  var _a;
  const completed = [];
  const projects = __spreadValues({}, (_a = alliance.projects) != null ? _a : {});
  for (const def3 of ALLIANCE_RULES.projects) {
    const state = projectState(alliance, def3.id);
    if (state.buildEndMs > 0 && state.buildEndMs <= now) {
      projects[def3.id] = { level: state.level + 1, funded: {}, buildEndMs: 0 };
      completed.push({ id: def3.id, level: state.level + 1 });
    }
  }
  return { alliance: completed.length ? __spreadProps(__spreadValues({}, alliance), { projects }) : alliance, completed };
}
function allianceNextDueMs(alliance) {
  var _a, _b;
  const dues = [(_b = (_a = alliance.activeResearch) == null ? void 0 : _a.endTime) != null ? _b : 0, ...ALLIANCE_RULES.projects.map((p) => projectState(alliance, p.id).buildEndMs)].filter((t) => t > 0);
  return dues.length ? Math.min(...dues) : 0;
}
function allianceStandings(members, bonuses = {}) {
  var _a;
  const byAlliance = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (!m.allianceId || !(m.seasonXp > 0)) continue;
    byAlliance.set(m.allianceId, [...(_a = byAlliance.get(m.allianceId)) != null ? _a : [], m.seasonXp]);
  }
  return [...byAlliance.entries()].map(([allianceId, xps]) => {
    var _a2;
    return {
      allianceId,
      // v3.2 : bonus des guerres gagnées pendant la saison.
      score: Math.round(
        xps.sort((a, b) => b - a).slice(0, ALLIANCE_RULES.seasonTopMembers).reduce((a, b) => a + b, 0) * (1 + ((_a2 = bonuses[allianceId]) != null ? _a2 : 0))
      )
    };
  }).sort((a, b) => b.score - a.score || (a.allianceId < b.allianceId ? -1 : 1)).map((s, i) => __spreadProps(__spreadValues({}, s), { rank: i + 1 }));
}
function note(title, message, now) {
  return { kind: "alliance", title, message, createdAtMs: now, read: false };
}
function performAllianceAction(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { action, now, actor } = input;
  const alliance = input.alliance;
  const out = { alliance, actor, target: (_a = input.target) != null ? _a : null, memberships: {}, logs: [], notifications: {} };
  const log = (entry) => out.logs.push(__spreadValues({ actorUid: actor.uid, actorPseudo: actor.pseudo, createdAtMs: now }, entry));
  const research = (a) => memberLevels(a);
  switch (action == null ? void 0 : action.type) {
    case "create": {
      if (actor.allianceId) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      out.alliance = newAlliance({ uid: actor.uid, pseudo: actor.pseudo }, action.name, action.tag, now);
      setStat(actor, "allianceFounded", 1);
      return out;
    }
    case "join": {
      if (!alliance) throw new GameActionError("Cette alliance n'existe plus.");
      if (actor.allianceId && actor.allianceId !== alliance.id) throw new GameActionError("Quitte d'abord ton alliance actuelle.");
      out.alliance = addMember(alliance, { uid: actor.uid, pseudo: actor.pseudo });
      out.memberships[actor.uid] = { allianceId: alliance.id, allianceResearch: research(alliance) };
      log({ kind: "join" });
      return out;
    }
    case "leave": {
      if (!alliance || !alliance.members.includes(actor.uid)) {
        out.memberships[actor.uid] = { allianceId: "", allianceResearch: {} };
        out.alliance = alliance;
        return out;
      }
      out.alliance = removeMember(alliance, actor.uid);
      out.memberships[actor.uid] = { allianceId: "", allianceResearch: {} };
      log({ kind: "leave" });
      return out;
    }
    case "kick": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const targetPseudo = (_b = alliance.memberPseudos[action.targetUid]) != null ? _b : "?";
      out.alliance = kickMember(alliance, actor.uid, String((_c = action.targetUid) != null ? _c : ""));
      out.memberships[action.targetUid] = { allianceId: "", allianceResearch: {} };
      out.notifications[action.targetUid] = [note("Exclu de l'alliance", `${actor.pseudo} t'a exclu de [${alliance.tag}] ${alliance.name}.`, now)];
      log({ kind: "kick", targetUid: action.targetUid, targetPseudo });
      return out;
    }
    case "promote":
    case "demote": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = setOfficer(alliance, actor.uid, String((_d = action.targetUid) != null ? _d : ""), action.type === "promote");
      return out;
    }
    case "setRole": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      out.alliance = setRole(alliance, actor.uid, String((_e = action.targetUid) != null ? _e : ""), action.role);
      return out;
    }
    case "deposit": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const amounts = parseAmounts(action.resources);
      out.alliance = deposit(alliance, actor, amounts);
      bumpStat(actor, "donated", Object.values(amounts).reduce((a, b) => a + (b != null ? b : 0), 0));
      log({ kind: "deposit", resources: amounts });
      return out;
    }
    case "distribute": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const target = input.target;
      if (!target || target.uid !== action.targetUid) throw new GameActionError("Ce joueur est introuvable.");
      const amounts = parseAmounts(action.resources);
      out.alliance = distribute(alliance, actor.uid, target.uid, amounts, now);
      for (const [res, amount3] of Object.entries(amounts)) target.resources[res] = ((_f = target.resources[res]) != null ? _f : 0) + amount3;
      out.notifications[target.uid] = [note("Versement du tr\xE9sor", `${actor.pseudo} t'a vers\xE9 des ressources du tr\xE9sor de l'alliance.`, now)];
      log({ kind: "distribute", targetUid: target.uid, targetPseudo: target.pseudo, resources: amounts });
      return out;
    }
    case "research": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const started = startAllianceResearch(alliance, actor.uid, String((_g = action.researchId) != null ? _g : ""), now);
      out.alliance = started;
      const def3 = findAllianceResearch(started.activeResearch.id);
      log({ kind: "research", text: `${def3.name} niveau ${started.activeResearch.level}`, resources: allianceResearchCost(started.activeResearch.level) });
      return out;
    }
    case "project": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const source = action.source === "treasury" ? "treasury" : "self";
      const res = fundAllianceProject(alliance, actor, String((_h = action.projectId) != null ? _h : ""), source, parseAmounts(action.resources), now);
      out.alliance = res.alliance;
      const def3 = findAllianceProject(String(action.projectId));
      const next = projectState(alliance, def3.id).level + 1;
      if (source === "self") bumpStat(actor, "donated", Object.values(res.used).reduce((a, b) => a + (b != null ? b : 0), 0));
      log({ kind: "project", text: `${def3.name} niveau ${next}${source === "treasury" ? " (tr\xE9sor)" : ""}${res.started ? " : financ\xE9, construction lanc\xE9e" : ""}`, resources: res.used });
      if (res.started) {
        for (const uid of alliance.members) {
          out.notifications[uid] = [note("Projet d'alliance financ\xE9", `${def3.emoji} ${def3.name} niveau ${next} : construction lanc\xE9e.`, now)];
        }
      }
      return out;
    }
    default:
      throw new GameActionError("Action d'alliance inconnue.");
  }
}
function finishAllianceResearch(alliance, now) {
  var _a, _b, _c, _d;
  const done = completeAllianceResearch(alliance, now);
  const built = completeAllianceProjects(done.alliance, now);
  if (!done.completed && built.completed.length === 0) return null;
  const labels = [];
  const logs = [];
  if (done.completed) {
    const def3 = findAllianceResearch(done.completed.id);
    const label3 = `${(_a = def3 == null ? void 0 : def3.name) != null ? _a : done.completed.id} niveau ${done.completed.level}`;
    labels.push(`${(_b = def3 == null ? void 0 : def3.emoji) != null ? _b : ""} ${label3}`.trim());
    logs.push({ kind: "research-done", actorUid: "", actorPseudo: "", text: label3, createdAtMs: now });
  }
  for (const c of built.completed) {
    const def3 = findAllianceProject(c.id);
    const label3 = `${(_c = def3 == null ? void 0 : def3.name) != null ? _c : c.id} niveau ${c.level}`;
    labels.push(`${(_d = def3 == null ? void 0 : def3.emoji) != null ? _d : ""} ${label3}`.trim());
    logs.push({ kind: "project-done", actorUid: "", actorPseudo: "", text: label3, createdAtMs: now });
  }
  const memberships = {};
  const notifications = {};
  const title = done.completed && built.completed.length === 0 ? "Recherche d'alliance termin\xE9e" : built.completed.length && !done.completed ? "Projet d'alliance achev\xE9" : "Alliance : travaux termin\xE9s";
  for (const uid of built.alliance.members) {
    memberships[uid] = { allianceId: alliance.id, allianceResearch: memberLevels(built.alliance) };
    notifications[uid] = [note(title, `${labels.join(" \xB7 ")} : le bonus s'applique \xE0 tous les membres.`, now)];
  }
  return { alliance: built.alliance, memberships, notifications, logs };
}

// src/game/relics.ts
var RARITIES = [
  { id: "common", label: "Commune", pct: 0.03, weight: 60, recycle: 5, color: "#cbd5e1" },
  { id: "rare", label: "Rare", pct: 0.06, weight: 28, recycle: 15, color: "#4be8ff" },
  { id: "epic", label: "\xC9pique", pct: 0.1, weight: 10, recycle: 40, color: "#a78bfa" },
  { id: "legendary", label: "L\xE9gendaire", pct: 0.15, weight: 2, recycle: 100, color: "#ffd86b" },
  // v5.1 : une seule par saison sur tout le serveur, jamais tirée au hasard.
  { id: "mythic", label: "Mythique", pct: 0.2, weight: 0, recycle: 0, color: "#ff5df0" }
];
var DEFAULT_RELICS = [
  { id: "engrenage_varan", name: "Engrenage de Varan", effect: "attack", lore: "Arrach\xE9 au poste de tir d'un croiseur de la Confr\xE9rie." },
  { id: "ecaille_leviathan", name: "\xC9caille de L\xE9viathan", effect: "defense", lore: "Une plaque de carapace qui encaisse encore les tirs." },
  { id: "noyau_forge", name: "Noyau de forge", effect: "build_time", lore: "Il chauffe sans jamais s'\xE9teindre." },
  { id: "codex_aube", name: "Codex de l'Aube", effect: "research_time", lore: "Des \xE9quations interdites, recopi\xE9es \xE0 la main." },
  { id: "matrice_reparation", name: "Matrice de r\xE9paration", effect: "repair", lore: "Des nanites qui referment les coques d\xE9chir\xE9es." },
  { id: "soute_pliee", name: "Soute pli\xE9e", effect: "cargo", lore: "Plus grande dedans que dehors." },
  { id: "oeil_vesper", name: "\u0152il de Vesper", effect: "spy", lore: "Une lentille du Ch\u0153ur qui voit \xE0 travers les blindages." },
  { id: "racine_ferraille", name: "Racine de ferraille", effect: "production_scrap", lore: "Un organisme qui dig\xE8re le m\xE9tal et en recrache le double." },
  { id: "cellule_stellaire", name: "Cellule stellaire", effect: "production_energy", lore: "Un fragment d'\xE9toile en bouteille." },
  { id: "essaim_nanites", name: "Essaim de nanites", effect: "production_nano", lore: "Des milliards d'ouvri\xE8res qui ne dorment jamais." },
  { id: "cristal_memoriel", name: "Cristal m\xE9moriel", effect: "production_data", lore: "Il se souvient de civilisations disparues." },
  { id: "couronne_essaim", name: "Couronne de l'Essaim", effect: "production_all", lore: "Port\xE9e jadis par la Reine des Kesh'Vaar.", legendaryOnly: true },
  { id: "egide_reine", name: "\xC9gide de la Reine", effect: "aegis", lore: "Chaque semaine, la premi\xE8re d\xE9faite n'est pas pill\xE9e.", legendaryOnly: true },
  // v5.1 : reliques mythiques, une par saison (le modèle tourne d'une saison à l'autre).
  { id: "coeur_leviathan", name: "C\u0153ur du L\xE9viathan", effect: "boss_damage", lore: "Il bat encore, et sa col\xE8re guide tes salves contre les colosses.", mythicOnly: true },
  { id: "couronne_ambre", name: "Couronne d'ambre", effect: "production_all", lore: "Taill\xE9e dans l'ambre de la premi\xE8re Reine, elle fait fructifier l'empire.", mythicOnly: true },
  { id: "oeil_neant", name: "\u0152il du N\xE9ant", effect: "attack", lore: "Ce qu'il regarde cesse d'exister.", mythicOnly: true },
  { id: "egide_stellaire", name: "\xC9gide stellaire", effect: "defense", lore: "Un bouclier forg\xE9 au c\u0153ur d'une \xE9toile mourante.", mythicOnly: true }
];
var RELICS = DEFAULT_RELICS.map((t) => __spreadValues({}, t));
var DEFAULT_RARITY_VALUES = Object.fromEntries(
  RARITIES.map((r) => [r.id, { pct: r.pct, weight: r.weight, recycle: r.recycle }])
);
function defaultRelicSettings() {
  return {
    slots: 3,
    extraSlotAscensions: 1,
    maxItems: 30,
    fuseCount: 3,
    expeditionBase: 0.05,
    expeditionPerHour: 0.1 / 6,
    expeditionMax: 0.15,
    rarities: structuredClone(DEFAULT_RARITY_VALUES)
  };
}
function setRelics(defs, settings) {
  const byId = new Map(DEFAULT_RELICS.map((t) => [t.id, __spreadProps(__spreadValues({}, t), { disabled: true })]));
  for (const t of defs) byId.set(t.id, __spreadValues({}, t));
  RELICS.splice(0, RELICS.length, ...byId.values());
  const _a = settings, { rarities } = _a, rules = __objRest(_a, ["rarities"]);
  Object.assign(RELIC_RULES, rules);
  for (const r of RARITIES) {
    const v = rarities == null ? void 0 : rarities[r.id];
    if (!v) continue;
    r.pct = Number(v.pct) || 0;
    r.weight = r.id === "mythic" ? 0 : Math.max(0, Number(v.weight) || 0);
    r.recycle = Math.max(0, Math.round(Number(v.recycle) || 0));
  }
}
function mythicTemplates() {
  const active = RELICS.filter((t) => t.mythicOnly && !t.disabled);
  return active.length > 0 ? active : DEFAULT_RELICS.filter((t) => t.mythicOnly);
}
function mythicFor(seasonId) {
  const [y, m] = seasonId.split("-").map(Number);
  const index = (Number.isFinite(y) ? y : 0) * 12 + (Number.isFinite(m) ? m - 1 : 0);
  const pool = mythicTemplates();
  return { template: pool[index % pool.length], source: (Number.isFinite(m) ? m : 1) % 2 === 1 ? "leviathan" : "seasonboss" };
}
var RELIC_EFFECT_IDS = ["attack", "defense", "build_time", "research_time", "repair", "cargo", "spy", "production_scrap", "production_energy", "production_nano", "production_data", "production_all", "aegis", "boss_damage"];
function validateRelics(defs, settings) {
  var _a, _b, _c;
  const errors = [];
  const ids = /* @__PURE__ */ new Set();
  for (const t of defs) {
    const label3 = `Relique ${t.name || t.id}`;
    if (!/^[a-z0-9_]+$/.test((_a = t.id) != null ? _a : "")) errors.push(`${label3} : identifiant invalide (minuscules, chiffres, _).`);
    if (ids.has(t.id)) errors.push(`${label3} : identifiant en double.`);
    ids.add(t.id);
    if (!((_b = t.name) == null ? void 0 : _b.trim())) errors.push(`${label3} : nom manquant.`);
    if (!RELIC_EFFECT_IDS.includes(t.effect)) errors.push(`${label3} : effet \xAB ${t.effect} \xBB inconnu.`);
    if (t.legendaryOnly && t.mythicOnly) errors.push(`${label3} : r\xE9serv\xE9e aux l\xE9gendaires OU aux mythiques, pas les deux.`);
  }
  if (!defs.some((t) => !t.disabled && !t.legendaryOnly && !t.mythicOnly)) errors.push("Reliques : il faut au moins une relique active ordinaire (tirable \xE0 toutes les raret\xE9s).");
  const int = (v, min) => Number.isInteger(v) && v >= min;
  if (!int(settings.slots, 1)) errors.push("Reliques : emplacements \u2265 1.");
  if (!int(settings.maxItems, 1)) errors.push("Reliques : inventaire \u2265 1.");
  if (!int(settings.fuseCount, 2)) errors.push("Reliques : fusion \u2265 2 reliques.");
  if (!(settings.expeditionBase >= 0 && settings.expeditionBase <= 1)) errors.push("Reliques : chance en exp\xE9dition entre 0 et 1.");
  if (!(settings.expeditionMax >= 0 && settings.expeditionMax <= 1)) errors.push("Reliques : plafond en exp\xE9dition entre 0 et 1.");
  if (!(settings.expeditionPerHour >= 0)) errors.push("Reliques : chance par heure \u2265 0.");
  for (const r of RARITIES) {
    const v = (_c = settings.rarities) == null ? void 0 : _c[r.id];
    if (!v) continue;
    if (!(v.pct >= 0 && v.pct <= 1)) errors.push(`Reliques, ${r.label} : bonus entre 0 et 1 (0,06 = 6 %).`);
    if (r.id !== "mythic" && !(v.weight >= 0)) errors.push(`Reliques, ${r.label} : poids de tirage \u2265 0.`);
  }
  if (RARITIES.filter((r) => r.id !== "mythic").every((r) => {
    var _a2, _b2;
    return !(((_b2 = (_a2 = settings.rarities) == null ? void 0 : _a2[r.id]) == null ? void 0 : _b2.weight) > 0);
  })) errors.push("Reliques : au moins une raret\xE9 doit avoir un poids de tirage.");
  return errors;
}
function mythicRelic(seasonId, now, random = Math.random) {
  return { id: newId(now, random), template: mythicFor(seasonId).template.id, rarity: "mythic", foundAtMs: now, source: `mythic:${seasonId}` };
}
var RELIC_RULES = {
  slots: 3,
  /** Emplacement supplémentaire à partir de cette ascension. */
  extraSlotAscensions: 1,
  maxItems: 30,
  fuseCount: 3,
  /** Expédition : 5 % à 2 h, jusqu'à 15 % à 8 h. */
  expeditionBase: 0.05,
  expeditionPerHour: 0.1 / 6,
  /** Plafond de la chance en expédition. */
  expeditionMax: 0.15
};
function relicsState(player) {
  var _a, _b;
  const raw = (_a = player.relics) != null ? _a : {};
  const items = (Array.isArray(raw.items) ? raw.items : []).filter((r) => r && findTemplate(r.template) && RARITIES.some((x) => x.id === r.rarity));
  const ids = new Set(items.map((r) => r.id));
  const slots = (Array.isArray(raw.slots) ? raw.slots : []).map((s) => s && ids.has(s) ? s : null);
  return { items, slots, aegisWeek: String((_b = raw.aegisWeek) != null ? _b : "") };
}
function findTemplate(id) {
  return RELICS.find((t) => t.id === id);
}
function rarityInfo(r) {
  var _a;
  return (_a = RARITIES.find((x) => x.id === r)) != null ? _a : RARITIES[0];
}
function relicSlots(player) {
  var _a;
  return RELIC_RULES.slots + (((_a = player.ascensions) != null ? _a : 0) >= RELIC_RULES.extraSlotAscensions ? 1 : 0);
}
function equippedRelics(player) {
  const st = relicsState(player);
  const n = relicSlots(player);
  return st.slots.slice(0, n).map((id) => st.items.find((r) => r.id === id)).filter((r) => !!r);
}
function relicBonus(item) {
  return rarityInfo(item.rarity).pct;
}
function relicLabel(item) {
  var _a, _b;
  return `${(_b = (_a = findTemplate(item.template)) == null ? void 0 : _a.name) != null ? _b : "Relique"} (${rarityInfo(item.rarity).label.toLowerCase()})`;
}
var PRODUCTION_EFFECT = {
  production_scrap: "scrap",
  production_energy: "energy",
  production_nano: "nano",
  production_data: "data"
};
function newId(now, random) {
  return `${now.toString(36)}${Math.floor(random() * 1e9).toString(36)}`;
}
function rollRelic(source, now, random = Math.random, minRarity = "common") {
  const order = RARITIES.map((r) => r.id);
  const pool = RARITIES.filter((r) => r.id !== "mythic" && order.indexOf(r.id) >= order.indexOf(minRarity));
  const total2 = pool.reduce((a, r) => a + r.weight, 0);
  let pick2 = random() * total2;
  let rarity = pool[pool.length - 1].id;
  for (const r of pool) {
    pick2 -= r.weight;
    if (pick2 < 0) {
      rarity = r.id;
      break;
    }
  }
  const templates = RELICS.filter((t) => !t.disabled && !t.mythicOnly && (!t.legendaryOnly || rarity === "legendary"));
  const template = templates[Math.floor(random() * templates.length) % templates.length];
  return { id: newId(now, random), template: template.id, rarity, foundAtMs: now, source };
}
function addRelic(player, item) {
  const st = relicsState(player);
  if (st.items.length >= RELIC_RULES.maxItems) return false;
  st.items.push(item);
  player.relics = st;
  return true;
}
function grantMythicRelic(player, source, now, given, random = Math.random) {
  const d = new Date(now);
  const seasonId = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const def3 = mythicFor(seasonId);
  if (def3.source !== source || given[seasonId]) return null;
  const st = relicsState(player);
  st.items.push(mythicRelic(seasonId, now, random));
  player.relics = st;
  return { given: __spreadProps(__spreadValues({}, given), { [seasonId]: player.uid }), name: def3.template.name };
}
function expeditionRelicChance(hours2) {
  return Math.min(RELIC_RULES.expeditionMax, RELIC_RULES.expeditionBase + Math.max(0, hours2 - 2) * RELIC_RULES.expeditionPerHour);
}
function equipRelic(player, slotIn, relicId) {
  var _a;
  const st = relicsState(player);
  const n = relicSlots(player);
  const slot = Math.floor(Number(slotIn));
  if (!(slot >= 0 && slot < n)) throw new GameActionError("Emplacement invalide.");
  while (st.slots.length < n) st.slots.push(null);
  if (relicId === null || relicId === "") {
    st.slots[slot] = null;
  } else {
    const item = st.items.find((r) => r.id === relicId);
    if (!item) throw new GameActionError("Relique introuvable.");
    const t = findTemplate(item.template);
    const other = st.slots.findIndex((id, i) => {
      var _a2;
      return i !== slot && id && ((_a2 = st.items.find((r) => r.id === id)) == null ? void 0 : _a2.template) === item.template;
    });
    if (other >= 0) throw new GameActionError(`${(_a = t == null ? void 0 : t.name) != null ? _a : "Cette relique"} est d\xE9j\xE0 \xE9quip\xE9e.`);
    for (let i = 0; i < st.slots.length; i++) if (st.slots[i] === item.id) st.slots[i] = null;
    st.slots[slot] = item.id;
  }
  player.relics = st;
}
function fuseRelics(player, template, rarity, now, random = Math.random) {
  const st = relicsState(player);
  const order = RARITIES.map((r) => r.id);
  const idx = order.indexOf(rarity);
  if (idx < 0 || idx >= order.length - 1 || order[idx + 1] === "mythic") throw new GameActionError("Ces reliques ne peuvent plus fusionner.");
  const equipped = new Set(st.slots.filter(Boolean));
  const same = st.items.filter((r) => r.template === template && r.rarity === rarity && !equipped.has(r.id));
  if (same.length < RELIC_RULES.fuseCount) throw new GameActionError(`Il faut ${RELIC_RULES.fuseCount} reliques identiques non \xE9quip\xE9es.`);
  const used = new Set(same.slice(0, RELIC_RULES.fuseCount).map((r) => r.id));
  const fused = { id: newId(now, random), template: String(template), rarity: order[idx + 1], foundAtMs: now, source: "fusion" };
  st.items = [...st.items.filter((r) => !used.has(r.id)), fused];
  player.relics = st;
  return fused;
}
function recycleRelic(player, relicId) {
  const st = relicsState(player);
  const item = st.items.find((r) => r.id === relicId);
  if (!item) throw new GameActionError("Relique introuvable.");
  if (st.slots.includes(item.id)) throw new GameActionError("Retire d'abord cette relique de son emplacement.");
  if (item.rarity === "mythic") throw new GameActionError("Une relique mythique ne se recycle pas.");
  st.items = st.items.filter((r) => r.id !== item.id);
  player.relics = st;
  return { item, amber: rarityInfo(item.rarity).recycle };
}
function aegisWeek(now) {
  const DAY11 = 864e5;
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY11) * DAY11;
  return new Date(midnight - (day + 6) % 7 * DAY11).toISOString().slice(0, 10);
}
function consumeAegis(player, now) {
  if (!equippedRelics(player).some((r) => {
    var _a;
    return ((_a = findTemplate(r.template)) == null ? void 0 : _a.effect) === "aegis";
  })) return false;
  const st = relicsState(player);
  const week = aegisWeek(now);
  if (st.aegisWeek === week) return false;
  st.aegisWeek = week;
  player.relics = st;
  return true;
}

// src/game/galaxy.ts
function hashString(input, seed) {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function galaxyCoords(uid) {
  return {
    galaxy: 1 + hashString(uid, 3) % 9,
    system: 1 + hashString(uid, 4) % 499,
    position: 1 + hashString(uid, 5) % 15,
    x: hashString(uid, 1) / 4294967296,
    y: hashString(uid, 2) / 4294967296
  };
}

// src/game/territories.ts
var TERRITORY_RULES = {
  cols: 6,
  rows: 4,
  minLevels: 150,
  bonusPerSector: 0.02,
  maxBonus: 0.06,
  /** Le bonus écrit sur le joueur reste valable ce délai (h) sans recalcul. */
  validHours: 3
};
var SECTOR_COUNT = TERRITORY_RULES.cols * TERRITORY_RULES.rows;
function sectorOf(planetId) {
  const c = galaxyCoords(planetId);
  const col = Math.min(TERRITORY_RULES.cols - 1, Math.floor(c.x * TERRITORY_RULES.cols));
  const row = Math.min(TERRITORY_RULES.rows - 1, Math.floor(c.y * TERRITORY_RULES.rows));
  return row * TERRITORY_RULES.cols + col;
}
function levelsOf(b) {
  return Object.values(b != null ? b : {}).reduce((a, s) => {
    var _a;
    return a + ((_a = s == null ? void 0 : s.level) != null ? _a : 0);
  }, 0);
}
function computeTerritories(players, now) {
  var _a, _b, _c;
  const per = Array.from({ length: SECTOR_COUNT }, () => /* @__PURE__ */ new Map());
  const presence = /* @__PURE__ */ new Map();
  for (const p of players) {
    if (!p.allianceId) continue;
    const planets = [{ id: p.uid, buildings: p.buildings }, ...(_a = p.colonies) != null ? _a : []];
    const here = /* @__PURE__ */ new Set();
    for (const planet of planets) {
      const s = sectorOf(planet.id);
      here.add(s);
      per[s].set(p.allianceId, ((_b = per[s].get(p.allianceId)) != null ? _b : 0) + levelsOf(planet.buildings));
    }
    presence.set(p.uid, here);
  }
  const sectors = per.map((m, id) => {
    var _a2;
    const ranked = [...m.entries()].map(([allianceId, levels]) => ({ allianceId, levels })).sort((a, b) => b.levels - a.levels);
    const top = ranked[0];
    const held = top && top.levels >= TERRITORY_RULES.minLevels && !(ranked[1] && ranked[1].levels === top.levels);
    return { id, allianceId: held ? top.allianceId : "", levels: (_a2 = top == null ? void 0 : top.levels) != null ? _a2 : 0, contenders: ranked.slice(0, 3) };
  });
  const byUid = {};
  for (const p of players) {
    const held = [...(_c = presence.get(p.uid)) != null ? _c : []].filter((s) => p.allianceId && sectors[s].allianceId === p.allianceId).sort((a, b) => a - b);
    byUid[p.uid] = { pct: Math.min(TERRITORY_RULES.maxBonus, held.length * TERRITORY_RULES.bonusPerSector), sectors: held, untilMs: now + TERRITORY_RULES.validHours * 36e5 };
  }
  return { sectors, byUid };
}
function territoryBonus(t, now) {
  return t && t.untilMs > now ? Math.min(TERRITORY_RULES.maxBonus, Math.max(0, t.pct)) : 0;
}

// src/game/production.ts
function getProductionBonus(techLevels2) {
  return techBonus(techLevels2, "energy_efficiency");
}
function getProductionRatesPerSecond(buildings, techLevels2) {
  var _a;
  const bonus = getProductionBonus(techLevels2);
  const rates = {};
  for (const building of BUILDINGS) {
    const resource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
    if (!resource) continue;
    const state = buildings[building.id];
    const level3 = (_a = state == null ? void 0 : state.level) != null ? _a : 0;
    const unlocked = building.startsUnlocked || (state == null ? void 0 : state.unlocked) === true;
    if (level3 <= 0 || !unlocked) continue;
    const base = productionPerSecond(building.id, level3);
    rates[resource] = Math.floor(base * (1 + bonus + techBonus(techLevels2, "resource_production", resource)));
  }
  return rates;
}

// src/game/adminTools.ts
function finishAllTimers(queues, now) {
  var _a, _b, _c, _d, _e;
  const out = { buildings: 0, researches: 0, units: 0, missions: 0 };
  for (const entry of Object.values((_a = queues.buildingUpgrades) != null ? _a : {})) {
    if (entry && entry.endTime > now) {
      entry.endTime = now;
      out.buildings++;
    }
  }
  for (const r of (_b = queues.activeResearches) != null ? _b : []) {
    if (r.endTime > now) {
      r.endTime = now;
      out.researches++;
    }
  }
  for (const category of ["attack", "defense"]) {
    for (const e3 of (_d = (_c = queues.unitQueues) == null ? void 0 : _c[category]) != null ? _d : []) {
      if (e3.endTime === null || e3.endTime > now) {
        e3.endTime = now;
        out.units++;
      }
    }
  }
  for (const m of (_e = queues.activeMissions) != null ? _e : []) {
    if (m.endTime > now) {
      m.endTime = now;
      out.missions++;
    }
  }
  return out;
}
function clearOfficerCooldowns(player) {
  const st = commandersState(player);
  const n = Object.keys(st.movedAtMs).length;
  player.commanders = __spreadProps(__spreadValues({}, st), { movedAtMs: {} });
  return n;
}
function grantResources(player, input) {
  var _a;
  const raw = input && typeof input === "object" ? input : {};
  const given = {};
  for (const r of RESOURCE_LIST) {
    const n = Math.floor(Number(raw[r.id]) || 0);
    if (n <= 0) continue;
    player.resources[r.id] = ((_a = player.resources[r.id]) != null ? _a : 0) + n;
    given[r.id] = n;
  }
  return given;
}

// src/game/defaults.ts
function defaultResources() {
  return {
    scrap: 100,
    energy: 50,
    nano: 0,
    data: 0,
    reinforcedSteel: 0,
    cyberModule: 0,
    syntheticNanites: 0,
    aiFragment: 0
  };
}
function defaultPlayerState(uid, pseudo) {
  return {
    uid,
    pseudo,
    resources: defaultResources(),
    buildings: defaultBuildings(),
    units: {},
    techLevels: {},
    bonuses: {
      energyEfficiency: 0,
      unitDefenseBonus: 0,
      unitAttackBonus: 0,
      buildingUpgradeDiscount: 0,
      unlockedRecipes: 0
    },
    xp: 0,
    seasonId: currentSeasonId(),
    seasonXp: 0,
    victories: 0,
    defeats: 0,
    playtimeSeconds: 0,
    resourcesUpdatedAtMs: Date.now(),
    resourceHistory: [],
    unlockedAchievements: []
  };
}
function defaultQueues() {
  return {
    buildingUpgrades: {},
    unitQueues: { attack: [], defense: [] },
    activeResearches: [],
    activeMissions: [],
    buildPlan: []
  };
}

// src/game/ascension.ts
var ASCENSION_RULES = {
  productionPerAscension: 0.1,
  buildTimePerAscension: 0.05,
  maxAscensions: 5,
  cooldownDays: 7,
  shieldHours: 72,
  upkeepFreeDays: 7
};
var DAY2 = 24 * 36e5;
function ascensionCount(player) {
  return Math.max(0, Math.min(ASCENSION_RULES.maxAscensions, Math.floor(Number(player == null ? void 0 : player.ascensions) || 0)));
}
function ascensionProductionFactor(player) {
  return 1 + ascensionCount(player) * ASCENSION_RULES.productionPerAscension;
}
function ascensionBuildTimeFactor(player) {
  return Math.max(0.1, 1 - ascensionCount(player) * ASCENSION_RULES.buildTimePerAscension);
}
function upkeepFreeUntil(player) {
  const at = Number(player == null ? void 0 : player.ascendedAtMs) || 0;
  return at > 0 ? at + ASCENSION_RULES.upkeepFreeDays * DAY2 : 0;
}
function canAscend(player, queues, now) {
  var _a;
  const missing = BUILDINGS.filter((b) => {
    var _a2, _b;
    return !b.endgame && ((_b = (_a2 = player.buildings[b.id]) == null ? void 0 : _a2.level) != null ? _b : 0) < b.maxLevel;
  }).map((b) => {
    var _a2, _b;
    return {
      id: b.id,
      name: b.name,
      level: (_b = (_a2 = player.buildings[b.id]) == null ? void 0 : _a2.level) != null ? _b : 0,
      maxLevel: b.maxLevel
    };
  });
  if (ascensionCount(player) >= ASCENSION_RULES.maxAscensions) return { ok: false, reason: `Tu as atteint le maximum de ${ASCENSION_RULES.maxAscensions} ascensions.`, missing };
  if (missing.length > 0) return { ok: false, reason: "Tous tes b\xE2timents doivent \xEAtre au niveau maximal.", missing };
  const wait = (Number(player.ascendedAtMs) || 0) + ASCENSION_RULES.cooldownDays * DAY2 - now;
  if (player.ascendedAtMs && wait > 0) return { ok: false, reason: `Prochaine ascension possible dans ${Math.ceil(wait / DAY2)} jour(s).`, missing };
  if (queues && Object.keys((_a = queues.buildingUpgrades) != null ? _a : {}).length > 0) return { ok: false, reason: "Termine d'abord tes constructions en cours.", missing };
  return { ok: true, missing };
}
function ascend(player, queues, now) {
  var _a;
  const check = canAscend(player, queues, now);
  if (!check.ok) throw new GameActionError((_a = check.reason) != null ? _a : "Ascension impossible.");
  for (const b of BUILDINGS) {
    if (b.endgame) continue;
    const cur = player.buildings[b.id];
    player.buildings[b.id] = __spreadProps(__spreadValues({}, cur != null ? cur : { unlocked: !!b.startsUnlocked }), { level: 1 });
  }
  player.resources = defaultResources();
  player.resourceHistory = [];
  player.ascensions = ascensionCount(player) + 1;
  player.ascendedAtMs = now;
  bumpStat(player, "ascensions");
}

// src/game/bonuses.ts
function playerBuildTimeFactor(player, now) {
  if (player.testMode) return 0;
  return buildTimeFactor(now) * techReductionFactor(player.techLevels, "building_time") * allianceForgeFactor(player.allianceResearch) * ascensionBuildTimeFactor(player) * (1 - playerModifiers(player).buildTime);
}
function playerResearchTimeFactor(player, now) {
  if (player.testMode) return 0;
  return researchTimeFactor(now) * techReductionFactor(player.techLevels, "research_time") * allianceForgeFactor(player.allianceResearch) * (1 - playerModifiers(player).researchTime);
}

// src/game/economy.ts
var ECONOMY_RULES = {
  /** Énergie consommée par seconde et par place de hangar occupée. */
  upkeepPerPlaceAttack: 0.015,
  upkeepPerPlaceDefense: 75e-4,
  /** Production des autres ressources pendant une panne d'énergie. */
  outageProductionFactor: 0.5,
  /** Part de la capacité de l'entrepôt à l'abri du pillage. */
  protectedStoragePct: 0.1,
  /** Missions : ressources communes = au moins ce multiple de (durée × production). */
  missionProductionMultiplier: 1.5,
  /** Missions : ressources rares × (1 + niveaux de bâtiments cumulés / ce diviseur). */
  missionRareLevelDivisor: 35,
  /** Rares (missions, contrats, coffre) : au moins récompense × production horaire / cette référence. */
  // v5.4 : 500 000 → 150 000 (les missions rares valaient < 1 % d'une heure de production en fin de partie).
  missionRareProductionRef: 15e4
};
var COMMON_RESOURCES2 = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => r.id);
var KESH_BOOST_PCT = 0.2;
function boostUntil(input) {
  var _a;
  const v = Number((_a = input.bounties) == null ? void 0 : _a.boostUntilMs);
  return Number.isFinite(v) ? v : 0;
}
function boostAt(input, at) {
  return at < boostUntil(input) ? 1 + KESH_BOOST_PCT : 1;
}
function storageCapacityOf(input) {
  const base = getStorageCapacity(input.buildings, input.techLevels);
  const bonus = input.commanders ? playerModifiers(input).storage : 0;
  return bonus > 0 && Number.isFinite(base) ? Math.floor(base * (1 + bonus)) : base;
}
function getFleetUpkeep(units, techLevels2) {
  let upkeep = 0;
  for (const [id, state] of Object.entries(units != null ? units : {})) {
    const def3 = findUnit(id);
    if (!def3 || !(state == null ? void 0 : state.count)) continue;
    const perPlace = def3.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense;
    upkeep += state.count * def3.hangarSpace * perPlace;
  }
  return upkeep * techReductionFactor(techLevels2, "fleet_upkeep");
}
function boostedRates(input, multipliers, boost = 1) {
  var _a, _b, _c, _d;
  const gross = getProductionRatesPerSecond(input.buildings, input.techLevels);
  const alliance = allianceProductionFactor(input.allianceResearch) * ascensionProductionFactor(input) * boost;
  if (alliance !== 1) for (const res of Object.keys(gross)) gross[res] = ((_a = gross[res]) != null ? _a : 0) * alliance;
  const mods = playerModifiers(input);
  for (const res of Object.keys(gross)) {
    const f = 1 + mods.productionAll + ((_b = mods.production[res]) != null ? _b : 0);
    if (f !== 1) gross[res] = ((_c = gross[res]) != null ? _c : 0) * f;
  }
  for (const [res, m] of Object.entries(multipliers)) {
    if (gross[res] && m) gross[res] = ((_d = gross[res]) != null ? _d : 0) * m;
  }
  return gross;
}
function economySnapshot(input, now) {
  var _a, _b, _c, _d;
  const gross = boostedRates(input, now === void 0 ? {} : productionMultipliers(now), now === void 0 ? 1 : boostAt(input, now));
  const upkeep = now !== void 0 && now < upkeepFreeUntil(input) ? 0 : getFleetUpkeep(input.units, input.techLevels);
  const capacity = storageCapacityOf(input);
  const energyNet = ((_a = gross.energy) != null ? _a : 0) - upkeep;
  const outage = energyNet < 0 && ((_b = input.resources.energy) != null ? _b : 0) <= 0;
  const factor = outage ? ECONOMY_RULES.outageProductionFactor : 1;
  const net = {};
  const full = [];
  for (const r of RESOURCE_LIST) {
    const stock = (_c = input.resources[r.id]) != null ? _c : 0;
    const isCommon = r.rarity === "common";
    const atCap = isCommon && stock >= capacity;
    if (r.id === "energy") {
      net.energy = outage ? 0 : atCap && energyNet > 0 ? 0 : energyNet;
    } else {
      net[r.id] = atCap ? 0 : ((_d = gross[r.id]) != null ? _d : 0) * factor;
    }
    if (atCap) full.push(r.id);
  }
  return { gross, upkeep, net, capacity, outage, full };
}
function addCapped(stock, gain, cap) {
  if (gain <= 0) return Math.max(0, stock + gain);
  if (stock >= cap) return stock;
  return Math.min(cap, stock + gain);
}
function advanceResources(input, elapsedSeconds, startMs) {
  if (startMs === void 0 || elapsedSeconds <= 0) return advanceSegment(input, elapsedSeconds, {});
  const endMs = startMs + elapsedSeconds * 1e3;
  let resources = input.resources;
  let at = startMs;
  const freeUntil = upkeepFreeUntil(input);
  const boostEnd = boostUntil(input);
  const cuts = [
    ...eventBoundaries(startMs, endMs),
    ...freeUntil > startMs && freeUntil < endMs ? [freeUntil] : [],
    ...boostEnd > startMs && boostEnd < endMs ? [boostEnd] : [],
    endMs
  ].sort((a, b) => a - b);
  for (const cut of cuts) {
    if (cut <= at) continue;
    resources = advanceSegment(__spreadProps(__spreadValues({}, input), { resources }), (cut - at) / 1e3, productionMultipliers(at), at < freeUntil, boostAt(input, at));
    at = cut;
  }
  return resources;
}
function advanceSegment(input, elapsedSeconds, multipliers, upkeepFree = false, boost = 1) {
  var _a, _b, _c, _d;
  const out = __spreadValues({}, input.resources);
  if (elapsedSeconds <= 0) return out;
  const gross = boostedRates(input, multipliers, boost);
  const upkeep = upkeepFree ? 0 : getFleetUpkeep(input.units, input.techLevels);
  const capacity = storageCapacityOf(input);
  const capOf = (res) => COMMON_RESOURCES2.includes(res) ? capacity : Infinity;
  const energyNet = ((_a = gross.energy) != null ? _a : 0) - upkeep;
  const energyStock = (_b = out.energy) != null ? _b : 0;
  let normalSeconds = elapsedSeconds;
  if (energyNet < 0) normalSeconds = Math.min(elapsedSeconds, Math.max(0, energyStock) / -energyNet);
  const outageSeconds = elapsedSeconds - normalSeconds;
  out.energy = addCapped(energyStock, energyNet * normalSeconds, capOf("energy"));
  if (outageSeconds > 0) out.energy = 0;
  for (const r of RESOURCE_LIST) {
    if (r.id === "energy") continue;
    const rate = (_c = gross[r.id]) != null ? _c : 0;
    if (!rate) continue;
    const gain = rate * normalSeconds + rate * ECONOMY_RULES.outageProductionFactor * outageSeconds;
    out[r.id] = addCapped((_d = out[r.id]) != null ? _d : 0, gain, capOf(r.id));
  }
  return out;
}
function protectedAmount(buildings, res, techLevels2, allianceLevels) {
  if (!COMMON_RESOURCES2.includes(res)) return 0;
  const capacity = getStorageCapacity(buildings, techLevels2);
  const bastion = allianceBastionBonus(allianceLevels);
  const pct5 = Math.min(TECH_REDUCTION_CAP + bastion, ECONOMY_RULES.protectedStoragePct + techBonus(techLevels2, "protected_storage") + bastion);
  return Number.isFinite(capacity) ? Math.floor(capacity * pct5) : 0;
}
function rareRewardScale(player) {
  var _a;
  const levels = BUILDINGS.reduce((sum3, b) => sum3 + effectiveBuildingLevel(player.buildings, b.id), 0);
  const development = 1 + levels / Math.max(1, ECONOMY_RULES.missionRareLevelDivisor);
  const rates = getProductionRatesPerSecond(player.buildings, (_a = player.techLevels) != null ? _a : {});
  const perHour = COMMON_RESOURCES2.reduce((a, r) => {
    var _a2;
    return a + ((_a2 = rates[r]) != null ? _a2 : 0);
  }, 0) / Math.max(1, COMMON_RESOURCES2.length) * 3600;
  const ref = ECONOMY_RULES.missionRareProductionRef;
  const production = ref > 0 ? perHour / ref : 0;
  return Math.max(development, production);
}
function missionRewards(mission, player) {
  var _a;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const rareScale = rareRewardScale(player);
  const out = {};
  for (const [res, fixed] of Object.entries(mission.reward)) {
    if (res === "xp") out.xp = fixed;
    else if (COMMON_RESOURCES2.includes(res)) {
      const indexed = Math.floor(ECONOMY_RULES.missionProductionMultiplier * mission.duration * ((_a = rates[res]) != null ? _a : 0));
      out[res] = Math.max(fixed, indexed);
    } else out[res] = Math.floor(fixed * rareScale);
  }
  return out;
}

// src/game/colonies.ts
var COLONY_RULES = {
  maxColonies: 2,
  /** Niveaux de bâtiments cumulés (planète mère) requis pour la 1re, puis la 2e colonie. */
  levelsRequired: [120, 140],
  /** Vaisseau colonial : coût par ressource commune et par ressource rare. */
  foundCommonCost: 5e7,
  foundRareCost: 1e6,
  /** Voyage du vaisseau colonial (heures). */
  foundHours: 2,
  /** Stock de départ de chaque ressource commune. */
  startStock: 1e6,
  maxLevel: 15,
  /** Coût des bâtiments d'une colonie : × ce facteur par rapport à la planète mère. */
  costFactor: 1.5
};
var HOUR2 = 36e5;
var DEPOSIT_ID = "gisement";
var BIOMES = {
  reinforcedSteel: { name: "Monde ferreux", deposit: "Mine d'acier profond", lore: "Un noyau satur\xE9 de m\xE9tal : l'acier renforc\xE9 affleure presque \xE0 la surface.", tone: "#9fb4c8" },
  cyberModule: { name: "Cimeti\xE8re d'\xE9paves", deposit: "Atelier de r\xE9cup\xE9ration", lore: "Des flottes enti\xE8res s'y sont \xE9cras\xE9es ; leurs modules dorment sous la poussi\xE8re.", tone: "#5de0ff" },
  syntheticNanites: { name: "Marais de nanites", deposit: "Ruche de nanites", lore: "Une brume grise vivante, que l'on r\xE9colte comme du miel.", tone: "#7cf0b0" },
  aiFragment: { name: "N\xE9cropole d'IA", deposit: "Excavation de noyaux", lore: "Les ruines d'une civilisation de machines, aux m\xE9moires encore chaudes.", tone: "#c792ff" }
};
var RARE_DEPOSITS = Object.keys(BIOMES);
var DEPOSIT_RULES = {
  /** Production par seconde, niveaux 1 à 15. */
  perSecond: [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4, 3],
  /** Coût : celui d'un extracteur de colonie × ce facteur (plus nanocomposants et données). */
  costFactor: 1.2,
  /** Durée : celle d'un extracteur de colonie × ce facteur. */
  timeFactor: 1.5
};
function hashString2(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function biomeFor(seed) {
  return RARE_DEPOSITS[hashString2(seed) % RARE_DEPOSITS.length];
}
function colonyBiome(colony) {
  return colony.biome && BIOMES[colony.biome] ? colony.biome : biomeFor(`${colony.id}:${colony.foundedAtMs}`);
}
function depositLevel(colony) {
  var _a, _b;
  return (_b = (_a = colony.buildings[DEPOSIT_ID]) == null ? void 0 : _a.level) != null ? _b : 1;
}
function depositPerSecond(level3) {
  if (level3 <= 0) return 0;
  return DEPOSIT_RULES.perSecond[Math.min(level3, DEPOSIT_RULES.perSecond.length) - 1];
}
function colonyBuildingName(colony, id) {
  var _a, _b;
  return id === DEPOSIT_ID ? BIOMES[colonyBiome(colony)].deposit : (_b = (_a = findBuilding(id)) == null ? void 0 : _a.name) != null ? _b : id;
}
function colonyBuildingIds() {
  return BUILDINGS.filter((b) => {
    var _a, _b;
    const res = PRODUCTION_RESOURCE_BY_BUILDING[b.id];
    if (res && COMMON_RESOURCES2.includes(res)) return true;
    if (((_a = b.effect) == null ? void 0 : _a.type) === "storage") return true;
    return ((_b = b.effect) == null ? void 0 : _b.type) === "hangar" && b.effect.category === "defense";
  }).map((b) => b.id);
}
function colonyMaxLevel(id) {
  var _a, _b;
  return Math.min((_b = (_a = findBuilding(id)) == null ? void 0 : _a.maxLevel) != null ? _b : COLONY_RULES.maxLevel, COLONY_RULES.maxLevel);
}
function colonyId(uid, slot) {
  return `${uid}-c${slot}`;
}
function colonyOf(player, id) {
  var _a;
  return ((_a = player.colonies) != null ? _a : []).find((c) => c.id === id);
}
function colonyOwnerUid(id) {
  const m = /^(.+)-c(\d+)$/.exec(String(id != null ? id : ""));
  return m ? m[1] : null;
}
function colonyView(player, colony) {
  return __spreadProps(__spreadValues({}, player), { uid: colony.id, pseudo: `${player.pseudo} \u2014 ${colony.name}`, units: colony.defenses, buildings: colony.buildings, resources: colony.resources, posture: void 0, lastDefeatAtMs: colony.lastDefeatAtMs });
}
function emptyResources() {
  return Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, 0]));
}
function homeLevels(player) {
  return BUILDINGS.reduce((a, b) => {
    var _a, _b;
    return a + ((_b = (_a = player.buildings[b.id]) == null ? void 0 : _a.level) != null ? _b : 0);
  }, 0);
}
function colonyFoundCost() {
  const cost = {};
  for (const r of RESOURCE_LIST) cost[r.id] = r.rarity === "rare" ? COLONY_RULES.foundRareCost : COLONY_RULES.foundCommonCost;
  return cost;
}
function nextColonySlot(player) {
  var _a, _b;
  const used = /* @__PURE__ */ new Set([...((_a = player.colonies) != null ? _a : []).map((c) => c.slot), ...player.colonizing ? [player.colonizing.slot] : []]);
  for (let slot = 1; slot <= COLONY_RULES.maxColonies; slot++) {
    if (!used.has(slot)) return { slot, levels: (_b = COLONY_RULES.levelsRequired[slot - 1]) != null ? _b : Infinity };
  }
  return null;
}
function startColonization(player, nameIn, now) {
  var _a;
  if (player.colonizing) throw new GameActionError("Un vaisseau colonial est d\xE9j\xE0 en route.");
  const next = nextColonySlot(player);
  if (!next) throw new GameActionError(`Tu as d\xE9j\xE0 ${COLONY_RULES.maxColonies} colonies.`);
  if (homeLevels(player) < next.levels) throw new GameActionError(`Il faut ${next.levels} niveaux de b\xE2timents cumul\xE9s sur ta plan\xE8te m\xE8re (tu en as ${homeLevels(player)}).`);
  const name = String(nameIn != null ? nameIn : "").trim() || `Colonie ${next.slot}`;
  if (name.length > 30) throw new GameActionError("Le nom d'une colonie fait au plus 30 caract\xE8res.");
  const cost = colonyFoundCost();
  for (const [res, n] of Object.entries(cost)) {
    if (((_a = player.resources[res]) != null ? _a : 0) < n) throw new GameActionError("Ressources insuffisantes pour le vaisseau colonial.");
  }
  for (const [res, n] of Object.entries(cost)) player.resources[res] -= n;
  player.colonizing = { slot: next.slot, name, endTime: now + COLONY_RULES.foundHours * HOUR2 };
  return player.colonizing;
}
function foundColony(uid, job, at) {
  const buildings = {};
  for (const id2 of colonyBuildingIds()) buildings[id2] = { level: 1, unlocked: true };
  const resources = emptyResources();
  for (const res of COMMON_RESOURCES2) resources[res] = COLONY_RULES.startStock;
  buildings[DEPOSIT_ID] = { level: 1, unlocked: true };
  const id = colonyId(uid, job.slot);
  return { id, slot: job.slot, name: job.name, foundedAtMs: at, buildings, resources, updatedAtMs: at, building: null, defenses: {}, defenseJob: null, biome: biomeFor(`${id}:${at}`) };
}
function economyInput(colony, player) {
  return {
    buildings: colony.buildings,
    techLevels: player.techLevels,
    resources: colony.resources,
    units: colony.defenses,
    allianceResearch: player.allianceResearch,
    ascensions: player.ascensions,
    // v5.3 : bonus de l'empire (Intendant, reliques, talents, secteurs, Gelée de la Reine).
    commanders: player.commanders,
    relics: player.relics,
    talents: player.talents,
    territory: player.territory,
    bounties: player.bounties
  };
}
function advanceColony(colony, player, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const notes = [];
  let at = colony.updatedAtMs || now;
  for (let guard = 0; guard < 10; guard++) {
    const next = Math.min((_b = (_a = colony.building) == null ? void 0 : _a.endTime) != null ? _b : Infinity, (_d = (_c = colony.defenseJob) == null ? void 0 : _c.endTime) != null ? _d : Infinity);
    const until = Math.min(next, now);
    if (until > at) {
      colony.resources = advanceResources(economyInput(colony, player), (until - at) / 1e3, at);
      const rare = colonyBiome(colony);
      colony.resources[rare] = ((_e = colony.resources[rare]) != null ? _e : 0) + depositPerSecond(depositLevel(colony)) * ((until - at) / 1e3);
      at = until;
    }
    if (next > now) break;
    if (colony.building && colony.building.endTime <= now) {
      const job = colony.building;
      colony.buildings[job.id] = __spreadProps(__spreadValues({}, (_f = colony.buildings[job.id]) != null ? _f : { unlocked: true }), { level: job.level });
      colony.building = null;
      grantCommanderXp(player, "engineer", COMMANDER_XP.buildingDone);
      notes.push({ kind: "building", title: "Colonie : construction termin\xE9e", message: `${colony.name} : ${colonyBuildingName(colony, job.id)} niveau ${job.level}.`, createdAtMs: now, read: false });
    }
    if (colony.defenseJob && colony.defenseJob.endTime <= now) {
      const job = colony.defenseJob;
      const cur = (_i = colony.defenses[job.unitId]) != null ? _i : { level: (_h = (_g = player.units[job.unitId]) == null ? void 0 : _g.level) != null ? _h : 1, count: 0 };
      colony.defenses[job.unitId] = { level: Math.max(cur.level, (_k = (_j = player.units[job.unitId]) == null ? void 0 : _j.level) != null ? _k : 1), count: cur.count + job.qty };
      colony.defenseJob = null;
      notes.push({ kind: "building", title: "Colonie : d\xE9fenses pr\xEAtes", message: `${colony.name} : ${formatInt(job.qty)} ${(_m = (_l = findUnit(job.unitId)) == null ? void 0 : _l.name) != null ? _m : job.unitId}.`, createdAtMs: now, read: false });
    }
  }
  colony.updatedAtMs = now;
  return notes;
}
function advanceColonies(player, now) {
  var _a, _b;
  const notes = [];
  if (player.colonizing && player.colonizing.endTime <= now) {
    const job = player.colonizing;
    player.colonies = [...(_a = player.colonies) != null ? _a : [], foundColony(player.uid, job, job.endTime)];
    player.colonizing = null;
    notes.push({ kind: "building", title: "Nouvelle colonie !", message: `${job.name} est fond\xE9e : construis ses extracteurs et envoie-lui des ressources.`, createdAtMs: now, read: false });
  }
  for (const c of (_b = player.colonies) != null ? _b : []) notes.push(...advanceColony(c, player, now));
  return notes;
}
function payFrom(resources, cost, what) {
  var _a;
  for (const [res, n] of Object.entries(cost)) {
    if (((_a = resources[res]) != null ? _a : 0) < (n != null ? n : 0)) throw new GameActionError(`Le stock de la colonie ne suffit pas pour ${what}.`);
  }
  for (const [res, n] of Object.entries(cost)) resources[res] -= n != null ? n : 0;
}
function colonyUpgradeCost(player, buildingId, nextLevel) {
  var _a, _b, _c, _d;
  if (buildingId === DEPOSIT_ID) {
    const base2 = colonyUpgradeCost(player, "extracteur_ferraille", nextLevel);
    const scrap = Math.ceil(((_a = base2.scrap) != null ? _a : 0) * DEPOSIT_RULES.costFactor);
    return { scrap, energy: Math.ceil(((_b = base2.energy) != null ? _b : 0) * DEPOSIT_RULES.costFactor), nano: Math.ceil(scrap / 2), data: Math.ceil(scrap / 4) };
  }
  const def3 = findBuilding(buildingId);
  if (!def3) return {};
  const base = applyBuildingDiscount(getBuildingUpgradeCost(def3, nextLevel), (_d = (_c = player.bonuses) == null ? void 0 : _c.buildingUpgradeDiscount) != null ? _d : 0);
  return Object.fromEntries(Object.entries(base).map(([r, n]) => [r, Math.ceil((n != null ? n : 0) * COLONY_RULES.costFactor)]));
}
function colonyUpgradeSeconds(player, buildingId, nextLevel, now) {
  if (buildingId === DEPOSIT_ID) return Math.round(colonyUpgradeSeconds(player, "extracteur_ferraille", nextLevel, now) * DEPOSIT_RULES.timeFactor);
  const def3 = findBuilding(buildingId);
  return def3 ? Math.round(getBuildingUpgradeTime(def3, nextLevel) * playerBuildTimeFactor(player, now)) : 0;
}
function upgradeColonyBuilding(player, colonyIdIn, buildingId, now) {
  var _a, _b;
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  if (buildingId !== DEPOSIT_ID && !colonyBuildingIds().includes(buildingId)) throw new GameActionError("Ce b\xE2timent ne se construit pas sur une colonie.");
  if (colony.building) throw new GameActionError("Une construction est d\xE9j\xE0 en cours sur cette colonie.");
  const level3 = buildingId === DEPOSIT_ID ? depositLevel(colony) : (_b = (_a = colony.buildings[buildingId]) == null ? void 0 : _a.level) != null ? _b : 0;
  if (level3 >= colonyMaxLevel(buildingId)) throw new GameActionError(`Niveau maximum d'une colonie atteint (${colonyMaxLevel(buildingId)}).`);
  const paid = colonyUpgradeCost(player, buildingId, level3 + 1);
  payFrom(colony.resources, paid, "cette construction");
  colony.building = { id: buildingId, level: level3 + 1, endTime: now + colonyUpgradeSeconds(player, buildingId, level3 + 1, now) * 1e3, startedAtMs: now, paid };
  return colony.building;
}
function colonyDefenseHangar(colony) {
  const used = Object.entries(colony.defenses).reduce((a, [id, s]) => {
    var _a, _b;
    return a + ((_b = (_a = findUnit(id)) == null ? void 0 : _a.hangarSpace) != null ? _b : 1) * s.count;
  }, 0);
  return { used, capacity: getUnitCapacity(colony.buildings, "defense") };
}
function colonyDefenseSeconds(player, unitId, qty) {
  const unit = findUnit(unitId);
  return unit ? getUnitBuildTime(unit, player.techLevels) * Math.max(0, qty) : 0;
}
function buildColonyDefense(player, colonyIdIn, unitId, qtyIn, now) {
  var _a, _b;
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const unit = findUnit(unitId);
  if (!unit || unit.category !== "defense") throw new GameActionError("Seules les d\xE9fenses se construisent sur une colonie.");
  if (((_b = (_a = player.units[unitId]) == null ? void 0 : _a.level) != null ? _b : 0) <= 0) throw new GameActionError("D\xE9bloque d'abord cette d\xE9fense sur ta plan\xE8te m\xE8re.");
  const qty = Math.floor(Number(qtyIn));
  if (!(qty > 0)) throw new GameActionError("Quantit\xE9 invalide.");
  if (colony.defenseJob) throw new GameActionError("Des d\xE9fenses sont d\xE9j\xE0 en construction sur cette colonie.");
  const { used, capacity } = colonyDefenseHangar(colony);
  if (used + qty * unit.hangarSpace > capacity) throw new GameActionError("Capacit\xE9 du hangar de d\xE9fense de la colonie insuffisante.");
  const paid = { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty };
  payFrom(colony.resources, paid, "ces d\xE9fenses");
  colony.defenseJob = { unitId, qty, endTime: now + colonyDefenseSeconds(player, unitId, qty) * 1e3, startedAtMs: now, paid };
  return colony.defenseJob;
}
function renameColony(player, colonyIdIn, nameIn) {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const name = String(nameIn != null ? nameIn : "").trim();
  if (name.length < 2 || name.length > 30) throw new GameActionError("Le nom d'une colonie fait entre 2 et 30 caract\xE8res.");
  colony.name = name;
}
function parseCargo(raw, capacity) {
  const out = {};
  let total2 = 0;
  for (const r of RESOURCE_LIST) {
    const n = Math.floor(Number(raw == null ? void 0 : raw[r.id]));
    if (!(n > 0)) continue;
    out[r.id] = n;
    total2 += n;
  }
  if (total2 > capacity) throw new GameActionError(`La soute ne contient que ${formatInt(capacity)} ressources.`);
  return out;
}
function collectFromColony(colony, requested, capacity) {
  const wanted = Object.keys(requested).length ? requested : Object.fromEntries(RESOURCE_LIST.map((r) => {
    var _a;
    return [r.id, Math.floor((_a = colony.resources[r.id]) != null ? _a : 0)];
  }));
  const available = Object.fromEntries(Object.entries(wanted).map(([r, n]) => {
    var _a;
    return [r, Math.max(0, Math.min(n != null ? n : 0, Math.floor((_a = colony.resources[r]) != null ? _a : 0)))];
  }));
  const total2 = Object.values(available).reduce((a, b) => a + (b != null ? b : 0), 0);
  const ratio = total2 > capacity ? capacity / total2 : 1;
  const taken = {};
  for (const [r, n] of Object.entries(available)) {
    const k = Math.floor(n * ratio);
    if (k > 0) {
      taken[r] = k;
      colony.resources[r] -= k;
    }
  }
  return taken;
}
function deliverToColony(colony, cargo) {
  var _a;
  for (const [r, n] of Object.entries(cargo)) colony.resources[r] = ((_a = colony.resources[r]) != null ? _a : 0) + (n != null ? n : 0);
}

// src/game/contracts.ts
var CONTRACT_RULES = {
  perDay: 3,
  streakBonusPerDay: 0.1,
  streakBonusMax: 0.5,
  chestEvery: 7,
  xpPerContract: 20,
  rarePerContract: 120,
  chestRare: 1500,
  chestXp: 150
};
var ALL_TYPES = ["upgrade_building", "research", "build_units", "win_attack", "win_defense", "missions", "gift", "spend"];
var RARES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
var DAY_MS = 24 * 3600 * 1e3;
function contractDay(now) {
  return new Date(now).toISOString().slice(0, 10);
}
function previousDay(day) {
  return contractDay(Date.parse(`${day}T00:00:00Z`) - DAY_MS);
}
function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ h >>> 15, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function targetFor(type, player) {
  var _a, _b, _c, _d;
  switch (type) {
    case "build_units":
      return 20;
    case "missions":
      return 2;
    case "spend": {
      const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
      const perHour = (((_a = rates.scrap) != null ? _a : 0) + ((_b = rates.energy) != null ? _b : 0) + ((_c = rates.nano) != null ? _c : 0) + ((_d = rates.data) != null ? _d : 0)) * 3600;
      return Math.max(5e3, Math.round(perHour / 1e3) * 1e3);
    }
    default:
      return 1;
  }
}
function makeContract(type, player, day, index) {
  return { id: `${day}-${index}-${type}`, type, target: targetFor(type, player), progress: 0, claimed: false };
}
function ensureContracts(player, now) {
  var _a, _b;
  const day = contractDay(now);
  const current2 = player.contracts;
  if (current2 && current2.day === day) return current2;
  const rand = seededRandom(`${player.uid}:${day}`);
  const pool = [...ALL_TYPES];
  const items = [];
  for (let i = 0; i < CONTRACT_RULES.perDay && pool.length > 0; i++) {
    const type = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    items.push(makeContract(type, player, day, i));
  }
  const keepsStreak = (current2 == null ? void 0 : current2.lastCompletedDay) === previousDay(day);
  player.contracts = {
    day,
    items,
    streak: keepsStreak ? (_a = current2 == null ? void 0 : current2.streak) != null ? _a : 0 : 0,
    lastCompletedDay: (_b = current2 == null ? void 0 : current2.lastCompletedDay) != null ? _b : null,
    rerolled: false
  };
  return player.contracts;
}
function recordContract(player, type, amount3, now) {
  if (!(amount3 > 0)) return;
  const state = ensureContracts(player, now);
  for (const c of state.items) {
    if (c.type === type && !c.claimed) c.progress = Math.min(c.target, c.progress + amount3);
  }
}
function developmentScale(player) {
  return rareRewardScale(player);
}
function streakBonus(streak) {
  return Math.min(CONTRACT_RULES.streakBonusMax, streak * CONTRACT_RULES.streakBonusPerDay);
}
function contractReward(player, contract) {
  var _a, _b, _c;
  const state = player.contracts;
  const multiplier = (1 + streakBonus((_a = state == null ? void 0 : state.streak) != null ? _a : 0)) * developmentScale(player);
  const index = Number((_b = contract.id.split("-")[3]) != null ? _b : 0) || 0;
  const rare = RARES[(index + contract.type.length) % RARES.length];
  return {
    [rare]: Math.round(CONTRACT_RULES.rarePerContract * multiplier),
    xp: Math.round(CONTRACT_RULES.xpPerContract * (1 + streakBonus((_c = state == null ? void 0 : state.streak) != null ? _c : 0)))
  };
}
function chestReward(player) {
  const scale = developmentScale(player);
  const out = { xp: CONTRACT_RULES.chestXp };
  for (const r of RARES) out[r] = Math.round(CONTRACT_RULES.chestRare * scale);
  return out;
}
function grant(player, reward, now) {
  var _a;
  for (const [res, amount3] of Object.entries(reward)) {
    if (res === "xp") applyXpDelta(player, amount3, now);
    else player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + amount3;
  }
}
function claimContract(player, contractId, now) {
  const state = ensureContracts(player, now);
  const contract = state.items.find((c) => c.id === contractId);
  if (!contract) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (contract.claimed) throw new GameActionError("R\xE9compense d\xE9j\xE0 r\xE9cup\xE9r\xE9e.");
  if (contract.progress < contract.target) throw new GameActionError("Contrat pas encore rempli.");
  const reward = contractReward(player, contract);
  grant(player, reward, now);
  contract.claimed = true;
  let chest = null;
  const dayCompleted = state.items.every((c) => c.claimed);
  if (dayCompleted) {
    state.streak = state.lastCompletedDay === previousDay(state.day) ? state.streak + 1 : 1;
    state.lastCompletedDay = state.day;
    if (state.streak % CONTRACT_RULES.chestEvery === 0) {
      chest = chestReward(player);
      grant(player, chest, now);
    }
  }
  return { reward, dayCompleted, chest };
}
function rerollContract(player, contractId, now) {
  const state = ensureContracts(player, now);
  if (state.rerolled) throw new GameActionError("Tu as d\xE9j\xE0 relanc\xE9 un contrat aujourd'hui.");
  const index = state.items.findIndex((c) => c.id === contractId);
  if (index < 0) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (state.items[index].claimed) throw new GameActionError("Ce contrat est d\xE9j\xE0 termin\xE9.");
  const used = new Set(state.items.map((c) => c.type));
  const pool = ALL_TYPES.filter((t) => !used.has(t));
  const rand = seededRandom(`${player.uid}:${state.day}:reroll`);
  const type = pool[Math.floor(rand() * pool.length)];
  const next = makeContract(type, player, state.day, index);
  next.id = `${state.day}-${index}-${type}-r`;
  state.items[index] = next;
  state.rerolled = true;
  return next;
}

// src/game/missions.ts
var DEFAULT_MISSIONS = {
  patrouille_courte: { key: "patrouille_courte", name: "Patrouille courte", duration: 60, reward: { scrap: 800, xp: 1 }, prereq: { drone_recuperateur: 2 } },
  forage_profond: { key: "forage_profond", name: "Forage profond", duration: 1800, reward: { scrap: 35e3, xp: 30 }, prereq: { drone_recuperateur: 12, cargo: 3 } },
  collecte_energie: { key: "collecte_energie", name: "Collecte d'\xE9nergie", duration: 900, reward: { energy: 4e3, xp: 15 }, prereq: { chasseur: 6, fregate: 2 } },
  analyse_signal: { key: "analyse_signal", name: "Analyse de signal", duration: 900, reward: { data: 2500, xp: 15 }, prereq: { drone_recuperateur: 6, sentinelle: 2 } },
  synthese_nano: { key: "synthese_nano", name: "Synth\xE8se de nanocomposants", duration: 1800, reward: { nano: 600, xp: 30 }, prereq: { drone_recuperateur: 10, sentinelle: 4 } },
  expedition_longue: { key: "expedition_longue", name: "Exp\xE9dition longue dur\xE9e", duration: 3600, reward: { scrap: 6e4, energy: 12e3, xp: 60 }, prereq: { fregate: 5, cargo: 4, chasseur: 6 } },
  recuperation_acier: { key: "recuperation_acier", name: "R\xE9cup\xE9ration d'acier renforc\xE9", duration: 1200, reward: { reinforcedSteel: 30, xp: 20 }, prereq: { drone_recuperateur: 8, chasseur: 4 } },
  extraction_module: { key: "extraction_module", name: "Extraction de module cybern\xE9tique", duration: 1800, reward: { cyberModule: 40, xp: 30 }, prereq: { sentinelle: 5, fregate: 3 } },
  recolte_nanites: { key: "recolte_nanites", name: "R\xE9colte de nanites synth\xE9tiques", duration: 2400, reward: { syntheticNanites: 50, xp: 40 }, prereq: { drone_recuperateur: 15, sentinelle: 6 } },
  fouille_archives_IA: { key: "fouille_archives_IA", name: "Fouille d'archives d'IA", duration: 3600, reward: { aiFragment: 60, xp: 60 }, prereq: { fregate: 6, sentinelle: 8 } },
  mission_elite: {
    key: "mission_elite",
    name: "Mission d'\xE9lite",
    duration: 7200,
    reward: { reinforcedSteel: 800, cyberModule: 600, syntheticNanites: 500, aiFragment: 400, xp: 120 },
    prereq: { fregate: 10, sentinelle: 10, chasseur: 10, cargo: 15 }
  },
  patrouille_perimetrique: {
    key: "patrouille_perimetrique",
    name: "Patrouille du p\xE9rim\xE8tre",
    duration: 600,
    reward: { scrap: 8e3, xp: 10 },
    prereq: { roquette: 30 }
  },
  verrouillage_radar: { key: "verrouillage_radar", name: "Alerte invasion", duration: 1200, reward: { energy: 6e3, xp: 20 }, prereq: { batterie_aa: 20, intercepteur: 10 } },
  suppression_blindee: { key: "suppression_blindee", name: "Repli des envahisseurs", duration: 1800, reward: { reinforcedSteel: 200, xp: 30 }, prereq: { canon_impulsion: 25, roquette: 50 } },
  bombardement_orbital: { key: "bombardement_orbital", name: "Si\xE8ge repouss\xE9", duration: 2700, reward: { scrap: 45e3, cyberModule: 350, xp: 45 }, prereq: { canon_plasma: 50, canon_impulsion: 65 } },
  interception_prioritaire: {
    key: "interception_prioritaire",
    name: "Dernier bastion",
    duration: 3600,
    reward: { syntheticNanites: 400, aiFragment: 650, xp: 60 },
    prereq: { intercepteur: 60, batterie_aa: 70 }
  }
};
var MISSIONS = __spreadValues({}, DEFAULT_MISSIONS);
function setMissions(defs) {
  for (const key of Object.keys(MISSIONS)) delete MISSIONS[key];
  for (const def3 of defs) MISSIONS[def3.key] = def3;
}
function hasPrerequisites(mission, units) {
  return Object.entries(mission.prereq).every(([unitId, req]) => {
    var _a, _b;
    return ((_b = (_a = units[unitId]) == null ? void 0 : _a.count) != null ? _b : 0) >= req;
  });
}

// src/game/formations.ts
var pct = (v) => `${v > 0 ? "+" : "\u2212"}${Math.round(Math.abs(v) * 100)} %`;
var FORMATIONS = [
  { id: "balanced", name: "\xC9quilibr\xE9e", description: () => "Aucun bonus ni malus." },
  { id: "assault", name: "Assaut", description: () => `Attaque ${pct(COMBAT_RULES.assaultAttack)}, pertes subies ${pct(COMBAT_RULES.assaultLosses)}.` },
  { id: "cautious", name: "Prudente", description: () => `Attaque ${pct(COMBAT_RULES.cautiousAttack)}, pertes subies ${pct(COMBAT_RULES.cautiousLosses)}.` },
  { id: "raid", name: "Raid", description: () => `Attaque ${pct(COMBAT_RULES.raidAttack)}, cargaison ${pct(COMBAT_RULES.raidCargo)}.` }
];
var POSTURES = [
  { id: "standard", name: "Standard", description: () => `Les vaisseaux \xE0 quai d\xE9fendent \xE0 ${Math.round(COMBAT_RULES.homeFleetDefenseFactor * 100)} %.` },
  { id: "bunker", name: "Bunker", description: () => `D\xE9fenses ${pct(COMBAT_RULES.bunkerDefense)}, vaisseaux \xE0 quai \xE0 l'abri (ni engag\xE9s, ni d\xE9truits).` },
  { id: "riposte", name: "Riposte", description: () => `Vaisseaux \xE0 quai engag\xE9s \xE0 ${Math.round(COMBAT_RULES.riposteHomeFleet * 100)} %.` }
];
function isFormation(v) {
  return FORMATIONS.some((f) => f.id === v);
}
function isPosture(v) {
  return POSTURES.some((p) => p.id === v);
}
function formationEffects(id) {
  switch (id) {
    case "assault":
      return { attackFactor: 1 + COMBAT_RULES.assaultAttack, attackerLossFactor: 1 + COMBAT_RULES.assaultLosses, cargoFactor: 1 };
    case "cautious":
      return { attackFactor: 1 + COMBAT_RULES.cautiousAttack, attackerLossFactor: 1 + COMBAT_RULES.cautiousLosses, cargoFactor: 1 };
    case "raid":
      return { attackFactor: 1 + COMBAT_RULES.raidAttack, attackerLossFactor: 1, cargoFactor: 1 + COMBAT_RULES.raidCargo };
    default:
      return { attackFactor: 1, attackerLossFactor: 1, cargoFactor: 1 };
  }
}
function postureEffects(id, fleetOnly = false) {
  if (fleetOnly) return { defenseFactor: 1, homeFleetFactor: 1 };
  switch (id) {
    case "bunker":
      return { defenseFactor: 1 + COMBAT_RULES.bunkerDefense, homeFleetFactor: 0 };
    case "riposte":
      return { defenseFactor: 1, homeFleetFactor: COMBAT_RULES.riposteHomeFleet };
    default:
      return { defenseFactor: 1, homeFleetFactor: void 0 };
  }
}
function playerPosture(p) {
  var _a;
  return isPosture((_a = p.posture) == null ? void 0 : _a.id) ? p.posture.id : "standard";
}
function setPosture(player, id, now) {
  var _a, _b;
  if (!isPosture(id)) throw new GameActionError("Posture inconnue.");
  const current2 = playerPosture(player);
  if (current2 === id) return id;
  const last = (_b = (_a = player.posture) == null ? void 0 : _a.changedAtMs) != null ? _b : 0;
  const wait = last > 0 ? last + COMBAT_RULES.postureCooldownHours * 36e5 - now : 0;
  if (wait > 0) throw new GameActionError(`Changement de posture possible dans ${Math.ceil(wait / 6e4)} min.`);
  player.posture = { id, changedAtMs: now };
  return id;
}

// src/game/pirates.ts
var REPORT_PSEUDO_MAX = 120;
var DEFAULT_FACTIONS = [
  {
    id: "varan",
    enabled: true,
    name: "Confr\xE9rie du Vide",
    leader: "Capitaine Orsk Varan",
    enforcer: "Le Silencieux",
    art: "/assets/story/varan.webp",
    color: "ember",
    story: "Depuis l'effondrement des routes commerciales, une flotte sans banni\xE8re r\xF4de aux confins de la galaxie : la Confr\xE9rie du Vide.\n\nSon chef, le capitaine Orsk Varan, ancien officier imp\xE9rial \xE0 la barbe grise, tient \xE0 jour une tablette lumineuse : la Liste, les empires trop riches pour \xEAtre prudents. Ses ordres sont ex\xE9cut\xE9s par le Silencieux, un colosse au masque respiratoire dont personne n'a jamais entendu la voix. Quand son doigt se pose sur toi, ton nom vient d'entrer sur la Liste.\n\nVaran laisse toujours un choix : payer le tribut, ou voir le Silencieux venir le chercher lui-m\xEAme.",
    ultimatum: {
      title: "\xAB Ton nom est sur ma Liste. \xBB",
      quote: "{pseudo}\u2026 Ton empire brille un peu trop dans le noir. Le Silencieux t'a d\xE9sign\xE9, et il ne se trompe jamais. Verse ta part \xE0 la Confr\xE9rie, et nous t'oublierons. Refuse, et il viendra la prendre lui-m\xEAme.",
      signature: "Capitaine Orsk Varan",
      payLabel: "Payer le tribut"
    },
    trigger: { type: "wealth", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7 },
    tribute: { basis: "production", hours: 6, plunderPct: 0, minHours: 0 },
    answerHours: 12,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.7, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "common" },
    bounty: { hours: 4, rare: 0, xp: 25, debrisPerPower: 1 },
    lair: { name: "Repaire de Varan", raidsNeeded: 5, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Fl\xE9au de la Confr\xE9rie" }
  },
  {
    id: "gravhorn",
    enabled: true,
    name: "Syndicat Gravhorn",
    leader: "Oggrath le Pisteur",
    enforcer: "L'Unit\xE9 Ambre",
    art: "/assets/story/gravhorn.webp",
    color: "gold",
    story: "On ne fuit pas le Syndicat. On le paie, ou on devient son troph\xE9e.\n\nLes Gravhorns sont une esp\xE8ce de chasseurs \xE0 la peau tachet\xE9e et cornue, dont les antennes captent la peur \xE0 des parsecs de distance. Ils ne pillent pas au hasard : ils ex\xE9cutent des contrats. Chaque empire que tu d\xE9vastes peut, en secret, d\xE9poser une prime sur ta t\xEAte.\n\nLe contrat est confi\xE9 \xE0 Oggrath le Pisteur, v\xE9t\xE9ran au regard las qui a d\xE9j\xE0 tout vu. Il ne se d\xE9place jamais seul : \xE0 ses c\xF4t\xE9s marche l'Unit\xE9 Ambre, une combinaison orange \xE0 visi\xE8re tactique dont personne ne sait ce qu'elle abrite. Sa visi\xE8re affiche d\xE9j\xE0 ta flotte.",
    ultimatum: {
      title: "\xAB Il y a un contrat sur ta t\xEAte. \xBB",
      quote: "{pseudo}. Tes victimes ont pay\xE9 cher pour te voir tomber. Moi, je suis un professionnel : rach\xE8te ton contrat, et l'Unit\xE9 Ambre range ses armes. Sinon, elle vient pour tes vaisseaux. Pas pour tes murs. Pour tes vaisseaux.",
      signature: "Oggrath le Pisteur",
      payLabel: "Racheter le contrat"
    },
    trigger: { type: "aggression", minIntervalHours: 48, maxIntervalHours: 72, activeWithinHours: 72, minVictories: 3, windowDays: 7 },
    tribute: { basis: "plunder", hours: 0, plunderPct: 0.5, minHours: 4 },
    answerHours: 8,
    raidTravelHours: 1.5,
    raid: { target: "fleet", basePct: 0.8, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "rare" },
    bounty: { hours: 0, rare: 200, xp: 40, debrisPerPower: 1 },
    lair: { name: "Chambre des Contrats", raidsNeeded: 4, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Chasseur de chasseurs" }
  },
  {
    id: "inquisition",
    enabled: true,
    name: "Inquisition de l'Aube Blanche",
    leader: "Haut-Juge S\xE9raphin Vol",
    enforcer: "Le Lecteur",
    art: "/assets/story/inquisition.webp",
    color: "cyan",
    story: "Dans les archives scell\xE9es de l'ancien Empire, certaines connaissances \xE9taient interdites. L'Inquisition de l'Aube Blanche s'est donn\xE9 pour mission de les garder enfouies.\n\nLe Haut-Juge S\xE9raphin Vol, drap\xE9 de blanc et d'or, lit chaque d\xE9couverte comme une h\xE9r\xE9sie. Ses lunettes d'or ne quittent jamais son Livre des Interdits, o\xF9 s'inscrivent d'elles-m\xEAmes les recherches des empires trop curieux.\n\nSa sentence est ex\xE9cut\xE9e par le Lecteur, un andro\xEFde-scribe au visage de porcelaine qui r\xE9cite \xE0 voix basse les crimes de ses cibles avant de frapper. On dit qu'il n'a jamais oubli\xE9 une ligne.",
    ultimatum: {
      title: "\xAB Ton savoir est une h\xE9r\xE9sie. \xBB",
      quote: "{pseudo}. Ton nom vient d'appara\xEEtre dans le Livre. Tes laboratoires ont touch\xE9 \xE0 ce qui devait rester enfoui. Fais p\xE9nitence, et l'Aube Blanche te pardonnera. Persiste, et le Lecteur viendra r\xE9citer tes fautes devant tes murs.",
      signature: "Haut-Juge S\xE9raphin Vol",
      payLabel: "Faire p\xE9nitence"
    },
    trigger: { type: "research", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 3, threshold: 30 },
    tribute: { basis: "production", hours: 6, plunderPct: 0, minHours: 0 },
    answerHours: 10,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.75, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "rare" },
    bounty: { hours: 3, rare: 100, xp: 30, debrisPerPower: 1 },
    lair: { name: "Le Scriptorium Orbital", raidsNeeded: 5, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "H\xE9r\xE9tique" }
  },
  {
    id: "cartel",
    enabled: true,
    name: "Cartel N\xE9on",
    leader: "Madame Vashti Kor",
    enforcer: "Les Jumeaux Chrome",
    art: "/assets/story/cartel.webp",
    color: "danger",
    story: "Sur les stations-casinos de la Bordure, tout s'ach\xE8te : les dettes, les secrets, les vies. Le Cartel N\xE9on y r\xE8gne sans partage.\n\nMadame Vashti Kor, reine du Cartel en manteau de fourrure et lunettes holographiques, pr\xEAte \xE0 toute la galaxie, et finit toujours par se faire rembourser. Elle flaire l'odeur des coffres pleins comme d'autres sentent le parfum.\n\nSes recouvreurs, les Jumeaux Chrome, deux mercenaires identiques aux visi\xE8res dor\xE9es, ne parlent jamais en m\xEAme temps et ne ratent jamais un coffre.",
    ultimatum: {
      title: "\xAB Tes coffres d\xE9bordent, ch\xE9ri. \xBB",
      quote: "{pseudo}, mon cher\u2026 Tes entrep\xF4ts brillent jusque dans mes salons. Dans la Bordure, la richesse paie des int\xE9r\xEAts. R\xE8gle ta part, et nous resterons bons amis. Sinon, les Jumeaux passeront compter eux-m\xEAmes.",
      signature: "Madame Vashti Kor",
      payLabel: "Payer les int\xE9r\xEAts"
    },
    trigger: { type: "hoard", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 80 },
    tribute: { basis: "stock", hours: 0, plunderPct: 0, minHours: 4, stockPct: 0.15 },
    answerHours: 12,
    raidTravelHours: 2.5,
    raid: { target: "base", basePct: 0.7, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.2, lootKind: "common" },
    bounty: { hours: 6, rare: 0, xp: 30, debrisPerPower: 1 },
    lair: { name: "Le Casino Fant\xF4me", raidsNeeded: 5, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Briseur de Cartel" }
  },
  {
    id: "meute",
    enabled: true,
    name: "Meute d'Ysgrim",
    leader: "Ysgrim Crocs-de-Fer",
    enforcer: "La Louve Rouge",
    art: "/assets/story/meute.webp",
    color: "ember",
    story: "Venus des mondes morts du Rift, les guerriers de la Meute ont remplac\xE9 leur chair par l'acier et ne vivent que pour la chasse.\n\nYsgrim Crocs-de-Fer, colosse \xE0 t\xEAte de loup bard\xE9 d'implants, flaire l'expansion de loin : chaque empire qui grandit trop vite devient une proie.\n\nIl envoie d'abord la Louve Rouge, \xE9claireuse \xE0 la cape \xE9carlate et au fusil long, poser sa marque sur la cible. Quand la Meute charge ensuite, elle est rapide, et sans piti\xE9 pour les flottes rest\xE9es au port.",
    ultimatum: {
      title: "\xAB La Meute a senti ton odeur. \xBB",
      quote: "Tu grandis vite, {pseudo}. Trop vite. La Louve Rouge a pos\xE9 sa marque sur tes murs. Jette un os \xE0 la Meute, et nous chasserons ailleurs. Fais le fier, et nos crocs trouveront ta flotte avant l'aube.",
      signature: "Ysgrim Crocs-de-Fer",
      payLabel: "Jeter un os"
    },
    trigger: { type: "expansion", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 25 },
    tribute: { basis: "production", hours: 5, plunderPct: 0, minHours: 0 },
    answerHours: 6,
    raidTravelHours: 0.75,
    raid: { target: "fleet", basePct: 0.75, perNotorietyPct: 0.12, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "common" },
    bounty: { hours: 4, rare: 0, xp: 40, debrisPerPower: 1 },
    lair: { name: "La Tani\xE8re du Rift", raidsNeeded: 4, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Dompteur de la Meute" }
  },
  {
    id: "choeur",
    enabled: true,
    name: "Le Ch\u0153ur Silencieux",
    leader: "L'Archonte Vesper",
    enforcer: "Les \xC9chos",
    art: "/assets/story/choeur.webp",
    banner: "/assets/story/choeur-banner.webp",
    emblem: "/assets/story/choeur-emblem.webp",
    color: "mint",
    story: "Il y a dix mille ans, une civilisation enti\xE8re s'est fondue en une seule conscience, puis s'est tue. Ses cath\xE9drales de cristal noir d\xE9rivent depuis aux confins de la galaxie, silencieuses.\n\nLes signaux de vos fonderies quantiques et de vos cortex neuronaux l'ont r\xE9veill\xE9e. Le Ch\u0153ur ne convoite pas vos coffres : il veut ce que vos laboratoires ont appris, et les fragments o\xF9 vous l'avez grav\xE9.\n\nL'Archonte Vesper, masque de porcelaine sans bouche et halo de glyphes, parle pour des milliers de voix. Ceux qui refusent entendent d'abord un murmure dans leurs transmissions\u2026 puis voient arriver les \xC9chos.",
    ultimatum: {
      title: "\xAB Ton esprit chante trop fort. \xBB",
      quote: "{pseudo}\u2026 Nous t'entendons. Tes machines pensent, tes forges plient la mati\xE8re : tu chantes trop fort pour une si petite \xE9toile. Offre-nous ce que tu as appris, et nous resterons silencieux. Refuse, et les \xC9chos viendront l'apprendre eux-m\xEAmes.",
      signature: "L'Archonte Vesper, pour le Ch\u0153ur",
      payLabel: "Offrir le tribut"
    },
    trigger: { type: "singularity", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 8 },
    tribute: { basis: "production", hours: 8, plunderPct: 0, minHours: 0 },
    answerHours: 12,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.85, perNotorietyPct: 0.12, maxNotoriety: 8, floorPower: 2e3, floorPerBuildingLevel: 80, lootPct: 0.15, lootKind: "rare" },
    bounty: { hours: 10, rare: 800, xp: 60, debrisPerPower: 1 },
    lair: { name: "La Cath\xE9drale du Silence", raidsNeeded: 5, pct: 1.15, rewardHours: 36, rare: 1500, xp: 150, title: "Voix du Ch\u0153ur bris\xE9" }
  }
];
var FACTIONS = [];
function setFactions(defs) {
  FACTIONS.splice(0, FACTIONS.length, ...defs);
}
setFactions(structuredClone(DEFAULT_FACTIONS));
function findFaction(id) {
  return FACTIONS.find((f) => f.id === id);
}
var PIRATE_RULES = {
  enabled: true,
  /** v5.5 : adaptation des raids à la réussite du joueur (par faction) : chaque raid
   *  repoussé renforce le suivant, chaque défaite l'affaiblit. Équilibre vers 70 % repoussés. */
  adaptUp: 0.04,
  adaptDown: 0.1,
  adaptMin: 0.9,
  adaptMax: 1.5
};
var PIRATE_OWNER_UID = "pirates";
function lairUid(factionId) {
  return `lair_${factionId}`;
}
function factionOfLair(uid) {
  return uid.startsWith("lair_") ? uid.slice(5) : uid === "pirates_lair" ? "varan" : "";
}
function normalize(p, maxNotoriety = 8) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  return {
    notoriety: Math.max(0, Math.min(maxNotoriety, (_a = p == null ? void 0 : p.notoriety) != null ? _a : 0)),
    repelled: (_b = p == null ? void 0 : p.repelled) != null ? _b : 0,
    lairOpen: (_c = p == null ? void 0 : p.lairOpen) != null ? _c : false,
    nextListAtMs: (_d = p == null ? void 0 : p.nextListAtMs) != null ? _d : 0,
    ultimatum: (_e = p == null ? void 0 : p.ultimatum) != null ? _e : null,
    raidUntilMs: (_f = p == null ? void 0 : p.raidUntilMs) != null ? _f : 0,
    raidsWon: (_g = p == null ? void 0 : p.raidsWon) != null ? _g : 0,
    raidsLost: (_h = p == null ? void 0 : p.raidsLost) != null ? _h : 0,
    tributesPaid: (_i = p == null ? void 0 : p.tributesPaid) != null ? _i : 0,
    lairsTaken: (_j = p == null ? void 0 : p.lairsTaken) != null ? _j : 0,
    adapt: Number.isFinite(p == null ? void 0 : p.adapt) ? Math.max(PIRATE_RULES.adaptMin, Math.min(PIRATE_RULES.adaptMax, p.adapt)) : 1,
    mark: (_k = p == null ? void 0 : p.mark) != null ? _k : null
  };
}
function isLegacy(raw) {
  return !!raw && typeof raw === "object" && ("notoriety" in raw || "nextListAtMs" in raw);
}
function factionStates(player) {
  var _a;
  const raw = (_a = player.pirates) != null ? _a : {};
  const out = {};
  if (isLegacy(raw)) out.varan = normalize(raw);
  else for (const [id, st] of Object.entries(raw)) out[id] = normalize(st);
  return out;
}
function pirateState(player, factionId = "varan") {
  var _a;
  return (_a = factionStates(player)[factionId]) != null ? _a : normalize(void 0);
}
function setFactionState(player, factionId, st) {
  setState(player, factionId, st);
}
function setState(player, factionId, st) {
  player.pirates = __spreadProps(__spreadValues({}, factionStates(player)), { [factionId]: st });
}
function activeUltimatum(player, now) {
  for (const [id, st] of Object.entries(factionStates(player))) {
    const faction = findFaction(id);
    if (faction && st.ultimatum && st.ultimatum.expiresAtMs > now) return { faction, ultimatum: st.ultimatum };
  }
  return null;
}
function hours(h) {
  return h * 36e5;
}
function nextListDelay(faction, random) {
  const span = Math.max(0, faction.trigger.maxIntervalHours - faction.trigger.minIntervalHours);
  return hours(faction.trigger.minIntervalHours + random() * span);
}
function productionHours(player, h) {
  var _a;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const out = {};
  for (const res of COMMON_RESOURCES2) {
    const n = Math.floor(((_a = rates[res]) != null ? _a : 0) * h * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}
function total(r) {
  return Object.values(r).reduce((a, b) => a + (b != null ? b : 0), 0);
}
function defensivePower(player) {
  var _a, _b;
  return homeDefensePower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {});
}
function homeFleetPower(player) {
  var _a, _b;
  return computeFullPower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack", "defense"]);
}
function targetPower(faction, player) {
  return faction.raid.target === "fleet" ? homeFleetPower(player) : defensivePower(player);
}
function raidPower(faction, player, notoriety, adapt = 1) {
  const levels = BUILDINGS.reduce((sum3, b) => sum3 + effectiveBuildingLevel(player.buildings, b.id), 0);
  const floor = faction.raid.floorPower + faction.raid.floorPerBuildingLevel * levels;
  const pct5 = faction.raid.basePct + faction.raid.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, targetPower(faction, player) * pct5 * adapt));
}
function exposedStock(player) {
  var _a, _b, _c;
  const out = {};
  for (const res of COMMON_RESOURCES2) out[res] = Math.max(0, ((_b = (_a = player.resources) == null ? void 0 : _a[res]) != null ? _b : 0) - protectedAmount((_c = player.buildings) != null ? _c : {}, res, player.techLevels, player.allianceResearch));
  return out;
}
function storageFillPct(player) {
  var _a;
  const cap = getStorageCapacity((_a = player.buildings) != null ? _a : {}, player.techLevels);
  if (!(cap > 0)) return 0;
  return Math.floor(Math.max(...COMMON_RESOURCES2.map((r) => {
    var _a2, _b;
    return (_b = (_a2 = player.resources) == null ? void 0 : _a2[r]) != null ? _b : 0;
  })) / cap * 100);
}
function totalTechLevels(player) {
  var _a;
  return Object.values((_a = player.techLevels) != null ? _a : {}).reduce((a, b) => a + (b != null ? b : 0), 0);
}
function totalBuildingLevels(player) {
  return BUILDINGS.reduce((sum3, b) => {
    var _a, _b, _c;
    return sum3 + ((_c = (_b = (_a = player.buildings) == null ? void 0 : _a[b.id]) == null ? void 0 : _b.level) != null ? _c : 0);
  }, 0);
}
function tributeFor(faction, player, aggression) {
  var _a, _b;
  if (faction.tribute.basis === "production") return productionHours(player, faction.tribute.hours);
  if (faction.tribute.basis === "stock") {
    const fromStock = {};
    for (const [res, v] of Object.entries(exposedStock(player))) {
      const n = Math.floor(v * ((_a = faction.tribute.stockPct) != null ? _a : 0));
      if (n > 0) fromStock[res] = n;
    }
    const floor2 = productionHours(player, faction.tribute.minHours);
    return total(fromStock) >= total(floor2) ? fromStock : floor2;
  }
  const fromPlunder = {};
  for (const [res, v] of Object.entries((_b = aggression == null ? void 0 : aggression.plunder) != null ? _b : {})) {
    const n = Math.floor((v != null ? v : 0) * faction.tribute.plunderPct);
    if (n > 0) fromPlunder[res] = n;
  }
  const floor = productionHours(player, faction.tribute.minHours);
  return total(fromPlunder) >= total(floor) ? fromPlunder : floor;
}
function note2(kind, title, message, now) {
  return { kind, title, message, createdAtMs: now, read: false };
}
function pirateTick(player, now, options = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const random = (_a = options.random) != null ? _a : Math.random;
  const out = { changed: false, raid: null, notifications: [] };
  if (!PIRATE_RULES.enabled) return out;
  const states = factionStates(player);
  if (isLegacy(player.pirates)) {
    player.pirates = states;
    out.changed = true;
  }
  for (const faction of FACTIONS) {
    const st = states[faction.id];
    if ((st == null ? void 0 : st.ultimatum) && now >= st.ultimatum.expiresAtMs) {
      out.raid = launchRaid(player, faction, st, now, random);
      out.changed = true;
      out.notifications.push(
        note2("fleet", `${faction.enforcer} arrive`, `Tu n'as pas r\xE9pondu \xE0 ${faction.leader} : raid dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min.`, now)
      );
      return out;
    }
  }
  const busy = Object.values(states).some((st) => st.ultimatum && st.ultimatum.expiresAtMs > now || st.raidUntilMs > now);
  if (busy) return out;
  for (const faction of FACTIONS) {
    if (!faction.enabled) continue;
    const forced = options.force === faction.id;
    if (options.force && !forced) continue;
    const st = (_b = states[faction.id]) != null ? _b : normalize(void 0);
    if (!st.nextListAtMs && !forced) {
      st.nextListAtMs = now + (faction.trigger.type === "wealth" ? nextListDelay(faction, random) : hours(12));
      if (faction.trigger.type === "expansion") st.mark = { atMs: now, value: totalBuildingLevels(player) };
      setState(player, faction.id, st);
      out.changed = true;
      continue;
    }
    const active = now - ((_c = player.resourcesUpdatedAtMs) != null ? _c : 0) <= hours(faction.trigger.activeWithinHours);
    const window = hours(faction.trigger.windowDays * 24);
    const threshold = (_d = faction.trigger.threshold) != null ? _d : 0;
    let triggered = false;
    switch (faction.trigger.type) {
      case "aggression":
        triggered = ((_f = (_e = options.aggression) == null ? void 0 : _e.victories) != null ? _f : 0) >= faction.trigger.minVictories;
        break;
      case "research":
        triggered = totalTechLevels(player) >= threshold && now - ((_h = (_g = player.stats) == null ? void 0 : _g.lastResearchAtMs) != null ? _h : 0) <= window;
        break;
      case "hoard":
        triggered = active && storageFillPct(player) >= threshold;
        break;
      case "singularity":
        triggered = active && ENDGAME_TECH_IDS.reduce((a, id) => {
          var _a2, _b2;
          return a + ((_b2 = (_a2 = player.techLevels) == null ? void 0 : _a2[id]) != null ? _b2 : 0);
        }, 0) >= threshold;
        break;
      case "expansion": {
        if (!st.mark || now - st.mark.atMs > window) {
          st.mark = { atMs: now, value: totalBuildingLevels(player) };
          setState(player, faction.id, st);
          out.changed = true;
        }
        triggered = totalBuildingLevels(player) - st.mark.value >= threshold;
        break;
      }
      default:
        triggered = active;
    }
    const eligible = forced || now >= st.nextListAtMs && now - ((_i = player.createdAtMs) != null ? _i : 0) >= hours(72) && triggered;
    if (!eligible) continue;
    const tribute = tributeFor(faction, player, (_j = options.aggression) != null ? _j : null);
    st.ultimatum = { tribute, issuedAtMs: now, expiresAtMs: now + hours(faction.answerHours) };
    if (faction.trigger.type === "expansion") st.mark = { atMs: now, value: totalBuildingLevels(player) };
    setState(player, faction.id, st);
    recordThreat(player, faction.id);
    out.changed = true;
    out.notifications.push(
      note2(
        "fleet",
        faction.ultimatum.title.replace(/[«»"]/g, "").trim(),
        `${faction.leader} exige ${formatInt(total(tribute))} ressources. R\xE9ponds avant ${faction.answerHours} h, ou ${faction.enforcer} viendra se servir.`,
        now
      )
    );
    return out;
  }
  return out;
}
function launchRaid(player, faction, st, now, random) {
  const power = raidPower(faction, player, st.notoriety, st.adapt);
  const arriveAtMs = now + hours(faction.raidTravelHours);
  st.ultimatum = null;
  st.raidUntilMs = arriveAtMs;
  st.nextListAtMs = arriveAtMs + nextListDelay(faction, random);
  setState(player, faction.id, st);
  return { factionId: faction.id, power, arriveAtMs };
}
function answerUltimatum(player, answer, now, random = Math.random) {
  var _a, _b;
  const active = activeUltimatum(player, now);
  if (!active) throw new GameActionError("Aucun ultimatum en attente.");
  const { faction } = active;
  const st = pirateState(player, faction.id);
  const tribute = active.ultimatum.tribute;
  if (answer === "pay") {
    for (const [res, amount3] of Object.entries(tribute)) {
      if (((_a = player.resources[res]) != null ? _a : 0) < amount3) throw new GameActionError("Tu n'as pas de quoi payer : refuse, ou trouve les ressources \xE0 temps.");
    }
    for (const [res, amount3] of Object.entries(tribute)) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) - amount3;
    st.ultimatum = null;
    st.tributesPaid += 1;
    st.nextListAtMs = now + nextListDelay(faction, random);
    setState(player, faction.id, st);
    return { raid: null, notifications: [note2("fleet", "Tribut pay\xE9", `${faction.leader} te laisse en paix\u2026 pour l'instant.`, now)] };
  }
  const raid = launchRaid(player, faction, st, now, random);
  return {
    raid,
    notifications: [note2("fleet", "Tu as refus\xE9", `${faction.enforcer} est en route : impact dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min. Pr\xE9pare-toi !`, now)]
  };
}
var RARE = RESOURCE_LIST.filter((r) => r.rarity === "rare").map((r) => r.id);
function resolvePirateRaid(faction, playerIn, queuesIn, power, garrisons, now, options = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const flushed = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  const player = flushed.player;
  if (options.evading) bumpStat(player, "evasions");
  const st = pirateState(player, faction.id);
  const fleetOnly = faction.raid.target === "fleet";
  const posture = postureEffects((_a = player.posture) == null ? void 0 : _a.id, fleetOnly);
  const defenderUnits = fleetOnly ? Object.fromEntries(Object.entries((_b = player.units) != null ? _b : {}).filter(([id]) => OFFENSIVE_UNITS.includes(id))) : (_c = player.units) != null ? _c : {};
  const combat = resolveCombat({
    attackerUnits: {},
    attackerTechLevels: {},
    attackerRepairPct: 0,
    fleet: {},
    attackerPowerOverride: power,
    defenderUnits,
    defenderTechLevels: (_d = player.techLevels) != null ? _d : {},
    defenderRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
    defenderResources: {},
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    homeFleetFactor: posture.homeFleetFactor,
    defenseFactor: posture.defenseFactor,
    // v4.0 : Stratège et reliques (les capsules ne jouent pas contre les PNJ).
    // v5.9 : Traqueurs Kesh à quai, +50 % d'attaque contre les PNJ.
    defenderPowerFactor: (1 + playerModifiers(player).defense) * pveHomeDefenseFactor(defenderUnits, (_e = player.techLevels) != null ? _e : {}, posture.homeFleetFactor, posture.defenseFactor)
  });
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - lost);
  }
  const loot = {};
  let bounty = {};
  let debris = { scrap: 0, energy: 0 };
  const notifications = [...flushed.notifications];
  st.raidUntilMs = 0;
  if (combat.outcome === "attacker_win") {
    const kinds = faction.raid.lootKind === "rare" ? RARE : COMMON_RESOURCES2;
    for (const res of kinds) {
      const exposed = Math.max(0, ((_f = player.resources[res]) != null ? _f : 0) - protectedAmount(player.buildings, res, player.techLevels, player.allianceResearch));
      const taken = Math.floor(exposed * faction.raid.lootPct);
      if (taken > 0) {
        loot[res] = taken;
        player.resources[res] = ((_g = player.resources[res]) != null ? _g : 0) - taken;
      }
    }
    st.raidsLost += 1;
    grantCommanderXp(player, "strategist", COMMANDER_XP.defenseLost);
    st.notoriety = Math.max(0, st.notoriety - 1);
    st.adapt = Math.max(PIRATE_RULES.adaptMin, st.adapt - PIRATE_RULES.adaptDown);
    player.lastDefeatAtMs = now;
    notifications.push(note2("combat-defender", `Victoire de ${faction.name}`, total(loot) > 0 ? `${faction.enforcer} a eu le dessus et emport\xE9 ${describeGain(loot)} (${formatInt(total(loot))} au total).` : `${faction.enforcer} a eu le dessus, mais tes entrep\xF4ts prot\xE9g\xE9s n'ont rien laiss\xE9 \xE0 prendre.`, now));
  } else {
    bounty = productionHours(player, faction.bounty.hours);
    for (const r of RARE) if (faction.bounty.rare > 0) bounty[r] = ((_h = bounty[r]) != null ? _h : 0) + faction.bounty.rare;
    for (const [res, amount3] of Object.entries(bounty)) player.resources[res] = ((_i = player.resources[res]) != null ? _i : 0) + amount3;
    applyXpDelta(player, faction.bounty.xp, now);
    const destroyed = power * combat.attackerLossPercent;
    debris = { scrap: Math.floor(destroyed * faction.bounty.debrisPerPower), energy: Math.floor(destroyed * faction.bounty.debrisPerPower / 2) };
    st.raidsWon += 1;
    st.repelled += 1;
    st.adapt = Math.min(PIRATE_RULES.adaptMax, st.adapt + PIRATE_RULES.adaptUp);
    grantCommanderXp(player, "strategist", COMMANDER_XP.raidRepelled);
    addPassPoints(player, "raidRepelled", now);
    st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    player.victories = ((_j = player.victories) != null ? _j : 0) + 1;
    const lairNow = !st.lairOpen && st.repelled >= faction.lair.raidsNeeded;
    if (lairNow) st.lairOpen = true;
    notifications.push(
      note2(
        "combat-defender",
        combat.outcome === "draw" ? `${faction.name} repouss\xE9 de justesse` : `${faction.name} repouss\xE9 !`,
        `Prime : ${describeGain(bounty)} (${formatInt(total(bounty))} au total) et +${faction.bounty.xp} XP. Notori\xE9t\xE9 ${st.notoriety}.`,
        now
      )
    );
    if (lairNow) notifications.push(note2("fleet", `${faction.lair.name} localis\xE9`, "Sa position a fuit\xE9 : lance l'assaut depuis la page Menaces !", now));
  }
  setState(player, faction.id, st);
  const report = {
    attackerUid: PIRATE_OWNER_UID,
    // Tronqué à la taille du champ battle_reports (un nom trop long bloquait le raid).
    attackerPseudo: `${faction.enforcer} (${faction.name})`.slice(0, REPORT_PSEUDO_MAX),
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
    garrisons: garrisons.map((g, i) => {
      var _a2, _b2;
      return { ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: (_b2 = (_a2 = combat.garrisonLosses) == null ? void 0 : _a2[i]) != null ? _b2 : {} };
    })
  };
  return { player, queues: flushed.queues, combat, loot, bounty, debris, report, notifications };
}
function lairPower(faction, player) {
  var _a, _b;
  const fleetAttack = computeFullPower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]);
  return Math.round(Math.max(faction.raid.floorPower * 3, fleetAttack * faction.lair.pct));
}
function checkLairLaunch(faction, player, fleet) {
  if (!faction) throw new GameActionError("Repaire inconnu.");
  if (!pirateState(player, faction.id).lairOpen) throw new GameActionError(`${faction.lair.name} n'est pas encore localis\xE9.`);
  const units = {};
  for (const [id, v] of Object.entries(fleet != null ? fleet : {})) {
    const qty = Math.floor(Number(v));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(id)) throw new GameActionError("Seules les unit\xE9s d'attaque peuvent \xEAtre envoy\xE9es.");
    units[id] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
  return units;
}
function resolveLairAssault(faction, playerIn, queuesIn, fleet, power, now, formation) {
  var _a, _b, _c, _d, _e, _f, _g;
  const flushed = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player, faction.id);
  const fx = formationEffects(formation);
  const combat = resolveCombat(__spreadProps(__spreadValues({}, fx), {
    // v3.3 : Batterie de siège de l'alliance.
    attackFactor: fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack),
    // v5.9 : bonus de soute (Soute pliée…) sur le butin du repaire, comme contre un joueur.
    cargoFactor: fx.cargoFactor * (1 + playerModifiers(player).cargo),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: power
  }));
  const survivors = {};
  for (const [id, qty] of Object.entries(fleet)) survivors[id] = Math.max(0, qty - ((_a = combat.attackerLosses[id]) != null ? _a : 0));
  const notifications = [...flushed.notifications];
  if (combat.outcome === "attacker_win") {
    const reward = productionHours(player, faction.lair.rewardHours);
    for (const r of RARE) reward[r] = ((_b = reward[r]) != null ? _b : 0) + faction.lair.rare;
    for (const [res, amount3] of Object.entries(reward)) player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) + amount3;
    applyXpDelta(player, faction.lair.xp, now);
    const title = faction.lair.title;
    if (title && !((_d = player.titles) != null ? _d : []).some((t) => t.label === title)) {
      player.titles = [...(_e = player.titles) != null ? _e : [], { label: title, seasonId: `faction:${faction.id}`, rank: 1 }];
      if (!player.activeTitle) player.activeTitle = title;
    }
    st.lairOpen = false;
    st.repelled = 0;
    st.notoriety = 0;
    st.lairsTaken += 1;
    grantCommanderXp(player, "admiral", COMMANDER_XP.lairWin);
    addPassPoints(player, "victory", now);
    player.victories = ((_f = player.victories) != null ? _f : 0) + 1;
    notifications.push(
      note2(
        "combat-attacker",
        `${faction.lair.name} est tomb\xE9 !`,
        `Butin : ${describeGain(reward)} (${formatInt(total(reward))} au total), +${faction.lair.xp} XP${title ? ` et le titre \xAB ${title} \xBB` : ""}. ${faction.leader} s'est enfui\u2026 la traque continue.`,
        now
      )
    );
  } else {
    player.defeats = ((_g = player.defeats) != null ? _g : 0) + 1;
    notifications.push(note2("combat-attacker", "Assaut repouss\xE9", `Les d\xE9fenses du ${faction.lair.name} ont tenu. Les survivants rentrent.`, now));
  }
  setState(player, faction.id, st);
  const report = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: lairUid(faction.id),
    defenderPseudo: faction.lair.name.slice(0, REPORT_PSEUDO_MAX),
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
    attackerFleet: fleet
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications };
}
function validateFactions(defs) {
  var _a;
  const errors = [];
  const seen = /* @__PURE__ */ new Set();
  for (const f of defs) {
    const label3 = `Faction ${f.name || f.id}`;
    if (!/^[a-z0-9_]+$/.test((_a = f.id) != null ? _a : "")) errors.push(`${label3} : identifiant \xAB ${f.id} \xBB invalide (minuscules, chiffres, _).`);
    if (seen.has(f.id)) errors.push(`${label3} : identifiant en double.`);
    seen.add(f.id);
    if (!(f.trigger.maxIntervalHours >= f.trigger.minIntervalHours)) errors.push(`${label3} : d\xE9lai maximal inf\xE9rieur au d\xE9lai minimal.`);
    if (!(f.answerHours > 0)) errors.push(`${label3} : d\xE9lai de r\xE9ponse invalide.`);
    if (!(f.lair.raidsNeeded >= 1)) errors.push(`${label3} : nombre de raids avant le repaire invalide.`);
  }
  return errors;
}

// src/game/achievements.ts
var TIER_LABELS = { bronze: "Bronze", argent: "Argent", or: "Or", legendaire: "L\xE9gendaire" };
var TIER_REWARDS = {
  bronze: { xp: 10, hours: 0 },
  argent: { xp: 25, hours: 0 },
  or: { xp: 60, hours: 2 },
  legendaire: { xp: 150, hours: 6 }
};
var CATEGORY_LABELS = {
  combat: { label: "Combat", emoji: "\u2694\uFE0F" },
  construction: { label: "Construction", emoji: "\u{1F3D7}\uFE0F" },
  recherche: { label: "Recherche", emoji: "\u{1F52C}" },
  flotte: { label: "Flotte", emoji: "\u{1F680}" },
  missions: { label: "Missions et contrats", emoji: "\u{1F9ED}" },
  logistique: { label: "Renseignement et logistique", emoji: "\u{1F6F0}\uFE0F" },
  alliance: { label: "Alliance", emoji: "\u{1F91D}" },
  menaces: { label: "Menaces", emoji: "\u2620\uFE0F" },
  prestige: { label: "Prestige", emoji: "\u{1F3C6}" }
};
var sum = (xs) => xs.reduce((a, b) => a + b, 0);
var buildingLevels = (p) => BUILDINGS.filter((b) => !b.endgame).map((b) => {
  var _a, _b, _c;
  return (_c = (_b = (_a = p.buildings) == null ? void 0 : _a[b.id]) == null ? void 0 : _b.level) != null ? _c : 0;
});
var techLevels = (p) => TECHNOLOGIES.map((t) => {
  var _a, _b;
  return (_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0;
});
var factions = (p) => Object.entries(factionStates(p));
var pct2 = (n, d) => d > 0 ? Math.floor(n / d * 100) : 0;
var METRICS = {
  victories: { label: "Victoires", value: (p) => {
    var _a;
    return (_a = p.victories) != null ? _a : 0;
  } },
  defeats: { label: "D\xE9faites", value: (p) => {
    var _a;
    return (_a = p.defeats) != null ? _a : 0;
  } },
  loot: { label: "Ressources pill\xE9es (cumul)", value: (p) => {
    var _a;
    return (_a = playerStats(p).loot) != null ? _a : 0;
  } },
  phoenix: { label: "Victoire dans l'heure suivant une d\xE9faite (0/1)", value: (p) => {
    var _a;
    return (_a = playerStats(p).phoenix) != null ? _a : 0;
  } },
  buildingLevels: { label: "Niveaux de b\xE2timents (total)", value: (p) => sum(buildingLevels(p)) },
  maxBuildingLevel: { label: "Niveau du meilleur b\xE2timent", value: (p) => Math.max(0, ...buildingLevels(p)) },
  minBuildingLevel: { label: "Niveau du b\xE2timent le plus bas", value: (p) => Math.min(...buildingLevels(p)) },
  buildingsUnlockedPct: {
    label: "B\xE2timents d\xE9bloqu\xE9s (%)",
    value: (p) => pct2(LOCKABLE_BUILDINGS.filter((id) => {
      var _a, _b;
      return (_b = (_a = p.buildings) == null ? void 0 : _a[id]) == null ? void 0 : _b.unlocked;
    }).length, LOCKABLE_BUILDINGS.length)
  },
  techCount: { label: "Technologies recherch\xE9es", value: (p) => techLevels(p).filter((l) => l > 0).length },
  techLevels: { label: "Niveaux de technologies (total)", value: (p) => sum(techLevels(p)) },
  maxTechLevel: { label: "Niveau de la meilleure technologie", value: (p) => Math.max(0, ...techLevels(p)) },
  techsMaxedPct: {
    label: "Technologies au maximum (%)",
    value: (p) => pct2(TECHNOLOGIES.filter((t) => {
      var _a, _b;
      return ((_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0) >= t.maxLevel;
    }).length, TECHNOLOGIES.length)
  },
  nightResearch: { label: "Recherche lanc\xE9e entre 3 h et 5 h (0/1)", value: (p) => {
    var _a;
    return (_a = playerStats(p).nightResearch) != null ? _a : 0;
  } },
  unitsTotal: { label: "Unit\xE9s poss\xE9d\xE9es", value: (p) => {
    var _a;
    return sum(Object.values((_a = p.units) != null ? _a : {}).map((u) => u.count));
  } },
  defensesTotal: {
    label: "D\xE9fenses poss\xE9d\xE9es",
    value: (p) => sum(UNITS.filter((u) => u.category === "defense").map((u) => {
      var _a, _b, _c;
      return (_c = (_b = (_a = p.units) == null ? void 0 : _a[u.id]) == null ? void 0 : _b.count) != null ? _c : 0;
    }))
  },
  unitTypesPct: { label: "Types d'unit\xE9s d\xE9bloqu\xE9s (%)", value: (p) => pct2(UNITS.filter((u) => {
    var _a, _b, _c;
    return ((_c = (_b = (_a = p.units) == null ? void 0 : _a[u.id]) == null ? void 0 : _b.level) != null ? _c : 0) > 0;
  }).length, UNITS.length) },
  maxUnitLevel: { label: "Niveau de la meilleure unit\xE9", value: (p) => Math.max(0, ...UNITS.map((u) => {
    var _a, _b, _c;
    return (_c = (_b = (_a = p.units) == null ? void 0 : _a[u.id]) == null ? void 0 : _b.level) != null ? _c : 0;
  })) },
  unitsBuilt: { label: "Unit\xE9s construites (cumul)", value: (p) => {
    var _a;
    return (_a = playerStats(p).unitsBuilt) != null ? _a : 0;
  } },
  missions: { label: "Missions termin\xE9es", value: (p) => {
    var _a;
    return (_a = playerStats(p).missions) != null ? _a : 0;
  } },
  bestMissionDay: { label: "Missions termin\xE9es en une journ\xE9e (record)", value: (p) => {
    var _a;
    return (_a = playerStats(p).bestMissionDay) != null ? _a : 0;
  } },
  contracts: { label: "Contrats remplis", value: (p) => {
    var _a;
    return (_a = playerStats(p).contracts) != null ? _a : 0;
  } },
  spies: { label: "Espionnages lanc\xE9s", value: (p) => {
    var _a;
    return (_a = playerStats(p).spies) != null ? _a : 0;
  } },
  recycled: { label: "D\xE9bris recycl\xE9s (cumul)", value: (p) => {
    var _a;
    return (_a = playerStats(p).recycled) != null ? _a : 0;
  } },
  patrols: { label: "Patrouilles lanc\xE9es", value: (p) => {
    var _a;
    return (_a = playerStats(p).patrols) != null ? _a : 0;
  } },
  evasions: { label: "Raids subis flotte en patrouille", value: (p) => {
    var _a;
    return (_a = playerStats(p).evasions) != null ? _a : 0;
  } },
  expeditions: { label: "Exp\xE9ditions termin\xE9es", value: (p) => {
    var _a;
    return (_a = playerStats(p).expeditions) != null ? _a : 0;
  } },
  leviathanKills: { label: "L\xE9viathans abattus (participation)", value: (p) => {
    var _a;
    return (_a = playerStats(p).leviathanKills) != null ? _a : 0;
  } },
  traded: { label: "Ressources \xE9chang\xE9es au march\xE9 (cumul)", value: (p) => {
    var _a;
    return (_a = playerStats(p).traded) != null ? _a : 0;
  } },
  inAlliance: { label: "Membre d'une alliance (0/1)", value: (p) => p.allianceId ? 1 : 0 },
  allianceFounded: { label: "Alliance fond\xE9e (0/1)", value: (p) => {
    var _a;
    return (_a = playerStats(p).allianceFounded) != null ? _a : 0;
  } },
  garrisons: { label: "Garnisons envoy\xE9es", value: (p) => {
    var _a;
    return (_a = playerStats(p).garrisons) != null ? _a : 0;
  } },
  donated: { label: "Dons au tr\xE9sor d'alliance (cumul)", value: (p) => {
    var _a;
    return (_a = playerStats(p).donated) != null ? _a : 0;
  } },
  ultimatums: { label: "Ultimatums re\xE7us", value: (p) => {
    var _a;
    return (_a = playerStats(p).ultimatums) != null ? _a : 0;
  } },
  factionsThreatened: { label: "Factions diff\xE9rentes ayant menac\xE9", value: (p) => {
    var _a;
    return ((_a = playerStats(p).threatenedBy) != null ? _a : []).length;
  } },
  tributesPaid: { label: "Tributs pay\xE9s", value: (p) => sum(factions(p).map(([, s]) => s.tributesPaid)) },
  raidsRepelled: { label: "Raids repouss\xE9s", value: (p) => sum(factions(p).map(([, s]) => s.raidsWon)) },
  lairsTaken: { label: "Repaires pris", value: (p) => sum(factions(p).map(([, s]) => s.lairsTaken)) },
  lairFactions: { label: "Factions dont le repaire est tomb\xE9", value: (p) => factions(p).filter(([, s]) => s.lairsTaken > 0).length },
  maxNotoriety: {
    label: "Notori\xE9t\xE9 maximale atteinte (0/1)",
    value: (p) => factions(p).some(([id, s]) => {
      var _a, _b;
      return s.notoriety >= ((_b = (_a = findFaction(id)) == null ? void 0 : _a.raid.maxNotoriety) != null ? _b : Infinity);
    }) ? 1 : 0
  },
  diplomat: {
    label: "Tributs pay\xE9s sans jamais refuser",
    value: (p) => {
      const st = factions(p).map(([, s]) => s);
      return st.some((s) => s.raidsWon + s.raidsLost > 0) ? 0 : sum(st.map((s) => s.tributesPaid));
    }
  },
  xp: { label: "XP totale", value: (p) => {
    var _a;
    return (_a = p.xp) != null ? _a : 0;
  } },
  seasonTitles: { label: "Titres de saison", value: (p) => {
    var _a;
    return ((_a = p.titles) != null ? _a : []).filter((t) => !/^(faction|achievement|onboarding)/.test(String(t.seasonId))).length;
  } },
  // v5.4 : Chroniques et passe.
  chaptersCompleted: { label: "Chapitres des Chroniques termin\xE9s", value: (p) => {
    var _a, _b;
    return ((_b = (_a = p.chronicle) == null ? void 0 : _a.chapters) != null ? _b : []).length;
  } },
  bossSeals: { label: "Sceaux de boss de saison", value: (p) => {
    var _a, _b;
    return ((_b = (_a = p.chronicle) == null ? void 0 : _a.emblems) != null ? _b : []).length;
  } },
  passesCompleted: { label: "Passes de saison termin\xE9s", value: (p) => {
    var _a, _b;
    return ((_b = (_a = p.seasonPass) == null ? void 0 : _a.completed) != null ? _b : []).length;
  } },
  playtimeHours: { label: "Heures de jeu", value: (p) => {
    var _a;
    return Math.floor(((_a = p.playtimeSeconds) != null ? _a : 0) / 3600);
  } }
};
function def(id, category, tier, metric, threshold, name, description, emoji, extra = {}) {
  const r = TIER_REWARDS[tier];
  return __spreadValues({ id, enabled: true, name, description, emoji, category, tier, metric, threshold, secret: false, rewardXp: r.xp, rewardHours: r.hours, title: "" }, extra);
}
var DEFAULT_ACHIEVEMENTS = [
  // Combat
  def("first_blood", "combat", "bronze", "victories", 1, "Premier sang", "Remporte ton premier combat.", "\u2694\uFE0F"),
  def("veteran", "combat", "bronze", "victories", 10, "V\xE9t\xE9ran", "Remporte 10 combats.", "\u{1F396}\uFE0F"),
  def("warlord", "combat", "argent", "victories", 50, "Seigneur de guerre", "Remporte 50 combats.", "\u{1F5E1}\uFE0F"),
  def("star_scourge", "combat", "or", "victories", 200, "Fl\xE9au des \xE9toiles", "Remporte 200 combats.", "\u2604\uFE0F"),
  def("eternal_conqueror", "combat", "legendaire", "victories", 1e3, "Conqu\xE9rant \xE9ternel", "Remporte 1 000 combats.", "\u{1F451}", { title: "Conqu\xE9rant" }),
  def("raider", "combat", "bronze", "loot", 1e5, "Pillard", "Pille 100 000 ressources.", "\u{1F4B0}"),
  def("corsair", "combat", "argent", "loot", 1e6, "Corsaire", "Pille 1 million de ressources.", "\u{1F3F4}\u200D\u2620\uFE0F"),
  def("galactic_razzia", "combat", "or", "loot", 2e7, "Razzia galactique", "Pille 20 millions de ressources.", "\u{1F48E}"),
  def("persistent", "combat", "bronze", "defeats", 25, "Pers\xE9v\xE9rant", "Encaisse 25 d\xE9faites\u2026 et continue.", "\u{1FA79}", { secret: true }),
  def("phoenix", "combat", "argent", "phoenix", 1, "Ph\xE9nix", "Remporte une victoire dans l'heure qui suit une d\xE9faite.", "\u{1F525}", { secret: true }),
  // Construction
  def("foundations", "construction", "bronze", "buildingLevels", 10, "Premi\xE8res fondations", "Cumule 10 niveaux de b\xE2timents.", "\u{1F9F1}"),
  def("builder", "construction", "bronze", "buildingLevels", 50, "B\xE2tisseur", "Cumule 50 niveaux de b\xE2timents.", "\u{1F3D7}\uFE0F"),
  def("urbanist", "construction", "argent", "buildingLevels", 150, "Urbaniste", "Cumule 150 niveaux de b\xE2timents.", "\u{1F3D9}\uFE0F"),
  def("megastructure", "construction", "or", "buildingLevels", 300, "M\xE9gastructure", "Cumule 300 niveaux de b\xE2timents.", "\u{1F306}"),
  def("architect", "construction", "bronze", "maxBuildingLevel", 10, "Architecte", "Am\xE8ne un b\xE2timent au niveau 10.", "\u{1F3DB}\uFE0F"),
  def("master_builder", "construction", "argent", "maxBuildingLevel", 15, "Ma\xEEtre d'\u0153uvre", "Am\xE8ne un b\xE2timent au niveau 15.", "\u{1F4D0}"),
  def("masterpiece", "construction", "or", "maxBuildingLevel", 20, "Chef-d'\u0153uvre", "Am\xE8ne un b\xE2timent au niveau 20.", "\u{1F5FC}"),
  def("expansion", "construction", "argent", "buildingsUnlockedPct", 100, "Empire en expansion", "D\xE9bloque tous les b\xE2timents.", "\u{1F5FA}\uFE0F"),
  def("world_city", "construction", "legendaire", "minBuildingLevel", 20, "Cit\xE9-monde", "Am\xE8ne tous les b\xE2timents au niveau 20.", "\u{1F30D}", { title: "B\xE2tisseur de mondes" }),
  // Recherche
  def("curious", "recherche", "bronze", "techCount", 1, "Curieux", "Termine ta premi\xE8re recherche.", "\u{1F50E}"),
  def("researcher", "recherche", "bronze", "techCount", 5, "Chercheur", "Recherche 5 technologies diff\xE9rentes.", "\u{1F52C}"),
  def("scholar", "recherche", "argent", "techLevels", 25, "\xC9rudit", "Cumule 25 niveaux de technologies.", "\u{1F4DA}"),
  def("savant", "recherche", "or", "techLevels", 75, "Savant", "Cumule 75 niveaux de technologies.", "\u{1F9E0}"),
  def("omniscience", "recherche", "legendaire", "techsMaxedPct", 100, "Omniscience", "Am\xE8ne toutes les technologies au maximum.", "\u{1F30C}", { title: "Omniscient" }),
  def("specialist", "recherche", "argent", "maxTechLevel", 10, "Sp\xE9cialiste", "Am\xE8ne une technologie au niveau 10.", "\u{1F9EA}"),
  def("night_owl", "recherche", "bronze", "nightResearch", 1, "Nuit blanche", "Lance une recherche entre 3 h et 5 h du matin.", "\u{1F989}", { secret: true }),
  // Flotte
  def("fleet", "flotte", "bronze", "unitsTotal", 50, "Flotte redoutable", "Poss\xE8de 50 unit\xE9s au total.", "\u{1F680}"),
  def("squadron", "flotte", "argent", "unitsTotal", 500, "Escadre", "Poss\xE8de 500 unit\xE9s.", "\u{1F6F8}"),
  def("armada", "flotte", "or", "unitsTotal", 5e3, "Armada", "Poss\xE8de 5 000 unit\xE9s.", "\u{1F320}"),
  def("steel_tide", "flotte", "legendaire", "unitsTotal", 5e4, "Mar\xE9e d'acier", "Poss\xE8de 50 000 unit\xE9s.", "\u{1F30A}", { title: "Amiral de la Mar\xE9e" }),
  def("collector", "flotte", "argent", "unitTypesPct", 100, "Collectionneur", "D\xE9bloque tous les types d'unit\xE9s.", "\u{1F5C2}\uFE0F"),
  def("tireless_yard", "flotte", "or", "unitsBuilt", 1e4, "Chantier infatigable", "Construis 10 000 unit\xE9s.", "\u{1F6E0}\uFE0F"),
  def("naval_engineer", "flotte", "argent", "maxUnitLevel", 10, "Ing\xE9nieur naval", "Am\xE8ne une unit\xE9 au niveau 10.", "\u2699\uFE0F"),
  def("bastion", "flotte", "argent", "defensesTotal", 1e3, "Bastion", "Poss\xE8de 1 000 d\xE9fenses.", "\u{1F6E1}\uFE0F"),
  // Missions et contrats
  def("scout", "missions", "bronze", "missions", 10, "\xC9claireur", "Termine 10 missions.", "\u{1F9ED}"),
  def("explorer", "missions", "argent", "missions", 100, "Explorateur", "Termine 100 missions.", "\u{1F5FA}\uFE0F"),
  def("frontier_legend", "missions", "or", "missions", 1e3, "L\xE9gende des confins", "Termine 1 000 missions.", "\u{1F30C}"),
  def("contractor", "missions", "bronze", "contracts", 10, "Contractuel", "Remplis 10 contrats.", "\u{1F4DC}"),
  def("man_of_word", "missions", "argent", "contracts", 100, "Homme de parole", "Remplis 100 contrats.", "\u{1F91D}"),
  def("always_there", "missions", "or", "contracts", 300, "Toujours au rendez-vous", "Remplis 300 contrats.", "\u{1F4C5}"),
  def("no_rest", "missions", "bronze", "bestMissionDay", 10, "Sans repos", "Termine 10 missions en une seule journ\xE9e.", "\u{1F624}", { secret: true }),
  def("deep_space", "missions", "bronze", "expeditions", 1, "Grand large", "Termine ta premi\xE8re exp\xE9dition.", "\u{1F6F8}"),
  def("pathfinder", "missions", "argent", "expeditions", 25, "Pionnier de l'inconnu", "Termine 25 exp\xE9ditions.", "\u{1F52D}"),
  def("leviathan_slayer", "menaces", "or", "leviathanKills", 1, "Tueur de L\xE9viathan", "Participe \xE0 la chute du L\xE9viathan.", "\u{1F40B}"),
  // Renseignement et logistique
  def("prying_eye", "logistique", "bronze", "spies", 1, "\u0152il indiscret", "Lance ton premier espionnage.", "\u{1F441}\uFE0F"),
  def("spymaster", "logistique", "argent", "spies", 50, "Ma\xEEtre espion", "Lance 50 espionnages.", "\u{1F575}\uFE0F"),
  def("scrapper", "logistique", "bronze", "recycled", 1e5, "Ferrailleur", "Recycle 100 000 ressources de d\xE9bris.", "\u267B\uFE0F"),
  def("star_scavenger", "logistique", "or", "recycled", 5e6, "Charognard des \xE9toiles", "Recycle 5 millions de ressources de d\xE9bris.", "\u{1F985}"),
  def("ghost", "logistique", "bronze", "patrols", 10, "Fant\xF4me", "Lance 10 patrouilles.", "\u{1F47B}"),
  def("elusive", "logistique", "argent", "evasions", 1, "Insaisissable", "Sois en patrouille quand un raid frappe ta base.", "\u{1F4A8}", { secret: true }),
  def("merchant", "logistique", "bronze", "traded", 1e6, "Marchand", "\xC9change 1 million de ressources au march\xE9.", "\u2696\uFE0F"),
  def("tycoon", "logistique", "or", "traded", 5e7, "Magnat", "\xC9change 50 millions de ressources au march\xE9.", "\u{1F3E6}"),
  // Alliance
  def("brothers_in_arms", "alliance", "bronze", "inAlliance", 1, "Fr\xE8res d'armes", "Rejoins une alliance.", "\u{1F91D}"),
  def("founder", "alliance", "bronze", "allianceFounded", 1, "Fondateur", "Fonde une alliance.", "\u{1F6A9}"),
  def("allied_shield", "alliance", "bronze", "garrisons", 5, "Bouclier alli\xE9", "Envoie 5 garnisons.", "\u{1F6E1}\uFE0F"),
  def("faithful_sentinel", "alliance", "argent", "garrisons", 50, "Sentinelle fid\xE8le", "Envoie 50 garnisons.", "\u{1F5FC}"),
  def("patron", "alliance", "argent", "donated", 1e6, "M\xE9c\xE8ne", "Donne 1 million de ressources au tr\xE9sor.", "\u{1F381}"),
  def("pillar", "alliance", "or", "donated", 2e7, "Pilier de l'alliance", "Donne 20 millions de ressources au tr\xE9sor.", "\u{1F3DB}\uFE0F"),
  // Menaces
  def("on_the_list", "menaces", "bronze", "ultimatums", 1, "Sur la Liste", "Re\xE7ois ton premier ultimatum.", "\u{1F4CB}"),
  def("taxpayer", "menaces", "bronze", "tributesPaid", 5, "Contribuable", "Paie 5 tributs.", "\u{1FA99}"),
  def("defiant", "menaces", "bronze", "raidsRepelled", 1, "Insoumis", "Repousse un raid de faction.", "\u270A"),
  def("rampart", "menaces", "argent", "raidsRepelled", 10, "Rempart", "Repousse 10 raids de faction.", "\u{1F9F1}"),
  def("bounty_hunter", "menaces", "or", "lairsTaken", 1, "Chasseur de primes", "Prends un repaire de faction.", "\u{1F3AF}"),
  def("factions_bane", "menaces", "legendaire", "lairFactions", 3, "Fl\xE9au des factions", "Fais tomber les repaires de 3 factions diff\xE9rentes.", "\u{1F480}", { title: "Fl\xE9au des factions" }),
  def("wanted", "menaces", "or", "maxNotoriety", 1, "T\xEAte mise \xE0 prix", "Atteins la Notori\xE9t\xE9 maximale aupr\xE8s d'une faction.", "\u{1F4F8}"),
  def("diplomat", "menaces", "argent", "diplomat", 20, "Diplomate", "Paie 20 tributs sans jamais refuser.", "\u{1F54A}\uFE0F", { secret: true }),
  def("all_against_me", "menaces", "argent", "factionsThreatened", 4, "Tous contre moi", "Re\xE7ois les ultimatums de 4 factions diff\xE9rentes.", "\u{1F3AD}", { secret: true }),
  // Prestige
  def("commander", "prestige", "bronze", "xp", 900, "Commandant", "Atteins le rang Bronze III.", "\u{1F3C5}"),
  def("rising_star", "prestige", "argent", "xp", 7500, "\xC9toile montante", "Atteins le rang Or III.", "\u2B50"),
  def("elite_of_elite", "prestige", "or", "xp", 7e4, "\xC9lite des \xE9lites", "Atteins le rang Diamant III.", "\u{1F4A0}"),
  def("podium", "prestige", "or", "seasonTitles", 1, "Podium", "Remporte un titre de saison.", "\u{1F947}"),
  def("tireless", "prestige", "bronze", "playtimeHours", 24, "Increvable", "Cumule 24 h de temps de jeu.", "\u23F1\uFE0F"),
  // v5.4 : Chroniques et passe (les paliers suivants sont générés automatiquement).
  def("chapter_reader", "prestige", "bronze", "chaptersCompleted", 1, "Lecteur des Chroniques", "Termine les quatre \xE9pisodes d'un chapitre.", "\u{1F4D6}"),
  def("chapter_keeper", "prestige", "argent", "chaptersCompleted", 3, "Gardien des Chroniques", "Termine 3 chapitres des Chroniques.", "\u{1F4DA}"),
  def("seal_bearer", "prestige", "argent", "bossSeals", 1, "Porte-sceau", "Participe \xE0 la chute d'un boss de saison.", "\u{1F531}"),
  def("pass_finisher", "prestige", "or", "passesCompleted", 1, "Jusqu'au bout", "Termine un passe de saison.", "\u{1F39F}\uFE0F")
];
var ACHIEVEMENTS = [];
function setAchievements(defs) {
  ACHIEVEMENTS.splice(0, ACHIEVEMENTS.length, ...defs);
}
setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
function achievementValue(a, player) {
  const m = METRICS[a.metric];
  return m ? m.value(player) : 0;
}
function checkNewAchievements(player) {
  var _a;
  const unlocked = new Set((_a = player.unlockedAchievements) != null ? _a : []);
  return ACHIEVEMENTS.filter((a) => a.enabled && !unlocked.has(a.id) && achievementValue(a, player) >= a.threshold);
}
function achievementReward(a, player) {
  var _a, _b, _c;
  if (!(a.rewardHours > 0)) return {};
  const rates = getProductionRatesPerSecond((_a = player.buildings) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {});
  const out = {};
  for (const res of COMMON_RESOURCES2) {
    const n = Math.floor(((_c = rates[res]) != null ? _c : 0) * a.rewardHours * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}
function validateAchievements(defs) {
  var _a;
  const errors = [];
  const seen = /* @__PURE__ */ new Set();
  for (const a of defs) {
    const label3 = `Succ\xE8s ${a.name || a.id}`;
    if (!/^[a-z0-9_]+$/.test((_a = a.id) != null ? _a : "")) errors.push(`${label3} : identifiant \xAB ${a.id} \xBB invalide (minuscules, chiffres, _).`);
    if (seen.has(a.id)) errors.push(`${label3} : identifiant en double.`);
    seen.add(a.id);
    if (!(a.metric in METRICS)) errors.push(`${label3} : mesure inconnue.`);
    if (!(a.threshold > 0)) errors.push(`${label3} : seuil invalide.`);
    if (!(a.tier in TIER_LABELS)) errors.push(`${label3} : palier inconnu.`);
    if (!(a.category in CATEGORY_LABELS)) errors.push(`${label3} : cat\xE9gorie inconnue.`);
  }
  return errors;
}

// src/game/synthesis.ts
var CAPSULES = {
  assault: {
    name: "Stimulant d'assaut",
    short: "Attaque",
    description: (p) => `+${p} % d'attaque pour la prochaine attaque lanc\xE9e contre un joueur.`,
    use: "launch"
  },
  armor: {
    name: "Carapace r\xE9active",
    short: "D\xE9fense",
    description: (p) => `+${p} % de d\xE9fense contre la premi\xE8re attaque de joueur subie (12 h).`,
    use: "activate"
  },
  decoy: {
    name: "Brouilleur d'approche",
    short: "Leurre",
    description: (p) => `Le d\xE9fenseur voit une fausse composition de ta flotte (\xB1${p} %). L'heure d'arriv\xE9e reste vraie.`,
    use: "launch"
  },
  veil: {
    name: "Brouilleur de d\xE9fense",
    short: "Voile",
    description: (p) => `Les rapports d'espionnage sur ta base montrent des d\xE9fenses et une flotte fauss\xE9es de \xB1${p} % (12 h).`,
    use: "activate"
  }
};
var CAPSULE_TYPES = Object.keys(CAPSULES);
var SYNTH_RULES = {
  pctPerLevel: 5,
  maxStock: 3,
  activeHours: 12,
  /** Coût : 2 h de production commune par niveau de capsule. */
  costHoursPerLevel: 2,
  /** Fabrication : 30 min au niveau 1, environ 12 h au niveau 10. */
  baseMinutes: 30,
  minutesPerLevel: 77
};
function capsulePct(level3) {
  return Math.max(0, Math.min(10, Math.floor(level3))) * SYNTH_RULES.pctPerLevel;
}
function synthesisState(player) {
  var _a, _b, _c, _d;
  const raw = (_a = player.synthesis) != null ? _a : {};
  const stock = {};
  for (const t of CAPSULE_TYPES) stock[t] = (Array.isArray((_b = raw.stock) == null ? void 0 : _b[t]) ? raw.stock[t] : []).map((n) => Math.max(1, Math.min(10, Math.floor(Number(n)) || 1)));
  const crafting = raw.crafting && CAPSULE_TYPES.includes(raw.crafting.type) ? raw.crafting : null;
  const decoys = raw.decoys && typeof raw.decoys === "object" ? raw.decoys : {};
  return { crafting, stock, armor: (_c = raw.armor) != null ? _c : null, veil: (_d = raw.veil) != null ? _d : null, decoys };
}
function synthLevel(player) {
  var _a, _b;
  const b = (_a = player.buildings) == null ? void 0 : _a[SYNTH_BUILDING_ID];
  return b && b.unlocked !== false ? Math.max(0, (_b = b.level) != null ? _b : 0) : 0;
}
function craftSeconds(level3) {
  return (SYNTH_RULES.baseMinutes + (level3 - 1) * SYNTH_RULES.minutesPerLevel) * 60;
}
function capsuleCost(player, level3) {
  var _a;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const hours2 = SYNTH_RULES.costHoursPerLevel * level3;
  const out = {};
  for (const res of ["scrap", "energy", "nano", "data"]) out[res] = Math.max(1e3 * level3, Math.floor(((_a = rates[res]) != null ? _a : 0) * hours2 * 3600));
  return out;
}
function advanceSynthesis(player, now) {
  const st = synthesisState(player);
  if (!st.crafting || st.crafting.endsAtMs > now) return null;
  const done = { type: st.crafting.type, level: st.crafting.level };
  st.stock[done.type] = [...st.stock[done.type], done.level].slice(-SYNTH_RULES.maxStock);
  st.crafting = null;
  player.synthesis = st;
  return done;
}
function craftCapsule(player, typeIn, levelIn, now) {
  var _a, _b, _c;
  const type = typeIn;
  if (!CAPSULE_TYPES.includes(type)) throw new GameActionError("Capsule inconnue.");
  const level3 = Math.floor(Number(levelIn));
  const max = synthLevel(player);
  if (max <= 0) throw new GameActionError("Il faut d'abord construire le Labo de synth\xE8se.");
  if (!(level3 >= 1 && level3 <= max)) throw new GameActionError(`Ton Labo de synth\xE8se fabrique des capsules jusqu'au niveau ${max}.`);
  const st = synthesisState(player);
  if (st.crafting) throw new GameActionError("Une capsule est d\xE9j\xE0 en cours de synth\xE8se.");
  if (st.stock[type].length >= SYNTH_RULES.maxStock) throw new GameActionError(`${SYNTH_RULES.maxStock} capsules de ce type en r\xE9serve au plus.`);
  const cost = capsuleCost(player, level3);
  for (const [res, n] of Object.entries(cost)) {
    if (((_a = player.resources[res]) != null ? _a : 0) < n) throw new GameActionError(`Il manque ${formatInt(n - ((_b = player.resources[res]) != null ? _b : 0))} ressources pour cette capsule.`);
  }
  for (const [res, n] of Object.entries(cost)) player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) - n;
  st.crafting = { type, level: level3, endsAtMs: now + craftSeconds(level3) * 1e3 };
  player.synthesis = st;
  return st.crafting;
}
function takeCapsule(player, type, levelIn) {
  const st = synthesisState(player);
  const stock = [...st.stock[type]].sort((a, b) => b - a);
  if (stock.length === 0) throw new GameActionError(`Aucune capsule \xAB ${CAPSULES[type].name} \xBB en r\xE9serve.`);
  const wanted = levelIn === void 0 || levelIn === null ? stock[0] : Math.floor(Number(levelIn));
  const i = stock.indexOf(wanted);
  if (i < 0) throw new GameActionError("Cette capsule n'est plus en r\xE9serve.");
  stock.splice(i, 1);
  st.stock[type] = stock;
  player.synthesis = st;
  return capsulePct(wanted);
}
function activateCapsule(player, typeIn, levelIn, now) {
  const type = typeIn;
  if (type !== "armor" && type !== "veil") throw new GameActionError("Cette capsule s'utilise au lancement d'une attaque.");
  const st = synthesisState(player);
  const current2 = st[type];
  if (current2 && current2.untilMs > now) throw new GameActionError("Une capsule de ce type est d\xE9j\xE0 active.");
  const pct5 = takeCapsule(player, type, levelIn);
  const after = synthesisState(player);
  after[type] = { pct: pct5, untilMs: now + SYNTH_RULES.activeHours * 36e5 };
  player.synthesis = after;
  return pct5;
}
function consumeArmor(player, now) {
  const st = synthesisState(player);
  if (!st.armor || st.armor.untilMs <= now) return 0;
  const pct5 = st.armor.pct;
  st.armor = null;
  player.synthesis = st;
  return pct5;
}
function activeVeil(player, now) {
  const v = synthesisState(player).veil;
  return v && v.untilMs > now ? v.pct : 0;
}
function decoyUnits(real, pct5, pool, random = Math.random) {
  var _a;
  const out = {};
  const swing = pct5 / 100;
  for (const [id, qty] of Object.entries(real)) {
    if (!(qty > 0)) continue;
    const fake = Math.max(1, Math.round(qty * (1 + (random() * 2 - 1) * swing)));
    let target = id;
    if (pool.length > 1 && random() < swing) {
      const others = pool.filter((p) => p !== id);
      target = others[Math.floor(random() * others.length) % others.length];
    }
    out[target] = ((_a = out[target]) != null ? _a : 0) + fake;
  }
  return out;
}
function veilCounts(entries, pct5, random = Math.random) {
  if (!entries) return entries;
  const swing = pct5 / 100;
  return Object.fromEntries(Object.entries(entries).map(([id, e3]) => [id, __spreadProps(__spreadValues({}, e3), { count: Math.max(0, Math.round(e3.count * (1 + (random() * 2 - 1) * swing))) })]));
}
function takeLaunchCapsules(player, request, realUnits, pool, random = Math.random) {
  const req = request && typeof request === "object" ? request : {};
  const out = { boosts: {}, fakeUnits: null };
  const level3 = (v) => v === true ? void 0 : v;
  if (req.assault) out.boosts.assault = takeCapsule(player, "assault", level3(req.assault));
  if (req.decoy) {
    out.boosts.decoy = takeCapsule(player, "decoy", level3(req.decoy));
    out.fakeUnits = decoyUnits(realUnits, out.boosts.decoy, pool, random);
  }
  return out;
}
function recordDecoy(player, fleetId, units) {
  const st = synthesisState(player);
  st.decoys = __spreadProps(__spreadValues({}, st.decoys), { [fleetId]: units });
  player.synthesis = st;
}
function clearDecoy(player, fleetId) {
  const st = synthesisState(player);
  if (!st.decoys[fleetId]) return;
  const next = __spreadValues({}, st.decoys);
  delete next[fleetId];
  st.decoys = next;
  player.synthesis = st;
}

// src/game/vacation.ts
var VACATION_RULES = {
  minDays: 2,
  maxDays: 21,
  /** Attente entre deux périodes. */
  cooldownDays: 5,
  /** Production pendant l'absence. */
  productionFactor: 0.25,
  /** Pas d'activation dans les 12 h qui suivent une attaque subie. */
  recentAttackHours: 12,
  /** Retour anticipé possible après 48 h seulement. */
  minStayHours: 48
};
var DAY3 = 864e5;
var HOUR3 = 36e5;
function onVacation(p, now) {
  const v = p.vacation;
  return !!v && !v.endedAtMs && v.startedAtMs <= now && now < v.untilMs;
}
function startVacation(player, daysIn, ctx, now) {
  var _a, _b, _c, _d;
  const days = Math.floor(Number(daysIn));
  if (!(days >= VACATION_RULES.minDays && days <= VACATION_RULES.maxDays)) {
    throw new GameActionError(`Choisis une dur\xE9e entre ${VACATION_RULES.minDays} et ${VACATION_RULES.maxDays} jours.`);
  }
  if (onVacation(player, now)) throw new GameActionError("Tu es d\xE9j\xE0 en vacances.");
  const lastEnd = (_d = (_c = (_a = player.vacation) == null ? void 0 : _a.endedAtMs) != null ? _c : (_b = player.vacation) == null ? void 0 : _b.untilMs) != null ? _d : 0;
  if (lastEnd > 0 && now < lastEnd + VACATION_RULES.cooldownDays * DAY3) {
    const left = Math.ceil((lastEnd + VACATION_RULES.cooldownDays * DAY3 - now) / HOUR3);
    throw new GameActionError(`Tes derni\xE8res vacances sont trop r\xE9centes : encore ${left} h d'attente.`);
  }
  if (ctx.fleetsAway > 0) throw new GameActionError("Rappelle d'abord tes flottes : elles doivent toutes \xEAtre \xE0 quai.");
  if (ctx.hostileIncoming > 0) throw new GameActionError("Une flotte hostile approche : impossible de partir maintenant.");
  if (ctx.ultimatum) throw new GameActionError("R\xE9ponds d'abord \xE0 l'ultimatum en cours.");
  if (ctx.lastAttackedAtMs > 0 && now - ctx.lastAttackedAtMs < VACATION_RULES.recentAttackHours * HOUR3) {
    throw new GameActionError(`Tu as \xE9t\xE9 attaqu\xE9 il y a moins de ${VACATION_RULES.recentAttackHours} h : les vacances ne servent pas de bouclier d'urgence.`);
  }
  const v = { startedAtMs: now, untilMs: now + days * DAY3 };
  player.vacation = v;
  return v;
}
function endVacation(player, queues, at, early = false) {
  var _a, _b;
  const v = player.vacation;
  if (!v || v.endedAtMs) return;
  if (early && at - v.startedAtMs < VACATION_RULES.minStayHours * HOUR3) {
    const left = Math.ceil((v.startedAtMs + VACATION_RULES.minStayHours * HOUR3 - at) / HOUR3);
    throw new GameActionError(`Retour possible apr\xE8s ${VACATION_RULES.minStayHours} h de vacances : encore ${left} h.`);
  }
  const end = Math.min(at, v.untilMs);
  const shift = Math.max(0, end - v.startedAtMs);
  const later = (t) => t === null ? null : t + shift;
  for (const id of Object.keys(queues.buildingUpgrades)) {
    const e3 = queues.buildingUpgrades[id];
    if (e3) {
      e3.endTime += shift;
      if (e3.startedAtMs) e3.startedAtMs += shift;
    }
  }
  ["attack", "defense"].forEach((c) => queues.unitQueues[c].forEach((e3) => e3.endTime = later(e3.endTime)));
  queues.activeResearches.forEach((e3) => {
    e3.endTime += shift;
    if (e3.startedAtMs) e3.startedAtMs += shift;
  });
  queues.activeMissions.forEach((e3) => e3.endTime += shift);
  for (const c of (_a = player.colonies) != null ? _a : []) {
    if (c.building) {
      c.building.endTime += shift;
      if (c.building.startedAtMs) c.building.startedAtMs += shift;
    }
    if (c.defenseJob) {
      c.defenseJob.endTime += shift;
      if (c.defenseJob.startedAtMs) c.defenseJob.startedAtMs += shift;
    }
    c.updatedAtMs = Math.min(end, c.updatedAtMs + shift * (1 - VACATION_RULES.productionFactor));
  }
  if (player.colonizing) player.colonizing.endTime += shift;
  if ((_b = player.synthesis) == null ? void 0 : _b.crafting) player.synthesis.crafting.endsAtMs += shift;
  player.vacation = __spreadProps(__spreadValues({}, v), { endedAtMs: end });
}

// src/game/buildPlan.ts
var BUILD_PLAN_RULES = {
  slotBuilding: "fonderie_quantique",
  /** Niveau de la Fonderie requis pour chaque emplacement (le 1er est offert). */
  slotLevels: [0, 5, 10],
  maxWaitHours: 24
};
function buildPlan(queues) {
  return Array.isArray(queues.buildPlan) ? queues.buildPlan.filter((p) => p && typeof p.buildingId === "string") : [];
}
function planSlots(player) {
  var _a;
  const s = player.buildings[BUILD_PLAN_RULES.slotBuilding];
  const level3 = (s == null ? void 0 : s.unlocked) ? (_a = s.level) != null ? _a : 0 : 0;
  return BUILD_PLAN_RULES.slotLevels.filter((l) => level3 >= l).length;
}
function nextPlannedLevel(player, queues, buildingId) {
  var _a, _b;
  const current2 = (_b = (_a = player.buildings[buildingId]) == null ? void 0 : _a.level) != null ? _b : 0;
  const upgrading = queues.buildingUpgrades[buildingId] ? 1 : 0;
  const planned = buildPlan(queues).filter((p) => p.buildingId === buildingId).length;
  return current2 + upgrading + planned + 1;
}
function addPlanned(player, queues, buildingId, now) {
  const def3 = findBuilding(String(buildingId));
  const state = def3 ? player.buildings[def3.id] : void 0;
  if (!def3 || !state) throw new GameActionError("B\xE2timent inconnu.");
  if (!state.unlocked && !def3.startsUnlocked) throw new GameActionError("Ce b\xE2timent n'est pas d\xE9bloqu\xE9.");
  const plan = buildPlan(queues);
  const slots = planSlots(player);
  if (plan.length >= slots) {
    const next = BUILD_PLAN_RULES.slotLevels[slots];
    throw new GameActionError(next !== void 0 ? `File pleine : l'emplacement suivant s'ouvre avec la Fonderie quantique niveau ${next}.` : "File pleine.");
  }
  const level3 = nextPlannedLevel(player, queues, def3.id);
  if (level3 > def3.maxLevel) throw new GameActionError("Niveau maximum d\xE9j\xE0 atteint ou programm\xE9.");
  const entry = { buildingId: def3.id, level: level3, addedAtMs: now };
  queues.buildPlan = [...plan, entry];
  return entry;
}
function removePlanned(queues, index) {
  const plan = buildPlan(queues);
  const i = Math.floor(Number(index));
  if (!(i >= 0 && i < plan.length)) throw new GameActionError("Cette am\xE9lioration n'est plus programm\xE9e.");
  const removed = plan[i];
  queues.buildPlan = plan.filter((p, j) => j !== i && !(j > i && p.buildingId === removed.buildingId));
}
function advanceBuildPlan(player, queues, now, finishedAt = {}) {
  var _a, _b, _c, _d;
  const notes = [];
  const keep = [];
  for (const entry of buildPlan(queues)) {
    const def3 = findBuilding(entry.buildingId);
    const state = def3 ? player.buildings[def3.id] : void 0;
    if (!def3 || !state || entry.level <= state.level || entry.level > def3.maxLevel) continue;
    const busy = !!queues.buildingUpgrades[def3.id];
    if (busy) {
      keep.push(entry);
      continue;
    }
    if (entry.level !== state.level + 1) {
      if (keep.some((k) => k.buildingId === entry.buildingId)) keep.push(entry);
      continue;
    }
    const cost = applyBuildingDiscount(getBuildingUpgradeCost(def3, entry.level), (_b = (_a = player.bonuses) == null ? void 0 : _a.buildingUpgradeDiscount) != null ? _b : 0);
    if (canAffordAll(player.resources, cost)) {
      let total2 = 0;
      for (const [res, val] of Object.entries(cost)) {
        player.resources[res] -= val != null ? val : 0;
        total2 += val != null ? val : 0;
      }
      recordContract(player, "spend", total2, now);
      bumpStat(player, "spent", total2);
      const startAt = Math.min(now, (_c = finishedAt[def3.id]) != null ? _c : now);
      queues.buildingUpgrades[def3.id] = {
        endTime: startAt + Math.round(getBuildingUpgradeTime(def3, entry.level) * playerBuildTimeFactor(player, now)) * 1e3,
        startedAtMs: startAt,
        paid: cost
      };
      recordContract(player, "upgrade_building", 1, now);
      notes.push({ kind: "building", title: "File planifi\xE9e", message: `${def3.name} niveau ${entry.level} : am\xE9lioration lanc\xE9e.`, createdAtMs: now, read: false });
      continue;
    }
    const since = (_d = entry.waitingSinceMs) != null ? _d : now;
    if (now - since > BUILD_PLAN_RULES.maxWaitHours * 36e5) {
      notes.push({ kind: "building", title: "File planifi\xE9e", message: `${def3.name} niveau ${entry.level} retir\xE9 : ressources insuffisantes depuis ${BUILD_PLAN_RULES.maxWaitHours} h.`, createdAtMs: now, read: false });
      continue;
    }
    keep.push(__spreadProps(__spreadValues({}, entry), { waitingSinceMs: since }));
  }
  queues.buildPlan = keep;
  return notes;
}

// src/game/flush.ts
function unitForTech(techId) {
  var _a;
  return (_a = Object.entries(UNIT_TO_TECH).find(([, tech]) => tech === techId)) == null ? void 0 : _a[0];
}
var RESOURCE_HISTORY_INTERVAL_MS = 60 * 60 * 1e3;
var RESOURCE_HISTORY_MAX_POINTS = 72;
function recordResourceHistory(player, now) {
  var _a;
  const history = (_a = player.resourceHistory) != null ? _a : [];
  const last = history[history.length - 1];
  if (last && now - last.t < RESOURCE_HISTORY_INTERVAL_MS) {
    player.resourceHistory = history;
    return;
  }
  const next = [...history, { t: now, r: __spreadValues({}, player.resources) }];
  player.resourceHistory = next.length > RESOURCE_HISTORY_MAX_POINTS ? next.slice(next.length - RESOURCE_HISTORY_MAX_POINTS) : next;
}
function flushState(playerIn, queuesIn, now) {
  var _a, _b, _c, _d, _e, _f;
  const player = structuredClone(playerIn);
  const queues = structuredClone(queuesIn);
  const notifications = [];
  const vac = player.vacation;
  if (vac && !vac.endedAtMs && vac.startedAtMs <= now) {
    const from = Math.max(player.resourcesUpdatedAtMs || now, vac.startedAtMs);
    const to = Math.min(now, vac.untilMs);
    if (to > from) {
      const before = player.resources;
      const after = advanceResources(player, (to - from) / 1e3, from);
      player.resources = Object.fromEntries(
        Object.entries(after).map(([res, n]) => {
          var _a2;
          const old = (_a2 = before[res]) != null ? _a2 : 0;
          return [res, n > old ? old + (n - old) * VACATION_RULES.productionFactor : n];
        })
      );
      player.resourcesUpdatedAtMs = to;
    }
    if (now >= vac.untilMs) {
      endVacation(player, queues, vac.untilMs);
      notifications.push({ kind: "event", title: "Retour de vacances", message: "Tes vacances sont termin\xE9es : production et chantiers reprennent normalement.", createdAtMs: now, read: false });
    } else {
      recordResourceHistory(player, now);
      return { player, queues, notifications };
    }
  }
  const elapsedSeconds = Math.max(0, (now - (player.resourcesUpdatedAtMs || now)) / 1e3);
  player.resources = advanceResources(player, elapsedSeconds, now - elapsedSeconds * 1e3);
  ensureContracts(player, now);
  player.resourcesUpdatedAtMs = now;
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);
  notifications.push(...advanceColonies(player, now));
  if (player.testMode) finishAllTimers(queues, now);
  const finishedAt = {};
  for (const buildingId of Object.keys(queues.buildingUpgrades)) {
    const entry = queues.buildingUpgrades[buildingId];
    if (!entry || entry.endTime > now) continue;
    const def3 = findBuilding(buildingId);
    if (def3) {
      player.buildings[buildingId].level += 1;
      grantCommanderXp(player, "engineer", COMMANDER_XP.buildingDone);
      notifications.push({
        kind: "building",
        title: "Construction termin\xE9e",
        message: `${def3.name} a atteint le niveau ${player.buildings[buildingId].level}.`,
        createdAtMs: now,
        read: false
      });
    }
    finishedAt[buildingId] = entry.endTime;
    delete queues.buildingUpgrades[buildingId];
  }
  notifications.push(...advanceBuildPlan(player, queues, now, finishedAt));
  ["attack", "defense"].forEach((category) => {
    const queue = queues.unitQueues[category];
    let guard = 0;
    while (queue.length > 0 && guard++ < 2e3) {
      const front = queue[0];
      if (front.endTime === null) {
        const u2 = findUnit(front.unitId);
        front.endTime = now + (u2 ? getUnitBuildTime(u2, player.techLevels) : 0) * 1e3;
        break;
      }
      if (front.endTime > now) break;
      const u = findUnit(front.unitId);
      if (u) {
        if (!player.units[u.id]) player.units[u.id] = { level: 1, count: 0 };
        player.units[u.id].count += 1;
        bumpStat(player, "unitsBuilt");
      }
      const completedEndTime = front.endTime;
      queue.shift();
      if (queue.length > 0 && queue[0].endTime === null) {
        const nu = findUnit(queue[0].unitId);
        queue[0].endTime = completedEndTime + (nu ? getUnitBuildTime(nu, player.techLevels) : 0) * 1e3;
      }
    }
  });
  const stillActiveResearch = [];
  for (const entry of queues.activeResearches) {
    const tech = findTech(entry.id);
    if (!tech) continue;
    if (entry.endTime > now) {
      stillActiveResearch.push(entry);
      continue;
    }
    const nextLevel = ((_a = player.techLevels[tech.id]) != null ? _a : 0) + 1;
    if (nextLevel <= tech.maxLevel) {
      player.techLevels[tech.id] = nextLevel;
      applyTechEffect(player, tech.id, nextLevel);
      setStat(player, "lastResearchAtMs", entry.endTime);
      grantCommanderXp(player, "engineer", COMMANDER_XP.researchDone);
      notifications.push({
        kind: "research",
        title: "Recherche termin\xE9e",
        message: `${tech.nom} a atteint le niveau ${nextLevel}.`,
        createdAtMs: now,
        read: false
      });
    }
  }
  queues.activeResearches = stillActiveResearch;
  const stillActiveMissions = [];
  for (const entry of queues.activeMissions) {
    const mission = MISSIONS[entry.key];
    if (!mission) continue;
    if (entry.endTime > now) {
      stillActiveMissions.push(entry);
      continue;
    }
    const factor = missionRewardFactor(entry.endTime);
    const reward = Object.fromEntries(Object.entries(missionRewards(mission, player)).map(([k, v]) => [k, Math.round(v * factor)]));
    for (const [res, amount3] of Object.entries(reward)) {
      if (res === "xp") {
        applyXpDelta(player, amount3, now);
      } else {
        player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + amount3;
      }
    }
    recordContract(player, "missions", 1, now);
    grantCommanderXp(player, "steward", COMMANDER_XP.missionDone);
    addPassPoints(player, "mission", now);
    recordMission(player, contractDay(entry.endTime));
    notifications.push({
      kind: "mission",
      title: "Mission termin\xE9e",
      message: `${mission.name} : r\xE9compense obtenue${reward.xp ? ` (+${reward.xp} XP)` : ""}.`,
      createdAtMs: now,
      read: false
    });
  }
  queues.activeMissions = stillActiveMissions;
  const capsule = advanceSynthesis(player, now);
  if (capsule) {
    notifications.push({
      kind: "building",
      title: "Capsule pr\xEAte",
      message: `${CAPSULES[capsule.type].name} (niveau ${capsule.level}) rejoint la r\xE9serve du Labo de synth\xE8se.`,
      createdAtMs: now,
      read: false
    });
  }
  const newAchievements = checkNewAchievements(player);
  if (newAchievements.length > 0) {
    player.unlockedAchievements = [...(_c = player.unlockedAchievements) != null ? _c : [], ...newAchievements.map((a) => a.id)];
    let totalXp = 0;
    for (const a of newAchievements) {
      const reward = achievementReward(a, player);
      for (const [res, amount3] of Object.entries(reward)) player.resources[res] = ((_d = player.resources[res]) != null ? _d : 0) + amount3;
      if (a.rewardXp > 0) applyXpDelta(player, a.rewardXp, now);
      totalXp += a.rewardXp;
      if (a.title && !((_e = player.titles) != null ? _e : []).some((t) => t.label === a.title)) {
        player.titles = [...(_f = player.titles) != null ? _f : [], { label: a.title, seasonId: `achievement:${a.id}`, rank: 1 }];
      }
    }
    if (newAchievements.length > 3) {
      notifications.push({
        kind: "achievement",
        title: `${newAchievements.length} succ\xE8s d\xE9bloqu\xE9s !`,
        message: `${newAchievements.slice(0, 5).map((a) => `${a.emoji} ${a.name}`).join(", ")}${newAchievements.length > 5 ? "\u2026" : ""} (+${formatInt(totalXp)} XP). D\xE9tails sur la page Succ\xE8s.`,
        createdAtMs: now,
        read: false
      });
    } else {
      for (const a of newAchievements) {
        notifications.push({
          kind: "achievement",
          title: "Succ\xE8s d\xE9bloqu\xE9 !",
          message: `${a.emoji} ${a.name} \u2014 ${a.description}${a.rewardXp > 0 ? ` (+${a.rewardXp} XP${a.rewardHours > 0 ? `, ${a.rewardHours} h de production` : ""})` : ""}${a.title ? ` \xB7 titre \xAB ${a.title} \xBB` : ""}`,
          createdAtMs: now,
          read: false
        });
      }
    }
  }
  return { player, queues, notifications };
}
function applyTechEffect(player, techId, level3) {
  var _a, _b;
  const tech = TECHNOLOGIES.find((t) => t.id === techId);
  if (!tech) return;
  const levels = __spreadProps(__spreadValues({}, player.techLevels), { [techId]: level3 });
  for (const effect of techEffects(tech)) {
    switch (effect.type) {
      case "energy_efficiency":
        player.bonuses.energyEfficiency = techBonus(levels, "energy_efficiency");
        break;
      case "unit_defense":
        player.bonuses.unitDefenseBonus = techBonus(levels, "unit_defense");
        break;
      case "unit_attack":
        player.bonuses.unitAttackBonus = techBonus(levels, "unit_attack");
        break;
      case "building_discount":
        player.bonuses.buildingUpgradeDiscount = techBonus(levels, "building_discount");
        break;
      case "unlock_recipe":
        player.bonuses.unlockedRecipes = level3;
        break;
      case "unlock_hangars":
      case "unlock_buildings":
        for (const id of buildingsUnlockedByTech(techId, BUILDINGS)) {
          if (!BUILDINGS.some((b) => b.id === id)) continue;
          player.buildings[id] = { level: (_b = (_a = player.buildings[id]) == null ? void 0 : _a.level) != null ? _b : 1, unlocked: true };
        }
        break;
      case "unlock_next_level": {
        const unitId = effect.target || unitForTech(techId);
        if (!unitId) break;
        if (!player.units[unitId]) player.units[unitId] = { level: 0, count: 0 };
        player.units[unitId].level = level3;
        break;
      }
      default:
        break;
    }
  }
}

// src/game/seasons.ts
var SEASON_MONTHS = [
  "Janvier",
  "F\xE9vrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Ao\xFBt",
  "Septembre",
  "Octobre",
  "Novembre",
  "D\xE9cembre"
];
function currentSeasonId(now = Date.now()) {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function seasonLabel(seasonId) {
  var _a;
  const [year, month2] = seasonId.split("-").map(Number);
  return `${(_a = SEASON_MONTHS[(month2 != null ? month2 : 1) - 1]) != null ? _a : "?"} ${year != null ? year : ""}`.trim();
}
function ensureSeasonRollover(player, now) {
  var _a;
  const season = currentSeasonId(now);
  if (player.seasonId !== season) {
    if (player.seasonId) {
      player.lastSeasonId = player.seasonId;
      player.lastSeasonXp = (_a = player.seasonXp) != null ? _a : 0;
    }
    player.seasonId = season;
    player.seasonXp = 0;
  }
}
function applyXpDelta(player, delta, now) {
  var _a, _b;
  ensureSeasonRollover(player, now);
  player.xp = Math.max(0, ((_a = player.xp) != null ? _a : 0) + delta);
  player.seasonXp = Math.max(0, ((_b = player.seasonXp) != null ? _b : 0) + delta);
}
var SEASON_RULES = {
  tiers: [
    { maxRank: 1, hours: 24, rare: 500, title: "Champion" },
    { maxRank: 3, hours: 16, rare: 300, title: "Podium" },
    { maxRank: 10, hours: 8, rare: 150, title: "\xC9lite" }
  ],
  participationXp: 100,
  participationHours: 2,
  /** Première saison close automatiquement (les précédentes ne sont pas récompensées). */
  firstSeasonId: "2026-09"
};
function previousSeasonId(now = Date.now()) {
  const d = new Date(now);
  return currentSeasonId(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - 1);
}
function seasonXpFor(entry, seasonId) {
  var _a, _b;
  if (entry.seasonId === seasonId) return (_a = entry.seasonXp) != null ? _a : 0;
  if (entry.lastSeasonId === seasonId) return (_b = entry.lastSeasonXp) != null ? _b : 0;
  return 0;
}
function seasonStandings(entries, seasonId) {
  return entries.map((e3) => ({ e: e3, seasonXp: seasonXpFor(e3, seasonId) })).filter((x) => x.seasonXp > 0).sort((a, b) => {
    var _a, _b;
    return b.seasonXp - a.seasonXp || ((_a = b.e.xp) != null ? _a : 0) - ((_b = a.e.xp) != null ? _b : 0) || (a.e.pseudo < b.e.pseudo ? -1 : a.e.pseudo > b.e.pseudo ? 1 : 0);
  }).map((x, i) => {
    var _a;
    return { uid: x.e.uid, pseudo: x.e.pseudo, allianceId: (_a = x.e.allianceId) != null ? _a : "", rank: i + 1, seasonXp: x.seasonXp };
  });
}
function seasonRewardFor(rank2, seasonXp) {
  const tier = [...SEASON_RULES.tiers].sort((a, b) => a.maxRank - b.maxRank).find((t) => rank2 <= t.maxRank);
  if (tier) return { hours: tier.hours, rare: tier.rare, title: tier.title };
  if (seasonXp >= SEASON_RULES.participationXp) return { hours: SEASON_RULES.participationHours, rare: 0, title: "" };
  return null;
}
function performSeasonReward(playerIn, queuesIn, standing, reward, now, headline) {
  var _a, _b, _c;
  const flushed = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  const player = flushed.player;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const gained = {};
  for (const r of RESOURCE_LIST) {
    const amount3 = Math.floor(((_a = rates[r.id]) != null ? _a : 0) * reward.hours * 3600) + (r.rarity === "rare" ? reward.rare : 0);
    if (amount3 <= 0) continue;
    gained[r.id] = amount3;
    player.resources[r.id] = ((_b = player.resources[r.id]) != null ? _b : 0) + amount3;
  }
  let titleText = "";
  if (reward.title) {
    titleText = `${reward.title} de ${seasonLabel(standing.seasonId)}`;
    const title = { label: titleText, seasonId: standing.seasonId, rank: standing.rank };
    player.titles = [...((_c = player.titles) != null ? _c : []).filter((t) => t.label !== titleText), title];
    if (!player.activeTitle) player.activeTitle = titleText;
  }
  const total2 = Object.values(gained).reduce((a, b) => a + (b != null ? b : 0), 0);
  return {
    player,
    queues: flushed.queues,
    gained,
    notifications: [
      ...flushed.notifications,
      {
        kind: "season",
        title: headline != null ? headline : `Saison ${seasonLabel(standing.seasonId)} termin\xE9e : ${standing.rank}${standing.rank === 1 ? "er" : "e"} !`,
        message: `${formatInt(standing.seasonXp)} XP de saison. R\xE9compense : ${formatInt(total2)} ressources${titleText ? ` et le titre \xAB ${titleText} \xBB` : ""}.`,
        createdAtMs: now,
        read: false
      }
    ]
  };
}
function setActiveTitle(player, label3) {
  var _a;
  if (label3 && !((_a = player.titles) != null ? _a : []).some((t) => t.label === label3)) throw new GameActionError("Tu n'as pas gagn\xE9 ce titre.");
  player.activeTitle = label3;
}

// src/game/talents.ts
var TALENT_RULES = { pointsPerAscension: 3, maxRank: 3 };
var TALENTS = [
  { id: "rendement", branch: "economie", name: "Rendement imp\xE9rial", description: "Production de toutes les ressources.", effect: { kind: "productionAll" }, perRank: 0.02 },
  { id: "fonderies", branch: "economie", name: "Fonderies profondes", description: "Production de ferraille.", effect: { kind: "production", res: "scrap" }, perRank: 0.02 },
  { id: "reacteurs", branch: "economie", name: "R\xE9acteurs stabilis\xE9s", description: "Production d'\xE9nergie instable.", effect: { kind: "production", res: "energy" }, perRank: 0.02 },
  { id: "nanoforges", branch: "economie", name: "Nanoforges", description: "Production de nanocomposants.", effect: { kind: "production", res: "nano" }, perRank: 0.02 },
  { id: "archivistes", branch: "economie", name: "Archivistes", description: "Production de donn\xE9es anciennes.", effect: { kind: "production", res: "data" }, perRank: 0.02 },
  { id: "assaut", branch: "guerre", name: "Doctrine d'assaut", description: "Attaque de tes flottes.", effect: { kind: "attack" }, perRank: 0.02 },
  { id: "rempart", branch: "guerre", name: "Rempart", description: "D\xE9fense de tes unit\xE9s.", effect: { kind: "defense" }, perRank: 0.02 },
  { id: "ateliers", branch: "guerre", name: "Ateliers de campagne", description: "Vaisseaux r\xE9par\xE9s apr\xE8s un combat.", effect: { kind: "repair" }, perRank: 0.02 },
  { id: "sentinelles", branch: "guerre", name: "Sentinelles", description: "Chances de rep\xE9rer l'espionnage adverse.", effect: { kind: "detection" }, perRank: 0.02 },
  { id: "reseau", branch: "guerre", name: "R\xE9seau d'informateurs", description: "Niveau d'espionnage (+0,2 par rang).", effect: { kind: "spyLevel" }, perRank: 0.2 },
  { id: "chantiers", branch: "logistique", name: "Chantiers rapides", description: "Dur\xE9e de construction des b\xE2timents.", effect: { kind: "buildTime" }, perRank: 0.02 },
  { id: "laboratoires", branch: "logistique", name: "Laboratoires", description: "Dur\xE9e des recherches.", effect: { kind: "researchTime" }, perRank: 0.02 },
  { id: "entrepots", branch: "logistique", name: "Entrep\xF4ts \xE9tendus", description: "Capacit\xE9 des entrep\xF4ts.", effect: { kind: "storage" }, perRank: 0.02 },
  { id: "soutes", branch: "logistique", name: "Soutes renforc\xE9es", description: "Capacit\xE9 de transport des flottes.", effect: { kind: "cargo" }, perRank: 0.02 },
  { id: "intendance", branch: "logistique", name: "Intendance", description: "Production de toutes les ressources (logistique).", effect: { kind: "productionAll" }, perRank: 0.02 }
];
function talentState(player) {
  var _a, _b;
  const raw = (_a = player.talents) != null ? _a : {};
  const ranks = {};
  for (const t of TALENTS) {
    const r = Math.floor(Number((_b = raw.ranks) == null ? void 0 : _b[t.id]) || 0);
    if (r > 0) ranks[t.id] = Math.min(TALENT_RULES.maxRank, r);
  }
  return { ranks, resetSeasonId: raw.resetSeasonId };
}
function talentPoints(player) {
  var _a;
  const total2 = Math.max(0, Math.floor((_a = player.ascensions) != null ? _a : 0)) * TALENT_RULES.pointsPerAscension;
  const spent = Object.values(talentState(player).ranks).reduce((a, b) => a + b, 0);
  return { total: total2, spent, free: Math.max(0, total2 - spent) };
}
function learnTalent(player, talentId) {
  var _a, _b;
  const def3 = TALENTS.find((t) => t.id === talentId);
  if (!def3) throw new GameActionError("Talent inconnu.");
  const st = talentState(player);
  if (((_a = st.ranks[def3.id]) != null ? _a : 0) >= TALENT_RULES.maxRank) throw new GameActionError("Ce talent est d\xE9j\xE0 au rang maximum.");
  if (talentPoints(player).free <= 0) throw new GameActionError("Aucun point de talent disponible : chaque Ascension en donne 3.");
  st.ranks[def3.id] = ((_b = st.ranks[def3.id]) != null ? _b : 0) + 1;
  player.talents = st;
  return st;
}
function resetTalents(player, now) {
  const st = talentState(player);
  const season = currentSeasonId(now);
  if (st.resetSeasonId === season) throw new GameActionError("Tu as d\xE9j\xE0 redistribu\xE9 tes talents cette saison.");
  if (Object.keys(st.ranks).length === 0) throw new GameActionError("Aucun talent \xE0 redistribuer.");
  const next = { ranks: {}, resetSeasonId: season };
  player.talents = next;
  return next;
}
function talentBonuses(player) {
  const st = talentState(player);
  return TALENTS.filter((t) => {
    var _a;
    return ((_a = st.ranks[t.id]) != null ? _a : 0) > 0;
  }).map((def3) => {
    var _a;
    return { def: def3, value: def3.perRank * ((_a = st.ranks[def3.id]) != null ? _a : 0) };
  });
}

// src/game/modifiers.ts
function emptyModifiers() {
  return { attack: 0, defense: 0, buildTime: 0, researchTime: 0, productionAll: 0, production: {}, storage: 0, spyLevel: 0, detection: 0, repair: 0, cargo: 0, bossDamage: 0 };
}
function playerModifiers(player) {
  var _a, _b, _c;
  const m = emptyModifiers();
  if (!player) return m;
  const lv = activeLevels(player);
  m.attack += lv.admiral * 0.01;
  m.defense += lv.strategist * 0.01;
  m.buildTime += lv.engineer * 0.01;
  m.researchTime += lv.engineer * 0.01;
  m.spyLevel += lv.spy * 0.2;
  m.detection += lv.spy * 0.01;
  m.productionAll += lv.steward * 0.01;
  m.productionAll += territoryBonus(player.territory, Date.now());
  m.storage += lv.steward * 0.02;
  for (const item of equippedRelics(player)) {
    const effect = (_a = findTemplate(item.template)) == null ? void 0 : _a.effect;
    const b = relicBonus(item);
    if (effect === "attack") m.attack += b;
    else if (effect === "defense") m.defense += b;
    else if (effect === "build_time") m.buildTime += b;
    else if (effect === "research_time") m.researchTime += b;
    else if (effect === "repair") m.repair += b;
    else if (effect === "cargo") m.cargo += b;
    else if (effect === "spy") m.spyLevel += b * 10;
    else if (effect === "production_all") m.productionAll += b;
    else if (effect === "boss_damage") m.bossDamage += b;
    else if (effect && PRODUCTION_EFFECT[effect]) {
      const res = PRODUCTION_EFFECT[effect];
      m.production[res] = ((_b = m.production[res]) != null ? _b : 0) + b;
    }
  }
  for (const { def: def3, value } of talentBonuses(player)) {
    const e3 = def3.effect;
    if (e3.kind === "production") m.production[e3.res] = ((_c = m.production[e3.res]) != null ? _c : 0) + value;
    else m[e3.kind] += value;
  }
  m.buildTime = Math.min(0.5, m.buildTime);
  m.researchTime = Math.min(0.5, m.researchTime);
  return m;
}
function withRepairBonus(base, player) {
  return Math.min(0.95, base + playerModifiers(player).repair);
}
function playerCargoCapacity(player, fleet) {
  return Math.floor(fleetCargoCapacity(player.units, fleet, player.techLevels) * (1 + playerModifiers(player).cargo));
}

// src/game/bounties.ts
var BOUNTY_RULES = {
  dailyLimit: 4,
  refreshHours: 8,
  /** Un échec laisse la prime ouverte une fois de plus. */
  retries: 1,
  /** +10 % d'Ambre par rang au-delà du premier. */
  amberPerRank: 0.1,
  tiers: {
    1: { label: "Traque", pct: 0.5, minMinutes: 20, maxMinutes: 40, xp: 60, amber: 10, rep: 1, floor: 200, minRank: 1 },
    2: { label: "Chasse", pct: 0.8, minMinutes: 40, maxMinutes: 60, xp: 120, amber: 25, rep: 2, floor: 500, minRank: 1 },
    3: { label: "Proie majeure", pct: 1.1, minMinutes: 60, maxMinutes: 90, xp: 250, amber: 60, rep: 4, floor: 1200, minRank: 3 },
    4: { label: "\xC9lite", pct: 1.25, minMinutes: 75, maxMinutes: 90, xp: 400, amber: 120, rep: 6, floor: 3e3, minRank: 5 }
  },
  ranks: [
    { name: "Larve", at: 0 },
    { name: "\xC9claireur", at: 10 },
    { name: "Traqueur", at: 30 },
    { name: "Lame de l'Essaim", at: 70 },
    { name: "Main de la Reine", at: 150 }
  ],
  exchange: { rarePerAmber: 40, weeklyCap: 100 }
};
var KESH = {
  name: "Kesh'Vaar",
  full: "L'Essaim de la Traque",
  leader: "Vashka, Matriarche-Chasseuse",
  currency: "Ambre de Ruche",
  art: "/assets/bounties/vashka.webp",
  hunters: "/assets/bounties/hunters.webp",
  banner: "/assets/bounties/banner.webp",
  emblem: "/assets/bounties/emblem.webp",
  amberIcon: "/assets/bounties/amber.webp",
  story: "Il y a trois cycles, les pirates de la Confr\xE9rie et les traqueurs du Syndicat Gravhorn ont pill\xE9 la Ruche-M\xE8re de Kesh. La Reine est tomb\xE9e, ses \u0153ufs ont \xE9t\xE9 vendus aux quatre coins du secteur.\n\nLes survivants ont pr\xEAt\xE9 le Serment de la Traque : chaque coupable sera retrouv\xE9. Mais l'Essaim est trop affaibli pour chasser seul. Il engage les commandants humains et les paie en Ambre de Ruche, la r\xE9sine sacr\xE9e qui ne se fabrique ni ne s'ach\xE8te.\n\nVashka, Matriarche-Chasseuse, tient le tableau des primes. Plus tu rapportes de proies, plus l'Essaim t'\xE9l\xE8ve dans sa hi\xE9rarchie."
};
var FUGITIVES = [
  { name: "Korr le Rouilleux", factionId: "varan", crime: "a vendu les coordonn\xE9es de la Ruche-M\xE8re \xE0 la Confr\xE9rie" },
  { name: "Mira Tessane", factionId: "varan", crime: "a trac\xE9 la route du pillage \xE0 travers les n\xE9buleuses" },
  { name: "Le Borgne Halvik", factionId: "varan", crime: "a revendu trois \u0153ufs royaux \xE0 des collectionneurs" },
  { name: "Drest Oumane", factionId: "varan", crime: "a ouvert le feu sur les nourrices de la Ruche" },
  { name: "Vrask Deux-Cornes", factionId: "gravhorn", crime: "expose des larves comme troph\xE9es de chasse" },
  { name: "Ulla la Muette", factionId: "gravhorn", crime: "a pi\xE9g\xE9 l'escorte de la Reine" },
  { name: "Thokk Sang-Gris", factionId: "gravhorn", crime: "a bris\xE9 les sceaux d'ambre du sanctuaire" },
  { name: "Brenna Kesh-Tueuse", factionId: "gravhorn", crime: "porte un collier d'antennes kesh'vaar" },
  { name: "Fr\xE8re Anselme Dor", factionId: "inquisition", crime: "a br\xFBl\xE9 les archives chant\xE9es de la Ruche" },
  { name: "S\u0153ur Ilvane", factionId: "inquisition", crime: "diss\xE8que des \u0153ufs pour l'Aube Blanche" },
  { name: "Le Diacre Morrow", factionId: "inquisition", crime: "a d\xE9clar\xE9 l'Essaim \xAB h\xE9r\xE9sie vivante \xBB" },
  { name: "Inquisitrice Talas", factionId: "inquisition", crime: "a scell\xE9 une couv\xE9e dans un reliquaire" },
  { name: "Rico Vant", factionId: "cartel", crime: "vend des \u0153ufs au march\xE9 noir de N\xE9on" },
  { name: "Lady Sabre", factionId: "cartel", crime: "a fait fondre de l'Ambre sacr\xE9e en bijoux" },
  { name: "Doc Ferro", factionId: "cartel", crime: "distille un stimulant \xE0 partir de gel\xE9e royale" },
  { name: "Les Jumeaux Kalis", factionId: "cartel", crime: "blanchissent les gains du pillage" },
  { name: "Grenn Croc-Noir", factionId: "meute", crime: "collectionne les mandibules des guerri\xE8res" },
  { name: "Skarra", factionId: "meute", crime: "a d\xE9vor\xE9 un nid entier d'\xE9claireurs" },
  { name: "Vieux Loup Odrik", factionId: "meute", crime: "a guid\xE9 la Meute jusqu'aux couvoirs" },
  { name: "Fenra \u0152il-Rouge", factionId: "meute", crime: "chasse les ouvri\xE8res pour le sport" },
  { name: "L'\xC9cho Vashtar", factionId: "choeur", crime: "a r\xE9duit au silence le chant de la Reine" },
  { name: "Ma\xEEtre-Chantre Ilos", factionId: "choeur", crime: "garde un \u0153uf royal dans sa cath\xE9drale" }
];
var ELITE_FUGITIVES = [
  { name: "Sarghul Vex, le Marchand d'\u0152ufs", factionId: "cartel", crime: "a vendu la couv\xE9e royale au plus offrant" },
  { name: "Ka\xEFra Voss, la Briseuse de Ruche", factionId: "varan", crime: "a command\xE9 l'assaut sur la Ruche-M\xE8re" },
  { name: "L'Archiviste P\xE2le", factionId: "inquisition", crime: "d\xE9tient le dernier \u0153uf de la Reine" },
  { name: "Moloch-7", factionId: "meute", crime: "a d\xE9vor\xE9 trois nids en une nuit" },
  { name: "Capitaine Draven Hale", factionId: "gravhorn", crime: "a escort\xE9 la cargaison vol\xE9e hors du secteur" },
  { name: "La Veuve d'Ambre", factionId: "choeur", crime: "fait commerce d'Ambre sacr\xE9e vol\xE9e" }
];
function emptyBountyState() {
  return {
    amber: 0,
    amberEarned: 0,
    reputation: 0,
    board: [],
    slot: -1,
    day: "",
    doneToday: 0,
    completed: 0,
    failed: 0,
    exchangeWeek: "",
    exchanged: 0,
    boostUntilMs: 0,
    jammers: 0,
    beacons: 0,
    shieldUntilMs: 0,
    shieldBoughtAtMs: 0,
    owned: []
  };
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function bountyState(player) {
  var _a;
  const raw = (_a = player.bounties) != null ? _a : {};
  const base = emptyBountyState();
  return __spreadProps(__spreadValues(__spreadValues({}, base), raw), {
    amber: Math.max(0, num(raw.amber)),
    amberEarned: num(raw.amberEarned),
    reputation: num(raw.reputation),
    board: Array.isArray(raw.board) ? raw.board.filter((c) => c && BOUNTY_RULES.tiers[c.tier]) : [],
    slot: raw.slot === void 0 ? -1 : num(raw.slot),
    doneToday: num(raw.doneToday),
    owned: Array.isArray(raw.owned) ? raw.owned.map(String) : []
  });
}
function bountyRank(reputation) {
  let rank2 = 1;
  BOUNTY_RULES.ranks.forEach((r, i) => {
    if (reputation >= r.at) rank2 = i + 1;
  });
  return rank2;
}
function rankName(rank2) {
  return BOUNTY_RULES.ranks[Math.max(0, Math.min(BOUNTY_RULES.ranks.length - 1, rank2 - 1))].name;
}
function amberFor(tier, rank2) {
  return Math.round(BOUNTY_RULES.tiers[tier].amber * (1 + BOUNTY_RULES.amberPerRank * (rank2 - 1)));
}
var HOUR4 = 36e5;
var DAY4 = 24 * HOUR4;
function boardSlot(now) {
  return Math.floor(now / (BOUNTY_RULES.refreshHours * HOUR4));
}
function boardTiers(rank2) {
  if (rank2 >= BOUNTY_RULES.tiers[4].minRank) return [1, 2, 3, 4];
  if (rank2 >= BOUNTY_RULES.tiers[3].minRank) return [1, 2, 3];
  return [1, 2, 2];
}
function generateBoard(uid, slot, rank2, exclude = []) {
  const rand = seededRandom(`${uid}:bounty:${slot}`);
  const used = new Set(exclude);
  return boardTiers(rank2).map((tier, i) => {
    let fugitive = Math.floor(rand() * FUGITIVES.length);
    for (let guard = 0; used.has(fugitive) && guard < FUGITIVES.length; guard++) fugitive = (fugitive + 1) % FUGITIVES.length;
    used.add(fugitive);
    const t = BOUNTY_RULES.tiers[tier];
    const minutes = t.minMinutes + Math.round(rand() * (t.maxMinutes - t.minMinutes));
    return { id: `${slot}-${i}`, tier, fugitive, minutes, status: "open", tries: 0 };
  });
}
function refreshBounties(st, uid, now) {
  const day = contractDay(now);
  if (st.day !== day) {
    st.day = day;
    st.doneToday = 0;
  }
  const slot = boardSlot(now);
  if (st.slot !== slot) {
    const hunting = st.board.filter((c) => c.status === "hunting");
    st.board = [...hunting, ...generateBoard(uid, slot, bountyRank(st.reputation), hunting.map((c) => c.fugitive))];
    st.slot = slot;
  }
  return st;
}
function hunterPower(player) {
  var _a, _b;
  return computeFullPower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]);
}
function fugitivePower(tier, player) {
  const t = BOUNTY_RULES.tiers[tier];
  return Math.round(Math.max(t.floor, hunterPower(player) * t.pct));
}
function bountyTarget(contract) {
  return `bounty_${contract.id}`;
}
function startBounty(player, contractId, now) {
  var _a;
  const st = refreshBounties(bountyState(player), player.uid, now);
  const contract = st.board.find((c) => c.id === contractId);
  if (!contract) throw new GameActionError("Ce contrat n'est plus au tableau.");
  if (contract.status !== "open") throw new GameActionError("Une flotte traque d\xE9j\xE0 ce fugitif.");
  if (st.doneToday >= BOUNTY_RULES.dailyLimit) throw new GameActionError(`${BOUNTY_RULES.dailyLimit} primes par jour : l'Essaim te recontactera demain.`);
  if (bountyRank(st.reputation) < BOUNTY_RULES.tiers[contract.tier].minRank) throw new GameActionError("Ton rang dans l'Essaim est trop bas pour cette prime.");
  const power = fugitivePower(contract.tier, player);
  contract.status = "hunting";
  st.doneToday += 1;
  player.bounties = st;
  return { contract, power, fugitive: (_a = FUGITIVES[contract.fugitive]) != null ? _a : FUGITIVES[0] };
}
function resolveBountyHunt(playerIn, queuesIn, contractId, fleet, power, now, formation) {
  var _a, _b, _c, _d, _e, _f;
  const flushed = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  const player = flushed.player;
  const st = refreshBounties(bountyState(player), player.uid, now);
  const contract = st.board.find((c) => c.id === contractId);
  const tier = (_a = contract == null ? void 0 : contract.tier) != null ? _a : 1;
  const fugitive = (_c = FUGITIVES[(_b = contract == null ? void 0 : contract.fugitive) != null ? _b : 0]) != null ? _c : FUGITIVES[0];
  const fx = formationEffects(formation);
  const combat = resolveCombat(__spreadProps(__spreadValues({}, fx), {
    attackFactor: fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: power
  }));
  const survivors = {};
  for (const [id, qty] of Object.entries(fleet)) survivors[id] = Math.max(0, qty - ((_d = combat.attackerLosses[id]) != null ? _d : 0));
  const notifications = [...flushed.notifications];
  const success = combat.outcome === "attacker_win";
  const t = BOUNTY_RULES.tiers[tier];
  let amber = 0;
  let xp = 0;
  if (success) {
    const rankBefore = bountyRank(st.reputation);
    amber = amberFor(tier, rankBefore);
    xp = t.xp;
    st.amber += amber;
    st.amberEarned += amber;
    st.reputation += t.rep;
    st.completed += 1;
    st.board = st.board.filter((c) => c.id !== contractId);
    applyXpDelta(player, xp, now);
    bumpStat(player, "bounties");
    grantCommanderXp(player, "admiral", COMMANDER_XP.bountyWin);
    addPassPoints(player, "bounty", now);
    player.victories = ((_e = player.victories) != null ? _e : 0) + 1;
    notifications.push(note3(`${fugitive.name} captur\xE9 !`, `Prime \xAB ${t.label} \xBB remplie : +${xp} XP et ${amber} Ambre de Ruche.`, now));
    const rankAfter = bountyRank(st.reputation);
    if (rankAfter > rankBefore) {
      notifications.push(note3(`Nouveau rang : ${rankName(rankAfter)}`, rankUpMessage(rankAfter), now));
    }
  } else {
    st.failed += 1;
    player.defeats = ((_f = player.defeats) != null ? _f : 0) + 1;
    if (contract) {
      contract.tries += 1;
      if (contract.tries > BOUNTY_RULES.retries) st.board = st.board.filter((c) => c.id !== contractId);
      else contract.status = "open";
    }
    const retry = !!contract && contract.tries <= BOUNTY_RULES.retries;
    notifications.push(note3(`${fugitive.name} s'est \xE9chapp\xE9`, `Ta flotte n'a pas pu le ma\xEEtriser.${retry ? " La prime reste ouverte une derni\xE8re fois." : " Le contrat est perdu."}`, now));
  }
  player.bounties = st;
  const report = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: `bounty_${contractId}`,
    defenderPseudo: fugitive.name,
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
    attackerXpDelta: xp,
    defenderXpDelta: 0,
    attackerFleet: fleet
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications, success, amber, xp };
}
function releaseBounty(player, contractId) {
  const st = bountyState(player);
  const contract = st.board.find((c) => c.id === contractId);
  if (contract && contract.status === "hunting") contract.status = "open";
  player.bounties = st;
}
function rankUpMessage(rank2) {
  if (rank2 === BOUNTY_RULES.tiers[3].minRank) return "L'Essaim te confie d\xE9sormais les proies majeures (\u2605\u2605\u2605).";
  if (rank2 === BOUNTY_RULES.tiers[4].minRank) return "La Reine elle-m\xEAme te reconna\xEEt : les primes d'\xE9lite (\u2605\u2605\u2605\u2605) te sont ouvertes.";
  return `L'Essaim te verse ${Math.round(BOUNTY_RULES.amberPerRank * (rank2 - 1) * 100)} % d'Ambre en plus par prime.`;
}
function note3(title, message, now) {
  return { kind: "bounty", title, message, createdAtMs: now, read: false, link: "/game/primes" };
}
var BOUNTY_SHOP_RULES = {
  acceleratorMinutes: 60,
  boostPct: KESH_BOOST_PCT,
  boostHours: 24,
  maxCharges: 3,
  shieldHours: 6,
  shieldCooldownDays: 7,
  title: "Chasseur de l'Essaim"
};
var SHOP_ITEMS = [
  { id: "accelerator", name: "Acc\xE9l\xE9rateur de chantier", price: 30, group: "consumable", description: "Une construction de b\xE2timent en cours se termine 1 h plus t\xF4t." },
  { id: "boost", name: "Gel\xE9e de la Reine", price: 80, group: "consumable", description: "Production +20 % pendant 24 h (cumulable dans le temps)." },
  { id: "jammer", name: "Brouilleur d'essaim", price: 50, group: "consumable", description: "Le prochain espionnage re\xE7u \xE9choue : les sondes rentrent sans rapport. 3 en r\xE9serve au plus." },
  { id: "beacon", name: "Balise de repli", price: 60, group: "consumable", description: "Ram\xE8ne aussit\xF4t une flotte en vol \xE0 la base, avec sa cargaison. 3 en r\xE9serve au plus." },
  { id: "shield", name: "Voile de chitine", price: 150, group: "consumable", description: "Bouclier de 6 h contre les attaques de joueurs. Une fois par semaine ; attaquer le l\xE8ve." },
  { id: "dossier", name: "Dossier d'entra\xEEnement", price: 40, group: "consumable", description: "+200 XP pour l'officier de ton choix, m\xEAme hors poste (page Commandants)." },
  { id: "blueprint", name: "Plan du Traqueur Kesh", price: 600, group: "unit", description: "D\xE9bloque le Traqueur Kesh au chantier : rapide, +50 % d'attaque contre tous les PNJ (seigneurs, menaces, primes, boss, L\xE9viathan)." },
  { id: "title", name: "Titre \xAB Chasseur de l'Essaim \xBB", price: 120, group: "cosmetic", description: "Un titre \xE0 afficher \xE0 c\xF4t\xE9 de ton nom." },
  { id: "frame", name: "Cadre de chitine", price: 200, group: "cosmetic", description: "Cadre ambr\xE9 autour de ta fiche publique." },
  { id: "emblem", name: "Embl\xE8me de l'Essaim", price: 150, group: "cosmetic", description: "L'embl\xE8me kesh'vaar sur ta fiche publique." },
  { id: "emojis", name: "Emojis Kesh'Vaar", price: 80, group: "cosmetic", description: "4 emojis exclusifs pour les discussions." }
];
function findShopItem(id) {
  return SHOP_ITEMS.find((i) => i.id === id);
}
var ONE_TIME = ["blueprint", "title", "frame", "emblem", "emojis"];
function owns(st, id) {
  return st.owned.includes(id);
}
function shopBlocker(player, item, now, queues) {
  var _a;
  const st = bountyState(player);
  if (ONE_TIME.includes(item.id) && owns(st, item.id)) return "D\xE9j\xE0 acquis.";
  if (item.id === "jammer" && st.jammers >= BOUNTY_SHOP_RULES.maxCharges || item.id === "beacon" && st.beacons >= BOUNTY_SHOP_RULES.maxCharges) {
    return `${BOUNTY_SHOP_RULES.maxCharges} en r\xE9serve au plus.`;
  }
  if (item.id === "shield") {
    const ready = st.shieldBoughtAtMs + BOUNTY_SHOP_RULES.shieldCooldownDays * DAY4;
    if (st.shieldBoughtAtMs && now < ready) return `Disponible \xE0 nouveau dans ${Math.ceil((ready - now) / DAY4)} j.`;
  }
  if (item.id === "accelerator" && queues && !Object.values((_a = queues.buildingUpgrades) != null ? _a : {}).some((u) => u && u.endTime > now)) return "Aucune construction en cours.";
  if (st.amber < item.price) return "Pas assez d'Ambre.";
  return null;
}
function buyShopItem(player, queues, itemId, now, buildingId) {
  var _a, _b, _c, _d, _e, _f;
  const item = findShopItem(itemId);
  if (!item) throw new GameActionError("Objet inconnu.");
  const blocker = shopBlocker(player, item, now, queues);
  if (blocker) throw new GameActionError(blocker);
  const st = bountyState(player);
  let message = `${item.name} : acquis.`;
  switch (item.id) {
    case "accelerator": {
      const entries = Object.entries((_a = queues.buildingUpgrades) != null ? _a : {}).filter(([, u]) => u && u.endTime > now);
      const chosen = (_b = entries.find(([id]) => id === buildingId)) != null ? _b : entries.sort((a, b) => a[1].endTime - b[1].endTime)[0];
      const entry = chosen[1];
      entry.endTime = Math.max(now, entry.endTime - BOUNTY_SHOP_RULES.acceleratorMinutes * 6e4);
      message = "Chantier acc\xE9l\xE9r\xE9 d'une heure.";
      break;
    }
    case "boost":
      st.boostUntilMs = Math.max(now, st.boostUntilMs) + BOUNTY_SHOP_RULES.boostHours * HOUR4;
      message = "Gel\xE9e de la Reine : production +20 % pendant 24 h.";
      break;
    case "jammer":
      st.jammers += 1;
      message = "Brouilleur en place : le prochain espionnage \xE9chouera.";
      break;
    case "beacon":
      st.beacons += 1;
      message = "Balise de repli pr\xEAte : utilise-la depuis une flotte en vol.";
      break;
    case "shield":
      st.shieldUntilMs = now + BOUNTY_SHOP_RULES.shieldHours * HOUR4;
      st.shieldBoughtAtMs = now;
      message = "Voile de chitine actif pendant 6 h.";
      break;
    case "dossier":
      addDossiers(player, 1);
      message = "Dossier d'entra\xEEnement rang\xE9 : remets-le \xE0 un officier depuis la page Commandants.";
      break;
    case "blueprint":
      player.units[KESH_HUNTER_UNIT.id] = { level: 1, count: (_d = (_c = player.units[KESH_HUNTER_UNIT.id]) == null ? void 0 : _c.count) != null ? _d : 0 };
      message = "Plan du Traqueur Kesh re\xE7u : le vaisseau est disponible au chantier.";
      break;
    case "title":
      if (!((_e = player.titles) != null ? _e : []).some((t) => t.label === BOUNTY_SHOP_RULES.title)) {
        player.titles = [...(_f = player.titles) != null ? _f : [], { label: BOUNTY_SHOP_RULES.title, seasonId: "kesh", rank: 1 }];
      }
      player.activeTitle = BOUNTY_SHOP_RULES.title;
      break;
  }
  if (ONE_TIME.includes(item.id)) st.owned = [...st.owned, item.id];
  st.amber -= item.price;
  player.bounties = st;
  return { message };
}
function weekId(now) {
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY4) * DAY4;
  return new Date(midnight - (day + 6) % 7 * DAY4).toISOString().slice(0, 10);
}
function exchangeAmber(player, amountIn, now) {
  var _a;
  const amount3 = Math.floor(Number(amountIn));
  if (!(amount3 > 0)) throw new GameActionError("Quantit\xE9 invalide.");
  const st = bountyState(player);
  const week = weekId(now);
  if (st.exchangeWeek !== week) {
    st.exchangeWeek = week;
    st.exchanged = 0;
  }
  if (amount3 > BOUNTY_RULES.exchange.weeklyCap - st.exchanged) throw new GameActionError(`Plafond : ${BOUNTY_RULES.exchange.weeklyCap} Ambre \xE9chang\xE9s par semaine.`);
  if (amount3 > st.amber) throw new GameActionError("Pas assez d'Ambre.");
  const gain = {};
  for (const r of RESOURCE_LIST) {
    if (r.rarity !== "rare") continue;
    gain[r.id] = amount3 * BOUNTY_RULES.exchange.rarePerAmber;
    player.resources[r.id] = ((_a = player.resources[r.id]) != null ? _a : 0) + gain[r.id];
  }
  st.amber -= amount3;
  st.exchanged += amount3;
  player.bounties = st;
  return gain;
}
function shieldUntil(player) {
  var _a;
  return num((_a = player.bounties) == null ? void 0 : _a.shieldUntilMs);
}
function dropShield(player, now) {
  const st = bountyState(player);
  if (st.shieldUntilMs > now) {
    st.shieldUntilMs = now;
    player.bounties = st;
  }
}
function consumeJammer(player) {
  const st = bountyState(player);
  if (st.jammers <= 0) return false;
  st.jammers -= 1;
  player.bounties = st;
  return true;
}
function consumeBeacon(player) {
  const st = bountyState(player);
  if (st.beacons <= 0) throw new GameActionError("Aucune balise de repli : ach\xE8te-en au Comptoir de la Ruche.");
  st.beacons -= 1;
  player.bounties = st;
}
var KESH_EMOJIS = [
  { code: "kesh_gg", url: "/assets/bounties/emoji-gg.webp" },
  { code: "kesh_ok", url: "/assets/bounties/emoji-ok.webp" },
  { code: "kesh_joie", url: "/assets/bounties/emoji-joie.webp" },
  { code: "kesh_top", url: "/assets/bounties/emoji-top.webp" }
];
function assertKeshEmojis(player, text) {
  if (!/:kesh_[a-z]+:/.test(text)) return;
  if (KESH_EMOJIS.some((e3) => text.includes(`:${e3.code}:`)) && !owns(bountyState(player), "emojis")) {
    throw new GameActionError("Les emojis Kesh'Vaar s'obtiennent au Comptoir de la Ruche.");
  }
}
var ELITE_KEY = "bounty_elite";
var ELITE_RULES = {
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs. */
  hpFactor: 1,
  minHp: 5e4,
  /** Un assaut toutes les N heures par joueur. */
  cooldownHours: 12,
  flightMinutes: 45,
  lossPct: 0.1,
  /** Rang minimal dans l'Essaim. */
  minRank: 2,
  /** Part minimale des points de structure pour être récompensé. */
  minShare: 5e-3,
  killed: { xp: 300, amber: 150, rep: 8 },
  failed: { xp: 100, amber: 50, rep: 3 }
};
function eliteWindow(now) {
  const id = weekId(now);
  const startMs = Date.parse(`${id}T00:00:00Z`);
  return { id: `elite-${id}`, startMs, endMs: startMs + 7 * DAY4 };
}
function normalizeElite(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (!r.id || !(num(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    fugitive: num(r.fugitive),
    startMs: num(r.startMs),
    endMs: num(r.endMs),
    maxHp: num(r.maxHp),
    hp: num(r.hp),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    endedAtMs: num(r.endedAtMs),
    rewarded: !!r.rewarded,
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {}
  };
}
function spawnElite(now, activePlayers) {
  const w = eliteWindow(now);
  let h = 0;
  for (const c of w.id) h = h * 31 + c.charCodeAt(0) >>> 0;
  const total2 = activePlayers.reduce((sum3, p) => sum3 + hunterPower(p), 0);
  const maxHp = Math.round(Math.max(ELITE_RULES.minHp, total2 * ELITE_RULES.hpFactor));
  return { id: w.id, fugitive: h % ELITE_FUGITIVES.length, startMs: w.startMs, endMs: w.endMs, maxHp, hp: maxHp, status: "active", endedAtMs: 0, rewarded: false, contributions: {} };
}
function eliteActive(state, now) {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs && state.hp > 0;
}
function eliteReadyAt(state, uid) {
  var _a, _b;
  const last = (_b = (_a = state == null ? void 0 : state.contributions[uid]) == null ? void 0 : _a.lastLaunchMs) != null ? _b : 0;
  return last ? last + ELITE_RULES.cooldownHours * HOUR4 : 0;
}
function checkEliteLaunch(state, player, now) {
  var _a;
  if (!state || !eliteActive(state, now)) throw new GameActionError("Aucune proie d'\xE9lite \xE0 traquer en ce moment.");
  if (bountyRank(bountyState(player).reputation) < ELITE_RULES.minRank) throw new GameActionError(`Il faut le rang ${rankName(ELITE_RULES.minRank)} dans l'Essaim pour traquer la proie d'\xE9lite.`);
  const ready = eliteReadyAt(state, player.uid);
  if (ready > now) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil((ready - now) / 6e4)} min.`);
  const c = (_a = state.contributions[player.uid]) != null ? _a : { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: 0 };
  return __spreadProps(__spreadValues({}, state), { contributions: __spreadProps(__spreadValues({}, state.contributions), { [player.uid]: __spreadProps(__spreadValues({}, c), { pseudo: player.pseudo, lastLaunchMs: now }) }) });
}
function resolveEliteAssault(state, player, fleet, formation, now) {
  var _a;
  const fx = formationEffects(formation);
  const power = Math.round(
    computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack) * (1 + playerModifiers(player).bossDamage)
  );
  const active = eliteActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = withRepairBonus(getRepairPercent(player.buildings), player);
  const lossPct = Math.min(1, ELITE_RULES.lossPct * fx.attackerLossFactor);
  const survivors = {};
  const lost = {};
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const gone = raw - Math.floor(raw * repair);
    if (gone > 0) lost[id] = gone;
    survivors[id] = qty - gone;
  }
  const c = (_a = state.contributions[player.uid]) != null ? _a : { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: now };
  const hp = state.hp - damage;
  const killed = active && hp <= 0;
  return {
    state: __spreadProps(__spreadValues({}, state), {
      hp: Math.max(0, hp),
      status: killed ? "killed" : state.status,
      endedAtMs: killed ? now : state.endedAtMs,
      contributions: active ? __spreadProps(__spreadValues({}, state.contributions), { [player.uid]: __spreadProps(__spreadValues({}, c), { pseudo: player.pseudo, damage: c.damage + damage, assaults: c.assaults + 1 }) }) : state.contributions
    }),
    damage,
    survivors,
    lost,
    killed
  };
}
function closeElite(state, now) {
  if (state.status === "active" && now >= state.endMs) return __spreadProps(__spreadValues({}, state), { status: "failed", endedAtMs: now });
  return state;
}
function eliteRanking(state) {
  return Object.entries(state.contributions).filter(([, c]) => c.damage > 0).map(([uid, c]) => ({ uid, pseudo: c.pseudo, damage: c.damage, assaults: c.assaults })).sort((a, b) => b.damage - a.damage);
}
function eliteRewardees(state) {
  if (state.status === "active") return [];
  return eliteRanking(state).filter((c) => c.damage >= state.maxHp * ELITE_RULES.minShare).map((c) => c.uid);
}
function grantEliteReward(state, player, now, random = Math.random) {
  if (!eliteRewardees(state).includes(player.uid)) return { xp: 0, amber: 0 };
  const r = state.status === "killed" ? ELITE_RULES.killed : ELITE_RULES.failed;
  const st = bountyState(player);
  st.amber += r.amber;
  st.amberEarned += r.amber;
  st.reputation += r.rep;
  player.bounties = st;
  applyXpDelta(player, r.xp, now);
  if (state.status === "killed") {
    const item = rollRelic("elite", now, random, "rare");
    if (addRelic(player, item)) return { xp: r.xp, amber: r.amber, relic: relicLabel(item) };
  }
  return { xp: r.xp, amber: r.amber };
}
function describeElite(state) {
  return ELITE_FUGITIVES[state.fugitive % ELITE_FUGITIVES.length];
}
function eliteNotice(state, reward, now) {
  const f = describeElite(state);
  return note3(
    state.status === "killed" ? `${f.name} est tomb\xE9` : `${f.name} s'est enfui`,
    reward.amber > 0 ? `Ta part de la traque : +${formatInt(reward.xp)} XP et ${reward.amber} Ambre de Ruche.${reward.relic ? ` Relique : ${reward.relic} !` : ""}` : "Ta part des d\xE9g\xE2ts \xE9tait trop faible pour une r\xE9compense.",
    now
  );
}

// src/game/seasonPass.ts
var PASS_RULES = { tiers: 30, pointsPerTier: 40 };
var PASS_POINTS = {
  contract: 10,
  bounty: 8,
  raidRepelled: 6,
  victory: 5,
  bossAssault: 5,
  dailyLogin: 5,
  mission: 2,
  /** v4.2 : vendetta gagnée contre un seigneur de guerre. */
  vendetta: 40,
  /** v4.3 : épisode des Chroniques terminé, participation au boss de saison. */
  chronicle: 40,
  seasonBoss: 60,
  /** v4.6 : boss d'alliance abattu (au moins 5 % des dégâts), ou simple participation. */
  allianceBoss: 40,
  allianceBossTry: 15,
  /** v4.7 : coalition gagnée contre un seigneur (au moins 3 % de l'objectif). */
  coalition: 50,
  /** v4.9 : objectif du jour d'alliance atteint (membre ayant contribué). */
  allianceDaily: 15
};
var PASS_TIERS = [
  [{ kind: "production", hours: 2 }],
  [{ kind: "amber", amount: 20 }],
  [{ kind: "capsule", capsule: "assault", level: 3 }],
  [{ kind: "production", hours: 3 }],
  [{ kind: "dossier", count: 1 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 4 }],
  [{ kind: "capsule", capsule: "armor", level: 3 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }],
  [{ kind: "production", hours: 5 }],
  [{ kind: "capsule", capsule: "decoy", level: 4 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 6 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "veil", level: 4 }],
  [{ kind: "production", hours: 7 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "assault", level: 5 }],
  [{ kind: "relic", rarity: "rare" }],
  [{ kind: "production", hours: 8 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "armor", level: 5 }],
  [{ kind: "production", hours: 9 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 40 }],
  [{ kind: "production", hours: 10 }],
  [{ kind: "amber", amount: 50 }],
  [{ kind: "capsule", capsule: "decoy", level: 5 }],
  [{ kind: "production", hours: 12 }],
  [{ kind: "relic", rarity: "epic" }, { kind: "amber", amount: 40 }, { kind: "cosmetic" }]
];
var DEFAULT_PASS = structuredClone({ rules: PASS_RULES, points: PASS_POINTS, tiers: PASS_TIERS });
function defaultSeasonPassConfig() {
  return structuredClone(DEFAULT_PASS);
}
function setSeasonPass(cfg) {
  var _a, _b;
  const d = defaultSeasonPassConfig();
  Object.assign(PASS_RULES, d.rules, (_a = cfg == null ? void 0 : cfg.rules) != null ? _a : {});
  Object.assign(PASS_POINTS, d.points, (_b = cfg == null ? void 0 : cfg.points) != null ? _b : {});
  const tiers2 = Array.isArray(cfg == null ? void 0 : cfg.tiers) && cfg.tiers.length > 0 ? cfg.tiers : d.tiers;
  PASS_TIERS.splice(0, PASS_TIERS.length, ...structuredClone(tiers2));
  PASS_RULES.tiers = PASS_TIERS.length;
}
var REWARD_KINDS = ["production", "amber", "dossier", "capsule", "relic", "cosmetic"];
function validateSeasonPass(cfg) {
  var _a;
  const errors = [];
  if (!cfg) return errors;
  if (cfg.rules && !(cfg.rules.pointsPerTier >= 1)) errors.push("Passe : points par palier \u2265 1.");
  for (const [k, v] of Object.entries((_a = cfg.points) != null ? _a : {})) if (!(typeof v === "number" && v >= 0)) errors.push(`Passe : points invalides pour \xAB ${k} \xBB.`);
  if (cfg.tiers) {
    if (cfg.tiers.length < 1 || cfg.tiers.length > 60) errors.push("Passe : entre 1 et 60 paliers.");
    cfg.tiers.forEach(
      (list, i) => (list != null ? list : []).forEach((r) => {
        if (!REWARD_KINDS.includes(r == null ? void 0 : r.kind)) errors.push(`Passe, palier ${i + 1} : r\xE9compense inconnue.`);
        if ((r == null ? void 0 : r.kind) === "capsule" && !(r.capsule in CAPSULES)) errors.push(`Passe, palier ${i + 1} : capsule inconnue.`);
        if ((r == null ? void 0 : r.kind) === "relic" && !["common", "rare", "epic", "legendary"].includes(r.rarity)) errors.push(`Passe, palier ${i + 1} : raret\xE9 inconnue.`);
      })
    );
  }
  return errors;
}
var CAPSULE_AMBER = 15;
function passTitle(seasonId) {
  const month2 = seasonLabel(seasonId).toLowerCase();
  return /^[aeiouéâ]/.test(month2) ? `V\xE9t\xE9ran d'${month2}` : `V\xE9t\xE9ran de ${month2}`;
}
function passState(player, now) {
  var _a, _b, _c;
  const raw = (_a = player.seasonPass) != null ? _a : {};
  const seasonId = currentSeasonId(now);
  const completed = Array.isArray(raw.completed) ? raw.completed.map(String) : [];
  if (raw.seasonId !== seasonId) return { seasonId, points: 0, claimed: [], loginDay: "", completed, activity: {} };
  const activity = {};
  for (const [k, v] of Object.entries((_b = raw.activity) != null ? _b : {})) if (Number(v) > 0) activity[k] = Number(v);
  return {
    seasonId,
    points: Math.max(0, Number(raw.points) || 0),
    claimed: (Array.isArray(raw.claimed) ? raw.claimed : []).map(Number).filter((n) => n >= 1 && n <= activePass(seasonId).tiers.length),
    loginDay: String((_c = raw.loginDay) != null ? _c : ""),
    completed,
    activity
  };
}
var MONTH_PASSES = /* @__PURE__ */ new Map();
function setMonthPasses(list) {
  MONTH_PASSES.clear();
  for (const m of list) if (m.pass && m.pass.pointsPerTier >= 1 && Array.isArray(m.pass.tiers) && m.pass.tiers.length > 0) MONTH_PASSES.set(m.id, m.pass);
}
function activePass(seasonId = currentSeasonId()) {
  var _a;
  return (_a = MONTH_PASSES.get(seasonId)) != null ? _a : { pointsPerTier: PASS_RULES.pointsPerTier, tiers: PASS_TIERS };
}
function passTier(points, seasonId = currentSeasonId()) {
  const pass = activePass(seasonId);
  return Math.min(pass.tiers.length, Math.floor(points / pass.pointsPerTier));
}
function passMax(seasonId) {
  const pass = activePass(seasonId);
  return pass.tiers.length * pass.pointsPerTier;
}
function trackActivity(player, key, now, times = 1) {
  var _a, _b, _c;
  if (!(times > 0)) return;
  const st = passState(player, now);
  st.activity = __spreadProps(__spreadValues({}, (_a = st.activity) != null ? _a : {}), { [key]: ((_c = (_b = st.activity) == null ? void 0 : _b[key]) != null ? _c : 0) + times });
  player.seasonPass = st;
}
var passHook = null;
function onPassPoints(hook) {
  passHook = hook;
}
function addPassPoints(player, source, now, times = 1) {
  passHook == null ? void 0 : passHook(player, source, now, times);
  trackActivity(player, source, now, times);
  const st = passState(player, now);
  st.points = Math.min(passMax(st.seasonId), st.points + PASS_POINTS[source] * Math.max(0, times));
  player.seasonPass = st;
}
function passDailyLogin(player, now) {
  var _a, _b, _c;
  const st = passState(player, now);
  const day = new Date(now).toISOString().slice(0, 10);
  if (st.loginDay === day) return false;
  st.loginDay = day;
  st.activity = __spreadProps(__spreadValues({}, (_a = st.activity) != null ? _a : {}), { dailyLogin: ((_c = (_b = st.activity) == null ? void 0 : _b.dailyLogin) != null ? _c : 0) + 1 });
  st.points = Math.min(passMax(st.seasonId), st.points + PASS_POINTS.dailyLogin);
  player.seasonPass = st;
  return true;
}
function describePassReward(r, seasonId) {
  switch (r.kind) {
    case "production":
      return `${r.hours} h de production`;
    case "amber":
      return `${r.amount} Ambre`;
    case "dossier":
      return r.count > 1 ? `${r.count} Dossiers d'entra\xEEnement` : "Dossier d'entra\xEEnement";
    case "capsule":
      return `${CAPSULES[r.capsule].name} N${r.level}`;
    case "relic":
      return `Relique ${RARITY_LABELS[r.rarity]}`;
    case "cosmetic":
      return seasonId ? `Banni\xE8re et titre \xAB ${passTitle(seasonId)} \xBB` : "Banni\xE8re et titre de la saison";
  }
}
var RARITY_LABELS = { common: "commune", rare: "rare", epic: "\xE9pique", legendary: "l\xE9gendaire", mythic: "mythique" };
function grantPassReward(player, r, seasonId, now, random = Math.random) {
  var _a, _b, _c;
  if (r.kind === "production") {
    for (const [res, n] of Object.entries(productionHours(player, r.hours))) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + n;
    return describePassReward(r);
  }
  if (r.kind === "amber") {
    const b = bountyState(player);
    b.amber += r.amount;
    player.bounties = b;
    return describePassReward(r);
  }
  if (r.kind === "dossier") {
    addDossiers(player, r.count);
    return describePassReward(r);
  }
  if (r.kind === "capsule") {
    const syn = synthesisState(player);
    if (syn.stock[r.capsule].length < SYNTH_RULES.maxStock) {
      syn.stock[r.capsule] = [...syn.stock[r.capsule], r.level];
      player.synthesis = syn;
      return describePassReward(r);
    }
    const b = bountyState(player);
    b.amber += CAPSULE_AMBER;
    player.bounties = b;
    return `${CAPSULE_AMBER} Ambre (r\xE9serve de capsules pleine)`;
  }
  if (r.kind === "relic") {
    let first = true;
    const item = rollRelic("pass", now, () => first ? (first = false, 0) : random(), r.rarity);
    if (addRelic(player, item)) return `Relique : ${relicLabel(item)}`;
    const b = bountyState(player);
    b.amber += 40;
    player.bounties = b;
    return "40 Ambre (collection de reliques pleine)";
  }
  const title = passTitle(seasonId);
  if (!((_b = player.titles) != null ? _b : []).some((t) => t.label === title)) player.titles = [...(_c = player.titles) != null ? _c : [], { label: title, seasonId: `pass:${seasonId}`, rank: 1 }];
  const st = passState(player, now);
  if (!st.completed.includes(seasonId)) st.completed = [...st.completed, seasonId];
  player.seasonPass = st;
  return describePassReward(r, seasonId);
}
function claimPassTier(player, tierIn, now, random = Math.random) {
  const tier = Math.floor(Number(tierIn));
  const st = passState(player, now);
  const pass = activePass(st.seasonId);
  if (!(tier >= 1 && tier <= pass.tiers.length)) throw new GameActionError("Palier inconnu.");
  if (st.claimed.includes(tier)) throw new GameActionError("Palier d\xE9j\xE0 r\xE9clam\xE9.");
  if (passTier(st.points, st.seasonId) < tier) throw new GameActionError(`Palier pas encore atteint (${st.points} / ${tier * pass.pointsPerTier} points).`);
  const gained = pass.tiers[tier - 1].map((r) => grantPassReward(player, r, st.seasonId, now, random));
  const after = passState(player, now);
  after.claimed = [...st.claimed, tier].sort((a, b) => a - b);
  player.seasonPass = after;
  return gained;
}

// src/game/leviathan.ts
var LEVIATHAN_KEY = "leviathan";
var LEVIATHAN_RULES = {
  name: "Le L\xE9viathan",
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs (7 j). */
  hpFactor: 4,
  minHp: 1e5,
  durationHours: 72,
  /** Un assaut toutes les N heures par joueur. */
  cooldownHours: 4,
  /** Trajet aller (et retour), en minutes. */
  flightMinutes: 30,
  /** Part de chaque type de vaisseau détruite à chaque assaut (réparable à l'Atelier). */
  lossPct: 0.08,
  /** Récompense : base + bonus × (dégâts / dégâts du premier), en heures de production. */
  baseRewardHours: 2,
  bonusRewardHours: 10,
  /** Récompenses si le Léviathan survit. */
  failedRewardFactor: 0.5,
  title: "Fl\xE9au du L\xE9viathan",
  titleDays: 7
};
var HOUR5 = 36e5;
function normalizeLeviathan(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (!r.id || !(Number(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs) || 0,
    maxHp: Number(r.maxHp),
    hp: Math.max(0, Number(r.hp) || 0),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
    endedAtMs: Number(r.endedAtMs) || 0,
    rewarded: r.rewarded === true,
    titleHolder: r.titleHolder && r.titleHolder.uid ? r.titleHolder : null,
    timeline: Array.isArray(r.timeline) ? r.timeline.filter((p) => p && Number.isFinite(p.t) && Number.isFinite(p.hp)) : []
  };
}
function leviathanWindow(now) {
  if (!EVENT_RULES.bossMonthly) return null;
  const w = weekendWindow(now);
  if (!w.firstOfMonth) return null;
  const endMs = w.startMs + LEVIATHAN_RULES.durationHours * HOUR5;
  if (now < w.startMs || now >= endMs) return null;
  return { id: `lev-${w.startMs}`, startMs: w.startMs, endMs };
}
function nextLeviathanStart(now) {
  if (!EVENT_RULES.bossMonthly) return null;
  for (let i = 0; i < 6; i++) {
    const w = weekendWindow(now, i);
    if (w.firstOfMonth && w.startMs + LEVIATHAN_RULES.durationHours * HOUR5 > now) return w.startMs;
  }
  return null;
}
function isActive(state, now) {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs && state.hp > 0;
}
function leviathanHp(activePlayers) {
  const power = activePlayers.reduce((a, p) => {
    var _a, _b;
    return a + computeFullPower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]);
  }, 0);
  return Math.max(LEVIATHAN_RULES.minHp, Math.round(power * LEVIATHAN_RULES.hpFactor));
}
function spawnLeviathan(window, activePlayers, previous) {
  var _a;
  const maxHp = leviathanHp(activePlayers);
  return __spreadProps(__spreadValues({}, window), { maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: (_a = previous == null ? void 0 : previous.titleHolder) != null ? _a : null, timeline: [{ t: window.startMs, hp: maxHp }] });
}
function checkLeviathanLaunch(state, uid, pseudo, now) {
  var _a, _b;
  if (!state || !isActive(state, now)) throw new GameActionError("Le L\xE9viathan n'est pas l\xE0 en ce moment.");
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * HOUR5 - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 6e4)} min.`);
  return __spreadProps(__spreadValues({}, state), { contributions: __spreadProps(__spreadValues({}, state.contributions), { [uid]: { pseudo, damage: (_a = c == null ? void 0 : c.damage) != null ? _a : 0, assaults: (_b = c == null ? void 0 : c.assaults) != null ? _b : 0, lastLaunchMs: now } }) });
}
function resolveLeviathanAssault(state, player, fleet, formation, now) {
  var _a;
  const fx = formationEffects(formation);
  const power = Math.round(computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack) * (1 + playerModifiers(player).bossDamage));
  const active = isActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = withRepairBonus(getRepairPercent(player.buildings), player);
  const lossPct = Math.min(1, LEVIATHAN_RULES.lossPct * fx.attackerLossFactor);
  const survivors = {};
  const lost = {};
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const gone = raw - Math.floor(raw * repair);
    if (gone > 0) lost[id] = gone;
    survivors[id] = qty - gone;
  }
  const c = (_a = state.contributions[player.uid]) != null ? _a : { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: now };
  const hp = state.hp - damage;
  const killed = active && hp <= 0;
  return {
    state: __spreadProps(__spreadValues({}, state), {
      hp: Math.max(0, hp),
      status: killed ? "killed" : state.status,
      endedAtMs: killed ? now : state.endedAtMs,
      contributions: active ? __spreadProps(__spreadValues({}, state.contributions), { [player.uid]: __spreadProps(__spreadValues({}, c), { pseudo: player.pseudo, damage: c.damage + damage, assaults: c.assaults + 1 }) }) : state.contributions
    }),
    damage,
    survivors,
    lost,
    killed
  };
}
function leviathanRanking(state) {
  return Object.entries(state.contributions).filter(([, c]) => c.damage > 0).map(([uid, c]) => __spreadValues({ uid }, c)).sort((a, b) => b.damage - a.damage);
}
function rewardHours(state, uid) {
  var _a, _b, _c, _d;
  const ranking = leviathanRanking(state);
  const top = (_b = (_a = ranking[0]) == null ? void 0 : _a.damage) != null ? _b : 0;
  const mine = (_d = (_c = state.contributions[uid]) == null ? void 0 : _c.damage) != null ? _d : 0;
  if (!(mine > 0) || !(top > 0)) return 0;
  const hours2 = LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours * (mine / top);
  return state.status === "killed" ? hours2 : hours2 * LEVIATHAN_RULES.failedRewardFactor;
}
function grantLeviathanReward(state, player, random = Math.random) {
  var _a, _b, _c;
  const hours2 = rewardHours(state, player.uid);
  const gain = hours2 > 0 ? productionHours(player, hours2) : {};
  for (const [res, n] of Object.entries(gain)) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + n;
  if (state.status === "killed" && hours2 > 0) bumpStat(player, "leviathanKills");
  const top = leviathanRanking(state)[0];
  const title = !!top && top.uid === player.uid && state.status === "killed";
  if (title && !((_b = player.titles) != null ? _b : []).some((t) => t.label === LEVIATHAN_RULES.title)) {
    player.titles = [...(_c = player.titles) != null ? _c : [], { label: LEVIATHAN_RULES.title, seasonId: `leviathan:${state.id}`, rank: 1 }];
    player.activeTitle = LEVIATHAN_RULES.title;
  }
  if (state.status === "killed" && hours2 > 0) {
    const item = rollRelic("leviathan", Date.now(), random, title ? "epic" : "rare");
    if (addRelic(player, item)) return { gain, title, relic: relicLabel(item) };
  }
  return { gain, title };
}
function removeLeviathanTitle(player) {
  var _a, _b;
  player.titles = ((_a = player.titles) != null ? _a : []).filter((t) => t.label !== LEVIATHAN_RULES.title);
  if (player.activeTitle === LEVIATHAN_RULES.title) player.activeTitle = (_b = player.titles[0]) == null ? void 0 : _b.label;
}
function closeLeviathan(state, now) {
  if (state.status === "active" && now >= state.endMs) return __spreadProps(__spreadValues({}, state), { status: "failed", endedAtMs: now });
  return state;
}
var TIMELINE_MAX = 120;
function recordLeviathanTimeline(state, now) {
  if (!isActive(state, now)) return state;
  const last = state.timeline[state.timeline.length - 1];
  if (last && now - last.t < HOUR5) return state;
  return __spreadProps(__spreadValues({}, state), { timeline: [...state.timeline, { t: now, hp: state.hp }].slice(-TIMELINE_MAX) });
}
function resizeLeviathan(state, maxHp, now) {
  if (!isActive(state, now)) throw new GameActionError("Le L\xE9viathan n'est pas l\xE0 en ce moment.");
  const next = Math.round(maxHp);
  const done = state.maxHp - state.hp;
  if (!(next > done)) throw new GameActionError(`La structure doit d\xE9passer les d\xE9g\xE2ts d\xE9j\xE0 inflig\xE9s (${done}).`);
  return __spreadProps(__spreadValues({}, state), { maxHp: next, hp: next - done, timeline: [...state.timeline, { t: now, hp: next - done }].slice(-TIMELINE_MAX) });
}

// src/game/chronicles.ts
var OBJECTIVE_LABELS = {
  contract: "Contrats du jour r\xE9cup\xE9r\xE9s",
  bounty: "Primes Kesh'Vaar remplies",
  raidRepelled: "Raids de faction repouss\xE9s",
  victory: "Combats gagn\xE9s",
  bossAssault: "Assauts sur un boss",
  mission: "Missions termin\xE9es",
  spy: "Sondes d'espionnage lanc\xE9es",
  market: "Offres achet\xE9es au march\xE9",
  warlordWin: "Seigneurs de guerre pill\xE9s"
};
var L = (speaker, text) => ({ speaker, text });
var DEFAULT_CHRONICLES = {
  months: [
    {
      id: "2026-10",
      title: "La Liste",
      theme: { accent: "#ffb347", label: "Ambre de la Ruche" },
      boss: {
        name: "Le Vaisseau-Liste de Varan",
        title: "Pourfendeur du Vaisseau-Liste",
        image: "/assets/chronicles/2026-10-boss.webp",
        emblem: "/assets/chronicles/2026-10-sceau.webp",
        fallbackImage: "/assets/story/varan.webp",
        lore: "Le vaisseau amiral de la Confr\xE9rie, couvert des noms de tous les empires que Varan a jur\xE9 de ruiner. Le Silencieux se tient sur la proue."
      },
      episodes: [
        {
          title: "Les informateurs",
          lines: [
            L("vashka", "Varan n'a pas dig\xE9r\xE9 sa d\xE9faite, {pseudo}. Il a rouvert sa Liste, et il paie des informateurs pour la remplir."),
            L("vashka", "Retourne leur arme contre eux : envoie des sondes, observe qui parle \xE0 qui. Un nom sur la Liste, c'est aussi une piste vers lui.")
          ],
          objective: { type: "spy", count: 3 }
        },
        {
          title: "Les comptes de la Confr\xE9rie",
          lines: [
            L("varan", "{pseudo}\u2026 Ton nom remonte sur ma Liste. Chaque combat que tu gagnes me co\xFBte un client. Chaque combat que tu perds m'en rapporte deux."),
            L("vashka", "Alors gagne. Montre au secteur que la Liste ne fait plus peur.")
          ],
          objective: { type: "victory", count: 3 }
        },
        {
          title: "Les seigneurs vendus",
          lines: [
            L("lysa", "Tu veux savoir qui vend des noms \xE0 Varan ? Je tiens les comptes de tout le monde, commandant. Brannoc, par exemple\u2026 tr\xE8s bien pay\xE9."),
            L("vashka", "Les seigneurs de guerre lui servent de rabatteurs. Frappe-en un : qu'ils comprennent que la Liste a un prix.")
          ],
          objective: { type: "warlordWin", count: 1 }
        },
        {
          title: "Le Vaisseau-Liste",
          lines: [
            L("varan", "Assez jou\xE9. Le dernier week-end du mois, le Vaisseau-Liste sortira du Vide. Tous les noms \xE9crits sur sa coque tomberont avec toi."),
            L("vashka", "Pr\xE9pare ton empire : contrats, r\xE9serves, flotte. Ce week-end-l\xE0, tout le secteur devra frapper ensemble.")
          ],
          objective: { type: "contract", count: 4 }
        }
      ]
    },
    {
      id: "2026-11",
      title: "Les \u0152ufs de la Reine",
      theme: { accent: "#ff6a3d", label: "Braise de la Confr\xE9rie" },
      boss: {
        name: "La Couveuse de Kor",
        title: "Pourfendeur de la Couveuse",
        image: "/assets/chronicles/2026-11-boss.webp",
        emblem: "/assets/chronicles/2026-11-sceau.webp",
        fallbackImage: "/assets/story/cartel.webp",
        lore: "N\xE9e d'un \u0153uf vol\xE9 \xE0 la Reine de l'Essaim, bard\xE9e d'implants n\xE9on par le Cartel. Elle pond une nich\xE9e de guerre \xE0 chaque heure qui passe."
      },
      episodes: [
        {
          title: "Les cendres de la Ruche",
          lines: [
            L("vashka", "Les ruines de notre Ruche-M\xE8re fument encore. Dans les cendres, nous avons trouv\xE9 des traces de transport : des caisses frapp\xE9es d'un sceau n\xE9on."),
            L("vashka", "Fouille les confins avec moi, {pseudo}. Chaque mission rapporte un indice.")
          ],
          objective: { type: "mission", count: 6 }
        },
        {
          title: "Suivre l'argent",
          lines: [
            L("nerea", "Les \u0153ufs de votre Reine ? Ils ont chang\xE9 de mains trois fois sur le march\xE9. Achetez, commandant, et je vous dirai \xE0 qui."),
            L("vashka", "Joue le jeu. Les marchands parlent quand on leur ach\xE8te.")
          ],
          objective: { type: "market", count: 3 }
        },
        {
          title: "Le Cartel N\xE9on",
          lines: [
            L("kor", "Madame Vashti Kor, enchant\xE9e. Les \u0153ufs ? Un investissement. Celui-ci a \xE9clos, et ma Couveuse a tr\xE8s faim."),
            L("vashka", "Les chasseurs de la Ruche sont pr\xEAts. Remplis nos primes : chaque fugitif ramen\xE9 affaiblit le Cartel.")
          ],
          objective: { type: "bounty", count: 2 }
        },
        {
          title: "La nich\xE9e de guerre",
          lines: [
            L("kor", "Ma Couveuse quitte le casino le dernier week-end du mois. Venez la voir, commandants. L'entr\xE9e est gratuite ; la sortie, beaucoup moins."),
            L("vashka", "Aguerris ta flotte d'ici l\xE0. Gagne des combats : la Couveuse ne respecte que la force.")
          ],
          objective: { type: "victory", count: 4 }
        }
      ]
    },
    {
      id: "2026-12",
      title: "Le Silence d'hiver",
      theme: { accent: "#9fd8ff", label: "Givre du Ch\u0153ur" },
      boss: {
        name: "L'\xC9cho de Vesper",
        title: "Pourfendeur de l'\xC9cho",
        image: "/assets/chronicles/2026-12-boss.webp",
        emblem: "/assets/chronicles/2026-12-sceau.webp",
        fallbackImage: "/assets/story/choeur.webp",
        lore: "Une cath\xE9drale de cristal noir prise dans les glaces, qui chante sans bouche. L\xE0 o\xF9 passe son \xE9cho, les transmissions g\xE8lent."
      },
      episodes: [
        {
          title: "Le murmure",
          lines: [
            L("ilyon", "Je\u2026 les entends de nouveau. Le Ch\u0153ur se r\xE9veille avec l'hiver. L'Archonte cherche une voix assez forte pour couvrir la mienne."),
            L("vashka", "Un d\xE9serteur du Ch\u0153ur qui vient nous pr\xE9venir ? Prudence, {pseudo}. V\xE9rifie ce qu'il dit : sonde le secteur.")
          ],
          objective: { type: "spy", count: 4 }
        },
        {
          title: "Le givre",
          lines: [
            L("vesper", "\u2026"),
            L("ilyon", "C'est sa r\xE9ponse. Le silence g\xE8le les routes commerciales. Tiens tes contrats co\xFBte que co\xFBte, ou tes chantiers s'arr\xEAteront.")
          ],
          objective: { type: "contract", count: 5 }
        },
        {
          title: "Les voix achet\xE9es",
          lines: [
            L("brannoc", "Le Ch\u0153ur paie bien, gamin. Il ne parle pas, mais il paie. Moi et quelques autres, on lui ouvre la route."),
            L("vashka", "Alors coupe-lui la route. Brise deux seigneurs de guerre avant que l'hiver ne se referme.")
          ],
          objective: { type: "warlordWin", count: 2 }
        },
        {
          title: "La cath\xE9drale de glace",
          lines: [
            L("ilyon", "L'\xC9cho de Vesper arrive le dernier week-end de l'ann\xE9e. Une cath\xE9drale enti\xE8re, qui chante sans bouche."),
            L("vashka", "Alors faisons-lui entendre le bruit d'une flotte. Rassemble tout ce que tu as, {pseudo}.")
          ],
          objective: { type: "mission", count: 8 }
        }
      ]
    },
    {
      id: "2027-01",
      title: "Le D\xE9gel",
      theme: { accent: "#7fd1ff", label: "Bleu glacier" },
      boss: {
        name: "Le Brise-Glace de Kragmor",
        title: "Pourfendeur du Brise-Glace",
        image: "/assets/chronicles/2027-01-boss.webp",
        emblem: "/assets/chronicles/2027-01-sceau.webp",
        fallbackImage: "/assets/story/gravhorn.webp",
        lore: "Un vaisseau-forage du Syndicat Gravhorn, \xE0 l'\xE9trave h\xE9riss\xE9e de foreuses, qui brise la glace des routes gel\xE9es pour les revendre au plus offrant."
      },
      episodes: [
        {
          title: "Les routes gel\xE9es",
          lines: [
            L("vashka", "L'hiver du Ch\u0153ur s'est retir\xE9, {pseudo}, mais il a laiss\xE9 les routes prises dans la glace. Les prix flambent."),
            L("kragmor", "Flamber ? Moi, j'appelle \xE7a \xAB le march\xE9 \xBB. Ach\xE8te, petit. Tant que c'est encore moi qui fixe les prix.")
          ],
          objective: { type: "market", count: 4 }
        },
        {
          title: "Les convois",
          lines: [
            L("nerea", "Les convois d'hiver repartent. Escorte-les, ou Kragmor fera payer chaque tonne qui passe."),
            L("vashka", "Envoie tes \xE9quipes en mission, {pseudo}. Chaque route rouverte est une route de moins pour lui.")
          ],
          objective: { type: "mission", count: 8 }
        },
        {
          title: "Le prix de la glace",
          lines: [
            L("lysa", "J'ai vu ses registres. Il ne vend pas la glace : il vend des routes qu'il a lui-m\xEAme bloqu\xE9es."),
            L("vashka", "Alors trouve o\xF9 sont ses foreuses. Sonde le secteur avant qu'il ne remette la main sur les passages.")
          ],
          objective: { type: "spy", count: 3 }
        },
        {
          title: "La d\xE9b\xE2cle",
          lines: [
            L("kragmor", "Mon Brise-Glace sort le dernier week-end du mois. Quiconque se met devant l'\xE9trave finit en copeaux."),
            L("vashka", "Ses alli\xE9s d'abord. Brise deux seigneurs de guerre, {pseudo}, et il arrivera seul.")
          ],
          objective: { type: "warlordWin", count: 2 }
        }
      ]
    },
    {
      id: "2027-02",
      title: "Le Ch\u0153ur bris\xE9",
      theme: { accent: "#c58bff", label: "Violet du Ch\u0153ur" },
      boss: {
        name: "La Cath\xE9drale d'Ilyon",
        title: "Pourfendeur de la Cath\xE9drale",
        image: "/assets/chronicles/2027-02-boss.webp",
        emblem: "/assets/chronicles/2027-02-sceau.webp",
        fallbackImage: "/assets/story/choeur.webp",
        lore: "La nef de cristal o\xF9 Ilyon chantait autrefois, rappel\xE9e par le Ch\u0153ur et retourn\xE9e contre lui. Ses vitraux vibrent assez fort pour fendre une coque."
      },
      episodes: [
        {
          title: "La fausse note",
          lines: [
            L("ilyon", "Ils ont rallum\xE9 ma cath\xE9drale. Sans moi. Ce chant qui traverse le secteur\u2026 c'est ma voix, vol\xE9e."),
            L("vashka", "Tes contrats d'abord, {pseudo}. Un empire qui tient ses engagements ne se laisse pas bercer par une chanson.")
          ],
          objective: { type: "contract", count: 5 }
        },
        {
          title: "Les fid\xE8les",
          lines: [
            L("nerea", "Des empires entiers se tournent vers la cath\xE9drale. Ils envoient leurs flottes l\xE0 o\xF9 le chant les appelle."),
            L("vashka", "Alors r\xE9veille-les \xE0 coups de canon. Gagne quatre combats, que tout le secteur l'entende.")
          ],
          objective: { type: "victory", count: 4 }
        },
        {
          title: "Le contre-chant",
          lines: [
            L("vashka", "L'Essaim ne chante pas, {pseudo}. Il chasse. Remplis trois primes : les chasseurs Kesh feront taire les fid\xE8les."),
            L("ilyon", "Je connais les passages de la nef. Je vous les donnerai\u2026 si vous me rendez ma voix.")
          ],
          objective: { type: "bounty", count: 3 }
        },
        {
          title: "La nef",
          lines: [
            L("ilyon", "Le dernier week-end, la cath\xE9drale entrera dans le secteur. Visez les vitraux : c'est l\xE0 qu'elle respire."),
            L("vashka", "Pr\xE9pare tes flottes, {pseudo}. Six missions pour rassembler tout ce qui peut voler.")
          ],
          objective: { type: "mission", count: 6 }
        }
      ]
    },
    {
      id: "2027-03",
      title: "Les Racines de Maru",
      theme: { accent: "#7dff9a", label: "Vert des racines" },
      boss: {
        name: "L'Avatar du Proph\xE8te",
        title: "Pourfendeur de l'Avatar",
        image: "/assets/chronicles/2027-03-boss.webp",
        emblem: "/assets/chronicles/2027-03-sceau.webp",
        fallbackImage: "/assets/leviathan/leviathan.webp",
        lore: "Un colosse de chair et de racines que le culte de Maru a fait pousser sur un ast\xE9ro\xEFde, \xE0 l'image du L\xE9viathan qu'il v\xE9n\xE8re. Il grandit \xE0 chaque pri\xE8re."
      },
      episodes: [
        {
          title: "Les germes",
          lines: [
            L("maru", "Le printemps vient, enfants du vide. Et avec lui, la graine du L\xE9viathan \xE9clot dans votre secteur."),
            L("vashka", "Des racines sur les ast\xE9ro\xEFdes, {pseudo}. Sonde-les toutes : je veux savoir jusqu'o\xF9 elles courent.")
          ],
          objective: { type: "spy", count: 4 }
        },
        {
          title: "Les fid\xE8les arm\xE9s",
          lines: [
            L("maru", "Mes fr\xE8res seigneurs ont entendu l'appel. Ils prot\xE9geront le jardin."),
            L("vashka", "Alors arrache les gardiens. Brise deux seigneurs de guerre, et le jardin restera sans d\xE9fense.")
          ],
          objective: { type: "warlordWin", count: 2 }
        },
        {
          title: "Les raids de printemps",
          lines: [
            L("varan", "M\xEAme moi, je n'aime pas ce qui pousse l\xE0-bas. La Confr\xE9rie frappera les colonies qui tra\xEEnent : tiens bon, ou tu serviras d'engrais."),
            L("vashka", "Repousse trois raids, {pseudo}. Un empire qui plie nourrit les racines.")
          ],
          objective: { type: "raidRepelled", count: 3 }
        },
        {
          title: "La floraison",
          lines: [
            L("maru", "Le dernier week-end, l'Avatar ouvrira les yeux. Et le secteur entier priera avec moi."),
            L("vashka", "Le secteur entier tirera, oui. Tes contrats d'abord : il nous faudra chaque ressource, {pseudo}.")
          ],
          objective: { type: "contract", count: 5 }
        }
      ]
    }
  ]
};
var config = structuredClone(DEFAULT_CHRONICLES);
function setChronicles(next) {
  config = { months: Array.isArray(next == null ? void 0 : next.months) && next.months.length > 0 ? structuredClone(next.months) : structuredClone(DEFAULT_CHRONICLES.months) };
  setMonthPasses(config.months);
}
function chroniclesConfig() {
  return config;
}
function defaultChroniclesConfig() {
  return structuredClone(DEFAULT_CHRONICLES);
}
function validateChronicles(cfg) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const errors = [];
  const seen = /* @__PURE__ */ new Set();
  for (const m of (_a = cfg == null ? void 0 : cfg.months) != null ? _a : []) {
    if (!/^\d{4}-\d{2}$/.test((_b = m.id) != null ? _b : "")) errors.push(`Chroniques : mois \xAB ${m.id} \xBB invalide (AAAA-MM).`);
    if (seen.has(m.id)) errors.push(`Chroniques : mois ${m.id} en double.`);
    seen.add(m.id);
    if (!Array.isArray(m.episodes) || m.episodes.length !== 4) errors.push(`Chroniques ${m.id} : il faut 4 \xE9pisodes.`);
    ((_c = m.episodes) != null ? _c : []).forEach((e3, i) => {
      var _a2, _b2;
      if (!(((_a2 = e3.objective) == null ? void 0 : _a2.type) in OBJECTIVE_LABELS)) errors.push(`Chroniques ${m.id}, \xE9pisode ${i + 1} : objectif inconnu.`);
      if (!(((_b2 = e3.objective) == null ? void 0 : _b2.count) >= 1)) errors.push(`Chroniques ${m.id}, \xE9pisode ${i + 1} : nombre \u2265 1.`);
    });
    if (!((_d = m.boss) == null ? void 0 : _d.name)) errors.push(`Chroniques ${m.id} : nom du boss manquant.`);
    const rewards = [...((_e = m.episodes) != null ? _e : []).map((e3) => {
      var _a2;
      return (_a2 = e3.reward) != null ? _a2 : [];
    }), (_g = (_f = m.completion) == null ? void 0 : _f.rewards) != null ? _g : []].filter((r) => r.length > 0);
    if (rewards.length > 0) errors.push(...validateSeasonPass({ tiers: rewards }).map((e3) => `Chroniques ${m.id} \u2014 ${e3.replace(/^Passe, palier \d+ : /, "r\xE9compense : ")}`));
    if (m.pass) errors.push(...validateSeasonPass({ rules: { tiers: m.pass.tiers.length, pointsPerTier: m.pass.pointsPerTier }, tiers: m.pass.tiers }).map((e3) => `Chroniques ${m.id} \u2014 ${e3}`));
    if (m.completion && !((_h = m.completion.title) == null ? void 0 : _h.trim())) errors.push(`Chroniques ${m.id} : titre de fin de chapitre manquant.`);
  }
  return errors;
}
var HOUR6 = 36e5;
var DAY5 = 24 * HOUR6;
function parisDate(now) {
  const local = new Date(now + parisOffsetMs(now));
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() };
}
function chronicleMonthId(now) {
  const { y, m } = parisDate(now);
  return `${y}-${String(m).padStart(2, "0")}`;
}
function chronicleOf(now) {
  var _a;
  const id = chronicleMonthId(now);
  return (_a = config.months.find((m) => m.id === id)) != null ? _a : null;
}
function unlockedEpisodes(now) {
  const { d } = parisDate(now);
  return d >= 22 ? 4 : d >= 15 ? 3 : d >= 8 ? 2 : 1;
}
function episodeUnlockMs(monthId, index) {
  var _a;
  const [y, m] = monthId.split("-").map(Number);
  return parisLocalToUtc(Date.UTC(y, m - 1, (_a = [1, 8, 15, 22][index]) != null ? _a : 1));
}
function chronicleState(player, now) {
  var _a, _b;
  const raw = (_a = player.chronicle) != null ? _a : {};
  const monthId = chronicleMonthId(now);
  const emblems = Array.isArray(raw.emblems) ? raw.emblems.map(String) : [];
  const chapters = Array.isArray(raw.chapters) ? raw.chapters.map(String) : [];
  if (raw.monthId !== monthId) return { monthId, progress: [0, 0, 0, 0], claimed: [], emblems, chapters };
  const progress = [0, 1, 2, 3].map((i) => {
    var _a2;
    return Math.max(0, Number((_a2 = raw.progress) == null ? void 0 : _a2[i]) || 0);
  });
  return { monthId, progress, claimed: ((_b = raw.claimed) != null ? _b : []).map(Number).filter((n) => n >= 0 && n < 4), emblems, chapters };
}
function recordChronicle(player, type, now, times = 1) {
  if (!(type in PASS_POINTS)) trackActivity(player, type, now, times);
  const month2 = chronicleOf(now);
  if (!month2 || !(times > 0)) return;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  let changed = false;
  month2.episodes.slice(0, open).forEach((e3, i) => {
    if (e3.objective.type !== type || st.claimed.includes(i)) return;
    const next = Math.min(e3.objective.count, st.progress[i] + times);
    if (next !== st.progress[i]) {
      st.progress[i] = next;
      changed = true;
    }
  });
  if (changed) player.chronicle = st;
}
function claimChronicle(player, episode, now, random = Math.random) {
  var _a, _b, _c;
  const i = Math.floor(Number(episode));
  const month2 = chronicleOf(now);
  if (!month2) throw new GameActionError("Pas de chronique ce mois-ci.");
  if (!(i >= 0 && i < month2.episodes.length)) throw new GameActionError("\xC9pisode inconnu.");
  if (i >= unlockedEpisodes(now)) throw new GameActionError("Cet \xE9pisode n'est pas encore ouvert.");
  const st = chronicleState(player, now);
  if (st.claimed.includes(i)) throw new GameActionError("\xC9pisode d\xE9j\xE0 termin\xE9.");
  const e3 = month2.episodes[i];
  if (st.progress[i] < e3.objective.count) throw new GameActionError(`Objectif pas encore atteint (${st.progress[i]} / ${e3.objective.count}).`);
  st.claimed = [...st.claimed, i];
  player.chronicle = st;
  addPassPoints(player, "chronicle", now);
  const gained = ((_a = e3.reward) != null ? _a : []).map((r) => grantPassReward(player, r, month2.id, now, random));
  const chapter = month2.episodes.every((_, k) => st.claimed.includes(k));
  if (chapter && month2.completion) {
    const after = chronicleState(player, now);
    if (!after.chapters.includes(month2.id)) after.chapters = [...after.chapters, month2.id];
    player.chronicle = after;
    const title = month2.completion.title.trim();
    if (title && !((_b = player.titles) != null ? _b : []).some((t) => t.label === title)) {
      player.titles = [...(_c = player.titles) != null ? _c : [], { label: title, seasonId: `chapter:${month2.id}`, rank: 1 }];
      gained.push(`Titre \xAB ${title} \xBB`);
    }
    gained.push(`Banni\xE8re \xAB ${month2.title} \xBB`);
    gained.push(...month2.completion.rewards.map((r) => grantPassReward(player, r, month2.id, now, random)));
  } else if (chapter) {
    const after = chronicleState(player, now);
    if (!after.chapters.includes(month2.id)) after.chapters = [...after.chapters, month2.id];
    player.chronicle = after;
  }
  return { points: PASS_POINTS.chronicle, gained, chapter };
}
onPassPoints((player, source, now, times) => {
  if (source in OBJECTIVE_LABELS) recordChronicle(player, source, now, times);
});
var SEASON_BOSS_KEY = "season_boss";
var SEASON_BOSS_RULES = {
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs (7 j). */
  hpFactor: 3,
  minHp: 1e5,
  /** Vendredi 18 h → dimanche 23 h (heure de Paris). */
  durationHours: 53,
  topRelics: 3
};
function seasonBossWindow(now, includeUpcoming = false) {
  for (let i = 0; i < 6; i++) {
    const w = weekendWindow(now, i);
    const friday = parisDate(w.startMs);
    const nextWeek = parisDate(w.startMs + 7 * DAY5);
    if (nextWeek.m === friday.m) continue;
    const monthId = `${friday.y}-${String(friday.m).padStart(2, "0")}`;
    const endMs = w.startMs + SEASON_BOSS_RULES.durationHours * HOUR6;
    if (now >= endMs) continue;
    if (!config.months.some((m) => m.id === monthId)) return null;
    if (now < w.startMs && !includeUpcoming) return null;
    return { id: `boss-${monthId}`, monthId, startMs: w.startMs, endMs };
  }
  return null;
}
function seasonBossHp(activePlayers) {
  const power = activePlayers.reduce((a, p) => {
    var _a, _b;
    return a + computeFullPower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]);
  }, 0);
  return Math.max(SEASON_BOSS_RULES.minHp, Math.round(power * SEASON_BOSS_RULES.hpFactor));
}
function spawnSeasonBoss(window, activePlayers) {
  const maxHp = seasonBossHp(activePlayers);
  return { id: window.id, startMs: window.startMs, endMs: window.endMs, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [{ t: window.startMs, hp: maxHp }] };
}
function bossMonthOf(state) {
  var _a;
  const monthId = state.id.replace(/^boss-/, "").slice(0, 7);
  return (_a = config.months.find((m) => m.id === monthId)) != null ? _a : null;
}
function checkSeasonBossLaunch(state, uid, pseudo, now) {
  var _a, _b, _c, _d;
  const name = state ? (_b = (_a = bossMonthOf(state)) == null ? void 0 : _a.boss.name) != null ? _b : "Le boss de saison" : "Le boss de saison";
  if (!state || state.status !== "active" || now < state.startMs || now >= state.endMs || state.hp <= 0) throw new GameActionError(`${name} n'est pas l\xE0 en ce moment.`);
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * HOUR6 - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 6e4)} min.`);
  return __spreadProps(__spreadValues({}, state), { contributions: __spreadProps(__spreadValues({}, state.contributions), { [uid]: { pseudo, damage: (_c = c == null ? void 0 : c.damage) != null ? _c : 0, assaults: (_d = c == null ? void 0 : c.assaults) != null ? _d : 0, lastLaunchMs: now } }) });
}
function grantSeasonBossReward(state, player, now, random = Math.random) {
  var _a, _b;
  const month2 = bossMonthOf(state);
  const ranking = leviathanRanking(state);
  const rank2 = ranking.findIndex((r) => r.uid === player.uid);
  if (rank2 < 0) return { points: 0, title: null, emblem: false };
  addPassPoints(player, "seasonBoss", now);
  if (state.status !== "killed" || !month2) return { points: PASS_POINTS.seasonBoss, title: null, emblem: false };
  const title = month2.boss.title;
  if (!((_a = player.titles) != null ? _a : []).some((t) => t.label === title)) player.titles = [...(_b = player.titles) != null ? _b : [], { label: title, seasonId: `boss:${month2.id}`, rank: rank2 + 1 }];
  const st = chronicleState(player, now);
  if (!st.emblems.includes(month2.id)) st.emblems = [...st.emblems, month2.id];
  player.chronicle = st;
  let relic;
  if (rank2 < SEASON_BOSS_RULES.topRelics) {
    const item = rollRelic(`boss:${month2.id}`, now, random, "epic");
    if (addRelic(player, item)) relic = relicLabel(item);
  }
  return { points: PASS_POINTS.seasonBoss, title, emblem: true, relic };
}
function bossEmblems(player) {
  var _a, _b;
  const owned = new Set(((_b = (_a = player.chronicle) == null ? void 0 : _a.emblems) != null ? _b : []).map(String));
  return config.months.map((m) => ({ id: `boss:${m.id}`, label: `Sceau : ${m.boss.name}`, image: m.boss.emblem, unlocked: owned.has(m.id) }));
}

// src/game/onboarding.ts
var ONBOARDING_RANK = "fer2";
var ONBOARDING_TITLE = "Recrue";
var level2 = (p, id) => {
  var _a, _b, _c;
  return ((_b = (_a = p.buildings) == null ? void 0 : _a[id]) == null ? void 0 : _b.unlocked) ? (_c = p.buildings[id].level) != null ? _c : 0 : 0;
};
var count = (p, id) => {
  var _a, _b, _c;
  return (_c = (_b = (_a = p.units) == null ? void 0 : _a[id]) == null ? void 0 : _b.count) != null ? _c : 0;
};
function onboardingRankXp() {
  var _a, _b;
  return (_b = (_a = RANKS.find((r) => r.id === ONBOARDING_RANK)) == null ? void 0 : _a.xp) != null ? _b : 250;
}
var ONBOARDING_STEPS = [
  {
    id: "scrap3",
    label: "Extracteur de ferraille au niveau 3",
    hint: "La ferraille paie presque tout : am\xE9liore son extracteur en premier.",
    to: "/game/batiments",
    reward: { scrap: 1e3, energy: 500 },
    done: (p) => level2(p, "extracteur_ferraille") >= 3
  },
  {
    id: "reactor3",
    label: "R\xE9acteur au niveau 3",
    hint: "L'\xE9nergie instable accompagne la ferraille dans la plupart des co\xFBts.",
    to: "/game/batiments",
    reward: { scrap: 1500, energy: 1e3 },
    done: (p) => level2(p, "reacteur_instable") >= 3
  },
  {
    id: "research",
    label: "Lancer une premi\xE8re recherche",
    hint: "Le Labo d\xE9bloque les unit\xE9s et renforce toute ton \xE9conomie.",
    to: "/game/labo",
    reward: { nano: 2e3, data: 2e3 },
    done: (p) => {
      var _a;
      return Object.values((_a = p.techLevels) != null ? _a : {}).some((l) => l > 0);
    }
  },
  {
    id: "drones5",
    label: "Poss\xE9der 5 drones r\xE9cup\xE9rateurs",
    hint: "Les drones ouvrent les premi\xE8res missions.",
    to: "/game/unites",
    reward: { scrap: 3e3 },
    done: (p) => count(p, "drone_recuperateur") >= 5
  },
  {
    id: "mission",
    label: "Terminer une mission",
    hint: "Les missions rapportent ressources et XP pendant que tu fais autre chose.",
    to: "/game/missions",
    reward: { scrap: 5e3, energy: 2e3 },
    done: (p) => {
      var _a, _b;
      return ((_b = (_a = p.stats) == null ? void 0 : _a.missions) != null ? _b : 0) >= 1;
    }
  },
  {
    id: "storage2",
    label: "Entrep\xF4t au niveau 2",
    hint: "L'entrep\xF4t augmente ta capacit\xE9 et met une partie du stock \xE0 l'abri des pillards.",
    to: "/game/batiments",
    reward: { scrap: 5e3, energy: 5e3 },
    done: (p) => level2(p, "entrepot") >= 2
  },
  {
    id: "rockets10",
    label: "Installer 10 roquettes",
    hint: "Une premi\xE8re d\xE9fense d\xE9courage les attaques opportunistes.",
    to: "/game/unites",
    reward: { reinforcedSteel: 20 },
    done: (p) => count(p, "roquette") >= 10
  },
  {
    id: "spy",
    label: "Espionner un joueur",
    hint: "Envoie une sonde depuis la Galaxie ou la liste des joueurs avant d'attaquer.",
    to: "/game/galaxie",
    reward: { cyberModule: 30 },
    done: (p) => {
      var _a, _b;
      return ((_b = (_a = p.stats) == null ? void 0 : _a.spies) != null ? _b : 0) >= 1;
    }
  },
  {
    id: "alliance",
    label: "Rejoindre ou cr\xE9er une alliance",
    hint: "Tr\xE9sor commun, recherches partag\xE9es et garnisons : on est plus forts \xE0 plusieurs.",
    to: "/game/alliance",
    reward: { scrap: 1e4, energy: 1e4 },
    done: (p) => !!p.allianceId
  },
  {
    id: "rank",
    label: "Atteindre le rang Fer II",
    hint: "L'XP vient des combats, des b\xE2timents, des recherches et des missions.",
    to: "/game/profil",
    reward: { reinforcedSteel: 50, cyberModule: 50, syntheticNanites: 50, aiFragment: 50 },
    title: ONBOARDING_TITLE,
    done: (p) => {
      var _a;
      return ((_a = p.xp) != null ? _a : 0) >= onboardingRankXp();
    }
  }
];
function onboardingState(p) {
  const raw = p.onboarding;
  const tutorialRaid = (raw == null ? void 0 : raw.tutorialRaid) === "due" || (raw == null ? void 0 : raw.tutorialRaid) === "sent" ? raw.tutorialRaid : void 0;
  return __spreadValues({ claimed: Array.isArray(raw == null ? void 0 : raw.claimed) ? raw.claimed.filter((c) => typeof c === "string") : [], hidden: (raw == null ? void 0 : raw.hidden) === true }, tutorialRaid ? { tutorialRaid } : {});
}
function onboardingEligible(p) {
  var _a;
  const st = onboardingState(p);
  if (st.claimed.length >= ONBOARDING_STEPS.length) return false;
  return st.claimed.length > 0 || ((_a = p.xp) != null ? _a : 0) < onboardingRankXp();
}
function claimOnboarding(player, stepId) {
  var _a, _b, _c, _d, _e, _f;
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) throw new GameActionError("Objectif inconnu.");
  if (!onboardingEligible(player)) throw new GameActionError("La prise en main est termin\xE9e.");
  const st = onboardingState(player);
  if (st.claimed.includes(step.id)) throw new GameActionError("R\xE9compense d\xE9j\xE0 re\xE7ue.");
  if (!step.done(player)) throw new GameActionError("Objectif pas encore atteint.");
  for (const [res, amount3] of Object.entries(step.reward)) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + amount3;
  if (step.title && !((_b = player.titles) != null ? _b : []).some((t) => t.label === step.title)) {
    player.titles = [...(_c = player.titles) != null ? _c : [], { label: step.title, seasonId: "onboarding", rank: 1 }];
    if (!player.activeTitle) player.activeTitle = step.title;
  }
  const claimed = [...st.claimed, step.id];
  const tutorialRaid = (_d = st.tutorialRaid) != null ? _d : step.id === TUTORIAL_RAID.trigger ? "due" : void 0;
  player.onboarding = __spreadValues(__spreadProps(__spreadValues({}, st), { claimed }), tutorialRaid ? { tutorialRaid } : {});
  if (claimed.length >= ONBOARDING_STEPS.length && !((_e = player.titles) != null ? _e : []).some((t) => t.label === TUTORIAL_TITLE)) {
    player.titles = [...(_f = player.titles) != null ? _f : [], { label: TUTORIAL_TITLE, seasonId: "onboarding", rank: 1 }];
  }
  return step.reward;
}
function setOnboardingHidden(player, hidden) {
  player.onboarding = __spreadProps(__spreadValues({}, onboardingState(player)), { hidden });
}

// src/game/retention.ts
var DAY6 = 24 * 36e5;
var ACTIVITY_DAYS_KEPT = 60;
var PRESENCE_WRITE_MS = 2 * 6e4;
var ONLINE_MS = 5 * 6e4;
function lastActivity(p) {
  var _a, _b;
  if (p.lastActiveMs) return p.lastActiveMs;
  const days = (_a = p.stats) == null ? void 0 : _a.activeDays;
  if (days && days.length > 0) return Date.parse(`${days[days.length - 1]}T23:59:00Z`) - 36e5;
  return (_b = p.resourcesUpdatedAtMs) != null ? _b : 0;
}
function parisDay(now) {
  const offsetHours = (parisHour(now) - new Date(now).getUTCHours() + 24) % 24;
  return new Date(now + offsetHours * 36e5).toISOString().slice(0, 10);
}
function dayDiff(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY6);
}
function recordActiveDay(player, now) {
  var _a, _b, _c;
  const day = parisDay(now);
  const days = (_b = (_a = player.stats) == null ? void 0 : _a.activeDays) != null ? _b : [];
  if (days[days.length - 1] === day) return;
  player.stats = __spreadProps(__spreadValues({}, (_c = player.stats) != null ? _c : {}), { activeDays: [...days.filter((d) => d !== day), day].slice(-ACTIVITY_DAYS_KEPT) });
}
var pct3 = (n, total2) => total2 > 0 ? Math.round(n / total2 * 1e3) / 10 : 0;
function computeRetention(players, now) {
  var _a, _b, _c;
  const today = parisDay(now);
  const lastSeen = (p) => Math.min(now, lastActivity(p));
  const days = (p) => {
    var _a2, _b2;
    return new Set((_b2 = (_a2 = p.stats) == null ? void 0 : _a2.activeDays) != null ? _b2 : []);
  };
  const signupDay = (p) => p.createdAtMs ? parisDay(p.createdAtMs) : null;
  const allDays = players.flatMap((p) => {
    var _a2, _b2;
    return (_b2 = (_a2 = p.stats) == null ? void 0 : _a2.activeDays) != null ? _b2 : [];
  }).sort();
  const trackingSince = (_a = allDays[0]) != null ? _a : null;
  const daily = Array.from({ length: 30 }, (_, i) => {
    const day = parisDay(now - (29 - i) * DAY6);
    return {
      day,
      active: players.filter((p) => days(p).has(day)).length,
      signups: players.filter((p) => signupDay(p) === day).length
    };
  });
  const active = {
    d1: players.filter((p) => now - lastSeen(p) < DAY6).length,
    d7: players.filter((p) => now - lastSeen(p) < 7 * DAY6).length,
    d30: players.filter((p) => now - lastSeen(p) < 30 * DAY6).length,
    total: players.length
  };
  const cohorts = Array.from({ length: 6 }, (_, i) => {
    const end = now - i * 7 * DAY6;
    const start = end - 7 * DAY6;
    const members = players.filter((p) => {
      var _a2, _b2;
      return ((_a2 = p.createdAtMs) != null ? _a2 : 0) >= start && ((_b2 = p.createdAtMs) != null ? _b2 : 0) < end;
    });
    const tracked = trackingSince ? members.filter((p) => {
      var _a2;
      return ((_a2 = signupDay(p)) != null ? _a2 : "") >= trackingSince;
    }) : [];
    const d1Eligible = tracked.filter((p) => dayDiff(signupDay(p), today) >= 1);
    const d7Eligible = tracked.filter((p) => dayDiff(signupDay(p), today) >= 7);
    const d1 = d1Eligible.filter((p) => [...days(p)].some((d) => dayDiff(signupDay(p), d) === 1)).length;
    const d7 = d7Eligible.filter((p) => [...days(p)].some((d) => dayDiff(signupDay(p), d) >= 7)).length;
    return {
      week: parisDay(start),
      signups: members.length,
      d1Pct: d1Eligible.length > 0 ? pct3(d1, d1Eligible.length) : null,
      d7Pct: d7Eligible.length > 0 ? pct3(d7, d7Eligible.length) : null,
      activeNowPct: pct3(members.filter((p) => now - lastSeen(p) < 3 * DAY6).length, members.length)
    };
  }).reverse();
  const recent = players.filter((p) => {
    var _a2;
    return now - ((_a2 = p.createdAtMs) != null ? _a2 : 0) < 60 * DAY6;
  });
  const funnel = ONBOARDING_STEPS.map((step) => {
    const reached = recent.filter((p) => {
      try {
        return step.done(p);
      } catch (e3) {
        return false;
      }
    }).length;
    return { id: step.id, label: step.label, reached, pct: pct3(reached, recent.length) };
  });
  const stalled = recent.filter((p) => now - lastSeen(p) >= 3 * DAY6);
  const stopAt = /* @__PURE__ */ new Map();
  for (const p of stalled) {
    const step = ONBOARDING_STEPS.find((s) => {
      try {
        return !s.done(p);
      } catch (e3) {
        return true;
      }
    });
    const key = (_b = step == null ? void 0 : step.id) != null ? _b : "done";
    stopAt.set(key, ((_c = stopAt.get(key)) != null ? _c : 0) + 1);
  }
  const dropoff = [...stopAt.entries()].map(([id, count2]) => {
    var _a2, _b2;
    return { id, label: id === "done" ? "Prise en main termin\xE9e" : (_b2 = (_a2 = ONBOARDING_STEPS.find((s) => s.id === id)) == null ? void 0 : _a2.label) != null ? _b2 : id, count: count2 };
  }).sort((a, b) => b.count - a.count);
  return { trackingSince, daily, active, cohorts, funnel, dropoff, recentPlayers: recent.length };
}

// src/game/allianceBoss.ts
var ALLIANCE_BOSS_RULES = {
  /** Structure : ce facteur × puissance d'attaque des membres actifs (7 j). */
  hpFactor: 2.5,
  minHp: 5e4,
  durationHours: 24,
  cooldownHours: 4,
  flightMinutes: 20,
  /** Coût d'appel : heures de production cumulée de tous les membres. */
  costHours: 3,
  /** Part du coût rendue au trésor si le boss tombe. */
  refundPct: 0.5,
  /** Part minimale des dégâts pour être récompensé. */
  minSharePct: 0.05,
  rewardHours: 2,
  killPoints: 40,
  failPoints: 15
};
var ALLIANCE_BOSSES = [
  { id: "gravhorn", name: "Cuirass\xE9 Gravhorn", image: "/assets/story/gravhorn.webp", lore: "Un cuirass\xE9 du Syndicat, blind\xE9 comme un coffre-fort, venu saisir les dettes de ton alliance." },
  { id: "kesh", name: "Nid-m\xE8re Kesh'Vaar", image: "/assets/bounties/hunters.webp", lore: "Une ruche ren\xE9gate en d\xE9rive : chaque heure, de nouvelles larves \xE9closent dans ses flancs." },
  { id: "confrerie", name: "Croiseur de la Confr\xE9rie", image: "/assets/story/varan.webp", lore: "Un croiseur de Varan, envoy\xE9 pour rayer ton alliance de la Liste. \xC0 coups de canon." }
];
var DAY7 = 24 * 36e5;
var HOUR7 = 36e5;
function allianceWeekId(now) {
  const day = parisDay(now);
  const t = Date.parse(`${day}T00:00:00Z`);
  const dow = new Date(t).getUTCDay();
  return new Date(t - (dow + 6) % 7 * DAY7).toISOString().slice(0, 10);
}
function allianceBossOfWeek(now) {
  const monday = Date.parse(`${allianceWeekId(now)}T00:00:00Z`);
  const index = Math.floor(monday / (7 * DAY7));
  return ALLIANCE_BOSSES[(index % ALLIANCE_BOSSES.length + ALLIANCE_BOSSES.length) % ALLIANCE_BOSSES.length];
}
function allianceBossDef(state) {
  var _a;
  return (_a = ALLIANCE_BOSSES.find((b) => b.id === state.bossId)) != null ? _a : ALLIANCE_BOSSES[0];
}
function normalizeAllianceBoss(raw) {
  var _a, _b, _c;
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (!r.id || !(Number(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs) || 0,
    maxHp: Number(r.maxHp),
    hp: Math.max(0, Number(r.hp) || 0),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
    endedAtMs: Number(r.endedAtMs) || 0,
    rewarded: r.rewarded === true,
    titleHolder: null,
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
    weekId: String((_a = r.weekId) != null ? _a : ""),
    bossId: String((_b = r.bossId) != null ? _b : ALLIANCE_BOSSES[0].id),
    launchedBy: String((_c = r.launchedBy) != null ? _c : ""),
    cost: r.cost && typeof r.cost === "object" ? r.cost : {}
  };
}
function allianceBossCost(members) {
  var _a, _b;
  const cost = {};
  for (const m of members) {
    for (const [res, n] of Object.entries(productionHours(m, ALLIANCE_BOSS_RULES.costHours))) cost[res] = ((_a = cost[res]) != null ? _a : 0) + n;
  }
  for (const k of Object.keys(cost)) cost[k] = Math.ceil((_b = cost[k]) != null ? _b : 0);
  return cost;
}
function allianceBossHp(activeMembers) {
  const power = activeMembers.reduce((a, p) => {
    var _a, _b;
    return a + computeFullPower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]);
  }, 0);
  return Math.max(ALLIANCE_BOSS_RULES.minHp, Math.round(power * ALLIANCE_BOSS_RULES.hpFactor));
}
function canCallAllianceBoss(alliance, uid) {
  var _a;
  return alliance.createdBy === uid || ((_a = alliance.roles) == null ? void 0 : _a[uid]) === "officer";
}
function callAllianceBoss(alliance, previous, members, activeMembers, uid, now) {
  var _a, _b, _c;
  if (!canCallAllianceBoss(alliance, uid)) throw new GameActionError("Seuls le fondateur et les officiers peuvent appeler le boss d'alliance.");
  const weekId2 = allianceWeekId(now);
  if (previous && previous.weekId === weekId2) throw new GameActionError("Le boss d'alliance a d\xE9j\xE0 \xE9t\xE9 appel\xE9 cette semaine (prochain lundi).");
  const cost = allianceBossCost(members);
  const treasury = __spreadValues({}, (_a = alliance.treasury) != null ? _a : {});
  for (const [res, n] of Object.entries(cost)) {
    if (((_b = treasury[res]) != null ? _b : 0) < n) throw new GameActionError("Le tr\xE9sor de l'alliance ne suffit pas pour appeler le boss.");
  }
  for (const [res, n] of Object.entries(cost)) treasury[res] = ((_c = treasury[res]) != null ? _c : 0) - n;
  alliance.treasury = treasury;
  const boss = allianceBossOfWeek(now);
  const maxHp = allianceBossHp(activeMembers);
  const endMs = now + ALLIANCE_BOSS_RULES.durationHours * HOUR7;
  return { id: `ab-${weekId2}`, startMs: now, endMs, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [{ t: now, hp: maxHp }], weekId: weekId2, bossId: boss.id, launchedBy: uid, cost };
}
function checkAllianceBossLaunch(state, uid, pseudo, now) {
  var _a, _b;
  if (!state || state.status !== "active" || now < state.startMs || now >= state.endMs || state.hp <= 0) throw new GameActionError("Aucun boss d'alliance \xE0 combattre en ce moment.");
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + ALLIANCE_BOSS_RULES.cooldownHours * HOUR7 - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 6e4)} min.`);
  return __spreadProps(__spreadValues({}, state), { contributions: __spreadProps(__spreadValues({}, state.contributions), { [uid]: { pseudo, damage: (_a = c == null ? void 0 : c.damage) != null ? _a : 0, assaults: (_b = c == null ? void 0 : c.assaults) != null ? _b : 0, lastLaunchMs: now } }) });
}
function allianceBossRefund(state) {
  if (state.status !== "killed") return {};
  return Object.fromEntries(Object.entries(state.cost).map(([r, n]) => [r, Math.floor((n != null ? n : 0) * ALLIANCE_BOSS_RULES.refundPct)]));
}
function grantAllianceBossReward(state, player, now, random = Math.random) {
  var _a, _b, _c, _d;
  const ranking = leviathanRanking(state);
  const total2 = ranking.reduce((a, c) => a + c.damage, 0);
  const mine = (_b = (_a = state.contributions[player.uid]) == null ? void 0 : _a.damage) != null ? _b : 0;
  if (!(mine > 0)) return { points: 0, gain: {} };
  if (state.status !== "killed") {
    addPassPoints(player, "allianceBossTry", now);
    return { points: ALLIANCE_BOSS_RULES.failPoints, gain: {} };
  }
  if (mine < total2 * ALLIANCE_BOSS_RULES.minSharePct) {
    addPassPoints(player, "allianceBossTry", now);
    return { points: ALLIANCE_BOSS_RULES.failPoints, gain: {} };
  }
  addPassPoints(player, "allianceBoss", now);
  const gain = productionHours(player, ALLIANCE_BOSS_RULES.rewardHours);
  for (const [res, n] of Object.entries(gain)) player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) + n;
  if (((_d = ranking[0]) == null ? void 0 : _d.uid) === player.uid) {
    const item = rollRelic("allianceBoss", now, random, "rare");
    if (addRelic(player, item)) return { points: ALLIANCE_BOSS_RULES.killPoints, gain, relic: relicLabel(item) };
  }
  return { points: ALLIANCE_BOSS_RULES.killPoints, gain };
}

// src/game/expeditions.ts
var EXPEDITION_RULES = {
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
  tollHours: 1
};
var between = (min, max, random) => min + (max - min) * random();
var sum2 = (r) => Object.values(r).reduce((a, b) => a + (b != null ? b : 0), 0);
function addLoot(fleet, gain) {
  var _a, _b;
  const loot = __spreadValues({}, (_a = fleet.loot) != null ? _a : {});
  for (const [res, n] of Object.entries(gain)) if (n > 0) loot[res] = ((_b = loot[res]) != null ? _b : 0) + Math.floor(n);
  fleet.loot = loot;
}
function fleetShips(units) {
  return Object.entries(units).reduce((a, [id, n]) => a + (id === "sonde_espionnage" ? 0 : n), 0);
}
function launchExpedition(owner, raw, hoursIn, active, today, now, formation) {
  var _a, _b;
  const hours2 = Number(hoursIn);
  if (!EXPEDITION_RULES.durations.includes(hours2)) throw new GameActionError(`Dur\xE9e d'exp\xE9dition invalide (${EXPEDITION_RULES.durations.join(", ")} h).`);
  if (active > 0) throw new GameActionError("Une exp\xE9dition est d\xE9j\xE0 en cours.");
  if (today >= EXPEDITION_RULES.maxPerDay) throw new GameActionError(`Limite de ${EXPEDITION_RULES.maxPerDay} exp\xE9ditions par jour atteinte.`);
  const units = {};
  for (const [id, v] of Object.entries(raw != null ? raw : {})) {
    const qty = Math.floor(Number(v));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(id) || id === "sonde_espionnage") throw new GameActionError("Seuls les vaisseaux de combat et de transport partent en exp\xE9dition.");
    if (((_b = (_a = owner.units[id]) == null ? void 0 : _a.count) != null ? _b : 0) < qty) throw new GameActionError("Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte.");
    units[id] = qty;
  }
  if (fleetShips(units) < EXPEDITION_RULES.minShips) throw new GameActionError(`Il faut au moins ${EXPEDITION_RULES.minShips} vaisseaux pour une exp\xE9dition.`);
  for (const [id, qty] of Object.entries(units)) owner.units[id] = __spreadProps(__spreadValues({}, owner.units[id]), { count: owner.units[id].count - qty });
  const durationMs = hours2 * 36e5;
  return {
    attacker: owner,
    fleet: {
      ownerUid: owner.uid,
      ownerPseudo: owner.pseudo,
      targetUid: owner.uid,
      targetPseudo: "Exp\xE9dition",
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
      expedition: { hours: hours2, log: [], pending: null, formation: formation != null ? formation : "balanced" }
    }
  };
}
function pickEvent(random) {
  const entries = Object.entries(EXPEDITION_RULES.weights);
  const total2 = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
  let roll = random() * total2;
  for (const [k, w] of entries) {
    roll -= Math.max(0, w);
    if (roll < 0) return k;
  }
  return "nothing";
}
function fightFleet(player, fleet, ratio) {
  var _a;
  const fleetPower = computeFleetPower(player.units, player.techLevels, fleet.units, ["attack"]);
  const fx = formationEffects(fleet.expedition.formation);
  const combat = resolveCombat(__spreadProps(__spreadValues({}, fx), {
    attackFactor: fx.attackFactor * (1 + playerModifiers(player).attack),
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet: fleet.units,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: Math.max(1, Math.round(fleetPower * ratio))
  }));
  let lost = 0;
  const units = __spreadValues({}, fleet.units);
  for (const [id, n] of Object.entries(combat.attackerLosses)) {
    units[id] = Math.max(0, ((_a = units[id]) != null ? _a : 0) - n);
    lost += n;
  }
  fleet.units = units;
  return { won: combat.outcome === "attacker_win", lost };
}
function rollExpeditionEvent(player, fleet, stage, now, random) {
  const R = EXPEDITION_RULES;
  const kind = pickEvent(random);
  let text = "";
  if (kind === "nothing") {
    text = "Calme plat : rien d'int\xE9ressant dans ce secteur.";
  } else if (kind === "deposit") {
    const gain = productionHours(player, between(R.depositMinHours, R.depositMaxHours, random));
    addLoot(fleet, gain);
    text = `Gisement rep\xE9r\xE9 et exploit\xE9 : ${describeGain(gain)}.`;
  } else if (kind === "rare") {
    const value = sum2(productionHours(player, between(R.rareMinHours, R.rareMaxHours, random)));
    const each = Math.max(1, Math.floor(value / Math.max(1, R.rareRate) / 4));
    const gain = { reinforcedSteel: each, cyberModule: each, syntheticNanites: each, aiFragment: each };
    addLoot(fleet, gain);
    text = `Tr\xE9sor rare dans une station abandonn\xE9e : ${describeGain(gain)}.`;
  } else if (kind === "wreck") {
    const pct5 = between(R.wreckMinPct, R.wreckMaxPct, random);
    const found = {};
    for (const [id, n] of Object.entries(fleet.units)) {
      const extra = Math.floor(n * pct5);
      if (extra > 0) found[id] = extra;
    }
    if (Object.keys(found).length === 0) {
      const first = Object.keys(fleet.units)[0];
      if (first) found[first] = 1;
    }
    fleet.units = Object.fromEntries(Object.entries(fleet.units).map(([id, n]) => {
      var _a;
      return [id, n + ((_a = found[id]) != null ? _a : 0)];
    }));
    text = `\xC9pave remise en \xE9tat : ${Object.entries(found).map(([id, n]) => {
      var _a, _b;
      return `${n} ${(_b = (_a = findUnit(id)) == null ? void 0 : _a.name) != null ? _b : id}`;
    }).join(", ")} rejoignent la flotte.`;
  } else if (kind === "ambush") {
    const { won, lost } = fightFleet(player, fleet, between(R.ambushMinPower, R.ambushMaxPower, random));
    if (won) {
      const gain = productionHours(player, R.victoryLootHours);
      addLoot(fleet, gain);
      text = `Embuscade repouss\xE9e (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Butin : ${describeGain(gain)}.`;
    } else {
      text = `Embuscade ! La flotte a d\xFB fuir (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}).`;
    }
  } else {
    const faction = FACTIONS.length > 0 ? FACTIONS[Math.floor(random() * FACTIONS.length) % FACTIONS.length] : null;
    if (!faction) {
      text = "Des signaux lointains, puis plus rien.";
    } else {
      const toll = productionHours(player, R.tollHours);
      fleet.expedition.pending = { stage, factionId: faction.id, deadlineMs: now + R.choiceMinutes * 6e4, toll };
      text = `${faction.name} barre la route et exige un p\xE9age de ${describeGain(toll)}.`;
      fleet.expedition.log = [...fleet.expedition.log, { stage, atMs: now, kind, text }];
      return { text, pending: true };
    }
  }
  fleet.expedition.log = [...fleet.expedition.log, { stage, atMs: now, kind, text }];
  return { text, pending: false };
}
function resolveExpeditionChoice(player, fleet, choiceIn, now, random) {
  var _a, _b;
  const pending = fleet.expedition.pending;
  if (!pending) throw new GameActionError("Aucune d\xE9cision en attente pour cette exp\xE9dition.");
  const choice = choiceIn === "force" ? "force" : "toll";
  const faction = FACTIONS.find((f) => f.id === pending.factionId);
  const name = (_a = faction == null ? void 0 : faction.name) != null ? _a : "La faction";
  let text;
  const st = faction ? pirateState(player, faction.id) : null;
  if (choice === "toll") {
    const paid = {};
    for (const [res, n] of Object.entries(pending.toll)) {
      const take = Math.min(n, Math.max(0, Math.floor((_b = player.resources[res]) != null ? _b : 0)));
      if (take > 0) {
        player.resources[res] -= take;
        paid[res] = take;
      }
    }
    if (st) st.notoriety = Math.max(0, st.notoriety - 1);
    text = `P\xE9age pay\xE9 \xE0 ${name} (${describeGain(paid)}) : la flotte passe, et ta r\xE9putation s'am\xE9liore.`;
  } else {
    const { won, lost } = fightFleet(player, fleet, between(EXPEDITION_RULES.forceMinPower, EXPEDITION_RULES.forceMaxPower, random));
    if (st && faction) st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    if (won) {
      const gain = productionHours(player, EXPEDITION_RULES.victoryLootHours);
      addLoot(fleet, gain);
      text = `Passage forc\xE9 face \xE0 ${name} (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Butin : ${describeGain(gain)}. Ta notori\xE9t\xE9 grimpe.`;
    } else {
      text = `${name} a repouss\xE9 la flotte (${lost} vaisseau${lost > 1 ? "x" : ""} perdu${lost > 1 ? "s" : ""}). Ta notori\xE9t\xE9 grimpe.`;
    }
  }
  if (st && faction) setFactionState(player, faction.id, st);
  fleet.expedition.log = [...fleet.expedition.log, { stage: pending.stage, atMs: now, kind: "faction", text, choice }];
  fleet.expedition.pending = null;
  return text;
}
function finishExpedition(player, fleet, now, random = Math.random) {
  var _a;
  const xp = Math.round(fleet.expedition.hours * EXPEDITION_RULES.xpPerHour);
  applyXpDelta(player, xp, now);
  bumpStat(player, "expeditions");
  let relic = "";
  if (random() < expeditionRelicChance(fleet.expedition.hours)) {
    const item = rollRelic("expedition", now, random);
    if (addRelic(player, item)) relic = ` Relique trouv\xE9e : ${relicLabel(item)} !`;
  }
  return {
    kind: "fleet",
    title: relic ? "Exp\xE9dition termin\xE9e : relique !" : "Exp\xE9dition termin\xE9e",
    message: `Ta flotte est rentr\xE9e : ${describeGain((_a = fleet.loot) != null ? _a : {})} et +${xp} XP.${relic}`,
    createdAtMs: now,
    read: false
  };
}

// src/game/seasonWars.ts
var SEASON_WAR_RULES = {
  powerPerPoint: 1e4,
  sectorPoints: 50,
  /** Heures de production des membres versées au trésor, 1er à 3e. */
  rewardHours: [48, 24, 12],
  titles: ["Conqu\xE9rants de la saison", "Strat\xE8ges de la saison", "V\xE9t\xE9rans de la saison"]
};
var WAR_CHEST_RULES = {
  depositPct: 0.1,
  capDays: 30,
  shieldHours: 2,
  shieldCostHours: 4
};
function readWarChest(raw) {
  var _a, _b;
  const c = raw && typeof raw === "object" ? raw : {};
  return { resources: __spreadValues({}, (_a = c.resources) != null ? _a : {}), cap: __spreadValues({}, (_b = c.cap) != null ? _b : {}) };
}
function depositWarChest(chest, treasuryBonus) {
  var _a, _b;
  const added = {};
  for (const [res, n] of Object.entries(treasuryBonus)) {
    const part = Math.floor((n != null ? n : 0) * WAR_CHEST_RULES.depositPct);
    if (part <= 0) continue;
    const cap = Math.max((_a = chest.cap[res]) != null ? _a : 0, part * WAR_CHEST_RULES.capDays);
    chest.cap[res] = cap;
    const before = (_b = chest.resources[res]) != null ? _b : 0;
    const after = Math.min(cap, before + part);
    chest.resources[res] = after;
    if (after > before) added[res] = after - before;
  }
  return added;
}
function spend(chest, cost, what) {
  var _a, _b;
  for (const [res, n] of Object.entries(cost)) {
    if (((_a = chest.resources[res]) != null ? _a : 0) < (n != null ? n : 0)) throw new GameActionError(`Coffre de guerre insuffisant pour ${what} : il faut ${formatInt(n != null ? n : 0)} ${res}.`);
  }
  for (const [res, n] of Object.entries(cost)) chest.resources[res] = ((_b = chest.resources[res]) != null ? _b : 0) - (n != null ? n : 0);
}
function payWarFromChest(chest, cost) {
  spend(chest, cost, "d\xE9clarer la guerre");
}
function chestShieldCost(member) {
  var _a, _b;
  const prod = productionHours(member, WAR_CHEST_RULES.shieldCostHours);
  const out = {};
  for (const r of COMMON_RESOURCES2) if (((_a = prod[r]) != null ? _a : 0) > 0) out[r] = Math.ceil((_b = prod[r]) != null ? _b : 0);
  return out;
}
function grantChestShield(chest, member, now) {
  const cost = chestShieldCost(member);
  spend(chest, cost, "ce bouclier");
  const st = bountyState(member);
  st.shieldUntilMs = Math.max(st.shieldUntilMs, now) + WAR_CHEST_RULES.shieldHours * 36e5;
  member.bounties = st;
  return { cost, untilMs: st.shieldUntilMs };
}
function addSeasonPower(player, amount3, now) {
  var _a, _b;
  if (!(amount3 > 0)) return;
  const stats = (_a = player.stats) != null ? _a : {};
  const season = currentSeasonId(now);
  if (stats.seasonPowerId !== season) {
    stats.seasonPowerId = season;
    stats.seasonPower = 0;
  }
  stats.seasonPower = ((_b = stats.seasonPower) != null ? _b : 0) + Math.round(amount3);
  player.stats = stats;
}
function seasonPowerOf(player, seasonId) {
  var _a;
  const s = player.stats;
  return (s == null ? void 0 : s.seasonPowerId) === seasonId ? (_a = s.seasonPower) != null ? _a : 0 : 0;
}
function seasonWarPoints(wars, seasonId) {
  var _a, _b, _c, _d;
  const out = {};
  for (const w of wars) {
    if (w.seasonId !== seasonId) continue;
    out[w.attackerId] = ((_a = out[w.attackerId]) != null ? _a : 0) + ((_b = w.scoreAttacker) != null ? _b : 0);
    out[w.defenderId] = ((_c = out[w.defenderId]) != null ? _c : 0) + ((_d = w.scoreDefender) != null ? _d : 0);
  }
  return out;
}
function seasonWarStandings(input) {
  const ids = new Set([...Object.keys(input.warPoints), ...Object.keys(input.power), ...Object.keys(input.sectors)].filter(Boolean));
  return [...ids].map((allianceId) => {
    var _a, _b, _c;
    const warPoints = (_a = input.warPoints[allianceId]) != null ? _a : 0;
    const power = (_b = input.power[allianceId]) != null ? _b : 0;
    const powerPoints = Math.floor(power / SEASON_WAR_RULES.powerPerPoint);
    const sectors = (_c = input.sectors[allianceId]) != null ? _c : 0;
    return { allianceId, warPoints, power, powerPoints, sectors, score: warPoints + powerPoints + sectors * SEASON_WAR_RULES.sectorPoints, rank: 0 };
  }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score || (a.allianceId < b.allianceId ? -1 : 1)).map((s, i) => __spreadProps(__spreadValues({}, s), { rank: i + 1 }));
}

// src/game/wars.ts
var WAR_RULES = {
  minMembers: 3,
  costScrap: 5e6,
  costEnergy: 5e6,
  prepHours: 12,
  durationHours: 72,
  /** Délai avant de refaire la guerre au même adversaire (jours après la fin). */
  pairCooldownDays: 7,
  /** Délai entre deux attaques d'un joueur sur une même cible, pendant la guerre (h). */
  attackCooldownHours: 1,
  pointsAttackWin: 3,
  pointsDefenseWin: 2,
  /** 1 point par tranche de butin. */
  lootPerPoint: 1e7,
  rewardScrap: 2e7,
  rewardEnergy: 2e7,
  /** Bonus sur le score de saison d'alliance du vainqueur (0,1 = +10 %). */
  seasonBonusPct: 0.1,
  title: "Vainqueurs",
  titleDays: 7
};
var HOUR8 = 36e5;
function warStatusAt(war, now) {
  if (war.status === "ended") return "ended";
  if (now < war.startMs) return "preparing";
  if (now < war.endMs) return "active";
  return "ended";
}
function isRunning(war, now) {
  return warStatusAt(war, now) !== "ended";
}
function activeWarBetween(wars, a, b, now) {
  var _a;
  if (!a || !b || a === b) return null;
  return (_a = wars.find((w) => warStatusAt(w, now) === "active" && (w.attackerId === a && w.defenderId === b || w.attackerId === b && w.defenderId === a))) != null ? _a : null;
}
function sideOf(war, allianceId) {
  return war.attackerId === allianceId ? "attacker" : war.defenderId === allianceId ? "defender" : null;
}
function declareWar(input) {
  var _a, _b, _c, _d, _e, _f;
  const { own, target, now } = input;
  const role = allianceRole(own, input.actorUid);
  if (!canDiplomacy(role)) throw new GameActionError("Seuls le fondateur, les officiers et les diplomates peuvent d\xE9clarer une guerre.");
  if (own.id === target.id) throw new GameActionError("Tu ne peux pas d\xE9clarer la guerre \xE0 ta propre alliance.");
  if (((_a = target.members) != null ? _a : []).length < WAR_RULES.minMembers) throw new GameActionError(`Cette alliance compte moins de ${WAR_RULES.minMembers} membres.`);
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === own.id || w.defenderId === own.id))) throw new GameActionError("Ton alliance est d\xE9j\xE0 en guerre.");
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === target.id || w.defenderId === target.id))) throw new GameActionError(`[${target.tag}] est d\xE9j\xE0 en guerre.`);
  const lastPair = input.wars.filter((w) => w.attackerId === own.id && w.defenderId === target.id || w.attackerId === target.id && w.defenderId === own.id).reduce((a, w) => Math.max(a, w.endedAtMs || w.endMs), 0);
  const wait = lastPair + WAR_RULES.pairCooldownDays * 24 * HOUR8 - now;
  if (lastPair > 0 && wait > 0) throw new GameActionError(`Derni\xE8re guerre contre [${target.tag}] trop r\xE9cente : encore ${Math.ceil(wait / (24 * HOUR8))} jour(s).`);
  const treasury = __spreadValues({}, (_b = own.treasury) != null ? _b : {});
  const chest = input.chest ? { resources: __spreadValues({}, input.chest.resources), cap: __spreadValues({}, input.chest.cap) } : null;
  if (chest) {
    payWarFromChest(chest, { scrap: WAR_RULES.costScrap, energy: WAR_RULES.costEnergy });
  } else {
    if (((_c = treasury.scrap) != null ? _c : 0) < WAR_RULES.costScrap || ((_d = treasury.energy) != null ? _d : 0) < WAR_RULES.costEnergy) {
      throw new GameActionError(`Il faut ${formatInt(WAR_RULES.costScrap)} ferraille et ${formatInt(WAR_RULES.costEnergy)} \xE9nergie dans le tr\xE9sor.`);
    }
    treasury.scrap = ((_e = treasury.scrap) != null ? _e : 0) - WAR_RULES.costScrap;
    treasury.energy = ((_f = treasury.energy) != null ? _f : 0) - WAR_RULES.costEnergy;
  }
  const startMs = now + WAR_RULES.prepHours * HOUR8;
  return {
    own: __spreadProps(__spreadValues({}, own), { treasury }),
    chest,
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
      endMs: startMs + WAR_RULES.durationHours * HOUR8,
      status: "preparing",
      scoreAttacker: 0,
      scoreDefender: 0,
      log: [{ atMs: now, text: `${input.actorPseudo} d\xE9clare la guerre \xE0 [${target.tag}] ${target.name}.` }],
      winnerId: "",
      surrenderedBy: "",
      endedAtMs: 0,
      rewarded: false,
      seasonId: "",
      titleUntilMs: 0
    }
  };
}
function scoreBattle(war, attackerAllianceId, attackerPseudo, defenderPseudo, outcome, lootTotal, now) {
  const side = sideOf(war, attackerAllianceId);
  if (!side || warStatusAt(war, now) !== "active") return war;
  const other = side === "attacker" ? "defender" : "attacker";
  let points = 0;
  let to = side;
  let text = "";
  if (outcome === "attacker_win") {
    points = WAR_RULES.pointsAttackWin + Math.floor(Math.max(0, lootTotal) / WAR_RULES.lootPerPoint);
    text = `${attackerPseudo} l'emporte contre ${defenderPseudo} (+${points}).`;
  } else if (outcome === "defender_win") {
    points = WAR_RULES.pointsDefenseWin;
    to = other;
    text = `${defenderPseudo} repousse ${attackerPseudo} (+${points}).`;
  } else return war;
  const next = __spreadProps(__spreadValues({}, war), { log: [...war.log, { atMs: now, text }].slice(-100) });
  if (to === "attacker") next.scoreAttacker += points;
  else next.scoreDefender += points;
  return next;
}
function surrender(war, alliance, actorUid, actorPseudo, now) {
  const side = sideOf(war, alliance.id);
  if (!side) throw new GameActionError("Ton alliance ne participe pas \xE0 cette guerre.");
  if (!isRunning(war, now)) throw new GameActionError("Cette guerre est termin\xE9e.");
  const role = allianceRole(alliance, actorUid);
  if (!canDiplomacy(role)) throw new GameActionError("Seuls le fondateur, les officiers et les diplomates peuvent se rendre.");
  const winnerId = side === "attacker" ? war.defenderId : war.attackerId;
  return __spreadProps(__spreadValues({}, war), { status: "ended", winnerId, surrenderedBy: alliance.id, endedAtMs: now, log: [...war.log, { atMs: now, text: `${actorPseudo} rend les armes au nom de [${alliance.tag}].` }] });
}
function concludeWar(war, now) {
  if (war.status === "ended" || now < war.endMs) return war;
  const winnerId = war.scoreAttacker > war.scoreDefender ? war.attackerId : war.scoreDefender > war.scoreAttacker ? war.defenderId : "";
  const text = winnerId ? `Fin de la guerre : victoire de [${winnerId === war.attackerId ? war.attackerTag : war.defenderTag}] (${war.scoreAttacker} \u2013 ${war.scoreDefender}).` : `Fin de la guerre : \xE9galit\xE9 (${war.scoreAttacker} \u2013 ${war.scoreDefender}).`;
  return __spreadProps(__spreadValues({}, war), { status: "ended", winnerId, endedAtMs: now, log: [...war.log, { atMs: now, text }] });
}
function warTreasuryReward(alliance) {
  var _a, _b, _c;
  const treasury = __spreadValues({}, (_a = alliance.treasury) != null ? _a : {});
  treasury.scrap = ((_b = treasury.scrap) != null ? _b : 0) + WAR_RULES.rewardScrap;
  treasury.energy = ((_c = treasury.energy) != null ? _c : 0) + WAR_RULES.rewardEnergy;
  return __spreadProps(__spreadValues({}, alliance), { treasury });
}
function warSeasonBonuses(wars, seasonId) {
  var _a;
  const out = {};
  for (const w of wars) if (w.winnerId && w.seasonId === seasonId) out[w.winnerId] = ((_a = out[w.winnerId]) != null ? _a : 0) + WAR_RULES.seasonBonusPct;
  return out;
}

// src/game/pvp.ts
var PVP_RULES = {
  /** Délai minimal entre deux attaques d'un même joueur sur la même cible. */
  attackCooldownMs: 2 * 60 * 60 * 1e3,
  /** Bouclier : plus personne ne peut attaquer un joueur battu en défense. */
  shieldAfterDefeatMs: 60 * 60 * 1e3,
  /** Protection débutant (levée dès que le joueur attaque lui-même). */
  newbieProtectionMs: 72 * 60 * 60 * 1e3,
  /** v3.4 : bouclier après une ascension. */
  ascensionShieldMs: 72 * 60 * 60 * 1e3,
  /** Impossible d'attaquer un joueur N fois moins expérimenté… */
  maxXpRatio: 3,
  /** …une fois qu'on a soi-même au moins cette XP (sinon tout le monde se
   *  bloquerait mutuellement en début de partie). */
  xpGapFloor: 500,
  /** Perte d'XP maximale en défense sur 24 h glissantes. */
  defenseXpLossCapPer24h: 60,
  defenseXpLossWindowMs: 24 * 60 * 60 * 1e3
};
function clamp2(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function computeCombatXp(outcome, attackerPower, defenderPower) {
  const att = Math.max(attackerPower, 0);
  const def3 = Math.max(defenderPower, 0);
  if (outcome === "attacker_win") {
    const ratio = att > 0 ? def3 / att : 0;
    return {
      attackerXp: Math.round(40 * clamp2(ratio, 0.1, 2)),
      defenderXp: -Math.round(clamp2(20 * ratio, 5, 20))
    };
  }
  if (outcome === "defender_win") {
    const ratio = def3 > 0 ? att / def3 : 0;
    return {
      attackerXp: -20,
      defenderXp: Math.round(40 * clamp2(ratio, 0.5, 1.5))
    };
  }
  return { attackerXp: 5, defenderXp: 5 };
}
function capDefenderXpLoss(defenderXp, alreadyLost) {
  if (defenderXp >= 0) return defenderXp;
  const remaining = Math.max(0, PVP_RULES.defenseXpLossCapPer24h - alreadyLost);
  return -Math.min(-defenderXp, remaining);
}
function formatWait(ms) {
  const minutes = Math.ceil(ms / 6e4);
  if (minutes < 60) return `${minutes} min`;
  const hours2 = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours2} h ${rest} min` : `${hours2} h`;
}
function checkAttackAllowed(ctx) {
  var _a;
  const { now } = ctx;
  if (ctx.attackerUid === ctx.defenderUid) {
    return { allowed: false, reason: "self", message: "Tu ne peux pas t'attaquer toi-m\xEAme !" };
  }
  if (ctx.defenderCreatedAtMs && !ctx.defenderHasAttacked) {
    const until = ctx.defenderCreatedAtMs + PVP_RULES.newbieProtectionMs;
    if (now < until) {
      return {
        allowed: false,
        reason: "newbie",
        until,
        message: `Ce joueur d\xE9bute : il est prot\xE9g\xE9 encore ${formatWait(until - now)}.`
      };
    }
  }
  if (ctx.defenderVacationUntilMs && now < ctx.defenderVacationUntilMs) {
    return { allowed: false, reason: "shield", until: ctx.defenderVacationUntilMs, message: `Ce joueur est en vacances encore ${formatWait(ctx.defenderVacationUntilMs - now)}.` };
  }
  if (ctx.lastDefenderDefeatMs !== null && !ctx.defenderIsWarlord) {
    const until = ctx.lastDefenderDefeatMs + PVP_RULES.shieldAfterDefeatMs;
    if (now < until) {
      return {
        allowed: false,
        reason: "shield",
        until,
        message: `Ce joueur vient d'\xEAtre battu : bouclier actif encore ${formatWait(until - now)}.`
      };
    }
  }
  if (ctx.defenderShieldUntilMs && now < ctx.defenderShieldUntilMs) {
    const until = ctx.defenderShieldUntilMs;
    return { allowed: false, reason: "shield", until, message: `Ce joueur est sous un Voile de chitine encore ${formatWait(until - now)}.` };
  }
  if (ctx.defenderAscendedAtMs) {
    const until = ctx.defenderAscendedAtMs + PVP_RULES.ascensionShieldMs;
    if (now < until) {
      return { allowed: false, reason: "shield", until, message: `Ce joueur vient de s'\xE9lever : bouclier d'ascension encore ${formatWait(until - now)}.` };
    }
  }
  if (ctx.lastAttackOnTargetMs !== null) {
    const until = ctx.lastAttackOnTargetMs + ((_a = ctx.attackCooldownMs) != null ? _a : PVP_RULES.attackCooldownMs);
    if (now < until) {
      return {
        allowed: false,
        reason: "cooldown",
        until,
        message: `Tu as d\xE9j\xE0 attaqu\xE9 ce joueur r\xE9cemment : r\xE9essaie dans ${formatWait(until - now)}.`
      };
    }
  }
  if (ctx.attackerXp >= PVP_RULES.xpGapFloor && ctx.defenderXp * PVP_RULES.maxXpRatio < ctx.attackerXp) {
    return {
      allowed: false,
      reason: "too_weak",
      message: `Ce joueur est trop faible pour toi (moins d'un tiers de ton XP).`
    };
  }
  return { allowed: true };
}

// src/game/market.ts
var MARKET_RULES = {
  /** Taxe sur ce que reçoit le vendeur (0,05 = 5 %), retirée du jeu. */
  taxPct: 0.05,
  /** Taxe entre membres d'une même alliance. */
  allianceTaxPct: 0.02,
  /** Offres ouvertes par joueur. */
  maxOpenOffers: 5,
  /** Offres acceptées par joueur et par jour (UTC). */
  maxBuysPerDay: 20,
  /** Durée de vie d'une offre (h) ; à l'expiration, le vendeur est remboursé. */
  offerHours: 48,
  /** Écart maximal au taux du comptoir, dans un sens comme dans l'autre (×). */
  priceBand: 3,
  /** v5.5 : Courtier du Comptoir (marchand PNJ), voir marketMaker.ts. */
  makerEnabled: true,
  /** Offres ouvertes des joueurs en dessous desquelles il intervient (par ressource et par sens). */
  makerMinOffers: 2,
  /** Écart au taux du comptoir (0,12 = vend 12 % plus cher, achète 12 % moins cher). */
  makerSpread: 0.12,
  /** Taille d'une offre : heures de production commune médiane des joueurs actifs. */
  makerSizeHours: 2
};
var RESOURCE_IDS2 = new Set(RESOURCE_LIST.map((r) => r.id));
var label = (res) => {
  var _a, _b;
  return (_b = (_a = RESOURCE_LIST.find((r) => r.id === res)) == null ? void 0 : _a.name.toLowerCase()) != null ? _b : res;
};
function amount(raw, what) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 1e13) throw new GameActionError(`${what} invalide.`);
  return n;
}
function priceBounds(giveRes, giveAmount, wantRes) {
  const reference = giveAmount * getTradeRate(giveRes, wantRes);
  const band = Math.max(1, MARKET_RULES.priceBand);
  return { min: Math.max(1, Math.ceil(reference / band)), max: Math.floor(reference * band), reference: Math.round(reference) };
}
function marketTax(wantAmount, sameAlliance) {
  return Math.floor(wantAmount * (sameAlliance ? MARKET_RULES.allianceTaxPct : MARKET_RULES.taxPct));
}
function createOffer(seller, input, openOffers, now) {
  var _a, _b, _c;
  const giveRes = String((_a = input.giveRes) != null ? _a : "");
  const wantRes = String((_b = input.wantRes) != null ? _b : "");
  if (!RESOURCE_IDS2.has(giveRes) || !RESOURCE_IDS2.has(wantRes)) throw new GameActionError("Ressource inconnue.");
  if (giveRes === wantRes) throw new GameActionError("Choisis deux ressources diff\xE9rentes.");
  const giveAmount = amount(input.giveAmount, "Quantit\xE9 propos\xE9e");
  const wantAmount = amount(input.wantAmount, "Quantit\xE9 demand\xE9e");
  if (openOffers >= MARKET_RULES.maxOpenOffers) throw new GameActionError(`Tu as d\xE9j\xE0 ${MARKET_RULES.maxOpenOffers} offres ouvertes : annule-en une ou attends qu'elles partent.`);
  const { min, max } = priceBounds(giveRes, giveAmount, wantRes);
  if (wantAmount < min || wantAmount > max) {
    throw new GameActionError(`Prix hors limites : pour ${formatInt(giveAmount)} ${label(giveRes)}, demande entre ${formatInt(min)} et ${formatInt(max)} ${label(wantRes)}.`);
  }
  if (((_c = seller.resources[giveRes]) != null ? _c : 0) < giveAmount) throw new GameActionError(`Pas assez de ${label(giveRes)}.`);
  seller.resources[giveRes] -= giveAmount;
  const kind = input.kind === "buy" ? "buy" : "sell";
  return { kind, giveRes, giveAmount, wantRes, wantAmount, expiresAtMs: now + MARKET_RULES.offerHours * 36e5 };
}
function acceptOffer(offer, buyer, seller, buysToday, now) {
  var _a, _b, _c, _d;
  if (offer.status !== "open" || now >= offer.expiresAtMs) throw new GameActionError("Cette offre n'est plus disponible.");
  if (offer.sellerId === buyer.uid) throw new GameActionError("Tu ne peux pas accepter ta propre offre.");
  if (buysToday >= MARKET_RULES.maxBuysPerDay) throw new GameActionError(`Limite de ${MARKET_RULES.maxBuysPerDay} achats par jour atteinte.`);
  if (((_a = buyer.resources[offer.wantRes]) != null ? _a : 0) < offer.wantAmount) throw new GameActionError(`Pas assez de ${label(offer.wantRes)} pour cette offre.`);
  const sameAlliance = !!offer.sellerAllianceId && offer.sellerAllianceId === ((_b = buyer.allianceId) != null ? _b : "");
  const tax = marketTax(offer.wantAmount, sameAlliance);
  buyer.resources[offer.wantRes] -= offer.wantAmount;
  buyer.resources[offer.giveRes] = ((_c = buyer.resources[offer.giveRes]) != null ? _c : 0) + offer.giveAmount;
  seller.resources[offer.wantRes] = ((_d = seller.resources[offer.wantRes]) != null ? _d : 0) + offer.wantAmount - tax;
  bumpStat(buyer, "marketTrades");
  bumpStat(seller, "marketTrades");
  bumpStat(seller, "marketTax", tax);
  bumpStat(buyer, "marketVolume", offer.giveAmount);
  recordChronicle(buyer, "market", now);
  bumpStat(seller, "marketVolume", offer.wantAmount - tax);
  grantCommanderXp(buyer, "steward", COMMANDER_XP.marketTrade);
  grantCommanderXp(seller, "steward", COMMANDER_XP.marketTrade);
  return { tax, sameAlliance };
}
function buyOrderPaid(order, filled) {
  return Math.floor(order.giveAmount * Math.min(filled, order.wantAmount) / order.wantAmount);
}
function offerReserved(offer) {
  var _a;
  return offer.kind === "buy" ? offer.giveAmount - buyOrderPaid(offer, (_a = offer.filled) != null ? _a : 0) : offer.giveAmount;
}
function fillBuyOrder(order, supplier, owner, qtyRaw, buysToday, now) {
  var _a, _b, _c, _d, _e;
  if (order.status !== "open" || now >= order.expiresAtMs) throw new GameActionError("Cet ordre d'achat n'est plus disponible.");
  if (order.sellerId === supplier.uid) throw new GameActionError("Tu ne peux pas remplir ton propre ordre.");
  if (buysToday >= MARKET_RULES.maxBuysPerDay) throw new GameActionError(`Limite de ${MARKET_RULES.maxBuysPerDay} \xE9changes par jour atteinte.`);
  const already = (_a = order.filled) != null ? _a : 0;
  const remaining = order.wantAmount - already;
  const qty = Math.min(remaining, amount(qtyRaw != null ? qtyRaw : remaining, "Quantit\xE9 livr\xE9e"));
  if (((_b = supplier.resources[order.wantRes]) != null ? _b : 0) < qty) throw new GameActionError(`Pas assez de ${label(order.wantRes)} pour livrer.`);
  const filled = already + qty;
  const payment = buyOrderPaid(order, filled) - buyOrderPaid(order, already);
  if (payment <= 0) throw new GameActionError("Quantit\xE9 trop faible : livre davantage pour \xEAtre pay\xE9.");
  const sameAlliance = !!order.sellerAllianceId && order.sellerAllianceId === ((_c = supplier.allianceId) != null ? _c : "");
  const tax = marketTax(qty, sameAlliance);
  supplier.resources[order.wantRes] -= qty;
  supplier.resources[order.giveRes] = ((_d = supplier.resources[order.giveRes]) != null ? _d : 0) + payment;
  owner.resources[order.wantRes] = ((_e = owner.resources[order.wantRes]) != null ? _e : 0) + qty - tax;
  bumpStat(supplier, "marketTrades");
  bumpStat(owner, "marketTrades");
  bumpStat(owner, "marketTax", tax);
  bumpStat(supplier, "marketVolume", qty);
  bumpStat(owner, "marketVolume", qty - tax);
  recordChronicle(supplier, "market", now);
  grantCommanderXp(supplier, "steward", COMMANDER_XP.marketTrade);
  grantCommanderXp(owner, "steward", COMMANDER_XP.marketTrade);
  return { qty, payment, tax, filled, done: filled >= order.wantAmount };
}
function refundOffer(offer, seller) {
  var _a;
  const back = offerReserved(offer);
  seller.resources[offer.giveRes] = ((_a = seller.resources[offer.giveRes]) != null ? _a : 0) + back;
  return back;
}
function describeAmount(res, n) {
  return `${formatInt(n)} ${label(res)}`;
}
function utcDayStart(now) {
  return Math.floor(now / 864e5) * 864e5;
}

// src/game/tradeContracts.ts
var TRADE_CONTRACT_RULES = {
  minHours: 4,
  maxHours: 72,
  /** Contrats actifs par joueur (publiés ouverts ou acceptés, comme client ou livreur). */
  maxActive: 3,
  /** Caution du livreur, en part du paiement. */
  depositPct: 0.1,
  /** Un contrat ouvert sans livreur expire au bout de ce délai (h). */
  openHours: 48
};
var RESOURCE_IDS3 = new Set(RESOURCE_LIST.map((r) => r.id));
var label2 = (res) => {
  var _a, _b;
  return (_b = (_a = RESOURCE_LIST.find((r) => r.id === res)) == null ? void 0 : _a.name.toLowerCase()) != null ? _b : res;
};
function amount2(raw, what) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0 || n > 1e13) throw new GameActionError(`${what} invalide.`);
  return n;
}
function contractDeposit(payAmount) {
  return Math.max(1, Math.floor(payAmount * TRADE_CONTRACT_RULES.depositPct));
}
function createTradeContract(client, input, active, now) {
  var _a, _b, _c, _d;
  const wantRes = String((_a = input.wantRes) != null ? _a : "");
  const payRes = String((_b = input.payRes) != null ? _b : "");
  if (!RESOURCE_IDS3.has(wantRes) || !RESOURCE_IDS3.has(payRes)) throw new GameActionError("Ressource inconnue.");
  if (wantRes === payRes) throw new GameActionError("Choisis deux ressources diff\xE9rentes.");
  const wantAmount = amount2(input.wantAmount, "Quantit\xE9 demand\xE9e");
  const payAmount = amount2(input.payAmount, "Paiement");
  const hours2 = Math.floor(Number(input.hours));
  if (!(hours2 >= TRADE_CONTRACT_RULES.minHours && hours2 <= TRADE_CONTRACT_RULES.maxHours)) {
    throw new GameActionError(`D\xE9lai entre ${TRADE_CONTRACT_RULES.minHours} et ${TRADE_CONTRACT_RULES.maxHours} h.`);
  }
  if (active >= TRADE_CONTRACT_RULES.maxActive) throw new GameActionError(`${TRADE_CONTRACT_RULES.maxActive} contrats actifs au plus.`);
  const { min, max } = priceBounds(payRes, payAmount, wantRes);
  if (wantAmount < min || wantAmount > max) {
    throw new GameActionError(`Prix hors limites : pour ${formatInt(payAmount)} ${label2(payRes)}, demande entre ${formatInt(min)} et ${formatInt(max)} ${label2(wantRes)}.`);
  }
  const targetUid = String((_c = input.targetUid) != null ? _c : "").slice(0, 40);
  if (targetUid && targetUid === client.uid) throw new GameActionError("Tu ne peux pas te livrer toi-m\xEAme.");
  if (((_d = client.resources[payRes]) != null ? _d : 0) < payAmount) throw new GameActionError(`Pas assez de ${label2(payRes)} pour le paiement.`);
  client.resources[payRes] -= payAmount;
  return { targetUid, wantRes, wantAmount, payRes, payAmount, hours: hours2, expiresAtMs: now + TRADE_CONTRACT_RULES.openHours * 36e5 };
}
function acceptTradeContract(c, supplier, active, now) {
  var _a;
  if (c.status !== "open" || now >= c.expiresAtMs) throw new GameActionError("Ce contrat n'est plus disponible.");
  if (c.clientUid === supplier.uid) throw new GameActionError("Tu ne peux pas accepter ton propre contrat.");
  if (c.targetUid && c.targetUid !== supplier.uid) throw new GameActionError("Ce contrat est r\xE9serv\xE9 \xE0 un autre commandant.");
  if (active >= TRADE_CONTRACT_RULES.maxActive) throw new GameActionError(`${TRADE_CONTRACT_RULES.maxActive} contrats actifs au plus.`);
  const deposit2 = contractDeposit(c.payAmount);
  if (((_a = supplier.resources[c.payRes]) != null ? _a : 0) < deposit2) throw new GameActionError(`Caution : il faut ${formatInt(deposit2)} ${label2(c.payRes)}.`);
  supplier.resources[c.payRes] -= deposit2;
  return { deposit: deposit2, deadlineMs: now + c.hours * 36e5 };
}
function cancelTradeContract(c, client) {
  var _a;
  if (c.status !== "open") throw new GameActionError("Un livreur a d\xE9j\xE0 accept\xE9 : le contrat ne peut plus \xEAtre annul\xE9.");
  client.resources[c.payRes] = ((_a = client.resources[c.payRes]) != null ? _a : 0) + c.payAmount;
}
function completeTradeContract(c, client, supplier, cargo, now) {
  var _a, _b;
  if (c.status !== "accepted" || now > c.deadlineMs) throw new GameActionError("Contrat clos ou \xE9chu.");
  client.resources[c.wantRes] = ((_a = client.resources[c.wantRes]) != null ? _a : 0) + cargo;
  supplier.resources[c.payRes] = ((_b = supplier.resources[c.payRes]) != null ? _b : 0) + c.payAmount + c.deposit;
  bumpStat(supplier, "contractsDelivered");
  bumpStat(client, "marketTrades");
  bumpStat(supplier, "marketTrades");
}
function failTradeContract(c, client) {
  var _a;
  const penalty = c.status === "accepted" ? c.deposit : 0;
  client.resources[c.payRes] = ((_a = client.resources[c.payRes]) != null ? _a : 0) + c.payAmount + penalty;
  return penalty;
}
function checkDelivery(c, supplierUid, capacity, arriveAtMs) {
  if (c.status !== "accepted" || c.supplierUid !== supplierUid) throw new GameActionError("Ce contrat ne t'est pas attribu\xE9.");
  if (c.fleetId) throw new GameActionError("Une livraison est d\xE9j\xE0 en route pour ce contrat.");
  if (capacity < c.wantAmount) throw new GameActionError(`La soute doit contenir ${formatInt(c.wantAmount)} ressources (actuellement ${formatInt(capacity)}).`);
  if (arriveAtMs > c.deadlineMs) throw new GameActionError("Ces vaisseaux arriveraient apr\xE8s l'\xE9ch\xE9ance : choisis une flotte plus rapide.");
}

// src/game/espionage.ts
var SPY_RULES = {
  /** Unité envoyée en mission d'espionnage. */
  probeUnitId: "sonde_espionnage",
  /** Durée fixe du trajet, en minutes. */
  baseMinutes: 1,
  /** Minutes par unité de distance, divisées par la vitesse des sondes. */
  minutesPerDistance: 0.5,
  /** Sentinelles à quai pour un point de contre-espionnage. */
  sentinelsPerCounterLevel: 100,
  sentinelUnitId: "sentinelle",
  /** Chance de détection : base + parPoint × (contre-espionnage − Espionnage). */
  detectionBase: 0.1,
  detectionPerPoint: 0.1,
  detectionMin: 0.05,
  detectionMax: 0.9,
  /** Score minimum de chaque palier du rapport. */
  tierResources: 0,
  tierForces: 2,
  tierInfrastructure: 4,
  tierActivity: 6
};
var SPY_TIER_LABELS = ["Brouill\xE9", "Ressources", "Flotte et d\xE9fenses", "B\xE2timents et technologies", "Files et flottes en vol"];
function espionageLevel(player) {
  var _a, _b;
  const tech = (_a = UNIT_TO_TECH[SPY_RULES.probeUnitId]) != null ? _a : "tech20";
  return Math.max(0, Number((_b = player.techLevels) == null ? void 0 : _b[tech]) || 0) + playerModifiers(player).spyLevel;
}
function counterEspionage(target) {
  var _a, _b, _c;
  const sentinels = (_c = (_b = (_a = target.units) == null ? void 0 : _a[SPY_RULES.sentinelUnitId]) == null ? void 0 : _b.count) != null ? _c : 0;
  const per = Math.max(1, SPY_RULES.sentinelsPerCounterLevel);
  return espionageLevel(target) + Math.floor(sentinels / per) + allianceCounterSpy(target.allianceResearch) + Math.floor(techBonus(target.techLevels, "counter_spy"));
}
function spyScore(spyLevel, counter, probes) {
  return spyLevel - counter + Math.log2(Math.max(1, probes));
}
function spyTier(score) {
  const thresholds = [SPY_RULES.tierResources, SPY_RULES.tierForces, SPY_RULES.tierInfrastructure, SPY_RULES.tierActivity];
  return thresholds.filter((t) => score >= t).length;
}
function detectionChance(spyLevel, counter) {
  const raw = SPY_RULES.detectionBase + SPY_RULES.detectionPerPoint * (counter - spyLevel);
  return Math.min(SPY_RULES.detectionMax, Math.max(SPY_RULES.detectionMin, raw));
}
function spyTravelSeconds(distance, speed, factor = 1) {
  return Math.round(factor * (SPY_RULES.baseMinutes + distance * SPY_RULES.minutesPerDistance / Math.max(1, speed)) * 60);
}
function sectorLabel(uid) {
  const c = galaxyCoords(uid);
  return `${Math.round(c.x * 100)}\xB7${Math.round(c.y * 100)}`;
}
function unitsOf(target, ids) {
  var _a;
  const out = {};
  for (const id of ids) {
    const u = (_a = target.units) == null ? void 0 : _a[id];
    if (u && (u.count > 0 || u.level > 0)) out[id] = { count: u.count, level: u.level };
  }
  return out;
}
function buildSpyReportData(target, queues, targetFleets, tier, now, garrisons = []) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const data = {};
  if (tier >= 1) {
    data.resources = Object.fromEntries(
      Object.entries((_a = target.resources) != null ? _a : {}).map(([res, amount3]) => [res, Math.floor(amount3 != null ? amount3 : 0)])
    );
  }
  if (tier >= 2) {
    data.units = unitsOf(target, OFFENSIVE_UNITS);
    data.defenses = unitsOf(target, DEFENSIVE_UNITS);
    data.garrisons = garrisons.map((g) => ({ ownerPseudo: g.ownerPseudo, units: g.units }));
    data.posture = (_c = (_b = target.posture) == null ? void 0 : _b.id) != null ? _c : "standard";
  }
  if (tier >= 3) {
    data.buildings = Object.fromEntries(Object.entries((_d = target.buildings) != null ? _d : {}).map(([id, b]) => {
      var _a2;
      return [id, (b == null ? void 0 : b.unlocked) === false ? 0 : (_a2 = b == null ? void 0 : b.level) != null ? _a2 : 0];
    }));
    data.techLevels = __spreadValues({}, (_e = target.techLevels) != null ? _e : {});
  }
  if (tier >= 4) {
    data.queues = {
      buildings: Object.entries((_f = queues.buildingUpgrades) != null ? _f : {}).filter(([, u]) => u && u.endTime > now).map(([id, u]) => ({ id, endTime: u.endTime })),
      researches: ((_g = queues.activeResearches) != null ? _g : []).map((r) => ({ id: r.id, endTime: r.endTime })),
      units: Object.values((_h = queues.unitQueues) != null ? _h : {}).flat().map((q) => {
        var _a2;
        return { id: q.unitId, endTime: (_a2 = q.endTime) != null ? _a2 : null };
      })
    };
    data.fleets = targetFleets.filter((f) => f.status !== "done").map((f) => {
      var _a2;
      return {
        mission: f.mission,
        targetPseudo: f.targetPseudo,
        units: f.units,
        status: f.status,
        at: f.status === "outbound" ? f.arriveAtMs : (_a2 = f.returnAtMs) != null ? _a2 : f.arriveAtMs
      };
    });
  }
  return data;
}
function resolveSpyArrival(input) {
  var _a, _b, _c;
  const { now, probes } = input;
  const spy = flushState(__spreadProps(__spreadValues({}, input.spy), { buildings: withMissingBuildings(input.spy.buildings, input.spy.resources) }), input.spyQueues, now).player;
  const flushed = flushState(__spreadProps(__spreadValues({}, input.target), { buildings: withMissingBuildings(input.target.buildings, input.target.resources) }), input.targetQueues, now);
  const owner = flushed.player;
  const colony = input.colonyId ? colonyOf(owner, input.colonyId) : void 0;
  const target = colony ? colonyView(owner, colony) : owner;
  const level3 = espionageLevel(spy);
  const counter = counterEspionage(target);
  const score = spyScore(level3, counter, probes);
  const tier = spyTier(score);
  const detected = ((_a = input.random) != null ? _a : Math.random)() < Math.min(0.95, detectionChance(level3, counter) + playerModifiers(owner).detection);
  const random = (_b = input.random) != null ? _b : Math.random;
  const data = colony ? buildSpyReportData(target, __spreadProps(__spreadValues({}, flushed.queues), { buildingUpgrades: {}, activeResearches: [], unitQueues: { attack: [], defense: [] } }), [], tier, now) : buildSpyReportData(target, flushed.queues, input.targetFleets, tier, now, (_c = input.targetGarrisons) != null ? _c : []);
  const veil = activeVeil(owner, now);
  if (veil > 0) {
    data.units = veilCounts(data.units, veil, random);
    data.defenses = veilCounts(data.defenses, veil, random);
  }
  const anomaly = veil > 0 && random() < anomalyChance(spy);
  const report = {
    spyUid: spy.uid,
    spyPseudo: spy.pseudo,
    targetUid: target.uid,
    targetPseudo: target.pseudo,
    timestamp: now,
    targetProcessed: true,
    probes,
    score: Math.round(score * 100) / 100,
    tier,
    detected,
    data,
    anomaly
  };
  const spyNotifications = [
    {
      kind: "spy",
      title: detected ? "Sondes rep\xE9r\xE9es et abattues" : "Rapport d'espionnage re\xE7u",
      message: `${target.pseudo} : ${SPY_TIER_LABELS[tier].toLowerCase()}${detected ? ". Tes sondes n'ont pas surv\xE9cu." : "."}${anomaly ? " Ton Espionne flaire une anomalie chimique : les chiffres sont peut-\xEAtre fauss\xE9s." : ""}`,
      createdAtMs: now,
      read: false
    }
  ];
  const targetNotifications = detected ? [
    {
      kind: "spy-detected",
      title: "Espionnage d\xE9tect\xE9 !",
      message: `${spy.pseudo} (secteur ${sectorLabel(spy.uid)}) t'a envoy\xE9 ${formatInt(probes)} sonde${probes > 1 ? "s" : ""} : abattue${probes > 1 ? "s" : ""}.`,
      createdAtMs: now,
      read: false
    }
  ] : [];
  return { report, detected, spyNotifications, targetNotifications };
}

// src/game/debris.ts
var DEBRIS_RULES = {
  /** Part du coût (ferraille, énergie) des vaisseaux détruits. */
  percent: 0.3,
  /** Durée de vie d'un champ, relancée à chaque nouveau combat. */
  lifetimeHours: 48,
  /** Capacité de ramassage d'un recycleur, par niveau. */
  capacityPerLevel: 250,
  recyclerUnitId: "drone_recuperateur"
};
function debrisFromLosses(losses, percent = DEBRIS_RULES.percent) {
  var _a, _b, _c, _d;
  let scrap = 0;
  let energy = 0;
  for (const map of losses) {
    for (const [unitId, qty] of Object.entries(map != null ? map : {})) {
      if (!(qty > 0) || !OFFENSIVE_UNITS.includes(unitId)) continue;
      const cost = (_b = (_a = findUnit(unitId)) == null ? void 0 : _a.cost) != null ? _b : {};
      scrap += ((_c = cost.scrap) != null ? _c : 0) * qty;
      energy += ((_d = cost.energy) != null ? _d : 0) * qty;
    }
  }
  return { scrap: Math.floor(scrap * percent), energy: Math.floor(energy * percent) };
}
function debrisTotal(d) {
  var _a, _b;
  return d ? ((_a = d.scrap) != null ? _a : 0) + ((_b = d.energy) != null ? _b : 0) : 0;
}
function mergeDebris(field, add2, location, now) {
  var _a, _b;
  const alive = field && field.expiresAtMs > now ? field : null;
  return {
    id: location.uid,
    locationPseudo: location.pseudo,
    scrap: ((_a = alive == null ? void 0 : alive.scrap) != null ? _a : 0) + add2.scrap,
    energy: ((_b = alive == null ? void 0 : alive.energy) != null ? _b : 0) + add2.energy,
    expiresAtMs: now + DEBRIS_RULES.lifetimeHours * 36e5,
    updatedAtMs: now
  };
}
function recyclerCapacity(units, fleet) {
  var _a, _b;
  let capacity = 0;
  for (const [unitId, qty] of Object.entries(fleet != null ? fleet : {})) {
    if (unitId !== DEBRIS_RULES.recyclerUnitId || !(qty > 0)) continue;
    capacity += qty * DEBRIS_RULES.capacityPerLevel * Math.max(1, (_b = (_a = units[unitId]) == null ? void 0 : _a.level) != null ? _b : 1);
  }
  return capacity;
}
function collectDebris(field, capacity) {
  var _a, _b, _c, _d, _e, _f, _g;
  const total2 = debrisTotal(field);
  if (total2 <= 0 || capacity <= 0) return { taken: { scrap: 0, energy: 0 }, remaining: { scrap: (_a = field.scrap) != null ? _a : 0, energy: (_b = field.energy) != null ? _b : 0 } };
  const ratio = Math.min(1, capacity / total2);
  const scrap = Math.floor(((_c = field.scrap) != null ? _c : 0) * ratio);
  const energy = Math.min((_d = field.energy) != null ? _d : 0, Math.floor(capacity - scrap), Math.ceil(((_e = field.energy) != null ? _e : 0) * ratio));
  return {
    taken: { scrap, energy },
    remaining: { scrap: ((_f = field.scrap) != null ? _f : 0) - scrap, energy: ((_g = field.energy) != null ? _g : 0) - energy }
  };
}

// src/game/fleets.ts
var FLEET_RULES = {
  /** Durée fixe de tout trajet (décollage, approche), en minutes. */
  baseMinutes: 5,
  /** Minutes par unité de distance, divisées par la vitesse de la flotte. */
  minutesPerDistance: 3,
  /** Côté de la carte de la galaxie (distance max ≈ 141). */
  mapSize: 100,
  /** v3.7 : durée maximale du trajet d'une attaque, en minutes (0 = aucune). */
  maxAttackMinutes: 90
};
var PATROL_RULES = {
  minMinutes: 30,
  maxMinutes: 480
};
function mapPosition(uid) {
  const c = galaxyCoords(uid);
  return { x: c.x * FLEET_RULES.mapSize, y: c.y * FLEET_RULES.mapSize };
}
function distanceBetween(uidA, uidB) {
  const a = mapPosition(uidA);
  const b = mapPosition(uidB);
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function fleetSpeed(units, fleet) {
  var _a, _b, _c;
  let slowest = Infinity;
  for (const [id, qty] of Object.entries(fleet)) {
    if (!(qty > 0)) continue;
    const def3 = findUnit(id);
    const speed = ((_a = def3 == null ? void 0 : def3.stats.vitesse) != null ? _a : 0) * Math.max(1, (_c = (_b = units[id]) == null ? void 0 : _b.level) != null ? _c : 1);
    slowest = Math.min(slowest, Math.max(1, speed));
  }
  return Number.isFinite(slowest) ? slowest : 1;
}
function travelSeconds(distance, speed, factor = 1) {
  return Math.round(factor * (FLEET_RULES.baseMinutes + distance * FLEET_RULES.minutesPerDistance / Math.max(1, speed)) * 60);
}
function attackTravelSeconds(distance, speed, factor = 1) {
  const seconds = travelSeconds(distance, speed, factor);
  const cap = FLEET_RULES.maxAttackMinutes;
  return cap > 0 ? Math.min(seconds, Math.round(cap * 60)) : seconds;
}
function launchFleet(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { now, attacker, defender } = input;
  if (attacker.allianceId && attacker.allianceId === defender.allianceId) throw new GameActionError("Tu ne peux pas attaquer un membre de ton alliance.");
  const check = checkAttackAllowed({
    now,
    attackerUid: attacker.uid,
    attackerXp: (_a = attacker.xp) != null ? _a : 0,
    defenderUid: defender.uid,
    defenderXp: (_b = defender.xp) != null ? _b : 0,
    defenderCreatedAtMs: defender.createdAtMs,
    defenderHasAttacked: ((_c = defender.lastAttackAtMs) != null ? _c : 0) > 0,
    lastAttackOnTargetMs: input.lastAttackOnTargetMs,
    defenderAscendedAtMs: defender.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(defender),
    defenderVacationUntilMs: onVacation(defender, now) ? (_d = defender.vacation) == null ? void 0 : _d.untilMs : void 0,
    defenderIsWarlord: !!defender.npc,
    lastDefenderDefeatMs: (_e = defender.lastDefeatAtMs) != null ? _e : null,
    attackCooldownMs: input.atWar ? WAR_RULES.attackCooldownHours * 36e5 : void 0
  });
  if (!check.allowed) throw new GameActionError((_f = check.message) != null ? _f : "Attaque impossible.");
  const units = {};
  for (const [unitId, raw] of Object.entries((_g = input.fleet) != null ? _g : {})) {
    const qty = Math.floor(Number(raw));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) throw new GameActionError("Seules les unit\xE9s d'attaque peuvent \xEAtre envoy\xE9es.");
    if (((_i = (_h = attacker.units[unitId]) == null ? void 0 : _h.count) != null ? _i : 0) < qty) throw new GameActionError("Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte.");
    units[unitId] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
  const speed = fleetSpeed(attacker.units, units);
  const arriveAtMs = now + attackTravelSeconds(distanceBetween(attacker.uid, defender.uid), speed, allianceFlightFactor(attacker.allianceResearch, attacker.techLevels)) * 1e3;
  for (const [unitId, qty] of Object.entries(units)) attacker.units[unitId].count -= qty;
  attacker.lastAttackAtMs = now;
  dropShield(attacker, now);
  const minutes = Math.max(1, Math.round((arriveAtMs - now) / 6e4));
  const total2 = Object.values(units).reduce((a, b) => a + b, 0);
  return {
    attacker,
    fleet: {
      ownerUid: attacker.uid,
      ownerPseudo: attacker.pseudo,
      targetUid: defender.uid,
      targetPseudo: defender.pseudo,
      mission: "attack",
      units,
      departAtMs: now,
      arriveAtMs,
      returnAtMs: null,
      status: "outbound",
      loot: null,
      reportId: "",
      outcome: "",
      recalled: false
    },
    defenderNotifications: [
      {
        kind: "fleet",
        title: "Flotte hostile en approche !",
        message: `${attacker.pseudo} t'envoie ${formatInt(total2)} vaisseaux : impact dans ${minutes} min. Renforce tes d\xE9fenses !`,
        createdAtMs: now,
        read: false
      }
    ]
  };
}
function recallFleet(fleet, uid, now) {
  if (fleet.ownerUid !== uid) throw new GameActionError("Cette flotte ne t'appartient pas.");
  if (fleet.status === "stationed") {
    return __spreadProps(__spreadValues({}, fleet), { status: "returning", stationedUntilMs: now, returnAtMs: now + (fleet.arriveAtMs - fleet.departAtMs) });
  }
  if (fleet.mission === "expedition" || fleet.mission === "leviathan" || fleet.mission === "seasonboss" || fleet.mission === "allianceboss" || fleet.mission === "elite") throw new GameActionError("Cette flotte ne peut pas \xEAtre rappel\xE9e.");
  if (fleet.status !== "outbound") throw new GameActionError("Cette flotte ne peut plus \xEAtre rappel\xE9e.");
  if (now >= fleet.arriveAtMs) throw new GameActionError("Trop tard : la flotte est d\xE9j\xE0 au contact.");
  return __spreadProps(__spreadValues({}, fleet), { status: "returning", recalled: true, returnAtMs: now + (now - fleet.departAtMs) });
}
function completeFleetReturn(owner, fleet, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  for (const [unitId, qty] of Object.entries((_a = fleet.units) != null ? _a : {})) {
    if (!(qty > 0)) continue;
    const state = (_b = owner.units[unitId]) != null ? _b : { level: 1, count: 0 };
    owner.units[unitId] = __spreadProps(__spreadValues({}, state), { count: state.count + qty });
  }
  if ((fleet.mission === "transport" || fleet.mission === "delivery") && fleet.recalled && ((_c = fleet.transport) == null ? void 0 : _c.direction) === "deliver") {
    for (const [res, amount3] of Object.entries((_d = fleet.transport.cargo) != null ? _d : {})) owner.resources[res] = ((_e = owner.resources[res]) != null ? _e : 0) + (amount3 != null ? amount3 : 0);
  }
  for (const [res, amount3] of Object.entries((_f = fleet.loot) != null ? _f : {})) {
    owner.resources[res] = ((_g = owner.resources[res]) != null ? _g : 0) + (amount3 != null ? amount3 : 0);
  }
  const lootTotal = Object.values((_h = fleet.loot) != null ? _h : {}).reduce((a, b) => a + (b != null ? b : 0), 0);
  if (fleet.mission === "recycle") bumpStat(owner, "recycled", lootTotal);
  else if (((_i = fleet.mission) != null ? _i : "attack") === "attack") bumpStat(owner, "loot", lootTotal);
  return { owner, notifications: [__spreadProps(__spreadValues({ kind: "fleet" }, returnMessage(fleet, lootTotal)), { createdAtMs: now, read: false })] };
}
function returnMessage(fleet, lootTotal) {
  var _a, _b, _c, _d;
  switch (fleet.mission) {
    case "patrol":
      return { title: "Patrouille termin\xE9e", message: "Ta flotte en patrouille est rentr\xE9e \xE0 la base." };
    case "expedition":
      return { title: "Exp\xE9dition termin\xE9e", message: "Ta flotte d'exp\xE9dition est rentr\xE9e \xE0 la base." };
    case "leviathan":
      return { title: "Retour du L\xE9viathan", message: "Les survivants de l'assaut sur le L\xE9viathan sont rentr\xE9s." };
    case "seasonboss":
    case "allianceboss":
      return { title: "Retour de l'assaut", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentr\xE9s.` };
    case "lair":
      return { title: "Retour du repaire", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentr\xE9s.` };
    case "bounty":
      return fleet.recalled ? { title: "Traque abandonn\xE9e", message: `Ta flotte lanc\xE9e sur ${fleet.targetPseudo} est rentr\xE9e : la prime reste au tableau.` } : { title: "Chasseurs rentr\xE9s", message: `Ta flotte lanc\xE9e sur ${fleet.targetPseudo} est de retour.` };
    case "elite":
      return { title: "Retour de la traque d'\xE9lite", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentr\xE9s.` };
    case "transport":
      return ((_a = fleet.transport) == null ? void 0 : _a.direction) === "collect" && !fleet.recalled ? { title: "Transport rentr\xE9", message: lootTotal > 0 ? `Rapatri\xE9 de ${fleet.targetPseudo} : ${describeGain((_b = fleet.loot) != null ? _b : {})} (${formatInt(lootTotal)} au total).` : `Rien \xE0 rapatrier de ${fleet.targetPseudo}.` } : { title: "Transport rentr\xE9", message: `Tes vaisseaux de transport sont revenus de ${fleet.targetPseudo}${fleet.recalled ? " avec leur cargaison" : ""}.` };
    case "delivery":
      return fleet.recalled || lootTotal > 0 ? { title: "Livraison revenue", message: `Tes vaisseaux sont revenus de chez ${fleet.targetPseudo} avec la cargaison du contrat.` } : { title: "Livreurs rentr\xE9s", message: `Tes vaisseaux de livraison sont revenus de chez ${fleet.targetPseudo}.` };
    case "garrison":
      return { title: "Garnison rentr\xE9e", message: `Ta garnison stationn\xE9e chez ${fleet.targetPseudo} est de retour.` };
    case "spy":
      return { title: "Sondes rentr\xE9es", message: `Tes sondes envoy\xE9es vers ${fleet.targetPseudo} sont de retour.` };
    case "recycle":
      return fleet.recalled ? { title: "Recycleurs rentr\xE9s", message: "Tes recycleurs rappel\xE9s sont de retour, soute vide." } : {
        title: "Recyclage termin\xE9",
        message: lootTotal > 0 ? `R\xE9cup\xE9r\xE9 dans les d\xE9bris de ${fleet.targetPseudo} : ${describeGain((_c = fleet.loot) != null ? _c : {})} (${formatInt(lootTotal)} au total).` : `Le champ de d\xE9bris de ${fleet.targetPseudo} \xE9tait d\xE9j\xE0 vide.`
      };
    default:
      return fleet.recalled ? { title: "Flotte rappel\xE9e rentr\xE9e", message: `Ta flotte envoy\xE9e vers ${fleet.targetPseudo} est de retour, sans combat.` } : {
        title: "Flotte rentr\xE9e \xE0 la base",
        message: lootTotal > 0 ? `Retour de ${fleet.targetPseudo}. Butin : ${describeGain((_d = fleet.loot) != null ? _d : {})} (${formatInt(lootTotal)} au total).` : `Retour de ${fleet.targetPseudo}, sans butin.`
      };
  }
}
function performLaunch(req) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  const mission = (_a = req.mission) != null ? _a : "attack";
  const { now, target } = req;
  if ((mission === "attack" || mission === "spy") && !target) throw new GameActionError("Ce joueur est introuvable.");
  if (mission === "attack" && req.owner.uid === target.uid) throw new GameActionError("Tu ne peux pas t'attaquer toi-m\xEAme !");
  if (mission === "spy" && req.owner.uid === target.uid) throw new GameActionError("Tu ne peux pas t'espionner toi-m\xEAme.");
  if (mission === "garrison" && !target) throw new GameActionError("Ce joueur est introuvable.");
  const flushed = flushState(__spreadProps(__spreadValues({}, req.owner), { buildings: withMissingBuildings(req.owner.buildings, req.owner.resources) }), req.ownerQueues, now);
  const owner = flushed.player;
  let planet = target;
  if (req.targetColonyId && (mission === "attack" || mission === "spy")) {
    if (target.uid === owner.uid) throw new GameActionError("C'est ta propre colonie.");
    const colony = colonyOf(advanceTarget(target, now), req.targetColonyId);
    if (!colony) throw new GameActionError("Cette colonie n'existe plus.");
    planet = colonyView(target, colony);
  }
  let out;
  if (mission === "attack") out = launchFleet({ now, attacker: owner, defender: planet, fleet: req.fleet, lastAttackOnTargetMs: (_b = req.lastAttackOnTargetMs) != null ? _b : null, atWar: req.atWar });
  else if (mission === "spy") out = launchSpy(owner, planet, req.fleet, now);
  else if (mission === "recycle") out = launchRecycle(owner, (_c = req.debris) != null ? _c : null, req.fleet, now);
  else if (mission === "patrol") out = launchPatrol(owner, req.fleet, (_d = req.patrolMinutes) != null ? _d : 0, now);
  else if (mission === "lair") out = launchLair(owner, (_e = req.lairTarget) != null ? _e : "", req.fleet, now);
  else if (mission === "garrison") out = launchGarrison(owner, target, req.fleet, (_f = req.garrisonHours) != null ? _f : 0, (_g = req.garrisonsAtHost) != null ? _g : 0, now);
  else if (mission === "expedition") {
    const e3 = launchExpedition(owner, req.fleet, req.expeditionHours, (_h = req.expeditionsActive) != null ? _h : 0, (_i = req.expeditionsToday) != null ? _i : 0, now, req.formation);
    out = { attacker: e3.attacker, fleet: e3.fleet, defenderNotifications: [] };
  } else if (mission === "leviathan") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer le L\xE9viathan.");
    if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: "leviathan", pseudo: LEVIATHAN_RULES.name }, "leviathan", units, now, now + LEVIATHAN_RULES.flightMinutes * 6e4),
      defenderNotifications: []
    };
  } else if (mission === "seasonboss") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer le boss de saison.");
    if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: "seasonboss", pseudo: (_j = req.eliteName) != null ? _j : "Boss de saison" }, "seasonboss", units, now, now + LEVIATHAN_RULES.flightMinutes * 6e4),
      defenderNotifications: []
    };
  } else if (mission === "allianceboss") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer le boss d'alliance.");
    if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
    if (!owner.allianceId) throw new GameActionError("Il faut une alliance pour combattre son boss.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: `allianceboss:${owner.allianceId}`, pseudo: (_k = req.eliteName) != null ? _k : "Boss d'alliance" }, "allianceboss", units, now, now + ALLIANCE_BOSS_RULES.flightMinutes * 6e4),
      defenderNotifications: []
    };
  } else if (mission === "transport") out = launchTransport(owner, req.fleet, (_l = req.transport) != null ? _l : {}, now);
  else if (mission === "bounty") out = launchBounty(owner, (_m = req.bountyId) != null ? _m : "", req.fleet, now);
  else if (mission === "delivery") {
    if (!target || !req.delivery) throw new GameActionError("Contrat introuvable.");
    out = launchDelivery(owner, target, req.fleet, req.delivery, now);
  } else if (mission === "elite") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux de combat peuvent traquer la proie d'\xE9lite.");
    out = { attacker: owner, fleet: newFleet(owner, { uid: ELITE_TARGET, pseudo: (_n = req.eliteName) != null ? _n : "Proie d'\xE9lite" }, "elite", units, now, now + ELITE_RULES.flightMinutes * 6e4), defenderNotifications: [] };
  } else throw new GameActionError("Mission inconnue.");
  let capsules = null;
  if (mission === "attack" && req.capsules) {
    capsules = takeLaunchCapsules(out.attacker, req.capsules, out.fleet.units, OFFENSIVE_UNITS.filter((id) => id !== SPY_RULES.probeUnitId), req.random);
    if (capsules.fakeUnits) {
      const fakeTotal = Object.values(capsules.fakeUnits).reduce((a, b) => a + b, 0);
      out.defenderNotifications = out.defenderNotifications.map((n) => __spreadProps(__spreadValues({}, n), { message: n.message.replace(/t'envoie [\d\s\u202f\u00a0.,]+ vaisseaux/, `t'envoie ${formatInt(fakeTotal)} vaisseaux`) }));
    }
  }
  if (mission === "attack") out.fleet.power = attackPowerShown(out.attacker, (_o = capsules == null ? void 0 : capsules.fakeUnits) != null ? _o : out.fleet.units, req.formation);
  if (mission === "spy") grantCommanderXp(out.attacker, "spy", COMMANDER_XP.spyLaunched);
  if (mission === "spy") recordChronicle(out.attacker, "spy", now);
  const counter = { spy: "spies", patrol: "patrols", garrison: "garrisons" }[mission];
  if (counter) bumpStat(out.attacker, counter);
  return __spreadProps(__spreadValues({}, out), { capsules, attackerQueues: flushed.queues, attackerNotifications: flushed.notifications });
}
function attackPowerShown(attacker, units, formation) {
  return Math.round(computeFleetPower(attacker.units, attacker.techLevels, units, ["attack"]) * formationEffects(formation).attackFactor * (1 + playerModifiers(attacker).attack));
}
function advanceTarget(target, now) {
  const copy = structuredClone(target);
  advanceColonies(copy, now);
  return copy;
}
function launchTransport(owner, raw, req, now) {
  var _a, _b;
  const colony = colonyOf(owner, String((_a = req.colonyId) != null ? _a : ""));
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const direction = req.direction === "collect" ? "collect" : "deliver";
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux (hors sondes) peuvent transporter.");
  const capacity = playerCargoCapacity(owner, units);
  if (capacity <= 0) throw new GameActionError("Ces vaisseaux n'ont pas de soute.");
  const cargo = parseCargo(req.cargo, direction === "deliver" ? capacity : Infinity);
  if (direction === "deliver") {
    if (Object.keys(cargo).length === 0) throw new GameActionError("Charge au moins une ressource.");
    for (const [res, n] of Object.entries(cargo)) {
      if (((_b = owner.resources[res]) != null ? _b : 0) < n) throw new GameActionError("Ressources insuffisantes sur la plan\xE8te m\xE8re.");
    }
    for (const [res, n] of Object.entries(cargo)) owner.resources[res] -= n;
  }
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, colony.id), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  bumpStat(owner, "transports");
  return {
    attacker: owner,
    fleet: __spreadProps(__spreadValues({}, newFleet(owner, { uid: colony.id, pseudo: colony.name }, "transport", units, now, arriveAtMs)), { transport: { direction, colonyId: colony.id, cargo } }),
    defenderNotifications: []
  };
}
function launchDelivery(owner, client, raw, contract, now) {
  var _a;
  if (contract.fleetId) throw new GameActionError("Une livraison est d\xE9j\xE0 en route pour ce contrat.");
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux (hors sondes) peuvent livrer.");
  const capacity = playerCargoCapacity(owner, units);
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, client.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  checkDelivery(contract, owner.uid, capacity, arriveAtMs);
  if (((_a = owner.resources[contract.wantRes]) != null ? _a : 0) < contract.wantAmount) throw new GameActionError("Ressources insuffisantes pour cette livraison.");
  owner.resources[contract.wantRes] -= contract.wantAmount;
  return {
    attacker: owner,
    fleet: __spreadProps(__spreadValues({}, newFleet(owner, { uid: client.uid, pseudo: client.pseudo }, "delivery", units, now, arriveAtMs)), {
      transport: { direction: "deliver", colonyId: "", cargo: { [contract.wantRes]: contract.wantAmount }, contractId: contract.id }
    }),
    defenderNotifications: []
  };
}
function performTransportArrival(ownerIn, ownerQueues, fleet, now) {
  var _a, _b;
  const flushed = flushState(__spreadProps(__spreadValues({}, ownerIn), { buildings: withMissingBuildings(ownerIn.buildings, ownerIn.resources) }), ownerQueues, now);
  const owner = flushed.player;
  const notes = [...flushed.notifications, ...advanceColonies(owner, now)];
  const colony = colonyOf(owner, (_b = (_a = fleet.transport) == null ? void 0 : _a.colonyId) != null ? _b : fleet.targetUid);
  const t = fleet.transport;
  if (!colony || !t) {
    return { owner, queues: flushed.queues, notifications: notes, loot: (t == null ? void 0 : t.direction) === "deliver" ? t.cargo : null, outcome: "lost" };
  }
  if (t.direction === "deliver") {
    deliverToColony(colony, t.cargo);
    const total2 = Object.values(t.cargo).reduce((a, b) => a + (b != null ? b : 0), 0);
    notes.push({ kind: "fleet", title: "Livraison effectu\xE9e", message: `${formatInt(total2)} ressources livr\xE9es \xE0 ${colony.name}.`, createdAtMs: now, read: false });
    return { owner, queues: flushed.queues, notifications: notes, loot: null, outcome: "delivered" };
  }
  const taken = collectFromColony(colony, t.cargo, playerCargoCapacity(owner, fleet.units));
  return { owner, queues: flushed.queues, notifications: notes, loot: taken, outcome: "collected" };
}
function takeUnits(owner, raw, allowed, wrongUnit) {
  var _a, _b;
  const units = {};
  for (const [unitId, value] of Object.entries(raw != null ? raw : {})) {
    const qty = Math.floor(Number(value));
    if (!(qty > 0)) continue;
    if (!allowed(unitId)) throw new GameActionError(wrongUnit);
    if (((_b = (_a = owner.units[unitId]) == null ? void 0 : _a.count) != null ? _b : 0) < qty) throw new GameActionError("Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte.");
    units[unitId] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
  for (const [unitId, qty] of Object.entries(units)) owner.units[unitId].count -= qty;
  return units;
}
function newFleet(owner, target, mission, units, now, arriveAtMs) {
  return {
    ownerUid: owner.uid,
    ownerPseudo: owner.pseudo,
    targetUid: target.uid,
    targetPseudo: target.pseudo,
    mission,
    units,
    departAtMs: now,
    arriveAtMs,
    returnAtMs: null,
    status: "outbound",
    loot: null,
    reportId: "",
    outcome: "",
    recalled: false
  };
}
function launchSpy(owner, target, raw, now) {
  const units = takeUnits(owner, raw, (id) => id === SPY_RULES.probeUnitId, "Seules les sondes d'espionnage peuvent espionner.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + spyTravelSeconds(distanceBetween(owner.uid, target.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  return { attacker: owner, fleet: newFleet(owner, target, "spy", units, now, arriveAtMs), defenderNotifications: [] };
}
function launchRecycle(owner, field, raw, now) {
  if (!field || field.expiresAtMs <= now || debrisTotal(field) <= 0) throw new GameActionError("Ce champ de d\xE9bris n'existe plus.");
  const units = takeUnits(owner, raw, (id) => id === DEBRIS_RULES.recyclerUnitId, "Seuls les Drones r\xE9cup\xE9rateurs peuvent recycler.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, field.id), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  return {
    attacker: owner,
    fleet: newFleet(owner, { uid: field.id, pseudo: field.locationPseudo }, "recycle", units, now, arriveAtMs),
    defenderNotifications: []
  };
}
function patrolEnergyCost(units, fleet, minutes, techLevels2) {
  var _a, _b;
  const selected = {};
  for (const [id, qty] of Object.entries(fleet)) selected[id] = { level: (_b = (_a = units[id]) == null ? void 0 : _a.level) != null ? _b : 1, count: qty };
  return Math.ceil(getFleetUpkeep(selected, techLevels2) * minutes * 60);
}
function launchPatrol(owner, raw, minutes, now) {
  var _a, _b;
  const duration = Math.round(Number(minutes));
  if (!(duration >= PATROL_RULES.minMinutes && duration <= PATROL_RULES.maxMinutes)) {
    throw new GameActionError(`La patrouille dure entre ${PATROL_RULES.minMinutes} min et ${Math.round(PATROL_RULES.maxMinutes / 60)} h.`);
  }
  const requested = {};
  for (const [id, v] of Object.entries(raw != null ? raw : {})) {
    const qty = Math.floor(Number(v));
    if (qty > 0) requested[id] = qty;
  }
  const cost = patrolEnergyCost(owner.units, requested, duration, owner.techLevels);
  if (((_a = owner.resources.energy) != null ? _a : 0) < cost) throw new GameActionError(`Il faut ${formatInt(cost)} \xE9nergie pour l'entretien de la patrouille.`);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seuls les vaisseaux peuvent partir en patrouille.");
  owner.resources.energy = ((_b = owner.resources.energy) != null ? _b : 0) - cost;
  const arriveAtMs = now + duration * 6e4 / 2;
  return {
    attacker: owner,
    fleet: newFleet(owner, { uid: owner.uid, pseudo: "Patrouille" }, "patrol", units, now, arriveAtMs),
    defenderNotifications: []
  };
}
function launchGarrison(owner, host, raw, hoursIn, garrisonsAtHost, now) {
  var _a, _b;
  if (owner.uid === host.uid) throw new GameActionError("Tu ne peux pas stationner chez toi : utilise la patrouille.");
  if (!owner.allianceId || owner.allianceId !== host.allianceId) throw new GameActionError("Tu ne peux stationner que chez un membre de ton alliance.");
  const hours2 = Math.round(Number(hoursIn));
  if (!(hours2 >= ALLIANCE_RULES.garrisonMinHours && hours2 <= ALLIANCE_RULES.garrisonMaxHours)) {
    throw new GameActionError(`Le stationnement dure entre ${ALLIANCE_RULES.garrisonMinHours} h et ${ALLIANCE_RULES.garrisonMaxHours} h.`);
  }
  if (garrisonsAtHost >= ALLIANCE_RULES.maxGarrisonsPerHost) throw new GameActionError(`${host.pseudo} accueille d\xE9j\xE0 ${ALLIANCE_RULES.maxGarrisonsPerHost} garnisons.`);
  const requested = {};
  for (const [id, v] of Object.entries(raw != null ? raw : {})) {
    const qty = Math.floor(Number(v));
    if (qty > 0) requested[id] = qty;
  }
  const cost = patrolEnergyCost(owner.units, requested, hours2 * 60, owner.techLevels);
  if (((_a = owner.resources.energy) != null ? _a : 0) < cost) throw new GameActionError(`Il faut ${formatInt(cost)} \xE9nergie pour l'entretien de la garnison.`);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seuls les vaisseaux peuvent former une garnison.");
  owner.resources.energy = ((_b = owner.resources.energy) != null ? _b : 0) - cost;
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, host.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  const power = Math.round(computeFleetPower(owner.units, owner.techLevels, units, ["attack", "defense"]));
  const fleet = __spreadProps(__spreadValues({}, newFleet(owner, host, "garrison", units, now, arriveAtMs)), { durationMs: hours2 * 36e5, stationedUntilMs: null, power });
  return {
    attacker: owner,
    fleet,
    defenderNotifications: [
      {
        kind: "fleet",
        title: "Renforts en approche",
        message: `${owner.pseudo} t'envoie une garnison de ${formatInt(Object.values(units).reduce((a, b) => a + b, 0))} vaisseaux pour ${hours2} h.`,
        createdAtMs: now,
        read: false
      }
    ]
  };
}
function launchLair(owner, target, raw, now) {
  const faction = findFaction(factionOfLair(target));
  checkLairLaunch(faction, owner, raw);
  const power = lairPower(faction, owner);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seules les unit\xE9s d'attaque peuvent \xEAtre envoy\xE9es.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(LAIR_DISTANCE, speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1e3;
  return {
    attacker: owner,
    fleet: __spreadProps(__spreadValues({}, newFleet(owner, { uid: lairUid(faction.id), pseudo: faction.lair.name }, "lair", units, now, arriveAtMs)), { power, factionId: faction.id }),
    defenderNotifications: []
  };
}
function launchBounty(owner, contractId, raw, now) {
  const { contract, power, fugitive } = startBounty(owner, contractId, now);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux de combat peuvent chasser.");
  return {
    attacker: owner,
    fleet: __spreadProps(__spreadValues({}, newFleet(owner, { uid: bountyTarget(contract), pseudo: fugitive.name }, "bounty", units, now, now + contract.minutes * 6e4)), { power, factionId: fugitive.factionId }),
    defenderNotifications: []
  };
}
function bountyIdOf(targetUid) {
  return targetUid.startsWith("bounty_") ? targetUid.slice("bounty_".length) : "";
}
var ELITE_TARGET = "bounty_elite";
function beaconReturn(fleet, uid, now) {
  if (fleet.ownerUid !== uid) throw new GameActionError("Cette flotte ne t'appartient pas.");
  if (!["outbound", "returning", "stationed"].includes(fleet.status)) throw new GameActionError("Cette flotte n'est plus en vol.");
  if (fleet.mission === "expedition" || (fleet.mission === "leviathan" || fleet.mission === "seasonboss" || fleet.mission === "allianceboss" || fleet.mission === "elite") && fleet.status === "outbound") {
    throw new GameActionError("La balise ne peut pas ramener cette flotte.");
  }
  const recalled = fleet.status === "outbound" ? true : fleet.recalled;
  return __spreadProps(__spreadValues({}, fleet), { status: "returning", recalled, returnAtMs: now });
}
function unitsAwayOf(fleets, uid) {
  var _a, _b;
  const away = {};
  for (const f of fleets) {
    if (f.ownerUid !== uid || f.status === "done") continue;
    for (const [id, n] of Object.entries((_a = f.units) != null ? _a : {})) if (n > 0) away[id] = ((_b = away[id]) != null ? _b : 0) + n;
  }
  return away;
}
var LAIR_DISTANCE = 60;
function stationGarrison(fleet) {
  var _a;
  return __spreadProps(__spreadValues({}, fleet), { status: "stationed", stationedUntilMs: fleet.arriveAtMs + ((_a = fleet.durationMs) != null ? _a : 0) });
}
function endGarrison(fleet, now) {
  return __spreadProps(__spreadValues({}, fleet), { status: "returning", returnAtMs: now + (fleet.arriveAtMs - fleet.departAtMs) });
}
function patrolTurnaround(fleet) {
  return __spreadProps(__spreadValues({}, fleet), { status: "returning", returnAtMs: fleet.departAtMs + 2 * (fleet.arriveAtMs - fleet.departAtMs) });
}
function performFleetReturn(ownerIn, ownerQueues, fleet, now) {
  const flushed = flushState(__spreadProps(__spreadValues({}, ownerIn), { buildings: withMissingBuildings(ownerIn.buildings, ownerIn.resources) }), ownerQueues, now);
  const done = completeFleetReturn(flushed.player, fleet, now);
  return { owner: done.owner, queues: flushed.queues, notifications: [...flushed.notifications, ...done.notifications] };
}

// src/game/warlords.ts
var WARLORD_RULES = {
  /** Puissance visée : faibles et moyens par rapport à la médiane des actifs, forts par rapport au meilleur. */
  tierRange: { weak: [0.4, 0.6], medium: [0.8, 1.2], strong: [1.3, 1.8] },
  /** Puissance minimale (serveur presque vide). */
  minPower: 3e3,
  /** Croissance maximale par jour, en part de la puissance visée. */
  growthPerDay: 0.08,
  /** v5.5 : jamais plus de ce multiple de la meilleure défense de joueur ; au-delà, l'armée fond (même rythme que la croissance). */
  maxDefenseRatio: 2.5,
  /** Bâtiments : part du niveau moyen des actifs, et un niveau gagné toutes les 12 h au plus. */
  buildingFactor: { weak: 0.8, medium: 1, strong: 1.25 },
  buildingLevelEveryHours: 12,
  /** XP visée (classement) : même échelle que la puissance. */
  xpGrowthPerHour: 0.02,
  /** Joueur actif : vu dans les 7 derniers jours. */
  activeDays: 7,
  /** Attaques : une par 48 h (± 6 h) et par seigneur agressif ou opportuniste. */
  attackEveryHours: 48,
  attackJitterHours: 6,
  /** Nouvel essai quand aucune cible ne convient. */
  retryHours: 3,
  /** Une même cible : une attaque de seigneur par 72 h, tous seigneurs confondus. */
  targetCooldownHours: 72,
  /** Jamais sous Bronze I. */
  minTargetXp: 2e3,
  /** Puissance d'attaque envoyée : 80 à 110 % de la défense de la cible. */
  attackPowerMin: 0.8,
  attackPowerMax: 1.1,
  /** Trajet : 3 à 5 h (le joueur a le temps de réagir). */
  travelMinHours: 3,
  travelMaxHours: 5,
  /** Butin plafonné à 6 h de production de la cible. */
  lootCapHours: 6,
  /** Opportuniste : cible battue dans les 24 h, ou stock de plus de 18 h. */
  opportunistDefeatHours: 24,
  opportunistStockHours: 18,
  /** Stock gardé en réserve (heures de production). */
  stockHours: { builder: 12, default: 6 },
  /** Part de la puissance en vaisseaux d'attaque (le reste en défenses). */
  offenseShare: { aggressive: 0.8, opportunist: 0.7, builder: 0.3, merchant: 0.4 },
  /** Marchands : 3 offres par jour environ, à ±10 % du taux du comptoir. */
  marketOffersPerDay: 3,
  marketSpread: 0.1,
  marketOfferHours: 4,
  /** Messages : un par jour au plus, par seigneur et par joueur. */
  messageEveryHours: 24,
  /** Vendetta. */
  vendetta: {
    costHours: 6,
    durationHours: 72,
    goalFactor: 2,
    powerLoss: 0.3,
    awayDays: 7,
    passPoints: 40,
    /** Part minimale de l'objectif pour être récompensé (vendetta d'alliance). */
    minShare: 0.1
  }
};
var ORIGIN_ART = {
  kesh: { label: "Kesh'Vaar ren\xE9gats", art: "/assets/bounties/hunters.webp", emblem: "/assets/bounties/emblem.webp", color: "#ffb347" },
  choeur: { label: "D\xE9serteurs du Ch\u0153ur", art: "/assets/story/choeur.webp", emblem: "/assets/story/choeur-emblem.webp", color: "#b18cff" },
  confrerie: { label: "Anciens de la Confr\xE9rie", art: "/assets/story/varan.webp", emblem: "/assets/story/varan.webp", color: "#ff7a45" },
  gravhorn: { label: "Mercenaires Gravhorn", art: "/assets/story/gravhorn.webp", emblem: "/assets/story/gravhorn.webp", color: "#f2c94c" },
  leviathan: { label: "Culte du L\xE9viathan", art: "/assets/leviathan/leviathan-portrait.webp", emblem: "/assets/leviathan/leviathan-emblem.webp", color: "#3fd9c8" }
};
function warlordOrigin(origin) {
  var _a;
  return (_a = ORIGIN_ART[origin]) != null ? _a : ORIGIN_ART.kesh;
}
var PERSONALITY_LABELS = {
  aggressive: "Agressif",
  opportunist: "Opportuniste",
  builder: "B\xE2tisseur",
  merchant: "Marchand"
};
var TIER_LABELS2 = { weak: "Faible", medium: "Moyen", strong: "Fort" };
function warlordUid(id) {
  return `npc${id.toLowerCase().replace(/[^a-z0-9]/g, "")}000000000000`.slice(0, 15);
}
var def2 = (id, name, origin, personality, tier, bio, lines) => ({ id, name, origin, personality, tier, portrait: `/assets/warlords/${id}.webp`, emblem: `/assets/warlords/${id}-sceau.webp`, bio, enabled: true, lines });
var DEFAULT_WARLORDS = [
  def2("zharkesh", "Zhar'Kesh, l'Essaim Noir", "kesh", "aggressive", "strong", "Ancien roi d'une ruche rivale, banni par la Reine bien avant sa chute. Il porte encore les ornements d'or vol\xE9s aux couvains qu'il a br\xFBl\xE9s, et voit dans chaque jeune empire un couvain de plus.", {
    contact: ["{pseudo}. Vashka t'a choisi, para\xEEt-il. Moi aussi, je t'ai choisi : comme on choisit une proie dans un couvain."],
    raided: ["Tu as arrach\xE9 un peu de ma chitine, {pseudo}. Elle repousse. La tienne ne repoussera pas.", "Une morsure. Rien de plus. L'Essaim Noir se souviendra de ton odeur."],
    won: ["Ton couvain est ouvert, {pseudo}. J'ai pris ce que je voulais. Je reviendrai prendre le reste."],
    repelled: ["Tes d\xE9fenses ont tenu. Cette fois. Les ruches aussi tenaient, avant moi."],
    vendettaOpen: ["Une vendetta ? Enfin un peu de nectar. Viens, {pseudo}, et am\xE8ne tes amis : il y aura assez de cendres pour tous."],
    vendettaWon: ["Je me retire dans le Vide\u2026 pour l'instant. Garde bien ton titre, {pseudo} : je viendrai le reprendre sur ton cadavre."],
    vendettaLost: ["Trois jours, et pas une \xE9gratignure qui compte. Ma riposte arrive, {pseudo}."],
    reply: ["L'Essaim Noir ne n\xE9gocie pas avec la nourriture."]
  }),
  def2("tivrek", "Tivrek Mue-Rouge", "kesh", "aggressive", "medium", "Jeune Kesh'Vaar ren\xE9gat, en pleine mue, affam\xE9 et press\xE9. Il attaque comme il mue : sans pr\xE9venir et en laissant des morceaux derri\xE8re lui.", {
    contact: ["H\xE9, {pseudo} ! Ma nouvelle carapace me d\xE9mange. Rien de tel qu'un bon raid pour la faire durcir."],
    raided: ["A\xEFe ! Tu tapes fort pour un mou. Je reviens d\xE8s que ma chitine a durci."],
    won: ["Trop facile ! Merci pour le repas, {pseudo}. Je repasse quand j'ai encore faim, donc bient\xF4t."],
    repelled: ["Pfff, tes roquettes piquent. Je retenterai apr\xE8s ma prochaine mue."],
    vendettaOpen: ["Une vendetta contre moi ? G\xE9nial ! Personne ne m'avait jamais pris au s\xE9rieux."],
    vendettaWon: ["D'accord, d'accord, je file ! Mais je reviendrai plus gros, plus rouge et plus m\xE9chant."],
    vendettaLost: ["Ha ! Rat\xE9 ! \xC0 mon tour maintenant."],
    reply: ["Pas le temps de causer, je mue."]
  }),
  def2("ossaya", "Ossaya la Tisseuse", "kesh", "builder", "weak", "Architecte Kesh'Vaar qui a refus\xE9 de servir la nouvelle Reine. Elle tisse des forteresses de soie et de chitine, patiemment, et ne quitte jamais sa toile.", {
    contact: ["Bienvenue dans ma toile, {pseudo}. Je n'attaque personne. Mais ceux qui viennent \xE0 moi restent souvent coll\xE9s."],
    raided: ["Tu as d\xE9chir\xE9 quelques fils, {pseudo}. Je retisse. Je retisse toujours."],
    vendettaOpen: ["Une vendetta\u2026 Il faudra plus que de la col\xE8re pour d\xE9faire mille ans de patience."],
    vendettaWon: ["Ma toile est d\xE9chir\xE9e. Je pars en tisser une autre, loin d'ici. Tu as gagn\xE9, {pseudo}."],
    vendettaLost: ["Ta col\xE8re s'est us\xE9e sur mes fils. Pour une fois, je vais rendre la visite."],
    reply: ["Chut. Je compte les fils."]
  }),
  def2("ilyon", "Cantor Ilyon", "choeur", "builder", "strong", "Une voix du Ch\u0153ur Silencieux qui a choisi de parler seul. Il a grav\xE9 lui-m\xEAme une bouche dans son masque et b\xE2tit, loin de l'Archonte, une cath\xE9drale qu'aucune flotte n'a encore fissur\xE9e.", {
    contact: ["Je\u2026 parle. Seul. C'est encore \xE9trange. Je te salue, {pseudo}. Ne viens pas frapper \xE0 ma cath\xE9drale."],
    raided: ["Une fissure. Je l'entends chanter. Elle sera combl\xE9e avant l'aube."],
    vendettaOpen: ["Nous\u2026 je\u2026 Pardon. J'accepte ta vendetta, {pseudo}. Le cristal noir n'a jamais craint la col\xE8re."],
    vendettaWon: ["La cath\xE9drale s'effondre. Je retourne au silence quelque temps. Tu m'as appris quelque chose : la d\xE9faite a une voix."],
    vendettaLost: ["Tu t'es heurt\xE9 au cristal. Maintenant, \xE9coute le mien."],
    reply: ["Les mots me co\xFBtent encore. Pardonne ma bri\xE8vet\xE9."]
  }),
  def2("nerea", "S\u0153ur N\xE9r\xE9a des \xC9chos", "choeur", "merchant", "medium", "D\xE9serteuse du Ch\u0153ur au masque \xE0 moiti\xE9 bris\xE9. Elle vend ce que le Ch\u0153ur a appris, et ach\xE8te ce que vos laboratoires oublient. Ses prix sont justes ; ses sourires, moins.", {
    contact: ["Bonsoir, {pseudo}. J'ai quitt\xE9 le Ch\u0153ur pour une raison tr\xE8s simple : on ne peut rien vendre au silence. Passe au march\xE9."],
    raided: ["Piller une marchande\u2026 quel manque d'\xE9l\xE9gance, {pseudo}. Mes prix pour toi viennent de monter."],
    market: ["Une nouvelle offre t'attend au march\xE9, {pseudo}. Prix d'ami, ou presque."],
    vendettaOpen: ["Une vendetta est un tr\xE8s mauvais investissement, {pseudo}. Mais soit."],
    vendettaWon: ["Je ferme boutique quelques jours. Tu as gagn\xE9\u2026 et perdu une excellente fournisseuse."],
    vendettaLost: ["Les comptes sont faits, {pseudo}. Tu me dois une visite."],
    reply: ["Je ne r\xE9ponds qu'aux offres. Le march\xE9 est ouvert."]
  }),
  def2("brannoc", "Brannoc Demi-Barbe", "confrerie", "aggressive", "medium", "Ancien de la Confr\xE9rie du Vide, chass\xE9 par Varan pour avoir gard\xE9 une part de trop. La moiti\xE9 de sa barbe a br\xFBl\xE9 ce jour-l\xE0 ; l'autre moiti\xE9 attend sa revanche sur tout le secteur.", {
    contact: ["Alors c'est toi, {pseudo}, le nouveau dont Varan parle ? Moi, je ne fais pas d'ultimatum. Je viens, c'est tout."],
    raided: ["Tu m'as piqu\xE9 ma part, {pseudo}. La derni\xE8re fois qu'on a fait \xE7a, j'y ai laiss\xE9 la moiti\xE9 de ma barbe. Toi, tu y laisseras plus."],
    won: ["Pas de tribut, pas de liste, pas de discours : juste ta soute vid\xE9e. Bien le bonjour, {pseudo}."],
    repelled: ["Ta base tient mieux que ma barbe. Je reviendrai avec plus de poudre."],
    vendettaOpen: ["Une vendetta ! Comme au bon vieux temps de la Confr\xE9rie. Je fais chauffer les canons."],
    vendettaWon: ["Je me replie, {pseudo}. Mais garde un \u0153il sur ton ciel : Brannoc revient toujours."],
    vendettaLost: ["Trois jours et rien. \xC0 moi de jouer."],
    reply: ["Si tu veux causer, envoie des vaisseaux."]
  }),
  def2("lysa", "Lysa Ferro, \xAB la Comptable \xBB", "confrerie", "opportunist", "weak", "Ancienne intendante de la Confr\xE9rie. Elle tient le compte de chaque dette du secteur, et passe les encaisser au pire moment : juste apr\xE8s une d\xE9faite, ou quand les coffres d\xE9bordent.", {
    contact: ["{pseudo}, j'ouvre ton dossier. Rien \xE0 me reprocher pour l'instant. Pour l'instant."],
    raided: ["Not\xE9 dans mon registre, {pseudo}. Avec les int\xE9r\xEAts."],
    won: ["Dette encaiss\xE9e, {pseudo}. Tu \xE9tais \xE0 d\xE9couvert : je ne fais que r\xE9tablir l'\xE9quilibre."],
    repelled: ["Mauvais calcul de ma part. Je r\xE9vise mes pr\xE9visions."],
    vendettaOpen: ["Une vendetta co\xFBte cher, {pseudo}. Je vais te montrer combien."],
    vendettaWon: ["Je solde mes comptes et je disparais quelque temps. Bien jou\xE9."],
    vendettaLost: ["Fin de la p\xE9riode. Tu me dois une riposte, je viens la chercher."],
    reply: ["Ton dossier est \xE0 jour. Rien d'autre \xE0 dire."]
  }),
  def2("kragmor", "Kragmor Corne-Fendue", "gravhorn", "merchant", "weak", "Vieux Gravhorn qui a raccroch\xE9 les contrats de chasse pour ouvrir un comptoir. Il a perdu la moiti\xE9 d'une corne dans sa derni\xE8re traque et pr\xE9f\xE8re maintenant compter les cr\xE9dits que les troph\xE9es.", {
    contact: ["Ho, {pseudo} ! Kragmor, pour te servir. Je ne chasse plus : je vends. Ferraille, \xE9nergie, tout ce qu'il te faut."],
    raided: ["Tu as pill\xE9 mon comptoir ? H\xE9, j'ai \xE9t\xE9 chasseur, gamin. J'ai encore un fusil quelque part."],
    market: ["Arrivage frais au march\xE9, {pseudo}. Kragmor fait des prix pour les amis."],
    vendettaOpen: ["Une vendetta contre un vieux marchand ? Bon. Je ressors le fusil."],
    vendettaWon: ["Je ferme le comptoir quelques jours. Sans rancune, {pseudo}\u2026 presque."],
    vendettaLost: ["J'ai encore la main, hein ? Tiens, un petit souvenir de mes ann\xE9es de chasse."],
    reply: ["Pour causer, passe au march\xE9 !"]
  }),
  def2("thessa", "Thessa Vrill, la Traqueuse", "gravhorn", "opportunist", "medium", "Chasseuse Gravhorn sans contrat ni ma\xEEtre. Ses antennes captent la faiblesse \xE0 des parsecs : elle frappe les empires qui viennent de tomber, ou ceux qui ont laiss\xE9 leurs coffres trop pleins.", {
    contact: ["Je t'ai senti arriver, {pseudo}. Tu sens encore le neuf. Ne laisse jamais tes coffres trop pleins."],
    raided: ["Bien vis\xE9, {pseudo}. Je note l'odeur de ta flotte."],
    won: ["Tu sentais la d\xE9faite, {pseudo}. Je n'ai fait que suivre la piste."],
    repelled: ["Fausse piste. \xC7a arrive, m\xEAme aux meilleures."],
    vendettaOpen: ["Une vendetta, c'est une traque \xE0 l'envers. Voyons qui chasse qui, {pseudo}."],
    vendettaWon: ["Je me mets au vert quelque temps. Belle traque, {pseudo}."],
    vendettaLost: ["La traque est finie. Maintenant, c'est moi qui suis la piste."],
    reply: ["Je ne parle pas pendant une traque."]
  }),
  def2("maru", "Le Proph\xE8te Maru", "leviathan", "builder", "strong", "Proph\xE8te d'un culte qui v\xE9n\xE8re le L\xE9viathan comme un dieu. Il b\xE2tit des sanctuaires imprenables o\xF9 ses fid\xE8les attendent le prochain r\xE9veil de la b\xEAte, et garde leurs offrandes dans des chambres fortes sans fond.", {
    contact: ["Le L\xE9viathan r\xEAve de toi, {pseudo}. Moi, je me contente de prier. Ne trouble pas mon sanctuaire."],
    raided: ["Tu voles les offrandes du L\xE9viathan, {pseudo}. Il s'en souviendra le premier week-end du mois."],
    vendettaOpen: ["Une vendetta contre le sanctuaire ? Les profondeurs accueillent tous les pr\xE9somptueux."],
    vendettaWon: ["Le sanctuaire sombre. Je retourne dans les abysses m\xE9diter ta victoire, {pseudo}."],
    vendettaLost: ["Les eaux sont rest\xE9es calmes. \xC0 pr\xE9sent, la mar\xE9e monte vers toi."],
    reply: ["Le L\xE9viathan \xE9coute. Moi, je prie."]
  })
];
var DEFAULT_WARLORD_SETTINGS = { enabled: true, attackFrequency: 1, powerFactor: 1 };
var config2 = { settings: __spreadValues({}, DEFAULT_WARLORD_SETTINGS), defs: structuredClone(DEFAULT_WARLORDS) };
function setWarlords(next) {
  var _a, _b;
  const overrides = new Map(((_a = next == null ? void 0 : next.defs) != null ? _a : []).map((d) => [d.id, d]));
  config2 = {
    settings: __spreadValues(__spreadValues({}, DEFAULT_WARLORD_SETTINGS), (_b = next == null ? void 0 : next.settings) != null ? _b : {}),
    // Toujours les dix seigneurs du code ; l'administration modifie leurs champs.
    defs: DEFAULT_WARLORDS.map((d) => {
      var _a2;
      const o = overrides.get(d.id);
      return o ? __spreadProps(__spreadValues(__spreadValues({}, d), o), { id: d.id, lines: __spreadValues(__spreadValues({}, d.lines), (_a2 = o.lines) != null ? _a2 : {}) }) : structuredClone(d);
    })
  };
}
function warlordsConfig() {
  return config2;
}
function defaultWarlordsConfig() {
  return { settings: __spreadValues({}, DEFAULT_WARLORD_SETTINGS), defs: structuredClone(DEFAULT_WARLORDS) };
}
function findWarlord(id) {
  return config2.defs.find((d) => d.id === id);
}
function warlordByUid(uid) {
  return config2.defs.find((d) => warlordUid(d.id) === uid);
}
function isWarlordUid(uid) {
  return !!uid && uid.startsWith("npc") && !!warlordByUid(uid);
}
function validateWarlords(cfg) {
  var _a;
  const errors = [];
  const s = cfg == null ? void 0 : cfg.settings;
  if (s) {
    if (!(s.attackFrequency >= 0 && s.attackFrequency <= 5)) errors.push("Seigneurs : fr\xE9quence d'attaque entre 0 et 5.");
    if (!(s.powerFactor > 0 && s.powerFactor <= 5)) errors.push("Seigneurs : facteur de puissance entre 0 et 5.");
  }
  for (const d of (_a = cfg == null ? void 0 : cfg.defs) != null ? _a : []) {
    if (!DEFAULT_WARLORDS.some((w) => w.id === d.id)) errors.push(`Seigneurs : \xAB ${d.id} \xBB inconnu.`);
    if (d.name !== void 0 && !String(d.name).trim()) errors.push(`Seigneur ${d.id} : nom vide.`);
    if (d.personality && !(d.personality in PERSONALITY_LABELS)) errors.push(`Seigneur ${d.id} : personnalit\xE9 inconnue.`);
    if (d.tier && !(d.tier in TIER_LABELS2)) errors.push(`Seigneur ${d.id} : palier inconnu.`);
  }
  return errors;
}
function empirePower(p) {
  var _a, _b;
  const units = (_a = p.units) != null ? _a : {};
  const tech = (_b = p.techLevels) != null ? _b : {};
  return Math.round(computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]) + homeDefensePower(units, tech));
}
function warlordFleetPower(p) {
  var _a, _b;
  return Math.round(computeFullPower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack", "defense"]));
}
function lossesPower(p, losses) {
  var _a, _b;
  return Math.round(computeFleetPower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}, losses, ["attack", "defense"]));
}
function median(values) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function warlordReference(actives) {
  const humans = actives.filter((p) => !p.npc);
  const powers = humans.map(empirePower).filter((n) => n > 0);
  const xps = humans.map((p) => {
    var _a;
    return (_a = p.xp) != null ? _a : 0;
  }).filter((n) => n > 0);
  const buildings = {};
  for (const b of BUILDINGS) {
    const levels = humans.map((p) => {
      var _a, _b, _c;
      return (_c = (_b = (_a = p.buildings) == null ? void 0 : _a[b.id]) == null ? void 0 : _b.level) != null ? _c : 0;
    });
    buildings[b.id] = levels.length ? levels.reduce((a, c) => a + c, 0) / levels.length : 0;
  }
  return {
    median: median(powers),
    max: powers.length ? Math.max(...powers) : 0,
    medianXp: median(xps),
    maxXp: xps.length ? Math.max(...xps) : 0,
    medianSeasonXp: median(humans.map((p) => {
      var _a;
      return (_a = p.seasonXp) != null ? _a : 0;
    })),
    maxDefense: humans.length ? Math.max(0, ...humans.map((p) => {
      var _a, _b;
      return Math.round(homeDefensePower((_a = p.units) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {}));
    })) : 0,
    buildings
  };
}
function hash01(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1e3 / 999;
}
function tierFactor(d) {
  var _a;
  const [lo, hi] = (_a = WARLORD_RULES.tierRange[d.tier]) != null ? _a : WARLORD_RULES.tierRange.medium;
  return lo + (hi - lo) * hash01(d.id);
}
function warlordTargetPower(d, ref, settings = config2.settings) {
  var _a;
  const base = d.tier === "strong" ? ref.max : ref.median;
  const target = Math.round(base * tierFactor(d) * (settings.powerFactor || 1));
  const cap = ((_a = ref.maxDefense) != null ? _a : 0) > 0 ? ref.maxDefense * WARLORD_RULES.maxDefenseRatio : Infinity;
  return Math.max(WARLORD_RULES.minPower, Math.round(Math.min(target, cap)));
}
function warlordTargetXp(d, ref) {
  const base = d.tier === "strong" ? ref.maxXp : ref.medianXp;
  return Math.max(500, Math.round(base * tierFactor(d)));
}
function unitAttack(id) {
  var _a, _b;
  return (_b = (_a = UNIT_BASE_STATS[id]) == null ? void 0 : _a.attack) != null ? _b : 0;
}
function pickUnits(pool, tier) {
  const sorted = pool.filter((id) => unitAttack(id) >= 40).sort((a, b) => unitAttack(a) - unitAttack(b));
  if (sorted.length <= 2) return sorted;
  const third = Math.max(1, Math.floor(sorted.length / 3));
  const start = tier === "weak" ? 0 : tier === "medium" ? third : sorted.length - Math.max(2, third);
  return sorted.slice(start, start + 2).length === 2 ? sorted.slice(start, start + 2) : sorted.slice(-2);
}
function desiredArmy(d, targetPower2) {
  var _a;
  const share = (_a = WARLORD_RULES.offenseShare[d.personality]) != null ? _a : 0.5;
  const out = {};
  const ships = pickUnits(OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && id !== "drone_recuperateur" && id !== "cargo"), d.tier);
  const defenses = pickUnits(DEFENSIVE_UNITS, d.tier);
  ships.forEach((id) => {
    const per = computeFullPower({ [id]: { level: 1, count: 1 } }, {}, [id], ["attack"]);
    if (per > 0) out[id] = Math.ceil(targetPower2 * share / ships.length / per);
  });
  defenses.forEach((id) => {
    const per = homeDefensePower({ [id]: { level: 1, count: 1 } }, {});
    if (per > 0) out[id] = Math.ceil(targetPower2 * (1 - share) / defenses.length / per);
  });
  return out;
}
function emptyRuntime() {
  return { seeded: false, lastTickMs: 0, nextAttackAtMs: 0, nextMarketAtMs: 0, absentUntilMs: 0, lastBuildingAtMs: 0 };
}
function growWarlord(npc, d, ref, rt, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const out = __spreadValues({}, rt);
  const target = warlordTargetPower(d, ref);
  const desired = desiredArmy(d, target);
  const hours2 = rt.lastTickMs > 0 ? Math.min(48, Math.max(0, (now - rt.lastTickMs) / 36e5)) : 1;
  const step = rt.seeded ? Math.min(1, WARLORD_RULES.growthPerDay * (hours2 / 24)) : 1;
  for (const [id, want] of Object.entries(desired)) {
    const state = (_a = npc.units[id]) != null ? _a : { level: 1, count: 0 };
    const count2 = (_b = state.count) != null ? _b : 0;
    if (count2 < want) npc.units[id] = { level: Math.max(1, state.level || 1), count: Math.min(want, count2 + Math.ceil(want * step)) };
  }
  if (rt.seeded && empirePower(npc) > target * 1.1) {
    for (const [id, state] of Object.entries(npc.units)) {
      const want = (_c = desired[id]) != null ? _c : 0;
      const count2 = (_d = state == null ? void 0 : state.count) != null ? _d : 0;
      if (count2 > want) npc.units[id] = __spreadProps(__spreadValues({}, state), { count: Math.max(want, count2 - Math.ceil((count2 - want) * step)) });
    }
  }
  const buildStep = !rt.seeded || now - rt.lastBuildingAtMs >= WARLORD_RULES.buildingLevelEveryHours * 36e5;
  if (buildStep) {
    for (const b of BUILDINGS) {
      const want = Math.min(b.maxLevel, Math.round(((_e = ref.buildings[b.id]) != null ? _e : 0) * ((_f = WARLORD_RULES.buildingFactor[d.tier]) != null ? _f : 1)));
      const cur = (_h = (_g = npc.buildings[b.id]) == null ? void 0 : _g.level) != null ? _h : 0;
      if (want > cur) npc.buildings[b.id] = { level: rt.seeded ? cur + 1 : want, unlocked: true };
    }
    out.lastBuildingAtMs = now;
  }
  const stockHours = d.personality === "builder" ? WARLORD_RULES.stockHours.builder : WARLORD_RULES.stockHours.default;
  const stock = productionHours(npc, stockHours);
  for (const res of COMMON_RESOURCES2) {
    const want = (_i = stock[res]) != null ? _i : 0;
    const cur = (_j = npc.resources[res]) != null ? _j : 0;
    if (cur < want) npc.resources[res] = Math.min(want, cur + (rt.seeded ? Math.ceil(want * hours2 / 12) : want));
  }
  const xpTarget = warlordTargetXp(d, ref);
  const xp = (_k = npc.xp) != null ? _k : 0;
  const xpStep = Math.ceil(xpTarget * WARLORD_RULES.xpGrowthPerHour * hours2);
  npc.xp = xp < xpTarget ? rt.seeded ? Math.min(xpTarget, xp + xpStep) : xpTarget : xp;
  const seasonTarget = Math.round((ref.medianSeasonXp || 0) * tierFactor(d));
  npc.seasonXp = Math.max((_l = npc.seasonXp) != null ? _l : 0, rt.seeded ? Math.min(seasonTarget, ((_m = npc.seasonXp) != null ? _m : 0) + Math.ceil(seasonTarget * 0.05)) : seasonTarget);
  npc.resourcesUpdatedAtMs = now;
  out.seeded = true;
  out.lastTickMs = now;
  return out;
}
function shatterWarlord(npc, loss = WARLORD_RULES.vendetta.powerLoss) {
  var _a;
  for (const [id, st] of Object.entries((_a = npc.units) != null ? _a : {})) {
    if (st.count > 0) npc.units[id] = __spreadProps(__spreadValues({}, st), { count: Math.floor(st.count * (1 - loss)) });
  }
}
function warlordCanTarget(d, npc, t, now) {
  var _a, _b, _c, _d, _e, _f;
  const p = t.player;
  if (p.npc || ((_a = p.xp) != null ? _a : 0) < WARLORD_RULES.minTargetXp || onVacation(p, now)) return false;
  if (!t.reprisal && now - t.lastWarlordHitMs < WARLORD_RULES.targetCooldownHours * 36e5) return false;
  const check = checkAttackAllowed({
    now,
    attackerUid: npc.uid,
    attackerXp: 0,
    defenderUid: p.uid,
    defenderXp: (_b = p.xp) != null ? _b : 0,
    defenderCreatedAtMs: p.createdAtMs,
    defenderHasAttacked: ((_c = p.lastAttackAtMs) != null ? _c : 0) > 0,
    lastAttackOnTargetMs: t.lastAttackOnTargetMs,
    defenderAscendedAtMs: p.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(p),
    lastDefenderDefeatMs: (_d = p.lastDefeatAtMs) != null ? _d : null
  });
  if (!check.allowed) return false;
  if (d.personality === "opportunist" && !t.reprisal) {
    const beaten = ((_e = p.lastDefeatAtMs) != null ? _e : 0) > 0 && now - ((_f = p.lastDefeatAtMs) != null ? _f : 0) <= WARLORD_RULES.opportunistDefeatHours * 36e5;
    const prod = productionHours(p, WARLORD_RULES.opportunistStockHours);
    const rich = COMMON_RESOURCES2.some((res) => {
      var _a2, _b2, _c2, _d2;
      return ((_a2 = prod[res]) != null ? _a2 : 0) > 0 && ((_c2 = (_b2 = p.resources) == null ? void 0 : _b2[res]) != null ? _c2 : 0) >= ((_d2 = prod[res]) != null ? _d2 : 0);
    });
    if (!beaten && !rich) return false;
  }
  return true;
}
function composeWarlordFleet(npc, target, random = Math.random) {
  var _a, _b, _c, _d;
  const defense = homeDefensePower((_a = target.units) != null ? _a : {}, (_b = target.techLevels) != null ? _b : {});
  const goal = Math.max(1, defense) * (WARLORD_RULES.attackPowerMin + (WARLORD_RULES.attackPowerMax - WARLORD_RULES.attackPowerMin) * random());
  const ships = OFFENSIVE_UNITS.filter((id) => {
    var _a2, _b2;
    return id !== "sonde_espionnage" && ((_b2 = (_a2 = npc.units[id]) == null ? void 0 : _a2.count) != null ? _b2 : 0) > 0;
  }).map((id) => {
    var _a2;
    return { id, per: computeFleetPower(npc.units, (_a2 = npc.techLevels) != null ? _a2 : {}, { [id]: 1 }, ["attack"]) };
  }).filter((s) => s.per > 0).sort((a, b) => b.per - a.per);
  const fleet = {};
  let power = 0;
  for (const s of ships) {
    if (power >= goal) break;
    const have = (_d = (_c = npc.units[s.id]) == null ? void 0 : _c.count) != null ? _d : 0;
    const need = Math.min(have, Math.ceil((goal - power) / s.per));
    if (need > 0) {
      fleet[s.id] = need;
      power += need * s.per;
    }
  }
  if (power < Math.max(1, defense) * WARLORD_RULES.attackPowerMin) return null;
  return fleet;
}
function pickWarlordTarget(d, npc, candidates, now, random = Math.random) {
  const ok = candidates.filter((t) => warlordCanTarget(d, npc, t, now));
  const ordered = [...ok.filter((t) => t.reprisal), ...ok.filter((t) => !t.reprisal).sort(() => random() - 0.5)];
  for (const t of ordered) {
    const fleet = composeWarlordFleet(npc, t.player, random);
    if (fleet) return { target: t, fleet };
  }
  return null;
}
function nextAttackDelayMs(random = Math.random, settings = config2.settings) {
  const freq = settings.attackFrequency > 0 ? settings.attackFrequency : 0;
  if (freq <= 0) return 7 * 864e5;
  const h = WARLORD_RULES.attackEveryHours + (random() * 2 - 1) * WARLORD_RULES.attackJitterHours;
  return Math.round(h / freq * 36e5);
}
function warlordTravelMs(random = Math.random) {
  return Math.round((WARLORD_RULES.travelMinHours + (WARLORD_RULES.travelMaxHours - WARLORD_RULES.travelMinHours) * random()) * 36e5);
}
function warlordLootCap(target) {
  return Object.values(productionHours(target, WARLORD_RULES.lootCapHours)).reduce((a, b) => a + (b != null ? b : 0), 0);
}
function capLoot(loot, cap) {
  const total2 = Object.values(loot).reduce((a, b) => a + (b != null ? b : 0), 0);
  if (!(cap >= 0) || total2 <= cap || total2 <= 0) return loot;
  const k = cap / total2;
  return Object.fromEntries(Object.entries(loot).map(([r, n]) => [r, Math.floor((n != null ? n : 0) * k)]));
}
function warlordOffer(npc, random = Math.random) {
  var _a;
  const stocked = COMMON_RESOURCES2.filter((r) => {
    var _a2, _b;
    return ((_b = (_a2 = npc.resources) == null ? void 0 : _a2[r]) != null ? _b : 0) > 1e3;
  });
  if (stocked.length === 0) return null;
  const giveRes = stocked[Math.floor(random() * stocked.length)];
  const others = COMMON_RESOURCES2.filter((r) => r !== giveRes);
  const wantRes = others[Math.floor(random() * others.length)];
  const giveAmount = Math.max(500, Math.floor(((_a = npc.resources[giveRes]) != null ? _a : 0) * (0.1 + 0.15 * random())));
  const rate = getTradeRate(giveRes, wantRes);
  const wantAmount = Math.max(1, Math.round(giveAmount * rate * (1 + (random() * 2 - 1) * WARLORD_RULES.marketSpread)));
  return { giveRes, giveAmount, wantRes, wantAmount };
}
function nextMarketDelayMs(random = Math.random) {
  return Math.round(24 / WARLORD_RULES.marketOffersPerDay * (0.6 + 0.8 * random()) * 36e5);
}
function warlordLine(d, key, pseudo, random = Math.random) {
  var _a, _b;
  const lines = (_b = (_a = d.lines) == null ? void 0 : _a[key]) != null ? _b : [];
  if (lines.length === 0) return null;
  return lines[Math.floor(random() * lines.length)].split("{pseudo}").join(pseudo);
}
function nearestWarlord(uid, defs) {
  let best = null;
  let bestD = Infinity;
  for (const d of defs) {
    const dist = distanceBetween(uid, warlordUid(d.id));
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}
function warlordsState(raw) {
  var _a, _b, _c, _d;
  const r = raw && typeof raw === "object" ? raw : {};
  return __spreadValues({
    byId: __spreadValues({}, (_a = r.byId) != null ? _a : {}),
    hits: __spreadValues({}, (_b = r.hits) != null ? _b : {}),
    contacted: __spreadValues({}, (_c = r.contacted) != null ? _c : {}),
    lastMsg: __spreadValues({}, (_d = r.lastMsg) != null ? _d : {}),
    vendettas: Array.isArray(r.vendettas) ? [...r.vendettas] : [],
    reprisals: Array.isArray(r.reprisals) ? [...r.reprisals] : []
  }, r.coalitions ? { coalitions: r.coalitions } : {});
}
function canMessage(state, warlordId, uid, now) {
  var _a;
  return now - ((_a = state.lastMsg[`${warlordId}:${uid}`]) != null ? _a : 0) >= WARLORD_RULES.messageEveryHours * 36e5;
}
function activeVendetta(state, warlordId, now) {
  var _a;
  return (_a = state.vendettas.find((v) => v.warlordId === warlordId && v.status === "active" && now < v.endsAtMs)) != null ? _a : null;
}
function openVendetta(state, d, opener, scope, npc, rt, now) {
  var _a;
  if (rt && rt.absentUntilMs > now) throw new GameActionError(`${d.name} a quitt\xE9 le secteur : reviens apr\xE8s son retour.`);
  if (activeVendetta(state, d.id, now)) throw new GameActionError(`Une vendetta est d\xE9j\xE0 ouverte contre ${d.name}.`);
  if (state.vendettas.some((v2) => v2.status === "active" && now < v2.endsAtMs && v2.ownerUid === opener.uid)) throw new GameActionError("Tu m\xE8nes d\xE9j\xE0 une vendetta : termine-la d'abord.");
  if (scope === "alliance" && !opener.allianceId) throw new GameActionError("Rejoins une alliance pour ouvrir une vendetta d'alliance.");
  const goal = Math.max(1e3, Math.round(warlordFleetPower(npc) * WARLORD_RULES.vendetta.goalFactor));
  const v = {
    id: `${d.id}-${now}`,
    warlordId: d.id,
    ownerUid: opener.uid,
    ownerPseudo: opener.pseudo,
    allianceId: scope === "alliance" ? String((_a = opener.allianceId) != null ? _a : "") : "",
    startedAtMs: now,
    endsAtMs: now + WARLORD_RULES.vendetta.durationHours * 36e5,
    goal,
    dealt: 0,
    contributions: {},
    status: "active"
  };
  state.vendettas.push(v);
  return v;
}
function inVendetta(v, uid, allianceId) {
  return v.ownerUid === uid || !!v.allianceId && v.allianceId === allianceId;
}
function recordVendettaDamage(state, warlordId, uid, allianceId, power, now) {
  var _a;
  const v = activeVendetta(state, warlordId, now);
  if (!v || !(power > 0) || !inVendetta(v, uid, allianceId)) return null;
  v.dealt += Math.round(power);
  v.contributions[uid] = ((_a = v.contributions[uid]) != null ? _a : 0) + Math.round(power);
  if (v.dealt >= v.goal) {
    v.status = "won";
    v.finishedAtMs = now;
    return v;
  }
  return null;
}
function vendettaWinners(v) {
  return Object.entries(v.contributions).filter(([uid, n]) => n >= v.goal * WARLORD_RULES.vendetta.minShare || uid === v.ownerUid && n > 0).map(([uid]) => uid);
}
function vendettaTitle(d) {
  return `Tombeur de ${d.name.split(",")[0]}`;
}
function settleVendettas(state, now) {
  const lost = [];
  for (const v of state.vendettas) {
    if (v.status === "active" && now >= v.endsAtMs) {
      v.status = "lost";
      v.finishedAtMs = now;
      lost.push(v);
      state.reprisals.push({ warlordId: v.warlordId, uid: v.ownerUid, dueAtMs: now });
    }
  }
  state.vendettas = state.vendettas.filter((v) => {
    var _a;
    return v.status === "active" || now - ((_a = v.finishedAtMs) != null ? _a : v.endsAtMs) < 30 * 864e5;
  });
  return lost;
}
function warlordPublic(d, npc, rt, state, now) {
  var _a;
  const o = warlordOrigin(d.origin);
  const v = activeVendetta(state, d.id, now);
  return {
    id: d.id,
    uid: warlordUid(d.id),
    name: d.name,
    origin: d.origin,
    originLabel: o.label,
    personality: d.personality,
    tier: d.tier,
    portrait: d.portrait,
    emblem: d.emblem,
    fallbackArt: o.art,
    color: o.color,
    bio: d.bio,
    power: npc ? empirePower(npc) : 0,
    absentUntilMs: (_a = rt == null ? void 0 : rt.absentUntilMs) != null ? _a : 0,
    vendetta: v ? { id: v.id, ownerUid: v.ownerUid, ownerPseudo: v.ownerPseudo, allianceId: v.allianceId, endsAtMs: v.endsAtMs, goal: v.goal, dealt: v.dealt } : null
  };
}

// src/game/attack.ts
function performAttack(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G;
  const { now, attackerUid, defenderUid, defender } = input;
  const check = input.inFlight ? { allowed: true, message: void 0 } : checkAttackAllowed({
    now,
    attackerUid,
    attackerXp: (_a = input.attacker.xp) != null ? _a : 0,
    defenderUid,
    defenderXp: (_b = defender.xp) != null ? _b : 0,
    defenderCreatedAtMs: defender.createdAtMs,
    defenderHasAttacked: ((_c = defender.lastAttackAtMs) != null ? _c : 0) > 0,
    lastAttackOnTargetMs: input.lastAttackOnTargetMs,
    defenderAscendedAtMs: defender.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(defender),
    defenderVacationUntilMs: onVacation(defender, now) ? (_d = defender.vacation) == null ? void 0 : _d.untilMs : void 0,
    defenderIsWarlord: !!defender.npc,
    lastDefenderDefeatMs: (_e = defender.lastDefeatAtMs) != null ? _e : null
  });
  if (!check.allowed) return { ok: false, message: (_f = check.message) != null ? _f : "Attaque impossible." };
  const fleet = {};
  for (const [unitId, raw] of Object.entries((_g = input.fleet) != null ? _g : {})) {
    const qty = Math.floor(Number(raw));
    if (qty <= 0) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) return { ok: false, message: "Seules les unit\xE9s d'attaque peuvent \xEAtre envoy\xE9es." };
    fleet[unitId] = qty;
  }
  if (Object.keys(fleet).length === 0) return { ok: false, message: "S\xE9lectionne au moins une unit\xE9 \xE0 envoyer." };
  const flushed = flushState(
    __spreadProps(__spreadValues({}, input.attacker), { buildings: withMissingBuildings(input.attacker.buildings, input.attacker.resources) }),
    input.attackerQueues,
    now
  );
  const attacker = flushed.player;
  if (input.inFlight) {
    for (const [unitId, qty] of Object.entries(fleet)) {
      const state = (_h = attacker.units[unitId]) != null ? _h : { level: 1, count: 0 };
      attacker.units[unitId] = __spreadProps(__spreadValues({}, state), { count: state.count + qty });
    }
  }
  for (const [unitId, qty] of Object.entries(fleet)) {
    if (((_j = (_i = attacker.units[unitId]) == null ? void 0 : _i.count) != null ? _j : 0) < qty) {
      return { ok: false, message: "Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte." };
    }
  }
  const flushedDefender = flushState(__spreadProps(__spreadValues({}, defender), { buildings: withMissingBuildings(defender.buildings, defender.resources) }), input.defenderQueues, now);
  const owner = flushedDefender.player;
  const colony = input.colonyId ? colonyOf(owner, input.colonyId) : void 0;
  if (input.colonyId && !colony) return { ok: false, message: "Cette colonie n'existe plus." };
  const def3 = colony ? colonyView(owner, colony) : owner;
  const posture = postureEffects((_k = def3.posture) == null ? void 0 : _k.id);
  const formation = formationEffects(input.formation);
  const atkMods = playerModifiers(attacker);
  const defMods = playerModifiers(owner);
  const assault = Math.max(0, Math.min(50, Number((_l = input.boosts) == null ? void 0 : _l.assault) || 0)) / 100;
  const armor = consumeArmor(owner, now) / 100;
  const combat = resolveCombat(__spreadProps(__spreadValues({}, formation), {
    // v5.9 : les Traqueurs Kesh gardent leur +50 % contre les seigneurs de guerre (PNJ).
    attackFactor: formation.attackFactor * (1 + atkMods.attack + assault) * (owner.npc ? pveAttackFactor(attacker.units, attacker.techLevels, fleet) : 1),
    cargoFactor: formation.cargoFactor * (1 + atkMods.cargo),
    // v5.9 : un seigneur de guerre (PNJ) qui attaque affronte aussi le bonus des Traqueurs à quai.
    defenderPowerFactor: (1 + defMods.defense + armor) * (attacker.npc ? pveHomeDefenseFactor((_m = def3.units) != null ? _m : {}, (_n = def3.techLevels) != null ? _n : {}, posture.homeFleetFactor, posture.defenseFactor) : 1),
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    lootMultiplier: lootFactor(now),
    garrisons: (_o = input.garrisons) != null ? _o : [],
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(attacker.buildings), attacker),
    fleet,
    defenderUnits: (_p = def3.units) != null ? _p : {},
    defenderTechLevels: (_q = def3.techLevels) != null ? _q : {},
    defenderRepairPct: withRepairBonus(getRepairPercent(def3.buildings), owner),
    defenderShieldPct: getShieldPercent(def3.buildings, allianceShieldBonus(def3.allianceResearch)),
    // Le bunker de l'entrepôt met une partie du stock à l'abri du pillage.
    defenderResources: Object.fromEntries(
      Object.entries((_r = def3.resources) != null ? _r : {}).map(([res, amount3]) => [res, Math.max(0, (amount3 != null ? amount3 : 0) - protectedAmount(def3.buildings, res, def3.techLevels, def3.allianceResearch))])
    )
  }));
  const aegis = combat.outcome === "attacker_win" && Object.values((_s = combat.loot) != null ? _s : {}).some((n) => (n != null ? n : 0) > 0) && consumeAegis(owner, now);
  if (aegis) combat.loot = {};
  if (input.lootCap !== void 0 && combat.loot) combat.loot = capLoot(combat.loot, input.lootCap);
  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  const survivors = {};
  for (const [unitId, qty] of Object.entries(fleet)) survivors[unitId] = Math.max(0, qty - ((_t = combat.attackerLosses[unitId]) != null ? _t : 0));
  if (input.inFlight) {
    for (const [unitId, qty] of Object.entries(survivors)) {
      if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - qty);
    }
  }
  for (const [res, amt] of Object.entries((_u = combat.loot) != null ? _u : {})) {
    if (!input.inFlight) {
      attacker.resources[res] = ((_v = attacker.resources[res]) != null ? _v : 0) + (amt != null ? amt : 0);
      bumpStat(attacker, "loot", amt != null ? amt : 0);
    }
    def3.resources[res] = Math.max(0, ((_w = def3.resources[res]) != null ? _w : 0) - (amt != null ? amt : 0));
  }
  const destroyedByAttacker = Math.round(lostPower(combat.defenderLosses, def3.units, def3.techLevels));
  const destroyedByDefender = Math.round(lostPower(combat.attackerLosses, attacker.units, attacker.techLevels));
  bumpStat(attacker, "powerDestroyed", destroyedByAttacker);
  bumpStat(def3, "powerDestroyed", destroyedByDefender);
  addSeasonPower(attacker, destroyedByAttacker, now);
  addSeasonPower(def3, destroyedByDefender, now);
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def3.units[unitId]) def3.units[unitId].count = Math.max(0, def3.units[unitId].count - lost);
  }
  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") {
    if (attacker.lastDefeatAtMs && now - attacker.lastDefeatAtMs <= 36e5) setStat(attacker, "phoenix", 1);
    attacker.victories = ((_x = attacker.victories) != null ? _x : 0) + 1;
  } else if (combat.outcome === "defender_win") attacker.defeats = ((_y = attacker.defeats) != null ? _y : 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  attacker.lastAttackAtMs = now;
  if (combat.outcome === "defender_win") owner.victories = ((_z = owner.victories) != null ? _z : 0) + 1;
  else if (combat.outcome === "attacker_win") {
    owner.defeats = ((_A = owner.defeats) != null ? _A : 0) + 1;
    if (colony) colony.lastDefeatAtMs = now;
    else if (!owner.npc) owner.lastDefeatAtMs = now;
  }
  applyXpDelta(owner, defenderXpDelta, now);
  if (combat.outcome === "attacker_win") recordContract(attacker, "win_attack", 1, now);
  if (combat.outcome === "defender_win") recordContract(owner, "win_defense", 1, now);
  if (combat.outcome === "attacker_win") grantCommanderXp(attacker, "admiral", COMMANDER_XP.attackWin);
  if (combat.outcome === "attacker_win") addPassPoints(attacker, "victory", now);
  if (combat.outcome === "attacker_win" && owner.npc) recordChronicle(attacker, "warlordWin", now);
  if (combat.outcome === "defender_win") addPassPoints(owner, "victory", now);
  grantCommanderXp(owner, "strategist", combat.outcome === "defender_win" ? COMMANDER_XP.defenseWin : COMMANDER_XP.defenseLost);
  const outcomeTitle = {
    attacker_win: "Victoire !",
    defender_win: "D\xE9faite\u2026",
    draw: "Match nul"
  };
  const notifications = [
    ...flushed.notifications,
    {
      kind: "combat-attacker",
      title: (_B = outcomeTitle[combat.outcome]) != null ? _B : "Rapport de combat",
      message: `Attaque contre ${def3.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).${combat.loot && describeGain(combat.loot) !== "rien" ? ` Butin en route : ${describeGain(combat.loot)}.` : ""}`,
      createdAtMs: now,
      read: false
    }
  ];
  const defenderTitle = {
    attacker_win: "Tu as perdu ce combat...",
    defender_win: "Attaque repouss\xE9e !",
    draw: "Match nul."
  };
  const defenderNotifications = [
    ...flushedDefender.notifications,
    {
      kind: "combat-defender",
      title: (_C = defenderTitle[combat.outcome]) != null ? _C : "Rapport de combat",
      message: `Attaque de ${input.attacker.pseudo}${colony ? ` sur ${colony.name}` : ""}${defenderXpDelta ? ` (${defenderXpDelta > 0 ? "+" : ""}${defenderXpDelta} XP)` : ""}.${combat.loot && describeGain(combat.loot) !== "rien" ? ` Pill\xE9 : ${describeGain(combat.loot)}.` : ""}${aegis ? " L'\xC9gide de la Reine a prot\xE9g\xE9 tes r\xE9serves du pillage." : ""}${armor > 0 ? ` Carapace r\xE9active consomm\xE9e (+${Math.round(armor * 100)} % de d\xE9fense).` : ""}`,
      createdAtMs: now,
      read: false
    }
  ];
  const report = {
    attackerUid,
    attackerPseudo: input.attacker.pseudo,
    defenderUid,
    defenderPseudo: def3.pseudo,
    timestamp: now,
    outcome: combat.outcome,
    attackerPower: combat.attackerPower,
    defenderPower: combat.defenderPower,
    attackerLossPercent: combat.attackerLossPercent,
    defenderLossPercent: combat.defenderLossPercent,
    attackerLosses: combat.attackerLosses,
    attackerRecovered: combat.attackerRecovered,
    defenderLosses: combat.defenderLosses,
    defenderRecovered: combat.defenderRecovered,
    loot: combat.loot,
    defenderProcessed: false,
    attackerXpDelta: xp.attackerXp,
    defenderXpDelta,
    defenderApplied: true,
    garrisons: ((_D = input.garrisons) != null ? _D : []).map((g, i) => {
      var _a2, _b2;
      return { ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: (_b2 = (_a2 = combat.garrisonLosses) == null ? void 0 : _a2[i]) != null ? _b2 : {} };
    }),
    attackerFleet: fleet,
    planetId: colony ? colony.id : ""
  };
  return {
    ok: true,
    attacker,
    attackerQueues: flushed.queues,
    notifications,
    defender: owner,
    defenderQueues: flushedDefender.queues,
    defenderNotifications,
    report,
    combat,
    survivors,
    loot: (_E = combat.loot) != null ? _E : {},
    debris: debrisFromLosses([combat.attackerLosses, combat.defenderLosses, ...(_F = combat.garrisonLosses) != null ? _F : []], (_G = eventDebrisPercent(now)) != null ? _G : DEBRIS_RULES.percent)
  };
}
function lostPower(losses, units, techLevels2) {
  const lost = Object.fromEntries(Object.entries(losses).filter(([, n]) => n > 0).map(([id, n]) => {
    var _a, _b;
    return [id, { level: (_b = (_a = units == null ? void 0 : units[id]) == null ? void 0 : _a.level) != null ? _b : 1, count: n }];
  }));
  return computeFullPower(lost, techLevels2 != null ? techLevels2 : {}, Object.keys(lost), ["attack", "defense"]);
}

// src/game/streak.ts
var STREAK_RULES = {
  /** Heures de production des ressources communes, jours 1 à 7. */
  hours: [1, 1.5, 2, 2.5, 3, 3.5, 5],
  /** Ambre offerte au 7e jour du cycle. */
  amberDay7: 15,
  /** Plancher par ressource commune (petits empires). */
  floor: 2e3
};
function streakState(player) {
  var _a, _b;
  const raw = (_a = player.streak) != null ? _a : {};
  return { count: Number(raw.count) || 0, lastDay: String((_b = raw.lastDay) != null ? _b : ""), best: Number(raw.best) || 0, total: Number(raw.total) || 0 };
}
function previousDay2(day) {
  return new Date(Date.parse(`${day}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);
}
function cycleDay(count2) {
  return (Math.max(1, count2) - 1) % 7 + 1;
}
function streakReward(player, count2) {
  var _a;
  const day = cycleDay(count2);
  const raw = productionHours(player, STREAK_RULES.hours[day - 1]);
  const resources = {};
  for (const res of ["scrap", "energy", "nano", "data"]) resources[res] = Math.max(STREAK_RULES.floor, (_a = raw[res]) != null ? _a : 0);
  return { resources, amber: day === 7 ? STREAK_RULES.amberDay7 : 0 };
}
function streakStatus(player, now) {
  const st = streakState(player);
  const today = parisDay(now);
  if (st.lastDay === today) return { today, claimed: true, next: st.count + 1, current: st.count };
  const alive = st.lastDay === previousDay2(today);
  return { today, claimed: false, next: alive ? st.count + 1 : 1, current: alive ? st.count : 0 };
}
function claimStreak(player, now) {
  var _a, _b;
  const status = streakStatus(player, now);
  if (status.claimed) throw new GameActionError("R\xE9compense du jour d\xE9j\xE0 r\xE9clam\xE9e : reviens demain !");
  const st = streakState(player);
  const count2 = status.next;
  const reward = streakReward(player, count2);
  for (const [res, n] of Object.entries(reward.resources)) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + n;
  if (reward.amber > 0) {
    const b = bountyState(player);
    b.amber += reward.amber;
    b.amberEarned = ((_b = b.amberEarned) != null ? _b : 0) + reward.amber;
    player.bounties = b;
  }
  player.streak = { count: count2, lastDay: status.today, best: Math.max(st.best, count2), total: st.total + 1 };
  return __spreadValues({ count: count2 }, reward);
}

// src/game/cancel.ts
var CANCEL_RULES = {
  /** Annulation intégrale dans ce délai après le lancement (clic par erreur). */
  graceMs: 6e4,
  /** Part remboursée du temps restant. */
  refundPct: 0.8
};
function refundFraction(startMs, endMs, now) {
  if (now - startMs <= CANCEL_RULES.graceMs) return 1;
  const total2 = endMs - startMs;
  if (!(total2 > 0)) return 0;
  const remaining = Math.min(1, Math.max(0, (endMs - now) / total2));
  return remaining * CANCEL_RULES.refundPct;
}
function scaleCost(cost, fraction) {
  const out = {};
  for (const [res, n] of Object.entries(cost)) {
    const v = Math.floor((n != null ? n : 0) * fraction);
    if (v > 0) out[res] = v;
  }
  return out;
}
function addCost(a, b) {
  var _a;
  const out = __spreadValues({}, a);
  for (const [res, n] of Object.entries(b)) out[res] = ((_a = out[res]) != null ? _a : 0) + (n != null ? n : 0);
  return out;
}
function credit(target, refund) {
  var _a;
  for (const [res, n] of Object.entries(refund)) target[res] = ((_a = target[res]) != null ? _a : 0) + (n != null ? n : 0);
}
function unitGroupAt(queue, index) {
  if (index < 0 || index >= queue.length) return null;
  const unitId = queue[index].unitId;
  let start = index;
  while (start > 0 && queue[start - 1].unitId === unitId) start--;
  let end = index;
  while (end + 1 < queue.length && queue[end + 1].unitId === unitId) end++;
  return { start, count: end - start + 1 };
}
function quoteCancel(player, queues, target, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  switch (target.kind) {
    case "building": {
      const entry = queues.buildingUpgrades[target.id];
      const def3 = findBuilding(target.id);
      if (!entry || !def3) throw new GameActionError("Aucune am\xE9lioration en cours pour ce b\xE2timent.");
      const level3 = ((_b = (_a = player.buildings[target.id]) == null ? void 0 : _a.level) != null ? _b : 0) + 1;
      const paid = (_e = entry.paid) != null ? _e : applyBuildingDiscount(getBuildingUpgradeCost(def3, level3), (_d = (_c = player.bonuses) == null ? void 0 : _c.buildingUpgradeDiscount) != null ? _d : 0);
      const start = (_f = entry.startedAtMs) != null ? _f : entry.endTime - Math.round(getBuildingUpgradeTime(def3, level3) * playerBuildTimeFactor(player, now)) * 1e3;
      const fraction = refundFraction(start, entry.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${def3.name} niveau ${level3}` };
    }
    case "research": {
      const entry = queues.activeResearches.find((r) => r.id === target.id);
      const tech = findTech(target.id);
      if (!entry || !tech) throw new GameActionError("Cette recherche n'est pas en cours.");
      const level3 = ((_g = player.techLevels[target.id]) != null ? _g : 0) + 1;
      const paid = (_h = entry.paid) != null ? _h : getTechCost(tech, level3);
      const start = (_i = entry.startedAtMs) != null ? _i : entry.endTime - Math.round(getTechTime(tech, level3) * playerResearchTimeFactor(player, now)) * 1e3;
      const fraction = refundFraction(start, entry.endTime, now);
      const amber = Math.floor(((_j = entry.paidAmber) != null ? _j : 0) * fraction);
      return __spreadValues({ refund: scaleCost(paid, fraction), fraction, label: `${tech.nom} niveau ${level3}` }, amber > 0 ? { amber } : {});
    }
    case "units": {
      const queue = queues.unitQueues[target.category];
      const group = unitGroupAt(queue, target.index);
      const unit = group ? findUnit(queue[group.start].unitId) : void 0;
      if (!group || !unit) throw new GameActionError("Ce lot n'est plus dans la file.");
      const each = { scrap: unit.cost.scrap, energy: unit.cost.energy };
      let refund = {};
      let fraction = 1;
      for (let i = group.start; i < group.start + group.count; i++) {
        const e3 = queue[i];
        if (e3.endTime) {
          const f = refundFraction(e3.endTime - getUnitBuildTime(unit, player.techLevels) * 1e3, e3.endTime, now);
          fraction = Math.min(fraction, f);
          refund = addCost(refund, scaleCost(each, f));
        } else refund = addCost(refund, each);
      }
      return { refund, fraction, label: `${group.count} \xD7 ${unit.name}` };
    }
    case "colonyBuilding": {
      const colony = colonyOf(player, target.colonyId);
      const job = colony == null ? void 0 : colony.building;
      if (!colony || !job) throw new GameActionError("Aucune construction en cours sur cette colonie.");
      const paid = (_k = job.paid) != null ? _k : colonyUpgradeCost(player, job.id, job.level);
      const start = (_l = job.startedAtMs) != null ? _l : job.endTime - colonyUpgradeSeconds(player, job.id, job.level, now) * 1e3;
      const fraction = refundFraction(start, job.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${colony.name} : ${colonyBuildingName(colony, job.id)} niveau ${job.level}` };
    }
    case "colonyDefense": {
      const colony = colonyOf(player, target.colonyId);
      const job = colony == null ? void 0 : colony.defenseJob;
      const unit = job ? findUnit(job.unitId) : void 0;
      if (!colony || !job || !unit) throw new GameActionError("Aucune d\xE9fense en construction sur cette colonie.");
      const paid = (_m = job.paid) != null ? _m : { scrap: unit.cost.scrap * job.qty, energy: unit.cost.energy * job.qty };
      const start = (_n = job.startedAtMs) != null ? _n : job.endTime - colonyDefenseSeconds(player, job.unitId, job.qty) * 1e3;
      const fraction = refundFraction(start, job.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${colony.name} : ${job.qty} \xD7 ${unit.name}` };
    }
  }
}
function performCancel(player, queues, target, now) {
  var _a;
  const quote = quoteCancel(player, queues, target, now);
  switch (target.kind) {
    case "building":
      delete queues.buildingUpgrades[target.id];
      credit(player.resources, quote.refund);
      break;
    case "research":
      queues.activeResearches = queues.activeResearches.filter((r) => r.id !== target.id);
      credit(player.resources, quote.refund);
      if (quote.amber) {
        const bounty = bountyState(player);
        bounty.amber += quote.amber;
        player.bounties = bounty;
      }
      break;
    case "units": {
      const queue = queues.unitQueues[target.category];
      const group = unitGroupAt(queue, target.index);
      const wasRunning = group.start === 0 && !!((_a = queue[0]) == null ? void 0 : _a.endTime);
      queue.splice(group.start, group.count);
      if (wasRunning && queue[0] && !queue[0].endTime) {
        const next = findUnit(queue[0].unitId);
        queue[0].endTime = now + (next ? getUnitBuildTime(next, player.techLevels) : 0) * 1e3;
      }
      credit(player.resources, quote.refund);
      break;
    }
    case "colonyBuilding": {
      const colony = colonyOf(player, target.colonyId);
      colony.building = null;
      credit(colony.resources, quote.refund);
      break;
    }
    case "colonyDefense": {
      const colony = colonyOf(player, target.colonyId);
      colony.defenseJob = null;
      credit(colony.resources, quote.refund);
      break;
    }
  }
  return quote;
}
function isCancelTarget(raw) {
  const t = raw;
  if (!t || typeof t !== "object") return false;
  switch (t.kind) {
    case "building":
    case "research":
      return typeof t.id === "string" && !!t.id;
    case "units":
      return (t.category === "attack" || t.category === "defense") && Number.isInteger(t.index) && t.index >= 0;
    case "colonyBuilding":
    case "colonyDefense":
      return typeof t.colonyId === "string" && !!t.colonyId;
    default:
      return false;
  }
}

// src/game/profile.ts
var PROFILE_RULES = { mottoMax: 60, pinnedMax: 3 };
var FREE_BANNERS = [
  { id: "nebula", label: "N\xE9buleuse", gradient: "linear-gradient(120deg,#0b1430 0%,#1d2a6b 45%,#4be8ff55 100%)", hint: "Offerte" },
  { id: "aurore", label: "Aurore", gradient: "linear-gradient(120deg,#0a1a1a 0%,#0f4d45 50%,#5ef2b066 100%)", hint: "Offerte" },
  { id: "braise", label: "Braise", gradient: "linear-gradient(120deg,#1a0a06 0%,#5c1f0e 50%,#ff7a4566 100%)", hint: "Offerte" },
  { id: "abysse", label: "Abysse", gradient: "linear-gradient(120deg,#07060f 0%,#2a1450 50%,#a78bfa66 100%)", hint: "Offerte" }
];
function leviathanKills(p) {
  var _a;
  return Number((_a = p.stats) == null ? void 0 : _a.leviathanKills) || 0;
}
function bannerOptions(p) {
  var _a, _b, _c, _d;
  const kesh = bountyState(p);
  return [
    ...FREE_BANNERS.map((b) => __spreadProps(__spreadValues({}, b), { unlocked: true })),
    ...FACTIONS.filter((f) => f.banner || f.art).map((f) => ({
      id: `faction:${f.id}`,
      label: f.name,
      image: f.banner || f.art,
      hint: `Faire tomber ${f.lair.name}`,
      unlocked: pirateState(p, f.id).lairsTaken > 0
    })),
    { id: "kesh", label: "Essaim Kesh'Vaar", image: KESH.banner, hint: "Remplir une prime Kesh'Vaar", unlocked: kesh.completed > 0 },
    { id: "leviathan", label: "L\xE9viathan", image: "/assets/leviathan/leviathan.webp", hint: "Abattre un L\xE9viathan", unlocked: leviathanKills(p) > 0 },
    // v4.1 : parrainage et passes de saison terminés.
    { id: "recruteur", label: "Recruteur", gradient: "linear-gradient(120deg,#1a1405 0%,#6b4d0e 45%,#ffd86b88 100%)", hint: "Parrainer un joueur jusqu'\xE0 Bronze I", unlocked: ((_b = (_a = p.referral) == null ? void 0 : _a.recruits) != null ? _b : 0) > 0 },
    ...((_d = (_c = p.seasonPass) == null ? void 0 : _c.completed) != null ? _d : []).map((seasonId, i) => ({
      id: `pass:${seasonId}`,
      label: `Passe ${seasonLabel(seasonId)}`,
      gradient: PASS_GRADIENTS[i % PASS_GRADIENTS.length],
      hint: "Terminer le passe de saison",
      unlocked: true
    })),
    // v5.4 : une bannière par chapitre des Chroniques terminé.
    ...chroniclesConfig().months.filter((m) => m.completion).map((m) => {
      var _a2, _b2;
      return {
        id: `chapter:${m.id}`,
        label: `Chapitre \xAB ${m.title} \xBB`,
        gradient: m.completion.banner,
        hint: `Terminer les quatre \xE9pisodes de \xAB ${m.title} \xBB`,
        unlocked: ((_b2 = (_a2 = p.chronicle) == null ? void 0 : _a2.chapters) != null ? _b2 : []).includes(m.id)
      };
    })
  ];
}
var PASS_GRADIENTS = [
  "linear-gradient(120deg,#05101a 0%,#0e4d6b 40%,#4be8ff 70%,#a78bfa 100%)",
  "linear-gradient(120deg,#140514 0%,#5c0e4d 40%,#ff5df0 70%,#ffd86b 100%)",
  "linear-gradient(120deg,#05140c 0%,#0e5c3a 40%,#5ef2b0 70%,#4be8ff 100%)"
];
function emblemOptions(p) {
  const kesh = bountyState(p);
  return [
    { id: "rank", label: "Insigne de rang", hint: "Offert", unlocked: true },
    ...FACTIONS.filter((f) => f.emblem).map((f) => ({
      id: `faction:${f.id}`,
      label: `Sceau ${f.name}`,
      image: f.emblem,
      hint: `Faire tomber ${f.lair.name}`,
      unlocked: pirateState(p, f.id).lairsTaken > 0
    })),
    { id: "kesh", label: "Embl\xE8me de l'Essaim", image: KESH.emblem, hint: "Comptoir de la Ruche", unlocked: kesh.owned.includes("emblem") },
    { id: "leviathan", label: "Marque du L\xE9viathan", image: "/assets/leviathan/leviathan-emblem.webp", hint: "Abattre un L\xE9viathan", unlocked: leviathanKills(p) > 0 },
    // v4.3 : sceaux des boss de saison (uniques, jamais redonnés).
    ...bossEmblems(p).map((b) => __spreadProps(__spreadValues({}, b), { hint: "Participer \xE0 la chute du boss de saison" }))
  ];
}
function profileStyle(p) {
  var _a, _b, _c, _d, _e;
  const raw = (_a = p.profileStyle) != null ? _a : {};
  const unlocked = new Set((_b = p.unlockedAchievements) != null ? _b : []);
  const pinned = Array.isArray(raw.pinned) ? raw.pinned.filter((id, i, a) => typeof id === "string" && unlocked.has(id) && a.indexOf(id) === i).slice(0, PROFILE_RULES.pinnedMax) : [];
  return { banner: String((_c = raw.banner) != null ? _c : "nebula"), emblem: String((_d = raw.emblem) != null ? _d : "rank"), motto: String((_e = raw.motto) != null ? _e : ""), pinned };
}
function sanitizeMotto(text) {
  return String(text != null ? text : "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, PROFILE_RULES.mottoMax);
}
function setProfileStyle(player, input) {
  var _a;
  const req = input && typeof input === "object" ? input : {};
  const current2 = profileStyle(player);
  const next = __spreadValues({}, current2);
  if (req.banner !== void 0) {
    const opt = bannerOptions(player).find((o) => o.id === req.banner);
    if (!opt) throw new GameActionError("Banni\xE8re inconnue.");
    if (!opt.unlocked) throw new GameActionError(`Banni\xE8re verrouill\xE9e : ${opt.hint.toLowerCase()}.`);
    next.banner = opt.id;
  }
  if (req.emblem !== void 0) {
    const opt = emblemOptions(player).find((o) => o.id === req.emblem);
    if (!opt) throw new GameActionError("Embl\xE8me inconnu.");
    if (!opt.unlocked) throw new GameActionError(`Embl\xE8me verrouill\xE9 : ${opt.hint.toLowerCase()}.`);
    next.emblem = opt.id;
  }
  if (req.motto !== void 0) next.motto = sanitizeMotto(req.motto);
  if (req.pinned !== void 0) {
    if (!Array.isArray(req.pinned)) throw new GameActionError("Succ\xE8s mis en avant invalides.");
    const unlocked = new Set((_a = player.unlockedAchievements) != null ? _a : []);
    const ids = [...new Set(req.pinned.map(String))];
    if (ids.length > PROFILE_RULES.pinnedMax) throw new GameActionError(`${PROFILE_RULES.pinnedMax} succ\xE8s au plus en vitrine.`);
    if (ids.some((id) => !unlocked.has(id))) throw new GameActionError("Seuls les succ\xE8s obtenus peuvent \xEAtre mis en avant.");
    next.pinned = ids;
  }
  player.profileStyle = next;
  return next;
}
function publicShowcase(p) {
  var _a, _b;
  const style = profileStyle(p);
  const banner = (_a = bannerOptions(p).find((o) => o.id === style.banner && o.unlocked)) != null ? _a : __spreadProps(__spreadValues({}, FREE_BANNERS[0]), { unlocked: true });
  const emblem = emblemOptions(p).find((o) => o.id === style.emblem && o.unlocked);
  const st = commandersState(p);
  return {
    banner: banner.image ? { image: banner.image } : { gradient: banner.gradient },
    emblem: (_b = emblem == null ? void 0 : emblem.image) != null ? _b : null,
    motto: style.motto,
    achievements: style.pinned,
    commanders: st.active.map((id) => {
      var _a2, _b2;
      return { id, level: commanderLevel((_b2 = (_a2 = st.roster[id]) == null ? void 0 : _a2.xp) != null ? _b2 : 0) };
    }),
    relics: equippedRelics(p).map((r) => ({ template: r.template, rarity: r.rarity }))
  };
}

// src/game/announcements.ts
var SEEN_LIMIT = 120;
var SEEN_ID = /^[A-Za-z0-9._:-]{1,60}$/;
function addSeenAnnouncements(current2, ids) {
  const clean3 = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && SEEN_ID.test(id));
  const merged = [...(current2 != null ? current2 : []).filter((id) => !clean3.includes(id)), ...clean3];
  return merged.slice(-SEEN_LIMIT);
}

// src/game/actions.ts
var RESOURCE_IDS4 = new Set(RESOURCE_LIST.map((r) => r.id));
var MAX_QTY = 1e5;
function positiveInt(value, label3) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) throw new GameActionError(`${label3} invalide.`);
  return n;
}
function pay(player, cost, now, spending = true) {
  if (!canAffordAll(player.resources, cost)) throw new GameActionError("Ressources insuffisantes.");
  let total2 = 0;
  for (const [res, val] of Object.entries(cost)) {
    player.resources[res] -= val != null ? val : 0;
    total2 += val != null ? val : 0;
  }
  recordContract(player, "spend", total2, now);
  if (spending) bumpStat(player, "spent", total2);
}
function hangarUsed(units, away, category) {
  var _a;
  let used = 0;
  for (const [id, u] of Object.entries(units)) {
    const def3 = findUnit(id);
    if ((def3 == null ? void 0 : def3.category) === category) used += ((_a = u == null ? void 0 : u.count) != null ? _a : 0) * def3.hangarSpace;
  }
  for (const [id, n] of Object.entries(away)) {
    const def3 = findUnit(id);
    if ((def3 == null ? void 0 : def3.category) === category) used += (n > 0 ? n : 0) * def3.hangarSpace;
  }
  return used;
}
var VACATION_ACTIONS = /* @__PURE__ */ new Set(["sync", "seenAnnouncements", "setTitle", "hideOnboarding", "setProfileStyle", "colonyRename", "vacationEnd"]);
function applyAction(s, action) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
  const { player, queues, now } = s;
  if (onVacation(player, now) && !VACATION_ACTIONS.has(String(action == null ? void 0 : action.type))) {
    throw new GameActionError("Tu es en vacances : reviens d'abord (Param\xE8tres) pour jouer.");
  }
  switch (action == null ? void 0 : action.type) {
    case "sync": {
      const elapsedMs = Math.max(0, now - (s.preFlushPlayer.resourcesUpdatedAtMs || now));
      const playtime = Math.min(Math.max(0, Number(action.playtimeDeltaSeconds) || 0), elapsedMs / 1e3 + 5, 300);
      player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.floor(playtime);
      if (!onVacation(player, now)) passDailyLogin(player, now);
      recordActiveDay(player, now);
      if (now - ((_a = player.lastActiveMs) != null ? _a : 0) >= PRESENCE_WRITE_MS) player.lastActiveMs = now;
      const resourceGains = {};
      for (const key of Object.keys(player.resources)) {
        const delta = ((_b = player.resources[key]) != null ? _b : 0) - ((_c = s.preFlushPlayer.resources[key]) != null ? _c : 0);
        if (delta > 0) resourceGains[key] = delta;
      }
      const summary = { elapsedMs, resourceGains, notifications: s.flushNotifications };
      return summary;
    }
    case "unlockBuilding": {
      const info = BUILDING_UNLOCK_COST[action.buildingId];
      const state = player.buildings[action.buildingId];
      if (!info || !state) throw new GameActionError("Ce b\xE2timent se d\xE9bloque via le Labo.");
      if (state.unlocked) throw new GameActionError("D\xE9j\xE0 d\xE9bloqu\xE9.");
      const cost = {};
      if ("multi" in info) info.resources.forEach((r) => cost[r.resource] = r.amount);
      else cost[info.resource] = info.amount;
      pay(player, cost, now);
      state.unlocked = true;
      return void 0;
    }
    case "upgradeBuilding": {
      const def3 = findBuilding(action.buildingId);
      const state = player.buildings[action.buildingId];
      if (!def3 || !state) throw new GameActionError("B\xE2timent inconnu.");
      if (!state.unlocked && !def3.startsUnlocked) throw new GameActionError("Ce b\xE2timent n'est pas d\xE9bloqu\xE9.");
      if (queues.buildingUpgrades[def3.id]) throw new GameActionError("Am\xE9lioration d\xE9j\xE0 en cours.");
      if (state.level >= def3.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      const nextLevel = state.level + 1;
      const paid = applyBuildingDiscount(getBuildingUpgradeCost(def3, nextLevel), (_e = (_d = player.bonuses) == null ? void 0 : _d.buildingUpgradeDiscount) != null ? _e : 0);
      pay(player, paid, now);
      queues.buildingUpgrades[def3.id] = { endTime: now + Math.round(getBuildingUpgradeTime(def3, nextLevel) * playerBuildTimeFactor(player, now)) * 1e3, startedAtMs: now, paid };
      recordContract(player, "upgrade_building", 1, now);
      return void 0;
    }
    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unit\xE9 invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantit\xE9"), MAX_QTY);
      if (((_g = (_f = player.units[unit.id]) == null ? void 0 : _f.level) != null ? _g : 0) <= 0) throw new GameActionError("Cette unit\xE9 doit d'abord \xEAtre d\xE9bloqu\xE9e via le Labo.");
      const category = unit.category;
      const built = hangarUsed(player.units, s.unitsAway, category);
      const reserved = queues.unitQueues[category].reduce((sum3, item) => {
        var _a2, _b2;
        return sum3 + ((_b2 = (_a2 = findUnit(item.unitId)) == null ? void 0 : _a2.hangarSpace) != null ? _b2 : 1);
      }, 0);
      if (built + reserved + qty * unit.hangarSpace > getUnitCapacity(player.buildings, category, player.techLevels)) {
        throw new GameActionError(`Capacit\xE9 du hangar ${category === "attack" ? "d'attaque" : "de d\xE9fense"} insuffisante.`);
      }
      pay(player, { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty }, now);
      recordContract(player, "build_units", qty, now);
      const queue = queues.unitQueues[category];
      const wasEmpty = queue.length === 0;
      for (let i = 0; i < qty; i++) queue.push({ unitId: unit.id, endTime: null });
      if (wasEmpty) queue[0].endTime = now + getUnitBuildTime(unit, player.techLevels) * 1e3;
      return void 0;
    }
    case "sellUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unit\xE9 invalide.");
      const qty = positiveInt(action.qty, "Quantit\xE9");
      if (((_i = (_h = player.units[unit.id]) == null ? void 0 : _h.count) != null ? _i : 0) < qty) throw new GameActionError("Tu n'as pas assez d'unit\xE9s \xE0 vendre.");
      player.units[unit.id].count -= qty;
      player.resources.scrap += Math.floor(unit.cost.scrap * 0.5) * qty;
      player.resources.energy += Math.floor(unit.cost.energy * 0.5) * qty;
      return void 0;
    }
    case "research": {
      const tech = findTech(action.techId);
      if (!tech) throw new GameActionError("Technologie inconnue.");
      const nextLevel = ((_j = player.techLevels[tech.id]) != null ? _j : 0) + 1;
      if (nextLevel > tech.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      if (!checkPrereqs(tech, player.techLevels, ownedBlueprints(player)).valid) throw new GameActionError("Pr\xE9requis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est d\xE9j\xE0 en cours de recherche.");
      if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
      }
      const paid = getTechCost(tech, nextLevel);
      const amber = getTechAmberCost(tech);
      const bounty = amber > 0 ? bountyState(player) : null;
      if (bounty && bounty.amber < amber) throw new GameActionError(`Pas assez d'ambre (${amber} requis).`);
      pay(player, paid, now);
      if (bounty) {
        bounty.amber -= amber;
        player.bounties = bounty;
      }
      queues.activeResearches.push(__spreadValues({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * playerResearchTimeFactor(player, now)) * 1e3, startedAtMs: now, paid }, amber > 0 ? { paidAmber: amber } : {}));
      bumpStat(player, "researchStarted");
      recordContract(player, "research", 1, now);
      const hour = parisHour(now);
      if (hour >= 3 && hour < 5) setStat(player, "nightResearch", 1);
      return void 0;
    }
    case "mission": {
      const mission = MISSIONS[action.missionKey];
      if (!mission) throw new GameActionError("Mission inconnue.");
      if (queues.activeMissions.some((m) => m.key === mission.key)) throw new GameActionError("Mission d\xE9j\xE0 en cours.");
      if (!hasPrerequisites(mission, player.units)) throw new GameActionError("Pr\xE9requis non remplis.");
      queues.activeMissions.push({ key: mission.key, endTime: now + mission.duration * 1e3 });
      return void 0;
    }
    case "trade": {
      const { sellId, buyId } = action;
      if (!RESOURCE_IDS4.has(sellId) || !RESOURCE_IDS4.has(buyId) || sellId === buyId) throw new GameActionError("\xC9change invalide.");
      const amount3 = positiveInt(action.amount, "Montant");
      if (((_k = player.resources[sellId]) != null ? _k : 0) < amount3) throw new GameActionError("Pas assez de ressources \xE0 \xE9changer.");
      const gained = Math.floor(amount3 * getTradeRate(sellId, buyId));
      player.resources[sellId] -= amount3;
      player.resources[buyId] = ((_l = player.resources[buyId]) != null ? _l : 0) + gained;
      bumpStat(player, "traded", amount3);
      grantCommanderXp(player, "steward", COMMANDER_XP.marketTrade);
      return gained;
    }
    case "claimContract": {
      const claimed = claimContract(player, String((_m = action.contractId) != null ? _m : ""), now);
      bumpStat(player, "contracts");
      addPassPoints(player, "contract", now);
      grantCommanderXp(player, "steward", COMMANDER_XP.contractClaimed);
      return claimed;
    }
    case "rerollContract":
      return rerollContract(player, String((_n = action.contractId) != null ? _n : ""), now);
    case "setTitle":
      setActiveTitle(player, String((_o = action.title) != null ? _o : ""));
      return player.activeTitle;
    case "claimOnboarding":
      return claimOnboarding(player, String((_p = action.stepId) != null ? _p : ""));
    case "setPosture":
      return setPosture(player, action.posture, now);
    case "planBuilding":
      return addPlanned(player, queues, action.buildingId, now);
    case "unplanBuilding":
      removePlanned(queues, action.index);
      return { plan: queues.buildPlan };
    case "seenAnnouncements":
      player.announcementsSeen = addSeenAnnouncements(player.announcementsSeen, action.ids);
      return { seen: player.announcementsSeen.length };
    case "hideOnboarding":
      setOnboardingHidden(player, action.hidden === true);
      return player.onboarding;
    case "ascend":
      ascend(player, queues, now);
      return { ascensions: player.ascensions };
    case "colonize":
      return startColonization(player, action.name, now);
    case "colonyUpgrade":
      return upgradeColonyBuilding(player, String((_q = action.colonyId) != null ? _q : ""), String((_r = action.buildingId) != null ? _r : ""), now);
    case "colonyDefense":
      return buildColonyDefense(player, String((_s = action.colonyId) != null ? _s : ""), String((_t = action.unitId) != null ? _t : ""), action.qty, now);
    case "colonyRename":
      renameColony(player, String((_u = action.colonyId) != null ? _u : ""), action.name);
      return void 0;
    case "commanderRecruit": {
      const method = action.method === "production" ? "production" : "amber";
      const def3 = recruitCommander(
        player,
        action.commanderId,
        (m) => {
          if (m === "production") {
            pay(player, productionHours(player, COMMANDER_RULES.recruitProductionHours), now);
            return;
          }
          const st = bountyState(player);
          if (st.amber < COMMANDER_RULES.recruitAmber) throw new GameActionError(`Il faut ${COMMANDER_RULES.recruitAmber} Ambre de Ruche (primes Kesh'Vaar).`);
          st.amber -= COMMANDER_RULES.recruitAmber;
          player.bounties = st;
        },
        method
      );
      return { id: def3.id };
    }
    case "commanderAssign":
      assignCommanders(player, action.ids, now);
      return void 0;
    case "commanderTrain":
      return { level: trainCommander(player, action.commanderId) };
    case "synthCraft":
      return craftCapsule(player, action.capsule, action.level, now);
    case "synthActivate":
      return { pct: activateCapsule(player, action.capsule, action.level, now) };
    case "relicEquip":
      equipRelic(player, action.slot, action.relicId);
      return void 0;
    case "relicFuse":
      return fuseRelics(player, action.template, action.rarity, now);
    case "relicRecycle": {
      const out = recycleRelic(player, action.relicId);
      const st = bountyState(player);
      st.amber += out.amber;
      player.bounties = st;
      return { amber: out.amber };
    }
    case "setProfileStyle":
      return setProfileStyle(player, action.style);
    case "talentLearn":
      return learnTalent(player, action.talentId);
    case "talentReset":
      return resetTalents(player, now);
    case "streakClaim":
      return claimStreak(player, now);
    case "passClaim":
      return { gained: claimPassTier(player, action.tier, now) };
    case "chronicleClaim":
      return claimChronicle(player, action.episode, now);
    case "cancel":
      if (!isCancelTarget(action.target)) throw new GameActionError("Chantier inconnu.");
      return performCancel(player, queues, action.target, now);
    case "vacationEnd":
      endVacation(player, queues, now, true);
      return true;
    default:
      throw new GameActionError("Action inconnue.");
  }
}
function performPlayerAction(playerIn, queuesIn, action, now, unitsAway = {}) {
  const preFlushPlayer = __spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) });
  const flushed = flushState(preFlushPlayer, queuesIn, now);
  const result = applyAction(
    { player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications, now, unitsAway },
    action
  );
  return { player: flushed.player, queues: flushed.queues, notifications: flushed.notifications, result };
}
function performGift(sender, senderQueues, recipient, recipientQueues, rawResources, now) {
  var _a;
  if (sender.uid === recipient.uid) throw new GameActionError("Tu ne peux pas t'envoyer des ressources \xE0 toi-m\xEAme !");
  if (recipient.npc) throw new GameActionError("On ne fait pas de cadeau \xE0 un seigneur de guerre.");
  if (onVacation(sender, now)) throw new GameActionError("Tu es en vacances : reviens d'abord pour envoyer des ressources.");
  const resources = {};
  for (const [res, raw] of Object.entries(rawResources != null ? rawResources : {})) {
    const n = Math.floor(Number(raw));
    if (!RESOURCE_IDS4.has(res) || !Number.isFinite(n) || n < 0) throw new GameActionError("Ressources invalides.");
    if (n > 0) resources[res] = n;
  }
  if (Object.keys(resources).length === 0) throw new GameActionError("S\xE9lectionne au moins une ressource \xE0 envoyer.");
  const s = flushState(__spreadProps(__spreadValues({}, sender), { buildings: withMissingBuildings(sender.buildings, sender.resources) }), senderQueues, now);
  const r = flushState(__spreadProps(__spreadValues({}, recipient), { buildings: withMissingBuildings(recipient.buildings, recipient.resources) }), recipientQueues, now);
  pay(s.player, resources, now, false);
  recordContract(s.player, "gift", 1, now);
  for (const [res, amt] of Object.entries(resources)) {
    r.player.resources[res] = ((_a = r.player.resources[res]) != null ? _a : 0) + (amt != null ? amt : 0);
  }
  r.notifications.push({
    kind: "gift",
    title: "Ressources re\xE7ues !",
    message: `${sender.pseudo} t'a envoy\xE9 des ressources.`,
    createdAtMs: now,
    read: false
  });
  return {
    sender: s.player,
    senderQueues: s.queues,
    senderNotifications: s.notifications,
    recipient: r.player,
    recipientQueues: r.queues,
    recipientNotifications: r.notifications,
    resources
  };
}
function newPlayerProfile(uid, rawPseudo, now) {
  const pseudo = String(rawPseudo != null ? rawPseudo : "").trim().replace(/\s+/g, " ").slice(0, 30) || "Joueur";
  const player = __spreadProps(__spreadValues({}, defaultPlayerState(uid, pseudo)), { createdAtMs: now, resourcesUpdatedAtMs: now });
  return { player, queues: defaultQueues() };
}
function applyLegacyBattleReport(playerIn, queuesIn, report, now) {
  var _a, _b, _c, _d, _e, _f;
  const { player, queues, notifications } = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  for (const [unitId, lost] of Object.entries((_a = report.defenderLosses) != null ? _a : {})) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - (Number(lost) || 0));
  }
  for (const [res, amt] of Object.entries((_b = report.loot) != null ? _b : {})) {
    const key = res;
    if (RESOURCE_IDS4.has(key)) player.resources[key] = Math.max(0, ((_c = player.resources[key]) != null ? _c : 0) - (Number(amt) || 0));
  }
  if (report.outcome === "defender_win") player.victories = ((_d = player.victories) != null ? _d : 0) + 1;
  else if (report.outcome === "attacker_win") player.defeats = ((_e = player.defeats) != null ? _e : 0) + 1;
  applyXpDelta(player, Number(report.defenderXpDelta) || 0, now);
  const title = { attacker_win: "Tu as perdu ce combat...", defender_win: "Attaque repouss\xE9e !", draw: "Match nul." };
  notifications.push({
    kind: "combat-defender",
    title: (_f = title[report.outcome]) != null ? _f : "Rapport de combat",
    message: `Attaque de ${report.attackerPseudo}.`,
    createdAtMs: now,
    read: false
  });
  return { player, queues, notifications };
}
function applyLegacyGift(playerIn, queuesIn, gift, now) {
  var _a, _b;
  const { player, queues, notifications } = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }), queuesIn, now);
  for (const [res, amt] of Object.entries((_a = gift.resources) != null ? _a : {})) {
    const n = Math.floor(Number(amt));
    if (RESOURCE_IDS4.has(res) && Number.isFinite(n) && n > 0) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + n;
  }
  notifications.push({ kind: "gift", title: "Ressources re\xE7ues !", message: `${gift.fromPseudo} t'a envoy\xE9 des ressources.`, createdAtMs: now, read: false });
  return { player, queues, notifications };
}

// src/game/analytics.ts
var HOUR9 = 36e5;
var DAY8 = 24 * HOUR9;
function median2(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
var pct4 = (n, total2) => total2 > 0 ? Math.round(n / total2 * 1e3) / 10 : 0;
var round1 = (n) => Math.round(n * 10) / 10;
function topCounts(values, limit) {
  const counts = /* @__PURE__ */ new Map();
  values.forEach((v) => {
    var _a;
    return counts.set(v, ((_a = counts.get(v)) != null ? _a : 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([pseudo, count2]) => ({ pseudo, count: count2 }));
}
function computeGameStats(players, queues, reports, now, windowDays = 7, balanceDays = 30) {
  const n = players.length;
  const lastSeen = (p) => Math.min(now, lastActivity(p));
  const families = /* @__PURE__ */ new Map();
  players.forEach((p) => {
    var _a, _b;
    const family = getRank((_a = p.xp) != null ? _a : 0).family;
    families.set(family, ((_b = families.get(family)) != null ? _b : 0) + 1);
  });
  const rates = players.map((p) => {
    var _a, _b;
    return getProductionRatesPerSecond((_a = p.buildings) != null ? _a : {}, (_b = p.techLevels) != null ? _b : {});
  });
  const buildings = BUILDINGS.map((b) => {
    const levels = players.map((p) => {
      var _a;
      return effectiveBuildingLevel((_a = p.buildings) != null ? _a : {}, b.id);
    });
    return {
      id: b.id,
      name: b.name,
      avgLevel: round1(levels.reduce((a, l) => a + l, 0) / Math.max(1, n)),
      maxLevel: b.maxLevel,
      unlockedPct: pct4(levels.filter((l) => l > 0).length, n),
      maxedPct: pct4(levels.filter((l) => l >= b.maxLevel).length, n)
    };
  });
  const technologies = TECHNOLOGIES.map((t) => {
    const levels = players.map((p) => {
      var _a, _b;
      return (_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0;
    });
    return {
      id: t.id,
      name: t.nom,
      researchedPct: pct4(levels.filter((l) => l > 0).length, n),
      avgLevel: round1(levels.reduce((a, l) => a + l, 0) / Math.max(1, n)),
      maxLevel: t.maxLevel
    };
  });
  const units = UNITS.map((u) => {
    const owned = players.map((p) => {
      var _a;
      return (_a = p.units) == null ? void 0 : _a[u.id];
    });
    return {
      id: u.id,
      name: u.name,
      total: owned.reduce((a, s) => {
        var _a;
        return a + ((_a = s == null ? void 0 : s.count) != null ? _a : 0);
      }, 0),
      ownersPct: pct4(owned.filter((s) => {
        var _a;
        return ((_a = s == null ? void 0 : s.count) != null ? _a : 0) > 0;
      }).length, n),
      unlockedPct: pct4(owned.filter((s) => {
        var _a;
        return ((_a = s == null ? void 0 : s.level) != null ? _a : 0) > 0;
      }).length, n)
    };
  });
  const missionCounts = /* @__PURE__ */ new Map();
  queues.forEach((q) => {
    var _a;
    return ((_a = q.activeMissions) != null ? _a : []).forEach((m) => {
      var _a2;
      return missionCounts.set(m.key, ((_a2 = missionCounts.get(m.key)) != null ? _a2 : 0) + 1);
    });
  });
  const missions = Object.values(MISSIONS).map((m) => {
    var _a;
    return { key: m.key, name: m.name, running: (_a = missionCounts.get(m.key)) != null ? _a : 0 };
  }).sort((a, b) => b.running - a.running);
  const since = now - windowDays * DAY8;
  const recent = reports.filter((r) => {
    var _a;
    return ((_a = r.timestamp) != null ? _a : 0) >= since;
  });
  const outcomes = { attacker_win: 0, defender_win: 0, draw: 0 };
  recent.forEach((r) => {
    if (r.outcome in outcomes) outcomes[r.outcome]++;
  });
  const perDay = Array.from({ length: windowDays }, (_, i) => {
    const start = now - (windowDays - i) * DAY8;
    const d = new Date(start + DAY8);
    return {
      day: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      count: recent.filter((r) => r.timestamp >= start && r.timestamp < start + DAY8).length
    };
  });
  const lootTotals = recent.filter((r) => r.outcome === "attacker_win").map((r) => {
    var _a;
    return Object.values((_a = r.loot) != null ? _a : {}).reduce((a, v) => a + (v != null ? v : 0), 0);
  });
  const stats = {
    generatedAt: now,
    players: {
      total: n,
      active24h: players.filter((p) => now - lastSeen(p) < DAY8).length,
      active7d: players.filter((p) => now - lastSeen(p) < 7 * DAY8).length,
      new7d: players.filter((p) => {
        var _a;
        return now - ((_a = p.createdAtMs) != null ? _a : 0) < 7 * DAY8;
      }).length,
      medianPlaytimeHours: round1(median2(players.map((p) => {
        var _a;
        return ((_a = p.playtimeSeconds) != null ? _a : 0) / 3600;
      }))),
      ranks: [...families.entries()].map(([label3, count2]) => ({ label: label3, count: count2 })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label)),
      medianXp: median2(players.map((p) => {
        var _a;
        return (_a = p.xp) != null ? _a : 0;
      })),
      topXp: [...players].sort((a, b) => {
        var _a, _b;
        return ((_a = b.xp) != null ? _a : 0) - ((_b = a.xp) != null ? _b : 0);
      }).slice(0, 5).map((p) => {
        var _a;
        return { pseudo: p.pseudo, xp: (_a = p.xp) != null ? _a : 0 };
      })
    },
    economy: {
      resources: RESOURCE_LIST.map((r) => {
        const amounts = players.map((p) => {
          var _a, _b;
          return (_b = (_a = p.resources) == null ? void 0 : _a[r.id]) != null ? _b : 0;
        });
        return {
          id: r.id,
          name: r.name,
          median: Math.floor(median2(amounts)),
          total: Math.floor(amounts.reduce((a, v) => a + v, 0)),
          medianRate: round1(median2(rates.map((rt) => {
            var _a;
            return (_a = rt[r.id]) != null ? _a : 0;
          })))
        };
      })
    },
    buildings,
    technologies,
    units,
    missions,
    combat: {
      windowDays,
      attacks: recent.length,
      outcomes,
      perDay,
      avgLoot: lootTotals.length ? Math.round(lootTotals.reduce((a, v) => a + v, 0) / lootTotals.length) : 0,
      topAttackers: topCounts(recent.map((r) => r.attackerPseudo), 5),
      mostAttacked: topCounts(recent.map((r) => r.defenderPseudo), 5)
    },
    balance: computeBalance(players, reports, now, balanceDays),
    endgame: computeEndgame(players, queues, reports, now, balanceDays),
    retention: computeRetention(players, now),
    insights: []
  };
  stats.insights = computeInsights(stats);
  return stats;
}
function computeEndgame(players, queues, reports, now, windowDays) {
  const since = now - windowDays * DAY8;
  const recent = reports.filter((r) => {
    var _a;
    return ((_a = r.timestamp) != null ? _a : 0) >= since && r.attackerUid !== PIRATE_OWNER_UID;
  });
  const avg = (values) => values.length ? round1(values.reduce((a, v) => a + v, 0) / values.length) : 0;
  const techs = TECHNOLOGIES.filter((t) => ENDGAME_TECH_IDS.includes(t.id)).map((t) => {
    const holders = players.filter((p) => {
      var _a, _b;
      return ((_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0) > 0;
    }).sort((a, b) => {
      var _a, _b, _c, _d;
      return ((_b = (_a = b.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0) - ((_d = (_c = a.techLevels) == null ? void 0 : _c[t.id]) != null ? _d : 0);
    });
    return {
      id: t.id,
      name: t.nom,
      researchers: holders.length,
      inProgress: queues.filter((q) => {
        var _a;
        return ((_a = q.activeResearches) != null ? _a : []).some((r) => r.id === t.id);
      }).length,
      avgLevel: avg(holders.map((p) => {
        var _a, _b;
        return (_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0;
      })),
      maxLevel: t.maxLevel,
      leaders: holders.slice(0, 3).map((p) => {
        var _a, _b;
        return `${p.pseudo} (${(_b = (_a = p.techLevels) == null ? void 0 : _a[t.id]) != null ? _b : 0})`;
      })
    };
  });
  const buildings = BUILDINGS.filter((b) => b.endgame).map((b) => {
    var _a, _b;
    const levels = players.map((p) => {
      var _a2;
      return effectiveBuildingLevel((_a2 = p.buildings) != null ? _a2 : {}, b.id);
    }).filter((l) => l > 0);
    return {
      id: b.id,
      name: b.name,
      builders: levels.length,
      avgLevel: avg(levels),
      maxLevel: b.maxLevel,
      resource: (_b = (_a = b.production) == null ? void 0 : _a.resource) != null ? _b : null,
      perHour: b.production ? Math.round(levels.reduce((a, l) => a + productionPerSecond(b.id, l), 0) * 3600) : 0
    };
  });
  const units = UNITS.filter((u) => ENDGAME_TECH_IDS.includes(u.unlockTech)).map((u) => {
    const owned = players.map((p) => {
      var _a, _b, _c;
      return (_c = (_b = (_a = p.units) == null ? void 0 : _a[u.id]) == null ? void 0 : _b.count) != null ? _c : 0;
    });
    const used = recent.filter((r) => {
      var _a, _b;
      return ((_b = (_a = r.attackerFleet) == null ? void 0 : _a[u.id]) != null ? _b : 0) > 0;
    });
    return {
      id: u.id,
      name: u.name,
      owners: owned.filter((c) => c > 0).length,
      total: owned.reduce((a, c) => a + c, 0),
      attacks: used.length,
      winPct: pct4(used.filter((r) => r.outcome === "attacker_win").length, used.length)
    };
  });
  return {
    windowDays,
    players: players.filter((p) => ENDGAME_TECH_IDS.some((id) => {
      var _a, _b;
      return ((_b = (_a = p.techLevels) == null ? void 0 : _a[id]) != null ? _b : 0) > 0;
    })).length,
    techs,
    buildings,
    units
  };
}
function dominantUnit(fleet) {
  var _a, _b;
  let best = null;
  let bestPower = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const power = ((_b = (_a = UNIT_BASE_STATS[id]) == null ? void 0 : _a.attack) != null ? _b : 0) * (qty || 0);
    if (power > bestPower) {
      best = id;
      bestPower = power;
    }
  }
  return best;
}
var sumValues = (r) => Object.values(r != null ? r : {}).reduce((a, v) => a + (v != null ? v : 0), 0);
function computeBalance(players, reports, now, windowDays) {
  var _a, _b;
  const seen = (p) => Math.min(now, lastActivity(p));
  const days = (ms) => Math.floor(ms / DAY8);
  const since = now - windowDays * DAY8;
  const recent = reports.filter((r) => {
    var _a2;
    return ((_a2 = r.timestamp) != null ? _a2 : 0) >= since;
  });
  const dormant = players.filter((p) => now - seen(p) >= 3 * DAY8 && now - seen(p) < 30 * DAY8).map((p) => ({ pseudo: p.pseudo, days: days(now - seen(p)) })).sort((a, b) => a.days - b.days);
  const byFamily = /* @__PURE__ */ new Map();
  players.forEach((p) => {
    var _a2, _b2;
    if (!p.createdAtMs) return;
    const family = getRank((_a2 = p.xp) != null ? _a2 : 0).family;
    byFamily.set(family, [...(_b2 = byFamily.get(family)) != null ? _b2 : [], (now - p.createdAtMs) / DAY8]);
  });
  const rankAge = [...byFamily.entries()].map(([label3, ages]) => ({ label: label3, players: ages.length, medianDays: round1(median2(ages)) })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label));
  const dom = /* @__PURE__ */ new Map();
  recent.forEach((r) => {
    var _a2;
    if (!r.attackerFleet || r.attackerUid === PIRATE_OWNER_UID) return;
    const id = dominantUnit(r.attackerFleet);
    if (!id) return;
    const cur = (_a2 = dom.get(id)) != null ? _a2 : { attacks: 0, wins: 0 };
    cur.attacks++;
    if (r.outcome === "attacker_win") cur.wins++;
    dom.set(id, cur);
  });
  const dominantUnits = [...dom.entries()].map(([id, v]) => {
    var _a2, _b2;
    return { id, name: (_b2 = (_a2 = UNITS.find((u) => u.id === id)) == null ? void 0 : _a2.name) != null ? _b2 : id, attacks: v.attacks, winPct: pct4(v.wins, v.attacks) };
  }).sort((a, b) => b.attacks - a.attacks);
  const factions2 = FACTIONS.map((f) => {
    const raids = recent.filter((r) => r.attackerUid === PIRATE_OWNER_UID && r.attackerPseudo.includes(f.name));
    const lairs = recent.filter((r) => r.defenderUid && factionOfLair(r.defenderUid) === f.id);
    return {
      id: f.id,
      name: f.name,
      raids: raids.length,
      repelledPct: pct4(raids.filter((r) => r.outcome !== "attacker_win").length, raids.length),
      lairAssaults: lairs.length,
      lairWinPct: pct4(lairs.filter((r) => r.outcome === "attacker_win").length, lairs.length)
    };
  });
  const active = players.filter((p) => now - seen(p) < 7 * DAY8);
  const productionPerHour = Math.round(active.reduce((a, p) => {
    var _a2, _b2;
    return a + sumValues(getProductionRatesPerSecond((_a2 = p.buildings) != null ? _a2 : {}, (_b2 = p.techLevels) != null ? _b2 : {})) * 3600;
  }, 0));
  const anomalies = [];
  for (const r of RESOURCE_LIST) {
    for (const p of players) {
      const amount3 = (_b = (_a = p.resources) == null ? void 0 : _a[r.id]) != null ? _b : 0;
      if (amount3 < 1e6) continue;
      const others = median2(players.filter((o) => o !== p).map((o) => {
        var _a2, _b2;
        return (_b2 = (_a2 = o.resources) == null ? void 0 : _a2[r.id]) != null ? _b2 : 0;
      }));
      const ratio = others > 0 ? amount3 / others : Infinity;
      if (ratio >= 20) anomalies.push({ pseudo: p.pseudo, resource: r.name, amount: Math.floor(amount3), ratio: Number.isFinite(ratio) ? Math.round(ratio) : 0 });
    }
  }
  anomalies.sort((a, b) => b.amount - a.amount);
  return {
    windowDays,
    activity: {
      active1d: players.filter((p) => now - seen(p) < DAY8).length,
      active7d: active.length,
      active30d: players.filter((p) => now - seen(p) < 30 * DAY8).length,
      dormant
    },
    rankAge,
    dominantUnits,
    factions: factions2,
    flows: {
      productionPerHour,
      spentTotal: players.reduce((a, p) => {
        var _a2, _b2;
        return a + ((_b2 = (_a2 = p.stats) == null ? void 0 : _a2.spent) != null ? _b2 : 0);
      }, 0),
      lootWindow: recent.filter((r) => r.attackerUid !== PIRATE_OWNER_UID).reduce((a, r) => a + sumValues(r.loot), 0),
      tradedTotal: players.reduce((a, p) => {
        var _a2, _b2;
        return a + ((_b2 = (_a2 = p.stats) == null ? void 0 : _a2.traded) != null ? _b2 : 0);
      }, 0),
      marketTrades: Math.round(players.reduce((a, p) => {
        var _a2, _b2;
        return a + ((_b2 = (_a2 = p.stats) == null ? void 0 : _a2.marketTrades) != null ? _b2 : 0);
      }, 0) / 2),
      marketTax: players.reduce((a, p) => {
        var _a2, _b2;
        return a + ((_b2 = (_a2 = p.stats) == null ? void 0 : _a2.marketTax) != null ? _b2 : 0);
      }, 0)
    },
    anomalies: anomalies.slice(0, 10)
  };
}
function computeInsights(s) {
  const out = [];
  if (s.players.total === 0) return out;
  const shortList = (names) => names.length > 4 ? `${names.slice(0, 4).join(", ")} et ${names.length - 4} autre(s)` : names.join(", ");
  const neverResearched = s.technologies.filter((t) => t.researchedPct === 0).map((t) => t.name);
  if (neverResearched.length > 0) out.push(`Technologies que personne n'a recherch\xE9es : ${shortList(neverResearched)}.`);
  for (const u of s.units) {
    if (u.unlockedPct >= 30 && u.ownersPct === 0) out.push(`Unit\xE9 \xAB ${u.name} \xBB : d\xE9bloqu\xE9e par ${u.unlockedPct} % des joueurs mais jamais construite.`);
  }
  for (const b of s.buildings) {
    if (b.maxedPct >= 50) out.push(`B\xE2timent \xAB ${b.name} \xBB : au niveau max chez ${b.maxedPct} % des joueurs \u2014 ajouter des niveaux ?`);
  }
  const idle = s.missions.filter((m) => m.running === 0).map((m) => m.name);
  if (idle.length > 0 && idle.length < s.missions.length) out.push(`Missions lanc\xE9es par personne en ce moment : ${shortList(idle)}.`);
  const { attacks, outcomes } = s.combat;
  if (attacks >= 5 && outcomes.defender_win / attacks > 0.7) out.push("Les d\xE9fenseurs gagnent plus de 70 % des combats : l'attaque est peut-\xEAtre trop faible.");
  if (attacks >= 5 && outcomes.attacker_win / attacks > 0.85) out.push("Les attaquants gagnent plus de 85 % des combats : la d\xE9fense est peut-\xEAtre trop faible.");
  if (s.players.active7d > 0 && attacks === 0) out.push(`Aucun combat depuis ${s.combat.windowDays} jours.`);
  if (s.players.total >= 5 && s.players.active7d / s.players.total < 0.4) out.push("Moins de 40 % des joueurs sont venus cette semaine.");
  for (const u of s.balance.dominantUnits) {
    if (u.attacks >= 5 && u.winPct >= 85) out.push(`Flottes domin\xE9es par \xAB ${u.name} \xBB : ${u.winPct} % de victoires sur ${u.attacks} attaques \u2014 trop efficace ?`);
    if (u.attacks >= 5 && u.winPct <= 20) out.push(`Flottes domin\xE9es par \xAB ${u.name} \xBB : seulement ${u.winPct} % de victoires \u2014 trop faible ?`);
  }
  for (const f of s.balance.factions) {
    if (f.raids >= 5 && f.repelledPct >= 90) out.push(`${f.name} : ${f.repelledPct} % des raids repouss\xE9s \u2014 faction trop faible ?`);
    if (f.raids >= 5 && f.repelledPct <= 20) out.push(`${f.name} : seulement ${f.repelledPct} % des raids repouss\xE9s \u2014 faction trop forte ?`);
  }
  if (s.balance.anomalies.length > 0) out.push(`${s.balance.anomalies.length} stock(s) anormalement \xE9lev\xE9(s) \xE0 v\xE9rifier (section \xC9quilibrage).`);
  return out;
}

// src/game/reset.ts
var DEFAULT_RESET_OPTIONS = {
  xp: true,
  achievements: true,
  reports: true,
  alliances: true,
  titles: false,
  starterKit: {
    scrap: 5e3,
    energy: 3e3,
    nano: 2e3,
    data: 1e3,
    reinforcedSteel: 50,
    cyberModule: 50,
    syntheticNanites: 50,
    aiFragment: 50
  }
};
function parseResetOptions(raw) {
  var _a;
  const r = raw != null ? raw : {};
  const bool = (k) => typeof r[k] === "boolean" ? r[k] : DEFAULT_RESET_OPTIONS[k];
  const kit = {};
  const rawKit = (_a = r.starterKit) != null ? _a : DEFAULT_RESET_OPTIONS.starterKit;
  for (const res of Object.keys(DEFAULT_RESET_OPTIONS.starterKit)) {
    const n = Math.floor(Number(rawKit[res]));
    if (Number.isFinite(n) && n > 0) kit[res] = Math.min(n, 1e9);
  }
  return { xp: bool("xp"), achievements: bool("achievements"), reports: bool("reports"), alliances: bool("alliances"), titles: bool("titles"), starterKit: kit };
}
function resetPlayerState(player, options, now) {
  var _a, _b, _c, _d, _e, _f, _g;
  const fresh = defaultPlayerState(player.uid, player.pseudo);
  const resources = __spreadValues({}, fresh.resources);
  for (const [res, amount3] of Object.entries(options.starterKit)) resources[res] = ((_a = resources[res]) != null ? _a : 0) + amount3;
  const next = __spreadProps(__spreadValues({}, fresh), {
    uid: player.uid,
    pseudo: player.pseudo,
    resources,
    resourcesUpdatedAtMs: now,
    resourceHistory: [],
    playtimeSeconds: (_b = player.playtimeSeconds) != null ? _b : 0,
    xp: options.xp ? 0 : (_c = player.xp) != null ? _c : 0,
    seasonId: currentSeasonId(now),
    seasonXp: options.xp ? 0 : player.seasonId === currentSeasonId(now) ? (_d = player.seasonXp) != null ? _d : 0 : 0,
    lastSeasonId: options.xp ? "" : player.lastSeasonId,
    lastSeasonXp: options.xp ? 0 : player.lastSeasonXp,
    unlockedAchievements: options.achievements ? [] : (_e = player.unlockedAchievements) != null ? _e : [],
    titles: options.titles ? [] : (_f = player.titles) != null ? _f : [],
    activeTitle: options.titles ? "" : (_g = player.activeTitle) != null ? _g : "",
    contracts: void 0,
    victories: 0,
    defeats: 0,
    // Protection débutant offerte à nouveau : personne n'est pillé dès la reprise.
    createdAtMs: now,
    lastAttackAtMs: 0,
    lastDefeatAtMs: 0
  });
  return {
    player: next,
    queues: defaultQueues(),
    notifications: [
      {
        kind: "system",
        title: "Nouvelle \xE8re : la galaxie repart de z\xE9ro",
        message: "Ta progression a \xE9t\xE9 remise \xE0 z\xE9ro par l'administration. Un kit de d\xE9part t'attend dans tes ressources, et ta protection d\xE9butant est r\xE9tablie.",
        createdAtMs: now,
        read: false
      }
    ]
  };
}

// src/game/playerFields.ts
var GAME_FIELDS = [
  "resources",
  "buildings",
  "units",
  "techLevels",
  "bonuses",
  "xp",
  "seasonId",
  "seasonXp",
  "victories",
  "defeats",
  "playtimeSeconds",
  "lastActiveMs",
  "resourcesUpdatedAtMs",
  "resourceHistory",
  "unlockedAchievements",
  "contracts",
  "lastSeasonId",
  "lastSeasonXp",
  "titles",
  "activeTitle",
  "pirates",
  "stats",
  "onboarding",
  "posture",
  "ascensions",
  "ascendedAtMs",
  "colonies",
  "colonizing",
  "bounties",
  "commanders",
  "relics",
  "synthesis",
  "profileStyle",
  "renamed",
  "streak",
  "seasonPass",
  "referral",
  "vacation",
  "chronicle",
  "announcementsSeen",
  "talents"
];
var QUEUE_FIELDS = ["buildingUpgrades", "unitQueues", "activeResearches", "activeMissions", "buildPlan"];

// src/game/content.ts
var CONTENT_SECTIONS = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules", "warlords", "seasonPass", "chronicles", "relics", "relicSettings"];
function withFixedUnits(units) {
  return units.some((u) => u.id === KESH_HUNTER_UNIT.id) ? units : [...units, KESH_HUNTER_UNIT];
}
var DEFAULT_PVP_RULES = __spreadValues({}, PVP_RULES);
var DEFAULT_COMBAT_RULES = __spreadValues({}, COMBAT_RULES);
var DEFAULT_ECONOMY_RULES = __spreadValues({}, ECONOMY_RULES);
var DEFAULT_FLEET_RULES = __spreadValues({}, FLEET_RULES);
var DEFAULT_SPY_RULES = __spreadValues({}, SPY_RULES);
var DEFAULT_DEBRIS_RULES = __spreadValues({}, DEBRIS_RULES);
var DEFAULT_PATROL_RULES = __spreadValues({}, PATROL_RULES);
var DEFAULT_EVENT_RULES = structuredClone(EVENT_RULES);
var DEFAULT_SEASON_RULES = structuredClone(SEASON_RULES);
var DEFAULT_ALLIANCE_RULES = structuredClone(ALLIANCE_RULES);
var DEFAULT_PIRATE_RULES = __spreadValues({}, PIRATE_RULES);
var DEFAULT_MARKET_RULES = __spreadValues({}, MARKET_RULES);
var DEFAULT_EXPEDITION_RULES = structuredClone(EXPEDITION_RULES);
var DEFAULT_LEVIATHAN_RULES = __spreadValues({}, LEVIATHAN_RULES);
var DEFAULT_WAR_RULES = __spreadValues({}, WAR_RULES);
function defaultGameContent() {
  return structuredClone({
    buildings: DEFAULT_BUILDINGS,
    units: DEFAULT_UNITS,
    technologies: DEFAULT_TECHNOLOGIES,
    missions: Object.values(DEFAULT_MISSIONS),
    factions: DEFAULT_FACTIONS,
    ranks: DEFAULT_RANKS,
    achievements: DEFAULT_ACHIEVEMENTS,
    warlords: defaultWarlordsConfig(),
    seasonPass: defaultSeasonPassConfig(),
    chronicles: defaultChroniclesConfig(),
    relics: DEFAULT_RELICS,
    relicSettings: defaultRelicSettings(),
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES, wars: DEFAULT_WAR_RULES }
  });
}
var current = defaultGameContent();
function currentGameContent() {
  return structuredClone(current);
}
function applyGameContent(overrides) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S;
  const defaults = defaultGameContent();
  const content = {
    buildings: withFixedBuildings((_a = overrides.buildings) != null ? _a : defaults.buildings),
    units: withFixedUnits((_b = overrides.units) != null ? _b : defaults.units),
    technologies: (_c = overrides.technologies) != null ? _c : defaults.technologies,
    missions: (_d = overrides.missions) != null ? _d : defaults.missions,
    factions: (_e = overrides.factions) != null ? _e : defaults.factions,
    ranks: (_f = overrides.ranks) != null ? _f : defaults.ranks,
    achievements: (_g = overrides.achievements) != null ? _g : defaults.achievements,
    warlords: (_h = overrides.warlords) != null ? _h : defaults.warlords,
    seasonPass: (_i = overrides.seasonPass) != null ? _i : defaults.seasonPass,
    chronicles: (_j = overrides.chronicles) != null ? _j : defaults.chronicles,
    relics: (_k = overrides.relics) != null ? _k : defaults.relics,
    relicSettings: __spreadProps(__spreadValues(__spreadValues({}, defaults.relicSettings), (_l = overrides.relicSettings) != null ? _l : {}), {
      rarities: Object.fromEntries(
        Object.entries(defaults.relicSettings.rarities).map(([id, v]) => {
          var _a2, _b2, _c2;
          return [id, __spreadValues(__spreadValues({}, v), (_c2 = (_b2 = (_a2 = overrides.relicSettings) == null ? void 0 : _a2.rarities) == null ? void 0 : _b2[id]) != null ? _c2 : {})];
        })
      )
    }),
    rules: {
      pvp: __spreadValues(__spreadValues({}, defaults.rules.pvp), (_n = (_m = overrides.rules) == null ? void 0 : _m.pvp) != null ? _n : {}),
      combat: __spreadValues(__spreadValues({}, defaults.rules.combat), (_p = (_o = overrides.rules) == null ? void 0 : _o.combat) != null ? _p : {}),
      economy: __spreadValues(__spreadValues({}, defaults.rules.economy), (_r = (_q = overrides.rules) == null ? void 0 : _q.economy) != null ? _r : {}),
      fleets: __spreadValues(__spreadValues({}, defaults.rules.fleets), (_t = (_s = overrides.rules) == null ? void 0 : _s.fleets) != null ? _t : {}),
      spy: __spreadValues(__spreadValues({}, defaults.rules.spy), (_v = (_u = overrides.rules) == null ? void 0 : _u.spy) != null ? _v : {}),
      debris: __spreadValues(__spreadValues({}, defaults.rules.debris), (_x = (_w = overrides.rules) == null ? void 0 : _w.debris) != null ? _x : {}),
      patrol: __spreadValues(__spreadValues({}, defaults.rules.patrol), (_z = (_y = overrides.rules) == null ? void 0 : _y.patrol) != null ? _z : {}),
      events: __spreadValues(__spreadValues({}, defaults.rules.events), (_B = (_A = overrides.rules) == null ? void 0 : _A.events) != null ? _B : {}),
      seasons: __spreadValues(__spreadValues({}, defaults.rules.seasons), (_D = (_C = overrides.rules) == null ? void 0 : _C.seasons) != null ? _D : {}),
      alliances: __spreadValues(__spreadValues({}, defaults.rules.alliances), (_F = (_E = overrides.rules) == null ? void 0 : _E.alliances) != null ? _F : {}),
      pirates: __spreadValues(__spreadValues({}, defaults.rules.pirates), (_H = (_G = overrides.rules) == null ? void 0 : _G.pirates) != null ? _H : {}),
      market: __spreadValues(__spreadValues({}, defaults.rules.market), (_J = (_I = overrides.rules) == null ? void 0 : _I.market) != null ? _J : {}),
      expeditions: __spreadProps(__spreadValues(__spreadValues({}, defaults.rules.expeditions), (_L = (_K = overrides.rules) == null ? void 0 : _K.expeditions) != null ? _L : {}), {
        weights: __spreadValues(__spreadValues({}, defaults.rules.expeditions.weights), (_O = (_N = (_M = overrides.rules) == null ? void 0 : _M.expeditions) == null ? void 0 : _N.weights) != null ? _O : {})
      }),
      leviathan: __spreadValues(__spreadValues({}, defaults.rules.leviathan), (_Q = (_P = overrides.rules) == null ? void 0 : _P.leviathan) != null ? _Q : {}),
      wars: __spreadValues(__spreadValues({}, defaults.rules.wars), (_S = (_R = overrides.rules) == null ? void 0 : _R.wars) != null ? _S : {})
    }
  };
  setBuildings(content.buildings);
  setUnits(content.units);
  setTechnologies(content.technologies);
  for (const t of content.technologies) for (const e3 of techEffects(t)) if (e3.type === "unlock_next_level" && e3.target) UNIT_TO_TECH[e3.target] = t.id;
  setMissions(content.missions);
  setFactions(content.factions);
  setRanks(content.ranks);
  setAchievements(content.achievements);
  setWarlords(content.warlords);
  setSeasonPass(content.seasonPass);
  setChronicles(content.chronicles);
  setRelics(content.relics, content.relicSettings);
  Object.assign(PVP_RULES, content.rules.pvp);
  Object.assign(COMBAT_RULES, content.rules.combat);
  Object.assign(ECONOMY_RULES, content.rules.economy);
  Object.assign(FLEET_RULES, content.rules.fleets);
  Object.assign(SPY_RULES, content.rules.spy);
  Object.assign(DEBRIS_RULES, content.rules.debris);
  Object.assign(PATROL_RULES, content.rules.patrol);
  Object.assign(EVENT_RULES, content.rules.events);
  Object.assign(SEASON_RULES, content.rules.seasons);
  Object.assign(ALLIANCE_RULES, content.rules.alliances);
  Object.assign(PIRATE_RULES, content.rules.pirates);
  Object.assign(MARKET_RULES, content.rules.market);
  Object.assign(EXPEDITION_RULES, content.rules.expeditions);
  Object.assign(LEVIATHAN_RULES, content.rules.leviathan);
  Object.assign(WAR_RULES, content.rules.wars);
  current = content;
  return content;
}
var ID_PATTERN = /^[A-Za-z0-9_]+$/;
function validateGameContent(content) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const errors = [];
  const resources = new Set(RESOURCE_LIST.map((r) => r.id));
  const techIds = new Set(content.technologies.map((t) => t.id));
  const unitIds = new Set(content.units.map((u) => u.id));
  const checkIds = (label3, ids) => {
    const seen = /* @__PURE__ */ new Set();
    for (const id of ids) {
      if (!id || !ID_PATTERN.test(id)) errors.push(`${label3} : identifiant \xAB ${id} \xBB invalide (lettres, chiffres, _).`);
      if (seen.has(id)) errors.push(`${label3} : identifiant \xAB ${id} \xBB en double.`);
      seen.add(id);
    }
  };
  const checkResources = (label3, map) => {
    for (const [res, v] of Object.entries(map != null ? map : {})) {
      if (!resources.has(res)) errors.push(`${label3} : ressource inconnue \xAB ${res} \xBB.`);
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) errors.push(`${label3} : valeur invalide pour ${res}.`);
    }
  };
  checkIds("B\xE2timents", content.buildings.map((b) => b.id));
  for (const b of content.buildings) {
    const label3 = `B\xE2timent ${b.name || b.id}`;
    if (!(b.maxLevel >= 1)) errors.push(`${label3} : niveau max doit \xEAtre \u2265 1.`);
    checkResources(`${label3} (d\xE9blocage)`, b.unlockCost);
    checkResources(`${label3} (co\xFBt initial)`, (_a = b.upgrade) == null ? void 0 : _a.baseCost);
    checkResources(`${label3} (co\xFBt max)`, (_b = b.upgrade) == null ? void 0 : _b.maxCost);
    if (b.unlockedByTech && !techIds.has(b.unlockedByTech)) errors.push(`${label3} : techno \xAB ${b.unlockedByTech} \xBB inexistante.`);
    if (b.production && !resources.has(b.production.resource)) errors.push(`${label3} : ressource produite inconnue.`);
    if (b.production && b.production.perSecond.length === 0) errors.push(`${label3} : table de production vide.`);
    const t2 = (_c = b.upgrade) == null ? void 0 : _c.tier2;
    if (t2) {
      if (!(t2.fromLevel >= 2 && t2.fromLevel <= b.maxLevel)) errors.push(`${label3} : le second palier doit commencer entre le niveau 2 et le niveau max.`);
      checkResources(`${label3} (second palier, co\xFBt initial)`, t2.baseCost);
      checkResources(`${label3} (second palier, co\xFBt max)`, t2.maxCost);
      if (!(t2.baseSeconds >= 0 && t2.secondsPerLevel >= 0)) errors.push(`${label3} : dur\xE9es du second palier invalides.`);
    }
    if (((_d = b.effect) == null ? void 0 : _d.type) === "storage" && !(b.effect.base > 0 && b.effect.growth >= 1)) errors.push(`${label3} : capacit\xE9 d'entrep\xF4t invalide.`);
  }
  if (!content.buildings.some((b) => b.startsUnlocked)) errors.push("Au moins un b\xE2timent doit \xEAtre d\xE9bloqu\xE9 d\xE8s le d\xE9part.");
  checkIds("Unit\xE9s", content.units.map((u) => u.id));
  for (const u of content.units) {
    const label3 = `Unit\xE9 ${u.name || u.id}`;
    if (!u.blueprint && !techIds.has(u.unlockTech)) errors.push(`${label3} : techno de d\xE9blocage \xAB ${u.unlockTech} \xBB inexistante.`);
    if (u.category !== "attack" && u.category !== "defense") errors.push(`${label3} : cat\xE9gorie invalide.`);
    if (!(u.hangarSpace >= 1)) errors.push(`${label3} : places de hangar doit \xEAtre \u2265 1.`);
    if (u.levelBonus !== void 0 && !(u.levelBonus >= 0)) errors.push(`${label3} : gain par niveau invalide.`);
    checkResources(`${label3} (co\xFBt)`, u.cost);
  }
  checkIds("Technologies", content.technologies.map((t) => t.id));
  for (const t of content.technologies) {
    const label3 = `Techno ${t.nom || t.id}`;
    if (t.effects && t.effects.length > 0) {
      for (const e3 of t.effects) errors.push(...validateTechEffect(label3, e3, { resources, unitIds, buildingIds: new Set(content.buildings.map((b) => b.id)) }));
    } else if (t.effect !== void 0 && !(t.effect in TECH_EFFECT_LABELS)) errors.push(`${label3} : effet \xAB ${t.effect} \xBB inconnu.`);
    checkResources(`${label3} (co\xFBt)`, t.baseCost);
    if (t.amberCost !== void 0 && (!Number.isFinite(t.amberCost) || t.amberCost < 0)) errors.push(`${label3} : ambre par niveau invalide.`);
    for (const req of Object.keys((_e = t.prereq) != null ? _e : {})) {
      if (!techIds.has(req)) errors.push(`${label3} : pr\xE9requis \xAB ${req} \xBB inexistant.`);
      if (req === t.id) errors.push(`${label3} : ne peut pas \xEAtre son propre pr\xE9requis.`);
    }
  }
  const byId = new Map(content.technologies.map((t) => [t.id, t]));
  const visiting = /* @__PURE__ */ new Set();
  const done = /* @__PURE__ */ new Set();
  const visit = (id, path) => {
    var _a2, _b2;
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`Technologies : cycle de pr\xE9requis ${[...path, id].join(" \u2192 ")}.`);
      return;
    }
    visiting.add(id);
    for (const req of Object.keys((_b2 = (_a2 = byId.get(id)) == null ? void 0 : _a2.prereq) != null ? _b2 : {})) if (byId.has(req)) visit(req, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const t of content.technologies) visit(t.id, []);
  checkIds("Missions", content.missions.map((m) => m.key));
  for (const m of content.missions) {
    const label3 = `Mission ${m.name || m.key}`;
    if (!(m.duration > 0)) errors.push(`${label3} : dur\xE9e doit \xEAtre > 0.`);
    for (const unitId of Object.keys((_f = m.prereq) != null ? _f : {})) {
      if (!unitIds.has(unitId)) errors.push(`${label3} : unit\xE9 requise \xAB ${unitId} \xBB inexistante.`);
    }
    const res = __spreadValues({}, (_g = m.reward) != null ? _g : {});
    delete res.xp;
    checkResources(`${label3} (r\xE9compense)`, res);
  }
  errors.push(...validateFactions((_h = content.factions) != null ? _h : []));
  errors.push(...validateWarlords(content.warlords));
  errors.push(...validateSeasonPass(content.seasonPass));
  errors.push(...validateChronicles(content.chronicles));
  errors.push(...validateRanks((_i = content.ranks) != null ? _i : []));
  errors.push(...validateAchievements((_j = content.achievements) != null ? _j : []));
  errors.push(...validateRelics((_k = content.relics) != null ? _k : [], (_l = content.relicSettings) != null ? _l : defaultRelicSettings()));
  return [...new Set(errors)];
}

// src/game/staff.ts
var STAFF_KEY = "staff";
var STAFF_LABELS = { developer: "D\xE9veloppeur", admin: "Administrateur" };
var STAFF_TITLE_SEASON = "staff";
var DEFAULT_STAFF_BY_PSEUDO = { Nicotine: "developer", Tartiflex: "admin" };
function isStaffRole(v) {
  return v === "developer" || v === "admin";
}
function normalizeStaff(raw) {
  const roles = {};
  const src = raw && typeof raw === "object" ? raw.roles : null;
  if (src && typeof src === "object") {
    for (const [uid, role] of Object.entries(src)) if (isStaffRole(role)) roles[uid] = role;
  }
  return { roles };
}
function applyStaffTitle(player, role, display = false) {
  var _a, _b, _c, _d;
  const before = JSON.stringify([(_a = player.titles) != null ? _a : [], (_b = player.activeTitle) != null ? _b : ""]);
  const staffLabels = Object.values(STAFF_LABELS);
  const kept = ((_c = player.titles) != null ? _c : []).filter((t) => t.seasonId !== STAFF_TITLE_SEASON);
  const label3 = role ? STAFF_LABELS[role] : null;
  player.titles = label3 ? [{ label: label3, rank: 0, seasonId: STAFF_TITLE_SEASON }, ...kept] : kept;
  if (player.activeTitle && staffLabels.includes(player.activeTitle) && player.activeTitle !== label3) player.activeTitle = "";
  if (label3 && display) player.activeTitle = label3;
  return JSON.stringify([player.titles, (_d = player.activeTitle) != null ? _d : ""]) !== before;
}

// src/game/reports.ts
var REPORT_CATEGORIES = [
  { id: "bug", label: "Bug", hint: "Quelque chose ne marche pas comme pr\xE9vu" },
  { id: "display", label: "Affichage", hint: "Page mal affich\xE9e, texte coup\xE9, mobile\u2026" },
  { id: "balance", label: "\xC9quilibrage", hint: "Co\xFBts, gains, combats, factions\u2026" },
  { id: "account", label: "Compte", hint: "Connexion, mot de passe, progression perdue" },
  { id: "idea", label: "Suggestion", hint: "Une id\xE9e pour am\xE9liorer le jeu" },
  { id: "other", label: "Autre", hint: "Tout le reste" }
];
var REPORT_STATUSES = [
  { id: "new", label: "Nouveau", tone: "accent" },
  { id: "in_progress", label: "En cours", tone: "gold" },
  { id: "resolved", label: "R\xE9solu", tone: "mint" },
  { id: "rejected", label: "Non retenu", tone: "danger" }
];
var REPORT_RULES = {
  titleMax: 120,
  descriptionMin: 10,
  descriptionMax: 4e3,
  commentMax: 2e3,
  resolutionMax: 2e3,
  /** Signalements par joueur sur 24 h glissantes. */
  maxPerDay: 5
};
function isReportCategory(v) {
  return REPORT_CATEGORIES.some((c) => c.id === v);
}
function isReportStatus(v) {
  return REPORT_STATUSES.some((s) => s.id === v);
}
function reportStatusLabel(status) {
  var _a, _b;
  return (_b = (_a = REPORT_STATUSES.find((s) => s.id === status)) == null ? void 0 : _a.label) != null ? _b : status;
}
var clean = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
function sanitizeNewReport(input) {
  const title = clean(input.title, REPORT_RULES.titleMax);
  const description = clean(input.description, REPORT_RULES.descriptionMax);
  if (!title) throw new GameActionError("Donne un titre \xE0 ton signalement.");
  if (description.length < REPORT_RULES.descriptionMin) throw new GameActionError("D\xE9cris le probl\xE8me en quelques mots de plus.");
  const raw = input.context && typeof input.context === "object" ? input.context : {};
  return {
    category: isReportCategory(input.category) ? input.category : "other",
    title,
    description,
    context: {
      version: clean(raw.version, 20),
      page: clean(raw.page, 200),
      theme: clean(raw.theme, 20),
      userAgent: clean(raw.userAgent, 300),
      screen: clean(raw.screen, 40)
    }
  };
}
function assertReportQuota(previousCreatedAtMs, now) {
  const recent = previousCreatedAtMs.filter((t) => now - t < 24 * 36e5).length;
  if (recent >= REPORT_RULES.maxPerDay) throw new GameActionError(`Tu as d\xE9j\xE0 envoy\xE9 ${REPORT_RULES.maxPerDay} signalements aujourd'hui : r\xE9essaie demain ou compl\xE8te un signalement existant.`);
}
function addReportComment(history, author, text, now) {
  const body = clean(text, REPORT_RULES.commentMax);
  if (!body) throw new GameActionError("Le message est vide.");
  return [...history, { kind: "comment", atMs: now, byId: author.id, byName: author.name, staff: author.staff, text: body }];
}
function applyStaffUpdate(report, author, update, now) {
  var _a, _b, _c, _d;
  let history = [...(_a = report.history) != null ? _a : []];
  let status = report.status;
  let resolution = (_b = report.resolution) != null ? _b : "";
  const notes = [];
  if (update.status !== void 0) {
    if (!isReportStatus(update.status)) throw new GameActionError("Statut inconnu.");
    if (update.status !== status) {
      status = update.status;
      history.push({ kind: "status", atMs: now, byId: author.id, byName: author.name, staff: true, status });
      notes.push(`statut : ${reportStatusLabel(status)}`);
    }
  }
  if (update.resolution !== void 0) {
    const next = clean(update.resolution, REPORT_RULES.resolutionMax);
    if (next !== resolution) {
      resolution = next;
      if (next) notes.push("r\xE9solution renseign\xE9e");
    }
  }
  if (typeof update.comment === "string" && update.comment.trim()) {
    history = addReportComment(history, { id: author.id, name: author.name, staff: true }, update.comment, now);
    notes.push("nouvelle r\xE9ponse");
  }
  const changed = status !== report.status || resolution !== ((_c = report.resolution) != null ? _c : "") || history.length !== ((_d = report.history) != null ? _d : []).length;
  return { status, resolution, history, changed, notify: notes.length > 0 ? notes.join(", ") : null };
}
function githubIssueBody(report, link) {
  var _a, _b, _c;
  const ctx = (_a = report.context) != null ? _a : {};
  const cat = (_c = (_b = REPORT_CATEGORIES.find((c) => c.id === report.category)) == null ? void 0 : _b.label) != null ? _c : report.category;
  return [
    `**Signal\xE9 en jeu** par ${report.reporterPseudo || "un joueur"} \xB7 ${cat}`,
    "",
    report.description,
    "",
    "| Contexte | |",
    "|---|---|",
    `| Version | ${ctx.version || "?"} |`,
    `| Page | ${ctx.page || "?"} |`,
    `| Th\xE8me | ${ctx.theme || "?"} |`,
    `| \xC9cran | ${ctx.screen || "?"} |`,
    `| Navigateur | ${ctx.userAgent || "?"} |`,
    "",
    report.screenshot ? `Capture jointe au signalement (voir l'administration).` : "",
    `Suivi dans l'administration : ${link}`
  ].filter((l) => l !== null).join("\n");
}

// src/game/errorReports.ts
var AUTO_ERROR_RULES = {
  /** Erreurs envoyées par joueur sur une journée (UTC). */
  maxPerDay: 10,
  messageMax: 300,
  stackMax: 3e3,
  /** Joueurs touchés gardés en mémoire sur le signalement. */
  affectedMax: 30
};
var AUTO_REPORTER_ID = "system";
var IGNORED = [
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /^(TypeError: )?(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i,
  /The user aborted a request|AbortError|autocancelled/i
];
var EXTENSION = /chrome-extension:|moz-extension:|safari-extension:/i;
var str = (v, max) => typeof v === "string" ? v.trim().slice(0, max) : "";
function sanitizeClientError(input) {
  const message = str(input.message, AUTO_ERROR_RULES.messageMax);
  const stack = str(input.stack, AUTO_ERROR_RULES.stackMax);
  if (!message || isIgnoredError(message, stack)) return null;
  return { message, stack, page: str(input.page, 200), version: str(input.version, 20) };
}
function isIgnoredError(message, stack = "") {
  return IGNORED.some((re) => re.test(message)) || EXTENSION.test(message) || EXTENSION.test(stack);
}
function normalizeStack(stack) {
  return stack.split("\n").slice(0, 6).map(
    (l) => l.replace(/https?:\/\/[^/\s)]+/g, "").replace(/-[A-Za-z0-9_-]{6,}\.js/g, ".js").replace(/\?[^\s):]*/g, "").replace(/:\d+:\d+/g, "").replace(/:\d+/g, "").trim()
  ).filter(Boolean).join("\n");
}
function errorKey(message, stack) {
  const text = `${message.replace(/\d+/g, "#")}
${normalizeStack(stack)}`;
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h << 5) + h + text.charCodeAt(i) | 0;
  return `e${(h >>> 0).toString(16)}`;
}
function autoReportTitle(message) {
  return `[Auto] ${message}`.slice(0, 120);
}
function autoReportDescription(err) {
  return [err.message, "", err.stack || "(pile indisponible)"].join("\n").slice(0, 4e3);
}
function addOccurrence(report, pseudo, now) {
  const closed = report.status === "resolved" || report.status === "rejected";
  const affected = report.affected.includes(pseudo) || !pseudo ? report.affected : [...report.affected, pseudo].slice(-AUTO_ERROR_RULES.affectedMax);
  const history = closed ? [...report.history, { kind: "status", atMs: now, byId: AUTO_REPORTER_ID, byName: "Syst\xE8me", staff: true, status: "new", text: "L'erreur s'est reproduite apr\xE8s la cl\xF4ture." }] : report.history;
  return { status: closed ? "new" : report.status, history, occurrences: (report.occurrences || 1) + 1, affected, reopened: closed };
}
function errorQuotaKey(uid, now) {
  return `cosmic-err:${uid}:${new Date(now).toISOString().slice(0, 10)}`;
}

// src/game/messages.ts
var MESSAGE_RULES = {
  maxLength: 1e3,
  /** Messages envoyés au plus par minute et par jour (anti-spam). */
  perMinute: 8,
  perDay: 300
};
function sanitizeMessageText(raw) {
  const text = String(raw != null ? raw : "").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new GameActionError("Message vide.");
  if (text.length > MESSAGE_RULES.maxLength) throw new GameActionError(`Message trop long (${MESSAGE_RULES.maxLength} caract\xE8res max).`);
  return text;
}
function assertMessageQuota(lastMinute, lastDay) {
  if (lastMinute >= MESSAGE_RULES.perMinute) throw new GameActionError("Tu envoies trop de messages : patiente une minute.");
  if (lastDay >= MESSAGE_RULES.perDay) throw new GameActionError("Quota de messages du jour atteint.");
}

// src/game/challenges.ts
var CHALLENGE_KEY = "challenge";
var CHALLENGE_TYPES = {
  raids: { label: "Repousser les raids des factions", unit: "raids repouss\xE9s", perActive: 3 },
  missions: { label: "Terminer des missions", unit: "missions", perActive: 25 },
  units: { label: "Construire des unit\xE9s", unit: "unit\xE9s", perActive: 400 },
  market: { label: "Faire vivre le march\xE9", unit: "ressources \xE9chang\xE9es", perActive: 2e6 },
  expeditions: { label: "Explorer l'inconnu", unit: "exp\xE9ditions", perActive: 6 },
  bounties: { label: "Remplir les primes de l'Essaim", unit: "primes", perActive: 8 }
};
var CHALLENGE_RULES = {
  /** Part minimale de l'objectif pour être récompensé. */
  minShare: 0.01,
  tiers: [
    { at: 1, hours: 6, rare: 300 },
    { at: 1.5, hours: 10, rare: 600 }
  ],
  title: "Pilier de la semaine",
  titleDays: 7,
  /** Joueur actif : vu dans les 7 derniers jours. */
  activeDays: 7
};
var DAY9 = 864e5;
function weekWindow(now) {
  const day = new Date(now).getUTCDay();
  const midnight = Math.floor(now / DAY9) * DAY9;
  const startMs = midnight - (day + 6) % 7 * DAY9;
  return { id: `wk-${new Date(startMs).toISOString().slice(0, 10)}`, startMs, endMs: startMs + 7 * DAY9 };
}
function isLeviathanWeek(now) {
  const w = weekWindow(now);
  const next = nextLeviathanStart(w.startMs);
  return next !== null && next >= w.startMs && next < w.endMs;
}
function pickChallengeType(weekId2, previous) {
  const types = Object.keys(CHALLENGE_TYPES);
  let h = 0;
  for (const c of weekId2) h = h * 31 + c.charCodeAt(0) >>> 0;
  let type = types[h % types.length];
  if (type === previous) type = types[(h + 1) % types.length];
  return type;
}
function startChallenge(now, activePlayers, previous) {
  const w = weekWindow(now);
  const type = pickChallengeType(w.id, previous);
  return {
    id: w.id,
    type,
    target: CHALLENGE_TYPES[type].perActive * Math.max(1, activePlayers),
    startMs: w.startMs,
    endMs: w.endMs,
    total: 0,
    contributions: {},
    status: "active",
    success: false
  };
}
function challengeMetrics(player) {
  var _a, _b, _c, _d, _e, _f, _g;
  const s = (_a = player.stats) != null ? _a : {};
  const pirates = (_b = player.pirates) != null ? _b : {};
  const raids = Object.values(pirates).reduce((a, p) => a + (Number(p == null ? void 0 : p.repelled) || 0), 0);
  return {
    raids,
    missions: (_c = s.missions) != null ? _c : 0,
    units: (_d = s.unitsBuilt) != null ? _d : 0,
    market: (_e = s.marketVolume) != null ? _e : 0,
    expeditions: (_f = s.expeditions) != null ? _f : 0,
    bounties: (_g = s.bounties) != null ? _g : 0
  };
}
function addContribution(ch, uid, pseudo, amount3, now) {
  var _a, _b;
  if (ch.status !== "active" || !(amount3 > 0) || now < ch.startMs || now >= ch.endMs) return ch;
  const prev = (_b = (_a = ch.contributions[uid]) == null ? void 0 : _a.amount) != null ? _b : 0;
  return __spreadProps(__spreadValues({}, ch), { total: ch.total + amount3, contributions: __spreadProps(__spreadValues({}, ch.contributions), { [uid]: { pseudo, amount: prev + amount3 } }) });
}
function challengeRanking(ch) {
  return Object.entries(ch.contributions).map(([uid, c]) => __spreadValues({ uid }, c)).sort((a, b) => b.amount - a.amount);
}
function challengeTier(ch) {
  var _a;
  const ratio = ch.target > 0 ? ch.total / ch.target : 0;
  return (_a = [...CHALLENGE_RULES.tiers].reverse().find((t) => ratio >= t.at)) != null ? _a : null;
}
function challengeRewardees(ch) {
  if (!challengeTier(ch)) return [];
  return challengeRanking(ch).filter((c) => c.amount >= ch.target * CHALLENGE_RULES.minShare).map((c) => c.uid);
}
function grantChallengeReward(ch, player) {
  var _a, _b, _c, _d;
  const tier = challengeTier(ch);
  if (!tier || !challengeRewardees(ch).includes(player.uid)) return {};
  const gain = __spreadValues({}, productionHours(player, tier.hours));
  for (const r of RESOURCE_LIST) if (r.rarity === "rare") gain[r.id] = ((_a = gain[r.id]) != null ? _a : 0) + tier.rare;
  for (const [res, n] of Object.entries(gain)) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + n;
  if (((_c = challengeRanking(ch)[0]) == null ? void 0 : _c.uid) === player.uid) {
    player.titles = [...((_d = player.titles) != null ? _d : []).filter((t) => t.label !== CHALLENGE_RULES.title), { label: CHALLENGE_RULES.title, seasonId: `challenge:${ch.id}`, rank: 1 }];
    player.activeTitle = CHALLENGE_RULES.title;
  }
  return gain;
}
function removeChallengeTitle(player) {
  var _a, _b;
  player.titles = ((_a = player.titles) != null ? _a : []).filter((t) => t.label !== CHALLENGE_RULES.title);
  if (player.activeTitle === CHALLENGE_RULES.title) player.activeTitle = (_b = player.titles[0]) == null ? void 0 : _b.label;
}
function normalizeChallengeState(raw) {
  var _a, _b, _c;
  const r = raw && typeof raw === "object" ? raw : {};
  return { current: (_a = r.current) != null ? _a : null, previous: (_b = r.previous) != null ? _b : null, titleHolder: (_c = r.titleHolder) != null ? _c : null };
}

// src/game/diplomacy.ts
var DIPLOMACY_RULES = {
  /** Préavis de rupture, en heures (le pacte protège encore). */
  breakNoticeHours: 24,
  /** Pactes simultanés (proposés, actifs ou en préavis) par alliance. */
  maxPacts: 3,
  messageMax: 500
};
var HOUR10 = 36e5;
function pactStatusAt(p, now) {
  return p.status === "ending" && p.endsAtMs > 0 && now >= p.endsAtMs ? "ended" : p.status;
}
function pactBinds(p, now) {
  const s = pactStatusAt(p, now);
  return s === "active" || s === "ending";
}
function pactOpen(p, now) {
  const s = pactStatusAt(p, now);
  return s === "proposed" || s === "active" || s === "ending";
}
function involves(p, allianceId) {
  return p.allianceA === allianceId || p.allianceB === allianceId;
}
function bindingPactBetween(pacts, a, b, now) {
  var _a;
  if (!a || !b || a === b) return null;
  return (_a = pacts.find((p) => involves(p, a) && involves(p, b) && pactBinds(p, now))) != null ? _a : null;
}
function assertLeader(alliance, uid, what) {
  const role = allianceRole(alliance, uid);
  if (!canDiplomacy(role)) throw new GameActionError(`Seuls le fondateur, les officiers et les diplomates peuvent ${what}.`);
}
function proposePact(input) {
  const { own, target, pacts, now } = input;
  assertLeader(own, input.actorUid, "proposer un pacte");
  if (own.id === target.id) throw new GameActionError("Impossible de signer un pacte avec sa propre alliance.");
  if (input.atWar) throw new GameActionError(`Vous \xEAtes en guerre contre [${target.tag}] : la paix d'abord.`);
  if (pacts.some((p) => involves(p, own.id) && involves(p, target.id) && pactOpen(p, now))) throw new GameActionError(`Une relation est d\xE9j\xE0 en cours avec [${target.tag}].`);
  const count2 = (id) => pacts.filter((p) => involves(p, id) && pactOpen(p, now)).length;
  if (count2(own.id) >= DIPLOMACY_RULES.maxPacts) throw new GameActionError(`${DIPLOMACY_RULES.maxPacts} pactes au plus par alliance.`);
  if (count2(target.id) >= DIPLOMACY_RULES.maxPacts) throw new GameActionError(`[${target.tag}] a d\xE9j\xE0 ${DIPLOMACY_RULES.maxPacts} pactes.`);
  return {
    allianceA: own.id,
    allianceB: target.id,
    tagA: own.tag,
    tagB: target.tag,
    nameA: own.name,
    nameB: target.name,
    status: "proposed",
    proposedByUid: input.actorUid,
    proposedByPseudo: input.actorPseudo,
    createdAtMs: now,
    acceptedAtMs: 0,
    endsAtMs: 0,
    brokenByTag: ""
  };
}
function answerPact(pact, own, actorUid, answer, now) {
  if (pactStatusAt(pact, now) !== "proposed") throw new GameActionError("Ce pacte n'est plus en attente.");
  if (answer === "cancel") {
    if (own.id !== pact.allianceA) throw new GameActionError("Seule l'alliance qui a propos\xE9 peut retirer sa proposition.");
    assertLeader(own, actorUid, "retirer une proposition");
    return __spreadProps(__spreadValues({}, pact), { status: "cancelled" });
  }
  if (own.id !== pact.allianceB) throw new GameActionError("Seule l'alliance invit\xE9e peut r\xE9pondre.");
  assertLeader(own, actorUid, "r\xE9pondre \xE0 un pacte");
  return answer === "accept" ? __spreadProps(__spreadValues({}, pact), { status: "active", acceptedAtMs: now }) : __spreadProps(__spreadValues({}, pact), { status: "declined" });
}
function breakPact(pact, own, actorUid, now) {
  if (!involves(pact, own.id)) throw new GameActionError("Ce pacte ne concerne pas ton alliance.");
  if (pactStatusAt(pact, now) !== "active") throw new GameActionError("Ce pacte n'est pas actif.");
  assertLeader(own, actorUid, "rompre un pacte");
  return __spreadProps(__spreadValues({}, pact), { status: "ending", endsAtMs: now + DIPLOMACY_RULES.breakNoticeHours * HOUR10, brokenByTag: own.tag });
}
function sanitizePactMessage(raw) {
  const text = String(raw != null ? raw : "").trim();
  if (!text) throw new GameActionError("Message vide.");
  if (text.length > DIPLOMACY_RULES.messageMax) throw new GameActionError(`Message trop long (${DIPLOMACY_RULES.messageMax} caract\xE8res max).`);
  return text;
}

// src/game/maintenance.ts
var MAINTENANCE_KEY = "maintenance";
var MAINTENANCE_OFF = { enabled: false, message: "", version: "", startedAtMs: 0, endsAtMs: null, autoEnd: true };
var MAX_MESSAGE = 600;
var MAX_VERSION = 20;
function normalizeMaintenance(raw) {
  if (!raw || typeof raw !== "object") return __spreadValues({}, MAINTENANCE_OFF);
  const r = raw;
  const endsAt = Number(r.endsAtMs);
  return {
    enabled: r.enabled === true,
    message: typeof r.message === "string" ? r.message.slice(0, MAX_MESSAGE) : "",
    version: typeof r.version === "string" ? r.version.slice(0, MAX_VERSION) : "",
    startedAtMs: Number(r.startedAtMs) || 0,
    endsAtMs: Number.isFinite(endsAt) && endsAt > 0 ? endsAt : null,
    autoEnd: r.autoEnd !== false
  };
}
function nextMaintenance(previous, request, now) {
  const enabled = request.enabled === true;
  if (!enabled) return __spreadProps(__spreadValues({}, previous), { enabled: false, endsAtMs: null });
  const endsAt = Number(request.endsAtMs);
  return {
    enabled: true,
    message: (typeof request.message === "string" ? request.message.trim() : "").slice(0, MAX_MESSAGE),
    version: (typeof request.version === "string" ? request.version.trim() : "").slice(0, MAX_VERSION),
    startedAtMs: previous.enabled && previous.startedAtMs > 0 ? previous.startedAtMs : now,
    endsAtMs: Number.isFinite(endsAt) && endsAt > now ? Math.round(endsAt) : null,
    autoEnd: request.autoEnd !== false
  };
}
function maintenanceShouldAutoEnd(m, now) {
  return m.enabled && m.autoEnd && m.endsAtMs !== null && now >= m.endsAtMs;
}
function extendUltimatums(pirates, startedAtMs, now) {
  const pausedMs = now - startedAtMs;
  if (!pirates || typeof pirates !== "object" || startedAtMs <= 0 || pausedMs <= 0) return null;
  const shift = (state) => {
    const u = state.ultimatum;
    if (!u || typeof u.expiresAtMs !== "number" || u.expiresAtMs <= startedAtMs) return false;
    state.ultimatum = __spreadProps(__spreadValues({}, u), { expiresAtMs: u.expiresAtMs + pausedMs });
    return true;
  };
  const copy = JSON.parse(JSON.stringify(pirates));
  let changed = false;
  if ("notoriety" in copy || "nextListAtMs" in copy) changed = shift(copy);
  else for (const state of Object.values(copy)) if (state && typeof state === "object" && shift(state)) changed = true;
  return changed ? copy : null;
}

// src/game/anomalies.ts
var ANOMALY_RULES = {
  /** Gain de valeur par heure au-delà de N heures de production totale. */
  productionHours: 50,
  /** Seuil minimal par heure (début de partie). */
  minPerHour: 5e7,
  /** Clé game_config où le serveur note la dernière analyse. */
  scanKey: "anomaly_scan"
};
var HOUR11 = 36e5;
var ALL = RESOURCE_LIST.map((r) => r.id);
function unitValue(res) {
  if (COMMON_RESOURCES2.includes(res)) return 1;
  return 1 / getTradeRate(COMMON_RESOURCES2[0], res);
}
function stockValue(r) {
  return ALL.reduce((a, res) => {
    var _a;
    return a + Math.max(0, (_a = r[res]) != null ? _a : 0) * unitValue(res);
  }, 0);
}
function anomalyThreshold(player, hours2) {
  var _a;
  const rates = getProductionRatesPerSecond(player.buildings, (_a = player.techLevels) != null ? _a : {});
  const perHour = COMMON_RESOURCES2.reduce((a, res) => {
    var _a2;
    return a + ((_a2 = rates[res]) != null ? _a2 : 0);
  }, 0) * 3600;
  return Math.max(ANOMALY_RULES.minPerHour, ANOMALY_RULES.productionHours * perHour) * Math.max(1, hours2);
}
function detectResourceAnomalies(player, sinceMs) {
  var _a, _b, _c, _d, _e;
  const points = [...(_a = player.resourceHistory) != null ? _a : []].sort((a, b) => a.t - b.t);
  const lastT = (_c = (_b = points[points.length - 1]) == null ? void 0 : _b.t) != null ? _c : 0;
  const current2 = Number(player.resourcesUpdatedAtMs) || 0;
  if (current2 > lastT) points.push({ t: current2, r: player.resources });
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (b.t <= sinceMs) continue;
    const gain = stockValue(b.r) - stockValue(a.r);
    const threshold = anomalyThreshold(player, (b.t - a.t) / HOUR11);
    if (gain <= threshold) continue;
    const deltas = {};
    for (const res of ALL) {
      const d = Math.round(((_d = b.r[res]) != null ? _d : 0) - ((_e = a.r[res]) != null ? _e : 0));
      if (d !== 0) deltas[res] = d;
    }
    out.push({ gain: Math.round(gain), threshold: Math.round(threshold), fromMs: a.t, toMs: b.t, deltas });
  }
  return out;
}
var fmtDate = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";
function describeAnomalies(list) {
  return list.map((a) => {
    const detail = Object.entries(a.deltas).map(([res, d]) => {
      var _a, _b;
      return `${(_b = (_a = RESOURCE_LIST.find((r) => r.id === res)) == null ? void 0 : _a.name) != null ? _b : res} ${d > 0 ? "+" : ""}${formatInt(d)}`;
    }).join(", ");
    return `\u2022 ${fmtDate(a.fromMs)} \u2192 ${fmtDate(a.toMs)} : valeur +${formatInt(a.gain)} (seuil ${formatInt(a.threshold)}). ${detail}.`;
  }).join("\n");
}

// src/game/referral.ts
var REFERRAL_RULES = {
  linkWindowHours: 48,
  rewardXp: 2e3,
  minAgeDays: 3,
  perMonth: 5,
  amberSponsor: 150,
  amberRecruit: 100,
  banner: "recruteur"
};
function referralState(p) {
  var _a;
  const raw = (_a = p.referral) != null ? _a : {};
  return __spreadProps(__spreadValues({}, raw), { recruits: Number(raw.recruits) || 0, monthly: raw.monthly && typeof raw.monthly === "object" ? raw.monthly : {} });
}
function month(now) {
  return new Date(now).toISOString().slice(0, 7);
}
function linkReferrer(recruit, sponsor, now) {
  var _a;
  const st = referralState(recruit);
  if (sponsor.uid === recruit.uid) throw new GameActionError("Tu ne peux pas \xEAtre ton propre parrain.");
  if (st.by) throw new GameActionError("Tu as d\xE9j\xE0 un parrain.");
  if (now - ((_a = recruit.createdAtMs) != null ? _a : 0) > REFERRAL_RULES.linkWindowHours * 36e5) throw new GameActionError("Le parrainage se d\xE9clare dans les 48 h qui suivent l'inscription.");
  if (referralState(sponsor).by === recruit.uid) throw new GameActionError("Ce joueur est d\xE9j\xE0 ton filleul.");
  recruit.referral = __spreadProps(__spreadValues({}, st), { by: sponsor.uid, byPseudo: sponsor.pseudo, linkedAtMs: now, rewarded: false });
}
function referralDue(recruit, verified, now) {
  var _a, _b;
  const st = referralState(recruit);
  return !!st.by && !st.rewarded && verified && ((_a = recruit.xp) != null ? _a : 0) >= REFERRAL_RULES.rewardXp && now - ((_b = recruit.createdAtMs) != null ? _b : now) >= REFERRAL_RULES.minAgeDays * 864e5;
}
function grantReferral(sponsor, recruit, now) {
  var _a, _b, _c, _d, _e;
  const s = referralState(sponsor);
  const r = referralState(recruit);
  const m = month(now);
  const capped = ((_b = (_a = s.monthly) == null ? void 0 : _a[m]) != null ? _b : 0) >= REFERRAL_RULES.perMonth;
  const rb = bountyState(recruit);
  rb.amber += REFERRAL_RULES.amberRecruit;
  recruit.bounties = rb;
  recruit.referral = __spreadProps(__spreadValues({}, r), { rewarded: true });
  if (!capped) {
    const sb = bountyState(sponsor);
    sb.amber += REFERRAL_RULES.amberSponsor;
    sponsor.bounties = sb;
    sponsor.referral = __spreadProps(__spreadValues({}, s), { recruits: ((_c = s.recruits) != null ? _c : 0) + 1, monthly: __spreadProps(__spreadValues({}, s.monthly), { [m]: ((_e = (_d = s.monthly) == null ? void 0 : _d[m]) != null ? _e : 0) + 1 }) });
  }
  return { capped };
}

// src/game/coalition.ts
var COALITION_RULES = {
  thresholdFactor: 1.5,
  holdHours: 48,
  durationDays: 5,
  goalFactor: 1.5,
  cooldownDays: 14,
  /** Réussite : puissance perdue, jours d'absence. */
  powerLoss: 0.4,
  awayDays: 10,
  /** Part minimale de l'objectif pour être récompensé. */
  minShare: 0.03,
  rewardHours: 4,
  topRelics: 3,
  /** Échec : le seigneur gagne cette part de puissance. */
  failGrowth: 0.1
};
var HOUR12 = 36e5;
var DAY10 = 24 * HOUR12;
function coalitionState(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    coalition: r.coalition && typeof r.coalition === "object" && r.coalition.id ? r.coalition : null,
    history: Array.isArray(r.history) ? r.history.slice(0, 5) : [],
    overSince: r.overSince && typeof r.overSince === "object" ? __spreadValues({}, r.overSince) : {},
    lastEndMs: Number(r.lastEndMs) || 0
  };
}
function readCoalitions(state) {
  return coalitionState(state.coalitions);
}
function writeCoalitions(state, c) {
  state.coalitions = c;
}
function activeCoalition(c, now) {
  return c.coalition && c.coalition.status === "active" && now < c.coalition.endsAtMs ? c.coalition : null;
}
function checkCoalitionTrigger(c, lords, topHumanPower, now) {
  var _a;
  for (const l of lords) {
    if (l.present && topHumanPower > 0 && l.power > topHumanPower * COALITION_RULES.thresholdFactor) c.overSince[l.id] = (_a = c.overSince[l.id]) != null ? _a : now;
    else delete c.overSince[l.id];
  }
  if (c.coalition && c.coalition.status === "active") return null;
  if (now - c.lastEndMs < COALITION_RULES.cooldownDays * DAY10) return null;
  const ready = lords.filter((l) => l.present && c.overSince[l.id] !== void 0 && now - c.overSince[l.id] >= COALITION_RULES.holdHours * HOUR12).sort((a, b) => b.power - a.power)[0];
  if (!ready) return null;
  const coalition = {
    id: `coal-${ready.id}-${now}`,
    warlordId: ready.id,
    startedAtMs: now,
    endsAtMs: now + COALITION_RULES.durationDays * DAY10,
    goal: Math.max(1, Math.round(ready.fleetPower * COALITION_RULES.goalFactor)),
    dealt: 0,
    contributions: {},
    pseudos: {},
    status: "active"
  };
  c.coalition = coalition;
  delete c.overSince[ready.id];
  return coalition;
}
function recordCoalitionDamage(c, warlordId, uid, pseudo, dealt, now) {
  var _a;
  const co = activeCoalition(c, now);
  if (!co || co.warlordId !== warlordId || !(dealt > 0)) return null;
  co.dealt += Math.round(dealt);
  co.contributions[uid] = ((_a = co.contributions[uid]) != null ? _a : 0) + Math.round(dealt);
  co.pseudos[uid] = pseudo;
  if (co.dealt >= co.goal) {
    co.status = "won";
    co.finishedAtMs = now;
    return co;
  }
  return null;
}
function settleCoalition(c, now) {
  const co = c.coalition;
  if (!co || co.status !== "active" || now < co.endsAtMs) return null;
  co.status = "lost";
  co.finishedAtMs = now;
  return co;
}
function archiveCoalition(c, now) {
  if (!c.coalition || c.coalition.status === "active") return;
  c.history = [c.coalition, ...c.history].slice(0, 5);
  c.coalition = null;
  c.lastEndMs = now;
}
function coalitionRanking(co) {
  return Object.entries(co.contributions).map(([uid, damage]) => {
    var _a;
    return { uid, pseudo: (_a = co.pseudos[uid]) != null ? _a : "?", damage };
  }).sort((a, b) => b.damage - a.damage);
}
function coalitionTitle(d) {
  return `Briseur de ${d.name.split(",")[0]}`;
}
function grantCoalitionReward(co, d, player, now, random = Math.random) {
  var _a, _b, _c, _d;
  const mine = (_a = co.contributions[player.uid]) != null ? _a : 0;
  if (co.status !== "won" || mine < co.goal * COALITION_RULES.minShare) return { eligible: false, gain: {} };
  addPassPoints(player, "coalition", now);
  const gain = productionHours(player, COALITION_RULES.rewardHours);
  for (const [res, n] of Object.entries(gain)) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + n;
  const rank2 = coalitionRanking(co).findIndex((r) => r.uid === player.uid);
  let relic;
  if (rank2 >= 0 && rank2 < COALITION_RULES.topRelics) {
    const item = rollRelic(`coalition:${co.warlordId}`, now, random, "epic");
    if (addRelic(player, item)) relic = relicLabel(item);
  }
  let title;
  if (rank2 === 0) {
    title = coalitionTitle(d);
    if (!((_c = player.titles) != null ? _c : []).some((t) => t.label === title)) player.titles = [...(_d = player.titles) != null ? _d : [], { label: title, seasonId: "coalition", rank: 1 }];
  }
  return { eligible: true, gain, relic, title };
}
function empowerWarlord(npc, growth = COALITION_RULES.failGrowth) {
  var _a;
  for (const [id, st] of Object.entries((_a = npc.units) != null ? _a : {})) {
    if (st.count > 0) npc.units[id] = __spreadProps(__spreadValues({}, st), { count: Math.round(st.count * (1 + growth)) });
  }
}

// src/game/gazette.ts
var GAZETTE_KEY = "gazette";
var GAZETTE_RULES = { publishHour: 9, keepIssues: 8 };
function gazetteState(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    issues: Array.isArray(r.issues) ? r.issues.filter((i) => i && typeof i.id === "string") : [],
    lastWeekId: typeof r.lastWeekId === "string" ? r.lastWeekId : "",
    xpSnapshot: r.xpSnapshot && typeof r.xpSnapshot === "object" ? r.xpSnapshot : {}
  };
}
function gazettePublishAt(now) {
  const monday = Date.parse(`${allianceWeekId(now)}T00:00:00Z`);
  return parisLocalToUtc(monday + GAZETTE_RULES.publishHour * 36e5);
}
function gazetteDue(state, now) {
  return state.lastWeekId !== allianceWeekId(now) && now >= gazettePublishAt(now);
}
function gazetteNumber(n) {
  const v = Math.round(n);
  const short = (x, unit) => `${(Math.round(x * 10) / 10).toString().replace(".", ",")} ${unit}`;
  if (v >= 1e9) return short(v / 1e9, "Md");
  if (v >= 1e6) return short(v / 1e6, "M");
  if (v >= 1e4) return short(v / 1e3, "k");
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
var fmt = gazetteNumber;
function compileGazette(input, number) {
  const { now, sinceMs } = input;
  const inWeek = (t) => t >= sinceMs && t < now;
  const sections = [];
  const bosses = input.bosses.filter((b) => inWeek(b.endedAtMs));
  if (bosses.length > 0) {
    sections.push({
      kind: "boss",
      title: "Les g\xE9ants de la semaine",
      lines: bosses.map((b) => b.status === "killed" ? `${b.name} est tomb\xE9${b.top.length ? `. En premi\xE8re ligne : ${b.top.slice(0, 3).join(", ")}.` : "."}` : `${b.name} a r\xE9sist\xE9 et s'est retir\xE9.`)
    });
  }
  const vendettas = input.vendettas.filter((v) => inWeek(v.finishedAtMs));
  if (vendettas.length > 0) {
    sections.push({
      kind: "vendetta",
      title: "Vendettas",
      lines: vendettas.map((v) => v.won ? `${v.ownerPseudo} a fait plier ${v.warlordName}, qui fuit le secteur.` : `${v.warlordName} a tenu bon face \xE0 ${v.ownerPseudo}. La riposte approche.`)
    });
  }
  const wars = input.wars.filter((w) => inWeek(w.endedAtMs));
  if (wars.length > 0) {
    sections.push({
      kind: "war",
      title: "Front des alliances",
      lines: wars.map((w) => w.winnerTag ? `[${w.winnerTag}] remporte la guerre contre [${w.winnerTag === w.attackerTag ? w.defenderTag : w.attackerTag}].` : `[${w.attackerTag}] et [${w.defenderTag}] se quittent sur un match nul.`)
    });
  }
  const hasSnapshot = Object.keys(input.xpSnapshot).length > 0;
  const progress = input.players.map((p) => {
    var _a, _b;
    return { pseudo: p.pseudo, gain: hasSnapshot ? p.xp - ((_a = input.xpSnapshot[p.uid]) != null ? _a : p.xp) : (_b = p.seasonXp) != null ? _b : 0 };
  }).filter((p) => p.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 3);
  if (progress.length > 0) {
    sections.push({
      kind: "progress",
      title: hasSnapshot ? "Ils ont le plus progress\xE9" : "En t\xEAte de la saison",
      lines: progress.map((p, i) => `${["\u{1F947}", "\u{1F948}", "\u{1F949}"][i]} ${p.pseudo} : +${fmt(p.gain)} XP`)
    });
  }
  const raid = input.raids.filter((r) => inWeek(r.timestamp) && r.loot > 0).sort((a, b) => b.loot - a.loot)[0];
  if (raid) {
    sections.push({ kind: "raid", title: "Le casse de la semaine", lines: [`${raid.attackerPseudo} a vid\xE9 les coffres de ${raid.defenderPseudo} : ${fmt(raid.loot)} ressources emport\xE9es.`] });
  }
  const warlord = [...input.warlords].sort((a, b) => b.power - a.power)[0];
  if (warlord) {
    sections.push({ kind: "warlord", title: "Le seigneur \xE0 surveiller", lines: [`${warlord.name} aligne ${fmt(warlord.power)} de puissance. Prudence aux abords de son territoire.`] });
  }
  const newcomers = input.players.filter((p) => p.createdAtMs && inWeek(p.createdAtMs)).map((p) => p.pseudo);
  if (newcomers.length > 0) {
    sections.push({ kind: "newcomers", title: "Bienvenue aux nouveaux commandants", lines: [newcomers.slice(0, 12).join(", ") + (newcomers.length > 12 ? ` et ${newcomers.length - 12} autres` : "") + "."] });
  }
  const killed = bosses.find((b) => b.status === "killed");
  const headline = killed ? `${killed.name} tombe sous les coups du secteur` : wars.find((w) => w.winnerTag) ? `[${wars.find((w) => w.winnerTag).winnerTag}] gagne sa guerre` : vendettas.find((v) => v.won) ? `${vendettas.find((v) => v.won).warlordName} humili\xE9 par ${vendettas.find((v) => v.won).ownerPseudo}` : raid ? `${raid.attackerPseudo} signe le casse de la semaine` : progress[0] ? `${progress[0].pseudo} file en t\xEAte` : "Semaine calme dans le secteur";
  const weekId2 = allianceWeekId(now);
  return { id: `gz-${weekId2}-${now}`, number, weekId: weekId2, publishedAtMs: now, fromMs: sinceMs, toMs: now, headline, sections };
}
function publishGazette(state, issue, players) {
  return {
    issues: [issue, ...state.issues.filter((i) => i.weekId !== issue.weekId)].slice(0, GAZETTE_RULES.keepIssues),
    lastWeekId: issue.weekId,
    xpSnapshot: Object.fromEntries(players.map((p) => [p.uid, p.xp]))
  };
}

// src/game/codex.ts
var CODEX_TITLE = "Archiviste";
function codexEntries(player, fought, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const out = [];
  const threatened = new Set((_b = (_a = player.stats) == null ? void 0 : _a.threatenedBy) != null ? _b : []);
  for (const f of FACTIONS.filter((x) => x.enabled)) {
    out.push({ id: `faction:${f.id}`, category: "factions", name: f.name, subtitle: `${f.leader} \xB7 ${f.enforcer}`, image: (_c = f.emblem) != null ? _c : f.art, text: f.story, unlocked: threatened.has(f.id), color: f.color });
  }
  for (const d of warlordsConfig().defs.filter((x) => x.enabled)) {
    out.push({ id: `warlord:${d.id}`, category: "warlords", name: d.name, subtitle: "Seigneur de guerre", image: d.portrait, text: d.bio, unlocked: fought.has(d.id) });
  }
  out.push({
    id: "boss:leviathan",
    category: "bosses",
    name: "Le L\xE9viathan",
    subtitle: "Boss mondial",
    image: "/assets/leviathan/leviathan-portrait.webp",
    text: "Une b\xEAte de la taille d'une lune qui remonte des abysses du secteur un week-end par mois. Tout le serveur frappe ensemble ; ceux qui frappent le plus fort repartent avec ses reliques.",
    unlocked: ((_e = (_d = player.stats) == null ? void 0 : _d.leviathanKills) != null ? _e : 0) > 0
  });
  const currentMonth = chronicleMonthId(now);
  const emblems = new Set((_g = (_f = player.chronicle) == null ? void 0 : _f.emblems) != null ? _g : []);
  for (const m of chroniclesConfig().months) {
    if (episodeUnlockMs(m.id, 0) > now) continue;
    out.push({ id: `boss:${m.id}`, category: "bosses", name: m.boss.name, subtitle: `Boss de la chronique \xAB ${m.title} \xBB`, image: m.boss.image, text: m.boss.lore, unlocked: emblems.has(m.id) || m.id < currentMonth });
    m.episodes.forEach((e3, i) => {
      if (episodeUnlockMs(m.id, i) > now) return;
      out.push({ id: `chronicle:${m.id}:${i}`, category: "chronicles", name: e3.title, subtitle: `${m.title} \xB7 \xE9pisode ${i + 1}`, image: m.boss.emblem, text: e3.lines.map((l) => l.text).join("\n\n"), unlocked: true });
    });
    for (const c of (_h = m.codex) != null ? _h : []) out.push({ id: `lore:${m.id}:${c.id}`, category: "chronicles", name: c.name, subtitle: c.subtitle, image: c.image, text: c.text, unlocked: true });
  }
  for (const u of UNITS) {
    out.push({ id: `unit:${u.id}`, category: "units", name: u.name, subtitle: u.category === "defense" ? "D\xE9fense" : "Flotte", image: u.image, text: u.description, unlocked: !!((_i = player.units) == null ? void 0 : _i[u.id]) });
  }
  return out;
}
function codexProgress(entries) {
  const unlocked = entries.filter((e3) => e3.unlocked).length;
  const total2 = entries.length;
  return { unlocked, total: total2, pct: total2 > 0 ? Math.floor(unlocked / total2 * 100) : 0 };
}
function foughtWarlords(opponentUids) {
  const byUid = new Map(warlordsConfig().defs.map((d) => [warlordUid(d.id), d.id]));
  return new Set(opponentUids.map((u) => byUid.get(u)).filter((x) => !!x));
}
function grantCodexTitle(player, entries) {
  var _a, _b;
  if (codexProgress(entries).pct < 100) return false;
  if (((_a = player.titles) != null ? _a : []).some((t) => t.label === CODEX_TITLE)) return false;
  player.titles = [...(_b = player.titles) != null ? _b : [], { label: CODEX_TITLE, seasonId: "codex", rank: 1 }];
  return true;
}

// src/game/allianceDaily.ts
var ALLIANCE_DAILY_RULES = {
  proposeHour: 6,
  voteEndHour: 10,
  /** Membre actif : connecté dans les 3 derniers jours. */
  activeDays: 3,
  treasuryHours: 4,
  missionsPerMember: 4,
  researchPerMember: 2,
  powerPct: 0.02,
  passPoints: 15,
  rewardHours: 1,
  treasuryPct: 0.1
};
var DAILY_KINDS = ["treasury", "missions", "power", "research"];
var DAILY_STAT = { treasury: "donated", missions: "missions", power: "powerDestroyed", research: "researchStarted" };
function dailyPhase(now) {
  const h = parisHour(now);
  if (h < ALLIANCE_DAILY_RULES.proposeHour) return "before";
  return h < ALLIANCE_DAILY_RULES.voteEndHour ? "voting" : "active";
}
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function proposeDaily(allianceId, day, members, now) {
  var _a;
  const R = ALLIANCE_DAILY_RULES;
  const active = Math.max(1, members.filter((m) => m.active).length);
  const resourceBase = {};
  for (const m of members.filter((x) => x.active)) {
    for (const [res, n] of Object.entries(m.production4h)) resourceBase[res] = ((_a = resourceBase[res]) != null ? _a : 0) + Math.round(n != null ? n : 0);
  }
  const treasuryTarget = Math.max(1e3, Object.values(resourceBase).reduce((a, b) => a + (b != null ? b : 0), 0));
  const fleet = members.reduce((a, m) => a + m.fleetPower, 0);
  const targets = {
    treasury: treasuryTarget,
    missions: R.missionsPerMember * active,
    power: Math.max(500, Math.round(fleet * R.powerPct)),
    research: R.researchPerMember * active
  };
  const skip = hash(`${allianceId}:${day}`) % DAILY_KINDS.length;
  const proposals = DAILY_KINDS.filter((_, i) => i !== skip).map((kind) => ({ kind, target: targets[kind] }));
  return { day, proposals, votes: {}, status: "voting", chosen: null, baseline: {}, progress: 0, contributions: {}, resourceBase, updatedAtMs: now };
}
function voteDaily(daily, uid, role, index, now) {
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers votent l'objectif du jour.");
  if (daily.status !== "voting" || dailyPhase(now) !== "voting" || daily.day !== parisDay(now)) throw new GameActionError(`Le vote est ouvert de ${ALLIANCE_DAILY_RULES.proposeHour} h \xE0 ${ALLIANCE_DAILY_RULES.voteEndHour} h.`);
  const i = Math.floor(Number(index));
  if (!(i >= 0 && i < daily.proposals.length)) throw new GameActionError("Objectif inconnu.");
  daily.votes = __spreadProps(__spreadValues({}, daily.votes), { [uid]: i });
}
function winningProposal(daily) {
  const counts = daily.proposals.map((_, i) => Object.values(daily.votes).filter((v) => v === i).length);
  let best = 0;
  counts.forEach((c, i) => {
    if (c > counts[best]) best = i;
  });
  return best;
}
function statOf(stats, kind) {
  var _a;
  return Number((_a = stats == null ? void 0 : stats[DAILY_STAT[kind]]) != null ? _a : 0) || 0;
}
function startDaily(daily, members, now) {
  const chosen = winningProposal(daily);
  const kind = daily.proposals[chosen].kind;
  daily.chosen = chosen;
  daily.status = "active";
  daily.baseline = Object.fromEntries(members.map((m) => [m.uid, statOf(m.stats, kind)]));
  daily.progress = 0;
  daily.contributions = {};
  daily.updatedAtMs = now;
}
function updateDailyProgress(daily, members, now) {
  if (daily.status !== "active" || daily.chosen === null) return false;
  const { kind, target } = daily.proposals[daily.chosen];
  const contributions = {};
  for (const m of members) {
    if (daily.baseline[m.uid] === void 0) daily.baseline[m.uid] = statOf(m.stats, kind);
    const delta = statOf(m.stats, kind) - daily.baseline[m.uid];
    if (delta > 0) contributions[m.uid] = Math.round(delta);
  }
  daily.contributions = contributions;
  daily.progress = Object.values(contributions).reduce((a, b) => a + b, 0);
  daily.updatedAtMs = now;
  if (daily.progress >= target) {
    daily.status = "done";
    daily.doneAtMs = now;
    return true;
  }
  return false;
}
function dailyTreasuryBonus(daily) {
  const out = {};
  for (const [res, n] of Object.entries(daily.resourceBase)) {
    const v = Math.floor((n != null ? n : 0) * ALLIANCE_DAILY_RULES.treasuryPct);
    if (v > 0) out[res] = v;
  }
  return out;
}
function readDaily(raw) {
  const d = raw;
  return d && typeof d === "object" && typeof d.day === "string" && Array.isArray(d.proposals) ? d : null;
}
function previousSummary(daily) {
  if (!daily) return void 0;
  return { day: daily.day, kind: daily.chosen !== null ? daily.proposals[daily.chosen].kind : null, status: daily.status === "done" ? "done" : "failed" };
}
function dailyMemberOf(p, now) {
  var _a, _b, _c;
  return {
    uid: p.uid,
    active: now - lastActivity(p) < ALLIANCE_DAILY_RULES.activeDays * 864e5,
    stats: (_a = p.stats) != null ? _a : {},
    production4h: productionHours(p, ALLIANCE_DAILY_RULES.treasuryHours),
    fleetPower: computeFullPower((_b = p.units) != null ? _b : {}, (_c = p.techLevels) != null ? _c : {}, OFFENSIVE_UNITS, ["attack"])
  };
}

// src/game/rename.ts
var RENAME_RULES = {
  amber: 10,
  minLength: 3,
  maxLength: 20
};
function pseudoLogin(pseudo) {
  return pseudo.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}
function cleanNewPseudo(raw) {
  const pseudo = String(raw != null ? raw : "").trim().replace(/\s+/g, " ");
  if (pseudo.length > RENAME_RULES.maxLength) throw new GameActionError(`Le pseudo fait ${RENAME_RULES.maxLength} caract\xE8res au plus.`);
  if (pseudoLogin(pseudo).length < RENAME_RULES.minLength) throw new GameActionError("Le pseudo doit contenir au moins 3 caract\xE8res valides (lettres, chiffres, - ou _).");
  return pseudo;
}
function renamePlayer(player, raw, now) {
  if (player.renamed) throw new GameActionError("Tu as d\xE9j\xE0 chang\xE9 de pseudo.");
  const pseudo = cleanNewPseudo(raw);
  if (pseudo === player.pseudo) throw new GameActionError("C'est d\xE9j\xE0 ton pseudo.");
  const st = bountyState(player);
  if (st.amber < RENAME_RULES.amber) throw new GameActionError(`Il te faut ${RENAME_RULES.amber} Ambre.`);
  st.amber -= RENAME_RULES.amber;
  player.bounties = st;
  player.renamed = { fromPseudo: player.pseudo, atMs: now };
  player.pseudo = pseudo;
  return { pseudo, login: pseudoLogin(pseudo) };
}

// src/game/balance/history.ts
var BALANCE_HISTORY_KEY = "balance_history";
var BALANCE_HISTORY_DAYS = 180;
var isNpc = (uid) => !!uid && (uid.startsWith("npc") || uid === "pirates" || uid.startsWith("lair_"));
function median3(xs) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function balanceSnapshot(live, reports, now) {
  var _a, _b;
  const day = reports.filter((r) => r.timestamp >= now - 864e5 && r.timestamp <= now);
  const pvp = day.filter((r) => !isNpc(r.attackerUid) && !isNpc(r.defenderUid));
  const wl = day.filter((r) => {
    var _a2, _b2;
    return ((_a2 = r.attackerUid) == null ? void 0 : _a2.startsWith("npc")) || ((_b2 = r.defenderUid) == null ? void 0 : _b2.startsWith("npc"));
  });
  const wins = (xs) => xs.filter((r) => r.outcome === "attacker_win").length;
  const hangars = live.players.filter((p) => p.attackPlaces > 0).map((p) => p.attackPlacesUsed / p.attackPlaces);
  return {
    day: new Date(now).toISOString().slice(0, 10),
    atMs: now,
    activePlayers: live.activePlayers,
    pvpBattles: pvp.length,
    pvpAttackerWins: wins(pvp),
    warlordBattles: wl.length,
    warlordAttackerWins: wins(wl),
    raidsWon: live.factions.reduce((a, f) => a + f.raidsWon, 0),
    raidsLost: live.factions.reduce((a, f) => a + f.raidsLost, 0),
    lairsTaken: live.factions.reduce((a, f) => a + f.lairsTaken, 0),
    medianProduction: Math.round(median3(live.players.map((p) => p.productionPerHour))),
    avgHangarAttack: hangars.length ? Math.round(hangars.reduce((a, b) => a + b, 0) / hangars.length * 1e3) / 1e3 : 0,
    bestDefense: live.bestDefense,
    bestAttack: live.bestAttack,
    topWarlord: (_b = (_a = live.warlords[0]) == null ? void 0 : _a.power) != null ? _b : 0,
    homeDefenseBonus: COMBAT_RULES.homeDefenseBonus
  };
}
function pushSnapshot(history, snap) {
  const list = (Array.isArray(history) ? history : []).filter((s) => s && s.day !== snap.day);
  return [...list, snap].sort((a, b) => a.day < b.day ? -1 : 1).slice(-BALANCE_HISTORY_DAYS);
}

// src/game/balance/diagnostics.ts
function places(units, ids) {
  return ids.reduce((a, id) => {
    var _a, _b, _c, _d;
    return a + ((_b = (_a = units == null ? void 0 : units[id]) == null ? void 0 : _a.count) != null ? _b : 0) * ((_d = (_c = findUnit(id)) == null ? void 0 : _c.hangarSpace) != null ? _d : 1);
  }, 0);
}
function computeLiveBalance(players, warlords, reports, now, windowDays = 30) {
  const active = players.filter((p) => {
    var _a, _b;
    return !p.npc && now - ((_b = (_a = p.lastActiveMs) != null ? _a : p.resourcesUpdatedAtMs) != null ? _b : 0) < 14 * 864e5;
  });
  const rows = active.map((p) => {
    var _a, _b;
    const units = (_a = p.units) != null ? _a : {};
    const tech = (_b = p.techLevels) != null ? _b : {};
    const eco = economySnapshot(p, now);
    const perHour = Object.values(eco.gross).reduce((a, b) => a + (b != null ? b : 0), 0) * 3600;
    return {
      pseudo: p.pseudo,
      attack: Math.round(computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]) * (1 + playerModifiers(p).attack)),
      defense: Math.round(homeDefensePower(units, tech) * (1 + playerModifiers(p).defense)),
      shieldPct: Math.round(getShieldPercent(p.buildings, allianceShieldBonus(p.allianceResearch)) * 100),
      defenseBonusPct: Math.round(playerModifiers(p).defense * 100),
      attackPlacesUsed: places(units, OFFENSIVE_UNITS),
      attackPlaces: getUnitCapacity(p.buildings, "attack", tech),
      defensePlacesUsed: places(units, DEFENSIVE_UNITS),
      defensePlaces: getUnitCapacity(p.buildings, "defense", tech),
      productionPerHour: Math.round(perHour),
      outage: eco.outage,
      fullStorage: eco.full.length
    };
  });
  rows.sort((a, b) => b.attack + b.defense - (a.attack + a.defense));
  const unitPlaces = [...OFFENSIVE_UNITS, ...DEFENSIVE_UNITS].map((id) => {
    var _a, _b;
    const owners = active.filter((p) => {
      var _a2, _b2, _c;
      return ((_c = (_b2 = (_a2 = p.units) == null ? void 0 : _a2[id]) == null ? void 0 : _b2.count) != null ? _c : 0) > 0;
    });
    return { id, name: (_b = (_a = findUnit(id)) == null ? void 0 : _a.name) != null ? _b : id, places: owners.reduce((a, p) => {
      var _a2, _b2, _c, _d, _e;
      return a + ((_c = (_b2 = (_a2 = p.units) == null ? void 0 : _a2[id]) == null ? void 0 : _b2.count) != null ? _c : 0) * ((_e = (_d = findUnit(id)) == null ? void 0 : _d.hangarSpace) != null ? _e : 1);
    }, 0), owners: owners.length };
  }).filter((u) => u.places > 0).sort((a, b) => b.places - a.places);
  const since = now - windowDays * 864e5;
  const recent = reports.filter((r) => r.timestamp >= since);
  const isNpc2 = (uid) => !!uid && (uid.startsWith("npc") || uid === "pirates" || uid.startsWith("lair_"));
  const pvp = recent.filter((r) => !isNpc2(r.attackerUid) && !isNpc2(r.defenderUid));
  const wl = recent.filter((r) => {
    var _a, _b;
    return ((_a = r.attackerUid) == null ? void 0 : _a.startsWith("npc")) || ((_b = r.defenderUid) == null ? void 0 : _b.startsWith("npc"));
  });
  const pct5 = (xs) => xs.length ? Math.round(xs.filter((r) => r.outcome === "attacker_win").length / xs.length * 100) : 0;
  const factions2 = FACTIONS.map((f) => {
    var _a, _b, _c, _d;
    let raidsWon = 0, raidsLost = 0, lairsTaken = 0, lairsOpen = 0;
    for (const p of active) {
      const st = (_a = p.pirates) == null ? void 0 : _a[f.id];
      if (!st) continue;
      raidsWon += (_b = st.raidsWon) != null ? _b : 0;
      raidsLost += (_c = st.raidsLost) != null ? _c : 0;
      lairsTaken += (_d = st.lairsTaken) != null ? _d : 0;
      if (st.lairOpen) lairsOpen++;
    }
    const total2 = raidsWon + raidsLost;
    return { id: f.id, name: f.name, raidsWon, raidsLost, repelledPct: total2 ? Math.round(raidsWon / total2 * 100) : 0, lairsTaken, lairsOpen };
  });
  return {
    generatedAt: now,
    activePlayers: active.length,
    players: rows,
    unitPlaces,
    pvp: { battles: pvp.length, attackerWinPct: pct5(pvp), windowDays },
    warlordBattles: { battles: wl.length, attackerWinPct: pct5(wl) },
    factions: factions2,
    warlords: warlords.map((w) => {
      var _a, _b, _c, _d;
      return { pseudo: w.pseudo, power: Math.round(computeFullPower((_a = w.units) != null ? _a : {}, (_b = w.techLevels) != null ? _b : {}, OFFENSIVE_UNITS, ["attack"]) + homeDefensePower((_c = w.units) != null ? _c : {}, (_d = w.techLevels) != null ? _d : {})) };
    }).sort((a, b) => b.power - a.power),
    bestDefense: Math.max(0, ...rows.map((r) => r.defense)),
    bestAttack: Math.max(0, ...rows.map((r) => r.attack))
  };
}

// src/game/procedural.ts
var PROCEDURAL_KEY = "procedural";
var DEFAULT_PROCEDURAL = { enabled: true, chapters: true, pass: true, achievements: true, leadDay: 20, log: [] };
function normalizeProcedural(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const bool = (v, d) => typeof v === "boolean" ? v : d;
  return {
    enabled: bool(r.enabled, DEFAULT_PROCEDURAL.enabled),
    chapters: bool(r.chapters, DEFAULT_PROCEDURAL.chapters),
    pass: bool(r.pass, DEFAULT_PROCEDURAL.pass),
    achievements: bool(r.achievements, DEFAULT_PROCEDURAL.achievements),
    leadDay: Math.min(28, Math.max(1, Math.floor(Number(r.leadDay) || DEFAULT_PROCEDURAL.leadDay))),
    log: (Array.isArray(r.log) ? r.log : []).filter((l) => l && typeof l.text === "string").slice(-50)
  };
}
function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function seededRandom2(seed) {
  let a = hashSeed(seed);
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var pick = (rng, xs) => xs[Math.floor(rng() * xs.length) % xs.length];
var fill = (text, vars) => text.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m);
var ucfirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);
var lcArticle = (name) => name.replace(/^(Le|La|Les|L')(?=[\s'])/, (a) => a.toLowerCase()).replace(/^L'/, "l'");
var ofFaction = (f) => /^le\s/.test(f) ? f.replace(/^le\s/, "du ") : `de ${f}`;
var ofName = (name) => /^Le\s/.test(name) ? name.replace(/^Le\s/, "du ") : /^Les\s/.test(name) ? name.replace(/^Les\s/, "des ") : `de ${lcArticle(name)}`;
var clamp3 = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
var round2 = (x) => Math.round(x * 100) / 100;
function median4(xs) {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
var ACTIVITY_KEYS = ["contract", "bounty", "raidRepelled", "victory", "mission", "spy", "market", "warlordWin"];
var ACTIVITY_DEEDS = {
  contract: "rempli {n} contrats",
  bounty: "rempli {n} primes Kesh'Vaar",
  raidRepelled: "repouss\xE9 {n} raids de faction",
  victory: "gagn\xE9 {n} combats",
  bossAssault: "men\xE9 {n} assauts",
  mission: "termin\xE9 {n} missions",
  spy: "lanc\xE9 {n} sondes",
  market: "conclu {n} achats au march\xE9",
  warlordWin: "pill\xE9 {n} seigneurs de guerre"
};
function parisDay2(now) {
  return new Date(now + parisOffsetMs(now)).getUTCDate();
}
function worldDigest(players, now) {
  var _a, _b, _c;
  const monthId = chronicleMonthId(now);
  const observedDays = Math.max(1, parisDay2(now));
  const active = players.filter((p) => {
    var _a2, _b2;
    return !p.npc && now - ((_b2 = (_a2 = p.lastActiveMs) != null ? _a2 : p.resourcesUpdatedAtMs) != null ? _b2 : 0) < 14 * 864e5;
  });
  const passes = active.map((p) => passState(p, now));
  const weeklyMedian = {};
  const totals = {};
  const heroes = {};
  for (const k of ACTIVITY_KEYS) {
    const counts = passes.map((s) => {
      var _a2, _b2;
      return (_b2 = (_a2 = s.activity) == null ? void 0 : _a2[k]) != null ? _b2 : 0;
    });
    totals[k] = counts.reduce((a, b) => a + b, 0);
    weeklyMedian[k] = round2(median4(counts) / observedDays * 7);
    const best = counts.reduce((bi, c, i) => c > counts[bi] ? i : bi, 0);
    if (counts[best] > 0) heroes[k] = { pseudo: active[best].pseudo, count: counts[best] };
  }
  const month2 = chronicleOf(now);
  const open = unlockedEpisodes(now);
  const states = active.map((p) => chronicleState(p, now));
  const share = (n) => active.length > 0 ? round2(n / active.length) : 0;
  const episodes = ((_a = month2 == null ? void 0 : month2.episodes) != null ? _a : []).map((e3, i) => ({
    type: e3.objective.type,
    count: e3.objective.count,
    completion: share(states.filter((s) => s.claimed.includes(i)).length),
    open: i < open,
    daysOpen: Math.max(0, Math.floor((now - episodeUnlockMs(monthId, i)) / 864e5))
  }));
  const seasonId = (_c = (_b = passes[0]) == null ? void 0 : _b.seasonId) != null ? _c : monthId;
  const tiers2 = passes.map((s) => passTier(s.points, s.seasonId));
  const passTiers = activePass(seasonId).tiers.length;
  return {
    monthId,
    observedDays,
    activePlayers: active.length,
    weeklyMedian,
    totals,
    heroes,
    episodes,
    passMedianTier: median4(tiers2),
    passTiers,
    passFinishedShare: share(tiers2.filter((t) => t >= passTiers).length),
    chapterShare: month2 ? share(states.filter((s) => month2.episodes.every((_, i) => s.claimed.includes(i))).length) : 0,
    allianceSizeMedian: median4(Object.values(active.reduce((acc, p) => {
      var _a2;
      return p.allianceId ? __spreadProps(__spreadValues({}, acc), { [p.allianceId]: ((_a2 = acc[p.allianceId]) != null ? _a2 : 0) + 1 }) : acc;
    }, {})))
  };
}
var BASE_COUNTS = { contract: 4, bounty: 2, raidRepelled: 2, victory: 3, bossAssault: 2, mission: 6, spy: 3, market: 3, warlordWin: 1 };
var MATURE_EPISODE_DAYS = 5;
function chapterDifficulty(d) {
  const open = d.episodes.filter((e3) => {
    var _a;
    return e3.open && ((_a = e3.daysOpen) != null ? _a : MATURE_EPISODE_DAYS) >= MATURE_EPISODE_DAYS;
  });
  if (d.activePlayers === 0 || open.length === 0) return { value: 1, reasons: [`Pas encore d'\xE9pisode ouvert depuis ${MATURE_EPISODE_DAYS} jours : difficult\xE9 normale (\xD71).`] };
  const c = open.reduce((a, e3) => a + e3.completion, 0) / open.length;
  const value = round2(clamp3(1 + (c - 0.5), 0.7, 1.4));
  const pctTxt = Math.round(c * 100);
  const why = value > 1.02 ? "les objectifs montent" : value < 0.98 ? "les objectifs baissent" : "difficult\xE9 inchang\xE9e";
  return { value, reasons: [`${pctTxt} % des ${d.activePlayers} joueurs actifs ont termin\xE9 les ${open.length} \xE9pisode(s) ouverts depuis au moins ${MATURE_EPISODE_DAYS} jours (cible 50 %) : ${why} (\xD7${value}).`] };
}
function objectiveCount(type, d, difficulty) {
  var _a;
  const base = BASE_COUNTS[type];
  const m = (_a = d.weeklyMedian[type]) != null ? _a : 0;
  const raw = m > 0 ? clamp3(m * difficulty, base * 0.5, base * 3) : base * difficulty;
  return Math.max(1, Math.round(raw));
}
var AUTO_ART = [];
var ARCHETYPES = [
  {
    id: "confrerie",
    faction: "la Confr\xE9rie du Vide",
    villain: { speaker: "varan" },
    ally: "vashka",
    accent: "#ff7a45",
    themeLabels: ["Braise du Vide", "Rouille et cendre", "Feu de proue"],
    image: "/assets/chronicles/2026-10-boss.webp",
    emblem: "/assets/chronicles/2026-10-sceau.webp",
    fallbackImage: "/assets/story/varan.webp",
    bossNames: ["Le Croiseur-Dette", "La Forge du Silencieux", "Le Br\xFBle-Noms", "L'Arche des Cr\xE9anciers"],
    titles: ["Les Cendres de la Liste", "La Dette de sang", "Le Retour du Silencieux", "Les Noms effac\xE9s"],
    completionTitles: ["Briseur de Listes", "Cr\xE9ancier du Vide", "Effaceur de dettes", "Ombre de Varan"],
    lore: ["Un vaisseau de la Confr\xE9rie, rafistol\xE9 avec les \xE9paves de ceux qui n'ont pas pay\xE9. Sa coque porte la liste de ses prochaines cibles.", "La Confr\xE9rie ne pardonne rien : chaque dette impay\xE9e finit grav\xE9e sur sa coque, chaque nom ray\xE9 devient un troph\xE9e."]
  },
  {
    id: "cartel",
    faction: "le Cartel N\xE9on",
    villain: { speaker: "kor" },
    ally: "nerea",
    accent: "#ff5fd2",
    themeLabels: ["N\xE9on du Cartel", "Rose casino", "Lueur de jackpot"],
    image: "/assets/chronicles/2026-11-boss.webp",
    emblem: "/assets/chronicles/2026-11-sceau.webp",
    fallbackImage: "/assets/story/cartel.webp",
    bossNames: ["Le Casino-Forteresse", "La Banque Hurlante", "Le Jackpot \xC9carlate", "La Roue de Kor"],
    titles: ["La Mise de Kor", "Faites vos jeux", "La Banque saute", "Le Dernier Jeton"],
    completionTitles: ["Briseur de banque", "Joueur maudit", "Croupier noir", "Main de fer"],
    lore: ["Un casino volant o\xF9 l'on parie des plan\xE8tes. Ses tables sont des tourelles, ses croupiers des machines de guerre.", "Le Cartel ach\xE8te tout ce qui se vend et vole le reste ; ses dettes se r\xE8glent en vaisseaux."]
  },
  {
    id: "choeur",
    faction: "le Ch\u0153ur Silencieux",
    villain: { speaker: "vesper" },
    ally: "ilyon",
    accent: "#9fd8ff",
    themeLabels: ["Givre du Ch\u0153ur", "Bleu de cristal", "\xC9cho glac\xE9"],
    image: "/assets/chronicles/2026-12-boss.webp",
    emblem: "/assets/chronicles/2026-12-sceau.webp",
    fallbackImage: "/assets/story/choeur.webp",
    bossNames: ["L'Orgue des Abysses", "Le Psaume Noir", "La Cloche sans bouche", "Le Chantre de Givre"],
    titles: ["La Note perdue", "Le Silence revient", "Les Voix gel\xE9es", "Le Contre-Chant"],
    completionTitles: ["Voix du silence", "Briseur d'\xE9chos", "Chantre libre", "Porte-voix"],
    lore: ["Une cath\xE9drale de cristal qui chante sans bouche. L\xE0 o\xF9 passe son \xE9cho, les transmissions g\xE8lent.", "Le Ch\u0153ur ne parle pas : il accorde. Ceux qui l'entendent trop longtemps oublient leur propre voix."]
  },
  {
    id: "gravhorn",
    faction: "le Syndicat Gravhorn",
    villain: { speaker: "kragmor" },
    ally: "lysa",
    accent: "#7fd1ff",
    themeLabels: ["Acier Gravhorn", "Bleu de forage", "\xC9clat de minerai"],
    image: "/assets/chronicles/2027-01-boss.webp",
    emblem: "/assets/chronicles/2027-01-sceau.webp",
    fallbackImage: "/assets/story/gravhorn.webp",
    bossNames: ["La Foreuse-M\xE8re", "Le Concasseur d'ast\xE9ro\xEFdes", "La Plate-forme Ambre", "Le B\xE9lier de Kragmor"],
    titles: ["La Ru\xE9e vers l'ambre", "Le Filon maudit", "Les Contrats de fer", "La Grande Excavation"],
    completionTitles: ["Briseur de foreuses", "Contrema\xEEtre rebelle", "C\u0153ur de minerai", "Pied-de-fer"],
    lore: ["Une plate-forme de forage g\xE9ante qui avale des ast\xE9ro\xEFdes entiers et recrache des flottes.", "Le Syndicat vend le secteur au poids ; tout ce qui ne se mine pas se rase."]
  },
  {
    id: "culte",
    faction: "le culte de Maru",
    villain: { speaker: "maru" },
    ally: "vashka",
    accent: "#7dff9a",
    themeLabels: ["Vert des racines", "S\xE8ve de Maru", "Mousse des abysses"],
    image: "/assets/chronicles/2027-03-boss.webp",
    emblem: "/assets/chronicles/2027-03-sceau.webp",
    fallbackImage: "/assets/leviathan/leviathan.webp",
    bossNames: ["Le Colosse-Racine", "La Graine du L\xE9viathan", "Le Jardin d\xE9vorant", "L'Arbre-Proph\xE8te"],
    titles: ["La Floraison noire", "Les Graines du dieu", "La S\xE8ve monte", "Le R\xE9veil des racines"],
    completionTitles: ["Arracheur de racines", "\xC9lagueur", "H\xE9r\xE9tique de Maru", "Jardinier de cendres"],
    lore: ["Un colosse de chair et de racines, cultiv\xE9 en l'honneur du L\xE9viathan. Il grandit \xE0 chaque pri\xE8re.", "Le culte plante ses graines dans les \xE9paves ; au printemps suivant, les \xE9paves marchent."]
  },
  {
    id: "inquisition",
    faction: "l'Inquisition de l'Aube Blanche",
    villain: { as: { name: "Haut-Juge S\xE9raphin Vol", role: "Inquisition de l'Aube Blanche", image: "/assets/story/inquisition.webp", color: "#e8f4ff" } },
    ally: "brannoc",
    accent: "#ffe9a8",
    themeLabels: ["Aube blanche", "Or liturgique", "Lumi\xE8re froide"],
    image: "/assets/chronicles/2027-02-boss.webp",
    emblem: "/assets/chronicles/2027-02-sceau.webp",
    fallbackImage: "/assets/story/inquisition.webp",
    bossNames: ["Le Tribunal Ardent", "La Nef du Jugement", "Le B\xFBcher Orbital", "Le Lecteur \xC9ternel"],
    titles: ["Le Grand Proc\xE8s", "La Sentence", "L'Index des h\xE9r\xE9tiques", "L'Aube des juges"],
    completionTitles: ["H\xE9r\xE9tique notoire", "Briseur de sentences", "Acquitt\xE9", "Juge des juges"],
    lore: ["Une nef-tribunal qui juge les empires en orbite et ex\xE9cute la sentence dans la foul\xE9e.", "L'Inquisition tient un index des h\xE9r\xE9tiques ; y figurer co\xFBte une flotte, en sortir en co\xFBte deux."]
  },
  {
    id: "meute",
    faction: "la Meute d'Ysgrim",
    villain: { as: { name: "Ysgrim Crocs-de-Fer", role: "Meute d'Ysgrim", image: "/assets/story/meute.webp", color: "#ff9a5c" } },
    ally: "brannoc",
    accent: "#ff9a5c",
    themeLabels: ["Croc de rouille", "Sang de meute", "Ambre sauvage"],
    image: "/assets/story/meute.webp",
    emblem: "/assets/chronicles/2026-10-sceau.webp",
    fallbackImage: "/assets/story/meute.webp",
    bossNames: ["La Louve Rouge", "Le Terrier d'Acier", "La Grande Chasse", "Le Croc-Monde"],
    titles: ["La Saison de chasse", "Les Crocs dans la nuit", "Le Hurlement", "La Cur\xE9e"],
    completionTitles: ["Tueur de loups", "Chef de meute", "Croc d'argent", "Pisteur"],
    lore: ["Le vaisseau-tani\xE8re d'Ysgrim, h\xE9riss\xE9 de crocs d'abordage. Il ne frappe que les proies isol\xE9es.", "La Meute chasse en cercle ; quand on l'entend hurler, elle est d\xE9j\xE0 l\xE0."]
  }
];
function voiceLine(v, text) {
  return "speaker" in v ? { speaker: v.speaker, text: ucfirst(text) } : { speaker: "vashka", as: v.as, text: ucfirst(text) };
}
function villainName(v) {
  return "speaker" in v ? STORY_SPEAKERS[v.speaker].name : v.as.name;
}
var ACT_TITLES = [
  ["Les premiers signes", "L'appel", "Le signal", "Les rumeurs", "La br\xE8che"],
  ["La traque", "Les routes rouges", "Sur la piste", "Le filet", "Les \xE9claireurs"],
  ["Le prix du silence", "La trahison", "Les masques tombent", "Le pacte bris\xE9", "Le double jeu"],
  ["L'assaut", "La derni\xE8re nuit", "Le jugement", "La chute", "Tous ensemble"]
];
var HOOKS = [
  [
    "{villain} refait surface, {pseudo}. Et pas les mains vides : {boss} quitte son chantier.",
    "Mes \xE9claireurs ont rep\xE9r\xE9 la signature {ofFaction} aux confins du secteur. Ils pr\xE9parent quelque chose de grand.",
    "On parle de {boss} dans tous les ports. Personne ne l'a vu, mais tout le monde l'a entendu."
  ],
  [
    "Ils se croient \xE0 l'abri derri\xE8re leurs routes. Remontons-les une \xE0 une.",
    "Chaque coup port\xE9 maintenant leur co\xFBtera une semaine de pr\xE9paratifs.",
    "{faction} a besoin de temps. Ne lui en laissons aucun."
  ],
  [
    "Un de nos informateurs a chang\xE9 de camp. {villain} sait d\xE9j\xE0 o\xF9 nous frapperons.",
    "Les seigneurs de guerre ont \xE9t\xE9 pay\xE9s pour regarder ailleurs. Certains, pour regarder vers nous.",
    "Le plan a chang\xE9 : {boss} n'est pas une arme, c'est un app\xE2t. Et l'app\xE2t, c'est le secteur entier."
  ],
  [
    "Le dernier week-end du mois, {boss} sortira de l'ombre. Tout le secteur devra frapper ensemble.",
    "C'est maintenant ou jamais. Rassemble ta flotte : {boss} arrive.",
    "{villain} a mis toutes ses forces dans {boss}. S'il tombe, {faction} tombe avec lui."
  ]
];
var VILLAIN_TAUNTS = [
  "{pseudo}\u2026 Ton nom revient souvent. Trop souvent.",
  "Vous pensiez avoir gagn\xE9 le mois dernier ? Je ne faisais que compter vos forces.",
  "Chaque empire a un prix. Je viens chercher le tien.",
  "Continue de t'agiter, petit commandant. {boss} adore les proies qui bougent."
];
var ORDERS = {
  contract: ["Tiens tes contrats du jour : {count} rempli{s}, et nos routes tiendront.", "Il nous faut des r\xE9serves. Remplis {count} contrat{s} avant qu'ils ne coupent les routes."],
  bounty: ["L'Essaim a des cibles pour toi : remplis {count} prime{s} Kesh'Vaar.", "Chaque fugitif ramen\xE9 les prive d'un pilote. {count} prime{s}, commandant."],
  raidRepelled: ["Ils vont tester nos d\xE9fenses. Repousse {count} raid{s} et ils comprendront.", "Tiens la ligne : {count} raid{s} repouss\xE9{s}, pas un de moins."],
  victory: ["Montre au secteur qu'on peut les battre : gagne {count} combat{s}.", "La peur doit changer de camp : {count} victoire{s}, et le secteur rel\xE8vera la t\xEAte."],
  bossAssault: ["Frappe le boss {count} fois.", "{count} assauts sur le boss."],
  mission: ["Fouille les confins : {count} mission{s}, et chaque piste nous rapproche.", "Envoie tes \xE9quipes en mission, {count} fois. Les indices sont l\xE0-bas."],
  spy: ["Sonde le secteur : {count} sonde{s}, et nous saurons qui leur parle.", "Je veux des yeux partout. Lance {count} sonde{s} d'espionnage."],
  market: ["Les marchands parlent quand on leur ach\xE8te. {count} achat{s} au march\xE9.", "Suis l'argent : ach\xE8te {count} offre{s} au march\xE9 et regarde qui vend."],
  warlordWin: ["Les seigneurs de guerre leur servent de rabatteurs. Pille-en {count}.", "Frappe {count} seigneur{s} de guerre : qu'ils sachent ce que co\xFBte la trahison."]
};
var HERO_LINES = [
  "Le mois dernier, {hero} a {deed}. Le secteur s'en souvient ; {villain} aussi.",
  "On raconte que {hero} a {deed} en un mois. Voil\xE0 l'exemple \xE0 suivre.",
  "{hero} a {deed} ; {villain} a mis sa t\xEAte \xE0 prix. \xC7a ne passe pas inaper\xE7u."
];
function heroLine(rng, d, vars) {
  const keys = ACTIVITY_KEYS.filter((k2) => d.heroes[k2]);
  if (keys.length === 0) return null;
  const k = pick(rng, keys);
  const h = d.heroes[k];
  return fill(pick(rng, HERO_LINES), __spreadProps(__spreadValues({}, vars), { hero: h.pseudo, deed: fill(ACTIVITY_DEEDS[k], { n: h.count }) }));
}
function chooseObjectives(rng, d, previous) {
  var _a;
  const pool = ACTIVITY_KEYS.filter((k) => {
    var _a2;
    return k !== "raidRepelled" || ((_a2 = d.weeklyMedian.raidRepelled) != null ? _a2 : 0) > 0;
  });
  const weight = (k) => {
    var _a2;
    return (1 + Math.min(3, (_a2 = d.weeklyMedian[k]) != null ? _a2 : 0)) * (previous.includes(k) ? 0.4 : 1);
  };
  const chosen = [];
  const stretch = [...pool].filter((k) => k !== "warlordWin").sort((a, b) => {
    var _a2, _b;
    return ((_a2 = d.weeklyMedian[a]) != null ? _a2 : 0) - ((_b = d.weeklyMedian[b]) != null ? _b : 0);
  })[Math.floor(rng() * 2)];
  while (chosen.length < 3) {
    const left = pool.filter((k2) => !chosen.includes(k2) && k2 !== stretch);
    const total2 = left.reduce((a, k2) => a + weight(k2), 0);
    let r = rng() * total2;
    const k = (_a = left.find((x) => (r -= weight(x)) <= 0)) != null ? _a : left[0];
    chosen.push(k);
  }
  chosen.sort((a, b) => {
    var _a2, _b;
    return ((_a2 = d.weeklyMedian[a]) != null ? _a2 : 0) - ((_b = d.weeklyMedian[b]) != null ? _b : 0);
  });
  return [chosen[1], chosen[0], stretch, chosen[2]];
}
var CAPSULE_ROTATION = ["assault", "armor", "decoy", "veil"];
function episodeRewards(rng, difficulty) {
  const cap = CAPSULE_ROTATION[Math.floor(rng() * CAPSULE_ROTATION.length)];
  return [
    [{ kind: "amber", amount: Math.max(10, Math.round(15 * difficulty / 5) * 5) }],
    [{ kind: "capsule", capsule: cap, level: difficulty >= 1.15 ? 4 : 3 }],
    [{ kind: "production", hours: Math.max(2, Math.round(3 * difficulty)) }],
    [{ kind: "dossier", count: 1 }]
  ];
}
function bannerGradient(accent) {
  return `linear-gradient(120deg,#05070f 0%,${accent}40 45%,${accent} 100%)`;
}
function generatePass(rng, d, base) {
  let ppt = base;
  const reasons = [];
  const done = Math.round(d.passFinishedShare * 100);
  if (d.activePlayers > 0 && d.passFinishedShare > 0.4) {
    ppt = base * 1.15;
    reasons.push(`${done} % des joueurs ont fini le passe : palier plus long.`);
  } else if (d.activePlayers > 0 && d.passFinishedShare < 0.1 && d.passMedianTier < 10) {
    ppt = base * 0.85;
    reasons.push(`Seulement ${done} % ont fini le passe (palier m\xE9dian ${d.passMedianTier}) : palier plus court.`);
  } else reasons.push(`Passe : rythme conserv\xE9 (${done} % l'ont fini, palier m\xE9dian ${d.passMedianTier}).`);
  ppt = clamp3(Math.round(ppt / 5) * 5, 25, 80);
  reasons.push(`Points par palier : ${base} \u2192 ${ppt}.`);
  const start = Math.floor(rng() * CAPSULE_ROTATION.length);
  let capIdx = 0;
  const tiers2 = [];
  for (let t = 1; t <= 30; t++) {
    if (t === 30) tiers2.push([{ kind: "relic", rarity: "epic" }, { kind: "amber", amount: 40 }, { kind: "cosmetic" }]);
    else if (t === 20) tiers2.push([{ kind: "relic", rarity: "rare" }]);
    else if (t === 10) tiers2.push([{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }]);
    else if (t % 10 === 5) tiers2.push(t === 5 ? [{ kind: "dossier", count: 1 }] : [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 30 + (t > 20 ? 10 : 0) }]);
    else {
      const slot = (t + start) % 3;
      if (slot === 0) tiers2.push([{ kind: "production", hours: Math.min(12, 2 + Math.floor(t / 3)) }]);
      else if (slot === 1) tiers2.push([{ kind: "amber", amount: 20 + Math.floor(t / 10) * 10 }]);
      else tiers2.push([{ kind: "capsule", capsule: CAPSULE_ROTATION[(start + capIdx++) % CAPSULE_ROTATION.length], level: t < 10 ? 3 : t < 20 ? 4 : 5 }]);
    }
  }
  return { pass: { pointsPerTier: ppt, tiers: tiers2 }, reasons };
}
function archivesText(d, label3) {
  const parts = [`Archives du secteur, ${label3} : ${d.activePlayers} commandants actifs.`];
  const deeds = ACTIVITY_KEYS.filter((k) => {
    var _a;
    return ((_a = d.totals[k]) != null ? _a : 0) > 0;
  }).map((k) => fill(ACTIVITY_DEEDS[k], { n: d.totals[k] }));
  if (deeds.length > 0) parts.push(`Ensemble, ils ont ${deeds.join(", ")}.`);
  const heroes = ACTIVITY_KEYS.filter((k) => d.heroes[k]).map((k) => `${d.heroes[k].pseudo} (${OBJECTIVE_LABELS[k].toLowerCase()} : ${d.heroes[k].count})`);
  if (heroes.length > 0) parts.push(`Noms retenus : ${heroes.join(", ")}.`);
  parts.push(`${Math.round(d.chapterShare * 100)} % ont termin\xE9 le chapitre, ${Math.round(d.passFinishedShare * 100)} % le passe de saison.`);
  return parts.join(" ");
}
function generateChapter(o) {
  var _a, _b, _c, _d, _e;
  const rng = seededRandom2(`${o.monthId}:${(_a = o.variant) != null ? _a : 0}`);
  const d = o.digest;
  const recent = [...o.existing].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).slice(-2);
  const recentArch = recent.map((m) => {
    var _a2, _b2, _c2;
    return (_c2 = (_a2 = m.auto) == null ? void 0 : _a2.archetype) != null ? _c2 : (_b2 = ARCHETYPES.find((a) => a.fallbackImage === m.boss.fallbackImage)) == null ? void 0 : _b2.id;
  });
  const arch = pick(rng, ARCHETYPES.filter((a) => !recentArch.includes(a.id)));
  const usedTitles = new Set(o.existing.flatMap((m) => {
    var _a2, _b2;
    return [m.title, (_b2 = (_a2 = m.completion) == null ? void 0 : _a2.title) != null ? _b2 : "", m.boss.name];
  }));
  const fresh = (xs) => pick(rng, xs.filter((x) => !usedTitles.has(x)).length ? xs.filter((x) => !usedTitles.has(x)) : xs);
  const title = fresh(arch.titles);
  const bossName = fresh(arch.bossNames);
  const completionTitle = fresh(arch.completionTitles);
  const { value: difficulty, reasons } = chapterDifficulty(d);
  const previousTypes = ((_c = (_b = recent.at(-1)) == null ? void 0 : _b.episodes) != null ? _c : []).map((e3) => e3.objective.type);
  const types = chooseObjectives(rng, d, previousTypes);
  const rewards = episodeRewards(rng, difficulty);
  const vars = { villain: villainName(arch.villain), boss: lcArticle(bossName), faction: arch.faction, ofFaction: ofFaction(arch.faction) };
  const usedActs = /* @__PURE__ */ new Set();
  const episodes = types.map((type, i) => {
    const count2 = objectiveCount(type, d, difficulty);
    const lines = [];
    if (i === 0) {
      lines.push(voiceLine(arch.villain, fill(pick(rng, VILLAIN_TAUNTS), vars)));
      const hero = heroLine(rng, d, vars);
      if (hero) lines.push({ speaker: arch.ally, text: ucfirst(hero) });
    }
    if (i === 2) lines.push(voiceLine(arch.villain, fill(pick(rng, VILLAIN_TAUNTS.filter((t) => !lines.some((l) => l.text === fill(t, vars)))), vars)));
    lines.push({ speaker: arch.ally, text: ucfirst(fill(pick(rng, HOOKS[i]), vars)) });
    lines.push({ speaker: arch.ally, text: ucfirst(fill(pick(rng, ORDERS[type]), __spreadProps(__spreadValues({}, vars), { count: count2, s: count2 > 1 ? "s" : "" }))) });
    let epTitle = pick(rng, ACT_TITLES[i]);
    while (usedActs.has(epTitle)) epTitle = pick(rng, ACT_TITLES[i]);
    usedActs.add(epTitle);
    return { title: epTitle, lines, objective: { type, count: count2 }, reward: rewards[i] };
  });
  reasons.push(...types.map((t, i) => {
    var _a2;
    return `\xC9pisode ${i + 1} : ${OBJECTIVE_LABELS[t].toLowerCase()} \xD7 ${episodes[i].objective.count} (m\xE9diane ${(_a2 = d.weeklyMedian[t]) != null ? _a2 : 0} par semaine, base ${BASE_COUNTS[t]}).`;
  }));
  const art = AUTO_ART.includes(arch.id);
  const label3 = seasonLabel(d.monthId);
  const codex = [
    { id: "dossier", name: `Dossier : ${bossName}`, subtitle: `${ucfirst(arch.faction)} \xB7 ${title}`, text: `${arch.lore.join(" ")} Commandement : ${vars.villain}.`, image: art ? `/assets/chronicles/auto/${arch.id}-boss.webp` : arch.image },
    { id: "archives", name: `Archives : ${label3}`, subtitle: "Ce que le secteur a accompli", text: archivesText(d, label3), image: art ? `/assets/chronicles/auto/${arch.id}-sceau.webp` : arch.emblem }
  ];
  const auto = { generatedAtMs: o.now, sourceMonth: d.monthId, archetype: arch.id, difficulty, activePlayers: d.activePlayers, reasons };
  const month2 = {
    id: o.monthId,
    title,
    theme: { accent: arch.accent, label: pick(rng, arch.themeLabels) },
    boss: {
      name: bossName,
      title: `Pourfendeur ${ofName(bossName)}`,
      image: art ? `/assets/chronicles/auto/${arch.id}-boss.webp` : arch.image,
      emblem: art ? `/assets/chronicles/auto/${arch.id}-sceau.webp` : arch.emblem,
      fallbackImage: arch.fallbackImage,
      lore: pick(rng, arch.lore)
    },
    episodes,
    synopsis: fill(`${pick(rng, arch.lore)} Ce mois-ci, {villain} lance {boss} contre le secteur. ${ucfirst((_d = heroLine(rng, d, vars)) != null ? _d : "")}`.trim(), vars),
    completion: { title: completionTitle, banner: bannerGradient(arch.accent), rewards: [{ kind: "relic", rarity: difficulty >= 1.2 ? "epic" : "rare" }, { kind: "amber", amount: 30 }] },
    codex,
    auto
  };
  if (((_e = o.settings) == null ? void 0 : _e.pass) !== false) {
    const prev = activePass(d.monthId).pointsPerTier || PASS_RULES.pointsPerTier;
    const g = generatePass(rng, d, prev);
    month2.pass = g.pass;
    auto.reasons.push(...g.reasons);
  }
  return month2;
}
function monthsToGenerate(existing, now, leadDay) {
  const current2 = chronicleMonthId(now);
  const [y, m] = current2.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const ids = new Set(existing.map((x) => x.id));
  const out = [];
  if (!ids.has(current2)) out.push(current2);
  if (parisDay2(now) >= leadDay && !ids.has(next)) out.push(next);
  return out;
}
var NO_EXTENSION = /* @__PURE__ */ new Set(["maxBuildingLevel", "minBuildingLevel", "maxTechLevel", "maxUnitLevel"]);
var NEXT_TIER = { bronze: "argent", argent: "or", or: "legendaire", legendaire: "legendaire" };
var ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
function niceNumber(x) {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.ceil(x / p) * p;
}
function proposeAchievementTiers(defs, players, now) {
  var _a, _b, _c;
  const active = players.filter((p) => {
    var _a2, _b2;
    return !p.npc && now - ((_b2 = (_a2 = p.lastActiveMs) != null ? _a2 : p.resourcesUpdatedAtMs) != null ? _b2 : 0) < 14 * 864e5;
  });
  const out = [];
  const byMetric = /* @__PURE__ */ new Map();
  for (const a of defs.filter((x) => x.enabled)) byMetric.set(a.metric, [...(_a = byMetric.get(a.metric)) != null ? _a : [], a]);
  for (const [metric, list] of byMetric) {
    const m = METRICS[metric];
    if (!m || NO_EXTENSION.has(metric) || /\((%|0\/1)\)/.test(m.label)) continue;
    const top = [...list].sort((a, b) => b.threshold - a.threshold)[0];
    const holders = active.filter((p) => m.value(p) >= top.threshold).length;
    if (holders === 0) continue;
    const threshold = niceNumber(top.threshold * (top.threshold >= 100 ? 1.5 : top.threshold < 5 ? 3 : 2));
    const autoCount = list.filter((a) => a.auto).length;
    const baseName = top.name.replace(/\s+[IVX]+$/, "");
    const level3 = autoCount + 2;
    const tier = NEXT_TIER[top.tier];
    const r = TIER_REWARDS[tier];
    const id = `${top.id.replace(/_auto\d+$/, "")}_auto${autoCount + 1}`;
    if (defs.some((a) => a.id === id)) continue;
    out.push({
      def: {
        id,
        enabled: true,
        name: `${baseName} ${(_b = ROMAN[level3]) != null ? _b : level3}`,
        description: `${m.label} : ${formatInt(threshold)}.`,
        emoji: top.emoji,
        category: top.category,
        tier,
        metric: top.metric,
        threshold,
        secret: false,
        rewardXp: r.xp,
        rewardHours: r.hours,
        title: tier === "legendaire" ? `${baseName} ${(_c = ROMAN[level3]) != null ? _c : level3}` : "",
        auto: true
      },
      holders,
      reason: `${holders} joueur(s) ont atteint \xAB ${top.name} \xBB (${formatInt(top.threshold)}) : nouveau palier \xE0 ${formatInt(threshold)}.`
    });
  }
  return out;
}

// src/game/marketMaker.ts
var MARKET_MAKER_ID = "market_maker";
var MARKET_MAKER_PSEUDO = "Courtier du Comptoir";
var MARKET_MAKER_RULES = {
  /** Taille minimale (en équivalent ferraille). */
  minSize: 5e3,
  offerHours: 12
};
function marketMakerPlayer() {
  return __spreadProps(__spreadValues({}, defaultPlayerState(MARKET_MAKER_ID, MARKET_MAKER_PSEUDO)), { createdAt: 0 });
}
function isMarketMaker(uid) {
  return uid === MARKET_MAKER_ID;
}
function payWith(res) {
  return res === "scrap" ? "energy" : "scrap";
}
function planMakerOffers(open, commonPerHour, now) {
  if (!MARKET_RULES.makerEnabled) return [];
  const live = open.filter((o) => o.status === "open");
  const sizeScrap = Math.max(MARKET_MAKER_RULES.minSize, Math.round(commonPerHour * MARKET_RULES.makerSizeHours));
  const band = Math.max(1, MARKET_RULES.priceBand);
  const spread = Math.max(0, Math.min(MARKET_RULES.makerSpread, band - 1));
  const out = [];
  for (const r of RESOURCE_LIST) {
    const res = r.id;
    const pay2 = payWith(res);
    const size = Math.max(1, Math.round(sizeScrap * getTradeRate("scrap", res)));
    const reference = size * getTradeRate(res, pay2);
    const sells = live.filter((o) => {
      var _a;
      return ((_a = o.kind) != null ? _a : "sell") === "sell" && o.giveRes === res;
    });
    if (sells.length < MARKET_RULES.makerMinOffers && !sells.some((o) => isMarketMaker(o.sellerId))) {
      out.push({ kind: "sell", giveRes: res, giveAmount: size, wantRes: pay2, wantAmount: Math.ceil(reference * (1 + spread)), expiresAtMs: now + MARKET_MAKER_RULES.offerHours * 36e5 });
    }
    const buys = live.filter((o) => o.kind === "buy" && o.wantRes === res);
    if (buys.length < MARKET_RULES.makerMinOffers && !buys.some((o) => isMarketMaker(o.sellerId))) {
      out.push({ kind: "buy", giveRes: pay2, giveAmount: Math.max(1, Math.floor(reference * (1 - spread))), wantRes: res, wantAmount: size, expiresAtMs: now + MARKET_MAKER_RULES.offerHours * 36e5 });
    }
  }
  return out;
}

// src/game/allianceSaga.ts
var ALLIANCE_SAGA_KEY = "alliance_saga";
var ALLIANCE_SAGA_RULES = {
  objectives: 3,
  /** Points par objectif : 100 × progression, plafonnée à 2 (objectif dépassé). */
  pointsPerObjective: 100,
  overflowCap: 2,
  /** Heures de production des membres versées au trésor, 1re à 3e. */
  rewardHours: [24, 12, 6],
  /** Objectif = médiane hebdomadaire × semaines × taille médiane des alliances × ce facteur. */
  weeks: 4,
  share: 0.6
};
function readAllianceSaga(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    sagas: Array.isArray(r.sagas) ? r.sagas.slice(-12) : [],
    standing: r.standing && Array.isArray(r.standing.rows) ? r.standing : null,
    closed: Array.isArray(r.closed) ? r.closed.slice(-24) : []
  };
}
function sagaOf(state, monthId) {
  var _a;
  return (_a = state.sagas.find((s) => s.monthId === monthId)) != null ? _a : null;
}
var SAGA_TITLES = ["L'Alliance des cendres", "Le Serment commun", "La Grande Coalition", "Les Banni\xE8res lev\xE9es", "Le Pacte des \xE9toiles", "La Marche commune"];
var SAGA_WINNERS = ["H\xE9ros de la saga", "Porte-banni\xE8re", "Champion d'alliance", "Fer de lance"];
function generateAllianceSaga(monthId, digest, difficulty, now) {
  var _a;
  const rng = seededRandom2(`saga:${monthId}`);
  const arch = ARCHETYPES[Math.floor(rng() * ARCHETYPES.length) % ARCHETYPES.length];
  const pool = [...ACTIVITY_KEYS].filter((k) => {
    var _a2;
    return k !== "warlordWin" || ((_a2 = digest.weeklyMedian.warlordWin) != null ? _a2 : 0) > 0;
  });
  const chosen = [];
  while (chosen.length < ALLIANCE_SAGA_RULES.objectives && pool.length > 0) chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const size = Math.max(2, Math.round((_a = digest.allianceSizeMedian) != null ? _a : 3));
  const objectives = chosen.map((type) => {
    var _a2;
    const weekly = Math.max((_a2 = digest.weeklyMedian[type]) != null ? _a2 : 0, BASE_COUNTS[type] / 2);
    return { type, count: Math.max(size, Math.round(weekly * ALLIANCE_SAGA_RULES.weeks * size * ALLIANCE_SAGA_RULES.share * difficulty)) };
  });
  const bossName = arch.bossNames[Math.floor(rng() * arch.bossNames.length)];
  return {
    monthId,
    title: SAGA_TITLES[Math.floor(rng() * SAGA_TITLES.length)],
    lore: `${seasonLabel(monthId)} : ${arch.faction} lance ${bossName.replace(/^(Le|La|Les)(?=\s)|^L'/, (a) => a.toLowerCase())} contre le secteur. Seules les alliances qui tiennent ensemble auront leur nom grav\xE9 dans les archives.`,
    bossName,
    image: arch.image,
    accent: arch.accent,
    objectives,
    winnerTitle: `${SAGA_WINNERS[Math.floor(rng() * SAGA_WINNERS.length)]} (${seasonLabel(monthId).toLowerCase()})`,
    generatedAtMs: now
  };
}
function sagaProgress(def3, members, now) {
  return def3.objectives.map((o) => members.reduce((a, m) => {
    var _a, _b;
    return a + ((_b = (_a = passState(m, now).activity) == null ? void 0 : _a[o.type]) != null ? _b : 0);
  }, 0));
}
function sagaPoints(def3, progress) {
  return def3.objectives.reduce((a, o, i) => {
    var _a;
    return a + Math.round(ALLIANCE_SAGA_RULES.pointsPerObjective * Math.min(ALLIANCE_SAGA_RULES.overflowCap, ((_a = progress[i]) != null ? _a : 0) / Math.max(1, o.count)));
  }, 0);
}
function sagaStandings(def3, alliances, now) {
  const rows = alliances.map((a) => {
    const progress = sagaProgress(def3, a.members, now);
    return { allianceId: a.id, name: a.name, tag: a.tag, members: a.members.length, progress, points: sagaPoints(def3, progress), rank: 0 };
  });
  rows.sort((x, y) => y.points - x.points || y.progress.reduce((a, b) => a + b, 0) - x.progress.reduce((a, b) => a + b, 0));
  rows.forEach((r, i) => r.rank = i + 1);
  return rows.filter((r) => r.points > 0 || r.members > 0);
}
function sagaMonthId(now) {
  return chronicleMonthId(now);
}

// src/game/blog.ts
var BLOG_CATEGORIES = [
  { id: "annonces", label: "Annonces", emoji: "\u{1F4E3}", color: "#ffd86b", description: "Les grandes nouvelles du secteur : nouvelles saisons, \xE9v\xE9nements, rendez-vous." },
  { id: "mises-a-jour", label: "Mises \xE0 jour", emoji: "\u{1F6E0}\uFE0F", color: "#4be8ff", description: "Le d\xE9tail de chaque version : nouveaut\xE9s, \xE9quilibrages, corrections." },
  { id: "notes", label: "Notes du staff", emoji: "\u{1F4DD}", color: "#5cf2b0", description: "Petits mots de l'\xE9quipe : conseils, coups de c\u0153ur, r\xE9ponses \xE0 vos questions." },
  { id: "coulisses", label: "Coulisses", emoji: "\u{1F52D}", color: "#b18cff", description: "Comment le jeu est fabriqu\xE9 : technique, outils, routes de l'API." },
  { id: "equilibrage", label: "\xC9quilibrage", emoji: "\u2696\uFE0F", color: "#ff8a4c", description: "Les chiffres derri\xE8re les combats, l'\xE9conomie et la progression." },
  { id: "evenements", label: "\xC9v\xE9nements", emoji: "\u{1F389}", color: "#ff5c7a", description: "Week-ends, boss de saison, d\xE9fis et r\xE9compenses \xE0 venir." }
];
function blogCategory(id) {
  var _a;
  return (_a = BLOG_CATEGORIES.find((c) => c.id === id)) != null ? _a : BLOG_CATEGORIES[2];
}
var BLOG_RULES = {
  perPage: 9,
  titleMax: 140,
  excerptMax: 300,
  tagsMax: 8,
  tagMax: 32,
  slugMax: 80,
  bodyMax: 1e5
};
var ACCENTS = {
  \u00E0: "a",
  \u00E2: "a",
  \u00E4: "a",
  \u00E1: "a",
  \u00E3: "a",
  \u00E5: "a",
  \u00E6: "ae",
  \u00E7: "c",
  \u00E9: "e",
  \u00E8: "e",
  \u00EA: "e",
  \u00EB: "e",
  \u00ED: "i",
  \u00EC: "i",
  \u00EE: "i",
  \u00EF: "i",
  \u00F1: "n",
  \u00F3: "o",
  \u00F2: "o",
  \u00F4: "o",
  \u00F6: "o",
  \u00F5: "o",
  \u00F8: "o",
  \u0153: "oe",
  \u00FA: "u",
  \u00F9: "u",
  \u00FB: "u",
  \u00FC: "u",
  \u00FD: "y",
  \u00FF: "y",
  \u00DF: "ss"
};
function slugify(text, max = BLOG_RULES.slugMax) {
  var _a;
  const lower = String(text != null ? text : "").toLowerCase();
  let out = "";
  for (const ch of lower) out += (_a = ACCENTS[ch]) != null ? _a : ch;
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
}
function normalizeTags(raw) {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const t of list) {
    const tag = slugify(String(t), BLOG_RULES.tagMax);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= BLOG_RULES.tagsMax) break;
  }
  return out;
}
function plainText(markdown) {
  return String(markdown != null ? markdown : "").replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "").replace(/[*_~=`|]/g, "").replace(/\s+/g, " ").trim();
}
function readingMinutes(markdown) {
  const words = plainText(markdown).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
function excerptOf(post, max = 220) {
  if (post.excerpt.trim()) return post.excerpt.trim();
  const text = plainText(post.body);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30))}\u2026`;
}
var MONTHS = ["janvier", "f\xE9vrier", "mars", "avril", "mai", "juin", "juillet", "ao\xFBt", "septembre", "octobre", "novembre", "d\xE9cembre"];
function blogDate(ms) {
  const d = new Date(ms + parisOffsetMs(ms));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function blogDateTime(ms) {
  const d = new Date(ms + parisOffsetMs(ms));
  const pad = (n) => n < 10 ? `0${n}` : String(n);
  return `${blogDate(ms)} \xE0 ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
function isPublic(post, now) {
  return post.status === "published" && post.publishedAtMs > 0 && post.publishedAtMs <= now;
}
function relatedPosts(post, all, n = 3) {
  return all.filter((p) => p.id !== post.id).map((p) => ({ p, score: (p.category === post.category ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length * 3 })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.p.publishedAtMs - a.p.publishedAtMs).slice(0, n).map((x) => x.p);
}
function searchPosts(posts, q) {
  const words = slugify(q).split("-").filter((w) => w.length >= 2);
  if (words.length === 0) return posts;
  return posts.filter((p) => {
    const hay = slugify(`${p.title} ${p.excerpt} ${p.tags.join(" ")} ${plainText(p.body)}`, 1e6);
    return words.every((w) => hay.includes(w));
  });
}
function blogPostFromRecord(r, filesBase, authors) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const id = String((_a = r.id) != null ? _a : "");
  const authorUid = String((_b = r.authorUid) != null ? _b : "");
  const author = authors[authorUid];
  const cover2 = String((_c = r.cover) != null ? _c : "");
  return {
    id,
    slug: String((_d = r.slug) != null ? _d : ""),
    title: String((_e = r.title) != null ? _e : ""),
    excerpt: String((_f = r.excerpt) != null ? _f : ""),
    body: String((_g = r.body) != null ? _g : ""),
    category: String((_h = r.category) != null ? _h : "notes"),
    tags: normalizeTags(r.tags),
    coverUrl: cover2 ? `${filesBase}/api/files/blog_posts/${id}/${cover2}` : "",
    status: r.status === "published" ? "published" : "draft",
    publishedAtMs: Number(r.publishedAtMs) || 0,
    updatedAtMs: Number(r.updatedAtMs) || 0,
    pinned: r.pinned === true,
    version: String((_i = r.version) != null ? _i : ""),
    authorUid,
    authorPseudo: (author == null ? void 0 : author.pseudo) || String((_j = r.authorPseudo) != null ? _j : "\xC9quipe"),
    authorAvatarUrl: (_k = author == null ? void 0 : author.avatarUrl) != null ? _k : "",
    authorRole: (_l = author == null ? void 0 : author.role) != null ? _l : ""
  };
}
function publicPosts(posts, now) {
  return posts.filter((p) => isPublic(p, now)).sort((a, b) => b.publishedAtMs - a.publishedAtMs);
}
function shortHash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h << 5) + h + text.charCodeAt(i) | 0;
  return (h >>> 0).toString(36);
}

// src/game/blogMarkdown.ts
var SHORTCODES = {
  rocket: "\u{1F680}",
  fire: "\u{1F525}",
  tada: "\u{1F389}",
  warning: "\u26A0\uFE0F",
  star: "\u2B50",
  sparkles: "\u2728",
  heart: "\u2764\uFE0F",
  check: "\u2705",
  x: "\u274C",
  eyes: "\u{1F440}",
  wrench: "\u{1F527}",
  gear: "\u2699\uFE0F",
  trophy: "\u{1F3C6}",
  crown: "\u{1F451}",
  skull: "\u{1F480}",
  boom: "\u{1F4A5}",
  shield: "\u{1F6E1}\uFE0F",
  swords: "\u2694\uFE0F",
  gem: "\u{1F48E}",
  moneybag: "\u{1F4B0}",
  chart: "\u{1F4C8}",
  bug: "\u{1F41B}",
  bulb: "\u{1F4A1}",
  memo: "\u{1F4DD}",
  megaphone: "\u{1F4E3}",
  calendar: "\u{1F4C5}",
  clock: "\u23F0",
  lock: "\u{1F512}",
  key: "\u{1F511}",
  gift: "\u{1F381}",
  planet: "\u{1FA90}",
  satellite: "\u{1F6F0}\uFE0F",
  ufo: "\u{1F6F8}",
  alien: "\u{1F47D}",
  thumbsup: "\u{1F44D}",
  thumbsdown: "\u{1F44E}",
  clap: "\u{1F44F}",
  wave: "\u{1F44B}",
  salute: "\u{1FAE1}",
  thinking: "\u{1F914}"
};
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function safeUrl(raw, assetBase = "") {
  const url2 = String(raw != null ? raw : "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(url2)) return url2;
  if (url2.startsWith("/assets/")) return `${assetBase}${url2}`;
  if (url2.startsWith("/") || url2.startsWith("#") || url2.startsWith("./")) return url2;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url2)) return "#";
  return url2;
}
var KEYWORDS = {
  js: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "of", "in", "new", "await", "async", "import", "from", "export", "default", "class", "extends", "try", "catch", "throw", "true", "false", "null", "undefined", "typeof", "this"],
  ts: ["interface", "type", "enum", "implements", "readonly", "as", "keyof", "public", "private"],
  bash: ["curl", "echo", "export", "if", "then", "fi", "for", "do", "done", "cd", "npm", "npx", "node", "git"],
  css: ["!important"]
};
var LANG_ALIASES = { javascript: "js", typescript: "ts", tsx: "ts", jsx: "js", sh: "bash", shell: "bash", zsh: "bash", jsonc: "json" };
function highlight(code, langRaw) {
  var _a, _b;
  const lang = (_a = LANG_ALIASES[langRaw]) != null ? _a : langRaw;
  const words = /* @__PURE__ */ new Set([...(_b = KEYWORDS[lang]) != null ? _b : [], ...lang === "ts" ? KEYWORDS.js : []]);
  const commentRe = lang === "bash" ? /#[^\n]*/y : lang === "css" || lang === "html" ? /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/y : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
  const rules = [
    [commentRe, "c"],
    [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y, "s"],
    [/\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/y, "k"],
    [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y, "n"],
    [/[A-Za-z_$][\w$-]*/y, "w"]
  ];
  if (lang === "" || lang === "text" || lang === "txt") return escapeHtml(code);
  let out = "";
  let i = 0;
  while (i < code.length) {
    let matched = false;
    for (const [re, kind] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m || m[0].length === 0) continue;
      const text = m[0];
      if (kind === "w") out += words.has(text) || lang === "json" && (text === "true" || text === "false" || text === "null") ? `<span class="tk-k">${escapeHtml(text)}</span>` : escapeHtml(text);
      else if (kind === "s" && lang === "json" && code.slice(i + text.length).match(/^\s*:/)) out += `<span class="tk-p">${escapeHtml(text)}</span>`;
      else out += `<span class="tk-${kind}">${escapeHtml(text)}</span>`;
      i += text.length;
      matched = true;
      break;
    }
    if (!matched) {
      out += escapeHtml(code[i]);
      i += 1;
    }
  }
  return out;
}
function renderInline(src, opts) {
  var _a, _b;
  const emojis = new Map(((_a = opts.emojis) != null ? _a : []).map((e3) => [e3.code, e3]));
  const assetBase = (_b = opts.assetBase) != null ? _b : "";
  const stash = [];
  const keep = (html) => `\uE000${stash.push(html) - 1}\uE000`;
  let s = src.replace(/`([^`\n]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`));
  s = s.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, url2, title) => keep(`<img src="${escapeHtml(safeUrl(url2, assetBase))}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy">`)
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, text, url2) => {
    const href = safeUrl(url2, assetBase);
    const ext = /^https?:\/\//i.test(href);
    return keep(`<a href="${escapeHtml(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${renderInline(text, opts)}</a>`);
  });
  s = s.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url2) => keep(`<a href="${escapeHtml(url2)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url2)}</a>`));
  s = escapeHtml(s);
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?])/g, (_, pre, url2) => `${pre}<a href="${url2}" target="_blank" rel="noopener noreferrer">${url2}</a>`);
  s = s.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+?)__/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>").replace(/~~([^~]+?)~~/g, "<del>$1</del>").replace(/==([^=]+?)==/g, "<mark>$1</mark>").replace(/\[\[([^\]]{1,20})\]\]/g, "<kbd>$1</kbd>");
  s = s.replace(/:([a-z0-9_+-]{2,24}):/g, (all, code) => {
    var _a2, _b2;
    const e3 = emojis.get(code);
    if (e3) return `<img class="emoji" src="${escapeHtml(safeUrl(e3.url, assetBase))}" alt=":${code}:" title="${escapeHtml((_a2 = e3.label) != null ? _a2 : code)}">`;
    return (_b2 = SHORTCODES[code]) != null ? _b2 : all;
  });
  return s.replace(/\uE000(\d+)\uE000/g, (_, i) => stash[Number(i)]);
}
var CALLOUTS = {
  note: { label: "Note", icon: "\u2139\uFE0F" },
  info: { label: "Info", icon: "\u2139\uFE0F" },
  tip: { label: "Astuce", icon: "\u{1F4A1}" },
  warning: { label: "Attention", icon: "\u26A0\uFE0F" },
  danger: { label: "Danger", icon: "\u{1F6A8}" },
  important: { label: "Important", icon: "\u2757" },
  lore: { label: "Archives", icon: "\u{1F4DC}" }
};
function renderApi(code, opts) {
  var _a;
  const lines = code.split("\n");
  const head2 = ((_a = lines.shift()) != null ? _a : "").trim();
  const m = /^(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/i.exec(head2);
  if (!m) return `<pre class="code"><code>${escapeHtml(code)}</code></pre>`;
  const method = m[1].toUpperCase();
  const path = m[2];
  let auth = "public";
  const desc = [];
  const body = [];
  let inBody = false;
  for (const line of lines) {
    const a = /^auth:\s*(\w+)/i.exec(line.trim());
    if (a && !inBody) auth = a[1].toLowerCase();
    else if (/^body:\s*$/i.test(line.trim())) inBody = true;
    else if (inBody) body.push(line);
    else if (line.trim()) desc.push(line.trim());
  }
  const authLabel = auth === "admin" ? "Administrateur" : auth === "player" || auth === "joueur" ? "Joueur connect\xE9" : "Public";
  const tryable = method === "GET" && auth === "public" && path.startsWith("/api/");
  return `<div class="api-card" data-method="${method}" data-path="${escapeHtml(path)}">
<div class="api-head"><span class="api-method api-${method.toLowerCase()}">${method}</span><code class="api-path">${escapeHtml(path)}</code><span class="api-auth api-auth-${auth === "public" ? "public" : "private"}">${authLabel}</span></div>
${desc.length ? `<p class="api-desc">${renderInline(desc.join(" "), opts)}</p>` : ""}${body.length ? `<pre class="code api-body"><code>${highlight(body.join("\n"), "json")}</code></pre>` : ""}${tryable ? `<div class="api-try"><button type="button" class="api-run">Essayer la route</button><span class="api-status"></span></div><pre class="code api-out" hidden><code></code></pre>` : ""}
</div>`;
}
function renderList(lines, opts, headings) {
  const ordered = /^\s*\d+[.)]\s/.test(lines[0]);
  const startN = ordered ? Number(/^\s*(\d+)/.exec(lines[0])[1]) : 1;
  const baseIndent = /^\s*/.exec(lines[0])[0].length;
  const items = [];
  for (const line of lines) {
    const indent = /^\s*/.exec(line)[0].length;
    const m = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (m && indent <= baseIndent + 1) {
      const task = /^\[([ xX])\]\s+(.*)$/.exec(m[1]);
      items.push({ text: [task ? task[2] : m[1]], checked: task ? task[1].toLowerCase() === "x" : null, children: [] });
    } else if (items.length > 0) {
      if (indent > baseIndent + 1) items[items.length - 1].children.push(line);
      else items[items.length - 1].text.push(line.trim());
    }
  }
  const tag = ordered ? "ol" : "ul";
  const hasTasks = items.some((i) => i.checked !== null);
  const lis = items.map((it) => {
    const box = it.checked === null ? "" : `<span class="task${it.checked ? " done" : ""}" aria-hidden="true">${it.checked ? "\u2713" : ""}</span>`;
    const nested = it.children.length ? renderBlocks(it.children.map((l) => l.slice(Math.min(/^\s*/.exec(l)[0].length, baseIndent + 2))), opts, headings) : "";
    return `<li${it.checked !== null ? ' class="task-item"' : ""}>${box}${renderInline(it.text.join(" "), opts)}${nested}</li>`;
  }).join("");
  return `<${tag}${ordered && startN !== 1 ? ` start="${startN}"` : ""}${hasTasks ? ' class="tasks"' : ""}>${lis}</${tag}>`;
}
function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}
function renderTable(lines, opts) {
  const head2 = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map((c) => /^:-+:$/.test(c) ? "center" : /^-+:$/.test(c) ? "right" : /^:-+$/.test(c) ? "left" : "");
  const cell = (tag, text, i) => `<${tag}${aligns[i] ? ` style="text-align:${aligns[i]}"` : ""}>${renderInline(text, opts)}</${tag}>`;
  const rows = lines.slice(2).map((l) => `<tr>${splitRow(l).map((c, i) => cell("td", c, i)).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr>${head2.map((c, i) => cell("th", c, i)).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function uniqueId(base, headings) {
  const id = base || "section";
  let n = 1;
  let out = id;
  while (headings.some((h) => h.id === out)) out = `${id}-${++n}`;
  return out;
}
var isBlank = (l) => l.trim() === "";
var isFence = (l) => /^\s{0,3}(```|~~~)/.test(l);
var isHeading = (l) => /^\s{0,3}#{1,6}\s/.test(l);
var isHr = (l) => /^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(l);
var isQuote = (l) => /^\s{0,3}>/.test(l);
var isListItem = (l) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(l);
var isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes("-");
var isDirective = (l) => /^\s*:::/.test(l);
function renderBlocks(lines, opts, headings) {
  var _a, _b;
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    if (isFence(line)) {
      const fence = /^\s*(```|~~~)/.exec(line)[1];
      const lang = line.trim().slice(3).trim().toLowerCase();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) code.push(lines[i++]);
      i++;
      const text = code.join("\n");
      if (lang === "api") out.push(renderApi(text, opts));
      else out.push(`<div class="code-block">${lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ""}<button type="button" class="code-copy" aria-label="Copier le code">Copier</button><pre class="code"><code>${highlight(text, lang)}</code></pre></div>`);
      continue;
    }
    if (isDirective(line)) {
      const head2 = line.trim().slice(3).trim();
      const inner = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        if (isDirective(lines[i])) {
          if (lines[i].trim() === ":::") depth--;
          else depth++;
          if (depth === 0) break;
        }
        inner.push(lines[i++]);
      }
      i++;
      const [kind, ...rest] = head2.split(/\s+/);
      const content = renderBlocks(inner, opts, headings);
      if (kind === "grid") out.push(`<div class="md-grid">${content}</div>`);
      else out.push(`<details class="spoiler"><summary>${renderInline(rest.join(" ") || "Afficher", opts)}</summary><div class="spoiler-body">${content}</div></details>`);
      continue;
    }
    if (isHeading(line)) {
      const m = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      const level3 = Math.min(4, Math.max(2, m[1].length));
      const text = m[2];
      const id = uniqueId(slugify(text), headings);
      headings.push({ level: level3, id, text: text.replace(/[*_`~=]/g, "") });
      out.push(`<h${level3} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${renderInline(text, opts)}</h${level3}>`);
      i++;
      continue;
    }
    if (isHr(line)) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (isQuote(line)) {
      const inner = [];
      while (i < lines.length && isQuote(lines[i])) inner.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      const callout = /^\[!(\w+)\]\s*(.*)$/.exec((_b = (_a = inner[0]) == null ? void 0 : _a.trim()) != null ? _b : "");
      if (callout && CALLOUTS[callout[1].toLowerCase()]) {
        const type = callout[1].toLowerCase();
        const c = CALLOUTS[type];
        const title = callout[2] || c.label;
        out.push(`<aside class="callout callout-${type}"><p class="callout-title"><span aria-hidden="true">${c.icon}</span> ${renderInline(title, opts)}</p>${renderBlocks(inner.slice(1), opts, headings)}</aside>`);
      } else out.push(`<blockquote>${renderBlocks(inner, opts, headings)}</blockquote>`);
      continue;
    }
    if (isListItem(line)) {
      const block = [];
      while (i < lines.length && (isListItem(lines[i]) || !isBlank(lines[i]) && /^\s+/.test(lines[i]) || isBlank(lines[i]) && i + 1 < lines.length && /^\s+(?:[-*+]|\d+[.)])\s/.test(lines[i + 1]))) {
        if (!isBlank(lines[i])) block.push(lines[i]);
        i++;
      }
      out.push(renderList(block, opts, headings));
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const block = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && !isBlank(lines[i])) block.push(lines[i++]);
      out.push(renderTable(block, opts));
      continue;
    }
    const fig = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line);
    if (fig) {
      const caption = fig[3] || fig[1];
      out.push(`<figure><img src="${escapeHtml(safeUrl(fig[2], opts.assetBase))}" alt="${escapeHtml(fig[1])}" loading="lazy">${caption ? `<figcaption>${renderInline(caption, opts)}</figcaption>` : ""}</figure>`);
      i++;
      continue;
    }
    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && !isFence(lines[i]) && !isHeading(lines[i]) && !isQuote(lines[i]) && !isListItem(lines[i]) && !isHr(lines[i]) && !isDirective(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) para.push(lines[i++]);
    const html = para.map((l, k) => renderInline(l.replace(/(\s{2,}|\\)$/, ""), opts) + (k < para.length - 1 ? /(\s{2,}|\\)$/.test(l) ? "<br>" : " " : "")).join("");
    out.push(`<p>${html}</p>`);
  }
  return out.join("\n");
}
function renderMarkdown(markdown, opts = {}) {
  const headings = [];
  const lines = String(markdown != null ? markdown : "").replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  return { html: renderBlocks(lines, opts, headings), headings };
}

// src/game/blogPages.ts
var e = escapeHtml;
var url = (site, path) => `${site.base}${path}`;
var abs = (site, path) => `${site.origin}${site.base}${path}`;
var asset = (site, path) => path.startsWith("/assets/") ? `${site.gameUrl}${path}` : path;
function head(site, o) {
  var _a;
  const image = o.image || `${site.gameUrl}/assets/logo/logo.webp`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(o.title)}</title><meta name="description" content="${e(o.description)}">
<link rel="canonical" href="${e(o.canonical)}">${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:site_name" content="Cosmic Empires \xB7 Devblog"><meta property="og:type" content="${(_a = o.type) != null ? _a : "website"}"><meta property="og:title" content="${e(o.title)}"><meta property="og:description" content="${e(o.description)}"><meta property="og:url" content="${e(o.canonical)}"><meta property="og:image" content="${e(image)}"><meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${e(image)}"><meta name="theme-color" content="#4be8ff">
<link rel="icon" href="${site.gameUrl}/assets/logo/logo.webp"><link rel="alternate" type="application/rss+xml" title="Devblog Cosmic Empires" href="${abs(site, "/rss.xml")}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="${url(site, `/assets/blog.css?v=${site.assetVersion}`)}"></head><body>`;
}
function topbar(site, active) {
  const nav = [`<a href="${url(site, "/")}"${active === "home" ? ' class="on"' : ""}>Accueil</a>`, ...BLOG_CATEGORIES.map((c) => `<a href="${url(site, `/c/${c.id}`)}"${active === c.id ? ' class="on"' : ""}>${e(c.label)}</a>`)].join("");
  return `<a class="skip" href="#contenu">Aller au contenu</a><header class="topbar"><div class="wrap">
<a class="brand" href="${url(site, "/")}"><img src="${site.gameUrl}/assets/logo/logo.webp" alt=""><b>COSMIC EMPIRES</b><span>DEVBLOG</span></a>
<nav class="nav" aria-label="Cat\xE9gories">${nav}</nav><a class="play" href="${site.gameUrl}">Jouer</a></div></header>`;
}
function footer(site) {
  return `<footer class="footer"><div class="wrap"><div><a class="brand" href="${url(site, "/")}"><img src="${site.gameUrl}/assets/logo/logo.webp" alt=""><b>COSMIC EMPIRES</b><span>DEVBLOG</span></a>
<p>Annonces, mises \xE0 jour et notes de l'\xE9quipe. Le jeu de strat\xE9gie spatiale o\xF9 chaque empire \xE9crit sa l\xE9gende.</p></div>
<nav aria-label="Liens"><a href="${site.gameUrl}">Jouer</a><a href="${site.gameUrl}/bible">Bible du jeu</a><a href="${site.gameUrl}/formules">Formules</a><a href="${url(site, "/rss.xml")}">Flux RSS</a></nav></div></footer>
<script src="${url(site, `/assets/blog.js?v=${site.assetVersion}`)}" defer></script></body></html>`;
}
function categoryIcon(site, catId) {
  const c = blogCategory(catId);
  return `<img class="cat-ico" src="${site.gameUrl}/assets/blog/${c.id}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${c.emoji}'))">`;
}
function chip(site, catId) {
  const c = blogCategory(catId);
  return `<a class="chip" href="${url(site, `/c/${c.id}`)}" style="color:${c.color}">${categoryIcon(site, c.id)} ${e(c.label)}</a>`;
}
function chipSpan(site, catId) {
  const c = blogCategory(catId);
  return `<span class="chip" style="color:${c.color}">${categoryIcon(site, c.id)} ${e(c.label)}</span>`;
}
function avatar(site, p) {
  const src = p.authorAvatarUrl || `${site.gameUrl}/assets/avatars/default.webp`;
  return `<img class="avatar" src="${e(src)}" alt="" loading="lazy">`;
}
function cover(site, p) {
  return p.coverUrl ? asset(site, p.coverUrl) : `${site.gameUrl}/assets/story/choeur-banner.webp`;
}
function card(site, p) {
  return `<a class="card reveal" href="${url(site, `/p/${p.slug}`)}"><div class="cover" style="background-image:url('${e(cover(site, p))}')">${chipSpan(site, p.category)}${p.pinned ? '<span class="pin">\xC9PINGL\xC9</span>' : ""}</div>
<div class="body"><h2>${e(p.title)}</h2><p>${e(excerptOf(p, 160))}</p>
<div class="meta"><span class="who">${avatar(site, p)}${e(p.authorPseudo)}</span><span>${blogDate(p.publishedAtMs)}</span><span>${readingMinutes(p.body)} min</span>${p.version ? `<span class="vtag">v${e(p.version)}</span>` : ""}</div></div></a>`;
}
function feature(site, p) {
  return `<a class="feature reveal" href="${url(site, `/p/${p.slug}`)}"><div class="cover" style="background-image:url('${e(cover(site, p))}')"></div>
<div class="body">${chipSpan(site, p.category)}<h2>${e(p.title)}</h2><p>${e(excerptOf(p, 260))}</p>
<div class="meta"><span class="who">${avatar(site, p)}${e(p.authorPseudo)}</span><span>${blogDate(p.publishedAtMs)}</span><span>${readingMinutes(p.body)} min de lecture</span>${p.version ? `<span class="vtag">v${e(p.version)}</span>` : ""}</div></div></a>`;
}
function sidebar(site, posts, o) {
  var _a, _b, _c;
  const counts = /* @__PURE__ */ new Map();
  const tags = /* @__PURE__ */ new Map();
  for (const p of posts) {
    counts.set(p.category, ((_a = counts.get(p.category)) != null ? _a : 0) + 1);
    for (const t of p.tags) tags.set(t, ((_b = tags.get(t)) != null ? _b : 0) + 1);
  }
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 24);
  return `<aside class="side">
<form class="search panel" action="${url(site, "/recherche")}" method="get" role="search" style="padding:0"><input type="search" name="q" placeholder="Rechercher un article\u2026" value="${e((_c = o.q) != null ? _c : "")}" aria-label="Rechercher"><button type="submit" aria-label="Rechercher">\u2315</button></form>
<div class="panel"><h3>Cat\xE9gories</h3><ul class="cats">${BLOG_CATEGORIES.map((c) => {
    var _a2;
    return `<li><a href="${url(site, `/c/${c.id}`)}"${o.category === c.id ? ' style="color:#fff"' : ""}><span class="dot" style="background:${c.color};box-shadow:0 0 8px ${c.color}"></span>${categoryIcon(site, c.id)} ${e(c.label)}<span class="n">${(_a2 = counts.get(c.id)) != null ? _a2 : 0}</span></a></li>`;
  }).join("")}</ul></div>
${topTags.length ? `<div class="panel"><h3>Tags</h3><div class="tagcloud">${topTags.map(([t]) => `<a class="tag${o.tag === t ? " on" : ""}" href="${url(site, `/t/${t}`)}">${e(t)}</a>`).join("")}</div></div>` : ""}
<div class="panel"><h3>Rejoindre le secteur</h3><p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:var(--t3)">B\xE2tis ton empire, forge des alliances et \xE9cris ton nom dans les Chroniques.</p><a class="play cta" href="${site.gameUrl}">Jouer gratuitement</a><p style="margin:12px 0 0;text-align:center"><a class="tag" style="border:0" href="${url(site, "/rss.xml")}">flux RSS</a></p></div>
</aside>`;
}
function pager(site, path, page, pages, extra = "") {
  if (pages <= 1) return "";
  const link = (n) => `${url(site, path)}?page=${n}${extra}`;
  const items = [];
  if (page > 1) items.push(`<a href="${link(page - 1)}" rel="prev">\u2190</a>`);
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) items.push(n === page ? `<span class="cur">${n}</span>` : `<a href="${link(n)}">${n}</a>`);
    else if (Math.abs(n - page) === 2) items.push("<span>\u2026</span>");
  }
  if (page < pages) items.push(`<a href="${link(page + 1)}" rel="next">\u2192</a>`);
  return `<nav class="pager" aria-label="Pages">${items.join("")}</nav>`;
}
function renderBlogList(site, input) {
  var _a;
  const all = input.posts;
  const cat = input.category ? BLOG_CATEGORIES.find((c) => c.id === input.category) : void 0;
  let list = all;
  if (cat) list = list.filter((p) => p.category === cat.id);
  if (input.tag) list = list.filter((p) => p.tags.includes(input.tag));
  if (input.q !== void 0) list = searchPosts(list, input.q);
  const isHome = !cat && !input.tag && input.q === void 0;
  const featured = isHome && input.page === 1 ? (_a = list.find((p) => p.pinned)) != null ? _a : list[0] : void 0;
  const rest = featured ? list.filter((p) => p.id !== featured.id) : list;
  const pages = Math.max(1, Math.ceil(rest.length / BLOG_RULES.perPage));
  const page = Math.min(Math.max(1, input.page), pages);
  const shown = rest.slice((page - 1) * BLOG_RULES.perPage, page * BLOG_RULES.perPage);
  const path = cat ? `/c/${cat.id}` : input.tag ? `/t/${input.tag}` : input.q !== void 0 ? "/recherche" : "/";
  const title = cat ? `${cat.label} \xB7 Devblog Cosmic Empires` : input.tag ? `#${input.tag} \xB7 Devblog Cosmic Empires` : input.q !== void 0 ? `Recherche \xAB ${input.q} \xBB \xB7 Devblog Cosmic Empires` : "Devblog \xB7 Cosmic Empires";
  const description = cat ? cat.description : input.tag ? `Tous les articles du devblog sur ${input.tag}.` : "Annonces, mises \xE0 jour, coulisses et notes de l'\xE9quipe de Cosmic Empires.";
  const hero = cat ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Cat\xE9gorie</p><p class="eyebrow" style="color:${cat.color}">${categoryIcon(site, cat.id)} Cat\xE9gorie</p><h1>${e(cat.label)}</h1><p class="lead">${e(cat.description)}</p>` : input.tag ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Tag</p><p class="eyebrow">Tag</p><h1>#${e(input.tag)}</h1><p class="lead">${list.length} article${list.length > 1 ? "s" : ""}.</p>` : input.q !== void 0 ? `<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / Recherche</p><p class="eyebrow">Recherche</p><h1>\xAB ${e(input.q || "\u2026")} \xBB</h1><p class="lead">${list.length} r\xE9sultat${list.length > 1 ? "s" : ""}.</p>` : `<p class="eyebrow">Journal de bord de l'\xE9quipe</p><h1>Devblog</h1><p class="lead">Annonces, mises \xE0 jour, coulisses du d\xE9veloppement et petites notes du staff. Tout ce qui se passe dans le secteur, de premi\xE8re main.</p>`;
  const body = shown.length === 0 && !featured ? `<div class="panel empty"><b>Aucun article</b>${input.q !== void 0 ? "Essaie d'autres mots-cl\xE9s." : "Rien de publi\xE9 ici pour le moment. Repasse bient\xF4t !"}</div>` : `${featured ? feature(site, featured) : ""}${shown.length ? `${featured ? '<p class="section-title">Derniers articles</p>' : ""}<div class="grid">${shown.map((p) => card(site, p)).join("")}</div>` : ""}${pager(site, path, page, pages, input.q !== void 0 ? `&q=${encodeURIComponent(input.q)}` : "")}`;
  return `${head(site, { title, description, canonical: abs(site, path === "/" ? "/" : path), image: featured ? cover(site, featured) : void 0, noindex: input.q !== void 0 })}${topbar(site, cat ? cat.id : isHome ? "home" : "")}
<main id="contenu"><section class="hero wrap">${hero}</section><div class="wrap layout"><div>${body}</div>${sidebar(site, all, { q: input.q, tag: input.tag, category: cat == null ? void 0 : cat.id })}</div></main>${footer(site)}`;
}
function renderBlogPost(site, post, all, opts = {}) {
  const { html, headings } = renderMarkdown(post.body, { emojis: site.emojis, assetBase: site.gameUrl });
  const cat = blogCategory(post.category);
  const idx = all.findIndex((p) => p.id === post.id);
  const newer = idx > 0 ? all[idx - 1] : void 0;
  const older = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : void 0;
  const related = relatedPosts(post, all);
  const link = abs(site, `/p/${post.slug}`);
  const toc = headings.filter((h) => h.level <= 3);
  const updated = post.updatedAtMs > post.publishedAtMs + 36e5 ? `<span>Mis \xE0 jour le ${blogDate(post.updatedAtMs)}</span>` : "";
  const date = post.publishedAtMs > 0 ? blogDateTime(post.publishedAtMs) : "Non publi\xE9";
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, datePublished: new Date(post.publishedAtMs || site.now).toISOString(), dateModified: new Date(post.updatedAtMs || site.now).toISOString(), author: { "@type": "Person", name: post.authorPseudo }, image: cover(site, post), description: excerptOf(post), mainEntityOfPage: link }).replace(/</g, "\\u003c");
  return `${head(site, { title: `${post.title} \xB7 Devblog Cosmic Empires`, description: excerptOf(post), image: cover(site, post), canonical: link, type: "article", noindex: opts.preview })}
<script type="application/ld+json">${ld}</script><div class="progress" aria-hidden="true"></div>${topbar(site, cat.id)}
<main id="contenu"><header class="post-hero"><div class="bg" style="background-image:url('${e(cover(site, post))}')"></div><div class="wrap">
<p class="crumbs"><a href="${url(site, "/")}">Devblog</a> / <a href="${url(site, `/c/${cat.id}`)}">${e(cat.label)}</a></p>${chip(site, post.category)}
<h1>${e(post.title)}</h1>${post.excerpt ? `<p class="lead">${e(post.excerpt)}</p>` : ""}
<div class="meta"><span class="who">${avatar(site, post)}<span><b>${e(post.authorPseudo)}</b><small>${e(post.authorRole || "\xC9quipe Cosmic Empires")}</small></span></span><span>${date}</span>${updated}<span>${readingMinutes(post.body)} min de lecture</span>${post.version ? `<span class="vtag">v${e(post.version)}</span>` : ""}</div>
${opts.preview ? `<p class="draft-banner">Aper\xE7u : ${post.status === "draft" ? "brouillon, visible seulement par la r\xE9daction" : `programm\xE9 pour le ${blogDateTime(post.publishedAtMs)}`}</p>` : ""}</div></header>
<div class="wrap layout"><div><article class="panel article"><div class="prose">${html}</div>
<div class="post-foot">${post.tags.map((t) => `<a class="tag" href="${url(site, `/t/${t}`)}">${e(t)}</a>`).join("")}<div class="share"><button type="button" class="btn" data-copy="${e(link)}">Copier le lien</button><a class="btn" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(link)}">Partager</a></div></div></article>
${newer || older ? `<nav class="prevnext">${older ? `<a href="${url(site, `/p/${older.slug}`)}"><small>\u2190 Pr\xE9c\xE9dent</small><b>${e(older.title)}</b></a>` : ""}${newer ? `<a class="next" href="${url(site, `/p/${newer.slug}`)}"><small>Suivant \u2192</small><b>${e(newer.title)}</b></a>` : ""}</nav>` : ""}
${related.length ? `<p class="section-title" style="margin-top:36px">\xC0 lire aussi</p><div class="grid">${related.map((p) => card(site, p)).join("")}</div>` : ""}</div>
<aside class="side">${toc.length >= 2 ? `<nav class="panel toc" aria-label="Sommaire"><h3>Sommaire</h3><ol>${toc.map((h) => `<li class="l${h.level}"><a href="#${h.id}">${e(h.text)}</a></li>`).join("")}</ol></nav>` : sidebar(site, all, { category: cat.id })}</aside></div></main>${footer(site)}`;
}
function renderBlogNotFound(site, posts) {
  return `${head(site, { title: "Page introuvable \xB7 Devblog Cosmic Empires", description: "Cette page n'existe pas (ou plus).", canonical: abs(site, "/"), noindex: true })}${topbar(site, "")}
<main id="contenu"><section class="hero wrap"><p class="eyebrow" style="color:var(--danger)">Erreur 404 \xB7 Signal perdu</p><h1>Page introuvable</h1><p class="lead">Ce secteur est vide : l'article a peut-\xEAtre \xE9t\xE9 d\xE9plac\xE9 ou retir\xE9.</p><p style="margin-top:22px"><a class="play" href="${url(site, "/")}">Retour au devblog</a></p></section>
${posts.length ? `<div class="wrap" style="padding-bottom:48px"><p class="section-title">Derniers articles</p><div class="grid">${posts.slice(0, 3).map((p) => card(site, p)).join("")}</div></div>` : ""}</main>${footer(site)}`;
}
var xml = (s) => e(s);
function renderBlogRss(site, posts) {
  const items = posts.slice(0, 30).map((p) => {
    const { html } = renderMarkdown(p.body, { emojis: site.emojis, assetBase: site.gameUrl });
    return `<item><title>${xml(p.title)}</title><link>${xml(abs(site, `/p/${p.slug}`))}</link><guid isPermaLink="true">${xml(abs(site, `/p/${p.slug}`))}</guid><pubDate>${new Date(p.publishedAtMs).toUTCString()}</pubDate><category>${xml(blogCategory(p.category).label)}</category><dc:creator>${xml(p.authorPseudo)}</dc:creator><description>${xml(excerptOf(p))}</description><content:encoded><![CDATA[${html.replace(/\]\]>/g, "]]&gt;")}]]></content:encoded></item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Devblog Cosmic Empires</title><link>${xml(abs(site, "/"))}</link><description>Annonces, mises \xE0 jour et notes de l'\xE9quipe.</description><language>fr</language><atom:link href="${xml(abs(site, "/rss.xml"))}" rel="self" type="application/rss+xml"/>${posts[0] ? `<lastBuildDate>${new Date(posts[0].publishedAtMs).toUTCString()}</lastBuildDate>` : ""}${items}</channel></rss>`;
}
function renderBlogSitemap(site, posts) {
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  const urls = [`<url><loc>${xml(abs(site, "/"))}</loc><changefreq>daily</changefreq></url>`, ...BLOG_CATEGORIES.map((c) => `<url><loc>${xml(abs(site, `/c/${c.id}`))}</loc></url>`), ...posts.map((p) => `<url><loc>${xml(abs(site, `/p/${p.slug}`))}</loc><lastmod>${day(p.updatedAtMs || p.publishedAtMs)}</lastmod></url>`)];
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}
function renderBlogRobots(site) {
  return `User-agent: *
Allow: /
Disallow: ${site.base}/recherche
Sitemap: ${abs(site, "/sitemap.xml")}
`;
}

// src/game/blogStyles.ts
var BLOG_VARS = `--bg:#03040a;--panel:rgba(10,15,32,.78);--panel-solid:#0a0f20;--edge:rgba(75,232,255,.16);--edge-strong:rgba(75,232,255,.32);--cyan:#4be8ff;--gold:#ffd86b;--mint:#5cf2b0;--ember:#ff8a4c;--violet:#b18cff;--danger:#ff5c7a;--t1:#f1f5f9;--t2:#cbd5e1;--t3:#94a3b8;--t4:#64748b;--f-title:"Chakra Petch",system-ui,sans-serif;--f-body:Inter,system-ui,sans-serif;--f-mono:"JetBrains Mono",ui-monospace,monospace;--cut:polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px);--cut-sm:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)`;
var PROSE_CSS = `
.prose{color:var(--t2);font-size:17px;line-height:1.75;word-wrap:break-word}
.prose>*:first-child{margin-top:0}
.prose p{margin:0 0 1.1em}
.prose h2,.prose h3,.prose h4{font-family:var(--f-title);color:#fff;letter-spacing:.04em;line-height:1.25;margin:1.9em 0 .6em;position:relative;scroll-margin-top:90px}
.prose h2{font-size:1.55em;text-transform:uppercase;padding-bottom:.35em;border-bottom:1px solid var(--edge)}
.prose h2::after{content:"";position:absolute;left:0;bottom:-1px;width:64px;height:2px;background:var(--cyan);box-shadow:0 0 12px var(--cyan)}
.prose h3{font-size:1.25em;color:var(--cyan)}
.prose h4{font-size:1.05em;color:var(--gold);text-transform:uppercase;letter-spacing:.12em}
.prose .anchor{position:absolute;left:-1.1em;color:var(--t4);text-decoration:none;opacity:0;transition:opacity .2s}
.prose h2:hover .anchor,.prose h3:hover .anchor,.prose h4:hover .anchor{opacity:1}
.prose a{color:var(--cyan);text-decoration:none;border-bottom:1px solid rgba(75,232,255,.35);transition:border-color .2s,color .2s}
.prose a:hover{color:#fff;border-bottom-color:var(--cyan)}
.prose strong{color:#fff;font-weight:600}
.prose em{color:var(--t1)}
.prose del{color:var(--t4)}
.prose mark{background:rgba(255,216,107,.18);color:var(--gold);padding:0 .25em;border-radius:2px}
.prose kbd{font-family:var(--f-mono);font-size:.8em;padding:.1em .45em;border:1px solid var(--edge-strong);border-bottom-width:2px;background:rgba(255,255,255,.04);color:var(--t1);border-radius:3px}
.prose code{font-family:var(--f-mono);font-size:.86em;background:rgba(75,232,255,.08);color:#9ff3ff;padding:.12em .4em;border-radius:2px;border:1px solid rgba(75,232,255,.14)}
.prose hr{border:0;height:1px;margin:2.4em 0;background:linear-gradient(90deg,transparent,var(--edge-strong),transparent)}
.prose ul,.prose ol{margin:0 0 1.2em;padding-left:1.4em}.prose ul{list-style:disc}.prose ol{list-style:decimal}.prose ul ul{list-style:circle}
.prose li{margin:.35em 0}
.prose ul>li::marker{color:var(--cyan)}
.prose ol>li::marker{color:var(--cyan);font-family:var(--f-mono);font-size:.9em}
.prose ul.tasks{list-style:none;padding-left:.2em}
.prose .task{display:inline-grid;place-items:center;width:1.05em;height:1.05em;margin-right:.55em;border:1px solid var(--edge-strong);font-size:.75em;color:#03040a;vertical-align:-.1em}
.prose .task.done{background:var(--mint);border-color:var(--mint);box-shadow:0 0 10px rgba(92,242,176,.5)}
.prose blockquote{margin:1.4em 0;padding:.6em 1.2em;border-left:3px solid var(--violet);background:rgba(177,140,255,.06);color:var(--t1);font-style:italic}
.prose blockquote p:last-child{margin-bottom:0}
.prose figure{margin:1.8em 0}
.prose figure img,.prose p>img{display:block;max-width:100%;height:auto;margin:0 auto;border:1px solid var(--edge);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.prose figcaption{text-align:center;font-family:var(--f-mono);font-size:.72em;letter-spacing:.08em;color:var(--t4);margin-top:.7em}
.prose img.emoji{display:inline-block;width:1.45em;height:1.45em;vertical-align:-.35em;margin:0 .05em;border:0;clip-path:none;object-fit:contain}
.prose .md-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:1.6em 0}
.prose .md-grid figure{margin:0}
.prose .table-wrap{overflow-x:auto;margin:1.4em 0;border:1px solid var(--edge)}
.prose table{width:100%;border-collapse:collapse;font-size:.9em}
.prose th{font-family:var(--f-mono);font-size:.75em;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:var(--t3);background:rgba(75,232,255,.06);padding:.8em 1em;border-bottom:1px solid var(--edge-strong);text-align:left}
.prose td{padding:.7em 1em;border-top:1px solid rgba(255,255,255,.05)}
.prose tbody tr:hover td{background:rgba(255,255,255,.02)}
.prose .callout{margin:1.6em 0;padding:1em 1.2em;border:1px solid;border-left-width:3px;background:rgba(255,255,255,.02)}
.prose .callout p:last-child{margin-bottom:0}
.prose .callout-title{font-family:var(--f-title);font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-size:.82em;margin-bottom:.5em}
.prose .callout-note,.prose .callout-info{border-color:rgba(75,232,255,.35);background:rgba(75,232,255,.05)}.prose .callout-note .callout-title,.prose .callout-info .callout-title{color:var(--cyan)}
.prose .callout-tip{border-color:rgba(92,242,176,.35);background:rgba(92,242,176,.05)}.prose .callout-tip .callout-title{color:var(--mint)}
.prose .callout-warning,.prose .callout-important{border-color:rgba(255,216,107,.4);background:rgba(255,216,107,.05)}.prose .callout-warning .callout-title,.prose .callout-important .callout-title{color:var(--gold)}
.prose .callout-danger{border-color:rgba(255,92,122,.4);background:rgba(255,92,122,.06)}.prose .callout-danger .callout-title{color:var(--danger)}
.prose .callout-lore{border-color:rgba(177,140,255,.4);background:linear-gradient(135deg,rgba(177,140,255,.08),transparent)}.prose .callout-lore .callout-title{color:var(--violet)}.prose .callout-lore p{font-style:italic}
.prose details.spoiler{margin:1.4em 0;border:1px solid var(--edge);background:rgba(255,255,255,.02)}
.prose details.spoiler summary{cursor:pointer;padding:.7em 1em;font-family:var(--f-title);text-transform:uppercase;letter-spacing:.08em;font-size:.85em;color:var(--t1);list-style:none}
.prose details.spoiler summary::before{content:"\u25B8";display:inline-block;margin-right:.6em;color:var(--cyan);transition:transform .2s}
.prose details.spoiler[open] summary::before{transform:rotate(90deg)}
.prose .spoiler-body{padding:0 1em 1em}
.prose .code-block{position:relative;margin:1.4em 0}
.prose .code-lang{position:absolute;top:0;left:0;font-family:var(--f-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--t4);padding:.45em .9em;border-right:1px solid var(--edge);border-bottom:1px solid var(--edge)}
.prose .code-copy{position:absolute;top:6px;right:6px;font-family:var(--f-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);background:rgba(255,255,255,.04);border:1px solid var(--edge);padding:.35em .7em;cursor:pointer}
.prose .code-copy:hover{color:var(--cyan);border-color:var(--cyan)}
.prose pre.code{margin:0;padding:2.4em 1.2em 1.1em;overflow-x:auto;background:#060a16;border:1px solid var(--edge);font-family:var(--f-mono);font-size:13.5px;line-height:1.65;color:#cbd5e1}
.prose pre.code code{background:none;border:0;padding:0;color:inherit;font-size:inherit}
.prose .tk-k{color:#ff8adf}.prose .tk-s{color:#a5f3a0}.prose .tk-n{color:#ffd86b}.prose .tk-c{color:#5b6b86;font-style:italic}.prose .tk-p{color:#7fdcff}
.prose .api-card{margin:1.6em 0;border:1px solid var(--edge-strong);background:linear-gradient(135deg,rgba(75,232,255,.06),rgba(6,10,22,.9) 60%);clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)}
.prose .api-head{display:flex;flex-wrap:wrap;align-items:center;gap:.6em;padding:.8em 1em;border-bottom:1px solid var(--edge)}
.prose .api-method{font-family:var(--f-mono);font-size:.72em;font-weight:700;letter-spacing:.1em;padding:.3em .7em;color:#03040a}
.prose .api-get{background:var(--mint)}.prose .api-post{background:var(--cyan)}.prose .api-put,.prose .api-patch{background:var(--gold)}.prose .api-delete{background:var(--danger)}
.prose .api-path{background:none;border:0;color:#fff;font-size:.92em;padding:0}
.prose .api-auth{margin-left:auto;font-family:var(--f-mono);font-size:.68em;letter-spacing:.12em;text-transform:uppercase;padding:.3em .6em;border:1px solid}
.prose .api-auth-public{color:var(--mint);border-color:rgba(92,242,176,.4)}.prose .api-auth-private{color:var(--gold);border-color:rgba(255,216,107,.4)}
.prose .api-desc{margin:0;padding:.8em 1em;font-size:.92em;color:var(--t2)}
.prose .api-body{margin:0 1em 1em;padding-top:1em}
.prose .api-try{display:flex;align-items:center;gap:1em;padding:0 1em 1em}
.prose .api-run{font-family:var(--f-title);font-size:.8em;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:#03040a;background:var(--cyan);border:0;padding:.6em 1.1em;cursor:pointer;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);box-shadow:0 0 18px rgba(75,232,255,.35)}
.prose .api-run:hover{filter:brightness(1.15)}
.prose .api-run:disabled{opacity:.5;cursor:wait}
.prose .api-status{font-family:var(--f-mono);font-size:.78em;color:var(--t3)}
.prose .api-status.ok{color:var(--mint)}.prose .api-status.err{color:var(--danger)}
.prose .api-out{margin:0 1em 1em;padding-top:1em;max-height:360px}
`;
var BLOG_CSS = `
:root{${BLOG_VARS}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--t2);font-family:var(--f-body);-webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(1200px 600px at 85% -10%,rgba(75,232,255,.10),transparent 60%),radial-gradient(900px 700px at -10% 30%,rgba(177,140,255,.08),transparent 60%),radial-gradient(800px 500px at 60% 120%,rgba(255,138,76,.06),transparent 60%),var(--bg)}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55;background-image:radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,rgba(255,255,255,.7),transparent),radial-gradient(1.5px 1.5px at 200px 160px,rgba(75,232,255,.9),transparent),radial-gradient(1px 1px at 320px 40px,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 260px 260px,#fff,transparent),radial-gradient(1px 1px at 60px 220px,rgba(255,216,107,.8),transparent);background-size:360px 300px;animation:drift 120s linear infinite}
@keyframes drift{to{background-position:360px 300px}}
@media (prefers-reduced-motion:reduce){body::after{animation:none}*{transition:none!important}}
a{color:inherit}
img{max-width:100%}
.wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;z-index:99;background:var(--cyan);color:#000;padding:8px 12px}
/* En-t\xEAte */
.topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(14px);background:rgba(3,4,10,.72);border-bottom:1px solid var(--edge)}
.topbar .wrap{display:flex;align-items:center;gap:18px;height:64px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;flex-shrink:0}
.brand img{width:34px;height:34px}
.brand b{font-family:var(--f-title);font-weight:700;letter-spacing:.18em;font-size:15px}
.brand span{font-family:var(--f-mono);font-size:11px;letter-spacing:.24em;color:var(--cyan);border-left:1px solid var(--edge-strong);padding-left:10px}
.nav{display:flex;gap:4px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav a{font-family:var(--f-title);font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:var(--t3);padding:8px 12px;white-space:nowrap;transition:color .2s}
.nav a:hover,.nav a.on{color:#fff}
.nav a.on{box-shadow:inset 0 -2px 0 var(--cyan)}
.play{flex-shrink:0;font-family:var(--f-title);font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:#03040a;background:linear-gradient(90deg,var(--cyan),#9ff3ff);padding:9px 16px;clip-path:var(--cut-sm);box-shadow:0 0 22px rgba(75,232,255,.35)}
.play:hover{filter:brightness(1.1)}
.topbar .wrap{flex-wrap:wrap;height:auto;padding-top:10px;gap:4px 12px}.topbar .play{margin-left:auto}.nav{order:3;width:100%;margin:0;border-top:1px solid var(--edge)}.nav a:first-child{padding-left:0}
@media (max-width:900px){.nav{-webkit-mask-image:linear-gradient(90deg,#000 85%,transparent);mask-image:linear-gradient(90deg,#000 85%,transparent)}}
@media (max-width:760px){.topbar .wrap{flex-wrap:wrap;height:auto;padding-top:10px;gap:8px 12px}.brand span{display:none}.topbar .play{margin-left:auto;padding:7px 12px;font-size:12px}.nav{order:3;width:100%;margin:0 -20px;padding:0 12px;border-top:1px solid var(--edge)}.nav a{padding:10px 10px;font-size:12px}.hero{padding-top:36px}}
/* H\xE9ros */
.hero{padding-top:56px;padding-bottom:28px;position:relative}
.eyebrow{font-family:var(--f-mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--cyan)}
.hero h1{font-family:var(--f-title);font-size:clamp(38px,6vw,72px);line-height:1;margin:.25em 0 .2em;color:#fff;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 40px rgba(75,232,255,.25)}
.hero p.lead{max-width:640px;font-size:18px;color:var(--t3);margin:0}
.crumbs{font-family:var(--f-mono);font-size:12px;letter-spacing:.12em;color:var(--t4);margin-bottom:6px}
.crumbs a{text-decoration:none;color:var(--t3)}.crumbs a:hover{color:var(--cyan)}
/* Mise en page */
.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;padding-bottom:64px}
@media (max-width:980px){.layout{grid-template-columns:minmax(0,1fr)}}
.panel{background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut);padding:20px}
.side{display:flex;flex-direction:column;gap:20px}
.side h3{font-family:var(--f-mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--t4);margin:0 0 12px}
.search{display:flex;border:1px solid var(--edge-strong);background:rgba(0,0,0,.25)}
.search input{flex:1;min-width:0;background:none;border:0;color:#fff;font:inherit;font-size:14px;padding:10px 12px;outline:none}
.search button{background:none;border:0;border-left:1px solid var(--edge);color:var(--cyan);padding:0 14px;cursor:pointer;font-size:16px}
.cats{list-style:none;margin:0;padding:0}
.cats a{display:flex;align-items:center;gap:10px;text-decoration:none;padding:9px 4px;border-top:1px solid rgba(255,255,255,.05);color:var(--t2);font-size:14px;transition:color .2s,padding .2s}
.cats li:first-child a{border-top:0}
.cats a:hover{color:#fff;padding-left:10px}
.cats .n{margin-left:auto;font-family:var(--f-mono);font-size:12px;color:var(--t4)}
.cats .dot{width:8px;height:8px;transform:rotate(45deg);flex-shrink:0}
.tagcloud{display:flex;flex-wrap:wrap;gap:6px}
.tag{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.04em;color:var(--t3);text-decoration:none;border:1px solid var(--edge);padding:4px 9px;transition:all .2s}
.tag::before{content:"#";color:var(--cyan);margin-right:2px}
.tag:hover,.tag.on{color:#fff;border-color:var(--cyan);background:rgba(75,232,255,.08)}
.side .cta{display:block;text-align:center;text-decoration:none}
/* Cartes */
.cat-ico{width:2em;height:2em;margin:-.4em 0;object-fit:contain;vertical-align:middle}
.chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:4px 10px;border:1px solid currentColor;background:rgba(0,0,0,.35);backdrop-filter:blur(6px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px}
.card{position:relative;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut);transition:transform .25s,border-color .25s,box-shadow .25s}
.card:hover{transform:translateY(-3px);border-color:var(--edge-strong);box-shadow:0 14px 40px -18px rgba(75,232,255,.45)}
.card .cover{aspect-ratio:16/9;background:#070b18 center/cover no-repeat;position:relative;border-bottom:1px solid var(--edge)}
.card .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(3,4,10,.85))}
.card .cover .chip{position:absolute;left:12px;bottom:12px;z-index:1}
.card .cover .pin{position:absolute;right:12px;top:12px;z-index:1;font-family:var(--f-mono);font-size:10px;letter-spacing:.2em;color:#03040a;background:var(--gold);padding:3px 8px}
.card .body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.card h2{font-family:var(--f-title);font-size:20px;line-height:1.25;color:#fff;margin:0;letter-spacing:.02em}
.card p{margin:0;font-size:14.5px;line-height:1.6;color:var(--t3)}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-family:var(--f-mono);font-size:11.5px;color:var(--t4)}
.meta .who{display:inline-flex;align-items:center;gap:8px;color:var(--t2)}
.avatar{width:26px;height:26px;object-fit:cover;clip-path:var(--cut-sm);background:#0b1020;border:1px solid var(--edge)}
.card .meta{margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,.05)}
.vtag{color:var(--cyan);border:1px solid var(--edge-strong);padding:1px 6px}
/* Article mis en avant */
.feature{display:grid;grid-template-columns:1.3fr 1fr;margin-bottom:28px;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--edge-strong);clip-path:var(--cut);transition:box-shadow .25s}
.feature:hover{box-shadow:0 18px 60px -24px rgba(75,232,255,.55)}
.feature .cover{min-height:300px;background:#070b18 center/cover no-repeat;position:relative}
.feature .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 55%,rgba(10,15,32,.95))}
.feature .body{padding:28px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.feature h2{font-family:var(--f-title);font-size:clamp(24px,3vw,34px);line-height:1.15;margin:0;color:#fff;text-transform:uppercase}
.feature p{margin:0;color:var(--t3);line-height:1.65}
@media (max-width:760px){.feature{grid-template-columns:1fr}.feature .cover{min-height:200px}.feature .cover::after{background:linear-gradient(180deg,transparent 50%,rgba(10,15,32,.95))}}
.section-title{display:flex;align-items:center;gap:14px;font-family:var(--f-mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--t4);margin:8px 0 18px}
.section-title::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--edge-strong),transparent)}
.empty{padding:48px 24px;text-align:center;color:var(--t3)}
.empty b{display:block;font-family:var(--f-title);font-size:22px;color:#fff;text-transform:uppercase;margin-bottom:6px}
.pager{display:flex;justify-content:center;gap:8px;margin-top:32px;font-family:var(--f-mono);font-size:13px}
.pager a,.pager span{padding:8px 13px;border:1px solid var(--edge);text-decoration:none;color:var(--t3)}
.pager a:hover{color:#fff;border-color:var(--cyan)}
.pager .cur{color:#03040a;background:var(--cyan);border-color:var(--cyan)}
/* Article */
.post-hero{position:relative;padding-top:72px;padding-bottom:36px;margin-bottom:12px;overflow:hidden;border-bottom:1px solid var(--edge)}
.post-hero .bg{position:absolute;inset:0;z-index:-1;background:#070b18 center/cover no-repeat;opacity:.45;mask-image:linear-gradient(180deg,#000 30%,transparent)}
.post-hero h1{font-family:var(--f-title);font-size:clamp(32px,5vw,58px);line-height:1.08;color:#fff;margin:.35em 0 .35em;max-width:900px;letter-spacing:.02em;text-shadow:0 0 40px rgba(0,0,0,.6)}
.post-hero .lead{max-width:760px;font-size:19px;line-height:1.6;color:var(--t2);margin:0 0 22px}
.post-hero .meta{font-size:12.5px}
.post-hero .avatar{width:40px;height:40px}
.post-hero .who b{display:block;color:#fff;font-family:var(--f-title);font-size:15px;letter-spacing:.04em}
.post-hero .who small{color:var(--t4)}
.article{padding:28px 32px 36px}
@media (max-width:640px){.article{padding:20px 18px 28px}.prose{font-size:16px}.prose .anchor{display:none}}
.toc{position:sticky;top:84px}
.toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--edge)}
.toc a{display:block;text-decoration:none;color:var(--t3);font-size:13.5px;line-height:1.4;padding:6px 0 6px 14px;margin-left:-1px;border-left:2px solid transparent;transition:all .2s}
.toc a:hover{color:#fff}
.toc a.on{color:var(--cyan);border-left-color:var(--cyan)}
.toc .l3 a{padding-left:28px;font-size:12.5px}
.progress{position:fixed;left:0;top:0;height:2px;z-index:30;background:linear-gradient(90deg,var(--cyan),var(--violet));box-shadow:0 0 10px var(--cyan);width:0}
.post-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid var(--edge)}
.share{margin-left:auto;display:flex;gap:8px}
.btn{font-family:var(--f-title);font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--t1);background:rgba(255,255,255,.04);border:1px solid var(--edge-strong);padding:9px 14px;cursor:pointer;transition:all .2s}
.btn:hover{border-color:var(--cyan);color:var(--cyan)}
.prevnext{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
.prevnext a{display:block;text-decoration:none;padding:16px 18px;background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut-sm);transition:border-color .2s}
.prevnext a:hover{border-color:var(--cyan)}
.prevnext small{font-family:var(--f-mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--t4)}
.prevnext b{display:block;margin-top:4px;color:#fff;font-family:var(--f-title);font-size:16px}
.prevnext .next{text-align:right;grid-column:2}
@media (max-width:640px){.prevnext{grid-template-columns:1fr}.prevnext .next{grid-column:1}}
.draft-banner{background:repeating-linear-gradient(-45deg,rgba(255,216,107,.12) 0 12px,transparent 12px 24px);border:1px solid rgba(255,216,107,.5);color:var(--gold);font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;padding:10px 14px;margin-top:20px}
/* Pied de page */
.footer{border-top:1px solid var(--edge);background:rgba(3,4,10,.7);padding:36px 0 44px;margin-top:24px}
.footer .wrap{display:flex;flex-wrap:wrap;gap:20px 40px;align-items:flex-start;justify-content:space-between}
.footer p{margin:6px 0 0;font-size:13px;color:var(--t4);max-width:420px}
.footer nav{display:flex;flex-wrap:wrap;gap:8px 22px}
.footer nav a{font-family:var(--f-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:var(--t3)}
.footer nav a:hover{color:var(--cyan)}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;transition:all .3s;z-index:50;background:var(--panel-solid);border:1px solid var(--cyan);color:#fff;font-family:var(--f-mono);font-size:13px;padding:10px 16px;box-shadow:0 0 30px rgba(75,232,255,.3)}
.toast.show{opacity:1;transform:translate(-50%,0)}
.reveal{animation:rise .6s ease-out both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.grid .card:nth-child(2){animation-delay:.06s}.grid .card:nth-child(3){animation-delay:.12s}.grid .card:nth-child(4){animation-delay:.18s}.grid .card:nth-child(5){animation-delay:.24s}.grid .card:nth-child(6){animation-delay:.3s}
${PROSE_CSS}
`;
var BLOG_JS = `
(function(){
  var toast=document.createElement("div");toast.className="toast";document.body.appendChild(toast);
  function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove("show")},1800)}
  function copy(t,msg){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){say(msg)},function(){say("Copie impossible")})}
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest(".code-copy");
    if(b){var pre=b.parentNode.querySelector("pre");copy(pre?pre.innerText:"","Code copi\xE9");return}
    var s=e.target.closest&&e.target.closest("[data-copy]");
    if(s){e.preventDefault();copy(s.getAttribute("data-copy"),"Lien copi\xE9");return}
    var r=e.target.closest&&e.target.closest(".api-run");
    if(r){
      var card=r.closest(".api-card"),out=card.querySelector(".api-out"),st=card.querySelector(".api-status"),path=card.getAttribute("data-path"),t0=Date.now();
      r.disabled=true;st.className="api-status";st.textContent="Appel en cours\u2026";
      fetch(path,{headers:{accept:"application/json"}}).then(function(res){return res.text().then(function(txt){return {res:res,txt:txt}})}).then(function(x){
        var body=x.txt;try{body=JSON.stringify(JSON.parse(x.txt),null,2)}catch(_){}
        if(body.length>6000)body=body.slice(0,6000)+"\\n\u2026 (tronqu\xE9)";
        out.hidden=false;out.querySelector("code").textContent=body;
        st.className="api-status "+(x.res.ok?"ok":"err");st.textContent=x.res.status+" "+(x.res.statusText||"")+" \xB7 "+(Date.now()-t0)+" ms";
      }).catch(function(err){st.className="api-status err";st.textContent="Erreur : "+err.message}).then(function(){r.disabled=false});
    }
  });
  var bar=document.querySelector(".progress"),art=document.querySelector(".article");
  var links=[].slice.call(document.querySelectorAll(".toc a")),heads=links.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))});
  function onScroll(){
    if(bar&&art){var r=art.getBoundingClientRect(),h=r.height-innerHeight;bar.style.width=Math.max(0,Math.min(1,-r.top/Math.max(1,h)))*100+"%"}
    if(heads.length){var cur=0;heads.forEach(function(h,i){if(h&&h.getBoundingClientRect().top<120)cur=i});links.forEach(function(a,i){a.classList.toggle("on",i===cur)})}
  }
  addEventListener("scroll",onScroll,{passive:true});onScroll();
})();
`;

// src/game/emojis.ts
var EMOJIS_KEY = "emojis";
var EMOJI_CODE_RE = /^[a-z0-9_]{2,24}$/;
var MAX_CUSTOM_EMOJIS = 60;
var e2 = (code, label3) => ({ code, url: `/assets/emojis/${code}.webp`, label: label3 });
var GAME_EMOJI_GROUPS = [
  {
    label: "Factions",
    emojis: [
      e2("varan", "Capitaine Orsk Varan"),
      e2("silencieux", "Le Silencieux"),
      e2("gravhorn", "Oggrath le Pisteur"),
      e2("unite_ambre", "L'Unit\xE9 Ambre"),
      e2("inquisiteur", "Haut-Juge S\xE9raphin Vol"),
      e2("automate", "Automate de l'Aube Blanche"),
      e2("vashti", "Madame Vashti Kor"),
      e2("ysgrim", "Ysgrim Crocs-de-Fer"),
      e2("chaperon", "Le Chaperon"),
      e2("archonte", "L'Archonte Vesper"),
      e2("leviathan", "Le L\xE9viathan")
    ]
  },
  {
    label: "Empire",
    emojis: [
      e2("ferraille", "Ferraille"),
      e2("energie", "\xC9nergie"),
      e2("nano", "Nanocomposants"),
      e2("donnees", "Donn\xE9es anciennes"),
      e2("fragment_ia", "Fragment d'IA"),
      e2("ambre", "Ambre de Ruche"),
      e2("butin", "Butin"),
      e2("xp", "Exp\xE9rience")
    ]
  },
  {
    label: "Combat et gloire",
    emojis: [
      e2("attaque", "Attaque"),
      e2("bouclier", "Bouclier"),
      e2("flotte", "Flotte"),
      e2("espion", "Espionnage"),
      e2("menace", "Menace"),
      e2("alliance", "Alliance"),
      e2("chasseur", "Chasseur"),
      e2("etoile_noire", "\xC9toile Noire"),
      e2("trophee", "Troph\xE9e"),
      e2("challenger", "Challenger"),
      e2("grand_maitre", "Grand ma\xEEtre"),
      e2("legende", "L\xE9gendaire")
    ]
  },
  {
    label: "Mascottes",
    emojis: [e2("dino_furets", "Le dino aux furets"), e2("discosaure", "Le Discosaure")]
  }
];
var REACTIONS = [
  ["varan_or", "Varan compte son or"],
  ["silencieux_bras", "Le Silencieux attend"],
  ["gravhorn_mefiant", "Gravhorn m\xE9fiant"],
  ["ambre_ok", "L'Unit\xE9 Ambre approuve"],
  ["juge_colere", "Le Haut-Juge s'indigne"],
  ["vashti_bisou", "Vashti envoie un bisou"],
  ["ysgrim_hurle", "Ysgrim hurle"],
  ["archonte_chut", "L'Archonte : chut"]
];
GAME_EMOJI_GROUPS.splice(1, 0, {
  label: "R\xE9actions des factions",
  emojis: REACTIONS.flatMap(([code, label3]) => [1, 2, 3, 4].map((n) => e2(`${code}_${n}`, label3)))
});
var GAME_EMOJIS = GAME_EMOJI_GROUPS.flatMap((g) => g.emojis);
function normalizeCustomEmojis(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = /* @__PURE__ */ new Set();
  return raw.filter((e3) => !!e3 && typeof e3 === "object" && EMOJI_CODE_RE.test(String(e3.code)) && typeof e3.url === "string").filter((e3) => seen.has(e3.code) ? false : (seen.add(e3.code), true)).slice(0, MAX_CUSTOM_EMOJIS);
}

// src/game/blogWelcome.ts
var BLOG_WELCOME = {
  slug: "bienvenue-sur-le-devblog",
  title: "Bienvenue sur le devblog",
  excerpt: "Le journal de bord de l'\xE9quipe : annonces, mises \xE0 jour, coulisses du d\xE9veloppement et petites notes du staff.",
  category: "annonces",
  tags: ["devblog", "communaute"],
  version: "5.8",
  body: `Salut \xE0 toutes et \xE0 tous, commandants ! :varan:

Cosmic Empires a d\xE9sormais son **journal de bord**. C'est ici que l'\xE9quipe publiera les annonces, le d\xE9tail de chaque mise \xE0 jour, les coulisses du d\xE9veloppement et quelques petites notes en passant.

## Ce que vous trouverez ici

| Cat\xE9gorie | Pour quoi faire |
|:--|:--|
| \u{1F4E3} Annonces | Nouvelles saisons, \xE9v\xE9nements, grands rendez-vous |
| \u{1F6E0}\uFE0F Mises \xE0 jour | Le d\xE9tail de chaque version, avec les chiffres |
| \u{1F4DD} Notes du staff | Conseils, coups de c\u0153ur, r\xE9ponses \xE0 vos questions |
| \u{1F52D} Coulisses | Comment le jeu est fabriqu\xE9, outils et API |
| \u2696\uFE0F \xC9quilibrage | Les raisons derri\xE8re chaque changement de chiffres |
| \u{1F389} \xC9v\xE9nements | Week-ends, boss de saison, d\xE9fis |

> [!TIP] Suivre le blog
> Le flux RSS est en bas de chaque page. Il se branche sur Discord, sur un lecteur de flux ou sur votre application pr\xE9f\xE9r\xE9e.

## Un blog qui parle le langage du jeu

Les articles s'\xE9crivent en markdown, avec quelques extras :

- les **emojis du jeu** : :gravhorn: :silencieux: :ysgrim: ;
- des encadr\xE9s pour les notes, les avertissements et les extraits des archives ;
- des tableaux, des galeries d'images et des blocs repliables ;
- [x] des listes de t\xE2ches pour suivre les chantiers ;
- [ ] et bien d'autres choses \xE0 venir.

> [!LORE] Extrait des archives du Ch\u0153ur
> \xAB Les empires ne tombent pas au combat. Ils tombent quand plus personne ne raconte leur histoire. \xBB

### Des routes de l'API, en direct

Pour les curieux et les cr\xE9ateurs d'outils, certains articles pr\xE9senteront l'API du jeu. Les routes publiques peuvent \xEAtre test\xE9es directement depuis la page :

\`\`\`api
GET /api/cosmic/blog/posts?limite=3
Les trois derniers articles du devblog, en JSON. Parfait pour un bot Discord.
\`\`\`

\`\`\`api
GET /api/health
L'\xE9tat du serveur du jeu.
\`\`\`

Les routes r\xE9serv\xE9es aux joueurs connect\xE9s sont pr\xE9sent\xE9es sans bouton d'essai :

\`\`\`api
POST /api/cosmic/action
auth: player
Toutes les actions de jeu (construire, rechercher, \xE9changer\u2026) passent par cette route, v\xE9rifi\xE9es par le serveur.
body:
{ "type": "trade", "sellId": "scrap", "buyId": "energy", "amount": 1000 }
\`\`\`

Et les exemples de code sont color\xE9s :

\`\`\`js
const res = await fetch("/api/cosmic/blog/posts?categorie=mises-a-jour");
const { posts } = await res.json();
console.log(posts[0].title); // le dernier patch
\`\`\`

:::spoiler Un secret pour les plus curieux
Le L\xE9viathan n'a pas dit son dernier mot. \u{1F419}
:::

## Et maintenant ?

Le premier vrai article arrive bient\xF4t : le r\xE9capitulatif de tout ce qui a chang\xE9 depuis la 4.9. D'ici l\xE0, retournez d\xE9fendre vos colonies. On se retrouve dans le secteur ! :salute:

\u2014 L'\xE9quipe Cosmic Empires`
};

// node_modules/@noble/hashes/esm/crypto.js
var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function utf8ToBytes(str2) {
  if (typeof str2 !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str2));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum3 = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum3 += a.length;
  }
  const res = new Uint8Array(sum3);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
var Hash = class {
};
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto && typeof crypto.randomBytes === "function") {
    return Uint8Array.from(crypto.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}

// node_modules/@noble/curves/esm/utils.js
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function _abool2(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}"`;
    throw new Error(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function _abytes2(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value == null ? void 0 : value.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function numberToHexUnpadded(num2) {
  const hex = num2.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  abytes(bytes);
  return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes(hex);
    } catch (e3) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e3);
    }
  } else if (isBytes(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const u8of = (byte) => Uint8Array.of(byte);
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n(0)) => {
    k = h(u8of(0), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8of(1), seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function _validateObject(object, fields, optFields = {}) {
  if (!object || typeof object !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current2 = typeof val;
    if (current2 !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current2}`);
  }
  Object.entries(fields).forEach(([k, v]) => checkField(k, v, false));
  Object.entries(optFields).forEach(([k, v]) => checkField(k, v, true));
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}

// node_modules/@noble/curves/esm/abstract/modular.js
var _0n2 = BigInt(0);
var _1n2 = BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n, p1div4);
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return (Fp, n) => {
    let tv1 = Fp.pow(n, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n);
    const e22 = Fp.eql(Fp.sqr(tv3), n);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e22);
    const e3 = Fp.eql(Fp.sqr(tv2), n);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  _validateObject(field, opts);
  return field;
}
function FpPow(Fp, num2, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLenOrOpts, isLE = false, opts = {}) {
  if (ORDER <= _0n2)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  let _nbitLength = void 0;
  let _sqrt = void 0;
  let modFromBytes = false;
  let allowedLengths = void 0;
  if (typeof bitLenOrOpts === "object" && bitLenOrOpts != null) {
    if (opts.sqrt || isLE)
      throw new Error("cannot specify opts in two arguments");
    const _opts = bitLenOrOpts;
    if (_opts.BITS)
      _nbitLength = _opts.BITS;
    if (_opts.sqrt)
      _sqrt = _opts.sqrt;
    if (typeof _opts.isLE === "boolean")
      isLE = _opts.isLE;
    if (typeof _opts.modFromBytes === "boolean")
      modFromBytes = _opts.modFromBytes;
    allowedLengths = _opts.allowedLengths;
  } else {
    if (typeof bitLenOrOpts === "number")
      _nbitLength = bitLenOrOpts;
    if (opts.sqrt)
      _sqrt = opts.sqrt;
  }
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, _nbitLength);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n2,
    ONE: _1n2,
    allowedLengths,
    create: (num2) => mod(num2, ORDER),
    isValid: (num2) => {
      if (typeof num2 !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num2);
      return _0n2 <= num2 && num2 < ORDER;
    },
    is0: (num2) => num2 === _0n2,
    // is valid and invertible
    isValidNot0: (num2) => !f.is0(num2) && f.isValid(num2),
    isOdd: (num2) => (num2 & _1n2) === _1n2,
    neg: (num2) => mod(-num2, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num2) => mod(num2 * num2, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num2, power) => FpPow(f, num2, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num2) => num2 * num2,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num2) => invert(num2, ORDER),
    sqrt: _sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    toBytes: (num2) => isLE ? numberToBytesLE(num2, BYTES) : numberToBytesBE(num2, BYTES),
    fromBytes: (bytes, skipValidation = true) => {
      if (allowedLengths) {
        if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
          throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
        }
        const padded = new Uint8Array(BYTES);
        padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
        bytes = padded;
      }
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      if (modFromBytes)
        scalar = mod(scalar, ORDER);
      if (!skipValidation) {
        if (!f.isValid(scalar))
          throw new Error("invalid field element: outside of range 0..ORDER");
      }
      return scalar;
    },
    // TODO: we don't need it here, move out to separate fn
    invertBatch: (lst) => FpInvertBatch(f, lst),
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov: (a, b, c) => c ? b : a
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean2(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA384_IV = /* @__PURE__ */ Uint32Array.from([
  3418070365,
  3238371032,
  1654270250,
  914150663,
  2438529370,
  812702999,
  355462360,
  4144912697,
  1731405415,
  4290775857,
  2394180231,
  1750603025,
  3675008525,
  1694076839,
  1203062813,
  3204075428
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// node_modules/@noble/hashes/esm/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// node_modules/@noble/hashes/esm/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean2(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean2(this.buffer);
  }
};
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA512 = class extends HashMD {
  constructor(outputLen = 64) {
    super(128, outputLen, 16, false);
    this.Ah = SHA512_IV[0] | 0;
    this.Al = SHA512_IV[1] | 0;
    this.Bh = SHA512_IV[2] | 0;
    this.Bl = SHA512_IV[3] | 0;
    this.Ch = SHA512_IV[4] | 0;
    this.Cl = SHA512_IV[5] | 0;
    this.Dh = SHA512_IV[6] | 0;
    this.Dl = SHA512_IV[7] | 0;
    this.Eh = SHA512_IV[8] | 0;
    this.El = SHA512_IV[9] | 0;
    this.Fh = SHA512_IV[10] | 0;
    this.Fl = SHA512_IV[11] | 0;
    this.Gh = SHA512_IV[12] | 0;
    this.Gl = SHA512_IV[13] | 0;
    this.Hh = SHA512_IV[14] | 0;
    this.Hl = SHA512_IV[15] | 0;
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16; i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0; i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean2(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    clean2(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var SHA384 = class extends SHA512 {
  constructor() {
    super(48);
    this.Ah = SHA384_IV[0] | 0;
    this.Al = SHA384_IV[1] | 0;
    this.Bh = SHA384_IV[2] | 0;
    this.Bl = SHA384_IV[3] | 0;
    this.Ch = SHA384_IV[4] | 0;
    this.Cl = SHA384_IV[5] | 0;
    this.Dh = SHA384_IV[6] | 0;
    this.Dl = SHA384_IV[7] | 0;
    this.Eh = SHA384_IV[8] | 0;
    this.El = SHA384_IV[9] | 0;
    this.Fh = SHA384_IV[10] | 0;
    this.Fl = SHA384_IV[11] | 0;
    this.Gh = SHA384_IV[12] | 0;
    this.Gl = SHA384_IV[13] | 0;
    this.Hh = SHA384_IV[14] | 0;
    this.Hl = SHA384_IV[15] | 0;
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
var sha512 = /* @__PURE__ */ createHasher(() => new SHA512());
var sha384 = /* @__PURE__ */ createHasher(() => new SHA384());

// node_modules/@noble/hashes/esm/hmac.js
var HMAC = class extends Hash {
  constructor(hash2, _key) {
    super();
    this.finished = false;
    this.destroyed = false;
    ahash(hash2);
    const key = toBytes(_key);
    this.iHash = hash2.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash2.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean2(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes(out, this.outputLen);
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to || (to = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = (hash2, key, message) => new HMAC(hash2, key).update(message).digest();
hmac.create = (hash2, key) => new HMAC(hash2, key);

// node_modules/@noble/curves/esm/abstract/curve.js
var _0n3 = BigInt(0);
var _1n3 = BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  // Parametrized with a given Point class (not individual point)
  constructor(Point, bits) {
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.Fn = Point.Fn;
    this.bits = bits;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point Point instance
   * @param W window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point, W) {
    const { windows, windowSize } = calcWOpts(W, this.bits);
    const points = [];
    let p = point;
    let base = p;
    for (let window = 0; window < windows; window++) {
      base = p;
      points.push(base);
      for (let i = 1; i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  /**
   * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
   * @param acc accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W, this.bits);
    for (let window = 0; window < wo.windows; window++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
      n = nextN;
      if (isZero) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W, point, transform) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W);
      if (W !== 1) {
        if (typeof transform === "function")
          comp = transform(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar, transform) {
    const W = getW(point);
    return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
  }
  unsafe(point, scalar, transform, prev) {
    const W = getW(point);
    if (W === 1)
      return this._unsafeLadder(point, scalar, prev);
    return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P, W) {
    validateW(W, this.bits);
    pointWindowSizes.set(P, W);
    pointPrecomputes.delete(P);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function mulEndoUnsafe(Point, point, k1, k2) {
  let acc = point;
  let p1 = Point.ZERO;
  let p2 = Point.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  const plength = points.length;
  const slength = scalars.length;
  if (plength !== slength)
    throw new Error("arrays of points and scalars must have equal length");
  const zero = c.ZERO;
  const wbits = bitLen(BigInt(plength));
  let windowSize = 1;
  if (wbits > 12)
    windowSize = wbits - 3;
  else if (wbits > 4)
    windowSize = wbits - 2;
  else if (wbits > 0)
    windowSize = 2;
  const MASK = bitMask(windowSize);
  const buckets = new Array(Number(MASK) + 1).fill(zero);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum3 = zero;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(zero);
    for (let j = 0; j < slength; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & MASK);
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero;
    for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum3 = sum3.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum3 = sum3.double();
  }
  return sum3;
}
function createField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE });
  }
}
function _createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}

// node_modules/@noble/curves/esm/abstract/weierstrass.js
var divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
function _splitEndoScalar(k, basis, n) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def3) {
  const optsn = {};
  for (let optName of Object.keys(def3)) {
    optsn[optName] = opts[optName] === void 0 ? def3[optName] : opts[optName];
  }
  _abool2(optsn.lowS, "lowS");
  _abool2(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
var DERErr = class extends Error {
  constructor(m = "") {
    super(m);
  }
};
var DER = {
  // asn.1 DER encoding utils
  Err: DERErr,
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num2) {
      const { Err: E } = DER;
      if (num2 < _0n4)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num2);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(hex) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = ensureBytes("signature", hex);
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n2 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);
function _normFnElement(Fn, key) {
  const { BYTES: expected } = Fn;
  let num2;
  if (typeof key === "bigint") {
    num2 = key;
  } else {
    let bytes = ensureBytes("private key", key);
    try {
      num2 = Fn.fromBytes(bytes);
    } catch (error) {
      throw new Error(`invalid private key: expected ui8a of size ${expected}, got ${typeof key}`);
    }
  }
  if (!Fn.isValidNot0(num2))
    throw new Error("invalid private key: out of range [1..N-1]");
  return num2;
}
function weierstrassN(params, extraOpts = {}) {
  const validated = _createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  _validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object",
    wrapPrivateKey: "boolean"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    _abool2(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    _abytes2(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes.length;
    const head2 = bytes[0];
    const tail = bytes.subarray(1);
    if (length === comp && (head2 === 2 || head2 === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const isYOdd = Fp.isOdd(y);
      const isHeadOdd = (head2 & 1) === 1;
      if (isHeadOdd !== isYOdd)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head2 === 4) {
      const L2 = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L2));
      const y = Fp.fromBytes(tail.subarray(L2, L2 * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes || pointToBytes;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("ProjectivePoint expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point {
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point.fromAffine(decodePoint(_abytes2(bytes, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex) {
      return Point.fromBytes(ensureBytes("pointHex", hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(Point, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      if (!Fn.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    multiplyAndAddUnsafe(Q, a, b) {
      const sum3 = this.multiplyUnsafe(a).add(Q.multiplyUnsafe(b));
      return sum3.is0() ? void 0 : sum3;
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      return wnaf.unsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      _abool2(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
    // TODO: remove
    get px() {
      return this.X;
    }
    get py() {
      return this.X;
    }
    get pz() {
      return this.Z;
    }
    toRawBytes(isCompressed = true) {
      return this.toBytes(isCompressed);
    }
    _setWindowSize(windowSize) {
      this.precompute(windowSize);
    }
    static normalizeZ(points) {
      return normalizeZ(Point, points);
    }
    static msm(points, scalars) {
      return pippenger(Point, Fn, points, scalars);
    }
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(_normFnElement(Fn, privateKey));
    }
  }
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
  Point.Fp = Fp;
  Point.Fn = Fn;
  const bits = Fn.BITS;
  const wnaf = new wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point.BASE.precompute(8);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: getMinHashLength(Fn.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      return !!_normFnElement(Fn, secretKey);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed = randomBytes_(lengths.seed)) {
    return mapHashToField(_abytes2(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point.BASE.multiply(_normFnElement(Fn, secretKey)).toBytes(isCompressed);
  }
  function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  }
  function isProbPub(item) {
    if (typeof item === "bigint")
      return false;
    if (item instanceof Point)
      return true;
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    if (Fn.allowedLengths || secretKey === publicKey)
      return void 0;
    const l = ensureBytes("key", item).length;
    return l === publicKey || l === publicKeyUncompressed;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = _normFnElement(Fn, secretKeyA);
    const b = Point.fromHex(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey,
    // TODO: remove
    isValidPrivateKey: isValidSecretKey,
    randomPrivateKey: randomSecretKey,
    normPrivateKeyToScalar: (key) => _normFnElement(Fn, key),
    precompute(windowSize = 8, point = Point.BASE) {
      return point.precompute(windowSize, false);
    }
  };
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash2, ecdsaOpts = {}) {
  ahash(hash2);
  _validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  const randomBytes2 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, ...msgs) => hmac(hash2, key, concatBytes(...msgs)));
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
  const defaultSigOpts = {
    prehash: false,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : false,
    format: void 0,
    //'compact' as ECDSASigFormat,
    extraEntropy: false
  };
  const defaultSigOpts_format = "compact";
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n4;
    return number > HALF;
  }
  function validateRS(title, num2) {
    if (!Fn.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return _abytes2(bytes, sizer, `${format} signature`);
  }
  class Signature {
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null)
        this.recovery = recovery;
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts_format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(_abytes2(bytes));
        return new Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L2 = Fn.BYTES;
      const r = bytes.subarray(0, L2);
      const s = bytes.subarray(L2, L2 * 2);
      return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
    }
    static fromHex(hex, format) {
      return this.fromBytes(hexToBytes(hex), format);
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const FIELD_ORDER = Fp.ORDER;
      const { r, s, recovery: rec } = this;
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const hasCofactor = CURVE_ORDER * _2n2 < FIELD_ORDER;
      if (hasCofactor && rec > 1)
        throw new Error("recovery id is ambiguous for h>1 curve");
      const radj = rec === 2 || rec === 3 ? r + CURVE_ORDER : r;
      if (!Fp.isValid(radj))
        throw new Error("recovery id 2 or 3 invalid");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes(pprefix((rec & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(ensureBytes("msgHash", messageHash));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s * ir);
      const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts_format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes(DER.hexFromSig(this));
      const r = Fn.toBytes(this.r);
      const s = Fn.toBytes(this.s);
      if (format === "recovered") {
        if (this.recovery == null)
          throw new Error("recovery bit must be present");
        return concatBytes(Uint8Array.of(this.recovery), r, s);
      }
      return concatBytes(r, s);
    }
    toHex(format) {
      return bytesToHex(this.toBytes(format));
    }
    // TODO: remove
    assertValidity() {
    }
    static fromCompact(hex) {
      return Signature.fromBytes(ensureBytes("sig", hex), "compact");
    }
    static fromDER(hex) {
      return Signature.fromBytes(ensureBytes("sig", hex), "der");
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, Fn.neg(this.s), this.recovery) : this;
    }
    toDERRawBytes() {
      return this.toBytes("der");
    }
    toDERHex() {
      return bytesToHex(this.toBytes("der"));
    }
    toCompactRawBytes() {
      return this.toBytes("compact");
    }
    toCompactHex() {
      return bytesToHex(this.toBytes("compact"));
    }
  }
  const bits2int = ecdsaOpts.bits2int || function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  };
  const bits2int_modN = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn.toBytes(num2);
  }
  function validateMsgAndHash(message, prehash) {
    _abytes2(message, void 0, "message");
    return prehash ? _abytes2(hash2(message), void 0, "prehashed message") : message;
  }
  function prepSig(message, privateKey, opts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = _normFnElement(Fn, privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e3 = extraEntropy === true ? randomBytes2(lengths.secretKey) : extraEntropy;
      seedArgs.push(ensureBytes("extraEntropy", e3));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const ik = Fn.inv(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = Fn.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn.create(ik * Fn.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  function sign(message, secretKey, opts = {}) {
    message = ensureBytes("message", message);
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash2.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig;
  }
  function tryParsingSig(sg) {
    let sig = void 0;
    const isHex = typeof sg === "string" || isBytes(sg);
    const isObj = !isHex && sg !== null && typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    if (isObj) {
      sig = new Signature(sg.r, sg.s);
    } else if (isHex) {
      try {
        sig = Signature.fromBytes(ensureBytes("sig", sg), "der");
      } catch (derError) {
        if (!(derError instanceof DER.Err))
          throw derError;
      }
      if (!sig) {
        try {
          sig = Signature.fromBytes(ensureBytes("sig", sg), "compact");
        } catch (error) {
          return false;
        }
      }
    }
    if (!sig)
      return false;
    return sig;
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = ensureBytes("publicKey", publicKey);
    message = validateMsgAndHash(ensureBytes("message", message), prehash);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    const sig = format === void 0 ? tryParsingSig(signature) : Signature.fromBytes(ensureBytes("sig", signature), format);
    if (sig === false)
      return false;
    try {
      const P = Point.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is = Fn.inv(s);
      const u1 = Fn.create(h * is);
      const u2 = Fn.create(r * is);
      const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn.create(R.x);
      return v === r;
    } catch (e3) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash: hash2
  });
}
function _weierstrass_legacy_opts_to_new(c) {
  const CURVE = {
    a: c.a,
    b: c.b,
    p: c.Fp.ORDER,
    n: c.n,
    h: c.h,
    Gx: c.Gx,
    Gy: c.Gy
  };
  const Fp = c.Fp;
  let allowedLengths = c.allowedPrivateKeyLengths ? Array.from(new Set(c.allowedPrivateKeyLengths.map((l) => Math.ceil(l / 2)))) : void 0;
  const Fn = Field(CURVE.n, {
    BITS: c.nBitLength,
    allowedLengths,
    modFromBytes: c.wrapPrivateKey
  });
  const curveOpts = {
    Fp,
    Fn,
    allowInfinityPoint: c.allowInfinityPoint,
    endo: c.endo,
    isTorsionFree: c.isTorsionFree,
    clearCofactor: c.clearCofactor,
    fromBytes: c.fromBytes,
    toBytes: c.toBytes
  };
  return { CURVE, curveOpts };
}
function _ecdsa_legacy_opts_to_new(c) {
  const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
  const ecdsaOpts = {
    hmac: c.hmac,
    randomBytes: c.randomBytes,
    lowS: c.lowS,
    bits2int: c.bits2int,
    bits2int_modN: c.bits2int_modN
  };
  return { CURVE, curveOpts, hash: c.hash, ecdsaOpts };
}
function _ecdsa_new_output_to_legacy(c, _ecdsa) {
  const Point = _ecdsa.Point;
  return Object.assign({}, _ecdsa, {
    ProjectivePoint: Point,
    CURVE: Object.assign({}, c, nLength(Point.Fn.ORDER, Point.Fn.BITS))
  });
}
function weierstrass(c) {
  const { CURVE, curveOpts, hash: hash2, ecdsaOpts } = _ecdsa_legacy_opts_to_new(c);
  const Point = weierstrassN(CURVE, curveOpts);
  const signs = ecdsa(Point, hash2, ecdsaOpts);
  return _ecdsa_new_output_to_legacy(c, signs);
}

// node_modules/@noble/curves/esm/_shortw_utils.js
function createCurve(curveDef, defHash) {
  const create = (hash2) => weierstrass(__spreadProps(__spreadValues({}, curveDef), { hash: hash2 }));
  return __spreadProps(__spreadValues({}, create(defHash)), { create });
}

// node_modules/@noble/curves/esm/nist.js
var p256_CURVE = {
  p: BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"),
  n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"),
  h: BigInt(1),
  a: BigInt("0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc"),
  b: BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"),
  Gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"),
  Gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5")
};
var p384_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff"),
  n: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973"),
  h: BigInt(1),
  a: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc"),
  b: BigInt("0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef"),
  Gx: BigInt("0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"),
  Gy: BigInt("0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f")
};
var p521_CURVE = {
  p: BigInt("0x1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
  n: BigInt("0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409"),
  h: BigInt(1),
  a: BigInt("0x1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc"),
  b: BigInt("0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00"),
  Gx: BigInt("0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66"),
  Gy: BigInt("0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650")
};
var Fp256 = Field(p256_CURVE.p);
var Fp384 = Field(p384_CURVE.p);
var Fp521 = Field(p521_CURVE.p);
var p256 = createCurve(__spreadProps(__spreadValues({}, p256_CURVE), { Fp: Fp256, lowS: false }), sha256);
var p384 = createCurve(__spreadProps(__spreadValues({}, p384_CURVE), { Fp: Fp384, lowS: false }), sha384);
var p521 = createCurve(__spreadProps(__spreadValues({}, p521_CURVE), { Fp: Fp521, lowS: false, allowedPrivateKeyLengths: [130, 131, 132] }), sha512);

// node_modules/@noble/curves/esm/p256.js
var p2562 = p256;

// node_modules/@noble/hashes/esm/sha256.js
var sha2562 = sha256;

// src/game/base64url.ts
var Base64urlError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "Base64urlError");
  }
};
var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function b64urlEncode(bytes) {
  var _a, _b;
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = bytes[i] << 16 | ((_a = bytes[i + 1]) != null ? _a : 0) << 8 | ((_b = bytes[i + 2]) != null ? _b : 0);
    out += B64[n >> 18 & 63] + B64[n >> 12 & 63];
    if (i + 1 < bytes.length) out += B64[n >> 6 & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return out;
}
function b64urlDecode(text) {
  const clean3 = String(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const out = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean3) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new Base64urlError("Encodage base64url invalide.");
    buf = buf << 6 | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push(buf >> bits & 255);
    }
  }
  return new Uint8Array(out);
}

// src/game/webauthn.ts
var PASSKEY_RULES = {
  challengeTtlMs: 5 * 6e4,
  maxPerUser: 10,
  nameMax: 40
};
var PasskeyError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "PasskeyError");
  }
};
function utf8Encode(text) {
  var _a;
  const out = [];
  for (const ch of String(text)) {
    let c = (_a = ch.codePointAt(0)) != null ? _a : 0;
    if (c < 128) out.push(c);
    else if (c < 2048) out.push(192 | c >> 6, 128 | c & 63);
    else if (c < 65536) out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
    else {
      c = Math.min(c, 1114111);
      out.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
    }
  }
  return new Uint8Array(out);
}
function utf8Decode(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let c;
    if (b < 128) {
      c = b;
      i += 1;
    } else if (b < 224) {
      c = (b & 31) << 6 | bytes[i + 1] & 63;
      i += 2;
    } else if (b < 240) {
      c = (b & 15) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
      i += 3;
    } else {
      c = (b & 7) << 18 | (bytes[i + 1] & 63) << 12 | (bytes[i + 2] & 63) << 6 | bytes[i + 3] & 63;
      i += 4;
    }
    out += String.fromCodePoint(c);
  }
  return out;
}
function concat(...parts) {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
function cborDecode(bytes) {
  let pos = 0;
  const need = (n) => {
    if (pos + n > bytes.length) throw new PasskeyError("Donn\xE9es CBOR tronqu\xE9es.");
  };
  const readArg = (info) => {
    if (info < 24) return info;
    if (info === 24) {
      need(1);
      return bytes[pos++];
    }
    if (info === 25) {
      need(2);
      const v = bytes[pos] << 8 | bytes[pos + 1];
      pos += 2;
      return v;
    }
    if (info === 26) {
      need(4);
      const v = bytes[pos] * 2 ** 24 + (bytes[pos + 1] << 16 | bytes[pos + 2] << 8 | bytes[pos + 3]);
      pos += 4;
      return v;
    }
    if (info === 27) {
      need(8);
      let v = 0;
      for (let i = 0; i < 8; i++) v = v * 256 + bytes[pos + i];
      pos += 8;
      return v;
    }
    throw new PasskeyError("Longueur CBOR ind\xE9finie non g\xE9r\xE9e.");
  };
  const item = (depth) => {
    if (depth > 16) throw new PasskeyError("CBOR trop imbriqu\xE9.");
    need(1);
    const head2 = bytes[pos++];
    const major = head2 >> 5;
    const info = head2 & 31;
    switch (major) {
      case 0:
        return readArg(info);
      case 1:
        return -1 - readArg(info);
      case 2: {
        const n = readArg(info);
        need(n);
        const v = bytes.slice(pos, pos + n);
        pos += n;
        return v;
      }
      case 3: {
        const n = readArg(info);
        need(n);
        const v = utf8Decode(bytes.slice(pos, pos + n));
        pos += n;
        return v;
      }
      case 4: {
        const n = readArg(info);
        const arr = [];
        for (let i = 0; i < n; i++) arr.push(item(depth + 1));
        return arr;
      }
      case 5: {
        const n = readArg(info);
        const map = /* @__PURE__ */ new Map();
        for (let i = 0; i < n; i++) {
          const k = item(depth + 1);
          map.set(k, item(depth + 1));
        }
        return map;
      }
      case 6:
        readArg(info);
        return item(depth + 1);
      case 7:
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22) return null;
        if (info === 23) return void 0;
        throw new PasskeyError("Valeur CBOR non g\xE9r\xE9e.");
      default:
        throw new PasskeyError("Type CBOR inconnu.");
    }
  };
  const value = item(0);
  return { value, length: pos };
}
function parseAuthData(data) {
  if (data.length < 37) throw new PasskeyError("Donn\xE9es d'authentification trop courtes.");
  const flags = data[32];
  const out = {
    rpIdHash: data.slice(0, 32),
    userPresent: (flags & 1) !== 0,
    userVerified: (flags & 4) !== 0,
    signCount: (data[33] << 24 >>> 0) + (data[34] << 16 | data[35] << 8 | data[36])
  };
  if (flags & 64) {
    if (data.length < 55) throw new PasskeyError("Cl\xE9 de la passkey absente.");
    const idLen = data[53] << 8 | data[54];
    if (data.length < 55 + idLen) throw new PasskeyError("Identifiant de la passkey tronqu\xE9.");
    out.credentialId = data.slice(55, 55 + idLen);
    const rest = data.slice(55 + idLen);
    const { length } = cborDecode(rest);
    out.publicKey = rest.slice(0, length);
  }
  return out;
}
var COSE_ES256 = -7;
var COSE_RS256 = -257;
function parseCoseKey(bytes) {
  const { value } = cborDecode(bytes);
  if (!(value instanceof Map)) throw new PasskeyError("Cl\xE9 publique illisible.");
  const kty = value.get(1);
  const alg = Number(value.get(3));
  if (kty === 2 && alg === COSE_ES256 && value.get(-1) === 1) {
    const x = value.get(-2);
    const y = value.get(-3);
    if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) throw new PasskeyError("Cl\xE9 P-256 invalide.");
    return { alg, x, y };
  }
  if (kty === 3 && alg === COSE_RS256) {
    const n = value.get(-1);
    const e3 = value.get(-2);
    if (!(n instanceof Uint8Array) || !(e3 instanceof Uint8Array) || n.length < 256) throw new PasskeyError("Cl\xE9 RSA invalide.");
    return { alg, n, e: e3 };
  }
  throw new PasskeyError("Type de passkey non pris en charge (ES256 ou RS256 attendu).");
}
function toBigInt(bytes) {
  let v = BigInt(0);
  for (const b of bytes) v = v << BigInt(8) | BigInt(b);
  return v;
}
function modPow(base, exp, mod2) {
  let result = BigInt(1);
  let b = base % mod2;
  let e3 = exp;
  const zero = BigInt(0);
  const one = BigInt(1);
  while (e3 > zero) {
    if (e3 & one) result = result * b % mod2;
    b = b * b % mod2;
    e3 >>= one;
  }
  return result;
}
var SHA256_PREFIX = [48, 49, 48, 13, 6, 9, 96, 134, 72, 1, 101, 3, 4, 2, 1, 5, 0, 4, 32];
function verifyRs256(key, message, signature) {
  const n = toBigInt(key.n);
  const k = key.n.length;
  if (signature.length !== k) return false;
  const s = toBigInt(signature);
  if (s >= n) return false;
  let m = modPow(s, toBigInt(key.e), n);
  const em = new Uint8Array(k);
  for (let i = k - 1; i >= 0; i--) {
    em[i] = Number(m & BigInt(255));
    m >>= BigInt(8);
  }
  const digest = sha2562(message);
  const tLen = SHA256_PREFIX.length + digest.length;
  const expected = new Uint8Array(k);
  expected[0] = 0;
  expected[1] = 1;
  for (let i = 2; i < k - tLen - 1; i++) expected[i] = 255;
  expected[k - tLen - 1] = 0;
  expected.set(SHA256_PREFIX, k - tLen);
  expected.set(digest, k - digest.length);
  return sameBytes(em, expected);
}
function verifySignature(coseKey, message, signature) {
  const key = parseCoseKey(coseKey);
  if (key.alg === COSE_ES256) {
    const point = concat(new Uint8Array([4]), key.x, key.y);
    try {
      return p2562.verify(signature, sha2562(message), point, { format: "der", lowS: false });
    } catch (e3) {
      return false;
    }
  }
  return verifyRs256(key, message, signature);
}
function readClientData(b64) {
  const raw = b64urlDecode(b64);
  let data;
  try {
    data = JSON.parse(utf8Decode(raw));
  } catch (e3) {
    throw new PasskeyError("R\xE9ponse du navigateur illisible.");
  }
  return { raw, data };
}
function clientChallenge(clientDataJSON) {
  var _a;
  return String((_a = readClientData(clientDataJSON).data.challenge) != null ? _a : "");
}
function checkClientData(data, type, ctx) {
  if (data.type !== type) throw new PasskeyError("Type de r\xE9ponse inattendu.");
  if (data.challenge !== ctx.challenge) throw new PasskeyError("D\xE9fi expir\xE9 ou invalide : r\xE9essaie.");
  if (!ctx.origins.includes(data.origin)) throw new PasskeyError(`Origine non autoris\xE9e (${data.origin}).`);
}
function checkAuthData(auth, ctx) {
  if (!sameBytes(auth.rpIdHash, sha2562(utf8Encode(ctx.rpId)))) throw new PasskeyError("Passkey cr\xE9\xE9e pour un autre site.");
  if (!auth.userPresent) throw new PasskeyError("Pr\xE9sence de l'utilisateur non confirm\xE9e.");
}
function verifyRegistration(input, ctx) {
  const { data } = readClientData(input.clientDataJSON);
  checkClientData(data, "webauthn.create", ctx);
  const { value } = cborDecode(b64urlDecode(input.attestationObject));
  if (!(value instanceof Map)) throw new PasskeyError("Attestation illisible.");
  const authBytes = value.get("authData");
  if (!(authBytes instanceof Uint8Array)) throw new PasskeyError("Attestation sans donn\xE9es.");
  const auth = parseAuthData(authBytes);
  checkAuthData(auth, ctx);
  if (!auth.credentialId || !auth.publicKey) throw new PasskeyError("La passkey n'a pas fourni sa cl\xE9.");
  const key = parseCoseKey(auth.publicKey);
  return { credentialId: b64urlEncode(auth.credentialId), publicKey: b64urlEncode(auth.publicKey), alg: key.alg, signCount: auth.signCount, userVerified: auth.userVerified };
}
function verifyAssertion(input, ctx, publicKey, storedCount) {
  const { raw, data } = readClientData(input.clientDataJSON);
  checkClientData(data, "webauthn.get", ctx);
  const authBytes = b64urlDecode(input.authenticatorData);
  const auth = parseAuthData(authBytes);
  checkAuthData(auth, ctx);
  const signed = concat(authBytes, sha2562(raw));
  if (!verifySignature(b64urlDecode(publicKey), signed, b64urlDecode(input.signature))) throw new PasskeyError("Signature de la passkey invalide.");
  if (auth.signCount > 0 || storedCount > 0) {
    if (auth.signCount <= storedCount) throw new PasskeyError("Passkey refus\xE9e (compteur incoh\xE9rent).");
  }
  return { signCount: auth.signCount, userVerified: auth.userVerified };
}
function cleanPasskeyName(raw) {
  const name = String(raw != null ? raw : "").replace(/\s+/g, " ").trim().slice(0, PASSKEY_RULES.nameMax);
  return name || "Passkey";
}
function challengeFromBytes(bytes) {
  if (bytes.length < 16) throw new PasskeyError("D\xE9fi trop court.");
  return b64urlEncode(bytes);
}

// src/server/hooksEntry.ts
function flushPlayer(player, queues, now) {
  return flushState(__spreadProps(__spreadValues({}, player), { buildings: withMissingBuildings(player.buildings, player.resources) }), queues, now);
}
function tutorialRaidPower(player) {
  var _a, _b;
  return Math.max(TUTORIAL_RAID.minPower, Math.round(homeDefensePower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {}) * TUTORIAL_RAID.powerPct));
}
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/utils.js:
@noble/curves/esm/abstract/modular.js:
@noble/curves/esm/abstract/curve.js:
@noble/curves/esm/abstract/weierstrass.js:
@noble/curves/esm/_shortw_utils.js:
@noble/curves/esm/nist.js:
@noble/curves/esm/p256.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
