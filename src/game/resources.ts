import type { ResourceId, Resources } from "@/types/game";

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

export function getTradeRate(sellId: ResourceId, buyId: ResourceId): number {
  const sell = RESOURCE_LIST.find((r) => r.id === sellId);
  const buy = RESOURCE_LIST.find((r) => r.id === buyId);
  if (!sell || !buy) return 1;
  if (sell.rarity === "common" && buy.rarity === "rare") return 0.01;
  if (sell.rarity === "rare" && buy.rarity === "common") return 50;
  return 1;
}

export function canAffordAll(resources: Resources, costs: Partial<Resources>): boolean {
  return Object.entries(costs).every(([res, val]) => (resources[res as ResourceId] ?? 0) >= (val ?? 0));
}

export function formatCost(cost: Partial<Resources>): string {
  return Object.entries(cost)
    .map(([res, val]) => `${val} ${RESOURCE_LABELS[res] ?? res}`)
    .join(", ");
}
