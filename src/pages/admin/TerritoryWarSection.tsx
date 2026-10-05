import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Flag, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import type { GameRules } from "@/game/content";
import { isTerritoryWarActive, nextTerritoryWar, territoryWarStandings } from "@/game/territoryWar";
import { CheckboxField, NumberField, Section, TextField } from "@/pages/admin/fields";
import { adminTerritoryWar, useTerritoryWar } from "@/services/territoryWarService";
import { formatDuration } from "@/lib/utils";

/* 5.17 : guerre de territoire (calendrier, points par secteur, récompenses)
   et ouverture / clôture à la main. */

type SetRules = (fn: (r: GameRules) => GameRules) => void;

const parisDate = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export function TerritoryWarSection({ rules, setRules }: { rules: GameRules; setRules: SetRules }) {
  const t = rules.territoryWar;
  const set = (patch: Partial<GameRules["territoryWar"]>) => setRules((r) => ({ ...r, territoryWar: { ...r.territoryWar, ...patch } }));
  const setPoints = (patch: Partial<GameRules["territoryWar"]["points"]>) => set({ points: { ...t.points, ...patch } });
  const setRewards = (patch: Partial<GameRules["territoryWar"]["rewards"]>) => set({ rewards: { ...t.rewards, ...patch } });
  const war = useTerritoryWar();
  const [hours, setHours] = useState(48);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const live = war && isTerritoryWarActive(war, now) ? war : null;
  const active = !!live;
  const next = nextTerritoryWar(now, t);
  const leader = war ? territoryWarStandings(war)[0] : undefined;

  const run = async (action: "start" | "close") => {
    const ok = await askConfirm(
      action === "start"
        ? { title: "Ouvrir une guerre de territoire ?", message: `Toutes les alliances sont prévenues. Fin dans ${hours} h, puis récompenses.`, confirmLabel: "Ouvrir" }
        : { title: "Clore la guerre maintenant ?", message: "Le classement est figé et les récompenses sont distribuées tout de suite.", confirmLabel: "Clore", tone: "danger" },
    );
    if (!ok) return;
    setBusy(true);
    try {
      await adminTerritoryWar(action, hours);
      toast.success(action === "start" ? "Guerre de territoire ouverte." : "Guerre close, récompenses distribuées.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Guerre de territoire">
      <CheckboxField label="Activer la guerre de territoire (calendrier)" checked={t.enabled} onChange={(v) => set({ enabled: v })} />
      <NumberField label="Un week-end sur N" value={t.everyWeeks} min={1} step={1} onChange={(v) => set({ everyWeeks: Math.min(8, Math.max(1, Math.round(v ?? 2))) })} />
      <NumberField label="Décalage (semaine modulo N)" value={t.weekOffset} min={0} step={1} onChange={(v) => set({ weekOffset: Math.round(v ?? 0) })} />
      <NumberField label="Fin le dimanche, heures avant minuit" value={t.endHoursBeforeMidnight} min={0} step={1} onChange={(v) => set({ endHoursBeforeMidnight: v ?? 2 })} />
      <NumberField label="Victoire en attaque (joueur)" value={t.points.pvpWin} min={0} step={1} onChange={(v) => setPoints({ pvpWin: v ?? 0 })} />
      <NumberField label="Seigneur de guerre pillé" value={t.points.warlordWin} min={0} step={1} onChange={(v) => setPoints({ warlordWin: v ?? 0 })} />
      <NumberField label="Défense tenue" value={t.points.defenseWin} min={0} step={1} onChange={(v) => setPoints({ defenseWin: v ?? 0 })} />
      <NumberField label="Contrôle du secteur, par heure" value={t.points.holdPerHour} min={0} step={1} onChange={(v) => setPoints({ holdPerHour: v ?? 0 })} />
      <NumberField label="Combats comptés entre deux mêmes joueurs" value={t.maxPerPair} min={1} step={1} onChange={(v) => set({ maxPerPair: Math.round(v ?? 3) })} />
      <NumberField label="Jetons par secteur remporté" value={t.rewards.tokensPerSector} min={0} step={1} onChange={(v) => setRewards({ tokensPerSector: v ?? 0 })} />
      <NumberField label="Jetons maximum (secteurs)" value={t.rewards.maxTokens} min={0} step={1} onChange={(v) => setRewards({ maxTokens: v ?? 0 })} />
      <NumberField label="Jetons en plus pour l'alliance première" value={t.rewards.winnerTokens} min={0} step={1} onChange={(v) => setRewards({ winnerTokens: v ?? 0 })} />
      <TextField label="Titre de l'alliance première (vide : aucun)" value={t.rewards.winnerTitle} onChange={(v) => setRewards({ winnerTitle: v })} />
      <div className="flex flex-col gap-2 border border-white/5 bg-white/[0.02] p-2.5 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
          {active ? "Guerre en cours" : "Prochaine guerre (calendrier enregistré)"}
        </p>
        <p className="text-xs text-slate-300">
          {live ? (
            <>
              Fin {parisDate(live.endMs)} (dans <span className="font-mono">{formatDuration((live.endMs - now) / 1000)}</span>){leader ? <> · en tête : <span className="font-mono">[{leader.tag}]</span>, {leader.sectors.length} secteurs</> : null}
              {live.manual ? " · ouverte à la main" : ""}
            </>
          ) : next ? (
            <>
              {parisDate(next.startMs)} → {parisDate(next.endMs)}
            </>
          ) : (
            "Aucune : calendrier désactivé."
          )}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          {!active && (
            <>
              <div className="w-28">
                <NumberField label="Durée (h)" value={hours} min={1} step={1} onChange={(v) => setHours(Math.min(72, Math.max(1, Math.round(v ?? 48))))} />
              </div>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void run("start")}>
                <Flag className="mr-1 h-3.5 w-3.5" /> Ouvrir maintenant
              </Button>
            </>
          )}
          {active && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void run("close")}>
              <Square className="mr-1 h-3.5 w-3.5" /> Clore et récompenser
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to="/game/guerre-territoire">Voir la carte</Link>
          </Button>
        </div>
        <p className="text-[11px] text-slate-500">Ouverture et clôture automatiques (vérifiées toutes les 10 min) ; points de contrôle à chaque calcul des territoires (une fois par heure).</p>
      </div>
    </Section>
  );
}
