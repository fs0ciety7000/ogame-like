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
  | "loot"
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
  // Flottes
  | "cargo"
  | "fleetSpeed"
  | "fleetUpkeep"
  | "hangarCapacity"
  // Renseignement
  | "spyLevel"
  | "detection"
  | "counterSpy";

/** Couche de calcul. Les technologies s'appliquent unité par unité ou dans
 *  les formules de base ; la couche « empire » (officiers, reliques, talents,
 *  territoires) multiplie le résultat. Deux couches, un seul vocabulaire. */
export type EffectLayer = "tech" | "empire";

/** Où l'effet s'applique. « all » partout ; « home » planète mère ; « colonies » ;
 *  « pvp » seulement entre joueurs (capsules). */
export type EffectScope = "all" | "home" | "colonies" | "pvp";

export type EffectSourceKind = "tech" | "officer" | "relic" | "talent" | "territory" | "capsule";

export interface EffectSourceRef {
  kind: EffectSourceKind;
  /** Identifiant dans son catalogue (techno, officier, modèle de relique…). */
  id: string;
  /** Nom affiché (« Rhys Calder », « Écaille de Léviathan (rare) »). */
  label: string;
}

export interface EffectGrant {
  stat: EffectStat;
  /** Ressource (production) ou hangar (hangarCapacity : attack | defense). */
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
  group: "combat" | "economie" | "durees" | "flottes" | "renseignement";
}

/** Plafond des réductions cumulées des technologies (temps, coûts, entretien). */
export const TECH_REDUCTION_CAP = 0.75;
/** Plafond des réductions de durée de la couche empire. */
export const EMPIRE_TIME_CAP = 0.5;

export const EFFECT_STATS: Record<EffectStat, EffectStatInfo> = {
  attack: { label: "Attaque", unit: "pct", group: "combat" },
  defense: { label: "Défense", unit: "pct", group: "combat" },
  bossDamage: { label: "Dégâts contre les boss", unit: "pct", group: "combat" },
  repair: { label: "Vaisseaux réparés", unit: "pct", group: "combat" },
  loot: { label: "Butin pillé", unit: "pct", group: "combat" },
  productionAll: { label: "Production de toutes les ressources", unit: "pct", group: "economie" },
  production: { label: "Production d'une ressource", unit: "pct", group: "economie" },
  storage: { label: "Capacité des entrepôts", unit: "pct", group: "economie" },
  protectedStorage: { label: "Entrepôt à l'abri du pillage", unit: "pct", group: "economie", cap: { tech: TECH_REDUCTION_CAP, empire: 0.25 }, floor: 0 },
  buildingDiscount: { label: "Coût des bâtiments", unit: "pct", reduction: true, group: "economie", cap: { tech: TECH_REDUCTION_CAP }, floor: 0 },
  tradeTax: { label: "Taxe du marché et des cadeaux", unit: "pct", reduction: true, group: "economie", cap: { empire: 0.5 }, floor: 0 },
  buildTime: { label: "Temps de construction", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP }, floor: 0 },
  researchTime: { label: "Temps de recherche", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP }, floor: 0 },
  unitTime: { label: "Temps de production des unités", unit: "pct", reduction: true, group: "durees", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP }, floor: 0 },
  cargo: { label: "Soute des flottes", unit: "pct", group: "flottes" },
  fleetSpeed: { label: "Temps de vol", unit: "pct", reduction: true, group: "flottes", cap: { tech: TECH_REDUCTION_CAP, empire: EMPIRE_TIME_CAP }, floor: 0 },
  fleetUpkeep: { label: "Entretien de la flotte", unit: "pct", reduction: true, group: "flottes", cap: { tech: TECH_REDUCTION_CAP }, floor: 0 },
  hangarCapacity: { label: "Capacité des hangars", unit: "pct", group: "flottes" },
  spyLevel: { label: "Niveau d'espionnage", unit: "level", group: "renseignement" },
  detection: { label: "Détection de l'espionnage", unit: "pct", group: "renseignement" },
  counterSpy: { label: "Contre-espionnage", unit: "points", group: "renseignement" },
};

export const EFFECT_STAT_IDS = Object.keys(EFFECT_STATS) as EffectStat[];

export const EFFECT_SOURCE_LABELS: Record<EffectSourceKind, string> = {
  tech: "Technologie",
  officer: "Officier",
  relic: "Relique",
  talent: "Talent",
  territory: "Territoire",
  capsule: "Capsule",
};

export interface SumOptions {
  /** Cible exacte ; absente, toutes les cibles s'additionnent. */
  target?: string;
  /** Portée demandée : les effets « all » comptent toujours. */
  scope?: EffectScope;
}

function inScope(g: EffectGrant, scope: EffectScope | undefined): boolean {
  const s = g.scope ?? "all";
  return s === "all" || s === scope;
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
  const cap = info.cap?.[layer];
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
export function effectStatLabel(stat: EffectStat, target?: string, names: { resource?: (id: string) => string } = {}): string {
  if (stat === "production" && target) return `Production de ${names.resource?.(target) ?? target}`;
  if (stat === "hangarCapacity" && target) return `Capacité des hangars ${target === "defense" ? "de défense" : "d'attaque"}`;
  return EFFECT_STATS[stat].label;
}
