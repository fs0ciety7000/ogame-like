import { bountyState } from "@/game/bounties";
import { homeLevels, COLONY_ROUTE_RULES, COLONY_RULES } from "@/game/colonies";
import { ASCENSION_RULES } from "@/game/ascension";
import { CONTRACT_RULES } from "@/game/contracts";
import { formatPct } from "@/game/format";
import { JUMP_GATE_RULES } from "@/game/jumpGate";
import { commandersState } from "@/game/commanders";
import { GameActionError } from "@/game/errors";
import { onboardingEligible, onboardingState } from "@/game/onboarding";
import { equippedRelics, relicsState } from "@/game/relics";
import { playerMoon } from "@/game/moon";
import { playerStats } from "@/game/stats";
import { TALENT_RULES, talentPoints } from "@/game/talents";
import type { PlayerState, ResourceId } from "@/types/game";
import { noteAmber } from "@/game/healthTrace";

/* =====================================================
   v5.11 : tutoriel avancé, le « Carnet du commandant ». Après la prise en
   main, trois chapitres expliquent les systèmes de milieu et de fin de
   partie (colonies, reliques et commandants, Ascension), un objectif
   concret à la fois, chacun récompensé une seule fois. La progression est
   rangée avec celle de la prise en main (`onboarding.advanced`).
===================================================== */

export type GuideChapterId = "empire" | "colonies" | "relics" | "ascension" | "moon";

export interface GuideStep {
  id: string;
  chapter: GuideChapterId;
  label: string;
  /** Ce qu'il faut comprendre, en deux phrases au plus. */
  learn: string;
  to: string;
  reward: Partial<Record<ResourceId, number>>;
  amber?: number;
  done: (p: PlayerState) => boolean;
}

export const GUIDE_CHAPTERS: { id: GuideChapterId; label: string; emoji: string }[] = [
  // 6.4.1 (lot T) : les systèmes de l'hiver 2026 (objectifs du jour, classes, routes) entrent dans le carnet.
  { id: "empire", label: "Ton empire", emoji: "🏛️" },
  { id: "colonies", label: "Colonies", emoji: "🪐" },
  { id: "relics", label: "Reliques et commandants", emoji: "💠" },
  { id: "ascension", label: "Ascension", emoji: "✨" },
  // 6.14.69 (É30-1d) : la lune, sa phalange et sa porte de saut (dernier chapitre : il ne bloque aucune autre étape).
  { id: "moon", label: "Ta lune", emoji: "🌙" },
];

const colonies = (p: PlayerState) => p.colonies ?? [];

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "dailyGoal",
    chapter: "empire",
    label: "Réclamer un objectif du jour",
    // 6.14.105 (AA4) : textes de règle lus à l'usage (accesseur), jamais au chargement du module.
    get learn() {
      const n = CONTRACT_RULES.perDay;
      return `Chaque jour, ${n} objectifs tirés pour toi : ressources rares, XP et jetons. Ils se renouvellent à minuit, heure de Paris, et ta série grimpe si tu fais les ${n}.`;
    },
    to: "/game/ordres",
    reward: { scrap: 300_000, energy: 300_000 },
    done: (p) => (p.contracts?.items ?? []).some((c) => c.claimed) || !!p.contracts?.lastCompletedDay,
  },
  {
    id: "empireClass",
    chapter: "empire",
    label: "Choisir une classe d'empire",
    learn: "Industriel, Seigneur de guerre ou Explorateur : chaque classe renforce une façon de jouer. Le premier choix est gratuit, en changer coûte de l'Ambre.",
    to: "/game/classe",
    reward: {},
    amber: 10,
    done: (p) => !!p.empireClass?.id,
  },
  {
    id: "colonyReady",
    chapter: "colonies",
    // 6.14.103 : accesseur, lu à l'usage (import circulaire : COLONY_RULES pas encore initialisé si `content` est chargé en premier).
    get label() {
      return `Cumuler ${COLONY_RULES.levelsRequired[0]} niveaux de bâtiments`;
    },
    learn: "Une colonie se mérite : il faut une planète mère développée. Chaque niveau de bâtiment compte, fin de partie comprise.",
    to: "/game/batiments",
    reward: { scrap: 2_000_000, energy: 2_000_000 },
    done: (p) => homeLevels(p) >= COLONY_RULES.levelsRequired[0],
  },
  {
    id: "colonyFound",
    chapter: "colonies",
    label: "Fonder une colonie",
    get learn() {
      return `Une colonie a son propre stock, ses bâtiments et ses défenses, et produit ${formatPct(COLONY_RULES.productionBonus)} de plus que la planète mère. Ses ressources reviennent par transport.`;
    },
    to: "/game/colonies",
    reward: { reinforcedSteel: 200_000, cyberModule: 200_000 },
    done: (p) => colonies(p).length >= 1,
  },
  {
    id: "colonySpec",
    chapter: "colonies",
    label: "Spécialiser une colonie",
    learn: "Forge, Comptoir minier, Bastion ou Dépôt : chaque spécialisation a un bonus et une contrepartie. Le premier choix est libre, puis un changement par semaine.",
    to: "/game/colonies",
    reward: { syntheticNanites: 200_000, aiFragment: 200_000 },
    done: (p) => colonies(p).some((c) => !!c.spec),
  },
  {
    id: "colonyRoute",
    chapter: "colonies",
    label: "Ouvrir une route logistique",
    get learn() {
      return `Une route fait voyager les ressources sans flotte : rapatrier le stock de la colonie, ou la ravitailler depuis ta planète mère. ${formatPct(COLONY_ROUTE_RULES.feePct)} se perdent en route.`;
    },
    to: "/game/colonies",
    reward: { reinforcedSteel: 200_000, cyberModule: 200_000 },
    done: (p) => colonies(p).some((c) => !!c.route),
  },
  {
    id: "relicFound",
    chapter: "relics",
    label: "Obtenir une relique",
    learn: "Les reliques tombent des expéditions longues, des boss et des primes. Plus l'expédition est longue, plus la chance est grande.",
    to: "/game/missions",
    reward: { scrap: 500_000, energy: 500_000 },
    done: (p) => relicsState(p).items.length >= 1,
  },
  {
    id: "relicEquip",
    chapter: "relics",
    label: "Équiper une relique",
    learn: "Une relique ne compte que si elle est équipée. Trois reliques identiques se fusionnent en une rareté supérieure.",
    to: "/game/etat-major",
    reward: {},
    amber: 10,
    done: (p) => equippedRelics(p).length >= 1,
  },
  {
    id: "commander",
    chapter: "relics",
    label: "Mettre un commandant en poste",
    learn: "Chaque commandant donne un bonus (production, combat, construction…) et progresse avec l'usage. Seuls les commandants en poste agissent.",
    to: "/game/etat-major",
    reward: { nano: 1_000_000, data: 1_000_000 },
    done: (p) => commandersState(p).active.length >= 1,
  },
  {
    id: "ascend",
    chapter: "ascension",
    label: "Réaliser une Ascension",
    get learn() {
      const pts = TALENT_RULES.pointsPerAscension;
      return `Tous les bâtiments au maximum : l'Ascension les remet au niveau 1 contre +${formatPct(ASCENSION_RULES.productionPerAscension)} de production et −${formatPct(ASCENSION_RULES.buildTimePerAscension)} de temps de construction, pour toujours, et ${pts} point${pts > 1 ? "s" : ""} de talent.`;
    },
    to: "/game/profil",
    reward: {},
    amber: 25,
    done: (p) => (p.ascensions ?? 0) >= 1,
  },
  {
    id: "talent",
    chapter: "ascension",
    label: "Apprendre un talent",
    learn: "Chaque Ascension donne un point de talent à placer dans l'arbre. On peut redistribuer, mais pas trop souvent.",
    to: "/game/profil",
    reward: { reinforcedSteel: 500_000, cyberModule: 500_000, syntheticNanites: 500_000, aiFragment: 500_000 },
    done: (p) => talentPoints(p).spent >= 1,
  },
  {
    // 6.14.69 (É30-1d) : faisable sans lune (une garnison chez un allié, ou un combat subi qui remplit la réserve de pitié).
    id: "moonWatch",
    chapter: "moon",
    label: "Ta lune veille",
    get learn() {
      return `Un gros combat chez toi peut faire naître une lune. Sa phalange signale les attaques sur tes alliés proches ; au niveau ${JUMP_GATE_RULES.minMoonLevel}, sa porte de saut ramène une flotte d'un coup. Sans lune, envoie une garnison à un allié menacé.`;
    },
    to: "/game/statistiques?onglet=lune",
    reward: { scrap: 1_000_000, energy: 1_000_000 },
    done: (p) => !!playerMoon(p) || (Number(p.moonPity) || 0) > 0 || (playerStats(p).garrisons ?? 0) >= 1,
  },
];

export const GUIDE_TITLE = "Commandant aguerri";

export function guideClaimed(p: Pick<PlayerState, "onboarding">): string[] {
  return onboardingState(p).advanced ?? [];
}

export function guideHidden(p: Pick<PlayerState, "onboarding">): boolean {
  return onboardingState(p).advancedHidden === true;
}

export function guideProgress(p: PlayerState): { step: GuideStep; done: boolean; claimed: boolean }[] {
  const claimed = guideClaimed(p);
  return GUIDE_STEPS.map((step) => ({ step, done: step.done(p), claimed: claimed.includes(step.id) }));
}

/** Le carnet s'ouvre une fois la prise en main terminée (ou dépassée) et tant qu'il reste à réclamer. */
export function guideVisible(p: PlayerState): boolean {
  if (guideHidden(p) || onboardingEligible(p)) return false;
  return guideClaimed(p).length < GUIDE_STEPS.length;
}

/** Étape en cours : la première non réclamée (les suivantes restent visibles mais grisées). */
export function guideCurrent(p: PlayerState): GuideStep | null {
  const claimed = guideClaimed(p);
  return GUIDE_STEPS.find((s) => !claimed.includes(s.id)) ?? null;
}

export function claimGuideStep(player: PlayerState, stepId: string): { resources: Partial<Record<ResourceId, number>>; amber: number } {
  const step = GUIDE_STEPS.find((s) => s.id === stepId);
  if (!step) throw new GameActionError("Objectif inconnu.");
  const claimed = guideClaimed(player);
  if (claimed.includes(step.id)) throw new GameActionError("Récompense déjà reçue.");
  if (!step.done(player)) throw new GameActionError("Objectif pas encore atteint.");
  for (const [res, n] of Object.entries(step.reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  if (step.amber) {
    const st = bountyState(player);
    st.amber += step.amber;
    player.bounties = st;
    noteAmber(player, "guide", step.amber);
  }
  const next = [...claimed, step.id];
  player.onboarding = { ...onboardingState(player), advanced: next };
  if (next.length >= GUIDE_STEPS.length && !(player.titles ?? []).some((t) => t.label === GUIDE_TITLE)) {
    player.titles = [...(player.titles ?? []), { label: GUIDE_TITLE, seasonId: "onboarding", rank: 1 }];
  }
  return { resources: step.reward, amber: step.amber ?? 0 };
}

export function setGuideHidden(player: PlayerState, hidden: boolean): void {
  const st = onboardingState(player);
  delete st.advancedHidden;
  player.onboarding = hidden ? { ...st, advancedHidden: true } : st;
}
