import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { objectiveLabel, type ChronicleObjective } from "@/game/chronicles";
import { CHRONICLE_GEN_RULES, type ChronicleGenRules } from "@/game/chronicleGen";
import { chapterArchetypes } from "@/game/procedural";
import { THEME_ROTATION } from "@/game/seasonCatalog";
import { CheckboxField, NumberField, Section, SelectField } from "@/pages/admin/fields";

/* 6.8.2 : réglages des chapitres générés (GameRules.chronicleGen) : récompenses des épisodes, objectifs, difficulté, faction du thème. */

const WEIGHT_LABELS: Record<keyof ChronicleGenRules["weights"], string> = { production: "Production", amber: "Ambre", capsule: "Capsule", dossier: "Dossier", tokens: "Jetons" };
const CAP_LABELS: Record<keyof ChronicleGenRules["caps"], string> = { amber: "Ambre", tokens: "Jetons", dossier: "Dossiers", capsules: "Capsules" };
const ucfirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ChronicleGenFields({ rules, setRules }: { rules: GameRules; setRules: Dispatch<SetStateAction<GameRules>> }) {
  const g: ChronicleGenRules = { ...CHRONICLE_GEN_RULES, ...rules.chronicleGen };
  const set = (patch: Partial<ChronicleGenRules>) => setRules((r) => ({ ...r, chronicleGen: { ...g, ...r.chronicleGen, ...patch } }));
  const factions = chapterArchetypes().map((a) => ({ value: a.id, label: ucfirst(a.faction) }));
  return (
    <>
      <Section title="Chroniques générées : récompenses et difficulté (6.8.2)">
        <CheckboxField label="Récompenses des épisodes tirées sous budget" checked={g.enabled} onChange={(v) => set({ enabled: v })} hint="Même table de valeurs que le passe. Décoché : ancien gabarit." />
        <NumberField label="Budget des 4 épisodes (h de production, × difficulté)" value={g.episodeBudgetHours} min={1} step={1} onChange={(v) => set({ episodeBudgetHours: v ?? 1 })} />
        <NumberField label="Courbe (l'épisode 4 vaut 1 + x fois le 1er)" value={g.episodeCurve} min={0} step={0.25} onChange={(v) => set({ episodeCurve: v ?? 0 })} />
        {(Object.keys(WEIGHT_LABELS) as (keyof ChronicleGenRules["weights"])[]).map((k) => (
          <NumberField key={k} label={`Poids de tirage : ${WEIGHT_LABELS[k]}`} value={g.weights[k]} min={0} step={0.5} onChange={(v) => set({ weights: { ...g.weights, [k]: v ?? 0 } })} />
        ))}
        {(Object.keys(CAP_LABELS) as (keyof ChronicleGenRules["caps"])[]).map((k) => (
          <NumberField key={k} label={`Plafond du chapitre : ${CAP_LABELS[k]}`} value={g.caps[k]} min={0} step={1} onChange={(v) => set({ caps: { ...g.caps, [k]: Math.round(v ?? 0) } })} />
        ))}
        <NumberField label="Chapitre terminé : Ambre" value={g.completionAmber} min={0} step={5} onChange={(v) => set({ completionAmber: Math.round(v ?? 0) })} />
        <NumberField label="Relique épique à partir de la difficulté" value={g.completionEpicFrom} min={0} step={0.05} onChange={(v) => set({ completionEpicFrom: v ?? 1.2 })} />
        <NumberField label="Difficulté minimale" value={g.difficultyMin} min={0.1} step={0.05} onChange={(v) => set({ difficultyMin: v ?? 0.7 })} />
        <NumberField label="Difficulté maximale" value={g.difficultyMax} min={1} step={0.05} onChange={(v) => set({ difficultyMax: v ?? 1.4 })} />
        <NumberField label="Part visée qui termine les épisodes (0,5 = 50 %)" value={g.targetCompletion} min={0.05} step={0.05} onChange={(v) => set({ targetCompletion: v ?? 0.5 })} />
        <NumberField label="Épisode mûr après (jours)" value={g.matureEpisodeDays} min={1} step={1} onChange={(v) => set({ matureEpisodeDays: Math.round(v ?? 5) })} />
        <NumberField label="Quantité demandée : au moins (× base)" value={g.objectiveMinFactor} min={0.1} step={0.1} onChange={(v) => set({ objectiveMinFactor: v ?? 0.5 })} />
        <NumberField label="Quantité demandée : au plus (× base)" value={g.objectiveMaxFactor} min={0.1} step={0.5} onChange={(v) => set({ objectiveMaxFactor: v ?? 3 })} />
        <NumberField
          label="Épisode 3 : médiane par semaine au moins"
          value={g.stretchMinWeekly}
          min={0}
          step={0.25}
          hint="Le rebondissement prend une action peu pratiquée mais faisable. 0 : la moins pratiquée de toutes."
          onChange={(v) => set({ stretchMinWeekly: v ?? 0 })}
        />
      </Section>
      <Section title="Chroniques générées : objectifs et faction du mois (6.8.2)">
        {Object.keys(g.objectiveWeights).map((k) => (
          <NumberField
            key={k}
            label={`Poids dans les objectifs : ${objectiveLabel(k as ChronicleObjective) ?? k}`}
            value={g.objectiveWeights[k]}
            min={0}
            step={0.25}
            onChange={(v) => set({ objectiveWeights: { ...g.objectiveWeights, [k]: v ?? 0 } })}
          />
        ))}
        <CheckboxField label="Faction du chapitre selon le thème du passe" checked={g.followPassTheme} onChange={(v) => set({ followPassTheme: v })} hint="Sauf si elle était déjà là le mois précédent." />
        {THEME_ROTATION.map((t) => (
          <SelectField key={t} label={`Thème « ${t} »`} value={g.themeArchetypes[t] ?? factions[0].value} options={factions} onChange={(v) => set({ themeArchetypes: { ...g.themeArchetypes, [t]: v } })} />
        ))}
      </Section>
    </>
  );
}
