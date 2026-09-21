export type CommonResourceId = "scrap" | "energy" | "nano" | "data";
export type RareResourceId = "reinforcedSteel" | "cyberModule" | "syntheticNanites" | "aiFragment";
export type ResourceId = CommonResourceId | RareResourceId;

export type Resources = Record<ResourceId, number>;

export type BuildingId =
  | "extracteur_ferraille"
  | "reacteur_instable"
  | "extracteur_nanocomposants"
  | "archives_fracturees"
  | "atelier_reparation"
  | "hangar_attaque"
  | "hangar_defense";

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
  victories: number;
  defeats: number;
  playtimeSeconds: number;
  resourcesUpdatedAtMs: number;
  resourceHistory?: ResourceHistoryPoint[];
  unlockedAchievements?: string[];
  createdAt?: unknown;
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
  timestamp: unknown;
  outcome: CombatOutcome;
  attackerPower: number;
  defenderPower: number;
  attackerLossPercent: number;
  defenderLossPercent: number;
  attackerLosses: Record<string, number>;
  attackerRecovered: Record<string, number>;
  defenderLosses: Record<string, number>;
  defenderRecovered: Record<string, number>;
  loot: Partial<Record<RareResourceId, number>> | null;
  defenderProcessed: boolean;
}

export interface SpyReport {
  id: string;
  spyUid: string;
  spyPseudo: string;
  targetUid: string;
  timestamp: unknown;
  targetProcessed: boolean;
}

export interface ResourceGift {
  id: string;
  fromUid: string;
  fromPseudo: string;
  toUid: string;
  toPseudo: string;
  resources: Partial<Resources>;
  timestamp: unknown;
  claimed: boolean;
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
  | "gift"
  | "system";

export interface GameNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAtMs: number;
  read: boolean;
}
