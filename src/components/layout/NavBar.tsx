import { NavLink } from "react-router-dom";
import { LayoutDashboard, Factory, Building2, Rocket, FlaskConical, MapPin, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/game", label: "Accueil", icon: LayoutDashboard, end: true },
  { to: "/game/ressources", label: "Ressources", icon: Factory },
  { to: "/game/batiments", label: "Bâtiments", icon: Building2 },
  { to: "/game/unites", label: "Unités", icon: Rocket },
  { to: "/game/labo", label: "Labo", icon: FlaskConical },
  { to: "/game/missions", label: "Missions", icon: MapPin },
  { to: "/game/joueurs", label: "Joueurs", icon: Users },
  { to: "/game/profil", label: "Profil", icon: UserCircle },
];

export function NavBar() {
  return (
    <nav className="glass-panel sticky bottom-0 z-30 flex w-full items-center justify-around gap-1 overflow-x-auto rounded-none border-x-0 border-b-0 px-2 py-2 md:static md:w-64 md:flex-col md:items-stretch md:justify-start md:rounded-2xl md:border md:p-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-400 transition-all md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm",
              isActive
                ? "bg-cyan-glow/10 text-cyan-glow shadow-[inset_0_0_0_1px_rgba(75,232,255,0.25)]"
                : "hover:bg-white/5 hover:text-slate-200",
            )
          }
        >
          <Icon className="h-4 w-4 md:h-4 md:w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
