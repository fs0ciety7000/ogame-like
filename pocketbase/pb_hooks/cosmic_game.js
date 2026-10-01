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
  ALLIANCE_RULES: () => ALLIANCE_RULES,
  AUTO_ERROR_RULES: () => AUTO_ERROR_RULES,
  AUTO_REPORTER_ID: () => AUTO_REPORTER_ID,
  CONTENT_SECTIONS: () => CONTENT_SECTIONS,
  DEFAULT_STAFF_BY_PSEUDO: () => DEFAULT_STAFF_BY_PSEUDO,
  EXPEDITION_RULES: () => EXPEDITION_RULES,
  FACTIONS: () => FACTIONS,
  GAME_FIELDS: () => GAME_FIELDS,
  GameActionError: () => GameActionError,
  LEVIATHAN_KEY: () => LEVIATHAN_KEY,
  LEVIATHAN_RULES: () => LEVIATHAN_RULES,
  MAINTENANCE_KEY: () => MAINTENANCE_KEY,
  MARKET_RULES: () => MARKET_RULES,
  PIRATE_OWNER_UID: () => PIRATE_OWNER_UID,
  PIRATE_RULES: () => PIRATE_RULES,
  PVP_RULES: () => PVP_RULES,
  QUEUE_FIELDS: () => QUEUE_FIELDS,
  SEASON_RULES: () => SEASON_RULES,
  STAFF_KEY: () => STAFF_KEY,
  acceptOffer: () => acceptOffer,
  addOccurrence: () => addOccurrence,
  addReportComment: () => addReportComment,
  allianceStandings: () => allianceStandings,
  answerUltimatum: () => answerUltimatum,
  applyGameContent: () => applyGameContent,
  applyLegacyBattleReport: () => applyLegacyBattleReport,
  applyLegacyGift: () => applyLegacyGift,
  applyStaffTitle: () => applyStaffTitle,
  applyStaffUpdate: () => applyStaffUpdate,
  assertReportQuota: () => assertReportQuota,
  autoReportDescription: () => autoReportDescription,
  autoReportTitle: () => autoReportTitle,
  checkLeviathanLaunch: () => checkLeviathanLaunch,
  closeLeviathan: () => closeLeviathan,
  collectDebris: () => collectDebris,
  completeFleetReturn: () => completeFleetReturn,
  computeGameStats: () => computeGameStats,
  createOffer: () => createOffer,
  debrisTotal: () => debrisTotal,
  defaultQueues: () => defaultQueues,
  describeAmount: () => describeAmount,
  describeGain: () => describeGain,
  endGarrison: () => endGarrison,
  errorKey: () => errorKey,
  errorQuotaKey: () => errorQuotaKey,
  extendUltimatums: () => extendUltimatums,
  factionOfLair: () => factionOfLair,
  findFaction: () => findFaction,
  finishAllianceResearch: () => finishAllianceResearch,
  finishExpedition: () => finishExpedition,
  flushPlayer: () => flushPlayer,
  formatInt: () => formatInt,
  githubIssueBody: () => githubIssueBody,
  grantLeviathanReward: () => grantLeviathanReward,
  isFormation: () => isFormation,
  isStaffRole: () => isStaffRole,
  leviathanRanking: () => leviathanRanking,
  leviathanWindow: () => leviathanWindow,
  maintenanceShouldAutoEnd: () => maintenanceShouldAutoEnd,
  mergeDebris: () => mergeDebris,
  newPlayerProfile: () => newPlayerProfile,
  nextMaintenance: () => nextMaintenance,
  normalizeLeviathan: () => normalizeLeviathan,
  normalizeMaintenance: () => normalizeMaintenance,
  normalizeStaff: () => normalizeStaff,
  parseResetOptions: () => parseResetOptions,
  patrolTurnaround: () => patrolTurnaround,
  performAllianceAction: () => performAllianceAction,
  performAttack: () => performAttack,
  performFleetReturn: () => performFleetReturn,
  performGift: () => performGift,
  performLaunch: () => performLaunch,
  performPlayerAction: () => performPlayerAction,
  performSeasonReward: () => performSeasonReward,
  pirateTick: () => pirateTick,
  previousSeasonId: () => previousSeasonId,
  recallFleet: () => recallFleet,
  recyclerCapacity: () => recyclerCapacity,
  refundOffer: () => refundOffer,
  removeLeviathanTitle: () => removeLeviathanTitle,
  reportStatusLabel: () => reportStatusLabel,
  resetPlayerState: () => resetPlayerState,
  resolveExpeditionChoice: () => resolveExpeditionChoice,
  resolveLairAssault: () => resolveLairAssault,
  resolveLeviathanAssault: () => resolveLeviathanAssault,
  resolvePirateRaid: () => resolvePirateRaid,
  resolveSpyArrival: () => resolveSpyArrival,
  rollExpeditionEvent: () => rollExpeditionEvent,
  sanitizeClientError: () => sanitizeClientError,
  sanitizeNewReport: () => sanitizeNewReport,
  seasonRewardFor: () => seasonRewardFor,
  seasonStandings: () => seasonStandings,
  seasonXpFor: () => seasonXpFor,
  spawnLeviathan: () => spawnLeviathan,
  stationGarrison: () => stationGarrison,
  utcDayStart: () => utcDayStart
});
module.exports = __toCommonJS(hooksEntry_exports);

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
  const lastSunday = (month) => {
    const last = new Date(Date.UTC(y, month + 1, 0));
    return Date.UTC(y, month, last.getUTCDate() - last.getUTCDay(), 1);
  };
  const summer = now >= lastSunday(2) && now < lastSunday(9);
  return (d.getUTCHours() + (summer ? 2 : 1)) % 24;
}

// src/game/technologies.ts
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
  { id: "tech19", nom: "\xC9toile noire", desc: "D\xE9bloque l'\xC9toile noire, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { reinforcedSteel: 1e3, syntheticNanites: 1e3, cyberModule: 1e3, aiFragment: 1e3 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5, tech1: 18 } }
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
    hangarSpace: 200
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
  }
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
    UNIT_BASE_STATS[u.id] = { attack: u.stats.attaque, defense: u.stats.defense };
    if (u.unlockTech) UNIT_TO_TECH[u.id] = u.unlockTech;
  }
  OFFENSIVE_UNITS.splice(0, OFFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "attack").map((u) => u.id));
  DEFENSIVE_UNITS.splice(0, DEFENSIVE_UNITS.length, ...defs.filter((u) => u.category === "defense").map((u) => u.id));
}
setUnits(DEFAULT_UNITS);
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
  }
];
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
    ...defs.filter((b) => b.production && !b.startsUnlocked).map((b) => b.id)
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
  let pct4 = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "repair") continue;
    pct4 += repairPercentAt(b.effect, effectiveBuildingLevel(buildings, b.id));
  }
  return pct4;
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
  var _a;
  let levels = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) === "hangar" && b.effect.category === "defense") levels += effectiveBuildingLevel(buildings, b.id);
  }
  return Math.min(COMBAT_RULES.shieldMax + allianceBonus, levels * COMBAT_RULES.shieldPerLevel + allianceBonus);
}
var RARE_RESOURCES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
var COMMON_RESOURCES = ["scrap", "energy", "nano", "data"];
function fleetCargoCapacity(units, fleet, techLevels2) {
  var _a, _b, _c;
  let total2 = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const def2 = findUnit(id);
    const level3 = (_b = (_a = units[id]) == null ? void 0 : _a.level) != null ? _b : 0;
    if (!def2 || qty <= 0 || level3 <= 0) continue;
    total2 += ((_c = def2.stats.cargo) != null ? _c : 0) * level3 * qty;
  }
  return Math.floor(total2 * (1 + techBonus(techLevels2, "cargo_capacity")));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function unitStat(units, techLevels2, unitId, stat) {
  var _a, _b, _c, _d;
  const base = (_b = (_a = UNIT_BASE_STATS[unitId]) == null ? void 0 : _a[stat]) != null ? _b : 0;
  const level3 = (_d = (_c = units[unitId]) == null ? void 0 : _c.level) != null ? _d : 0;
  if (level3 <= 0) return 0;
  let value = base + (level3 - 1) * 5;
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;
  const shield = Math.max(0, Math.min(0.95, (_a = params.defenderShieldPct) != null ? _a : 0));
  const attackerPower = ((_b = params.attackerPowerOverride) != null ? _b : computeFleetPower(attackerUnits, attackerTechLevels, fleet, ["attack"])) * ((_c = params.attackFactor) != null ? _c : 1) * (1 - shield);
  const garrisons = (_d = params.garrisons) != null ? _d : [];
  const garrisonFactor = (_e = params.garrisonFactor) != null ? _e : 0.5;
  const garrisonPower = garrisons.reduce((sum3, g) => sum3 + computeFleetPower(g.units, g.techLevels, g.fleet, ["attack", "defense"]) * garrisonFactor, 0);
  const homeFactor = (_f = params.homeFleetFactor) != null ? _f : COMBAT_RULES.homeFleetDefenseFactor;
  const defenderPower = (_h = params.defenderPowerOverride) != null ? _h : homeDefensePower(defenderUnits, defenderTechLevels, homeFactor, (_g = params.defenseFactor) != null ? _g : 1) + garrisonPower;
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
  for (const [unitId, sent] of Object.entries(fleet)) survivors[unitId] = Math.max(0, sent - ((_i = attackerLosses[unitId]) != null ? _i : 0));
  const cargoCapacity = Math.floor(fleetCargoCapacity(attackerUnits, survivors, attackerTechLevels) * ((_j = params.cargoFactor) != null ? _j : 1));
  let loot = null;
  if (outcome === "attacker_win") {
    const wanted = {};
    let total2 = 0;
    for (const res of [...COMMON_RESOURCES, ...RARE_RESOURCES]) {
      const base = RARE_RESOURCES.includes(res) ? COMBAT_RULES.lootPercent : COMBAT_RULES.lootPercentCommon;
      const pct4 = Math.min(1, base * ((_k = params.lootMultiplier) != null ? _k : 1));
      const amount2 = Math.floor(Math.max(0, (_l = defenderResources[res]) != null ? _l : 0) * pct4);
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
      if (((_m = loot[res]) != null ? _m : 0) < ((_n = wanted[res]) != null ? _n : 0)) {
        loot[res] = ((_o = loot[res]) != null ? _o : 0) + 1;
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
function lastSundayAt1Utc(year, month) {
  const d = new Date(Date.UTC(year, month + 1, 0, 1));
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

// src/game/errors.ts
var GameActionError = class extends Error {
};

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
  const def2 = findAllianceResearch(id);
  return Math.max(0, Math.min((_a = def2 == null ? void 0 : def2.maxLevel) != null ? _a : 0, Math.floor(Number(levels == null ? void 0 : levels[id]) || 0)));
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
  const def2 = findAllianceResearch(researchId);
  if (!def2) throw new GameActionError("Recherche inconnue.");
  if (alliance.activeResearch) throw new GameActionError("Une recherche d'alliance est d\xE9j\xE0 en cours.");
  const next = level(alliance.research, def2.id) + 1;
  if (next > def2.maxLevel) throw new GameActionError("Niveau maximum atteint.");
  const cost = allianceResearchCost(next);
  const treasury = __spreadValues({}, (_a = alliance.treasury) != null ? _a : {});
  for (const [res, amount2] of Object.entries(cost)) {
    if (((_b = treasury[res]) != null ? _b : 0) < amount2) throw new GameActionError("Le tr\xE9sor ne suffit pas pour cette recherche.");
  }
  for (const [res, amount2] of Object.entries(cost)) treasury[res] = ((_c = treasury[res]) != null ? _c : 0) - amount2;
  return __spreadProps(__spreadValues({}, alliance), { treasury, activeResearch: { id: def2.id, level: next, endTime: now + allianceResearchSeconds(next) * 1e3 } });
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
function allianceStandings(members) {
  var _a;
  const byAlliance = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (!m.allianceId || !(m.seasonXp > 0)) continue;
    byAlliance.set(m.allianceId, [...(_a = byAlliance.get(m.allianceId)) != null ? _a : [], m.seasonXp]);
  }
  return [...byAlliance.entries()].map(([allianceId, xps]) => ({
    allianceId,
    score: xps.sort((a, b) => b - a).slice(0, ALLIANCE_RULES.seasonTopMembers).reduce((a, b) => a + b, 0)
  })).sort((a, b) => b.score - a.score || (a.allianceId < b.allianceId ? -1 : 1)).map((s, i) => __spreadProps(__spreadValues({}, s), { rank: i + 1 }));
}
function note(title, message, now) {
  return { kind: "alliance", title, message, createdAtMs: now, read: false };
}
function performAllianceAction(input) {
  var _a, _b, _c, _d, _e, _f;
  const { action, now, actor } = input;
  const alliance = input.alliance;
  const out = { alliance, actor, target: (_a = input.target) != null ? _a : null, memberships: {}, logs: [], notifications: {} };
  const log = (entry) => out.logs.push(__spreadValues({ actorUid: actor.uid, actorPseudo: actor.pseudo, createdAtMs: now }, entry));
  const research = (a) => {
    var _a2;
    return __spreadValues({}, (_a2 = a == null ? void 0 : a.research) != null ? _a2 : {});
  };
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
      const def2 = findAllianceResearch(started.activeResearch.id);
      log({ kind: "research", text: `${def2.name} niveau ${started.activeResearch.level}`, resources: allianceResearchCost(started.activeResearch.level) });
      return out;
    }
    default:
      throw new GameActionError("Action d'alliance inconnue.");
  }
}
function finishAllianceResearch(alliance, now) {
  var _a, _b, _c;
  const done = completeAllianceResearch(alliance, now);
  if (!done.completed) return null;
  const def2 = findAllianceResearch(done.completed.id);
  const label2 = `${(_a = def2 == null ? void 0 : def2.name) != null ? _a : done.completed.id} niveau ${done.completed.level}`;
  const memberships = {};
  const notifications = {};
  for (const uid of done.alliance.members) {
    memberships[uid] = { allianceId: alliance.id, allianceResearch: __spreadValues({}, (_b = done.alliance.research) != null ? _b : {}) };
    notifications[uid] = [note("Recherche d'alliance termin\xE9e", `${(_c = def2 == null ? void 0 : def2.emoji) != null ? _c : ""} ${label2} : le bonus s'applique \xE0 tous les membres.`.trim(), now)];
  }
  return {
    alliance: done.alliance,
    memberships,
    notifications,
    logs: [{ kind: "research-done", actorUid: "", actorPseudo: "", text: label2, createdAtMs: now }]
  };
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
  missionRareLevelDivisor: 35
};
var COMMON_RESOURCES2 = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => r.id);
function getFleetUpkeep(units, techLevels2) {
  let upkeep = 0;
  for (const [id, state] of Object.entries(units != null ? units : {})) {
    const def2 = findUnit(id);
    if (!def2 || !(state == null ? void 0 : state.count)) continue;
    const perPlace = def2.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense;
    upkeep += state.count * def2.hangarSpace * perPlace;
  }
  return upkeep * techReductionFactor(techLevels2, "fleet_upkeep");
}
function boostedRates(input, multipliers) {
  var _a, _b;
  const gross = getProductionRatesPerSecond(input.buildings, input.techLevels);
  const alliance = allianceProductionFactor(input.allianceResearch);
  if (alliance !== 1) for (const res of Object.keys(gross)) gross[res] = ((_a = gross[res]) != null ? _a : 0) * alliance;
  for (const [res, m] of Object.entries(multipliers)) {
    if (gross[res] && m) gross[res] = ((_b = gross[res]) != null ? _b : 0) * m;
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
  for (const cut of [...eventBoundaries(startMs, endMs), endMs]) {
    resources = advanceSegment(__spreadProps(__spreadValues({}, input), { resources }), (cut - at) / 1e3, productionMultipliers(at));
    at = cut;
  }
  return resources;
}
function advanceSegment(input, elapsedSeconds, multipliers) {
  var _a, _b, _c, _d;
  const out = __spreadValues({}, input.resources);
  if (elapsedSeconds <= 0) return out;
  const gross = boostedRates(input, multipliers);
  const upkeep = getFleetUpkeep(input.units, input.techLevels);
  const capacity = getStorageCapacity(input.buildings, input.techLevels);
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
function protectedAmount(buildings, res, techLevels2) {
  if (!COMMON_RESOURCES2.includes(res)) return 0;
  const capacity = getStorageCapacity(buildings, techLevels2);
  const pct4 = Math.min(TECH_REDUCTION_CAP, ECONOMY_RULES.protectedStoragePct + techBonus(techLevels2, "protected_storage"));
  return Number.isFinite(capacity) ? Math.floor(capacity * pct4) : 0;
}
function missionRewards(mission, player) {
  var _a;
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const levels = BUILDINGS.reduce((sum3, b) => sum3 + effectiveBuildingLevel(player.buildings, b.id), 0);
  const rareScale = 1 + levels / Math.max(1, ECONOMY_RULES.missionRareLevelDivisor);
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
  const [year, month] = seasonId.split("-").map(Number);
  return `${(_a = SEASON_MONTHS[(month != null ? month : 1) - 1]) != null ? _a : "?"} ${year != null ? year : ""}`.trim();
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
  const levels = BUILDINGS.reduce((sum3, b) => sum3 + effectiveBuildingLevel(player.buildings, b.id), 0);
  return 1 + levels / 35;
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
  for (const def2 of defs) MISSIONS[def2.key] = def2;
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
  const pct4 = faction.raid.basePct + faction.raid.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, targetPower(faction, player) * pct4));
}
function exposedStock(player) {
  var _a, _b, _c;
  const out = {};
  for (const res of COMMON_RESOURCES2) out[res] = Math.max(0, ((_b = (_a = player.resources) == null ? void 0 : _a[res]) != null ? _b : 0) - protectedAmount((_c = player.buildings) != null ? _c : {}, res, player.techLevels));
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
    defenderRepairPct: getRepairPercent(player.buildings),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
    defenderResources: {},
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    homeFleetFactor: posture.homeFleetFactor,
    defenseFactor: posture.defenseFactor
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
      const exposed = Math.max(0, ((_e = player.resources[res]) != null ? _e : 0) - protectedAmount(player.buildings, res, player.techLevels));
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
  const combat = resolveCombat(__spreadProps(__spreadValues({}, formationEffects(formation)), {
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: getRepairPercent(player.buildings),
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
var buildingLevels = (p) => BUILDINGS.map((b) => {
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
  const elapsedSeconds = Math.max(0, (now - (player.resourcesUpdatedAtMs || now)) / 1e3);
  player.resources = advanceResources(player, elapsedSeconds, now - elapsedSeconds * 1e3);
  ensureContracts(player, now);
  player.resourcesUpdatedAtMs = now;
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);
  for (const buildingId of Object.keys(queues.buildingUpgrades)) {
    const entry = queues.buildingUpgrades[buildingId];
    if (!entry || entry.endTime > now) continue;
    const def2 = findBuilding(buildingId);
    if (def2) {
      player.buildings[buildingId].level += 1;
      notifications.push({
        kind: "building",
        title: "Construction termin\xE9e",
        message: `${def2.name} a atteint le niveau ${player.buildings[buildingId].level}.`,
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

// src/game/pvp.ts
var PVP_RULES = {
  /** Délai minimal entre deux attaques d'un même joueur sur la même cible. */
  attackCooldownMs: 2 * 60 * 60 * 1e3,
  /** Bouclier : plus personne ne peut attaquer un joueur battu en défense. */
  shieldAfterDefeatMs: 60 * 60 * 1e3,
  /** Protection débutant (levée dès que le joueur attaque lui-même). */
  newbieProtectionMs: 72 * 60 * 60 * 1e3,
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
  const def2 = Math.max(defenderPower, 0);
  if (outcome === "attacker_win") {
    const ratio = att > 0 ? def2 / att : 0;
    return {
      attackerXp: Math.round(40 * clamp2(ratio, 0.1, 2)),
      defenderXp: -Math.round(clamp2(20 * ratio, 5, 20))
    };
  }
  if (outcome === "defender_win") {
    const ratio = def2 > 0 ? att / def2 : 0;
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
  if (ctx.lastDefenderDefeatMs !== null) {
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
  if (ctx.lastAttackOnTargetMs !== null) {
    const until = ctx.lastAttackOnTargetMs + PVP_RULES.attackCooldownMs;
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

// src/game/attack.ts
function performAttack(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B;
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
    lastDefenderDefeatMs: (_d = defender.lastDefeatAtMs) != null ? _d : null
  });
  if (!check.allowed) return { ok: false, message: (_e = check.message) != null ? _e : "Attaque impossible." };
  const fleet = {};
  for (const [unitId, raw] of Object.entries((_f = input.fleet) != null ? _f : {})) {
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
      const state = (_g = attacker.units[unitId]) != null ? _g : { level: 1, count: 0 };
      attacker.units[unitId] = __spreadProps(__spreadValues({}, state), { count: state.count + qty });
    }
  }
  for (const [unitId, qty] of Object.entries(fleet)) {
    if (((_i = (_h = attacker.units[unitId]) == null ? void 0 : _h.count) != null ? _i : 0) < qty) {
      return { ok: false, message: "Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte." };
    }
  }
  const flushedDefender = flushState(__spreadProps(__spreadValues({}, defender), { buildings: withMissingBuildings(defender.buildings, defender.resources) }), input.defenderQueues, now);
  const def2 = flushedDefender.player;
  const posture = postureEffects((_j = def2.posture) == null ? void 0 : _j.id);
  const combat = resolveCombat(__spreadProps(__spreadValues({}, formationEffects(input.formation)), {
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    lootMultiplier: lootFactor(now),
    garrisons: (_k = input.garrisons) != null ? _k : [],
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: getRepairPercent(attacker.buildings),
    fleet,
    defenderUnits: (_l = def2.units) != null ? _l : {},
    defenderTechLevels: (_m = def2.techLevels) != null ? _m : {},
    defenderRepairPct: getRepairPercent(def2.buildings),
    defenderShieldPct: getShieldPercent(def2.buildings, allianceShieldBonus(def2.allianceResearch)),
    // Le bunker de l'entrepôt met une partie du stock à l'abri du pillage.
    defenderResources: Object.fromEntries(
      Object.entries((_n = def2.resources) != null ? _n : {}).map(([res, amount2]) => [res, Math.max(0, (amount2 != null ? amount2 : 0) - protectedAmount(def2.buildings, res, def2.techLevels))])
    )
  }));
  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  const survivors = {};
  for (const [unitId, qty] of Object.entries(fleet)) survivors[unitId] = Math.max(0, qty - ((_o = combat.attackerLosses[unitId]) != null ? _o : 0));
  if (input.inFlight) {
    for (const [unitId, qty] of Object.entries(survivors)) {
      if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - qty);
    }
  }
  for (const [res, amt] of Object.entries((_p = combat.loot) != null ? _p : {})) {
    if (!input.inFlight) {
      attacker.resources[res] = ((_q = attacker.resources[res]) != null ? _q : 0) + (amt != null ? amt : 0);
      bumpStat(attacker, "loot", amt != null ? amt : 0);
    }
    def2.resources[res] = Math.max(0, ((_r = def2.resources[res]) != null ? _r : 0) - (amt != null ? amt : 0));
  }
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def2.units[unitId]) def2.units[unitId].count = Math.max(0, def2.units[unitId].count - lost);
  }
  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") {
    if (attacker.lastDefeatAtMs && now - attacker.lastDefeatAtMs <= 36e5) setStat(attacker, "phoenix", 1);
    attacker.victories = ((_s = attacker.victories) != null ? _s : 0) + 1;
  } else if (combat.outcome === "defender_win") attacker.defeats = ((_t = attacker.defeats) != null ? _t : 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  attacker.lastAttackAtMs = now;
  if (combat.outcome === "defender_win") def2.victories = ((_u = def2.victories) != null ? _u : 0) + 1;
  else if (combat.outcome === "attacker_win") {
    def2.defeats = ((_v = def2.defeats) != null ? _v : 0) + 1;
    def2.lastDefeatAtMs = now;
  }
  applyXpDelta(def2, defenderXpDelta, now);
  if (combat.outcome === "attacker_win") recordContract(attacker, "win_attack", 1, now);
  if (combat.outcome === "defender_win") recordContract(def2, "win_defense", 1, now);
  const outcomeTitle = {
    attacker_win: "Victoire !",
    defender_win: "D\xE9faite\u2026",
    draw: "Match nul"
  };
  const notifications = [
    ...flushed.notifications,
    {
      kind: "combat-attacker",
      title: (_w = outcomeTitle[combat.outcome]) != null ? _w : "Rapport de combat",
      message: `Attaque contre ${defender.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).`,
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
      title: (_x = defenderTitle[combat.outcome]) != null ? _x : "Rapport de combat",
      message: `Attaque de ${input.attacker.pseudo}${defenderXpDelta ? ` (${defenderXpDelta > 0 ? "+" : ""}${defenderXpDelta} XP)` : ""}.`,
      createdAtMs: now,
      read: false
    }
  ];
  const report = {
    attackerUid,
    attackerPseudo: input.attacker.pseudo,
    defenderUid,
    defenderPseudo: defender.pseudo,
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
    garrisons: ((_y = input.garrisons) != null ? _y : []).map((g, i) => {
      var _a2, _b2;
      return { ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: (_b2 = (_a2 = combat.garrisonLosses) == null ? void 0 : _a2[i]) != null ? _b2 : {} };
    }),
    attackerFleet: fleet
  };
  return {
    ok: true,
    attacker,
    attackerQueues: flushed.queues,
    notifications,
    defender: def2,
    defenderQueues: flushedDefender.queues,
    defenderNotifications,
    report,
    combat,
    survivors,
    loot: (_z = combat.loot) != null ? _z : {},
    debris: debrisFromLosses([combat.attackerLosses, combat.defenderLosses, ...(_A = combat.garrisonLosses) != null ? _A : []], (_B = eventDebrisPercent(now)) != null ? _B : DEBRIS_RULES.percent)
  };
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
  return { claimed: Array.isArray(raw == null ? void 0 : raw.claimed) ? raw.claimed.filter((c) => typeof c === "string") : [], hidden: (raw == null ? void 0 : raw.hidden) === true };
}
function onboardingEligible(p) {
  var _a;
  const st = onboardingState(p);
  if (st.claimed.length >= ONBOARDING_STEPS.length) return false;
  return st.claimed.length > 0 || ((_a = p.xp) != null ? _a : 0) < onboardingRankXp();
}
function claimOnboarding(player, stepId) {
  var _a, _b, _c;
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
  player.onboarding = __spreadProps(__spreadValues({}, st), { claimed: [...st.claimed, step.id] });
  return step.reward;
}
function setOnboardingHidden(player, hidden) {
  player.onboarding = __spreadProps(__spreadValues({}, onboardingState(player)), { hidden });
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
function applyAction(s, action) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  const { player, queues, now } = s;
  switch (action == null ? void 0 : action.type) {
    case "sync": {
      const elapsedMs = Math.max(0, now - (s.preFlushPlayer.resourcesUpdatedAtMs || now));
      const playtime = Math.min(Math.max(0, Number(action.playtimeDeltaSeconds) || 0), elapsedMs / 1e3 + 5, 300);
      player.playtimeSeconds = (player.playtimeSeconds || 0) + Math.floor(playtime);
      const resourceGains = {};
      for (const key of Object.keys(player.resources)) {
        const delta = ((_a = player.resources[key]) != null ? _a : 0) - ((_b = s.preFlushPlayer.resources[key]) != null ? _b : 0);
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
      const def2 = findBuilding(action.buildingId);
      const state = player.buildings[action.buildingId];
      if (!def2 || !state) throw new GameActionError("B\xE2timent inconnu.");
      if (!state.unlocked && !def2.startsUnlocked) throw new GameActionError("Ce b\xE2timent n'est pas d\xE9bloqu\xE9.");
      if (queues.buildingUpgrades[def2.id]) throw new GameActionError("Am\xE9lioration d\xE9j\xE0 en cours.");
      if (state.level >= def2.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      const nextLevel = state.level + 1;
      pay(player, applyBuildingDiscount(getBuildingUpgradeCost(def2, nextLevel), (_d = (_c = player.bonuses) == null ? void 0 : _c.buildingUpgradeDiscount) != null ? _d : 0), now);
      queues.buildingUpgrades[def2.id] = { endTime: now + Math.round(getBuildingUpgradeTime(def2, nextLevel) * buildTimeFactor(now) * techReductionFactor(player.techLevels, "building_time")) * 1e3 };
      recordContract(player, "upgrade_building", 1, now);
      return void 0;
    }
    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unit\xE9 invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantit\xE9"), MAX_QTY);
      if (((_f = (_e = player.units[unit.id]) == null ? void 0 : _e.level) != null ? _f : 0) <= 0) throw new GameActionError("Cette unit\xE9 doit d'abord \xEAtre d\xE9bloqu\xE9e via le Labo.");
      const category = unit.category;
      const built = Object.entries(player.units).reduce((sum3, [id, u]) => {
        const def2 = findUnit(id);
        return (def2 == null ? void 0 : def2.category) === category ? sum3 + u.count * def2.hangarSpace : sum3;
      }, 0);
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
      if (((_h = (_g = player.units[unit.id]) == null ? void 0 : _g.count) != null ? _h : 0) < qty) throw new GameActionError("Tu n'as pas assez d'unit\xE9s \xE0 vendre.");
      player.units[unit.id].count -= qty;
      player.resources.scrap += Math.floor(unit.cost.scrap * 0.5) * qty;
      player.resources.energy += Math.floor(unit.cost.energy * 0.5) * qty;
      return void 0;
    }
    case "research": {
      const tech = findTech(action.techId);
      if (!tech) throw new GameActionError("Technologie inconnue.");
      const nextLevel = ((_i = player.techLevels[tech.id]) != null ? _i : 0) + 1;
      if (nextLevel > tech.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      if (!checkPrereqs(tech, player.techLevels).valid) throw new GameActionError("Pr\xE9requis non remplis.");
      if (queues.activeResearches.some((r) => r.id === tech.id)) throw new GameActionError("Cette technologie est d\xE9j\xE0 en cours de recherche.");
      if (queues.activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        throw new GameActionError(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
      }
      pay(player, getTechCost(tech, nextLevel), now);
      queues.activeResearches.push({ id: tech.id, endTime: now + Math.round(getTechTime(tech, nextLevel) * researchTimeFactor(now) * techReductionFactor(player.techLevels, "research_time")) * 1e3 });
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
      if (((_j = player.resources[sellId]) != null ? _j : 0) < amount2) throw new GameActionError("Pas assez de ressources \xE0 \xE9changer.");
      const gained = Math.floor(amount2 * getTradeRate(sellId, buyId));
      player.resources[sellId] -= amount2;
      player.resources[buyId] = ((_k = player.resources[buyId]) != null ? _k : 0) + gained;
      bumpStat(player, "traded", amount2);
      return gained;
    }
    case "claimContract": {
      const claimed = claimContract(player, String((_l = action.contractId) != null ? _l : ""), now);
      bumpStat(player, "contracts");
      return claimed;
    }
    case "rerollContract":
      return rerollContract(player, String((_m = action.contractId) != null ? _m : ""), now);
    case "setTitle":
      setActiveTitle(player, String((_n = action.title) != null ? _n : ""));
      return player.activeTitle;
    case "claimOnboarding":
      return claimOnboarding(player, String((_o = action.stepId) != null ? _o : ""));
    case "setPosture":
      return setPosture(player, action.posture, now);
    case "hideOnboarding":
      setOnboardingHidden(player, action.hidden === true);
      return player.onboarding;
    default:
      throw new GameActionError("Action inconnue.");
  }
}
function performPlayerAction(playerIn, queuesIn, action, now) {
  const preFlushPlayer = __spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) });
  const flushed = flushState(preFlushPlayer, queuesIn, now);
  const result = applyAction(
    { player: flushed.player, queues: flushed.queues, preFlushPlayer, flushNotifications: flushed.notifications, now },
    action
  );
  return { player: flushed.player, queues: flushed.queues, notifications: flushed.notifications, result };
}
function performGift(sender, senderQueues, recipient, recipientQueues, rawResources, now) {
  var _a;
  if (sender.uid === recipient.uid) throw new GameActionError("Tu ne peux pas t'envoyer des ressources \xE0 toi-m\xEAme !");
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
var HOUR2 = 36e5;
var DAY2 = 24 * HOUR2;
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
var pct3 = (n, total2) => total2 > 0 ? Math.round(n / total2 * 1e3) / 10 : 0;
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
  const lastSeen = (p) => {
    var _a;
    return (_a = p.resourcesUpdatedAtMs) != null ? _a : 0;
  };
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
      unlockedPct: pct3(levels.filter((l) => l > 0).length, n),
      maxedPct: pct3(levels.filter((l) => l >= b.maxLevel).length, n)
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
      researchedPct: pct3(levels.filter((l) => l > 0).length, n),
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
      ownersPct: pct3(owned.filter((s) => {
        var _a;
        return ((_a = s == null ? void 0 : s.count) != null ? _a : 0) > 0;
      }).length, n),
      unlockedPct: pct3(owned.filter((s) => {
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
  const since = now - windowDays * DAY2;
  const recent = reports.filter((r) => {
    var _a;
    return ((_a = r.timestamp) != null ? _a : 0) >= since;
  });
  const outcomes = { attacker_win: 0, defender_win: 0, draw: 0 };
  recent.forEach((r) => {
    if (r.outcome in outcomes) outcomes[r.outcome]++;
  });
  const perDay = Array.from({ length: windowDays }, (_, i) => {
    const start = now - (windowDays - i) * DAY2;
    const d = new Date(start + DAY2);
    return {
      day: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      count: recent.filter((r) => r.timestamp >= start && r.timestamp < start + DAY2).length
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
      active24h: players.filter((p) => now - lastSeen(p) < DAY2).length,
      active7d: players.filter((p) => now - lastSeen(p) < 7 * DAY2).length,
      new7d: players.filter((p) => {
        var _a;
        return now - ((_a = p.createdAtMs) != null ? _a : 0) < 7 * DAY2;
      }).length,
      medianPlaytimeHours: round1(median(players.map((p) => {
        var _a;
        return ((_a = p.playtimeSeconds) != null ? _a : 0) / 3600;
      }))),
      ranks: [...families.entries()].map(([label2, count2]) => ({ label: label2, count: count2 })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label)),
      medianXp: median(players.map((p) => {
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
          median: Math.floor(median(amounts)),
          total: Math.floor(amounts.reduce((a, v) => a + v, 0)),
          medianRate: round1(median(rates.map((rt) => {
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
    insights: []
  };
  stats.insights = computeInsights(stats);
  return stats;
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
  const seen = (p) => {
    var _a2;
    return (_a2 = p.resourcesUpdatedAtMs) != null ? _a2 : 0;
  };
  const days = (ms) => Math.floor(ms / DAY2);
  const since = now - windowDays * DAY2;
  const recent = reports.filter((r) => {
    var _a2;
    return ((_a2 = r.timestamp) != null ? _a2 : 0) >= since;
  });
  const dormant = players.filter((p) => now - seen(p) >= 3 * DAY2 && now - seen(p) < 30 * DAY2).map((p) => ({ pseudo: p.pseudo, days: days(now - seen(p)) })).sort((a, b) => a.days - b.days);
  const byFamily = /* @__PURE__ */ new Map();
  players.forEach((p) => {
    var _a2, _b2;
    if (!p.createdAtMs) return;
    const family = getRank((_a2 = p.xp) != null ? _a2 : 0).family;
    byFamily.set(family, [...(_b2 = byFamily.get(family)) != null ? _b2 : [], (now - p.createdAtMs) / DAY2]);
  });
  const rankAge = [...byFamily.entries()].map(([label2, ages]) => ({ label: label2, players: ages.length, medianDays: round1(median(ages)) })).sort((a, b) => familyIndex(a.label) - familyIndex(b.label));
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
    return { id, name: (_b2 = (_a2 = UNITS.find((u) => u.id === id)) == null ? void 0 : _a2.name) != null ? _b2 : id, attacks: v.attacks, winPct: pct3(v.wins, v.attacks) };
  }).sort((a, b) => b.attacks - a.attacks);
  const factions2 = FACTIONS.map((f) => {
    const raids = recent.filter((r) => r.attackerUid === PIRATE_OWNER_UID && r.attackerPseudo.includes(f.name));
    const lairs = recent.filter((r) => r.defenderUid && factionOfLair(r.defenderUid) === f.id);
    return {
      id: f.id,
      name: f.name,
      raids: raids.length,
      repelledPct: pct3(raids.filter((r) => r.outcome !== "attacker_win").length, raids.length),
      lairAssaults: lairs.length,
      lairWinPct: pct3(lairs.filter((r) => r.outcome === "attacker_win").length, lairs.length)
    };
  });
  const active = players.filter((p) => now - seen(p) < 7 * DAY2);
  const productionPerHour = Math.round(active.reduce((a, p) => {
    var _a2, _b2;
    return a + sumValues(getProductionRatesPerSecond((_a2 = p.buildings) != null ? _a2 : {}, (_b2 = p.techLevels) != null ? _b2 : {})) * 3600;
  }, 0));
  const anomalies = [];
  for (const r of RESOURCE_LIST) {
    for (const p of players) {
      const amount2 = (_b = (_a = p.resources) == null ? void 0 : _a[r.id]) != null ? _b : 0;
      if (amount2 < 1e6) continue;
      const others = median(players.filter((o) => o !== p).map((o) => {
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
      active1d: players.filter((p) => now - seen(p) < DAY2).length,
      active7d: active.length,
      active30d: players.filter((p) => now - seen(p) < 30 * DAY2).length,
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
  const combat = resolveCombat(__spreadProps(__spreadValues({}, formationEffects(fleet.expedition.formation)), {
    attackerUnits: player.units,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: getRepairPercent(player.buildings),
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
    const pct4 = between(R.wreckMinPct, R.wreckMaxPct, random);
    const found = {};
    for (const [id, n] of Object.entries(fleet.units)) {
      const extra = Math.floor(n * pct4);
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
function finishExpedition(player, fleet, now) {
  var _a;
  const xp = Math.round(fleet.expedition.hours * EXPEDITION_RULES.xpPerHour);
  applyXpDelta(player, xp, now);
  bumpStat(player, "expeditions");
  return {
    kind: "fleet",
    title: "Exp\xE9dition termin\xE9e",
    message: `Ta flotte est rentr\xE9e : ${describeGain((_a = fleet.loot) != null ? _a : {})} et +${xp} XP.`,
    createdAtMs: now,
    read: false
  };
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
var HOUR3 = 36e5;
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
    titleHolder: r.titleHolder && r.titleHolder.uid ? r.titleHolder : null
  };
}
function leviathanWindow(now) {
  if (!EVENT_RULES.bossMonthly) return null;
  const w = weekendWindow(now);
  if (!w.firstOfMonth) return null;
  const endMs = w.startMs + LEVIATHAN_RULES.durationHours * HOUR3;
  if (now < w.startMs || now >= endMs) return null;
  return { id: `lev-${w.startMs}`, startMs: w.startMs, endMs };
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
  return __spreadProps(__spreadValues({}, window), { maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: (_a = previous == null ? void 0 : previous.titleHolder) != null ? _a : null });
}
function checkLeviathanLaunch(state, uid, pseudo, now) {
  var _a, _b;
  if (!state || !isActive(state, now)) throw new GameActionError("Le L\xE9viathan n'est pas l\xE0 en ce moment.");
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * HOUR3 - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 6e4)} min.`);
  return __spreadProps(__spreadValues({}, state), { contributions: __spreadProps(__spreadValues({}, state.contributions), { [uid]: { pseudo, damage: (_a = c == null ? void 0 : c.damage) != null ? _a : 0, assaults: (_b = c == null ? void 0 : c.assaults) != null ? _b : 0, lastLaunchMs: now } }) });
}
function resolveLeviathanAssault(state, player, fleet, formation, now) {
  var _a;
  const fx = formationEffects(formation);
  const power = Math.round(computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor);
  const active = isActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = getRepairPercent(player.buildings);
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
function grantLeviathanReward(state, player) {
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
  return Math.max(0, Number((_b = player.techLevels) == null ? void 0 : _b[tech]) || 0);
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
  var _a, _b;
  const { now, probes } = input;
  const spy = flushState(__spreadProps(__spreadValues({}, input.spy), { buildings: withMissingBuildings(input.spy.buildings, input.spy.resources) }), input.spyQueues, now).player;
  const flushed = flushState(__spreadProps(__spreadValues({}, input.target), { buildings: withMissingBuildings(input.target.buildings, input.target.resources) }), input.targetQueues, now);
  const target = flushed.player;
  const level3 = espionageLevel(spy);
  const counter = counterEspionage(target);
  const score = spyScore(level3, counter, probes);
  const tier = spyTier(score);
  const detected = ((_a = input.random) != null ? _a : Math.random)() < detectionChance(level3, counter);
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
    data: buildSpyReportData(target, flushed.queues, input.targetFleets, tier, now, (_b = input.targetGarrisons) != null ? _b : [])
  };
  const spyNotifications = [
    {
      kind: "spy",
      title: detected ? "Sondes rep\xE9r\xE9es et abattues" : "Rapport d'espionnage re\xE7u",
      message: `${target.pseudo} : ${SPY_TIER_LABELS[tier].toLowerCase()}${detected ? ". Tes sondes n'ont pas surv\xE9cu." : "."}`,
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

// src/game/fleets.ts
var FLEET_RULES = {
  /** Durée fixe de tout trajet (décollage, approche), en minutes. */
  baseMinutes: 5,
  /** Minutes par unité de distance, divisées par la vitesse de la flotte. */
  minutesPerDistance: 3,
  /** Côté de la carte de la galaxie (distance max ≈ 141). */
  mapSize: 100
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
    const def2 = findUnit(id);
    const speed = ((_a = def2 == null ? void 0 : def2.stats.vitesse) != null ? _a : 0) * Math.max(1, (_c = (_b = units[id]) == null ? void 0 : _b.level) != null ? _c : 1);
    slowest = Math.min(slowest, Math.max(1, speed));
  }
  return Number.isFinite(slowest) ? slowest : 1;
}
function travelSeconds(distance, speed, factor = 1) {
  return Math.round(factor * (FLEET_RULES.baseMinutes + distance * FLEET_RULES.minutesPerDistance / Math.max(1, speed)) * 60);
}
function launchFleet(input) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
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
    lastDefenderDefeatMs: (_d = defender.lastDefeatAtMs) != null ? _d : null
  });
  if (!check.allowed) throw new GameActionError((_e = check.message) != null ? _e : "Attaque impossible.");
  const units = {};
  for (const [unitId, raw] of Object.entries((_f = input.fleet) != null ? _f : {})) {
    const qty = Math.floor(Number(raw));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) throw new GameActionError("Seules les unit\xE9s d'attaque peuvent \xEAtre envoy\xE9es.");
    if (((_h = (_g = attacker.units[unitId]) == null ? void 0 : _g.count) != null ? _h : 0) < qty) throw new GameActionError("Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte.");
    units[unitId] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("S\xE9lectionne au moins une unit\xE9 \xE0 envoyer.");
  const speed = fleetSpeed(attacker.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(attacker.uid, defender.uid), speed, allianceFlightFactor(attacker.allianceResearch, attacker.techLevels)) * 1e3;
  for (const [unitId, qty] of Object.entries(units)) attacker.units[unitId].count -= qty;
  attacker.lastAttackAtMs = now;
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
  if (fleet.mission === "expedition" || fleet.mission === "leviathan") throw new GameActionError("Cette flotte ne peut pas \xEAtre rappel\xE9e.");
  if (fleet.status !== "outbound") throw new GameActionError("Cette flotte ne peut plus \xEAtre rappel\xE9e.");
  if (now >= fleet.arriveAtMs) throw new GameActionError("Trop tard : la flotte est d\xE9j\xE0 au contact.");
  return __spreadProps(__spreadValues({}, fleet), { status: "returning", recalled: true, returnAtMs: now + (now - fleet.departAtMs) });
}
function completeFleetReturn(owner, fleet, now) {
  var _a, _b, _c, _d, _e, _f;
  for (const [unitId, qty] of Object.entries((_a = fleet.units) != null ? _a : {})) {
    if (!(qty > 0)) continue;
    const state = (_b = owner.units[unitId]) != null ? _b : { level: 1, count: 0 };
    owner.units[unitId] = __spreadProps(__spreadValues({}, state), { count: state.count + qty });
  }
  for (const [res, amount2] of Object.entries((_c = fleet.loot) != null ? _c : {})) {
    owner.resources[res] = ((_d = owner.resources[res]) != null ? _d : 0) + (amount2 != null ? amount2 : 0);
  }
  const lootTotal = Object.values((_e = fleet.loot) != null ? _e : {}).reduce((a, b) => a + (b != null ? b : 0), 0);
  if (fleet.mission === "recycle") bumpStat(owner, "recycled", lootTotal);
  else if (((_f = fleet.mission) != null ? _f : "attack") === "attack") bumpStat(owner, "loot", lootTotal);
  return { owner, notifications: [__spreadProps(__spreadValues({ kind: "fleet" }, returnMessage(fleet, lootTotal)), { createdAtMs: now, read: false })] };
}
function returnMessage(fleet, lootTotal) {
  switch (fleet.mission) {
    case "patrol":
      return { title: "Patrouille termin\xE9e", message: "Ta flotte en patrouille est rentr\xE9e \xE0 la base." };
    case "expedition":
      return { title: "Exp\xE9dition termin\xE9e", message: "Ta flotte d'exp\xE9dition est rentr\xE9e \xE0 la base." };
    case "leviathan":
      return { title: "Retour du L\xE9viathan", message: "Les survivants de l'assaut sur le L\xE9viathan sont rentr\xE9s." };
    case "lair":
      return { title: "Retour du repaire", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentr\xE9s.` };
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const mission = (_a = req.mission) != null ? _a : "attack";
  const { now, target } = req;
  if ((mission === "attack" || mission === "spy") && !target) throw new GameActionError("Ce joueur est introuvable.");
  if (mission === "attack" && req.owner.uid === target.uid) throw new GameActionError("Tu ne peux pas t'attaquer toi-m\xEAme !");
  if (mission === "spy" && req.owner.uid === target.uid) throw new GameActionError("Tu ne peux pas t'espionner toi-m\xEAme.");
  if (mission === "garrison" && !target) throw new GameActionError("Ce joueur est introuvable.");
  const flushed = flushState(__spreadProps(__spreadValues({}, req.owner), { buildings: withMissingBuildings(req.owner.buildings, req.owner.resources) }), req.ownerQueues, now);
  const owner = flushed.player;
  let out;
  if (mission === "attack") out = launchFleet({ now, attacker: owner, defender: target, fleet: req.fleet, lastAttackOnTargetMs: (_b = req.lastAttackOnTargetMs) != null ? _b : null });
  else if (mission === "spy") out = launchSpy(owner, target, req.fleet, now);
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
  } else throw new GameActionError("Mission inconnue.");
  const counter = { spy: "spies", patrol: "patrols", garrison: "garrisons" }[mission];
  if (counter) bumpStat(out.attacker, counter);
  return __spreadProps(__spreadValues({}, out), { attackerQueues: flushed.queues, attackerNotifications: flushed.notifications });
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
  "posture"
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
var CONTENT_SECTIONS = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules"];
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
function defaultGameContent() {
  return structuredClone({
    buildings: DEFAULT_BUILDINGS,
    units: DEFAULT_UNITS,
    technologies: DEFAULT_TECHNOLOGIES,
    missions: Object.values(DEFAULT_MISSIONS),
    factions: DEFAULT_FACTIONS,
    ranks: DEFAULT_RANKS,
    achievements: DEFAULT_ACHIEVEMENTS,
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES }
  });
}
var current = defaultGameContent();
function applyGameContent(overrides) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L;
  const defaults = defaultGameContent();
  const content = {
    buildings: (_a = overrides.buildings) != null ? _a : defaults.buildings,
    units: (_b = overrides.units) != null ? _b : defaults.units,
    technologies: (_c = overrides.technologies) != null ? _c : defaults.technologies,
    missions: (_d = overrides.missions) != null ? _d : defaults.missions,
    factions: (_e = overrides.factions) != null ? _e : defaults.factions,
    ranks: (_f = overrides.ranks) != null ? _f : defaults.ranks,
    achievements: (_g = overrides.achievements) != null ? _g : defaults.achievements,
    rules: {
      pvp: __spreadValues(__spreadValues({}, defaults.rules.pvp), (_i = (_h = overrides.rules) == null ? void 0 : _h.pvp) != null ? _i : {}),
      combat: __spreadValues(__spreadValues({}, defaults.rules.combat), (_k = (_j = overrides.rules) == null ? void 0 : _j.combat) != null ? _k : {}),
      economy: __spreadValues(__spreadValues({}, defaults.rules.economy), (_m = (_l = overrides.rules) == null ? void 0 : _l.economy) != null ? _m : {}),
      fleets: __spreadValues(__spreadValues({}, defaults.rules.fleets), (_o = (_n = overrides.rules) == null ? void 0 : _n.fleets) != null ? _o : {}),
      spy: __spreadValues(__spreadValues({}, defaults.rules.spy), (_q = (_p = overrides.rules) == null ? void 0 : _p.spy) != null ? _q : {}),
      debris: __spreadValues(__spreadValues({}, defaults.rules.debris), (_s = (_r = overrides.rules) == null ? void 0 : _r.debris) != null ? _s : {}),
      patrol: __spreadValues(__spreadValues({}, defaults.rules.patrol), (_u = (_t = overrides.rules) == null ? void 0 : _t.patrol) != null ? _u : {}),
      events: __spreadValues(__spreadValues({}, defaults.rules.events), (_w = (_v = overrides.rules) == null ? void 0 : _v.events) != null ? _w : {}),
      seasons: __spreadValues(__spreadValues({}, defaults.rules.seasons), (_y = (_x = overrides.rules) == null ? void 0 : _x.seasons) != null ? _y : {}),
      alliances: __spreadValues(__spreadValues({}, defaults.rules.alliances), (_A = (_z = overrides.rules) == null ? void 0 : _z.alliances) != null ? _A : {}),
      pirates: __spreadValues(__spreadValues({}, defaults.rules.pirates), (_C = (_B = overrides.rules) == null ? void 0 : _B.pirates) != null ? _C : {}),
      market: __spreadValues(__spreadValues({}, defaults.rules.market), (_E = (_D = overrides.rules) == null ? void 0 : _D.market) != null ? _E : {}),
      expeditions: __spreadProps(__spreadValues(__spreadValues({}, defaults.rules.expeditions), (_G = (_F = overrides.rules) == null ? void 0 : _F.expeditions) != null ? _G : {}), {
        weights: __spreadValues(__spreadValues({}, defaults.rules.expeditions.weights), (_J = (_I = (_H = overrides.rules) == null ? void 0 : _H.expeditions) == null ? void 0 : _I.weights) != null ? _J : {})
      }),
      leviathan: __spreadValues(__spreadValues({}, defaults.rules.leviathan), (_L = (_K = overrides.rules) == null ? void 0 : _K.leviathan) != null ? _L : {})
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

// src/server/hooksEntry.ts
function flushPlayer(player, queues, now) {
  return flushState(__spreadProps(__spreadValues({}, player), { buildings: withMissingBuildings(player.buildings, player.resources) }), queues, now);
}
