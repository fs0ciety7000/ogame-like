import { leviathanRanking, type BossReward, type LeviathanState } from "@/game/leviathan";

/* =====================================================
   v5.10 : Hall of fame des boss. À chaque distribution, le serveur archive
   un résumé du combat (game_config « boss_history ») : issue, durée,
   dégâts, participants, podium, coup de grâce. La page Hall of fame en
   tire l'historique et les records.
===================================================== */

export const BOSS_HISTORY_KEY = "boss_history";
const MAX_ENTRIES = 120;
/** v5.10.3 : participants gardés par combat (bilan rouvert depuis le Hall of fame). */
const MAX_RANKED = 150;

export type BossKind = "leviathan" | "seasonboss" | "allianceboss";

export const BOSS_KIND_LABELS: Record<BossKind, string> = {
  leviathan: "Boss mondial",
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
  /** v5.10.3 : classement complet et récompenses, pour rouvrir le bilan du combat. */
  ranking?: { uid: string; pseudo: string; damage: number; assaults: number }[];
  rewards?: Record<string, BossReward>;
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
    ranking: ranking.slice(0, MAX_RANKED).map((c) => ({ uid: c.uid, pseudo: c.pseudo, damage: c.damage, assaults: c.assaults })),
    ...(state.rewards ? { rewards: Object.fromEntries(ranking.slice(0, MAX_RANKED).filter((c) => state.rewards?.[c.uid]).map((c) => [c.uid, state.rewards![c.uid]])) } : {}),
  };
}

/**
 * v5.10.3 : état de combat reconstitué depuis une entrée du Hall of fame, pour
 * rouvrir le bilan. Les archives d'avant la 5.10.3 n'ont que le podium.
 */
export function bossHistoryState(e: BossHistoryEntry): { state: LeviathanState; complete: boolean; totals: { totalDamage: number; participants: number; assaults: number } } {
  const complete = Array.isArray(e.ranking) && e.ranking.length > 0;
  const rows = complete ? e.ranking! : e.top.map((t) => ({ ...t, assaults: 0 }));
  const contributions = Object.fromEntries(rows.map((r) => [r.uid, { pseudo: r.pseudo, damage: r.damage, assaults: r.assaults, lastLaunchMs: 0 }]));
  return {
    complete: complete || e.participants <= rows.length,
    totals: { totalDamage: e.totalDamage, participants: e.participants, assaults: e.assaults },
    state: {
      id: e.id.slice(e.id.indexOf(":") + 1),
      startMs: e.startMs,
      endMs: e.endedAtMs,
      endedAtMs: e.endedAtMs,
      maxHp: e.maxHp,
      hp: e.won ? 0 : Math.max(0, e.maxHp - e.totalDamage),
      status: e.won ? "killed" : "failed",
      contributions,
      rewarded: true,
      titleHolder: null,
      timeline: [],
      ...(e.rewards ? { rewards: e.rewards } : {}),
      ...(e.killedBy ? { killedBy: e.killedBy } : {}),
    },
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

/** v5.10.5 : rang d'un joueur dans un combat archivé (null s'il n'y figure pas). */
export function entryRank(e: BossHistoryEntry, uid: string): { rank: number; damage: number } | null {
  const rows = e.ranking && e.ranking.length ? e.ranking : e.top;
  const i = rows.findIndex((r) => r.uid === uid);
  return i < 0 ? null : { rank: i + 1, damage: rows[i].damage };
}

export interface MyBossStats {
  kind: BossKind;
  fights: number;
  wins: number;
  bestRank: number;
  bestDamage: number;
  finishers: number;
  /** Combat du meilleur rang. */
  best: { name: string; endedAtMs: number } | null;
}

/** v5.10.5 : bilan d'un joueur par type de boss (combats où il figure). */
export function myBossStats(list: BossHistoryEntry[], uid: string): MyBossStats[] {
  const out = new Map<BossKind, MyBossStats>();
  for (const e of list) {
    const me = entryRank(e, uid);
    if (!me) continue;
    const s = out.get(e.kind) ?? { kind: e.kind, fights: 0, wins: 0, bestRank: Infinity, bestDamage: 0, finishers: 0, best: null };
    s.fights++;
    if (e.won) s.wins++;
    if (e.killedBy?.uid === uid) s.finishers++;
    if (me.rank < s.bestRank) {
      s.bestRank = me.rank;
      s.best = { name: e.name, endedAtMs: e.endedAtMs };
    }
    s.bestDamage = Math.max(s.bestDamage, me.damage);
    out.set(e.kind, s);
  }
  return (Object.keys(BOSS_KIND_LABELS) as BossKind[]).map((k) => out.get(k)).filter((s): s is MyBossStats => !!s);
}
