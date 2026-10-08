import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentGameContent } from "@/game/content";
import { describeEffect, EFFECT_STATS, type EffectStat, type ValuedEffect } from "@/game/effects";
import { MODULE_CLASSES, MODULE_RARITIES, moduleClassesText, moduleValueMax, type ModuleFamilyDef, type ModuleRarity, type ModuleTemplate } from "@/game/modules";
import { TALENT_BRANCHES, TALENT_RULES, talentDescription, talentValueMax, type TalentBranch, type TalentDef } from "@/game/talents";
import { ComposedEffectFields, STAT_OPTIONS } from "@/pages/admin/ComposedEffectFields";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* =====================================================
   6.14.127 (AU27, lot AA9, constats AA-2 et AA-5) : talents d'Ascension,
   familles et modèles de modules en sections de contenu (Admin → Talents,
   Admin → Modules). Un élément ajouté agit sans code ; un élément enregistré
   ne se supprime pas (des joueurs le détiennent) : on le retire (invariant I43).
===================================================== */

const ID_HINT_NEW = "Lettres, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant gardé dans les données des joueurs : non modifiable.";

/** Message de l'éditeur de liste : un élément enregistré se retire, il ne se supprime pas. */
export const RETIRE_HINT = "Enregistré : des joueurs peuvent le détenir. Coche « Retiré » pour le sortir du jeu.";

const fmtMax = (n: number) => String(n).replace(".", ",");

export function newTalent(): TalentDef {
  return { id: "nouveau_talent", branch: "economie", name: "Nouveau talent", description: "", effects: [{ stat: "productionAll", value: 0.02 }] };
}

export function TalentForm({ value: t, onChange, isNew }: { value: TalentDef; onChange: (next: TalentDef) => void; isNew: boolean }) {
  const set = (patch: Partial<TalentDef>) => onChange({ ...t, ...patch });
  const effects = t.effects ?? [];
  const setEffects = (next: ValuedEffect[]) => set({ effects: next });
  return (
    <div className="flex flex-col gap-3">
      <Section title="Talent">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={t.name} onChange={(name) => set({ name })} />
        <SelectField<TalentBranch> label="Branche" value={t.branch} options={TALENT_BRANCHES.map((b) => ({ value: b.id, label: b.name }))} onChange={(branch) => set({ branch })} />
        <CheckboxField label="Retiré" checked={!!t.retired} onChange={(v) => set({ retired: v || undefined })} hint="Ne s'apprend plus et quitte l'arbre ; les joueurs qui y ont des rangs gardent leur effet." />
        <div className="sm:col-span-2">
          <TextAreaField label="Texte (« {value} » : valeur par rang du premier effet)" value={t.description} onChange={(description) => set({ description })} />
          <p className="mt-1 min-w-0 text-[11px] text-slate-500">Vu des joueurs : {talentDescription(t) || "—"}</p>
        </div>
      </Section>
      <Section title={`Effets par rang (rang maximal : ${TALENT_RULES.maxRank})`}>
        {effects.map((e, i) => {
          const info = EFFECT_STATS[e.stat];
          const max = talentValueMax(e.stat);
          return (
            <div key={i} className="grid grid-cols-1 gap-2 border-l border-cyan-glow/20 pl-2 sm:col-span-2 sm:grid-cols-2">
              <ComposedEffectFields value={e} onChange={(next) => setEffects(effects.map((x, j) => (j === i ? { ...next, value: x.value } : x)))} />
              <NumberField
                label={`Effet ${i + 1} : valeur par rang`}
                value={e.value}
                min={0}
                step={info?.unit === "pct" ? 0.005 : 0.1}
                hint={`${info?.unit === "pct" ? "0,02 = +2 % par rang" : info?.unit === "level" ? "niveaux par rang" : "points par rang"}, ${fmtMax(max)} au plus. Au rang ${TALENT_RULES.maxRank} : ${describeEffect(e.stat, (Number(e.value) || 0) * TALENT_RULES.maxRank, e.target, e.scope)}.`}
                onChange={(v) => setEffects(effects.map((x, j) => (j === i ? { ...x, value: Math.max(0, v ?? 0) } : x)))}
              />
              <div className="flex items-end">
                <Button size="sm" variant="ghost" disabled={effects.length <= 1} onClick={() => setEffects(effects.filter((_, j) => j !== i))}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer l'effet
                </Button>
              </div>
            </div>
          );
        })}
        <div className="sm:col-span-2">
          <Button size="sm" variant="outline" onClick={() => setEffects([...effects, { stat: "cargo", value: 0.02 }])}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un effet
          </Button>
        </div>
      </Section>
    </div>
  );
}

/** Grandeurs proposées pour une famille : toutes, sauf celles qui demandent une ressource ou un hangar. */
const FAMILY_STATS = STAT_OPTIONS.filter((o) => o.value !== "production" && o.value !== "hangarCapacity");

const CLASS_LABELS: Record<string, string> = { light: "Faible", medium: "Moyen", heavy: "Fort", support: "Soutien" };

export function newModuleFamily(): ModuleFamilyDef {
  return { id: "nouvelle_famille", label: "Nouvelle famille", stat: "cargo", classes: ["support"], values: { common: 0.03, rare: 0.05, epic: 0.08, legendary: 0.12 } };
}

export function ModuleFamilyForm({ value: f, onChange, isNew }: { value: ModuleFamilyDef; onChange: (next: ModuleFamilyDef) => void; isNew: boolean }) {
  const set = (patch: Partial<ModuleFamilyDef>) => onChange({ ...f, ...patch });
  const info = EFFECT_STATS[f.stat];
  const max = moduleValueMax(f.stat);
  const toggleClass = (cls: (typeof MODULE_CLASSES)[number], on: boolean) => set({ classes: on ? MODULE_CLASSES.filter((c) => c === cls || f.classes.includes(c)) : f.classes.filter((c) => c !== cls) });
  return (
    <div className="flex flex-col gap-3">
      <Section title="Famille de modules">
        <TextField label="Identifiant" value={f.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : "Les modèles de cette famille y sont attachés : non modifiable."} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={f.label} onChange={(label) => set({ label })} />
        <SelectField<EffectStat>
          label="Effet (grandeur)"
          value={f.stat}
          options={FAMILY_STATS}
          onChange={(stat) => set({ stat })}
          hint={info?.unitTarget ? "Vise les unités de la classe où le module est monté." : "Effet de tout l'empire, quelle que soit la classe."}
        />
        <TextField
          label="Tournure du texte"
          value={f.phrase ?? ""}
          hint="« {pct} » : 11 % ; « {value} » : le nombre ; « {x} » : x au pluriel. Vide : texte du circuit d'effets."
          onChange={(phrase) => set({ phrase: phrase || undefined })}
        />
        {MODULE_CLASSES.map((c) => (
          <CheckboxField key={c} label={`Se monte sur : ${CLASS_LABELS[c]}`} checked={f.classes.includes(c)} onChange={(v) => toggleClass(c, v)} />
        ))}
        <p className="min-w-0 text-[11px] text-slate-500 sm:col-span-2">Se monte sur {f.classes.length > 0 ? moduleClassesText(f.classes) : "aucune classe (à corriger)"}.</p>
      </Section>
      <Section title="Valeur par rareté">
        {MODULE_RARITIES.map((r) => (
          <NumberField
            key={r.id}
            label={`${r.label} ${info?.unit === "pct" ? "(0,04 = +4 %)" : "(niveaux)"}`}
            value={f.values?.[r.id]}
            min={0}
            step={info?.unit === "pct" ? 0.01 : 1}
            hint={`${fmtMax(max)} au plus. ${describeEffect(f.stat, Number(f.values?.[r.id]) || 0)}.`}
            onChange={(v) => set({ values: { ...f.values, [r.id]: Math.max(0, v ?? 0) } as Record<ModuleRarity, number> })}
          />
        ))}
      </Section>
    </div>
  );
}

export function newModuleTemplate(): ModuleTemplate {
  return { id: "nouveau_module", name: "Nouveau module", family: currentGameContent().moduleFamilies[0]?.id ?? "armement", description: "" };
}

export function ModuleTemplateForm({ value: t, onChange, isNew }: { value: ModuleTemplate; onChange: (next: ModuleTemplate) => void; isNew: boolean }) {
  const set = (patch: Partial<ModuleTemplate>) => onChange({ ...t, ...patch });
  const families = currentGameContent().moduleFamilies;
  return (
    <div className="flex flex-col gap-3">
      <Section title="Modèle de module">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={t.name} onChange={(name) => set({ name })} />
        <SelectField
          label="Famille"
          value={t.family}
          options={families.map((f) => ({ value: f.id, label: `${f.label} (${f.id})` }))}
          onChange={(family) => set({ family })}
          hint="Effet, classes et valeurs : onglet des familles, plus bas. Une famille ajoutée s'enregistre avant ses modèles."
        />
        <CheckboxField label="Retiré du tirage" checked={!!t.retired} onChange={(v) => set({ retired: v || undefined })} hint="Plus aucun plan de ce modèle ne tombe ; les plans et modules des joueurs restent valables." />
        <div className="sm:col-span-2">
          <TextAreaField label="Texte d'ambiance" value={t.description} onChange={(description) => set({ description })} />
        </div>
      </Section>
    </div>
  );
}
