import { useEffect, useMemo, useRef, useState } from "react";
import { typewrite } from "@/lib/fx/uiFx";
import { Pager, usePaged } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { NotificationCard } from "@/components/game/NotificationCard";
import { Building2, Gift, Loader2, ScrollText, Shield, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { fetchNotificationHistory } from "@/services/playerService";
import { inCategory, NOTIFICATION_CATEGORIES, notificationLink, summarizeKinds, type NotificationCategory } from "@/lib/notificationCategories";
import { cn, formatDateTime } from "@/lib/utils";
import type { GameNotification } from "@/types/game";

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

function dayLabel(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return formatDateTime(d, "weekday");
}

function hourLabel(ms: number): string {
  return formatDateTime(ms, "time");
}

export function JournalPage() {
  const navigate = useNavigate();
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
  // 5.24 : entrées paginées (taille des Réglages), regroupées par jour ; les plus anciennes se chargent depuis la dernière page.
  const journalPage = usePaged(shown, undefined, tab);
  const pageItems = journalPage.items;
  const onLastPage = journalPage.pager.page >= Math.ceil(shown.length / journalPage.pager.size) - 1;
  const days = useMemo(() => {
    const groups: { label: string; items: GameNotification[] }[] = [];
    for (const n of pageItems) {
      const label = dayLabel(n.createdAtMs);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    return groups;
  }, [pageItems]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Compte" title="Journal d'empire" description="Tout ce qui est arrivé à ton empire, jour après jour." />

      {lastVisit > 0 && page >= 1 && (
        <Card className="flex flex-col gap-2 p-4">
          <p className="hud-eyebrow text-cyan-glow/80">Pendant ton absence</p>
          {sinceLastVisit.length === 0 ? (
            <EmptyState size="sm" icon={<ScrollText />} title="Rien de nouveau depuis ta dernière visite" />
          ) : (
            <>
              <TypedLine className="text-sm text-slate-200" text={`${summarizeKinds(sinceLastVisit.map((n) => n.kind))}.`} />
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
                      className={cn("hud-cut-sm flex items-center gap-1.5 border px-2 py-1 text-xs", style.className)}
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

      {/* 6.14.82 (AD-21) : onglets du système (Tabs), comme Réglages et Codex. */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as NotificationCategory)}>
        <TabsList aria-label="Catégories du Journal">
          {NOTIFICATION_CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && <p className="text-sm text-danger-glow">{error}</p>}
      {!loading && shown.length === 0 && !error && (
        <Card className="p-6">
          <EmptyState size="sm" icon={<ScrollText />} title="Rien dans cette catégorie pour l'instant" />
        </Card>
      )}

      {days.map((day) => (
        <section key={day.label} className="flex flex-col gap-2">
          <h2 className="hud-eyebrow first-letter:uppercase text-slate-400">{day.label}</h2>
          <div className="flex flex-col gap-1.5">
            {day.items.map((n) => {
              const link = notificationLink(n);
              const fresh = n.createdAtMs > lastVisit && lastVisit > 0;
              return <NotificationCard key={n.id} n={n} fresh={fresh} time={hourLabel(n.createdAtMs)} onOpen={link ? () => navigate(link) : undefined} />;
            })}
          </div>
        </section>
      ))}

      {loading && (
        <SkeletonList rows={6} />
      )}
      <Pager {...journalPage.pager} />
      {!loading && onLastPage && page > 0 && page < totalPages && (
        <Button variant="outline" className="self-center" onClick={() => void loadPage(page + 1)}>
          Remonter plus loin
        </Button>
      )}
    </div>
  );
}

/** 5.25 : résumé tapé façon terminal de bord (une fois par texte). */
function TypedLine({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (ref.current) void typewrite(ref.current, text);
  }, [text]);
  return (
    <p ref={ref} key={text} className={className}>
      {text}
    </p>
  );
}
