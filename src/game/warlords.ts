import { computeFleetPower, computeFullPower, homeDefensePower } from "@/game/combat";
import { shieldUntil } from "@/game/bounties";
import { BUILDINGS } from "@/game/buildings";
import { COMMON_RESOURCES } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { distanceBetween } from "@/game/fleets";
import { productionHours } from "@/game/pirates";
import { checkAttackAllowed } from "@/game/pvp";
import { onVacation } from "@/game/vacation";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS, UNIT_BASE_STATS } from "@/game/units";
import { getTradeRate } from "@/game/resources";
import type { PlayerState, ResourceId } from "@/types/game";
import { overallHull } from "@/game/workshop";
import { setVendettaTitlesResolver } from "@/game/eliteUnits";
import { makeRelic, mythicTemplates } from "@/game/relics";
import type { RelicItem } from "@/game/relics";
import { addThreat, ELITE_COUNTER, normalizeRankRules, RANK_NAMES, rankOf, rankPowerFactor, traitSummary, validateRankRules, type WarlordRankRules } from "@/game/warlordRanks";

/* =====================================================
   Seigneurs de guerre (v4.2) : dix empires tenus par le jeu, placés sur la
   carte comme des joueurs (enregistrement `players` marqué `npc`). Leur
   puissance suit celle des joueurs actifs ; les agressifs et les
   opportunistes attaquent, les bâtisseurs gardent un gros stock, les
   marchands font vivre le marché. Les joueurs peuvent les espionner, les
   piller et leur déclarer une vendetta.
===================================================== */

export type WarlordPersonality = "aggressive" | "opportunist" | "builder" | "merchant";
export type WarlordTier = "weak" | "medium" | "strong";
export type WarlordOrigin = "kesh" | "choeur" | "confrerie" | "gravhorn" | "leviathan";
export type WarlordLineKey = "contact" | "raided" | "won" | "repelled" | "vendettaOpen" | "vendettaWon" | "vendettaLost" | "market" | "reply";

export interface WarlordDef {
  id: string;
  name: string;
  origin: WarlordOrigin;
  personality: WarlordPersonality;
  tier: WarlordTier;
  /** Portrait et sceau (provisoires tant que les images n'existent pas). */
  portrait: string;
  emblem: string;
  bio: string;
  enabled: boolean;
  lines: Partial<Record<WarlordLineKey, string[]>>;
}

export interface WarlordSettings {
  enabled: boolean;
  /** Multiplicateur de fréquence des attaques (1 = une par 48 h). */
  attackFrequency: number;
  /** Multiplicateur de puissance visée. */
  powerFactor: number;
  /** 5.22 : rangs de menace et traits (réglables ; défauts : DEFAULT_RANK_RULES). */
  ranks?: Partial<WarlordRankRules>;
}

export interface WarlordsConfig {
  settings: WarlordSettings;
  defs: WarlordDef[];
}

export const WARLORD_RULES = {
  /** Puissance visée : faibles et moyens par rapport à la médiane des actifs, forts par rapport au meilleur. */
  // 5.22.1 : abaissées (0,4–0,6 / 0,8–1,2 / 1,3–1,8) : même au rang I, les seigneurs moyens
  // égalaient le 2e joueur du serveur et les forts dépassaient tout le monde.
  tierRange: { weak: [0.3, 0.5], medium: [0.6, 0.9], strong: [1.0, 1.3] } as Record<WarlordTier, [number, number]>,
  /** Puissance minimale (serveur presque vide). */
  minPower: 3000,
  /** Croissance maximale par jour, en part de la puissance visée. */
  growthPerDay: 0.08,
  /** v5.5 : jamais plus de ce multiple de la meilleure défense de joueur ; au-delà, l'armée fond (même rythme que la croissance). */
  maxDefenseRatio: 1.5,
  /** 5.22.1 : armée au-delà de la puissance visée : part de l'excédent perdue par jour. */
  shrinkPerDay: 0.25,
  /** 5.22.1 : un joueur plus de N fois au-dessus du suivant est écarté de la référence (compte admin, de test…). */
  outlierRatio: 2.5,
  /** Bâtiments : part du niveau moyen des actifs, et un niveau gagné toutes les 12 h au plus. */
  buildingFactor: { weak: 0.8, medium: 1, strong: 1.25 } as Record<WarlordTier, number>,
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
  minTargetXp: 2000,
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
  stockHours: { builder: 12, default: 6 } as { builder: number; default: number },
  /** Part de la puissance en vaisseaux d'attaque (le reste en défenses). */
  offenseShare: { aggressive: 0.8, opportunist: 0.7, builder: 0.3, merchant: 0.4 } as Record<WarlordPersonality, number>,
  /** Marchands : 3 offres par jour environ, à ±10 % du taux du comptoir. */
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
    minShare: 0.1,
  },
};

const ORIGIN_ART: Record<WarlordOrigin, { label: string; art: string; emblem: string; color: string }> = {
  kesh: { label: "Kesh'Vaar renégats", art: "/assets/bounties/hunters.webp", emblem: "/assets/bounties/emblem.webp", color: "#ffb347" },
  choeur: { label: "Déserteurs du Chœur", art: "/assets/story/choeur.webp", emblem: "/assets/story/choeur-emblem.webp", color: "#b18cff" },
  confrerie: { label: "Anciens de la Confrérie", art: "/assets/story/varan.webp", emblem: "/assets/story/varan.webp", color: "#ff7a45" },
  gravhorn: { label: "Mercenaires Gravhorn", art: "/assets/story/gravhorn.webp", emblem: "/assets/story/gravhorn.webp", color: "#f2c94c" },
  leviathan: { label: "Culte du Léviathan", art: "/assets/leviathan/leviathan-portrait.webp", emblem: "/assets/leviathan/leviathan-emblem.webp", color: "#3fd9c8" },
};

export function warlordOrigin(origin: WarlordOrigin) {
  return ORIGIN_ART[origin] ?? ORIGIN_ART.kesh;
}

export const PERSONALITY_LABELS: Record<WarlordPersonality, string> = {
  aggressive: "Agressif",
  opportunist: "Opportuniste",
  builder: "Bâtisseur",
  merchant: "Marchand",
};

export const TIER_LABELS: Record<WarlordTier, string> = { weak: "Faible", medium: "Moyen", strong: "Fort" };

/** Identifiant PocketBase (15 caractères) d'un seigneur. */
export function warlordUid(id: string): string {
  return `npc${id.toLowerCase().replace(/[^a-z0-9]/g, "")}000000000000`.slice(0, 15);
}

const def = (
  id: string,
  name: string,
  origin: WarlordOrigin,
  personality: WarlordPersonality,
  tier: WarlordTier,
  bio: string,
  lines: Partial<Record<WarlordLineKey, string[]>>,
): WarlordDef => ({ id, name, origin, personality, tier, portrait: `/assets/warlords/${id}.webp`, emblem: `/assets/warlords/${id}-sceau.webp`, bio, enabled: true, lines });

export const DEFAULT_WARLORDS: WarlordDef[] = [
  def("zharkesh", "Zhar'Kesh, l'Essaim Noir", "kesh", "aggressive", "strong", "Ancien roi d'une ruche rivale, banni par la Reine bien avant sa chute. Il porte encore les ornements d'or volés aux couvains qu'il a brûlés, et voit dans chaque jeune empire un couvain de plus.", {
    contact: ["{pseudo}. Vashka t'a choisi, paraît-il. Moi aussi, je t'ai choisi : comme on choisit une proie dans un couvain."],
    raided: ["Tu as arraché un peu de ma chitine, {pseudo}. Elle repousse. La tienne ne repoussera pas.", "Une morsure. Rien de plus. L'Essaim Noir se souviendra de ton odeur."],
    won: ["Ton couvain est ouvert, {pseudo}. J'ai pris ce que je voulais. Je reviendrai prendre le reste."],
    repelled: ["Tes défenses ont tenu. Cette fois. Les ruches aussi tenaient, avant moi."],
    vendettaOpen: ["Une vendetta ? Enfin un peu de nectar. Viens, {pseudo}, et amène tes amis : il y aura assez de cendres pour tous."],
    vendettaWon: ["Je me retire dans le Vide… pour l'instant. Garde bien ton titre, {pseudo} : je viendrai le reprendre sur ton cadavre."],
    vendettaLost: ["Trois jours, et pas une égratignure qui compte. Ma riposte arrive, {pseudo}."],
    reply: ["L'Essaim Noir ne négocie pas avec la nourriture."],
  }),
  def("tivrek", "Tivrek Mue-Rouge", "kesh", "aggressive", "medium", "Jeune Kesh'Vaar renégat, en pleine mue, affamé et pressé. Il attaque comme il mue : sans prévenir et en laissant des morceaux derrière lui.", {
    contact: ["Hé, {pseudo} ! Ma nouvelle carapace me démange. Rien de tel qu'un bon raid pour la faire durcir."],
    raided: ["Aïe ! Tu tapes fort pour un mou. Je reviens dès que ma chitine a durci."],
    won: ["Trop facile ! Merci pour le repas, {pseudo}. Je repasse quand j'ai encore faim, donc bientôt."],
    repelled: ["Pfff, tes roquettes piquent. Je retenterai après ma prochaine mue."],
    vendettaOpen: ["Une vendetta contre moi ? Génial ! Personne ne m'avait jamais pris au sérieux."],
    vendettaWon: ["D'accord, d'accord, je file ! Mais je reviendrai plus gros, plus rouge et plus méchant."],
    vendettaLost: ["Ha ! Raté ! À mon tour maintenant."],
    reply: ["Pas le temps de causer, je mue."],
  }),
  def("ossaya", "Ossaya la Tisseuse", "kesh", "builder", "weak", "Architecte Kesh'Vaar qui a refusé de servir la nouvelle Reine. Elle tisse des forteresses de soie et de chitine, patiemment, et ne quitte jamais sa toile.", {
    contact: ["Bienvenue dans ma toile, {pseudo}. Je n'attaque personne. Mais ceux qui viennent à moi restent souvent collés."],
    raided: ["Tu as déchiré quelques fils, {pseudo}. Je retisse. Je retisse toujours."],
    vendettaOpen: ["Une vendetta… Il faudra plus que de la colère pour défaire mille ans de patience."],
    vendettaWon: ["Ma toile est déchirée. Je pars en tisser une autre, loin d'ici. Tu as gagné, {pseudo}."],
    vendettaLost: ["Ta colère s'est usée sur mes fils. Pour une fois, je vais rendre la visite."],
    reply: ["Chut. Je compte les fils."],
  }),
  def("ilyon", "Cantor Ilyon", "choeur", "builder", "strong", "Une voix du Chœur Silencieux qui a choisi de parler seul. Il a gravé lui-même une bouche dans son masque et bâtit, loin de l'Archonte, une cathédrale qu'aucune flotte n'a encore fissurée.", {
    contact: ["Je… parle. Seul. C'est encore étrange. Je te salue, {pseudo}. Ne viens pas frapper à ma cathédrale."],
    raided: ["Une fissure. Je l'entends chanter. Elle sera comblée avant l'aube."],
    vendettaOpen: ["Nous… je… Pardon. J'accepte ta vendetta, {pseudo}. Le cristal noir n'a jamais craint la colère."],
    vendettaWon: ["La cathédrale s'effondre. Je retourne au silence quelque temps. Tu m'as appris quelque chose : la défaite a une voix."],
    vendettaLost: ["Tu t'es heurté au cristal. Maintenant, écoute le mien."],
    reply: ["Les mots me coûtent encore. Pardonne ma brièveté."],
  }),
  def("nerea", "Sœur Néréa des Échos", "choeur", "merchant", "medium", "Déserteuse du Chœur au masque à moitié brisé. Elle vend ce que le Chœur a appris, et achète ce que vos laboratoires oublient. Ses prix sont justes ; ses sourires, moins.", {
    contact: ["Bonsoir, {pseudo}. J'ai quitté le Chœur pour une raison très simple : on ne peut rien vendre au silence. Passe au marché."],
    raided: ["Piller une marchande… quel manque d'élégance, {pseudo}. Mes prix pour toi viennent de monter."],
    market: ["Une nouvelle offre t'attend au marché, {pseudo}. Prix d'ami, ou presque."],
    vendettaOpen: ["Une vendetta est un très mauvais investissement, {pseudo}. Mais soit."],
    vendettaWon: ["Je ferme boutique quelques jours. Tu as gagné… et perdu une excellente fournisseuse."],
    vendettaLost: ["Les comptes sont faits, {pseudo}. Tu me dois une visite."],
    reply: ["Je ne réponds qu'aux offres. Le marché est ouvert."],
  }),
  def("brannoc", "Brannoc Demi-Barbe", "confrerie", "aggressive", "medium", "Ancien de la Confrérie du Vide, chassé par Varan pour avoir gardé une part de trop. La moitié de sa barbe a brûlé ce jour-là ; l'autre moitié attend sa revanche sur tout le secteur.", {
    contact: ["Alors c'est toi, {pseudo}, le nouveau dont Varan parle ? Moi, je ne fais pas d'ultimatum. Je viens, c'est tout."],
    raided: ["Tu m'as piqué ma part, {pseudo}. La dernière fois qu'on a fait ça, j'y ai laissé la moitié de ma barbe. Toi, tu y laisseras plus."],
    won: ["Pas de tribut, pas de liste, pas de discours : juste ta soute vidée. Bien le bonjour, {pseudo}."],
    repelled: ["Ta base tient mieux que ma barbe. Je reviendrai avec plus de poudre."],
    vendettaOpen: ["Une vendetta ! Comme au bon vieux temps de la Confrérie. Je fais chauffer les canons."],
    vendettaWon: ["Je me replie, {pseudo}. Mais garde un œil sur ton ciel : Brannoc revient toujours."],
    vendettaLost: ["Trois jours et rien. À moi de jouer."],
    reply: ["Si tu veux causer, envoie des vaisseaux."],
  }),
  def("lysa", "Lysa Ferro, « la Comptable »", "confrerie", "opportunist", "weak", "Ancienne intendante de la Confrérie. Elle tient le compte de chaque dette du secteur, et passe les encaisser au pire moment : juste après une défaite, ou quand les coffres débordent.", {
    contact: ["{pseudo}, j'ouvre ton dossier. Rien à me reprocher pour l'instant. Pour l'instant."],
    raided: ["Noté dans mon registre, {pseudo}. Avec les intérêts."],
    won: ["Dette encaissée, {pseudo}. Tu étais à découvert : je ne fais que rétablir l'équilibre."],
    repelled: ["Mauvais calcul de ma part. Je révise mes prévisions."],
    vendettaOpen: ["Une vendetta coûte cher, {pseudo}. Je vais te montrer combien."],
    vendettaWon: ["Je solde mes comptes et je disparais quelque temps. Bien joué."],
    vendettaLost: ["Fin de la période. Tu me dois une riposte, je viens la chercher."],
    reply: ["Ton dossier est à jour. Rien d'autre à dire."],
  }),
  def("kragmor", "Kragmor Corne-Fendue", "gravhorn", "merchant", "weak", "Vieux Gravhorn qui a raccroché les contrats de chasse pour ouvrir un comptoir. Il a perdu la moitié d'une corne dans sa dernière traque et préfère maintenant compter les crédits que les trophées.", {
    contact: ["Ho, {pseudo} ! Kragmor, pour te servir. Je ne chasse plus : je vends. Ferraille, énergie, tout ce qu'il te faut."],
    raided: ["Tu as pillé mon comptoir ? Hé, j'ai été chasseur, gamin. J'ai encore un fusil quelque part."],
    market: ["Arrivage frais au marché, {pseudo}. Kragmor fait des prix pour les amis."],
    vendettaOpen: ["Une vendetta contre un vieux marchand ? Bon. Je ressors le fusil."],
    vendettaWon: ["Je ferme le comptoir quelques jours. Sans rancune, {pseudo}… presque."],
    vendettaLost: ["J'ai encore la main, hein ? Tiens, un petit souvenir de mes années de chasse."],
    reply: ["Pour causer, passe au marché !"],
  }),
  def("thessa", "Thessa Vrill, la Traqueuse", "gravhorn", "opportunist", "medium", "Chasseuse Gravhorn sans contrat ni maître. Ses antennes captent la faiblesse à des parsecs : elle frappe les empires qui viennent de tomber, ou ceux qui ont laissé leurs coffres trop pleins.", {
    contact: ["Je t'ai senti arriver, {pseudo}. Tu sens encore le neuf. Ne laisse jamais tes coffres trop pleins."],
    raided: ["Bien visé, {pseudo}. Je note l'odeur de ta flotte."],
    won: ["Tu sentais la défaite, {pseudo}. Je n'ai fait que suivre la piste."],
    repelled: ["Fausse piste. Ça arrive, même aux meilleures."],
    vendettaOpen: ["Une vendetta, c'est une traque à l'envers. Voyons qui chasse qui, {pseudo}."],
    vendettaWon: ["Je me mets au vert quelque temps. Belle traque, {pseudo}."],
    vendettaLost: ["La traque est finie. Maintenant, c'est moi qui suis la piste."],
    reply: ["Je ne parle pas pendant une traque."],
  }),
  def("maru", "Le Prophète Maru", "leviathan", "builder", "strong", "Prophète d'un culte qui vénère le Léviathan comme un dieu. Il bâtit des sanctuaires imprenables où ses fidèles attendent le prochain réveil de la bête, et garde leurs offrandes dans des chambres fortes sans fond.", {
    contact: ["Le Léviathan rêve de toi, {pseudo}. Moi, je me contente de prier. Ne trouble pas mon sanctuaire."],
    raided: ["Tu voles les offrandes du Léviathan, {pseudo}. Il s'en souviendra le premier week-end du mois."],
    vendettaOpen: ["Une vendetta contre le sanctuaire ? Les profondeurs accueillent tous les présomptueux."],
    vendettaWon: ["Le sanctuaire sombre. Je retourne dans les abysses méditer ta victoire, {pseudo}."],
    vendettaLost: ["Les eaux sont restées calmes. À présent, la marée monte vers toi."],
    reply: ["Le Léviathan écoute. Moi, je prie."],
  }),
];

export const DEFAULT_WARLORD_SETTINGS: WarlordSettings = { enabled: true, attackFrequency: 1, powerFactor: 1 };

let config: WarlordsConfig = { settings: { ...DEFAULT_WARLORD_SETTINGS }, defs: structuredClone(DEFAULT_WARLORDS) };

/** Applique la configuration (contenu « warlords » de l'administration). */
export function setWarlords(next: Partial<WarlordsConfig> | null | undefined): void {
  const overrides = new Map((next?.defs ?? []).map((d) => [d.id, d]));
  config = {
    settings: { ...DEFAULT_WARLORD_SETTINGS, ...(next?.settings ?? {}) },
    // Toujours les dix seigneurs du code ; l'administration modifie leurs champs.
    defs: DEFAULT_WARLORDS.map((d) => {
      const o = overrides.get(d.id);
      return o ? { ...d, ...o, id: d.id, lines: { ...d.lines, ...(o.lines ?? {}) } } : structuredClone(d);
    }),
  };
}

export function warlordsConfig(): WarlordsConfig {
  return config;
}

/** 5.22 : règles des rangs en vigueur. */
export function warlordRankRules(settings: WarlordSettings = config.settings): WarlordRankRules {
  return normalizeRankRules(settings.ranks);
}

export function defaultWarlordsConfig(): WarlordsConfig {
  return { settings: { ...DEFAULT_WARLORD_SETTINGS }, defs: structuredClone(DEFAULT_WARLORDS) };
}

export function findWarlord(id: string): WarlordDef | undefined {
  return config.defs.find((d) => d.id === id);
}

export function warlordByUid(uid: string): WarlordDef | undefined {
  return config.defs.find((d) => warlordUid(d.id) === uid);
}

export function isWarlordUid(uid: string | undefined | null): boolean {
  return !!uid && uid.startsWith("npc") && !!warlordByUid(uid);
}

export function validateWarlords(cfg: Partial<WarlordsConfig> | undefined): string[] {
  const errors: string[] = [];
  const s = cfg?.settings;
  if (s) {
    if (!(s.attackFrequency >= 0 && s.attackFrequency <= 5)) errors.push("Seigneurs : fréquence d'attaque entre 0 et 5.");
    if (!(s.powerFactor > 0 && s.powerFactor <= 5)) errors.push("Seigneurs : facteur de puissance entre 0 et 5.");
    errors.push(...validateRankRules(s.ranks));
  }
  for (const d of cfg?.defs ?? []) {
    if (!DEFAULT_WARLORDS.some((w) => w.id === d.id)) errors.push(`Seigneurs : « ${d.id} » inconnu.`);
    if (d.name !== undefined && !String(d.name).trim()) errors.push(`Seigneur ${d.id} : nom vide.`);
    if (d.personality && !(d.personality in PERSONALITY_LABELS)) errors.push(`Seigneur ${d.id} : personnalité inconnue.`);
    if (d.tier && !(d.tier in TIER_LABELS)) errors.push(`Seigneur ${d.id} : palier inconnu.`);
  }
  return errors;
}

/* ---------- puissance ---------- */

/** Puissance d'un empire : attaque de la flotte + défense de la base. */
export function empirePower(p: Pick<PlayerState, "units" | "techLevels">): number {
  const units = p.units ?? {};
  const tech = p.techLevels ?? {};
  return Math.round(computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]) + homeDefensePower(units, tech));
}

/** Puissance de flotte (attaque + défense des vaisseaux) : base de l'objectif de vendetta. */
export function warlordFleetPower(p: Pick<PlayerState, "units" | "techLevels">): number {
  return Math.round(computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack", "defense"]));
}

/** Pertes d'un combat en puissance (attaque + défense des unités détruites). */
export function lossesPower(p: Pick<PlayerState, "units" | "techLevels">, losses: Record<string, number>): number {
  return Math.round(computeFleetPower(p.units ?? {}, p.techLevels ?? {}, losses, ["attack", "defense"]));
}

export interface WarlordReference {
  median: number;
  max: number;
  medianXp: number;
  maxXp: number;
  medianSeasonXp: number;
  /** v5.5 : meilleure défense de base parmi les actifs (plafond des seigneurs). */
  maxDefense?: number;
  /** Niveau moyen de chaque bâtiment chez les actifs. */
  buildings: Record<string, number>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Repères tirés des joueurs actifs (jamais des seigneurs eux-mêmes). */
/** 5.22.1 : maximum sans valeurs aberrantes (un compte très au-dessus du suivant ne fixe pas la barre). */
export function robustMax(values: number[], ratio = WARLORD_RULES.outlierRatio): number {
  const sorted = values.filter((v) => v > 0).sort((a, b) => b - a);
  while (sorted.length > 1 && sorted[0] > sorted[1] * ratio) sorted.shift();
  return sorted[0] ?? 0;
}

export function warlordReference(actives: PlayerState[]): WarlordReference {
  // 5.22.1 : les comptes en mode test ne servent pas de référence.
  const humans = actives.filter((p) => !p.npc && !p.testMode);
  const powers = humans.map(empirePower).filter((n) => n > 0);
  const xps = humans.map((p) => p.xp ?? 0).filter((n) => n > 0);
  const buildings: Record<string, number> = {};
  for (const b of BUILDINGS) {
    const levels = humans.map((p) => p.buildings?.[b.id]?.level ?? 0);
    buildings[b.id] = levels.length ? levels.reduce((a, c) => a + c, 0) / levels.length : 0;
  }
  return {
    median: median(powers),
    max: robustMax(powers),
    medianXp: median(xps),
    maxXp: robustMax(xps),
    medianSeasonXp: median(humans.map((p) => p.seasonXp ?? 0)),
    maxDefense: robustMax(humans.map((p) => Math.round(homeDefensePower(p.units ?? {}, p.techLevels ?? {})))),
    buildings,
  };
}

function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 999;
}

/** Facteur propre à chaque seigneur dans la fourchette de son palier. */
export function tierFactor(d: Pick<WarlordDef, "id" | "tier">): number {
  const [lo, hi] = WARLORD_RULES.tierRange[d.tier] ?? WARLORD_RULES.tierRange.medium;
  return lo + (hi - lo) * hash01(d.id);
}

export function warlordTargetPower(d: WarlordDef, ref: WarlordReference, settings: WarlordSettings = config.settings): number {
  const base = d.tier === "strong" ? ref.max : ref.median;
  const target = Math.round(base * tierFactor(d) * (settings.powerFactor || 1));
  const cap = (ref.maxDefense ?? 0) > 0 ? ref.maxDefense! * WARLORD_RULES.maxDefenseRatio : Infinity;
  return Math.max(WARLORD_RULES.minPower, Math.round(Math.min(target, cap)));
}

export function warlordTargetXp(d: WarlordDef, ref: WarlordReference): number {
  const base = d.tier === "strong" ? ref.maxXp : ref.medianXp;
  return Math.max(500, Math.round(base * tierFactor(d)));
}

/* ---------- armée ---------- */

function unitAttack(id: string): number {
  return UNIT_BASE_STATS[id]?.attack ?? 0;
}

/** Deux types d'unités par catégorie, choisis selon le palier (faibles : les plus modestes). */
function pickUnits(pool: string[], tier: WarlordTier): string[] {
  // 5.22 : jamais d'unités d'élite (réservées aux joueurs).
  const elite = Object.values(ELITE_COUNTER);
  const sorted = pool.filter((id) => unitAttack(id) >= 40 && !elite.includes(id)).sort((a, b) => unitAttack(a) - unitAttack(b));
  if (sorted.length <= 2) return sorted;
  const third = Math.max(1, Math.floor(sorted.length / 3));
  const start = tier === "weak" ? 0 : tier === "medium" ? third : sorted.length - Math.max(2, third);
  return sorted.slice(start, start + 2).length === 2 ? sorted.slice(start, start + 2) : sorted.slice(-2);
}

/** Composition visée pour une puissance donnée (unités de niveau 1, sans technologie). */
export function desiredArmy(d: Pick<WarlordDef, "tier" | "personality">, targetPower: number): Record<string, number> {
  const share = WARLORD_RULES.offenseShare[d.personality] ?? 0.5;
  const out: Record<string, number> = {};
  const ships = pickUnits(OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && id !== "drone_recuperateur" && id !== "cargo"), d.tier);
  const defenses = pickUnits(DEFENSIVE_UNITS, d.tier);
  // Puissance d'une unité telle que la compte empirePower (vaisseaux : attaque + part à quai).
  const unitPower = (id: string) => computeFullPower({ [id]: { level: 1, count: 1 } }, {}, OFFENSIVE_UNITS, ["attack"]) + homeDefensePower({ [id]: { level: 1, count: 1 } }, {});
  ships.forEach((id) => {
    const per = unitPower(id);
    if (per > 0) out[id] = Math.ceil((targetPower * share) / ships.length / per);
  });
  defenses.forEach((id) => {
    const per = unitPower(id);
    if (per > 0) out[id] = Math.ceil((targetPower * (1 - share)) / defenses.length / per);
  });
  return out;
}

export interface WarlordRuntime {
  seeded: boolean;
  lastTickMs: number;
  nextAttackAtMs: number;
  nextMarketAtMs: number;
  absentUntilMs: number;
  lastBuildingAtMs: number;
  /** 5.22 : menace accumulée, rang (1 à 5) et premier passage au rang V. */
  threat?: number;
  rank?: number;
  ascendedAtMs?: number;
}

export function emptyRuntime(): WarlordRuntime {
  return { seeded: false, lastTickMs: 0, nextAttackAtMs: 0, nextMarketAtMs: 0, absentUntilMs: 0, lastBuildingAtMs: 0, threat: 0, rank: 1 };
}

/** Croissance horaire : armée, bâtiments, stock et XP rapprochés de la cible. */
export function growWarlord(npc: PlayerState, d: WarlordDef, ref: WarlordReference, rt: WarlordRuntime, now: number): WarlordRuntime {
  const rules = warlordRankRules();
  // 5.22 : la menace monte chaque jour ; le rang relève la puissance visée.
  const hoursSince = rt.lastTickMs > 0 ? Math.min(48, Math.max(0, (now - rt.lastTickMs) / 3600_000)) : 0;
  const out = rt.seeded ? addThreat({ ...rt }, (rules.threat.perDay * hoursSince) / 24, rules).rt : { ...rt, threat: rt.threat ?? 0, rank: rankOf(rt, rules) };
  const target = Math.round(warlordTargetPower(d, ref) * rankPowerFactor(rankOf(out, rules), rules));
  const desired = desiredArmy(d, target);
  const hours = rt.lastTickMs > 0 ? Math.min(48, Math.max(0, (now - rt.lastTickMs) / 3600_000)) : 1;
  const step = rt.seeded ? Math.min(1, WARLORD_RULES.growthPerDay * (hours / 24)) : 1;
  // 5.18 : arrondi à l'unité inférieure ; si rien ne pousse, une seule unité (la plus en retard) —
  // l'arrondi supérieur ajoutait une unité de chaque type et dépassait le rythme visé sur les petites armées.
  let grew = false;
  let lagging: { id: string; ratio: number } | null = null;
  for (const [id, want] of Object.entries(desired)) {
    const state = npc.units[id] ?? { level: 1, count: 0 };
    const count = state.count ?? 0;
    if (count >= want) continue;
    const add = Math.floor(want * step);
    if (add > 0) {
      npc.units[id] = { level: Math.max(1, state.level || 1), count: Math.min(want, count + add) };
      grew = true;
    } else if (!lagging || count / want < lagging.ratio) lagging = { id, ratio: count / want };
  }
  if (!grew && lagging) {
    const state = npc.units[lagging.id] ?? { level: 1, count: 0 };
    npc.units[lagging.id] = { level: Math.max(1, state.level || 1), count: (state.count ?? 0) + 1 };
  }
  // v5.5 : armée trop forte (plafond relevé ou joueurs partis) : elle fond d'une part de l'excédent.
  if (rt.seeded && empirePower(npc) > target * 1.1) {
    // 5.22.1 : fonte plus rapide que la croissance (25 % de l'excédent par jour).
    const shrink = Math.min(1, WARLORD_RULES.shrinkPerDay * (hours / 24));
    for (const [id, state] of Object.entries(npc.units)) {
      const want = desired[id] ?? 0;
      const count = state?.count ?? 0;
      if (count > want) npc.units[id] = { ...state, count: Math.max(want, count - Math.ceil((count - want) * shrink)) };
    }
  }
  // Bâtiments : niveau moyen des actifs × facteur du palier, un niveau par 12 h au plus.
  const buildStep = !rt.seeded || now - rt.lastBuildingAtMs >= WARLORD_RULES.buildingLevelEveryHours * 3600_000;
  if (buildStep) {
    for (const b of BUILDINGS) {
      const want = Math.min(b.maxLevel, Math.round((ref.buildings[b.id] ?? 0) * (WARLORD_RULES.buildingFactor[d.tier] ?? 1)));
      const cur = npc.buildings[b.id]?.level ?? 0;
      if (want > cur) npc.buildings[b.id] = { level: rt.seeded ? cur + 1 : want, unlocked: true };
    }
    out.lastBuildingAtMs = now;
  }
  // Stock de réserve (heures de production), reconstitué en 12 h.
  const stockHours = d.personality === "builder" ? WARLORD_RULES.stockHours.builder : WARLORD_RULES.stockHours.default;
  const stock = productionHours(npc, stockHours);
  for (const res of COMMON_RESOURCES) {
    const want = stock[res] ?? 0;
    const cur = npc.resources[res] ?? 0;
    if (cur < want) npc.resources[res] = Math.min(want, cur + (rt.seeded ? Math.ceil((want * hours) / 12) : want));
  }
  // XP : rapprochée de la cible (classement).
  const xpTarget = warlordTargetXp(d, ref);
  const xp = npc.xp ?? 0;
  const xpStep = Math.ceil(xpTarget * WARLORD_RULES.xpGrowthPerHour * hours);
  npc.xp = xp < xpTarget ? (rt.seeded ? Math.min(xpTarget, xp + xpStep) : xpTarget) : xp;
  const seasonTarget = Math.round((ref.medianSeasonXp || 0) * tierFactor(d));
  npc.seasonXp = Math.max(npc.seasonXp ?? 0, rt.seeded ? Math.min(seasonTarget, (npc.seasonXp ?? 0) + Math.ceil(seasonTarget * 0.05)) : seasonTarget);
  npc.resourcesUpdatedAtMs = now;
  out.seeded = true;
  out.lastTickMs = now;
  return out;
}

/** Vendetta gagnée : 30 % de chaque unité perdue. */
export function shatterWarlord(npc: PlayerState, loss = WARLORD_RULES.vendetta.powerLoss): void {
  for (const [id, st] of Object.entries(npc.units ?? {})) {
    if (st.count > 0) npc.units[id] = { ...st, count: Math.floor(st.count * (1 - loss)) };
  }
}

/* ---------- attaques ---------- */

export interface TargetInfo {
  player: PlayerState;
  /** Dernière attaque de CE seigneur sur cette cible. */
  lastAttackOnTargetMs: number | null;
  /** Dernière attaque d'un seigneur, quel qu'il soit. */
  lastWarlordHitMs: number;
  /** Riposte de vendetta : passe outre la limite de 72 h. */
  reprisal?: boolean;
}

/** La cible peut-elle être attaquée par ce seigneur maintenant ? */
export function warlordCanTarget(d: WarlordDef, npc: PlayerState, t: TargetInfo, now: number): boolean {
  const p = t.player;
  if (p.npc || (p.xp ?? 0) < WARLORD_RULES.minTargetXp || onVacation(p, now)) return false;
  if (!t.reprisal && now - t.lastWarlordHitMs < WARLORD_RULES.targetCooldownHours * 3600_000) return false;
  const check = checkAttackAllowed({
    now,
    attackerUid: npc.uid,
    attackerXp: 0,
    defenderUid: p.uid,
    defenderXp: p.xp ?? 0,
    defenderCreatedAtMs: p.createdAtMs,
    defenderHasAttacked: (p.lastAttackAtMs ?? 0) > 0,
    lastAttackOnTargetMs: t.lastAttackOnTargetMs,
    defenderAscendedAtMs: p.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(p),
    lastDefenderDefeatMs: p.lastDefeatAtMs ?? null,
  });
  if (!check.allowed) return false;
  if (d.personality === "opportunist" && !t.reprisal) {
    const beaten = (p.lastDefeatAtMs ?? 0) > 0 && now - (p.lastDefeatAtMs ?? 0) <= WARLORD_RULES.opportunistDefeatHours * 3600_000;
    const prod = productionHours(p, WARLORD_RULES.opportunistStockHours);
    const rich = COMMON_RESOURCES.some((res) => (prod[res] ?? 0) > 0 && (p.resources?.[res] ?? 0) >= (prod[res] ?? 0));
    if (!beaten && !rich) return false;
  }
  return true;
}

/** Flotte d'attaque : 80 à 110 % de la défense de la cible, ou rien si le seigneur n'a pas de quoi. */
export function composeWarlordFleet(npc: PlayerState, target: PlayerState, random: () => number = Math.random): Record<string, number> | null {
  const defense = homeDefensePower(target.units ?? {}, target.techLevels ?? {});
  const goal = Math.max(1, defense) * (WARLORD_RULES.attackPowerMin + (WARLORD_RULES.attackPowerMax - WARLORD_RULES.attackPowerMin) * random());
  const ships = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (npc.units[id]?.count ?? 0) > 0)
    .map((id) => ({ id, per: computeFleetPower(npc.units, npc.techLevels ?? {}, { [id]: 1 }, ["attack"]) }))
    .filter((s) => s.per > 0)
    .sort((a, b) => b.per - a.per);
  const fleet: Record<string, number> = {};
  let power = 0;
  for (const s of ships) {
    if (power >= goal) break;
    const have = npc.units[s.id]?.count ?? 0;
    const need = Math.min(have, Math.ceil((goal - power) / s.per));
    if (need > 0) {
      fleet[s.id] = need;
      power += need * s.per;
    }
  }
  if (power < Math.max(1, defense) * WARLORD_RULES.attackPowerMin) return null;
  return fleet;
}

/** Choix de la cible : la plus riche parmi celles qui conviennent (pondéré au hasard). */
export function pickWarlordTarget(d: WarlordDef, npc: PlayerState, candidates: TargetInfo[], now: number, random: () => number = Math.random): { target: TargetInfo; fleet: Record<string, number> } | null {
  const ok = candidates.filter((t) => warlordCanTarget(d, npc, t, now));
  // Les ripostes d'abord.
  const ordered = [...ok.filter((t) => t.reprisal), ...ok.filter((t) => !t.reprisal).sort(() => random() - 0.5)];
  for (const t of ordered) {
    const fleet = composeWarlordFleet(npc, t.player, random);
    if (fleet) return { target: t, fleet };
  }
  return null;
}

export function nextAttackDelayMs(random: () => number = Math.random, settings: WarlordSettings = config.settings): number {
  const freq = settings.attackFrequency > 0 ? settings.attackFrequency : 0;
  if (freq <= 0) return 7 * 86400_000;
  const h = WARLORD_RULES.attackEveryHours + (random() * 2 - 1) * WARLORD_RULES.attackJitterHours;
  return Math.round((h / freq) * 3600_000);
}

export function warlordTravelMs(random: () => number = Math.random): number {
  return Math.round((WARLORD_RULES.travelMinHours + (WARLORD_RULES.travelMaxHours - WARLORD_RULES.travelMinHours) * random()) * 3600_000);
}

/** Plafond de butin d'un seigneur : 6 h de production de la cible (total). */
export function warlordLootCap(target: Pick<PlayerState, "buildings" | "techLevels">): number {
  return Object.values(productionHours(target, WARLORD_RULES.lootCapHours)).reduce((a, b) => a + (b ?? 0), 0);
}

/** Butin ramené proportionnellement sous le plafond. */
export function capLoot(loot: Partial<Record<ResourceId, number>>, cap: number): Partial<Record<ResourceId, number>> {
  const total = Object.values(loot).reduce((a, b) => a + (b ?? 0), 0);
  if (!(cap >= 0) || total <= cap || total <= 0) return loot;
  const k = cap / total;
  return Object.fromEntries(Object.entries(loot).map(([r, n]) => [r, Math.floor((n ?? 0) * k)]));
}

/* ---------- répliques ---------- */

export function warlordLine(d: WarlordDef, key: WarlordLineKey, pseudo: string, random: () => number = Math.random): string | null {
  const lines = d.lines?.[key] ?? [];
  if (lines.length === 0) return null;
  return lines[Math.floor(random() * lines.length)].split("{pseudo}").join(pseudo);
}

/** Seigneur le plus proche (premier contact). */
export function nearestWarlord(uid: string, defs: WarlordDef[]): WarlordDef | null {
  let best: WarlordDef | null = null;
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

/* ---------- vendettas ---------- */

export interface Vendetta {
  id: string;
  warlordId: string;
  ownerUid: string;
  ownerPseudo: string;
  /** Vendetta d'alliance : les dégâts de tous les membres comptent. */
  allianceId: string;
  startedAtMs: number;
  endsAtMs: number;
  goal: number;
  dealt: number;
  contributions: Record<string, number>;
  status: "active" | "won" | "lost";
  finishedAtMs?: number;
  /** 5.22 : rang du seigneur à l'ouverture (récompenses du rang V). */
  rank?: number;
}

export interface WarlordsState {
  byId: Record<string, WarlordRuntime>;
  /** Dernière attaque d'un seigneur sur chaque joueur. */
  hits: Record<string, number>;
  /** Joueurs déjà contactés (premier message). */
  contacted: Record<string, number>;
  /** Dernier message « seigneur:joueur ». */
  lastMsg: Record<string, number>;
  vendettas: Vendetta[];
  /** Ripostes dues après une vendetta ratée. */
  reprisals: { warlordId: string; uid: string; dueAtMs: number }[];
}

export function warlordsState(raw: unknown): WarlordsState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<WarlordsState>;
  return {
    byId: { ...(r.byId ?? {}) },
    hits: { ...(r.hits ?? {}) },
    contacted: { ...(r.contacted ?? {}) },
    lastMsg: { ...(r.lastMsg ?? {}) },
    vendettas: Array.isArray(r.vendettas) ? [...r.vendettas] : [],
    reprisals: Array.isArray(r.reprisals) ? [...r.reprisals] : [],
    // v4.7 : coalitions (voir coalition.ts), conservées telles quelles.
    ...((r as { coalitions?: unknown }).coalitions ? { coalitions: (r as { coalitions?: unknown }).coalitions } : {}),
  };
}

export function canMessage(state: WarlordsState, warlordId: string, uid: string, now: number): boolean {
  return now - (state.lastMsg[`${warlordId}:${uid}`] ?? 0) >= WARLORD_RULES.messageEveryHours * 3600_000;
}

export function activeVendetta(state: WarlordsState, warlordId: string, now: number): Vendetta | null {
  return state.vendettas.find((v) => v.warlordId === warlordId && v.status === "active" && now < v.endsAtMs) ?? null;
}

/** Ouvre une vendetta (le coût est prélevé par l'appelant). */
export function openVendetta(
  state: WarlordsState,
  d: WarlordDef,
  opener: Pick<PlayerState, "uid" | "pseudo" | "allianceId">,
  scope: "player" | "alliance",
  npc: PlayerState,
  rt: WarlordRuntime | undefined,
  now: number,
): Vendetta {
  if (rt && rt.absentUntilMs > now) throw new GameActionError(`${d.name} a quitté le secteur : reviens après son retour.`);
  if (activeVendetta(state, d.id, now)) throw new GameActionError(`Une vendetta est déjà ouverte contre ${d.name}.`);
  if (state.vendettas.some((v) => v.status === "active" && now < v.endsAtMs && v.ownerUid === opener.uid)) throw new GameActionError("Tu mènes déjà une vendetta : termine-la d'abord.");
  if (scope === "alliance" && !opener.allianceId) throw new GameActionError("Rejoins une alliance pour ouvrir une vendetta d'alliance.");
  // 5.22 : Seigneur Ascendant (rang V) : vendetta d'alliance seulement, objectif relevé.
  const rules = warlordRankRules();
  const rank = rankOf(rt, rules);
  const ascendant = rank >= 5;
  if (ascendant && rules.ascendant.allianceOnly && scope !== "alliance") throw new GameActionError(`${d.name} est un Seigneur Ascendant : seule une vendetta d'alliance peut le défier.`);
  const goal = Math.max(1000, Math.round(warlordFleetPower(npc) * WARLORD_RULES.vendetta.goalFactor * (ascendant ? rules.ascendant.goalFactor : 1)));
  const v: Vendetta = {
    id: `${d.id}-${now}`,
    warlordId: d.id,
    ownerUid: opener.uid,
    ownerPseudo: opener.pseudo,
    allianceId: scope === "alliance" ? String(opener.allianceId ?? "") : "",
    startedAtMs: now,
    endsAtMs: now + WARLORD_RULES.vendetta.durationHours * 3600_000,
    goal,
    dealt: 0,
    contributions: {},
    status: "active",
    rank,
  };
  state.vendettas.push(v);
  return v;
}

/** Ce joueur compte-t-il pour cette vendetta ? */
export function inVendetta(v: Vendetta, uid: string, allianceId: string | null | undefined): boolean {
  return v.ownerUid === uid || (!!v.allianceId && v.allianceId === allianceId);
}

/** Dégâts infligés au seigneur ; renvoie la vendetta si elle vient d'être gagnée. */
export function recordVendettaDamage(state: WarlordsState, warlordId: string, uid: string, allianceId: string | null | undefined, power: number, now: number): Vendetta | null {
  const v = activeVendetta(state, warlordId, now);
  if (!v || !(power > 0) || !inVendetta(v, uid, allianceId)) return null;
  v.dealt += Math.round(power);
  v.contributions[uid] = (v.contributions[uid] ?? 0) + Math.round(power);
  if (v.dealt >= v.goal) {
    v.status = "won";
    v.finishedAtMs = now;
    return v;
  }
  return null;
}

/** Joueurs récompensés : 10 % de l'objectif au moins (le meneur toujours, s'il a frappé). */
export function vendettaWinners(v: Vendetta): string[] {
  return Object.entries(v.contributions)
    .filter(([uid, n]) => n >= v.goal * WARLORD_RULES.vendetta.minShare || (uid === v.ownerUid && n > 0))
    .map(([uid]) => uid);
}

export function vendettaTitle(d: Pick<WarlordDef, "name">, rank = 1): string {
  const name = d.name.split(",")[0];
  return rank >= 5 ? `Fléau de l'Ascendant ${name}` : `Tombeur de ${name}`;
}

/** Vendettas arrivées à échéance : perdues, riposte programmée. */
export function settleVendettas(state: WarlordsState, now: number): Vendetta[] {
  const lost: Vendetta[] = [];
  for (const v of state.vendettas) {
    if (v.status === "active" && now >= v.endsAtMs) {
      v.status = "lost";
      v.finishedAtMs = now;
      lost.push(v);
      state.reprisals.push({ warlordId: v.warlordId, uid: v.ownerUid, dueAtMs: now });
    }
  }
  // Historique : 30 jours.
  state.vendettas = state.vendettas.filter((v) => v.status === "active" || now - (v.finishedAtMs ?? v.endsAtMs) < 30 * 86400_000);
  return lost;
}

/** Fiche publique d'un seigneur (page Seigneurs, fiche joueur). */
export interface WarlordPublic {
  id: string;
  uid: string;
  name: string;
  origin: WarlordOrigin;
  originLabel: string;
  personality: WarlordPersonality;
  tier: WarlordTier;
  portrait: string;
  emblem: string;
  fallbackArt: string;
  color: string;
  bio: string;
  power: number;
  /** 5.21 : état moyen des coques (1 = intactes). */
  hull?: number;
  /** 5.22 : rang de menace (1 à 5), son nom, menace et seuil du rang suivant, trait au rang actuel. */
  rank?: number;
  rankName?: string;
  threat?: number;
  nextThreshold?: number | null;
  trait?: string | null;
  absentUntilMs: number;
  vendetta: Pick<Vendetta, "id" | "ownerUid" | "ownerPseudo" | "allianceId" | "endsAtMs" | "goal" | "dealt"> | null;
}

export function warlordPublic(d: WarlordDef, npc: PlayerState | null, rt: WarlordRuntime | undefined, state: WarlordsState, now: number): WarlordPublic {
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
    hull: npc ? Math.round(overallHull(npc) * 1000) / 1000 : 1,
    ...rankFields(d, rt),
    absentUntilMs: rt?.absentUntilMs ?? 0,
    vendetta: v ? { id: v.id, ownerUid: v.ownerUid, ownerPseudo: v.ownerPseudo, allianceId: v.allianceId, endsAtMs: v.endsAtMs, goal: v.goal, dealt: v.dealt } : null,
  };
}

function rankFields(d: WarlordDef, rt: WarlordRuntime | undefined): Pick<WarlordPublic, "rank" | "rankName" | "threat" | "nextThreshold" | "trait"> {
  const rules = warlordRankRules();
  const rank = rankOf(rt, rules);
  return {
    rank,
    rankName: RANK_NAMES[rank - 1],
    threat: Math.floor(rt?.threat ?? 0),
    nextThreshold: rules.enabled && rank < 5 ? rules.thresholds[rank - 1] : null,
    trait: rules.enabled ? traitSummary(d.personality, rank, rules) : null,
  };
}

/** 5.22 : titres de vendetta déjà décernés contre une personnalité (déblocage des unités d'élite, rétroactif). */
export function vendettaTitlesFor(personality: WarlordPersonality): string[] {
  return config.defs.filter((d) => d.personality === personality).flatMap((d) => [vendettaTitle(d), vendettaTitle(d, 5)]);
}
setVendettaTitlesResolver(vendettaTitlesFor);

/** 5.22 : relique mythique d'une vendetta gagnée contre un Seigneur Ascendant. */
export function ascendantRelic(d: Pick<WarlordDef, "id">, now: number, random: () => number = Math.random): RelicItem {
  const pool = mythicTemplates();
  const tpl = pool[Math.floor(random() * pool.length) % pool.length];
  return makeRelic(tpl.id, "mythic", now, `ascendant:${d.id}`, random);
}
