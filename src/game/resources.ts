import type { PlayerState, ResourceId, Resources } from "@/types/game";
import { formatDecimal, formatInt } from "@/game/format";
import { weekIdOf } from "@/game/weeklyRecap";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  emoji: string;
  rarity: "common" | "rare";
}

export const RESOURCE_LIST: ResourceDef[] = [
  { id: "scrap", name: "Ferraille", emoji: "🔩", rarity: "common" },
  { id: "energy", name: "Énergie instable", emoji: "⚡", rarity: "common" },
  { id: "nano", name: "Nanocomposants", emoji: "🧬", rarity: "common" },
  { id: "data", name: "Données anciennes", emoji: "📡", rarity: "common" },
  { id: "reinforcedSteel", name: "Acier renforcé", emoji: "🛠️", rarity: "rare" },
  { id: "cyberModule", name: "Module cybernétique", emoji: "🧩", rarity: "rare" },
  { id: "syntheticNanites", name: "Nanites synthétiques", emoji: "🤖", rarity: "rare" },
  { id: "aiFragment", name: "Fragment d'IA", emoji: "🧠", rarity: "rare" },
];

export const RESOURCE_LABELS: Record<string, string> = {
  scrap: "ferraille",
  energy: "énergie",
  nano: "nanocomposants",
  data: "données anciennes",
  reinforcedSteel: "acier renforcé",
  cyberModule: "module cybernétique",
  syntheticNanites: "nanites synthétiques",
  aiFragment: "fragment d'IA",
};

/** 6.9.7 (AU11) : comptoir d'échange réglable (registre « exchange ») : taux entre communes et rares, taxe versée au pot commun.
 *  6.14.106 (AU27, AE-L3, Q98) : `weeklyRareCap`, ressources rares reçues au comptoir par semaine (lundi 00 h UTC), toutes
 *  réunies, après taxe ; 0 = sans plafond. */
export const EXCHANGE_RULES = {
  commonToRare: 0.01,
  rareToCommon: 50,
  taxPct: 0.05,
  weeklyRareCap: 30_000_000,
  /** 6.14.165 (S6, NJ-26, RR-2) : taux entre deux ressources communes, et entre deux rares (1 depuis 6.9.7, désormais réglables
   *  et affichés : la page disait « aucun échange commune ↔ commune » alors que le serveur l'acceptait). */
  commonToCommon: 1,
  rareToRare: 1,
  /** 6.14.166 (S8, NJ-32) : conseil « Échange ton surplus » quand une ressource commune manque pour la prochaine action utile
   *  (stock sous son besoin) et qu'une autre a au moins `surplusAdviceRatio` fois son besoin et `surplusAdviceMin` de plus que
   *  lui (0 : jamais). Avant (6.14.165) : stocks comparés entre eux, d'où des allers-retours taxés. */
  surplusAdviceRatio: 2,
  surplusAdviceMin: 20_000,
  /** 6.14.166 (S8, NJ-32) : pas de conseil inverse d'un échange commune → commune fait il y a moins de N minutes (0 : sans garde). */
  surplusReverseMinutes: 60,
  /** 6.14.165 (RR-2) : le conseil ne s'affiche que les N premiers jours du compte (0 : toujours). Échanger tout le surplus
   *  toute la partie avance la 1re Ascension du profil moyen hors des bornes d'I29 (J17,8 → J14,8, simulé). */
  surplusAdviceDays: 3,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const EXCHANGE_RULES_META = {
  commonToRare: { label: "Comptoir : rares par ressource commune", min: 0.0001, max: 1, hint: "0,01 = 1 rare pour 100 communes ; 0,004 à la bascule du rythme." },
  rareToCommon: { label: "Comptoir : communes par ressource rare", min: 1, max: 10_000 },
  taxPct: { label: "Taxe du comptoir", unit: "part", min: 0, max: 1 },
  weeklyRareCap: {
    label: "Comptoir : ressources rares reçues par semaine, au plus",
    min: 0,
    max: 1_000_000_000_000,
    hint: "Toutes ressources rares réunies, après taxe, contre des communes ; remise à zéro le lundi 00 h UTC. 0 = sans plafond.",
  },
  commonToCommon: { label: "Comptoir : taux commune → commune", min: 0, max: 10, hint: "1 = une pour une (avant la taxe). 0 : échange fermé." },
  rareToRare: { label: "Comptoir : taux rare → rare", min: 0, max: 10, hint: "1 = une pour une (avant la taxe). 0 : échange fermé." },
  surplusAdviceRatio: {
    label: "Conseil « surplus » : stock à vendre, en fois son besoin",
    unit: "×",
    min: 0,
    max: 1_000,
    hint: "« Que faire maintenant ? » propose d'échanger quand une ressource commune manque pour la prochaine amélioration utile et qu'une autre a au moins N fois son propre besoin. 0 : jamais.",
  },
  surplusAdviceMin: { label: "Conseil « surplus » : surplus minimal (stock moins besoin)", min: 0, max: 1_000_000_000_000 },
  surplusReverseMinutes: {
    label: "Conseil « surplus » : pas d'échange inverse avant",
    unit: "min",
    min: 0,
    max: 10_080,
    hint: "Après un échange commune → commune, le conseil ne propose pas l'échange inverse pendant ce temps. 0 : sans garde.",
  },
  surplusAdviceDays: { label: "Conseil « surplus » : premiers jours du compte", unit: "j", min: 0, max: 365, hint: "Le conseil ne s'affiche que pendant ces jours. 0 : toujours." },
};

/** 6.14.106 : compteur hebdomadaire du comptoir (profil joueur, champ `exchangeWeek`). */
export interface ExchangeWeekState {
  /** Semaine (lundi 00 h UTC, AAAA-MM-JJ). */
  week: string;
  /** Ressources rares reçues au comptoir cette semaine (après taxe). */
  rares: number;
  /** 6.14.166 (S8, NJ-32) : dernier échange commune → commune (le conseil « surplus » ne propose pas son inverse aussitôt). */
  last?: { sell: ResourceId; buy: ResourceId; atMs: number } | null;
}

/** Rares déjà reçues au comptoir cette semaine (0 au changement de semaine). */
export function exchangeRareUsed(player: Pick<PlayerState, "exchangeWeek">, now: number): number {
  const st = player.exchangeWeek;
  return st && st.week === weekIdOf(now) ? Math.max(0, Number(st.rares) || 0) : 0;
}

/** Rares encore échangeables cette semaine (Infinity sans plafond). */
export function exchangeRareLeft(player: Pick<PlayerState, "exchangeWeek">, now: number): number {
  const cap = Number(EXCHANGE_RULES.weeklyRareCap) || 0;
  return cap > 0 ? Math.max(0, cap - exchangeRareUsed(player, now)) : Infinity;
}

/** Compte `n` rares reçues au comptoir (remise à zéro au changement de semaine). */
export function recordRareExchange(player: Pick<PlayerState, "exchangeWeek">, now: number, n: number): void {
  const last = player.exchangeWeek?.last;
  player.exchangeWeek = { week: weekIdOf(now), rares: exchangeRareUsed(player, now) + Math.max(0, Math.floor(n)), ...(last ? { last } : {}) };
}

/** 6.14.166 (S8, NJ-32) : garde le dernier échange commune → commune (sens et date), sans toucher au compteur des rares. */
export function recordCommonExchange(player: Pick<PlayerState, "exchangeWeek">, now: number, sell: ResourceId, buy: ResourceId): void {
  player.exchangeWeek = { week: weekIdOf(now), rares: exchangeRareUsed(player, now), last: { sell, buy, atMs: now } };
}

/** Le comptoir échange-t-il deux ressources communes dans ce sens ? */
export function isCommonToCommon(sellId: ResourceId, buyId: ResourceId): boolean {
  const sell = RESOURCE_LIST.find((r) => r.id === sellId);
  const buy = RESOURCE_LIST.find((r) => r.id === buyId);
  return sell?.rarity === "common" && buy?.rarity === "common" && sellId !== buyId;
}

/** Le comptoir donne-t-il des rares contre des communes dans ce sens ? */
export function isCommonToRare(sellId: ResourceId, buyId: ResourceId): boolean {
  const sell = RESOURCE_LIST.find((r) => r.id === sellId);
  const buy = RESOURCE_LIST.find((r) => r.id === buyId);
  return sell?.rarity === "common" && buy?.rarity === "rare";
}

/** 6.14.106 : texte joueur du plafond, lu dans la règle (« 2 M de ressources rares par semaine au plus… »). */
export function exchangeCapLabel(compact: (n: number) => string = (n) => formatInt(n)): string | null {
  const cap = Number(EXCHANGE_RULES.weeklyRareCap) || 0;
  if (!(cap > 0)) return null;
  const n = compact(cap);
  // « 30 M de ressources rares », « 30 000 000 ressources rares ».
  return `${n}${/[A-Za-z]$/.test(n) ? " de" : ""} ressources rares par semaine au plus, toutes réunies (remise à zéro le lundi à 00 h UTC)`;
}

export function getTradeRate(sellId: ResourceId, buyId: ResourceId): number {
  const sell = RESOURCE_LIST.find((r) => r.id === sellId);
  const buy = RESOURCE_LIST.find((r) => r.id === buyId);
  if (!sell || !buy) return 1;
  if (sell.rarity === "common" && buy.rarity === "rare") return EXCHANGE_RULES.commonToRare;
  if (sell.rarity === "rare" && buy.rarity === "common") return EXCHANGE_RULES.rareToCommon;
  // 6.14.165 (RR-2) : commune ↔ commune et rare ↔ rare, réglables (1 par défaut, comme avant).
  if (sell.rarity === "common") return Math.max(0, Number(EXCHANGE_RULES.commonToCommon) || 0);
  return Math.max(0, Number(EXCHANGE_RULES.rareToRare) || 0);
}

/** 6.14.166 (S8, NJ-32) : conseil « Échange ton surplus ». `need` : besoin de chaque ressource commune pour la prochaine action
 *  utile (`surplusNeeds`, nextActions.ts). On achète la ressource qui manque le plus (stock sous son besoin, en proportion) et on
 *  vend celle qui a le plus de reste, si elle a au moins `surplusAdviceRatio` fois son besoin et `surplusAdviceMin` de plus que
 *  lui. Quantité : juste de quoi combler le manque, sans passer sous le besoin de la ressource vendue. Jamais l'inverse de
 *  `last` (dernier échange commune → commune) avant `surplusReverseMinutes`. Avant (6.14.165) : stocks comparés entre eux,
 *  d'où « ferraille → nano » puis « nano → ferraille » dix minutes plus tard (deux taxes). */
export function commonSurplus(
  resources: Partial<Record<ResourceId, number>>,
  need: Partial<Record<ResourceId, number>>,
  opts: { last?: ExchangeWeekState["last"]; now?: number } = {},
): { sell: ResourceId; buy: ResourceId; amount: number } | null {
  const ratio = Number(EXCHANGE_RULES.surplusAdviceRatio) || 0;
  const rate = Number(EXCHANGE_RULES.commonToCommon) || 0;
  if (!(ratio > 0) || !(rate > 0)) return null;
  const net = rate * (1 - Math.max(0, Number(EXCHANGE_RULES.taxPct) || 0));
  if (!(net > 0)) return null;
  const min = Math.max(0, Number(EXCHANGE_RULES.surplusAdviceMin) || 0);
  const commons = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => {
    const have = Math.max(0, Math.floor(resources[r.id] ?? 0));
    const want = Math.max(0, Math.ceil(need[r.id] ?? 0));
    return { id: r.id, have, want };
  });
  const short = commons.filter((c) => c.want > c.have).sort((a, b) => (b.want - b.have) / b.want - (a.want - a.have) / a.want);
  const rich = commons.filter((c) => c.have - c.want >= min && c.have >= ratio * c.want).sort((a, b) => b.have - b.want - (a.have - a.want));
  const reverseMs = Math.max(0, Number(EXCHANGE_RULES.surplusReverseMinutes) || 0) * 60_000;
  const last = opts.last;
  const recent = !!last && reverseMs > 0 && opts.now !== undefined && opts.now - (Number(last.atMs) || 0) < reverseMs;
  for (const buy of short) {
    for (const sell of rich) {
      if (sell.id === buy.id) continue;
      if (recent && last!.sell === buy.id && last!.buy === sell.id) continue;
      const amount = Math.min(sell.have - sell.want, Math.ceil((buy.want - buy.have) / net));
      if (amount > 0) return { sell: sell.id, buy: buy.id, amount };
    }
  }
  return null;
}

/** Échange au comptoir : brut au taux, taxe (arrondie au supérieur), net reçu. 6.14.143 (PB-L2) : `taxCut`, points de taxe en moins
 *  (Négoce, palier 15 de l'entrepôt : `exchangeTaxCut(joueur)`), la taxe ne descend pas sous 0. */
export function tradeQuote(sellId: ResourceId, buyId: ResourceId, amount: number, taxCut = 0): { gross: number; tax: number; net: number; taxPct: number } {
  const gross = Math.floor(Math.max(0, amount) * getTradeRate(sellId, buyId));
  const cut = Math.max(0, Number(taxCut) || 0);
  // Arrondi au millionième : 0,05 − 0,02 donne 0,030000000000000002 en virgule flottante.
  const taxPct = cut > 0 ? Math.max(0, Math.round((EXCHANGE_RULES.taxPct - cut) * 1e6) / 1e6) : EXCHANGE_RULES.taxPct;
  const tax = gross > 0 ? Math.min(gross, Math.ceil(gross * taxPct)) : 0;
  return { gross, tax, net: gross - tax, taxPct };
}

export function canAffordAll(resources: Resources, costs: Partial<Resources>): boolean {
  return Object.entries(costs).every(([res, val]) => (resources[res as ResourceId] ?? 0) >= (val ?? 0));
}

/** « 64,6 M ferraille, 258 k module cybernétique » : lisible même pour les hauts niveaux. */
export function formatCost(cost: Partial<Resources>): string {
  return Object.entries(cost)
    .map(([res, val]) => `${compactAmount(val ?? 0)} ${RESOURCE_LABELS[res] ?? res}`)
    .join(", ");
}

function compactAmount(value: number): string {
  const abs = Math.abs(value);
  const fmt = (n: number, unit: string) => `${formatDecimal(n, n < 10 ? 2 : 1)} ${unit}`;
  if (abs >= 1e9) return fmt(value / 1e9, "Md");
  if (abs >= 1e6) return fmt(value / 1e6, "M");
  if (abs >= 1e4) return fmt(value / 1e3, "k");
  return formatInt(value);
}
