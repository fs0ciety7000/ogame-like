import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { NARRATIVE_RULES, NARRATIVE_RULES_META } from "@/game/narrative";
import { chapterArchetypes } from "@/game/procedural";
import { THEME_ROTATION } from "@/game/seasonCatalog";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField } from "@/pages/admin/fields";

/* =====================================================
   6.14.137 (AU27, lot AP-L10) : banques de textes des Chroniques et du
   passe. Titres d'acte, accroches, répliques du méchant, lignes de héros
   (une ligne par texte), anti-répétition, faction de chaque thème pour les
   années 2 et 3 du catalogue, répliques des jalons du passe par année.
   Ordres en plus et titres de réserve par faction : Tous les réglages.
   Un mois déjà écrit ne change jamais.
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const ACTS = ["Acte 1 (ouverture)", "Acte 2 (traque)", "Acte 3 (rebondissement)", "Acte 4 (assaut final)"];
const lines = (xs: unknown): string => (Array.isArray(xs) ? xs.join("\n") : "");
/** Une ligne par texte ; les lignes vides restent pendant la saisie (le moteur les ignore). */
const toList = (v: string): string[] => v.split("\n");

export function NarrativeFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const g = ((rules as unknown as Obj).narrative ?? {}) as Obj;
  const nr = { ...NARRATIVE_RULES, ...g } as typeof NARRATIVE_RULES;
  const set = (patch: Obj) => setRules((r) => ({ ...r, narrative: { ...(((r as unknown as Obj).narrative ?? {}) as Obj), ...patch } }) as R);
  const setAct = (key: "actTitles" | "hooks", i: number, v: string[]) => {
    const cur = (Array.isArray(nr[key]) ? nr[key] : NARRATIVE_RULES[key]).map((x) => [...x]);
    cur[i] = v;
    set({ [key]: cur });
  };
  const setYear = (year: string, theme: string, arch: string) => {
    const table: Record<string, string> = { ...(nr.yearArchetypes?.[year] ?? {}) };
    if (arch) table[theme] = arch;
    else delete table[theme];
    set({ yearArchetypes: { ...nr.yearArchetypes, [year]: table } });
  };
  const archetypes = chapterArchetypes().map((a) => ({ value: a.id, label: a.faction }));
  const m = NARRATIVE_RULES_META;
  return (
    <Section title="Chroniques et passe : banques de textes (6.14.137)">
      <p className="text-sm text-slate-400 sm:col-span-2">
        Textes tirés à la graine du mois pour les chapitres générés. Un texte lu dans les derniers mois écrits n'est pas repris tant qu'il en reste un autre. Un mois déjà écrit ne change pas.
        Ordres en plus et titres de réserve par faction : Tous les réglages (groupe « narrative »).
      </p>
      <CheckboxField label={m.enabled.label} checked={nr.enabled !== false} hint={m.enabled.hint} onChange={(v) => set({ enabled: v })} />
      <NumberField label={`${m.noRepeatMonths.label} (mois)`} value={nr.noRepeatMonths} min={0} step={1} hint={m.noRepeatMonths.hint} onChange={(v) => set({ noRepeatMonths: Math.max(0, Math.min(36, Math.round(v ?? 0))) })} />
      <CheckboxField label={m.passLinesByYear.label} checked={nr.passLinesByYear !== false} hint={m.passLinesByYear.hint} onChange={(v) => set({ passLinesByYear: v })} />
      {ACTS.map((label, i) => (
        <div key={`t-${i}`} className="sm:col-span-2">
          <TextAreaField label={`Titres d'épisode : ${label} (un par ligne)`} rows={3} value={lines(nr.actTitles?.[i])} onChange={(v) => setAct("actTitles", i, toList(v))} />
        </div>
      ))}
      {ACTS.map((label, i) => (
        <div key={`h-${i}`} className="sm:col-span-2">
          <TextAreaField label={`Accroches de l'allié : ${label} (une par ligne ; {villain}, {boss}, {faction}, {ofFaction}, {pseudo})`} rows={4} value={lines(nr.hooks?.[i])} onChange={(v) => setAct("hooks", i, toList(v))} />
        </div>
      ))}
      <div className="sm:col-span-2">
        <TextAreaField label="Répliques du méchant (une par ligne ; {pseudo}, {boss}, {faction})" rows={5} value={lines(nr.villainTaunts)} onChange={(v) => set({ villainTaunts: toList(v) })} />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField label="Lignes de héros (une par ligne ; {hero}, {deed}, {villain})" rows={4} value={lines(nr.heroLines)} onChange={(v) => set({ heroLines: toList(v) })} />
      </div>
      <p className="text-xs text-slate-400 sm:col-span-2">{m.yearArchetypes.hint}</p>
      {["2", "3"].map((year) =>
        THEME_ROTATION.map((theme) => (
          <SelectField
            key={`y-${year}-${theme}`}
            label={`Année ${year} · ${theme}`}
            value={nr.yearArchetypes?.[year]?.[theme] ?? ""}
            options={[{ value: "", label: "Comme l'année 1" }, ...archetypes]}
            onChange={(v) => setYear(year, theme, v)}
          />
        )),
      )}
    </Section>
  );
}
