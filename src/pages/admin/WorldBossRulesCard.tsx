import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent, validateRules, type GameRules } from "@/game/content";
import { worldBossForStart } from "@/game/leviathan";
import { WORLD_BOSS_RULES } from "@/game/worldBosses";
import { saveContentSection, useContentStore } from "@/services/contentService";
import { BossScheduleFields } from "@/pages/admin/bossFields";
import { offerApplyDuration } from "@/pages/admin/applyBossDuration";
import { adminLeviathan, useLeviathanStore } from "@/services/leviathanService";
import { NumberField, Section } from "@/pages/admin/fields";

/* 5.15 : réglages communs aux boss mondiaux (calendrier, combat,
   récompenses), sortis de l'onglet Règles vers l'onglet Boss. */

export function WorldBossRulesCard() {
  useContentStore((s) => s.version);
  const [rules, setRules] = useState<GameRules>(() => structuredClone(currentGameContent().rules));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const update = (fn: (r: GameRules) => GameRules) => {
    setRules(fn);
    setDirty(true);
  };
  // v5.10.4 : les deux boss mensuels le même week-end se chevauchent.
  const bossClash =
    rules.events.bossWeekly === false && rules.events.bossMonthly !== false && rules.seasonBoss.enabled && (rules.events.bossWeekend ?? "first") === rules.seasonBoss.weekend
      ? "⚠️ Le boss mondial et le boss de saison tombent le même week-end : ils seront là en même temps."
      : undefined;
  const errors = useMemo(() => validateRules(rules).filter((e) => /Léviathan|boss mondia/i.test(e)), [rules]);
  const save = async () => {
    if (errors.length) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      const oldHours = currentGameContent().rules.leviathan.durationHours;
      await saveContentSection("rules", rules);
      setDirty(false);
      toast.success("Réglages des boss mondiaux enregistrés.");
      await offerApplyDuration({ state: useLeviathanStore.getState().state, oldHours, newHours: rules.leviathan.durationHours, name: "Le boss mondial", reschedule: (endMs) => adminLeviathan("reschedule", undefined, endMs) });
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title text-sm text-slate-100">Réglages communs</h2>
        {dirty && (
          <HudChip size="sm" tone="ember">
            Modifications non enregistrées
          </HudChip>
        )}
        <Button size="sm" className="ml-auto" disabled={busy || !dirty} onClick={() => void save()}>
          <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
        </Button>
      </div>
      {errors.length > 0 && <HudCallout tone="danger" className="text-xs">{errors.join(" ")}</HudCallout>}
        <Section title="Calendrier, combat et récompenses (communs aux boss mondiaux)">
          <BossScheduleFields
            label="Boss mondiaux"
            value={{
              enabled: rules.events.bossWeekly !== false || rules.events.bossMonthly !== false,
              weekend: rules.events.bossWeekend ?? "first",
              startHour: rules.leviathan.startHour ?? 18,
              durationHours: rules.leviathan.durationHours,
              dates: rules.events.bossDates ?? [],
              ...(rules.events.bossWeekly !== false ? { weekly: { minGapDays: Math.min(6, Math.max(WORLD_BOSS_RULES.minGapDays, Math.ceil(rules.leviathan.durationHours / 24))) } } : {}),
            }}
            weekly={{ on: rules.events.bossWeekly !== false, onChange: (v) => update((r) => ({ ...r, events: { ...r.events, bossWeekly: v } })) }}
            nameFor={(ms) => worldBossForStart(ms).name}
            onChange={(p) =>
              update((r) => ({
                ...r,
                events: { ...r.events, ...(p.enabled !== undefined ? { bossMonthly: p.enabled } : {}), ...(p.weekend ? { bossWeekend: p.weekend } : {}), ...(p.dates ? { bossDates: p.dates } : {}) },
                leviathan: { ...r.leviathan, ...(p.startHour !== undefined ? { startHour: p.startHour } : {}), ...(p.durationHours !== undefined ? { durationHours: p.durationHours } : {}) },
              }))
            }
            clash={bossClash}
          />
          <NumberField
            label="Structure : facteur × puissance d'attaque des actifs (× celui de chaque boss)"
            value={rules.leviathan.hpFactor}
            step={0.5}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, hpFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Structure minimale"
            value={rules.leviathan.minHp}
            step={100000}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, minHp: v ?? 0 } }))}
          />
          <NumberField
            label="Délai entre deux assauts d'un joueur (h)"
            value={rules.leviathan.cooldownHours}
            step={0.5}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, cooldownHours: v ?? 0 } }))}
          />
          <NumberField
            label="Trajet aller (min)"
            value={rules.leviathan.flightMinutes}
            step={5}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, flightMinutes: v ?? 0 } }))}
          />
          <NumberField
            label="Pertes par assaut (0,08 = 8 %)"
            value={rules.leviathan.lossPct}
            step={0.01}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, lossPct: v ?? 0 } }))}
          />
          <NumberField
            label="Récompense de base (heures de production)"
            value={rules.leviathan.baseRewardHours}
            step={0.5}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, baseRewardHours: v ?? 0 } }))}
          />
          <NumberField
            label="Bonus max selon les dégâts (heures)"
            value={rules.leviathan.bonusRewardHours}
            step={0.5}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, bonusRewardHours: v ?? 0 } }))}
          />
          <NumberField
            label="Récompenses s'il survit (0,5 = moitié)"
            value={rules.leviathan.failedRewardFactor}
            step={0.1}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, failedRewardFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Durée du titre (jours)"
            value={rules.leviathan.titleDays}
            step={1}
            onChange={(v) => update((r) => ({ ...r, leviathan: { ...r.leviathan, titleDays: v ?? 0 } }))}
          />
        </Section>
    </Card>
  );
}
