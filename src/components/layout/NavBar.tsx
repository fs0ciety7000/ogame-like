import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isActive, type BossPhase } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { assetUrl } from "@/lib/assets";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { setCockpitView, useCockpitView } from "@/lib/cockpitView";
import { useCasinoVisible } from "@/services/casinoService";
import { useIsAdmin } from "@/services/adminService";
import { HudChip, HudSwitch } from "@/components/ui/hud";
import { BOSS_NAV, BOSS_TONE, bossNavText, useBossNavInfo } from "@/hooks/useBossStatus";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Orbit, Users, Swords, Flag, UserCircle, Sparkles, Trophy, Skull, Medal, LayoutGrid, Bug, Calculator, Store, Fish, Globe2, ScrollText, Mail, Crosshair, Shield as ShieldStar, Ticket, Scroll, Crown, Flame, Pin, Newspaper, Megaphone, BookOpen, BookMarked, Sigma, BarChart3, ChevronDown, ChevronsLeft, ChevronsRight, Gift, Gauge, Maximize, Dices, Map as MapIcon, CalendarClock, Lock, ClipboardList, Wallet, Compass } from "lucide-react";
import { Landmark } from "lucide-react";
import { useLeviathanSeen } from "@/store/leviathanSeenStore";
import { BLOG_URL } from "@/services/blogService";
import { CURRENT_VERSION, useUnreadChangelogCount } from "@/lib/changelog";
import { DEFAULT_TABS, moreBadgeCount } from "@/lib/mobileTabs";
import { fullscreenSupported, isFullscreen, toggleFullscreen } from "@/lib/fullscreen";
import { cn, formatCompact } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SignalIndicator } from "@/components/layout/SignalIndicator";
import { LiveClock } from "@/components/layout/LiveClock";
import { usePlayerStore } from "@/store/playerStore";
import { findShopItem, plannerUnlocked } from "@/game/bounties";
import { getRankIcon, getRankLabel, getRankProgress } from "@/game/ranks";
import { useAllianceUnreadStore } from "@/store/allianceUnreadStore";
import { usePactUnreadStore } from "@/services/diplomacyService";

import { ordersReadyCount } from "@/game/dailyOrders";
import { StaffBadge } from "@/components/ui/staff-badge";
import { useReportBadges } from "@/services/reportService";
import { useUnreadMessageCount } from "@/services/messageService";
import { useGlobalUnreadCount } from "@/services/globalChatService";
import { useAuthStore } from "@/store/authStore";
import { useFleetStore } from "@/store/fleetStore";
import { isHostile } from "@/components/game/FleetsPanel";
import { markAnnouncementsSeen } from "@/services/playerService";
import { NAV_UNLOCK_RULES, navClosedPages, navCondition, navMarkId, navOpenPages, navPageMarked, navPagesOpenedByStep, navStatus, nextNavOpening, type NavContext, type NavNextOpening, type NavStatus } from "@/game/navUnlock";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** v5.1 : page hors de l'application, ouverte dans un nouvel onglet. */
  href?: string;
  /** 5.26.1 : page à débloquer (Comptoir de la Ruche) ; lien désactivé tant qu'elle ne l'est pas. */
  lock?: "planner";
}

/** 6.14.104 (AA3) : prix réglable dans l'admin, lu à l'usage (jamais au chargement du module). */
const plannerPrice = () => findShopItem("planner")?.price ?? 600;

type ItemLinkProps = Omit<React.ComponentProps<typeof NavLink>, "to"> & { item: NavItem };

/** NavLink, ou lien externe (nouvel onglet) pour les pages hors application. */
function ItemLink({ item, className, children, end: _end, ...rest }: ItemLinkProps) {
  const nav = useContext(NavUnlockContext);
  // 6.14.75 (DP-L2, Q153) : réglage `navUnlock.style` à « locked » : une page fermée reste au menu, grisée avec sa condition.
  const navLocked = nav?.style === "locked" && nav.closed.has(item.to);
  const plannerLocked = usePlayerStore((s) => item.lock === "planner" && !plannerUnlocked(s.player));
  const locked = navLocked || plannerLocked;
  if (locked) {
    const cls = typeof className === "function" ? className({ isActive: false, isPending: false, isTransitioning: false }) : className;
    const why = navLocked ? navCondition(item.to) : `à débloquer au Comptoir de la Ruche (${plannerPrice()} Ambre)`;
    return (
      <span
        role="link"
        aria-disabled="true"
        title={`${item.label} : ${why.charAt(0).toLowerCase()}${why.slice(1)}.`}
        aria-label={`${item.label}, verrouillé : ${why.charAt(0).toLowerCase()}${why.slice(1)}`}
        className={cn(cls, "pointer-events-auto relative cursor-not-allowed opacity-45 hover:translate-x-0")}
      >
        {typeof children === "function" ? children({ isActive: false, isPending: false, isTransitioning: false }) : children}
        <Lock className="absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" aria-hidden />
      </span>
    );
  }
  if (item.href) {
    const cls = typeof className === "function" ? className({ isActive: false, isPending: false, isTransitioning: false }) : className;
    return (
      <a href={item.href} target="_blank" rel="noopener" className={cls} title={rest.title} aria-label={rest["aria-label"]} onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement>}>
        {typeof children === "function" ? children({ isActive: false, isPending: false, isTransitioning: false }) : children}
      </a>
    );
  }
  return (
    <NavLink to={item.to} end={item.end} className={className} {...rest}>
      {children}
    </NavLink>
  );
}

interface NavGroup {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Couleur du groupe (variable CSS du thème). */
  accent: string;
  items: NavItem[];
}

/* v4.9.1 : six groupes thématiques, chacun sa couleur. Les pages d'information
   (profil, nouveautés, annonces, signalements) passent en pied de barre. */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "empire",
    label: "Empire",
    icon: Building2,
    accent: "var(--color-cyan-glow)",
    items: [
      { to: "/game", label: "Accueil", icon: LayoutDashboard, end: true },
      { to: "/game/ordres", label: "Ordres du jour", icon: ClipboardList },
      { to: "/game/ressources", label: "Ressources", icon: Factory },
      { to: "/game/batiments", label: "Bâtiments", icon: Building2 },
      { to: "/game/unites", label: "Unités", icon: Rocket },
      { to: "/game/labo", label: "Labo", icon: FlaskConical },
      { to: "/game/planificateur", label: "Planificateur", icon: CalendarClock, lock: "planner" },
      { to: "/game/etat-major", label: "État-major", icon: ShieldStar },
      { to: "/game/colonies", label: "Colonies", icon: Globe2 },
      { to: "/game/classe", label: "Classe d'empire", icon: Compass },
      { to: "/game/ascension", label: "Ascension", icon: Sparkles },
      { to: "/game/prestige", label: "Prestige", icon: Landmark },
      { to: "/game/statistiques", label: "Statistiques", icon: BarChart3 },
      { to: "/game/portefeuille", label: "Portefeuille", icon: Wallet },
    ],
  },
  {
    id: "operations",
    label: "Opérations",
    icon: Swords,
    accent: "var(--color-ember-glow)",
    items: [
      { to: "/game/missions", label: "Missions", icon: MapPin },
      { to: "/game/galaxie", label: "Galaxie", icon: Orbit },
      { to: "/game/combats", label: "Combats", icon: Swords },
      { to: "/game/simulateur", label: "Simulateur", icon: Calculator },
      { to: "/game/menaces", label: "Menaces", icon: Skull },
      { to: "/game/primes", label: "Primes", icon: Crosshair },
    ],
  },
  {
    id: "titans",
    label: "Grands ennemis",
    icon: Flame,
    accent: "var(--color-danger-glow)",
    items: [
      { to: "/game/uber", label: "Boss mondial", icon: Fish },
      { to: "/game/boss", label: "Boss de saison", icon: Flame },
      { to: "/game/seigneurs", label: "Seigneurs", icon: Crown },
      { to: "/game/hall-of-fame", label: "Hall of fame des boss", icon: Trophy },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Users,
    accent: "var(--color-mint-glow)",
    items: [
      { to: "/game/alliance", label: "Alliance", icon: Flag },
      { to: "/game/guerre-territoire", label: "Guerre de territoire", icon: MapIcon },
      { to: "/game/messages", label: "Communications", icon: Mail },
      { to: "/game/joueurs", label: "Classement", icon: Users },
      { to: "/game/commerce", label: "Commerce", icon: Store },
      { to: "/game/casino", label: "Casino", icon: Dices },
      { to: "/game/gazette", label: "Gazette", icon: Newspaper },
    ],
  },
  {
    id: "progression",
    label: "Progression",
    icon: Trophy,
    accent: "var(--color-gold-glow)",
    items: [
      { to: "/game/passe", label: "Passe", icon: Ticket },
      { to: "/game/chroniques", label: "Chroniques", icon: Scroll },
      { to: "/game/succes", label: "Succès", icon: Medal },
      { to: "/game/codex", label: "Codex", icon: BookOpen },
      { to: "/game/journal", label: "Journal", icon: ScrollText },
    ],
  },
  {
    id: "compte",
    label: "Compte",
    icon: UserCircle,
    accent: "var(--color-violet-glow)",
    items: [
      { to: "/game/profil", label: "Profil", icon: UserCircle },
      { to: "/game/nouveautes", label: "Nouveautés", icon: Sparkles },
      { to: "/game/annonces", label: "Annonces", icon: Megaphone },
      { to: "/game/signalements", label: "Signalements", icon: Bug },
      { to: "/bible", href: "/bible/index.html", label: "Bible du jeu", icon: BookMarked },
      { to: "/devblog", href: BLOG_URL, label: "Devblog", icon: Newspaper },
    ],
  },
];

/** Groupes listés dans la barre latérale ; le dernier (Compte) est en pied de barre. */
/** Pages cachées par une règle propre : casino fermé (sauf admin), concours (réservés aux admins depuis la 5.13),
 *  Ascension avant la première (5.15 : avant, raccourci sur Bâtiments). */
export function useHardHiddenRoutes(): ReadonlySet<string> {
  const casino = useCasinoVisible();
  const admin = useIsAdmin();
  const ascended = usePlayerStore((s) => (s.player?.ascensions ?? 0) > 0);
  return useMemo(() => {
    const hidden = new Set<string>();
    if (!casino) hidden.add("/game/casino");
    if (!admin) hidden.add("/game/concours");
    if (!ascended) hidden.add("/game/ascension");
    return hidden;
  }, [casino, admin, ascended]);
}

/* 6.14.75 (DP-L2, proposals/deblocage-progressif.md) : ouverture progressive du menu (moteur `navUnlock.ts`, I30).
   Un seul calcul pour la barre latérale, la barre mobile, la palette Ctrl+K et les cartes de l'accueil. */
export interface NavUnlockView {
  status: NavStatus;
  /** Pages réglées encore fermées (vide hors du mode progressif). */
  closed: ReadonlySet<string>;
  /** Pages ouvertes jamais visitées : pastille « Nouveau » jusqu'à la première visite. */
  fresh: ReadonlySet<string>;
  /** Pages ouvertes seulement par un signal passager (flotte hostile) : la marque les garde ouvertes. */
  transient: string[];
  next: NavNextOpening | null;
  style: "hidden" | "locked";
}

const NavUnlockContext = createContext<NavUnlockView | null>(null);

/** Données du menu hors de la fiche du joueur : administrateur, flotte hostile en approche (signal `danger`). */
function useNavFlags(): { admin: boolean; hostileIncoming: boolean } {
  const admin = useIsAdmin();
  const uid = useAuthStore((s) => s.user?.uid);
  const hostileIncoming = useFleetStore((s) => s.fleets.some((f) => isHostile(f, uid)));
  return { admin, hostileIncoming };
}

/** Libellés des pages qu'une étape du tutoriel ouvre (« Débloque : Missions » sur la carte de l'étape). */
export function useStepOpens(step: string | undefined): string[] {
  const player = usePlayerStore((s) => s.player);
  const { admin, hostileIncoming } = useNavFlags();
  return useMemo(() => (player && step ? navPagesOpenedByStep(player, step, { now: Date.now(), admin, hostileIncoming }).map(navLabel) : []), [player, step, admin, hostileIncoming]);
}

export function useNavUnlock(): NavUnlockView {
  const player = usePlayerStore((s) => s.player);
  const { admin, hostileIncoming } = useNavFlags();
  return useMemo(() => {
    const style = NAV_UNLOCK_RULES.style === "locked" ? "locked" : "hidden";
    if (!player) return { status: "disabled", closed: new Set<string>(), fresh: new Set<string>(), transient: [], next: null, style };
    const ctx: NavContext = { now: Date.now(), admin, hostileIncoming };
    const status = navStatus(player, ctx);
    const closed = new Set(navClosedPages(player, ctx));
    const progressive = status === "progressive";
    const open = progressive ? [...navOpenPages(player, ctx)] : [];
    const fresh = new Set(open.filter((page) => !navPageMarked(player, page)));
    const transient = hostileIncoming && progressive ? open.filter((page) => !navPageMarked(player, page) && navClosedPages(player, { ...ctx, hostileIncoming: false }).includes(page)) : [];
    return { status, closed, fresh, transient, next: progressive ? nextNavOpening(player, ctx) : null, style };
  }, [player, admin, hostileIncoming]);
}

/** Pages cachées du menu : règles propres (casino, concours, Ascension) et pages pas encore ouvertes (`navUnlock`, style « hidden »). */
export function useHiddenRoutes(): ReadonlySet<string> {
  const hard = useHardHiddenRoutes();
  const nav = useNavUnlock();
  return useMemo(() => (nav.style === "hidden" && nav.closed.size > 0 ? new Set([...hard, ...nav.closed]) : hard), [hard, nav]);
}

/** Marque `nav:<page>` à la première visite d'une page réglée, et tout de suite pour une page ouverte par un danger passager
 *  (action `seenAnnouncements`, comme les astuces) : une page ouverte ne se referme jamais. Rien n'est écrit hors du mode progressif. */
const marksSent = new Set<string>();
function useNavMarks(nav: NavUnlockView) {
  const { pathname } = useLocation();
  const progressive = nav.status === "progressive";
  const here = Object.keys(NAV_UNLOCK_RULES.pages).find((page) => pathname === page || pathname.startsWith(`${page}/`)) ?? null;
  // Page fraîchement ouverte, ou page fermée atteinte par un lien, Ctrl+K ou un objectif (ouverture par l'intention).
  const visit = here && (nav.fresh.has(here) || nav.closed.has(here)) ? here : null;
  const transientKey = nav.transient.join(",");
  useEffect(() => {
    if (!progressive) return;
    const pages = [...(visit ? [visit] : []), ...(transientKey ? transientKey.split(",") : [])];
    const ids = pages.map(navMarkId).filter((id) => !marksSent.has(id));
    if (ids.length === 0) return;
    for (const id of ids) marksSent.add(id);
    // Échec silencieux : la page reste ouverte par son déclencheur, la marque repartira à la prochaine visite.
    void markAnnouncementsSeen(ids).catch(() => {
      for (const id of ids) marksSent.delete(id);
    });
  }, [progressive, visit, transientKey]);
}

function useNavGroups(): NavGroup[] {
  const hidden = useHardHiddenRoutes();
  const nav = useContext(NavUnlockContext);
  return useMemo(() => {
    const hide = new Set([...hidden, ...(nav?.style === "hidden" ? nav.closed : [])]);
    if (hide.size === 0) return NAV_GROUPS;
    // Groupe vide (Opérations, Grands ennemis, Progression à J0) : caché ; le pied de barre (Compte) reste.
    return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !hide.has(i.to)) })).filter((g, i, all) => g.items.length > 0 || i === all.length - 1);
  }, [hidden, nav]);
}

/** Libellé d'une page du menu. */
function navLabel(to: string): string {
  return NAV_GROUPS.flatMap((g) => g.items).find((i) => i.to === to)?.label ?? to;
}

/** « Prochaine ouverture : Galaxie et Alliance · 40 / 100 XP » (une ligne grisée sous le menu). */
function NextOpeningLine({ className }: { className?: string }) {
  const nav = useContext(NavUnlockContext);
  const next = nav?.next;
  if (!next || next.pages.length === 0) return null;
  const labels = next.pages.map(navLabel);
  // Trois noms au plus (la liste complète au survol) : la ligne reste courte au palier « Commandant » (8 pages).
  const shown = labels.length > 3 ? [...labels.slice(0, 2), `${labels.length - 2} autres`] : labels;
  const list = shown.length > 1 ? `${shown.slice(0, -1).join(", ")} et ${shown[shown.length - 1]}` : shown[0];
  return (
    <p className={cn("text-[11px] leading-snug text-slate-500", className)} title={`À ${next.rankName} : ${labels.join(", ")}`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Prochaine ouverture</span> : {list} ·{" "}
      <span className="font-mono tabular-nums">
        {formatCompact(next.xp)} / {formatCompact(next.targetXp)} XP
      </span>
    </p>
  );
}

/** Pastille « Nouveau » d'une page qui vient de s'ouvrir (jusqu'à la première visite). */
function useIsFresh(to: string): boolean {
  const nav = useContext(NavUnlockContext);
  return !!nav?.fresh.has(to);
}

const SIDE_GROUPS = NAV_GROUPS.slice(0, -1);
const FOOTER_GROUP = NAV_GROUPS[NAV_GROUPS.length - 1];

/** 5.15 : pages sorties du menu mais toujours trouvables (Ctrl+K) : Formules (aussi depuis
 *  Statistiques), Palmarès (lien des notifications de fin de saison), Concours (depuis le Casino, admins). */
const PALETTE_ONLY: NavItem[] = [
  { to: "/game/formules", label: "Formules", icon: Sigma },
  { to: "/game/palmares", label: "Palmarès", icon: Trophy },
  { to: "/game/concours", label: "Concours", icon: Gift },
];

export const ALL_NAV_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), ...PALETTE_ONLY];
const ALL_ITEMS = ALL_NAV_ITEMS;

/** Pastilles de navigation : renvoie le compteur d'une page. */
function useBadges(): (to: string) => number {
  const allianceUnread = useAllianceUnreadStore((s) => s.count) + usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const changelogUnread = useUnreadChangelogCount();
  const reportsUnread = useReportBadges((s) => s.unread);
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid)) + useGlobalUnreadCount(useAuthStore((s) => s.user?.uid));
  const leviathan = useLeviathan();
  const leviathanSeen = useLeviathanSeen((s) => s.ids);
  // 5.30 : pastille unique des récompenses prêtes (série, missions, contrats, passe, Chroniques…), = « Tout réclamer ».
  const ordersReady = usePlayerStore((s) => (s.player ? ordersReadyCount(s.player, Date.now()) : 0));
  // Léviathan : pastille tant que le joueur n'a pas ouvert la page pendant cette apparition.
  const leviathanNew = leviathan && isActive(leviathan, Date.now()) && !leviathanSeen.includes(leviathan.id) ? 1 : 0;
  return (to) =>
    ({
      "/game/ordres": ordersReady,
      "/game/messages": messagesUnread,
      "/game/uber": leviathanNew,
      "/game/alliance": allianceUnread,
      "/game/nouveautes": changelogUnread,
      "/game/signalements": reportsUnread,
    })[to] ?? 0;
}

function useBadge(to: string): number {
  return useBadges()(to);
}

/** 6.14.86 (couleur = sens) : ton de la pastille de chaque page. Récompenses prêtes en or, Léviathan en violet
 *  (événement), signalements à traiter en orange (attention) ; messages, alliance et notes de version en neutre (lectures).
 *  Le rouge reste aux menaces : aucune pastille du menu n'en est une aujourd'hui. */
type BadgeTone = "neutral" | "gold" | "violet" | "ember" | "danger";
const BADGE_TONE: Record<string, BadgeTone> = {
  "/game/ordres": "gold",
  "/game/uber": "violet",
  "/game/signalements": "ember",
};
const badgeTone = (to: string): BadgeTone => BADGE_TONE[to] ?? "neutral";
/** Ton d'un groupe replié : le plus fort de ses pages (danger > attention > récompense > événement > lecture). */
const TONE_RANK: BadgeTone[] = ["neutral", "violet", "gold", "ember", "danger"];
const strongestTone = (tones: BadgeTone[]): BadgeTone => tones.reduce<BadgeTone>((a, t) => (TONE_RANK.indexOf(t) > TONE_RANK.indexOf(a) ? t : a), "neutral");
const BADGE_CLASS: Record<BadgeTone, string> = {
  neutral: "border border-slate-400/60 bg-space-800 text-slate-100",
  gold: "bg-gold-glow text-space-950",
  violet: "bg-violet-glow text-space-950",
  ember: "bg-ember-glow text-space-950",
  danger: "bg-danger-glow text-space-950",
};
/** Point de la barre réduite et des liens du pied : même ton que la pastille. */
const DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-slate-300",
  gold: "bg-gold-glow shadow-[0_0_6px_var(--color-gold-glow)]",
  violet: "bg-violet-glow shadow-[0_0_6px_var(--color-violet-glow)]",
  ember: "bg-ember-glow shadow-[0_0_6px_var(--color-ember-glow)]",
  danger: "bg-danger-glow shadow-[0_0_6px_var(--color-danger-glow)]",
};

/** 5.15.9 : pastille en colonne, à droite du libellé (toutes alignées). */
function InlineBadge({ count, tone }: { count: number; tone: BadgeTone }) {
  if (count <= 0) return null;
  return <span className={cn("grid h-4 min-w-4 shrink-0 place-items-center px-1 font-mono text-[11px] font-bold leading-none tabular-nums", BADGE_CLASS[tone])}>{count > 99 ? "99+" : count}</span>;
}

function Badge({ count, tone }: { count: number; tone: BadgeTone }) {
  if (count <= 0) return null;
  return (
    <span className={cn("absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center px-0.5 font-mono text-[11px] font-bold leading-none tabular-nums", BADGE_CLASS[tone])}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Point d'état posé sur l'icône (pulsant pendant le combat). */
function BossDot({ phase, className }: { phase: BossPhase | null; className?: string }) {
  if (!phase) return null;
  const { color, label } = BOSS_NAV[phase];
  return (
    <span aria-label={label} title={label} className={cn("absolute -bottom-1 -right-1 grid h-2.5 w-2.5 place-items-center", className)}>
      {phase === "active" && <span className="absolute inset-0 animate-ping rounded-full opacity-75" style={{ background: color }} />}
      <span className="relative h-2 w-2 rounded-full border border-space-950" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    </span>
  );
}

/** Pastille de texte à droite du libellé (barre latérale). */
function BossChip({ info }: { info: { phase: BossPhase; returnMs: number | null; now: number } }) {
  const { chip, full } = bossNavText(info);
  // DESIGN.md : pastille d'état = HudChip (ton = sens : danger en combat, mint abattu, ember retiré, neutre en sommeil).
  return (
    <HudChip size="sm" tone={BOSS_TONE[info.phase]} title={full} className="shrink-0 whitespace-nowrap px-1 py-px text-[11px] tabular-nums tracking-[0.08em]">
      {chip}
    </HudChip>
  );
}

/** Classes de l'icône selon l'état : rouge en combat, vert abattu, éteinte en sommeil. */
function bossIconClass(phase: BossPhase | null): string {
  if (phase === "active") return "text-danger-glow drop-shadow-[0_0_6px_var(--color-danger-glow)]";
  if (phase === "killed") return "text-mint-glow";
  if (phase === "failed") return "text-ember-glow";
  if (phase === "dormant") return "opacity-50";
  return "";
}

/** Lien de la barre latérale (bureau), aux couleurs de son groupe (--nav-accent). */
function SideLink({ item, badge }: { item: NavItem; badge: number }) {
  const bossInfo = useBossNavInfo(item.to);
  const fresh = useIsFresh(item.to);
  const phase = bossInfo?.phase ?? null;
  return (
    <ItemLink
      item={item}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 py-2 pl-3 pr-2.5 font-display text-[12.5px] font-semibold uppercase tracking-[0.09em] transition-all duration-200",
          "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-[var(--nav-accent)] before:shadow-[0_0_12px_var(--nav-accent)] before:transition-transform before:duration-200",
          isActive
            ? "bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_24%,transparent)] via-[color-mix(in_srgb,var(--nav-accent)_7%,transparent)] to-transparent text-slate-100 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--nav-accent)_22%,transparent)] before:scale-y-100"
            : "text-slate-400 before:scale-y-0 hover:translate-x-0.5 hover:bg-white/[0.03] hover:text-slate-100",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Le badge reste hors de la case découpée (clip-path), sinon il est rogné. */}
          <span className="relative shrink-0">
            <span
              className={cn(
                "hud-cut-sm grid h-6 w-6 place-items-center border transition-colors",
                isActive
                  ? "border-[color-mix(in_srgb,var(--nav-accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--nav-accent)_15%,transparent)] text-[var(--nav-accent)]"
                  : "border-white/[0.06] bg-space-900/60 group-hover:border-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] group-hover:text-[var(--nav-accent)]",
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5", bossIconClass(phase))} />
            </span>
            <BossDot phase={phase} />
          </span>
          <span className={cn("min-w-0 flex-1 truncate", phase === "dormant" && !isActive && "text-slate-500")}>{item.label}</span>
          {bossInfo && <BossChip info={bossInfo} />}
          <InlineBadge count={badge} tone={badgeTone(item.to)} />
          {fresh && !badge && !isActive && (
            <HudChip size="sm" tone="accent" className="shrink-0 px-1 py-px text-[11px] tracking-[0.08em]">
              Nouveau
            </HudChip>
          )}
          {isActive && !badge && <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--nav-accent)] shadow-[0_0_8px_var(--nav-accent)]" />}
        </>
      )}
    </ItemLink>
  );
}

const COLLAPSED_KEY = "cosmic-empires:nav-collapsed";

function readCollapsed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Section repliable de la barre latérale. Repliée, elle reste ouverte si on est sur une de ses pages. */
function SideGroup({ group, collapsed, onToggle, badgeOf }: { group: NavGroup; collapsed: boolean; onToggle: () => void; badgeOf: (to: string) => number }) {
  const { pathname } = useLocation();
  const here = group.items.some((i) => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`)));
  const open = !collapsed || here;
  const total = group.items.reduce((sum, i) => sum + badgeOf(i.to), 0);
  return (
    <div className="mb-3" style={{ "--nav-accent": group.accent } as React.CSSProperties}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group/h flex w-full items-center gap-2 px-3 pb-1.5 pt-2.5 text-left"
      >
        <span className="grid h-4 w-4 place-items-center text-[var(--nav-accent)] opacity-80">
          <group.icon className="h-3 w-3" />
        </span>
        <span className="hud-eyebrow text-[11px] text-slate-500 transition-colors group-hover/h:text-slate-300">{group.label}</span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] to-transparent" />
        {!open && total > 0 && (
          <InlineBadge count={total} tone={strongestTone(group.items.filter((i) => badgeOf(i.to) > 0).map((i) => badgeTone(i.to)))} />
        )}
        <ChevronDown className={cn("h-3 w-3 text-slate-600 transition-transform duration-200 group-hover/h:text-slate-300", !open && "-rotate-90")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          {group.items.map((item) => (
            <SideLink key={item.to} item={item} badge={badgeOf(item.to)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pied de barre : pages du compte en rangée d'icônes. */
function FooterLinks({ badgeOf }: { badgeOf: (to: string) => number }) {
  return (
    <div className="grid grid-cols-5 gap-1 px-3 pb-2" style={{ "--nav-accent": FOOTER_GROUP.accent } as React.CSSProperties}>
      {FOOTER_GROUP.items.map((item) => (
        <ItemLink
          key={item.to}
          item={item}
          title={item.label}
          aria-label={item.label}
          className={({ isActive }) =>
            cn(
              "hud-cut-sm relative grid h-8 place-items-center border transition-colors",
              isActive
                ? "border-[color-mix(in_srgb,var(--nav-accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--nav-accent)_15%,transparent)] text-[var(--nav-accent)]"
                : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] hover:text-[var(--nav-accent)]",
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {badgeOf(item.to) > 0 && <span className={cn("absolute right-1 top-1 h-1.5 w-1.5 rounded-full", DOT_CLASS[badgeTone(item.to)])} />}
        </ItemLink>
      ))}
    </div>
  );
}

/** Carte du commandant : emblème, pseudo, rang et progression. */
function CommanderCard() {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const progress = getRankProgress(player.xp);
  return (
    <Link to="/game/profil" className="group relative mx-3 block border border-cyan-glow/15 bg-gradient-to-br from-cyan-glow/[0.07] to-transparent p-3 transition-colors hover:border-cyan-glow/40 hud-cut">
      <div className="flex items-center gap-3">
        <img src={getRankIcon(player.xp)} alt="" className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-cyan-glow)_30%,transparent)] transition-transform group-hover:scale-105" />
        <div className="min-w-0 flex-1">
          {/* 5.15.4 : le pseudo a toute la largeur (retour à la ligne plutôt que « Nico… ») ; badge d'équipe avec le rang. */}
          <p className="flex flex-wrap items-center gap-x-1.5 font-display text-[15px] font-bold leading-tight tracking-[0.02em] text-slate-100">
            <PlayerName presence={false} uid={player.uid} pseudo={player.pseudo} allianceId={player.allianceId || null} className="min-w-0 [overflow-wrap:anywhere]" />
            <AscensionStars count={player.ascensions} />
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-glow">
            <span className="truncate">{getRankLabel(player.xp)}</span>
            <StaffBadge uid={player.uid} compact />
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between font-mono text-[11px] text-slate-500">
        <span>{formatCompact(player.xp)} XP</span>
        <span>{progress.next ? `→ ${progress.next}` : "Rang max"}</span>
      </div>
      <div className="mt-1 h-1 bg-white/[0.06]">
        <div className="hud-sheen h-full bg-gradient-to-r from-cyan-glow to-mint-glow" style={{ width: `${progress.percent}%` }} />
      </div>
    </Link>
  );
}

/* v4.9.3 : barre réduite (icônes seules). Automatique entre 768 et 1279 px,
   ou forcée par le joueur ; le choix est mémorisé sur l'appareil. */
type SidebarMode = "auto" | "compact" | "full";
const MODE_KEY = "cosmic-empires:nav-mode";

function readMode(): SidebarMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === "compact" || v === "full" ? v : "auto";
  } catch {
    return "auto";
  }
}

function useWideScreen(): boolean {
  const query = "(min-width: 1280px)";
  const [wide, setWide] = useState(() => typeof window === "undefined" || window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

function CompactLink({ item, badge }: { item: NavItem; badge: number }) {
  const bossInfo = useBossNavInfo(item.to);
  const phase = bossInfo?.phase ?? null;
  const fresh = useIsFresh(item.to);
  return (
    <ItemLink
      item={item}
      title={bossInfo ? `${item.label} · ${bossNavText(bossInfo).full}` : fresh ? `${item.label} · nouveau` : item.label}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          "hud-cut-sm relative mx-auto grid h-9 w-9 place-items-center border transition-colors",
          isActive
            ? "border-[color-mix(in_srgb,var(--nav-accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--nav-accent)_16%,transparent)] text-[var(--nav-accent)] shadow-[0_0_12px_-4px_var(--nav-accent)]"
            : "border-transparent text-slate-500 hover:border-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] hover:text-[var(--nav-accent)]",
        )
      }
    >
      <item.icon className={cn("h-4 w-4", bossIconClass(phase))} />
      {badge > 0 && <span className={cn("absolute right-0.5 top-0.5 h-2 w-2 rounded-full", DOT_CLASS[badgeTone(item.to)])} />}
      {fresh && !badge && <span aria-hidden className="absolute right-0.5 top-0.5 h-2 w-2 rotate-45 bg-cyan-glow" />}
      <BossDot phase={phase} className="bottom-0.5 right-0.5" />
    </ItemLink>
  );
}

function CompactSidebar({ badgeOf, onExpand }: { badgeOf: (to: string) => number; onExpand: () => void }) {
  const navGroups = useNavGroups();
  const player = usePlayerStore((s) => s.player);
  return (
    <aside className="relative z-30 hidden h-screen w-[4.25rem] shrink-0 flex-col items-stretch border-r border-cyan-glow/10 bg-space-950/80 backdrop-blur-xl md:flex">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-glow/50 via-cyan-glow/5 to-violet-glow/40" />
      <Link to="/game" className="mx-auto pb-3 pt-4" title="Cosmic Empires">
        <img src={assetUrl("/assets/logo/logo.webp")} alt="Cosmic Empires" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-cyan-glow)_35%,transparent)]" />
      </Link>
      {player && (
        <Link to="/game/profil" className="mx-auto mb-2" title={`${player.pseudo} · ${getRankLabel(player.xp)}`}>
          <img src={getRankIcon(player.xp)} alt="" className="h-9 w-9 object-contain transition-transform hover:scale-110" />
        </Link>
      )}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pb-3">
        {navGroups.slice(0, -1).map((group) => (
          <div key={group.id} className="flex flex-col gap-0.5" style={{ "--nav-accent": group.accent } as React.CSSProperties}>
            <span aria-hidden title={group.label} className="mx-auto my-1.5 h-px w-7 bg-[color-mix(in_srgb,var(--nav-accent)_45%,transparent)]" />
            {group.items.map((item) => (
              <CompactLink key={item.to} item={item} badge={badgeOf(item.to)} />
            ))}
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-0.5 border-t border-cyan-glow/10 py-2" style={{ "--nav-accent": FOOTER_GROUP.accent } as React.CSSProperties}>
        {FOOTER_GROUP.items.map((item) => (
          <CompactLink key={item.to} item={item} badge={badgeOf(item.to)} />
        ))}
        <CockpitSwitch compact className="mx-auto mt-1" />
        <button type="button" onClick={onExpand} title="Déplier la barre" aria-label="Déplier la barre" className="mx-auto mt-1 grid h-8 w-9 place-items-center text-slate-500 hover:text-cyan-glow">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

/** Interrupteur « Vue cockpit » : l'accueil devient un poste de commande. */
function CockpitSwitch({ className, compact }: { className?: string; compact?: boolean }) {
  const on = useCockpitView((s) => s.enabled);
  const navigate = useNavigate();
  const toggle = (next: boolean) => {
    setCockpitView(next);
    if (next) navigate("/game");
  };
  if (compact) {
    return (
      <button type="button" role="switch" aria-checked={on} onClick={() => toggle(!on)} title={on ? "Vue cockpit : activée" : "Vue cockpit : désactivée"} aria-label="Vue cockpit" className={cn("hud-cut-sm grid h-8 w-9 place-items-center border", on ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-500 hover:text-cyan-glow", className)}>
        <Gauge className="h-4 w-4" />
      </button>
    );
  }
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 border-t border-white/5 pt-2", className)}>
      <Gauge className={cn("h-3.5 w-3.5 shrink-0", on ? "text-cyan-glow" : "text-slate-500")} />
      <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-300">Vue cockpit</span>
      <HudSwitch checked={on} onCheckedChange={toggle} label="Vue cockpit" />
    </label>
  );
}

/** 6.14.62 : plein écran dans le menu mobile (son bouton a quitté l'en-tête du téléphone pour laisser la place au nom). */
function FullscreenSwitch({ className }: { className?: string }) {
  const [on, setOn] = useState(isFullscreen());
  useEffect(() => {
    const sync = () => setOn(isFullscreen());
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!fullscreenSupported()) return null;
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 border-t border-white/5 pt-2", className)}>
      <Maximize className={cn("h-3.5 w-3.5 shrink-0", on ? "text-cyan-glow" : "text-slate-500")} />
      <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-300">Plein écran</span>
      <HudSwitch checked={on} onCheckedChange={() => void toggleFullscreen()} label="Plein écran" />
    </label>
  );
}

/** Barre latérale (bureau). */
function Sidebar() {
  const navGroups = useNavGroups();
  const badgeOf = useBadges();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mode, setModeState] = useState(readMode);
  const wide = useWideScreen();
  const setMode = (m: SidebarMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* non mémorisé */
    }
  };
  const compact = mode === "compact" || (mode === "auto" && !wide);
  // Déplier depuis l'automatique sur écran moyen force le mode complet ; replier sur grand écran force le compact.
  if (compact) return <CompactSidebar badgeOf={badgeOf} onExpand={() => setMode(wide ? "auto" : "full")} />;
  return (
    <aside className="relative z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-cyan-glow/10 bg-space-950/80 backdrop-blur-xl md:flex">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-glow/50 via-cyan-glow/5 to-violet-glow/40" />
      <Link to="/game" className="flex items-center gap-3 px-4 pb-4 pt-5">
        <img src={assetUrl("/assets/logo/logo.webp")} alt="" className="h-11 w-11 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-cyan-glow)_35%,transparent)]" />
        <div className="leading-none">
          <p className="font-display text-lg font-bold uppercase tracking-[0.16em] text-slate-100">Cosmic</p>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.42em] text-cyan-glow">Empires</p>
        </div>
      </Link>
      <CommanderCard />
      <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        {navGroups.slice(0, -1).map((group) => (
          <SideGroup
            key={group.id}
            group={group}
            badgeOf={badgeOf}
            collapsed={collapsed.includes(group.id)}
            onToggle={() => {
              const next = collapsed.includes(group.id) ? collapsed.filter((g) => g !== group.id) : [...collapsed, group.id];
              setCollapsed(next);
              try {
                localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
              } catch {
                /* non mémorisé */
              }
            }}
          />
        ))}
        <NextOpeningLine className="mx-1 mt-1 border-t border-white/5 px-2 pt-2.5" />
      </nav>
      <div className="border-t border-cyan-glow/10 pt-2.5">
        <FooterLinks badgeOf={badgeOf} />
      </div>
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between">
          <SignalIndicator />
          <LiveClock />
          <button type="button" onClick={() => setMode(wide ? "compact" : "auto")} title="Réduire la barre" aria-label="Réduire la barre" className="text-slate-500 hover:text-cyan-glow">
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>
        <CockpitSwitch className="mt-2" />
        {CURRENT_VERSION && (
          <NavLink to="/game/nouveautes" className="mt-1.5 block font-mono text-[11px] tracking-[0.14em] text-slate-500 hover:text-cyan-glow">
            BUILD v{CURRENT_VERSION}
          </NavLink>
        )}
      </div>
    </aside>
  );
}

/* ---------- mobile : barre d'onglets + menu complet ---------- */

/** v4.5 : onglets épinglés par le joueur (4 au plus), mémorisés sur l'appareil. Onglets par défaut : `DEFAULT_TABS` (6.14.64). */
const TABS_KEY = "cosmic-empires:mobile-tabs";
const MAX_TABS = 4;

function readTabs(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(TABS_KEY) ?? "null") as unknown;
    if (Array.isArray(raw)) {
      const valid = raw.filter((t): t is string => typeof t === "string" && ALL_NAV_ITEMS.some((i) => i.to === t)).slice(0, MAX_TABS);
      if (valid.length > 0) return valid;
    }
  } catch {
    /* valeurs par défaut */
  }
  return DEFAULT_TABS;
}

function saveTabs(tabs: string[]) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch {
    /* non mémorisé */
  }
}

function TabLink({ item }: { item: NavItem }) {
  const badge = useBadge(item.to);
  const bossInfo = useBossNavInfo(item.to);
  const phase = bossInfo?.phase ?? null;
  return (
    <ItemLink
      item={item}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.03em] transition-colors",
          "before:absolute before:inset-x-[25%] before:top-0 before:h-0.5 before:bg-cyan-glow before:shadow-[0_0_10px_var(--color-cyan-glow)] before:transition-opacity",
          isActive ? "text-cyan-glow before:opacity-100" : "text-slate-500 before:opacity-0",
        )
      }
    >
      <span className="relative">
        <item.icon className={cn("h-5 w-5", bossIconClass(phase))} />
        <Badge count={badge} tone={badgeTone(item.to)} />
        {!badge && <BossDot phase={phase} />}
      </span>
      <TileLabel>{item.label}</TileLabel>
    </ItemLink>
  );
}

/** 6.14.98 (TH-L2, TH-9) : libellé de tuile du menu « Plus » ; un mot long (« COMMUNICATIONS » en Inter) se coupe dans la tuile au
 *  lieu de déborder sur la voisine. */
function TileLabel({ children }: { children: ReactNode }) {
  return (
    <span lang="fr" className="max-w-full text-center [hyphens:auto] [overflow-wrap:break-word]">
      {children}
    </span>
  );
}

function MobileMenu({ open, onClose, tabs, onTabsChange }: { open: boolean; onClose: () => void; tabs: string[]; onTabsChange: (tabs: string[]) => void }) {
  const navGroups = useNavGroups();
  const [editing, setEditing] = useState(false);
  const toggle = (to: string) => {
    if (tabs.includes(to)) {
      if (tabs.length > 1) onTabsChange(tabs.filter((t) => t !== to));
    } else if (tabs.length < MAX_TABS) onTabsChange([...tabs, to]);
    else onTabsChange([...tabs.slice(1), to]);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setEditing(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[80vh]">
        <div className="flex items-center gap-3 pr-8">
          <DialogTitle className="hud-title text-base">Navigation</DialogTitle>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className={cn("ml-auto border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em]", editing ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400")}
          >
            {editing ? "Terminé" : "Épingler"}
          </button>
        </div>
        {editing && <p className="mt-2 text-xs text-slate-400">Touche une page pour l'épingler dans la barre du bas ({tabs.length} / {MAX_TABS}).</p>}
        <div className="mt-3 flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.id} style={{ "--nav-accent": group.accent } as React.CSSProperties}>
              <p className="hud-eyebrow mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                <group.icon className="h-3 w-3 text-[var(--nav-accent)]" />
                {group.label}
                <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] to-transparent" />
              </p>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) =>
                  editing ? (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => toggle(item.to)}
                      className={cn(
                        "hud-cut relative flex flex-col items-center gap-1.5 border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.04em]",
                        tabs.includes(item.to) ? "border-gold-glow/60 bg-gold-glow/10 text-gold-glow" : "border-white/10 bg-white/[0.02] text-slate-400",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <TileLabel>{item.label}</TileLabel>
                      {tabs.includes(item.to) && <Pin className="absolute right-1.5 top-1.5 h-3 w-3" />}
                    </button>
                  ) : (
                    <MenuTile key={item.to} item={item} onClick={onClose} />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <NextOpeningLine className="mt-4 border-t border-white/5 pt-3" />
        <div onClickCapture={onClose}>
          <CockpitSwitch className="mt-4" />
        </div>
        <FullscreenSwitch className="mt-2" />
      </DialogContent>
    </Dialog>
  );
}

function MenuTile({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const badge = useBadge(item.to);
  const fresh = useIsFresh(item.to);
  const bossInfo = useBossNavInfo(item.to);
  const phase = bossInfo?.phase ?? null;
  return (
    <ItemLink
      item={item}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "hud-cut flex flex-col items-center gap-1.5 border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.04em]",
          isActive ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-cyan-glow/10 bg-white/[0.02] text-slate-300",
        )
      }
    >
      <span className="relative">
        <item.icon className={cn("h-5 w-5", bossIconClass(phase))} />
        <Badge count={badge} tone={badgeTone(item.to)} />
        {!badge && <BossDot phase={phase} />}
      </span>
      <TileLabel>{item.label}</TileLabel>
      {fresh && !badge && (
        <HudChip size="sm" tone="accent" className="-mt-1 px-1 py-px text-[11px] tracking-[0.08em]">
          Nouveau
        </HudChip>
      )}
      {bossInfo && (
        <span className="-mt-1 whitespace-nowrap font-mono text-[11px] tabular-nums tracking-[0.08em]" style={{ color: BOSS_NAV[bossInfo.phase].color }}>
          {bossNavText(bossInfo).chip}
        </span>
      )}
    </ItemLink>
  );
}

function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const [tabIds, setTabIds] = useState(readTabs);
  const location = useLocation();
  const allianceUnread = useAllianceUnreadStore((s) => s.count) + usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const reportsUnread = useReportBadges((r) => r.unread);
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid)) + useGlobalUnreadCount(useAuthStore((s) => s.user?.uid));
  const hard = useHardHiddenRoutes();
  const nav = useContext(NavUnlockContext);
  const hidden = new Set([...hard, ...(nav?.style === "hidden" ? nav.closed : [])]);
  // 6.14.75 (DP-L2) : un onglet épinglé pas encore ouvert (Galaxie à J0) laisse sa place à Labo, puis Ressources.
  const shown = tabIds.filter((to) => !hidden.has(to));
  for (const fallback of ["/game/labo", "/game/ressources", "/game/ordres"]) if (shown.length < tabIds.length && !shown.includes(fallback) && !hidden.has(fallback)) shown.push(fallback);
  const tabs = shown.map((to) => ALL_NAV_ITEMS.find((i) => i.to === to)!).filter((i) => !!i);
  const moreCount = moreBadgeCount({ messages: messagesUnread, alliance: allianceUnread, reports: reportsUnread }, tabs.map((t) => t.to));
  const inMenu = !tabs.some((t) => (t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)));
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-cyan-glow/20 bg-space-950/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/60 to-transparent" />
        {tabs.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex flex-1 flex-col items-center gap-1 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.03em]",
            "before:absolute before:inset-x-[25%] before:top-0 before:h-0.5 before:bg-cyan-glow before:shadow-[0_0_10px_var(--color-cyan-glow)]",
            inMenu ? "text-cyan-glow before:opacity-100" : "text-slate-500 before:opacity-0",
          )}
        >
          <span className="relative">
            <LayoutGrid className="h-5 w-5" />
            <Badge count={moreCount} tone="neutral" />
          </span>
          Plus
        </button>
      </nav>
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        tabs={tabIds}
        onTabsChange={(next) => {
          setTabIds(next);
          saveTabs(next);
        }}
      />
    </>
  );
}

export function NavBar() {
  const nav = useNavUnlock();
  useNavMarks(nav);
  return (
    <NavUnlockContext.Provider value={nav}>
      <Sidebar />
      <MobileTabBar />
    </NavUnlockContext.Provider>
  );
}
