import { pendingClaims } from "@/game/claimAll";
import { contractDay } from "@/game/contracts";
import { dailyMissions } from "@/game/dailyMissions";
import { streakState, streakStatus } from "@/game/streak";
import { bountyState } from "@/game/bounties";
import { activePass, passState, passTier } from "@/game/seasonPass";
import { chronicleOf, chronicleState, unlockedEpisodes } from "@/game/chronicles";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.30 : Ordres du jour (docs/proposals/journal-de-bord.md, option 1).
   Une liste de contrôle des corvées quotidiennes, lue dans l'état du
   joueur. Aucune règle ni récompense ne change : chaque ligne renvoie
   vers l'écran qui agit, et « Tout réclamer » passe par pendingClaims.
===================================================== */

/** ready : une récompense attend ; todo : il reste à faire ; done : fait pour aujourd'hui (ou la période). */
export type OrderState = "ready" | "todo" | "done";

export interface DailyOrder {
  id: "streak" | "daily" | "contracts" | "bounties" | "expedition" | "alliance" | "pass" | "chronicles";
  label: string;
  /** Rythme affiché : jour, tableau de 8 h, mois. */
  period: "jour" | "8 h" | "mois";
  state: OrderState;
  /** Progression lisible (« 2 / 3 »), ou null. */
  value: string | null;
  /** Une phrase : ce qui attend, ou ce qui reste. */
  detail: string;
  link: string;
  /** Récompenses prêtes sur cette ligne (pastille). */
  ready: number;
}

export interface OrdersContext {
  /** Une expédition est en vol (flottes du joueur). */
  expeditionActive?: boolean;
}

/** Ordres du jour, dans l'ordre de la journée. Lecture seule. */
export function dailyOrders(player: PlayerState, now: number, ctx: OrdersContext = {}): DailyOrder[] {
  const claims = pendingClaims(player, now);
  const count = (type: string) => claims.filter((c) => c.type === type).length;
  const out: DailyOrder[] = [];

  const streak = streakStatus(player, now);
  out.push({
    id: "streak",
    label: "Série de connexion",
    period: "jour",
    state: streak.claimed ? "done" : "ready",
    value: `J${streak.claimed ? streak.current : streak.next}`,
    detail: streak.claimed ? `Récupérée. Meilleure série : ${streakState(player).best} jours.` : `La récompense du jour ${streak.next} t'attend.`,
    link: "/game/ordres",
    ready: streak.claimed ? 0 : 1,
  });

  const dm = dailyMissions(player, now);
  const dmReady = count("dailyClaim");
  const dmClaimed = dm.tasks.filter((t) => t.claimed).length;
  // 6.2 (lot N) : plus de missions du jour (fusionnées dans les objectifs).
  if (dm.tasks.length > 0) out.push({
    id: "daily",
    label: "Missions du jour",
    period: "jour",
    state: dmReady > 0 ? "ready" : dmClaimed >= dm.tasks.length ? "done" : "todo",
    value: `${dmClaimed} / ${dm.tasks.length}`,
    detail: dmReady > 0 ? `${dmReady} récompense${dmReady > 1 ? "s" : ""} à récupérer.` : dm.tasks.filter((t) => !t.done).map((t) => `${t.label} (${t.progress} / ${t.count})`).join(" · ") || "Toutes récupérées.",
    link: "/game/ordres#missions",
    ready: dmReady,
  });

  const items = player.contracts?.day === contractDay(now) ? player.contracts.items : [];
  const cReady = count("claimContract");
  const cClaimed = items.filter((c) => c.claimed).length;
  out.push({
    id: "contracts",
    label: "Objectifs du jour",
    period: "jour",
    state: cReady > 0 ? "ready" : items.length > 0 && cClaimed >= items.length ? "done" : "todo",
    value: items.length ? `${cClaimed} / ${items.length}` : null,
    detail: cReady > 0 ? `${cReady} objectif${cReady > 1 ? "s" : ""} rempli${cReady > 1 ? "s" : ""}.` : items.length ? "Remplis-les en jouant : ressources rares, XP et jetons." : "Ils arrivent à ta prochaine action.",
    link: "/game/ordres#contrats",
    ready: cReady,
  });

  const board = bountyState(player).board ?? [];
  const hunting = board.filter((b) => b.status === "hunting").length;
  const open = board.filter((b) => b.status === "open").length;
  out.push({
    id: "bounties",
    label: "Primes Kesh'Vaar",
    period: "8 h",
    // Tableau jamais ouvert (vide) : il se remplit à la première visite.
    state: open > 0 || board.length === 0 ? "todo" : "done",
    value: board.length ? `${board.length - open} / ${board.length}` : null,
    detail: hunting > 0 ? `${hunting} chasse${hunting > 1 ? "s" : ""} en cours, ${open} à lancer.` : open > 0 ? `${open} contrat${open > 1 ? "s" : ""} à lancer.` : board.length === 0 ? "Ouvre le tableau : 4 contrats toutes les 8 h." : "Tableau vidé : le suivant arrive dans 8 h au plus.",
    link: "/game/primes",
    ready: 0,
  });

  out.push({
    id: "expedition",
    label: "Expéditions",
    period: "jour",
    state: ctx.expeditionActive ? "done" : "todo",
    value: null,
    detail: ctx.expeditionActive ? "Une expédition est en vol." : "Jusqu'à 3 par jour, une à la fois.",
    link: "/game/missions",
    ready: 0,
  });

  if (player.allianceId) {
    out.push({
      id: "alliance",
      label: "Objectif d'alliance",
      period: "jour",
      state: "todo",
      value: null,
      detail: "Vote jusqu'à 10 h (officiers), puis contribue à l'objectif choisi.",
      link: "/game/alliance",
      ready: 0,
    });
  }

  const ps = passState(player, now);
  const pass = activePass(ps.seasonId);
  const tier = passTier(ps.points, ps.seasonId);
  const pReady = count("passClaim");
  out.push({
    id: "pass",
    label: "Passe",
    period: "mois",
    state: pReady > 0 ? "ready" : tier >= pass.tiers.length ? "done" : "todo",
    value: `${tier} / ${pass.tiers.length}`,
    detail: pReady > 0 ? `${pReady} palier${pReady > 1 ? "s" : ""} à réclamer.` : "Chaque mission et chaque contrat font avancer le passe.",
    link: "/game/passe",
    ready: pReady,
  });

  const month = chronicleOf(now);
  if (month) {
    const cs = chronicleState(player, now);
    const opened = unlockedEpisodes(now);
    const chReady = count("chronicleClaim");
    out.push({
      id: "chronicles",
      label: "Chroniques",
      period: "mois",
      state: chReady > 0 ? "ready" : cs.claimed.length >= month.episodes.length ? "done" : "todo",
      value: `${cs.claimed.length} / ${month.episodes.length}`,
      detail: chReady > 0 ? `${chReady} épisode${chReady > 1 ? "s" : ""} à valider.` : `${opened} épisode${opened > 1 ? "s" : ""} ouvert${opened > 1 ? "s" : ""} ce mois-ci.`,
      link: "/game/chroniques",
      ready: chReady,
    });
  }
  return out;
}

/** Pastille unique de la barre latérale : toutes les récompenses que « Tout réclamer » peut prendre. */
export function ordersReadyCount(player: PlayerState, now: number): number {
  return pendingClaims(player, now).length;
}
