import { ACHIEVEMENTS } from "@/game/achievements";
import { hullPercent, workshopUnits } from "@/game/workshop";
import { BUILDINGS, effectiveBuildingLevel, getUnitCapacity } from "@/game/buildings";
import { chronicleState } from "@/game/chronicles";
import { colonyBiome, colonyDefenseHangar, colonyHourlyRates, colonyStorage, depositLevel, type Colony } from "@/game/colonies";
import { allianceShieldBonus } from "@/game/alliances";
import { COMBAT_RULES, computeFullPower, getShieldPercent, homeDefensePower, unitStat } from "@/game/combat";
import { commanderLevel, commanderSlots, commandersState, findCommander, type OfficerId } from "@/game/commanders";
import { COMMON_RESOURCES, economySnapshot, protectedAmount } from "@/game/economy";
import type { Fleet, FleetMission } from "@/game/fleets";
import { playerModifiers, type Modifiers } from "@/game/modifiers";
import { FACTIONS, pirateState } from "@/game/pirates";
import { getRankLabel } from "@/game/ranks";
import { equippedRelics, relicLabel, relicsState } from "@/game/relics";
import { RESOURCE_LIST } from "@/game/resources";
import { passState, passTier, activePass } from "@/game/seasonPass";
import { playerStats } from "@/game/stats";
import { streakState } from "@/game/streak";
import { talentPoints } from "@/game/talents";
import { TECHNOLOGIES } from "@/game/technologies";
import { DEFENSIVE_UNITS, findUnit, OFFENSIVE_UNITS, UNITS } from "@/game/units";
import type { PlayerState, ResourceId, Units } from "@/types/game";

/* =====================================================
   v5.6 : statistiques complètes de l'empire d'un joueur (planète mère et
   colonies) en un seul calcul : production, stocks, armée (à quai et en
   vol), état-major, reliques, talents, bonus, technologies, menaces,
   progression et carrière. Calcul pur, partagé avec les tests.
===================================================== */

export interface PlanetStats {
  id: string;
  name: string;
  kind: "home" | "colony";
  /** Niveaux de bâtiments cumulés. */
  levels: number;
  /** Production horaire par ressource. */
  perHour: Partial<Record<ResourceId, number>>;
  stock: Partial<Record<ResourceId, number>>;
  capacity: number;
  defensePower: number;
  defensePlaces: { used: number; capacity: number };
  biome?: string;
  depositLevel?: number;
}

export interface UnitLine {
  id: string;
  name: string;
  category: "attack" | "defense";
  level: number;
  home: number;
  away: number;
  colonies: number;
  attack: number;
  defense: number;
  /** Puissance totale portée par cette unité (ATK pour la flotte, ATK + DEF pour les défenses). */
  power: number;
  places: number;
  /** 5.20 : unités immobilisées à l'Atelier, état de la coque (0 → 1) et PV au combat (stock à pleine santé). */
  workshop: number;
  hull: number;
  hp: number;
}

export interface EmpireStats {
  overview: {
    pseudo: string;
    rank: string;
    xp: number;
    seasonXp: number;
    victories: number;
    defeats: number;
    winPct: number;
    playtimeHours: number;
    accountDays: number;
    ascensions: number;
  };
  resources: { id: ResourceId; name: string; rarity: string; perHourHome: number; perHourColonies: number; stock: number; stockColonies: number }[];
  economy: { capacity: number; protectedPerResource: number; upkeepPerHour: number; energyNetPerHour: number; outage: boolean; full: string[]; totalPerHour: number };
  planets: PlanetStats[];
  military: {
    units: UnitLine[];
    attackHome: number;
    attackAway: number;
    attackTotal: number;
    homeDefense: number;
    coloniesDefense: number;
    shieldPct: number;
    attackPlaces: { used: number; capacity: number };
    defensePlaces: { used: number; capacity: number };
    modifiedAttack: number;
    modifiedDefense: number;
    /** 5.20 : coque moyenne (pondérée par les PV), PV totaux et manquants, unités à l'Atelier, attaque réelle (coques comprises). */
    hullPct: number;
    hpTotal: number;
    hpMissing: number;
    inWorkshop: number;
    effectiveAttack: number;
  };
  fleets: { inFlight: number; byMission: Partial<Record<FleetMission, number>>; unitsAway: number };
  command: {
    slots: number;
    active: { id: OfficerId; name: string; title: string; level: number }[];
    recruited: number;
    dossiers: number;
    relicsEquipped: string[];
    relicsOwned: number;
    talents: { total: number; spent: number; free: number };
    modifiers: Modifiers;
  };
  development: { buildingLevels: number; buildingsUnlocked: number; buildingsTotal: number; techResearched: number; techTotal: number; techLevels: number; techMaxed: number };
  threats: { id: string; name: string; notoriety: number; maxNotoriety: number; raidsWon: number; raidsLost: number; lairsTaken: number; adapt: number }[];
  progression: { achievements: number; achievementsTotal: number; passTier: number; passTiers: number; passPoints: number; chapters: number; seals: number; streak: number; bestStreak: number; titles: number };
  career: { label: string; value: number }[];
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function unitsAwayOf(fleets: Fleet[], uid: string | undefined): Record<string, number> {
  const away: Record<string, number> = {};
  for (const f of fleets) {
    if (f.ownerUid !== uid || f.status === "done") continue;
    for (const [id, n] of Object.entries(f.units ?? {})) away[id] = (away[id] ?? 0) + (n ?? 0);
  }
  return away;
}

function colonyPlanet(colony: Colony, player: PlayerState): PlanetStats {
  const units = colony.defenses as Units;
  return {
    id: colony.id,
    name: colony.name,
    kind: "colony",
    levels: sum(Object.values(colony.buildings ?? {}).map((b) => b?.level ?? 0)),
    perHour: colonyHourlyRates(colony, player),
    stock: { ...colony.resources },
    capacity: colonyStorage(colony, player),
    defensePower: Math.round(homeDefensePower(units, player.techLevels ?? {}, 0) * (1 + playerModifiers(player).defense)),
    defensePlaces: colonyDefenseHangar(colony),
    biome: RESOURCE_LIST.find((r) => r.id === colonyBiome(colony))?.name,
    depositLevel: depositLevel(colony),
  };
}

export function empireStats(player: PlayerState, fleets: Fleet[], now: number): EmpireStats {
  const units = player.units ?? {};
  const tech = player.techLevels ?? {};
  const mods = playerModifiers(player);
  const eco = economySnapshot(player, now);
  const stats = playerStats(player);
  const colonies = player.colonies ?? [];
  const away = unitsAwayOf(fleets, player.uid);
  const repairDock = workshopUnits(player);
  const colonyPlanets = colonies.map((c) => colonyPlanet(c, player));

  // ---- Planète mère ----
  const homePerHour: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) homePerHour[r.id] = Math.round((eco.gross[r.id] ?? 0) * 3600);
  const homeLevels = sum(BUILDINGS.map((b) => effectiveBuildingLevel(player.buildings, b.id)));
  const usedPlaces = (ids: string[], counts: Record<string, number>) => sum(ids.map((id) => (counts[id] ?? 0) * (findUnit(id)?.hangarSpace ?? 1)));
  const homeCounts = Object.fromEntries(Object.entries(units).map(([id, s]) => [id, s?.count ?? 0]));
  // 5.20 : les unités à l'Atelier gardent leur place de hangar.
  const attackPlaces = { used: usedPlaces(OFFENSIVE_UNITS, homeCounts) + usedPlaces(OFFENSIVE_UNITS, away) + usedPlaces(OFFENSIVE_UNITS, repairDock), capacity: getUnitCapacity(player.buildings, "attack", tech) };
  const defensePlaces = { used: usedPlaces(DEFENSIVE_UNITS, homeCounts) + usedPlaces(DEFENSIVE_UNITS, repairDock), capacity: getUnitCapacity(player.buildings, "defense", tech) };
  const homeDefense = Math.round(homeDefensePower(units, tech));
  const home: PlanetStats = {
    id: "home",
    name: "Planète mère",
    kind: "home",
    levels: homeLevels,
    perHour: homePerHour,
    stock: { ...player.resources },
    capacity: eco.capacity,
    defensePower: Math.round(homeDefense * (1 + mods.defense)),
    defensePlaces,
  };

  // ---- Armée ----
  const colonyCounts: Record<string, number> = {};
  for (const c of colonies) for (const [id, s] of Object.entries(c.defenses ?? {})) colonyCounts[id] = (colonyCounts[id] ?? 0) + (s?.count ?? 0);
  const lines: UnitLine[] = UNITS.map((u) => {
    const level = units[u.id]?.level ?? 0;
    const atk = unitStat(units, tech, u.id, "attack");
    const def = unitStat(units, tech, u.id, "defense");
    const homeN = units[u.id]?.count ?? 0;
    const awayN = away[u.id] ?? 0;
    const colN = colonyCounts[u.id] ?? 0;
    const per = u.category === "attack" ? atk : atk + def;
    const docked = repairDock[u.id] ?? 0;
    const hp = (homeN + awayN) * Math.max(1, def) * COMBAT_RULES.hpPerResistance;
    return { id: u.id, name: u.name, category: u.category, level, home: homeN, away: awayN, colonies: colN, attack: Math.round(atk), defense: Math.round(def), power: Math.round(per * (homeN + awayN + colN)), places: (homeN + awayN + docked) * u.hangarSpace, workshop: docked, hull: hullPercent(player, u.id), hp: Math.round(hp) };
  }).filter((l) => l.level > 0 || l.home + l.away + l.colonies + l.workshop > 0);
  const hpTotal = sum(lines.map((l) => l.hp));
  const hpMissing = sum(lines.map((l) => l.hp * (1 - l.hull)));
  const effectiveAttack = Math.round(sum(lines.filter((l) => l.category === "attack").map((l) => l.attack * (l.home + l.away) * l.hull)) * (1 + mods.attack));
  const attackHome = Math.round(computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]));
  const awayUnits: Units = Object.fromEntries(Object.entries(away).map(([id, n]) => [id, { level: units[id]?.level ?? 1, count: n }]));
  const attackAway = Math.round(computeFullPower(awayUnits, tech, OFFENSIVE_UNITS, ["attack"]));
  const coloniesDefense = sum(colonyPlanets.map((p) => p.defensePower));

  // ---- Flottes ----
  const mine = fleets.filter((f) => f.ownerUid === player.uid && f.status !== "done");
  const byMission: Partial<Record<FleetMission, number>> = {};
  for (const f of mine) byMission[f.mission] = (byMission[f.mission] ?? 0) + 1;

  // ---- État-major ----
  const cmd = commandersState(player);
  const relics = relicsState(player);
  const talents = talentPoints(player);

  // ---- Ressources ----
  const resources = RESOURCE_LIST.map((r) => ({
    id: r.id as ResourceId,
    name: r.name,
    rarity: r.rarity,
    perHourHome: homePerHour[r.id] ?? 0,
    perHourColonies: sum(colonyPlanets.map((p) => p.perHour[r.id] ?? 0)),
    stock: Math.floor(player.resources[r.id] ?? 0),
    stockColonies: Math.floor(sum(colonyPlanets.map((p) => p.stock[r.id] ?? 0))),
  }));

  // ---- Progression ----
  const pass = passState(player, now);
  const chron = chronicleState(player, now);
  const streak = streakState(player);
  const unlocked = new Set(player.unlockedAchievements ?? []);

  const victories = player.victories ?? 0;
  const defeats = player.defeats ?? 0;
  const createdAt = Number((player as { createdAt?: unknown }).createdAt) || Number((player as { createdAtMs?: unknown }).createdAtMs) || now;

  return {
    overview: {
      pseudo: player.pseudo,
      rank: getRankLabel(player.xp ?? 0),
      xp: player.xp ?? 0,
      seasonXp: player.seasonXp ?? 0,
      victories,
      defeats,
      winPct: victories + defeats > 0 ? Math.round((victories / (victories + defeats)) * 100) : 0,
      playtimeHours: Math.floor((player.playtimeSeconds ?? 0) / 3600),
      accountDays: Math.max(0, Math.floor((now - createdAt) / 86_400_000)),
      ascensions: player.ascensions ?? 0,
    },
    resources,
    economy: {
      capacity: eco.capacity,
      protectedPerResource: protectedAmount(player.buildings, "scrap", tech, player.allianceResearch, player),
      upkeepPerHour: Math.round(eco.upkeep * 3600),
      energyNetPerHour: Math.round(((eco.gross.energy ?? 0) - eco.upkeep) * 3600),
      outage: eco.outage,
      full: eco.full.map((id) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id),
      totalPerHour: sum(resources.filter((r) => COMMON_RESOURCES.includes(r.id)).map((r) => r.perHourHome + r.perHourColonies)),
    },
    planets: [home, ...colonyPlanets],
    military: {
      units: lines.sort((a, b) => (a.category === b.category ? b.power - a.power : a.category === "attack" ? -1 : 1)),
      attackHome,
      attackAway,
      attackTotal: attackHome + attackAway,
      homeDefense,
      coloniesDefense,
      shieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)),
      attackPlaces,
      defensePlaces,
      modifiedAttack: Math.round((attackHome + attackAway) * (1 + mods.attack)),
      modifiedDefense: Math.round(homeDefense * (1 + mods.defense)),
      hullPct: hpTotal > 0 ? 1 - hpMissing / hpTotal : 1,
      hpTotal,
      hpMissing: Math.round(hpMissing),
      inWorkshop: sum(Object.values(repairDock)),
      effectiveAttack,
    },
    fleets: { inFlight: mine.length, byMission, unitsAway: sum(Object.values(away)) },
    command: {
      slots: commanderSlots(player),
      active: cmd.active.map((id) => {
        const def = findCommander(id)!;
        return { id, name: def.name, title: def.title, level: commanderLevel(cmd.roster[id]?.xp ?? 0) };
      }),
      recruited: Object.keys(cmd.roster).length,
      dossiers: cmd.dossiers,
      relicsEquipped: equippedRelics(player).map((r) => relicLabel(r)),
      relicsOwned: relics.items.length,
      talents,
      modifiers: mods,
    },
    development: {
      buildingLevels: homeLevels,
      buildingsUnlocked: BUILDINGS.filter((b) => b.startsUnlocked || player.buildings?.[b.id]?.unlocked).length,
      buildingsTotal: BUILDINGS.length,
      techResearched: TECHNOLOGIES.filter((t) => (tech[t.id] ?? 0) > 0).length,
      techTotal: TECHNOLOGIES.length,
      techLevels: sum(TECHNOLOGIES.map((t) => tech[t.id] ?? 0)),
      techMaxed: TECHNOLOGIES.filter((t) => (tech[t.id] ?? 0) >= t.maxLevel).length,
    },
    threats: FACTIONS.filter((f) => f.enabled).map((f) => {
      const st = pirateState(player, f.id);
      return { id: f.id, name: f.name, notoriety: st.notoriety, maxNotoriety: f.raid.maxNotoriety, raidsWon: st.raidsWon, raidsLost: st.raidsLost, lairsTaken: st.lairsTaken, adapt: st.adapt };
    }),
    progression: {
      achievements: ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length,
      achievementsTotal: ACHIEVEMENTS.filter((a) => a.enabled).length,
      passTier: passTier(pass.points, pass.seasonId),
      passTiers: activePass(pass.seasonId).tiers.length,
      passPoints: pass.points,
      chapters: chron.chapters.length,
      seals: chron.emblems.length,
      streak: streak.count,
      bestStreak: streak.best,
      titles: (player.titles ?? []).length,
    },
    career: [
      { label: "Missions terminées", value: stats.missions ?? 0 },
      { label: "Contrats remplis", value: stats.contracts ?? 0 },
      { label: "Unités construites", value: stats.unitsBuilt ?? 0 },
      { label: "Ressources pillées", value: stats.loot ?? 0 },
      { label: "Puissance ennemie détruite", value: stats.powerDestroyed ?? 0 },
      { label: "Espionnages", value: stats.spies ?? 0 },
      { label: "Débris recyclés", value: stats.recycled ?? 0 },
      { label: "Expéditions", value: stats.expeditions ?? 0 },
      { label: "Échanges au marché", value: stats.marketTrades ?? 0 },
      { label: "Primes Kesh'Vaar", value: stats.bounties ?? 0 },
      { label: "Léviathans abattus", value: stats.leviathanKills ?? 0 },
      { label: "Guerres gagnées", value: stats.warsWon ?? 0 },
      { label: "Transports entre planètes", value: stats.transports ?? 0 },
      { label: "Dons au trésor", value: stats.donated ?? 0 },
      { label: "Ressources dépensées", value: stats.spent ?? 0 },
    ],
  };
}

/** Part d'un indicateur (0–1) pour les jauges, bornée. */
export function ratio(used: number, capacity: number): number {
  return capacity > 0 ? Math.max(0, Math.min(1, used / capacity)) : 0;
}

