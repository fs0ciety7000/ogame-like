import { pb } from "@/lib/pocketbase";
import type { AuditFlag, AuditWindow, BattlePair, XpSource, XpTotals } from "@/game/xpAudit";

/* 5.17.1 : audit de l'XP et de l'activité des joueurs (administration). */

export interface ActivityRow {
  uid: string;
  pseudo: string;
  xp: number;
  seasonXp: number;
  createdAtMs: number;
  lastActiveMs: number;
  online: boolean;
  testMode: boolean;
  allianceId: string;
  gained: XpTotals;
  gainedSource: "ledger" | "notifications";
  xp24h: number;
  missionXp24h: number;
  activeHours24h: number;
  battles: number;
  now: { missions: number; buildings: number; research: number; unitQueues: number; fleets: number };
  flags: AuditFlag[];
}

export interface ActivityOverview {
  now: number;
  window: AuditWindow;
  median24h: number;
  p90_24h: number;
  missionCeiling: number;
  missionCeiling24h: number;
  online: number;
  rows: ActivityRow[];
}

export interface PlayerAudit {
  now: number;
  player: {
    uid: string;
    pseudo: string;
    xp: number;
    seasonXp: number;
    seasonId: string;
    createdAtMs: number;
    lastActiveMs: number;
    online: boolean;
    testMode: boolean;
    vacation: unknown;
    allianceId: string;
    victories: number;
    defeats: number;
    ascensions: number;
    playtimeSeconds: number;
    achievements: number;
    activeDays: number;
  };
  stats: Record<string, unknown>;
  ledgerSinceMs: number | null;
  windows: Record<AuditWindow, { ledger: XpTotals; rebuilt: XpTotals; missionCeiling: number }>;
  activity: { activeHours24h: number; longestStreak7d: number; byHour24: number[]; xpByHour7d: number[] };
  comparison: { median24h: number; p90_24h: number; activePlayers: number };
  flags: AuditFlag[];
  current: {
    missions: { key: string; name: string; endTime: number }[];
    buildings: { id: string; endTime: number }[];
    research: { id: string; endTime: number }[];
    unitQueues: number;
    fleets: { id: string; mission: string; status: string; targetPseudo: string; arriveAtMs: number; returnAtMs: number }[];
  };
  battles: { id: string; attackerUid: string; attackerPseudo: string; defenderUid: string; defenderPseudo: string; outcome: string; timestamp: number; attackerXpDelta: number; defenderXpDelta: number; attackerPower: number; defenderPower: number }[];
  battleCount: number;
  pairs: BattlePair[];
  trades: { id: string; sellerPseudo: string; buyerPseudo: string; giveRes: string; giveAmount: number; wantRes: string; wantAmount: number; filledAtMs: number }[];
  gifts: { id: string; fromPseudo: string; toPseudo: string; resources: Record<string, number>; timestamp: number }[];
  adminLogs: { id: string; actorName: string; action: string; recordLabel: string; reason: string; changes: unknown; createdAtMs: number }[];
  timeline: { kind: string; title: string; message: string; createdAtMs: number; xp: number; source: XpSource }[];
}

export function fetchActivity(window: AuditWindow): Promise<ActivityOverview> {
  return pb.send(`/api/cosmic/admin/activity?window=${window}`, { method: "GET", requestKey: null });
}

export function fetchPlayerAudit(q: string): Promise<PlayerAudit> {
  return pb.send(`/api/cosmic/admin/player-audit?q=${encodeURIComponent(q)}`, { method: "GET", requestKey: null });
}
