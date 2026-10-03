import { ResourceSelect } from "@/components/game/ResourceSelect";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentGameContent } from "@/game/content";
import { RESOURCE_LIST } from "@/game/resources";
import {
  describeTechEffect,
  effectValuePerLevel,
  NUMERIC_TECH_EFFECTS,
  TECH_EFFECT_DEFAULTS,
  TECH_EFFECT_LABELS,
  TECH_REDUCTION_CAP,
  techEffects,
  CAPPED_TECH_EFFECTS,
  type TechDef,
  type TechEffectDef,
  type TechEffectType,
} from "@/game/technologies";
import { cn } from "@/lib/utils";

/* Éditeur des effets d'une technologie (v2.6) : plusieurs effets, chacun
   avec son type, sa cible éventuelle et sa valeur par niveau. */

const GROUPS: { label: string; types: TechEffectType[] }[] = [
  { label: "Économie", types: ["energy_efficiency", "resource_production", "storage_capacity", "protected_storage", "building_discount"] },
  { label: "Durées", types: ["building_time", "unit_time", "research_time"] },
  { label: "Flotte et combat", types: ["unit_attack", "unit_defense", "fleet_speed", "cargo_capacity", "fleet_upkeep", "counter_spy", "hangar_capacity"] },
  { label: "Déblocages", types: ["unlock_next_level", "unlock_buildings", "unlock_recipe", "unlock_defense_units", "unlock_attack_units"] },
];

const SELECT = "h-9 w-full border border-cyan-glow/15 bg-space-900/80 px-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50";

function names() {
  const c = currentGameContent();
  return {
    resource: (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name.toLowerCase() ?? id,
    unit: (id: string) => c.units.find((u) => u.id === id)?.name ?? id,
    building: (id: string) => c.buildings.find((b) => b.id === id)?.name ?? id,
  };
}

/** Pourcentages affichés en % dans le champ (0,1 ↔ 10). */
function isPercent(type: TechEffectType) {
  return type !== "counter_spy";
}

export function TechEffectsEditor({ tech, onChange }: { tech: TechDef; onChange: (t: TechDef) => void }) {
  const effects = techEffects(tech);
  const content = currentGameContent();
  const n = names();
  const save = (list: TechEffectDef[]) => onChange({ ...tech, effects: list, effect: undefined, effectValue: undefined });
  const patch = (i: number, p: Partial<TechEffectDef>) => save(effects.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const move = (i: number, d: number) => {
    const list = [...effects];
    const [e] = list.splice(i, 1);
    list.splice(i + d, 0, e);
    save(list);
  };
  const linkedBuildings = content.buildings.filter((b) => b.unlockedByTech === tech.id);
  const linkedUnit = content.units.find((u) => u.unlockTech === tech.id);

  return (
    <div className="flex flex-col gap-2">
      {effects.length === 0 && <p className="text-xs text-slate-500">Aucun effet : la technologie ne sert que de prérequis.</p>}
      {effects.map((e, i) => {
        const numeric = NUMERIC_TECH_EFFECTS.includes(e.type);
        const pct = isPercent(e.type);
        const def = TECH_EFFECT_DEFAULTS[e.type] ?? 0;
        const shown = e.type === "unlock_buildings" || e.type === "unlock_hangars" ? { ...e, targets: [...new Set([...linkedBuildings.map((b) => b.id), ...(e.targets ?? [])])] } : e;
        return (
          <div key={i} className="hud-cut-sm grid gap-2 border border-cyan-glow/15 bg-black/25 p-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Effet {i + 1}</span>
                <select
                  value={e.type === "unlock_hangars" ? "unlock_buildings" : e.type}
                  onChange={(ev) => patch(i, { type: ev.target.value as TechEffectType, value: undefined, target: undefined, targets: undefined })}
                  className={SELECT}
                >
                  {GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.types.map((t) => (
                        <option key={t} value={t}>
                          {TECH_EFFECT_LABELS[t]}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              {e.type === "resource_production" && (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Ressource</span>
<ResourceSelect<string> value={e.target ?? ""} onChange={(v) => patch(i, { target: v || undefined })} ariaLabel="Ressource" className="h-9" />
                </label>
              )}

              {e.type === "hangar_capacity" && (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Hangar</span>
                  <select value={e.target ?? ""} onChange={(ev) => patch(i, { target: ev.target.value || undefined })} className={SELECT}>
                    <option value="">— choisir —</option>
                    <option value="attack">Hangar d'attaque</option>
                    <option value="defense">Hangar de défense</option>
                  </select>
                </label>
              )}

              {e.type === "unlock_next_level" && (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Unité</span>
                  <select value={e.target ?? ""} onChange={(ev) => patch(i, { target: ev.target.value || undefined })} className={SELECT}>
                    <option value="">{linkedUnit ? `Liée dans sa fiche : ${linkedUnit.name}` : "— aucune unité liée —"}</option>
                    {content.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(e.type === "unlock_buildings" || e.type === "unlock_hangars") && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Bâtiments débloqués</span>
                  <div className="flex flex-wrap gap-1.5">
                    {content.buildings
                      .filter((b) => !b.startsUnlocked)
                      .map((b) => {
                        const viaSheet = b.unlockedByTech === tech.id;
                        const on = viaSheet || (e.targets ?? []).includes(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={viaSheet}
                            title={viaSheet ? "Lié depuis la fiche du bâtiment" : undefined}
                            onClick={() => patch(i, { targets: on ? (e.targets ?? []).filter((x) => x !== b.id) : [...(e.targets ?? []), b.id] })}
                            className={cn(
                              "border px-2 py-1 text-xs transition-colors",
                              on ? "border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
                              viaSheet && "cursor-default opacity-80",
                            )}
                          >
                            {b.name}
                          </button>
                        );
                      })}
                  </div>
                  {linkedBuildings.length > 0 && <span className="text-[11px] text-slate-500">Grisés : liés depuis la fiche du bâtiment (« Débloqué par »).</span>}
                </div>
              )}

              {numeric && (
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{pct ? "Valeur par niveau (%)" : "Points par niveau"}</span>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    value={e.value === undefined ? "" : pct ? Math.round(e.value * 10000) / 100 : e.value}
                    placeholder={`défaut : ${pct ? Math.round(def * 1000) / 10 : def}`}
                    onChange={(ev) => {
                      const raw = ev.target.value;
                      patch(i, { value: raw === "" ? undefined : pct ? Number(raw) / 100 : Number(raw) });
                    }}
                  />
                </label>
              )}

              <p className="text-[11px] text-slate-400 sm:col-span-2">
                <span className="text-slate-500">Niv. 1 :</span> {describeTechEffect(shown, 1, n)}
                {tech.maxLevel > 1 && (
                  <>
                    {" "}
                    · <span className="text-slate-500">niv. {tech.maxLevel} :</span> {describeTechEffect(shown, tech.maxLevel, n)}
                  </>
                )}
                {CAPPED_TECH_EFFECTS.includes(e.type) && effectValuePerLevel(e) * tech.maxLevel > TECH_REDUCTION_CAP && (
                  <span className="text-gold-glow"> (plafonné à {TECH_REDUCTION_CAP * 100} % toutes technos confondues)</span>
                )}
              </p>
            </div>
            <div className="flex gap-1 sm:flex-col">
              <Button variant="ghost" size="icon" title="Monter" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Descendre" disabled={i === effects.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Retirer" onClick={() => save(effects.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-danger-glow" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" className="self-start" onClick={() => save([...effects, { type: "energy_efficiency" }])}>
        <Plus className="h-4 w-4" /> Ajouter un effet
      </Button>
    </div>
  );
}
