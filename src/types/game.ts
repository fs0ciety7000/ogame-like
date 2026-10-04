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
  /** v4.7 : départ et coût payé (annulation au prorata). */
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
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
  /** v4.7 : départ et coût payé (annulation au prorata). */
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
  /** v5.9 : ambre payé (remboursé au prorata à l'annulation). */
  paidAmber?: number;
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
  /** v4.6 : dernière synchro réelle du navigateur (arrondie à 2 min). */
  /** v5.5 : compte test (administration) : chantiers instantanés, aucun délai d'officier. */
  testMode?: boolean;
  lastActiveMs?: number;
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
  onboarding?: { claimed: string[]; hidden?: boolean; tutorialRaid?: "due" | "sent" };
  /** v3.0 : posture de la base face aux attaques. */
  posture?: { id: "standard" | "bunker" | "riposte"; changedAtMs: number };
  /** v3.4 : nombre d'ascensions et date de la dernière. */
  ascensions?: number;
  ascendedAtMs?: number;
  /** v3.5 : colonies (stocks séparés) et vaisseau colonial en route. */
  colonies?: import("@/game/colonies").Colony[];
  /** v5.1 : talents d'Ascension (rangs, dernière redistribution). */
  talents?: import("@/game/talents").TalentState | null;
  /** v5.1 : bonus de territoire (écrit par le serveur toutes les heures). */
  territory?: import("@/game/territories").PlayerTerritory | null;
  colonizing?: import("@/game/colonies").Colonizing | null;
  /** v3.9 : chasseurs de primes (Ambre, réputation, contrats, Comptoir). */
  bounties?: import("@/game/bounties").BountyState;
  /** v3.9.2 : ne plus recevoir les nouvelles du jeu par e-mail. */
  emailOptOut?: boolean;
  /** v4.0 : notifications d'alliance que le joueur veut recevoir (absent = oui). */
  notifPrefs?: { allianceChat?: boolean; pactMessages?: boolean; allianceEvents?: boolean; warlords?: boolean };
  /** v4.0 : officiers, reliques et capsules du Labo de synthèse. */
  commanders?: import("@/game/commanders").CommandersState;
  relics?: import("@/game/relics").RelicsState;
  synthesis?: import("@/game/synthesis").SynthesisState;
  /** v4.0 : bannière, emblème et devise de la fiche publique. */
  profileStyle?: import("@/game/profile").ProfileStyle;
  /** v5.1 : changement de pseudo unique (ancien pseudo, date). */
  renamed?: import("@/game/rename").RenameState | null;
  /** v5.3 : série de connexion quotidienne. */
  streak?: import("@/game/streak").StreakState | null;
  /** v4.1 : passe de saison et parrainage. */
  seasonPass?: import("@/game/seasonPass").PassState;
  referral?: import("@/game/referral").ReferralState;
  /** v4.2 : seigneur de guerre tenu par le jeu (identifiant du roster), vide pour un joueur. */
  npc?: string;
  /** v4.2 : mode vacances. */
  vacation?: import("@/game/vacation").VacationState | null;
  /** v4.3 : épisodes des Chroniques du mois et sceaux de boss gagnés. */
  chronicle?: import("@/game/chronicles").ChronicleState;
  /** v4.7.1 : annonces plein écran déjà fermées (sur tous les appareils). */
  announcementsSeen?: string[];
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
  /** v4.9 : améliorations programmées à la suite (file planifiée). */
  buildPlan?: import("@/game/buildPlan").PlannedUpgrade[];
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
  /** v3.5 : colonie attaquée (vide : planète mère). */
  planetId?: string;
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
  /** v4.0 : l'Espionne a flairé un brouilleur de défense (chiffres faussés). */
  anomaly?: boolean;
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
  /** v4.9 : « diplomat » (pactes et guerres, 2 au plus). */
  roles?: Record<string, "officer" | "diplomat">;
  /** v1.9 : trésor commun, recherches et limite de versements du jour. */
  treasury?: Partial<Record<ResourceId, number>>;
  research?: Record<string, number>;
  activeResearch?: { id: string; level: number; endTime: number } | null;
  distributions?: { day: string; count: number };
  /** v3.3 : projets (niveau, financement en cours, fin de construction) et
   *  contributions personnelles des membres (valeur, une rare = 100). */
  projects?: Record<string, { level: number; funded: Partial<Record<ResourceId, number>>; buildEndMs: number }>;
  projectContributors?: Record<string, number>;
  /** v4.6 : boss d'alliance de la semaine (état du moteur du Léviathan). */
  boss?: unknown;
  /** v4.9 : objectif du jour (propositions, vote, progression). */
  daily?: unknown;
  /** v5.1 : coffre de guerre (dépôts des objectifs du jour). */
  warChest?: import("@/game/seasonWars").WarChest | null;
}

export interface AllianceLog {
  id: string;
  allianceId: string;
  kind: "deposit" | "distribute" | "research" | "research-done" | "project" | "project-done" | "join" | "leave" | "kick";
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
  | "message"
  | "bounty"
  | "system";

export interface GameNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAtMs: number;
  read: boolean;
  /** v3.8 : page à ouvrir au clic (sinon, page associée au type). */
  link?: string;
}
