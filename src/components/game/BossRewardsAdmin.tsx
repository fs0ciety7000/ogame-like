import { useState } from "react";
import { toast } from "sonner";
import { Coins, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceIcon } from "@/components/ui/game-icon";
import { isActive, leviathanRanking, type LeviathanState } from "@/game/leviathan";
import { pb } from "@/lib/pocketbase";
import { formatCompact } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v5.10 : administration des récompenses d'un boss — ce que chaque
   participant a reçu, et relance d'une distribution restée bloquée. */

export function BossRewardsAdmin({ state, kind }: { state: LeviathanState | null; kind: "leviathan" | "seasonboss" }) {
  const [busy, setBusy] = useState(false);
  if (!state) return null;
  const ended = !isActive(state, Date.now());
  const ranking = leviathanRanking(state);
  const rewards = state.rewards ?? {};
  // v5.14 : les combats d'avant la 5.10 (ou archivés sans détail) n'ont pas
  // gardé ce que chacun a reçu : ce n'est pas un compte supprimé.
  const hasDetail = Object.keys(rewards).length > 0;
  const stuck = ended && !state.rewarded;

  const distribute = async () => {
    if (!confirm("Verser maintenant les récompenses de ce boss à tous les participants ?")) return;
    setBusy(true);
    try {
      await pb.send("/api/cosmic/admin/bossrewards", { method: "POST", body: { kind, action: "distribute" } });
      toast.success("Récompenses versées.");
    } catch (err) {
      toast.error((err as { response?: { message?: string } })?.response?.message ?? "Distribution impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title flex items-center gap-2 text-sm">
          <Coins className="h-4 w-4 text-gold-glow" /> Récompenses versées (admin)
        </h2>
        <span className="text-xs text-slate-500">{!ended ? "combat en cours" : state.rewarded ? (hasDetail ? `distribuées à ${Object.keys(rewards).length} joueur(s)` : "distribuées (détail non conservé pour ce combat)") : "pas encore distribuées"}</span>
        {stuck && (
          <Button size="sm" variant="danger" className="ml-auto" disabled={busy} onClick={() => void distribute()}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Relancer la distribution
          </Button>
        )}
      </div>
      {ended && state.rewarded && (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className="w-7" />
              <col className="w-[30%]" />
              <col className="w-16" />
              <col />
            </colgroup>
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-1 pr-2 font-normal">#</th>
                <th className="py-1 pr-2 font-normal">Joueur</th>
                <th className="py-1 pr-2 font-normal">Dégâts</th>
                <th className="py-1 font-normal">Récompense</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((c, i) => {
                const r = rewards[c.uid];
                return (
                  <tr key={c.uid} className="border-t border-white/5 align-top">
                    <td className="py-1.5 pr-2 font-mono text-slate-500">{i + 1}</td>
                    <td className="break-words py-1.5 pr-2 text-slate-200">{c.pseudo}</td>
                    <td className="py-1.5 pr-2 font-mono tabular-nums">{formatCompact(c.damage)}</td>
                    <td className="py-1.5">
                      {!r ? (
                        <span className="text-slate-500">{hasDetail ? "— (compte supprimé)" : "—"}</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {(Object.entries(r.gain ?? {}) as [ResourceId, number][]).map(([id, v]) => (
                            <span key={id} className="inline-flex items-center gap-1 font-mono">
                              <ResourceIcon id={id} /> {formatCompact(v)}
                            </span>
                          ))}
                          {r.points ? <span className="text-cyan-glow">+{r.points} pts</span> : null}
                          {r.title ? <span className="text-gold-glow">« {r.title} »</span> : null}
                          {r.relic ? <span className="text-violet-glow">{r.relic}</span> : null}
                          {r.mythic ? <span className="text-[var(--th-rarity-mythic)]">mythique : {r.mythic}</span> : null}
                          {r.tokens ? <span className="text-gold-glow">+{r.tokens} jeton{r.tokens > 1 ? "s" : ""}</span> : null}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
