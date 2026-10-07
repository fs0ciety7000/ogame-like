import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDateTime } from "@/lib/utils";

/** Horloge temps réel façon poste de contrôle (HH:MM:SS, police mono), sur l'horloge partagée (6.14.83). */
export function LiveClock() {
  useNowTicker();
  return <span className="tabular-mono text-xs text-slate-400">{formatDateTime(Date.now(), "timeSec")}</span>;
}
