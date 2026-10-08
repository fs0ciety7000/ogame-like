/* =====================================================
   Circuit d'effets (v5.14) : un seul vocabulaire pour tout ce qui modifie
   l'empire. Chaque système (technologies, officiers, reliques, talents,
   territoires, capsules…) DÉCLARE ses effets ; un seul résolveur les
   additionne. Ajouter une techno, une relique ou un rôle d'officier qui
   parle ce vocabulaire suffit : production, combat, durées, flottes et
   colonies suivent sans autre code.

   Module feuille : aucun import de module de jeu (pas de cycle).
===================================================== */

/** Grandeurs modifiables. Toutes en fraction (0,05 = 5 %) sauf mention. */
export type EffectStat =
  // Combat
  | "attack"
  | "defense"
  | "bossDamage"
  | "repair"
  | "repairSpeed"
  | "loot"
  // 5.23 : grandeurs ciblées (unité, classe ou catégorie : voir effectTargets.ts)
  | "unitAttack"
  | "unitHp"
  | "classEdge"
  | "shield"
  // Économie
  | "productionAll"
  | "production"
  | "storage"
  | "protectedStorage"
  | "buildingDiscount"
  | "tradeTax"
  // Durées (réductions)
  | "buildTime"
  | "researchTime"
  | "unitTime"
  | "unitBuildTime"
  | "unitCost"
  // Flottes
  | "cargo"
  | "fleetSpeed"
  | "fleetUpkeep"
  | "hangarCapacity"
  | "dockCapacity"
  // 6.14.44 : porte de saut lunaire (réduction de la recharge)
  | "jumpGateCooldown"
  // Renseignement
  | "spyLevel"
  | "detection"
  | "counterSpy"
  // 6.14.44 : portée de la phalange lunaire
  | "phalanxRange";

/** Couche de calcul. Les technologies s'appliquent unité par unité ou dans
 *  les formules de base ; la couche « empire » (officiers, reliques, talents,
 *  territoires) multiplie le résultat. Deux couches, un seul vocabulaire.
 *  6.14.124 (AA6) : la couche « alliance » porte les recherches et projets d'alliance lus par leurs propres calculs
 *  (temps de vol, production, durées, bouclier…), multipliés à part comme avant ; leurs autres effets vont en couche empire. */
export type EffectLayer = "tech" | "empire" | "alliance";

/** Où l'effet s'applique. « all » partout ; « home » planète mère ; « colonies » ;
 *  « pvp » seulement entre joueurs (capsules). 5.23 : « pve » contre tous les PNJ
 *  (pirates, primes, expéditions, boss, seigneurs) ; « warlord » contre les seigneurs. */
export type EffectScope = "all" | "home" | "colonies" | "pvp" | "pve" | "warlord";

export const EFFECT_SCOPE_LABELS: Record<EffectScope, string> = {
  all: "Partout",
  home: "Planète mère",
  colonies: "Colonies",
  pvp: "Contre les joueurs",
  pve: "Contre les PNJ",
  warlord: "Contre les seigneurs",
};

export type EffectSourceKind = "tech" | "officer" | "relic" | "talent" | "territory" | "capsule" | "season" | "module" | "class" | "moon" | "alliance" | "building";

export interface EffectSourceRef {
  kind: EffectSourceKind;
  /** Identifiant dans son catalogue (techno, officier, modèle de relique…). */
  id: string;
  /** Nom affiché (« Rhys Calder », « Écaille de Léviathan (rare) »). */
  label: string;
}

export interface EffectGrant {
  stat: EffectStat;
  /** Ressource (production), hangar (hangarCapacity : attack | defense) ou,
   *  5.23, sélecteur d'unités (unit:<id>, class:<light|medium|heavy>, cat:<attack|defense>). */
  target?: string;
  value: number;
  layer: EffectLayer;
  scope?: EffectScope;
  source: EffectSourceRef;
}

export interface EffectStatInfo {
  label: string;
  /** pct : fraction affichée en % ; level : niveaux ; points : nombre brut. */
  unit: "pct" | "level" | "points";
  /** Réduction (affichée « − ») plutôt que bonus. */
  reduction?: boolean;
  /** Plafond du total par couche. */
  cap?: Partial<Record<EffectLayer, number>>;
  /** Plancher du total (avant plafond). */
  floor?: number;
  /** 5.23 : la cible est un sélecteur d'unités (voir effectTargets.ts). */
  unitTarget?: boolean;
  /** 5.23 : portées proposées par l'éditeur d'effets. */
  scopes?: EffectScope[];
  group: "combat" | "economie" | "durees" | "flottes" | "renseignement";
}

/** Plafond des réductions cumulées des technologies (temps, coûts, entretien). */
export const TECH_REDUCTION_CAP = 0.75;
/** 6.6 : plafond de l'attaque et de la défense de toutes les unités données par les technologies. */
export const TECH_COMBAT_CAP = 1.5;
/** 6.6 : une seule technologie ne donne pas plus que ceci d'attaque ou de défense à son niveau maximal. */
export const TECH_COMBAT_PER_TECH_MAX = 1;
/** 6.7.1 : valeurs en vigueur (Admin → Règles → Combat : `techCombatCap`, `techCombatPerTechMax`). */
export const TECH_COMBAT_LIMITS = { cap: TECH_COMBAT_CAP, perTechMax: TECH_COMBAT_PER_TECH_MAX };
/** Plafond des réductions de durée de la couche empire. */
export const EMPIRE_TIME_CAP = 0.5;
/** 5.28.1 : plafond des réductions de coût et d'entretien de la couche empire (reliques, officiers, modules). */
export const EMPIRE_COST_CAP = 0.5;

/** 5.23 : portées d'un effet de combat. */
const COMBAT_SCOPES: EffectScope[] = ["all", "pvp", "pve", "warlord"];

export const EFFECT_STATS: Record<EffectStat, EffectStatInfo> = {
  // 6.6 (revue AU1, PNJ-1) : technos plafonnées à +150 % (+100 % de « Puissance d'attaque » / « Blindage avancé »,
  // +50 % au plus de technos ajoutées par l'admin).
  attack: { label: "Attaque", unit: "pct", group: "combat", cap: { tech: TECH_COMBAT_CAP } },
  defense: { label: "Défense", unit: "pct", group: "combat", cap: { tech: TECH_COMBAT_CAP } },
  bossDamage: { label: "Dégâts contre les boss", unit: "pct", group: "combat" },
  repair: { label: "Vaisseaux réparés", unit: "pct", group: "combat" },
  repairSpeed: { label: "Cadence de l'Atelier", unit: "pct", group: "combat" },
  loot: { label: "Butin pillé", unit: "pct", group: "combat" },
  unitAttack: { label: "Attaque des unités ciblées", unit: "pct", group: "combat", unitTarget: true, scopes: COMBAT_SCOPES, cap: { tech: 0.5, empire: 0.5, alliance: 0.5 } },
  unitHp: { label: "Points de vie des unités ciblées", unit: "pct", group: "combat", unitTarget: true, scopes: COMBAT_SCOPES, cap: { tech: 0.5, empire: 0.5 } },
  classEdge: { label: "Avantage de classe", unit: "pct", group: "combat", scopes: COMBAT_SCOPES, cap: { tech: 0.2, empire: 0.2 }, floor: 0 },
  shield: { label: "Bouclier planétaire", unit: "pct", group: "combat", scopes: COMBAT_SCOPES, cap: { tech: 0.15, empire: 0.15, alliance: 0.15 }, floor: 0 },
  productionAll: { label: "Production de toutes les ressources", unit: "pct", group: "economie", cap: { alliance: 0.5 } },
  production: { label: "Production d'une ressource", unit: "pct", group: "economie" },
  storage: { label: "Capacité des entrepôts", unit: "pct", group: "economie" },
  protectedStorage: { label: "Entrepôt à l'abri du pillage", unit: "pct", group: "economie", cap: { tech: TECH_REDUCTION_CAP, empire: 0.25, alliance: 0.25 }, floor: 0 },
  buildingDiscount: { label: "Coût des bâtiments", unit: "pct", reduction: true, group: "economie", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_COST_CAP }, floor: 0 },
  tradeTax: { label: "Taxe du marché et des cadeaux", unit: "pct", reduction: true, group: "economie", cap: { empire: 0.5 }, floor: 0 },
  buildTime: { label: "Temps de construction", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP, alliance: 0.5 }, floor: 0 },
  researchTime: { label: "Temps de recherche", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP, alliance: 0.5 }, floor: 0 },
  unitTime: { label: "Temps de production des unités", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP }, floor: 0 },
  unitBuildTime: { label: "Temps de production des unités ciblées", unit: "pct", reduction: true, group: "durees", unitTarget: true, cap: { tech: 0.5, empire: 0.5 }, floor: 0 },
  unitCost: { label: "Coût des unités ciblées", unit: "pct", reduction: true, group: "economie", unitTarget: true, cap: { tech: 0.2, empire: 0.2 }, floor: 0 },
  cargo: { label: "Soute des flottes", unit: "pct", group: "flottes" },
  fleetSpeed: { label: "Temps de vol", unit: "pct", reduction: true, group: "flottes", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP, alliance: 0.5 }, floor: 0 },
  fleetUpkeep: { label: "Entretien de la flotte", unit: "pct", reduction: true, group: "flottes", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_COST_CAP }, floor: 0 },
  hangarCapacity: { label: "Capacité des hangars", unit: "pct", group: "flottes" },
  dockCapacity: { label: "Postes de la Cale sèche", unit: "pct", group: "flottes" },
  // 6.14.44 (proposals/phalange-porte-de-saut.md §5.4) : couche empire seulement, plafonds réglables (effectCaps).
  jumpGateCooldown: { label: "Recharge de la porte de saut", unit: "pct", reduction: true, group: "flottes", cap: { tech: 0.3, empire: 0.3 }, floor: 0 },
  spyLevel: { label: "Niveau d'espionnage", unit: "level", group: "renseignement" },
  detection: { label: "Détection de l'espionnage", unit: "pct", group: "renseignement" },
  counterSpy: { label: "Contre-espionnage", unit: "points", group: "renseignement" },
  phalanxRange: { label: "Portée de la phalange", unit: "pct", group: "renseignement", cap: { tech: 0.5, empire: 0.5 }, floor: 0 },
};

/** 6.9.5 (AU8) : plafonds de chaque grandeur par couche, réglables (registre « effectCaps »). Attaque et défense des
 *  technos restent pilotées par `combat.techCombatCap` (6.7.1). Remplis depuis EFFECT_STATS (même module). */
export const EFFECT_CAP_RULES: Record<string, { tech?: number; empire?: number; alliance?: number }> = {};
for (const [k, info] of Object.entries(EFFECT_STATS)) if (info.cap && k !== "attack" && k !== "defense") EFFECT_CAP_RULES[k] = { ...info.cap };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const EFFECT_CAP_RULES_META = {
  unitAttack: { label: "Attaque des unités ciblées", hint: "Plafond du bonus par couche : tech (technos), empire (reliques, officiers, talents…), alliance (recherches et projets d'alliance lus par leurs calculs, 6.14.124). 0,5 = +50 %." },
  productionAll: { label: "Production de toutes les ressources", hint: "6.14.124 : plafond de la couche alliance seulement (Industrie coopérative…). 0,5 = +50 %." },
  unitHp: { label: "Points de vie des unités ciblées", hint: "Plafond par couche (0,5 = +50 %)." },
  classEdge: { label: "Avantage de classe", hint: "Plafond par couche (0,2 = +20 %)." },
  shield: { label: "Bouclier planétaire", hint: "Plafond par couche (0,15 = +15 %)." },
  protectedStorage: { label: "Entrepôt à l'abri du pillage", hint: "Plafond par couche (0,25 = +25 %)." },
  buildingDiscount: { label: "Coût des bâtiments (réduction)", hint: "Réduction maximale par couche (0,5 = −50 %)." },
  tradeTax: { label: "Taxe du marché et des cadeaux (réduction)", hint: "Réduction maximale, couche empire seulement." },
  buildTime: { label: "Temps de construction (réduction)", hint: "Réduction maximale par couche." },
  researchTime: { label: "Temps de recherche (réduction)", hint: "Réduction maximale par couche." },
  unitTime: { label: "Temps de production des unités (réduction)", hint: "Réduction maximale par couche." },
  unitBuildTime: { label: "Temps de production des unités ciblées (réduction)", hint: "Réduction maximale par couche." },
  unitCost: { label: "Coût des unités ciblées (réduction)", hint: "Réduction maximale par couche." },
  fleetSpeed: { label: "Temps de vol (réduction)", hint: "Réduction maximale par couche." },
  fleetUpkeep: { label: "Entretien de la flotte (réduction)", hint: "Réduction maximale par couche." },
  jumpGateCooldown: { label: "Recharge de la porte de saut (réduction)", hint: "Réduction maximale par couche." },
  phalanxRange: { label: "Portée de la phalange", hint: "Plafond du bonus par couche (0,5 = +50 %)." },
};

/** Plafond en vigueur d'une grandeur pour une couche (undefined : aucun). */
export function effectCap(stat: EffectStat, layer: EffectLayer): number | undefined {
  const r = EFFECT_CAP_RULES[stat]?.[layer];
  return r !== undefined ? r : EFFECT_STATS[stat].cap?.[layer];
}

export const EFFECT_STAT_IDS = Object.keys(EFFECT_STATS) as EffectStat[];

export const EFFECT_SOURCE_LABELS: Record<EffectSourceKind, string> = {
  tech: "Technologie",
  officer: "Officier",
  relic: "Relique",
  talent: "Talent",
  territory: "Territoire",
  capsule: "Capsule",
  season: "Mutateur de saison",
  module: "Module de vaisseau",
  class: "Classe d'empire",
  moon: "Lune",
  alliance: "Alliance",
  // 6.14.142 (PB-L1) : paliers des bâtiments de système (Entrepôt 15 : Convoi).
  building: "Palier de bâtiment",
};

export interface SumOptions {
  /** Cible exacte ; absente, toutes les cibles s'additionnent. */
  target?: string;
  /** Portée demandée : les effets « all » comptent toujours. */
  scope?: EffectScope;
}

function inScope(g: EffectGrant, scope: EffectScope | undefined): boolean {
  const s = g.scope ?? "all";
  // 5.23 : un effet « contre les PNJ » joue aussi contre les seigneurs.
  return s === "all" || s === scope || (s === "pve" && scope === "warlord");
}

/** Total brut d'une grandeur dans une couche (sans plafond). */
export function rawEffectTotal(grants: readonly EffectGrant[], layer: EffectLayer, stat: EffectStat, opts: SumOptions = {}): number {
  let total = 0;
  for (const g of grants) {
    if (g.layer !== layer || g.stat !== stat || !inScope(g, opts.scope)) continue;
    if (opts.target !== undefined && g.target !== opts.target) continue;
    total += g.value;
  }
  return total;
}

/** Plancher et plafond d'une grandeur pour une couche. */
export function clampEffect(stat: EffectStat, layer: EffectLayer, total: number): number {
  const info = EFFECT_STATS[stat];
  let v = total;
  const cap = effectCap(stat, layer);
  if (cap !== undefined) v = Math.min(cap, info.floor !== undefined ? Math.max(info.floor, v) : v);
  return v;
}

/** Total d'une grandeur dans une couche, plafonds appliqués. */
export function effectTotal(grants: readonly EffectGrant[], layer: EffectLayer, stat: EffectStat, opts: SumOptions = {}): number {
  return clampEffect(stat, layer, rawEffectTotal(grants, layer, stat, opts));
}

/* ---------- fiche d'effets : tout ce qui modifie une grandeur, et d'où ça vient ---------- */

export interface EffectSheetLine {
  stat: EffectStat;
  target?: string;
  layer: EffectLayer;
  /** Total plafonné. */
  total: number;
  /** Total avant plafond (pour signaler un plafond atteint). */
  raw: number;
  sources: { source: EffectSourceRef; value: number; scope: EffectScope }[];
}

export function effectSheet(grants: readonly EffectGrant[]): EffectSheetLine[] {
  const lines = new Map<string, EffectSheetLine>();
  for (const g of grants) {
    if (!(g.value !== 0)) continue;
    const key = `${g.layer}|${g.stat}|${g.target ?? ""}`;
    let line = lines.get(key);
    if (!line) {
      line = { stat: g.stat, target: g.target, layer: g.layer, total: 0, raw: 0, sources: [] };
      lines.set(key, line);
    }
    line.raw += g.value;
    const same = line.sources.find((s) => s.source.kind === g.source.kind && s.source.id === g.source.id && s.scope === (g.scope ?? "all"));
    if (same) same.value += g.value;
    else line.sources.push({ source: g.source, value: g.value, scope: g.scope ?? "all" });
  }
  const order = EFFECT_STAT_IDS;
  return [...lines.values()]
    .map((l) => ({ ...l, total: clampEffect(l.stat, l.layer, l.raw) }))
    .sort((a, b) => order.indexOf(a.stat) - order.indexOf(b.stat) || cmp(a.target ?? "", b.target ?? "") || cmp(a.layer, b.layer));
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** « +12 % », « −8 % », « +1,4 niveau », « +3 points » (sans Intl : goja). */
export function formatEffectValue(stat: EffectStat, value: number): string {
  const info = EFFECT_STATS[stat];
  const sign = info.reduction ? "−" : value < 0 ? "−" : "+";
  const abs = Math.abs(value);
  const dec = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");
  if (info.unit === "pct") return `${sign}${dec(abs * 100)} %`;
  if (info.unit === "level") return `${sign}${dec(abs)} niveau${abs >= 2 ? "x" : ""}`;
  return `${sign}${Math.floor(abs)} point${abs >= 2 ? "s" : ""}`;
}

/** Libellé d'une grandeur, cible comprise (« Production de Ferraille »). */
export function effectStatLabel(stat: EffectStat, target?: string, names: { resource?: (id: string) => string; unit?: (selector: string) => string } = {}): string {
  if (stat === "production" && target) return `Production de ${names.resource?.(target) ?? target}`;
  // 5.23 : « Attaque des unités ciblées » → « Attaque des unités ciblées : Sentinelle ».
  if (EFFECT_STATS[stat].unitTarget && target) return `${EFFECT_STATS[stat].label.replace(/ des unités ciblées$/, "")} : ${(names.unit ?? unitTargetLabeler)(target)}`;
  if (stat === "hangarCapacity" && target) return `Capacité des hangars ${target === "defense" ? "de défense" : "d'attaque"}`;
  return EFFECT_STATS[stat].label;
}

/* ---------- 5.23 : effets composés (grandeur × cible × portée × valeur) ---------- */

/** Effet composé dans l'administration (reliques, technologies, officiers). */
export interface ComposedEffect {
  stat: EffectStat;
  /** Ressource, hangar ou sélecteur d'unités selon la grandeur. */
  target?: string;
  scope?: EffectScope;
}

/** Libellé d'un sélecteur d'unités (renseigné par effectTargets.ts : pas de cycle). */
let unitTargetLabeler: (selector: string) => string = (s) => s;
export function setUnitTargetLabeler(fn: (selector: string) => string): void {
  unitTargetLabeler = fn;
}

const RESOURCE_TARGET_LABELS: Record<string, string> = { scrap: "ferraille", energy: "énergie", nano: "nanocomposants", data: "données anciennes" };

/** « +10 % · Attaque : Sentinelle (contre les PNJ) ». */
export function describeEffect(stat: EffectStat, value: number, target?: string, scope?: EffectScope): string {
  const label = effectStatLabel(stat, target, { unit: unitTargetLabeler, resource: (id) => RESOURCE_TARGET_LABELS[id] ?? id });
  const where = scope && scope !== "all" ? ` (${EFFECT_SCOPE_LABELS[scope].toLowerCase()})` : "";
  return `${formatEffectValue(stat, value)} · ${label}${where}`;
}

/** Sélecteurs de groupes d'unités (voir effectTargets.ts). */
export const UNIT_GROUP_SELECTORS = ["cat:attack", "cat:defense", "class:light", "class:medium", "class:heavy", "class:support"];

/** Sélecteur d'unités bien formé (vide : toutes les unités). */
export function isUnitSelector(sel: string | undefined, hasUnit: (id: string) => boolean): boolean {
  if (!sel) return true;
  if (sel.startsWith("unit:")) return hasUnit(sel.slice(5));
  return UNIT_GROUP_SELECTORS.includes(sel);
}

/** Erreurs d'un effet composé (`validTarget` : sélecteur d'unités valide). */
export function validateComposedEffect(c: Partial<ComposedEffect> | undefined, validTarget: (sel: string | undefined) => boolean): string[] {
  if (!c || !c.stat || !(c.stat in EFFECT_STATS)) return [`grandeur « ${c?.stat ?? ""} » inconnue`];
  const info = EFFECT_STATS[c.stat];
  const errors: string[] = [];
  if (info.unitTarget && !validTarget(c.target)) errors.push(`cible « ${c.target} » inconnue`);
  if (c.scope && c.scope !== "all") {
    const allowed = info.scopes ?? ["all", "home", "colonies"];
    if (!allowed.includes(c.scope)) errors.push(`portée « ${EFFECT_SCOPE_LABELS[c.scope] ?? c.scope} » sans effet sur ${info.label.toLowerCase()}`);
  }
  if (c.stat === "production" && c.target && !(c.target in RESOURCE_TARGET_LABELS)) errors.push(`ressource « ${c.target} » inconnue`);
  if (c.stat === "hangarCapacity" && c.target && c.target !== "attack" && c.target !== "defense") errors.push("hangar : attack ou defense");
  return errors;
}

/** 6.14.125 (AU27, lot AA7) : effet composé chiffré (grandeur × cible × portée + valeur), porté par une classe d'empire ou
 *  un mutateur de saison (une seule source active à la fois : la valeur est donnée telle quelle, sans niveau). */
export interface ValuedEffect extends ComposedEffect {
  value: number;
}

/** Bornes d'une valeur d'effet chiffré : part (réduction de durée, de coût ou de taxe : 0,9 au plus ; bonus : 2 au plus),
 *  niveaux (5 au plus), points (20 au plus). */
export function valuedEffectMax(stat: EffectStat): number {
  const info = EFFECT_STATS[stat];
  if (!info) return 0;
  if (info.unit === "level") return 5;
  if (info.unit === "points") return 20;
  return info.reduction ? 0.9 : 2;
}

/** Erreurs d'une liste d'effets chiffrés (`label` : « Classe Industriel »). Au moins un effet. */
export function validateValuedEffects(label: string, effects: unknown, validTarget: (sel: string | undefined) => boolean): string[] {
  if (!Array.isArray(effects)) return [`${label} : effets invalides (liste attendue).`];
  if (effects.length === 0) return [`${label} : au moins un effet.`];
  const errors: string[] = [];
  effects.forEach((e: Partial<ValuedEffect>, i) => {
    for (const m of validateComposedEffect(e, validTarget)) errors.push(`${label} : effet n° ${i + 1}, ${m}.`);
    if (!e?.stat || !(e.stat in EFFECT_STATS)) return;
    const max = valuedEffectMax(e.stat);
    if (!(typeof e.value === "number" && Number.isFinite(e.value) && e.value >= 0 && e.value <= max)) errors.push(`${label} : effet n° ${i + 1}, valeur entre 0 et ${String(max).replace(".", ",")}.`);
  });
  return errors;
}

/** 6.7.1 : applique les plafonds des technos de combat réglés dans l'administration. */
export function setTechCombatLimits(cap: number, perTechMax: number): void {
  TECH_COMBAT_LIMITS.cap = cap;
  TECH_COMBAT_LIMITS.perTechMax = perTechMax;
  EFFECT_STATS.attack.cap = { ...EFFECT_STATS.attack.cap, tech: cap };
  EFFECT_STATS.defense.cap = { ...EFFECT_STATS.defense.cap, tech: cap };
}
