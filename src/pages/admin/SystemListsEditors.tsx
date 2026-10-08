import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import type { GameRules } from "@/game/content";
import { describeEffect, EFFECT_STATS, valuedEffectMax, type ValuedEffect } from "@/game/effects";
import { empireClassPerkLines, type EmpireClassDef, type EmpireClassPerks } from "@/game/empireClass";
import { mutatorDescription, type MutatorEntry } from "@/game/mutators";
import { ComposedEffectFields } from "@/pages/admin/ComposedEffectFields";
import { NumberField, TextAreaField, TextField } from "@/pages/admin/fields";

/* 6.14.125 (AU27, lot AA7, constats AA-3 et AA-6) : listes système éditables. Classes d'empire et mutateurs de saison
   portent leurs effets composés chiffrés (grandeur × cible × portée + valeur, comme une relique ou un officier) : une
   classe ou un mutateur ajouté ici a un effet réel, sans code. Une classe livrée ne se retire pas (des joueurs l'ont
   choisie) ; un identifiant enregistré ne change plus. */

type SetRules = (fn: (r: GameRules) => GameRules) => void;

/** Effets chiffrés : grandeur, cible, portée (éditeur commun), plus la valeur. Au moins un effet. */
export function ValuedEffectsFields({ effects, onChange }: { effects: ValuedEffect[]; onChange: (next: ValuedEffect[]) => void }) {
  return (
    <>
      {effects.map((e, i) => {
        const info = EFFECT_STATS[e.stat];
        const max = valuedEffectMax(e.stat);
        return (
          <div key={i} className="grid grid-cols-1 gap-2 border-l border-cyan-glow/20 pl-2 sm:col-span-2 sm:grid-cols-2">
            <ComposedEffectFields value={e} onChange={(next) => onChange(effects.map((x, j) => (j === i ? { ...next, value: x.value } : x)))} />
            <NumberField
              label={`Effet ${i + 1} : valeur`}
              value={e.value}
              min={0}
              step={info?.unit === "pct" ? 0.01 : 1}
              hint={`${info?.unit === "pct" ? "0,1 = 10 %" : info?.unit === "level" ? "en niveaux" : "en points"}, ${String(max).replace(".", ",")} au plus. Aujourd'hui : ${describeEffect(e.stat, e.value, e.target, e.scope)}.`}
              onChange={(v) => onChange(effects.map((x, j) => (j === i ? { ...x, value: v ?? 0 } : x)))}
            />
            <div className="flex items-end">
              <Button size="sm" variant="ghost" disabled={effects.length <= 1} onClick={() => onChange(effects.filter((_, j) => j !== i))}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer l'effet
              </Button>
            </div>
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <Button size="sm" variant="outline" onClick={() => onChange([...effects, { stat: "cargo", value: 0.05 }])}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un effet
        </Button>
      </div>
    </>
  );
}

const PERKS: { key: keyof EmpireClassPerks; label: string; max: number }[] = [
  { key: "buildSlots", label: "Chantiers de bâtiments en plus", max: 3 },
  { key: "fleetSlots", label: "Emplacements de flotte en plus", max: 10 },
  { key: "expeditionsPerDay", label: "Expéditions par jour en plus", max: 5 },
];

const LIVRED_CLASSES = ["industriel", "seigneur", "explorateur"];

function ClassCard({ def, isNew, onChange, onRemove }: { def: EmpireClassDef; isNew: boolean; onChange: (d: EmpireClassDef) => void; onRemove: (() => void) | null }) {
  return (
    <div className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-2 sm:col-span-2">
        <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
          {def.emoji} {def.name || def.id}
        </p>
        {onRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Retirer ${def.name || def.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <TextField label="Identifiant" value={def.id} disabled={!isNew} hint={isNew ? "Minuscules, chiffres et _ ; il ne change plus une fois enregistré." : "Les joueurs qui l'ont choisie y sont attachés : il ne change pas."} onChange={(id) => onChange({ ...def, id })} />
      <TextField label="Nom" value={def.name} onChange={(name) => onChange({ ...def, name })} />
      <TextField label="Émoji" value={def.emoji} hint="Un émoji (carte de la classe, classement)." onChange={(emoji) => onChange({ ...def, emoji })} />
      <TextAreaField label="Accroche (qui joue cette classe)" value={def.tagline} onChange={(tagline) => onChange({ ...def, tagline })} />
      <ValuedEffectsFields effects={def.effects ?? []} onChange={(effects) => onChange({ ...def, effects })} />
      {PERKS.map((p) => (
        <NumberField
          key={p.key}
          label={p.label}
          value={def.perks?.[p.key] ?? 0}
          min={0}
          step={1}
          onChange={(v) => {
            const n = Math.max(0, Math.min(p.max, Math.round(v ?? 0)));
            const perks = { ...(def.perks ?? {}) };
            if (n > 0) perks[p.key] = n;
            else delete perks[p.key];
            onChange({ ...def, perks });
          }}
        />
      ))}
      <p className="min-w-0 text-[11px] text-slate-500 sm:col-span-2">Avantages : {empireClassPerkLines(def).join(", ") || "aucun"}.</p>
    </div>
  );
}

/** Classes d'empire (Admin → Règles, section « Classes d'empire »). */
export function EmpireClassesEditor({ rules, setRules, savedRules }: { rules: GameRules; setRules: SetRules; savedRules: GameRules }) {
  const list = rules.classes.defs ?? [];
  const saved = new Set((savedRules.classes?.defs ?? []).map((c) => c.id));
  const setList = (next: EmpireClassDef[]) => setRules((r) => ({ ...r, classes: { ...r.classes, defs: next } }));
  return (
    <>
      <p className="text-xs text-slate-500 sm:col-span-2">
        Chaque classe donne ses effets (couche empire, dans les plafonds des officiers et reliques) et ses avantages. Une classe ajoutée apparaît sur la page Classe ; son illustration et son vaisseau de classe
        se règlent à part (onglet Unités : « Classe d'empire »).
      </p>
      {list.map((def, i) => (
        <ClassCard
          key={`${i}-${saved.has(def.id) ? def.id : "new"}`}
          def={def}
          isNew={!saved.has(def.id)}
          onChange={(d) => setList(list.map((x, j) => (j === i ? d : x)))}
          onRemove={
            LIVRED_CLASSES.includes(def.id)
              ? null
              : async () => {
                  const ok = await askConfirm({
                    title: `Retirer « ${def.name || def.id} » ?`,
                    message: saved.has(def.id) ? "Les joueurs qui l'ont choisie perdent ses effets à l'enregistrement et pourront choisir une autre classe." : "Elle n'a pas encore été enregistrée.",
                    confirmLabel: "Retirer",
                    tone: "danger",
                  });
                  if (ok) setList(list.filter((_, j) => j !== i));
                }
          }
        />
      ))}
      <div className="sm:col-span-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setList([...list, { id: `classe_${list.length + 1}`, name: "Nouvelle classe", emoji: "", tagline: "", effects: [{ stat: "productionAll", value: 0.05 }], perks: {} }])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une classe
        </Button>
      </div>
    </>
  );
}

/** Mutateurs de saison : liste, effets et textes (Admin → Règles → Événements et saisons, « Mutateur de saison »). */
export function MutatorsEditor({ rules, setRules, savedRules }: { rules: GameRules; setRules: SetRules; savedRules: GameRules }) {
  const list = rules.mutators.defs ?? [];
  const saved = new Set((savedRules.mutators?.defs ?? []).map((m) => m.id));
  const setList = (next: MutatorEntry[]) => setRules((r) => ({ ...r, mutators: { ...r.mutators, defs: next } }));
  return (
    <>
      {list.map((m, i) => (
        <div key={`${i}-${saved.has(m.id) ? m.id : "new"}`} className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
              {m.emoji} {m.name || m.id}
            </p>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Retirer ${m.name || m.id}`}
              disabled={list.length <= 1}
              onClick={async () => {
                const ok = await askConfirm({
                  title: `Retirer « ${m.name || m.id} » ?`,
                  message: "Le tirage des mois non imposés change (impose le mois en cours pour le garder). Un mois imposé sur ce mutateur repasse au tirage.",
                  confirmLabel: "Retirer",
                  tone: "danger",
                });
                if (ok) setList(list.filter((_, j) => j !== i));
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <TextField label="Identifiant" value={m.id} disabled={saved.has(m.id)} hint={saved.has(m.id) ? "Les mois imposés y sont attachés : il ne change pas." : "Minuscules, chiffres et _."} onChange={(id) => setList(list.map((x, j) => (j === i ? { ...x, id } : x)))} />
          <TextField label="Nom" value={m.name} onChange={(name) => setList(list.map((x, j) => (j === i ? { ...x, name } : x)))} />
          <TextField label="Émoji" value={m.emoji} onChange={(emoji) => setList(list.map((x, j) => (j === i ? { ...x, emoji } : x)))} />
          <TextField label="Accroche (avant les effets)" value={m.flavor ?? ""} hint="Vide : le nom." onChange={(flavor) => setList(list.map((x, j) => (j === i ? { ...x, flavor } : x)))} />
          <ValuedEffectsFields effects={m.effects ?? []} onChange={(effects) => setList(list.map((x, j) => (j === i ? { ...x, effects } : x)))} />
          <p className="min-w-0 text-[11px] text-slate-500 sm:col-span-2">Vu des joueurs : {mutatorDescription(m)}</p>
        </div>
      ))}
      <div className="sm:col-span-2">
        <Button size="sm" variant="outline" onClick={() => setList([...list, { id: `mutateur_${list.length + 1}`, name: "Nouveau mutateur", emoji: "", flavor: "", effects: [{ stat: "productionAll", value: 0.05 }] }])}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un mutateur
        </Button>
      </div>
    </>
  );
}
