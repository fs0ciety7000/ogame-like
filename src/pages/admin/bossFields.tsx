import { BOSS_WEEKENDS, bossWindows, describeBossSchedule, type BossSchedule, type BossWeekend } from "@/game/events";
import { CheckboxField, Field, NumberField, SelectField } from "@/pages/admin/fields";

/* v5.10.4 : occurrence d'un boss mensuel (Léviathan, boss de saison) dans
   les règles : actif, week-end du mois, heure de départ, durée — avec un
   aperçu des prochaines apparitions calculé sur les valeurs en cours. */

export function BossScheduleFields({ label, value, onChange, clash }: { label: string; value: BossSchedule; onChange: (patch: Partial<BossSchedule>) => void; clash?: string }) {
  const upcoming = bossWindows(Date.now(), value, 3);
  return (
    <>
      <CheckboxField label={`${label} actif`} checked={value.enabled} onChange={(v) => onChange({ enabled: v })} hint="Décoché : plus aucune apparition automatique (le lancement manuel reste possible)." />
      <SelectField<BossWeekend> label="Week-end du mois" value={value.weekend} options={BOSS_WEEKENDS.map((w) => ({ value: w.id, label: w.label }))} onChange={(v) => onChange({ weekend: v })} />
      <NumberField label="Départ le vendredi à (heure de Paris)" value={value.startHour} min={0} step={1} onChange={(v) => onChange({ startHour: Math.min(23, Math.max(0, Math.round(v ?? 18))) })} />
      <NumberField label="Durée de présence (h)" value={value.durationHours} min={1} step={1} onChange={(v) => onChange({ durationHours: Math.min(160, Math.max(1, Math.round(v ?? 1))) })} />
      <Field label="Prochaines apparitions" hint={clash} className="sm:col-span-2">
        <p className="text-sm text-slate-300">
          {value.enabled && upcoming.length > 0 ? (
            <>
              <span className="text-slate-400">{describeBossSchedule(value)} : </span>
              {upcoming.map((w) => new Date(w.startMs).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })).join(" · ")}
            </>
          ) : (
            "Aucune apparition programmée."
          )}
        </p>
      </Field>
    </>
  );
}
