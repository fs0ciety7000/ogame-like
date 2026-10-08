import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { BASE_COUNTS, BASE_COUNTS_META } from "@/game/procedural";
import { CONTENT_FAMILIES, CONTENT_FAMILY_TEXTS, STATIC_OBJECTIVES, TRACKED_ACTION_RULES, TRACKED_ACTION_RULES_META, TRACKED_ACTIONS, type ContentFamily, type StaticObjective } from "@/game/trackedActions";
import { CheckboxField, NumberField, Section } from "@/pages/admin/fields";

/* =====================================================
   6.14.119 (AU27, lot AP-L7) : registre des actions suivies.
   Une ligne par action : poids dans les tirages communs (Chroniques,
   défis du passe, saga) et quantité de base d'une semaine ; la page et
   le système viennent du registre (code). Familles par contenu (unité,
   techno, bâtiment) : poids 0 par défaut, servies par l'épisode
   « nouveauté » (6.14.120). Les mêmes champs restent dans « Tous les
   réglages (avancé) » (groupes `trackedActions` et `chapterBaseCounts`).
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const groupOf = (r: R, group: string): Obj => ((r as unknown as Obj)[group] ?? {}) as Obj;
const FAMILY_LABELS: Record<ContentFamily, string> = { unit: "Unités (construire telle unité)", research: "Technologies (rechercher telle techno)", building: "Bâtiments (améliorer tel bâtiment)" };

function actionHint(k: StaticObjective): string {
  const d = TRACKED_ACTIONS[k];
  const tags = [`système ${d.system}`, `page ${d.page}`, d.passive ? "passive" : null, d.measured ? "mesurée (médiane du serveur demandée)" : null, `depuis ${d.since}`].filter(Boolean);
  return tags.join(" · ");
}

export function TrackedActionsFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const g = groupOf(rules, "trackedActions");
  const ta = { ...TRACKED_ACTION_RULES, ...g } as typeof TRACKED_ACTION_RULES;
  const weights = { ...TRACKED_ACTION_RULES.weights, ...((g.weights ?? {}) as Obj) } as Record<string, number>;
  const familyWeights = { ...TRACKED_ACTION_RULES.familyWeights, ...((g.familyWeights ?? {}) as Obj) } as Record<string, number>;
  const familyBase = { ...TRACKED_ACTION_RULES.familyBase, ...((g.familyBase ?? {}) as Obj) } as Record<string, number>;
  const bases = { ...BASE_COUNTS, ...groupOf(rules, "chapterBaseCounts") } as Record<string, number>;
  const set = (patch: Obj) => setRules((r) => ({ ...r, trackedActions: { ...groupOf(r, "trackedActions"), ...patch } }) as R);
  const setMap = (key: "weights" | "familyWeights" | "familyBase", k: string, v: number) =>
    setRules((r) => {
      const cur = groupOf(r, "trackedActions");
      return { ...r, trackedActions: { ...cur, [key]: { ...((cur[key] ?? {}) as Obj), [k]: v } } } as R;
    });
  const setBase = (k: string, v: number) => setRules((r) => ({ ...r, chapterBaseCounts: { ...groupOf(r, "chapterBaseCounts"), [k]: v } }) as R);

  return (
    <Section title="Actions suivies : registre des objectifs générés (6.14.119)">
      <p className="text-sm text-slate-400 sm:col-span-2">
        Les Chroniques, les défis du passe, la saga d'alliance et les objectifs du jour tirent leurs objectifs dans ce registre. Une action « mesurée » (lune, colonies) n'entre dans un
        tirage commun que si le joueur médian du serveur la pratique : sa page lui est ouverte. Un mois déjà écrit ne change pas.
      </p>
      <CheckboxField label={TRACKED_ACTION_RULES_META.enabled.label} checked={ta.enabled !== false} hint={TRACKED_ACTION_RULES_META.enabled.hint} onChange={(v) => set({ enabled: v })} />
      <NumberField
        label={TRACKED_ACTION_RULES_META.measuredMinWeekly.label}
        value={ta.measuredMinWeekly}
        min={0}
        step={0.25}
        hint={TRACKED_ACTION_RULES_META.measuredMinWeekly.hint}
        onChange={(v) => set({ measuredMinWeekly: Math.max(0, Math.min(50, v ?? 0)) })}
      />
      {STATIC_OBJECTIVES.map((k) => (
        <NumberField key={`tw-${k}`} label={`Poids : ${TRACKED_ACTIONS[k].label}`} value={weights[k] ?? 1} min={0} step={0.25} hint={actionHint(k)} onChange={(v) => setMap("weights", k, Math.max(0, Math.min(100, v ?? 0)))} />
      ))}
      {STATIC_OBJECTIVES.map((k) => (
        <NumberField
          key={`tb-${k}`}
          label={`Quantité de base (une semaine) : ${BASE_COUNTS_META[k]?.label ?? TRACKED_ACTIONS[k].label}`}
          value={bases[k]}
          min={0}
          step={1}
          onChange={(v) => setBase(k, Math.max(0, Math.min(100, Math.round(v ?? 0))))}
        />
      ))}
      {CONTENT_FAMILIES.map((f) => (
        <NumberField
          key={`fw-${f}`}
          label={`Poids de la famille : ${FAMILY_LABELS[f]}`}
          value={familyWeights[f] ?? 0}
          min={0}
          step={0.25}
          hint={`${TRACKED_ACTION_RULES_META.familyWeights.hint} Page : ${CONTENT_FAMILY_TEXTS[f].page}.`}
          onChange={(v) => setMap("familyWeights", f, Math.max(0, Math.min(100, v ?? 0)))}
        />
      ))}
      {CONTENT_FAMILIES.map((f) => (
        <NumberField key={`fb-${f}`} label={`Quantité de base : ${FAMILY_LABELS[f]}`} value={familyBase[f] ?? 1} min={1} step={1} onChange={(v) => setMap("familyBase", f, Math.max(1, Math.min(10_000, Math.round(v ?? 1))))} />
      ))}
    </Section>
  );
}
