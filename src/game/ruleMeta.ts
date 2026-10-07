/* =====================================================
   6.14.95 (AU27, lot AA2 : constats AA-24, AA-28) : métadonnées des réglages.

   Chaque objet de règles du registre (`ruleRegistry.ts`) a, à côté de lui
   dans son module, un `X_RULES_META = { champ: { label, unit, min, max, hint } }`
   en valeurs littérales (JSON pur, jamais une constante importée : voir
   CLAUDE.md, « Initialisation des modules »). Le registre les relie à leur
   groupe ; l'admin les affiche (Tous les réglages) et `validateRules` refuse
   une valeur hors de `min` / `max`.

   Ce module n'importe rien : le registre et l'admin le lisent sans cycle.
   Les groupes historiques de `GameRules` (hors registre) ont leurs
   métadonnées dans `HISTORICAL_RULES_META`, plus bas.
===================================================== */

/** Métadonnées d'un champ de réglage (premier niveau d'un groupe). */
export interface RuleFieldMeta {
  /** Libellé clair, en français. */
  label: string;
  /** Unité affichée : « h », « min », « j », « ms », « s », « part » (0,1 = 10 %), « × », « XP », « Ambre »… */
  unit?: string;
  /** Bornes acceptées à l'enregistrement (nombres seulement). */
  min?: number;
  max?: number;
  /** Aide d'une phrase : ce que fait le réglage, et ses pièges. */
  hint?: string;
}

/** Métadonnées d'un groupe : une entrée par champ de premier niveau. */
export type RuleMeta<T = Record<string, unknown>> = { readonly [K in keyof T]?: RuleFieldMeta };

/** Unités connues et leur libellé long (aide de l'admin). */
export const RULE_UNIT_LABELS: Record<string, string> = {
  h: "heures",
  min: "minutes",
  j: "jours",
  ms: "millisecondes",
  s: "secondes",
  part: "part (0,1 = 10 %)",
  "×": "multiplicateur",
  "%": "points de pourcentage",
  date: "date (ms depuis 1970, UTC)",
};

/** Erreur de borne d'une valeur numérique (null : dans les bornes ou sans borne). */
export function ruleBoundError(meta: RuleFieldMeta | undefined, value: number): string | null {
  if (!meta || !Number.isFinite(value)) return null;
  const lo = meta.min;
  const hi = meta.max;
  if ((lo !== undefined && value < lo) || (hi !== undefined && value > hi)) {
    if (lo !== undefined && hi !== undefined) return `entre ${lo} et ${hi}`;
    return lo !== undefined ? `au moins ${lo}` : `au plus ${hi}`;
  }
  return null;
}

/**
 * Groupes historiques de `GameRules` (déclarés dans `content.ts`, hors registre). Leurs chiffres courants ont une section dédiée
 * dans l'onglet Règles ; on décrit ici les champs qui n'en ont pas (repris de l'ancien dictionnaire de l'éditeur avancé).
 */
export const HISTORICAL_RULES_META: Record<string, Record<string, RuleFieldMeta>> = {
  pvp: {
    npcWinMinXp: { label: "XP minimale d'une victoire contre un PNJ", unit: "XP", min: 0 },
    defenseXpLossWindowMs: { label: "Fenêtre de la perte d'XP en défense", unit: "ms", min: 0, hint: "86 400 000 = 24 h." },
  },
  economy: {
    protectedHoursFromMs: { label: "Abri en heures de production : actif à partir de", unit: "date", min: 0 },
  },
  fleets: {
    mapSize: { label: "Taille de la carte de la galaxie", min: 10, max: 1000, hint: "Côté de la carte, en unités de distance. Change toutes les distances de vol." },
  },
  colonies: {
    levelsRequired: { label: "Niveaux cumulés requis pour chaque colonie", hint: "Un seuil par colonie, dans l'ordre." },
    foundationShare: { label: "Fondation : part des niveaux de la planète mère", unit: "part", min: 0, max: 1 },
    foundationMax: { label: "Fondation : niveau maximal", min: 0 },
  },
  colonyRoutes: {
    intervals: { label: "Cadences proposées", unit: "h", hint: "Valeurs séparées par des virgules." },
  },
  spy: {
    sentinelCounterCap: { label: "Contre-espionnage : sentinelles comptées au plus", min: 0 },
    sentinelUnitId: { label: "Unité de contre-espionnage (id)" },
  },
  debris: {
    capacityPerLevel: { label: "Capacité par niveau", min: 0 },
  },
  seasons: {
    firstSeasonId: { label: "Première saison (AAAA-MM)" },
  },
  alliances: {
    membersPerQuarter: { label: "Membres en plus par niveau de Quartiers fédérés", min: 0 },
    sharedReportsMax: { label: "Rapports partagés gardés", min: 0 },
  },
  expeditions: {
    rareRate: { label: "Taux des ressources rares", min: 0 },
    forceMinPower: { label: "Force ennemie minimale", unit: "×", min: 0, hint: "Multiple de ta puissance." },
    forceMaxPower: { label: "Force ennemie maximale", unit: "×", min: 0, hint: "Multiple de ta puissance ; au moins la force minimale." },
  },
  leviathan: {
    podiumHours: { label: "Heures de production du podium (1er, 2e, 3e…)", unit: "h" },
    relicAmber: { label: "Ambre par relique (rareté)", unit: "Ambre" },
  },
};

/** Libellés des sous-champs courants (objets imbriqués affichés champ par champ). */
export const NESTED_FIELD_LABELS: Record<string, string> = {
  tech: "Couche techno",
  empire: "Couche empire",
  xp: "XP",
  hours: "Heures de production",
  amber: "Ambre",
  rep: "Réputation",
  weak: "Faible",
  medium: "Moyen",
  strong: "Fort",
  builder: "Bâtisseur",
  default: "Autres",
  aggressive: "Agressif",
  opportunist: "Opportuniste",
  merchant: "Marchand",
  pact: "Pacte",
  escort: "Escorte",
  embargo: "Embargo",
  scrap: "Ferraille",
  energy: "Énergie",
  nano: "Nanocomposants",
  data: "Données",
  rarePerAmber: "Ressources rares par Ambre",
  weeklyCap: "Ambre échangeable par semaine",
  costHours: "Coût (h de production)",
  durationHours: "Durée (h)",
  goalFactor: "Objectif (× puissance)",
  powerLoss: "Puissance perdue (part)",
  awayDays: "Absence (j)",
  passPoints: "Points de passe",
  minShare: "Part minimale de l'objectif",
};
