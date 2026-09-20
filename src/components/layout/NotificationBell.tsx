import { Bell } from "lucide-react";
import { useMemo } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/store/notificationStore";
import { markNotificationRead } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const uid = useAuthStore((s) => s.user?.uid);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && uid) {
          items.filter((n) => !n.read).forEach((n) => void markNotificationRead(uid, n.id));
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-space-800/70 text-slate-300 transition hover:text-white hover:border-cyan-glow/40"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-glow px-1 text-[10px] font-bold text-space-950">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Journal de bord</DropdownMenuLabel>
        {items.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Aucun évènement pour l'instant.</p>}
        <div className="flex flex-col gap-1">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                n.read ? "text-slate-400" : "bg-cyan-glow/5 text-slate-100",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{n.title}</span>
                <span className="shrink-0 text-[11px] text-slate-500">{timeAgo(n.createdAtMs)}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
