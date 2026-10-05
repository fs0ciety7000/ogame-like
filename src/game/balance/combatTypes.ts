import type { BattleReport } from "@/types/game";

/* =====================================================
   5.21 : suivi de l'équilibrage par type de combat. Classe les rapports
   d'après les identifiants des deux camps et compte les victoires du
   joueur depuis le passage au combat en tours (5.19).
===================================================== */

/** Mise en ligne de la 5.19 (combat en tours) : 5 octobre 2026, 16 h 10 UTC. */
export const COMBAT_519_SINCE_MS = Date.UTC(2026, 9, 5, 16, 10);

export type CombatKind = "pvp" | "warlord" | "reprisal" | "bounty" | "lair" | "raid";

type Report = Pick<BattleReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp">;

export interface CombatKindDef {
  label: string;
  /** Le joueur attaque (victoire = attacker_win) ou défend (victoire = tout sauf attacker_win). */
  side: "attack" | "defense";
  /** Fourchette visée pour la victoire du joueur, en %. */
  target: [number, number];
}

export const COMBAT_KINDS: Record<CombatKind, CombatKindDef> = {
  pvp: { label: "Joueur contre joueur (attaquant)", side: "attack", target: [55, 60] },
  warlord: { label: "Attaques de seigneurs de guerre", side: "attack", target: [40, 60] },
  reprisal: { label: "Répliques des seigneurs (défense)", side: "defense", target: [50, 70] },
  bounty: { label: "Primes Kesh'Vaar", side: "attack", target: [85, 90] },
  lair: { label: "Assauts de repaires", side: "attack", target: [60, 80] },
  raid: { label: "Raids de faction (défense)", side: "defense", target: [60, 80] },
};

const isWarlord = (uid?: string) => !!uid && uid.startsWith("npc");

/** Type d'un rapport de combat (null : camp inconnu). */
export function combatKind(r: Pick<Report, "attackerUid" | "defenderUid">): CombatKind | null {
  const a = r.attackerUid ?? "";
  const d = r.defenderUid ?? "";
  if (!a || !d) return null;
  if (d.startsWith("bounty_")) return "bounty";
  if (d.startsWith("lair_")) return "lair";
  if (a === "pirates") return "raid";
  if (isWarlord(a)) return "reprisal";
  if (isWarlord(d)) return "warlord";
  return "pvp";
}

/** Combat entre deux joueurs humains (ni PNJ, ni prime, ni repaire, ni raid). */
export const isPvpReport = (r: Pick<Report, "attackerUid" | "defenderUid">) => combatKind(r) === "pvp";

export interface CombatKindStat {
  kind: CombatKind;
  battles: number;
  /** Victoires du joueur (attaquant ou défenseur selon le type). */
  playerWins: number;
  /** null sous 5 combats. */
  playerWinPct: number | null;
  status: "low" | "ok" | "high" | "none";
}

export function playerWon(kind: CombatKind, outcome: string): boolean {
  return COMBAT_KINDS[kind].side === "attack" ? outcome === "attacker_win" : outcome !== "attacker_win";
}

/** Victoires du joueur par type de combat, à partir de `since`. */
export function combatTypeStats(reports: Report[], since = COMBAT_519_SINCE_MS, until = Infinity): CombatKindStat[] {
  const acc = new Map<CombatKind, { battles: number; wins: number }>();
  for (const r of reports) {
    if (r.timestamp < since || r.timestamp > until) continue;
    const kind = combatKind(r);
    if (!kind) continue;
    const a = acc.get(kind) ?? { battles: 0, wins: 0 };
    a.battles++;
    if (playerWon(kind, r.outcome)) a.wins++;
    acc.set(kind, a);
  }
  return (Object.keys(COMBAT_KINDS) as CombatKind[]).map((kind) => {
    const a = acc.get(kind) ?? { battles: 0, wins: 0 };
    const pct = a.battles >= 5 ? Math.round((a.wins / a.battles) * 100) : null;
    const [lo, hi] = COMBAT_KINDS[kind].target;
    return { kind, battles: a.battles, playerWins: a.wins, playerWinPct: pct, status: pct === null ? "none" : pct < lo ? "low" : pct > hi ? "high" : "ok" };
  });
}

/** Comptes du jour par type (photo d'historique) : [combats, victoires du joueur]. */
export function combatTypeCounts(reports: Report[], since: number, until: number): Partial<Record<CombatKind, [number, number]>> {
  const out: Partial<Record<CombatKind, [number, number]>> = {};
  for (const s of combatTypeStats(reports, since, until)) if (s.battles > 0) out[s.kind] = [s.battles, s.playerWins];
  return out;
}
