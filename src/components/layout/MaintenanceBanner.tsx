import { Link } from "react-router-dom";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatDuration } from "@/lib/utils";
import { maintenanceRemainingMs, upcomingMaintenance } from "@/game/maintenance";
import { useMaintenance } from "@/services/maintenanceService";

/** Rappel pour les administrateurs : le jeu est fermé aux joueurs. */
export function MaintenanceBanner() {
  useNowTicker();
  const m = useMaintenance();
  if (!m.enabled) return <UpcomingMaintenanceNotice />;
  const remaining = maintenanceRemainingMs(m, Date.now());
  return (
    <div data-strip className="relative z-30 flex items-center gap-3 overflow-hidden border-b border-gold-glow/40 bg-space-950 px-4 py-1.5 text-xs sm:px-6">
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

/** 5.26 : maintenance programmée annoncée à tous dans les 24 h qui précèdent (plus visible dans la dernière heure). */
export function UpcomingMaintenanceNotice({ className }: { className?: string }) {
  useNowTicker();
  const m = useMaintenance();
  const up = upcomingMaintenance(m, Date.now());
  if (!up) return null;
  const soon = up.inMs <= 3600_000;
  const at = new Date(up.startAtMs).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" });
  const length = up.endsAtMs ? formatDuration((up.endsAtMs - up.startAtMs) / 1000) : null;
  return (
    <div data-strip role="status" className={cn("relative z-30 flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1.5 text-xs sm:px-6", soon ? "border-ember-glow/50 bg-ember-glow/10" : "border-gold-glow/30 bg-space-950", className)}>
      <span className={cn("font-mono font-bold uppercase tracking-[0.16em]", soon ? "text-ember-glow" : "text-gold-glow")}>Maintenance prévue</span>
      <span className="text-slate-300">
        {at}
        {length && ` · environ ${length}`}
        {up.version && ` · v${up.version}`}
      </span>
      <span className={cn("font-mono tabular-nums", soon ? "text-ember-glow" : "text-slate-400")}>dans {formatDuration(up.inMs / 1000)}</span>
      <Link to="/statut" className="ml-auto text-slate-400 underline-offset-4 hover:text-cyan-glow hover:underline">
        Statut du serveur
      </Link>
    </div>
  );
}
