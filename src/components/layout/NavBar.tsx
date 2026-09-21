import { NavLink } from "react-router-dom";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Orbit, Users, Swords, Flag, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAllianceUnreadStore } from "@/store/allianceUnreadStore";

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
    ],
  },
  {
    label: "Opérations",
    items: [
      { to: "/game/missions", label: "Missions", icon: MapPin },
      { to: "/game/galaxie", label: "Galaxie", icon: Orbit },
      { to: "/game/joueurs", label: "Joueurs", icon: Users },
      { to: "/game/combats", label: "Combats", icon: Swords },
      { to: "/game/alliance", label: "Alliance", icon: Flag },
    ],
  },
  {
    label: "Compte",
    items: [{ to: "/game/profil", label: "Profil", icon: UserCircle }],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const ALL_ITEMS = ALL_NAV_ITEMS;

function NavItemLink({ item }: { item: NavItem }) {
  const allianceUnread = useAllianceUnreadStore((s) => s.count);
  const badgeCount = item.to === "/game/alliance" ? allianceUnread : 0;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-400 transition-all md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm",
          isActive
            ? "bg-cyan-glow/10 text-cyan-glow shadow-[inset_0_0_0_1px_rgba(75,232,255,0.25)]"
            : "hover:bg-white/5 hover:text-slate-200",
        )
      }
    >
      <span className="relative">
        <item.icon className="h-4 w-4 md:h-4 md:w-4" />
        {badgeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger-glow px-1 text-[9px] font-bold text-space-950">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export function NavBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around gap-1 overflow-x-auto border-t border-white/5 bg-space-900/95 px-2 py-2 backdrop-blur-xl md:sticky md:inset-x-auto md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:items-stretch md:justify-start md:gap-1 md:overflow-y-auto md:border-t-0 md:border-r md:bg-space-900/60 md:p-3">
      {/* Mobile : liste plate, pas de place pour des libellés de groupe. */}
      <div className="contents md:hidden">
        {ALL_ITEMS.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </div>

      {/* Desktop : sections groupées façon panneau de contrôle. */}
      <div className="hidden md:flex md:flex-col md:gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="hud-eyebrow px-3 pb-1 text-slate-600">{group.label}</p>
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
