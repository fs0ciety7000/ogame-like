import { useState } from "react";
import type { GameRules } from "@/game/content";
import { seasonPayoutSummary } from "@/game/seasons";
import { streakWeekSummary } from "@/game/streak";
import { NumberField, Section } from "@/pages/admin/fields";
import { cn, formatCompact, formatDecimal } from "@/lib/utils";

/* 5.15.9 : série de connexion réglable, et aperçu « avant / après » en direct
   (valeurs enregistrées ↔ valeurs en cours d'édition) pour la série et les
   récompenses de fin de saison. Rien n'est appliqué avant « Enregistrer ». */

type SetRules = (fn: (r: GameRules) => GameRules) => void;

interface Row {
  label: string;
  before: number;
  after: number;
  format?: (n: number) => string;
}

/** Tableau avant / après : écart coloré (hausse en ambre, baisse en cyan). */
export function BeforeAfter({ title, rows, note }: { title: string; rows: Row[]; note?: string }) {
  const changed = rows.some((r) => r.before !== r.after);
  return (
    <div className="flex flex-col gap-1.5 border border-white/5 bg-white/[0.02] p-2.5 sm:col-span-2">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
        {title}
        <span className={cn("ml-auto", changed ? "text-gold-glow" : "text-slate-600")}>{changed ? "modifié, non enregistré" : "identique à l'enregistré"}</span>
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-4 gap-y-1 text-xs">
        <span />
        <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Avant</span>
        <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Après</span>
        <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Écart</span>
        {rows.map((r) => {
          const fmt = r.format ?? ((n: number) => formatDecimal(n, 1));
          const diff = r.after - r.before;
          const pct = r.before > 0 ? Math.round((diff / r.before) * 100) : null;
          return (
            <div key={r.label} className="contents">
              <span className="text-slate-300">{r.label}</span>
              <span className="text-right font-mono tabular-nums text-slate-500">{fmt(r.before)}</span>
              <span className="text-right font-mono tabular-nums text-slate-100">{fmt(r.after)}</span>
              <span className={cn("text-right font-mono tabular-nums", diff > 0 ? "text-gold-glow" : diff < 0 ? "text-cyan-glow" : "text-slate-600")}>
                {diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff))}${pct !== null ? ` (${diff > 0 ? "+" : "−"}${Math.abs(pct)} %)` : ""}`}
              </span>
            </div>
          );
        })}
      </div>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

/** Aperçu des récompenses de fin de saison, pour un nombre de joueurs actifs choisi. */
export function SeasonPayoutPreview({ rules, saved }: { rules: GameRules; saved: GameRules }) {
  const [active, setActive] = useState(20);
  const a = seasonPayoutSummary(rules.seasons, active);
  const b = seasonPayoutSummary(saved.seasons, active);
  return (
    <>
      <NumberField label="Aperçu : joueurs actifs dans la saison" value={active} min={0} step={5} onChange={(v) => setActive(v ?? 0)} />
      <BeforeAfter
        title={`Clôture d'une saison · ${active} joueur${active > 1 ? "s" : ""} actif${active > 1 ? "s" : ""}`}
        rows={[
          { label: "Jetons du casino versés", before: b.tokens, after: a.tokens, format: (n) => formatCompact(n) },
          { label: "Ambre versée", before: b.amber, after: a.amber, format: (n) => formatCompact(n) },
          { label: "Chaque ressource commune", before: b.common, after: a.common, format: (n) => formatCompact(n) },
        ]}
        note="Champion + lot du podium (en entier) + participation de chaque joueur actif."
      />
    </>
  );
}

/** Réglages de la série de connexion + aperçu d'une semaine complète. */
export function StreakSection({ rules, setRules, saved }: { rules: GameRules; setRules: SetRules; saved: GameRules }) {
  const st = rules.streak;
  const set = (patch: Partial<GameRules["streak"]>) => setRules((r) => ({ ...r, streak: { ...r.streak, ...patch } }));
  const setChest = (key: keyof GameRules["streak"]["chest"], i: 0 | 1, v: number) => {
    const range: [number, number] = [...st.chest[key]];
    range[i] = v;
    set({ chest: { ...st.chest, [key]: range } });
  };
  const a = streakWeekSummary(st);
  const b = streakWeekSummary(saved.streak);
  return (
    <Section title="Série de connexion">
      <div className="grid grid-cols-4 gap-2 sm:col-span-2 sm:grid-cols-7">
        {st.hours.map((h, i) => (
          <NumberField
            key={i}
            label={`Jour ${i + 1} (h)`}
            value={h}
            min={0}
            step={0.5}
            onChange={(v) => set({ hours: st.hours.map((x, j) => (j === i ? (v ?? 0) : x)) })}
          />
        ))}
      </div>
      <NumberField label="Jetons du casino chaque jour" value={st.dailyTokens} min={0} step={1} onChange={(v) => set({ dailyTokens: v ?? 0 })} />
      <NumberField label="Ambre du 6e jour" value={st.amberDay6} min={0} step={5} onChange={(v) => set({ amberDay6: v ?? 0 })} />
      <NumberField label="Plancher par ressource (petits empires)" value={st.floor} min={0} step={500} onChange={(v) => set({ floor: v ?? 0 })} />
      <div className="grid grid-cols-2 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-3">
        <p className="col-span-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:col-span-3">Coffre du 7e jour (tirage entre min et max)</p>
        <NumberField label="Ambre min" value={st.chest.amber[0]} min={0} step={10} onChange={(v) => setChest("amber", 0, v ?? 0)} />
        <NumberField label="Ambre max" value={st.chest.amber[1]} min={0} step={10} onChange={(v) => setChest("amber", 1, v ?? 0)} />
        <NumberField label="Jetons min" value={st.chest.tokens[0]} min={0} step={1} onChange={(v) => setChest("tokens", 0, v ?? 0)} />
        <NumberField label="Jetons max" value={st.chest.tokens[1]} min={0} step={1} onChange={(v) => setChest("tokens", 1, v ?? 0)} />
        <NumberField label="Ressource min" value={st.chest.common[0]} min={0} step={5_000_000} onChange={(v) => setChest("common", 0, v ?? 0)} />
        <NumberField label="Ressource max" value={st.chest.common[1]} min={0} step={5_000_000} onChange={(v) => setChest("common", 1, v ?? 0)} />
      </div>
      <BeforeAfter
        title="Une semaine complète, par joueur"
        rows={[
          { label: "Heures de production", before: b.hours, after: a.hours },
          { label: "Jetons du casino (coffre moyen compris)", before: b.tokens, after: a.tokens },
          { label: "Ambre (coffre moyen compris)", before: b.amber, after: a.amber },
          { label: "Coffre : chaque ressource commune (moyenne)", before: b.chestCommon, after: a.chestCommon, format: (n) => formatCompact(n) },
        ]}
        note="Le coffre compte pour sa valeur moyenne. Les joueurs voient les nouveaux chiffres dès l'enregistrement."
      />
    </Section>
  );
}
