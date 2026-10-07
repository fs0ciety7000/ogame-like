import { GameActionError } from "@/game/errors";
import { MOON_RULES, moonLevel, moonUpgradeCost, playerMoon, type MoonState } from "@/game/moon";
import type { PlayerState, ResourceId } from "@/types/game";

/* 6.14.0 (proposals/lunes.md §8) : améliorer sa lune, achat immédiat en ressources de la planète mère. */

export function upgradeMoon(player: PlayerState): MoonState {
  const m = playerMoon(player);
  if (!m) throw new GameActionError("Tu n'as pas encore de lune.");
  const level = moonLevel(m);
  if (level >= Math.max(1, Math.floor(Number(MOON_RULES.maxLevel) || 1))) throw new GameActionError("Ta lune est au niveau maximal.");
  const cost = moonUpgradeCost(level);
  for (const [res, n] of Object.entries(cost)) {
    if ((player.resources[res as ResourceId] ?? 0) < n) throw new GameActionError("Ressources insuffisantes pour améliorer ta lune.");
  }
  for (const [res, n] of Object.entries(cost)) player.resources[res as ResourceId] = (player.resources[res as ResourceId] ?? 0) - n;
  const next: MoonState = { ...m, level: level + 1 };
  player.moon = next;
  return next;
}
