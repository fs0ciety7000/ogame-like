import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Boxes, EyeOff, Gavel, Hammer, Package, Recycle, Rocket, Shield, Swords, X } from "lucide-react";
import { EmptyAction, HudPanel } from "@/components/ui/panel";
import { EmptyState, HUD_TONE, HudChip, HudTag } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { ResourceIcon } from "@/components/ui/game-icon";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { GameActionError } from "@/game/errors";
import {
  describeModule,
  findModuleTemplate,
  MODULE_BUILD_COST,
  MODULE_CLASSES,
  MODULE_FAMILIES,
  MODULE_RARITIES,
  MODULE_RULES,
  moduleRarity,
  modulesState,
  mountedOn,
  type ModuleFamily,
  type ModuleItem,
} from "@/game/modules";
import { canAffordAll } from "@/game/resources";
import { UNIT_CLASS_LABELS, type UnitClass } from "@/game/unitClasses";
import { buildShipModule, mountShipModule, recycleShipModule, unmountShipModule } from "@/services/playerService";
import { cn, formatCompact } from "@/lib/utils";
import type { PlayerState, ResourceId, Resources } from "@/types/game";

/* 5.26 : modules de vaisseaux (État-major). Plans tombés au combat →
   fabrication → montage sur une classe (deux emplacements par classe). */

const FAMILY_ICONS: Record<ModuleFamily, typeof Swords> = { armement: Swords, blindage: Shield, soute: Package, propulsion: Rocket, voile: EyeOff };

function ModuleIcon({ item, className }: { item: Pick<ModuleItem, "template" | "rarity">; className?: string }) {
  const t = findModuleTemplate(item.template);
  const Icon = t ? FAMILY_ICONS[t.family] : Boxes;
  const color = HUD_TONE[moduleRarity(item.rarity).tone];
  return (
    <span className={cn("hud-cut-sm grid shrink-0 place-items-center border", className)} style={{ borderColor: `color-mix(in srgb, ${color} 50%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      <Icon className="h-1/2 w-1/2" style={{ color }} aria-hidden />
    </span>
  );
}

function errorText(err: unknown) {
  return err instanceof GameActionError ? err.message : "Action impossible.";
}

export function ModulesTab({ player }: { player: PlayerState }) {
  const st = modulesState(player);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<{ cls: UnitClass; slot: number }>({ cls: "light", slot: 0 });

  const act = async (task: () => Promise<unknown>, msg: (out: unknown) => string) => {
    setBusy(true);
    try {
      toast.success(msg(await task()));
    } catch (err) {
      toast.error(errorText(err));
    }
    setBusy(false);
  };

  const order = (m: ModuleItem) => MODULE_RARITIES.findIndex((r) => r.id === m.rarity);
  const sorted = [...st.items].sort((a, b) => Number(b.built) - Number(a.built) || order(b) - order(a) || a.template.localeCompare(b.template));
  const plans = st.items.filter((m) => !m.built).length;

  const recycle = async (item: ModuleItem) => {
    const amber = moduleRarity(item.rarity).recycleAmber * (item.built ? 2 : 1);
    const ok = await askConfirm({ title: `Recycler ${findModuleTemplate(item.template)?.name} ?`, message: `Le ${item.built ? "module" : "plan"} disparaît contre ${amber} Ambre.`, confirmLabel: "Recycler", tone: "danger" });
    if (ok) void act(() => recycleShipModule(item.id), (out) => `Recyclé : +${(out as { amber: number }).amber} Ambre.`);
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <HudPanel icon={<Boxes />} title="Emplacements par classe" tone="mint" aside={<span className="font-mono text-xs text-slate-500">{MODULE_RULES.slotsPerClass} par classe</span>}>
        <p className="text-xs text-slate-400">Choisis un emplacement, puis « Monter » sur un module fabriqué. Armement et blindage vont sur Faible, Moyen ou Fort ; soute, propulsion et voile sur le Soutien.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULE_CLASSES.map((cls) => (
            <div key={cls} className="flex flex-col gap-1.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Classe {UNIT_CLASS_LABELS[cls]}</p>
              {st.slots[cls].map((id, i) => {
                const item = id ? st.items.find((m) => m.id === id) : undefined;
                const active = sel.cls === cls && sel.slot === i;
                return (
                  <div key={i} className={cn("hud-cut-sm flex items-center gap-2 border p-2 transition-colors", active ? "border-cyan-glow/70 bg-cyan-glow/10" : "border-white/10 bg-white/[0.02] hover:border-cyan-glow/40")}>
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSel({ cls, slot: i })} aria-pressed={active}>
                      {item ? (
                        <>
                          <ModuleIcon item={item} className="h-8 w-8" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-100">{findModuleTemplate(item.template)?.name}</span>
                            <span className="block truncate text-[11px]" style={{ color: HUD_TONE[moduleRarity(item.rarity).tone] }}>
                              {describeModule(item)}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">Emplacement {i + 1} libre</span>
                      )}
                    </button>
                    {item && (
                      <button type="button" className="text-slate-500 hover:text-danger-glow" disabled={busy} aria-label="Démonter" title="Démonter" onClick={() => void act(() => unmountShipModule(cls, i), () => "Module démonté.")}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </HudPanel>

      <HudPanel icon={<Hammer />} title="Atelier des modules" className="gap-2" aside={<span className="font-mono text-xs text-slate-500">{st.items.length} / {MODULE_RULES.maxItems}</span>}>
        <p className="text-xs text-slate-500">
          Les plans tombent au combat (boss, seigneurs, menaces, expéditions, joueurs). {plans > 0 && <>Un plan non fabriqué se vend à l'Hôtel des enchères.</>}
        </p>
        {sorted.length === 0 && (
          <EmptyState icon="🧩" title="Aucun plan de module" action={<EmptyAction to="/game/uber">Affronter le boss mondial</EmptyAction>} className="p-0">
            Les boss donnent les meilleurs plans (rare au minimum) ; seigneurs, menaces, expéditions et attaques gagnées en laissent parfois.
          </EmptyState>
        )}
        <div className="flex flex-col gap-2">
          {sorted.map((item) => {
            const t = findModuleTemplate(item.template)!;
            const fam = MODULE_FAMILIES[t.family];
            const r = moduleRarity(item.rarity);
            const where = mountedOn(st, item.id);
            const cost = MODULE_BUILD_COST[item.rarity];
            const affordable = canAffordAll(player.resources, cost as Partial<Resources>);
            const fits = fam.classes.includes(sel.cls);
            return (
              <div key={item.id} className="flex flex-wrap items-center gap-3 border border-white/5 bg-white/[0.02] p-2">
                <ModuleIcon item={item} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-100">
                    {t.name}
                    <HudChip size="sm" tone={r.tone}>
                      {r.label}
                    </HudChip>
                    {!item.built && (
                      <HudChip size="sm" tone="neutral">
                        Plan
                      </HudChip>
                    )}
                  </p>
                  <p className="text-xs text-slate-300">
                    {fam.label} · {describeModule(item)}
                  </p>
                  {!item.built ? (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {(Object.entries(cost) as [ResourceId, number][]).map(([res, n]) => (
                        <span key={res} className={cn("inline-flex items-center gap-1 font-mono text-xs", (player.resources[res] ?? 0) >= n ? "text-slate-300" : "text-danger-glow")}>
                          <ResourceIcon id={res} className="h-3.5 w-3.5" />
                          {formatCompact(n)}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="truncate text-[11px] italic text-slate-500">{t.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  {!item.built ? (
                    <Button size="sm" variant="secondary" disabled={busy || !affordable} onClick={() => void act(() => buildShipModule(item.id), () => `${t.name} fabriqué.`)}>
                      <Hammer className="h-3.5 w-3.5" /> Fabriquer
                    </Button>
                  ) : where ? (
                    <HudTag tone="mint">Sur {UNIT_CLASS_LABELS[where]}</HudTag>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || !fits}
                      title={fits ? undefined : `${fam.label} : pas sur la classe ${UNIT_CLASS_LABELS[sel.cls]}`}
                      onClick={() => void act(() => mountShipModule(item.id, sel.cls, sel.slot), () => `${t.name} monté sur ${UNIT_CLASS_LABELS[sel.cls]}.`)}
                    >
                      {fits ? `Monter (${UNIT_CLASS_LABELS[sel.cls]} ${sel.slot + 1})` : fam.classes.length === 1 ? "Soutien seulement" : "Pas sur le Soutien"}
                    </Button>
                  )}
                  {!item.built && (
                    <Button size="sm" variant="ghost" asChild title="Mettre aux enchères">
                      <Link to="/game/commerce?onglet=encheres">
                        <Gavel className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} title={`Recycler contre ${r.recycleAmber * (item.built ? 2 : 1)} Ambre`} onClick={() => void recycle(item)}>
                    <Recycle className="h-3.5 w-3.5" /> <span className="font-mono">{r.recycleAmber * (item.built ? 2 : 1)}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </HudPanel>
    </div>
  );
}
