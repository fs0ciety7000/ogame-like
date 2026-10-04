import { addRelic, relicLabel, rollRelic, type RelicRarity, RARITIES } from "@/game/relics";
import { CAPSULE_TYPES, CAPSULES, SYNTH_RULES, synthesisState, type CapsuleType } from "@/game/synthesis";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.14 : tables de butin des combats. Chaque source de combat peut, EN
   PLUS de ses récompenses habituelles, laisser une relique et/ou une
   capsule de synthèse. Les chances se règlent dans l'administration
   (réglages des reliques). Le combat entre joueurs reste très avare.
===================================================== */

export type LootSource = "worldBoss" | "seasonBoss" | "allianceBoss" | "expedition" | "warlord" | "threat" | "pvp";

export interface LootTable {
  /** Chance de relique (0,25 = 25 %). */
  relicChance: number;
  /** Rareté minimale de la relique tirée. */
  relicMinRarity: RelicRarity;
  /** Chance de capsule de synthèse. */
  capsuleChance: number;
  /** Niveaux possibles de la capsule (bornes incluses, 1 à 10). */
  capsuleMin: number;
  capsuleMax: number;
  /** Boss : multiplicateur des chances pour les trois premiers en dégâts. */
  podiumMult: number;
}

export type LootTables = Record<LootSource, LootTable>;

export const LOOT_SOURCES: LootSource[] = ["worldBoss", "seasonBoss", "allianceBoss", "expedition", "warlord", "threat", "pvp"];

export const LOOT_SOURCE_LABELS: Record<LootSource, string> = {
  worldBoss: "Boss mondial",
  seasonBoss: "Boss de saison",
  allianceBoss: "Boss d'alliance",
  expedition: "Expédition",
  warlord: "Seigneur de guerre (vendetta, coalition)",
  threat: "Menaces (repaire pris, raid repoussé)",
  pvp: "Attaque gagnée contre un joueur",
};

export function defaultLootTables(): LootTables {
  return {
    worldBoss: { relicChance: 0.25, relicMinRarity: "rare", capsuleChance: 0.5, capsuleMin: 3, capsuleMax: 6, podiumMult: 1.6 },
    seasonBoss: { relicChance: 0.2, relicMinRarity: "rare", capsuleChance: 0.4, capsuleMin: 3, capsuleMax: 6, podiumMult: 1.5 },
    allianceBoss: { relicChance: 0.15, relicMinRarity: "common", capsuleChance: 0.35, capsuleMin: 2, capsuleMax: 5, podiumMult: 1.5 },
    expedition: { relicChance: 0.03, relicMinRarity: "common", capsuleChance: 0.08, capsuleMin: 1, capsuleMax: 4, podiumMult: 1 },
    warlord: { relicChance: 0.06, relicMinRarity: "common", capsuleChance: 0.15, capsuleMin: 2, capsuleMax: 5, podiumMult: 1 },
    threat: { relicChance: 0.04, relicMinRarity: "common", capsuleChance: 0.12, capsuleMin: 1, capsuleMax: 4, podiumMult: 1 },
    pvp: { relicChance: 0.01, relicMinRarity: "common", capsuleChance: 0.03, capsuleMin: 1, capsuleMax: 3, podiumMult: 1 },
  };
}

/** Tables en vigueur (remplacées par applyGameContent). */
export const LOOT_TABLES: LootTables = defaultLootTables();

export function setLootTables(tables: Partial<Record<LootSource, Partial<LootTable>>> | undefined): void {
  const d = defaultLootTables();
  for (const src of LOOT_SOURCES) LOOT_TABLES[src] = { ...d[src], ...(tables?.[src] ?? {}) };
}

export function validateLootTables(tables: Partial<Record<LootSource, Partial<LootTable>>> | undefined): string[] {
  const errors: string[] = [];
  for (const src of LOOT_SOURCES) {
    const t = tables?.[src];
    if (!t) continue;
    const label = `Butin, ${LOOT_SOURCE_LABELS[src].toLowerCase()}`;
    const pct = (v: unknown) => typeof v === "number" && v >= 0 && v <= 1;
    if (t.relicChance !== undefined && !pct(t.relicChance)) errors.push(`${label} : chance de relique entre 0 et 1.`);
    if (t.capsuleChance !== undefined && !pct(t.capsuleChance)) errors.push(`${label} : chance de capsule entre 0 et 1.`);
    if (t.relicMinRarity !== undefined && !RARITIES.some((r) => r.id === t.relicMinRarity && r.id !== "mythic")) errors.push(`${label} : rareté minimale inconnue.`);
    const min = t.capsuleMin ?? 1;
    const max = t.capsuleMax ?? 10;
    if (!(Number.isInteger(min) && Number.isInteger(max) && min >= 1 && max <= 10 && min <= max)) errors.push(`${label} : niveaux de capsule entiers, 1 ≤ min ≤ max ≤ 10.`);
    if (t.podiumMult !== undefined && !(t.podiumMult >= 1 && t.podiumMult <= 5)) errors.push(`${label} : bonus du podium entre 1 et 5.`);
  }
  return errors;
}

export interface LootDrop {
  /** Libellé de la relique gardée (« Soute pliée (rare) »). */
  relic?: string;
  capsule?: { type: CapsuleType; level: number; name: string };
}

/** Tirage du butin d'une source pour un joueur (modifie le joueur).
 *  `rank` : rang en dégâts sur un boss (0 = premier) ; le podium a plus de chances.
 *  Inventaire plein ou réserve de capsules pleine : rien de ce côté. */
export function rollLoot(player: PlayerState, source: LootSource, now: number, rank = -1, random: () => number = Math.random): LootDrop {
  const t = LOOT_TABLES[source];
  if (!t) return {};
  const mult = rank >= 0 && rank < 3 ? Math.max(1, t.podiumMult) : 1;
  const drop: LootDrop = {};
  if (random() < Math.min(1, t.relicChance * mult)) {
    const item = rollRelic(`loot:${source}`, now, random, t.relicMinRarity);
    if (addRelic(player, item)) drop.relic = relicLabel(item);
  }
  if (random() < Math.min(1, t.capsuleChance * mult)) {
    const st = synthesisState(player);
    const free = CAPSULE_TYPES.filter((c) => st.stock[c].length < SYNTH_RULES.maxStock);
    if (free.length > 0) {
      const type = free[Math.floor(random() * free.length) % free.length];
      const lo = Math.max(1, Math.min(10, Math.floor(t.capsuleMin)));
      const hi = Math.max(lo, Math.min(10, Math.floor(t.capsuleMax)));
      const level = lo + (Math.floor(random() * (hi - lo + 1)) % (hi - lo + 1));
      st.stock[type] = [...st.stock[type], level];
      player.synthesis = st as PlayerState["synthesis"];
      drop.capsule = { type, level, name: CAPSULES[type].name };
    }
  }
  return drop;
}

/** « Relique : X. Capsule : Y niv. N. » (vide sans butin). */
export function describeLoot(drop: LootDrop | null | undefined): string {
  if (!drop) return "";
  const parts: string[] = [];
  if (drop.relic) parts.push(`Relique : ${drop.relic}`);
  if (drop.capsule) parts.push(`Capsule : ${drop.capsule.name} niv. ${drop.capsule.level}`);
  return parts.length ? ` Butin : ${parts.join(", ")}.` : "";
}
