import type { ChronicleObjective } from "@/game/chronicles";
import { BASE_COUNTS } from "@/game/procedural";
import { normalizeTierReqs, PASS_POINTS, type PassRequirement } from "@/game/seasonPass";

/* =====================================================
   5.15.4 : simulateur de durée d'un passe de saison (administration).
   Jour après jour, un joueur type gagne des points (connexion, actions,
   Chroniques, boss de saison) et relève les défis des paliers, un palier à
   la fois (les actions ne comptent que pour le défi en cours, le compteur
   repart de zéro au palier suivant). Un palier est acquis quand les points
   ET son défi sont là. Résultat : le jour où chaque palier tombe, et ce qui
   freine (points ou défis).
===================================================== */

export interface PassSimProfile {
  id: string;
  label: string;
  /** Actions par semaine. */
  weekly: Partial<Record<ChronicleObjective, number>>;
  /** Jours de connexion par semaine (points de connexion). */
  loginDays: number;
  /** Épisodes des Chroniques terminés par semaine (4 par mois au plus). */
  chroniclesPerWeek: number;
  /** Participations au boss de saison par semaine. */
  seasonBossPerWeek: number;
  /** Objectifs du jour d'alliance atteints, par semaine (0 sans alliance). */
  allianceDailyPerWeek: number;
  /** Boss d'alliance abattus, par semaine. */
  allianceBossPerWeek: number;
}

/** Profils par défaut, autour des quantités de base des objectifs (≈ une semaine de jeu médiane). */
export function defaultSimProfiles(): PassSimProfile[] {
  const scale = (f: number) => Object.fromEntries(Object.entries(BASE_COUNTS).map(([k, v]) => [k, Math.round(v * f * 10) / 10])) as PassSimProfile["weekly"];
  return [
    { id: "casual", label: "Occasionnel", weekly: scale(0.5), loginDays: 4, chroniclesPerWeek: 0.5, seasonBossPerWeek: 0.5, allianceDailyPerWeek: 1, allianceBossPerWeek: 0.5 },
    { id: "median", label: "Médian", weekly: scale(1), loginDays: 6, chroniclesPerWeek: 1, seasonBossPerWeek: 1, allianceDailyPerWeek: 3, allianceBossPerWeek: 1 },
    { id: "active", label: "Assidu", weekly: scale(2), loginDays: 7, chroniclesPerWeek: 1, seasonBossPerWeek: 1, allianceDailyPerWeek: 6, allianceBossPerWeek: 1 },
  ];
}

/** Profil construit sur l'activité médiane réelle (actions par semaine du serveur). */
export function profileFromMedian(weeklyMedian: Partial<Record<ChronicleObjective, number>>): PassSimProfile {
  const base = defaultSimProfiles()[1];
  const weekly = { ...base.weekly };
  for (const [k, v] of Object.entries(weeklyMedian)) if ((v ?? 0) > 0) weekly[k as ChronicleObjective] = v;
  return { ...base, id: "server", label: "Médiane du serveur", weekly };
}

export interface PassSimSeason {
  pointsPerTier: number;
  tiers: unknown[];
  requirements?: Record<string, unknown>;
  /** « cumulative » : totaux du mois ; sinon un palier à la fois, compteur remis à zéro. */
  challengeMode?: "cumulative";
}

export interface PassSimResult {
  profile: PassSimProfile;
  pointsPerDay: number;
  /** Jour (1 = premier jour du mois) où chaque palier est acquis ; null au-delà de l'horizon. */
  tierDays: (number | null)[];
  /** Paliers acquis à la fin du mois (`monthDays`). */
  tiersInMonth: number;
  /** Jour du dernier palier (null : pas atteint dans l'horizon). */
  finishDay: number | null;
  /** Ce qui retient le plus souvent : les points ou les défis. */
  bottleneck: "points" | "challenges" | "none";
  /** Palier le plus long à relever (défi) et sa durée en jours. */
  slowestChallenge: { tier: number; days: number; reqs: PassRequirement[] } | null;
}

/** Points de passe par jour d'un profil (sans les défis). */
export function profilePointsPerDay(p: PassSimProfile): number {
  const perWeek =
    p.loginDays * PASS_POINTS.dailyLogin +
    (p.weekly.contract ?? 0) * PASS_POINTS.contract +
    (p.weekly.bounty ?? 0) * PASS_POINTS.bounty +
    (p.weekly.victory ?? 0) * PASS_POINTS.victory +
    (p.weekly.raidRepelled ?? 0) * PASS_POINTS.raidRepelled +
    (p.weekly.bossAssault ?? 0) * PASS_POINTS.bossAssault +
    Math.min(p.chroniclesPerWeek, 1) * PASS_POINTS.chronicle +
    p.seasonBossPerWeek * PASS_POINTS.seasonBoss +
    p.allianceDailyPerWeek * PASS_POINTS.allianceDaily +
    p.allianceBossPerWeek * PASS_POINTS.allianceBoss;
  return perWeek / 7;
}

export function simulatePass(season: PassSimSeason, profile: PassSimProfile, monthDays = 30, horizon = 90): PassSimResult {
  const tiers = season.tiers.length;
  const ppt = Math.max(1, season.pointsPerTier);
  const perDay = profilePointsPerDay(profile);
  const reqs = (t: number) => normalizeTierReqs(season.requirements?.[String(t)]);
  const tierDays: (number | null)[] = Array(tiers).fill(null);
  let points = 0;
  let active = 1; // palier dont le défi est en cours
  let counters: Record<string, number> = {};
  const monthTotals: Record<string, number> = {};
  const cumulative = season.challengeMode === "cumulative";
  let activeSince = 0;
  const clearedDay: number[] = [];
  let slowest: PassSimResult["slowestChallenge"] = null;
  let byPoints = 0;
  let byChallenge = 0;
  const skipEmpty = () => {
    while (active <= tiers && reqs(active).length === 0) {
      clearedDay[active] = clearedDay[active] ?? activeSince;
      active++;
    }
  };
  skipEmpty();
  for (let day = 1; day <= horizon; day++) {
    points += perDay;
    for (const [k, v] of Object.entries(profile.weekly)) monthTotals[k] = (monthTotals[k] ?? 0) + (v ?? 0) / 7;
    if (cumulative) {
      // Totaux du mois : plusieurs paliers peuvent tomber le même jour, toujours dans l'ordre.
      while (active <= tiers && reqs(active).every((r) => (monthTotals[r.key] ?? 0) + 1e-9 >= r.count)) {
        const days = day - activeSince;
        if (!slowest || days > slowest.days) slowest = { tier: active, days, reqs: reqs(active) };
        clearedDay[active] = day;
        active++;
        activeSince = day;
        skipEmpty();
      }
    } else if (active <= tiers) {
      for (const [k, v] of Object.entries(profile.weekly)) counters[k] = (counters[k] ?? 0) + (v ?? 0) / 7;
      // Plusieurs défis peuvent tomber le même jour : le surplus ne passe pas au suivant.
      const list = reqs(active);
      if (list.every((r) => (counters[r.key] ?? 0) + 1e-9 >= r.count)) {
        const days = day - activeSince;
        if (!slowest || days > slowest.days) slowest = { tier: active, days, reqs: list };
        clearedDay[active] = day;
        active++;
        counters = {};
        activeSince = day;
        skipEmpty();
      }
    }
    for (let t = 1; t <= tiers; t++) {
      if (tierDays[t - 1] !== null) continue;
      const pointsOk = points + 1e-9 >= t * ppt;
      const challengeOk = clearedDay[t] !== undefined;
      if (pointsOk && challengeOk) {
        tierDays[t - 1] = day;
        // Le dernier arrivé des deux est le frein de ce palier.
        const pointsDay = Math.ceil((t * ppt) / Math.max(1e-9, perDay));
        if ((clearedDay[t] ?? 0) > pointsDay) byChallenge++;
        else byPoints++;
      } else break;
    }
    if (tierDays[tiers - 1] !== null) break;
  }
  const finishDay = tierDays[tiers - 1];
  return {
    profile,
    pointsPerDay: Math.round(perDay * 10) / 10,
    tierDays,
    tiersInMonth: tierDays.filter((d) => d !== null && d <= monthDays).length,
    finishDay,
    bottleneck: byPoints + byChallenge === 0 ? "none" : byChallenge > byPoints ? "challenges" : "points",
    slowestChallenge: slowest,
  };
}

/** Verdict pour l'équipe : le joueur médian doit finir dans le mois, sans finir en une semaine. */
export function passDurationVerdict(median: PassSimResult, monthDays = 30): { tone: "mint" | "ember" | "danger"; text: string } {
  if (median.finishDay === null || median.finishDay > monthDays + 3)
    return { tone: "danger", text: `Trop long : le joueur médian n'atteint que le palier ${median.tiersInMonth} dans le mois.` };
  if (median.finishDay < monthDays * 0.6) return { tone: "ember", text: `Trop court : le joueur médian finit au jour ${median.finishDay}.` };
  return { tone: "mint", text: `Bien calibré : le joueur médian finit au jour ${median.finishDay}.` };
}
