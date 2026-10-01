/** Champs du profil joueur que le moteur de jeu (flushState + actions)
 *  modifie et réécrit. Le pseudo, l'alliance et les champs JcJ écrits par
 *  le serveur (lastDefeatAtMs, lastAttackAtMs) en sont exclus : une action
 *  de jeu lue juste avant les écraserait sinon avec une valeur périmée. */
export const GAME_FIELDS = [
  "resources",
  "buildings",
  "units",
  "techLevels",
  "bonuses",
  "xp",
  "seasonId",
  "seasonXp",
  "victories",
  "defeats",
  "playtimeSeconds",
  "resourcesUpdatedAtMs",
  "resourceHistory",
  "unlockedAchievements",
  "contracts",
  "lastSeasonId",
  "lastSeasonXp",
  "titles",
  "activeTitle",
  "pirates",
  "stats",
  "onboarding",
  "posture",
  "ascensions",
  "ascendedAtMs",
] as const;

export const QUEUE_FIELDS = ["buildingUpgrades", "unitQueues", "activeResearches", "activeMissions"] as const;
