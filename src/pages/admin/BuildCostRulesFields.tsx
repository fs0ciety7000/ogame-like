import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { BUILD_COST_RULES, findBuilding, getBuildingUpgradeCost, productionPerSecond } from "@/game/buildings";
import { formatDecimal, formatInt } from "@/game/format";
import { CheckboxField, NumberField, Section } from "@/pages/admin/fields";
import { BeforeAfter } from "@/pages/admin/RewardsPreview";

/* =====================================================
   6.14.167 (S9, proposals/rythme-du-premier-jour.md) : Admin → Règles →
   « Bâtiments : coût des niveaux 5 à 10 ». Pente adoucie des coûts du premier
   palier (groupe `buildCost` du registre) avec un aperçu avant / après sur
   l'Extracteur de ferraille : coût en ferraille et attente (ferraille des
   4 extracteurs ÷ production du niveau d'avant). Les mêmes champs restent dans
   « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type C = typeof BUILD_COST_RULES;

const costRules = (r: R): C => ({ ...BUILD_COST_RULES, ...((r as unknown as { buildCost?: Partial<C> }).buildCost ?? {}) });

export function BuildCostRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const c = costRules(rules);
  const set = (p: Partial<C>) => setRules((r) => ({ ...r, buildCost: { ...costRules(r), ...p } }) as R);
  const ref = findBuilding("extracteur_ferraille");
  const scrap = (lvl: number, rr?: C) => (ref ? getBuildingUpgradeCost(ref, lvl, rr).scrap ?? 0 : 0);
  const wait = (lvl: number, rr?: C) => (4 * scrap(lvl, rr)) / Math.max(1, productionPerSecond("extracteur_ferraille", lvl - 1)) / 3600;
  const rows = ref
    ? [
        ...[5, 6, 8, 10].map((lvl) => ({ label: `Niveau ${lvl} (ferraille)`, before: scrap(lvl), after: scrap(lvl, c), format: (n: number) => formatInt(n) })),
        ...[8, 10].map((lvl) => ({ label: `Attente du niveau ${lvl} (h)`, before: wait(lvl), after: wait(lvl, c), format: (n: number) => formatDecimal(n, 1) })),
      ]
    : [];
  return (
    <Section title="Bâtiments : coût des niveaux 5 à 10 (6.14.167)">
      <CheckboxField label="Pente adoucie des coûts activée" checked={c.enabled !== false} hint="Décoché : ×3,33 par niveau pour un extracteur, comme avant la 6.14.167." onChange={(on) => set({ enabled: on })} />
      <NumberField label="Adoucie à partir du niveau" value={c.fromLevel} min={2} step={1} hint="5 : les niveaux 2 à 4 gardent leur coût, le niveau 4 sert d'ancre." onChange={(v) => set({ fromLevel: Math.max(2, Math.round(v ?? 5)) })} />
      <NumberField label="Croissance maximale du coût par niveau" value={c.maxGrowth} min={1} step={0.1} hint="2,5 : niveau 8 à 72 000 ferraille au lieu de 225 800. La production monte de ×1,8 par niveau." onChange={(v) => set({ maxGrowth: Math.max(1, v ?? 2.5) })} />
      <NumberField label="Jonction : écart maximal avec le dernier niveau du premier palier" value={c.junctionMaxRatio} min={0} step={0.5} hint="0 = sans jonction. 4 : niveau 10 au coût d'avant, niveau 9 au quart, etc. (jamais plus cher qu'avant)." onChange={(v) => set({ junctionMaxRatio: Math.max(0, v ?? 0) })} />
      <CheckboxField label="Seulement les bâtiments de production" checked={c.productionOnly !== false} hint="Décoché : hangars, Atelier, Cale sèche et entrepôt suivent aussi la pente (s'ils montent plus vite)." onChange={(on) => set({ productionOnly: on })} />
      {ref && <BeforeAfter title="Extracteur de ferraille : coût et attente" rows={rows} note="Attente : ferraille des 4 extracteurs ÷ production de ferraille du niveau d'avant, sans bonus. Le second palier (niveau 11 et plus) ne change pas." />}
    </Section>
  );
}
