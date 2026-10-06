import type { Dispatch, SetStateAction } from "react";
import type { GameRules } from "@/game/content";
import { OUTCOME_LABELS, type SpinOutcome } from "@/game/casino";
import { WEEKLY_OFFERS, type WeeklyOfferId } from "@/game/weeklyStock";
import { NumberField, Section, TextField } from "@/pages/admin/fields";

/* 6.9.0 (AU4) : réglages du commerce (enchères, contrats, cadeaux, concours, tournoi, offre de la semaine, mécènes). */

type R = GameRules;
const hours = (s: string) =>
  s
    .split(/[,;\s]+/)
    .map(Number)
    .filter((n) => n > 0);

export function CommerceRulesFields({ rules, setRules }: { rules: R; setRules: Dispatch<SetStateAction<R>> }) {
  const au = rules.auctions;
  const tc = rules.tradeContracts;
  const setAu = (p: Partial<R["auctions"]>) => setRules((r) => ({ ...r, auctions: { ...r.auctions, ...p } }));
  const setTc = (p: Partial<R["tradeContracts"]>) => setRules((r) => ({ ...r, tradeContracts: { ...r.tradeContracts, ...p } }));
  const setGift = (p: Partial<R["gifts"]>) => setRules((r) => ({ ...r, gifts: { ...r.gifts, ...p } }));
  const setContest = (p: Partial<R["contests"]>) => setRules((r) => ({ ...r, contests: { ...r.contests, ...p } }));
  const setWeekly = (key: "prices" | "quantities", id: WeeklyOfferId, v: number) =>
    setRules((r) => ({ ...r, weeklyStock: { ...r.weeklyStock, [key]: { ...r.weeklyStock[key], [id]: Math.max(1, Math.round(v)) } } }));
  return (
    <>
      <Section title="Enchères (6.9.0)">
        <NumberField label="Surenchère minimale (0,05 = +5 %)" value={au.minIncrement} min={0.01} step={0.01} onChange={(v) => setAu({ minIncrement: v ?? 0.05 })} />
        <NumberField label="Taxe sur la vente (0,05 = 5 %)" value={au.taxRate} min={0} step={0.01} onChange={(v) => setAu({ taxRate: v ?? 0 })} />
        <NumberField label="Prolongation anti-dernière-seconde (min)" value={au.antiSnipeMs / 60_000} min={0} step={1} onChange={(v) => setAu({ antiSnipeMs: Math.round((v ?? 0) * 60_000) })} />
        <NumberField label="Ventes ouvertes par vendeur" value={au.maxOpenPerSeller} min={1} step={1} onChange={(v) => setAu({ maxOpenPerSeller: Math.round(v ?? 1) })} />
        <TextField label="Durées proposées (h)" value={au.durationsH.join(", ")} onChange={(v) => setAu({ durationsH: hours(v) })} />
        <NumberField label="Mise à prix min : ressource commune" value={au.minStart.common} min={1} step={10} onChange={(v) => setAu({ minStart: { ...au.minStart, common: v ?? 1 } })} />
        <NumberField label="Mise à prix min : ressource rare" value={au.minStart.rare} min={1} step={1} onChange={(v) => setAu({ minStart: { ...au.minStart, rare: v ?? 1 } })} />
        <NumberField label="Mise à prix min : Ambre" value={au.minStart.amber} min={1} step={1} onChange={(v) => setAu({ minStart: { ...au.minStart, amber: v ?? 1 } })} />
        <NumberField label="Alertes de vente par joueur" value={au.watchMax} min={0} step={1} onChange={(v) => setAu({ watchMax: Math.round(v ?? 0) })} />
        <NumberField label="Historique : ventes gardées par lot" value={au.historyPerLot} min={1} step={1} onChange={(v) => setAu({ historyPerLot: Math.round(v ?? 1) })} />
      </Section>
      <Section title="Contrats de livraison et cadeaux (6.9.0)">
        <NumberField label="Délai minimum (h)" value={tc.minHours} min={1} step={1} onChange={(v) => setTc({ minHours: v ?? 1 })} />
        <NumberField label="Délai maximum (h)" value={tc.maxHours} min={1} step={1} onChange={(v) => setTc({ maxHours: v ?? 72 })} />
        <NumberField label="Contrats actifs par joueur" value={tc.maxActive} min={1} step={1} onChange={(v) => setTc({ maxActive: Math.round(v ?? 1) })} />
        <NumberField label="Caution du livreur (0,1 = 10 %)" value={tc.depositPct} min={0} step={0.05} onChange={(v) => setTc({ depositPct: v ?? 0 })} />
        <NumberField label="Contrat sans livreur : expire après (h)" value={tc.openHours} min={1} step={1} onChange={(v) => setTc({ openHours: v ?? 48 })} />
        <NumberField label="Contrat prioritaire : en tête pendant (h)" value={tc.priorityHours} min={0} step={1} onChange={(v) => setTc({ priorityHours: v ?? 24 })} />
        <NumberField label="Cadeaux : ancienneté minimale (jours)" value={rules.gifts.minAccountDays} min={0} step={1} onChange={(v) => setGift({ minAccountDays: v ?? 0 })} />
        <NumberField label="Cadeaux : taxe hors alliance (0,2 = 20 %)" value={rules.gifts.outsideAllianceTax} min={0} step={0.05} onChange={(v) => setGift({ outsideAllianceTax: v ?? 0 })} />
      </Section>
      <Section title="Pot commun : concours, tournoi, Comptoir (6.9.0)">
        <NumberField label="Concours : part du pot engagée au plus (0,8 = 80 %)" value={rules.contests.maxPotShare} min={0.05} step={0.05} onChange={(v) => setContest({ maxPotShare: v ?? 0.8 })} />
        <NumberField label="Concours : places au classement" value={rules.contests.standingsSize} min={1} step={1} onChange={(v) => setContest({ standingsSize: Math.round(v ?? 20) })} />
        <NumberField label="Mécènes : places au classement" value={rules.patrons.top} min={1} step={1} onChange={(v) => setRules((r) => ({ ...r, patrons: { top: Math.round(v ?? 10) } }))} />
        {(Object.keys(rules.tournamentPoints) as SpinOutcome[]).map((k) => (
          <NumberField key={k} label={`Tournoi : points pour « ${OUTCOME_LABELS[k] ?? k} »`} value={rules.tournamentPoints[k]} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, tournamentPoints: { ...r.tournamentPoints, [k]: Math.max(0, Math.round(v ?? 0)) } }))} />
        ))}
        {WEEKLY_OFFERS.map((o) => (
          <NumberField key={`p-${o.id}`} label={`Offre de la semaine : ${o.name} (prix en Ambre)`} value={rules.weeklyStock.prices[o.id]} min={1} step={10} onChange={(v) => setWeekly("prices", o.id, v ?? 1)} />
        ))}
        {WEEKLY_OFFERS.map((o) => (
          <NumberField key={`q-${o.id}`} label={`Offre de la semaine : ${o.name} (exemplaires)`} value={rules.weeklyStock.quantities[o.id]} min={1} step={1} onChange={(v) => setWeekly("quantities", o.id, v ?? 1)} />
        ))}
      </Section>
    </>
  );
}
