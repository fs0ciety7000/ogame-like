import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { NOVELTY_RULES, NOVELTY_RULES_META, recentContent } from "@/game/novelty";
import { chronicleMonthId } from "@/game/chronicles";
import { CONTENT_FAMILIES, objectiveLabel, type ContentFamily } from "@/game/trackedActions";
import { CheckboxField, NumberField, Section, TextAreaField } from "@/pages/admin/fields";

/* =====================================================
   6.14.120 (AU27, lot AP-L8) : épisode « nouveauté » des Chroniques
   générées. Un contenu daté (« Ajouté le » dans sa fiche) prend un
   épisode du chapitre suivant. Fréquence, durée, épisode, quantités,
   part des joueurs qui y ont accès, et bibliothèque de textes (une ligne
   par texte). Les mêmes champs restent dans « Tous les réglages ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const groupOf = (r: R, group: string): Obj => ((r as unknown as Obj)[group] ?? {}) as Obj;
const FAMILY_LABELS: Record<ContentFamily, string> = { unit: "unités", research: "technologies", building: "bâtiments" };
const lines = (xs: unknown): string => (Array.isArray(xs) ? xs.join("\n") : "");
/** Une ligne par texte ; les lignes vides restent pendant la saisie (le moteur les ignore). */
const toList = (v: string): string[] => v.split("\n");

function nextMonthId(now: number): string {
  const [y, m] = chronicleMonthId(now).split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function NoveltyFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const g = groupOf(rules, "novelty");
  const nv = { ...NOVELTY_RULES, ...g } as typeof NOVELTY_RULES;
  const counts = { ...NOVELTY_RULES.counts, ...((g.counts ?? {}) as Obj) } as Record<string, number>;
  const families = { ...NOVELTY_RULES.families, ...((g.families ?? {}) as Obj) } as Record<string, boolean>;
  const texts = { ...NOVELTY_RULES.texts, ...((g.texts ?? {}) as Obj) } as typeof NOVELTY_RULES.texts;
  const orders = { ...NOVELTY_RULES.texts.orders, ...((texts.orders ?? {}) as Obj) } as Record<string, string[]>;
  const set = (patch: Obj) => setRules((r) => ({ ...r, novelty: { ...groupOf(r, "novelty"), ...patch } }) as R);
  const setIn = (key: "counts" | "families" | "texts", k: string, v: unknown) =>
    setRules((r) => {
      const cur = groupOf(r, "novelty");
      return { ...r, novelty: { ...cur, [key]: { ...((cur[key] ?? {}) as Obj), [k]: v } } } as R;
    });
  const setOrders = (f: string, v: string[]) => setIn("texts", "orders", { ...orders, [f]: v });
  const next = nextMonthId(Date.now());
  const recent = recentContent(next, nv);
  const num = (k: "everyMonths" | "noveltyDays" | "episode" | "minAccessShare", step: number, round = true) => {
    const m = NOVELTY_RULES_META[k] as { label: string; min?: number; max?: number; hint?: string };
    return (
      <NumberField
        key={k}
        label={m.label}
        value={nv[k] as number}
        min={m.min}
        step={step}
        hint={m.hint}
        onChange={(v) => set({ [k]: Math.min(m.max ?? Infinity, Math.max(m.min ?? 0, round ? Math.round(v ?? 0) : (v ?? 0))) })}
      />
    );
  };

  return (
    <Section title="Chroniques : épisode « nouveauté » (6.14.120)">
      <p className="text-sm text-slate-400 sm:col-span-2">
        Un contenu daté (« Ajouté le » dans sa fiche : Unités, Technologies, Bâtiments) prend un épisode du chapitre suivant, s'il est accessible à assez de joueurs. Un contenu n'est mis en
        avant qu'une fois. Un mois déjà écrit ne change pas.{" "}
        {recent.length > 0 ? `Nouveau pour ${next} : ${recent.map((c) => objectiveLabel(c.key)).join(", ")}.` : `Aucun contenu nouveau pour ${next}.`}
      </p>
      <CheckboxField label={NOVELTY_RULES_META.enabled.label} checked={nv.enabled !== false} hint={NOVELTY_RULES_META.enabled.hint} onChange={(v) => set({ enabled: v })} />
      {num("everyMonths", 1)}
      {num("noveltyDays", 1)}
      {num("episode", 1)}
      {num("minAccessShare", 0.05, false)}
      {CONTENT_FAMILIES.map((f) => (
        <CheckboxField key={`nf-${f}`} label={`Mettre en avant les ${FAMILY_LABELS[f]}`} checked={families[f] !== false} onChange={(v) => setIn("families", f, v)} />
      ))}
      {CONTENT_FAMILIES.map((f) => (
        <NumberField key={`nc-${f}`} label={`Quantité demandée : ${FAMILY_LABELS[f]}`} value={counts[f]} min={1} step={1} onChange={(v) => setIn("counts", f, Math.max(1, Math.min(1000, Math.round(v ?? 1))))} />
      ))}
      <div className="sm:col-span-2">
        <TextAreaField label="Titres d'épisode (un par ligne)" rows={3} value={lines(texts.titles)} onChange={(v) => setIn("texts", "titles", toList(v))} />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField label="Accroches de l'allié (un par ligne ; {faction}, {villain})" rows={3} value={lines(texts.hooks)} onChange={(v) => setIn("texts", "hooks", toList(v))} />
      </div>
      {CONTENT_FAMILIES.map((f) => (
        <div key={`no-${f}`} className="sm:col-span-2">
          <TextAreaField label={`Ordres : ${FAMILY_LABELS[f]} (un par ligne ; {name}, {count}, {s})`} rows={2} value={lines(orders[f])} onChange={(v) => setOrders(f, toList(v))} />
        </div>
      ))}
    </Section>
  );
}
