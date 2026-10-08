import { EFFECT_SCOPE_LABELS, EFFECT_STAT_IDS, EFFECT_STATS, type ComposedEffect, type EffectScope, type EffectStat } from "@/game/effects";
import { unitSelectorOptions } from "@/game/effectTargets";
import { currentGameContent } from "@/game/content";
import { RESOURCE_LIST } from "@/game/resources";
import { SelectField } from "@/pages/admin/fields";
import { allEffectPresets, EFFECT_PRESET_FAMILIES, findEffectPreset, type EffectPreset } from "@/game/effectCatalog";

/* 5.23 : éditeur d'effet composé, commun aux reliques, technologies et
   officiers : grandeur × cible × portée. La valeur se règle à côté
   (rareté × multiplicateur pour une relique, par niveau ailleurs). */

const GROUP_LABELS: Record<string, string> = { combat: "Combat", economie: "Économie", durees: "Durées", flottes: "Flottes", renseignement: "Renseignement" };

/** Grandeurs proposées, groupées (libellé du groupe en tête). */
export const STAT_OPTIONS: { value: EffectStat; label: string }[] = Object.keys(GROUP_LABELS).flatMap((g) =>
  EFFECT_STAT_IDS.filter((id) => EFFECT_STATS[id].group === g).map((id) => ({ value: id, label: `${GROUP_LABELS[g]} · ${EFFECT_STATS[id].label}` })),
);

function targetOptions(stat: EffectStat): { value: string; label: string }[] | null {
  if (EFFECT_STATS[stat].unitTarget) return unitSelectorOptions(currentGameContent().units);
  if (stat === "production") return RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => ({ value: r.id, label: r.name }));
  if (stat === "hangarCapacity")
    return [
      { value: "attack", label: "Hangar d'attaque" },
      { value: "defense", label: "Hangar de défense" },
    ];
  return null;
}

export function scopeOptions(stat: EffectStat): { value: EffectScope; label: string }[] {
  return (EFFECT_STATS[stat].scopes ?? (["all", "home", "colonies"] as EffectScope[])).map((s) => ({ value: s, label: EFFECT_SCOPE_LABELS[s] }));
}

/** 6.14.123 (AA5) : lu à l'usage, pour inclure les préréglages générés des unités ajoutées. */
function presetOptions() {
  const all = allEffectPresets();
  return [
    { value: "", label: "— partir d'un effet du catalogue —" },
    ...(Object.keys(EFFECT_PRESET_FAMILIES) as (keyof typeof EFFECT_PRESET_FAMILIES)[]).flatMap((f) =>
      all.filter((x) => x.family === f).map((x) => ({ value: x.id, label: `${EFFECT_PRESET_FAMILIES[f]} · ${x.name}` })),
    ),
  ];
}

export function ComposedEffectFields({ value, onChange, onPreset }: { value: Partial<ComposedEffect>; onChange: (next: ComposedEffect) => void; onPreset?: (preset: EffectPreset) => void }) {
  const stat = (value.stat && value.stat in EFFECT_STATS ? value.stat : "unitAttack") as EffectStat;
  const targets = targetOptions(stat);
  const set = (patch: Partial<ComposedEffect>) => onChange({ stat, ...(value.target ? { target: value.target } : {}), ...(value.scope ? { scope: value.scope } : {}), ...patch } as ComposedEffect);
  return (
    <>
      {onPreset && (
        <SelectField<string>
          label="Catalogue"
          value=""
          options={presetOptions()}
          onChange={(id) => {
            const preset = findEffectPreset(id);
            if (preset) onPreset(preset);
          }}
          hint="Remplit grandeur, cible, portée et une valeur suggérée."
        />
      )}
      <SelectField<EffectStat>
        label="Grandeur"
        value={stat}
        options={STAT_OPTIONS}
        onChange={(s) => {
          const t = targetOptions(s);
          const scopes = EFFECT_STATS[s].scopes ?? ["all", "home", "colonies"];
          onChange({ stat: s, ...(t && value.target && t.some((o) => o.value === value.target) ? { target: value.target } : t && !EFFECT_STATS[s].unitTarget ? { target: t[0].value } : {}), ...(value.scope && scopes.includes(value.scope) ? { scope: value.scope } : {}) });
        }}
        hint={EFFECT_STATS[stat].reduction ? "Réduction : la valeur est retirée (temps, coût…)." : undefined}
      />
      {targets && <SelectField<string> label="Cible" value={value.target ?? (EFFECT_STATS[stat].unitTarget ? "" : targets[0].value)} options={targets} onChange={(t) => set({ target: t || undefined })} />}
      <SelectField<EffectScope> label="Portée" value={value.scope ?? "all"} options={scopeOptions(stat)} onChange={(s) => set({ scope: s === "all" ? undefined : s })} hint="Contre les PNJ : pirates, primes, expéditions, boss et seigneurs." />
    </>
  );
}
