import { guideClaimed, guideCurrent, GUIDE_STEPS } from "@/game/advancedGuide";
import { bountyState, findShopItem, plannerUnlocked } from "@/game/bounties";
import { COLONY_RULES, homeLevels } from "@/game/colonies";
import { commandersState } from "@/game/commanders";
import { playerMoon } from "@/game/moon";
import { onboardingEligible, onboardingState, ONBOARDING_STEPS } from "@/game/onboarding";
import { PVP_RULES } from "@/game/pvp";
import { RANKS } from "@/game/ranks";
import { relicsState } from "@/game/relics";
import type { ChronicleObjective } from "@/game/chronicles";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.74 (DP-L1, proposals/deblocage-progressif.md, Q152 à Q158) :
   ouverture progressive du menu. Moteur pur : il dit quelles pages du menu
   sont ouvertes pour un joueur. Il **masque**, il ne verrouille rien : les
   routes, les actions et les règles du serveur restent identiques
   (invariant I30).

   Une page s'ouvre au **premier** de trois déclencheurs :
   - un signal d'usage (`NAV_SIGNALS`, liste fermée, lus par `navSignals`) ;
   - une étape du tutoriel atteinte (Prise en main ou Carnet du commandant) ;
   - un rang plafond (« au plus tard »).
   Une page ouverte ne se referme jamais : la marque `nav:<page>` (première
   visite) ou l'astuce vue `tip:<page>` dans `announcementsSeen` la gardent
   ouverte. Comptes existants (Q103) : créés avant `newAccountsFrom` et au
   moins au rang `veteranRank`, ils voient tout ; rien n'est écrit en base.

   Règles : valeurs littérales seulement (CLAUDE.md, initialisation des
   modules) ; le groupe `navUnlock` est déclaré dans `ruleRegistry.ts`.
===================================================== */

/** Signaux d'usage (liste fermée) : chacun est lu par `navSignals`. */
export const NAV_SIGNALS = [
  "danger",
  "protectionOver",
  "report",
  "firstUnit",
  "colonyNear",
  "hasColony",
  "inAlliance",
  "allianceAtWar",
  "hasRelicOrOfficer",
  "warlordContact",
  "bossJoined",
  "rareCurrency",
  "marketOffer",
  "codexReady",
  "plannerAmber",
  "hasMoon",
  "ascended",
] as const;
export type NavSignal = (typeof NAV_SIGNALS)[number];

export const NAV_SIGNAL_LABELS: Record<NavSignal, string> = {
  danger: "une première menace (attaque, ultimatum)",
  protectionOver: "la fin de ta protection de débutant",
  report: "un premier rapport de combat ou d'espionnage",
  firstUnit: "ta première unité",
  colonyNear: "les niveaux de bâtiments presque suffisants pour une colonie",
  hasColony: "ta première colonie",
  inAlliance: "une alliance",
  allianceAtWar: "une alliance engagée dans la guerre de territoire",
  hasRelicOrOfficer: "ta première relique ou ton premier officier",
  warlordContact: "un contact avec un seigneur de guerre",
  bossJoined: "ta première participation à un boss",
  rareCurrency: "ta première Ambre",
  marketOffer: "ton premier échange au marché",
  codexReady: "ta première fiche du Codex",
  plannerAmber: "le Planificateur débloqué au Comptoir",
  hasMoon: "une lune ou une réserve de pitié",
  ascended: "ta première Ascension",
};

export interface NavPageRule {
  /** Rang plafond : la page est ouverte au plus tard à ce rang (identifiant de `RANKS`). */
  rank?: string;
  /** Signaux d'usage qui ouvrent la page (un seul suffit). */
  signals?: string[];
  /** Étape de la Prise en main ou du Carnet qui ouvre la page quand elle devient l'étape en cours. */
  step?: string;
  /** Conditions toutes nécessaires avant tout déclencheur (Guerre de territoire : une alliance). */
  requires?: string[];
}

export const NAV_UNLOCK_RULES = {
  /** false : tout le monde voit tout (ancien menu). */
  enabled: true,
  /** Comptes créés avant cette date (ms) et au moins au rang `veteranRank` : tout ouvert (Q103). Défaut : 2026-10-08, 0 h (Paris). */
  newAccountsFrom: 1_791_410_400_000,
  /** Rang à partir duquel un compte créé avant `newAccountsFrom` voit tout (Q103 : Fer II). */
  veteranRank: "fer2",
  /** Colonies : la page s'ouvre ce nombre de niveaux cumulés avant le seuil de la 1re colonie. */
  colonyLead: 20,
  /** Objectifs du jour tirés parmi les systèmes ouverts (lot DP-L4, serveur). */
  filterContracts: true,
  /** Page fermée : « hidden » (cachée, Q153) ou « locked » (grisée avec cadenas). */
  style: "hidden",
  /** Une entrée par page du menu à ouverture progressive ; une page absente reste toujours visible. */
  pages: {
    // Palier 1 : premiers pas.
    "/game/galaxie": { rank: "fer3", signals: ["danger"], step: "spy" },
    "/game/alliance": { rank: "fer3", signals: ["inAlliance"], step: "alliance" },
    "/game/missions": { rank: "fer2", signals: ["firstUnit"], step: "mission" },
    "/game/combats": { rank: "fer2", signals: ["danger", "protectionOver", "report"] },
    "/game/menaces": { rank: "fer2", signals: ["danger", "protectionOver"] },
    // Palier 2 : commandant (fin de la Prise en main).
    "/game/joueurs": { rank: "fer2" },
    "/game/succes": { rank: "fer2" },
    "/game/passe": { rank: "fer2" },
    "/game/primes": { rank: "fer2", signals: ["danger"] },
    "/game/classe": { rank: "fer2", step: "empireClass" },
    "/game/journal": { rank: "fer2" },
    // Palier 3 : capitaine.
    "/game/commerce": { rank: "bronze3", signals: ["marketOffer"] },
    "/game/codex": { rank: "bronze3", signals: ["codexReady"] },
    "/game/chroniques": { rank: "bronze3" },
    "/game/gazette": { rank: "bronze3" },
    "/game/statistiques": { rank: "bronze3", signals: ["hasMoon"], step: "moonWatch" },
    "/game/portefeuille": { rank: "bronze3", signals: ["rareCurrency"] },
    "/game/simulateur": { rank: "bronze3", signals: ["report"] },
    "/game/planificateur": { rank: "bronze3", signals: ["plannerAmber"] },
    // Palier 4 : stratège.
    "/game/etat-major": { rank: "argent3", signals: ["hasRelicOrOfficer"], step: "relicEquip" },
    "/game/seigneurs": { rank: "argent3", signals: ["warlordContact"] },
    "/game/uber": { rank: "argent3", signals: ["bossJoined"] },
    "/game/boss": { rank: "argent3", signals: ["bossJoined"] },
    "/game/hall-of-fame": { rank: "argent3", signals: ["bossJoined"] },
    "/game/casino": { rank: "argent3" },
    // Palier 5 : colonies.
    "/game/colonies": { rank: "or3", signals: ["colonyNear", "hasColony"], step: "colonyFound" },
    "/game/guerre-territoire": { rank: "or3", signals: ["allianceAtWar"], requires: ["inAlliance"] },
  } as Record<string, NavPageRule>,
};

/** Pages hors de l'ouverture progressive (palier 0, pied de barre, pages de la palette) : toujours visibles. */
export const NAV_ALWAYS_VISIBLE = [
  "/game",
  "/game/ordres",
  "/game/ressources",
  "/game/batiments",
  "/game/unites",
  "/game/labo",
  "/game/messages",
  // L'Ascension garde sa règle propre (au menu après la 1re Ascension, `useHiddenRoutes`).
  "/game/ascension",
  "/game/profil",
  "/game/nouveautes",
  "/game/annonces",
  "/game/signalements",
  "/bible",
  "/devblog",
  "/game/formules",
  "/game/palmares",
  "/game/concours",
] as const;

/** Marques de l'option « Tout afficher » (Réglages, Q156) dans `announcementsSeen` : la dernière posée l'emporte. */
export const NAV_SHOW_ALL_ON = "nav:all";
export const NAV_SHOW_ALL_OFF = "nav:progressif";

/** Données hors de la fiche du joueur (le client les a ; le serveur les passera au lot DP-L4). */
export interface NavContext {
  now: number;
  /** Administrateur du jeu : tout est ouvert. */
  admin?: boolean;
  /** Une flotte hostile vise le joueur (signal `danger`). */
  hostileIncoming?: boolean;
  /** Rapport de combat ou d'espionnage reçu (signal `report`, et `danger`). */
  reportReceived?: boolean;
  /** Une fiche du Codex est prête à réclamer. */
  codexReady?: boolean;
  /** Le joueur a reçu une offre ou un contrat de livraison. */
  marketOffer?: boolean;
  /** L'alliance du joueur est engagée dans la guerre de territoire. */
  allianceAtWar?: boolean;
  /** Un seigneur a contacté ou pillé le joueur. */
  warlordContact?: boolean;
  /** Le joueur a participé à un boss. */
  bossJoined?: boolean;
}

/** Pourquoi le menu est complet, ou progressif. */
export type NavStatus = "disabled" | "admin" | "veteran" | "showAll" | "progressive";

/** Chemin sans requête ni fragment (`/game/statistiques?onglet=lune` → `/game/statistiques`). */
export function navPath(to: string): string {
  return to.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

/** Identifiant de la marque d'une page (même découpe que l'astuce : `/game/missions` → `nav:missions`). */
export function navMarkId(page: string): string {
  return `nav:${navPath(page).replace(/^\/game\/?/, "").replace(/[^A-Za-z0-9._-]+/g, "-") || "accueil"}`;
}

function tipMarkId(page: string): string {
  return `tip:${navMarkId(page).slice(4)}`;
}

export function rankXp(id: string | undefined): number {
  if (!id) return Infinity;
  const r = RANKS.find((x) => x.id === id);
  // Rang inconnu (supprimé dans l'admin) : la page est ouverte (le plus prudent pour le joueur).
  return r ? r.xp : 0;
}

export function rankName(id: string | undefined): string {
  return RANKS.find((x) => x.id === id)?.name ?? String(id ?? "");
}

/** L'option « Tout afficher » est-elle active ? (dernière des deux marques posées) */
export function navShowAll(p: Pick<PlayerState, "announcementsSeen"> | null | undefined): boolean {
  const seen = p?.announcementsSeen ?? [];
  return seen.lastIndexOf(NAV_SHOW_ALL_ON) > seen.lastIndexOf(NAV_SHOW_ALL_OFF);
}

/** Compte « existant » au sens de Q103 : créé avant la date (date absente : ancien compte) et au moins au rang vétéran. */
export function navVeteran(p: Pick<PlayerState, "createdAtMs" | "xp">): boolean {
  const created = Number(p.createdAtMs) || 0;
  const from = Number(NAV_UNLOCK_RULES.newAccountsFrom) || 0;
  return created < from && (Number(p.xp) || 0) >= rankXp(NAV_UNLOCK_RULES.veteranRank);
}

export function navStatus(p: PlayerState, ctx: Pick<NavContext, "admin">): NavStatus {
  if (!NAV_UNLOCK_RULES.enabled) return "disabled";
  if (ctx.admin) return "admin";
  if (navVeteran(p)) return "veteran";
  if (navShowAll(p)) return "showAll";
  return "progressive";
}

/** Signaux d'usage vrais pour ce joueur. */
export function navSignals(p: PlayerState, ctx: NavContext): Set<NavSignal> {
  const out = new Set<NavSignal>();
  const stats = p.stats ?? {};
  const combats = (Number(p.victories) || 0) + (Number(p.defeats) || 0);
  const tutorialRaid = onboardingState(p).tutorialRaid === "sent";
  if (ctx.hostileIncoming || ctx.reportReceived || tutorialRaid || combats > 0 || (Number(p.lastDefeatAtMs) || 0) > 0 || (Number(stats.ultimatums) || 0) > 0 || (stats.threatenedBy?.length ?? 0) > 0) out.add("danger");
  const created = Number(p.createdAtMs) || 0;
  if (created > 0 && ctx.now - created >= PVP_RULES.newbieProtectionMs) out.add("protectionOver");
  if (ctx.reportReceived || combats > 0 || (Number(stats.spies) || 0) > 0) out.add("report");
  if (Object.values(p.units ?? {}).some((u) => (Number(u?.level) || 0) > 0 || (Number(u?.count) || 0) > 0)) out.add("firstUnit");
  const firstColony = Number(COLONY_RULES.levelsRequired?.[0]) || 0;
  if (homeLevels(p) >= firstColony - (Number(NAV_UNLOCK_RULES.colonyLead) || 0)) out.add("colonyNear");
  if ((p.colonies?.length ?? 0) > 0 || !!p.colonizing) out.add("hasColony");
  if (p.allianceId) out.add("inAlliance");
  if (ctx.allianceAtWar || (!!p.allianceId && !!p.territory)) out.add("allianceAtWar");
  const commanders = commandersState(p);
  if (relicsState(p).items.length > 0 || Object.keys(commanders.roster).length > 0) out.add("hasRelicOrOfficer");
  if (ctx.warlordContact || Object.keys(stats.vendettaWins ?? {}).length > 0) out.add("warlordContact");
  if (ctx.bossJoined || (Number(stats.leviathanKills) || 0) > 0 || (stats.worldBossKilled?.length ?? 0) > 0 || (stats.allianceBossKilled?.length ?? 0) > 0) out.add("bossJoined");
  const amber = bountyState(p);
  if (amber.amber > 0 || amber.amberEarned > 0) out.add("rareCurrency");
  if (ctx.marketOffer || (Number(stats.marketTrades) || 0) > 0 || (Number(stats.contractsDelivered) || 0) > 0) out.add("marketOffer");
  if (ctx.codexReady || (stats.codexClaimed?.length ?? 0) > 0) out.add("codexReady");
  // Le Planificateur coûte de l'Ambre au Comptoir : il s'ouvre dès qu'il est acheté ou qu'on peut l'acheter.
  if (plannerUnlocked(p) || amber.amber >= (findShopItem("planner")?.price ?? Infinity)) out.add("plannerAmber");
  if (moonPanelVisible(p)) out.add("hasMoon");
  if ((Number(p.ascensions) || 0) > 0) out.add("ascended");
  return out;
}

/** Étape du tutoriel atteinte : réclamée, ou étape en cours (Prise en main, puis Carnet). */
export function navStepReached(p: PlayerState, step: string): boolean {
  const onboardingIndex = ONBOARDING_STEPS.findIndex((s) => s.id === step);
  if (onboardingIndex >= 0) {
    if (!onboardingEligible(p)) return true;
    const claimed = onboardingState(p).claimed;
    if (claimed.includes(step)) return true;
    return ONBOARDING_STEPS.find((s) => !claimed.includes(s.id))?.id === step;
  }
  if (GUIDE_STEPS.some((s) => s.id === step)) {
    if (guideClaimed(p).includes(step)) return true;
    return !onboardingEligible(p) && guideCurrent(p)?.id === step;
  }
  return false;
}

/** Marque de visite ou astuce vue : la page a déjà été ouverte (Q155). */
export function navPageMarked(p: Pick<PlayerState, "announcementsSeen">, page: string): boolean {
  const seen = p.announcementsSeen ?? [];
  return seen.includes(navMarkId(page)) || seen.includes(tipMarkId(page));
}

/** Pourquoi une page est ouverte (premier déclencheur trouvé), ou null si elle est fermée. */
export function navOpenReason(p: PlayerState, page: string, ctx: NavContext, signals = navSignals(p, ctx)): "always" | "mark" | "signal" | "step" | "rank" | null {
  const rule = NAV_UNLOCK_RULES.pages[navPath(page)];
  if (!rule) return "always";
  if (navPageMarked(p, page)) return "mark";
  if ((rule.requires ?? []).some((s) => !signals.has(s as NavSignal))) return null;
  if ((rule.signals ?? []).some((s) => signals.has(s as NavSignal))) return "signal";
  if (rule.step && navStepReached(p, rule.step)) return "step";
  if (rule.rank && (Number(p.xp) || 0) >= rankXp(rule.rank)) return "rank";
  return null;
}

/** La page est-elle au menu de ce joueur ? Toujours vrai hors du mode progressif (admin, ancien compte, « Tout afficher », désactivé). */
export function navPageOpen(p: PlayerState, page: string, ctx: NavContext): boolean {
  if (navStatus(p, ctx) !== "progressive") return true;
  return navOpenReason(p, page, ctx) !== null;
}

/** Pages réglées (`pages`) encore fermées pour ce joueur. Vide hors du mode progressif. */
export function navClosedPages(p: PlayerState, ctx: NavContext): string[] {
  if (navStatus(p, ctx) !== "progressive") return [];
  const signals = navSignals(p, ctx);
  return Object.keys(NAV_UNLOCK_RULES.pages).filter((page) => navOpenReason(p, page, ctx, signals) === null);
}

/** Pages réglées ouvertes pour ce joueur (toutes hors du mode progressif). */
export function navOpenPages(p: PlayerState, ctx: NavContext): Set<string> {
  const closed = new Set(navClosedPages(p, ctx));
  return new Set(Object.keys(NAV_UNLOCK_RULES.pages).filter((page) => !closed.has(page)));
}

/** Condition d'ouverture d'une page fermée, en texte joueur (« s'ouvre à Bronze III ou avec ta première Ambre »). */
export function navCondition(page: string): string {
  const rule = NAV_UNLOCK_RULES.pages[navPath(page)];
  if (!rule) return "";
  const parts: string[] = [];
  if (rule.rank) parts.push(`à ${rankName(rule.rank)}`);
  // Le premier signal seulement : la condition tient sur une ligne de la palette (les autres restent dans l'admin).
  const signal = (rule.signals ?? []).find((s) => s in NAV_SIGNAL_LABELS);
  if (signal) parts.push(`avec ${NAV_SIGNAL_LABELS[signal as NavSignal]}`);
  const head = parts.length > 0 ? `S'ouvre ${parts.join(" ou ")}` : "S'ouvre en jouant";
  const needs = (rule.requires ?? []).filter((s) => s in NAV_SIGNAL_LABELS).map((s) => NAV_SIGNAL_LABELS[s as NavSignal]);
  return needs.length > 0 ? `${head} (il faut ${needs.join(" et ")})` : head;
}

export interface NavNextOpening {
  /** Pages qui s'ouvriront à ce rang (ordre des règles). */
  pages: string[];
  rankId: string;
  rankName: string;
  xp: number;
  targetXp: number;
}

/** Prochaine ouverture par le rang : les pages fermées du plus petit rang plafond pas encore atteint. */
export function nextNavOpening(p: PlayerState, ctx: NavContext): NavNextOpening | null {
  const closed = navClosedPages(p, ctx);
  const xp = Number(p.xp) || 0;
  let best: { id: string; xp: number } | null = null;
  for (const page of closed) {
    const id = NAV_UNLOCK_RULES.pages[page]?.rank;
    const target = rankXp(id);
    if (!id || !Number.isFinite(target) || target <= xp) continue;
    if (!best || target < best.xp) best = { id, xp: target };
  }
  if (!best) return null;
  const target = best;
  const pages = closed.filter((page) => rankXp(NAV_UNLOCK_RULES.pages[page]?.rank) === target.xp);
  return { pages, rankId: target.id, rankName: rankName(target.id), xp, targetXp: target.xp };
}

/** Panneau Lune de Statistiques : seulement avec une lune, une réserve de pitié, ou le chapitre « Ta lune » du Carnet atteint. */
export function moonPanelVisible(p: PlayerState | null | undefined): boolean {
  if (!p) return false;
  if (playerMoon(p) || (Number(p.moonPity) || 0) > 0) return true;
  const moonStep = GUIDE_STEPS.find((s) => s.chapter === "moon");
  return !!moonStep && navStepReached(p, moonStep.id);
}

/** Page où l'on agit pour un objectif du passe ou des Chroniques (« J'y vais », ouverture par l'intention). */
export const OBJECTIVE_PAGES: Record<ChronicleObjective, string> = {
  contract: "/game/ordres",
  bounty: "/game/primes",
  raidRepelled: "/game/menaces",
  victory: "/game/galaxie",
  bossAssault: "/game/boss",
  mission: "/game/missions",
  spy: "/game/galaxie",
  market: "/game/commerce",
  warlordWin: "/game/seigneurs",
};

/** Pages qu'une étape du tutoriel ouvre (réglage `step`) et que rien d'autre n'a encore ouvertes : « Débloque : … » sur sa carte. */
export function navPagesOpenedByStep(p: PlayerState, step: string, ctx: NavContext): string[] {
  if (navStatus(p, ctx) !== "progressive") return [];
  const signals = navSignals(p, ctx);
  return Object.entries(NAV_UNLOCK_RULES.pages)
    .filter(([page, rule]) => rule.step === step && navOpenReason(p, page, ctx, signals) === "step")
    .map(([page]) => page);
}
