import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { useState } from "react";
import { isActive } from "@/game/leviathan";
import { useLeviathan } from "@/services/leviathanService";
import { assetUrl } from "@/lib/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Orbit, Users, Swords, Flag, UserCircle, Sparkles, Trophy, Skull, Medal, LayoutGrid, Bug, Calculator, Store, Fish, Globe2, ScrollText, Mail, Crosshair, Shield as ShieldStar, Ticket, Crown, Flame } from "lucide-react";
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

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Empire",
    items: [
      { to: "/game", label: "Accueil", icon: LayoutDashboard, end: true },
      { to: "/game/ressources", label: "Ressources", icon: Factory },
      { to: "/game/batiments", label: "Bâtiments", icon: Building2 },
      { to: "/game/unites", label: "Unités", icon: Rocket },
      { to: "/game/labo", label: "Labo", icon: FlaskConical },
      { to: "/game/etat-major", label: "État-major", icon: ShieldStar },
    ],
  },
  {
    label: "Opérations",
    items: [
      { to: "/game/missions", label: "Missions", icon: MapPin },
      { to: "/game/primes", label: "Primes", icon: Crosshair },
      { to: "/game/passe", label: "Passe", icon: Ticket },
      { to: "/game/galaxie", label: "Galaxie", icon: Orbit },
      { to: "/game/colonies", label: "Colonies", icon: Globe2 },
      { to: "/game/joueurs", label: "Joueurs", icon: Users },
      { to: "/game/combats", label: "Combats", icon: Swords },
      { to: "/game/simulateur", label: "Simulateur", icon: Calculator },
      { to: "/game/marche", label: "Marché", icon: Store },
      { to: "/game/menaces", label: "Menaces", icon: Skull },
      { to: "/game/seigneurs", label: "Seigneurs", icon: Crown },
      { to: "/game/leviathan", label: "Léviathan", icon: Fish },
      { to: "/game/boss", label: "Boss de saison", icon: Flame },
      { to: "/game/palmares", label: "Palmarès", icon: Trophy },
      { to: "/game/alliance", label: "Alliance", icon: Flag },
      { to: "/game/messages", label: "Messages", icon: Mail },
    ],
  },
  {
    label: "Compte",
    items: [
      { to: "/game/profil", label: "Profil", icon: UserCircle },
      { to: "/game/journal", label: "Journal", icon: ScrollText },
      { to: "/game/succes", label: "Succès", icon: Medal },
      { to: "/game/nouveautes", label: "Nouveautés", icon: Sparkles },
      { to: "/game/signalements", label: "Signalements", icon: Bug },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const ALL_ITEMS = ALL_NAV_ITEMS;

function useBadge(to: string): number {
  const allianceUnread = useAllianceUnreadStore((s) => s.count) + usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const changelogUnread = useUnreadChangelogCount();
  const reportsUnread = useReportBadges((s) => s.unread);
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid));
  const leviathan = useLeviathan();
  const passClaimable = usePlayerStore((s) => {
    if (!s.player) return 0;
    const st = passState(s.player, Date.now());
    return Math.max(0, passTier(st.points) - st.claimed.length);
  });
  if (to === "/game/passe") return passClaimable;
  if (to === "/game/messages") return messagesUnread;
  if (to === "/game/leviathan") return leviathan && isActive(leviathan, Date.now()) ? 1 : 0;
  return to === "/game/alliance" ? allianceUnread : to === "/game/nouveautes" ? changelogUnread : to === "/game/signalements" ? reportsUnread : 0;
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center bg-danger-glow px-1 font-mono text-[9px] font-bold text-space-950">
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Lien de la barre latérale (bureau). */
function SideLink({ item }: { item: NavItem }) {
  const badge = useBadge(item.to);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.1em] transition-all duration-200",
          "before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-cyan-glow before:shadow-[0_0_12px_var(--color-cyan-glow)] before:transition-transform before:duration-200",
          isActive
            ? "bg-gradient-to-r from-cyan-glow/[0.16] via-cyan-glow/[0.05] to-transparent text-white before:scale-y-100"
            : "text-slate-400 before:scale-y-0 hover:translate-x-0.5 hover:bg-white/[0.03] hover:text-slate-100",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "hud-cut-sm relative grid h-7 w-7 shrink-0 place-items-center border transition-colors",
              isActive ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-cyan-glow/10 bg-space-900/60 group-hover:border-cyan-glow/35 group-hover:text-cyan-glow",
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            <Badge count={badge} />
          </span>
          <span className="flex-1">{item.label}</span>
          {isActive && <span className="font-mono text-[9px] text-cyan-glow/70">◂</span>}
        </>
      )}
    </NavLink>
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
      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="hud-eyebrow flex items-center gap-2 px-3 pb-1.5 pt-1 text-[10px] text-slate-600 after:h-px after:flex-1 after:bg-gradient-to-r after:from-cyan-glow/20 after:to-transparent">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SideLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-cyan-glow/10 px-4 py-3">
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

const TAB_ITEMS = ["/game", "/game/batiments", "/game/unites", "/game/missions"];

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

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!top-auto !bottom-0 !translate-y-0 max-h-[80vh] w-full max-w-none p-4 pb-6">
        <DialogTitle className="hud-title text-base">Navigation</DialogTitle>
        <div className="mt-3 flex flex-col gap-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="hud-eyebrow mb-2 text-[10px] text-slate-500">{group.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => (
                  <MenuTile key={item.to} item={item} onClick={onClose} />
                ))}
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
  const location = useLocation();
  const allianceUnread = useAllianceUnreadStore((s) => s.count) + usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const changelogUnread = useUnreadChangelogCount();
  const reportsUnread = useReportBadges((r) => r.unread);
  const messagesUnread = useUnreadMessageCount(useAuthStore((s) => s.user?.uid));
  const tabs = TAB_ITEMS.map((to) => ALL_NAV_ITEMS.find((i) => i.to === to)!).filter(Boolean);
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
          Menu
        </button>
      </nav>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
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
