import type { PlayerState } from "@/types/game";

/* =====================================================
   Statistiques cumulées du joueur (v2.3), écrites par le serveur.
   Elles alimentent les succès et ne comptent qu'à partir de leur
   introduction.
===================================================== */

export interface PlayerStats {
  /** 5.15.11 : catégories du Codex dont la récompense a été reçue. */
  codexClaimed?: string[];
  missions?: number;
  /** Plus grand nombre de missions terminées en une journée. */
  bestMissionDay?: number;
  missionDay?: string;
  missionDayCount?: number;
  loot?: number;
  spies?: number;
  recycled?: number;
  patrols?: number;
  garrisons?: number;
  contracts?: number;
  donated?: number;
  unitsBuilt?: number;
  /** v2.8 : ressources dépensées (bâtiments, recherches, unités). */
  spent?: number;
  /** v3.0 : échanges conclus au marché, et taxe payée (retirée du jeu). */
  marketTrades?: number;
  /** v5.1 : contrats livrés à temps (livreur). */
  contractsDelivered?: number;
  /** v5.1 : puissance ennemie détruite pendant la saison seasonPowerId (classement de guerre). */
  seasonPower?: number;
  seasonPowerId?: string;
  marketTax?: number;
  /** v3.8 : ressources reçues au marché (défis hebdomadaires). */
  marketVolume?: number;
  /** v3.1 : Léviathans abattus (participation), expéditions terminées. */
  leviathanKills?: number;
  expeditions?: number;
  /** 5.17 : expéditions terminées après au moins une étape profonde, et embuscades perdues en profondeur. */
  deepExpeditions?: number;
  deepAmbushLost?: number;
  traded?: number;
  /** v5.10 : cadeaux envoyés à d'autres joueurs. */
  giftsSent?: number;
  ultimatums?: number;
  /** Factions qui ont déjà adressé un ultimatum au joueur. */
  threatenedBy?: string[];
  /** v5.14 : boss mondiaux abattus (identifiants, une fois chacun). */
  worldBossKilled?: string[];
  /** Raids subis pendant qu'une flotte était en patrouille. */
  evasions?: number;
  /** Victoire dans l'heure suivant une défaite. */
  phoenix?: number;
  /** Recherche lancée entre 3 h et 5 h (heure de Paris). */
  nightResearch?: number;
  allianceFounded?: number;
  ascensions?: number;
  transports?: number;
  /** v3.7 : guerres d'alliance gagnées (fiche publique). */
  warsWon?: number;
  /** v3.9 : primes Kesh'Vaar remplies. */
  bounties?: number;
  lastResearchAtMs?: number;
  /** v4.9 : puissance ennemie détruite en combat, recherches lancées (objectifs d'alliance). */
  powerDestroyed?: number;
  researchStarted?: number;
  /** v4.5 : jours d'activité (AAAA-MM-JJ, heure de Paris), 60 derniers. */
  activeDays?: string[];
  /** v5.10 : instantané du début de semaine et résumé de la semaine écoulée. */
  weekStart?: import("@/game/weeklyRecap").WeeklySnapshot;
  lastWeek?: import("@/game/weeklyRecap").WeeklyRecap;
  /** 5.17.1 : registre de l'XP gagnée, par heure (index d'heure UTC) et par source, 8 jours glissants. */
  xpHours?: Record<string, Partial<Record<import("@/game/xpAudit").XpSource, number>>>;
  /** 5.18 : XP du jour par source (paliers journaliers). */
  xpDay?: import("@/game/xpTiers").XpDayState;
  /** 5.26.1 : unités sorties de l'Atelier, modules fabriqués, ventes aux enchères conclues et remportées. */
  unitsRepaired?: number;
  /** 5.26.2 : succès secrets dont l'indice a été acheté. */
  hintsBought?: string[];
  /** 5.26.3 : Ambre versée au pot commun (dons, taxe des enchères en Ambre) : badge « Mécène ». */
  amberDonated?: number;
  /** 5.26.2 : conversations privées archivées (joueur → date d'archivage). */
  archivedChats?: Record<string, number>;
  /** 5.26.1 : messages privés et du canal global envoyés, signalements résolus par l'équipe. */
  privateMessages?: number;
  globalMessages?: number;
  reportsResolved?: number;
  modulesBuilt?: number;
  auctionsSold?: number;
  auctionsWon?: number;
  /** 5.22 : vendettas gagnées par personnalité de seigneur (déblocage des unités d'élite). */
  vendettaWins?: Record<string, number>;
}

type CounterKey = { [K in keyof PlayerStats]-?: PlayerStats[K] extends number | undefined ? K : never }[keyof PlayerStats];

export function playerStats(player: Pick<PlayerState, "stats">): PlayerStats {
  return player.stats ?? {};
}

/** Ajoute `n` à un compteur. */
export function bumpStat(player: PlayerState, key: CounterKey, n = 1): void {
  if (!(n > 0)) return;
  player.stats = { ...(player.stats ?? {}), [key]: (player.stats?.[key] ?? 0) + n };
}

/** Fixe une valeur (drapeau ou date). */
export function setStat(player: PlayerState, key: CounterKey, value: number): void {
  player.stats = { ...(player.stats ?? {}), [key]: value };
}

export function recordThreat(player: PlayerState, factionId: string): void {
  const s = { ...(player.stats ?? {}) };
  s.ultimatums = (s.ultimatums ?? 0) + 1;
  s.threatenedBy = [...new Set([...(s.threatenedBy ?? []), factionId])];
  player.stats = s;
}

/** Mission terminée, avec le record de missions dans une même journée. */
export function recordMission(player: PlayerState, day: string): void {
  const s = { ...(player.stats ?? {}) };
  s.missions = (s.missions ?? 0) + 1;
  s.missionDayCount = s.missionDay === day ? (s.missionDayCount ?? 0) + 1 : 1;
  s.missionDay = day;
  s.bestMissionDay = Math.max(s.bestMissionDay ?? 0, s.missionDayCount);
  player.stats = s;
}

/** Heure de Paris (heure d'été du dernier dimanche de mars au dernier
 *  dimanche d'octobre, à 1 h UTC). Sans Intl : le moteur du serveur n'en a pas. */
export function parisHour(now: number): number {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const lastSunday = (month: number) => {
    const last = new Date(Date.UTC(y, month + 1, 0));
    return Date.UTC(y, month, last.getUTCDate() - last.getUTCDay(), 1);
  };
  const summer = now >= lastSunday(2) && now < lastSunday(9);
  return (d.getUTCHours() + (summer ? 2 : 1)) % 24;
}
