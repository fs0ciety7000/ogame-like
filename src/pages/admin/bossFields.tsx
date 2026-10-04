import { useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOSS_WEEKENDS, bossWindows, describeBossSchedule, MAX_BOSS_DATES, type BossDate, type BossSchedule, type BossWeekend } from "@/game/events";
import { CheckboxField, Field, NumberField, SelectField } from "@/pages/admin/fields";
import { cn } from "@/lib/utils";

/* v5.10.4 : occurrence d'un boss (boss mondiaux, boss de saison) dans
   les règles : actif, week-end du mois, heure de départ, durée — avec un
   aperçu des prochaines apparitions calculé sur les valeurs en cours.
   v5.10.5 : apparitions à date précise, en plus du rendez-vous mensuel. */

const PARIS: Intl.DateTimeFormatOptions = { timeZone: "Europe/Paris" };
const short = (ms: number) => new Date(ms).toLocaleString("fr-FR", { ...PARIS, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** « 2026-10-30T18:00 » (heure du navigateur) pour un champ datetime-local. */
function toLocalInput(ms: number): string {
  return new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** v5.14 : `weekly` — boss mondiaux en rotation hebdomadaire (le rendez-vous mensuel
 *  ne sert plus qu'en repli) ; `nameFor` nomme le boss de chaque apparition. */
export function BossScheduleFields({
  label,
  value,
  onChange,
  clash,
  weekly,
  nameFor,
}: {
  label: string;
  value: BossSchedule;
  onChange: (patch: Partial<BossSchedule>) => void;
  clash?: string;
  weekly?: { on: boolean; onChange: (v: boolean) => void };
  nameFor?: (startMs: number) => string;
}) {
  const now = Date.now();
  const upcoming = bossWindows(now, value, weekly?.on ? 6 : 4);
  const dates = value.dates ?? [];
  const isWeekly = !!weekly?.on;
  return (
    <>
      {weekly && (
        <CheckboxField
          label={`${label} : rotation hebdomadaire`}
          checked={weekly.on}
          onChange={weekly.onChange}
          hint="Un boss par semaine, un jour différent du précédent, au moins 4 jours d'écart (plus si la durée l'exige). Catalogue des boss : onglet Boss mondiaux."
        />
      )}
      {!isWeekly && (
        <>
          <CheckboxField
            label={weekly ? "Repli : Léviathan seul, une fois par mois" : `${label} : rendez-vous mensuel`}
            checked={value.enabled}
            onChange={(v) => onChange({ enabled: v })}
            hint="Décoché : plus d'apparition chaque mois. Les dates précises ci-dessous et le lancement manuel restent possibles."
          />
          <SelectField<BossWeekend> label="Week-end du mois" value={value.weekend} options={BOSS_WEEKENDS.map((w) => ({ value: w.id, label: w.label }))} onChange={(v) => onChange({ weekend: v })} />
        </>
      )}
      <NumberField label={isWeekly ? "Heure d'apparition (heure de Paris)" : "Départ le vendredi à (heure de Paris)"} value={value.startHour} min={0} step={1} onChange={(v) => onChange({ startHour: Math.min(23, Math.max(0, Math.round(v ?? 18))) })} />
      <NumberField label="Durée de présence (h)" value={value.durationHours} min={1} step={1} onChange={(v) => onChange({ durationHours: Math.min(160, Math.max(1, Math.round(v ?? 1))) })} />
      <BossDatesEditor dates={dates} defaultHours={value.durationHours} onChange={(d) => onChange({ dates: d })} />
      <Field label="Prochaines apparitions" hint={clash} className="sm:col-span-2">
        <div className="text-sm text-slate-300">
          {upcoming.length > 0 ? (
            <>
              <p className="text-slate-400">{describeBossSchedule(value, now)} :</p>
              <p>
                {upcoming.map((w, i) => (
                  <span key={w.startMs}>
                    {i > 0 && " · "}
                    {short(w.startMs)}
                    {nameFor && <span className="text-slate-400"> ({nameFor(w.startMs)})</span>}
                    {w.fixed && <span className="text-gold-glow"> (date précise)</span>}
                  </span>
                ))}
              </p>
            </>
          ) : (
            "Aucune apparition programmée."
          )}
        </div>
      </Field>
    </>
  );
}

/** Liste des apparitions à date précise (début à l'heure du navigateur, durée en heures). */
function BossDatesEditor({ dates, defaultHours, onChange }: { dates: BossDate[]; defaultHours: number; onChange: (d: BossDate[]) => void }) {
  const [draft, setDraft] = useState("");
  const [hours, setHours] = useState<number>(defaultHours);
  const now = Date.now();
  const sorted = [...dates].sort((a, b) => a.startMs - b.startMs);
  const add = () => {
    const startMs = new Date(draft).getTime();
    if (!(startMs > 0)) return;
    onChange([...dates, { startMs, durationHours: Math.min(160, Math.max(1, Math.round(hours || defaultHours))) }].sort((a, b) => a.startMs - b.startMs));
    setDraft("");
  };
  return (
    <Field label="Dates précises" hint="En plus du rendez-vous mensuel. Heure de ton navigateur. Une date passée peut être retirée sans risque." className="sm:col-span-2">
      <div className="flex flex-col gap-2">
        {sorted.length > 0 && (
          <ul className="flex flex-col gap-1">
            {sorted.map((d) => {
              const past = d.startMs + d.durationHours * 3600_000 <= now;
              return (
                <li key={d.startMs} className={cn("flex items-center gap-2 border border-white/10 bg-white/[0.02] px-2 py-1 text-sm", past && "opacity-50")}>
                  <span className="flex-1">
                    {short(d.startMs)} → {short(d.startMs + d.durationHours * 3600_000)} <span className="text-slate-500">({d.durationHours} h{past ? ", passée" : ""})</span>
                  </span>
                  <button type="button" aria-label="Retirer cette date" onClick={() => onChange(dates.filter((x) => x !== d))} className="text-slate-400 hover:text-danger-glow">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Début
            <input type="datetime-local" value={draft} min={toLocalInput(now)} onChange={(e) => setDraft(e.target.value)} className="h-9 border border-cyan-glow/15 bg-space-900/80 px-2 font-mono text-xs text-slate-100" aria-label="Début de l'apparition" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Durée (h)
            <input type="number" min={1} max={160} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-9 w-20 border border-cyan-glow/15 bg-space-900/80 px-2 font-mono text-xs text-slate-100" aria-label="Durée de l'apparition" />
          </label>
          <Button type="button" size="sm" variant="outline" disabled={!draft || dates.length >= MAX_BOSS_DATES} onClick={add}>
            <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Ajouter la date
          </Button>
        </div>
      </div>
    </Field>
  );
}
