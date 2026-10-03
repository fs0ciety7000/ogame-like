import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { useState } from "react";
import { isActive } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { assetUrl } from "@/lib/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Orbit, Users, Swords, Flag, UserCircle, Sparkles, Trophy, Skull, Medal, LayoutGrid, Bug, Calculator, Store, Fish, Globe2, ScrollText, Mail, Crosshair, Shield as ShieldStar, Ticket, Crown, Flame, Pin, Newspaper, Megaphone, BookOpen, ChevronDown } from "lucide-react";
import { useLeviathanSeen } from "@/store/leviathanSeenStore";
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
      { to: "/game/leviathan", label: "Léviathan", icon: Fish },
      { to: "/game/boss", label: "Boss de saison", icon: Flame },
      { to: "/game/seigneurs", label: "Seigneurs", icon: Crown },
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
      { to: "/game/joueurs", label: "Joueurs", icon: Users },
      { to: "/game/marche", label: "Marché", icon: Store },
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
      { to: "/game/palmares", label: "Palmarès", icon: Trophy },
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
    ],
  },
];

/** Groupes listés dans la barre latérale ; le dernier (Compte) est en pied de barre. */
const SIDE_GROUPS = NAV_GROUPS.slice(0, -1);
const FOOTER_GROUP = NAV_GROUPS[NAV_GROUPS.length - 1];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
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
    return Math.max(0, passTier(st.points) - st.claimed.length);
  });
  // Léviathan : pastille tant que le joueur n'a pas ouvert la page pendant cette apparition.
  const leviathanNew = leviathan && isActive(leviathan, Date.now()) && !leviathanSeen.includes(leviathan.id) ? 1 : 0;
  return (to) =>
    ({
      "/game/passe": passClaimable,
      "/game/messages": messagesUnread,
      "/game/leviathan": leviathanNew,
      "/game/alliance": allianceUnread,
      "/game/nouveautes": changelogUnread,
      "/game/signalements": reportsUnread,
    })[to] ?? 0;
}

function useBadge(to: string): number {
  return useBadges()(to);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center bg-danger-glow px-1 font-mono text-[9px] font-bold text-space-950">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Lien de la barre latérale (bureau), aux couleurs de son groupe (--nav-accent). */
function SideLink({ item, badge }: { item: NavItem; badge: number }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 py-1.5 pl-3 pr-2 font-display text-[12.5px] font-semibold uppercase tracking-[0.09em] transition-all duration-200",
          "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-[var(--nav-accent)] before:shadow-[0_0_12px_var(--nav-accent)] before:transition-transform before:duration-200",
          isActive
            ? "bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_16%,transparent)] via-[color-mix(in_srgb,var(--nav-accent)_4%,transparent)] to-transparent text-white before:scale-y-100"
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
              <item.icon className="h-3.5 w-3.5" />
            </span>
            <Badge count={badge} />
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {isActive && <span className="h-1.5 w-1.5 rotate-45 bg-[var(--nav-accent)] shadow-[0_0_8px_var(--nav-accent)]" />}
        </>
      )}
    </NavLink>
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
    <div className="mb-1.5" style={{ "--nav-accent": group.accent } as React.CSSProperties}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group/h flex w-full items-center gap-2 px-3 pb-1 pt-2 text-left"
      >
        <span className="grid h-4 w-4 place-items-center text-[var(--nav-accent)] opacity-80">
          <group.icon className="h-3 w-3" />
        </span>
        <span className="hud-eyebrow text-[10px] text-slate-500 transition-colors group-hover/h:text-slate-300">{group.label}</span>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[color-mix(in_srgb,var(--nav-accent)_35%,transparent)] to-transparent" />
        {!open && total > 0 && (
          <span className="bg-danger-glow px-1 font-mono text-[9px] font-bold leading-[14px] text-space-950">{total > 9 ? "9+" : total}</span>
        )}
        <ChevronDown className={cn("h-3 w-3 text-slate-600 transition-transform duration-200 group-hover/h:text-slate-300", !open && "-rotate-90")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="flex flex-col gap-px overflow-hidden">
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
    <div className="grid grid-cols-4 gap-1 px-3 pb-2" style={{ "--nav-accent": FOOTER_GROUP.accent } as React.CSSProperties}>
      {FOOTER_GROUP.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
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
        </NavLink>
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
          <p className="flex items-center gap-1.5 font-display text-[15px] font-bold tracking-[0.04em] text-white">
            <PlayerName uid={player.uid} pseudo={player.pseudo} allianceId={player.allianceId || null} className="truncate" />
            <AscensionStars count={player.ascensions} />
            <StaffBadge uid={player.uid} compact />
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-glow">{getRankLabel(player.xp)}</p>
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

/** Barre latérale (bureau). */
function Sidebar() {
  const badgeOf = useBadges();
  const [collapsed, setCollapsed] = useState(readCollapsed);
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
        {SIDE_GROUPS.map((group) => (
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
        </div>
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
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
          "before:absolute before:inset-x-[25%] before:top-0 before:h-0.5 before:bg-cyan-glow before:shadow-[0_0_10px_var(--color-cyan-glow)] before:transition-opacity",
          isActive ? "text-cyan-glow before:opacity-100" : "text-slate-500 before:opacity-0",
        )
      }
    >
      <span className="relative">
        <item.icon className="h-5 w-5" />
        <Badge count={badge} />
      </span>
      {item.label}
    </NavLink>
  );
}

function MobileMenu({ open, onClose, tabs, onTabsChange }: { open: boolean; onClose: () => void; tabs: string[]; onTabsChange: (tabs: string[]) => void }) {
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
          {NAV_GROUPS.map((group) => (
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
      </DialogContent>
    </Dialog>
  );
}

function MenuTile({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const badge = useBadge(item.to);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "hud-cut flex flex-col items-center gap-1.5 border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]",
          isActive ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-cyan-glow/10 bg-white/[0.02] text-slate-300",
        )
      }
    >
      <span className="relative">
        <item.icon className="h-5 w-5" />
        <Badge count={badge} />
      </span>
      {item.label}
    </NavLink>
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
  const tabs = tabIds.map((to) => ALL_NAV_ITEMS.find((i) => i.to === to)!).filter(Boolean);
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
