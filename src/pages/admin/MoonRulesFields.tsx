import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { FLEET_MISSION_LABELS } from "@/game/fleets";
import { JUMP_GATE_RULES, JUMPABLE_MISSIONS } from "@/game/jumpGate";
import { MOON_RULES } from "@/game/moon";
import { PHALANX_RULES } from "@/game/phalanx";
import { CheckboxField, NumberField, Section } from "@/pages/admin/fields";

/* =====================================================
   6.14.69 (É30-1d, proposals/phalange-porte-de-saut.md) : Admin → Règles → Lunes.
   Trois sections dédiées : naissance, bonus et pitié (`moon`), phalange (`phalanx`)
   et porte de saut (`jumpGate`). Les mêmes champs restent aussi dans « Tous les
   réglages (avancé) » (AllRulesEditor).
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;

/** Groupes du registre, typés par leurs valeurs par défaut. */
const moonRules = (r: R) => ({ ...MOON_RULES, ...(r.moon as Partial<typeof MOON_RULES>) });
const phalanxRules = (r: R) => ({ ...PHALANX_RULES, ...(r.phalanx as Partial<typeof PHALANX_RULES>) });
const jumpGateRules = (r: R) => ({ ...JUMP_GATE_RULES, ...(r.jumpGate as Partial<typeof JUMP_GATE_RULES>) });

const int = (v: number | undefined, d: number, min = 0) => Math.max(min, Math.round(v ?? d));
const pct = (x: number) => Math.round(x * 1000) / 10;

export function MoonRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const moon = moonRules(rules);
  const ph = phalanxRules(rules);
  const jg = jumpGateRules(rules);
  const setMoon = (p: Partial<typeof MOON_RULES>) => setRules((r) => ({ ...r, moon: { ...moonRules(r), ...p } }));
  const setPh = (p: Partial<typeof PHALANX_RULES>) => setRules((r) => ({ ...r, phalanx: { ...phalanxRules(r), ...p } }));
  const setJg = (p: Partial<typeof JUMP_GATE_RULES>) => setRules((r) => ({ ...r, jumpGate: { ...jumpGateRules(r), ...p } }));
  const missions = new Set(Array.isArray(jg.missions) ? jg.missions : []);
  const toggleMission = (m: string, on: boolean) => setJg({ missions: JUMPABLE_MISSIONS.filter((x) => (x === m ? on : missions.has(x))) });

  return (
    <>
      <Section title="Lunes : naissance, bonus et pitié (6.13, 6.14.44)">
        <CheckboxField label="Naissance des lunes ouverte" checked={moon.enabled} hint="Décoché : plus de nouvelle lune ; les lunes existantes gardent leur bonus." onChange={(v: boolean) => setMoon({ enabled: v })} />
        <NumberField label="Débris pour 1 % de chance" value={moon.debrisPerPercent} min={1000} step={10000} hint="Ferraille + énergie du combat (OGame : 100 000)." onChange={(v) => setMoon({ debrisPerPercent: int(v, 100000, 1000) })} />
        <NumberField label="Chance maximale par les débris (%)" value={Math.round(moon.maxChance * 100)} min={0} step={1} hint="La pitié s'ajoute à cette chance, jusqu'à 100 %." onChange={(v) => setMoon({ maxChance: Math.min(1, Math.max(0, (v ?? 20) / 100)) })} />
        <NumberField
          label="Pitié : chance ajoutée par combat subi (%)"
          value={pct(Number(moon.pityPerDefense) || 0)}
          min={0}
          step={1}
          hint="Combat lancé par un joueur sur la planète mère, sans lune. 5 % = lune garantie au 20e combat. 0 = pas de pitié (la réserve reste en base, sans effet)."
          onChange={(v) => setMoon({ pityPerDefense: Math.min(1, Math.max(0, (v ?? 5) / 100)) })}
        />
        <NumberField label="Bonus de bouclier (%)" value={pct(moon.shieldBonus)} min={0} step={0.5} hint="Couche empire, plafond du bouclier compris." onChange={(v) => setMoon({ shieldBonus: Math.max(0, (v ?? 3) / 100) })} />
        <NumberField label="Bonus d'entrepôt à l'abri (%)" value={pct(moon.protectedStorageBonus)} min={0} step={0.5} hint="Couche empire, plafond de la part à l'abri compris." onChange={(v) => setMoon({ protectedStorageBonus: Math.max(0, (v ?? 5) / 100) })} />
        <NumberField label="Niveau maximal" value={moon.maxLevel} min={1} step={1} hint="1 = pas d'amélioration. Bouclier au maximum = base + bonus par niveau × (niveau − 1), plafond 15 %." onChange={(v) => setMoon({ maxLevel: int(v, 5, 1) })} />
        <NumberField label="Bouclier par niveau (%)" value={pct(moon.shieldPerLevel)} min={0} step={0.5} onChange={(v) => setMoon({ shieldPerLevel: Math.max(0, (v ?? 2) / 100) })} />
        <NumberField label="Coût du niveau 2 : ferraille" value={moon.upgradeCost.scrap ?? 0} min={0} step={50000} onChange={(v) => setMoon({ upgradeCost: { ...moon.upgradeCost, scrap: int(v, 0) } })} />
        <NumberField label="Coût du niveau 2 : énergie" value={moon.upgradeCost.energy ?? 0} min={0} step={50000} onChange={(v) => setMoon({ upgradeCost: { ...moon.upgradeCost, energy: int(v, 0) } })} />
        <NumberField label="Coût : multiplicateur par niveau" value={moon.costGrowth} min={1} step={0.1} onChange={(v) => setMoon({ costGrowth: Math.max(1, v ?? 2) })} />
      </Section>
      <Section title="Lunes : phalange (6.14.44)">
        <CheckboxField label="Phalange active" checked={ph.enabled} hint="Décoché : balayage refusé, radar coupé, rien n'est percé." onChange={(v: boolean) => setPh({ enabled: v })} />
        <CheckboxField label="Radar d'alliance" checked={ph.radar} hint="Alerte les alliés à lune dont la portée couvre la planète visée, au lancement d'une attaque de joueur." onChange={(v: boolean) => setPh({ radar: v })} />
        <NumberField label="Portée par niveau de lune (unités de carte)" value={ph.rangePerLevel} min={0} step={1} hint="Carte de 100 × 100. Effet « Portée de la phalange » en plus (plafond 50 %)." onChange={(v) => setPh({ rangePerLevel: Math.max(0, v ?? 15) })} />
        <NumberField label="Radar : alliés prévenus au plus, par attaque" value={ph.radarMaxNotified} min={0} step={1} hint="Les plus proches de la planète visée." onChange={(v) => setPh({ radarMaxNotified: int(v, 10) })} />
        <NumberField label="Niveau qui perce le brouilleur d'approche" value={ph.revealDecoyLevel} min={0} step={1} hint="Vraie composition des flottes qui te visent. 0 = jamais." onChange={(v) => setPh({ revealDecoyLevel: int(v, 2) })} />
        <NumberField label="Niveau qui révèle les capsules (stimulant)" value={ph.revealBoostLevel} min={0} step={1} hint="0 = jamais." onChange={(v) => setPh({ revealBoostLevel: int(v, 4) })} />
        <NumberField label="Balayage : recharge au niveau 1 (min)" value={ph.scanCooldownMinutes} min={0} step={5} onChange={(v) => setPh({ scanCooldownMinutes: Math.max(0, v ?? 30) })} />
        <NumberField label="Balayage : minutes de recharge en moins par niveau" value={ph.scanCooldownCutPerLevel} min={0} step={1} onChange={(v) => setPh({ scanCooldownCutPerLevel: Math.max(0, v ?? 5) })} />
        <NumberField label="Balayage : recharge minimale (min)" value={ph.scanCooldownMinMinutes} min={0} step={1} onChange={(v) => setPh({ scanCooldownMinMinutes: Math.max(0, v ?? 5) })} />
        <NumberField label="Balayage : coût en heures de production d'énergie" value={ph.scanCostHours} min={0} step={0.25} hint="0,5 = 30 min de production d'énergie." onChange={(v) => setPh({ scanCostHours: Math.max(0, v ?? 0.5) })} />
        <NumberField label="Balayage : coût minimal (énergie)" value={ph.scanCostMin} min={0} step={500} onChange={(v) => setPh({ scanCostMin: int(v, 1000) })} />
      </Section>
      <Section title="Lunes : porte de saut (6.14.44)">
        <CheckboxField label="Porte de saut active" checked={jg.enabled} hint="Décoché : plus aucun saut." onChange={(v: boolean) => setJg({ enabled: v })} />
        <NumberField label="Niveau de lune qui ouvre la porte" value={jg.minMoonLevel} min={1} step={1} onChange={(v) => setJg({ minMoonLevel: int(v, 3, 1) })} />
        <NumberField label="Recharge au niveau d'ouverture (h)" value={jg.cooldownHours} min={0} step={1} onChange={(v) => setJg({ cooldownHours: Math.max(0, v ?? 24) })} />
        <NumberField label="Heures de recharge en moins par niveau au-delà" value={jg.cooldownCutPerLevel} min={0} step={0.5} onChange={(v) => setJg({ cooldownCutPerLevel: Math.max(0, v ?? 2) })} />
        <NumberField label="Recharge minimale (h)" value={jg.cooldownMinHours} min={0} step={0.5} hint="Après l'effet « Recharge de la porte de saut » (plafond 30 %)." onChange={(v) => setJg({ cooldownMinHours: Math.max(0, v ?? 6) })} />
        <NumberField label="Sauvetage : fenêtre après un saut (min)" value={jg.saveWindowMinutes} min={0} step={1} hint="Attaque repoussée dans ce délai : compteur « sauvetages » et succès secret « Retour fracassant »." onChange={(v) => setJg({ saveWindowMinutes: int(v, 10) })} />
        {JUMPABLE_MISSIONS.map((m) => (
          <CheckboxField key={m} label={`Rapatrie : ${FLEET_MISSION_LABELS[m] ?? m}`} checked={missions.has(m)} hint="Liste sûre fixe (I23) : on peut retirer une mission, pas en ajouter." onChange={(v: boolean) => toggleMission(m, v)} />
        ))}
        <CheckboxField label="Saut de garnison vers un allié (J3)" checked={jg.allyJump} hint="Désactivé (Q35) : aucune route ne l'utilise encore." onChange={(v: boolean) => setJg({ allyJump: v })} />
        <NumberField label="Saut vers un allié : niveau de lune requis" value={jg.allyJumpMinMoonLevel} min={1} step={1} onChange={(v) => setJg({ allyJumpMinMoonLevel: int(v, 5, 1) })} />
        <NumberField label="Saut vers un allié : arrivée (min)" value={jg.allyJumpArrivalMinutes} min={0} step={1} onChange={(v) => setJg({ allyJumpArrivalMinutes: int(v, 5) })} />
      </Section>
    </>
  );
}
