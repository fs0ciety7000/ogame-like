import { CATEGORY_LABELS, METRICS, TIER_LABELS, TIER_REWARDS, type AchievementCategory, type AchievementDef, type AchievementMetric, type AchievementTier } from "@/game/achievements";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

const ID_HINT_NEW = "Minuscules, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant gardé dans les profils des joueurs : non modifiable.";

export function newAchievement(): AchievementDef {
  return {
    id: "nouveau_succes",
    enabled: false,
    name: "Nouveau succès",
    description: "",
    emoji: "🏆",
    category: "combat",
    tier: "bronze",
    metric: "victories",
    threshold: 1,
    secret: false,
    rewardXp: TIER_REWARDS.bronze.xp,
    rewardHours: TIER_REWARDS.bronze.hours,
    title: "",
  };
}

/** Fiche d'un succès : textes, mesure suivie, seuil, palier et récompense. */
export function AchievementForm({ value: a, onChange, isNew }: { value: AchievementDef; onChange: (next: AchievementDef) => void; isNew: boolean }) {
  const set = (patch: Partial<AchievementDef>) => onChange({ ...a, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <Section title="Succès">
        <TextField label="Identifiant" value={a.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(v) => set({ id: v })} />
        <CheckboxField label="Actif" checked={a.enabled} onChange={(v) => set({ enabled: v })} hint="Inactif : masqué et plus attribué (ceux déjà obtenus restent acquis)." />
        <TextField label="Nom" value={a.name} onChange={(v) => set({ name: v })} />
        <TextField label="Emoji" value={a.emoji} onChange={(v) => set({ emoji: v })} />
        <TextAreaField label="Description" value={a.description} onChange={(v) => set({ description: v })} />
        <SelectField
          label="Catégorie"
          value={a.category}
          options={(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((c) => ({ value: c, label: `${CATEGORY_LABELS[c].emoji} ${CATEGORY_LABELS[c].label}` }))}
          onChange={(v) => set({ category: v })}
        />
        <CheckboxField label="Secret" checked={a.secret} onChange={(v) => set({ secret: v })} hint="Affiché « ??? » tant qu'il n'est pas obtenu." />
      </Section>
      <Section title="Condition">
        <SelectField
          label="Mesure suivie"
          value={a.metric}
          options={(Object.keys(METRICS) as AchievementMetric[]).map((m) => ({ value: m, label: METRICS[m].label }))}
          onChange={(v) => set({ metric: v })}
        />
        <NumberField label="Seuil à atteindre" value={a.threshold} min={1} step={1} onChange={(v) => set({ threshold: v ?? 1 })} />
      </Section>
      <Section title="Récompense">
        <SelectField
          label="Palier (médaille)"
          value={a.tier}
          options={(Object.keys(TIER_LABELS) as AchievementTier[]).map((t) => ({ value: t, label: `${TIER_LABELS[t]} (par défaut +${TIER_REWARDS[t].xp} XP, ${TIER_REWARDS[t].hours} h)` }))}
          onChange={(v) => set({ tier: v, rewardXp: TIER_REWARDS[v].xp, rewardHours: TIER_REWARDS[v].hours })}
        />
        <NumberField label="XP" value={a.rewardXp} min={0} step={5} onChange={(v) => set({ rewardXp: v ?? 0 })} />
        <NumberField label="Heures de production" value={a.rewardHours} min={0} step={1} onChange={(v) => set({ rewardHours: v ?? 0 })} />
        <TextField label="Titre décerné (optionnel)" value={a.title} onChange={(v) => set({ title: v })} />
      </Section>
    </div>
  );
}
