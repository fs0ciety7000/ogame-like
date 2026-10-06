import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarClock, CheckCircle2, LogIn, RefreshCw, Rocket, Server, TriangleAlert, Wrench, XCircle } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HUD_TONE, HudChip, type HudTone } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { useNowTicker } from "@/hooks/useNowTicker";
import { useAuthStore } from "@/store/authStore";
import { cn, formatDuration, timeAgo } from "@/lib/utils";

/* 5.26 : page de statut publique (/statut), lisible sans compte : état du
   jeu, des services et maintenance programmée. Relue toutes les 30 s. */

type Level = "ok" | "degraded" | "down" | "unknown";

interface PublicStatus {
  now: number;
  logicVersion: string;
  maintenance: { enabled: boolean; message: string; version: string; startedAtMs: number; endsAtMs: number | null };
  scheduled: { startAtMs: number; endsAtMs: number | null; message: string; version: string } | null;
  services: { api: Level; tasks: Level; fleets: Level };
}

const LEVEL: Record<Level, { label: string; tone: HudTone; icon: typeof CheckCircle2 }> = {
  ok: { label: "Opérationnel", tone: "mint", icon: CheckCircle2 },
  degraded: { label: "Perturbé", tone: "ember", icon: TriangleAlert },
  down: { label: "Hors service", tone: "danger", icon: XCircle },
  unknown: { label: "Inconnu", tone: "neutral", icon: TriangleAlert },
};

const SERVICES: { id: keyof PublicStatus["services"]; label: string; detail: string; icon: typeof Server }[] = [
  { id: "api", label: "Serveur de jeu", detail: "Connexion, actions, temps réel.", icon: Server },
  { id: "tasks", label: "Tâches automatiques", detail: "Raids, boss, saisons, marché, guerres.", icon: Activity },
  { id: "fleets", label: "Flottes", detail: "Arrivées et retours traités à l'heure.", icon: Rocket },
];

function fmtDate(ms: number) {
  return new Date(ms).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function StatusPage() {
  useNowTicker();
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [checkedAt, setCheckedAt] = useState(0);

  const load = useCallback(async () => {
    const t = performance.now();
    try {
      const s = await pb.send<PublicStatus>("/api/cosmic/status", { requestKey: null });
      setLatency(Math.round(performance.now() - t));
      setStatus(s);
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setCheckedAt(Date.now());
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const now = Date.now();
  const services: Record<string, Level> = failed ? { api: "down", tasks: "unknown", fleets: "unknown" } : (status?.services ?? { api: "unknown", tasks: "unknown", fleets: "unknown" });
  const maintenance = status?.maintenance.enabled;
  const overall: Level = failed ? "down" : maintenance ? "degraded" : Object.values(services).some((l) => l === "degraded") ? "degraded" : status ? "ok" : "unknown";
  const headline = failed ? "Serveur injoignable" : maintenance ? "Maintenance en cours" : overall === "degraded" ? "Service perturbé" : overall === "ok" ? "Tout fonctionne" : "Vérification…";

  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1000px_600px_at_80%_-10%,color-mix(in_srgb,var(--color-cyan-glow)_10%,transparent),transparent_60%)]" />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <img src="/assets/logo/favicon-32.png?v=2.4" alt="" className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-cyan-glow">Cosmic Empires · Statut</p>
            <h1 className="hud-title text-2xl text-slate-100 sm:text-3xl">État des services</h1>
          </div>
          <Link to={user ? "/game" : "/"} className="flex items-center gap-1 border border-cyan-glow/40 px-2.5 py-1 text-xs text-cyan-glow hover:border-cyan-glow">
            <LogIn className="h-3.5 w-3.5" /> {user ? "Retour au jeu" : "Jouer"}
          </Link>
        </header>

        <div className="hud-callout flex flex-wrap items-center gap-3 border px-4 py-4" style={{ borderColor: `color-mix(in srgb, ${HUD_TONE[LEVEL[overall].tone]} 45%, transparent)` }}>
          {(() => {
            const Icon = LEVEL[overall].icon;
            return <Icon className="h-6 w-6 shrink-0" style={{ color: HUD_TONE[LEVEL[overall].tone] }} aria-hidden />;
          })()}
          <div className="min-w-0 flex-1">
            <p className="hud-title text-lg text-slate-100">{headline}</p>
            <p className="font-mono text-[11px] text-slate-500">
              {checkedAt ? `vérifié ${timeAgo(checkedAt)}` : "…"}
              {latency !== null && !failed && ` · réponse en ${latency} ms`}
              {status && ` · logique serveur v${status.logicVersion}`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </Button>
        </div>

        {maintenance && status && (
          <HudPanel icon={<Wrench />} title="Maintenance en cours" tone="gold" accent>
            <p className="whitespace-pre-line text-sm text-slate-300">{status.maintenance.message || "Nos techniciens interviennent sur les serveurs. Ta progression est sauvegardée."}</p>
            <p className="font-mono text-xs text-slate-400">
              Depuis {formatDuration((now - status.maintenance.startedAtMs) / 1000)}
              {status.maintenance.endsAtMs && ` · réouverture prévue ${status.maintenance.endsAtMs > now ? `dans ${formatDuration((status.maintenance.endsAtMs - now) / 1000)}` : "imminente"}`}
              {status.maintenance.version && ` · v${status.maintenance.version}`}
            </p>
          </HudPanel>
        )}

        <HudPanel icon={<Server />} title="Services">
          <ul className="flex flex-col divide-y divide-white/5">
            {SERVICES.map((s) => {
              const l = LEVEL[services[s.id] ?? "unknown"];
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <s.icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-slate-100">{s.label}</span>
                    <span className="block text-[11px] text-slate-500">{s.detail}</span>
                  </span>
                  <HudChip size="sm" tone={l.tone}>
                    {l.label}
                  </HudChip>
                </li>
              );
            })}
          </ul>
        </HudPanel>

        <HudPanel icon={<CalendarClock />} title="Maintenance programmée" tone={status?.scheduled ? "gold" : "muted"}>
          {status?.scheduled ? (
            <div className={cn("flex flex-col gap-1 text-sm")}>
              <p className="text-slate-100">
                {fmtDate(status.scheduled.startAtMs)}
                {status.scheduled.endsAtMs && ` → ${new Date(status.scheduled.endsAtMs).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
              <p className="font-mono text-xs text-gold-glow">dans {formatDuration(Math.max(0, status.scheduled.startAtMs - now) / 1000)}</p>
              {status.scheduled.message && <p className="whitespace-pre-line text-xs text-slate-400">{status.scheduled.message}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucune maintenance prévue.</p>
          )}
        </HudPanel>

        <footer className="border-t border-white/10 pt-4 text-xs text-slate-500">Cette page se met à jour toute seule toutes les 30 secondes.</footer>
      </div>
    </div>
  );
}
