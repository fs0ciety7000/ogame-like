import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { COMMANDERS } from "@/game/commanders";
import { CATALOG_START, catalogCycle, generatedSeasonEntry, SEASON_GEN_RULES, SEASON_GEN_RULES_META, THEME_PRIMARY, catalogEntryFor } from "@/game/seasonCatalog";
import { CheckboxField, Section, TextAreaField } from "@/pages/admin/fields";

/* =====================================================
   6.14.139 (AU27, lot AP-L12, Q-AP5) : saisons du passe générées au-delà
   du cycle écrit (36 mois livrés : novembre 2029). Interrupteur, banques
   (sous-titres, phrases d'ouverture, prénoms, noms) et aperçu des douze
   premières saisons générées. Titres, histoires et apparences par rôle :
   Tous les réglages (groupe « seasonGen »). Le brouillon du passe de
   chaque mois se relit comme les autres (Admin → Passes).
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const lines = (xs: unknown): string => (Array.isArray(xs) ? xs.join("\n") : "");
const toList = (v: string): string[] => v.split("\n");

function monthAt(n: number): string {
  const [y, m] = CATALOG_START.split("-").map(Number);
  const k = y * 12 + (m - 1) + n;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
}

const roleName = (id: string) => COMMANDERS.find((c) => c.id === id)?.title ?? id;

export function SeasonGenFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const g = ((rules as unknown as Obj).seasonGen ?? {}) as Obj;
  const sg = { ...SEASON_GEN_RULES, ...g } as typeof SEASON_GEN_RULES;
  const set = (patch: Obj) => setRules((r) => ({ ...r, seasonGen: { ...(((r as unknown as Obj).seasonGen ?? {}) as Obj), ...patch } }) as R);
  const cycle = catalogCycle();
  // Aperçu sur les réglages en cours d'édition (sans les appliquer au jeu).
  const preview = Array.from({ length: 12 }, (_, i) => {
    const month = monthAt(cycle + i);
    const saved = { ...SEASON_GEN_RULES };
    Object.assign(SEASON_GEN_RULES, sg);
    try {
      return { month, e: generatedSeasonEntry(1, i, catalogEntryFor(monthAt(i))) };
    } finally {
      Object.assign(SEASON_GEN_RULES, saved);
    }
  });
  const m = SEASON_GEN_RULES_META;
  return (
    <Section title="Catalogue du passe : saisons générées au-delà du cycle (6.14.139)">
      <p className="text-sm text-slate-400 sm:col-span-2">
        Après les {cycle} saisons écrites (à partir de {monthAt(cycle)}), chaque mois prolonge la saison écrite du même rang : nom avec un sous-titre, nouveau commandant, second rôle jamais
        pris par ce thème. Le brouillon du passe se relit comme les autres (Passes). Une année écrite dans le Catalogue du passe repousse la génération. Un passe déjà écrit ne change pas.
      </p>
      <CheckboxField label={m.enabled.label} checked={sg.enabled !== false} hint={m.enabled.hint} onChange={(v) => set({ enabled: v })} />
      <div className="sm:col-span-2">
        <TextAreaField label="Sous-titres (un par ligne)" rows={3} value={lines(sg.subtitles)} onChange={(v) => set({ subtitles: toList(v) })} />
      </div>
      <div className="sm:col-span-2">
        <TextAreaField label="Phrases d'ouverture du scénario (une par ligne)" rows={3} value={lines(sg.eraLines)} onChange={(v) => set({ eraLines: toList(v) })} />
      </div>
      <TextAreaField label="Prénoms féminins (un par ligne)" rows={3} value={lines(sg.firstNames?.f)} onChange={(v) => set({ firstNames: { ...sg.firstNames, f: toList(v) } })} />
      <TextAreaField label="Prénoms masculins (un par ligne)" rows={3} value={lines(sg.firstNames?.m)} onChange={(v) => set({ firstNames: { ...sg.firstNames, m: toList(v) } })} />
      <div className="sm:col-span-2">
        <TextAreaField label="Noms de famille (un par ligne ; un nombre premier avec celui des prénoms)" rows={3} value={lines(sg.lastNames)} onChange={(v) => set({ lastNames: toList(v) })} />
      </div>
      <div className="min-w-0 space-y-1 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Aperçu : premières saisons générées</p>
        {sg.enabled === false ? (
          <p className="text-xs text-slate-400">Désactivé : le catalogue reboucle sur ses saisons écrites.</p>
        ) : (
          <ul className="space-y-1 text-xs text-slate-300">
            {preview.map(({ month, e }) => (
              <li key={month} className="break-words">
                <span className="font-mono tabular-nums text-slate-400">{month}</span> · {e.name} · {e.commander.name}, {e.commander.title} ({roleName(THEME_PRIMARY[e.theme] ?? "")} + {roleName(e.commander.secondary)})
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
