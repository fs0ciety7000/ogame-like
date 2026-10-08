import { useState } from "react";
import type { GameRules } from "@/game/content";
import { seasonPayoutSummary } from "@/game/seasons";
import { streakWeekSummary } from "@/game/streak";
import { CheckboxField, NumberField, Section, TextField } from "@/pages/admin/fields";
import { catchupBonus } from "@/game/catchup";
import { autoMutatorFor, mutatorList } from "@/game/mutators";
import { MutatorsEditor } from "@/pages/admin/SystemListsEditors";
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
        {/* 6.14.106 (AE-L3, Q99) : coffre indexé sur la production ; le minimum fixe sert de plancher. */}
        <NumberField label="Ressources : heures de production min" value={st.chest.commonHours[0]} min={0} step={1} onChange={(v) => setChest("commonHours", 0, v ?? 0)} hint="Par ressource commune, tirées à part. 0 et 0 : bornes fixes ci-dessous." />
        <NumberField label="Ressources : heures de production max" value={st.chest.commonHours[1]} min={0} step={1} onChange={(v) => setChest("commonHours", 1, v ?? 0)} />
        <NumberField label="Ressource : plancher (et min fixe)" value={st.chest.common[0]} min={0} step={1_000_000} onChange={(v) => setChest("common", 0, v ?? 0)} hint="Au moins ce montant par ressource, même pour un petit empire." />
        <NumberField label="Ressource : max fixe (sans heures)" value={st.chest.common[1]} min={0} step={1_000_000} onChange={(v) => setChest("common", 1, v ?? 0)} hint="Sert seulement si les heures valent 0." />
      </div>
      <BeforeAfter
        title="Une semaine complète, par joueur"
        rows={[
          { label: "Heures de production", before: b.hours, after: a.hours },
          { label: "Jetons du casino (coffre moyen compris)", before: b.tokens, after: a.tokens },
          { label: "Ambre (coffre moyen compris)", before: b.amber, after: a.amber },
          a.chestHours !== null || b.chestHours !== null
            ? { label: "Coffre : heures de production par ressource (moyenne)", before: b.chestHours ?? 0, after: a.chestHours ?? 0 }
            : { label: "Coffre : chaque ressource commune (moyenne)", before: b.chestCommon, after: a.chestCommon, format: (n: number) => formatCompact(n) },
        ]}
        note="Le coffre compte pour sa valeur moyenne. Les joueurs voient les nouveaux chiffres dès l'enregistrement."
      />
    </Section>
  );
}

/** 5.16 : rattrapage de production des petits empires, avec la courbe du bonus. */
export function CatchupSection({ rules, setRules }: { rules: GameRules; setRules: SetRules }) {
  const c = rules.catchup;
  const set = (patch: Partial<GameRules["catchup"]>) => setRules((r) => ({ ...r, catchup: { ...r.catchup, ...patch } }));
  const points = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75];
  return (
    <Section title="Rattrapage des petits empires">
      <CheckboxField label="Activer le rattrapage" checked={c.enabled} onChange={(v) => set({ enabled: v })} />
      <NumberField label="Bonus maximal (0,5 = +50 %)" value={c.maxBonus} min={0} step={0.05} onChange={(v) => set({ maxBonus: v ?? 0 })} />
      <NumberField label="Bonus plein sous (part de la médiane)" value={c.fullBelow} min={0} step={0.05} onChange={(v) => set({ fullBelow: v ?? 0 })} />
      <NumberField label="Plus de bonus à partir de (part de la médiane)" value={c.endsAt} min={0.05} step={0.05} onChange={(v) => set({ endsAt: v ?? 0.5 })} />
      <NumberField label="Joueurs actifs minimum pour la médiane" value={c.minPlayers} min={2} step={1} onChange={(v) => set({ minPlayers: Math.round(v ?? 5) })} />
      <NumberField label="Actif = connecté dans les N derniers jours" value={c.activeDays} min={1} step={1} onChange={(v) => set({ activeDays: v ?? 7 })} />
      <div className="flex flex-col gap-1.5 border border-white/5 bg-white/[0.02] p-2.5 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Bonus selon le développement (niveaux de bâtiments + technos, comparés à la médiane)</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {points.map((ratio) => {
            const b = catchupBonus(ratio, 1, c);
            return (
              <div key={ratio} className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[10px] text-slate-500">{Math.round(ratio * 100)} %</span>
                <span className={cn("font-mono text-sm tabular-nums", b > 0 ? "text-mint-glow" : "text-slate-600")}>{b > 0 ? `+${formatDecimal(b * 100, 1)} %` : "="}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500">Calculé chaque nuit par le serveur pour les joueurs actifs, figé pour la journée. Visible par le joueur dans le détail de sa production.</p>
      </div>
    </Section>
  );
}

/** 5.16 : mutateur de saison, mois par mois (tirage automatique ou choix imposé). */
export function MutatorSection({ rules, setRules, saved }: { rules: GameRules; setRules: SetRules; saved: GameRules }) {
  const m = rules.mutators;
  const now = new Date();
  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const setOverride = (month: string, id: string) =>
    setRules((r) => {
      const overrides = { ...r.mutators.overrides };
      if (id === "auto") delete overrides[month];
      else overrides[month] = id;
      return { ...r, mutators: { ...r.mutators, overrides } };
    });
  return (
    <Section title="Mutateur de saison">
      <CheckboxField label="Une règle spéciale chaque mois" checked={m.enabled} onChange={(v) => setRules((r) => ({ ...r, mutators: { ...r.mutators, enabled: v } }))} hint="Effet pour tout le serveur, annoncé sur l'accueil et dans les Chroniques." />
      <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
        {months.map((month) => {
          const auto = autoMutator(month, m);
          return (
            <label key={month} className="flex flex-col gap-1 text-xs text-slate-400">
              <span className="font-mono">{month}</span>
              <select value={m.overrides[month] ?? "auto"} onChange={(e) => setOverride(month, e.target.value)} className="h-9 border border-white/10 bg-space-950 px-2 text-sm text-slate-100">
                <option value="auto">Tirage : {auto ? `${auto.emoji} ${auto.name}` : "—"}</option>
                {(m.defs ?? []).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.emoji} {x.name}
                  </option>
                ))}
                <option value="none">Aucun mutateur</option>
              </select>
            </label>
          );
        })}
      </div>
      {/* 6.14.136 (AU27, lot AP-L9) : tirage sans répétition. */}
      <NumberField
        label="Un mutateur ne revient pas avant (mois)"
        value={m.noRepeatMonths}
        min={0}
        step={1}
        hint="0 : ancien tirage (jamais deux mois de suite). Plafonné au nombre de mutateurs moins un."
        onChange={(v) => setRules((r) => ({ ...r, mutators: { ...r.mutators, noRepeatMonths: v ?? 0 } }))}
      />
      <NumberField
        label="Fenêtre de fraîcheur (mois)"
        value={m.freshMonths}
        min={0}
        step={1}
        hint="Un mutateur absent de cette fenêtre passe avant les autres. 0 : sans préférence."
        onChange={(v) => setRules((r) => ({ ...r, mutators: { ...r.mutators, freshMonths: v ?? 0 } }))}
      />
      <TextField
        label="Sans répétition à partir de (AAAA-MM)"
        value={m.noRepeatFrom}
        hint="Les mois d'avant gardent l'ancien tirage. Changer ces réglages peut changer le mois en cours : impose-le pour le garder."
        onChange={(v) => setRules((r) => ({ ...r, mutators: { ...r.mutators, noRepeatFrom: v } }))}
      />
      {/* 6.14.125 (AA7, AA-6) : liste des mutateurs, effets composés chiffrés et textes (la description suit les effets). */}
      <MutatorsEditor rules={rules} setRules={setRules} savedRules={saved} />
      <p className="text-[11px] text-slate-500 sm:col-span-2">Ajouter ou retirer un mutateur change le tirage des mois qui ne sont pas imposés : impose le mois en cours pour le garder.</p>
    </Section>
  );
}

/** Tirage automatique d'un mois, sur la liste et les réglages en cours d'édition (6.14.136 : les mois imposés d'avant comptent pour la
 *  répétition, pas celui du mois). */
function autoMutator(month: string, m: GameRules["mutators"]) {
  return autoMutatorFor(month, m) ?? mutatorList()[0];
}
