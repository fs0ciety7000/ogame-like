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
  CONTENT_SECTIONS: () => CONTENT_SECTIONS,
  GAME_FIELDS: () => GAME_FIELDS,
  GameActionError: () => GameActionError,
  PVP_RULES: () => PVP_RULES,
  QUEUE_FIELDS: () => QUEUE_FIELDS,
  applyGameContent: () => applyGameContent,
  applyLegacyBattleReport: () => applyLegacyBattleReport,
  applyLegacyGift: () => applyLegacyGift,
  computeGameStats: () => computeGameStats,
  defaultQueues: () => defaultQueues,
  newPlayerProfile: () => newPlayerProfile,
  performAttack: () => performAttack,
  performGift: () => performGift,
  performPlayerAction: () => performPlayerAction
});
module.exports = __toCommonJS(hooksEntry_exports);

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
function getUnitBuildTime(unit) {
  if (unit.buildTime && unit.buildTime > 0) return unit.buildTime;
  const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  return Math.max(3, Math.ceil(total / 100));
}

// src/game/technologies.ts
var TECH_EFFECT_DEFAULTS = {
  energy_efficiency: 0.1,
  unit_attack: 0.1,
  unit_defense: 0.1,
  building_discount: 0.05
};
var DEFAULT_TECHNOLOGIES = [
  { id: "tech1", nom: "Analyse de mat\xE9riaux", desc: "D\xE9bloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Am\xE9lioration \xE9nerg\xE9tique", desc: "Augmente l'efficacit\xE9 des g\xE9n\xE9rateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone r\xE9cup\xE9rateur", desc: "D\xE9bloque le Drone r\xE9cup\xE9rateur, puis l'am\xE9liore : +5 attaque et +5 d\xE9fense par niveau.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
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
function techBonus(techLevels, effect) {
  var _a, _b, _c;
  let total = 0;
  for (const tech of TECHNOLOGIES) {
    if (tech.effect !== effect) continue;
    total += ((_a = techLevels[tech.id]) != null ? _a : 0) * ((_c = (_b = tech.effectValue) != null ? _b : TECH_EFFECT_DEFAULTS[effect]) != null ? _c : 0);
  }
  return total;
}
var MAX_CONCURRENT_RESEARCH = 4;
var COST_GROWTH = 2.7;
var TIME_GROWTH = 1.67;
function findTech(id) {
  return TECHNOLOGIES.find((t) => t.id === id);
}
function getTechCost(tech, level) {
  var _a;
  const growth = (_a = tech.costGrowth) != null ? _a : COST_GROWTH;
  const factor = Math.pow(growth, level - 1);
  const cost = {};
  for (const [res, amount] of Object.entries(tech.baseCost)) {
    cost[res] = Math.floor(amount * factor);
  }
  return cost;
}
function getTechTime(tech, level) {
  return Math.floor(tech.baseTime * Math.pow(TIME_GROWTH, level - 1));
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

// src/game/combat.ts
var COMBAT_RULES = {
  /** Part des ressources rares du défenseur pillée par un attaquant vainqueur. */
  lootPercent: 0.08,
  /** Part des ressources communes pillée (ferraille, énergie, nano, données). */
  lootPercentCommon: 0.1
};
var RARE_RESOURCES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
var COMMON_RESOURCES = ["scrap", "energy", "nano", "data"];
function fleetCargoCapacity(units, fleet) {
  var _a, _b, _c;
  let total = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const def = findUnit(id);
    const level = (_b = (_a = units[id]) == null ? void 0 : _a.level) != null ? _b : 0;
    if (!def || qty <= 0 || level <= 0) continue;
    total += ((_c = def.stats.cargo) != null ? _c : 0) * level * qty;
  }
  return total;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function unitStat(units, techLevels, unitId, stat) {
  var _a, _b, _c, _d;
  const base = (_b = (_a = UNIT_BASE_STATS[unitId]) == null ? void 0 : _a[stat]) != null ? _b : 0;
  const level = (_d = (_c = units[unitId]) == null ? void 0 : _c.level) != null ? _d : 0;
  if (level <= 0) return 0;
  let value = base + (level - 1) * 5;
  if (stat === "attack") value *= 1 + techBonus(techLevels, "unit_attack");
  if (stat === "defense") value *= 1 + techBonus(techLevels, "unit_defense");
  return value;
}
function computeFleetPower(units, techLevels, fleet, stats) {
  let total = 0;
  for (const id in fleet) {
    const qty = fleet[id];
    if (qty <= 0) continue;
    let value = 0;
    stats.forEach((s) => value += unitStat(units, techLevels, id, s));
    total += value * qty;
  }
  return total;
}
function computeFullPower(units, techLevels, idList, stats) {
  let total = 0;
  idList.forEach((id) => {
    var _a, _b;
    const count = (_b = (_a = units[id]) == null ? void 0 : _a.count) != null ? _b : 0;
    let value = 0;
    stats.forEach((s) => value += unitStat(units, techLevels, id, s));
    total += value * count;
  });
  return total;
}
function resolveCombat(params) {
  var _a, _b, _c, _d, _e;
  const { attackerUnits, attackerTechLevels, attackerRepairPct, fleet, defenderUnits, defenderTechLevels, defenderRepairPct, defenderResources } = params;
  const attackerPower = computeFleetPower(attackerUnits, attackerTechLevels, fleet, ["attack"]);
  const defenderPower = computeFullPower(defenderUnits, defenderTechLevels, DEFENSIVE_UNITS, ["attack", "defense"]);
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
  DEFENSIVE_UNITS.forEach((unitId) => {
    var _a2, _b2;
    const count = (_b2 = (_a2 = defenderUnits[unitId]) == null ? void 0 : _a2.count) != null ? _b2 : 0;
    const rawLost = Math.floor(count * defenderLossPct);
    const recovered = Math.floor(rawLost * defenderRepairPct);
    const effectiveLost = rawLost - recovered;
    if (rawLost > 0) {
      defenderLosses[unitId] = effectiveLost;
      defenderRecovered[unitId] = recovered;
    }
  });
  const survivors = {};
  for (const [unitId, sent] of Object.entries(fleet)) survivors[unitId] = Math.max(0, sent - ((_a = attackerLosses[unitId]) != null ? _a : 0));
  const cargoCapacity = fleetCargoCapacity(attackerUnits, survivors);
  let loot = null;
  if (outcome === "attacker_win") {
    const wanted = {};
    let total = 0;
    for (const res of [...COMMON_RESOURCES, ...RARE_RESOURCES]) {
      const pct2 = RARE_RESOURCES.includes(res) ? COMBAT_RULES.lootPercent : COMBAT_RULES.lootPercentCommon;
      const amount = Math.floor(Math.max(0, (_b = defenderResources[res]) != null ? _b : 0) * pct2);
      wanted[res] = amount;
      total += amount;
    }
    const ratio = total > cargoCapacity ? cargoCapacity / total : 1;
    loot = {};
    const entries = Object.entries(wanted);
    for (const [res, amount] of entries) loot[res] = Math.floor(amount * ratio);
    let left = Math.min(total, Math.floor(cargoCapacity)) - entries.reduce((s, [res]) => {
      var _a2;
      return s + ((_a2 = loot[res]) != null ? _a2 : 0);
    }, 0);
    const byRemainder = entries.map(([res, amount]) => ({ res, frac: amount * ratio - Math.floor(amount * ratio) })).sort((a, b) => b.frac - a.frac);
    for (const { res } of byRemainder) {
      if (left <= 0) break;
      if (((_c = loot[res]) != null ? _c : 0) < ((_d = wanted[res]) != null ? _d : 0)) {
        loot[res] = ((_e = loot[res]) != null ? _e : 0) + 1;
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
    cargoCapacity
  };
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
var PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500];
var EXTRACTOR_UPGRADE = {
  baseCost: { scrap: 50, energy: 20 },
  maxCost: { scrap: 25e5, energy: 18e5 },
  costFromLevel: 1,
  secondsPerLevel: 600
};
var HANGAR_UPGRADE = {
  baseCost: { scrap: 300, energy: 150 },
  maxCost: { scrap: 5e6, energy: 75e5 },
  costFromLevel: 1,
  secondsPerLevel: 900
};
var DEFAULT_BUILDINGS = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "R\xE9cup\xE8re automatiquement de la ferraille dans les d\xE9bris environnants.",
    image: "/assets/buildings/extracteur_ferraille.webp",
    maxLevel: 10,
    startsUnlocked: true,
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "scrap", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "reacteur_instable",
    name: "R\xE9acteur instable",
    description: "G\xE9n\xE8re de l'\xE9nergie brute, au prix d'une certaine instabilit\xE9.",
    image: "/assets/buildings/reacteur_instable.webp",
    maxLevel: 10,
    unlockCost: { scrap: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "energy", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synth\xE9tise des nanocomposants \xE0 partir de mati\xE8res recycl\xE9es.",
    image: "/assets/buildings/extracteur_nanocomposants.webp",
    maxLevel: 10,
    unlockCost: { energy: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "nano", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "archives_fracturees",
    name: "Archives fractur\xE9es",
    description: "Fouille des donn\xE9es anciennes dans des serveurs endommag\xE9s.",
    image: "/assets/buildings/archives_fracturees.webp",
    maxLevel: 10,
    unlockCost: { nano: 500 },
    upgrade: EXTRACTOR_UPGRADE,
    production: { resource: "data", perSecond: PRODUCTION_TABLE }
  },
  {
    id: "atelier_reparation",
    name: "Atelier de r\xE9paration",
    description: "R\xE9pare une partie des unit\xE9s perdues apr\xE8s chaque combat.",
    image: "/assets/buildings/atelier_reparation.webp",
    maxLevel: 10,
    unlockCost: { reinforcedSteel: 20, cyberModule: 20, syntheticNanites: 20, aiFragment: 20 },
    upgrade: {
      baseCost: { nano: 1e3, data: 1e3 },
      maxCost: { nano: 1e7, data: 95e5 },
      costFromLevel: 2,
      secondsPerLevel: 1200
    },
    effect: { type: "repair", perLevel: 0.05, max: 0.5 }
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s offensives.",
    image: "/assets/buildings/hangar_attaque.webp",
    maxLevel: 10,
    unlockedByTech: "tech6",
    upgrade: HANGAR_UPGRADE,
    effect: { type: "hangar", category: "attack", perLevel: 2e3 }
  },
  {
    id: "hangar_defense",
    name: "Hangar de d\xE9fense",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s d\xE9fensives.",
    image: "/assets/buildings/hangar_defense.webp",
    maxLevel: 10,
    unlockedByTech: "tech6",
    upgrade: HANGAR_UPGRADE,
    effect: { type: "hangar", category: "defense", perLevel: 2e3 }
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
    const items = entries.map(([resource, amount]) => {
      var _a2, _b;
      return { resource, amount, label: (_b = (_a2 = RESOURCE_LIST.find((r) => r.id === resource)) == null ? void 0 : _a2.name) != null ? _b : resource };
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
function productionPerSecond(buildingId, level) {
  var _a, _b, _c, _d;
  if (level <= 0) return 0;
  const table = (_c = (_b = (_a = findBuilding(buildingId)) == null ? void 0 : _a.production) == null ? void 0 : _b.perSecond) != null ? _c : [];
  return (_d = table[Math.min(level, table.length) - 1]) != null ? _d : 0;
}
function getBuildingUpgradeCost(building, nextLevel) {
  var _a;
  const { baseCost, maxCost, costFromLevel } = building.upgrade;
  const steps = Math.max(1, building.maxLevel - costFromLevel);
  const cost = {};
  for (const [res, base] of Object.entries(baseCost)) {
    const target = (_a = maxCost[res]) != null ? _a : base;
    const rate = base > 0 ? Math.pow(target / base, 1 / steps) : 1;
    cost[res] = Math.floor(base * Math.pow(rate, nextLevel - costFromLevel));
  }
  return cost;
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
  return (nextLevel - 1) * building.upgrade.secondsPerLevel;
}
function getRepairPercent(buildings) {
  var _a;
  let pct2 = 0;
  for (const b of BUILDINGS) {
    if (((_a = b.effect) == null ? void 0 : _a.type) !== "repair") continue;
    const level = effectiveBuildingLevel(buildings, b.id);
    pct2 += Math.max(0, Math.min(b.effect.max, level * b.effect.perLevel));
  }
  return pct2;
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
function withMissingBuildings(buildings) {
  const out = __spreadValues({}, buildings != null ? buildings : {});
  for (const b of BUILDINGS) {
    if (!out[b.id]) out[b.id] = { level: 1, unlocked: !!b.startsUnlocked };
  }
  return out;
}

// src/game/production.ts
function getProductionBonus(techLevels) {
  return techBonus(techLevels, "energy_efficiency");
}
function getProductionRatesPerSecond(buildings, techLevels) {
  var _a;
  const bonus = getProductionBonus(techLevels);
  const rates = {};
  for (const building of BUILDINGS) {
    const resource = PRODUCTION_RESOURCE_BY_BUILDING[building.id];
    if (!resource) continue;
    const state = buildings[building.id];
    const level = (_a = state == null ? void 0 : state.level) != null ? _a : 0;
    const unlocked = building.startsUnlocked || (state == null ? void 0 : state.unlocked) === true;
    if (level <= 0 || !unlocked) continue;
    const base = productionPerSecond(building.id, level);
    rates[resource] = Math.floor(base * (1 + bonus));
  }
  return rates;
}
function computeElapsedProduction(buildings, techLevels, elapsedSeconds) {
  if (elapsedSeconds <= 0) return {};
  const rates = getProductionRatesPerSecond(buildings, techLevels);
  const gains = {};
  for (const [res, rate] of Object.entries(rates)) {
    if (rate) gains[res] = rate * elapsedSeconds;
  }
  return gains;
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
  for (const def of defs) MISSIONS[def.key] = def;
}
function hasPrerequisites(mission, units) {
  return Object.entries(mission.prereq).every(([unitId, req]) => {
    var _a, _b;
    return ((_b = (_a = units[unitId]) == null ? void 0 : _a.count) != null ? _b : 0) >= req;
  });
}

// src/game/ranks.ts
var RANK_NAMES = [
  "Non-class\xE9",
  "Fer III",
  "Fer II",
  "Fer I",
  "Bronze III",
  "Bronze II",
  "Bronze I",
  "Argent III",
  "Argent II",
  "Argent I",
  "Or III",
  "Or II",
  "Or I",
  "Platine III",
  "Platine II",
  "Platine I",
  "\xC9meraude",
  "Diamant",
  "Master",
  "Challenger",
  "Elite"
];
var RANK_THRESHOLDS = [
  0,
  100,
  300,
  600,
  1e3,
  1500,
  2e3,
  2600,
  3300,
  4e3,
  5e3,
  6500,
  8e3,
  1e4,
  13e3,
  16e3,
  2e4,
  26e3,
  33e3,
  42e3,
  52e3
];
function getRankIndex(xp) {
  let index = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (xp >= RANK_THRESHOLDS[i]) index = i;
  }
  return index;
}
function getRankLabel(xp) {
  var _a;
  return (_a = RANK_NAMES[getRankIndex(xp)]) != null ? _a : "Non-class\xE9";
}

// src/game/achievements.ts
var ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "Premier sang",
    description: "Remporte ton premier combat.",
    emoji: "\u2694\uFE0F",
    condition: (p) => p.victories >= 1
  },
  {
    id: "veteran",
    name: "V\xE9t\xE9ran",
    description: "Remporte 10 combats.",
    emoji: "\u{1F396}\uFE0F",
    condition: (p) => p.victories >= 10
  },
  {
    id: "architect",
    name: "Architecte",
    description: "Am\xE8ne un b\xE2timent au niveau 10.",
    emoji: "\u{1F3DB}\uFE0F",
    condition: (p) => Object.values(p.buildings).some((b) => b.level >= 10)
  },
  {
    id: "expansion",
    name: "Empire en expansion",
    description: "D\xE9bloque tous les b\xE2timents.",
    emoji: "\u{1F5FA}\uFE0F",
    condition: (p) => LOCKABLE_BUILDINGS.every((id) => {
      var _a;
      return (_a = p.buildings[id]) == null ? void 0 : _a.unlocked;
    })
  },
  {
    id: "researcher",
    name: "Chercheur",
    description: "Termine 5 recherches.",
    emoji: "\u{1F52C}",
    condition: (p) => Object.values(p.techLevels).filter((lvl) => lvl > 0).length >= 5
  },
  {
    id: "commander",
    name: "Commandant",
    description: "Atteins le rang Bronze III.",
    emoji: "\u{1F3C5}",
    condition: (p) => getRankIndex(p.xp) >= 4
  },
  {
    id: "fleet",
    name: "Flotte redoutable",
    description: "Poss\xE8de 50 unit\xE9s au total.",
    emoji: "\u{1F680}",
    condition: (p) => Object.values(p.units).reduce((sum, u) => sum + u.count, 0) >= 50
  },
  {
    id: "tireless",
    name: "Increvable",
    description: "Cumule 24h de temps de jeu.",
    emoji: "\u23F1\uFE0F",
    condition: (p) => p.playtimeSeconds >= 86400
  }
];
function checkNewAchievements(player) {
  var _a;
  const unlocked = new Set((_a = player.unlockedAchievements) != null ? _a : []);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.condition(player));
}

// src/game/seasons.ts
function currentSeasonId(now = Date.now()) {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function ensureSeasonRollover(player, now) {
  const season = currentSeasonId(now);
  if (player.seasonId !== season) {
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
  var _a, _b, _c, _d;
  const player = structuredClone(playerIn);
  const queues = structuredClone(queuesIn);
  const notifications = [];
  const elapsedSeconds = Math.max(0, (now - (player.resourcesUpdatedAtMs || now)) / 1e3);
  const gains = computeElapsedProduction(player.buildings, player.techLevels, elapsedSeconds);
  for (const [res, amount] of Object.entries(gains)) {
    player.resources[res] = ((_a = player.resources[res]) != null ? _a : 0) + (amount != null ? amount : 0);
  }
  player.resourcesUpdatedAtMs = now;
  recordResourceHistory(player, now);
  ensureSeasonRollover(player, now);
  for (const buildingId of Object.keys(queues.buildingUpgrades)) {
    const entry = queues.buildingUpgrades[buildingId];
    if (!entry || entry.endTime > now) continue;
    const def = findBuilding(buildingId);
    if (def) {
      player.buildings[buildingId].level += 1;
      notifications.push({
        kind: "building",
        title: "Construction termin\xE9e",
        message: `${def.name} a atteint le niveau ${player.buildings[buildingId].level}.`,
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
        front.endTime = now + (u2 ? getUnitBuildTime(u2) : 0) * 1e3;
        break;
      }
      if (front.endTime > now) break;
      const u = findUnit(front.unitId);
      if (u) {
        if (!player.units[u.id]) player.units[u.id] = { level: 1, count: 0 };
        player.units[u.id].count += 1;
      }
      const completedEndTime = front.endTime;
      queue.shift();
      if (queue.length > 0 && queue[0].endTime === null) {
        const nu = findUnit(queue[0].unitId);
        queue[0].endTime = completedEndTime + (nu ? getUnitBuildTime(nu) : 0) * 1e3;
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
    const nextLevel = ((_b = player.techLevels[tech.id]) != null ? _b : 0) + 1;
    if (nextLevel <= tech.maxLevel) {
      player.techLevels[tech.id] = nextLevel;
      applyTechEffect(player, tech.id, nextLevel);
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
    for (const [res, amount] of Object.entries(mission.reward)) {
      if (res === "xp") {
        applyXpDelta(player, amount, now);
      } else {
        player.resources[res] = ((_c = player.resources[res]) != null ? _c : 0) + amount;
      }
    }
    notifications.push({
      kind: "mission",
      title: "Mission termin\xE9e",
      message: `${mission.name} : r\xE9compense obtenue${mission.reward.xp ? ` (+${mission.reward.xp} XP)` : ""}.`,
      createdAtMs: now,
      read: false
    });
  }
  queues.activeMissions = stillActiveMissions;
  const newAchievements = checkNewAchievements(player);
  if (newAchievements.length > 0) {
    player.unlockedAchievements = [...(_d = player.unlockedAchievements) != null ? _d : [], ...newAchievements.map((a) => a.id)];
    for (const a of newAchievements) {
      notifications.push({
        kind: "achievement",
        title: "Succ\xE8s d\xE9bloqu\xE9 !",
        message: `${a.emoji} ${a.name} \u2014 ${a.description}`,
        createdAtMs: now,
        read: false
      });
    }
  }
  return { player, queues, notifications };
}
function applyTechEffect(player, techId, level) {
  var _a, _b;
  const tech = TECHNOLOGIES.find((t) => t.id === techId);
  if (!tech) return;
  const levels = __spreadProps(__spreadValues({}, player.techLevels), { [techId]: level });
  switch (tech.effect) {
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
      player.bonuses.unlockedRecipes = level;
      break;
    case "unlock_hangars":
    case "unlock_buildings":
      for (const building of BUILDINGS) {
        if (building.unlockedByTech !== techId) continue;
        player.buildings[building.id] = { level: (_b = (_a = player.buildings[building.id]) == null ? void 0 : _a.level) != null ? _b : 1, unlocked: true };
      }
      break;
    case "unlock_next_level": {
      const unitId = unitForTech(techId);
      if (!unitId) break;
      if (!player.units[unitId]) player.units[unitId] = { level: 0, count: 0 };
      player.units[unitId].level = level;
      break;
    }
    default:
      break;
  }
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
  const def = Math.max(defenderPower, 0);
  if (outcome === "attacker_win") {
    const ratio = att > 0 ? def / att : 0;
    return {
      attackerXp: Math.round(40 * clamp2(ratio, 0.1, 2)),
      defenderXp: -Math.round(clamp2(20 * ratio, 5, 20))
    };
  }
  if (outcome === "defender_win") {
    const ratio = def > 0 ? att / def : 0;
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
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
  const { now, attackerUid, defenderUid, defender } = input;
  const check = checkAttackAllowed({
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
    __spreadProps(__spreadValues({}, input.attacker), { buildings: withMissingBuildings(input.attacker.buildings) }),
    input.attackerQueues,
    now
  );
  const attacker = flushed.player;
  for (const [unitId, qty] of Object.entries(fleet)) {
    if (((_h = (_g = attacker.units[unitId]) == null ? void 0 : _g.count) != null ? _h : 0) < qty) {
      return { ok: false, message: "Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte." };
    }
  }
  const flushedDefender = flushState(__spreadProps(__spreadValues({}, defender), { buildings: withMissingBuildings(defender.buildings) }), input.defenderQueues, now);
  const def = flushedDefender.player;
  const combat = resolveCombat({
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: getRepairPercent(attacker.buildings),
    fleet,
    defenderUnits: (_i = def.units) != null ? _i : {},
    defenderTechLevels: (_j = def.techLevels) != null ? _j : {},
    defenderRepairPct: getRepairPercent(def.buildings),
    defenderResources: (_k = def.resources) != null ? _k : {}
  });
  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  for (const [res, amt] of Object.entries((_l = combat.loot) != null ? _l : {})) {
    attacker.resources[res] = ((_m = attacker.resources[res]) != null ? _m : 0) + (amt != null ? amt : 0);
    def.resources[res] = Math.max(0, ((_n = def.resources[res]) != null ? _n : 0) - (amt != null ? amt : 0));
  }
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def.units[unitId]) def.units[unitId].count = Math.max(0, def.units[unitId].count - lost);
  }
  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") attacker.victories = ((_o = attacker.victories) != null ? _o : 0) + 1;
  else if (combat.outcome === "defender_win") attacker.defeats = ((_p = attacker.defeats) != null ? _p : 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  attacker.lastAttackAtMs = now;
  if (combat.outcome === "defender_win") def.victories = ((_q = def.victories) != null ? _q : 0) + 1;
  else if (combat.outcome === "attacker_win") {
    def.defeats = ((_r = def.defeats) != null ? _r : 0) + 1;
    def.lastDefeatAtMs = now;
  }
  applyXpDelta(def, defenderXpDelta, now);
  const outcomeTitle = {
    attacker_win: "Victoire !",
    defender_win: "D\xE9faite\u2026",
    draw: "Match nul"
  };
  const notifications = [
    ...flushed.notifications,
    {
      kind: "combat-attacker",
      title: (_s = outcomeTitle[combat.outcome]) != null ? _s : "Rapport de combat",
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
      title: (_t = defenderTitle[combat.outcome]) != null ? _t : "Rapport de combat",
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
    defenderApplied: true
  };
  return {
    ok: true,
    attacker,
    attackerQueues: flushed.queues,
    notifications,
    defender: def,
    defenderQueues: flushedDefender.queues,
    defenderNotifications,
    report,
    combat
  };
}

// src/game/errors.ts
var GameActionError = class extends Error {
};

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
var RESOURCE_IDS = new Set(RESOURCE_LIST.map((r) => r.id));
var MAX_QTY = 1e5;
function positiveInt(value, label) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) throw new GameActionError(`${label} invalide.`);
  return n;
}
function pay(player, cost) {
  if (!canAffordAll(player.resources, cost)) throw new GameActionError("Ressources insuffisantes.");
  for (const [res, val] of Object.entries(cost)) player.resources[res] -= val != null ? val : 0;
}
function applyAction(s, action) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
      pay(player, cost);
      state.unlocked = true;
      return void 0;
    }
    case "upgradeBuilding": {
      const def = findBuilding(action.buildingId);
      const state = player.buildings[action.buildingId];
      if (!def || !state) throw new GameActionError("B\xE2timent inconnu.");
      if (!state.unlocked && !def.startsUnlocked) throw new GameActionError("Ce b\xE2timent n'est pas d\xE9bloqu\xE9.");
      if (queues.buildingUpgrades[def.id]) throw new GameActionError("Am\xE9lioration d\xE9j\xE0 en cours.");
      if (state.level >= def.maxLevel) throw new GameActionError("Niveau maximum atteint.");
      const nextLevel = state.level + 1;
      pay(player, applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), (_d = (_c = player.bonuses) == null ? void 0 : _c.buildingUpgradeDiscount) != null ? _d : 0));
      queues.buildingUpgrades[def.id] = { endTime: now + getBuildingUpgradeTime(def, nextLevel) * 1e3 };
      return void 0;
    }
    case "buildUnits": {
      const unit = findUnit(action.unitId);
      if (!unit) throw new GameActionError("Unit\xE9 invalide.");
      const qty = Math.min(positiveInt(action.qty, "Quantit\xE9"), MAX_QTY);
      if (((_f = (_e = player.units[unit.id]) == null ? void 0 : _e.level) != null ? _f : 0) <= 0) throw new GameActionError("Cette unit\xE9 doit d'abord \xEAtre d\xE9bloqu\xE9e via le Labo.");
      const category = unit.category;
      const built = Object.entries(player.units).reduce((sum, [id, u]) => {
        const def = findUnit(id);
        return (def == null ? void 0 : def.category) === category ? sum + u.count * def.hangarSpace : sum;
      }, 0);
      const reserved = queues.unitQueues[category].reduce((sum, item) => {
        var _a2, _b2;
        return sum + ((_b2 = (_a2 = findUnit(item.unitId)) == null ? void 0 : _a2.hangarSpace) != null ? _b2 : 1);
      }, 0);
      if (built + reserved + qty * unit.hangarSpace > getUnitCapacity(player.buildings, category)) {
        throw new GameActionError(`Capacit\xE9 du hangar ${category === "attack" ? "d'attaque" : "de d\xE9fense"} insuffisante.`);
      }
      pay(player, { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty });
      const queue = queues.unitQueues[category];
      const wasEmpty = queue.length === 0;
      for (let i = 0; i < qty; i++) queue.push({ unitId: unit.id, endTime: null });
      if (wasEmpty) queue[0].endTime = now + getUnitBuildTime(unit) * 1e3;
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
      pay(player, getTechCost(tech, nextLevel));
      queues.activeResearches.push({ id: tech.id, endTime: now + getTechTime(tech, nextLevel) * 1e3 });
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
      if (!RESOURCE_IDS.has(sellId) || !RESOURCE_IDS.has(buyId) || sellId === buyId) throw new GameActionError("\xC9change invalide.");
      const amount = positiveInt(action.amount, "Montant");
      if (((_j = player.resources[sellId]) != null ? _j : 0) < amount) throw new GameActionError("Pas assez de ressources \xE0 \xE9changer.");
      const gained = Math.floor(amount * getTradeRate(sellId, buyId));
      player.resources[sellId] -= amount;
      player.resources[buyId] = ((_k = player.resources[buyId]) != null ? _k : 0) + gained;
      return gained;
    }
    default:
      throw new GameActionError("Action inconnue.");
  }
}
function performPlayerAction(playerIn, queuesIn, action, now) {
  const preFlushPlayer = __spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings) });
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
    if (!RESOURCE_IDS.has(res) || !Number.isFinite(n) || n < 0) throw new GameActionError("Ressources invalides.");
    if (n > 0) resources[res] = n;
  }
  if (Object.keys(resources).length === 0) throw new GameActionError("S\xE9lectionne au moins une ressource \xE0 envoyer.");
  const s = flushState(__spreadProps(__spreadValues({}, sender), { buildings: withMissingBuildings(sender.buildings) }), senderQueues, now);
  const r = flushState(__spreadProps(__spreadValues({}, recipient), { buildings: withMissingBuildings(recipient.buildings) }), recipientQueues, now);
  pay(s.player, resources);
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
  const { player, queues, notifications } = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings) }), queuesIn, now);
  for (const [unitId, lost] of Object.entries((_a = report.defenderLosses) != null ? _a : {})) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - (Number(lost) || 0));
  }
  for (const [res, amt] of Object.entries((_b = report.loot) != null ? _b : {})) {
    const key = res;
    if (RESOURCE_IDS.has(key)) player.resources[key] = Math.max(0, ((_c = player.resources[key]) != null ? _c : 0) - (Number(amt) || 0));
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
  const { player, queues, notifications } = flushState(__spreadProps(__spreadValues({}, playerIn), { buildings: withMissingBuildings(playerIn.buildings) }), queuesIn, now);
  for (const [res, amt] of Object.entries((_a = gift.resources) != null ? _a : {})) {
    const n = Math.floor(Number(amt));
    if (RESOURCE_IDS.has(res) && Number.isFinite(n) && n > 0) player.resources[res] = ((_b = player.resources[res]) != null ? _b : 0) + n;
  }
  notifications.push({ kind: "gift", title: "Ressources re\xE7ues !", message: `${gift.fromPseudo} t'a envoy\xE9 des ressources.`, createdAtMs: now, read: false });
  return { player, queues, notifications };
}

// src/game/analytics.ts
var HOUR = 36e5;
var DAY = 24 * HOUR;
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
var pct = (n, total) => total > 0 ? Math.round(n / total * 1e3) / 10 : 0;
var round1 = (n) => Math.round(n * 10) / 10;
function topCounts(values, limit) {
  const counts = /* @__PURE__ */ new Map();
  values.forEach((v) => {
    var _a;
    return counts.set(v, ((_a = counts.get(v)) != null ? _a : 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([pseudo, count]) => ({ pseudo, count }));
}
function computeGameStats(players, queues, reports, now, windowDays = 7) {
  const n = players.length;
  const lastSeen = (p) => {
    var _a;
    return (_a = p.resourcesUpdatedAtMs) != null ? _a : 0;
  };
  const families = /* @__PURE__ */ new Map();
  players.forEach((p) => {
    var _a, _b;
    const family = getRankLabel((_a = p.xp) != null ? _a : 0).split(" ")[0];
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
      unlockedPct: pct(levels.filter((l) => l > 0).length, n),
      maxedPct: pct(levels.filter((l) => l >= b.maxLevel).length, n)
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
      researchedPct: pct(levels.filter((l) => l > 0).length, n),
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
      ownersPct: pct(owned.filter((s) => {
        var _a;
        return ((_a = s == null ? void 0 : s.count) != null ? _a : 0) > 0;
      }).length, n),
      unlockedPct: pct(owned.filter((s) => {
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
  const since = now - windowDays * DAY;
  const recent = reports.filter((r) => {
    var _a;
    return ((_a = r.timestamp) != null ? _a : 0) >= since;
  });
  const outcomes = { attacker_win: 0, defender_win: 0, draw: 0 };
  recent.forEach((r) => {
    if (r.outcome in outcomes) outcomes[r.outcome]++;
  });
  const perDay = Array.from({ length: windowDays }, (_, i) => {
    const start = now - (windowDays - i) * DAY;
    const d = new Date(start + DAY);
    return {
      day: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      count: recent.filter((r) => r.timestamp >= start && r.timestamp < start + DAY).length
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
      active24h: players.filter((p) => now - lastSeen(p) < DAY).length,
      active7d: players.filter((p) => now - lastSeen(p) < 7 * DAY).length,
      new7d: players.filter((p) => {
        var _a;
        return now - ((_a = p.createdAtMs) != null ? _a : 0) < 7 * DAY;
      }).length,
      medianPlaytimeHours: round1(median(players.map((p) => {
        var _a;
        return ((_a = p.playtimeSeconds) != null ? _a : 0) / 3600;
      }))),
      ranks: [...families.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => RANK_NAMES.findIndex((r) => r.startsWith(a.label)) - RANK_NAMES.findIndex((r) => r.startsWith(b.label))),
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
    insights: []
  };
  stats.insights = computeInsights(stats);
  return stats;
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
  return out;
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
  "unlockedAchievements"
];
var QUEUE_FIELDS = ["buildingUpgrades", "unitQueues", "activeResearches", "activeMissions"];

// src/game/content.ts
var CONTENT_SECTIONS = ["buildings", "units", "technologies", "missions", "rules"];
var DEFAULT_PVP_RULES = __spreadValues({}, PVP_RULES);
var DEFAULT_COMBAT_RULES = __spreadValues({}, COMBAT_RULES);
function defaultGameContent() {
  return structuredClone({
    buildings: DEFAULT_BUILDINGS,
    units: DEFAULT_UNITS,
    technologies: DEFAULT_TECHNOLOGIES,
    missions: Object.values(DEFAULT_MISSIONS),
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES }
  });
}
var current = defaultGameContent();
function applyGameContent(overrides) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const defaults = defaultGameContent();
  const content = {
    buildings: (_a = overrides.buildings) != null ? _a : defaults.buildings,
    units: (_b = overrides.units) != null ? _b : defaults.units,
    technologies: (_c = overrides.technologies) != null ? _c : defaults.technologies,
    missions: (_d = overrides.missions) != null ? _d : defaults.missions,
    rules: {
      pvp: __spreadValues(__spreadValues({}, defaults.rules.pvp), (_f = (_e = overrides.rules) == null ? void 0 : _e.pvp) != null ? _f : {}),
      combat: __spreadValues(__spreadValues({}, defaults.rules.combat), (_h = (_g = overrides.rules) == null ? void 0 : _g.combat) != null ? _h : {})
    }
  };
  setBuildings(content.buildings);
  setUnits(content.units);
  setTechnologies(content.technologies);
  setMissions(content.missions);
  Object.assign(PVP_RULES, content.rules.pvp);
  Object.assign(COMBAT_RULES, content.rules.combat);
  current = content;
  return content;
}
