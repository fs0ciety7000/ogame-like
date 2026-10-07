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
};

export interface MoonState {
  name: string;
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

/** Effets de la lune (couche empire). */
export function moonEffects(player: Partial<Pick<PlayerState, "moon">> | null | undefined): EffectGrant[] {
  const m = playerMoon(player);
  if (!m) return [];
  const source = { kind: "moon" as const, id: "moon", label: `Lune ${m.name}` };
  const out: EffectGrant[] = [];
  if (MOON_RULES.shieldBonus > 0) out.push({ stat: "shield", value: MOON_RULES.shieldBonus, layer: "empire", source });
  if (MOON_RULES.protectedStorageBonus > 0) out.push({ stat: "protectedStorage", value: MOON_RULES.protectedStorageBonus, layer: "empire", source });
  return out;
}
