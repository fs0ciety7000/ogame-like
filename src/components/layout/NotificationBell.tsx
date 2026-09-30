import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setBellOpen, useNotificationStore } from "@/store/notificationStore";
import { markNotificationRead } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { inCategory, NOTIFICATION_CATEGORIES, type NotificationCategory } from "@/lib/notificationCategories";
import { cn, timeAgo } from "@/lib/utils";

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const open = useNotificationStore((s) => s.bellOpen);
  const uid = useAuthStore((s) => s.user?.uid);
  const [tab, setTab] = useState<NotificationCategory>("all");
  // Non-lues au moment de l'ouverture : elles restent en évidence pendant la
  // consultation, même si elles sont marquées lues aussitôt.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const hasUrgentUnread = useMemo(
    () => items.some((n) => !n.read && (n.kind === "combat-defender" || n.kind === "spy-detected")),
    [items],
  );

  // À l'ouverture (clic sur la cloche ou bouton « Voir » d'un toast) :
  // on retient les nouveautés, on choisit l'onglet, puis on les marque lues.
  useEffect(() => {
    if (!open) return;
    const pending = items.filter((n) => !n.read);
    setFreshIds(new Set(pending.map((n) => n.id)));
    // Toutes les nouveautés dans une même catégorie : on ouvre sur celle-ci.
    const cats = new Set(pending.map((n) => NOTIFICATION_CATEGORIES.find((c) => c.id !== "all" && inCategory(n.kind, c.id))?.id ?? "all"));
    setTab(cats.size === 1 ? [...cats][0] : "all");
    if (uid) pending.forEach((n) => void markNotificationRead(uid, n.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à l'ouverture, pas à chaque nouvelle notification reçue pendant la consultation
  }, [open]);

  const shown = items.filter((n) => inCategory(n.kind, tab));

  return (
    <DropdownMenu open={open} onOpenChange={setBellOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-space-800/70 text-slate-300 transition hover:text-white hover:border-cyan-glow/40",
            hasUrgentUnread && "animate-pulse-alert",
          )}
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
      <DropdownMenuContent align="end" className="flex max-h-[75vh] w-[min(26rem,calc(100vw-1rem))] flex-col">
        <DropdownMenuLabel>Journal de bord</DropdownMenuLabel>
        <div className="flex flex-wrap gap-1 px-1 pb-2" role="tablist">
          {NOTIFICATION_CATEGORIES.map((c) => {
            const count = items.filter((n) => freshIds.has(n.id) && inCategory(n.kind, c.id)).length;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => setTab(c.id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  tab === c.id ? "bg-cyan-glow/15 text-cyan-glow" : "text-slate-400 hover:text-slate-200",
                )}
              >
                {c.label}
                {count > 0 && <span className="rounded-full bg-danger-glow/80 px-1.5 text-[10px] font-bold text-space-950">{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto">
          {shown.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Rien dans cette catégorie pour l'instant.</p>}
          {shown.map((n) => (
            <div
              key={n.id}
              className={cn("rounded-lg px-3 py-2 text-sm", freshIds.has(n.id) ? "bg-cyan-glow/5 text-slate-100" : "text-slate-400")}
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
