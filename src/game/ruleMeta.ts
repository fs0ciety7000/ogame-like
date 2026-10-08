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
    // 6.14.106 (AU27, AE-L3, AE-7).
    maxDefeatsPer24h: {
      label: "Défaites en défense sur 24 h avant protection",
      min: 0,
      max: 50,
      hint: "Toutes planètes et attaquants réunis : à ce nombre, plus aucune attaque de joueur ou de seigneur jusqu'à ce que la plus ancienne ait 24 h. 0 = sans limite.",
    },
  },
  streak: {
    // 6.14.106 (AU27, AE-L3, Q99).
    chest: {
      label: "Coffre du 7e jour",
      hint: "Ambre, jetons et ressources communes tirés au hasard. commonHours [min, max] : heures de production du joueur par ressource commune (common[0] = plancher) ; [0, 0] = bornes fixes common.",
    },
  },
  economy: {
    protectedHoursFromMs: { label: "Abri en heures de production : actif à partir de", unit: "date", min: 0 },
    // 6.14.104 (AA3, AA-29).
    keshBoostPct: { label: "Gelée de la Reine : bonus de production", unit: "part", min: 0, max: 1, hint: "0,2 = +20 % pendant la durée réglée au Comptoir de la Ruche (boostHours)." },
    missionProductionMultiplier: { label: "Missions : ressources communes, au moins ce multiple de (durée × production)", unit: "×", min: 0, max: 10, hint: "Passe à 0,75 à la bascule du rythme." },
  },
  fleets: {
    mapSize: { label: "Taille de la carte de la galaxie", min: 10, max: 1000, hint: "Côté de la carte, en unités de distance. Change toutes les distances de vol." },
    delayMaxMinutes: { label: "Départ différé d'une flotte, au plus", unit: "min", min: 0, max: 10_080, hint: "0 = pas de départ différé." },
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
    sentinelUnitId: { label: "Unité de contre-espionnage (id), repli", hint: "6.14.123 : sert seulement si aucune unité n'a le rôle « Contre-espionnage » (Contenu → Unités)." },
    probeUnitId: { label: "Sonde d'espionnage (id), repli", hint: "6.14.123 : sert seulement si aucune unité n'a le rôle « Sonde d'espionnage » (Contenu → Unités)." },
  },
  debris: {
    capacityPerLevel: { label: "Capacité par niveau", min: 0 },
    recyclerUnitId: { label: "Recycleur (id), repli", hint: "6.14.123 : sert seulement si aucune unité n'a le rôle « Recycleur » (Contenu → Unités)." },
  },
  seasons: {
    firstSeasonId: { label: "Première saison (AAAA-MM)" },
  },
  // 6.14.125 (AU27, lot AA7, AA-3 et AA-6) : listes système éditables.
  classes: {
    defs: { label: "Classes d'empire", hint: "Liste (id, nom, émoji, accroche, effets composés chiffrés, avantages) : une classe livrée retirée revient. Éditeur dédié : Règles → Classes d'empire." },
  },
  mutators: {
    defs: { label: "Mutateurs de saison", hint: "Liste (id, nom, émoji, phrase d'accroche, effets composés chiffrés) ; la description est construite depuis les effets. Éditeur dédié : Règles → Événements et saisons." },
    // 6.14.136 (AU27, lot AP-L9) : tirage sans répétition.
    noRepeatMonths: { label: "Un mutateur ne revient pas avant", unit: "mois", min: 0, max: 24, hint: "0 : ancien tirage (seulement jamais deux mois de suite). Plafonné au nombre de mutateurs moins un." },
    freshMonths: { label: "Fenêtre de fraîcheur", unit: "mois", min: 0, max: 36, hint: "Un mutateur absent de cette fenêtre (mois tiré compris) passe avant les autres. 0 : sans préférence." },
    noRepeatFrom: { label: "Tirage sans répétition à partir de (AAAA-MM)", hint: "Les mois d'avant gardent l'ancien tirage : un mois passé, en cours ou annoncé ne change pas." },
  },
  alliances: {
    membersPerQuarter: { label: "Places de membres par niveau (effet « places de membres », Quartiers fédérés par défaut)", min: 0 },
    sharedReportsMax: { label: "Rapports partagés gardés", min: 0 },
    // 6.14.104 (AA3, AA-29).
    maxDiplomats: { label: "Diplomates par alliance, au plus", min: 0, max: 20 },
    researches: { label: "Recherches d'alliance", hint: "Liste (id, nom, valeur par niveau, effets composés) : une recherche ajoutée par défaut reste disponible même si la liste est modifiée. 6.14.124 : éditeur dédié (Règles → Événements et saisons)." },
    projects: { label: "Projets d'alliance", hint: "Liste des projets, de leurs paliers et de leurs effets composés (éditeur dédié, Règles → Événements et saisons)." },
  },
  auctions: {
    maxStart: { label: "Mise à prix maximale", min: 1, max: 1e15, hint: "Une enchère ne peut pas dépasser 10 fois cette valeur." },
  },
  weeklyStock: {
    prices: { label: "Prix de chaque offre", unit: "Ambre" },
    quantities: { label: "Exemplaires de chaque offre (tout le serveur)" },
    tokensBag: { label: "Sac de jetons : jetons donnés", min: 1, max: 1000 },
  },
  patrons: {
    top: { label: "Places au classement des mécènes", min: 1, max: 100 },
    tiers: { label: "Badge « Mécène » : Ambre versée pour chaque palier", unit: "Ambre", hint: "bronze < argent < or < grand, 1 au moins." },
  },
  expeditions: {
    // 6.14.104 (AA3, AA-29).
    durations: { label: "Durées proposées", unit: "h", hint: "Valeurs séparées par des virgules." },
    maxDepth: { label: "Expédition en chaîne : étapes en plus, au plus", min: 0, max: 10 },
    deepLootBonus: { label: "Étape profonde : butin en plus par étape", unit: "part", min: 0, max: 2 },
    deepRisk: { label: "Étape profonde : puissance adverse en plus par étape", unit: "part", min: 0, max: 2 },
    deepLootLoss: { label: "Étape profonde : part de la cale perdue en cas d'embuscade perdue", unit: "part", min: 0, max: 1 },
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
  commonHours: "Ressources communes : heures de production (min, max)",
};
