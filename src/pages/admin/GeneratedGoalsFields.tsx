import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { ACHIEVEMENT_GEN_RULES, ACHIEVEMENT_GEN_RULES_META } from "@/game/procedural";
import { ACHIEVEMENT_PACE_RULES, ACHIEVEMENT_PACE_RULES_META, METRICS, type AchievementMetric } from "@/game/achievements";
import { CONTRACT_RULES, CONTRACT_RULES_META, type ContractType } from "@/game/contracts";
import { CheckboxField, NumberField, Section } from "@/pages/admin/fields";

/* =====================================================
   6.14.108 et 6.14.109 (AU27, lots AP-L4 et AP-L5) : réglages des
   objectifs générés.
   - Succès : paliers générés bridés (`achievementGen`) ;
   - Objectifs du jour : poids de tirage, quantités, « Dépenser »,
     raids de faction (`dailyContracts`) ;
   - 6.14.117 (É30-6) : rythme des succès (`achievementPace`), facteur du
     seuil en jeu par mesure de volume.
   Les mêmes champs restent dans « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const TYPES: ContractType[] = ["upgrade_building", "research", "build_units", "win_attack", "win_defense", "missions", "gift", "spend", "spy", "market", "gate_jump", "colony_convoy"];
const groupOf = (r: R, group: string): Obj => ((r as unknown as Obj)[group] ?? {}) as Obj;
/** Libellé court d'un type (admin). */
const TYPE_LABELS: Record<ContractType, string> = {
  upgrade_building: "Améliorer un bâtiment",
  research: "Lancer une recherche",
  build_units: "Construire des unités",
  win_attack: "Gagner une attaque",
  win_defense: "Repousser une attaque",
  missions: "Terminer des missions",
  gift: "Envoyer un don",
  spend: "Dépenser des ressources",
  spy: "Lancer des sondes",
  market: "Acheter au marché",
  // 6.14.119 (AP-L7) : proposés seulement au joueur qui peut les faire (porte ouverte, route de colonie).
  gate_jump: "Porte de saut (joueur à porte ouverte)",
  colony_convoy: "Convoi de colonie (joueur avec une route)",
};
const typeLabel = (t: ContractType) => TYPE_LABELS[t];

export function GeneratedGoalsFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const gen = { ...ACHIEVEMENT_GEN_RULES, ...groupOf(rules, "achievementGen") } as typeof ACHIEVEMENT_GEN_RULES;
  const dc = groupOf(rules, "dailyContracts");
  const weights = { ...CONTRACT_RULES.weights, ...((dc.weights ?? {}) as Obj) } as Record<ContractType, number>;
  const targets = { ...CONTRACT_RULES.targets, ...((dc.targets ?? {}) as Obj) } as Partial<Record<ContractType, number>>;
  const total = TYPES.reduce((a, t) => a + Math.max(0, Number(weights[t]) || 0), 0);
  const setGen = (k: keyof typeof ACHIEVEMENT_GEN_RULES, v: number | boolean) => setRules((r) => ({ ...r, achievementGen: { ...groupOf(r, "achievementGen"), [k]: v } }) as R);
  const setDc = (patch: Obj) => setRules((r) => ({ ...r, dailyContracts: { ...groupOf(r, "dailyContracts"), ...patch } }) as R);
  const setMap = (key: "weights" | "targets", t: ContractType, v: number) =>
    setRules((r) => {
      const g = groupOf(r, "dailyContracts");
      return { ...r, dailyContracts: { ...g, [key]: { ...((g[key] ?? {}) as Obj), [t]: v } } } as R;
    });
  const num = (k: keyof typeof ACHIEVEMENT_GEN_RULES_META, step: number, round = false) => {
    const m = ACHIEVEMENT_GEN_RULES_META[k] as { label: string; min?: number; hint?: string };
    return (
      <NumberField key={k} label={m.label} value={gen[k] as number} min={m.min} step={step} hint={m.hint} onChange={(v) => setGen(k, round ? Math.round(v ?? 0) : (v ?? 0))} />
    );
  };

  const pace = { ...ACHIEVEMENT_PACE_RULES, ...groupOf(rules, "achievementPace") } as typeof ACHIEVEMENT_PACE_RULES;
  const scales = { ...ACHIEVEMENT_PACE_RULES.scales, ...((groupOf(rules, "achievementPace").scales ?? {}) as Obj) } as Record<string, number>;
  const setPace = (patch: Obj) => setRules((r) => ({ ...r, achievementPace: { ...groupOf(r, "achievementPace"), ...patch } }) as R);
  const setScale = (m: string, v: number) =>
    setRules((r) => {
      const g = groupOf(r, "achievementPace");
      return { ...r, achievementPace: { ...g, scales: { ...((g.scales ?? {}) as Obj), [m]: v } } } as R;
    });

  return (
    <>
      <Section title="Succès : rythme des succès de volume (6.14.117)">
        <p className="text-sm text-slate-400 sm:col-span-2">
          Seuil en jeu = seuil écrit × facteur de la mesure. Un succès déjà gagné reste gagné ; le texte du succès suit le seuil en jeu. 1 = seuil écrit.
        </p>
        <CheckboxField label={ACHIEVEMENT_PACE_RULES_META.enabled.label} checked={pace.enabled} hint={ACHIEVEMENT_PACE_RULES_META.enabled.hint} onChange={(v) => setPace({ enabled: v })} />
        <CheckboxField label={ACHIEVEMENT_PACE_RULES_META.keepBronze.label} checked={pace.keepBronze} hint={ACHIEVEMENT_PACE_RULES_META.keepBronze.hint} onChange={(v) => setPace({ keepBronze: v })} />
        {Object.keys(scales).map((m) => (
          <NumberField
            key={`pace-${m}`}
            label={`Facteur : ${METRICS[m as AchievementMetric]?.label ?? m}`}
            value={scales[m]}
            min={1}
            step={1}
            onChange={(v) => setScale(m, Math.min(1000, Math.max(1, v ?? 1)))}
          />
        ))}
      </Section>
      <Section title="Succès générés : rythme et plafond (6.14.108)">
        <p className="text-sm text-slate-400 sm:col-span-2">
          Un palier plus dur n'arrive que si assez de joueurs actifs tiennent le dernier. Les paliers déjà créés restent, même au-delà du plafond.
        </p>
        {num("minHolders", 1, true)}
        {num("minHoldersShare", 0.05)}
        {num("activeDays", 1, true)}
        {num("cooldownDays", 1, true)}
        {num("maxAutoPerFamily", 1, true)}
        <CheckboxField label={ACHIEVEMENT_GEN_RULES_META.titleOnLastOnly.label} checked={gen.titleOnLastOnly} hint={ACHIEVEMENT_GEN_RULES_META.titleOnLastOnly.hint} onChange={(v) => setGen("titleOnLastOnly", v)} />
        {num("growthSmall", 0.5)}
        {num("smallBelow", 1, true)}
        {num("growth", 0.5)}
        {num("growthLarge", 0.1)}
        {num("largeFrom", 10, true)}
      </Section>
      <Section title="Objectifs du jour : tirage et quantités (6.14.109)">
        <p className="text-sm text-slate-400 sm:col-span-2">{CONTRACT_RULES_META.weights.hint}</p>
        {TYPES.map((t) => {
          const share = total > 0 ? Math.round((Math.max(0, Number(weights[t]) || 0) / total) * 1000) / 10 : 0;
          return (
            <NumberField
              key={`w-${t}`}
              label={`Poids : ${typeLabel(t)} (${String(share).replace(".", ",")} % du tirage, tout ouvert)`}
              value={weights[t]}
              min={0}
              step={0.25}
              onChange={(v) => setMap("weights", t, Math.max(0, v ?? 0))}
            />
          );
        })}
        {TYPES.filter((t) => t !== "spend").map((t) => (
          <NumberField key={`t-${t}`} label={`Quantité : ${typeLabel(t)}`} value={targets[t]} min={1} step={1} onChange={(v) => setMap("targets", t, Math.max(1, Math.round(v ?? 1)))} />
        ))}
        <NumberField label={CONTRACT_RULES_META.spendHours.label} value={(dc.spendHours as number) ?? CONTRACT_RULES.spendHours} min={0.1} step={0.5} onChange={(v) => setDc({ spendHours: v ?? 1 })} />
        <NumberField label={CONTRACT_RULES_META.spendMin.label} value={(dc.spendMin as number) ?? CONTRACT_RULES.spendMin} min={0} step={1000} onChange={(v) => setDc({ spendMin: Math.max(0, Math.round(v ?? 0)) })} />
        <CheckboxField
          label={CONTRACT_RULES_META.defenseCountsFactionRaids.label}
          checked={(dc.defenseCountsFactionRaids as boolean | undefined) ?? CONTRACT_RULES.defenseCountsFactionRaids}
          hint={CONTRACT_RULES_META.defenseCountsFactionRaids.hint}
          onChange={(v) => setDc({ defenseCountsFactionRaids: v })}
        />
      </Section>
    </>
  );
}
