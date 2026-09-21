import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { useNotificationStore } from "@/store/notificationStore";
import type { NotificationKind } from "@/types/game";

const LEVEL_STYLE: Record<NotificationKind, { level: string; className: string }> = {
  building: { level: "SUCCESS", className: "text-mint-glow" },
  research: { level: "SUCCESS", className: "text-mint-glow" },
  unit: { level: "SUCCESS", className: "text-mint-glow" },
  mission: { level: "SUCCESS", className: "text-mint-glow" },
  "combat-attacker": { level: "INFO", className: "text-cyan-glow" },
  "combat-defender": { level: "WARN", className: "text-ember-glow" },
  achievement: { level: "UNLOCK", className: "text-gold-glow" },
  "spy-detected": { level: "ALERT", className: "text-ember-glow" },
  gift: { level: "INFO", className: "text-mint-glow" },
  system: { level: "INFO", className: "text-cyan-glow" },
};

function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Flux d'activité en direct façon console de bord — complète les toasts
 *  (éphémères) par un historique compact et consultable des évènements. */
export function SystemLogPanel() {
  const items = useNotificationStore((s) => s.items);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Journal système</CardTitle>
        <StatusDot label="Live" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="tabular-mono text-xs text-slate-500">En attente d'évènements…</p>
        ) : (
          <ul className="max-h-52 space-y-1 overflow-y-auto tabular-mono text-xs">
            {items.slice(0, 20).map((n) => {
              const style = LEVEL_STYLE[n.kind];
              return (
                <li key={n.id} className="flex gap-2 text-slate-400">
                  <span className="shrink-0 text-slate-600">[{timeLabel(n.createdAtMs)}]</span>
                  <span className={`shrink-0 font-medium ${style.className}`}>{style.level}</span>
                  <span className="truncate text-slate-300">{n.title}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
