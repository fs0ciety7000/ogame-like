// FICHIER GÉNÉRÉ par `npm run build:hooks` depuis src/game — ne pas modifier à la main.

if (typeof structuredClone === "undefined") {
  var structuredClone = function (v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
}
if (!Object.entries) Object.entries = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); };
if (!Object.values) Object.values = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
if (!Object.fromEntries) Object.fromEntries = function (it) { var o = {}; Array.from(it).forEach(function (e) { o[e[0]] = e[1]; }); return o; };
if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { var s = String(this); c = c === undefined ? " " : String(c); while (s.length < n) s = c + s; return s.slice(-Math.max(n, String(this).length)); };

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
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
  GAME_FIELDS: () => GAME_FIELDS,
  PVP_RULES: () => PVP_RULES,
  QUEUE_FIELDS: () => QUEUE_FIELDS,
  performAttack: () => performAttack
});
module.exports = __toCommonJS(hooksEntry_exports);

// src/game/units.ts
var UNITS = [
  {
    id: "drone_recuperateur",
    name: "Drone r\xE9cup\xE9rateur",
    image: "/assets/units/drone_recuperateur.webp",
    maxLevel: 10,
    description: "Petit drone autonome con\xE7u pour r\xE9cup\xE9rer des ressources dispers\xE9es.",
    cost: { scrap: 500, energy: 200 },
    stats: { attaque: 15, defense: 5, vitesse: 5, cargo: 10 },
    category: "attack",
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
    hangarSpace: 20
  }
];
var UNIT_BASE_STATS = {
  drone_recuperateur: { attack: 15, defense: 5 },
  fregate: { attack: 100, defense: 20 },
  cargo: { attack: 50, defense: 10 },
  sentinelle: { attack: 120, defense: 30 },
  chasseur: { attack: 245, defense: 10 },
  etoile_noire: { attack: 500, defense: 500 },
  roquette: { attack: 60, defense: 0 },
  canon_impulsion: { attack: 80, defense: 10 },
  canon_plasma: { attack: 105, defense: 20 },
  batterie_aa: { attack: 135, defense: 15 },
  intercepteur: { attack: 255, defense: 60 }
};
var UNIT_TO_TECH = {
  drone_recuperateur: "tech9",
  fregate: "tech10",
  cargo: "tech11",
  sentinelle: "tech12",
  chasseur: "tech13",
  roquette: "tech14",
  canon_impulsion: "tech15",
  canon_plasma: "tech16",
  batterie_aa: "tech17",
  intercepteur: "tech18",
  etoile_noire: "tech19"
};
var DEFENSIVE_UNITS = ["roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur"];
function findUnit(id) {
  return UNITS.find((u) => u.id === id);
}
function getUnitBuildTime(unit) {
  const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
  return Math.max(3, Math.ceil(total / 100));
}

// src/game/combat.ts
var LOOT_PERCENT = 0.08;
var LOOT_RESOURCES = ["reinforcedSteel", "cyberModule", "syntheticNanites", "aiFragment"];
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function unitStat(units, techLevels, unitId, stat) {
  var _a, _b, _c, _d, _e, _f;
  const base = (_b = (_a = UNIT_BASE_STATS[unitId]) == null ? void 0 : _a[stat]) != null ? _b : 0;
  const level = (_d = (_c = units[unitId]) == null ? void 0 : _c.level) != null ? _d : 0;
  if (level <= 0) return 0;
  let value = base + (level - 1) * 5;
  if (stat === "attack") value *= 1 + ((_e = techLevels.tech5) != null ? _e : 0) * 0.1;
  if (stat === "defense") value *= 1 + ((_f = techLevels.tech2) != null ? _f : 0) * 0.1;
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
    var _a, _b;
    const count = (_b = (_a = defenderUnits[unitId]) == null ? void 0 : _a.count) != null ? _b : 0;
    const rawLost = Math.floor(count * defenderLossPct);
    const recovered = Math.floor(rawLost * defenderRepairPct);
    const effectiveLost = rawLost - recovered;
    if (rawLost > 0) {
      defenderLosses[unitId] = effectiveLost;
      defenderRecovered[unitId] = recovered;
    }
  });
  let loot = null;
  if (outcome === "attacker_win") {
    loot = {};
    LOOT_RESOURCES.forEach((res) => {
      var _a;
      const available = (_a = defenderResources[res]) != null ? _a : 0;
      loot[res] = Math.floor(available * LOOT_PERCENT);
    });
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
    loot
  };
}

// src/game/buildings.ts
var BUILDINGS = [
  {
    id: "extracteur_ferraille",
    name: "Extracteur de ferraille",
    description: "R\xE9cup\xE8re automatiquement de la ferraille dans les d\xE9bris environnants.",
    image: "/assets/buildings/extracteur_ferraille.webp",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true
  },
  {
    id: "reacteur_instable",
    name: "R\xE9acteur instable",
    description: "G\xE9n\xE8re de l'\xE9nergie brute, au prix d'une certaine instabilit\xE9.",
    image: "/assets/buildings/reacteur_instable.webp",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true
  },
  {
    id: "extracteur_nanocomposants",
    name: "Extracteur de nanocomposants",
    description: "Synth\xE9tise des nanocomposants \xE0 partir de mati\xE8res recycl\xE9es.",
    image: "/assets/buildings/extracteur_nanocomposants.webp",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true
  },
  {
    id: "archives_fracturees",
    name: "Archives fractur\xE9es",
    description: "Fouille des donn\xE9es anciennes dans des serveurs endommag\xE9s.",
    image: "/assets/buildings/archives_fracturees.webp",
    maxLevel: 10,
    cost: { scrap: 50, energy: 20 },
    production: true,
    scaled: true
  },
  {
    id: "atelier_reparation",
    name: "Atelier de r\xE9paration",
    description: "R\xE9pare une partie des unit\xE9s perdues apr\xE8s chaque combat.",
    image: "/assets/buildings/atelier_reparation.webp",
    maxLevel: 10,
    cost: {},
    production: false,
    scaled: true
  },
  {
    id: "hangar_attaque",
    name: "Hangar d'attaque",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s offensives.",
    image: "/assets/buildings/hangar_attaque.webp",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: false,
    scaled: true
  },
  {
    id: "hangar_defense",
    name: "Hangar de d\xE9fense",
    description: "Augmente la capacit\xE9 de stockage des unit\xE9s d\xE9fensives.",
    image: "/assets/buildings/hangar_defense.webp",
    maxLevel: 10,
    cost: { scrap: 300, energy: 150 },
    production: false,
    scaled: true
  }
];
var LOCKABLE_BUILDINGS = [
  "reacteur_instable",
  "extracteur_nanocomposants",
  "archives_fracturees"
];
function findBuilding(id) {
  return BUILDINGS.find((b) => b.id === id);
}
var PRODUCTION_TABLE = [2, 4, 7, 13, 23, 42, 75, 135, 259, 500];
function productionPerSecond(buildingId, level) {
  var _a;
  if (level <= 0) return 0;
  return (_a = PRODUCTION_TABLE[level - 1]) != null ? _a : 0;
}
var PRODUCTION_RESOURCE_BY_BUILDING = {
  extracteur_ferraille: "scrap",
  reacteur_instable: "energy",
  extracteur_nanocomposants: "nano",
  archives_fracturees: "data"
};
var REF_BASE_SCRAP = 50;
var REF_BASE_ENERGY = 20;
var REF_TARGET_SCRAP = 25e5;
var REF_TARGET_ENERGY = 18e5;
var REF_STEPS = 9;
var SCRAP_GROWTH_RATE = Math.pow(REF_TARGET_SCRAP / REF_BASE_SCRAP, 1 / REF_STEPS);
var ENERGY_GROWTH_RATE = Math.pow(REF_TARGET_ENERGY / REF_BASE_ENERGY, 1 / REF_STEPS);
var ATELIER_L2_NANO = 1e3;
var ATELIER_TARGET_NANO = 1e7;
var ATELIER_L2_DATA = 1e3;
var ATELIER_TARGET_DATA = 95e5;
var ATELIER_STEPS = 8;
var ATELIER_NANO_RATE = Math.pow(ATELIER_TARGET_NANO / ATELIER_L2_NANO, 1 / ATELIER_STEPS);
var ATELIER_DATA_RATE = Math.pow(ATELIER_TARGET_DATA / ATELIER_L2_DATA, 1 / ATELIER_STEPS);
var HANGAR_BASE_SCRAP = 300;
var HANGAR_BASE_ENERGY = 150;
var HANGAR_TARGET_SCRAP = 5e6;
var HANGAR_TARGET_ENERGY = 75e5;
var HANGAR_STEPS = 9;
var HANGAR_SCRAP_RATE = Math.pow(HANGAR_TARGET_SCRAP / HANGAR_BASE_SCRAP, 1 / HANGAR_STEPS);
var HANGAR_ENERGY_RATE = Math.pow(HANGAR_TARGET_ENERGY / HANGAR_BASE_ENERGY, 1 / HANGAR_STEPS);
function getRepairPercent(buildings) {
  var _a, _b;
  const level = (_b = (_a = buildings.atelier_reparation) == null ? void 0 : _a.level) != null ? _b : 1;
  return Math.max(0, Math.min(0.5, level * 0.05));
}

// src/game/production.ts
function getProductionBonus(techLevels) {
  var _a;
  return ((_a = techLevels.tech3) != null ? _a : 0) * 0.1;
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
    const unlocked = LOCKABLE_BUILDINGS.includes(building.id) ? (state == null ? void 0 : state.unlocked) === true : true;
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
var MISSIONS = {
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

// src/game/technologies.ts
var TECHNOLOGIES = [
  { id: "tech1", nom: "Analyse de mat\xE9riaux", desc: "D\xE9bloque de nouvelles recettes dans le laboratoire.", maxLevel: 18, baseCost: { scrap: 100, energy: 20 }, baseTime: 30, effect: "unlock_recipe", costGrowth: 1.92, prereq: {} },
  { id: "tech3", nom: "Am\xE9lioration \xE9nerg\xE9tique", desc: "Augmente l'efficacit\xE9 des g\xE9n\xE9rateurs.", maxLevel: 10, baseCost: { scrap: 150, energy: 50 }, baseTime: 45, effect: "energy_efficiency", prereq: {} },
  { id: "tech9", nom: "Drone r\xE9cup\xE9rateur", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 200, reinforcedSteel: 20 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 1 } },
  { id: "tech2", nom: "Blindage avanc\xE9", desc: "Renforce la r\xE9sistance des unit\xE9s.", maxLevel: 10, baseCost: { scrap: 300, nano: 50 }, baseTime: 60, effect: "unit_defense", prereq: { tech8: 1, tech14: 4 } },
  { id: "tech5", nom: "Puissance d'attaque", desc: "Augmente la puissance d'attaque de toutes les unit\xE9s.", maxLevel: 10, baseCost: { energy: 200, nano: 100 }, baseTime: 50, effect: "unit_attack", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech4", nom: "Optimisation industrielle", desc: "R\xE9duit le co\xFBt des am\xE9liorations de b\xE2timents.", maxLevel: 10, baseCost: { scrap: 400, data: 50 }, baseTime: 90, effect: "building_discount", prereq: { tech1: 5, tech3: 4 } },
  { id: "tech6", nom: "Infrastructure spatiale", desc: "D\xE9bloque les hangars orbitaux.", maxLevel: 1, baseCost: { scrap: 800, energy: 400, nano: 200 }, baseTime: 120, effect: "unlock_hangars", prereq: { tech4: 3, tech3: 5 } },
  { id: "tech11", nom: "Cargo", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 300, syntheticNanites: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech9: 3, tech6: 1 } },
  { id: "tech10", nom: "Fr\xE9gate", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 400, energy: 100, cyberModule: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3, tech3: 2 } },
  { id: "tech14", nom: "Roquette", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 250, nano: 80 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech1: 3 } },
  { id: "tech8", nom: "Syst\xE8mes d\xE9fensifs", desc: "D\xE9bloque les unit\xE9s de d\xE9fense renforc\xE9es.", maxLevel: 4, baseCost: { scrap: 500, nano: 200, data: 100 }, baseTime: 70, effect: "unlock_defense_units", prereq: { tech1: 2, tech3: 2 } },
  { id: "tech7", nom: "Armes exp\xE9rimentales", desc: "D\xE9bloque les unit\xE9s d'attaque avanc\xE9es.", maxLevel: 5, baseCost: { energy: 600, nano: 300, data: 150 }, baseTime: 75, effect: "unlock_attack_units", prereq: { tech5: 6, tech1: 8 } },
  { id: "tech12", nom: "Sentinelle", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 400, syntheticNanites: 150, cyberModule: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 1, tech2: 6 } },
  { id: "tech17", nom: "Batterie Anti-a\xE9rienne", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 500, syntheticNanites: 200, nano: 150 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech8: 2, tech14: 5 } },
  { id: "tech13", nom: "Chasseur", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 600, energy: 300, syntheticNanites: 250 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech10: 5, tech7: 1, tech1: 14 } },
  { id: "tech15", nom: "Canon \xE0 impulsion", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { energy: 800, nano: 400, syntheticNanites: 200 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech7: 2, tech3: 7 } },
  { id: "tech16", nom: "Canon plasma", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { energy: 1200, nano: 600, data: 300, aiFragment: 50 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech15: 5, tech7: 4, tech1: 10 } },
  { id: "tech18", nom: "Intercepteur", desc: "Augmente la puissance d'attaque de l'unit\xE9.", maxLevel: 10, baseCost: { scrap: 1e3, syntheticNanites: 500, data: 400, aiFragment: 100 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech13: 5, tech16: 2, tech1: 15 } },
  { id: "tech19", nom: "\xC9toile noire", desc: "Arme ultime. Capacit\xE9 de destruction massive.", maxLevel: 10, baseCost: { reinforcedSteel: 1e3, syntheticNanites: 1e3, cyberModule: 1e3, aiFragment: 1e3 }, baseTime: 70, effect: "unlock_next_level", prereq: { tech18: 5, tech16: 5, tech1: 18 } }
];
function findTech(id) {
  return TECHNOLOGIES.find((t) => t.id === id);
}

// src/game/ranks.ts
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
var TECH_TO_UNIT = Object.fromEntries(
  Object.entries(UNIT_TO_TECH).map(([unit, tech]) => [tech, unit])
);
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
  const tech = TECHNOLOGIES.find((t) => t.id === techId);
  if (!tech) return;
  switch (tech.effect) {
    case "energy_efficiency":
      player.bonuses.energyEfficiency = level * 0.1;
      break;
    case "unit_defense":
      player.bonuses.unitDefenseBonus = level * 0.1;
      break;
    case "unit_attack":
      player.bonuses.unitAttackBonus = level * 0.1;
      break;
    case "building_discount":
      player.bonuses.buildingUpgradeDiscount = level * 0.05;
      break;
    case "unlock_recipe":
      player.bonuses.unlockedRecipes = level;
      break;
    case "unlock_hangars":
      player.buildings.hangar_attaque.unlocked = true;
      player.buildings.hangar_defense.unlocked = true;
      break;
    case "unlock_next_level": {
      const unitId = TECH_TO_UNIT[techId];
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
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
    if (qty > 0) fleet[unitId] = qty;
  }
  if (Object.keys(fleet).length === 0) return { ok: false, message: "S\xE9lectionne au moins une unit\xE9 \xE0 envoyer." };
  const flushed = flushState(input.attacker, input.attackerQueues, now);
  const attacker = flushed.player;
  for (const [unitId, qty] of Object.entries(fleet)) {
    if (((_h = (_g = attacker.units[unitId]) == null ? void 0 : _g.count) != null ? _h : 0) < qty) {
      return { ok: false, message: "Tu ne poss\xE8des plus assez d'unit\xE9s pour cette flotte." };
    }
  }
  const combat = resolveCombat({
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: getRepairPercent(attacker.buildings),
    fleet,
    defenderUnits: (_i = defender.units) != null ? _i : {},
    defenderTechLevels: (_j = defender.techLevels) != null ? _j : {},
    defenderRepairPct: getRepairPercent(defender.buildings),
    defenderResources: (_k = defender.resources) != null ? _k : {}
  });
  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  for (const [res, amt] of Object.entries((_l = combat.loot) != null ? _l : {})) {
    attacker.resources[res] = ((_m = attacker.resources[res]) != null ? _m : 0) + (amt != null ? amt : 0);
  }
  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") attacker.victories = ((_n = attacker.victories) != null ? _n : 0) + 1;
  else if (combat.outcome === "defender_win") attacker.defeats = ((_o = attacker.defeats) != null ? _o : 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  const outcomeTitle = {
    attacker_win: "Victoire !",
    defender_win: "D\xE9faite\u2026",
    draw: "Match nul"
  };
  const notifications = [
    ...flushed.notifications,
    {
      kind: "combat-attacker",
      title: (_p = outcomeTitle[combat.outcome]) != null ? _p : "Rapport de combat",
      message: `Attaque contre ${defender.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).`,
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
    defenderXpDelta
  };
  return { ok: true, attacker, attackerQueues: flushed.queues, notifications, report, combat };
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
