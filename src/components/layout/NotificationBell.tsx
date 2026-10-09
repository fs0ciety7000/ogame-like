import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/hud";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setBellOpen, useNotificationStore } from "@/store/notificationStore";
import { markNotificationRead } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { countsInBadge, groupNotifications, inCategory, NOTIFICATION_CATEGORIES, notificationLink, type NotificationCategory } from "@/lib/notificationCategories";
import { cn } from "@/lib/utils";
import { NotificationCard } from "@/components/game/NotificationCard";
import { Pager, usePaged } from "@/components/ui/panel";

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const open = useNotificationStore((s) => s.bellOpen);
  const uid = useAuthStore((s) => s.user?.uid);
  const navigate = useNavigate();
  const [tab, setTab] = useState<NotificationCategory>("all");
  // Non-lues au moment de l'ouverture : elles restent en évidence pendant la
  // consultation, même si elles sont marquées lues aussitôt.
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  // 6.14.165 (S6, NJ-30) : le chiffre ne compte que ce qui compte ; la routine (chantiers, recherches, missions) met un point.
  const unreadImportant = useMemo(() => items.filter((n) => !n.read && countsInBadge(n.kind)).length, [items]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à l'ouverture, pas à chaque nouvelle notification reçue pendant la consultation
  }, [open]);

  // 5.23 : lu par catégorie : un onglet consulté est marqué lu ; « Tout » se marque d'un bouton.
  const markRead = (cat: NotificationCategory) => {
    if (!uid) return;
    items.filter((n) => !n.read && inCategory(n.kind, cat)).forEach((n) => void markNotificationRead(uid, n.id));
  };
  useEffect(() => {
    if (open && tab !== "all") markRead(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- à l'ouverture d'un onglet
  }, [open, tab]);

  const shown = items.filter((n) => inCategory(n.kind, tab));
  // 5.24 : groupes paginés (taille des Réglages) ; retour à la première page en changeant d'onglet.
  const notifPage = usePaged(groupNotifications(shown));
  const toFirstPage = notifPage.pager.onPage;
  useEffect(() => {
    toFirstPage(0);
  }, [tab, toFirstPage]);
  const unreadIn = (cat: NotificationCategory) => items.filter((n) => !n.read && inCategory(n.kind, cat)).length;

  return (
    <DropdownMenu open={open} onOpenChange={setBellOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative grid h-9 w-9 place-items-center text-slate-400 transition-colors hover:bg-cyan-glow/10 hover:text-cyan-glow pointer-coarse:h-11 pointer-coarse:w-11",
            hasUrgentUnread && "animate-pulse-alert",
          )}
          aria-label={unread > 0 ? `Notifications : ${unreadImportant} importante${unreadImportant > 1 ? "s" : ""}, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
        >
          <Bell className="h-4 w-4" />
          {unreadImportant > 0 ? (
            // 6.14.86 (couleur = sens) : rouge seulement pour une menace non lue (attaque subie, espion détecté), neutre sinon.
            <span className={cn("absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center px-0.5 font-mono text-[11px] font-bold leading-none tabular-nums", hasUrgentUnread ? "bg-danger-glow text-space-950" : "border border-slate-400/60 bg-space-800 text-slate-100")}>
              {unreadImportant > 9 ? "9+" : unreadImportant}
            </span>
          ) : unread > 0 ? (
            <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-slate-400" />
          ) : null}
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
            const count = unreadIn(c.id);
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => setTab(c.id)}
                className={cn(
                  "hud-cut-sm flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                  tab === c.id ? "border-cyan-glow/50 bg-cyan-glow/15 text-cyan-glow" : "border-transparent text-slate-400 hover:text-slate-200",
                )}
              >
                {c.label}
                {count > 0 && <span className="bg-space-800 px-1 font-bold tabular-nums text-slate-100">{count}</span>}
              </button>
            );
          })}
        </div>
        {unreadIn(tab) > 0 && (
          <button
            type="button"
            onClick={() => markRead(tab)}
            className="hud-cut-sm mx-1 mb-2 self-end border border-white/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400 hover:border-cyan-glow/40 hover:text-cyan-glow"
          >
            {tab === "all" ? "Tout marquer lu" : `Marquer « ${NOTIFICATION_CATEGORIES.find((c) => c.id === tab)?.label ?? ""} » lu`} ({unreadIn(tab)})
          </button>
        )}
        <div className="flex flex-col gap-1.5 overflow-y-auto px-1 pb-1">
          {shown.length === 0 && <EmptyState size="sm" icon={<Bell />} title="Rien ici" className="px-3 py-4">Rien dans cette catégorie pour l'instant.</EmptyState>}
          {notifPage.items.map((g) => {
            const open = expanded.has(g.key);
            const list = open ? [g.head, ...g.rest] : [g.head];
            return (
              <div key={g.key} className="flex flex-col gap-1">
                {list.map((n) => {
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
                {g.rest.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => (s.has(g.key) ? new Set([...s].filter((k) => k !== g.key)) : new Set([...s, g.key])))}
                    className="hud-cut-sm self-start border border-white/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400 hover:border-cyan-glow/40 hover:text-cyan-glow"
                  >
                    {open ? "Replier" : `+ ${g.rest.length} similaire${g.rest.length > 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            );
          })}
          <Pager {...notifPage.pager} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
