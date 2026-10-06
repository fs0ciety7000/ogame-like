import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { OBJECTIVE_LABELS, type ChronicleObjective } from "@/game/chronicles";
import { PASS_GEN_RULES, tierBudgets, type PassGenRules } from "@/game/passGen";
import { CheckboxField, NumberField, Section, TextField } from "@/pages/admin/fields";

/* 6.8.1 : réglages du passe généré (GameRules.passGen) : budget des récompenses, plafonds, rythme, défis. */

const VALUE_LABELS: Record<keyof PassGenRules["values"], string> = {
  amber: "1 Ambre",
  tokens: "1 jeton",
  dossier: "1 dossier",
  capsule3: "Capsule niv. 3",
  capsule4: "Capsule niv. 4",
  capsule5: "Capsule niv. 5",
  relicRare: "Relique rare",
  relicEpic: "Relique épique",
};
const CAP_LABELS: Record<keyof PassGenRules["caps"], string> = { amber: "Ambre", tokens: "Jetons", dossier: "Dossiers", capsules: "Capsules" };
const WEIGHT_LABELS: Record<keyof PassGenRules["weights"], string> = { production: "Production", amber: "Ambre", capsule: "Capsule", dossier: "Dossier", tokens: "Jetons" };

const toList = (s: string) =>
  s
    .split(/[,;\s]+/)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

export function PassGenFields({ rules, setRules }: { rules: GameRules; setRules: Dispatch<SetStateAction<GameRules>> }) {
  const g: PassGenRules = { ...PASS_GEN_RULES, ...rules.passGen };
  const set = (patch: Partial<PassGenRules>) => setRules((r) => ({ ...r, passGen: { ...g, ...r.passGen, ...patch } }));
  const budgets = tierBudgets(30, g);
  const fmt = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");
  return (
    <>
      <Section title="Passe généré : récompenses (6.8.1)">
        <CheckboxField label="Récompenses tirées sous budget" checked={g.enabled} onChange={(v) => set({ enabled: v })} hint="Décoché : ancien gabarit fixe. Le dernier palier (commandant, Ambre, cosmétique) reste hors budget." />
        <NumberField label="Budget des paliers 1 à 29 (h de production)" value={g.budgetHours} min={1} step={5} onChange={(v) => set({ budgetHours: v ?? 1 })} />
        <NumberField label="Courbe (le palier 29 vaut 1 + x fois le 1er)" value={g.curve} min={0} step={0.5} onChange={(v) => set({ curve: v ?? 0 })} />
        <NumberField label="Renfort des jalons (×)" value={g.milestoneBoost} min={1} step={0.5} onChange={(v) => set({ milestoneBoost: v ?? 1 })} />
        <TextField label="Paliers jalons" value={g.milestones.join(", ")} onChange={(v) => set({ milestones: toList(v) })} hint="Deux récompenses, valeur renforcée." />
        <TextField label="Reliques rares aux paliers" value={g.rareRelicTiers.join(", ")} onChange={(v) => set({ rareRelicTiers: toList(v) })} />
        <TextField label="Reliques épiques aux paliers" value={g.epicRelicTiers.join(", ")} onChange={(v) => set({ epicRelicTiers: toList(v) })} />
        <NumberField label="Production au plus par récompense (h)" value={g.productionMaxHours} min={1} step={1} onChange={(v) => set({ productionMaxHours: v ?? 1 })} />
        <p className="text-xs text-slate-400 sm:col-span-2">
          Aperçu : palier 1 ≈ <span className="font-mono tabular-nums">{fmt(budgets[0])} h</span>, palier 10 ≈ <span className="font-mono tabular-nums">{fmt(budgets[9])} h</span>, palier 29 ≈{" "}
          <span className="font-mono tabular-nums">{fmt(budgets[28])} h</span>.
        </p>
        {(Object.keys(VALUE_LABELS) as (keyof PassGenRules["values"])[]).map((k) => (
          <NumberField key={k} label={`Valeur : ${VALUE_LABELS[k]} (h)`} value={g.values[k]} min={0} step={0.1} onChange={(v) => set({ values: { ...g.values, [k]: v ?? 0 } })} />
        ))}
        {(Object.keys(CAP_LABELS) as (keyof PassGenRules["caps"])[]).map((k) => (
          <NumberField key={k} label={`Plafond du mois : ${CAP_LABELS[k]}`} value={g.caps[k]} min={0} step={1} onChange={(v) => set({ caps: { ...g.caps, [k]: Math.round(v ?? 0) } })} />
        ))}
        {(Object.keys(WEIGHT_LABELS) as (keyof PassGenRules["weights"])[]).map((k) => (
          <NumberField key={k} label={`Poids de tirage : ${WEIGHT_LABELS[k]}`} value={g.weights[k]} min={0} step={0.5} onChange={(v) => set({ weights: { ...g.weights, [k]: v ?? 0 } })} />
        ))}
      </Section>
      <Section title="Passe généré : rythme et défis (6.8.1)">
        <NumberField label="Jour de fin visé (joueur médian)" value={g.targetMedianDay} min={1} step={1} onChange={(v) => set({ targetMedianDay: Math.round(v ?? 24) })} />
        <NumberField label="Pas avant ce jour (plus actif)" value={g.targetTopDay} min={1} step={1} onChange={(v) => set({ targetTopDay: Math.round(v ?? 15) })} />
        <NumberField label="Fin du médian au plus tard (jour)" value={g.latestMedianDay} min={1} step={1} onChange={(v) => set({ latestMedianDay: Math.round(v ?? 28) })} />
        <NumberField label="« Plus actif » : centile (0,9 = 9e décile)" value={g.topPercentile} min={0.5} step={0.05} onChange={(v) => set({ topPercentile: v ?? 0.9 })} />
        <NumberField label="Points par palier : minimum" value={g.pointsMin} min={1} step={5} onChange={(v) => set({ pointsMin: Math.round(v ?? 25) })} />
        <NumberField label="Points par palier : maximum" value={g.pointsMax} min={1} step={5} onChange={(v) => set({ pointsMax: Math.round(v ?? 200) })} />
        <NumberField
          label="Actions passives : médiane par semaine au moins"
          value={g.passiveMinWeekly}
          min={0}
          step={0.25}
          hint="Seigneurs, assauts de boss, raids : le joueur ne les déclenche pas à volonté."
          onChange={(v) => set({ passiveMinWeekly: v ?? 0 })}
        />
        {Object.keys(g.challengeWeights).map((k) => (
          <NumberField
            key={k}
            label={`Poids dans les défis : ${OBJECTIVE_LABELS[k as ChronicleObjective] ?? k}`}
            value={g.challengeWeights[k]}
            min={0}
            step={0.25}
            onChange={(v) => set({ challengeWeights: { ...g.challengeWeights, [k]: v ?? 0 } })}
          />
        ))}
      </Section>
    </>
  );
}
