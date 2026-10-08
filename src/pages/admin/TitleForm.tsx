import { alpha } from "@/lib/utils";
import { isTargetedMetric, METRICS, type AchievementMetric } from "@/game/achievements";
import { TITLE_RARITIES, titleRarity, type TitleDef, type TitleRarity } from "@/game/titles";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* v5.10 : fiche d'un titre du catalogue (libellé, rareté, icône, déblocage). */

const ID_HINT_NEW = "Minuscules, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant utilisé par les succès : non modifiable.";

export function newTitle(): TitleDef {
  return { id: "nouveau_titre", label: "Nouveau titre", description: "", icon: "🏆", rarity: "rare", enabled: false };
}

export function titleListLabel(t: TitleDef): string {
  return `${t.icon} ${t.label}${t.unlock ? " · auto" : ""}${t.enabled ? "" : " (inactif)"}`;
}

export function TitleForm({ value: t, onChange, isNew }: { value: TitleDef; onChange: (next: TitleDef) => void; isNew: boolean }) {
  const set = (patch: Partial<TitleDef>) => onChange({ ...t, ...patch });
  const r = titleRarity(t.rarity);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Titre">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <CheckboxField label="Actif" checked={t.enabled} onChange={(enabled) => set({ enabled })} hint="Inactif : plus débloqué automatiquement (ceux déjà gagnés restent)." />
        <TextField label="Libellé (affiché à côté du pseudo)" value={t.label} onChange={(label) => set({ label })} hint="Changer le libellé n'affecte pas les joueurs qui l'ont déjà : ils gardent l'ancien." />
        <TextField label="Icône (emoji)" value={t.icon} onChange={(icon) => set({ icon })} />
        <SelectField<TitleRarity> label="Rareté (couleur)" value={t.rarity} options={TITLE_RARITIES.map((x) => ({ value: x.id, label: x.label }))} onChange={(rarity) => set({ rarity })} />
        <div className="sm:col-span-2">
          <TextAreaField label="Description" value={t.description} rows={2} onChange={(description) => set({ description })} />
        </div>
      </Section>
      <Section title="Déblocage automatique">
        <CheckboxField
          label="Se débloque sur une mesure"
          checked={!!t.unlock}
          onChange={(on) => set({ unlock: on ? { metric: "victories", threshold: 10 } : null })}
          hint="Sinon, le titre est décerné par un succès (onglet Succès) ou habille un titre gagné ailleurs (même libellé)."
        />
        {t.unlock && (
          <>
            <SelectField<AchievementMetric>
              label="Mesure suivie"
              value={t.unlock.metric}
              options={(Object.keys(METRICS) as AchievementMetric[]).filter((m) => !isTargetedMetric(m)).map((m) => ({ value: m, label: METRICS[m].label }))}
              onChange={(metric) => set({ unlock: { ...t.unlock!, metric } })}
            />
            <NumberField label="Seuil à atteindre" value={t.unlock.threshold} min={1} step={1} onChange={(v) => set({ unlock: { ...t.unlock!, threshold: Math.max(1, v ?? 1) } })} />
          </>
        )}
      </Section>
      <Section title="Aperçu">
        <div className="sm:col-span-2">
          <span className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs" style={{ color: r.color, borderColor: `${alpha(r.color, 40)}`, background: `${alpha(r.color, 7)}` }}>
            {t.icon} {t.label || "—"}
          </span>
          <span className="ml-2 text-xs text-slate-500">{r.label}</span>
        </div>
      </Section>
    </div>
  );
}
