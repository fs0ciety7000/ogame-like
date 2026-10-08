import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { SHOP_ITEMS } from "@/game/bounties";
import { CHALLENGE_TYPES, type ChallengeType } from "@/game/challenges";
import { COLONY_SPECS } from "@/game/colonies";
import { LEAGUE_TIERS } from "@/game/leagues";
import { MODULE_FAMILIES, MODULE_RARITIES, type ModuleFamily } from "@/game/modules";
import { TALENTS } from "@/game/talents";
import { NumberField, Section } from "@/pages/admin/fields";
import { BALANCE_HEALTH_RULES, BALANCE_HEALTH_RULES_META } from "@/game/balance/healthRules";

/* =====================================================
   6.14.104 (AU27, lot AA3 : constats AA-1, AA-2, AA-4, AA-5, AA-7, AA-8,
   AA-11, AA-13, AA-32) : chiffres des listes fixes, réglables. Les objets,
   talents, spécialisations, raretés, divisions et types de défi gardent
   leurs ids dans le code ; leurs chiffres vivent dans les groupes du
   registre (modèle 6.9.0) et se règlent ici. Les mêmes champs restent dans
   « Tous les réglages (avancé) ».
===================================================== */

type R = GameRules;
type SetRules = Dispatch<SetStateAction<R>>;
type Obj = Record<string, unknown>;

const groupOf = (r: R, group: string): Obj => ((r as unknown as Obj)[group] ?? {}) as Obj;
const mapOf = (r: R, group: string, key: string): Record<string, number> => (groupOf(r, group)[key] ?? {}) as Record<string, number>;

/** Écrit `rules[group][key][id]` (et `[sub]` si donné) sans toucher au reste du groupe. */
function setIn(setRules: SetRules, group: string, key: string, id: string, value: number, sub?: string) {
  setRules((r) => {
    const g = groupOf(r, group);
    const map = (g[key] ?? {}) as Obj;
    const next = sub === undefined ? value : { ...((map[id] ?? {}) as Obj), [sub]: value };
    return { ...r, [group]: { ...g, [key]: { ...map, [id]: next } } } as R;
  });
}

const SPEC_FACTOR_LABELS: Record<string, string> = {
  production: "production",
  deposit: "gisement rare",
  storage: "entrepôt",
  hangar: "hangar de défense",
  defenseTime: "durée des défenses",
};

const BUDGET_LABELS: Record<string, string> = { unit: "une unité", group: "une classe", wide: "une catégorie", edge: "effet très large", elite: "unités d'élite" };
const BUDGET_TARGETS: Record<string, string> = { relic: "relique (×)", tech: "techno (par niveau)", officer: "officier (par niveau)" };

export function FixedListRulesFields({ rules, setRules }: { rules: R; setRules: SetRules }) {
  const prices = mapOf(rules, "bountyShop", "prices");
  const perRank = mapOf(rules, "talents", "perRank");
  const specs = (groupOf(rules, "colonySpec").specs ?? {}) as Record<string, Record<string, number>>;
  const weights = mapOf(rules, "modules", "rarityWeights");
  const recycle = mapOf(rules, "modules", "recycleAmber");
  const familyValues = (groupOf(rules, "modules").familyValues ?? {}) as Record<string, Record<string, number>>;
  const tiers = (groupOf(rules, "leagues").tiers ?? {}) as Record<string, { tokens: number; placementPct: number }>;
  const perActive = mapOf(rules, "weeklyChallenge", "perActive");
  const budgets = (groupOf(rules, "effectPresets").budgets ?? {}) as Record<string, Record<string, number>>;
  const passOverflow = groupOf(rules, "passOverflow");
  const audit = groupOf(rules, "unitAudit");
  const health = groupOf(rules, "balanceHealth");
  const placement = Object.values(tiers).reduce((a, t) => a + (Number(t?.placementPct) || 0), 0);
  const setTop = (group: string, key: string, v: number) => setRules((r) => ({ ...r, [group]: { ...groupOf(r, group), [key]: v } }) as R);

  return (
    <>
      <Section title="Comptoir de la Ruche : prix (6.14.104)">
        {SHOP_ITEMS.map((i) => (
          <NumberField key={i.id} label={`${i.name} (Ambre)`} value={prices[i.id]} min={1} step={10} onChange={(v) => setIn(setRules, "bountyShop", "prices", i.id, Math.max(1, Math.round(v ?? 1)))} />
        ))}
      </Section>
      <Section title="Talents d'Ascension : valeur par rang (6.14.104)">
        {TALENTS.map((t) => (
          <NumberField
            key={t.id}
            label={t.effect.kind === "spyLevel" ? `${t.name} (niveaux d'espionnage par rang)` : `${t.name} (0,02 = +2 % par rang)`}
            value={perRank[t.id]}
            min={0}
            step={t.effect.kind === "spyLevel" ? 0.1 : 0.005}
            onChange={(v) => setIn(setRules, "talents", "perRank", t.id, Math.max(0, v ?? 0))}
          />
        ))}
      </Section>
      <Section title="Colonies : spécialisations (6.14.104)">
        <p className="text-sm text-slate-400 sm:col-span-2">Multiplicateurs : 1 = sans effet, 1,25 = +25 %, 0,7 en durée = 30 % plus rapide. Le résumé affiché au joueur suit les chiffres.</p>
        {COLONY_SPECS.flatMap((sp) =>
          Object.keys(specs[sp.id] ?? {}).map((k) => (
            <NumberField key={`${sp.id}-${k}`} label={`${sp.name} : ${SPEC_FACTOR_LABELS[k] ?? k} (×)`} value={specs[sp.id]?.[k]} min={0.1} step={0.05} onChange={(v) => setIn(setRules, "colonySpec", "specs", sp.id, v ?? 1, k)} />
          )),
        )}
      </Section>
      <Section title="Modules de vaisseaux : tirage et valeurs (6.14.104)">
        {MODULE_RARITIES.map((r) => (
          <NumberField key={`w-${r.id}`} label={`Poids du tirage : ${r.label.toLowerCase()}`} value={weights[r.id]} min={0} step={1} onChange={(v) => setIn(setRules, "modules", "rarityWeights", r.id, Math.max(0, v ?? 0))} />
        ))}
        {MODULE_RARITIES.map((r) => (
          <NumberField key={`a-${r.id}`} label={`Recyclage d'un plan ${r.label.toLowerCase()} (Ambre)`} value={recycle[r.id]} min={0} step={1} onChange={(v) => setIn(setRules, "modules", "recycleAmber", r.id, Math.max(0, Math.round(v ?? 0)))} />
        ))}
        {(Object.keys(MODULE_FAMILIES) as ModuleFamily[]).flatMap((fam) =>
          MODULE_RARITIES.map((r) => (
            <NumberField
              key={`v-${fam}-${r.id}`}
              label={`${MODULE_FAMILIES[fam].label}, ${r.label.toLowerCase()} ${MODULE_FAMILIES[fam].unit === "level" ? "(niveaux)" : "(0,04 = +4 %)"}`}
              value={familyValues[fam]?.[r.id]}
              min={0}
              step={MODULE_FAMILIES[fam].unit === "level" ? 1 : 0.01}
              onChange={(v) => setIn(setRules, "modules", "familyValues", fam, Math.max(0, v ?? 0), r.id)}
            />
          )),
        )}
      </Section>
      <Section title="Divisions : jetons et placement (6.14.104)">
        <p className="text-sm text-slate-400 sm:col-span-2">
          Parts de placement : <span className="font-mono tabular-nums">{Math.round(placement * 1000) / 10} %</span> au total (100 % attendu).
        </p>
        {LEAGUE_TIERS.flatMap((t) => [
          <NumberField key={`t-${t.id}`} label={`${t.label} : jetons par participant actif`} value={tiers[t.id]?.tokens} min={0} step={1} onChange={(v) => setIn(setRules, "leagues", "tiers", t.id, Math.max(0, Math.round(v ?? 0)), "tokens")} />,
          <NumberField key={`p-${t.id}`} label={`${t.label} : part des joueurs placés (0,25 = 25 %)`} value={tiers[t.id]?.placementPct} min={0} step={0.05} onChange={(v) => setIn(setRules, "leagues", "tiers", t.id, Math.max(0, v ?? 0), "placementPct")} />,
        ])}
      </Section>
      <Section title="Défi de la semaine, passe et barèmes (6.14.104)">
        {(Object.keys(CHALLENGE_TYPES) as ChallengeType[]).map((id) => (
          <NumberField key={id} label={`Défi « ${CHALLENGE_TYPES[id].label} » : ${CHALLENGE_TYPES[id].unit} par joueur actif`} value={perActive[id]} min={1} step={1} onChange={(v) => setIn(setRules, "weeklyChallenge", "perActive", id, Math.max(1, v ?? 1))} />
        ))}
        <NumberField label="Passe : Ambre à la place d'une capsule (réserve pleine)" value={passOverflow.capsuleAmber as number} min={0} step={1} onChange={(v) => setTop("passOverflow", "capsuleAmber", Math.max(0, Math.round(v ?? 0)))} />
        {Object.keys(budgets).flatMap((b) =>
          Object.keys(budgets[b] ?? {}).map((k) => (
            <NumberField key={`b-${b}-${k}`} label={`Préréglages, barème « ${BUDGET_LABELS[b] ?? b} » : ${BUDGET_TARGETS[k] ?? k}`} value={budgets[b]?.[k]} min={0} step={0.001} onChange={(v) => setIn(setRules, "effectPresets", "budgets", b, Math.max(0, v ?? 0), k)} />
          )),
        )}
      </Section>
      <Section title="Outils d'équilibrage : seuils (6.14.104)">
        <NumberField label="Seigneurs : alerte au-delà de ce multiple du 2e joueur (×)" value={audit.warlordAlertRatio as number} min={1} step={0.1} onChange={(v) => setTop("unitAudit", "warlordAlertRatio", v ?? 1.5)} />
        <NumberField label="JcJ : victoires des attaquants, bas de la zone cible (%)" value={audit.pvpAttackLow as number} min={0} step={1} onChange={(v) => setTop("unitAudit", "pvpAttackLow", v ?? 40)} />
        <NumberField label="JcJ : victoires des attaquants, haut de la zone cible (%)" value={audit.pvpAttackHigh as number} min={0} step={1} onChange={(v) => setTop("unitAudit", "pvpAttackHigh", v ?? 65)} />
        <NumberField label="Valeur d'une ressource rare (en ressources communes)" value={audit.rareValue as number} min={1} step={5} onChange={(v) => setTop("unitAudit", "rareValue", v ?? 50)} />
      </Section>
      {/* 6.14.107 (AU27, AE-L4) : seuils d'alerte de la santé de l'équilibre (Admin → Équilibrage), aucun effet en jeu. */}
      <Section title="Santé de l'équilibre : seuils d'alerte (6.14.107)">
        {(Object.keys(BALANCE_HEALTH_RULES_META) as (keyof typeof BALANCE_HEALTH_RULES_META)[]).map((k) => {
          const m: { label: string; unit?: string; min?: number; max?: number } = BALANCE_HEALTH_RULES_META[k];
          return (
            <NumberField
              key={k}
              label={`${m.label}${m.unit ? ` (${m.unit})` : ""}`}
              value={health[k] as number}
              min={m.min}
              hint={(BALANCE_HEALTH_RULES_META[k] as { hint?: string }).hint}
              step={m.unit === "×" ? 0.1 : m.unit === "part" ? 0.01 : 1}
              onChange={(v) => setTop("balanceHealth", k, Math.min(m.max ?? Infinity, Math.max(m.min ?? 0, v ?? BALANCE_HEALTH_RULES[k])))}
            />
          );
        })}
      </Section>
    </>
  );
}
