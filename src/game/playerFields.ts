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
  "lastActiveMs",
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
  "colonies",
  "colonizing",
  "bounties",
  "commanders",
  "relics",
  "modules",
  "empireClass",
  "moon",
  "moonPity",
  "synthesis",
  "profileStyle",
  "renamed",
  "streak",
  "seasonPass",
  "referral",
  "vacation",
  "chronicle",
  "announcementsSeen",
  "talents",
  "casino",
  "workshop",
  // 6.14.85 (RL-2) : projets de prestige.
  "prestige",
  // 6.14.106 (AE-L3) : compteur hebdomadaire du comptoir.
  "exchangeWeek",
  // 6.14.142 (PB-L1) : choix des paliers de bâtiments ; 6.14.143 (PB-L2) : tampon de l'entrepôt.
  "buildingChoices",
  "storageBuffer",
  // 6.14.165 (S6, NJ-25) : réserve du départ (récompenses en heures retenues pour un compte jeune).
  "startReserve",
] as const;

export const QUEUE_FIELDS = ["buildingUpgrades", "unitQueues", "activeResearches", "activeMissions", "buildPlan"] as const;
