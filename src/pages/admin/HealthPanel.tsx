import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, RefreshCw, TriangleAlert, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HUD_TONE, HudCallout, HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { pb } from "@/lib/pocketbase";
import { assetUrl } from "@/lib/assets";
import { formatNumber, timeAgo } from "@/lib/utils";
import { CURRENT_VERSION } from "@/lib/changelog";
import { currentGameContent } from "@/game/content";
import type { GameStats } from "@/game/analytics";
import type { GameReport } from "@/game/reports";
import { adminFetchStats, adminStuckFleets } from "@/services/adminService";
import { fetchReports } from "@/services/reportService";
import { useMaintenance } from "@/services/maintenanceService";

/* 5.15 : santé du serveur, onglet d'accueil de la console. Une ligne par
   vérification (vert / à vérifier / en panne), relançable, et ce qui
   bouge chez les joueurs. Tout est lu en direct depuis le navigateur. */

type Status = "ok" | "warn" | "bad" | "unknown";
type Check = { id: string; label: string; status: Status; value: string; detail: string; tab?: string };

const STATUS: Record<Status, { tone: HudTone; label: string; icon: typeof CheckCircle2 }> = {
  ok: { tone: "mint", label: "OK", icon: CheckCircle2 },
  warn: { tone: "ember", label: "À vérifier", icon: TriangleAlert },
  bad: { tone: "danger", label: "En panne", icon: XCircle },
  unknown: { tone: "neutral", label: "Inconnu", icon: TriangleAlert },
};

const SITE_CHECK_URL = "https://github.com/fs0ciety7000/ogame-like/actions/workflows/site-check.yml";

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t = performance.now();
  const value = await fn();
  return { ms: Math.round(performance.now() - t), value };
}

/** La page et son script principal arrivent bien (pas une page HTML à la place du JS). */
async function checkSite(): Promise<Check> {
  try {
    const { ms, value: html } = await timed(() => fetch(`/?health=${Date.now()}`, { cache: "no-store" }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))));
    const src = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(html)?.[1];
    if (!src) return { id: "site", label: "Site", status: import.meta.env.DEV ? "ok" : "warn", value: `${ms} ms`, detail: "Page servie, script principal introuvable (normal en développement)." };
    const res = await fetch(src, { cache: "no-store" });
    const type = res.headers.get("content-type") ?? "";
    const js = res.ok && /javascript/.test(type);
    return { id: "site", label: "Site", status: js ? "ok" : "bad", value: `${ms} ms`, detail: js ? "Page et script principal servis correctement." : `Script principal servi en « ${type || res.status} » : boucle de rechargement probable.` };
  } catch (err) {
    return { id: "site", label: "Site", status: "bad", value: "—", detail: `Page inaccessible : ${(err as Error).message}` };
  }
}

async function checkImage(): Promise<Check> {
  const image = currentGameContent().buildings.find((b) => b.image)?.image;
  if (!image) return { id: "assets", label: "Illustrations", status: "unknown", value: "—", detail: "Aucune image de bâtiment à tester." };
  try {
    const { ms, value: res } = await timed(() => fetch(assetUrl(image), { cache: "no-store" }));
    const ok = res.ok && /image\//.test(res.headers.get("content-type") ?? "");
    return { id: "assets", label: "Illustrations", status: ok ? "ok" : "bad", value: `${ms} ms`, detail: ok ? "Les images du jeu arrivent." : `Image de bâtiment non servie (${res.status}).` };
  } catch (err) {
    return { id: "assets", label: "Illustrations", status: "bad", value: "—", detail: (err as Error).message };
  }
}

async function checkDatabase(): Promise<Check> {
  try {
    const { ms } = await timed(() => pb.health.check({ requestKey: null }));
    return { id: "db", label: "Base PocketBase", status: ms > 1500 ? "warn" : "ok", value: `${ms} ms`, detail: ms > 1500 ? "Répond, mais lentement." : "Répond normalement." };
  } catch (err) {
    return { id: "db", label: "Base PocketBase", status: "bad", value: "—", detail: `Injoignable : ${(err as Error).message}` };
  }
}

async function checkBackups(): Promise<Check> {
  try {
    const b = await pb.send<{ latestAtMs: number; count: number; staleAfterMs: number }>("/api/cosmic/admin/backups", { requestKey: null });
    if (!b.latestAtMs) return { id: "backup", label: "Sauvegardes", status: "bad", value: "Aucune", detail: "Aucune sauvegarde trouvée.", tab: "tools" };
    const age = Date.now() - b.latestAtMs;
    const ok = age <= b.staleAfterMs;
    return { id: "backup", label: "Sauvegardes", status: ok ? "ok" : "bad", value: timeAgo(b.latestAtMs), detail: `${b.count} conservées${ok ? "." : " : la dernière est trop ancienne."}`, tab: "tools" };
  } catch {
    return { id: "backup", label: "Sauvegardes", status: "unknown", value: "—", detail: "Route absente : mets à jour les hooks (Outils).", tab: "tools" };
  }
}

async function checkFleets(): Promise<Check> {
  try {
    const r = await adminStuckFleets();
    return { id: "fleets", label: "Flottes bloquées", status: r.count ? "bad" : "ok", value: String(r.count), detail: r.count ? `Arrivées depuis plus de ${Math.round(r.thresholdMs / 60_000)} min sans être traitées : tâche serveur à vérifier.` : "La tâche serveur traite les arrivées.", tab: "tools" };
  } catch {
    return { id: "fleets", label: "Flottes bloquées", status: "unknown", value: "—", detail: "État inconnu.", tab: "tools" };
  }
}

export function HealthPanel({ onOpen }: { onOpen: (tab: string) => void }) {
  const maintenance = useMaintenance();
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [reports, setReports] = useState<GameReport[] | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    const [list, st, open] = await Promise.all([
      Promise.all([checkSite(), checkImage(), checkDatabase(), checkBackups(), checkFleets()]),
      adminFetchStats().catch(() => null),
      fetchReports('status = "new" || status = "in_progress"').catch(() => null),
    ]);
    setChecks(list);
    setStats(st);
    setReports(open);
    setCheckedAt(Date.now());
    setBusy(false);
  }, []);
  useEffect(() => {
    void run();
  }, [run]);

  const all: Check[] = [
    { id: "game", label: "État du jeu", status: maintenance.enabled ? "warn" : "ok", value: maintenance.enabled ? "Maintenance" : "Ouvert", detail: maintenance.enabled ? "Les joueurs sont bloqués." : "Accessible à tous.", tab: "maintenance" },
    ...(checks ?? []),
  ];
  const bad = all.filter((c) => c.status === "bad").length;
  const warn = all.filter((c) => c.status === "warn").length;
  const autoErrors = (reports ?? []).filter((r) => r.autoKey);
  const playerReports = (reports ?? []).filter((r) => !r.autoKey);
  const open = onOpen;

  return (
    <div className="flex flex-col gap-5">
      <HudCallout tone={checks === null ? "neutral" : bad ? "danger" : warn ? "ember" : "mint"} alert={bad > 0} className="flex flex-wrap items-center gap-3">
        <p className="hud-title text-sm text-white">
          {checks === null ? "Vérification en cours…" : bad ? `${bad} point${bad > 1 ? "s" : ""} en panne` : warn ? `${warn} point${warn > 1 ? "s" : ""} à vérifier` : "Tout est vert"}
        </p>
        {checkedAt > 0 && <span className="font-mono text-[11px] text-slate-500">vérifié {timeAgo(checkedAt)} · client v{CURRENT_VERSION}</span>}
        <Button size="sm" variant="outline" className="ml-auto" disabled={busy} onClick={() => void run()}>
          <RefreshCw className={busy ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> Relancer
        </Button>
      </HudCallout>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Activité des joueurs">
        <StatTile label="Actifs 24 h" value={stats ? formatNumber(stats.players.active24h) : "…"} sub={stats ? `sur ${formatNumber(stats.players.total)} inscrits` : undefined} tone="accent" />
        <StatTile label="Actifs 7 j" value={stats ? formatNumber(stats.players.active7d) : "…"} sub={stats && stats.players.total ? `${Math.round((stats.players.active7d / stats.players.total) * 100)} % des inscrits` : undefined} tone="neutral" />
        <StatTile label="Nouveaux 7 j" value={stats ? formatNumber(stats.players.new7d) : "…"} sub="inscriptions" tone="mint" />
        <StatTile label="Signalements" value={reports ? formatNumber(playerReports.length) : "…"} sub={reports ? `${autoErrors.length} erreur${autoErrors.length > 1 ? "s" : ""} auto ouverte${autoErrors.length > 1 ? "s" : ""}` : undefined} tone={autoErrors.length ? "ember" : "neutral"} />
      </section>

      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <h3 className="hud-title text-sm text-white">Vérifications</h3>
          <a href={SITE_CHECK_URL} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-glow">
            Vérification GitHub (toutes les 6 h) <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <ul className="divide-y divide-white/5">
          {all.map((c) => {
            const s = STATUS[c.status];
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <s.icon aria-hidden className="h-4 w-4 shrink-0" style={{ color: HUD_TONE[s.tone] }} />
                <span className="w-40 text-sm text-slate-200">{c.label}</span>
                <HudChip size="sm" tone={s.tone}>
                  {s.label}
                </HudChip>
                <span className="w-24 font-mono text-xs tabular-nums text-slate-300">{c.value}</span>
                <span className="min-w-0 flex-1 text-xs text-slate-500">{c.detail}</span>
                {c.tab && c.status !== "ok" && (
                  <Button size="sm" variant="ghost" onClick={() => open(c.tab!)}>
                    Ouvrir
                  </Button>
                )}
              </li>
            );
          })}
          {checks === null && <li className="px-4 py-3 text-xs text-slate-500">Vérifications en cours…</li>}
        </ul>
      </Card>

      {autoErrors.length > 0 && (
        <Card className="p-0">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <h3 className="hud-title text-sm text-white">Erreurs remontées automatiquement</h3>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => open("reports")}>
              Tous les signalements
            </Button>
          </div>
          <ul className="divide-y divide-white/5">
            {autoErrors.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">{r.title}</span>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  ×{formatNumber(r.occurrences ?? 1)} · {formatNumber(r.affected?.length ?? 1)} joueur{(r.affected?.length ?? 1) > 1 ? "s" : ""}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{timeAgo(r.updatedAtMs)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
