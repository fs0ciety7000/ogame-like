import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { allianceDefEffects, allianceEffectLayer, allianceEffectLines, type AllianceEffect, type AllianceProjectDef, type AllianceResearchDef } from "@/game/alliances";
import type { GameRules } from "@/game/content";
import type { ComposedEffect } from "@/game/effects";
import { ComposedEffectFields } from "@/pages/admin/ComposedEffectFields";
import { NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* 6.14.124 (AU27, lot AA6, constat AA-15) : éditeur des recherches et projets d'alliance. Chaque entrée porte ses effets
   composés (grandeur × cible × portée, comme une relique, une techno ou un officier) : une recherche ajoutée ici a un effet,
   sans code. La valeur vaut « par niveau » × niveau ; « places de membres » vaut le réglage « membres par niveau ». */

type SetRules = (fn: (r: GameRules) => GameRules) => void;
type Kind = "research" | "project";
type Def = AllianceResearchDef | AllianceProjectDef;

const FIELD: Record<Kind, "researches" | "projects"> = { research: "researches", project: "projects" };
const NATURE_OPTIONS = [
  { value: "effect", label: "Effet sur les membres" },
  { value: "members", label: "Places de membres (alliance)" },
];

function newDef(kind: Kind, n: number): Def {
  return {
    id: `${kind === "research" ? "recherche" : "projet"}_${n}`,
    name: kind === "research" ? "Nouvelle recherche" : "Nouveau projet",
    emoji: "",
    description: "",
    perLevel: 0.02,
    maxLevel: 5,
    effects: [{ stat: "cargo" }],
  };
}

function DefCard({ def, kind, isNew, onChange, onRemove }: { def: Def; kind: Kind; isNew: boolean; onChange: (d: Def) => void; onRemove: () => void }) {
  const effects = allianceDefEffects(def, kind);
  const setEffects = (next: AllianceEffect[]) => onChange({ ...def, effects: next });
  const unit = kind === "research" ? "niveau" : "palier";
  return (
    <div className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-2 sm:col-span-2">
        <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
          {def.emoji} {def.name || def.id}
        </p>
        <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Retirer ${def.name || def.id}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <TextField label="Identifiant" value={def.id} disabled={!isNew} hint={isNew ? "Lettres, chiffres et _ ; il ne change plus une fois enregistré." : "Les niveaux des alliances y sont attachés : il ne change pas."} onChange={(id) => onChange({ ...def, id })} />
      <TextField label="Nom" value={def.name} onChange={(name) => onChange({ ...def, name })} />
      <TextField label="Émoji" value={def.emoji} hint="Un émoji (icône de la carte)." onChange={(emoji) => onChange({ ...def, emoji })} />
      <TextAreaField label="Description" value={def.description} onChange={(description) => onChange({ ...def, description })} />
      <NumberField label={`Valeur par ${unit}`} value={def.perLevel} min={0} step={0.01} hint="0,05 = 5 % ; un point de contre-espionnage = 1." onChange={(v) => onChange({ ...def, perLevel: v ?? 0 })} />
      <NumberField label={`${unit === "niveau" ? "Niveau" : "Palier"} maximal`} value={def.maxLevel} min={1} step={1} onChange={(v) => onChange({ ...def, maxLevel: Math.max(1, Math.round(v ?? 1)) })} />
      {effects.map((e, i) => {
        const layer = allianceEffectLayer(e);
        return (
          <div key={i} className="grid grid-cols-1 gap-2 border-l border-cyan-glow/20 pl-2 sm:col-span-2 sm:grid-cols-2">
            <SelectField
              label={`Effet ${i + 1}`}
              value={e.stat === "allianceMembers" ? "members" : "effect"}
              options={NATURE_OPTIONS}
              onChange={(nature) => setEffects(effects.map((x, j) => (j === i ? (nature === "members" ? { stat: "allianceMembers" } : { stat: "cargo" }) : x)))}
              hint={layer === "alliance" ? "Calcul d'alliance : multiplicateur à part, comme avant." : layer === "empire" ? "S'ajoute aux officiers et reliques (couche empire, plafonnée)." : "Places en plus par niveau : réglage « membres par niveau »."}
            />
            {e.stat !== "allianceMembers" && <ComposedEffectFields value={e as ComposedEffect} onChange={(next) => setEffects(effects.map((x, j) => (j === i ? next : x)))} />}
            <div className="flex items-end sm:col-span-2">
              <Button size="sm" variant="ghost" disabled={effects.length <= 1} onClick={() => setEffects(effects.filter((_, j) => j !== i))}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer l'effet
              </Button>
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button size="sm" variant="outline" onClick={() => setEffects([...effects, { stat: "cargo" }])}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un effet
        </Button>
        <p className="min-w-0 text-[11px] text-slate-500">Par {unit} : {allianceEffectLines(def, kind).join(", ") || "aucun effet"}.</p>
      </div>
    </div>
  );
}

function DefList({ rules, setRules, kind, saved }: { rules: GameRules; setRules: SetRules; kind: Kind; saved: Set<string> }) {
  const field = FIELD[kind];
  const list = (rules.alliances[field] ?? []) as Def[];
  const setList = (next: Def[]) => setRules((r) => ({ ...r, alliances: { ...r.alliances, [field]: next } }));
  return (
    <Section title={kind === "research" ? "Recherches d'alliance" : "Projets d'alliance"}>
      <p className="text-xs text-slate-500 sm:col-span-2">
        {kind === "research" ? "Payées par le trésor, un niveau à la fois." : "Financés par le trésor et les dons, construits palier par palier."} Temps de vol, production de toutes les ressources,
        contre-espionnage, bouclier, durées, abri du pillage et l'attaque de toutes les unités contre les PNJ (boss, primes, repaires) passent par les calculs d'alliance ; toute autre
        grandeur s'ajoute aux officiers et aux reliques.
      </p>
      {list.map((def, i) => (
        <DefCard
          key={`${i}-${saved.has(def.id) ? def.id : "new"}`}
          def={def}
          kind={kind}
          isNew={!saved.has(def.id)}
          onChange={(d) => setList(list.map((x, j) => (j === i ? d : x)))}
          onRemove={async () => {
            const ok = await askConfirm({
              title: `Retirer « ${def.name || def.id} » ?`,
              message: saved.has(def.id) ? "Les alliances qui l'ont déjà gardent leurs niveaux, mais l'effet disparaît à l'enregistrement." : "Elle n'a pas encore été enregistrée.",
              confirmLabel: "Retirer",
              tone: "danger",
            });
            if (ok) setList(list.filter((_, j) => j !== i));
          }}
        />
      ))}
      <div className="sm:col-span-2">
        <Button size="sm" variant="outline" onClick={() => setList([...list, newDef(kind, list.length + 1)])}>
          <Plus className="mr-1 h-3.5 w-3.5" /> {kind === "research" ? "Ajouter une recherche" : "Ajouter un projet"}
        </Button>
      </div>
    </Section>
  );
}

/** Recherches et projets d'alliance (Admin → Règles → Événements et saisons, après « Alliances »). */
export function AllianceEffectsEditor({ rules, setRules, savedRules }: { rules: GameRules; setRules: SetRules; savedRules: GameRules }) {
  const savedIds = (kind: Kind) => new Set(((savedRules.alliances?.[FIELD[kind]] ?? []) as Def[]).map((d) => d.id));
  return (
    <>
      <DefList rules={rules} setRules={setRules} kind="research" saved={savedIds("research")} />
      <DefList rules={rules} setRules={setRules} kind="project" saved={savedIds("project")} />
    </>
  );
}
