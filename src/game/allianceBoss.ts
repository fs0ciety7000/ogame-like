import { GameActionError } from "@/game/errors";
import { hasAlliancePerm } from "@/game/allianceProfile";
import { parisLocalToUtc, parisWhenLabel } from "@/game/events";
import { computeFullPower } from "@/game/combat";
import { OFFENSIVE_UNITS } from "@/game/units";
import { FEED_MAX, leviathanRanking, type LeviathanState } from "@/game/leviathan";
import { productionHours } from "@/game/pirates";
import { addPassPoints } from "@/game/seasonPass";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import { parisDay } from "@/game/retention";
import type { Alliance, PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v4.6 : boss d'alliance. Une fois par semaine (lundi → dimanche, heure
   de Paris), le fondateur ou un officier l'appelle en payant 3 h de
   production cumulée des membres sur le trésor. 24 h pour l'abattre, un
   assaut toutes les 4 h par membre (moteur du Léviathan).
===================================================== */

export const ALLIANCE_BOSS_RULES = {
  /** Structure : ce facteur × puissance d'attaque des membres actifs (7 j). */
  hpFactor: 2.5,
  minHp: 50_000,
  durationHours: 24,
  cooldownHours: 4,
  flightMinutes: 20,
  /** Coût d'appel : heures de production cumulée de tous les membres. */
  costHours: 3,
  /** Part du coût rendue au trésor si le boss tombe. */
  refundPct: 0.5,
  /** Part minimale des dégâts pour être récompensé. */
  minSharePct: 0.05,
  rewardHours: 2,
  killPoints: 40,
  failPoints: 15,
};

export interface AllianceBossDef {
  id: string;
  name: string;
  image: string;
  lore: string;
}

export const DEFAULT_ALLIANCE_BOSSES: AllianceBossDef[] = [
  { id: "gravhorn", name: "Cuirassé Gravhorn", image: "/assets/story/gravhorn.webp", lore: "Un cuirassé du Syndicat, blindé comme un coffre-fort, venu saisir les dettes de ton alliance." },
  { id: "kesh", name: "Nid-mère Kesh'Vaar", image: "/assets/bounties/hunters.webp", lore: "Une ruche renégate en dérive : chaque heure, de nouvelles larves éclosent dans ses flancs." },
  { id: "confrerie", name: "Croiseur de la Confrérie", image: "/assets/story/varan.webp", lore: "Un croiseur de Varan, envoyé pour rayer ton alliance de la Liste. À coups de canon." },
];

/** Catalogue en vigueur (5.15 : réglable dans l'administration, règles « allianceBoss.bosses »). */
export const ALLIANCE_BOSSES: AllianceBossDef[] = DEFAULT_ALLIANCE_BOSSES.map((b) => ({ ...b }));

export function setAllianceBosses(defs: AllianceBossDef[] | undefined): void {
  const list = (defs ?? []).filter((b) => b && /^[a-z0-9_]+$/.test(b.id ?? "") && String(b.name ?? "").trim());
  ALLIANCE_BOSSES.splice(0, ALLIANCE_BOSSES.length, ...(list.length ? list : DEFAULT_ALLIANCE_BOSSES).map((b) => ({ ...b })));
}

export interface AllianceBossState extends LeviathanState {
  weekId: string;
  bossId: string;
  launchedBy: string;
  cost: Partial<Record<ResourceId, number>>;
}

const DAY = 24 * 3600_000;
const HOUR = 3600_000;

/** Semaine en cours (lundi, heure de Paris) : identifiant AAAA-MM-JJ du lundi. */
export function allianceWeekId(now: number): string {
  const day = parisDay(now);
  const t = Date.parse(`${day}T00:00:00Z`);
  const dow = new Date(t).getUTCDay();
  return new Date(t - ((dow + 6) % 7) * DAY).toISOString().slice(0, 10);
}

/** v5.10.5 : début de la semaine suivante (lundi 0 h, heure de Paris) : nouvel appel possible. */
export function allianceNextWeekMs(now: number): number {
  return parisLocalToUtc(Date.parse(`${allianceWeekId(now)}T00:00:00Z`) + 7 * DAY);
}

/** Boss de la semaine (rotation de trois). */
export function allianceBossOfWeek(now: number): AllianceBossDef {
  const monday = Date.parse(`${allianceWeekId(now)}T00:00:00Z`);
  const index = Math.floor(monday / (7 * DAY));
  return ALLIANCE_BOSSES[((index % ALLIANCE_BOSSES.length) + ALLIANCE_BOSSES.length) % ALLIANCE_BOSSES.length];
}

export function allianceBossDef(state: Pick<AllianceBossState, "bossId">): AllianceBossDef {
  return ALLIANCE_BOSSES.find((b) => b.id === state.bossId) ?? ALLIANCE_BOSSES[0];
}

export function normalizeAllianceBoss(raw: unknown): AllianceBossState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<AllianceBossState>;
  if (!r.id || !(Number(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs) || 0,
    maxHp: Number(r.maxHp),
    hp: Math.max(0, Number(r.hp) || 0),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
    endedAtMs: Number(r.endedAtMs) || 0,
    rewarded: r.rewarded === true,
    titleHolder: null,
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
    weekId: String(r.weekId ?? ""),
    bossId: String(r.bossId ?? ALLIANCE_BOSSES[0].id),
    launchedBy: String(r.launchedBy ?? ""),
    cost: r.cost && typeof r.cost === "object" ? r.cost : {},
    ...(r.rewards && typeof r.rewards === "object" ? { rewards: r.rewards } : {}),
    ...(r.killedBy && r.killedBy.uid ? { killedBy: { uid: String(r.killedBy.uid), pseudo: String(r.killedBy.pseudo ?? "") } } : {}),
    ...(Array.isArray(r.feed) ? { feed: r.feed.filter((f) => f && Number.isFinite(f.t)).slice(-FEED_MAX) } : {}),
  };
}

/** Coût d'appel : heures de production cumulée de tous les membres. */
export function allianceBossCost(members: Pick<PlayerState, "buildings" | "techLevels">[]): Partial<Record<ResourceId, number>> {
  const cost: Partial<Record<ResourceId, number>> = {};
  for (const m of members) {
    for (const [res, n] of Object.entries(productionHours(m, ALLIANCE_BOSS_RULES.costHours)) as [ResourceId, number][]) cost[res] = (cost[res] ?? 0) + n;
  }
  for (const k of Object.keys(cost) as ResourceId[]) cost[k] = Math.ceil(cost[k] ?? 0);
  return cost;
}

export function allianceBossHp(activeMembers: Pick<PlayerState, "units" | "techLevels">[]): number {
  const power = activeMembers.reduce((a, p) => a + computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]), 0);
  return Math.max(ALLIANCE_BOSS_RULES.minHp, Math.round(power * ALLIANCE_BOSS_RULES.hpFactor));
}

export function canCallAllianceBoss(alliance: Pick<Alliance, "createdBy" | "roles" | "members"> & { profile?: unknown }, uid: string): boolean {
  // v5.10.5 : droit « Boss » (fondateur, officiers, ou rang personnalisé).
  return hasAlliancePerm({ ...alliance, members: alliance.members ?? [uid] }, uid, "boss");
}

/** Appel du boss : rôle, une fois par semaine, trésor suffisant. Débite le trésor. */
export function callAllianceBoss(
  alliance: Alliance,
  previous: AllianceBossState | null,
  members: PlayerState[],
  activeMembers: PlayerState[],
  uid: string,
  now: number,
  /** v5.14.2 : boss mondial présent (en alternance : pas d'appel pendant son passage). */
  worldBoss: { endMs: number } | null = null,
): AllianceBossState {
  if (!canCallAllianceBoss(alliance, uid)) throw new GameActionError("Seuls le fondateur et les officiers peuvent appeler le boss d'alliance.");
  const weekId = allianceWeekId(now);
  if (previous && previous.weekId === weekId) throw new GameActionError("Le boss d'alliance a déjà été appelé cette semaine (prochain lundi).");
  if (worldBoss && worldBoss.endMs > now) throw new GameActionError(`En alternance avec le boss mondial : il est là jusqu'au ${parisWhenLabel(worldBoss.endMs)}. Appelle le boss d'alliance après son départ.`);
  const cost = allianceBossCost(members);
  const treasury = { ...(alliance.treasury ?? {}) };
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) {
    if ((treasury[res] ?? 0) < n) throw new GameActionError("Le trésor de l'alliance ne suffit pas pour appeler le boss.");
  }
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) treasury[res] = (treasury[res] ?? 0) - n;
  alliance.treasury = treasury;
  const boss = allianceBossOfWeek(now);
  const maxHp = allianceBossHp(activeMembers);
  const endMs = now + ALLIANCE_BOSS_RULES.durationHours * HOUR;
  return { id: `ab-${weekId}`, startMs: now, endMs, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [{ t: now, hp: maxHp }], weekId, bossId: boss.id, launchedBy: uid, cost };
}

/** Lancement d'un assaut : boss présent, délai de 4 h respecté. */
export function checkAllianceBossLaunch(state: AllianceBossState | null, uid: string, pseudo: string, now: number): AllianceBossState {
  if (!state || state.status !== "active" || now < state.startMs || now >= state.endMs || state.hp <= 0) throw new GameActionError("Aucun boss d'alliance à combattre en ce moment.");
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + ALLIANCE_BOSS_RULES.cooldownHours * HOUR - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 60_000)} min.`);
  return { ...state, contributions: { ...state.contributions, [uid]: { pseudo, damage: c?.damage ?? 0, assaults: c?.assaults ?? 0, lastLaunchMs: now } } };
}

/** Remboursement au trésor quand le boss tombe. */
export function allianceBossRefund(state: AllianceBossState): Partial<Record<ResourceId, number>> {
  if (state.status !== "killed") return {};
  return Object.fromEntries(Object.entries(state.cost).map(([r, n]) => [r, Math.floor((n ?? 0) * ALLIANCE_BOSS_RULES.refundPct)]));
}

/** Récompense d'un participant. */
export function grantAllianceBossReward(
  state: AllianceBossState,
  player: PlayerState,
  now: number,
  random: () => number = Math.random,
): { points: number; gain: Partial<Record<ResourceId, number>>; relic?: string } {
  const ranking = leviathanRanking(state);
  const total = ranking.reduce((a, c) => a + c.damage, 0);
  const mine = state.contributions[player.uid]?.damage ?? 0;
  if (!(mine > 0)) return { points: 0, gain: {} };
  if (state.status !== "killed") {
    addPassPoints(player, "allianceBossTry", now);
    return { points: ALLIANCE_BOSS_RULES.failPoints, gain: {} };
  }
  if (mine < total * ALLIANCE_BOSS_RULES.minSharePct) {
    addPassPoints(player, "allianceBossTry", now);
    return { points: ALLIANCE_BOSS_RULES.failPoints, gain: {} };
  }
  addPassPoints(player, "allianceBoss", now);
  const gain = productionHours(player, ALLIANCE_BOSS_RULES.rewardHours);
  for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  if (ranking[0]?.uid === player.uid) {
    const item = rollRelic("allianceBoss", now, random, "rare");
    if (addRelic(player, item)) return { points: ALLIANCE_BOSS_RULES.killPoints, gain, relic: relicLabel(item) };
  }
  return { points: ALLIANCE_BOSS_RULES.killPoints, gain };
}

