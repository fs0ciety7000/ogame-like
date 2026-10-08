import { useEffect, useMemo, useState } from "react";
import { Radar, RefreshCw, Satellite } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { primaryProbeUnitId, SPY_TIER_LABELS } from "@/game/espionage";
import { computeFullPower } from "@/game/combat";
import { fetchLatestSpyReport } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { quickProbeCount, quickSpy, setQuickProbeCount } from "@/lib/quickSpy";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import type { SpyReport } from "@/types/game";

/* 5.23 : espionnage en masse : jusqu'à 5 cibles d'un coup, puis tableau
   comparatif de leurs derniers rapports (butin possible, forces, fraîcheur). */

export const MASS_SPY_MAX = 5;

interface Candidate {
  uid: string;
  pseudo: string;
}

function reportRow(r: SpyReport | null) {
  const d = r?.data ?? {};
  const loot = Object.values(d.resources ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
  const units = { ...(d.units ?? {}), ...(d.defenses ?? {}) };
  const power = Object.keys(units).length > 0 ? computeFullPower(units, d.techLevels ?? {}, Object.keys(units), ["attack", "defense"]) : null;
  const ships = Object.values(d.units ?? {}).reduce((a, u) => a + (u?.count ?? 0), 0);
  const defenses = Object.values(d.defenses ?? {}).reduce((a, u) => a + (u?.count ?? 0), 0);
  return { loot: d.resources ? loot : null, power, ships: d.units ? ships : null, defenses: d.defenses ? defenses : null };
}

export function MassSpyDialog({ open, onClose, candidates }: { open: boolean; onClose: () => void; candidates: Candidate[] }) {
  const uid = useAuthStore((s) => s.user?.uid);
  const owned = usePlayerStore((s) => s.player?.units[primaryProbeUnitId()]?.count ?? 0);
  const [picked, setPicked] = useState<string[]>([]);
  const [probes, setProbes] = useState(quickProbeCount);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<Record<string, SpyReport | null>>({});
  const [search, setSearch] = useState("");

  const shown = useMemo(() => candidates.filter((c) => c.uid !== uid && c.pseudo.toLowerCase().includes(search.toLowerCase())).slice(0, 30), [candidates, uid, search]);
  const byUid = useMemo(() => new Map(candidates.map((c) => [c.uid, c])), [candidates]);

  const refresh = async (uids = picked) => {
    if (!uid) return;
    const entries = await Promise.all(uids.map(async (t) => [t, await fetchLatestSpyReport(uid, t).catch(() => null)] as const));
    setReports((r) => ({ ...r, ...Object.fromEntries(entries) }));
  };

  useEffect(() => {
    if (open && picked.length > 0) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recharge à l'ouverture et quand la sélection change
  }, [open, picked.join(",")]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MASS_SPY_MAX ? p : [...p, id]));

  const launch = async () => {
    setBusy(true);
    setQuickProbeCount(probes);
    let ok = 0;
    for (const id of picked) {
      const c = byUid.get(id);
      if (c && (await quickSpy(c, probes, true)) !== null) ok++;
    }
    setBusy(false);
    if (ok > 0) {
      const { toast } = await import("sonner");
      toast.success(`${ok} mission${ok > 1 ? "s" : ""} d'espionnage lancée${ok > 1 ? "s" : ""}`, { description: "Le tableau se met à jour à l'arrivée des rapports (bouton Actualiser)." });
    }
  };

  const need = picked.length * probes;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogTitle>Espionnage en masse</DialogTitle>
        <p className="text-sm text-slate-400">
          Jusqu'à {MASS_SPY_MAX} cibles · <span className="font-mono">{owned}</span> sondes à quai
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un joueur"
          aria-label="Rechercher un joueur"
          className="mt-3 h-9 w-full border border-cyan-glow/15 bg-space-900/80 px-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {shown.map((c) => {
            const on = picked.includes(c.uid);
            return (
              <button
                key={c.uid}
                type="button"
                onClick={() => toggle(c.uid)}
                disabled={!on && picked.length >= MASS_SPY_MAX}
                className={cn("hud-cut-sm border px-2 py-1 text-xs transition-colors disabled:opacity-40", on ? "border-cyan-glow/60 bg-cyan-glow/15 text-slate-100" : "border-white/10 text-slate-400 hover:border-cyan-glow/40")}
              >
                {c.pseudo}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Sondes par cible</span>
          <NumberInput size="sm" min={1} max={Math.max(1, owned)} value={probes} onChange={setProbes} aria-label="Sondes par cible" className="w-32" />
          <Button className="ml-auto" disabled={busy || picked.length === 0 || need > owned} onClick={() => void launch()}>
            <Radar className="mr-1.5 h-4 w-4" /> {picked.length === 0 ? "Choisis tes cibles" : `Espionner ${picked.length} cible${picked.length > 1 ? "s" : ""} (${need} sondes)`}
          </Button>
        </div>
        {need > owned && picked.length > 0 && <p className="text-xs text-ember-glow">Pas assez de sondes à quai pour toutes les cibles.</p>}

        <div className="mt-4 flex items-center gap-2">
          <h3 className="hud-title text-sm text-slate-100">Comparatif des derniers rapports</h3>
          <Button variant="ghost" size="sm" className="ml-auto" disabled={picked.length === 0} onClick={() => void refresh()}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
          </Button>
        </div>
        {picked.length === 0 ? (
          <EmptyState size="sm" icon={<Satellite />} title="Aucune cible">Choisis jusqu'à {MASS_SPY_MAX} joueurs ci-dessus.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-xs">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-1 pr-2">Joueur</th>
                  <th className="py-1 pr-2">Rapport</th>
                  <th className="py-1 pr-2 text-right">Ressources</th>
                  <th className="py-1 pr-2 text-right">Vaisseaux</th>
                  <th className="py-1 pr-2 text-right">Défenses</th>
                  <th className="py-1 text-right">Puissance</th>
                </tr>
              </thead>
              <tbody>
                {picked.map((id) => {
                  const r = reports[id] ?? null;
                  const row = reportRow(r);
                  const best = Math.max(...picked.map((x) => reportRow(reports[x] ?? null).loot ?? 0));
                  return (
                    <tr key={id} className="border-t border-white/5">
                      <td className="py-1.5 pr-2 text-slate-200">{byUid.get(id)?.pseudo ?? id}</td>
                      <td className="py-1.5 pr-2 text-slate-400">{r ? `${SPY_TIER_LABELS[r.tier ?? 0]} · ${timeAgo(r.timestamp)}` : "aucun"}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">
                        {row.loot === null ? "—" : formatCompact(row.loot)}
                        {row.loot !== null && row.loot > 0 && row.loot === best && (
                          <HudChip size="sm" tone="gold" className="ml-1">
                            max
                          </HudChip>
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono">{row.ships === null ? "—" : formatCompact(row.ships)}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">{row.defenses === null ? "—" : formatCompact(row.defenses)}</td>
                      <td className="py-1.5 text-right font-mono">{row.power === null ? "—" : formatCompact(row.power)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
