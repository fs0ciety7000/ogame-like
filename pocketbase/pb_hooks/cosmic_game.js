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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/hooksEntry.ts
var hooksEntry_exports = {};
__export(hooksEntry_exports, {
  ALLIANCE_BOSS_RULES: () => ALLIANCE_BOSS_RULES,
  ALLIANCE_RULES: () => ALLIANCE_RULES,
  ANOMALY_RULES: () => ANOMALY_RULES,
  AUTO_ERROR_RULES: () => AUTO_ERROR_RULES,
  AUTO_REPORTER_ID: () => AUTO_REPORTER_ID,
  CHALLENGE_KEY: () => CHALLENGE_KEY,
  CHALLENGE_RULES: () => CHALLENGE_RULES,
  CHALLENGE_TYPES: () => CHALLENGE_TYPES,
  COALITION_RULES: () => COALITION_RULES,
  CODEX_TITLE: () => CODEX_TITLE,
  COMMANDER_XP: () => COMMANDER_XP,
  CONTENT_SECTIONS: () => CONTENT_SECTIONS,
  DEFAULT_STAFF_BY_PSEUDO: () => DEFAULT_STAFF_BY_PSEUDO,
  DIPLOMACY_RULES: () => DIPLOMACY_RULES,
  ELITE_KEY: () => ELITE_KEY,
  ELITE_RULES: () => ELITE_RULES,
  EXPEDITION_RULES: () => EXPEDITION_RULES,
  FACTIONS: () => FACTIONS,
  GAME_FIELDS: () => GAME_FIELDS,
  GAZETTE_KEY: () => GAZETTE_KEY,
  GameActionError: () => GameActionError,
  LEVIATHAN_KEY: () => LEVIATHAN_KEY,
  LEVIATHAN_RULES: () => LEVIATHAN_RULES,
  MAINTENANCE_KEY: () => MAINTENANCE_KEY,
  MARKET_RULES: () => MARKET_RULES,
  MESSAGE_RULES: () => MESSAGE_RULES,
  PASS_POINTS: () => PASS_POINTS,
  PIRATE_OWNER_UID: () => PIRATE_OWNER_UID,
  PIRATE_RULES: () => PIRATE_RULES,
  PVP_RULES: () => PVP_RULES,
  QUEUE_FIELDS: () => QUEUE_FIELDS,
  REFERRAL_RULES: () => REFERRAL_RULES,
  SEASON_BOSS_KEY: () => SEASON_BOSS_KEY,
  SEASON_BOSS_RULES: () => SEASON_BOSS_RULES,
  SEASON_RULES: () => SEASON_RULES,
  STAFF_KEY: () => STAFF_KEY,
  TUTORIAL_RAID: () => TUTORIAL_RAID,
  VACATION_RULES: () => VACATION_RULES,
  WARLORD_RULES: () => WARLORD_RULES,
  WAR_RULES: () => WAR_RULES,
  acceptOffer: () => acceptOffer,
  activeUltimatum: () => activeUltimatum,
  activeVendetta: () => activeVendetta,
  activeWarBetween: () => activeWarBetween,
  addContribution: () => addContribution,
  addOccurrence: () => addOccurrence,
  addPassPoints: () => addPassPoints,
  addRelic: () => addRelic,
  addReportComment: () => addReportComment,
  allianceBossDef: () => allianceBossDef,
  allianceBossRefund: () => allianceBossRefund,
  allianceNextDueMs: () => allianceNextDueMs,
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
  beaconReturn: () => beaconReturn,
  bindingPactBetween: () => bindingPactBetween,
  bossMonthOf: () => bossMonthOf,
  bountyIdOf: () => bountyIdOf,
  breakPact: () => breakPact,
  buyShopItem: () => buyShopItem,
  callAllianceBoss: () => callAllianceBoss,
  canMessage: () => canMessage,
  challengeMetrics: () => challengeMetrics,
  challengeRanking: () => challengeRanking,
  challengeRewardees: () => challengeRewardees,
  challengeTier: () => challengeTier,
  checkAllianceBossLaunch: () => checkAllianceBossLaunch,
  checkCoalitionTrigger: () => checkCoalitionTrigger,
  checkEliteLaunch: () => checkEliteLaunch,
  checkLeviathanLaunch: () => checkLeviathanLaunch,
  checkSeasonBossLaunch: () => checkSeasonBossLaunch,
  chronicleMonthId: () => chronicleMonthId,
  chroniclesConfig: () => chroniclesConfig,
  clearDecoy: () => clearDecoy,
  closeElite: () => closeElite,
  closeLeviathan: () => closeLeviathan,
  coalitionRanking: () => coalitionRanking,
  codexEntries: () => codexEntries,
  codexProgress: () => codexProgress,
  collectDebris: () => collectDebris,
  colonyOwnerUid: () => colonyOwnerUid,
  compileGazette: () => compileGazette,
  completeFleetReturn: () => completeFleetReturn,
  computeGameStats: () => computeGameStats,
  concludeWar: () => concludeWar,
  consumeBeacon: () => consumeBeacon,
  consumeJammer: () => consumeJammer,
  createOffer: () => createOffer,
  currentSeasonId: () => currentSeasonId,
  debrisTotal: () => debrisTotal,
  declareWar: () => declareWar,
  defaultQueues: () => defaultQueues,
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
  errorKey: () => errorKey,
  errorQuotaKey: () => errorQuotaKey,
  exchangeAmber: () => exchangeAmber,
  expeditionRelicChance: () => expeditionRelicChance,
  extendUltimatums: () => extendUltimatums,
  factionOfLair: () => factionOfLair,
  findFaction: () => findFaction,
  findWarlord: () => findWarlord,
  finishAllianceResearch: () => finishAllianceResearch,
  finishExpedition: () => finishExpedition,
  flushPlayer: () => flushPlayer,
  formatInt: () => formatInt,
  foughtWarlords: () => foughtWarlords,
  gazetteDue: () => gazetteDue,
  gazetteState: () => gazetteState,
  githubIssueBody: () => githubIssueBody,
  grantAllianceBossReward: () => grantAllianceBossReward,
  grantChallengeReward: () => grantChallengeReward,
  grantCoalitionReward: () => grantCoalitionReward,
  grantCodexTitle: () => grantCodexTitle,
  grantCommanderXp: () => grantCommanderXp,
  grantEliteReward: () => grantEliteReward,
  grantLeviathanReward: () => grantLeviathanReward,
  grantReferral: () => grantReferral,
  grantSeasonBossReward: () => grantSeasonBossReward,
  growWarlord: () => growWarlord,
  inVendetta: () => inVendetta,
  isFormation: () => isFormation,
  isLeviathanWeek: () => isLeviathanWeek,
  isStaffRole: () => isStaffRole,
  isWarlordUid: () => isWarlordUid,
  leviathanRanking: () => leviathanRanking,
  leviathanWindow: () => leviathanWindow,
  linkReferrer: () => linkReferrer,
  lossesPower: () => lossesPower,
  maintenanceShouldAutoEnd: () => maintenanceShouldAutoEnd,
  mergeDebris: () => mergeDebris,
  nearestWarlord: () => nearestWarlord,
  newPlayerProfile: () => newPlayerProfile,
  nextAttackDelayMs: () => nextAttackDelayMs,
  nextMaintenance: () => nextMaintenance,
  nextMarketDelayMs: () => nextMarketDelayMs,
  normalizeAllianceBoss: () => normalizeAllianceBoss,
  normalizeChallengeState: () => normalizeChallengeState,
  normalizeElite: () => normalizeElite,
  normalizeLeviathan: () => normalizeLeviathan,
  normalizeMaintenance: () => normalizeMaintenance,
  normalizeStaff: () => normalizeStaff,
  onVacation: () => onVacation,
  openVendetta: () => openVendetta,
  pactOpen: () => pactOpen,
  parseResetOptions: () => parseResetOptions,
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
  previousSeasonId: () => previousSeasonId,
  productionHours: () => productionHours,
  proposePact: () => proposePact,
  publicShowcase: () => publicShowcase,
  publishGazette: () => publishGazette,
  readCoalitions: () => readCoalitions,
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
  sanitizeClientError: () => sanitizeClientError,
  sanitizeMessageText: () => sanitizeMessageText,
  sanitizeNewReport: () => sanitizeNewReport,
  sanitizePactMessage: () => sanitizePactMessage,
  scoreBattle: () => scoreBattle,
  seasonBossWindow: () => seasonBossWindow,
  seasonRewardFor: () => seasonRewardFor,
  seasonStandings: () => seasonStandings,
  seasonXpFor: () => seasonXpFor,
  settleCoalition: () => settleCoalition,
  settleVendettas: () => settleVendettas,
  shatterWarlord: () => shatterWarlord,
  spawnElite: () => spawnElite,
  spawnLeviathan: () => spawnLeviathan,
  spawnSeasonBoss: () => spawnSeasonBoss,
  startChallenge: () => startChallenge,
  startVacation: () => startVacation,
  stationGarrison: () => stationGarrison,
  surrender: () => surrender,
  tutorialRaidPower: () => tutorialRaidPower,
  unitsAwayOf: () => unitsAwayOf,
  utcDayStart: () => utcDayStart,
  vendettaTitle: () => vendettaTitle,
  vendettaWinners: () => vendettaWinners,
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
  counter_spy: 1
};
var TECH_REDUCTION_CAP = 0.75;
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
    for (const e of techEffects(tech)) {
      if (e.type !== type && !(type === "unlock_buildings" && e.type === "unlock_hangars")) continue;
      if (target !== void 0 && e.target !== target) continue;
      total2 += level3 * effectValuePerLevel(e);
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
  for (const e of tech ? techEffects(tech) : []) if (e.type === "unlock_buildings" || e.type === "unlock_hangars") for (const id of (_a = e.targets) != null ? _a : []) ids.add(id);
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
  for (const [res, amount2] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(amount2 * factor);
  }
  return cost;
}
function getTechTime(tech, level3) {
  return Math.floor(tech.baseTime * Math.pow(TIME_GROWTH, level3 - 1));
}
function checkPrereqs(tech, levels) {
  const entries = Object.entries(tech.prereq);
  if (entries.length === 0) return { valid: true, list: [] };
  let allValid = true;
  const list = entries.map(([reqId, reqLevel]) => {
    var _a, _b;
    const current2 = (_a = levels[reqId]) != null ? _a : 0;
    const valide = current2 >= reqLevel;
    if (!valide) allValid = false;
    const reqTech = findTech(reqId);
    return { id: reqId, nom: (_b = reqTech == null ? void 0 : reqTech.nom) != null ? _b : reqId, requis: reqLevel, actuel: current2, valide };
  });
  return { valid: allValid, list };
}

// src/game/units.ts
var KESH_HUNTER_UNIT = {
  id: "traqueur_kesh",
  name: "Traqueur Kesh",
  image: "/assets/units/traqueur_kesh.webp",
  maxLevel: 1,
  description: "Chasseur organique des Kesh'Vaar, coque de chitine ambr\xE9e. Rapide, et redoutable contre les factions et les cibles des primes (+50 % d'attaque contre les PNJ).",
  cost: { scrap: 6e3, energy: 3e3 },
  stats: { attaque: 420, defense: 90, vitesse: 12, cargo: 20 },
  category: "attack",
  unlockTech: "",
  hangarSpace: 25,
  blueprint: true
};
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
    hangarSpace: 20
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
    hangarSpace: 200,
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
    hangarSpace: 8,
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
    cost: { scrap: 2e3, energy: 1200 },
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
    cost: { scrap: 2500, energy: 1500 },
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
    hangarSpace: 20
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
  for (const u of defs) {
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
    const items = entries.map(([resource, amount2]) => {
      var _a2, _b;
      return { resource, amount: amount2, label: (_b = (_a2 = RESOURCE_LIST.find((r) => r.id === resource)) == null ? void 0 : _a2.name) != null ? _b : resource };
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
function getUnitCapacity(buildings, category) {
  var _a, _b, _c;
  let capacity = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "hangar" || b.effect.category !== category) continue;
    capacity += ((_c = (_b = buildings[b.id]) == null ? void 0 : _b.level) != null ? _c : 0) * b.effect.perLevel;
  }
  return capacity;
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
      const amount2 = Math.floor(Math.max(0, (_m = defenderResources[res]) != null ? _m : 0) * pct5);
      wanted[res] = amount2;
      total2 += amount2;
    }
    const ratio = total2 > cargoCapacity ? cargoCapacity / total2 : 1;
    loot = {};
    const entries = Object.entries(wanted);
    for (const [res, amount2] of entries) loot[res] = Math.floor(amount2 * ratio);
    let left = Math.min(total2, Math.floor(cargoCapacity)) - entries.reduce((s, [res]) => {
      var _a2;
      return s + ((_a2 = loot[res]) != null ? _a2 : 0);
    }, 0);
    const byRemainder = entries.map(([res, amount2]) => ({ res, frac: amount2 * ratio - Math.floor(amount2 * ratio) })).sort((a, b) => b.frac - a.frac);
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
  }).filter((e) => e !== null);
}
function eventAt(now) {
  const scheduled = scheduledEvents().find((e) => e.startMs <= now && now < e.endMs);
  if (scheduled) return scheduled;
  const rotation = rotationEvent(weekendWindow(now));
  return rotation && rotation.startMs <= now && now < rotation.endMs ? rotation : null;
}
function eventBoundaries(from, to) {
  const points = /* @__PURE__ */ new Set();
  for (const e of scheduledEvents()) {
    if (e.startMs > from && e.startMs < to) points.add(e.startMs);
    if (e.endMs > from && e.endMs < to) points.add(e.endMs);
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

// src/game/commanders.ts
var COMMANDERS = [
  {
    id: "admiral",
    name: "Rhys Calder",
    title: "Amiral",
    portrait: "/assets/commanders/admiral.webp",
    domain: "Combats gagn\xE9s en attaque, repaires, primes, L\xE9viathan.",
    bonus: (l) => `+${l} % d'attaque de la flotte`
  },
  {
    id: "strategist",
    name: "Ilsa Varga",
    title: "Strat\xE8ge",
    portrait: "/assets/commanders/strategist.webp",
    domain: "Attaques et raids repouss\xE9s.",
    bonus: (l) => `+${l} % de d\xE9fense de la base`
  },
  {
    id: "engineer",
    name: "Noor Halim",
    title: "Ing\xE9nieure",
    portrait: "/assets/commanders/engineer.webp",
    domain: "Constructions et recherches termin\xE9es.",
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
    domain: "Missions, contrats du jour, \xE9changes au march\xE9.",
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
function grantCommanderXp(player, id, amount2) {
  var _a, _b;
  if (!(amount2 > 0)) return;
  const st = commandersState(player);
  if (!st.active.includes(id) || !st.roster[id]) return;
  st.roster[id] = { xp: ((_b = (_a = st.roster[id]) == null ? void 0 : _a.xp) != null ? _b : 0) + amount2 };
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
  const cooldown = COMMANDER_RULES.swapCooldownHours * 36e5;
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
var RESOURCE_IDS = new Set(RESOURCE_LIST.map((r) => r.id));
function findAllianceResearch(id) {
  return ALLIANCE_RULES.researches.find((r) => r.id === id);
}
function allianceRole(alliance, uid) {
  var _a, _b;
  if (!((_a = alliance.members) == null ? void 0 : _a.includes(uid))) return null;
  if (alliance.createdBy === uid) return "founder";
  return ((_b = alliance.roles) == null ? void 0 : _b[uid]) === "officer" ? "officer" : "member";
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
  var _a;
  if (allianceRole(alliance, actorUid) !== "founder") throw new GameActionError("Seul le fondateur g\xE8re les officiers.");
  if (!alliance.members.includes(targetUid) || targetUid === alliance.createdBy) throw new GameActionError("Ce joueur ne peut pas changer de r\xF4le.");
  const roles = __spreadValues({}, (_a = alliance.roles) != null ? _a : {});
  if (officer) roles[targetUid] = "officer";
  else delete roles[targetUid];
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
  for (const [res, amount2] of Object.entries(amounts)) {
    if (((_b = player.resources[res]) != null ? _b : 0) < amount2) throw new GameActionError("Ressources insuffisantes pour ce d\xE9p\xF4t.");
  }
  for (const [res, amount2] of Object.entries(amounts)) {
    player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) - amount2;
    treasury[res] = ((_d = treasury[res]) != null ? _d : 0) + amount2;
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
  for (const [res, amount2] of Object.entries(amounts)) {
    const max = Math.floor(((_c = treasury[res]) != null ? _c : 0) * ALLIANCE_RULES.distributionMaxPct);
    if (amount2 > max) {
      throw new GameActionError(`Un versement est limit\xE9 \xE0 ${Math.round(ALLIANCE_RULES.distributionMaxPct * 100)} % du stock du tr\xE9sor (${max} pour cette ressource).`);
    }
  }
  for (const [res, amount2] of Object.entries(amounts)) treasury[res] = ((_d = treasury[res]) != null ? _d : 0) - amount2;
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
  for (const [res, amount2] of Object.entries(cost)) {
    if (((_b = treasury[res]) != null ? _b : 0) < amount2) throw new GameActionError("Le tr\xE9sor ne suffit pas pour cette recherche.");
  }
  for (const [res, amount2] of Object.entries(cost)) treasury[res] = ((_c = treasury[res]) != null ? _c : 0) - amount2;
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
  if (source === "treasury" && role === "member") throw new GameActionError("Seuls le fondateur et les officiers puisent dans le tr\xE9sor.");
  const state = projectState(alliance, def3.id);
  if (state.buildEndMs > 0) throw new GameActionError("Ce palier est d\xE9j\xE0 en construction.");
  const next = state.level + 1;
  if (next > def3.maxLevel) throw new GameActionError("Ce projet est achev\xE9.");
  const cost = allianceProjectCost(next);
  const pool = source === "treasury" ? __spreadValues({}, (_a = alliance.treasury) != null ? _a : {}) : actor.resources;
  const used = {};
  for (const [res, amount2] of Object.entries(amounts)) {
    const missing = Math.max(0, ((_b = cost[res]) != null ? _b : 0) - ((_c = state.funded[res]) != null ? _c : 0));
    const n = Math.min(amount2, missing);
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
  var _a, _b, _c, _d, _e, _f, _g;
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
      for (const [res, amount2] of Object.entries(amounts)) target.resources[res] = ((_e = target.resources[res]) != null ? _e : 0) + amount2;
      out.notifications[target.uid] = [note("Versement du tr\xE9sor", `${actor.pseudo} t'a vers\xE9 des ressources du tr\xE9sor de l'alliance.`, now)];
      log({ kind: "distribute", targetUid: target.uid, targetPseudo: target.pseudo, resources: amounts });
      return out;
    }
    case "research": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const started = startAllianceResearch(alliance, actor.uid, String((_f = action.researchId) != null ? _f : ""), now);
      out.alliance = started;
      const def3 = findAllianceResearch(started.activeResearch.id);
      log({ kind: "research", text: `${def3.name} niveau ${started.activeResearch.level}`, resources: allianceResearchCost(started.activeResearch.level) });
      return out;
    }
    case "project": {
      if (!alliance) throw new GameActionError("Alliance introuvable.");
      const source = action.source === "treasury" ? "treasury" : "self";
      const res = fundAllianceProject(alliance, actor, String((_g = action.projectId) != null ? _g : ""), source, parseAmounts(action.resources), now);
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
    const label2 = `${(_a = def3 == null ? void 0 : def3.name) != null ? _a : done.completed.id} niveau ${done.completed.level}`;
    labels.push(`${(_b = def3 == null ? void 0 : def3.emoji) != null ? _b : ""} ${label2}`.trim());
    logs.push({ kind: "research-done", actorUid: "", actorPseudo: "", text: label2, createdAtMs: now });
  }
  for (const c of built.completed) {
    const def3 = findAllianceProject(c.id);
    const label2 = `${(_c = def3 == null ? void 0 : def3.name) != null ? _c : c.id} niveau ${c.level}`;
    labels.push(`${(_d = def3 == null ? void 0 : def3.emoji) != null ? _d : ""} ${label2}`.trim());
    logs.push({ kind: "project-done", actorUid: "", actorPseudo: "", text: label2, createdAtMs: now });
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
  { id: "legendary", label: "L\xE9gendaire", pct: 0.15, weight: 2, recycle: 100, color: "#ffd86b" }
];
var RELICS = [
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
  { id: "egide_reine", name: "\xC9gide de la Reine", effect: "aegis", lore: "Chaque semaine, la premi\xE8re d\xE9faite n'est pas pill\xE9e.", legendaryOnly: true }
];
var RELIC_RULES = {
  slots: 3,
  /** Emplacement supplémentaire à partir de cette ascension. */
  extraSlotAscensions: 1,
  maxItems: 30,
  fuseCount: 3,
  /** Expédition : 5 % à 2 h, jusqu'à 15 % à 8 h. */
  expeditionBase: 0.05,
  expeditionPerHour: 0.1 / 6
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
  const pool = RARITIES.filter((r) => order.indexOf(r.id) >= order.indexOf(minRarity));
  const total2 = pool.reduce((a, r) => a + r.weight, 0);
  let pick = random() * total2;
  let rarity = pool[pool.length - 1].id;
  for (const r of pool) {
    pick -= r.weight;
    if (pick < 0) {
      rarity = r.id;
      break;
    }
  }
  const templates = RELICS.filter((t) => !t.legendaryOnly || rarity === "legendary");
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
function expeditionRelicChance(hours2) {
  return Math.min(0.15, RELIC_RULES.expeditionBase + Math.max(0, hours2 - 2) * RELIC_RULES.expeditionPerHour);
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
  if (idx < 0 || idx >= order.length - 1) throw new GameActionError("Ces reliques ne peuvent plus fusionner.");
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

// src/game/modifiers.ts
function emptyModifiers() {
  return { attack: 0, defense: 0, buildTime: 0, researchTime: 0, productionAll: 0, production: {}, storage: 0, spyLevel: 0, detection: 0, repair: 0, cargo: 0 };
}
function playerModifiers(player) {
  var _a, _b;
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
    else if (effect && PRODUCTION_EFFECT[effect]) {
      const res = PRODUCTION_EFFECT[effect];
      m.production[res] = ((_b = m.production[res]) != null ? _b : 0) + b;
    }
  }
  m.buildTime = Math.min(0.5, m.buildTime);
  m.researchTime = Math.min(0.5, m.researchTime);
  return m;
}
function withRepairBonus(base, player) {
  return Math.min(0.95, base + playerModifiers(player).repair);
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

// src/game/bonuses.ts
function playerBuildTimeFactor(player, now) {
  return buildTimeFactor(now) * techReductionFactor(player.techLevels, "building_time") * allianceForgeFactor(player.allianceResearch) * ascensionBuildTimeFactor(player) * (1 - playerModifiers(player).buildTime);
}
function playerResearchTimeFactor(player, now) {
  return researchTimeFactor(now) * techReductionFactor(player.techLevels, "research_time") * allianceForgeFactor(player.allianceResearch) * (1 - playerModifiers(player).researchTime);
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
  return BUILDINGS.filter((b) => !b.endgame).reduce((a, b) => {
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
  if (homeLevels(player) < next.levels) throw new GameActionError(`Il faut ${next.levels} niveaux de b\xE2timents cumul\xE9s sur ta plan\xE8te m\xE8re, hors b\xE2timents de fin de partie (tu en as ${homeLevels(player)}).`);
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
  for (const id of colonyBuildingIds()) buildings[id] = { level: 1, unlocked: true };
  const resources = emptyResources();
  for (const res of COMMON_RESOURCES2) resources[res] = COLONY_RULES.startStock;
  return { id: colonyId(uid, job.slot), slot: job.slot, name: job.name, foundedAtMs: at, buildings, resources, updatedAtMs: at, building: null, defenses: {}, defenseJob: null };
}
function economyInput(colony, player) {
  return {
    buildings: colony.buildings,
    techLevels: player.techLevels,
    resources: colony.resources,
    units: colony.defenses,
    allianceResearch: player.allianceResearch,
    ascensions: player.ascensions
  };
}
function advanceColony(colony, player, now) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  const notes = [];
  let at = colony.updatedAtMs || now;
  for (let guard = 0; guard < 10; guard++) {
    const next = Math.min((_b = (_a = colony.building) == null ? void 0 : _a.endTime) != null ? _b : Infinity, (_d = (_c = colony.defenseJob) == null ? void 0 : _c.endTime) != null ? _d : Infinity);
    const until = Math.min(next, now);
    if (until > at) {
      colony.resources = advanceResources(economyInput(colony, player), (until - at) / 1e3, at);
      at = until;
    }
    if (next > now) break;
    if (colony.building && colony.building.endTime <= now) {
      const job = colony.building;
      colony.buildings[job.id] = __spreadProps(__spreadValues({}, (_e = colony.buildings[job.id]) != null ? _e : { unlocked: true }), { level: job.level });
      colony.building = null;
      notes.push({ kind: "building", title: "Colonie : construction termin\xE9e", message: `${colony.name} : ${(_g = (_f = findBuilding(job.id)) == null ? void 0 : _f.name) != null ? _g : job.id} niveau ${job.level}.`, createdAtMs: now, read: false });
    }
    if (colony.defenseJob && colony.defenseJob.endTime <= now) {
      const job = colony.defenseJob;
      const cur = (_j = colony.defenses[job.unitId]) != null ? _j : { level: (_i = (_h = player.units[job.unitId]) == null ? void 0 : _h.level) != null ? _i : 1, count: 0 };
      colony.defenses[job.unitId] = { level: Math.max(cur.level, (_l = (_k = player.units[job.unitId]) == null ? void 0 : _k.level) != null ? _l : 1), count: cur.count + job.qty };
      colony.defenseJob = null;
      notes.push({ kind: "building", title: "Colonie : d\xE9fenses pr\xEAtes", message: `${colony.name} : ${formatInt(job.qty)} ${(_n = (_m = findUnit(job.unitId)) == null ? void 0 : _m.name) != null ? _n : job.unitId}.`, createdAtMs: now, read: false });
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
  var _a, _b;
  const def3 = findBuilding(buildingId);
  if (!def3) return {};
  const base = applyBuildingDiscount(getBuildingUpgradeCost(def3, nextLevel), (_b = (_a = player.bonuses) == null ? void 0 : _a.buildingUpgradeDiscount) != null ? _b : 0);
  return Object.fromEntries(Object.entries(base).map(([r, n]) => [r, Math.ceil((n != null ? n : 0) * COLONY_RULES.costFactor)]));
}
function colonyUpgradeSeconds(player, buildingId, nextLevel, now) {
  const def3 = findBuilding(buildingId);
  return def3 ? Math.round(getBuildingUpgradeTime(def3, nextLevel) * playerBuildTimeFactor(player, now)) : 0;
}
function upgradeColonyBuilding(player, colonyIdIn, buildingId, now) {
  var _a, _b;
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  if (!colonyBuildingIds().includes(buildingId)) throw new GameActionError("Ce b\xE2timent ne se construit pas sur une colonie.");
  if (colony.building) throw new GameActionError("Une construction est d\xE9j\xE0 en cours sur cette colonie.");
  const level3 = (_b = (_a = colony.buildings[buildingId]) == null ? void 0 : _a.level) != null ? _b : 0;
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
    lair: { name: "Repaire de Varan", raidsNeeded: 5, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Fl\xE9au de la Confr\xE9rie" }
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
    lair: { name: "Chambre des Contrats", raidsNeeded: 4, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Chasseur de chasseurs" }
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
    lair: { name: "Le Scriptorium Orbital", raidsNeeded: 5, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "H\xE9r\xE9tique" }
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
    lair: { name: "Le Casino Fant\xF4me", raidsNeeded: 5, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Briseur de Cartel" }
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
    lair: { name: "La Tani\xE8re du Rift", raidsNeeded: 4, pct: 1.5, rewardHours: 24, rare: 300, xp: 100, title: "Dompteur de la Meute" }
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
    lair: { name: "La Cath\xE9drale du Silence", raidsNeeded: 5, pct: 1.5, rewardHours: 36, rare: 1500, xp: 150, title: "Voix du Ch\u0153ur bris\xE9" }
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
var PIRATE_RULES = { enabled: true };
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
function raidPower(faction, player, notoriety) {
  const levels = BUILDINGS.reduce((sum3, b) => sum3 + effectiveBuildingLevel(player.buildings, b.id), 0);
  const floor = faction.raid.floorPower + faction.raid.floorPerBuildingLevel * levels;
  const pct5 = faction.raid.basePct + faction.raid.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, targetPower(faction, player) * pct5));
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
  const power = raidPower(faction, player, st.notoriety);
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
    for (const [res, amount2] of Object.entries(tribute)) {
      if (((_a = player.resources[res]) != null ? _a : 0) < amount2) throw new GameActionError("Tu n'as pas de quoi payer : refuse, ou trouve les ressources \xE0 temps.");
    }
    for (const [res, amount2] of Object.entries(tribute)) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) - amount2;
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
    defenderPowerFactor: 1 + playerModifiers(player).defense
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
      const exposed = Math.max(0, ((_e = player.resources[res]) != null ? _e : 0) - protectedAmount(player.buildings, res, player.techLevels, player.allianceResearch));
      const taken = Math.floor(exposed * faction.raid.lootPct);
      if (taken > 0) {
        loot[res] = taken;
        player.resources[res] = ((_f = player.resources[res]) != null ? _f : 0) - taken;
      }
    }
    st.raidsLost += 1;
    st.notoriety = Math.max(0, st.notoriety - 1);
    player.lastDefeatAtMs = now;
    notifications.push(note2("combat-defender", `Victoire de ${faction.name}`, `${faction.enforcer} a eu le dessus et emport\xE9 ${formatInt(total(loot))} ressources.`, now));
  } else {
    bounty = productionHours(player, faction.bounty.hours);
    for (const r of RARE) if (faction.bounty.rare > 0) bounty[r] = ((_g = bounty[r]) != null ? _g : 0) + faction.bounty.rare;
    for (const [res, amount2] of Object.entries(bounty)) player.resources[res] = ((_h = player.resources[res]) != null ? _h : 0) + amount2;
    applyXpDelta(player, faction.bounty.xp, now);
    const destroyed = power * combat.attackerLossPercent;
    debris = { scrap: Math.floor(destroyed * faction.bounty.debrisPerPower), energy: Math.floor(destroyed * faction.bounty.debrisPerPower / 2) };
    st.raidsWon += 1;
    st.repelled += 1;
    grantCommanderXp(player, "strategist", COMMANDER_XP.raidRepelled);
    addPassPoints(player, "raidRepelled", now);
    st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    player.victories = ((_i = player.victories) != null ? _i : 0) + 1;
    const lairNow = !st.lairOpen && st.repelled >= faction.lair.raidsNeeded;
    if (lairNow) st.lairOpen = true;
    notifications.push(
      note2(
        "combat-defender",
        combat.outcome === "draw" ? `${faction.name} repouss\xE9 de justesse` : `${faction.name} repouss\xE9 !`,
        `Prime : ${formatInt(total(bounty))} ressources et +${faction.bounty.xp} XP. Notori\xE9t\xE9 ${st.notoriety}.`,
        now
      )
    );
    if (lairNow) notifications.push(note2("fleet", `${faction.lair.name} localis\xE9`, "Sa position a fuit\xE9 : lance l'assaut depuis la page Menaces !", now));
  }
  setState(player, faction.id, st);
  const report = {
    attackerUid: PIRATE_OWNER_UID,
    attackerPseudo: `${faction.enforcer} (${faction.name})`,
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
  return Math.round(Math.max(faction.raid.floorPower * 3, targetPower(faction, player) * faction.lair.pct));
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
    for (const [res, amount2] of Object.entries(reward)) player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) + amount2;
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
        `Butin : ${formatInt(total(reward))} ressources, +${faction.lair.xp} XP${title ? ` et le titre \xAB ${title} \xBB` : ""}. ${faction.leader} s'est enfui\u2026 la traque continue.`,
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
    defenderPseudo: faction.lair.name,
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

// src/game/achievements.ts
var TIER_REWARDS = {
  bronze: { xp: 10, hours: 0 },
  argent: { xp: 25, hours: 0 },
  or: { xp: 60, hours: 2 },
  legendaire: { xp: 150, hours: 6 }
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
  def("tireless", "prestige", "bronze", "playtimeHours", 24, "Increvable", "Cumule 24 h de temps de jeu.", "\u23F1\uFE0F")
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
  return Object.fromEntries(Object.entries(entries).map(([id, e]) => [id, __spreadProps(__spreadValues({}, e), { count: Math.max(0, Math.round(e.count * (1 + (random() * 2 - 1) * swing))) })]));
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
var DAY2 = 864e5;
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
  if (lastEnd > 0 && now < lastEnd + VACATION_RULES.cooldownDays * DAY2) {
    const left = Math.ceil((lastEnd + VACATION_RULES.cooldownDays * DAY2 - now) / HOUR3);
    throw new GameActionError(`Tes derni\xE8res vacances sont trop r\xE9centes : encore ${left} h d'attente.`);
  }
  if (ctx.fleetsAway > 0) throw new GameActionError("Rappelle d'abord tes flottes : elles doivent toutes \xEAtre \xE0 quai.");
  if (ctx.hostileIncoming > 0) throw new GameActionError("Une flotte hostile approche : impossible de partir maintenant.");
  if (ctx.ultimatum) throw new GameActionError("R\xE9ponds d'abord \xE0 l'ultimatum en cours.");
  if (ctx.lastAttackedAtMs > 0 && now - ctx.lastAttackedAtMs < VACATION_RULES.recentAttackHours * HOUR3) {
    throw new GameActionError(`Tu as \xE9t\xE9 attaqu\xE9 il y a moins de ${VACATION_RULES.recentAttackHours} h : les vacances ne servent pas de bouclier d'urgence.`);
  }
  const v = { startedAtMs: now, untilMs: now + days * DAY2 };
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
    const e = queues.buildingUpgrades[id];
    if (e) {
      e.endTime += shift;
      if (e.startedAtMs) e.startedAtMs += shift;
    }
  }
  ["attack", "defense"].forEach((c) => queues.unitQueues[c].forEach((e) => e.endTime = later(e.endTime)));
  queues.activeResearches.forEach((e) => {
    e.endTime += shift;
    if (e.startedAtMs) e.startedAtMs += shift;
  });
  queues.activeMissions.forEach((e) => e.endTime += shift);
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
    delete queues.buildingUpgrades[buildingId];
  }
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
    for (const [res, amount2] of Object.entries(reward)) {
      if (res === "xp") {
        applyXpDelta(player, amount2, now);
      } else {
        player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + amount2;
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
      for (const [res, amount2] of Object.entries(reward)) player.resources[res] = ((_d = player.resources[res]) != null ? _d : 0) + amount2;
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
  return entries.map((e) => ({ e, seasonXp: seasonXpFor(e, seasonId) })).filter((x) => x.seasonXp > 0).sort((a, b) => {
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
    const amount2 = Math.floor(((_a = rates[r.id]) != null ? _a : 0) * reward.hours * 3600) + (r.rarity === "rare" ? reward.rare : 0);
    if (amount2 <= 0) continue;
    gained[r.id] = amount2;
    player.resources[r.id] = ((_b = player.resources[r.id]) != null ? _b : 0) + amount2;
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
function setActiveTitle(player, label2) {
  var _a;
  if (label2 && !((_a = player.titles) != null ? _a : []).some((t) => t.label === label2)) throw new GameActionError("Tu n'as pas gagn\xE9 ce titre.");
  player.activeTitle = label2;
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
    activeMissions: []
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
var DAY3 = 24 * 36e5;
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
  return at > 0 ? at + ASCENSION_RULES.upkeepFreeDays * DAY3 : 0;
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
  const wait = (Number(player.ascendedAtMs) || 0) + ASCENSION_RULES.cooldownDays * DAY3 - now;
  if (player.ascendedAtMs && wait > 0) return { ok: false, reason: `Prochaine ascension possible dans ${Math.ceil(wait / DAY3)} jour(s).`, missing };
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
  missionRareProductionRef: 5e5
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
  if (input.commanders || input.relics) {
    const mods = playerModifiers(input);
    for (const res of Object.keys(gross)) {
      const f = 1 + mods.productionAll + ((_b = mods.production[res]) != null ? _b : 0);
      if (f !== 1) gross[res] = ((_c = gross[res]) != null ? _c : 0) * f;
    }
  }
  for (const [res, m] of Object.entries(multipliers)) {
    if (gross[res] && m) gross[res] = ((_d = gross[res]) != null ? _d : 0) * m;
  }
  return gross;
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
function recordContract(player, type, amount2, now) {
  if (!(amount2 > 0)) return;
  const state = ensureContracts(player, now);
  for (const c of state.items) {
    if (c.type === type && !c.claimed) c.progress = Math.min(c.target, c.progress + amount2);
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
  for (const [res, amount2] of Object.entries(reward)) {
    if (res === "xp") applyXpDelta(player, amount2, now);
    else player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + amount2;
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
  { id: "blueprint", name: "Plan du Traqueur Kesh", price: 600, group: "unit", description: "D\xE9bloque le Traqueur Kesh au chantier : rapide, +50 % d'attaque contre les PNJ." },
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
  const amount2 = Math.floor(Number(amountIn));
  if (!(amount2 > 0)) throw new GameActionError("Quantit\xE9 invalide.");
  const st = bountyState(player);
  const week = weekId(now);
  if (st.exchangeWeek !== week) {
    st.exchangeWeek = week;
    st.exchanged = 0;
  }
  if (amount2 > BOUNTY_RULES.exchange.weeklyCap - st.exchanged) throw new GameActionError(`Plafond : ${BOUNTY_RULES.exchange.weeklyCap} Ambre \xE9chang\xE9s par semaine.`);
  if (amount2 > st.amber) throw new GameActionError("Pas assez d'Ambre.");
  const gain = {};
  for (const r of RESOURCE_LIST) {
    if (r.rarity !== "rare") continue;
    gain[r.id] = amount2 * BOUNTY_RULES.exchange.rarePerAmber;
    player.resources[r.id] = ((_a = player.resources[r.id]) != null ? _a : 0) + gain[r.id];
  }
  st.amber -= amount2;
  st.exchanged += amount2;
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
  if (KESH_EMOJIS.some((e) => text.includes(`:${e.code}:`)) && !owns(bountyState(player), "emojis")) {
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
    computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack)
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
  coalition: 50
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
var CAPSULE_AMBER = 15;
function passTitle(seasonId) {
  const month2 = seasonLabel(seasonId).toLowerCase();
  return /^[aeiouéâ]/.test(month2) ? `V\xE9t\xE9ran d'${month2}` : `V\xE9t\xE9ran de ${month2}`;
}
function passState(player, now) {
  var _a, _b;
  const raw = (_a = player.seasonPass) != null ? _a : {};
  const seasonId = currentSeasonId(now);
  const completed = Array.isArray(raw.completed) ? raw.completed.map(String) : [];
  if (raw.seasonId !== seasonId) return { seasonId, points: 0, claimed: [], loginDay: "", completed };
  return {
    seasonId,
    points: Math.max(0, Number(raw.points) || 0),
    claimed: (Array.isArray(raw.claimed) ? raw.claimed : []).map(Number).filter((n) => n >= 1 && n <= PASS_RULES.tiers),
    loginDay: String((_b = raw.loginDay) != null ? _b : ""),
    completed
  };
}
function passTier(points) {
  return Math.min(PASS_RULES.tiers, Math.floor(points / PASS_RULES.pointsPerTier));
}
var passHook = null;
function onPassPoints(hook) {
  passHook = hook;
}
function addPassPoints(player, source, now, times = 1) {
  passHook == null ? void 0 : passHook(player, source, now, times);
  const st = passState(player, now);
  const max = PASS_RULES.tiers * PASS_RULES.pointsPerTier;
  st.points = Math.min(max, st.points + PASS_POINTS[source] * Math.max(0, times));
  player.seasonPass = st;
}
function passDailyLogin(player, now) {
  const st = passState(player, now);
  const day = new Date(now).toISOString().slice(0, 10);
  if (st.loginDay === day) return false;
  st.loginDay = day;
  st.points = Math.min(PASS_RULES.tiers * PASS_RULES.pointsPerTier, st.points + PASS_POINTS.dailyLogin);
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
      return `Relique ${r.rarity === "epic" ? "\xE9pique" : "rare"}`;
    case "cosmetic":
      return seasonId ? `Banni\xE8re et titre \xAB ${passTitle(seasonId)} \xBB` : "Banni\xE8re et titre de la saison";
  }
}
function claimPassTier(player, tierIn, now, random = Math.random) {
  var _a, _b, _c;
  const tier = Math.floor(Number(tierIn));
  if (!(tier >= 1 && tier <= PASS_RULES.tiers)) throw new GameActionError("Palier inconnu.");
  const st = passState(player, now);
  if (st.claimed.includes(tier)) throw new GameActionError("Palier d\xE9j\xE0 r\xE9clam\xE9.");
  if (passTier(st.points) < tier) throw new GameActionError(`Palier pas encore atteint (${st.points} / ${tier * PASS_RULES.pointsPerTier} points).`);
  const gained = [];
  for (const r of PASS_TIERS[tier - 1]) {
    if (r.kind === "production") {
      for (const [res, n] of Object.entries(productionHours(player, r.hours))) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + n;
      gained.push(describePassReward(r));
    } else if (r.kind === "amber") {
      const b = bountyState(player);
      b.amber += r.amount;
      player.bounties = b;
      gained.push(describePassReward(r));
    } else if (r.kind === "dossier") {
      addDossiers(player, r.count);
      gained.push(describePassReward(r));
    } else if (r.kind === "capsule") {
      const syn = synthesisState(player);
      if (syn.stock[r.capsule].length < SYNTH_RULES.maxStock) {
        syn.stock[r.capsule] = [...syn.stock[r.capsule], r.level];
        player.synthesis = syn;
        gained.push(describePassReward(r));
      } else {
        const b = bountyState(player);
        b.amber += CAPSULE_AMBER;
        player.bounties = b;
        gained.push(`${CAPSULE_AMBER} Ambre (r\xE9serve de capsules pleine)`);
      }
    } else if (r.kind === "relic") {
      let first = true;
      const item = rollRelic("pass", now, () => first ? (first = false, 0) : random(), r.rarity);
      if (addRelic(player, item)) gained.push(`Relique : ${relicLabel(item)}`);
      else {
        const b = bountyState(player);
        b.amber += 40;
        player.bounties = b;
        gained.push("40 Ambre (collection de reliques pleine)");
      }
    } else if (r.kind === "cosmetic") {
      const title = passTitle(st.seasonId);
      if (!((_b = player.titles) != null ? _b : []).some((t) => t.label === title)) player.titles = [...(_c = player.titles) != null ? _c : [], { label: title, seasonId: `pass:${st.seasonId}`, rank: 1 }];
      if (!st.completed.includes(st.seasonId)) st.completed = [...st.completed, st.seasonId];
      gained.push(describePassReward(r, st.seasonId));
    }
  }
  st.claimed = [...st.claimed, tier].sort((a, b) => a - b);
  player.seasonPass = st;
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
  const power = Math.round(computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack));
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
}
function chroniclesConfig() {
  return config;
}
function defaultChroniclesConfig() {
  return structuredClone(DEFAULT_CHRONICLES);
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
  if (raw.monthId !== monthId) return { monthId, progress: [0, 0, 0, 0], claimed: [], emblems };
  const progress = [0, 1, 2, 3].map((i) => {
    var _a2;
    return Math.max(0, Number((_a2 = raw.progress) == null ? void 0 : _a2[i]) || 0);
  });
  return { monthId, progress, claimed: ((_b = raw.claimed) != null ? _b : []).map(Number).filter((n) => n >= 0 && n < 4), emblems };
}
function recordChronicle(player, type, now, times = 1) {
  const month2 = chronicleOf(now);
  if (!month2 || !(times > 0)) return;
  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  let changed = false;
  month2.episodes.slice(0, open).forEach((e, i) => {
    if (e.objective.type !== type || st.claimed.includes(i)) return;
    const next = Math.min(e.objective.count, st.progress[i] + times);
    if (next !== st.progress[i]) {
      st.progress[i] = next;
      changed = true;
    }
  });
  if (changed) player.chronicle = st;
}
function claimChronicle(player, episode, now) {
  const i = Math.floor(Number(episode));
  const month2 = chronicleOf(now);
  if (!month2) throw new GameActionError("Pas de chronique ce mois-ci.");
  if (!(i >= 0 && i < month2.episodes.length)) throw new GameActionError("\xC9pisode inconnu.");
  if (i >= unlockedEpisodes(now)) throw new GameActionError("Cet \xE9pisode n'est pas encore ouvert.");
  const st = chronicleState(player, now);
  if (st.claimed.includes(i)) throw new GameActionError("\xC9pisode d\xE9j\xE0 termin\xE9.");
  const e = month2.episodes[i];
  if (st.progress[i] < e.objective.count) throw new GameActionError(`Objectif pas encore atteint (${st.progress[i]} / ${e.objective.count}).`);
  st.claimed = [...st.claimed, i];
  player.chronicle = st;
  addPassPoints(player, "chronicle", now);
  return PASS_POINTS.chronicle;
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
  for (const [res, amount2] of Object.entries(step.reward)) player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + amount2;
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
      } catch (e) {
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
      } catch (e) {
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
function describeGain(gain) {
  const names = { scrap: "ferraille", energy: "\xE9nergie", nano: "nanocomposants", data: "donn\xE9es", reinforcedSteel: "acier renforc\xE9", cyberModule: "modules", syntheticNanites: "nanites", aiFragment: "fragments d'IA" };
  const parts = Object.entries(gain).filter(([, v]) => (v != null ? v : 0) > 0).map(([k, v]) => {
    var _a;
    return `${formatInt(v != null ? v : 0)} ${(_a = names[k]) != null ? _a : k}`;
  });
  return parts.length ? parts.join(", ") : "rien";
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
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent d\xE9clarer une guerre.");
  if (own.id === target.id) throw new GameActionError("Tu ne peux pas d\xE9clarer la guerre \xE0 ta propre alliance.");
  if (((_a = target.members) != null ? _a : []).length < WAR_RULES.minMembers) throw new GameActionError(`Cette alliance compte moins de ${WAR_RULES.minMembers} membres.`);
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === own.id || w.defenderId === own.id))) throw new GameActionError("Ton alliance est d\xE9j\xE0 en guerre.");
  if (input.wars.some((w) => isRunning(w, now) && (w.attackerId === target.id || w.defenderId === target.id))) throw new GameActionError(`[${target.tag}] est d\xE9j\xE0 en guerre.`);
  const lastPair = input.wars.filter((w) => w.attackerId === own.id && w.defenderId === target.id || w.attackerId === target.id && w.defenderId === own.id).reduce((a, w) => Math.max(a, w.endedAtMs || w.endMs), 0);
  const wait = lastPair + WAR_RULES.pairCooldownDays * 24 * HOUR8 - now;
  if (lastPair > 0 && wait > 0) throw new GameActionError(`Derni\xE8re guerre contre [${target.tag}] trop r\xE9cente : encore ${Math.ceil(wait / (24 * HOUR8))} jour(s).`);
  const treasury = __spreadValues({}, (_b = own.treasury) != null ? _b : {});
  if (((_c = treasury.scrap) != null ? _c : 0) < WAR_RULES.costScrap || ((_d = treasury.energy) != null ? _d : 0) < WAR_RULES.costEnergy) {
    throw new GameActionError(`Il faut ${formatInt(WAR_RULES.costScrap)} ferraille et ${formatInt(WAR_RULES.costEnergy)} \xE9nergie dans le tr\xE9sor.`);
  }
  treasury.scrap = ((_e = treasury.scrap) != null ? _e : 0) - WAR_RULES.costScrap;
  treasury.energy = ((_f = treasury.energy) != null ? _f : 0) - WAR_RULES.costEnergy;
  const startMs = now + WAR_RULES.prepHours * HOUR8;
  return {
    own: __spreadProps(__spreadValues({}, own), { treasury }),
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
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers peuvent se rendre.");
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
      Object.entries((_a = target.resources) != null ? _a : {}).map(([res, amount2]) => [res, Math.floor(amount2 != null ? amount2 : 0)])
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
function mergeDebris(field, add, location, now) {
  var _a, _b;
  const alive = field && field.expiresAtMs > now ? field : null;
  return {
    id: location.uid,
    locationPseudo: location.pseudo,
    scrap: ((_a = alive == null ? void 0 : alive.scrap) != null ? _a : 0) + add.scrap,
    energy: ((_b = alive == null ? void 0 : alive.energy) != null ? _b : 0) + add.energy,
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
  if (fleet.mission === "transport" && fleet.recalled && ((_c = fleet.transport) == null ? void 0 : _c.direction) === "deliver") {
    for (const [res, amount2] of Object.entries((_d = fleet.transport.cargo) != null ? _d : {})) owner.resources[res] = ((_e = owner.resources[res]) != null ? _e : 0) + (amount2 != null ? amount2 : 0);
  }
  for (const [res, amount2] of Object.entries((_f = fleet.loot) != null ? _f : {})) {
    owner.resources[res] = ((_g = owner.resources[res]) != null ? _g : 0) + (amount2 != null ? amount2 : 0);
  }
  const lootTotal = Object.values((_h = fleet.loot) != null ? _h : {}).reduce((a, b) => a + (b != null ? b : 0), 0);
  if (fleet.mission === "recycle") bumpStat(owner, "recycled", lootTotal);
  else if (((_i = fleet.mission) != null ? _i : "attack") === "attack") bumpStat(owner, "loot", lootTotal);
  return { owner, notifications: [__spreadProps(__spreadValues({ kind: "fleet" }, returnMessage(fleet, lootTotal)), { createdAtMs: now, read: false })] };
}
function returnMessage(fleet, lootTotal) {
  var _a;
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
      return ((_a = fleet.transport) == null ? void 0 : _a.direction) === "collect" && !fleet.recalled ? { title: "Transport rentr\xE9", message: lootTotal > 0 ? `${formatInt(lootTotal)} ressources rapatri\xE9es de ${fleet.targetPseudo}.` : `Rien \xE0 rapatrier de ${fleet.targetPseudo}.` } : { title: "Transport rentr\xE9", message: `Tes vaisseaux de transport sont revenus de ${fleet.targetPseudo}${fleet.recalled ? " avec leur cargaison" : ""}.` };
    case "garrison":
      return { title: "Garnison rentr\xE9e", message: `Ta garnison stationn\xE9e chez ${fleet.targetPseudo} est de retour.` };
    case "spy":
      return { title: "Sondes rentr\xE9es", message: `Tes sondes envoy\xE9es vers ${fleet.targetPseudo} sont de retour.` };
    case "recycle":
      return fleet.recalled ? { title: "Recycleurs rentr\xE9s", message: "Tes recycleurs rappel\xE9s sont de retour, soute vide." } : {
        title: "Recyclage termin\xE9",
        message: lootTotal > 0 ? `${formatInt(lootTotal)} ressources r\xE9cup\xE9r\xE9es dans les d\xE9bris de ${fleet.targetPseudo}.` : `Le champ de d\xE9bris de ${fleet.targetPseudo} \xE9tait d\xE9j\xE0 vide.`
      };
    default:
      return fleet.recalled ? { title: "Flotte rappel\xE9e rentr\xE9e", message: `Ta flotte envoy\xE9e vers ${fleet.targetPseudo} est de retour, sans combat.` } : {
        title: "Flotte rentr\xE9e \xE0 la base",
        message: `Retour de ${fleet.targetPseudo}${lootTotal > 0 ? ` avec ${formatInt(lootTotal)} ressources de butin` : ""}.`
      };
  }
}
function performLaunch(req) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
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
    const e = launchExpedition(owner, req.fleet, req.expeditionHours, (_h = req.expeditionsActive) != null ? _h : 0, (_i = req.expeditionsToday) != null ? _i : 0, now, req.formation);
    out = { attacker: e.attacker, fleet: e.fleet, defenderNotifications: [] };
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
  else if (mission === "elite") {
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
  if (mission === "spy") grantCommanderXp(out.attacker, "spy", COMMANDER_XP.spyLaunched);
  if (mission === "spy") recordChronicle(out.attacker, "spy", now);
  const counter = { spy: "spies", patrol: "patrols", garrison: "garrisons" }[mission];
  if (counter) bumpStat(out.attacker, counter);
  return __spreadProps(__spreadValues({}, out), { capsules, attackerQueues: flushed.queues, attackerNotifications: flushed.notifications });
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
  const capacity = fleetCargoCapacity(owner.units, units, owner.techLevels);
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
  const taken = collectFromColony(colony, t.cargo, fleetCargoCapacity(owner.units, fleet.units, owner.techLevels));
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
  const fleet = __spreadProps(__spreadValues({}, newFleet(owner, host, "garrison", units, now, arriveAtMs)), { durationMs: hours2 * 36e5, stationedUntilMs: null });
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
  const base = d.tier === "strong" ? ref.max : ref.median;
  return Math.max(WARLORD_RULES.minPower, Math.round(base * tierFactor(d) * (settings.powerFactor || 1)));
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
  const buildStep = !rt.seeded || now - rt.lastBuildingAtMs >= WARLORD_RULES.buildingLevelEveryHours * 36e5;
  if (buildStep) {
    for (const b of BUILDINGS) {
      const want = Math.min(b.maxLevel, Math.round(((_c = ref.buildings[b.id]) != null ? _c : 0) * ((_d = WARLORD_RULES.buildingFactor[d.tier]) != null ? _d : 1)));
      const cur = (_f = (_e = npc.buildings[b.id]) == null ? void 0 : _e.level) != null ? _f : 0;
      if (want > cur) npc.buildings[b.id] = { level: rt.seeded ? cur + 1 : want, unlocked: true };
    }
    out.lastBuildingAtMs = now;
  }
  const stockHours = d.personality === "builder" ? WARLORD_RULES.stockHours.builder : WARLORD_RULES.stockHours.default;
  const stock = productionHours(npc, stockHours);
  for (const res of COMMON_RESOURCES2) {
    const want = (_g = stock[res]) != null ? _g : 0;
    const cur = (_h = npc.resources[res]) != null ? _h : 0;
    if (cur < want) npc.resources[res] = Math.min(want, cur + (rt.seeded ? Math.ceil(want * hours2 / 12) : want));
  }
  const xpTarget = warlordTargetXp(d, ref);
  const xp = (_i = npc.xp) != null ? _i : 0;
  const xpStep = Math.ceil(xpTarget * WARLORD_RULES.xpGrowthPerHour * hours2);
  npc.xp = xp < xpTarget ? rt.seeded ? Math.min(xpTarget, xp + xpStep) : xpTarget : xp;
  const seasonTarget = Math.round((ref.medianSeasonXp || 0) * tierFactor(d));
  npc.seasonXp = Math.max((_j = npc.seasonXp) != null ? _j : 0, rt.seeded ? Math.min(seasonTarget, ((_k = npc.seasonXp) != null ? _k : 0) + Math.ceil(seasonTarget * 0.05)) : seasonTarget);
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E;
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
    attackFactor: formation.attackFactor * (1 + atkMods.attack + assault),
    cargoFactor: formation.cargoFactor * (1 + atkMods.cargo),
    defenderPowerFactor: 1 + defMods.defense + armor,
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    lootMultiplier: lootFactor(now),
    garrisons: (_m = input.garrisons) != null ? _m : [],
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(attacker.buildings), attacker),
    fleet,
    defenderUnits: (_n = def3.units) != null ? _n : {},
    defenderTechLevels: (_o = def3.techLevels) != null ? _o : {},
    defenderRepairPct: withRepairBonus(getRepairPercent(def3.buildings), owner),
    defenderShieldPct: getShieldPercent(def3.buildings, allianceShieldBonus(def3.allianceResearch)),
    // Le bunker de l'entrepôt met une partie du stock à l'abri du pillage.
    defenderResources: Object.fromEntries(
      Object.entries((_p = def3.resources) != null ? _p : {}).map(([res, amount2]) => [res, Math.max(0, (amount2 != null ? amount2 : 0) - protectedAmount(def3.buildings, res, def3.techLevels, def3.allianceResearch))])
    )
  }));
  const aegis = combat.outcome === "attacker_win" && Object.values((_q = combat.loot) != null ? _q : {}).some((n) => (n != null ? n : 0) > 0) && consumeAegis(owner, now);
  if (aegis) combat.loot = {};
  if (input.lootCap !== void 0 && combat.loot) combat.loot = capLoot(combat.loot, input.lootCap);
  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  const survivors = {};
  for (const [unitId, qty] of Object.entries(fleet)) survivors[unitId] = Math.max(0, qty - ((_r = combat.attackerLosses[unitId]) != null ? _r : 0));
  if (input.inFlight) {
    for (const [unitId, qty] of Object.entries(survivors)) {
      if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - qty);
    }
  }
  for (const [res, amt] of Object.entries((_s = combat.loot) != null ? _s : {})) {
    if (!input.inFlight) {
      attacker.resources[res] = ((_t = attacker.resources[res]) != null ? _t : 0) + (amt != null ? amt : 0);
      bumpStat(attacker, "loot", amt != null ? amt : 0);
    }
    def3.resources[res] = Math.max(0, ((_u = def3.resources[res]) != null ? _u : 0) - (amt != null ? amt : 0));
  }
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def3.units[unitId]) def3.units[unitId].count = Math.max(0, def3.units[unitId].count - lost);
  }
  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") {
    if (attacker.lastDefeatAtMs && now - attacker.lastDefeatAtMs <= 36e5) setStat(attacker, "phoenix", 1);
    attacker.victories = ((_v = attacker.victories) != null ? _v : 0) + 1;
  } else if (combat.outcome === "defender_win") attacker.defeats = ((_w = attacker.defeats) != null ? _w : 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  attacker.lastAttackAtMs = now;
  if (combat.outcome === "defender_win") owner.victories = ((_x = owner.victories) != null ? _x : 0) + 1;
  else if (combat.outcome === "attacker_win") {
    owner.defeats = ((_y = owner.defeats) != null ? _y : 0) + 1;
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
      title: (_z = outcomeTitle[combat.outcome]) != null ? _z : "Rapport de combat",
      message: `Attaque contre ${def3.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).`,
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
      title: (_A = defenderTitle[combat.outcome]) != null ? _A : "Rapport de combat",
      message: `Attaque de ${input.attacker.pseudo}${colony ? ` sur ${colony.name}` : ""}${defenderXpDelta ? ` (${defenderXpDelta > 0 ? "+" : ""}${defenderXpDelta} XP)` : ""}.${aegis ? " L'\xC9gide de la Reine a prot\xE9g\xE9 tes r\xE9serves du pillage." : ""}${armor > 0 ? ` Carapace r\xE9active consomm\xE9e (+${Math.round(armor * 100)} % de d\xE9fense).` : ""}`,
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
    garrisons: ((_B = input.garrisons) != null ? _B : []).map((g, i) => {
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
    loot: (_C = combat.loot) != null ? _C : {},
    debris: debrisFromLosses([combat.attackerLosses, combat.defenderLosses, ...(_D = combat.garrisonLosses) != null ? _D : []], (_E = eventDebrisPercent(now)) != null ? _E : DEBRIS_RULES.percent)
  };
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
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
      return { refund: scaleCost(paid, fraction), fraction, label: `${tech.nom} niveau ${level3}` };
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
        const e = queue[i];
        if (e.endTime) {
          const f = refundFraction(e.endTime - getUnitBuildTime(unit, player.techLevels) * 1e3, e.endTime, now);
          fraction = Math.min(fraction, f);
          refund = addCost(refund, scaleCost(each, f));
        } else refund = addCost(refund, each);
      }
      return { refund, fraction, label: `${group.count} \xD7 ${unit.name}` };
    }
    case "colonyBuilding": {
      const colony = colonyOf(player, target.colonyId);
      const job = colony == null ? void 0 : colony.building;
      const def3 = job ? findBuilding(job.id) : void 0;
      if (!colony || !job || !def3) throw new GameActionError("Aucune construction en cours sur cette colonie.");
      const paid = (_j = job.paid) != null ? _j : colonyUpgradeCost(player, job.id, job.level);
      const start = (_k = job.startedAtMs) != null ? _k : job.endTime - colonyUpgradeSeconds(player, job.id, job.level, now) * 1e3;
      const fraction = refundFraction(start, job.endTime, now);
      return { refund: scaleCost(paid, fraction), fraction, label: `${colony.name} : ${def3.name} niveau ${job.level}` };
    }
    case "colonyDefense": {
      const colony = colonyOf(player, target.colonyId);
      const job = colony == null ? void 0 : colony.defenseJob;
      const unit = job ? findUnit(job.unitId) : void 0;
      if (!colony || !job || !unit) throw new GameActionError("Aucune d\xE9fense en construction sur cette colonie.");
      const paid = (_l = job.paid) != null ? _l : { scrap: unit.cost.scrap * job.qty, energy: unit.cost.energy * job.qty };
      const start = (_m = job.startedAtMs) != null ? _m : job.endTime - colonyDefenseSeconds(player, job.unitId, job.qty) * 1e3;
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
var PROFILE_RULES = { mottoMax: 60 };
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
    }))
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
  var _a, _b, _c, _d;
  const raw = (_a = p.profileStyle) != null ? _a : {};
  return { banner: String((_b = raw.banner) != null ? _b : "nebula"), emblem: String((_c = raw.emblem) != null ? _c : "rank"), motto: String((_d = raw.motto) != null ? _d : "") };
}
function sanitizeMotto(text) {
  return String(text != null ? text : "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, PROFILE_RULES.mottoMax);
}
function setProfileStyle(player, input) {
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
  const clean2 = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === "string" && SEEN_ID.test(id));
  const merged = [...(current2 != null ? current2 : []).filter((id) => !clean2.includes(id)), ...clean2];
  return merged.slice(-SEEN_LIMIT);
}

// src/game/actions.ts
var RESOURCE_IDS2 = new Set(RESOURCE_LIST.map((r) => r.id));
var MAX_QTY = 1e5;
function positiveInt(value, label2) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) throw new GameActionError(`${label2} invalide.`);
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
      if (built + reserved + qty * unit.hangarSpace > getUnitCapacity(player.buildings, category)) {
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
      if (!checkPrereqs(tech, player.techLevels).valid) throw new GameActionError("Pr\xE9requis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est d\xE9j\xE0 en cours de recherche.");
      if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
      }
      const paid = getTechCost(tech, nextLevel);
      pay(player, paid, now);
      queues.activeResearches.push({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * playerResearchTimeFactor(player, now)) * 1e3, startedAtMs: now, paid });
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
      if (!RESOURCE_IDS2.has(sellId) || !RESOURCE_IDS2.has(buyId) || sellId === buyId) throw new GameActionError("\xC9change invalide.");
      const amount2 = positiveInt(action.amount, "Montant");
      if (((_k = player.resources[sellId]) != null ? _k : 0) < amount2) throw new GameActionError("Pas assez de ressources \xE0 \xE9changer.");
      const gained = Math.floor(amount2 * getTradeRate(sellId, buyId));
      player.resources[sellId] -= amount2;
      player.resources[buyId] = ((_l = player.resources[buyId]) != null ? _l : 0) + gained;
      bumpStat(player, "traded", amount2);
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
    case "passClaim":
      return { gained: claimPassTier(player, action.tier, now) };
    case "chronicleClaim":
      return { points: claimChronicle(player, action.episode, now) };
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
    if (!RESOURCE_IDS2.has(res) || !Number.isFinite(n) || n < 0) throw new GameActionError("Ressources invalides.");
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
    if (RESOURCE_IDS2.has(key)) player.resources[key] = Math.max(0, ((_c = player.resources[key]) != null ? _c : 0) - (Number(amt) || 0));
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
    if (RESOURCE_IDS2.has(res) && Number.isFinite(n) && n > 0) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + n;
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
      ranks: [...families.entries()].map(([label2, count2]) => ({ label: label2, count: count2 })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label)),
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
  const rankAge = [...byFamily.entries()].map(([label2, ages]) => ({ label: label2, players: ages.length, medianDays: round1(median2(ages)) })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label));
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
      const amount2 = (_b = (_a = p.resources) == null ? void 0 : _a[r.id]) != null ? _b : 0;
      if (amount2 < 1e6) continue;
      const others = median2(players.filter((o) => o !== p).map((o) => {
        var _a2, _b2;
        return (_b2 = (_a2 = o.resources) == null ? void 0 : _a2[r.id]) != null ? _b2 : 0;
      }));
      const ratio = others > 0 ? amount2 / others : Infinity;
      if (ratio >= 20) anomalies.push({ pseudo: p.pseudo, resource: r.name, amount: Math.floor(amount2), ratio: Number.isFinite(ratio) ? Math.round(ratio) : 0 });
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
  for (const [res, amount2] of Object.entries(options.starterKit)) resources[res] = ((_a = resources[res]) != null ? _a : 0) + amount2;
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
  "seasonPass",
  "referral",
  "vacation",
  "chronicle",
  "announcementsSeen"
];
var QUEUE_FIELDS = ["buildingUpgrades", "unitQueues", "activeResearches", "activeMissions"];

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
  priceBand: 3
};
var RESOURCE_IDS3 = new Set(RESOURCE_LIST.map((r) => r.id));
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
  if (!RESOURCE_IDS3.has(giveRes) || !RESOURCE_IDS3.has(wantRes)) throw new GameActionError("Ressource inconnue.");
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
  return { giveRes, giveAmount, wantRes, wantAmount, expiresAtMs: now + MARKET_RULES.offerHours * 36e5 };
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
  return { tax, sameAlliance };
}
function refundOffer(offer, seller) {
  var _a;
  seller.resources[offer.giveRes] = ((_a = seller.resources[offer.giveRes]) != null ? _a : 0) + offer.giveAmount;
}
function describeAmount(res, n) {
  return `${formatInt(n)} ${label(res)}`;
}
function utcDayStart(now) {
  return Math.floor(now / 864e5) * 864e5;
}

// src/game/content.ts
var CONTENT_SECTIONS = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules", "warlords", "seasonPass", "chronicles"];
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
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES, wars: DEFAULT_WAR_RULES }
  });
}
var current = defaultGameContent();
function applyGameContent(overrides) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q;
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
    rules: {
      pvp: __spreadValues(__spreadValues({}, defaults.rules.pvp), (_l = (_k = overrides.rules) == null ? void 0 : _k.pvp) != null ? _l : {}),
      combat: __spreadValues(__spreadValues({}, defaults.rules.combat), (_n = (_m = overrides.rules) == null ? void 0 : _m.combat) != null ? _n : {}),
      economy: __spreadValues(__spreadValues({}, defaults.rules.economy), (_p = (_o = overrides.rules) == null ? void 0 : _o.economy) != null ? _p : {}),
      fleets: __spreadValues(__spreadValues({}, defaults.rules.fleets), (_r = (_q = overrides.rules) == null ? void 0 : _q.fleets) != null ? _r : {}),
      spy: __spreadValues(__spreadValues({}, defaults.rules.spy), (_t = (_s = overrides.rules) == null ? void 0 : _s.spy) != null ? _t : {}),
      debris: __spreadValues(__spreadValues({}, defaults.rules.debris), (_v = (_u = overrides.rules) == null ? void 0 : _u.debris) != null ? _v : {}),
      patrol: __spreadValues(__spreadValues({}, defaults.rules.patrol), (_x = (_w = overrides.rules) == null ? void 0 : _w.patrol) != null ? _x : {}),
      events: __spreadValues(__spreadValues({}, defaults.rules.events), (_z = (_y = overrides.rules) == null ? void 0 : _y.events) != null ? _z : {}),
      seasons: __spreadValues(__spreadValues({}, defaults.rules.seasons), (_B = (_A = overrides.rules) == null ? void 0 : _A.seasons) != null ? _B : {}),
      alliances: __spreadValues(__spreadValues({}, defaults.rules.alliances), (_D = (_C = overrides.rules) == null ? void 0 : _C.alliances) != null ? _D : {}),
      pirates: __spreadValues(__spreadValues({}, defaults.rules.pirates), (_F = (_E = overrides.rules) == null ? void 0 : _E.pirates) != null ? _F : {}),
      market: __spreadValues(__spreadValues({}, defaults.rules.market), (_H = (_G = overrides.rules) == null ? void 0 : _G.market) != null ? _H : {}),
      expeditions: __spreadProps(__spreadValues(__spreadValues({}, defaults.rules.expeditions), (_J = (_I = overrides.rules) == null ? void 0 : _I.expeditions) != null ? _J : {}), {
        weights: __spreadValues(__spreadValues({}, defaults.rules.expeditions.weights), (_M = (_L = (_K = overrides.rules) == null ? void 0 : _K.expeditions) == null ? void 0 : _L.weights) != null ? _M : {})
      }),
      leviathan: __spreadValues(__spreadValues({}, defaults.rules.leviathan), (_O = (_N = overrides.rules) == null ? void 0 : _N.leviathan) != null ? _O : {}),
      wars: __spreadValues(__spreadValues({}, defaults.rules.wars), (_Q = (_P = overrides.rules) == null ? void 0 : _P.wars) != null ? _Q : {})
    }
  };
  setBuildings(content.buildings);
  setUnits(content.units);
  setTechnologies(content.technologies);
  for (const t of content.technologies) for (const e of techEffects(t)) if (e.type === "unlock_next_level" && e.target) UNIT_TO_TECH[e.target] = t.id;
  setMissions(content.missions);
  setFactions(content.factions);
  setRanks(content.ranks);
  setAchievements(content.achievements);
  setWarlords(content.warlords);
  setSeasonPass(content.seasonPass);
  setChronicles(content.chronicles);
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
  const label2 = role ? STAFF_LABELS[role] : null;
  player.titles = label2 ? [{ label: label2, rank: 0, seasonId: STAFF_TITLE_SEASON }, ...kept] : kept;
  if (player.activeTitle && staffLabels.includes(player.activeTitle) && player.activeTitle !== label2) player.activeTitle = "";
  if (label2 && display) player.activeTitle = label2;
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
function addContribution(ch, uid, pseudo, amount2, now) {
  var _a, _b;
  if (ch.status !== "active" || !(amount2 > 0) || now < ch.startMs || now >= ch.endMs) return ch;
  const prev = (_b = (_a = ch.contributions[uid]) == null ? void 0 : _a.amount) != null ? _b : 0;
  return __spreadProps(__spreadValues({}, ch), { total: ch.total + amount2, contributions: __spreadProps(__spreadValues({}, ch.contributions), { [uid]: { pseudo, amount: prev + amount2 } }) });
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
  if (role !== "founder" && role !== "officer") throw new GameActionError(`Seuls le fondateur et les officiers peuvent ${what}.`);
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
  var _a, _b, _c, _d, _e, _f, _g, _h;
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
    m.episodes.forEach((e, i) => {
      if (episodeUnlockMs(m.id, i) > now) return;
      out.push({ id: `chronicle:${m.id}:${i}`, category: "chronicles", name: e.title, subtitle: `${m.title} \xB7 \xE9pisode ${i + 1}`, image: m.boss.emblem, text: e.lines.map((l) => l.text).join("\n\n"), unlocked: true });
    });
  }
  for (const u of UNITS) {
    out.push({ id: `unit:${u.id}`, category: "units", name: u.name, subtitle: u.category === "defense" ? "D\xE9fense" : "Flotte", image: u.image, text: u.description, unlocked: !!((_h = player.units) == null ? void 0 : _h[u.id]) });
  }
  return out;
}
function codexProgress(entries) {
  const unlocked = entries.filter((e) => e.unlocked).length;
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

// src/server/hooksEntry.ts
function flushPlayer(player, queues, now) {
  return flushState(__spreadProps(__spreadValues({}, player), { buildings: withMissingBuildings(player.buildings, player.resources) }), queues, now);
}
function tutorialRaidPower(player) {
  var _a, _b;
  return Math.max(TUTORIAL_RAID.minPower, Math.round(homeDefensePower((_a = player.units) != null ? _a : {}, (_b = player.techLevels) != null ? _b : {}) * TUTORIAL_RAID.powerPct));
}
