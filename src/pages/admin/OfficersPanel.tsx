import { useState } from "react";
import { toast } from "sonner";
import { Medal, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent } from "@/game/content";
import { COMMANDER_ROLES, COMMANDER_RULES, COMMANDER_SOURCES, COMMANDERS, defaultRoleEffects, RARE_OFFICER_RULES, validateOfficers, type CommanderId, type OfficersConfig } from "@/game/commanders";
import { describeEffect, EFFECT_STATS, formatEffectValue } from "@/game/effects";
import { ComposedEffectFields } from "@/pages/admin/ComposedEffectFields";
import { SEASON_CATALOG, THEME_PRIMARY } from "@/game/seasonCatalog";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { NumberField, Section } from "@/pages/admin/fields";
import { Input } from "@/components/ui/input";

/* v5.14 : réglages des officiers — noms, effets par niveau des douze rôles,
   recrutement, et chances de trouver un officier rare sur un boss. */

export function OfficersPanel() {
  const customized = useContentStore((s) => s.customized.includes("officers"));
  useContentStore((s) => s.version);
  const [cfg, setCfg] = useState<OfficersConfig>(() => structuredClone(currentGameContent().officers ?? {}));
  const [busy, setBusy] = useState(false);
  const errors = validateOfficers(cfg);

  const role = (id: CommanderId) => cfg.roles?.[id] ?? {};
  const setRole = (id: CommanderId, patch: NonNullable<OfficersConfig["roles"]>[CommanderId]) => setCfg((c) => ({ ...c, roles: { ...(c.roles ?? {}), [id]: { ...(c.roles?.[id] ?? {}), ...patch } } }));
  const setRule = (k: keyof NonNullable<OfficersConfig["rules"]>, v: number | undefined) => setCfg((c) => ({ ...c, rules: { ...(c.rules ?? {}), [k]: v } }));
  const setDrop = (k: "participant" | "podium", v: number | undefined) => setCfg((c) => ({ ...c, rareDrop: { ...(c.rareDrop ?? {}), [k]: v } }));

  const save = async () => {
    if (errors.length) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      await saveContentSection("officers", cfg);
      toast.success("Officiers enregistrés (appliqués aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Medal className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm text-slate-100">Officiers</h2>
        <HudChip size="sm" tone={customized ? "ember" : "neutral"}>
          {customized ? "Personnalisé" : "Valeurs du code"}
        </HudChip>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("officers");
              setCfg(structuredClone(currentGameContent().officers ?? {}));
              toast.success("Réglages du code restaurés.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Les effets par niveau se répercutent partout (circuit d'effets) : fiche de l'officier, commandants de saison du même rôle, onglet Effets des joueurs, rapport d'impact. Les officiers rares ne se recrutent pas : commandant de saison au dernier palier d'un passe, ou trouvaille sur un boss.
      </p>
      {errors.length > 0 && <HudCallout tone="danger" className="text-xs">{errors.join(" ")}</HudCallout>}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {COMMANDER_ROLES.map((id) => {
          const def = COMMANDERS.find((c) => c.id === id)!;
          const o = role(id);
          const effects = defaultRoleEffects(id);
          const seasons = SEASON_CATALOG.filter((e) => THEME_PRIMARY[e.theme] === id || e.commander.secondary === id).length;
          return (
            <div key={id} className="hud-cut-sm flex flex-col gap-2 border border-white/10 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <HudChip size="sm" tone={def.rare ? "violet" : "accent"}>
                  {def.rare ? "Rare" : "Recrutable"}
                </HudChip>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{id} · dans {seasons} saison{seasons > 1 ? "s" : ""} du catalogue</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input value={o.title ?? ""} placeholder={def.title} aria-label="Titre" onChange={(e) => setRole(id, { title: e.target.value || undefined })} />
                <Input value={o.name ?? ""} placeholder={def.name} aria-label="Nom" onChange={(e) => setRole(id, { name: e.target.value || undefined })} />
              </div>
              {effects.map((e, i) => {
                const v = o.perLevel?.[i];
                const current = v ?? e.perLevel;
                return (
                  <div key={e.stat} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-2">
                    <span className="text-xs text-slate-300">
                      {EFFECT_STATS[e.stat].label}
                      {e.scope === "colonies" ? " (colonies)" : ""} · par niveau
                      <span className="ml-1 text-slate-500">
                        (niv. {COMMANDER_RULES.maxLevel} : {formatEffectValue(e.stat, current * COMMANDER_RULES.maxLevel)})
                      </span>
                    </span>
                    <input
                      type="number"
                      step={0.001}
                      min={0}
                      value={current}
                      onChange={(ev) => {
                        const list = effects.map((x, j) => o.perLevel?.[j] ?? x.perLevel);
                        list[i] = Number(ev.target.value);
                        setRole(id, { perLevel: list });
                      }}
                      className="h-8 w-full border border-white/10 bg-black/30 px-2 text-sm tabular-nums text-slate-100"
                    />
                  </div>
                );
              })}
              {(o.extra ?? []).map((e, i) => (
                <div key={`x${i}`} className="hud-cut-sm grid grid-cols-1 gap-2 border border-cyan-glow/15 bg-black/25 p-2 sm:grid-cols-2">
                  <ComposedEffectFields value={e} onChange={(c) => setRole(id, { extra: (o.extra ?? []).map((x, j) => (j === i ? { ...c, perLevel: x.perLevel } : x)) })} onPreset={(p) => setRole(id, { extra: (o.extra ?? []).map((x, j) => (j === i ? { ...p.effect, perLevel: p.suggest.officer } : x)) })} />
                  <NumberField label="Valeur par niveau" value={e.perLevel} min={0} step={0.001} onChange={(v) => setRole(id, { extra: (o.extra ?? []).map((x, j) => (j === i ? { ...x, perLevel: v ?? 0 } : x)) })} hint={`Niv. ${COMMANDER_RULES.maxLevel} : ${describeEffect(e.stat, e.perLevel * COMMANDER_RULES.maxLevel, e.target, e.scope)}`} />
                  <Button size="sm" variant="ghost" className="self-start" onClick={() => setRole(id, { extra: (o.extra ?? []).filter((_, j) => j !== i) })}>
                    <Trash2 className="mr-1 h-3.5 w-3.5 text-danger-glow" /> Retirer cet effet
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" className="self-start" onClick={() => setRole(id, { extra: [...(o.extra ?? []), { stat: "unitAttack", perLevel: 0.005 }] })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un effet composé
              </Button>
              <p className="text-[11px] text-slate-500">Progresse avec : {COMMANDER_SOURCES[id].map((s) => `${s.label} (+${s.xp})`).join(", ")}.</p>
            </div>
          );
        })}
      </div>

      <Section title="Recrutement et postes">
        <NumberField label="Postes (un de plus au rang Platine)" value={cfg.rules?.slots ?? COMMANDER_RULES.slots} min={1} step={1} onChange={(v) => setRule("slots", v)} />
        <NumberField label="Recrutement : Ambre" value={cfg.rules?.recruitAmber ?? COMMANDER_RULES.recruitAmber} min={0} step={10} onChange={(v) => setRule("recruitAmber", v)} />
        <NumberField label="Recrutement : heures de production" value={cfg.rules?.recruitProductionHours ?? COMMANDER_RULES.recruitProductionHours} min={0} step={1} onChange={(v) => setRule("recruitProductionHours", v)} />
        <NumberField label="Délai entre deux changements de poste (h)" value={cfg.rules?.swapCooldownHours ?? COMMANDER_RULES.swapCooldownHours} min={0} step={1} onChange={(v) => setRule("swapCooldownHours", v)} />
        <NumberField label="XP d'un Dossier d'entraînement" value={cfg.rules?.dossierXp ?? COMMANDER_RULES.dossierXp} min={1} step={10} onChange={(v) => setRule("dossierXp", v)} />
        <NumberField label="Espionne : chance d'anomalie chimique par niveau" value={cfg.rules?.anomalyPerLevel ?? COMMANDER_RULES.anomalyPerLevel} min={0} step={0.005} onChange={(v) => setRule("anomalyPerLevel", v)} />
      </Section>
      <Section title="Officiers rares trouvés sur un boss abattu">
        <NumberField label="Chance par participant (0,002 = 0,2 %)" value={cfg.rareDrop?.participant ?? RARE_OFFICER_RULES.participant} min={0} step={0.001} onChange={(v) => setDrop("participant", v)} />
        <NumberField label="Chance sur le podium (0,005 = 0,5 %)" value={cfg.rareDrop?.podium ?? RARE_OFFICER_RULES.podium} min={0} step={0.001} onChange={(v) => setDrop("podium", v)} />
      </Section>
    </Card>
  );
}
