import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { GUIDE_STEPS } from "@/game/advancedGuide";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { RANKS } from "@/game/ranks";
import {
  NAV_SIGNAL_LABELS,
  NAV_SIGNALS,
  NAV_UNLOCK_RULES,
  navAlwaysMenuCount,
  navPageLabel,
  navPreview,
  rankName,
  type NavPageRule,
} from "@/game/navUnlock";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { CheckboxField, Field, NumberField, SelectField, Section } from "@/pages/admin/fields";

/* =====================================================
   6.14.80 (DP-L5, proposals/deblocage-progressif.md §5.3) : Admin → Règles →
   Ouverture du menu. Réglages généraux du groupe `navUnlock`, une ligne par
   page (rang plafond, signaux, étape, conditions requises) et un aperçu
   « ce que voit un compte neuf à tel rang », calculé avec le brouillon
   (avant l'enregistrement). Les mêmes champs restent dans « Tous les
   réglages (avancé) ».
===================================================== */

type R = GameRules;
type NavRules = typeof NAV_UNLOCK_RULES;

/** Groupe du registre, typé par ses valeurs par défaut ; les pages sont fusionnées page par page (comme `applyGameContent`). */
function navRules(r: R): NavRules {
  const draft = ((r as unknown as Record<string, unknown>).navUnlock ?? {}) as Partial<NavRules>;
  return { ...NAV_UNLOCK_RULES, ...draft, pages: { ...NAV_UNLOCK_RULES.pages, ...(draft.pages ?? {}) } };
}

const RANK_NONE = "";
const STEP_NONE = "";

/** Date et heure locales pour un champ `datetime-local` (et retour). */
function toLocalInput(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

/** Libellé court d'une règle de page : « Fer III · 1 signal · étape « spy » ». */
function ruleSummary(rule: NavPageRule): string {
  const parts: string[] = [];
  parts.push(rule.rank ? rankName(rule.rank) : "sans rang plafond");
  const n = rule.signals?.length ?? 0;
  if (n > 0) parts.push(`${n} ${n > 1 ? "signaux" : "signal"}`);
  if (rule.step) parts.push("étape");
  if ((rule.requires?.length ?? 0) > 0) parts.push("condition requise");
  return parts.join(" · ");
}

const STEP_OPTIONS = [
  { value: STEP_NONE, label: "Aucune étape" },
  ...ONBOARDING_STEPS.map((s) => ({ value: s.id, label: `Prise en main : ${s.label}` })),
  ...GUIDE_STEPS.map((s) => ({ value: s.id, label: `Carnet : ${s.label}` })),
];

export function NavUnlockRulesFields({ rules, setRules }: { rules: R; setRules: Dispatch<SetStateAction<R>> }) {
  const nav = navRules(rules);
  const set = (p: Partial<NavRules>) => setRules((r) => ({ ...r, navUnlock: { ...navRules(r), ...p } }) as R);
  const setPage = (page: string, p: Partial<NavPageRule>) =>
    setRules((r) => {
      const cur = navRules(r);
      const next: NavPageRule = { ...cur.pages[page], ...p };
      // Champ vidé : retiré (JSON pur, pas de `undefined`).
      for (const k of Object.keys(next) as (keyof NavPageRule)[]) {
        const v = next[k];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete next[k];
      }
      return { ...r, navUnlock: { ...cur, pages: { ...cur.pages, [page]: next } } } as R;
    });
  const toggle = (list: string[] | undefined, s: string, on: boolean) => {
    const set0 = new Set(list ?? []);
    if (on) set0.add(s);
    else set0.delete(s);
    // Ordre de la liste fermée, pour un JSON stable.
    return NAV_SIGNALS.filter((x) => set0.has(x));
  };
  const rankOptions = [{ value: RANK_NONE, label: "Aucun (pas de plafond)" }, ...RANKS.map((r) => ({ value: r.id, label: `${r.name} (${r.xp} XP)` }))];
  const pages = Object.keys(nav.pages);

  return (
    <>
      <Section title="Ouverture du menu : réglages généraux (6.14.74, comptes neufs)">
        <CheckboxField
          label="Menu progressif actif"
          checked={nav.enabled !== false}
          hint="Décoché : tout le monde voit tout le menu (ancien comportement), objectifs du jour compris. Rien n'est effacé."
          onChange={(v) => set({ enabled: v })}
        />
        <Field
          label="Comptes neufs à partir du"
          hint={`Heure de ton appareil. Un compte créé avant cette date et au moins à ${rankName(nav.veteranRank)} voit tout (Q103). À recaler au jour de la mise en production.`}
        >
          <input
            type="datetime-local"
            value={toLocalInput(Number(nav.newAccountsFrom))}
            onChange={(e) => {
              const ms = new Date(e.target.value).getTime();
              if (Number.isFinite(ms)) set({ newAccountsFrom: ms });
            }}
            className="h-10 border border-cyan-glow/15 bg-space-900/80 px-3 font-mono text-sm tabular-nums text-slate-100 outline-none focus:border-cyan-glow/50"
          />
        </Field>
        <SelectField
          label="Rang « ancien compte »"
          value={nav.veteranRank}
          options={RANKS.map((r) => ({ value: r.id, label: `${r.name} (${r.xp} XP)` }))}
          hint="Un compte créé avant la date et au moins à ce rang voit tout le menu."
          onChange={(v) => set({ veteranRank: v })}
        />
        <NumberField
          label="Colonies : ouverture avant le seuil (niveaux)"
          value={nav.colonyLead}
          min={0}
          step={5}
          hint="Niveaux de bâtiments cumulés avant le seuil de la 1re colonie (signal « colonies proches »). 20 = la page s'ouvre à 100 niveaux pour un seuil de 120."
          onChange={(v) => set({ colonyLead: Math.max(0, Math.round(v ?? 20)) })}
        />
        <CheckboxField
          label="Objectifs du jour parmi les pages ouvertes (I31)"
          checked={nav.filterContracts !== false}
          hint="Un nouveau jour ne tire pas « Gagner une attaque » ou « Acheter au marché » tant que la page n'est pas au menu. Le jour en cours n'est jamais refait."
          onChange={(v) => set({ filterContracts: v })}
        />
        <SelectField
          label="Page fermée"
          value={nav.style === "locked" ? "locked" : "hidden"}
          options={[
            { value: "hidden", label: "Cachée (une ligne « Prochaine ouverture »)" },
            { value: "locked", label: "Grisée avec un cadenas" },
          ]}
          hint="Q153 : cachée. Dans Ctrl+K, une page fermée reste grisée avec sa condition dans les deux cas."
          onChange={(v) => set({ style: v })}
        />
      </Section>

      <Section title={`Ouverture du menu : pages (${pages.length})`}>
        <p className="text-xs text-slate-400 sm:col-span-2">
          Une page s'ouvre au <strong className="text-slate-200">premier</strong> de trois déclencheurs : un signal coché, l'étape choisie (quand elle
          devient l'étape en cours), ou le rang plafond. Une page ouverte ne se referme jamais. Toujours visibles :{" "}
          <span className="font-mono tabular-nums">{navAlwaysMenuCount()}</span> entrées (Accueil, Ordres du jour, Ressources, Bâtiments, Unités, Labo,
          Communications et le pied de barre).
        </p>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          {pages.map((page) => {
            const rule = nav.pages[page] ?? {};
            return (
              <details key={page} className="hud-cut-sm border border-cyan-glow/10 bg-black/20">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm text-slate-200">
                  <span className="min-w-0 flex-1 break-words">{navPageLabel(page)}</span>
                  <span className="text-[11px] text-slate-500">{ruleSummary(rule)}</span>
                </summary>
                <div className="grid grid-cols-1 gap-3 border-t border-cyan-glow/10 p-3 sm:grid-cols-2">
                  <SelectField label="Rang plafond" value={rule.rank ?? RANK_NONE} options={rankOptions} hint="Ouverte au plus tard à ce rang." onChange={(v) => setPage(page, { rank: v || undefined })} />
                  <SelectField label="Étape du tutoriel" value={rule.step ?? STEP_NONE} options={STEP_OPTIONS} hint="Ouverte quand l'étape devient l'étape en cours." onChange={(v) => setPage(page, { step: v || undefined })} />
                  <fieldset className="sm:col-span-2">
                    <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Signaux (un seul suffit)</legend>
                    <div className="mt-1 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                      {NAV_SIGNALS.map((s) => (
                        <label key={s} className="flex min-w-0 items-start gap-2 py-0.5 text-xs text-slate-300">
                          <input type="checkbox" className="mt-0.5 accent-cyan-glow" checked={(rule.signals ?? []).includes(s)} onChange={(e) => setPage(page, { signals: toggle(rule.signals, s, e.target.checked) })} />
                          <span className="min-w-0">{NAV_SIGNAL_LABELS[s]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="sm:col-span-2">
                    <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Conditions requises (toutes, avant tout déclencheur)</legend>
                    <div className="mt-1 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                      {NAV_SIGNALS.map((s) => (
                        <label key={s} className="flex min-w-0 items-start gap-2 py-0.5 text-xs text-slate-300">
                          <input type="checkbox" className="mt-0.5 accent-cyan-glow" checked={(rule.requires ?? []).includes(s)} onChange={(e) => setPage(page, { requires: toggle(rule.requires, s, e.target.checked) })} />
                          <span className="min-w-0">{NAV_SIGNAL_LABELS[s]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <NavPreviewSection nav={nav} />
    </>
  );
}

/** Aperçu : ce que voit un compte neuf à tel rang (brouillon des règles, avant l'enregistrement). */
function NavPreviewSection({ nav }: { nav: NavRules }) {
  const [rankId, setRankId] = useState(RANKS[0]?.id ?? "fer3");
  const [alliance, setAlliance] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [danger, setDanger] = useState(false);
  const [hours, setHours] = useState(1);
  const preview = useMemo(() => navPreview({ rankId, alliance, onboardingDone, danger, hoursSinceSignup: hours }, Date.now(), nav), [rankId, alliance, onboardingDone, danger, hours, nav]);
  return (
    <Section title="Ouverture du menu : aperçu d'un compte neuf">
      <SelectField label="Rang du compte" value={rankId} options={RANKS.map((r) => ({ value: r.id, label: `${r.name} (${r.xp} XP)` }))} onChange={setRankId} />
      <NumberField label="Heures depuis l'inscription" value={hours} min={0} step={12} hint="La protection de débutant (72 h par défaut) ouvre Combats et Menaces à sa fin." onChange={(v) => setHours(Math.max(0, v ?? 0))} />
      <CheckboxField label="Membre d'une alliance" checked={alliance} onChange={setAlliance} />
      <CheckboxField label="Prise en main terminée" checked={onboardingDone} hint="Le Carnet du commandant commence : son étape en cours peut ouvrir une page." onChange={setOnboardingDone} />
      <CheckboxField label="Une menace est arrivée" checked={danger} hint="Flotte hostile en approche ou rapport reçu (signal « danger »)." onChange={setDanger} />
      <div className="flex flex-col gap-2 sm:col-span-2" aria-live="polite">
        {preview.status !== "progressive" ? (
          <HudCallout tone="neutral" className="text-xs">
            Menu progressif désactivé : un compte neuf voit tout le menu.
          </HudCallout>
        ) : (
          <>
            <p className="text-sm text-slate-200">
              <span className="font-mono text-lg tabular-nums text-slate-100">{preview.menuEntries}</span> entrées au menu
              <span className="text-slate-500">
                {" "}
                (<span className="font-mono tabular-nums">{navAlwaysMenuCount()}</span> toujours visibles + <span className="font-mono tabular-nums">{preview.open.length}</span> ouvertes)
              </span>
            </p>
            {preview.next && (
              <p className="text-xs text-slate-500">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Prochaine ouverture</span> : {preview.next.pages.map(navPageLabel).join(", ")} à {preview.next.rankName} (
                <span className="font-mono tabular-nums">{preview.next.targetXp}</span> XP)
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {preview.open.map((o) => (
                <HudChip key={o.page} size="sm" tone="mint" title={`Ouverte par : ${o.reason === "rank" ? "le rang" : o.reason === "step" ? "l'étape" : o.reason === "signal" ? "un signal" : "une visite"}`}>
                  {navPageLabel(o.page)}
                </HudChip>
              ))}
            </div>
            {preview.closed.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-xs">
                {preview.closed.map((c) => (
                  <li key={c.page} className="flex min-w-0 flex-wrap gap-x-2">
                    <span className="text-slate-400">{navPageLabel(c.page)}</span>
                    <span className="min-w-0 text-slate-500">{c.condition}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Section>
  );
}
