import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { PRESTIGE_RULES, type PrestigeMonument } from "@/game/prestige";
import { RESEARCH_RULES } from "@/game/technologies";
import { RHYTHM_PREVIOUS, RHYTHM_RULES, rhythmAnnounceAt, rhythmPhase, type RhythmRules } from "@/game/rhythm";
import { Button } from "@/components/ui/button";
import { CheckboxField, Field, NumberField, Section, TextField } from "@/pages/admin/fields";
import { formatDateTime } from "@/lib/utils";

/* =====================================================
   Rythme long terme (proposals/rythme-long-terme.md §5.1 et §5.2) :
   - 6.14.84 (RL-1) : Admin → Règles → Labo, croissance des coûts et durées
     des recherches, recherche tardive et durée maximale d'un niveau (groupe
     `research`). Valeurs par défaut neutres ; la bascule est le lot RL-3.
   - 6.14.85 (RL-2) : projets de prestige (groupe `prestige`).
   - 6.14.88 (RL-3) : bascule datée du rythme (groupe `rhythm`, rhythm.ts) :
     date, annonce et valeurs prises à la date par chaque réglage resté à
     son ancienne valeur par défaut.
   Les mêmes champs restent dans « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;

/** Groupes du registre, typés par leurs valeurs par défaut (réglage partiel fusionné). */
const researchRules = (r: R) => ({ ...RESEARCH_RULES, ...((r as unknown as Record<string, unknown>).research as Partial<typeof RESEARCH_RULES>) });
const prestigeRules = (r: R) => ({ ...PRESTIGE_RULES, ...((r as unknown as Record<string, unknown>).prestige as Partial<typeof PRESTIGE_RULES>) });
const rhythmRules = (r: R): RhythmRules => ({ ...RHYTHM_RULES, ...((r as unknown as Record<string, unknown>).rhythm as Partial<RhythmRules>) });

/** Date et heure locales pour un champ `datetime-local` (et retour). */
function toLocalInput(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

const PHASE_TEXT: Record<ReturnType<typeof rhythmPhase>, string> = {
  off: "Bascule coupée : les anciennes valeurs restent en vigueur.",
  later: "Bascule à venir ; l'annonce n'est pas encore parue.",
  announced: "Bascule annoncée aux joueurs (modale et /game/annonces).",
  switched: "Bascule faite : les nouvelles valeurs sont en vigueur.",
};

const pos = (v: number | undefined, d: number, min = 0) => Math.max(min, Number.isFinite(v as number) ? (v as number) : d);
const int = (v: number | undefined, d: number, min = 0) => Math.max(min, Math.round(Number.isFinite(v as number) ? (v as number) : d));

export function RhythmRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const research = researchRules(rules);
  const prestige = prestigeRules(rules);
  const setResearch = (p: Partial<typeof RESEARCH_RULES>) => setRules((r) => ({ ...r, research: { ...researchRules(r), ...p } }) as R);
  const setPrestige = (p: Partial<typeof PRESTIGE_RULES>) => setRules((r) => ({ ...r, prestige: { ...prestigeRules(r), ...p } }) as R);
  const rhythm = rhythmRules(rules);
  const setRhythm = (p: Partial<RhythmRules>) => setRules((r) => ({ ...r, rhythm: { ...rhythmRules(r), ...p } }) as R);
  const phase = rhythmPhase(rhythm, Date.now());
  const monuments: PrestigeMonument[] = Array.isArray(prestige.monuments) ? prestige.monuments : [];
  const setMonument = (i: number, p: Partial<PrestigeMonument>) => setPrestige({ monuments: monuments.map((m, j) => (j === i ? { ...m, ...p } : m)) });

  return (
    <>
      <Section title="Rythme sur des mois : bascule datée (6.14.88)">
        <p className="text-xs leading-relaxed text-slate-400 sm:col-span-2">
          À la date, chaque réglage resté à son <strong>ancienne valeur par défaut</strong> prend la valeur ci-dessous ; un réglage modifié à la main
          (ici, dans Règles ou dans Contenu → Bâtiments) garde la sienne. Rien n'est écrit en base : décaler la date ou décocher rend les anciennes
          valeurs aussitôt. Les chantiers et recherches lancés gardent leur fin. {PHASE_TEXT[phase]}
        </p>
        <CheckboxField label="Bascule active" checked={rhythm.enabled !== false} hint="Décoché : pas de bascule, anciennes valeurs partout (l'annonce reste cachée)." onChange={(v) => setRhythm({ enabled: v })} />
        <Field label="Date de la bascule" hint={`Heure de ton appareil. Défaut : 1er novembre 2026 à 0 h, heure de Paris. Annonce en jeu dès le ${formatDateTime(rhythmAnnounceAt(rhythm), "long", "server")} (heure de Paris).`}>
          <input
            type="datetime-local"
            value={toLocalInput(Number(rhythm.switchAt))}
            onChange={(e) => {
              const ms = new Date(e.target.value).getTime();
              if (Number.isFinite(ms)) setRhythm({ switchAt: ms });
            }}
            className="h-10 border border-cyan-glow/15 bg-space-900/80 px-3 font-mono text-sm tabular-nums text-slate-100 outline-none focus:border-cyan-glow/50"
          />
        </Field>
        <NumberField label="Annonce : jours avant la date" value={rhythm.announceDays} min={0} step={1} onChange={(v) => setRhythm({ announceDays: int(v, 7) })} />
        <NumberField label="Second palier : coûts multipliés par (×)" value={rhythm.tier2CostFactor} min={1} step={0.5} hint="Niveaux 11 à 20 des 9 bâtiments à second palier, si leurs coûts valent encore ceux du code (AE-L2, Q97). 1 = inchangés." onChange={(v) => setRhythm({ tier2CostFactor: pos(v, 4, 1) })} />
        <NumberField label="Second palier : durée du niveau 11 (h)" value={rhythm.tier2BaseSeconds / 3600} min={0} step={1} hint={`8 bâtiments exigés par l'Ascension (la Cale sèche garde ses durées). Avant : ${RHYTHM_PREVIOUS.tier2BaseSeconds / 3600} h.`} onChange={(v) => setRhythm({ tier2BaseSeconds: Math.round(pos(v, 30) * 3600) })} />
        <NumberField label="Second palier : durée ajoutée par niveau (h)" value={rhythm.tier2SecondsPerLevel / 3600} min={0} step={1} hint={`Niveau 20 = durée du niveau 11 + 9 × ce nombre. Avant : ${RHYTHM_PREVIOUS.tier2SecondsPerLevel / 3600} h.`} onChange={(v) => setRhythm({ tier2SecondsPerLevel: Math.round(pos(v, 24) * 3600) })} />
        <NumberField label="Recherche tardive : dès le niveau" value={rhythm.researchLateFromLevel} min={0} step={1} hint="Remplace `research.lateFromLevel` s'il vaut encore 0." onChange={(v) => setRhythm({ researchLateFromLevel: int(v, 6) })} />
        <NumberField label="Recherche tardive : durée multipliée par (×)" value={rhythm.researchLateTimeFactor} min={1} step={1} hint="Remplace `research.lateTimeFactor` s'il vaut encore 1." onChange={(v) => setRhythm({ researchLateTimeFactor: pos(v, 30, 1) })} />
        <NumberField label="Recherche : durée maximale d'un niveau (h, avant réductions)" value={rhythm.researchMaxLevelSeconds / 3600} min={0} step={1} hint="Remplace `research.maxLevelSeconds` s'il vaut encore 0 (sans plafond)." onChange={(v) => setRhythm({ researchMaxLevelSeconds: Math.round(pos(v, 168) * 3600) })} />
        <NumberField label="Ascension : délai entre deux (jours)" value={rhythm.ascensionCooldownDays} min={0} step={1} hint={`Avant : ${RHYTHM_PREVIOUS.ascensionCooldownDays} jours. Compté depuis la dernière Ascension.`} onChange={(v) => setRhythm({ ascensionCooldownDays: int(v, 30) })} />
        <NumberField label="Ascension : nombre maximal" value={rhythm.maxAscensions} min={RHYTHM_PREVIOUS.maxAscensions} step={1} hint={`Avant : ${RHYTHM_PREVIOUS.maxAscensions}. Ne descend jamais sous l'ancien maximum : personne ne perd une Ascension faite.`} onChange={(v) => setRhythm({ maxAscensions: int(v, 10, RHYTHM_PREVIOUS.maxAscensions) })} />
        <NumberField label="Comptoir : rares par ressource commune" value={rhythm.exchangeCommonToRare} min={0} step={0.001} hint={`0,004 = 1 rare pour 250 (Q98). Avant : ${RHYTHM_PREVIOUS.exchangeCommonToRare}.`} onChange={(v) => setRhythm({ exchangeCommonToRare: pos(v, 0.004) })} />
        <NumberField label="Missions : multiplicateur de production" value={rhythm.missionProductionMultiplier} min={0} step={0.05} hint={`Avant : ${RHYTHM_PREVIOUS.missionProductionMultiplier}.`} onChange={(v) => setRhythm({ missionProductionMultiplier: pos(v, 0.75) })} />
        <NumberField label="Missions : production de référence des rares" value={rhythm.missionRareProductionRef} min={1} step={10_000} hint={`Avant : ${RHYTHM_PREVIOUS.missionRareProductionRef}.`} onChange={(v) => setRhythm({ missionRareProductionRef: int(v, 400_000, 1) })} />
        <NumberField label="Lune : coût du niveau 2, ferraille" value={rhythm.moonUpgradeCost.scrap ?? 0} min={0} step={1_000_000} hint={`Avant : ${RHYTHM_PREVIOUS.moonUpgradeCost.scrap}. AE-9.`} onChange={(v) => setRhythm({ moonUpgradeCost: { ...rhythm.moonUpgradeCost, scrap: int(v, 20_000_000) } })} />
        <NumberField label="Lune : coût du niveau 2, énergie" value={rhythm.moonUpgradeCost.energy ?? 0} min={0} step={1_000_000} hint={`Avant : ${RHYTHM_PREVIOUS.moonUpgradeCost.energy}.`} onChange={(v) => setRhythm({ moonUpgradeCost: { ...rhythm.moonUpgradeCost, energy: int(v, 10_000_000) } })} />
        <NumberField label="Lune : coût multiplié par niveau (×)" value={rhythm.moonCostGrowth} min={1} step={0.5} hint={`Avant : ${RHYTHM_PREVIOUS.moonCostGrowth}.`} onChange={(v) => setRhythm({ moonCostGrowth: pos(v, 3, 1) })} />
        <NumberField label="Lune : débris pour 1 % de chance" value={rhythm.moonDebrisPerPercent} min={1} step={100_000} hint={`Avant : ${RHYTHM_PREVIOUS.moonDebrisPerPercent}.`} onChange={(v) => setRhythm({ moonDebrisPerPercent: int(v, 2_000_000, 1) })} />
      </Section>
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
          hint="0 = jamais. Tant qu'il vaut 0, la bascule du rythme (section ci-dessus) le passe à 6 à sa date (les niveaux 1 à 5 restent rapides)."
          onChange={(v) => setResearch({ lateFromLevel: int(v, 0) })}
        />
        <NumberField
          label="Recherche tardive : durée multipliée par (×)"
          value={research.lateTimeFactor}
          min={1}
          step={1}
          hint="1 = sans effet. Tant qu'il vaut 1, la bascule du rythme le passe à 30 à sa date. Le coût ne change pas."
          onChange={(v) => setResearch({ lateTimeFactor: pos(v, 1, 1) })}
        />
        <NumberField
          label="Durée maximale d'un niveau (h, avant réductions)"
          value={Math.round((research.maxLevelSeconds / 3600) * 100) / 100}
          min={0}
          step={1}
          hint="0 = sans plafond. Tant qu'il vaut 0, la bascule du rythme le passe à 168 h (7 jours) à sa date. Les réductions de durée (technos, officiers, talents) s'appliquent après."
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
