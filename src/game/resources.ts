import type { ResourceId, Resources } from "@/types/game";
import { formatDecimal, formatInt } from "@/game/format";

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

/** 6.9.7 (AU11) : comptoir d'échange réglable (registre « exchange ») : taux entre communes et rares, taxe versée au pot commun. */
export const EXCHANGE_RULES = { commonToRare: 0.01, rareToCommon: 50, taxPct: 0.05 };

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
