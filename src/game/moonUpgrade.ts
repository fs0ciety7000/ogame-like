import { GameActionError } from "@/game/errors";
import { spendResources } from "@/game/spending";
import { MOON_RULES, moonLevel, moonUpgradeCost, playerMoon, type MoonState } from "@/game/moon";
import type { PlayerState } from "@/types/game";

/* 6.14.0 (proposals/lunes.md §8) : améliorer sa lune, achat immédiat en ressources de la planète mère. */

export function upgradeMoon(player: PlayerState, now: number = Date.now()): MoonState {
  const m = playerMoon(player);
  if (!m) throw new GameActionError("Tu n'as pas encore de lune.");
  const level = moonLevel(m);
  if (level >= Math.max(1, Math.floor(Number(MOON_RULES.maxLevel) || 1))) throw new GameActionError("Ta lune est au niveau maximal.");
  const cost = moonUpgradeCost(level);
  // 6.14.110 (AC-5) : dépense comptée.
  spendResources(player, cost, now, { message: "Ressources insuffisantes pour améliorer ta lune." });
  const next: MoonState = { ...m, level: level + 1 };
  player.moon = next;
  return next;
}
