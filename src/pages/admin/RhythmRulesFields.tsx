import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { PRESTIGE_RULES, type PrestigeMonument } from "@/game/prestige";
import { RESEARCH_RULES } from "@/game/technologies";
import { Button } from "@/components/ui/button";
import { CheckboxField, NumberField, Section, TextField } from "@/pages/admin/fields";

/* =====================================================
   Rythme long terme (proposals/rythme-long-terme.md §5.1 et §5.2) :
   - 6.14.84 (RL-1) : Admin → Règles → Labo, croissance des coûts et durées
     des recherches, recherche tardive et durée maximale d'un niveau (groupe
     `research`). Valeurs par défaut neutres ; la bascule est le lot RL-3.
   - 6.14.85 (RL-2) : projets de prestige (groupe `prestige`).
   Les mêmes champs restent dans « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;

/** Groupes du registre, typés par leurs valeurs par défaut (réglage partiel fusionné). */
const researchRules = (r: R) => ({ ...RESEARCH_RULES, ...((r as unknown as Record<string, unknown>).research as Partial<typeof RESEARCH_RULES>) });
const prestigeRules = (r: R) => ({ ...PRESTIGE_RULES, ...((r as unknown as Record<string, unknown>).prestige as Partial<typeof PRESTIGE_RULES>) });

const pos = (v: number | undefined, d: number, min = 0) => Math.max(min, Number.isFinite(v as number) ? (v as number) : d);
const int = (v: number | undefined, d: number, min = 0) => Math.max(min, Math.round(Number.isFinite(v as number) ? (v as number) : d));

export function RhythmRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const research = researchRules(rules);
  const prestige = prestigeRules(rules);
  const setResearch = (p: Partial<typeof RESEARCH_RULES>) => setRules((r) => ({ ...r, research: { ...researchRules(r), ...p } }) as R);
  const setPrestige = (p: Partial<typeof PRESTIGE_RULES>) => setRules((r) => ({ ...r, prestige: { ...prestigeRules(r), ...p } }) as R);
  const monuments: PrestigeMonument[] = Array.isArray(prestige.monuments) ? prestige.monuments : [];
  const setMonument = (i: number, p: Partial<PrestigeMonument>) => setPrestige({ monuments: monuments.map((m, j) => (j === i ? { ...m, ...p } : m)) });

  return (
    <>
      <Section title="Labo : coûts et durées des recherches (6.14.84)">
        <NumberField label="Recherches en parallèle" value={research.maxConcurrent} min={1} step={1} onChange={(v) => setResearch({ maxConcurrent: int(v, 4, 1) })} />
        <NumberField
          label="Croissance du coût par niveau (×)"
          value={research.costGrowth}
          min={1}
          step={0.05}
          hint="Coût du niveau n = coût de base × ce nombre^(n − 1). 2,7 = valeur historique. Une techno peut avoir sa propre croissance (Contenu → Technologies)."
          onChange={(v) => setResearch({ costGrowth: pos(v, 2.7, 1) })}
        />
        <NumberField
          label="Croissance de la durée par niveau (×)"
          value={research.timeGrowth}
          min={1}
          step={0.01}
          hint="Durée du niveau n = durée de base × ce nombre^(n − 1). 1,67 = valeur historique."
          onChange={(v) => setResearch({ timeGrowth: pos(v, 1.67, 1) })}
        />
        <NumberField
          label="Recherche tardive : à partir du niveau"
          value={research.lateFromLevel}
          min={0}
          step={1}
          hint="0 = jamais. Proposition RL-3 : 6 (les niveaux 1 à 5 restent rapides)."
          onChange={(v) => setResearch({ lateFromLevel: int(v, 0) })}
        />
        <NumberField
          label="Recherche tardive : durée multipliée par (×)"
          value={research.lateTimeFactor}
          min={1}
          step={1}
          hint="1 = sans effet. Proposition RL-3 : 30. Le coût ne change pas."
          onChange={(v) => setResearch({ lateTimeFactor: pos(v, 1, 1) })}
        />
        <NumberField
          label="Durée maximale d'un niveau (h, avant réductions)"
          value={Math.round((research.maxLevelSeconds / 3600) * 100) / 100}
          min={0}
          step={1}
          hint="0 = sans plafond. Proposition RL-3 : 168 h (7 jours). Les réductions de durée (technos, officiers, talents) s'appliquent après."
          onChange={(v) => setResearch({ maxLevelSeconds: Math.round(pos(v, 0) * 3600) })}
        />
      </Section>
      <Section title="Projets de prestige (6.14.85)">
        <CheckboxField label="Nouveaux projets ouverts" checked={prestige.enabled !== false} hint="Décoché : plus de nouveau projet. Un projet en cours se termine ; compteurs, monuments et succès restent." onChange={(v) => setPrestige({ enabled: v })} />
        <NumberField
          label="Coût d'un projet (h de production commune)"
          value={prestige.hoursPerProject}
          min={0.25}
          step={0.5}
          hint="Heures de la production du moment (extracteurs × technos), ressource par ressource. Proposition : 8 h."
          onChange={(v) => setPrestige({ hoursPerProject: pos(v, 8, 0.25) })}
        />
        <NumberField label="Durée d'un projet (h)" value={prestige.durationHours} min={0.25} step={0.5} hint="Un seul projet à la fois (I32)." onChange={(v) => setPrestige({ durationHours: pos(v, 8, 0.25) })} />
        <NumberField
          label="Ouverture : niveau des 4 extracteurs"
          value={prestige.unlockExtractorLevel}
          min={0}
          step={1}
          hint="Fin du premier palier = 10. La page Prestige s'ouvre au menu à ce moment-là."
          onChange={(v) => setPrestige({ unlockExtractorLevel: int(v, 10) })}
        />
        <NumberField label="Points de prestige par projet" value={prestige.pointsPerProject} min={0} step={1} hint="Classement « Prestige ». Un projet déjà achevé garde ses points." onChange={(v) => setPrestige({ pointsPerProject: int(v, 8) })} />
        <NumberField
          label="Croissance du coût par projet achevé (×)"
          value={prestige.growth}
          min={1}
          step={0.05}
          hint="1 = coût constant en heures (proposition). 1,1 = +10 % d'heures à chaque projet achevé."
          onChange={(v) => setPrestige({ growth: pos(v, 1, 1) })}
        />
      </Section>
      <Section title="Projets de prestige : monuments de la fiche publique">
        {monuments.map((m, i) => (
          <div key={i} className="flex items-end gap-2 sm:col-span-2">
            <NumberField label="Dès (projets)" value={m.projects} min={1} step={1} onChange={(v) => setMonument(i, { projects: int(v, 1, 1) })} />
            <TextField label="Nom du monument" value={m.name} onChange={(v) => setMonument(i, { name: v })} className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setPrestige({ monuments: monuments.filter((_, j) => j !== i) })}>
              Retirer
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="self-start" onClick={() => setPrestige({ monuments: [...monuments, { projects: (monuments[monuments.length - 1]?.projects ?? 0) * 2 || 1, name: "Nouveau monument" }] })}>
          Ajouter un monument
        </Button>
      </Section>
    </>
  );
}
