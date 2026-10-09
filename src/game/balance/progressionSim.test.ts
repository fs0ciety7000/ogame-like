import { beforeAll, describe, expect, it } from "vitest";
import { onboardingTotal, prestigeProjectsFromRules, PROGRESSION_PROFILES, scaleTier2Costs, simulateAllProfiles, simulateProgression, type ProgressionResult } from "@/game/balance/progressionSim";
import { applyGameContent } from "@/game/content";
import { RHYTHM_RULES } from "@/game/rhythm";
import { attackerWinThreshold, budgetDuel } from "@/game/balance/pvpBudget";
import { ASCENSION_RULES } from "@/game/ascension";
import { BUILDINGS } from "@/game/buildings";
import { STREAK_RULES } from "@/game/streak";

/* 6.14.71 (AU27, lot AE-L0) : garde de l'équilibre. Le simulateur de progression tourne sur les règles par défaut ;
   ses repères doivent rester dans les bornes ci-dessous. Un réglage qui les fait sortir change l'équilibre : il passe par
   une proposition (docs/proposals/equilibrage-au27.md) et ces bornes changent dans le même lot (invariant I29).

   Bornes actuelles = mesure de 6.14.72 (marge d'environ ±20 %), sur le jeu d'**avant la bascule du rythme** (contenu résolu
   sans heure : valeurs en vigueur jusqu'à `rhythm.switchAt`). Après la bascule (6.14.88, RL-3, AE-L2 compris), la garde à
   365 jours plus bas prend le relais. */
const ASCENSION_BOUNDS: Record<string, [number, number]> = {
  actif: [8, 13],
  moyen: [15, 23],
  occasionnel: [38, 56],
  quotidien: [26, 40],
};

let results: Record<string, ProgressionResult>;

beforeAll(() => {
  results = Object.fromEntries(simulateAllProfiles().map((r) => [r.profile, r]));
});

describe("AE-L0 : simulateur de progression", () => {
  it("est déterministe", () => {
    const a = simulateProgression(PROGRESSION_PROFILES.occasionnel, { days: 20 });
    const b = simulateProgression(PROGRESSION_PROFILES.occasionnel, { days: 20 });
    expect(b).toEqual(a);
    expect(a.snapshots.map((s) => s.day)).toEqual([1, 3, 7, 14]);
  });

  it("verse la prise en main à J0 (récompenses des étapes réunies)", () => {
    const total = onboardingTotal();
    expect(total.scrap).toBeGreaterThan(0);
    expect(total.reinforcedSteel).toBeGreaterThan(0);
  });

  it("1re Ascension dans les bornes de chaque profil (I29)", () => {
    for (const [id, [lo, hi]] of Object.entries(ASCENSION_BOUNDS)) {
      const day = results[id].ascensionDay;
      expect(day, id).not.toBeNull();
      expect(day!, id).toBeGreaterThanOrEqual(lo);
      expect(day!, id).toBeLessThanOrEqual(hi);
    }
    // Plus on joue, plus on avance.
    expect(results.actif.ascensionDay!).toBeLessThan(results.moyen.ascensionDay!);
    expect(results.moyen.ascensionDay!).toBeLessThan(results.occasionnel.ascensionDay!);
  });

  it("J1 reste rapide : extracteurs au moins niveau 6 pour l'actif, et aucune session sans action la première semaine", () => {
    const j1 = results.actif.snapshots.find((s) => s.day === 1)!;
    expect(Math.min(...j1.extractors)).toBeGreaterThanOrEqual(6);
    for (const r of Object.values(results)) expect(r.deadSessionsPct.early, r.profile).toBe(0);
  });

  it("AE-3 (6.14.72, 6.14.106) : le coffre du 7e jour vaut au plus 18 h de production et ne remplit pas l'entrepôt au-delà du plancher", () => {
    const chest = results.quotidien.firstChest!;
    expect(chest).not.toBeNull();
    // 6.14.106 (Q99) : indexé sur la production ([6, 18] h, 12 h en moyenne), dans la place libre de l'entrepôt.
    expect(STREAK_RULES.chest.commonHours).toEqual([6, 18]);
    expect(chest.hoursOfProduction).toBeLessThanOrEqual(STREAK_RULES.chest.commonHours[1]);
    expect(chest.common).toBeGreaterThanOrEqual(STREAK_RULES.chest.common[0] * 4);
    // Ancien coffre : 465 h de production et un stock 9 fois au-dessus de l'entrepôt.
    expect(chest.maxStockAfter).toBeLessThanOrEqual(chest.storageCap + STREAK_RULES.chest.common[0]);
    for (const r of [results.actif, results.moyen]) expect(r.firstChest!.hoursOfProduction, r.profile).toBeLessThanOrEqual(STREAK_RULES.chest.commonHours[1]);
    // L'occasionnel n'atteint jamais le 7e jour.
    expect(results.occasionnel.firstChest).toBeNull();
  });

  it("mesure la production perdue et l'origine des gains", () => {
    for (const r of Object.values(results)) {
      expect(r.lostPct).toBeGreaterThanOrEqual(0);
      expect(r.lostPct).toBeLessThanOrEqual(100);
      const total = Object.values(r.incomeShareFromJ14).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(99);
      expect(total).toBeLessThan(101);
    }
  });

  it("scaleTier2Costs multiplie le second palier puis le rend tel quel", () => {
    const b = BUILDINGS.find((x) => x.upgrade.tier2)!;
    const before = structuredClone(b.upgrade.tier2!);
    const restore = scaleTier2Costs(4);
    expect(b.upgrade.tier2!.baseCost.scrap).toBe((before.baseCost.scrap ?? 0) * 4);
    restore();
    expect(b.upgrade.tier2).toEqual(before);
  });
});

describe("AE-L0 : JcJ à budget égal", () => {
  it("AE-6 (6.14.72) : le défenseur mixte tient jusqu'à ×0,85 au moins de sa dépense, des défenses seules jusqu'à ×2", () => {
    expect(attackerWinThreshold("mixed")).toBeGreaterThanOrEqual(0.85);
    expect(attackerWinThreshold("defenses")).toBeGreaterThanOrEqual(2);
  });

  it("à dépense égale, l'attaquant paie plus cher qu'avant (pertes ≥ 30 %)", () => {
    const d = budgetDuel(1, "mixed");
    expect(d.attackerLoss).toBeGreaterThanOrEqual(0.3);
  });
});

/* Étude du rythme long terme (docs/proposals/rythme-long-terme.md) : options facultatives du simulateur. Éteintes par défaut :
   les repères ci-dessus (I29) ne bougent pas. */
describe("Rythme long terme : options du simulateur", () => {
  const actif = PROGRESSION_PROFILES.actif;

  it("ascend : Ascensions successives, délai respecté, au plus le maximum des règles ; « fini, sans suite » relevé", () => {
    const r = simulateProgression(actif, { days: 120, ascend: true, milestones: [30, 120] });
    expect(r.ascensionDays.length).toBeGreaterThanOrEqual(2);
    expect(r.ascensionDays.length).toBeLessThanOrEqual(ASCENSION_RULES.maxAscensions);
    for (let i = 1; i < r.ascensionDays.length; i++) expect(r.ascensionDays[i] - r.ascensionDays[i - 1]).toBeGreaterThanOrEqual(ASCENSION_RULES.cooldownDays - 0.01);
    // 6.14.106 : l'Ascension se fait à la session qui suit le jour où tout est au maximum (même jour ou le lendemain).
    // 6.14.159 (RD-1) : moins de 1,5 jour : avec la courbe du départ, les bâtiments de fin de partie (gardés à l'Ascension)
    // montent plus tôt, et un de leurs derniers niveaux (jusqu'à 27 h) peut être en cours ; l'Ascension attend la fin des
    // chantiers (`canAscend`), comme dans le jeu (mesure : 1,3 jour pour l'actif).
    expect(r.ascensionDay!).toBeLessThanOrEqual(r.ascensionDays[0]);
    expect(r.ascensionDays[0] - r.ascensionDay!).toBeLessThan(1.5);
    expect(r.snapshots.at(-1)!.ascensions).toBe(r.ascensionDays.length);
    // Règles par défaut : tout est fait avant J120, puis plus rien à lancer (constat de la proposition).
    expect(r.windows).toHaveLength(4);
    expect(r.windows.at(-1)!.finishedDays).toBeGreaterThan(0);
    for (const w of r.windows) {
      expect(w.lostPct).toBeGreaterThanOrEqual(0);
      expect(w.lostPct).toBeLessThanOrEqual(100);
      expect(w.daysWithoutSpend).toBeLessThanOrEqual(w.daysWithoutLaunch);
    }
  });

  it("projets de prestige : la production perdue baisse ; la flotte reste dans la place des hangars", () => {
    const base = simulateProgression(actif, { days: 90, ascend: true });
    const sink = simulateProgression(actif, { days: 90, ascend: true, fleetSink: { reserveShare: 0.6 }, prestigeProjects: { hours: 8, growth: 1, durationHours: 8, reserveShare: 0.1, minExtractorLevel: 10 } });
    expect(sink.lostPct).toBeLessThan(base.lostPct);
    const last = sink.snapshots.at(-1)!;
    expect(last.prestigeProjects).toBeGreaterThan(0);
    expect(last.fleetPlaces).toBeLessThanOrEqual(last.fleetCapacity);
  });

  it("modèles d'options : plafond de niveau par ère, recherche tardive plus longue", () => {
    const capped = simulateProgression(actif, { days: 14, levelCapByDay: (d) => 8 + Math.floor(d / 7), milestones: [7] });
    expect(Math.max(...capped.snapshots[0].extractors)).toBeLessThanOrEqual(9);
    const late = simulateProgression(actif, { days: 60, techLate: { fromLevel: 6, costFactor: 1, timeFactor: 30, maxSeconds: 7 * 86_400 } });
    expect(results.actif.techCompleteDay).not.toBeNull();
    expect(late.techCompleteDay ?? Infinity).toBeGreaterThan(results.actif.techCompleteDay!);
  });
});

/* 6.14.88 (RL-3, proposals/rythme-long-terme.md §4.1 et §6) : I29 étendu à 365 jours, sur les règles **après la bascule du
   rythme** (`applyGameContent({}, rhythm.switchAt)`), Ascensions dès que possible et projets de prestige des règles.
   Les bornes à 90 jours ci-dessus mesurent le jeu d'avant la bascule (contenu résolu sans heure), toujours en vigueur jusqu'à
   la date. Bornes de la 1re Ascension : bandes cibles de la proposition, le bas élargi de 10 % (le simulateur donne des ordres
   de grandeur). Sessions bloquées : ≤ 15 % chaque mois, **y compris** le mois qui suit la 1re Ascension : 6.14.89 (RL-5 avancé) a
   retiré l'exception (≤ 60 %) de 6.14.88 en réglant les valeurs de la bascule (second palier 36 h + 27 h, recherche tardive dès le
   niveau 7, ×25) : l'arbre de l'actif et du moyen se termine avant leur 1re Ascension (6.14.88 : 25,8 % actif, 50 % moyen ce mois-là). */
const LONG_ASCENSION_BOUNDS: Record<string, [number, number]> = {
  actif: [72, 110],
  moyen: [85, 125],
  quotidien: [99, 150],
  occasionnel: [117, 180],
};
const LONG_ASCENSIONS_YEAR1: Record<string, [number, number]> = { actif: [5, 6], moyen: [4, 5], quotidien: [3, 4], occasionnel: [3, 4] };

describe("RL-3 (6.14.88) : rythme sur des mois, 365 jours après la bascule (I29)", () => {
  let long: Record<string, ProgressionResult>;
  beforeAll(() => {
    applyGameContent({}, RHYTHM_RULES.switchAt);
    try {
      const projects = prestigeProjectsFromRules();
      long = Object.fromEntries(simulateAllProfiles({ days: 365, ascend: true, ...(projects ? { prestigeProjects: projects } : {}), milestones: [7, 30, 90, 365] }).map((r) => [r.profile, r]));
    } finally {
      applyGameContent({});
    }
  }, 180_000);

  it("1re Ascension vers 3 mois (actif) à 4-6 mois (occasionnel), une par saison au plus, 3 à 6 la 1re année", () => {
    for (const [id, [lo, hi]] of Object.entries(LONG_ASCENSION_BOUNDS)) {
      const r = long[id];
      expect(r.ascensionDay, id).not.toBeNull();
      expect(r.ascensionDay!, id).toBeGreaterThanOrEqual(lo);
      expect(r.ascensionDay!, id).toBeLessThanOrEqual(hi);
      const [min, max] = LONG_ASCENSIONS_YEAR1[id];
      expect(r.ascensionDays.length, id).toBeGreaterThanOrEqual(min);
      expect(r.ascensionDays.length, id).toBeLessThanOrEqual(max);
      for (let i = 1; i < r.ascensionDays.length; i++) expect(r.ascensionDays[i] - r.ascensionDays[i - 1], id).toBeGreaterThanOrEqual(30 - 0.01);
    }
    expect(long.actif.ascensionDay!).toBeLessThan(long.occasionnel.ascensionDay!);
  });

  it("aucun jour « fini, sans suite », production perdue ≤ 15 % sur l'année, au plus 3 jours sans dépense par mois (4 pour l'occasionnel)", () => {
    for (const r of Object.values(long)) {
      expect(r.windows.reduce((a, w) => a + w.finishedDays, 0), r.profile).toBe(0);
      expect(r.lostPct, r.profile).toBeLessThanOrEqual(15);
      for (const w of r.windows) expect(w.daysWithoutSpend, `${r.profile} J${w.fromDay}`).toBeLessThanOrEqual(r.profile === "occasionnel" ? 4 : 3);
    }
  });

  // 6.14.106 (AE-L3) : un mois par profil peut aller jusqu'à 20 % (bruit du modèle : ± 3 sessions sur un mois de l'occasionnel ou
  // du quotidien). Mesuré sur le quotidien, mois de sa 1re Ascension, selon les heures du coffre indexé : [3, 9] 6,7 %,
  // [6, 18] 16,7 %, [4, 12] 23,3 % ; coffre aux bornes fixes 13,3 %. Les autres mois restent ≤ 15 %.
  it("sessions bloquées ≤ 15 % chaque mois (un mois par profil ≤ 20 %), mois qui suit la 1re Ascension compris ; première semaine presque sans temps mort", () => {
    for (const r of Object.values(long)) {
      const over = r.windows.filter((w) => w.blockedPct > 15);
      expect(over.length, `${r.profile} : mois au-dessus de 15 %`).toBeLessThanOrEqual(1);
      for (const w of r.windows) expect(w.blockedPct, `${r.profile} J${w.fromDay}`).toBeLessThanOrEqual(20);
      // Cible : moins de 2 % de sessions sans action la première semaine (6.14.89 : 0 pour les 4 profils ; 1,8 % pour l'actif en 6.14.88).
      // 6.14.167 (S9, proposals/rythme-du-premier-jour.md §6) : l'actif au plus 2 sessions sur 56 (3,6 %) : avec la pente adoucie, il
      // atteint le second palier 7 h plus tôt (J3,5) et y attend la ferraille une session de plus ; ses mois bloqués baissent (2,9 → 0,8 %).
      expect(r.deadSessionsPct.early, r.profile).toBeLessThan(r.profile === "actif" ? 4 : 2);
    }
    const j1 = long.actif.snapshots.find((s) => s.day === 7)!;
    expect(Math.min(...j1.extractors)).toBeGreaterThanOrEqual(8);
  });
});
