import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setBellOpen, useNotificationStore } from "@/store/notificationStore";
import { markNotificationRead } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { inCategory, NOTIFICATION_CATEGORIES, notificationLink, type NotificationCategory } from "@/lib/notificationCategories";
import { cn } from "@/lib/utils";
import { NotificationCard } from "@/components/game/NotificationCard";

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const open = useNotificationStore((s) => s.bellOpen);
  const uid = useAuthStore((s) => s.user?.uid);
  const navigate = useNavigate();
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
            "relative grid h-9 w-9 place-items-center text-slate-400 transition-colors hover:bg-cyan-glow/10 hover:text-cyan-glow",
            hasUrgentUnread && "animate-pulse-alert",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center bg-danger-glow px-0.5 font-mono text-[9px] font-bold text-space-950">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex max-h-[75vh] w-[min(26rem,calc(100vw-1rem))] flex-col">
        <div className="flex items-center justify-between pr-2">
          <DropdownMenuLabel>Journal de bord</DropdownMenuLabel>
          <Link to="/game/journal" onClick={() => setBellOpen(false)} className="text-[11px] text-cyan-glow/80 hover:text-cyan-glow">
            Tout l'historique →
          </Link>
        </div>
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
        <div className="flex flex-col gap-1.5 overflow-y-auto px-1 pb-1">
          {shown.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Rien dans cette catégorie pour l'instant.</p>}
          {shown.map((n) => {
            const link = notificationLink(n);
            return (
              <NotificationCard
                key={n.id}
                n={n}
                compact
                fresh={freshIds.has(n.id)}
                onOpen={
                  link
                    ? () => {
                        setBellOpen(false);
                        navigate(link);
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
