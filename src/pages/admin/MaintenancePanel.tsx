import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Play, Power, RefreshCw, TimerReset } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HudTag, HudMeter } from "@/components/ui/hud";
import { GameIcon } from "@/components/ui/game-icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/pages/admin/fields";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { formatDuration, cn } from "@/lib/utils";
import { setMaintenance, useMaintenance } from "@/services/maintenanceService";
import { DEFAULT_MAINTENANCE_MESSAGE, maintenanceProgress, maintenanceRemainingMs, type MaintenanceState } from "@/game/maintenance";
import { CURRENT_VERSION } from "@/lib/changelog";

const APP_VERSION = CURRENT_VERSION ?? "2.4.0";

const DURATIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "2 h", minutes: 120 },
  { label: "4 h", minutes: 240 },
  { label: "Indéterminée", minutes: 0 },
];

/** Valeur d'un <input type="datetime-local"> (heure locale). */
function toLocalInput(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

/** Mode maintenance : ferme le jeu aux joueurs (les administrateurs gardent l'accès). */
export function MaintenancePanel() {
  useNowTicker();
  const m = useMaintenance();
  const now = Date.now();
  const [message, setMessage] = useState(m.message);
  const [version, setVersion] = useState(m.version || nextVersion(APP_VERSION));
  const [minutes, setMinutes] = useState(30);
  const [customEnd, setCustomEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"start" | "stop" | null>(null);
  const [preview, setPreview] = useState(false);
  const [autoEnd, setAutoEnd] = useState(m.enabled ? m.autoEnd : true);

  // Formulaire réaligné quand la maintenance change ailleurs (autre admin).
  useEffect(() => {
    if (m.enabled) {
      setMessage(m.message);
      setVersion(m.version);
      setAutoEnd(m.autoEnd);
    }
  }, [m.enabled, m.message, m.version, m.autoEnd]);

  const plannedEnd = customEnd ? new Date(customEnd).getTime() : minutes > 0 ? now + minutes * 60_000 : null;
  const draft: MaintenanceState = {
    enabled: true,
    message,
    version,
    startedAtMs: m.enabled ? m.startedAtMs : now,
    endsAtMs: plannedEnd,
    autoEnd,
  };

  const send = async (request: Parameters<typeof setMaintenance>[0], success: string) => {
    setBusy(true);
    try {
      const out = await setMaintenance(request);
      toast.success(success, out.extended > 0 ? { description: `${out.extended} ultimatum(s) de faction prolongé(s) de la durée de la coupure.` } : undefined);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const start = () => void send({ enabled: true, message, version, endsAtMs: plannedEnd, autoEnd }, m.enabled ? "Maintenance mise à jour." : "Maintenance activée : le jeu est fermé aux joueurs.");
  const stop = () => void send({ enabled: false }, "Maintenance terminée : le jeu est rouvert.");
  const extend = (extra: number) =>
    void send({ enabled: true, message: m.message, version: m.version, endsAtMs: Math.max(now, m.endsAtMs ?? now) + extra * 60_000, autoEnd: m.autoEnd }, `Fin prévue repoussée de ${extra} min.`);

  const remaining = maintenanceRemainingMs(m, now);
  const progress = maintenanceProgress(m, now);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      {/* État actuel */}
      <Card className={cn("relative flex flex-col gap-4 overflow-hidden p-5", m.enabled && "border-gold-glow/40")}>
        {m.enabled && <span aria-hidden className="mt-hazard absolute inset-x-0 top-0 h-1.5" />}
        <div className="flex items-center gap-3">
          <div className={cn("hud-cut relative h-16 w-16 shrink-0 overflow-hidden border", m.enabled ? "border-gold-glow/60" : "border-mint-glow/40")}>
            <img src={assetUrl("/assets/maintenance/operator-avatar.webp")} alt="" className={cn("h-full w-full object-cover", !m.enabled && "opacity-70 grayscale-[40%]")} />
            <GameIcon name={m.enabled ? "repair" : "shield"} className="absolute bottom-0.5 right-0.5 h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="hud-eyebrow text-[10px] text-slate-500">État du jeu</p>
            <p className={cn("hud-title text-2xl", m.enabled ? "text-gold-glow" : "text-mint-glow")}>{m.enabled ? "En maintenance" : "Ouvert"}</p>
          </div>
          <div className="ml-auto flex flex-wrap justify-end gap-1.5">
            {m.enabled ? <HudTag tone="gold">Joueurs bloqués</HudTag> : <HudTag tone="mint">En ligne</HudTag>}
            {m.enabled && m.version && <HudTag>v{m.version}</HudTag>}
          </div>
        </div>

        {m.enabled ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Stat label="Depuis" value={formatDuration((now - m.startedAtMs) / 1000)} />
              <Stat label="Reste" value={remaining === null ? "—" : remaining > 0 ? formatDuration(remaining / 1000) : "dépassé"} warn={remaining === 0} />
              <Stat label={m.autoEnd && m.endsAtMs ? "Réouverture auto" : "Fin prévue"} value={m.endsAtMs ? new Date(m.endsAtMs).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "indéterminée"} />
            </div>
            {progress !== null && <HudMeter percent={progress * 100} tone="var(--color-gold-glow)" />}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => extend(15)}>
                <TimerReset className="h-4 w-4" /> +15 min
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => extend(60)}>
                <TimerReset className="h-4 w-4" /> +1 h
              </Button>
              <Button variant="primary" size="sm" className="ml-auto" disabled={busy} onClick={() => setConfirm("stop")}>
                <Power className="h-4 w-4" /> Terminer la maintenance
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Le jeu est accessible à tous. Pendant une maintenance, les joueurs voient une page d'attente (illustration, message, compte à rebours) et
            ne peuvent plus rien modifier : le serveur refuse leurs actions et les inscriptions. Les administrateurs gardent l'accès complet.
          </p>
        )}

        <ul className="grid gap-1.5 border-t border-white/5 pt-3 text-xs text-slate-400">
          <li className="flex gap-2">
            <GameIcon name="build" /> La production continue et les flottes en vol arrivent normalement.
          </li>
          <li className="flex gap-2">
            <GameIcon name="threat" /> Les factions hostiles sont en pause ; à la fin, les ultimatums en cours sont prolongés de la durée de la coupure.
          </li>
          <li className="flex gap-2">
            <GameIcon name="patrol" /> À la réouverture, la page des joueurs se recharge toute seule (nouvelle version du jeu comprise).
          </li>
        </ul>
      </Card>

      {/* Réglages */}
      <Card className="flex flex-col gap-4 p-5">
        <h3 className="hud-title text-sm text-white">{m.enabled ? "Modifier la maintenance" : "Programmer une maintenance"}</h3>
        <Field label="Message aux joueurs" hint="Vide = message par défaut. Les retours à la ligne sont conservés.">
          <textarea
            value={message}
            rows={4}
            maxLength={600}
            placeholder={DEFAULT_MAINTENANCE_MESSAGE}
            onChange={(e) => setMessage(e.target.value)}
            className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-glow/60"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <Field label="Version annoncée" hint={`Actuelle : v${APP_VERSION}`}>
            <Input value={version} maxLength={20} placeholder="2.5.0" onChange={(e) => setVersion(e.target.value)} />
          </Field>
          <Field label="Durée prévue">
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setMinutes(d.minutes);
                    setCustomEnd("");
                  }}
                  className={cn(
                    "border px-2.5 py-1 font-mono text-xs transition-colors",
                    !customEnd && minutes === d.minutes ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40 hover:text-slate-200",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="…ou fin à une heure précise">
          <Input type="datetime-local" value={customEnd} min={toLocalInput(now)} onChange={(e) => setCustomEnd(e.target.value)} />
        </Field>
        <p className="text-xs text-slate-500">
          {plannedEnd ? `Réouverture affichée vers ${new Date(plannedEnd).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}.` : "Sans heure de fin : les joueurs voient le temps écoulé."}
        </p>
        <label className={cn("flex items-start gap-2 text-sm text-slate-200", !plannedEnd && "opacity-50")}>
          <input type="checkbox" checked={autoEnd} disabled={!plannedEnd} onChange={(e) => setAutoEnd(e.target.checked)} className="mt-1 accent-cyan-400" />
          <span>
            Rouvrir automatiquement à l'heure prévue
            <span className="block text-[11px] text-slate-500">Sinon, la page affiche « finalisation en cours » jusqu'à ce qu'un administrateur termine la maintenance.</span>
          </span>
        </label>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setPreview(true)}>
            <Eye className="h-4 w-4" /> Aperçu
          </Button>
          {m.enabled ? (
            <Button variant="secondary" className="ml-auto" disabled={busy} onClick={start}>
              <RefreshCw className="h-4 w-4" /> Mettre à jour
            </Button>
          ) : (
            <Button variant="danger" className="ml-auto" disabled={busy} onClick={() => setConfirm("start")}>
              <Play className="h-4 w-4" /> Activer la maintenance
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogTitle>{confirm === "start" ? "Fermer le jeu aux joueurs ?" : "Rouvrir le jeu ?"}</DialogTitle>
          <DialogDescription>
            {confirm === "start"
              ? "Les joueurs connectés basculent immédiatement sur la page de maintenance ; leurs actions sont refusées jusqu'à la réouverture."
              : "Les joueurs retrouvent le jeu : leur page se recharge automatiquement. Les ultimatums de faction en cours sont prolongés de la durée de la coupure."}
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button variant={confirm === "start" ? "danger" : "primary"} disabled={busy} onClick={confirm === "start" ? start : stop}>
              {confirm === "start" ? "Activer" : "Terminer la maintenance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {preview && (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
          <MaintenancePage state={m.enabled ? m : draft} />
          <Button variant="secondary" className="fixed right-4 top-4 z-[160]" onClick={() => setPreview(false)}>
            Fermer l'aperçu
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border-l-2 border-gold-glow/40 bg-white/[0.03] px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={cn("tabular-mono text-base font-semibold", warn ? "text-danger-glow" : "text-white")}>{value}</p>
    </div>
  );
}

/** Version suivante proposée par défaut (2.4.0 → 2.5.0). */
function nextVersion(v: string): string {
  const [maj, min] = v.split(".").map((n) => parseInt(n) || 0);
  return `${maj}.${min + 1}.0`;
}
