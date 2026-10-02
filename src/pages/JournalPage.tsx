import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Gift, Loader2, ScrollText, Shield, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { fetchNotificationHistory } from "@/services/playerService";
import { inCategory, NOTIFICATION_CATEGORIES, summarizeKinds, type NotificationCategory } from "@/lib/notificationCategories";
import { cn } from "@/lib/utils";
import type { GameNotification, NotificationKind } from "@/types/game";

/* =====================================================
   Journal d'empire : tout l'historique des notifications, jour par jour,
   avec en tête le résumé de ce qui s'est passé depuis la dernière visite.
===================================================== */

const VISIT_KEY = "cosmic-empires:journal-visit";

function readLastVisit(): number {
  try {
    return Number(localStorage.getItem(VISIT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveVisit(ms: number) {
  try {
    localStorage.setItem(VISIT_KEY, String(ms));
  } catch {
    /* navigation privée : le résumé couvrira toute la première page */
  }
}

const CATEGORY_STYLE: Record<Exclude<NotificationCategory, "all">, { icon: typeof Swords; className: string }> = {
  build: { icon: Building2, className: "text-cyan-glow border-cyan-glow/30 bg-cyan-glow/10" },
  war: { icon: Swords, className: "text-danger-glow border-danger-glow/30 bg-danger-glow/10" },
  rewards: { icon: Gift, className: "text-gold-glow border-gold-glow/30 bg-gold-glow/10" },
  social: { icon: Shield, className: "text-violet-glow border-violet-glow/30 bg-violet-glow/10" },
};

function categoryOf(kind: NotificationKind): Exclude<NotificationCategory, "all"> {
  const found = NOTIFICATION_CATEGORIES.find((c) => c.id !== "all" && inCategory(kind, c.id))?.id;
  return (found ?? "social") as Exclude<NotificationCategory, "all">;
}

/** Liens vers la page où agir selon le type d'évènement. */
const KIND_LINKS: Partial<Record<NotificationKind, string>> = {
  building: "/game/batiments",
  research: "/game/labo",
  unit: "/game/unites",
  mission: "/game/missions",
  "combat-attacker": "/game/combats",
  "combat-defender": "/game/combats",
  spy: "/game/combats",
  achievement: "/game/succes",
  alliance: "/game/alliance",
  message: "/game/messages",
  debris: "/game/galaxie",
  report: "/game/signalements",
};

function dayLabel(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function hourLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function JournalPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  // Dernière visite figée à l'ouverture : le résumé reste affiché pendant la lecture.
  const [lastVisit] = useState(readLastVisit);
  const [items, setItems] = useState<GameNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<NotificationCategory>("all");

  const loadPage = async (next: number) => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotificationHistory(uid, next, 100);
      setItems((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...res.items.filter((n) => !seen.has(n.id))];
      });
      setPage(next);
      setTotalPages(res.totalPages);
    } catch {
      setError("Impossible de charger le journal. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(1);
    saveVisit(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois par joueur
  }, [uid]);

  const sinceLastVisit = useMemo(() => items.filter((n) => n.createdAtMs > lastVisit), [items, lastVisit]);
  const shown = useMemo(() => items.filter((n) => inCategory(n.kind, tab)), [items, tab]);
  const days = useMemo(() => {
    const groups: { label: string; items: GameNotification[] }[] = [];
    for (const n of shown) {
      const label = dayLabel(n.createdAtMs);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    return groups;
  }, [shown]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Compte" title="Journal d'empire" description="Tout ce qui est arrivé à ton empire, jour après jour." />

      {lastVisit > 0 && page >= 1 && (
        <Card className="flex flex-col gap-2 p-4">
          <p className="hud-eyebrow text-cyan-glow/80">Pendant ton absence</p>
          {sinceLastVisit.length === 0 ? (
            <p className="text-sm text-slate-400">Rien de nouveau depuis ta dernière visite du journal.</p>
          ) : (
            <>
              <p className="text-sm text-slate-200">{summarizeKinds(sinceLastVisit.map((n) => n.kind))}.</p>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_CATEGORIES.filter((c) => c.id !== "all").map((c) => {
                  const count = sinceLastVisit.filter((n) => inCategory(n.kind, c.id)).length;
                  if (count === 0) return null;
                  const style = CATEGORY_STYLE[c.id as Exclude<NotificationCategory, "all">];
                  const Icon = style.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTab(c.id)}
                      className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs", style.className)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {c.label} : {count}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-1" role="tablist">
        {NOTIFICATION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              tab === c.id ? "bg-cyan-glow/15 text-cyan-glow" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger-glow">{error}</p>}
      {!loading && shown.length === 0 && !error && (
        <Card className="flex items-center gap-3 p-6 text-sm text-slate-400">
          <ScrollText className="h-5 w-5 text-slate-500" />
          Rien dans cette catégorie pour l'instant.
        </Card>
      )}

      {days.map((day) => (
        <section key={day.label} className="flex flex-col gap-2">
          <h2 className="hud-eyebrow first-letter:uppercase text-slate-400">{day.label}</h2>
          <Card className="divide-y divide-white/5 p-0">
            {day.items.map((n) => {
              const style = CATEGORY_STYLE[categoryOf(n.kind)];
              const Icon = style.icon;
              const link = KIND_LINKS[n.kind];
              const fresh = n.createdAtMs > lastVisit && lastVisit > 0;
              return (
                <div key={n.id} className={cn("flex gap-3 px-3 py-2.5", fresh && "bg-cyan-glow/5")}>
                  <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border", style.className)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn("text-sm font-medium", fresh ? "text-slate-100" : "text-slate-300")}>{n.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-slate-500">{hourLabel(n.createdAtMs)}</span>
                    </div>
                    <p className="mt-0.5 break-words text-xs text-slate-400">{n.message}</p>
                    {link && (
                      <Link to={link} className="mt-1 inline-block text-[11px] text-cyan-glow/80 hover:text-cyan-glow">
                        Voir →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      ))}

      {loading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      )}
      {!loading && page > 0 && page < totalPages && (
        <Button variant="outline" className="self-center" onClick={() => void loadPage(page + 1)}>
          Remonter plus loin
        </Button>
      )}
    </div>
  );
}
