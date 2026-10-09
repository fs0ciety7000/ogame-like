import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { BUILD_TIME_RULES, findBuilding, getBuildingUpgradeTime, type BuildingDef } from "@/game/buildings";
import { RHYTHM_RULES } from "@/game/rhythm";
import { CheckboxField, formatSeconds, NumberField, Section } from "@/pages/admin/fields";
import { BeforeAfter } from "@/pages/admin/RewardsPreview";

/* =====================================================
   6.14.159 (RD-1, proposals/rythme-du-depart.md) : Admin → Règles →
   « Bâtiments : durée des premiers niveaux ». Courbe du départ (groupe
   `buildTime` du registre) avec un aperçu avant / après sur l'Extracteur de
   ferraille, avant et après la bascule du rythme. Les mêmes champs restent
   dans « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type T = typeof BUILD_TIME_RULES;

const timeRules = (r: R): T => ({ ...BUILD_TIME_RULES, ...((r as unknown as { buildTime?: Partial<T> }).buildTime ?? {}) });

/** Extracteur de ferraille avec le niveau 11 d'après la bascule du rythme (aperçu de la jonction). */
const afterSwitch = (b: BuildingDef): BuildingDef => (b.upgrade.tier2 ? { ...b, upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2, baseSeconds: RHYTHM_RULES.tier2BaseSeconds } } } : b);

export function BuildTimeRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const t = timeRules(rules);
  const set = (p: Partial<T>) => setRules((r) => ({ ...r, buildTime: { ...timeRules(r), ...p } }) as R);
  const ref = findBuilding("extracteur_ferraille");
  const rows = ref
    ? [
        ...[2, 5, 8, 10].map((lvl) => ({ label: `Niveau ${lvl}`, before: getBuildingUpgradeTime(ref, lvl), after: getBuildingUpgradeTime(ref, lvl, t), format: formatSeconds })),
        ...[9, 10].map((lvl) => ({ label: `Niveau ${lvl}, après la bascule du rythme`, before: getBuildingUpgradeTime(afterSwitch(ref), lvl), after: getBuildingUpgradeTime(afterSwitch(ref), lvl, t), format: formatSeconds })),
      ]
    : [];
  return (
    <Section title="Bâtiments : durée des premiers niveaux (6.14.159)">
      <CheckboxField label="Courbe du départ activée" checked={t.enabled !== false} hint="Décoché : (niveau − 1) × durée par niveau du bâtiment, comme avant la 6.14.159." onChange={(on) => set({ enabled: on })} />
      <NumberField label="Niveau 2 : durée par niveau divisée par" value={t.startDivisor} min={1} step={1} hint="30 : 20 s pour un extracteur (600 s par niveau), 6 min pour la Fonderie quantique. Le dernier niveau du premier palier garde sa durée." onChange={(v) => set({ startDivisor: Math.max(1, v ?? 30) })} />
      <NumberField label="Jonction : écart maximal entre deux niveaux avant le second palier" value={t.junctionMaxRatio} min={0} step={1} hint="4 : après la bascule, niveau 9 en 2 h 15 et niveau 10 en 9 h avant les 36 h du niveau 11. 0 = sans lissage." onChange={(v) => set({ junctionMaxRatio: Math.max(0, v ?? 4) })} />
      {ref && <BeforeAfter title="Extracteur de ferraille : durée d'un niveau" rows={rows} note="Avant les réductions (technos, officiers, Ascensions)." />}
    </Section>
  );
}
