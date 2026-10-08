import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { MODULE_RARITIES, SIGNATURE_MODULE_RULES, SIGNATURE_MODULE_RULES_META, signatureUnits, type ModuleRarity } from "@/game/modules";
import { RELIC_SOURCE_RULES, RELIC_SOURCE_RULES_META } from "@/game/relics";
import { CheckboxField, NumberField, Section, SelectField, TextField } from "@/pages/admin/fields";

/* =====================================================
   6.14.133 (AU27, lot AJ27-10) : plans de module « signature » (un par
   unité, porteur propre) et sources favorites des reliques. Les mêmes
   champs restent dans « Tous les réglages (avancé) » (groupes
   `signatureModules` et `relicSources`) ; les sources de chaque relique
   se règlent dans sa fiche (Admin → Reliques).
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const groupOf = (r: R, group: string): Obj => ((r as unknown as Obj)[group] ?? {}) as Obj;

export function SignatureRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const sig = { ...SIGNATURE_MODULE_RULES, ...groupOf(rules, "signatureModules") } as typeof SIGNATURE_MODULE_RULES;
  const src = { ...RELIC_SOURCE_RULES, ...groupOf(rules, "relicSources") } as typeof RELIC_SOURCE_RULES;
  const setSig = (patch: Obj) => setRules((r) => ({ ...r, signatureModules: { ...groupOf(r, "signatureModules"), ...patch } }) as R);
  const setSrc = (patch: Obj) => setRules((r) => ({ ...r, relicSources: { ...groupOf(r, "relicSources"), ...patch } }) as R);
  const M = SIGNATURE_MODULE_RULES_META;
  return (
    <Section title="Porteurs signature et sources des reliques (6.14.133)">
      <p className="text-sm text-slate-400 sm:col-span-2">
        Un plan de module rare ou mieux sort parfois « signature » : il vise une seule unité (sa famille × le facteur) et se monte sur sa classe. Chaque unité en a un, sauf celles qu'une
        relique vise déjà ({signatureUnits().length} unités aujourd'hui). Un plan déjà trouvé garde son effet.
      </p>
      <CheckboxField label={M.enabled.label} checked={sig.enabled !== false} hint={M.enabled.hint} onChange={(v) => setSig({ enabled: v })} />
      <NumberField label={M.chance.label} value={sig.chance} min={0} step={0.05} hint={M.chance.hint} onChange={(v) => setSig({ chance: Math.max(0, Math.min(1, v ?? 0)) })} />
      <SelectField<ModuleRarity> label={M.minRarity.label} value={sig.minRarity} options={MODULE_RARITIES.map((r) => ({ value: r.id, label: r.label }))} onChange={(v) => setSig({ minRarity: v })} />
      <NumberField label={M.factor.label} value={sig.factor} min={0} step={0.05} hint={M.factor.hint} onChange={(v) => setSig({ factor: Math.max(0, Math.min(5, v ?? 0)) })} />
      <TextField label={M.attackFamily.label} value={sig.attackFamily} hint={M.attackFamily.hint} onChange={(v) => setSig({ attackFamily: v })} />
      <TextField label={M.supportFamily.label} value={sig.supportFamily} hint={M.supportFamily.hint} onChange={(v) => setSig({ supportFamily: v })} />
      <TextField
        label={M.excluded.label}
        value={(sig.excluded ?? []).join(", ")}
        hint={`${M.excluded.hint} Séparés par des virgules.`}
        onChange={(v) => setSig({ excluded: v.split(",").map((x) => x.trim()).filter(Boolean) })}
      />
      <TextField label={M.name.label} value={sig.name} hint={M.name.hint} onChange={(v) => setSig({ name: v })} />
      <TextField label={M.description.label} value={sig.description} hint={M.description.hint} onChange={(v) => setSig({ description: v })} />
      <TextField label={M.attackPhrase.label} value={sig.attackPhrase} hint={M.attackPhrase.hint} onChange={(v) => setSig({ attackPhrase: v })} />
      <TextField label={M.hpPhrase.label} value={sig.hpPhrase} hint={M.hpPhrase.hint} onChange={(v) => setSig({ hpPhrase: v })} />
      <CheckboxField label={RELIC_SOURCE_RULES_META.enabled.label} checked={src.enabled !== false} hint={RELIC_SOURCE_RULES_META.enabled.hint} onChange={(v) => setSrc({ enabled: v })} />
      <NumberField
        label={RELIC_SOURCE_RULES_META.sourceBoost.label}
        value={src.sourceBoost}
        min={1}
        step={0.5}
        hint={`${RELIC_SOURCE_RULES_META.sourceBoost.hint} Sources de chaque relique : sa fiche (Admin → Reliques).`}
        onChange={(v) => setSrc({ sourceBoost: Math.max(1, Math.min(20, v ?? 1)) })}
      />
    </Section>
  );
}
