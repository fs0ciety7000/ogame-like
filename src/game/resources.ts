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

export function resourceEmoji(id: string): string {
  return RESOURCE_LIST.find((r) => r.id === id)?.emoji ?? "❔";
}

/** 6.9.7 (AU11) : comptoir d'échange réglable (registre « exchange ») : taux entre communes et rares, taxe versée au pot commun.
 *  6.14.106 (AU27, AE-L3, Q98) : `weeklyRareCap`, ressources rares reçues au comptoir par semaine (lundi 00 h UTC), toutes
 *  réunies, après taxe ; 0 = sans plafond. */
export const EXCHANGE_RULES = { commonToRare: 0.01, rareToCommon: 50, taxPct: 0.05, weeklyRareCap: 30_000_000 };

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
};

/** 6.14.106 : compteur hebdomadaire du comptoir (profil joueur, champ `exchangeWeek`). */
export interface ExchangeWeekState {
  /** Semaine (lundi 00 h UTC, AAAA-MM-JJ). */
  week: string;
  /** Ressources rares reçues au comptoir cette semaine (après taxe). */
  rares: number;
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
  player.exchangeWeek = { week: weekIdOf(now), rares: exchangeRareUsed(player, now) + Math.max(0, Math.floor(n)) };
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
  return 1;
}


/** Échange au comptoir : brut au taux, taxe (arrondie au supérieur), net reçu. */
export function tradeQuote(sellId: ResourceId, buyId: ResourceId, amount: number): { gross: number; tax: number; net: number } {
  const gross = Math.floor(Math.max(0, amount) * getTradeRate(sellId, buyId));
  const tax = gross > 0 ? Math.min(gross, Math.ceil(gross * EXCHANGE_RULES.taxPct)) : 0;
  return { gross, tax, net: gross - tax };
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
