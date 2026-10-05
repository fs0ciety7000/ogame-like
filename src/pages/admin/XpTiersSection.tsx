import type { GameRules } from "@/game/content";
import { XP_SOURCE_LABELS } from "@/game/xpAudit";
import { TIERED_SOURCES, tieredAmount, type TieredSource } from "@/game/xpTiers";
import { CheckboxField, NumberField, Section } from "@/pages/admin/fields";
import { formatNumber } from "@/lib/utils";

/* 5.18 : paliers d'XP journaliers par source et bonus au jeu actif. */

type SetRules = (fn: (r: GameRules) => GameRules) => void;

export function XpTiersSection({ rules, setRules }: { rules: GameRules; setRules: SetRules }) {
  const t = rules.xpTiers;
  const set = (patch: Partial<GameRules["xpTiers"]>) => setRules((r) => ({ ...r, xpTiers: { ...r.xpTiers, ...patch } }));
  const setTier = (src: TieredSource, i: 0 | 1, v: number) => {
    const cur = t.tiers[src] ?? [0, 0];
    const next: [number, number] = i === 0 ? [v, cur[1]] : [cur[0], v];
    set({ tiers: { ...t.tiers, [src]: next } });
  };
  const setMult = (src: TieredSource, v: number) => set({ multipliers: { ...t.multipliers, [src]: v } });
  // Aperçu : ce que rapporte une journée de 10 000 XP de missions brutes.
  const sample = 10_000;
  const sampleOut = Math.round(tieredAmount(0, sample, t.tiers.mission ?? [0, 0], t));
  return (
    <Section title="Paliers d'XP journaliers">
      <CheckboxField label="Activer les paliers et les bonus" checked={t.enabled} onChange={(v) => set({ enabled: v })} />
      <CheckboxField label="Seuils des missions multipliés par le bonus d'un week-end à événement" checked={t.eventScaling} onChange={(v) => set({ eventScaling: v })} />
      <NumberField label="Taux entre les deux seuils (0,5 = 50 %)" value={t.midRate} min={0} step={0.05} onChange={(v) => set({ midRate: Math.min(1, v ?? 0.5) })} />
      <NumberField label="Taux au-delà du second seuil" value={t.highRate} min={0} step={0.05} onChange={(v) => set({ highRate: Math.min(1, v ?? 0.25) })} />
      <div className="overflow-x-auto sm:col-span-2">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="py-1.5 pr-2">Source</th>
              <th className="py-1.5 pr-2">Plein tarif jusqu'à (XP / jour)</th>
              <th className="py-1.5 pr-2">Réduit jusqu'à</th>
              <th className="py-1.5">Bonus (×)</th>
            </tr>
          </thead>
          <tbody>
            {TIERED_SOURCES.map((src) => (
              <tr key={src} className="border-t border-slate-800 align-top">
                <td className="py-1 pr-2 text-slate-300">{XP_SOURCE_LABELS[src]}</td>
                <td className="py-1 pr-2">
                  <NumberField label="" value={t.tiers[src]?.[0] ?? 0} min={0} step={100} onChange={(v) => setTier(src, 0, Math.round(v ?? 0))} />
                </td>
                <td className="py-1 pr-2">
                  <NumberField label="" value={t.tiers[src]?.[1] ?? 0} min={0} step={100} onChange={(v) => setTier(src, 1, Math.round(v ?? 0))} />
                </td>
                <td className="py-1">
                  <NumberField label="" value={t.multipliers[src] ?? 1} min={0} step={0.1} onChange={(v) => setMult(src, v ?? 1)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500 sm:col-span-2">
        Les compteurs repartent à minuit (heure de Paris). Les succès ne sont pas concernés : un succès ne se gagne qu'une fois. Les ressources des missions ne changent pas. Exemple : {formatNumber(sample)} XP de missions dans la journée rapportent <span className="font-mono text-slate-300">{formatNumber(sampleOut)}</span> XP avec ces réglages.
      </p>
    </Section>
  );
}
