/* 5.26 : comparateur de joueurs côte à côte (classement → « Comparer »).
   Lignes calculées depuis les fiches publiques ; pour chaque ligne, le
   meilleur des deux est signalé (plus haut, ou plus bas quand `lowerIsBetter`). */

export interface CompareSide {
  xp: number;
  seasonXp: number;
  ascensions: number;
  createdAtMs?: number;
  colonies: number;
  victories: number;
  defeats: number;
  missions: number;
  expeditions: number;
  achievements: number;
  titles: number;
  warsWon: number;
  bounties: number;
  bossKills: number;
  /** Meilleur rang de saison obtenu (null : jamais classé). */
  bestSeasonRank: number | null;
  seasonsPlayed: number;
}

export interface CompareRow {
  key: string;
  label: string;
  group: "progression" | "combat" | "activite";
  a: number | null;
  b: number | null;
  format: "number" | "percent" | "days" | "rank";
  lowerIsBetter?: boolean;
  /** "a", "b" ou "tie" ; null si une des deux valeurs manque. */
  winner: "a" | "b" | "tie" | null;
}

function winRate(s: CompareSide): number | null {
  const fights = s.victories + s.defeats;
  return fights > 0 ? Math.round((s.victories / fights) * 100) : null;
}

function seniorityDays(s: CompareSide, now: number): number | null {
  return s.createdAtMs ? Math.max(0, Math.floor((now - s.createdAtMs) / 86_400_000)) : null;
}

export function compareRows(a: CompareSide, b: CompareSide, now: number): CompareRow[] {
  const raw: Omit<CompareRow, "winner">[] = [
    { key: "xp", label: "XP totale", group: "progression", a: a.xp, b: b.xp, format: "number" },
    { key: "seasonXp", label: "XP de la saison", group: "progression", a: a.seasonXp, b: b.seasonXp, format: "number" },
    { key: "ascensions", label: "Ascensions", group: "progression", a: a.ascensions, b: b.ascensions, format: "number" },
    { key: "colonies", label: "Colonies", group: "progression", a: a.colonies, b: b.colonies, format: "number" },
    { key: "achievements", label: "Succès", group: "progression", a: a.achievements, b: b.achievements, format: "number" },
    { key: "titles", label: "Titres", group: "progression", a: a.titles, b: b.titles, format: "number" },
    { key: "bestSeasonRank", label: "Meilleur rang de saison", group: "progression", a: a.bestSeasonRank, b: b.bestSeasonRank, format: "rank", lowerIsBetter: true },
    { key: "victories", label: "Victoires", group: "combat", a: a.victories, b: b.victories, format: "number" },
    { key: "defeats", label: "Défaites", group: "combat", a: a.defeats, b: b.defeats, format: "number", lowerIsBetter: true },
    { key: "winRate", label: "Taux de victoire", group: "combat", a: winRate(a), b: winRate(b), format: "percent" },
    { key: "warsWon", label: "Guerres gagnées", group: "combat", a: a.warsWon, b: b.warsWon, format: "number" },
    { key: "bossKills", label: "Boss abattus", group: "combat", a: a.bossKills, b: b.bossKills, format: "number" },
    { key: "bounties", label: "Primes remplies", group: "combat", a: a.bounties, b: b.bounties, format: "number" },
    { key: "missions", label: "Missions", group: "activite", a: a.missions, b: b.missions, format: "number" },
    { key: "expeditions", label: "Expéditions", group: "activite", a: a.expeditions, b: b.expeditions, format: "number" },
    { key: "seasonsPlayed", label: "Saisons classées", group: "activite", a: a.seasonsPlayed, b: b.seasonsPlayed, format: "number" },
    { key: "seniority", label: "Ancienneté", group: "activite", a: seniorityDays(a, now), b: seniorityDays(b, now), format: "days" },
  ];
  return raw.map((r) => {
    if (r.a === null || r.b === null) return { ...r, winner: null };
    if (r.a === r.b) return { ...r, winner: "tie" };
    const aBetter = r.lowerIsBetter ? r.a < r.b : r.a > r.b;
    return { ...r, winner: aBetter ? "a" : "b" };
  });
}

/** Score global : lignes gagnées de chaque côté. */
export function compareScore(rows: CompareRow[]): { a: number; b: number } {
  return rows.reduce((s, r) => ({ a: s.a + (r.winner === "a" ? 1 : 0), b: s.b + (r.winner === "b" ? 1 : 0) }), { a: 0, b: 0 });
}
