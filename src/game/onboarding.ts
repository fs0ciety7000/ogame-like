import { GameActionError } from "@/game/errors";
import { RANKS } from "@/game/ranks";
import { TUTORIAL_RAID, TUTORIAL_TITLE } from "@/game/story";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Prise en main (v2.9) : dix objectifs récompensés une seule fois, pour
   guider un nouveau joueur dans ses premières heures. Les récompenses
   représentent à peu près une première journée de jeu.

   Les joueurs déjà avancés (au-delà de Fer 2 sans avoir rien réclamé) ne
   les voient pas. La progression est stockée sur le joueur (champ
   `onboarding`) et les récompenses sont versées par le serveur.
===================================================== */

export interface OnboardingState {
  claimed: string[];
  /** Le joueur a masqué la carte (il peut la rouvrir depuis les Réglages). */
  hidden?: boolean;
  /** v4.1 : raid scripté de Varan (« due » : à lancer par le serveur, « sent » : lancé). */
  tutorialRaid?: "due" | "sent";
  /** v5.11 : Carnet du commandant (tutoriel avancé), objectifs réclamés et carte masquée. */
  advanced?: string[];
  advancedHidden?: boolean;
}

export interface OnboardingStep {
  id: string;
  label: string;
  hint: string;
  /** Page où se fait l'objectif. */
  to: string;
  reward: Partial<Record<ResourceId, number>>;
  title?: string;
  done: (p: PlayerState) => boolean;
}

/** Rang au-delà duquel un joueur est considéré comme avancé. */
const ONBOARDING_RANK = "fer2";
const ONBOARDING_TITLE = "Recrue";

const level = (p: PlayerState, id: string) => (p.buildings?.[id]?.unlocked ? (p.buildings[id].level ?? 0) : 0);
const count = (p: PlayerState, id: string) => p.units?.[id]?.count ?? 0;

export function onboardingRankXp(): number {
  return RANKS.find((r) => r.id === ONBOARDING_RANK)?.xp ?? 250;
}

/** 6.14.161 (S1, NJ-1) : récompenses des objectifs, réglables dans l'admin (Tous les réglages, « Prise en main : récompenses »).
 *  La première recherche verse 20 Acier renforcé : juste ce que demande la recherche du Drone récupérateur au niveau 1
 *  (objectif suivant, « Posséder 5 drones »). Avant, un compte neuf n'en avait pas et restait bloqué. */
export const ONBOARDING_REWARDS: Record<string, Partial<Record<ResourceId, number>>> = {
  scrap3: { scrap: 1_000, energy: 500 },
  reactor3: { scrap: 1_500, energy: 1_000 },
  research: { nano: 2_000, data: 2_000, reinforcedSteel: 20 },
  drones5: { scrap: 3_000 },
  mission: { scrap: 5_000, energy: 2_000 },
  storage2: { scrap: 5_000, energy: 5_000 },
  rockets10: { reinforcedSteel: 20 },
  spy: { cyberModule: 30 },
  alliance: { scrap: 10_000, energy: 10_000 },
  rank: { reinforcedSteel: 50, cyberModule: 50, syntheticNanites: 50, aiFragment: 50 },
};

const REWARD_HINT = "Ressources versées à la réclamation (scrap, energy, nano, data, reinforcedSteel, cyberModule, syntheticNanites, aiFragment).";
export const ONBOARDING_REWARDS_META = {
  scrap3: { label: "Objectif 1 : extracteur de ferraille niveau 3", hint: REWARD_HINT },
  reactor3: { label: "Objectif 2 : réacteur niveau 3", hint: REWARD_HINT },
  research: { label: "Objectif 3 : première recherche", hint: `${REWARD_HINT} L'Acier renforcé paie la recherche du Drone (objectif 4).` },
  drones5: { label: "Objectif 4 : 5 drones récupérateurs", hint: REWARD_HINT },
  mission: { label: "Objectif 5 : première mission", hint: REWARD_HINT },
  storage2: { label: "Objectif 6 : entrepôt niveau 2", hint: REWARD_HINT },
  rockets10: { label: "Objectif 7 : 10 roquettes", hint: REWARD_HINT },
  spy: { label: "Objectif 8 : espionner un joueur ou un Seigneur", hint: REWARD_HINT },
  alliance: { label: "Objectif 9 : alliance", hint: REWARD_HINT },
  rank: { label: "Objectif 10 : rang Fer II", hint: REWARD_HINT },
};

/* 6.14.164 (S4, NJ-13) : « J'y vais » d'un bâtiment ou d'une unité vise sa carte (`?focus=<id>`) : la page défile jusqu'à
   elle et la met en évidence (avant : haut de la page, au-dessus de la file planifiée). */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "scrap3",
    label: "Extracteur de ferraille au niveau 3",
    hint: "La ferraille paie presque tout : améliore son extracteur en premier.",
    to: "/game/batiments?focus=extracteur_ferraille",
    get reward() {
      return ONBOARDING_REWARDS.scrap3;
    },
    done: (p) => level(p, "extracteur_ferraille") >= 3,
  },
  {
    id: "reactor3",
    label: "Réacteur au niveau 3",
    hint: "L'énergie instable accompagne la ferraille dans la plupart des coûts.",
    to: "/game/batiments?focus=reacteur_instable",
    get reward() {
      return ONBOARDING_REWARDS.reactor3;
    },
    done: (p) => level(p, "reacteur_instable") >= 3,
  },
  {
    id: "research",
    label: "Lancer une première recherche",
    hint: "Le Labo débloque les unités et renforce toute ton économie.",
    to: "/game/labo",
    get reward() {
      return ONBOARDING_REWARDS.research;
    },
    done: (p) => Object.values(p.techLevels ?? {}).some((l) => l > 0),
  },
  {
    id: "drones5",
    label: "Posséder 5 drones récupérateurs",
    hint: "Les drones ouvrent les premières missions. Leur recherche au Labo demande de l'Acier renforcé : l'objectif 3 t'en donne, sinon passe par le comptoir (page Ressources).",
    to: "/game/unites?focus=drone_recuperateur",
    get reward() {
      return ONBOARDING_REWARDS.drones5;
    },
    done: (p) => count(p, "drone_recuperateur") >= 5,
  },
  {
    id: "mission",
    label: "Terminer une mission",
    hint: "Les missions rapportent ressources et XP pendant que tu fais autre chose.",
    to: "/game/missions",
    get reward() {
      return ONBOARDING_REWARDS.mission;
    },
    done: (p) => (p.stats?.missions ?? 0) >= 1,
  },
  {
    id: "storage2",
    label: "Entrepôt au niveau 2",
    hint: "L'entrepôt augmente ta capacité et met une partie du stock à l'abri des pillards.",
    to: "/game/batiments?focus=entrepot",
    get reward() {
      return ONBOARDING_REWARDS.storage2;
    },
    done: (p) => level(p, "entrepot") >= 2,
  },
  {
    id: "rockets10",
    label: "Installer 10 roquettes",
    hint: "Une première défense décourage les attaques opportunistes.",
    to: "/game/unites?focus=roquette",
    get reward() {
      return ONBOARDING_REWARDS.rockets10;
    },
    done: (p) => count(p, "roquette") >= 10,
  },
  {
    id: "spy",
    // 6.14.166 (S8, NJ-34) : un Seigneur de guerre (PNJ) compte aussi (`stats.spies`, toute sonde lancée) : le texte le dit, pour qui
    // ne veut viser aucun joueur. Espionner ne lève pas la protection débutant.
    label: "Espionner un joueur ou un Seigneur",
    hint: "Envoie une sonde depuis la Galaxie. Tu ne veux viser personne ? Sonde un Seigneur de guerre (badge PNJ, en orange sur la carte). Espionner ne lève pas ta protection.",
    to: "/game/galaxie",
    get reward() {
      return ONBOARDING_REWARDS.spy;
    },
    done: (p) => (p.stats?.spies ?? 0) >= 1,
  },
  {
    id: "alliance",
    label: "Rejoindre ou créer une alliance",
    hint: "Trésor commun, recherches partagées et garnisons : on est plus forts à plusieurs.",
    to: "/game/alliance",
    get reward() {
      return ONBOARDING_REWARDS.alliance;
    },
    done: (p) => !!p.allianceId,
  },
  {
    id: "rank",
    label: "Atteindre le rang Fer II",
    // 6.14.161 (NJ-6) : bâtiments et recherches ne donnent pas d'XP (sources : `XpSource`, xpAudit.ts) ; le lien mène aux missions.
    hint: "L'XP vient des missions, des combats, des primes, des objectifs du jour et des succès. Bâtiments et recherches n'en donnent pas.",
    to: "/game/missions",
    get reward() {
      return ONBOARDING_REWARDS.rank;
    },
    title: ONBOARDING_TITLE,
    done: (p) => (p.xp ?? 0) >= onboardingRankXp(),
  },
];

export function onboardingState(p: Pick<PlayerState, "onboarding">): OnboardingState {
  const raw = p.onboarding;
  const tutorialRaid = raw?.tutorialRaid === "due" || raw?.tutorialRaid === "sent" ? raw.tutorialRaid : undefined;
  const advanced = Array.isArray(raw?.advanced) ? raw.advanced.filter((c) => typeof c === "string") : [];
  return {
    claimed: Array.isArray(raw?.claimed) ? raw.claimed.filter((c) => typeof c === "string") : [],
    hidden: raw?.hidden === true,
    ...(tutorialRaid ? { tutorialRaid } : {}),
    ...(advanced.length > 0 ? { advanced } : {}),
    ...(raw?.advancedHidden === true ? { advancedHidden: true } : {}),
  };
}

/** Le joueur suit-il la prise en main ? (débutant, ou déjà commencée et pas finie) */
export function onboardingEligible(p: PlayerState): boolean {
  const st = onboardingState(p);
  if (st.claimed.length >= ONBOARDING_STEPS.length) return false;
  return st.claimed.length > 0 || (p.xp ?? 0) < onboardingRankXp();
}

export function onboardingProgress(p: PlayerState): { step: OnboardingStep; done: boolean; claimed: boolean }[] {
  const st = onboardingState(p);
  return ONBOARDING_STEPS.map((step) => ({ step, done: step.done(p), claimed: st.claimed.includes(step.id) }));
}

/** Réclame la récompense d'un objectif atteint (côté serveur). */
export function claimOnboarding(player: PlayerState, stepId: string): Partial<Record<ResourceId, number>> {
  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) throw new GameActionError("Objectif inconnu.");
  if (!onboardingEligible(player)) throw new GameActionError("La prise en main est terminée.");
  const st = onboardingState(player);
  if (st.claimed.includes(step.id)) throw new GameActionError("Récompense déjà reçue.");
  if (!step.done(player)) throw new GameActionError("Objectif pas encore atteint.");
  for (const [res, amount] of Object.entries(step.reward) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + amount;
  if (step.title && !(player.titles ?? []).some((t) => t.label === step.title)) {
    player.titles = [...(player.titles ?? []), { label: step.title, seasonId: "onboarding", rank: 1 }];
    if (!player.activeTitle) player.activeTitle = step.title;
  }
  const claimed = [...st.claimed, step.id];
  // v4.1 : roquettes installées, Varan envoie son avant-garde (lancée par le serveur).
  const tutorialRaid = st.tutorialRaid ?? (step.id === TUTORIAL_RAID.trigger ? "due" : undefined);
  player.onboarding = { ...st, claimed, ...(tutorialRaid ? { tutorialRaid } : {}) };
  // Tutoriel terminé : titre « Recrue de Vashka ».
  if (claimed.length >= ONBOARDING_STEPS.length && !(player.titles ?? []).some((t) => t.label === TUTORIAL_TITLE)) {
    player.titles = [...(player.titles ?? []), { label: TUTORIAL_TITLE, seasonId: "onboarding", rank: 1 }];
  }
  return step.reward;
}

export function setOnboardingHidden(player: PlayerState, hidden: boolean): void {
  player.onboarding = { ...onboardingState(player), hidden };
}
