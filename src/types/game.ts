export type CommonResourceId = "scrap" | "energy" | "nano" | "data";
export type RareResourceId = "reinforcedSteel" | "cyberModule" | "syntheticNanites" | "aiFragment";
export type ResourceId = CommonResourceId | RareResourceId;

export type Resources = Record<ResourceId, number>;

/** Identifiant de bâtiment : libre, les bâtiments étant définis par des
 *  données (voir src/game/buildings.ts et l'interface d'administration). */
export type BuildingId = string;

export interface BuildingState {
  level: number;
  unlocked: boolean;
}

export type Buildings = Record<BuildingId, BuildingState>;

export type UnitCategory = "attack" | "defense";

export interface UnitState {
  level: number;
  count: number;
}

export type Units = Record<string, UnitState>;

export type TechLevels = Record<string, number>;

export interface BuildingUpgradeEntry {
  endTime: number;
}
export type BuildingUpgrades = Partial<Record<BuildingId, BuildingUpgradeEntry>>;

export interface UnitQueueEntry {
  unitId: string;
  endTime: number | null;
}
export interface UnitQueues {
  attack: UnitQueueEntry[];
  defense: UnitQueueEntry[];
}

export interface ActiveResearch {
  id: string;
  endTime: number;
}

export interface ActiveMission {
  key: string;
  endTime: number;
}

export interface PlayerBonuses {
  energyEfficiency: number;
  unitDefenseBonus: number;
  unitAttackBonus: number;
  buildingUpgradeDiscount: number;
  unlockedRecipes: number;
}

export interface ResourceHistoryPoint {
  t: number;
  r: Resources;
}

export interface PlayerState {
  uid: string;
  pseudo: string;
  resources: Resources;
  buildings: Buildings;
  units: Units;
  techLevels: TechLevels;
  bonuses: PlayerBonuses;
  xp: number;
  seasonId?: string;
  seasonXp?: number;
  victories: number;
  defeats: number;
  playtimeSeconds: number;
  resourcesUpdatedAtMs: number;
  resourceHistory?: ResourceHistoryPoint[];
  unlockedAchievements?: string[];
  /** Contrats quotidiens (voir src/game/contracts.ts). */
  contracts?: import("@/game/contracts").ContractsState;
  allianceId?: string | null;
  allianceLastReadMs?: number;
  createdAtMs?: number;
  /** Dernière défaite en défense (ms) — écrit par le serveur, sert au bouclier. */
  lastDefeatAtMs?: number;
  /** Dernière attaque lancée (ms) — écrit par le serveur ; lève la protection débutant. */
  lastAttackAtMs?: number;
  /** Score final de la saison précédente (gardé au changement de saison). */
  lastSeasonId?: string;
  lastSeasonXp?: number;
  /** Titres gagnés en fin de saison, et celui affiché. */
  titles?: PlayerTitle[];
  activeTitle?: string;
  /** Niveaux des recherches de son alliance (écrit par le serveur). */
  allianceResearch?: Record<string, number>;
  /** Par faction (ancien format v2.0 : état de Varan à plat, migré à la lecture). */
  pirates?: import("@/game/pirates").FactionStates | import("@/game/pirates").PirateState;
  /** Statistiques cumulées (v2.3), écrites par le serveur. */
  stats?: import("@/game/stats").PlayerStats;
  /** v2.9 : objectifs de prise en main réclamés. */
  onboarding?: { claimed: string[]; hidden?: boolean };
  /** v3.0 : posture de la base face aux attaques. */
  posture?: { id: "standard" | "bunker" | "riposte"; changedAtMs: number };
}

export interface SeasonResult {
  id: string;
  seasonId: string;
  /** "player" (individuel) ou "alliance" (v1.9). */
  kind?: string;
  uid: string;
  pseudo: string;
  allianceId: string;
  rank: number;
  seasonXp: number;
  reward: { hours: number; rare: number; title: string; gained?: Record<string, number> } | null;
  createdAtMs: number;
}

export interface PlayerTitle {
  label: string;
  seasonId: string;
  rank: number;
}

export interface QueuesState {
  buildingUpgrades: BuildingUpgrades;
  unitQueues: UnitQueues;
  activeResearches: ActiveResearch[];
  activeMissions: ActiveMission[];
}

export type CombatOutcome = "attacker_win" | "defender_win" | "draw";

export interface BattleReport {
  id: string;
  attackerUid: string;
  attackerPseudo: string;
  defenderUid: string;
  defenderPseudo: string;
  /** Horodatage en millisecondes. */
  timestamp: number;
  outcome: CombatOutcome;
  attackerPower: number;
  defenderPower: number;
  attackerLossPercent: number;
  defenderLossPercent: number;
  attackerLosses: Record<string, number>;
  attackerRecovered: Record<string, number>;
  defenderLosses: Record<string, number>;
  defenderRecovered: Record<string, number>;
  loot: Partial<Record<ResourceId, number>> | null;
  /** Rapport vu par le défenseur (affiché une fois à sa connexion). */
  defenderProcessed: boolean;
  /** Pertes du défenseur déjà appliquées par le serveur au moment du combat
   *  (absent des anciens rapports : le serveur les applique à la lecture). */
  defenderApplied?: boolean;
  /** XP gagnée/perdue par chaque camp, calculée par le serveur (absente des
   *  anciens rapports, créés avant le combat côté serveur). */
  attackerXpDelta?: number;
  defenderXpDelta?: number;
  /** Garnisons alliées engagées en défense (v1.9). */
  garrisons?: { ownerUid: string; ownerPseudo: string; units: Record<string, number>; losses: Record<string, number> }[];
  /** v2.8 : flotte envoyée par l'attaquant (statistiques d'équilibrage). */
  attackerFleet?: Record<string, number>;
}

export interface SpyReport {
  id: string;
  spyUid: string;
  spyPseudo: string;
  targetUid: string;
  targetPseudo?: string;
  /** Horodatage en millisecondes. */
  timestamp: number;
  targetProcessed: boolean;
  /** v1.7 : rapports produits par le serveur à l'arrivée des sondes. */
  probes?: number;
  score?: number;
  /** 0 = brouillé, 1 à 4 = paliers atteints (voir src/game/espionage.ts). */
  tier?: number;
  detected?: boolean;
  data?: SpyReportData;
}

export interface SpyReportData {
  resources?: Partial<Record<ResourceId, number>>;
  units?: Record<string, { count: number; level: number }>;
  defenses?: Record<string, { count: number; level: number }>;
  garrisons?: { ownerPseudo: string; units: Record<string, number> }[];
  /** v3.0 : posture de la base espionnée. */
  posture?: string;
  buildings?: Record<string, number>;
  techLevels?: Record<string, number>;
  queues?: {
    buildings: { id: string; endTime: number }[];
    researches: { id: string; endTime: number }[];
    units: { id: string; endTime: number | null }[];
  };
  fleets?: { mission: string; targetPseudo: string; units: Record<string, number>; status: string; at: number }[];
}

export interface ResourceGift {
  id: string;
  fromUid: string;
  fromPseudo: string;
  toUid: string;
  toPseudo: string;
  resources: Partial<Resources>;
  /** Horodatage en millisecondes. */
  timestamp: number;
  claimed: boolean;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  createdBy: string;
  createdAtMs?: number;
  members: string[];
  memberPseudos: Record<string, string>;
  /** Officiers explicitement promus ; le fondateur (createdBy) n'y figure
   *  pas et quiconque d'autre est un simple membre par défaut. */
  roles?: Record<string, "officer">;
  /** v1.9 : trésor commun, recherches et limite de versements du jour. */
  treasury?: Partial<Record<ResourceId, number>>;
  research?: Record<string, number>;
  activeResearch?: { id: string; level: number; endTime: number } | null;
  distributions?: { day: string; count: number };
}

export interface AllianceLog {
  id: string;
  allianceId: string;
  kind: "deposit" | "distribute" | "research" | "research-done" | "join" | "leave" | "kick";
  actorUid: string;
  actorPseudo: string;
  targetUid?: string;
  targetPseudo?: string;
  resources?: Partial<Record<ResourceId, number>> | null;
  text?: string;
  createdAtMs: number;
}

export interface AllianceMessage {
  id: string;
  authorUid: string;
  authorPseudo: string;
  text: string;
  createdAtMs: number;
}

export type NotificationKind =
  | "building"
  | "research"
  | "unit"
  | "mission"
  | "combat-attacker"
  | "combat-defender"
  | "achievement"
  | "spy-detected"
  | "spy"
  | "debris"
  | "season"
  | "alliance"
  | "event"
  | "gift"
  | "fleet"
  | "report"
  | "system";

export interface GameNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAtMs: number;
  read: boolean;
}
