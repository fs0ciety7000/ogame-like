import { defenseRebuildBonus } from "@/game/buildingTiers";
import { describeLoot, lootDifficulty, rollLoot } from "@/game/loot";
import { spendResources } from "@/game/spending";
import { edgeParam, playerCombatEffects } from "@/game/effectTargets";
import { applyHull, sendToWorkshop, withFleet, workshopState } from "@/game/workshop";
import { ENDGAME_TECH_IDS } from "@/game/technologies";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { addPassPoints } from "@/game/seasonPass";
import { CONTRACT_RULES, recordContract } from "@/game/contracts";
import { getProductionRatesPerSecond } from "@/game/production";
import { formationEffects, postureEffects } from "@/game/formations";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings, BUILDINGS, effectiveBuildingLevel, getRepairPercent, getStorageCapacity } from "@/game/buildings";
import { bumpStat, recordThreat } from "@/game/stats";
import { combatLogOf, computeFullPower, getShieldPercent, homeDefensePower, pveAttackFactor, pveHomeDefenseFactor, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { COMMON_RESOURCES, protectedAmount } from "@/game/economy";
import { ALLIANCE_RULES, allianceShieldBonus, allianceSiegeFactor } from "@/game/alliances";
import { applyXpDelta } from "@/game/seasons";
import { GameActionError } from "@/game/errors";
import { describeGain, formatInt } from "@/game/format";
import { OFFENSIVE_UNITS } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { START_REWARD_RULES, tutorialRaidBounty } from "@/game/startRewards";
import { TUTORIAL_RAID } from "@/game/story";
import type { BattleReport, PlayerState, QueuesState, ResourceId, Units } from "@/types/game";

/* =====================================================
   Factions hostiles (v2.0, généralisé en v2.1) : des factions contrôlées
   par le jeu inscrivent un empire sur leur liste, exigent un tribut, puis
   attaquent en cas de refus. Chaque faction est une fiche de données
   (section de contenu « factions », modifiable dans l'administration) :
   déclencheur, tribut, cible et force du raid, primes, repaire.

   Une seule menace à la fois par joueur. La Notoriété et le repaire sont
   propres à chaque faction.
===================================================== */

/** wealth : empires actifs ; aggression : victoires récentes contre des joueurs ;
 *  research : savoir accumulé et recherche récente ; hoard : entrepôts pleins ;
 *  expansion : niveaux de bâtiments gagnés sur la période. */
export type FactionTrigger = "wealth" | "aggression" | "research" | "hoard" | "expansion" | "singularity";
export type RaidTarget = "base" | "fleet";

export interface FactionDef {
  id: string;
  enabled: boolean;
  name: string;
  leader: string;
  enforcer: string;
  /** Illustration (chemin public ou URL d'un fichier envoyé). */
  art: string;
  /** v3.6 : scène large (repaire), affichée en tête de la carte de faction. */
  banner?: string;
  /** v3.6 : emblème (sceau) de la faction. */
  emblem?: string;
  /** Couleur d'accent : ember, gold, cyan, mint, danger. */
  color: string;
  /** Récit (paragraphes séparés par une ligne vide). */
  story: string;
  ultimatum: {
    title: string;
    /** Réplique du chef ; {pseudo} est remplacé par le pseudo du joueur. */
    quote: string;
    signature: string;
    payLabel: string;
  };
  trigger: {
    type: FactionTrigger;
    /** Délai entre deux inscriptions (tirage uniforme), en heures. */
    minIntervalHours: number;
    maxIntervalHours: number;
    /** Richesse : seuls les joueurs actifs récemment sont visés. */
    activeWithinHours: number;
    /** Agression : victoires contre des joueurs sur la période. */
    minVictories: number;
    windowDays: number;
    /** Seuil des déclencheurs research (niveaux de technos), hoard (% des
     *  entrepôts) et expansion (niveaux de bâtiments gagnés). */
    threshold?: number;
  };
  tribute: {
    /** production : heures de production ; plunder : part du butin récent ;
     *  stock : part du stock de ressources communes (hors bunker). */
    basis: "production" | "plunder" | "stock";
    hours: number;
    plunderPct: number;
    /** Plancher en heures de production (bases « plunder » et « stock »). */
    minHours: number;
    stockPct?: number;
  };
  answerHours: number;
  raidTravelHours: number;
  raid: {
    /** base : défenses + flotte à quai ; fleet : la flotte à quai seule. */
    target: RaidTarget;
    basePct: number;
    perNotorietyPct: number;
    maxNotoriety: number;
    floorPower: number;
    floorPerBuildingLevel: number;
    lootPct: number;
    lootKind: "common" | "rare";
  };
  bounty: { hours: number; rare: number; xp: number; debrisPerPower: number };
  lair: { name: string; raidsNeeded: number; pct: number; rewardHours: number; rare: number; xp: number; title: string };
  /** 6.14.125 (AU27, lot AA7, constat AA-20) : fugitifs de la faction, traqués pour les Kesh'Vaar (tableau des primes).
   *  Absent (contenu enregistré avant) : ceux de la faction livrée du même identifiant. */
  fugitives?: FactionFugitive[];
}

/** 6.14.125 (AA7) : fugitif d'une faction (nom, crime contre la Ruche, « a vendu… »). */
export interface FactionFugitive {
  name: string;
  crime: string;
}

/** Taille maximale des pseudos d'un rapport de combat (schéma battle_reports). */
export const REPORT_PSEUDO_MAX = 120;

export const DEFAULT_FACTIONS: FactionDef[] = [
  {
    id: "varan",
    enabled: true,
    name: "Confrérie du Vide",
    leader: "Capitaine Orsk Varan",
    enforcer: "Le Silencieux",
    art: "/assets/story/varan.webp",
    banner: "/assets/story/varan-banner.webp",
    emblem: "/assets/story/varan-emblem.webp",
    color: "ember",
    story:
      "Depuis l'effondrement des routes commerciales, une flotte sans bannière rôde aux confins de la galaxie : la Confrérie du Vide.\n\n" +
      "Son chef, le capitaine Orsk Varan, ancien officier impérial à la barbe grise, tient à jour une tablette lumineuse : la Liste, les empires trop riches pour être prudents. Ses ordres sont exécutés par le Silencieux, un colosse au masque respiratoire dont personne n'a jamais entendu la voix. Quand son doigt se pose sur toi, ton nom vient d'entrer sur la Liste.\n\n" +
      "Varan laisse toujours un choix : payer le tribut, ou voir le Silencieux venir le chercher lui-même.",
    ultimatum: {
      title: "« Ton nom est sur ma Liste. »",
      quote:
        "{pseudo}… Ton empire brille un peu trop dans le noir. Le Silencieux t'a désigné, et il ne se trompe jamais. Verse ta part à la Confrérie, et nous t'oublierons. Refuse, et il viendra la prendre lui-même.",
      signature: "Capitaine Orsk Varan",
      payLabel: "Payer le tribut",
    },
    trigger: { type: "wealth", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7 },
    tribute: { basis: "production", hours: 6, plunderPct: 0, minHours: 0 },
    answerHours: 12,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.7, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "common" },
    bounty: { hours: 4, rare: 0, xp: 25, debrisPerPower: 1 },
    lair: { name: "Repaire de Varan", raidsNeeded: 3, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Fléau de la Confrérie" },
    fugitives: [
      { name: "Korr le Rouilleux", crime: "a vendu les coordonnées de la Ruche-Mère à la Confrérie" },
      { name: "Mira Tessane", crime: "a tracé la route du pillage à travers les nébuleuses" },
      { name: "Le Borgne Halvik", crime: "a revendu trois œufs royaux à des collectionneurs" },
      { name: "Drest Oumane", crime: "a ouvert le feu sur les nourrices de la Ruche" },
    ],
  },
  {
    id: "gravhorn",
    enabled: true,
    name: "Syndicat Gravhorn",
    leader: "Oggrath le Pisteur",
    enforcer: "L'Unité Ambre",
    art: "/assets/story/gravhorn.webp",
    banner: "/assets/story/gravhorn-banner.webp",
    emblem: "/assets/story/gravhorn-emblem.webp",
    color: "gold",
    story:
      "On ne fuit pas le Syndicat. On le paie, ou on devient son trophée.\n\n" +
      "Les Gravhorns sont une espèce de chasseurs à la peau tachetée et cornue, dont les antennes captent la peur à des parsecs de distance. Ils ne pillent pas au hasard : ils exécutent des contrats. Chaque empire que tu dévastes peut, en secret, déposer une prime sur ta tête.\n\n" +
      "Le contrat est confié à Oggrath le Pisteur, vétéran au regard las qui a déjà tout vu. Il ne se déplace jamais seul : à ses côtés marche l'Unité Ambre, une combinaison orange à visière tactique dont personne ne sait ce qu'elle abrite. Sa visière affiche déjà ta flotte.",
    ultimatum: {
      title: "« Il y a un contrat sur ta tête. »",
      quote:
        "{pseudo}. Tes victimes ont payé cher pour te voir tomber. Moi, je suis un professionnel : rachète ton contrat, et l'Unité Ambre range ses armes. Sinon, elle vient pour tes vaisseaux. Pas pour tes murs. Pour tes vaisseaux.",
      signature: "Oggrath le Pisteur",
      payLabel: "Racheter le contrat",
    },
    trigger: { type: "aggression", minIntervalHours: 48, maxIntervalHours: 72, activeWithinHours: 72, minVictories: 3, windowDays: 7 },
    tribute: { basis: "plunder", hours: 0, plunderPct: 0.5, minHours: 4 },
    answerHours: 8,
    raidTravelHours: 1.5,
    raid: { target: "fleet", basePct: 0.8, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "rare" },
    bounty: { hours: 0, rare: 200, xp: 40, debrisPerPower: 1 },
    lair: { name: "Chambre des Contrats", raidsNeeded: 3, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Chasseur de chasseurs" },
    fugitives: [
      { name: "Vrask Deux-Cornes", crime: "expose des larves comme trophées de chasse" },
      { name: "Ulla la Muette", crime: "a piégé l'escorte de la Reine" },
      { name: "Thokk Sang-Gris", crime: "a brisé les sceaux d'ambre du sanctuaire" },
      { name: "Brenna Kesh-Tueuse", crime: "porte un collier d'antennes kesh'vaar" },
    ],
  },
  {
    id: "inquisition",
    enabled: true,
    name: "Inquisition de l'Aube Blanche",
    leader: "Haut-Juge Séraphin Vol",
    enforcer: "Le Lecteur",
    art: "/assets/story/inquisition.webp",
    banner: "/assets/story/inquisition-banner.webp",
    emblem: "/assets/story/inquisition-emblem.webp",
    color: "cyan",
    story:
      "Dans les archives scellées de l'ancien Empire, certaines connaissances étaient interdites. L'Inquisition de l'Aube Blanche s'est donné pour mission de les garder enfouies.\n\n" +
      "Le Haut-Juge Séraphin Vol, drapé de blanc et d'or, lit chaque découverte comme une hérésie. Ses lunettes d'or ne quittent jamais son Livre des Interdits, où s'inscrivent d'elles-mêmes les recherches des empires trop curieux.\n\n" +
      "Sa sentence est exécutée par le Lecteur, un androïde-scribe au visage de porcelaine qui récite à voix basse les crimes de ses cibles avant de frapper. On dit qu'il n'a jamais oublié une ligne.",
    ultimatum: {
      title: "« Ton savoir est une hérésie. »",
      quote:
        "{pseudo}. Ton nom vient d'apparaître dans le Livre. Tes laboratoires ont touché à ce qui devait rester enfoui. Fais pénitence, et l'Aube Blanche te pardonnera. Persiste, et le Lecteur viendra réciter tes fautes devant tes murs.",
      signature: "Haut-Juge Séraphin Vol",
      payLabel: "Faire pénitence",
    },
    trigger: { type: "research", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 3, threshold: 30 },
    tribute: { basis: "production", hours: 6, plunderPct: 0, minHours: 0 },
    answerHours: 10,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.75, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "rare" },
    bounty: { hours: 3, rare: 100, xp: 30, debrisPerPower: 1 },
    lair: { name: "Le Scriptorium Orbital", raidsNeeded: 3, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Hérétique" },
    fugitives: [
      { name: "Frère Anselme Dor", crime: "a brûlé les archives chantées de la Ruche" },
      { name: "Sœur Ilvane", crime: "dissèque des œufs pour l'Aube Blanche" },
      { name: "Le Diacre Morrow", crime: "a déclaré l'Essaim « hérésie vivante »" },
      { name: "Inquisitrice Talas", crime: "a scellé une couvée dans un reliquaire" },
    ],
  },
  {
    id: "cartel",
    enabled: true,
    name: "Cartel Néon",
    leader: "Madame Vashti Kor",
    enforcer: "Les Jumeaux Chrome",
    art: "/assets/story/cartel.webp",
    banner: "/assets/story/cartel-banner.webp",
    emblem: "/assets/story/cartel-emblem.webp",
    color: "danger",
    story:
      "Sur les stations-casinos de la Bordure, tout s'achète : les dettes, les secrets, les vies. Le Cartel Néon y règne sans partage.\n\n" +
      "Madame Vashti Kor, reine du Cartel en manteau de fourrure et lunettes holographiques, prête à toute la galaxie, et finit toujours par se faire rembourser. Elle flaire l'odeur des coffres pleins comme d'autres sentent le parfum.\n\n" +
      "Ses recouvreurs, les Jumeaux Chrome, deux mercenaires identiques aux visières dorées, ne parlent jamais en même temps et ne ratent jamais un coffre.",
    ultimatum: {
      title: "« Tes coffres débordent, chéri. »",
      quote:
        "{pseudo}, mon cher… Tes entrepôts brillent jusque dans mes salons. Dans la Bordure, la richesse paie des intérêts. Règle ta part, et nous resterons bons amis. Sinon, les Jumeaux passeront compter eux-mêmes.",
      signature: "Madame Vashti Kor",
      payLabel: "Payer les intérêts",
    },
    trigger: { type: "hoard", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 80 },
    tribute: { basis: "stock", hours: 0, plunderPct: 0, minHours: 4, stockPct: 0.15 },
    answerHours: 12,
    raidTravelHours: 2.5,
    raid: { target: "base", basePct: 0.7, perNotorietyPct: 0.1, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.2, lootKind: "common" },
    bounty: { hours: 6, rare: 0, xp: 30, debrisPerPower: 1 },
    lair: { name: "Le Casino Fantôme", raidsNeeded: 3, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Briseur de Cartel" },
    fugitives: [
      { name: "Rico Vant", crime: "vend des œufs au marché noir de Néon" },
      { name: "Lady Sabre", crime: "a fait fondre de l'Ambre sacrée en bijoux" },
      { name: "Doc Ferro", crime: "distille un stimulant à partir de gelée royale" },
      { name: "Les Jumeaux Kalis", crime: "blanchissent les gains du pillage" },
    ],
  },
  {
    id: "meute",
    enabled: true,
    name: "Meute d'Ysgrim",
    leader: "Ysgrim Crocs-de-Fer",
    enforcer: "La Louve Rouge",
    art: "/assets/story/meute.webp",
    banner: "/assets/story/meute-banner.webp",
    emblem: "/assets/story/meute-emblem.webp",
    color: "ember",
    story:
      "Venus des mondes morts du Rift, les guerriers de la Meute ont remplacé leur chair par l'acier et ne vivent que pour la chasse.\n\n" +
      "Ysgrim Crocs-de-Fer, colosse à tête de loup bardé d'implants, flaire l'expansion de loin : chaque empire qui grandit trop vite devient une proie.\n\n" +
      "Il envoie d'abord la Louve Rouge, éclaireuse à la cape écarlate et au fusil long, poser sa marque sur la cible. Quand la Meute charge ensuite, elle est rapide, et sans pitié pour les flottes restées au port.",
    ultimatum: {
      title: "« La Meute a senti ton odeur. »",
      quote:
        "Tu grandis vite, {pseudo}. Trop vite. La Louve Rouge a posé sa marque sur tes murs. Jette un os à la Meute, et nous chasserons ailleurs. Fais le fier, et nos crocs trouveront ta flotte avant l'aube.",
      signature: "Ysgrim Crocs-de-Fer",
      payLabel: "Jeter un os",
    },
    trigger: { type: "expansion", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 25 },
    tribute: { basis: "production", hours: 5, plunderPct: 0, minHours: 0 },
    answerHours: 6,
    raidTravelHours: 0.75,
    raid: { target: "fleet", basePct: 0.75, perNotorietyPct: 0.12, maxNotoriety: 8, floorPower: 300, floorPerBuildingLevel: 40, lootPct: 0.1, lootKind: "common" },
    bounty: { hours: 4, rare: 0, xp: 40, debrisPerPower: 1 },
    lair: { name: "La Tanière du Rift", raidsNeeded: 3, pct: 1.05, rewardHours: 24, rare: 300, xp: 100, title: "Dompteur de la Meute" },
    fugitives: [
      { name: "Grenn Croc-Noir", crime: "collectionne les mandibules des guerrières" },
      { name: "Skarra", crime: "a dévoré un nid entier d'éclaireurs" },
      { name: "Vieux Loup Odrik", crime: "a guidé la Meute jusqu'aux couvoirs" },
      { name: "Fenra Œil-Rouge", crime: "chasse les ouvrières pour le sport" },
    ],
  },
  {
    id: "choeur",
    enabled: true,
    name: "Le Chœur Silencieux",
    leader: "L'Archonte Vesper",
    enforcer: "Les Échos",
    art: "/assets/story/choeur.webp",
    banner: "/assets/story/choeur-banner.webp",
    emblem: "/assets/story/choeur-emblem.webp",
    color: "mint",
    story:
      "Il y a dix mille ans, une civilisation entière s'est fondue en une seule conscience, puis s'est tue. Ses cathédrales de cristal noir dérivent depuis aux confins de la galaxie, silencieuses.\n\n" +
      "Les signaux de vos fonderies quantiques et de vos cortex neuronaux l'ont réveillée. Le Chœur ne convoite pas vos coffres : il veut ce que vos laboratoires ont appris, et les fragments où vous l'avez gravé.\n\n" +
      "L'Archonte Vesper, masque de porcelaine sans bouche et halo de glyphes, parle pour des milliers de voix. Ceux qui refusent entendent d'abord un murmure dans leurs transmissions… puis voient arriver les Échos.",
    ultimatum: {
      title: "« Ton esprit chante trop fort. »",
      quote:
        "{pseudo}… Nous t'entendons. Tes machines pensent, tes forges plient la matière : tu chantes trop fort pour une si petite étoile. Offre-nous ce que tu as appris, et nous resterons silencieux. Refuse, et les Échos viendront l'apprendre eux-mêmes.",
      signature: "L'Archonte Vesper, pour le Chœur",
      payLabel: "Offrir le tribut",
    },
    trigger: { type: "singularity", minIntervalHours: 72, maxIntervalHours: 96, activeWithinHours: 72, minVictories: 0, windowDays: 7, threshold: 8 },
    tribute: { basis: "production", hours: 8, plunderPct: 0, minHours: 0 },
    answerHours: 12,
    raidTravelHours: 2,
    raid: { target: "base", basePct: 0.85, perNotorietyPct: 0.12, maxNotoriety: 8, floorPower: 2000, floorPerBuildingLevel: 80, lootPct: 0.15, lootKind: "rare" },
    bounty: { hours: 10, rare: 800, xp: 60, debrisPerPower: 1 },
    lair: { name: "La Cathédrale du Silence", raidsNeeded: 3, pct: 1.15, rewardHours: 36, rare: 1500, xp: 150, title: "Voix du Chœur brisé" },
    fugitives: [
      { name: "L'Écho Vashtar", crime: "a réduit au silence le chant de la Reine" },
      { name: "Maître-Chantre Ilos", crime: "garde un œuf royal dans sa cathédrale" },
    ],
  },
];

/** Registre courant (remplacé par applyGameContent). */
export const FACTIONS: FactionDef[] = [];
export function setFactions(defs: FactionDef[]) {
  FACTIONS.splice(0, FACTIONS.length, ...defs);
}
setFactions(structuredClone(DEFAULT_FACTIONS));

export function findFaction(id: string): FactionDef | undefined {
  return FACTIONS.find((f) => f.id === id);
}

/** Interrupteur général (règles « pirates »). */
export const PIRATE_RULES = {
  enabled: true,
  /** v5.5 : adaptation des raids à la réussite du joueur (par faction) : chaque raid
   *  repoussé renforce le suivant, chaque défaite l'affaiblit. Équilibre vers 70 % repoussés. */
  adaptUp: 0.04,
  adaptDown: 0.1,
  adaptMin: 0.9,
  adaptMax: 1.5,
  /** 6.6 : « Localiser » un repaire : raids repoussés requis et coût en heures de production. */
  lairLocateMinRepelled: 1,
  lairLocateCostHours: 12,
};

export const PIRATE_OWNER_UID = "pirates";
/** Cible d'un assaut de repaire : lair_<faction>. */
export function lairUid(factionId: string): string {
  return `lair_${factionId}`;
}
export function factionOfLair(uid: string): string {
  return uid.startsWith("lair_") ? uid.slice(5) : uid === "pirates_lair" ? "varan" : "";
}

export interface PirateUltimatum {
  tribute: Partial<Record<ResourceId, number>>;
  issuedAtMs: number;
  expiresAtMs: number;
}

export interface PirateState {
  notoriety: number;
  repelled: number;
  lairOpen: boolean;
  nextListAtMs: number;
  ultimatum: PirateUltimatum | null;
  raidUntilMs: number;
  raidsWon: number;
  raidsLost: number;
  tributesPaid: number;
  lairsTaken: number;
  /** v5.5 : multiplicateur d'adaptation des raids (1 = neutre). */
  adapt: number;
  /** Repère du déclencheur expansion : niveaux de bâtiments à une date. */
  mark?: { atMs: number; value: number } | null;
  /** 5.16 : traité en cours avec la faction. */
  treaty?: FactionTreaty | null;
}

/* ---------- 5.16 : traités avec les factions ---------- */

export type TreatyKind = "pact" | "escort" | "embargo";

export interface FactionTreaty {
  kind: TreatyKind;
  signedAtMs: number;
  untilMs: number;
}

export const TREATY_RULES = {
  durationDays: 7,
  /** Coût en heures de production commune (0 = gratuit). */
  cost: { pact: 2, escort: 4, embargo: 0 } as Record<TreatyKind, number>,
  /** Notoriété maximale pour signer (embargo : sans condition). */
  maxNotoriety: { pact: 3, escort: 1, embargo: 99 } as Record<TreatyKind, number>,
  /** Escorte : embuscades d'expédition × ce facteur. */
  escortAmbush: 0.5,
  /** Embargo : raids plus forts, primes plus grosses. */
  embargoRaidPower: 1.25,
  embargoBounty: 1.5,
  embargoNotoriety: 1,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TREATY_RULES_META = {
  durationDays: { label: "Durée d'un traité", unit: "j", min: 1, max: 60 },
  cost: { label: "Coût par traité", unit: "h", hint: "Heures de production commune ; 0 = gratuit." },
  maxNotoriety: { label: "Notoriété maximale pour signer", hint: "Par traité ; embargo sans condition." },
  escortAmbush: { label: "Escorte : embuscades d'expédition", unit: "×", min: 0, max: 1 },
  embargoRaidPower: { label: "Embargo : puissance des raids", unit: "×", min: 1, max: 5 },
  embargoBounty: { label: "Embargo : primes", unit: "×", min: 1, max: 5 },
  embargoNotoriety: { label: "Embargo : notoriété ajoutée", min: 0, max: 10 },
};

export const TREATY_LABELS: Record<TreatyKind, { name: string; effect: string }> = {
  pact: { name: "Pacte de péage", effect: "Pas d'ultimatum ni de raid de leur part ; en expédition, leurs patrouilles te laissent passer sans péage." },
  escort: { name: "Contrat d'escorte", effect: "Leurs navires escortent tes expéditions : deux fois moins d'embuscades." },
  embargo: { name: "Embargo", effect: "Tu leur fermes tes marchés : leurs raids sont 25 % plus forts, mais les repousser rapporte 50 % de plus. Notoriété +1." },
};

/** Traité en vigueur avec une faction (null s'il a expiré). */
export function activeTreaty(st: Pick<PirateState, "treaty"> | undefined, now: number): FactionTreaty | null {
  const t = st?.treaty;
  return t && t.untilMs > now ? t : null;
}

/** Un traité de ce type est-il en vigueur avec au moins une faction ? */
export function hasTreaty(player: Pick<PlayerState, "pirates">, kind: TreatyKind, now: number, factionId?: string): boolean {
  const states = factionStates(player);
  return Object.entries(states).some(([id, st]) => (!factionId || id === factionId) && activeTreaty(st, now)?.kind === kind);
}

/** Signe un traité : coût prélevé (production), conditions de notoriété, une menace en cours l'interdit. */
export function signTreaty(player: PlayerState, factionId: string, kindIn: unknown, now: number): { treaty: FactionTreaty; paid: Partial<Record<ResourceId, number>> } {
  const kind = kindIn === "pact" || kindIn === "escort" || kindIn === "embargo" ? kindIn : null;
  if (!kind) throw new GameActionError("Traité inconnu.");
  const faction = findFaction(factionId);
  if (!faction || !faction.enabled) throw new GameActionError("Faction inconnue.");
  const st = pirateState(player, faction.id);
  if (activeTreaty(st, now)) throw new GameActionError("Un traité est déjà en vigueur avec cette faction.");
  if ((st.ultimatum && st.ultimatum.expiresAtMs > now) || st.raidUntilMs > now) throw new GameActionError(`${faction.name} est déjà en route ou attend ta réponse : règle d'abord la menace en cours.`);
  if (st.notoriety > TREATY_RULES.maxNotoriety[kind]) throw new GameActionError(`${faction.leader} ne traite pas avec toi : notoriété ${st.notoriety}, il faut ${TREATY_RULES.maxNotoriety[kind]} au plus.`);
  const cost = TREATY_RULES.cost[kind] > 0 ? productionHours(player, TREATY_RULES.cost[kind]) : {};
  // 6.14.110 (AC-5) : dépense comptée.
  spendResources(player, cost, now, { message: `Il faut ${describeGain(cost)} pour signer.` });
  const treaty: FactionTreaty = { kind, signedAtMs: now, untilMs: now + TREATY_RULES.durationDays * 86400_000 };
  st.treaty = treaty;
  if (kind === "embargo") st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + TREATY_RULES.embargoNotoriety);
  setFactionState(player, faction.id, st);
  return { treaty, paid: cost };
}

/* ---------- 6.6 (revue AU1, PNJ-3) : localiser un repaire ---------- */

export const LAIR_LOCATE_RULES = {
  /** Raids repoussés au moins une fois contre la faction (réglable : Admin → Événements → Factions hostiles). */
  get minRepelled(): number {
    return PIRATE_RULES.lairLocateMinRepelled;
  },
  /** Coût : heures de production commune. */
  get costHours(): number {
    return PIRATE_RULES.lairLocateCostHours;
  },
};

/** Ouvre le repaire d'une faction contre de la production, sans attendre les raids. */
export function locateLair(player: PlayerState, factionId: string, now: number): { paid: Partial<Record<ResourceId, number>> } {
  const faction = findFaction(factionId);
  if (!faction || !faction.enabled) throw new GameActionError("Faction inconnue.");
  const st = pirateState(player, faction.id);
  if (st.lairOpen) throw new GameActionError(`${faction.lair.name} est déjà localisé.`);
  if (st.repelled < LAIR_LOCATE_RULES.minRepelled) throw new GameActionError(`Repousse d'abord au moins ${LAIR_LOCATE_RULES.minRepelled} raid de ${faction.name} : tes éclaireurs n'ont aucune piste.`);
  const cost = productionHours(player, LAIR_LOCATE_RULES.costHours);
  // 6.14.110 (AC-5) : dépense comptée.
  spendResources(player, cost, now, { message: `Il faut ${describeGain(cost)} pour localiser le repaire.` });
  st.lairOpen = true;
  setFactionState(player, faction.id, st);
  return { paid: cost };
}

/** État de toutes les factions d'un joueur (avec migration de l'ancien
 *  format v2.0, où l'état de Varan était stocké à plat). */
export type FactionStates = Record<string, PirateState>;

function normalize(p: Partial<PirateState> | undefined, maxNotoriety = 8): PirateState {
  return {
    notoriety: Math.max(0, Math.min(maxNotoriety, p?.notoriety ?? 0)),
    repelled: p?.repelled ?? 0,
    lairOpen: p?.lairOpen ?? false,
    nextListAtMs: p?.nextListAtMs ?? 0,
    ultimatum: p?.ultimatum ?? null,
    raidUntilMs: p?.raidUntilMs ?? 0,
    raidsWon: p?.raidsWon ?? 0,
    raidsLost: p?.raidsLost ?? 0,
    tributesPaid: p?.tributesPaid ?? 0,
    lairsTaken: p?.lairsTaken ?? 0,
    adapt: Number.isFinite(p?.adapt) ? Math.max(PIRATE_RULES.adaptMin, Math.min(PIRATE_RULES.adaptMax, p!.adapt!)) : 1,
    mark: p?.mark ?? null,
    treaty: p?.treaty && typeof p.treaty === "object" && Number(p.treaty.untilMs) > 0 ? p.treaty : null,
  };
}

function isLegacy(raw: unknown): boolean {
  return !!raw && typeof raw === "object" && ("notoriety" in raw || "nextListAtMs" in raw);
}

export function factionStates(player: Pick<PlayerState, "pirates">): FactionStates {
  const raw = (player.pirates ?? {}) as Record<string, unknown>;
  const out: FactionStates = {};
  if (isLegacy(raw)) out.varan = normalize(raw as Partial<PirateState>);
  else for (const [id, st] of Object.entries(raw)) out[id] = normalize(st as Partial<PirateState>);
  return out;
}

export function pirateState(player: Pick<PlayerState, "pirates">, factionId = "varan"): PirateState {
  return factionStates(player)[factionId] ?? normalize(undefined);
}

export function setFactionState(player: PlayerState, factionId: string, st: PirateState) {
  setState(player, factionId, st);
}

function setState(player: PlayerState, factionId: string, st: PirateState) {
  player.pirates = { ...factionStates(player), [factionId]: st };
}

/** Ultimatum en attente (une seule menace à la fois). */
export function activeUltimatum(player: Pick<PlayerState, "pirates">, now: number): { faction: FactionDef; ultimatum: PirateUltimatum } | null {
  for (const [id, st] of Object.entries(factionStates(player))) {
    const faction = findFaction(id);
    if (faction && st.ultimatum && st.ultimatum.expiresAtMs > now) return { faction, ultimatum: st.ultimatum };
  }
  return null;
}

function hours(h: number): number {
  return h * 3600_000;
}

function nextListDelay(faction: FactionDef, random: () => number): number {
  const span = Math.max(0, faction.trigger.maxIntervalHours - faction.trigger.minIntervalHours);
  return hours(faction.trigger.minIntervalHours + random() * span);
}

/** Heures de production des ressources communes (prime, tribut). */
export function productionHours(player: Pick<PlayerState, "buildings" | "techLevels">, h: number): Partial<Record<ResourceId, number>> {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMON_RESOURCES) {
    const n = Math.floor((rates[res] ?? 0) * h * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}

/** 6.14.163 (S3) : raid d'initiation ? Faction du tutoriel, raid lancé par la prise en main (`tutorialRaid: "sent"`) et aucun
 *  raid de cette faction résolu avant (les raids ordinaires ne visent pas un compte de moins de 72 h). Règles désactivées : non. */
export function isTutorialRaid(player: Pick<PlayerState, "onboarding">, factionId: string, st: Pick<PirateState, "raidsWon" | "raidsLost">): boolean {
  if (!START_REWARD_RULES.enabled || factionId !== TUTORIAL_RAID.factionId) return false;
  const ob = player.onboarding as { tutorialRaid?: string } | undefined;
  return ob?.tutorialRaid === "sent" && (Number(st.raidsWon) || 0) + (Number(st.raidsLost) || 0) === 0;
}

function total(r: Partial<Record<ResourceId, number>>): number {
  return Object.values(r).reduce((a: number, b) => a + (b ?? 0), 0);
}

/** Puissance défensive d'une base (sans garnisons). */
export function defensivePower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return homeDefensePower(player.units ?? {}, player.techLevels ?? {});
}

/** Puissance de la flotte à quai engagée à 100 % (cible « flotte »). */
export function homeFleetPower(player: Pick<PlayerState, "units" | "techLevels">): number {
  return computeFullPower(player.units ?? {}, player.techLevels ?? {}, OFFENSIVE_UNITS, ["attack", "defense"]);
}

/** Ce que vise la faction : la base entière ou la flotte à quai. */
export function targetPower(faction: FactionDef, player: Pick<PlayerState, "units" | "techLevels">): number {
  return faction.raid.target === "fleet" ? homeFleetPower(player) : defensivePower(player);
}

/** `adapt` : multiplicateur d'adaptation du joueur pour cette faction (v5.5). */
export function raidPower(faction: FactionDef, player: PlayerState, notoriety: number, adapt = 1): number {
  const levels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const floor = faction.raid.floorPower + faction.raid.floorPerBuildingLevel * levels;
  const pct = faction.raid.basePct + faction.raid.perNotorietyPct * notoriety;
  return Math.round(Math.max(floor, targetPower(faction, player) * pct * adapt));
}

/** Activité guerrière récente d'un joueur (calculée par le serveur). */
export interface AggressionStats {
  victories: number;
  plunder: Partial<Record<ResourceId, number>>;
}

/** Ressources communes exposées (hors bunker de l'entrepôt). */
function exposedStock(player: PlayerState): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMON_RESOURCES) out[res] = Math.max(0, (player.resources?.[res] ?? 0) - protectedAmount(player.buildings ?? {}, res, player.techLevels, player.allianceResearch, player));
  return out;
}

/** Remplissage des entrepôts (ressource commune la plus pleine), en %. */
export function storageFillPct(player: PlayerState): number {
  const cap = getStorageCapacity(player.buildings ?? {}, player.techLevels);
  if (!(cap > 0)) return 0;
  return Math.floor((Math.max(...COMMON_RESOURCES.map((r) => player.resources?.[r] ?? 0)) / cap) * 100);
}

function totalTechLevels(player: Pick<PlayerState, "techLevels">): number {
  return Object.values(player.techLevels ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
}

export function totalBuildingLevels(player: Pick<PlayerState, "buildings">): number {
  return BUILDINGS.reduce((sum, b) => sum + (player.buildings?.[b.id]?.level ?? 0), 0);
}

export function tributeFor(faction: FactionDef, player: PlayerState, aggression: AggressionStats | null): Partial<Record<ResourceId, number>> {
  if (faction.tribute.basis === "production") return productionHours(player, faction.tribute.hours);
  if (faction.tribute.basis === "stock") {
    const fromStock: Partial<Record<ResourceId, number>> = {};
    for (const [res, v] of Object.entries(exposedStock(player)) as [ResourceId, number][]) {
      const n = Math.floor(v * (faction.tribute.stockPct ?? 0));
      if (n > 0) fromStock[res] = n;
    }
    const floor = productionHours(player, faction.tribute.minHours);
    return total(fromStock) >= total(floor) ? fromStock : floor;
  }
  const fromPlunder: Partial<Record<ResourceId, number>> = {};
  for (const [res, v] of Object.entries(aggression?.plunder ?? {}) as [ResourceId, number][]) {
    const n = Math.floor((v ?? 0) * faction.tribute.plunderPct);
    if (n > 0) fromPlunder[res] = n;
  }
  const floor = productionHours(player, faction.tribute.minHours);
  return total(fromPlunder) >= total(floor) ? fromPlunder : floor;
}

function note(kind: NewNotification["kind"], title: string, message: string, now: number, data?: NewNotification["data"]): NewNotification {
  return { kind, title, message, createdAtMs: now, read: false, ...(data ? { data } : {}) };
}

export interface PirateTickOutput {
  changed: boolean;
  /** Raid à lancer (ultimatum expiré sans réponse). */
  raid: { factionId: string; power: number; arriveAtMs: number } | null;
  notifications: NewNotification[];
}

/** Passage périodique du serveur, toutes factions confondues. Modifie
 *  `player.pirates`. `force` : inscription immédiate par une faction donnée. */
export function pirateTick(
  player: PlayerState,
  now: number,
  options: { random?: () => number; aggression?: AggressionStats | null; force?: string | null } = {},
): PirateTickOutput {
  const random = options.random ?? Math.random;
  const out: PirateTickOutput = { changed: false, raid: null, notifications: [] };
  if (!PIRATE_RULES.enabled) return out;
  const states = factionStates(player);
  if (isLegacy(player.pirates)) {
    player.pirates = states;
    out.changed = true;
  }

  // 1. Ultimatums expirés : le raid part.
  for (const faction of FACTIONS) {
    const st = states[faction.id];
    if (st?.ultimatum && now >= st.ultimatum.expiresAtMs) {
      out.raid = launchRaid(player, faction, st, now, random);
      out.changed = true;
      out.notifications.push(
        note("fleet", `${faction.enforcer} arrive`, `Tu n'as pas répondu à ${faction.leader} : raid dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min.`, now),
      );
      return out;
    }
  }

  // 2. Une seule menace à la fois.
  const busy = Object.values(states).some((st) => (st.ultimatum && st.ultimatum.expiresAtMs > now) || st.raidUntilMs > now);
  if (busy) return out;

  for (const faction of FACTIONS) {
    if (!faction.enabled) continue;
    // 5.16 : pacte de péage en vigueur : pas d'ultimatum de cette faction.
    if (activeTreaty(states[faction.id], now)?.kind === "pact" && options.force !== faction.id) continue;
    const forced = options.force === faction.id;
    if (options.force && !forced) continue;
    const st = states[faction.id] ?? normalize(undefined);
    if (!st.nextListAtMs && !forced) {
      // Premier passage : on fixe la date de la première inscription.
      st.nextListAtMs = now + (faction.trigger.type === "wealth" ? nextListDelay(faction, random) : hours(12));
      if (faction.trigger.type === "expansion") st.mark = { atMs: now, value: totalBuildingLevels(player) };
      setState(player, faction.id, st);
      out.changed = true;
      continue;
    }
    const active = now - (player.resourcesUpdatedAtMs ?? 0) <= hours(faction.trigger.activeWithinHours);
    const window = hours(faction.trigger.windowDays * 24);
    const threshold = faction.trigger.threshold ?? 0;
    let triggered = false;
    switch (faction.trigger.type) {
      case "aggression":
        triggered = (options.aggression?.victories ?? 0) >= faction.trigger.minVictories;
        break;
      case "research":
        triggered = totalTechLevels(player) >= threshold && now - (player.stats?.lastResearchAtMs ?? 0) <= window;
        break;
      case "hoard":
        triggered = active && storageFillPct(player) >= threshold;
        break;
      case "singularity":
        // v3.6 : niveaux cumulés des technologies de fin de partie.
        triggered = active && ENDGAME_TECH_IDS.reduce((a, id) => a + (player.techLevels?.[id] ?? 0), 0) >= threshold;
        break;
      case "expansion": {
        // Repère glissant : remis à zéro à la fin de chaque période.
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
    const eligible = forced || (now >= st.nextListAtMs && now - (player.createdAtMs ?? 0) >= hours(72) && triggered);
    if (!eligible) continue;
    const tribute = tributeFor(faction, player, options.aggression ?? null);
    st.ultimatum = { tribute, issuedAtMs: now, expiresAtMs: now + hours(faction.answerHours) };
    if (faction.trigger.type === "expansion") st.mark = { atMs: now, value: totalBuildingLevels(player) };
    setState(player, faction.id, st);
    recordThreat(player, faction.id);
    out.changed = true;
    out.notifications.push(
      note(
        "fleet",
        faction.ultimatum.title.replace(/[«»"]/g, "").trim(),
        `${faction.leader} exige ${formatInt(total(tribute))} ressources. Réponds avant ${faction.answerHours} h, ou ${faction.enforcer} viendra se servir.`,
        now,
      ),
    );
    return out; // une seule inscription par passage
  }
  return out;
}

function launchRaid(player: PlayerState, faction: FactionDef, st: PirateState, now: number, random: () => number) {
  const power = Math.round(raidPower(faction, player, st.notoriety, st.adapt) * (activeTreaty(st, now)?.kind === "embargo" ? TREATY_RULES.embargoRaidPower : 1));
  const arriveAtMs = now + hours(faction.raidTravelHours);
  st.ultimatum = null;
  st.raidUntilMs = arriveAtMs;
  st.nextListAtMs = arriveAtMs + nextListDelay(faction, random);
  setState(player, faction.id, st);
  return { factionId: faction.id, power, arriveAtMs };
}

/** Réponse du joueur à l'ultimatum en cours (production rattrapée avant). */
export function answerUltimatum(
  player: PlayerState,
  answer: "pay" | "refuse",
  now: number,
  random: () => number = Math.random,
): { raid: { factionId: string; power: number; arriveAtMs: number } | null; notifications: NewNotification[] } {
  const active = activeUltimatum(player, now);
  if (!active) throw new GameActionError("Aucun ultimatum en attente.");
  const { faction } = active;
  const st = pirateState(player, faction.id);
  const tribute = active.ultimatum.tribute;
  if (answer === "pay") {
    for (const [res, amount] of Object.entries(tribute) as [ResourceId, number][]) {
      if ((player.resources[res] ?? 0) < amount) throw new GameActionError("Tu n'as pas de quoi payer : refuse, ou trouve les ressources à temps.");
    }
    for (const [res, amount] of Object.entries(tribute) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) - amount;
    st.ultimatum = null;
    st.tributesPaid += 1;
    st.nextListAtMs = now + nextListDelay(faction, random);
    setState(player, faction.id, st);
    return { raid: null, notifications: [note("fleet", "Tribut payé", `${faction.leader} te laisse en paix… pour l'instant.`, now)] };
  }
  const raid = launchRaid(player, faction, st, now, random);
  return {
    raid,
    notifications: [note("fleet", "Tu as refusé", `${faction.enforcer} est en route : impact dans ${Math.max(1, Math.round(faction.raidTravelHours * 60))} min. Prépare-toi !`, now)],
  };
}

/* ---------- arrivée d'un raid ---------- */

export interface PirateRaidOutput {
  player: PlayerState;
  queues: QueuesState;
  combat: CombatResult;
  loot: Partial<Record<ResourceId, number>>;
  bounty: Partial<Record<ResourceId, number>>;
  debris: { scrap: number; energy: number };
  report: Omit<BattleReport, "id">;
  notifications: NewNotification[];
}

const RARE: ResourceId[] = RESOURCE_LIST.filter((r) => r.rarity === "rare").map((r) => r.id);

export function resolvePirateRaid(
  faction: FactionDef,
  playerIn: PlayerState,
  queuesIn: QueuesState,
  power: number,
  garrisons: (CombatGarrison & { ownerUid: string; ownerPseudo: string })[],
  now: number,
  options: { evading?: boolean } = {},
): PirateRaidOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  if (options.evading) bumpStat(player, "evasions");
  const st = pirateState(player, faction.id);
  const fleetOnly = faction.raid.target === "fleet";
  const posture = postureEffects(player.posture?.id, fleetOnly);
  // Cible « flotte » : les défenses ne combattent pas, les vaisseaux à 100 %.
  const defenderUnits: Units = fleetOnly
    ? Object.fromEntries(Object.entries(player.units ?? {}).filter(([id]) => OFFENSIVE_UNITS.includes(id)))
    : player.units ?? {};
  // 5.23 : effets ciblés du joueur contre les PNJ (unités, classe, bouclier).
  const pve = playerCombatEffects(player, "pve", now);
  const edge = edgeParam(pve);
  const combat = resolveCombat({
    unitBonus: { defender: pve.units },
    ...(edge ? { classEdge: { defender: edge } } : {}),
    attackerUnits: {},
    attackerTechLevels: {},
    attackerRepairPct: 0,
    fleet: {},
    attackerPowerOverride: power,
    defenderUnits,
    defenderTechLevels: player.techLevels ?? {},
    defenderRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    // 6.14.145 (PB-L4) : Casemates (hangar de défense 20).
    defenseRebuildBonus: defenseRebuildBonus(player.buildings),
    defenderShieldPct: getShieldPercent(player.buildings, allianceShieldBonus(player.allianceResearch)) + pve.shield,
    defenderResources: {},
    garrisons,
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    homeFleetFactor: posture.homeFleetFactor,
    defenseFactor: posture.defenseFactor,
    // v4.0 : Stratège et reliques (les capsules ne jouent pas contre les PNJ).
    // v5.9 : Traqueurs Kesh à quai, +50 % d'attaque contre les PNJ.
    defenderPowerFactor: (1 + playerModifiers(player).defense) * pveHomeDefenseFactor(defenderUnits, player.techLevels ?? {}, posture.homeFleetFactor, posture.defenseFactor),
    defenderHull: workshopState(player).hull,
  });
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (player.units[unitId]) player.units[unitId].count = Math.max(0, player.units[unitId].count - lost);
  }
  // 5.20 : coques abîmées conservées ; vaisseaux sauvés à l'Atelier (les défenses reconstruites restent en place).
  applyHull(player, combat.defenderHull);
  sendToWorkshop(player, Object.fromEntries(Object.entries(combat.defenderRecovered).map(([id, n]) => [id, n - (combat.defenderRebuilt?.[id] ?? 0)])), now, "raid", true);

  const loot: Partial<Record<ResourceId, number>> = {};
  let bounty: Partial<Record<ResourceId, number>> = {};
  let debris = { scrap: 0, energy: 0 };
  const notifications: NewNotification[] = [...flushed.notifications];
  st.raidUntilMs = 0;

  if (combat.outcome === "attacker_win") {
    const kinds = faction.raid.lootKind === "rare" ? RARE : COMMON_RESOURCES;
    for (const res of kinds) {
      const exposed = Math.max(0, (player.resources[res] ?? 0) - protectedAmount(player.buildings, res, player.techLevels, player.allianceResearch, player, now));
      const taken = Math.floor(exposed * faction.raid.lootPct);
      if (taken > 0) {
        loot[res] = taken;
        player.resources[res] = (player.resources[res] ?? 0) - taken;
      }
    }
    st.raidsLost += 1;
    // v5.10 : un raid perdu compte comme une défaite (un raid repoussé compte déjà comme une victoire).
    player.defeats = (player.defeats ?? 0) + 1;
    // v5.6 : comme une défense perdue contre un joueur, la Stratège apprend aussi de la défaite.
    grantCommanderXp(player, "strategist", COMMANDER_XP.defenseLost);
    st.notoriety = Math.max(0, st.notoriety - 1);
    st.adapt = Math.max(PIRATE_RULES.adaptMin, st.adapt - PIRATE_RULES.adaptDown);
    player.lastDefeatAtMs = now;
    notifications.push(note("combat-defender", `Victoire de ${faction.name}`, total(loot) > 0 ? `${faction.enforcer} a eu le dessus et emporté ${describeGain(loot)} (${formatInt(total(loot))} au total).` : `${faction.enforcer} a eu le dessus, mais tes entrepôts protégés n'ont rien laissé à prendre.`, now));
  } else {
    // 6.14.163 (S3, NJ-4) : le raid d'initiation (premier raid de la faction du tutoriel, lancé par la prise en main) verse
    // quelques minutes de production réparties comme les coûts, au lieu des heures de la faction (4 h : 216 000 de chaque à 15/s).
    bounty = isTutorialRaid(player, faction.id, st) ? tutorialRaidBounty(player) : productionHours(player, faction.bounty.hours);
    for (const r of RARE) if (faction.bounty.rare > 0) bounty[r] = (bounty[r] ?? 0) + faction.bounty.rare;
    // 5.16 : embargo : la prime grossit.
    if (activeTreaty(st, now)?.kind === "embargo") for (const r of Object.keys(bounty) as ResourceId[]) bounty[r] = Math.floor((bounty[r] ?? 0) * TREATY_RULES.embargoBounty);
    for (const [res, amount] of Object.entries(bounty) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, faction.bounty.xp, now, "pirate");
    const destroyed = power * combat.attackerLossPercent;
    debris = { scrap: Math.floor(destroyed * faction.bounty.debrisPerPower), energy: Math.floor((destroyed * faction.bounty.debrisPerPower) / 2) };
    st.raidsWon += 1;
    st.repelled += 1;
    st.adapt = Math.min(PIRATE_RULES.adaptMax, st.adapt + PIRATE_RULES.adaptUp);
    grantCommanderXp(player, "strategist", COMMANDER_XP.raidRepelled);
    grantCommanderXp(player, "warden", COMMANDER_XP.raidRepelled);
    addPassPoints(player, "raidRepelled", now);
    // 6.14.109 (AU27, AP-L5, Q87) : un raid de faction repoussé compte aussi pour l'objectif du jour « Repousser une attaque ».
    if (CONTRACT_RULES.defenseCountsFactionRaids) recordContract(player, "win_defense", 1, now);
    st.notoriety = Math.min(faction.raid.maxNotoriety, st.notoriety + 1);
    player.victories = (player.victories ?? 0) + 1;
    const lairNow = !st.lairOpen && st.repelled >= faction.lair.raidsNeeded;
    if (lairNow) st.lairOpen = true;
    // v5.14 : table de butin « menaces ».
    // 5.15 : plus le raid était puissant face à la défense, plus les jetons sont probables.
    const raidLoot = describeLoot(rollLoot(player, "threat", now, -1, Math.random, lootDifficulty(combat.attackerPower, combat.defenderPower)));
    notifications.push(
      note(
        "combat-defender",
        combat.outcome === "draw" ? `${faction.name} repoussé de justesse` : `${faction.name} repoussé !`,
        `Prime : ${describeGain(bounty)} (${formatInt(total(bounty))} au total) et +${faction.bounty.xp} XP. Notoriété ${st.notoriety}.${raidLoot}`,
        now,
        { resources: bounty, xp: faction.bounty.xp || undefined },
      ),
    );
    if (lairNow) notifications.push(note("fleet", `${faction.lair.name} localisé`, "Sa position a fuité : lance l'assaut depuis la page Menaces !", now));
  }
  setState(player, faction.id, st);

  const report: Omit<BattleReport, "id"> = {
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
    combatLog: combatLogOf(combat),
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
    garrisons: garrisons.map((g, i) => ({ ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: combat.garrisonLosses?.[i] ?? {} })),
  };
  return { player, queues: flushed.queues, combat, loot, bounty, debris, report, notifications };
}

/* ---------- repaires ---------- */

/** Puissance du repaire. v5.4 : rapportée à l'ATTAQUE de ta flotte à quai (et non plus à ta défense,
 *  1,5 × ta défense étant hors de portée de n'importe quelle flotte : aucun repaire pris en un mois).
 *  `lair.pct` ≈ 1 : il faut presque toute la flotte et un bonus (formation d'assaut, Traqueurs, officiers). */
export function lairPower(faction: FactionDef, player: PlayerState): number {
  const fleetAttack = computeFullPower(player.units ?? {}, player.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]);
  return Math.round(Math.max(faction.raid.floorPower * 3, fleetAttack * faction.lair.pct));
}

export function checkLairLaunch(faction: FactionDef | undefined, player: PlayerState, fleet: Record<string, unknown>): Record<string, number> {
  if (!faction) throw new GameActionError("Repaire inconnu.");
  if (!pirateState(player, faction.id).lairOpen) throw new GameActionError(`${faction.lair.name} n'est pas encore localisé.`);
  const units: Record<string, number> = {};
  for (const [id, v] of Object.entries(fleet ?? {})) {
    const qty = Math.floor(Number(v));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(id)) throw new GameActionError("Seules les unités d'attaque peuvent être envoyées.");
    units[id] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
  return units;
}

export interface LairAssaultOutput {
  player: PlayerState;
  queues: QueuesState;
  combat: CombatResult;
  survivors: Record<string, number>;
  report: Omit<BattleReport, "id">;
  notifications: NewNotification[];
}

export function resolveLairAssault(faction: FactionDef, playerIn: PlayerState, queuesIn: QueuesState, fleet: Record<string, number>, power: number, now: number, formation?: string): LairAssaultOutput {
  const flushed = flushState({ ...playerIn, buildings: withMissingBuildings(playerIn.buildings, playerIn.resources) }, queuesIn, now);
  const player = flushed.player;
  const st = pirateState(player, faction.id);
  const fx = formationEffects(formation);
  const pve = playerCombatEffects(player, "pve", now);
  const combat = resolveCombat({
    ...fx,
    unitBonus: { attacker: pve.units },
    // v3.3 : Batterie de siège de l'alliance.
    attackFactor: fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack),
    // v5.9 : bonus de soute (Soute pliée…) sur le butin du repaire, comme contre un joueur.
    cargoFactor: fx.cargoFactor * (1 + playerModifiers(player).cargo),
    // 5.20 : stock = base + flotte partie, pour répartir les dégâts conservés.
    attackerUnits: withFleet(player.units, fleet),
    attackerHull: workshopState(player).hull,
    attackerTechLevels: player.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(player.buildings), player),
    fleet,
    defenderUnits: {},
    defenderTechLevels: {},
    defenderRepairPct: 0,
    defenderResources: {},
    defenderPowerOverride: power,
  });
  applyHull(player, combat.attackerHull);
  sendToWorkshop(player, combat.attackerRecovered, now, "lair", false);
  const survivors: Record<string, number> = {};
  for (const [id, qty] of Object.entries(fleet)) survivors[id] = Math.max(0, qty - (combat.attackerLosses[id] ?? 0) - (combat.attackerRecovered[id] ?? 0));
  const notifications: NewNotification[] = [...flushed.notifications];
  if (combat.outcome === "attacker_win") {
    const reward = productionHours(player, faction.lair.rewardHours);
    for (const r of RARE) reward[r] = (reward[r] ?? 0) + faction.lair.rare;
    // v5.14 : le Corsaire en poste grossit le butin du repaire.
    const loot = 1 + playerModifiers(player).loot;
    if (loot !== 1) for (const r of Object.keys(reward) as ResourceId[]) reward[r] = Math.floor((reward[r] ?? 0) * loot);
    for (const [res, amount] of Object.entries(reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
    applyXpDelta(player, faction.lair.xp, now, "pirate");
    const title = faction.lair.title;
    if (title && !(player.titles ?? []).some((t) => t.label === title)) {
      player.titles = [...(player.titles ?? []), { label: title, seasonId: `faction:${faction.id}`, rank: 1 }];
      if (!player.activeTitle) player.activeTitle = title;
    }
    st.lairOpen = false;
    st.repelled = 0;
    st.notoriety = 0;
    st.lairsTaken += 1;
    grantCommanderXp(player, "admiral", COMMANDER_XP.lairWin);
    grantCommanderXp(player, "corsair", COMMANDER_XP.lairWin);
    addPassPoints(player, "victory", now);
    const lairLoot = describeLoot(rollLoot(player, "threat", now, -1, Math.random, lootDifficulty(combat.defenderPower, combat.attackerPower)));
    player.victories = (player.victories ?? 0) + 1;
    notifications.push(
      note(
        "combat-attacker",
        `${faction.lair.name} est tombé !`,
        `Butin : ${describeGain(reward)} (${formatInt(total(reward))} au total), +${faction.lair.xp} XP${title ? ` et le titre « ${title} »` : ""}. ${faction.leader} s'est enfui… la traque continue.${lairLoot}`,
        now,
      ),
    );
  } else {
    player.defeats = (player.defeats ?? 0) + 1;
    notifications.push(note("combat-attacker", "Assaut repoussé", `Les défenses du ${faction.lair.name} ont tenu. Les survivants rentrent.`, now));
  }
  setState(player, faction.id, st);
  const report: Omit<BattleReport, "id"> = {
    attackerUid: player.uid,
    attackerPseudo: player.pseudo,
    defenderUid: lairUid(faction.id),
    defenderPseudo: faction.lair.name.slice(0, REPORT_PSEUDO_MAX),
    timestamp: now,
    outcome: combat.outcome,
    attackerPower: combat.attackerPower,
    defenderPower: combat.defenderPower,
    attackerLossPercent: combat.attackerLossPercent,
    combatLog: combatLogOf(combat),
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
    attackerFleet: fleet,
  };
  return { player, queues: flushed.queues, combat, survivors, report, notifications };
}

/** Validation des fiches de factions (administration). */
export function validateFactions(defs: FactionDef[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const f of defs) {
    const label = `Faction ${f.name || f.id}`;
    if (!/^[a-z0-9_]+$/.test(f.id ?? "")) errors.push(`${label} : identifiant « ${f.id} » invalide (minuscules, chiffres, _).`);
    if (seen.has(f.id)) errors.push(`${label} : identifiant en double.`);
    seen.add(f.id);
    if (!(f.trigger.maxIntervalHours >= f.trigger.minIntervalHours)) errors.push(`${label} : délai maximal inférieur au délai minimal.`);
    if (!(f.answerHours > 0)) errors.push(`${label} : délai de réponse invalide.`);
    if (!(f.lair.raidsNeeded >= 1)) errors.push(`${label} : nombre de raids avant le repaire invalide.`);
    // 6.14.125 (AA7, AA-20) : fugitifs (liste facultative ; chaque fugitif a un nom).
    if (f.fugitives !== undefined) {
      if (!Array.isArray(f.fugitives)) errors.push(`${label} : fugitifs invalides (liste attendue).`);
      else f.fugitives.forEach((x, i) => {
        if (!x || typeof x !== "object" || !String(x.name ?? "").trim()) errors.push(`${label} : fugitif n° ${i + 1} sans nom.`);
      });
    }
  }
  return errors;
}
