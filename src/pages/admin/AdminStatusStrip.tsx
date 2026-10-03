import { useEffect, useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { CURRENT_VERSION } from "@/lib/changelog";
import { CONTENT_SECTIONS } from "@/game/content";
import { useContentStore } from "@/services/contentService";
import { useMaintenance } from "@/services/maintenanceService";
import { adminStuckFleets } from "@/services/adminService";
import type { GameIconName } from "@/lib/icons";

function formatAge(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  return h >= 48 ? `${Math.floor(h / 24)} j` : h >= 1 ? `${h} h` : `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

/** Bandeau d'état de la console : jeu ouvert ou non, joueurs, contenu, version. */
export function AdminStatusStrip({ onOpen }: { onOpen: (tab: string) => void }) {
  const m = useMaintenance();
  const customized = useContentStore((s) => s.customized);
  const [players, setPlayers] = useState<number | null>(null);
  const [backup, setBackup] = useState<{ latestAtMs: number; count: number; staleAfterMs: number } | null>(null);
  const [stuck, setStuck] = useState<number | null>(null);
  useEffect(() => {
    pb.collection("players")
      .getList(1, 1, { fields: "id" })
      .then((r) => setPlayers(r.totalItems))
      .catch(() => setPlayers(null));
    pb.send<{ latestAtMs: number; count: number; staleAfterMs: number }>("/api/cosmic/admin/backups", {})
      .then(setBackup)
      .catch(() => setBackup(null));
    adminStuckFleets()
      .then((r) => setStuck(r.count))
      .catch(() => setStuck(null));
  }, []);
  const backupAge = backup && backup.latestAtMs > 0 ? Date.now() - backup.latestAtMs : null;
  const backupOk = backupAge !== null && backup !== null && backupAge <= backup.staleAfterMs;

  const tiles: { icon: GameIconName; label: string; value: string; sub: string; tone: string; tab: string; pulse?: boolean }[] = [
    {
      icon: m.enabled ? "repair" : "shield",
      label: "État du jeu",
      value: m.enabled ? "Maintenance" : "Ouvert",
      sub: m.enabled ? "joueurs bloqués" : "accessible à tous",
      tone: m.enabled ? "var(--color-gold-glow)" : "var(--color-mint-glow)",
      tab: "maintenance",
      pulse: m.enabled,
    },
    { icon: "alliance", label: "Joueurs", value: players === null ? "…" : String(players), sub: "comptes inscrits", tone: "var(--color-cyan-glow)", tab: "players" },
    {
      icon: "research",
      label: "Contenu",
      value: `${customized.length} / ${CONTENT_SECTIONS.length}`,
      sub: customized.length > 0 ? "sections personnalisées" : "valeurs du code",
      tone: "var(--color-violet-glow)",
      tab: customized[0] ?? "buildings",
    },
    {
      icon: "storage",
      label: "Sauvegarde",
      value: backup === null ? "…" : backupAge === null ? "Aucune" : `il y a ${formatAge(backupAge)}`,
      sub: backup === null ? "état inconnu" : backupOk ? `${backup.count} conservées` : "à vérifier !",
      tone: backup === null || backupOk ? "var(--color-mint-glow)" : "var(--color-danger-glow)",
      tab: "tools",
      pulse: backup !== null && !backupOk,
    },
    {
      icon: "fleet",
      label: "Flottes bloquées",
      value: stuck === null ? "…" : String(stuck),
      sub: stuck === null ? "état inconnu" : stuck === 0 ? "tâche serveur à jour" : "à examiner !",
      tone: stuck ? "var(--color-danger-glow)" : "var(--color-mint-glow)",
      tab: "tools",
      pulse: !!stuck,
    },
    { icon: "rankup", label: "Version", value: CURRENT_VERSION ? `v${CURRENT_VERSION}` : "—", sub: "client en ligne", tone: "var(--color-ember-glow)", tab: "tools" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {tiles.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => onOpen(t.tab)}
          style={{ "--tone": t.tone } as React.CSSProperties}
          className="hud-cut-sm group relative flex items-center gap-3 overflow-hidden border border-white/[0.07] bg-space-900/70 px-3 py-2.5 text-left transition-colors hover:border-[var(--tone)]"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--tone)]" />
          <GameIcon name={t.icon} className={cn("h-9 w-9 transition-transform group-hover:scale-110", t.pulse && "animate-pulse")} />
          <span className="min-w-0">
            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{t.label}</span>
            <span className="hud-title block truncate text-lg leading-tight text-[var(--tone)]">{t.value}</span>
            <span className="block truncate text-[11px] text-slate-500">{t.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
