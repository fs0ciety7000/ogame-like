import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { useNotificationStore } from "@/store/notificationStore";
import { systemLogStyle } from "@/lib/systemLog";

function timeLabel(ms: number): string {
  return formatDateTime(ms, "timeSec");
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
              const style = systemLogStyle(n);
              return (
                <li key={n.id} className="flex gap-2 text-slate-400">
                  <span className="shrink-0 text-slate-500">[{timeLabel(n.createdAtMs)}]</span>
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
