import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { useEffect, useMemo, useState } from "react";
import { bossPhase, isActive, type BossPhase } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { useSeasonBoss } from "@/services/seasonBossService";
import { assetUrl } from "@/lib/assets";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { setCockpitView, useCockpitView } from "@/lib/cockpitView";
import { useCasinoVisible } from "@/services/casinoService";
import { useIsAdmin } from "@/services/adminService";
import { HudSwitch } from "@/components/ui/hud";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Orbit, Users, Swords, Flag, UserCircle, Sparkles, Trophy, Skull, Medal, LayoutGrid, Bug, Calculator, Store, Fish, Globe2, ScrollText, Mail, Crosshair, Shield as ShieldStar, Ticket, Scroll, Crown, Flame, Pin, Newspaper, Megaphone, BookOpen, BookMarked, Sigma, BarChart3, ChevronDown, ChevronsLeft, ChevronsRight, Gift, Gauge, Dices } from "lucide-react";
import { useLeviathanSeen } from "@/store/leviathanSeenStore";
import { BLOG_URL } from "@/services/blogService";
import { CURRENT_VERSION, useUnreadChangelogCount } from "@/lib/changelog";
import { cn, formatCompact } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SignalIndicator } from "@/components/layout/SignalIndicator";
import { LiveClock } from "@/components/layout/LiveClock";
import { usePlayerStore } from "@/store/playerStore";
import { getRankIcon, getRankLabel, getRankProgress } from "@/game/ranks";
import { useAllianceUnreadStore } from "@/store/allianceUnreadStore";
import { usePactUnreadStore } from "@/services/diplomacyService";
import { passState, passTier } from "@/game/seasonPass";
import { StaffBadge } from "@/components/ui/staff-badge";
import { useReportBadges } from "@/services/reportService";
import { useUnreadMessageCount } from "@/services/messageService";
import { useAuthStore } from "@/store/authStore";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** v5.1 : page hors de l'application, ouverte dans un nouvel onglet. */
  href?: string;
}

type ItemLinkProps = Omit<React.ComponentProps<typeof NavLink>, "to"> & { item: NavItem };

/** NavLink, ou lien externe (nouvel onglet) pour les pages hors application. */
function ItemLink({ item, className, children, end: _end, ...rest }: ItemLinkProps) {
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
      { to: "/game/ressources", label: "Ressources", icon: Factory },
      { to: "/game/batiments", label: "Bâtiments", icon: Building2 },
      { to: "/game/unites", label: "Unités", icon: Rocket },
      { to: "/game/labo", label: "Labo", icon: FlaskConical },
      { to: "/game/etat-major", label: "État-major", icon: ShieldStar },
      { to: "/game/colonies", label: "Colonies", icon: Globe2 },
      { to: "/game/ascension", label: "Ascension", icon: Sparkles },
      { to: "/game/statistiques", label: "Statistiques", icon: BarChart3 },
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
      { to: "/game/messages", label: "Messages", icon: Mail },
      { to: "/game/joueurs", label: "Classement", icon: Users },
      { to: "/game/marche", label: "Marché", icon: Store },
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
/** v5.12 : pages visibles seulement quand elles sont ouvertes (le casino), sauf pour l'administration. */
/** Pages cachées du menu : casino fermé (sauf admin), concours (réservés aux admins depuis la 5.13). */
export function useHiddenRoutes(): ReadonlySet<string> {
  const casino = useCasinoVisible();
  const admin = useIsAdmin();
  // 5.15 : la page Ascension n'est au menu qu'après la première ascension (avant : raccourci sur Bâtiments).
  const ascended = usePlayerStore((s) => (s.player?.ascensions ?? 0) > 0);
  return useMemo(() => {
    const hidden = new Set<string>();
    if (!casino) hidden.add("/game/casino");
    if (!admin) hidden.add("/game/concours");
    if (!ascended) hidden.add("/game/ascension");
    return hidden;
  }, [casino, admin, ascended]);
}

function useNavGroups(): NavGroup[] {
  const hidden = useHiddenRoutes();
  return hidden.size === 0 ? NAV_GROUPS : NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !hidden.has(i.to)) }));
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
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid));
  const leviathan = useLeviathan();
  const leviathanSeen = useLeviathanSeen((s) => s.ids);
  const passClaimable = usePlayerStore((s) => {
    if (!s.player) return 0;
    const st = passState(s.player, Date.now());
    return Math.max(0, passTier(st.points, st.seasonId) - st.claimed.length);
  });
  // Léviathan : pastille tant que le joueur n'a pas ouvert la page pendant cette apparition.
  const leviathanNew = leviathan && isActive(leviathan, Date.now()) && !leviathanSeen.includes(leviathan.id) ? 1 : 0;
  return (to) =>
    ({
      "/game/passe": passClaimable,
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

/** 5.15.9 : pastille en colonne, à droite du libellé (toutes alignées). */
function InlineBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="grid h-4 min-w-4 shrink-0 place-items-center bg-danger-glow px-1 font-mono text-[9.5px] font-bold tabular-nums text-space-950">{count > 99 ? "99+" : count}</span>;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center bg-danger-glow px-1 font-mono text-[9px] font-bold text-space-950">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* v5.10.2 : les onglets des boss changent selon l'état du combat. */
const BOSS_NAV: Record<BossPhase, { label: string; chip: string; color: string }> = {
  active: { label: "En cours", chip: "En cours", color: "var(--color-danger-glow)" },
  killed: { label: "Abattu", chip: "Abattu", color: "var(--color-mint-glow)" },
  failed: { label: "Retiré", chip: "Retiré", color: "var(--color-ember-glow)" },
  dormant: { label: "En sommeil", chip: "Zzz", color: "var(--color-slate-500)" },
};

/** Minute courante (les fins de combat sont gérées sans attendre le serveur). */
function useMinute(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** État du boss d'une page de la navigation (null pour les autres pages). */
function useBossNavPhase(to: string): BossPhase | null {
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  const now = useMinute();
  if (to === "/game/uber") return bossPhase(leviathan, now);
  if (to === "/game/boss") return bossPhase(seasonBoss, now);
  return null;
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
function BossChip({ phase }: { phase: BossPhase }) {
  const { color, label, chip } = BOSS_NAV[phase];
  return (
    <span title={label} className="shrink-0 border px-1 py-px font-mono text-[8.5px] font-bold uppercase tracking-[0.12em]" style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      {chip}
    </span>
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
  const phase = useBossNavPhase(item.to);
  return (
    <ItemLink
      item={item}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 py-2 pl-3 pr-2.5 font-display text-[12.5px] font-semibold uppercase tracking-[0.09em] transition-all duration-200",
          "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-[var(--nav-accent)] before:shadow-[0_0_12px_var(--nav-accent)] before:transition-transform before:duration-200",
          isActive
            ? "bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_24%,transparent)] via-[color-mix(in_srgb,var(--nav-accent)_7%,transparent)] to-transparent text-white shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--nav-accent)_22%,transparent)] before:scale-y-100"
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
          {phase && <BossChip phase={phase} />}
          <InlineBadge count={badge} />
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
        <span className="hud-eyebrow text-[10px] text-slate-500 transition-colors group-hover/h:text-slate-300">{group.label}</span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] to-transparent" />
        {!open && total > 0 && (
          <InlineBadge count={total} />
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
          {badgeOf(item.to) > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger-glow shadow-[0_0_6px_var(--color-danger-glow)]" />}
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
          <p className="flex flex-wrap items-center gap-x-1.5 font-display text-[15px] font-bold leading-tight tracking-[0.02em] text-white">
            <PlayerName uid={player.uid} pseudo={player.pseudo} allianceId={player.allianceId || null} className="min-w-0 [overflow-wrap:anywhere]" />
            <AscensionStars count={player.ascensions} />
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-glow">
            <span className="truncate">{getRankLabel(player.xp)}</span>
            <StaffBadge uid={player.uid} compact />
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between font-mono text-[10px] text-slate-500">
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
  const phase = useBossNavPhase(item.to);
  return (
    <ItemLink
      item={item}
      title={phase ? `${item.label} · ${BOSS_NAV[phase].label}` : item.label}
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
      {badge > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-danger-glow shadow-[0_0_6px_var(--color-danger-glow)]" />}
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
        <img src={assetUrl("/assets/logo/logo.webp")} alt="Cosmic Empires" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(75,232,255,0.35)]" />
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
        <button type="button" onClick={onExpand} title="Déplier la barre" aria-label="Déplier la barre" className="mx-auto mt-1 grid h-8 w-9 place-items-center text-slate-600 hover:text-cyan-glow">
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
      <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">Vue cockpit</span>
      <HudSwitch checked={on} onCheckedChange={toggle} label="Vue cockpit" />
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
        <img src={assetUrl("/assets/logo/logo.webp")} alt="" className="h-11 w-11 object-contain drop-shadow-[0_0_10px_rgba(75,232,255,0.35)]" />
        <div className="leading-none">
          <p className="font-display text-lg font-bold uppercase tracking-[0.16em] text-white">Cosmic</p>
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
      </nav>
      <div className="border-t border-cyan-glow/10 pt-2.5">
        <FooterLinks badgeOf={badgeOf} />
      </div>
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between">
          <SignalIndicator />
          <LiveClock />
          <button type="button" onClick={() => setMode(wide ? "compact" : "auto")} title="Réduire la barre" aria-label="Réduire la barre" className="text-slate-600 hover:text-cyan-glow">
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>
        <CockpitSwitch className="mt-2" />
        {CURRENT_VERSION && (
          <NavLink to="/game/nouveautes" className="mt-1.5 block font-mono text-[10px] tracking-[0.14em] text-slate-600 hover:text-cyan-glow">
            BUILD v{CURRENT_VERSION}
          </NavLink>
        )}
      </div>
    </aside>
  );
}

/* ---------- mobile : barre d'onglets + menu complet ---------- */

/** v4.5 : onglets épinglés par le joueur (4 au plus), mémorisés sur l'appareil. */
const DEFAULT_TABS = ["/game", "/game/unites", "/game/galaxie", "/game/passe"];
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
  const phase = useBossNavPhase(item.to);
  return (
    <ItemLink
      item={item}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
          "before:absolute before:inset-x-[25%] before:top-0 before:h-0.5 before:bg-cyan-glow before:shadow-[0_0_10px_var(--color-cyan-glow)] before:transition-opacity",
          isActive ? "text-cyan-glow before:opacity-100" : "text-slate-500 before:opacity-0",
        )
      }
    >
      <span className="relative">
        <item.icon className={cn("h-5 w-5", bossIconClass(phase))} />
        <Badge count={badge} />
        {!badge && <BossDot phase={phase} />}
      </span>
      {item.label}
    </ItemLink>
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
            className={cn("ml-auto border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]", editing ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400")}
          >
            {editing ? "Terminé" : "Épingler"}
          </button>
        </div>
        {editing && <p className="mt-2 text-xs text-slate-400">Touche une page pour l'épingler dans la barre du bas ({tabs.length} / {MAX_TABS}).</p>}
        <div className="mt-3 flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.id} style={{ "--nav-accent": group.accent } as React.CSSProperties}>
              <p className="hud-eyebrow mb-2 flex items-center gap-2 text-[10px] text-slate-500">
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
                        "hud-cut relative flex flex-col items-center gap-1.5 border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
                        tabs.includes(item.to) ? "border-gold-glow/60 bg-gold-glow/10 text-gold-glow" : "border-white/10 bg-white/[0.02] text-slate-400",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
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
        <div onClickCapture={onClose}>
          <CockpitSwitch className="mt-4" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MenuTile({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const badge = useBadge(item.to);
  const phase = useBossNavPhase(item.to);
  return (
    <ItemLink
      item={item}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "hud-cut flex flex-col items-center gap-1.5 border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
          isActive ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-cyan-glow/10 bg-white/[0.02] text-slate-300",
        )
      }
    >
      <span className="relative">
        <item.icon className={cn("h-5 w-5", bossIconClass(phase))} />
        <Badge count={badge} />
        {!badge && <BossDot phase={phase} />}
      </span>
      {item.label}
      {phase && <span className="-mt-1 font-mono text-[8.5px] tracking-[0.12em]" style={{ color: BOSS_NAV[phase].color }}>{BOSS_NAV[phase].label}</span>}
    </ItemLink>
  );
}

function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const [tabIds, setTabIds] = useState(readTabs);
  const location = useLocation();
  const allianceUnread = useAllianceUnreadStore((s) => s.count) + usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const changelogUnread = useUnreadChangelogCount();
  const reportsUnread = useReportBadges((r) => r.unread);
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid));
  const hidden = useHiddenRoutes();
  const tabs = tabIds.map((to) => ALL_NAV_ITEMS.find((i) => i.to === to)!).filter((i) => !!i && !hidden.has(i.to));
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
            "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em]",
            "before:absolute before:inset-x-[25%] before:top-0 before:h-0.5 before:bg-cyan-glow before:shadow-[0_0_10px_var(--color-cyan-glow)]",
            inMenu ? "text-cyan-glow before:opacity-100" : "text-slate-500 before:opacity-0",
          )}
        >
          <span className="relative">
            <LayoutGrid className="h-5 w-5" />
            <Badge count={allianceUnread + changelogUnread + reportsUnread + messagesUnread} />
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
  return (
    <>
      <Sidebar />
      <MobileTabBar />
    </>
  );
}
