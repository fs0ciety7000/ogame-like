import { CATCHUP_RULES, catchupFactorAt } from "@/game/catchup";
import { casinoWeekId } from "@/game/casino";
import { LOOT_TOKEN_RULES } from "@/game/loot";
import { activeMutator } from "@/game/mutators";
import { activeTreaty, type TreatyKind } from "@/game/pirates";
import type { PlayerState } from "@/types/game";
import type { Proposal } from "@/game/balance/diagnostics";

/* =====================================================
   5.17 : suivi des nouveautés de la 5.16 sur les joueurs actifs.
   Expéditions profondes, traités, rattrapage, plafond de jetons de butin
   et mutateur du mois, avec des propositions de réglage chiffrées.
===================================================== */

export interface Balance516 {
  expeditions: { total: number; deep: number; deepPct: number; deepAmbushLost: number };
  treaties: Record<TreatyKind, number> & { players: number };
  catchup: { boosted: number; boostedPct: number; avgBonusPct: number; maxBonusPct: number };
  lootTokens: { cap: number; capped: number; cappedPct: number; avgThisWeek: number };
  mutator: { id: string; name: string } | null;
}

const stat = (p: PlayerState, k: string): number => Number((p.stats as Record<string, unknown> | undefined)?.[k]) || 0;
const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

export function computeBalance516(active: PlayerState[], now: number): Balance516 {
  const total = active.reduce((a, p) => a + stat(p, "expeditions"), 0);
  const deep = active.reduce((a, p) => a + stat(p, "deepExpeditions"), 0);

  const treaties = { pact: 0, escort: 0, embargo: 0, players: 0 } as Balance516["treaties"];
  for (const p of active) {
    let any = false;
    for (const st of Object.values((p.pirates as Record<string, { treaty?: unknown }> | undefined) ?? {})) {
      const t = activeTreaty(st as Parameters<typeof activeTreaty>[0], now);
      if (t) {
        treaties[t.kind] += 1;
        any = true;
      }
    }
    if (any) treaties.players += 1;
  }

  const bonuses = active.map((p) => catchupFactorAt(p as Parameters<typeof catchupFactorAt>[0], now) - 1).filter((b) => b > 0);

  const week = casinoWeekId(now);
  const tokens = active.map((p) => {
    const lw = (p.casino as { lootWeek?: { id?: string; tokens?: number } } | undefined)?.lootWeek;
    return lw && lw.id === week ? Number(lw.tokens) || 0 : 0;
  });
  const cap = LOOT_TOKEN_RULES.weeklyCap;
  const capped = cap > 0 ? tokens.filter((t) => t >= cap).length : 0;

  const m = activeMutator(now);
  return {
    expeditions: { total, deep, deepPct: pct(deep, total), deepAmbushLost: active.reduce((a, p) => a + stat(p, "deepAmbushLost"), 0) },
    treaties,
    catchup: {
      boosted: bonuses.length,
      boostedPct: pct(bonuses.length, active.length),
      avgBonusPct: bonuses.length ? Math.round((bonuses.reduce((a, b) => a + b, 0) / bonuses.length) * 1000) / 10 : 0,
      maxBonusPct: bonuses.length ? Math.round(Math.max(...bonuses) * 1000) / 10 : 0,
    },
    lootTokens: { cap, capped, cappedPct: pct(capped, active.length), avgThisWeek: active.length ? Math.round((tokens.reduce((a, b) => a + b, 0) / active.length) * 10) / 10 : 0 },
    mutator: m ? { id: m.id, name: m.name } : null,
  };
}

/** Propositions de réglage tirées des chiffres (au moins quelques données pour se prononcer). */
export function findings516(b: Balance516, activePlayers: number): Proposal[] {
  const out: Proposal[] = [];
  if (b.expeditions.total >= 20) {
    if (b.expeditions.deepPct < 10)
      out.push({ id: "deep-low", severity: "info", area: "Expéditions", finding: `Seulement ${b.expeditions.deepPct} % des expéditions poussent plus loin : le risque paraît trop fort pour le gain.`, proposal: "Passer le bonus de butin par profondeur de 25 % à 35 %, ou la perte de cale de 30 % à 20 %.", where: "Règles → Expéditions" });
    else if (b.expeditions.deepPct > 60)
      out.push({ id: "deep-high", severity: "warning", area: "Expéditions", finding: `${b.expeditions.deepPct} % des expéditions poussent plus loin : le choix n'en est plus un.`, proposal: "Durcir les embuscades : risque par profondeur de 20 % à 30 %.", where: "Règles → Expéditions" });
  }
  if (activePlayers >= 10 && b.catchup.boostedPct > 40)
    out.push({ id: "catchup-wide", severity: "warning", area: "Économie", finding: `${b.catchup.boostedPct} % des joueurs actifs ont un bonus de rattrapage.`, proposal: `Baisser la fin du bonus de ${Math.round(CATCHUP_RULES.endsAt * 100)} % à 40 % de la médiane.`, where: "Règles → Rattrapage" });
  if (activePlayers >= 10 && b.lootTokens.cappedPct > 30)
    out.push({ id: "tokens-cap", severity: "info", area: "Casino", finding: `${b.lootTokens.cappedPct} % des joueurs actifs ont atteint le plafond de ${b.lootTokens.cap} jetons de butin cette semaine.`, proposal: `Relever le plafond à ${b.lootTokens.cap + 10} si le casino n'est pas saturé.`, where: "Contenu → Reliques (plafond de jetons)" });
  const signed = b.treaties.pact + b.treaties.escort + b.treaties.embargo;
  if (activePlayers >= 10 && signed === 0)
    out.push({ id: "treaties-none", severity: "info", area: "Factions", finding: "Aucun joueur actif n'a de traité en cours avec une faction.", proposal: "Baisser le prix du pacte de péage de 2 h à 1 h de production, ou l'annoncer lors des ultimatums.", where: "Code : TREATY_RULES (pirates.ts)" });
  return out;
}
