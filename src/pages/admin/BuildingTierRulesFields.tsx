import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { BUILDING_TIER_RULES } from "@/game/buildingTiers";
import { NumberField, NumberListField, Section } from "@/pages/admin/fields";

/* =====================================================
   6.14.142 à 6.14.144 (PB-L1 à PB-L3, proposals/paliers-batiments.md) :
   Admin → Règles → « Bâtiments : paliers ». Niveaux des paliers (entrepôt,
   Atelier, Fonderie) et chiffres de chaque effet (groupe `buildingTiers` du
   registre). Les mêmes champs restent dans « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type T = typeof BUILDING_TIER_RULES;

const tierRules = (r: R): T => ({ ...BUILDING_TIER_RULES, ...((r as unknown as { buildingTiers?: Partial<T> }).buildingTiers ?? {}) });
const levels = (v: number[]) => v.map((n) => Math.max(1, Math.round(n)));
const pct = (x: number) => Math.round(x * 1000) / 10;

export function BuildingTierRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const t = tierRules(rules);
  const set = (p: Partial<T>) => setRules((r) => ({ ...r, buildingTiers: { ...tierRules(r), ...p } }) as R);
  return (
    <Section title="Bâtiments : paliers (6.14.142)">
      <NumberListField label="Entrepôt : niveaux des paliers" value={t.storageLevels} hint="4 niveaux croissants : choix, confort, spécialisation, signature." onChange={(v) => set({ storageLevels: levels(v) })} />
      <NumberListField label="Atelier : niveaux des paliers" value={t.repairLevels} hint="4 niveaux croissants. Le 1er s'affiche au niveau requis par la Cale sèche (Contenu → Bâtiments)." onChange={(v) => set({ repairLevels: levels(v) })} />
      <NumberListField label="Fonderie quantique : niveaux qui ouvrent un chantier de plus" value={t.foundrySlotLevels} hint="Niveaux croissants (5, 10 par défaut)." onChange={(v) => set({ foundrySlotLevels: levels(v) })} />
      <NumberField label="Délai entre deux changements d'un choix (h)" value={t.choiceCooldownHours} min={0} step={1} hint="Le premier choix est libre ; 0 = à volonté." onChange={(v) => set({ choiceCooldownHours: Math.max(0, v ?? 24) })} />
      <NumberField label="Entrepôt 5 : abri en plus, ressource prioritaire (h)" value={t.storagePriorityShelterHours} min={0} step={1} hint="Toujours sous la part de l'entrepôt à l'abri." onChange={(v) => set({ storagePriorityShelterHours: Math.max(0, v ?? 4) })} />
      <NumberField label="Entrepôt 10 : tampon (h de production)" value={t.storageBufferHours} min={0} step={0.5} hint="Au-delà de 2 h, le simulateur montre des sessions bloquées en plus (I29). 0 = pas de tampon." onChange={(v) => set({ storageBufferHours: Math.max(0, v ?? 2) })} />
      <NumberField label="Entrepôt 15, Négoce : taxe du comptoir en moins (points)" value={pct(t.storageTradeTaxCut)} min={0} step={0.5} hint="2 = 5 % → 3 %." onChange={(v) => set({ storageTradeTaxCut: Math.max(0, (v ?? 2) / 100) })} />
      <NumberField label="Entrepôt 15, Convoi : soute des flottes en plus (%)" value={pct(t.storageConvoyCargo)} min={0} step={1} onChange={(v) => set({ storageConvoyCargo: Math.max(0, (v ?? 10) / 100) })} />
      <NumberField label="Entrepôt 20 : abri en plus, 4 ressources (h)" value={t.storageOrbitalShelterHours} min={0} step={1} onChange={(v) => set({ storageOrbitalShelterHours: Math.max(0, v ?? 4) })} />
      <NumberField label="Atelier 10 : un lot rentre aussitôt sous (min de réparation)" value={Math.round(t.workshopInstantBelowSeconds / 60)} min={0} step={1} hint="0 = jamais." onChange={(v) => set({ workshopInstantBelowSeconds: Math.max(0, Math.round((v ?? 15) * 60)) })} />
      <NumberField label="Atelier 15 : classe choisie réparée plus vite (%)" value={pct(t.workshopClassSpeed)} min={0} step={5} onChange={(v) => set({ workshopClassSpeed: Math.max(0, (v ?? 50) / 100) })} />
      <NumberField label="Atelier 20 : accélérations gratuites par jour" value={t.workshopFreeRushPerDay} min={0} step={1} onChange={(v) => set({ workshopFreeRushPerDay: Math.max(0, Math.round(v ?? 1)) })} />
      <NumberField label="Atelier 20 : réparation offerte par accélération (min)" value={Math.round(t.workshopFreeRushSeconds / 60)} min={0} step={15} hint="120 = 2 h." onChange={(v) => set({ workshopFreeRushSeconds: Math.max(0, Math.round((v ?? 120) * 60)) })} />
      <NumberListField label="Hangar d'attaque : niveaux des paliers" value={t.hangarAttackLevels} hint="4 niveaux croissants : baies modulaires, file d'attente, spécialisation, signature (6.14.145)." onChange={(v) => set({ hangarAttackLevels: levels(v) })} />
      <NumberListField label="Hangar de défense : niveaux des paliers" value={t.hangarDefenseLevels} hint="4 niveaux croissants : baies modulaires, file d'attente, spécialisation, signature." onChange={(v) => set({ hangarDefenseLevels: levels(v) })} />
      <NumberField label="Hangars 5, baies modulaires : places prêtées à l'autre hangar (%)" value={pct(t.hangarLendShare)} min={0} step={1} hint="Un prêt ou sa reprise qui créerait une surcharge est refusé." onChange={(v) => set({ hangarLendShare: Math.min(0.5, Math.max(0, (v ?? 10) / 100)) })} />
      <NumberField label="Hangars 10 : commandes en attente d'une place, au plus" value={t.hangarWaitingQueueMax} min={0} step={1} hint="Par hangar. 0 = pas de file d'attente." onChange={(v) => set({ hangarWaitingQueueMax: Math.max(0, Math.round(v ?? 5)) })} />
      <NumberField label="Hangars 15, Pont d'envol / Tourelles en série : temps de construction en moins (%)" value={pct(t.hangarSpecUnitTime)} min={0} step={1} onChange={(v) => set({ hangarSpecUnitTime: Math.min(0.5, Math.max(0, (v ?? 10) / 100)) })} />
      <NumberField label="Hangar d'attaque 15, Réacteurs : temps de vol en moins (%)" value={pct(t.hangarSpecFleetSpeed)} min={0} step={1} onChange={(v) => set({ hangarSpecFleetSpeed: Math.min(0.5, Math.max(0, (v ?? 5) / 100)) })} hint="Plafond de la couche empire (50 %) : au-delà de 6 %, le maximum théorique le dépasse." />
      <NumberField label="Hangar de défense 15, Entretien réduit : entretien des défenses en moins (%)" value={pct(t.hangarSpecUpkeep)} min={0} step={1} onChange={(v) => set({ hangarSpecUpkeep: Math.min(0.5, Math.max(0, (v ?? 20) / 100)) })} />
      <NumberField label="Hangar d'attaque 20, Pont de lancement : emplacements de flotte en plus" value={t.hangarFleetSlots} min={0} step={1} onChange={(v) => set({ hangarFleetSlots: Math.max(0, Math.round(v ?? 1)) })} />
      <NumberField label="Hangar de défense 20, Casemates : défenses reconstruites en plus (points)" value={pct(t.hangarDefenseRebuildBonus)} min={0} step={1} hint="10 = 60 % → 70 % (mesure JcJ : fiche 6.14.145)." onChange={(v) => set({ hangarDefenseRebuildBonus: Math.min(0.4, Math.max(0, (v ?? 10) / 100)) })} />
    </Section>
  );
}
