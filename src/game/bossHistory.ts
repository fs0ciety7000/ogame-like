import { leviathanRanking, type LeviathanState } from "@/game/leviathan";

/* =====================================================
   v5.10 : Hall of fame des boss. À chaque distribution, le serveur archive
   un résumé du combat (game_config « boss_history ») : issue, durée,
   dégâts, participants, podium, coup de grâce. La page Hall of fame en
   tire l'historique et les records.
===================================================== */

export const BOSS_HISTORY_KEY = "boss_history";
const MAX_ENTRIES = 120;

export type BossKind = "leviathan" | "seasonboss" | "allianceboss";

export const BOSS_KIND_LABELS: Record<BossKind, string> = {
  leviathan: "Léviathan",
  seasonboss: "Boss de saison",
  allianceboss: "Boss d'alliance",
};

export interface BossHistoryEntry {
  id: string;
  kind: BossKind;
  name: string;
  image?: string;
  /** Boss d'alliance : l'alliance qui l'a affronté. */
  allianceId?: string;
  allianceName?: string;
  startMs: number;
  endedAtMs: number;
  won: boolean;
  maxHp: number;
  totalDamage: number;
  participants: number;
  assaults: number;
  top: { uid: string; pseudo: string; damage: number }[];
  killedBy?: { uid: string; pseudo: string };
}

export function bossHistoryEntry(kind: BossKind, state: LeviathanState, meta: { name: string; image?: string; allianceId?: string; allianceName?: string }): BossHistoryEntry {
  const ranking = leviathanRanking(state);
  const ended = state.endedAtMs || state.endMs;
  return {
    id: `${kind}:${state.id}`,
    kind,
    name: meta.name,
    ...(meta.image ? { image: meta.image } : {}),
    ...(meta.allianceId ? { allianceId: meta.allianceId, allianceName: meta.allianceName ?? "" } : {}),
    startMs: state.startMs,
    endedAtMs: ended,
    won: state.status === "killed",
    maxHp: state.maxHp,
    totalDamage: ranking.reduce((a, c) => a + c.damage, 0),
    participants: ranking.length,
    assaults: ranking.reduce((a, c) => a + c.assaults, 0),
    top: ranking.slice(0, 5).map((c) => ({ uid: c.uid, pseudo: c.pseudo, damage: c.damage })),
    ...(state.killedBy ? { killedBy: state.killedBy } : {}),
  };
}

export function normalizeBossHistory(raw: unknown): BossHistoryEntry[] {
  const list = raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries) ? (raw as { entries: unknown[] }).entries : [];
  return list.filter((e): e is BossHistoryEntry => !!e && typeof e === "object" && typeof (e as BossHistoryEntry).id === "string" && (e as BossHistoryEntry).kind in BOSS_KIND_LABELS);
}

/** Ajoute (ou remplace, même id) une entrée ; la plus récente d'abord. */
export function pushBossHistory(list: BossHistoryEntry[], entry: BossHistoryEntry): BossHistoryEntry[] {
  return [entry, ...list.filter((e) => e.id !== entry.id)].sort((a, b) => b.endedAtMs - a.endedAtMs).slice(0, MAX_ENTRIES);
}

export interface BossRecords {
  /** Plus gros total de dégâts d'un joueur sur un seul boss. */
  bestHit: { uid: string; pseudo: string; damage: number; boss: string } | null;
  /** Victoire la plus rapide (durée du combat). */
  fastest: { name: string; durationMs: number; endedAtMs: number } | null;
  /** Joueurs les plus souvent au coup de grâce. */
  finishers: { uid: string; pseudo: string; count: number }[];
  /** Joueurs les plus souvent n° 1 des dégâts. */
  champions: { uid: string; pseudo: string; count: number }[];
  kills: number;
  fights: number;
}

export function bossRecords(list: BossHistoryEntry[]): BossRecords {
  let bestHit: BossRecords["bestHit"] = null;
  let fastest: BossRecords["fastest"] = null;
  const fin = new Map<string, { uid: string; pseudo: string; count: number }>();
  const champ = new Map<string, { uid: string; pseudo: string; count: number }>();
  for (const e of list) {
    const first = e.top[0];
    if (first && (!bestHit || first.damage > bestHit.damage)) bestHit = { uid: first.uid, pseudo: first.pseudo, damage: first.damage, boss: e.name };
    if (e.won) {
      const d = e.endedAtMs - e.startMs;
      if (d > 0 && (!fastest || d < fastest.durationMs)) fastest = { name: e.name, durationMs: d, endedAtMs: e.endedAtMs };
      if (first) champ.set(first.uid, { uid: first.uid, pseudo: first.pseudo, count: (champ.get(first.uid)?.count ?? 0) + 1 });
      if (e.killedBy) fin.set(e.killedBy.uid, { ...e.killedBy, count: (fin.get(e.killedBy.uid)?.count ?? 0) + 1 });
    }
  }
  const sort = (m: Map<string, { uid: string; pseudo: string; count: number }>) => [...m.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  return { bestHit, fastest, finishers: sort(fin), champions: sort(champ), kills: list.filter((e) => e.won).length, fights: list.length };
}
