import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/hud";
import { pb } from "@/lib/pocketbase";
import { formatCompact } from "@/lib/utils";
import { COMBAT_RULES } from "@/game/combat";
import { currentGameContent } from "@/game/content";
import { runWhatIf, type WhatIfChange, type WhatIfEmpire, type WhatIfSummary } from "@/game/whatIf";
import { NumberField, Section, SelectField } from "@/pages/admin/fields";

/* 5.23 : « et si ? » sur les empires réels de la prod : chaque joueur attaque
   chaque joueur et chaque seigneur avec toute sa flotte, avant puis après le
   changement. Rien n'est enregistré : c'est un banc d'essai. */

export function WhatIfPanel() {
  const [change, setChange] = useState<WhatIfChange>({ warlordPower: 1 });
  const [result, setResult] = useState<{ before: WhatIfSummary; after: WhatIfSummary; count: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const units = currentGameContent().units;

  const run = async () => {
    setBusy(true);
    try {
      const data = await pb.send<{ empires: WhatIfEmpire[] }>("/api/cosmic/admin/whatif", { method: "GET" });
      // Le calcul (des centaines de combats) laisse d'abord la page se redessiner.
      await new Promise((r) => setTimeout(r, 30));
      const out = runWhatIf(data.empires, change);
      setResult({ ...out, count: data.empires.filter((e) => !e.npc).length });
    } catch (err) {
      toast.error(`Simulation impossible : ${(err as Error).message} (hooks à jour ?)`);
    } finally {
      setBusy(false);
    }
  };

  const pct = (v: number) => `${Math.round(v * 100)} %`;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="h-4 w-4 text-cyan-glow" />
        <h2 className="hud-title text-sm text-slate-100">Et si ? (données réelles)</h2>
        <span className="text-xs text-slate-500">25 joueurs les plus puissants · rien n'est enregistré</span>
      </div>
      <Section title="Changement à tester">
        <NumberField label="Puissance des seigneurs (×)" value={change.warlordPower ?? 1} min={0.1} step={0.1} onChange={(v) => setChange((c) => ({ ...c, warlordPower: v ?? 1 }))} />
        <NumberField label="Avantage de classe" value={change.classEdge ?? COMBAT_RULES.classEdge} min={0} step={0.05} onChange={(v) => setChange((c) => ({ ...c, classEdge: v }))} hint={`Actuel : ${COMBAT_RULES.classEdge}`} />
        <SelectField<string>
          label="Unité modifiée"
          value={change.unit?.id ?? ""}
          options={[{ value: "", label: "— aucune —" }, ...units.map((u) => ({ value: u.id, label: u.name }))]}
          onChange={(id) => setChange((c) => ({ ...c, unit: id ? { id, attack: c.unit?.attack ?? 1, defense: c.unit?.defense ?? 1 } : undefined }))}
        />
        {change.unit && (
          <>
            <NumberField label="Attaque de l'unité (×)" value={change.unit.attack ?? 1} min={0.1} step={0.1} onChange={(v) => setChange((c) => ({ ...c, unit: { ...c.unit!, attack: v ?? 1 } }))} />
            <NumberField label="Défense de l'unité (×)" value={change.unit.defense ?? 1} min={0.1} step={0.1} onChange={(v) => setChange((c) => ({ ...c, unit: { ...c.unit!, defense: v ?? 1 } }))} />
          </>
        )}
      </Section>
      <Button className="self-start" disabled={busy} onClick={() => void run()}>
        {busy ? "Simulation…" : "Simuler avant / après"}
      </Button>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile size="sm" label="Joueurs simulés" value={result.before.players.length} sub={`${result.count} actifs comptés`} tone="neutral" />
            <StatTile size="sm" label="Attaques JcJ" value={result.before.pvpFights} tone="neutral" />
            <StatTile size="sm" label="Victoires attaquant avant" value={pct(result.before.pvpWinRate)} tone="accent" />
            <StatTile size="sm" label="Victoires attaquant après" value={pct(result.after.pvpWinRate)} tone={result.after.pvpWinRate > result.before.pvpWinRate ? "ember" : "accent"} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-xs">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-1 pr-2">Seigneur</th>
                  <th className="py-1 pr-2 text-right">Puissance avant</th>
                  <th className="py-1 pr-2 text-right">après</th>
                  <th className="py-1 pr-2 text-right">Battu par (avant)</th>
                  <th className="py-1 text-right">(après)</th>
                </tr>
              </thead>
              <tbody>
                {result.before.warlords.map((w, i) => {
                  const a = result.after.warlords[i];
                  return (
                    <tr key={w.id} className="border-t border-white/5">
                      <td className="py-1.5 pr-2 text-slate-200">{w.name}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">{formatCompact(w.power)}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">{formatCompact(a.power)}</td>
                      <td className="py-1.5 pr-2 text-right font-mono">
                        {w.beatenBy}/{w.of}
                      </td>
                      <td className="py-1.5 text-right font-mono" style={{ color: a.beatenBy === 0 ? "var(--color-ember-glow)" : undefined }}>
                        {a.beatenBy}/{a.of}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">Personne ne bat un seigneur (en braise) : il est hors de portée. Combats simulés sans réparation, sans formation ni capsules, flotte entière engagée.</p>
        </>
      )}
    </Card>
  );
}
