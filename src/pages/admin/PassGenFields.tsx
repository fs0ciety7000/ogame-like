import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { objectiveLabel, type ChronicleObjective } from "@/game/chronicles";
import { PASS_GEN_RULES, tierBudgets, type PassGenRules } from "@/game/passGen";
import { PASS_REWARD_RULES } from "@/game/passSeasons";
import { PASS_BONUS_RULES } from "@/game/seasonPass";
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
  const passRewards = { ...PASS_REWARD_RULES, ...(rules.passRewards as Partial<typeof PASS_REWARD_RULES>) };
  const bonus = { ...PASS_BONUS_RULES, ...(rules.passBonus as Partial<typeof PASS_BONUS_RULES>) };
  const setBonus = (patch: Partial<typeof PASS_BONUS_RULES>) => setRules((r) => ({ ...r, passBonus: { ...bonus, ...patch } }));
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
        <NumberField
          label="Dernier palier : Ambre (avec commandant et cosmétique)"
          value={passRewards.finalAmber}
          min={0}
          step={50}
          onChange={(v) => setRules((r) => ({ ...r, passRewards: { ...passRewards, finalAmber: Math.max(0, Math.round(v ?? 0)) } }))}
        />
        <NumberField
          label="Effort du passe (mois d'activité médiane)"
          value={passRewards.monthEffort}
          min={0.25}
          step={0.25}
          hint="Quantité totale de chaque défi : 4,3 semaines d'activité médiane × cet effort."
          onChange={(v) => setRules((r) => ({ ...r, passRewards: { ...passRewards, monthEffort: v ?? 1 } }))}
        />
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
      <Section title="Passe : paliers bonus après le dernier palier (6.11)">
        <CheckboxField label="Paliers bonus actifs" checked={bonus.enabled} hint="Tout point gagné après le dernier palier avance un palier bonus." onChange={(v) => setBonus({ enabled: v })} />
        <NumberField label="Points par palier bonus" value={bonus.points} min={1} step={10} onChange={(v) => setBonus({ points: Math.max(1, Math.round(v ?? 120)) })} />
        <NumberField label="Jetons de casino par palier bonus" value={bonus.tokens} min={0} step={1} onChange={(v) => setBonus({ tokens: Math.max(0, Math.round(v ?? 1)) })} />
        <NumberField label="Paliers bonus par mois au plus" value={bonus.maxPerMonth} min={0} step={1} onChange={(v) => setBonus({ maxPerMonth: Math.max(0, Math.round(v ?? 10)) })} />
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
        <NumberField
          label="Toute action : médiane par semaine au moins"
          value={g.challengeMinWeekly}
          min={0}
          step={0.25}
          hint="Sous ce seuil (ou à 0), l'action n'entre pas dans les défis : un défi bloque les suivants."
          onChange={(v) => set({ challengeMinWeekly: v ?? 0 })}
        />
        <NumberField label="Rythme d'une action : au moins (× base, jamais plus que la médiane)" value={g.challengeMinFactor} min={0.1} step={0.1} onChange={(v) => set({ challengeMinFactor: v ?? 0.5 })} />
        <NumberField label="Rythme d'une action : au plus (× base)" value={g.challengeMaxFactor} min={0.1} step={0.5} onChange={(v) => set({ challengeMaxFactor: v ?? 3 })} />
        <NumberField
          label="Garde : nouveaux tirages des défis"
          value={g.challengeRedraws}
          min={0}
          step={1}
          hint="Si le joueur médian simulé finit après le jour limite, avant de réduire les seuils."
          onChange={(v) => set({ challengeRedraws: Math.max(0, Math.round(v ?? 5)) })}
        />
        <NumberField label="Garde : pas de réduction des seuils (0,1 = 10 %)" value={g.challengeReduceStep} min={0.05} step={0.05} onChange={(v) => set({ challengeReduceStep: v ?? 0.1 })} />
        <NumberField label="Garde : seuils réduits jusqu'à (0,4 = 40 %)" value={g.challengeReduceMin} min={0.1} step={0.05} onChange={(v) => set({ challengeReduceMin: v ?? 0.4 })} />
        {Object.keys(g.challengeWeights).map((k) => (
          <NumberField
            key={k}
            label={`Poids dans les défis : ${objectiveLabel(k as ChronicleObjective) ?? k}`}
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
