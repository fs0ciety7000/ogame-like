/* =====================================================
   6.13.0 (proposals/lunes.md) : lunes.
   Un gros combat sur la planète mère d'un joueur peut faire naître une lune.
   Une lune par joueur, permanente ; elle donne un petit bonus défensif par la
   couche empire (plafonds compris). Invariant I21.
   ===================================================== */
import type { EffectGrant } from "@/game/effects";
import type { PlayerState } from "@/types/game";

/** Réglages (admin → Règles → Lunes). */
export const MOON_RULES = {
  enabled: true,
  /** Débris (ferraille + énergie) pour 1 % de chance. */
  debrisPerPercent: 100_000,
  /** Chance maximale d'un combat (fraction). */
  maxChance: 0.2,
  /** Bonus de bouclier planétaire (fraction, couche empire). */
  shieldBonus: 0.03,
  /** Bonus d'entrepôt à l'abri du pillage (fraction, couche empire). */
  protectedStorageBonus: 0.05,
  /** 6.14.0 (option C) : niveau maximal de la lune (1 = pas d'amélioration). */
  maxLevel: 5,
  /** Bouclier ajouté par niveau au-delà du premier (fraction). */
  shieldPerLevel: 0.02,
  /** Coût du passage au niveau 2 ; ×costGrowth à chaque niveau suivant. */
  upgradeCost: { scrap: 500_000, energy: 250_000 } as Record<string, number>,
  costGrowth: 2,
};

export interface MoonState {
  name: string;
  /** 6.14.0 : niveau (absent = 1). */
  level?: number;
  bornAtMs: number;
  /** Débris du combat qui l'a fait naître. */
  fromDebris: number;
}

/** Noms tirés au sort (affichés tels quels). */
export const MOON_NAMES = ["Séléné", "Phœbé", "Nyx", "Callisto", "Io", "Thalassa", "Mimas", "Ananké", "Kallichore", "Hélikè", "Méthone", "Pandore"];

/** Chance (0 à maxChance) qu'un combat laissant `debris` fasse naître une lune. */
export function moonChance(debris: number): number {
  if (!MOON_RULES.enabled) return 0;
  const per = Math.max(1, Number(MOON_RULES.debrisPerPercent) || 1);
  if (!(debris >= per)) return 0;
  const pct = Math.floor(debris / per) / 100;
  return Math.max(0, Math.min(Number(MOON_RULES.maxChance) || 0, pct));
}

/** Lune du joueur, ou null. */
export function playerMoon(player: Partial<Pick<PlayerState, "moon">> | null | undefined): MoonState | null {
  const m = player?.moon;
  return m && typeof m === "object" && m.bornAtMs > 0 ? m : null;
}

/** Tirage après un combat sur la planète mère d'un joueur (pas une colonie, pas un PNJ). Rend la lune née, ou null. */
export function rollMoon(
  defender: Partial<Pick<PlayerState, "moon" | "npc">>,
  debris: number,
  opts: { now: number; onColony: boolean; rand?: () => number },
): MoonState | null {
  if (opts.onColony || defender.npc || playerMoon(defender)) return null;
  const chance = moonChance(debris);
  if (chance <= 0) return null;
  const rand = opts.rand ?? Math.random;
  if (rand() >= chance) return null;
  const name = MOON_NAMES[Math.floor(rand() * MOON_NAMES.length) % MOON_NAMES.length];
  return { name, bornAtMs: opts.now, fromDebris: Math.floor(debris) };
}

/** Niveau de la lune (1 au moins, maxLevel au plus). */
export function moonLevel(m: Pick<MoonState, "level"> | null | undefined): number {
  const max = Math.max(1, Math.floor(Number(MOON_RULES.maxLevel) || 1));
  return Math.max(1, Math.min(max, Math.floor(Number(m?.level) || 1)));
}

/** Bouclier donné par la lune à son niveau. */
export function moonShield(m: Pick<MoonState, "level"> | null | undefined): number {
  return Math.max(0, MOON_RULES.shieldBonus + Math.max(0, MOON_RULES.shieldPerLevel) * (moonLevel(m) - 1));
}

/** Coût du passage du niveau `level` au suivant. */
export function moonUpgradeCost(level: number): Record<string, number> {
  const k = Math.pow(Math.max(1, Number(MOON_RULES.costGrowth) || 1), Math.max(0, Math.floor(level) - 1));
  return Object.fromEntries(Object.entries(MOON_RULES.upgradeCost ?? {}).map(([r, n]) => [r, Math.ceil((Number(n) || 0) * k)]));
}

/** Effets de la lune (couche empire). */
export function moonEffects(player: Partial<Pick<PlayerState, "moon">> | null | undefined): EffectGrant[] {
  const m = playerMoon(player);
  if (!m) return [];
  const source = { kind: "moon" as const, id: "moon", label: `Lune ${m.name}` };
  const out: EffectGrant[] = [];
  const shield = moonShield(m);
  if (shield > 0) out.push({ stat: "shield", value: shield, layer: "empire", source });
  if (MOON_RULES.protectedStorageBonus > 0) out.push({ stat: "protectedStorage", value: MOON_RULES.protectedStorageBonus, layer: "empire", source });
  return out;
}
