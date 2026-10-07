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
  /** 6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md §5.2, Q36) : pitié lunaire. Chaque combat subi sur la planète mère
   *  sans lune ajoute cette part à la réserve (`moonPity`), en plus du tirage : lune garantie au 20e combat à 0,05.
   *  0 = pas de pitié (la réserve reste en base, sans effet). */
  pityPerDefense: 0.05,
};

export interface MoonState {
  name: string;
  /** 6.14.0 : niveau (absent = 1). */
  level?: number;
  bornAtMs: number;
  /** Débris du combat qui l'a fait naître. */
  fromDebris: number;
  /** 6.14.44 : prochaine phalange (balayage de l'agresseur) possible ; absent = prête. */
  scanReadyAtMs?: number;
  /** 6.14.44 : prochain saut de la porte possible ; absent = prête. */
  gateReadyAtMs?: number;
  /** 6.14.48 : dernier saut de la porte (succès « Retour fracassant », compteur `gateSaves`) ; absent ou 0 = aucun à compter. */
  lastJumpAtMs?: number;
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

/** 6.14.44 : réserve de pitié du joueur (0 à 1). Sans effet si la lune est désactivée ou si `pityPerDefense` vaut 0. */
export function moonPity(player: Partial<Pick<PlayerState, "moonPity">> | null | undefined): number {
  if (!MOON_RULES.enabled || !(Number(MOON_RULES.pityPerDefense) > 0)) return 0;
  return Math.max(0, Math.min(1, Number(player?.moonPity) || 0));
}

/** 6.14.44 : un combat subi sur la planète mère sans lune remplit la réserve (avant le tirage, I21). Rend la nouvelle réserve. */
export function addMoonPity(defender: Partial<Pick<PlayerState, "moon" | "npc" | "moonPity">>, opts: { onColony: boolean }): number {
  const per = Math.max(0, Number(MOON_RULES.pityPerDefense) || 0);
  if (!MOON_RULES.enabled || !(per > 0) || opts.onColony || defender.npc || playerMoon(defender)) return moonPity(defender);
  // Arrondi au millionième : 20 × 0,05 vaut exactement 1 (garantie au 20e combat).
  const next = Math.min(1, Math.round((Math.max(0, Number(defender.moonPity) || 0) + per) * 1e6) / 1e6);
  defender.moonPity = next;
  return next;
}

/** Chance totale d'un combat : tirage des débris et réserve de pitié, 100 % au plus. */
export function moonBirthChance(defender: Partial<Pick<PlayerState, "moonPity">>, debris: number): number {
  return Math.min(1, moonChance(debris) + moonPity(defender));
}

/** Tirage après un combat sur la planète mère d'un joueur (pas une colonie, pas un PNJ). Rend la lune née, ou null.
 *  6.14.44 : la réserve de pitié (`moonPity`) s'ajoute à la chance des débris. */
export function rollMoon(
  defender: Partial<Pick<PlayerState, "moon" | "npc" | "moonPity">>,
  debris: number,
  opts: { now: number; onColony: boolean; rand?: () => number },
): MoonState | null {
  if (opts.onColony || defender.npc || playerMoon(defender)) return null;
  const chance = moonBirthChance(defender, debris);
  if (chance <= 0) return null;
  const rand = opts.rand ?? Math.random;
  if (rand() >= chance) return null;
  const name = MOON_NAMES[Math.floor(rand() * MOON_NAMES.length) % MOON_NAMES.length];
  return { name, bornAtMs: opts.now, fromDebris: Math.floor(debris) };
}

/** 6.14.44 : texte joueur de la réserve (chance au prochain combat subi, pitié comprise). */
export function moonPityText(player: Partial<Pick<PlayerState, "moonPity">>): string | null {
  const per = Math.max(0, Number(MOON_RULES.pityPerDefense) || 0);
  if (!MOON_RULES.enabled || !(per > 0)) return null;
  const next = Math.min(1, moonPity(player) + per);
  return `Les débris s'accumulent en orbite : ${Math.round(next * 100)} % de chance de lune au prochain combat.`;
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
