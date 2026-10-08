import { guideClaimed, guideCurrent, GUIDE_STEPS } from "@/game/advancedGuide";
import { bountyState, findShopItem, plannerUnlocked } from "@/game/bounties";
import { COLONY_RULES, homeLevels } from "@/game/colonies";
import { commandersState } from "@/game/commanders";
import { defaultPlayerState } from "@/game/defaults";
import { playerMoon } from "@/game/moon";
import { prestigeUnlocked } from "@/game/prestige";
import { onboardingEligible, onboardingState, ONBOARDING_STEPS } from "@/game/onboarding";
import { PVP_RULES } from "@/game/pvp";
import { RANKS } from "@/game/ranks";
import { relicsState } from "@/game/relics";
import type { ChronicleObjective } from "@/game/chronicles";
import { objectivePage, STATIC_OBJECTIVES, TRACKED_ACTIONS, type StaticObjective } from "@/game/trackedActions";
import type { NewNotification } from "@/game/flush";
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
  "prestigeReady",
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
  prestigeReady: "tes 4 extracteurs au niveau requis des projets de prestige",
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
    // 6.14.85 (RL-2) : projets de prestige, ouverts seulement par leur condition (4 extracteurs au niveau requis), sans rang plafond.
    "/game/prestige": { signals: ["prestigeReady"] },
  } as Record<string, NavPageRule>,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const NAV_UNLOCK_RULES_META = {
  enabled: { label: "Ouverture progressive du menu", hint: "Décoché : tout le monde voit tout (ancien menu)." },
  newAccountsFrom: { label: "Comptes neufs à partir du", unit: "date", min: 0, hint: "Un compte créé avant et au moins au rang des vétérans voit tout." },
  veteranRank: { label: "Rang des vétérans (id)", hint: "Ex. fer2 = Fer II." },
  colonyLead: { label: "Avance de la page Colonies", unit: "niveaux", min: 0, max: 200, hint: "La page s'ouvre ce nombre de niveaux cumulés avant le seuil de la 1re colonie." },
  filterContracts: { label: "Objectifs du jour tirés parmi les systèmes ouverts" },
  style: { label: "Page fermée : hidden (cachée) ou locked (grisée)" },
  pages: { label: "Pages à ouverture progressive", hint: "Par page : rank, signals, step, requires. Une page absente reste toujours visible." },
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

/** Libellés des pages réglées (mêmes noms que le menu, `NavBar.tsx` ; un test les compare) : notification « Nouveau : … », admin. */
export const NAV_PAGE_LABELS: Record<string, string> = {
  "/game/galaxie": "Galaxie",
  "/game/alliance": "Alliance",
  "/game/missions": "Missions",
  "/game/combats": "Combats",
  "/game/menaces": "Menaces",
  "/game/joueurs": "Classement",
  "/game/succes": "Succès",
  "/game/passe": "Passe",
  "/game/primes": "Primes",
  "/game/classe": "Classe d'empire",
  "/game/journal": "Journal",
  "/game/commerce": "Commerce",
  "/game/codex": "Codex",
  "/game/chroniques": "Chroniques",
  "/game/gazette": "Gazette",
  "/game/statistiques": "Statistiques",
  "/game/portefeuille": "Portefeuille",
  "/game/simulateur": "Simulateur",
  "/game/planificateur": "Planificateur",
  "/game/etat-major": "État-major",
  "/game/seigneurs": "Seigneurs",
  "/game/uber": "Boss mondial",
  "/game/boss": "Boss de saison",
  "/game/hall-of-fame": "Hall of fame des boss",
  "/game/casino": "Casino",
  "/game/colonies": "Colonies",
  "/game/guerre-territoire": "Guerre de territoire",
  "/game/prestige": "Prestige",
};

/** Nom d'une page réglée (le chemin s'il n'a pas de libellé : page ajoutée dans l'admin). */
export function navPageLabel(page: string): string {
  return NAV_PAGE_LABELS[navPath(page)] ?? navPath(page);
}

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
  if (prestigeUnlocked(p)) out.add("prestigeReady");
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

/** 6.14.79 (DP-L4) : pages déjà annoncées par la notification « Nouveau : … » (`stats.navAnnounced`, écrit par le serveur). */
export function navAnnounced(p: Pick<PlayerState, "stats"> | null | undefined): string[] {
  const list = p?.stats?.navAnnounced;
  return Array.isArray(list) ? list : [];
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
  if (!(rule.requires ?? []).some((s) => !signals.has(s as NavSignal))) {
    if ((rule.signals ?? []).some((s) => signals.has(s as NavSignal))) return "signal";
    if (rule.step && navStepReached(p, rule.step)) return "step";
    if (rule.rank && (Number(p.xp) || 0) >= rankXp(rule.rank)) return "rank";
  }
  // 6.14.79 (DP-L4) : page déjà annoncée par le serveur (« Nouveau : … ») : elle reste ouverte, même si son déclencheur disparaît.
  if (navAnnounced(p).includes(navPath(page))) return "mark";
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
export const OBJECTIVE_PAGES: Record<StaticObjective, string> = Object.fromEntries(STATIC_OBJECTIVES.map((k) => [k, TRACKED_ACTIONS[k].page])) as Record<StaticObjective, string>;

/** 6.14.121 (AP-L7) : page d'une action suivie, celles par contenu comprises (`unit:<id>` → Unités…), lue dans le registre. */
export function objectiveGoPage(k: ChronicleObjective): string | undefined {
  return objectivePage(k);
}

/** 6.14.81 (DP-L6, proposition §5.8) : page du système de chaque mesure de succès (identifiants de `METRICS`, `achievements.ts`).
 *  Un succès dont la page est fermée s'affiche « À découvrir » avec la condition d'ouverture, sans son chiffre de progression.
 *  Une mesure absente se fait sur une page toujours visible (bâtiments, Labo, unités…) ou hors du menu (Ascension). */
export const ACHIEVEMENT_PAGES: Record<string, string> = {
  victories: "/game/galaxie",
  loot: "/game/galaxie",
  spies: "/game/galaxie",
  recycled: "/game/galaxie",
  patrols: "/game/galaxie",
  defeats: "/game/combats",
  phoenix: "/game/combats",
  missions: "/game/missions",
  bestMissionDay: "/game/missions",
  expeditions: "/game/missions",
  inAlliance: "/game/alliance",
  allianceFounded: "/game/alliance",
  garrisons: "/game/alliance",
  donated: "/game/alliance",
  allianceBossTypes: "/game/alliance",
  allianceBossAll: "/game/alliance",
  ultimatums: "/game/menaces",
  factionsThreatened: "/game/menaces",
  tributesPaid: "/game/menaces",
  raidsRepelled: "/game/menaces",
  lairsTaken: "/game/menaces",
  lairFactions: "/game/menaces",
  maxNotoriety: "/game/menaces",
  evasions: "/game/menaces",
  passesCompleted: "/game/passe",
  chaptersCompleted: "/game/chroniques",
  bossSeals: "/game/boss",
  leviathanKills: "/game/uber",
  worldBossTypes: "/game/uber",
  rareOfficers: "/game/etat-major",
  seasonCommanders: "/game/etat-major",
  modulesBuilt: "/game/etat-major",
  modulesMounted: "/game/etat-major",
  relicsOwned: "/game/etat-major",
  casinoJackpots: "/game/casino",
  casinoSpins: "/game/casino",
  casinoWins: "/game/casino",
  auctionsSold: "/game/commerce",
  auctionsWon: "/game/commerce",
  marketTrades: "/game/commerce",
  contractsDelivered: "/game/commerce",
  bountiesDone: "/game/primes",
  amberEarned: "/game/primes",
  bountyReputation: "/game/primes",
  vendettaWins: "/game/seigneurs",
  warlordsBeaten: "/game/seigneurs",
  codexChapters: "/game/codex",
  moonLevel: "/game/statistiques",
  moonMaxed: "/game/statistiques",
  phalanxScans: "/game/statistiques",
  gateJumps: "/game/statistiques",
  gateSaves: "/game/statistiques",
  prestigeProjects: "/game/prestige",
};

/** Page fermée du système d'un succès (ou null : page ouverte, toujours visible, ou hors du mode progressif). */
export function achievementClosedPage(metric: string, closed: ReadonlySet<string>): string | null {
  const page = ACHIEVEMENT_PAGES[metric];
  return page && closed.has(page) ? page : null;
}

/** Pages qu'une étape du tutoriel ouvre (réglage `step`) et que rien d'autre n'a encore ouvertes : « Débloque : … » sur sa carte. */
export function navPagesOpenedByStep(p: PlayerState, step: string, ctx: NavContext): string[] {
  if (navStatus(p, ctx) !== "progressive") return [];
  const signals = navSignals(p, ctx);
  return Object.entries(NAV_UNLOCK_RULES.pages)
    .filter(([page, rule]) => rule.step === step && navOpenReason(p, page, ctx, signals) === "step")
    .map(([page]) => page);
}

/* =====================================================
   6.14.79 (DP-L4, proposition §5.4 et §5.6) : notification « Nouveau : … »
   quand des pages s'ouvrent. Appelée par le serveur après une action du
   joueur (`/api/cosmic/action`, dans la transaction : I24), jamais par le
   client. Une notification par ouverture (un palier, un danger, une étape),
   qui cite toutes les pages ouvertes ensemble ; aucune pastille nouvelle.
   Mémoire : `stats.navAnnounced` (pages déjà annoncées ou déjà ouvertes),
   qui garde aussi la page ouverte (`navOpenReason`, I30).
===================================================== */

/** « Galaxie », « Galaxie et Alliance », « Missions, Combats et Menaces ». */
export function navPageList(pages: string[]): string {
  const labels = pages.map(navPageLabel);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

/**
 * Pages ouvertes depuis la dernière annonce : met à jour `stats.navAnnounced` et rend la notification (ou null).
 * - Hors du mode progressif (ancien compte, admin, menu désactivé) : rien n'est écrit, rien n'est annoncé.
 * - « Tout afficher » : la mémoire suit en silence (rien à annoncer, tout est déjà au menu).
 * - Première lecture (mémoire absente : compte d'avant ce lot) : les pages déjà ouvertes sont notées en silence.
 * - Page ouverte par une visite (marque `nav:` ou astuce) : notée en silence (le joueur la connaît).
 */
export function navOpeningNotice(p: PlayerState, ctx: NavContext): NewNotification | null {
  const status = navStatus(p, ctx);
  if (status !== "progressive" && status !== "showAll") return null;
  const signals = navSignals(p, ctx);
  const known = p.stats?.navAnnounced;
  const announced = new Set(Array.isArray(known) ? known : []);
  const silent: string[] = [];
  const fresh: { page: string; reason: "signal" | "step" | "rank" }[] = [];
  for (const page of Object.keys(NAV_UNLOCK_RULES.pages)) {
    if (announced.has(page)) continue;
    const reason = navOpenReason(p, page, ctx, signals);
    if (reason === null || reason === "always") continue;
    if (reason === "mark" || status === "showAll" || !Array.isArray(known)) silent.push(page);
    else fresh.push({ page, reason });
  }
  if (silent.length === 0 && fresh.length === 0 && Array.isArray(known)) return null;
  p.stats = { ...(p.stats ?? {}), navAnnounced: [...announced, ...silent, ...fresh.map((f) => f.page)] };
  if (fresh.length === 0) return null;
  const pages = fresh.map((f) => f.page);
  return {
    kind: "system",
    title: `Nouveau : ${navPageList(pages)}`,
    message: navOpeningMessage(p, fresh, signals),
    createdAtMs: ctx.now,
    read: false,
    link: pages[0],
  };
}

/** Texte de la notification : pourquoi ces pages s'ouvrent (danger d'abord, puis fin de protection, étape, rang, usage). */
function navOpeningMessage(p: PlayerState, fresh: { page: string; reason: "signal" | "step" | "rank" }[], signals: Set<NavSignal>): string {
  const pages = fresh.map((f) => f.page);
  const many = pages.length > 1;
  const where = many ? "Elles sont maintenant dans ton menu." : "Elle est maintenant dans ton menu.";
  const bySignal = (s: NavSignal) => fresh.some((f) => f.reason === "signal" && (NAV_UNLOCK_RULES.pages[f.page]?.signals ?? []).includes(s) && signals.has(s));
  if (bySignal("danger")) return `Une menace vise ton empire : ${many ? "ces pages t'aident" : "cette page t'aide"} à te défendre. ${where}`;
  if (bySignal("protectionOver")) return `Ta protection de débutant est finie : les raids peuvent viser ta base. ${where}`;
  if (fresh.some((f) => f.reason === "rank")) {
    const rank = rankName(NAV_UNLOCK_RULES.pages[fresh.find((f) => f.reason === "rank")!.page]?.rank);
    return `Tu as atteint ${rank} : ${many ? "de nouvelles pages s'ouvrent" : "une nouvelle page s'ouvre"}. ${where}`;
  }
  if (fresh.some((f) => f.reason === "step")) return `Ta prochaine étape t'y attend. ${where}`;
  const first = fresh.find((f) => f.reason === "signal");
  const signal = (NAV_UNLOCK_RULES.pages[first?.page ?? ""]?.signals ?? []).find((s) => signals.has(s as NavSignal)) as NavSignal | undefined;
  return signal ? `Débloqué avec ${NAV_SIGNAL_LABELS[signal]}. ${where}` : where;
}

/* =====================================================
   6.14.80 (DP-L5) : aperçu de l'admin, « ce que voit un compte neuf à tel
   rang », calculé avec le brouillon des règles (avant l'enregistrement).
===================================================== */

/** Pages toujours visibles qui ne sont pas des entrées du menu (palette, Ascension avant la 1re, concours des admins). */
const NAV_NOT_IN_MENU = ["/game/ascension", "/game/formules", "/game/palmares", "/game/concours"];

/** Entrées du menu toujours visibles (palier 0 et pied de barre) : 13. */
export function navAlwaysMenuCount(): number {
  return NAV_ALWAYS_VISIBLE.filter((p) => !NAV_NOT_IN_MENU.includes(p)).length;
}

export interface NavPreviewOptions {
  /** Rang du compte (identifiant de `RANKS`). */
  rankId: string;
  /** Membre d'une alliance. */
  alliance?: boolean;
  /** Prise en main terminée (Carnet du commandant ouvert). */
  onboardingDone?: boolean;
  /** Une menace est arrivée (flotte hostile, rapport reçu). */
  danger?: boolean;
  /** Heures depuis l'inscription (fin de la protection de débutant à 72 h par défaut). */
  hoursSinceSignup?: number;
}

export interface NavPreview {
  status: NavStatus;
  /** Entrées du menu visibles (barre latérale et pied de barre). */
  menuEntries: number;
  open: { page: string; reason: string }[];
  closed: { page: string; condition: string }[];
  next: NavNextOpening | null;
}

/** Aperçu pour un compte neuf (créé après `newAccountsFrom`), avec des règles de brouillon si on en passe (rendues ensuite). */
export function navPreview(opts: NavPreviewOptions, now: number, draft?: Partial<typeof NAV_UNLOCK_RULES>): NavPreview {
  const saved = { ...NAV_UNLOCK_RULES };
  if (draft) Object.assign(NAV_UNLOCK_RULES, draft, { pages: { ...(draft.pages ?? NAV_UNLOCK_RULES.pages) } });
  try {
    // Compte créé à l'instant (après la date : jamais « ancien compte »), regardé `hoursSinceSignup` heures plus tard.
    const created = Math.max(now, Number(NAV_UNLOCK_RULES.newAccountsFrom) || 0);
    const xp = rankXp(opts.rankId);
    const p: PlayerState = {
      ...(defaultPlayerState("apercu", "Aperçu") as PlayerState),
      createdAtMs: created,
      resourcesUpdatedAtMs: created,
      xp: Number.isFinite(xp) ? xp : 0,
      allianceId: opts.alliance ? "apercu" : "",
      onboarding: { claimed: opts.onboardingDone ? ONBOARDING_STEPS.map((s) => s.id) : [] },
    };
    const ctx: NavContext = { now: created + Math.max(0, Number(opts.hoursSinceSignup) || 0) * 3_600_000, hostileIncoming: !!opts.danger };
    const status = navStatus(p, ctx);
    const signals = navSignals(p, ctx);
    const open: NavPreview["open"] = [];
    const closed: NavPreview["closed"] = [];
    for (const page of Object.keys(NAV_UNLOCK_RULES.pages)) {
      const reason = status === "progressive" ? navOpenReason(p, page, ctx, signals) : "always";
      if (reason === null) closed.push({ page, condition: navCondition(page) });
      else open.push({ page, reason });
    }
    return { status, menuEntries: navAlwaysMenuCount() + open.length, open, closed, next: status === "progressive" ? nextNavOpening(p, ctx) : null };
  } finally {
    for (const key of Object.keys(NAV_UNLOCK_RULES)) delete (NAV_UNLOCK_RULES as Record<string, unknown>)[key];
    Object.assign(NAV_UNLOCK_RULES, saved);
  }
}
