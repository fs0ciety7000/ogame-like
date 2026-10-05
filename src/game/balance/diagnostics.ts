import { WARLORD_RULES } from "@/game/warlords";
import { computeBalance516, findings516, type Balance516 } from "@/game/balance/v516";
import { TECHNOLOGIES, techEffects } from "@/game/technologies";
import { rollingPvpWinPct, type BalanceSnapshot } from "@/game/balance/history";
import { costValue, extractorCurve, missionTable, empireProfile, techProfile, unitTable, type UnitMetrics } from "@/game/balance/analysis";
import { COMBAT_RULES, computeFullPower, getShieldPercent, homeDefensePower } from "@/game/combat";
import { economySnapshot, missionRewards } from "@/game/economy";
import { getUnitCapacity } from "@/game/buildings";
import { MISSIONS } from "@/game/missions";
import { FACTIONS } from "@/game/pirates";
import { RARITIES } from "@/game/relics";
import { allianceShieldBonus } from "@/game/alliances";
import { playerModifiers } from "@/game/modifiers";
import { DEFENSIVE_UNITS, findUnit, OFFENSIVE_UNITS } from "@/game/units";
import type { BattleReport, PlayerState } from "@/types/game";

/* =====================================================
   Outil d'équilibrage (v5.4) — diagnostics et propositions.
   · staticFindings : le contenu actuel (code + personnalisation de l'admin).
   · computeLiveBalance : les joueurs réels (calculé par le serveur).
   · proposals : constats chiffrés + réglage proposé + où le changer.
===================================================== */

export type Severity = "critical" | "warning" | "info";

export interface Proposal {
  id: string;
  severity: Severity;
  area: "Unités" | "Défenses" | "Économie" | "Missions" | "Reliques" | "Factions" | "Combats" | "Seigneurs" | "Hangars" | "Expéditions" | "Casino";
  finding: string;
  proposal: string;
  /** Onglet de l'administration où appliquer le réglage. */
  where: string;
}

const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : Math.abs(n) >= 1e4 ? `${Math.round(n / 1e3)} k` : `${Math.round(n)}`);

/** Valeur de combat d'une unité par place : ATK pour la flotte, ATK + DEF pour les défenses. */
export function placeValue(u: UnitMetrics): number {
  return u.category === "attack" ? u.attackPerPlace : u.powerPerPlace;
}

/* ---------- 1. Contenu (statique) ---------- */

export function staticFindings(): Proposal[] {
  const out: Proposal[] = [];
  const table = unitTable("max", techProfile(1));

  for (const cat of ["attack", "defense"] as const) {
    const units = table.filter((u) => u.category === cat && u.id !== "cargo");
    const med = median(units.map(placeValue));
    for (const u of units) {
      const v = placeValue(u);
      if (v < 0.55 * med) {
        const places = Math.max(1, Math.round((u.category === "attack" ? u.attack : u.attack + u.defense) / (0.9 * med)));
        out.push({
          id: `trap-${u.id}`,
          severity: "critical",
          area: cat === "attack" ? "Unités" : "Défenses",
          finding: `${u.name} : ${Math.round(v)} par place au niveau max, contre ${Math.round(med)} en médiane. Unité piège : les joueurs perdent leurs hangars avec.`,
          proposal: `Places de hangar ${u.places} → ${places} (≈ ${Math.round((u.category === "attack" ? u.attack : u.attack + u.defense) / places)} par place), ou stats × ${(0.9 * med / v).toFixed(1)}.`,
          where: "Unités",
        });
      }
    }
  }

  for (const a of table) {
    for (const b of table) {
      if (a === b || a.category !== b.category) continue;
      if (b.cost >= a.cost && placeValue(b) < placeValue(a) && b.speed <= a.speed && b.cargo <= a.cargo) {
        const cost = Math.floor(a.cost * (placeValue(b) / placeValue(a)) * 0.9);
        out.push({
          id: `dominated-${b.id}`,
          severity: "warning",
          area: b.category === "attack" ? "Unités" : "Défenses",
          finding: `${b.name} est dominée par ${a.name} : plus chère (${fmt(b.cost)} contre ${fmt(a.cost)}) et plus faible par place (${Math.round(placeValue(b))} contre ${Math.round(placeValue(a))}), sans vitesse ni soute en plus.`,
          proposal: `Coût total de ${b.name} → ≈ ${fmt(cost)} (en gardant la répartition), ou + ${Math.ceil((placeValue(a) / placeValue(b) - 1) * 100)} % d'ATK/DEF.`,
          where: "Unités",
        });
      }
    }
  }

  const basic = table.filter((u) => u.places <= 2);
  for (const u of table.filter((x) => x.places > 2 && x.id !== "cargo")) {
    const best = Math.max(...basic.filter((b) => b.category === u.category).map(placeValue));
    const v = placeValue(u);
    if (v > 1.8 * best) {
      out.push({
        id: `overpowered-${u.id}`,
        severity: "warning",
        area: u.category === "attack" ? "Unités" : "Défenses",
        finding: `${u.name} : ${Math.round(v)} par place, ${(v / best).toFixed(1)} × la meilleure unité de base. Les bases ou flottes qui en sont pleines écrasent tout.`,
        proposal: `Places de hangar ${u.places} → ${Math.ceil((u.places * v) / (1.5 * best))}.`,
        where: "Unités",
      });
    }
  }

  for (let i = 1; i < RARITIES.length; i++) {
    if (RARITIES[i].pct <= RARITIES[i - 1].pct) {
      out.push({
        id: `relic-${RARITIES[i].id}`,
        severity: "warning",
        area: "Reliques",
        finding: `Rareté « ${RARITIES[i].label} » : +${Math.round(RARITIES[i].pct * 100)} %, pas plus que « ${RARITIES[i - 1].label} » (+${Math.round(RARITIES[i - 1].pct * 100)} %).`,
        proposal: `Passer « ${RARITIES[i].label} » à +${Math.round((RARITIES[i - 1].pct + 0.05) * 100)} %.`,
        where: "Code (relics.ts)",
      });
    }
  }

  for (const s of extractorCurve("extracteur_ferraille", techProfile(1))) {
    if (s.paybackHours > 150) {
      out.push({
        id: `extractor-${s.level}`,
        severity: "info",
        area: "Économie",
        finding: `Extracteur niveau ${s.level} : ${Math.round(s.paybackHours)} h de production pour être remboursé.`,
        proposal: "Baisser le coût maximal des niveaux 11–20 ou augmenter la production de ces niveaux.",
        where: "Bâtiments",
      });
      break;
    }
  }

  const end = empireProfile(18, 1);
  for (const m of missionTable(end)) {
    const def = MISSIONS[m.key];
    const commonOnly = Object.keys(def.reward).every((r) => ["scrap", "energy", "nano", "data", "xp"].includes(r));
    if (commonOnly && m.productionHoursPerHour < 0.3) {
      out.push({ id: `mission-${m.key}`, severity: "warning", area: "Missions", finding: `${m.name} : ${m.productionHoursPerHour.toFixed(2)} h de production par heure en fin de partie.`, proposal: "Augmenter la récompense fixe ou la durée indexée.", where: "Missions" });
    }
  }
  const ai = missionRewards(MISSIONS.fouille_archives_IA ?? Object.values(MISSIONS)[0], end).aiFragment ?? 0;
  if (MISSIONS.fouille_archives_IA && ai < 0.2 * 36_000) {
    out.push({ id: "mission-rare", severity: "warning", area: "Missions", finding: `Missions rares en fin de partie : ${fmt(ai)} fragments d'IA par heure, moins de 20 % d'un Synthétiseur niveau 10 (36 k/h).`, proposal: "Baisser missionRareProductionRef (règles d'économie).", where: "Règles" });
  }

  return out;
}

/* ---------- 2. Joueurs réels ---------- */

export interface PlayerBalanceRow {
  pseudo: string;
  attack: number;
  defense: number;
  shieldPct: number;
  defenseBonusPct: number;
  attackPlacesUsed: number;
  attackPlaces: number;
  defensePlacesUsed: number;
  defensePlaces: number;
  productionPerHour: number;
  outage: boolean;
  fullStorage: number;
}

export interface LiveBalance {
  generatedAt: number;
  activePlayers: number;
  players: PlayerBalanceRow[];
  /** Places de hangar occupées par unité (tous joueurs actifs). */
  unitPlaces: { id: string; name: string; places: number; owners: number }[];
  pvp: { battles: number; attackerWinPct: number; windowDays: number };
  warlordBattles: { battles: number; attackerWinPct: number };
  factions: { id: string; name: string; raidsWon: number; raidsLost: number; repelledPct: number; lairsTaken: number; lairsOpen: number }[];
  warlords: { pseudo: string; power: number }[];
  bestDefense: number;
  bestAttack: number;
  /** v5.5 : photos quotidiennes (ajoutées par le serveur). */
  history?: BalanceSnapshot[];
  /** 5.17 : suivi des nouveautés de la 5.16. */
  v516?: Balance516;
}

function places(units: PlayerState["units"], ids: string[]): number {
  return ids.reduce((a, id) => a + (units?.[id]?.count ?? 0) * (findUnit(id)?.hangarSpace ?? 1), 0);
}

export function computeLiveBalance(
  players: PlayerState[],
  warlords: PlayerState[],
  reports: Pick<BattleReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp">[],
  now: number,
  windowDays = 30,
): LiveBalance {
  const active = players.filter((p) => !p.npc && now - (p.lastActiveMs ?? p.resourcesUpdatedAtMs ?? 0) < 14 * 86_400_000);
  const rows: PlayerBalanceRow[] = active.map((p) => {
    const units = p.units ?? {};
    const tech = p.techLevels ?? {};
    const eco = economySnapshot(p, now);
    const perHour = Object.values(eco.gross).reduce((a: number, b) => a + (b ?? 0), 0) * 3600;
    return {
      pseudo: p.pseudo,
      attack: Math.round(computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]) * (1 + playerModifiers(p).attack)),
      defense: Math.round(homeDefensePower(units, tech) * (1 + playerModifiers(p).defense)),
      shieldPct: Math.round(getShieldPercent(p.buildings, allianceShieldBonus(p.allianceResearch)) * 100),
      defenseBonusPct: Math.round(playerModifiers(p).defense * 100),
      attackPlacesUsed: places(units, OFFENSIVE_UNITS),
      attackPlaces: getUnitCapacity(p.buildings, "attack", tech),
      defensePlacesUsed: places(units, DEFENSIVE_UNITS),
      defensePlaces: getUnitCapacity(p.buildings, "defense", tech),
      productionPerHour: Math.round(perHour),
      outage: eco.outage,
      fullStorage: eco.full.length,
    };
  });
  rows.sort((a, b) => b.attack + b.defense - (a.attack + a.defense));

  const unitPlaces = [...OFFENSIVE_UNITS, ...DEFENSIVE_UNITS]
    .map((id) => {
      const owners = active.filter((p) => (p.units?.[id]?.count ?? 0) > 0);
      return { id, name: findUnit(id)?.name ?? id, places: owners.reduce((a, p) => a + (p.units?.[id]?.count ?? 0) * (findUnit(id)?.hangarSpace ?? 1), 0), owners: owners.length };
    })
    .filter((u) => u.places > 0)
    .sort((a, b) => b.places - a.places);

  const since = now - windowDays * 86_400_000;
  const recent = reports.filter((r) => r.timestamp >= since);
  const isNpc = (uid?: string) => !!uid && (uid.startsWith("npc") || uid === "pirates" || uid.startsWith("lair_"));
  const pvp = recent.filter((r) => !isNpc(r.attackerUid) && !isNpc(r.defenderUid));
  const wl = recent.filter((r) => r.attackerUid?.startsWith("npc") || r.defenderUid?.startsWith("npc"));
  const pct = (xs: typeof recent) => (xs.length ? Math.round((xs.filter((r) => r.outcome === "attacker_win").length / xs.length) * 100) : 0);

  const factions = FACTIONS.map((f) => {
    let raidsWon = 0, raidsLost = 0, lairsTaken = 0, lairsOpen = 0;
    for (const p of active) {
      const st = (p.pirates as Record<string, { raidsWon?: number; raidsLost?: number; lairsTaken?: number; lairOpen?: boolean }> | undefined)?.[f.id];
      if (!st) continue;
      raidsWon += st.raidsWon ?? 0;
      raidsLost += st.raidsLost ?? 0;
      lairsTaken += st.lairsTaken ?? 0;
      if (st.lairOpen) lairsOpen++;
    }
    const total = raidsWon + raidsLost;
    return { id: f.id, name: f.name, raidsWon, raidsLost, repelledPct: total ? Math.round((raidsWon / total) * 100) : 0, lairsTaken, lairsOpen };
  });

  return {
    generatedAt: now,
    activePlayers: active.length,
    players: rows,
    unitPlaces,
    pvp: { battles: pvp.length, attackerWinPct: pct(pvp), windowDays },
    warlordBattles: { battles: wl.length, attackerWinPct: pct(wl) },
    factions,
    warlords: warlords.map((w) => ({ pseudo: w.pseudo, power: Math.round(computeFullPower(w.units ?? {}, w.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]) + homeDefensePower(w.units ?? {}, w.techLevels ?? {})) })).sort((a, b) => b.power - a.power),
    bestDefense: Math.max(0, ...rows.map((r) => r.defense)),
    bestAttack: Math.max(0, ...rows.map((r) => r.attack)),
    v516: computeBalance516(active, now),
  };
}

/* ---------- 3. Propositions sur données réelles ---------- */

/** v5.5 : au-delà, l'attaquant gagne trop souvent (bonus à domicile +0,05). */
export const PVP_ATTACK_HIGH = 65;
export const PVP_ATTACK_LOW = 40;

export function liveFindings(live: LiveBalance): Proposal[] {
  const out: Proposal[] = [];
  // v5.5 : la tendance des 7 dernières photos prime sur la fenêtre de 30 jours.
  const rolling = live.history ? rollingPvpWinPct(live.history, 7) : null;
  const pvp = rolling ? { w: rolling.pct, battles: rolling.battles, span: "7 derniers jours" } : live.pvp.battles >= 20 ? { w: live.pvp.attackerWinPct, battles: live.pvp.battles, span: `${live.pvp.windowDays} j` } : null;
  if (pvp) {
    const bonus = COMBAT_RULES.homeDefenseBonus;
    const up = (bonus + 0.05).toFixed(2).replace(".", ",");
    const down = Math.max(0, bonus - 0.05).toFixed(2).replace(".", ",");
    const cur = bonus.toFixed(2).replace(".", ",");
    if (pvp.w > PVP_ATTACK_HIGH) out.push({ id: "pvp-attack", severity: "warning", area: "Combats", finding: `JcJ : l'attaquant gagne ${pvp.w} % des ${pvp.battles} combats (${pvp.span}, cible ${PVP_ATTACK_LOW}–${PVP_ATTACK_HIGH} %). Défendre rapporte trop peu.`, proposal: `Bonus à domicile ${cur} → ${up}.`, where: "Règles → Combat" });
    else if (pvp.w < PVP_ATTACK_LOW) out.push({ id: "pvp-defense", severity: "warning", area: "Combats", finding: `JcJ : l'attaquant ne gagne que ${pvp.w} % des ${pvp.battles} combats (${pvp.span}). Attaquer décourage.`, proposal: `Bonus à domicile ${cur} → ${down}.`, where: "Règles → Combat" });
    else out.push({ id: "pvp-ok", severity: "info", area: "Combats", finding: `JcJ : l'attaquant gagne ${pvp.w} % des ${pvp.battles} combats (${pvp.span}, cible ${PVP_ATTACK_LOW}–${PVP_ATTACK_HIGH} %).`, proposal: "Rien à changer.", where: "—" });
  }
  // v5.5 : repaires toujours intouchés après deux semaines d'historique.
  const h = live.history ?? [];
  if (h.length >= 14 && live.activePlayers >= 5 && h.at(-1)!.lairsTaken === h.at(-14)!.lairsTaken) {
    out.push({ id: "lairs-untouched", severity: "warning", area: "Factions", finding: `Aucun repaire pris en 14 jours (${live.activePlayers} joueurs actifs).`, proposal: "Force des repaires (lair.pct) −0,05 pour les factions concernées.", where: "Factions" });
  }
  for (const f of live.factions) {
    const total = f.raidsWon + f.raidsLost;
    if (total < 10) continue;
    if (f.repelledPct > 85) out.push({ id: `faction-easy-${f.id}`, severity: "info", area: "Factions", finding: `${f.name} : ${f.repelledPct} % des ${total} raids repoussés. Peu menaçante.`, proposal: "Puissance de base du raid (basePct) +0,05.", where: "Factions" });
    if (f.repelledPct < 40) out.push({ id: `faction-hard-${f.id}`, severity: "warning", area: "Factions", finding: `${f.name} : seulement ${f.repelledPct} % des ${total} raids repoussés.`, proposal: "Puissance de base du raid (basePct) −0,05, ou notoriété maximale −1.", where: "Factions" });
  }
  const strongest = live.warlords[0];
  if (strongest && live.bestDefense > 0 && strongest.power > 2.5 * live.bestDefense) {
    out.push({ id: "warlord-strong", severity: "warning", area: "Seigneurs", finding: `${strongest.pseudo} : ${fmt(strongest.power)} de puissance, ${(strongest.power / live.bestDefense).toFixed(1)} × la meilleure défense de joueur (${fmt(live.bestDefense)}). Hors d'atteinte pour une vendetta.`, proposal: `Le plafond automatique (× ${WARLORD_RULES.maxDefenseRatio.toString().replace(".", ",")} la meilleure défense) le ramène peu à peu (${Math.round(WARLORD_RULES.growthPerDay * 100)} % de l'excédent par jour). Pour aller plus vite : baisser le multiplicateur de puissance des seigneurs.`, where: "Seigneurs" });
  }
  const top = live.players.slice(0, 5);
  const saturated = top.filter((p) => p.attackPlaces > 0 && p.attackPlacesUsed / p.attackPlaces >= 0.9);
  if (top.length >= 3 && saturated.length >= Math.ceil(top.length / 2)) {
    out.push({ id: "hangars-full", severity: "info", area: "Hangars", finding: `${saturated.length} des ${top.length} meilleurs joueurs ont leur hangar d'attaque plein à 90 % ou plus.`, proposal: TECHNOLOGIES.some((t) => techEffects(t).some((e) => e.type === "hangar_capacity")) ? "Une technologie de capacité des hangars existe (Extension des hangars) : vérifier son coût et son gain par niveau." : "Créer une technologie « Capacité des hangars » (+5 % par niveau, 10 niveaux, coût élevé en ressources rares).", where: "Technologies" });
  }
  const outages = live.players.filter((p) => p.outage).length;
  if (live.players.length >= 5 && outages / live.players.length > 0.2) {
    out.push({ id: "upkeep", severity: "warning", area: "Économie", finding: `${outages} joueurs actifs sur ${live.players.length} sont en panne d'énergie (entretien de flotte > production).`, proposal: "Entretien par place (upkeepPerPlaceAttack) −20 %.", where: "Règles → Économie" });
  }
  const full = live.players.filter((p) => p.fullStorage >= 2).length;
  if (live.players.length >= 5 && full / live.players.length > 0.3) {
    out.push({ id: "storage", severity: "info", area: "Économie", finding: `${full} joueurs actifs sur ${live.players.length} ont au moins 2 entrepôts pleins : leur production est perdue.`, proposal: "Capacité des entrepôts +25 %, ou plus de puits (marché, projets d'alliance).", where: "Bâtiments" });
  }
  const traps = new Set(staticFindings().filter((p) => p.id.startsWith("trap-")).map((p) => p.id.slice(5)));
  for (const u of live.unitPlaces.slice(0, 8)) {
    if (traps.has(u.id)) out.push({ id: `trap-used-${u.id}`, severity: "critical", area: "Unités", finding: `${u.name} occupe ${fmt(u.places)} places chez ${u.owners} joueurs alors que c'est une unité piège.`, proposal: "Corriger ses places (voir plus haut) : le gain de puissance pour ces joueurs sera immédiat.", where: "Unités" });
  }
  // 5.17 : nouveautés de la 5.16 (expéditions profondes, traités, rattrapage, jetons).
  if (live.v516) out.push(...findings516(live.v516, live.activePlayers));
  return out;
}

export const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

/** Toutes les propositions, les plus graves d'abord. */
export function allProposals(live: LiveBalance | null): Proposal[] {
  return [...staticFindings(), ...(live ? liveFindings(live) : [])].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

export { costValue };
