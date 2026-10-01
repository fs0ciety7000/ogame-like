import { Link } from "react-router-dom";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration } from "@/lib/utils";
import { maintenanceRemainingMs } from "@/game/maintenance";
import { useMaintenance } from "@/services/maintenanceService";

/** Rappel pour les administrateurs : le jeu est fermé aux joueurs. */
export function MaintenanceBanner() {
  useNowTicker();
  const m = useMaintenance();
  if (!m.enabled) return null;
  const remaining = maintenanceRemainingMs(m, Date.now());
  return (
    <div className="relative z-30 flex items-center gap-3 overflow-hidden border-b border-gold-glow/40 bg-space-950 px-4 py-1.5 text-xs sm:px-6">
      <span aria-hidden className="mt-hazard absolute inset-y-0 left-0 w-2" />
      <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold-glow shadow-[0_0_6px_var(--color-gold-glow)]" />
      <span className="font-mono font-bold uppercase tracking-[0.16em] text-gold-glow">Maintenance active</span>
      <span className="hidden text-slate-400 sm:inline">
        Jeu fermé aux joueurs{m.version && ` · v${m.version}`}
        {remaining !== null && ` · fin prévue ${remaining > 0 ? `dans ${formatDuration(remaining / 1000)}` : "dépassée"}`}
      </span>
      <Link to="/game/admin?onglet=maintenance" className="ml-auto font-semibold text-gold-glow underline-offset-4 hover:underline">
        Gérer
      </Link>
    </div>
  );
}
