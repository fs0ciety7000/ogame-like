import { Gem } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { amberMonth, defaultAmberProfiles, shopOneTimeCost } from "@/game/amberBudget";
import { formatNumber } from "@/lib/utils";

/* 5.15.12 : Ambre gagnée en un mois selon trois profils, face au Comptoir.
   Repère : un joueur régulier devrait pouvoir s'offrir le plan du Traqueur
   en un à deux mois, pas en une semaine. */

export function AmberBudgetCard() {
  const profiles = defaultAmberProfiles();
  const rows = profiles.map((p) => ({ p, m: amberMonth(p) }));
  const labels = rows[0].m.lines.map((l) => l.label);
  const oneTime = shopOneTimeCost();
  return (
    <HudPanel icon={<Gem />} title="Budget d'Ambre par mois (hypothèses)" tone="gold">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-xs">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <th className="py-1 pr-3 font-normal">Source</th>
              {rows.map(({ p }) => (
                <th key={p.id} className="py-1 pl-3 text-right font-normal">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label} className="border-t border-white/5">
                <td className="py-1 pr-3 text-slate-300">{label}</td>
                {rows.map(({ p, m }) => (
                  <td key={p.id} className="py-1 pl-3 text-right font-mono tabular-nums text-slate-200">
                    {formatNumber(m.lines[i].amount)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-gold-glow/30">
              <td className="py-1 pr-3 text-white">Total du mois</td>
              {rows.map(({ p, m }) => (
                <td key={p.id} className="py-1 pl-3 text-right font-mono font-bold tabular-nums text-gold-glow">
                  {formatNumber(m.total)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-1 pr-3 text-slate-400">Mois pour tout le Comptoir ({formatNumber(oneTime)} Ambre, plan et cosmétiques)</td>
              {rows.map(({ p, m }) => (
                <td key={p.id} className="py-1 pl-3 text-right font-mono tabular-nums text-slate-300">
                  {m.total > 0 ? (oneTime / m.total).toFixed(1).replace(".", ",") : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        En plus, une seule fois : {formatNumber(rows[0].m.codexOnce)} Ambre pour un Codex complet. Profils : primes par jour et palier moyen, proies d'élite, jours de série, épisodes, palier du passe.
      </p>
    </HudPanel>
  );
}
