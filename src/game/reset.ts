import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { currentSeasonId } from "@/game/seasons";
import type { NewNotification } from "@/game/flush";
import type { PlayerState, QueuesState, ResourceId, Resources } from "@/types/game";

/* =====================================================
   Hard reset (administration) : la progression d'un joueur, ou de toute la
   galaxie, repart de zéro. Comptes, pseudos et alliances sont conservés ; le
   reste dépend des options cochées. Un kit de départ est offert.
===================================================== */

export interface ResetOptions {
  /** XP totale et de saison. */
  xp: boolean;
  /** Succès débloqués. */
  achievements: boolean;
  /** Rapports de combat et d'espionnage, notifications. */
  reports: boolean;
  /** Trésor, recherches et journal des alliances (reset global). */
  alliances: boolean;
  /** Titres gagnés et palmarès des saisons. */
  titles: boolean;
  /** Ressources offertes en plus des ressources de départ. */
  starterKit: Partial<Record<ResourceId, number>>;
}

export const DEFAULT_RESET_OPTIONS: ResetOptions = {
  xp: true,
  achievements: true,
  reports: true,
  alliances: true,
  titles: false,
  starterKit: {
    scrap: 5000,
    energy: 3000,
    nano: 2000,
    data: 1000,
    reinforcedSteel: 50,
    cyberModule: 50,
    syntheticNanites: 50,
    aiFragment: 50,
  },
};

/** Options venues du navigateur, nettoyées (valeurs par défaut si absentes). */
export function parseResetOptions(raw: unknown): ResetOptions {
  const r = (raw ?? {}) as Partial<Record<keyof ResetOptions, unknown>>;
  const bool = (k: keyof Omit<ResetOptions, "starterKit">) => (typeof r[k] === "boolean" ? (r[k] as boolean) : DEFAULT_RESET_OPTIONS[k]);
  const kit: Partial<Record<ResourceId, number>> = {};
  const rawKit = (r.starterKit ?? DEFAULT_RESET_OPTIONS.starterKit) as Record<string, unknown>;
  for (const res of Object.keys(DEFAULT_RESET_OPTIONS.starterKit) as ResourceId[]) {
    const n = Math.floor(Number(rawKit[res]));
    if (Number.isFinite(n) && n > 0) kit[res] = Math.min(n, 1_000_000_000);
  }
  return { xp: bool("xp"), achievements: bool("achievements"), reports: bool("reports"), alliances: bool("alliances"), titles: bool("titles"), starterKit: kit };
}

/** Nouvel état d'un joueur après le reset. */
export function resetPlayerState(player: PlayerState, options: ResetOptions, now: number): { player: PlayerState; queues: QueuesState; notifications: NewNotification[] } {
  const fresh = defaultPlayerState(player.uid, player.pseudo);
  const resources = { ...fresh.resources } as Resources;
  for (const [res, amount] of Object.entries(options.starterKit) as [ResourceId, number][]) resources[res] = (resources[res] ?? 0) + amount;
  const next: PlayerState = {
    ...fresh,
    uid: player.uid,
    pseudo: player.pseudo,
    resources,
    resourcesUpdatedAtMs: now,
    resourceHistory: [],
    playtimeSeconds: player.playtimeSeconds ?? 0,
    xp: options.xp ? 0 : player.xp ?? 0,
    seasonId: currentSeasonId(now),
    seasonXp: options.xp ? 0 : player.seasonId === currentSeasonId(now) ? player.seasonXp ?? 0 : 0,
    lastSeasonId: options.xp ? "" : player.lastSeasonId,
    lastSeasonXp: options.xp ? 0 : player.lastSeasonXp,
    unlockedAchievements: options.achievements ? [] : player.unlockedAchievements ?? [],
    titles: options.titles ? [] : player.titles ?? [],
    activeTitle: options.titles ? "" : player.activeTitle ?? "",
    contracts: undefined,
    victories: 0,
    defeats: 0,
    // Protection débutant offerte à nouveau : personne n'est pillé dès la reprise.
    createdAtMs: now,
    lastAttackAtMs: 0,
    lastDefeatAtMs: 0,
  };
  return {
    player: next,
    queues: defaultQueues(),
    notifications: [
      {
        kind: "system",
        title: "Nouvelle ère : la galaxie repart de zéro",
        message: "Ta progression a été remise à zéro par l'administration. Un kit de départ t'attend dans tes ressources, et ta protection débutant est rétablie.",
        createdAtMs: now,
        read: false,
      },
    ],
  };
}
