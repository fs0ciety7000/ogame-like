import { allianceSiegeFactor } from "@/game/alliances";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import { computeFleetPower, computeFullPower, pveAttackFactor } from "@/game/combat";
import { getRepairPercent } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import { BOSS_REMINDERS, bossWindows, EVENT_RULES, parisOffsetMs, type BossSchedule } from "@/game/events";
import { findWorldBoss, WORLD_BOSS_RULES, weekOfLocal, worldBossOfWeek, type WorldBossDef } from "@/game/worldBosses";
import { formationEffects } from "@/game/formations";
import { productionHours } from "@/game/pirates";
import { bumpStat } from "@/game/stats";
import { bountyState } from "@/game/bounties";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Boss mondial « Le Léviathan » (v3.1) : le premier week-end de chaque
   mois, de vendredi 18 h à lundi 18 h (heure de Paris), à la place de
   l'événement de la semaine. Tout le serveur l'attaque : ses points de
   structure valent plusieurs fois la puissance d'attaque cumulée des
   joueurs actifs. Récompenses selon la part des dégâts, réduites de moitié
   s'il survit. État stocké dans game_config (clé « leviathan »).
===================================================== */

export const LEVIATHAN_KEY = "leviathan";

/** v5.10.5 : entrées gardées dans le fil du combat. */
export const FEED_MAX = 40;

export const LEVIATHAN_RULES = {
  name: "Le Léviathan",
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs (7 j). */
  hpFactor: 4,
  minHp: 100_000,
  durationHours: 72,
  /** v5.10.4 : heure d'apparition le vendredi (heure de Paris). Le week-end du mois et
   *  l'activation sont dans les règles des événements (bossWeekend, bossMonthly). */
  startHour: 18,
  /** Un assaut toutes les N heures par joueur. */
  cooldownHours: 4,
  /** Trajet aller (et retour), en minutes. */
  flightMinutes: 30,
  /** Part de chaque type de vaisseau détruite à chaque assaut (réparable à l'Atelier). */
  lossPct: 0.08,
  /** Récompense : base + bonus × √(dégâts / dégâts du premier), en heures de production.
   *  v5.13 : racine carrée, pour que les gros participants ne soient plus loin derrière le premier. */
  baseRewardHours: 3,
  bonusRewardHours: 12,
  /** v5.13 : bonus du podium (1er, 2e, 3e) quand le Léviathan tombe, en heures de production. */
  podiumHours: [6, 4, 2],
  /** v5.13 : reliques épiques pour les N premiers (rare pour les autres participants). */
  topRelics: 3,
  /** v5.13 : Ambre versée à la place d'une relique quand la collection est pleine. */
  relicAmber: { epic: 60, rare: 30 },
  /** Récompenses si le Léviathan survit. */
  failedRewardFactor: 0.5,
  title: "Fléau du Léviathan",
  titleDays: 7,
};

export interface LeviathanContribution {
  pseudo: string;
  damage: number;
  assaults: number;
  lastLaunchMs: number;
}

export interface LeviathanState {
  id: string;
  /** v5.14 : boss mondial de la semaine (worldBosses.ts) ; absent : Léviathan. */
  bossId?: string;
  startMs: number;
  endMs: number;
  maxHp: number;
  hp: number;
  status: "active" | "killed" | "failed";
  contributions: Record<string, LeviathanContribution>;
  endedAtMs: number;
  rewarded: boolean;
  /** Titre temporaire du premier en dégâts. */
  titleHolder: { uid: string; untilMs: number; /** v5.14 : titre du boss abattu. */ title?: string } | null;
  /** Relevé horaire des points de structure (suivi admin, v3.3). */
  timeline: { t: number; hp: number }[];
  /** v5.9 : récompenses remises à chaque participant (bilan affiché après le combat). */
  rewards?: Record<string, BossReward>;
  /** v5.10 : auteur du coup de grâce. */
  killedBy?: { uid: string; pseudo: string };
  /** v5.10 : combat archivé dans le Hall of fame. */
  archived?: boolean;
  /** v5.10.2 : coup de grâce recherché pour un combat d'avant la 5.10 (une seule fois). */
  legacyChecked?: boolean;
  /** v5.10.5 : rappel « plus que N heures » déjà envoyé. */
  endingNotified?: boolean;
  /** v5.10.5 : fil des derniers assauts. */
  feed?: BossFeedEntry[];
}

/** v5.9 : ce qu'un participant a reçu à la fin d'un boss. */
export interface BossReward {
  gain?: Partial<Record<string, number>>;
  points?: number;
  title?: string;
  relic?: string;
  mythic?: string;
  /** v5.12 : jetons du casino. */
  tokens?: number;
}

/** v5.9 : bilan d'un boss terminé (abattu ou retiré) pour un joueur. */
export interface BossRecap {
  won: boolean;
  durationMs: number;
  totalDamage: number;
  participants: number;
  assaults: number;
  hpDealtPct: number;
  top: { uid: string; pseudo: string; damage: number; assaults: number; share: number; rank: number }[];
  mine: { rank: number; damage: number; assaults: number; share: number } | null;
  reward: BossReward | null;
}

/** totals : chiffres du combat entier quand l'état ne garde qu'une partie des participants (archive du Hall of fame). */
export function bossRecap(state: LeviathanState, uid: string, topCount = 5, totals?: { totalDamage: number; participants: number; assaults: number }): BossRecap {
  const ranking = leviathanRanking(state);
  const totalDamage = totals?.totalDamage ?? ranking.reduce((a, c) => a + c.damage, 0);
  const share = (d: number) => (totalDamage > 0 ? d / totalDamage : 0);
  const myIndex = ranking.findIndex((c) => c.uid === uid);
  const me = myIndex >= 0 ? ranking[myIndex] : null;
  const end = state.endedAtMs || state.endMs;
  return {
    won: state.status === "killed",
    durationMs: Math.max(0, end - state.startMs),
    totalDamage,
    participants: totals?.participants ?? ranking.length,
    assaults: totals?.assaults ?? ranking.reduce((a, c) => a + c.assaults, 0),
    hpDealtPct: state.maxHp > 0 ? Math.min(1, (state.maxHp - state.hp) / state.maxHp) : 0,
    top: ranking.slice(0, topCount).map((c, i) => ({ uid: c.uid, pseudo: c.pseudo, damage: c.damage, assaults: c.assaults, share: share(c.damage), rank: i + 1 })),
    mine: me ? { rank: myIndex + 1, damage: me.damage, assaults: me.assaults, share: share(me.damage) } : null,
    reward: state.rewards?.[uid] ?? null,
  };
}

const HOUR = 3600_000;

export function normalizeLeviathan(raw: unknown): LeviathanState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<LeviathanState>;
  if (!r.id || !(Number(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    ...(r.bossId ? { bossId: String(r.bossId) } : {}),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs) || 0,
    maxHp: Number(r.maxHp),
    hp: Math.max(0, Number(r.hp) || 0),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
    endedAtMs: Number(r.endedAtMs) || 0,
    rewarded: r.rewarded === true,
    titleHolder: r.titleHolder && r.titleHolder.uid ? r.titleHolder : null,
    timeline: Array.isArray(r.timeline) ? r.timeline.filter((p) => p && Number.isFinite(p.t) && Number.isFinite(p.hp)) : [],
    ...(r.rewards && typeof r.rewards === "object" ? { rewards: r.rewards } : {}),
    ...(r.killedBy && r.killedBy.uid ? { killedBy: { uid: String(r.killedBy.uid), pseudo: String(r.killedBy.pseudo ?? "") } } : {}),
    ...(r.archived === true ? { archived: true } : {}),
    ...(r.legacyChecked === true ? { legacyChecked: true } : {}),
    ...(r.endingNotified === true ? { endingNotified: true } : {}),
    ...(Array.isArray(r.feed) ? { feed: r.feed.filter((f) => f && Number.isFinite(f.t)).slice(-FEED_MAX) } : {}),
  };
}

/**
 * v5.10.2 : coup de grâce d'un boss abattu avant la 5.10 (non enregistré à l'époque).
 * Le dernier assaut arrivé avant la chute : son lancement + le trajet tombe au plus
 * tard à la mort du boss (un assaut arrivé après rebondit sans dégâts).
 */
export function inferKilledBy(state: LeviathanState, flightMinutes = LEVIATHAN_RULES.flightMinutes): { uid: string; pseudo: string } | null {
  if (state.status !== "killed" || state.killedBy) return state.killedBy ?? null;
  const end = state.endedAtMs || state.endMs;
  let best: { uid: string; pseudo: string; at: number } | null = null;
  for (const [uid, c] of Object.entries(state.contributions)) {
    // Assaut daté d'avant le combat : donnée incomplète, rien à en tirer.
    if (!c || !(c.damage > 0) || !(c.lastLaunchMs >= state.startMs)) continue;
    const at = c.lastLaunchMs + flightMinutes * 60_000;
    // Une minute de marge : l'arrivée est traitée par une tâche planifiée.
    if (at > end + 60_000) continue;
    if (!best || at > best.at) best = { uid, pseudo: c.pseudo, at };
  }
  return best ? { uid: best.uid, pseudo: best.pseudo } : null;
}

/** v5.10.4 : occurrence du Léviathan (réglable dans l'administration).
 *  v5.14 : par défaut, boss mondiaux en rotation hebdomadaire (un jour différent
 *  chaque semaine, au moins WORLD_BOSS_RULES.minGapDays jours d'écart, sans chevauchement). */
export function leviathanSchedule(): BossSchedule {
  const weekly = EVENT_RULES.bossWeekly !== false;
  const minGapDays = Math.min(6, Math.max(WORLD_BOSS_RULES.minGapDays, Math.ceil(LEVIATHAN_RULES.durationHours / 24)));
  return {
    enabled: weekly || EVENT_RULES.bossMonthly !== false,
    weekend: EVENT_RULES.bossWeekend ?? "first",
    startHour: LEVIATHAN_RULES.startHour ?? 18,
    durationHours: LEVIATHAN_RULES.durationHours,
    dates: EVENT_RULES.bossDates ?? [],
    ...(weekly ? { weekly: { minGapDays } } : {}),
  };
}

/** v5.14 : boss mondial d'une apparition (rotation des six selon la semaine). */
export function worldBossForStart(startMs: number): WorldBossDef {
  return EVENT_RULES.bossWeekly === false ? findWorldBoss("leviathan") : worldBossOfWeek(weekOfLocal(startMs + parisOffsetMs(startMs)));
}

/** v5.14 : identité du boss d'un combat (Léviathan pour les combats d'avant la 5.14). */
export function worldBossOf(state: Pick<LeviathanState, "bossId"> | null | undefined): WorldBossDef {
  return findWorldBoss(state?.bossId);
}

export const worldBossName = (state: Pick<LeviathanState, "bossId"> | null | undefined): string => worldBossOf(state).name;
export const worldBossTitle = (state: Pick<LeviathanState, "bossId"> | null | undefined): string => worldBossOf(state).title;

/** Fenêtre mensuelle en cours (ou null). */
export function leviathanWindow(now: number): { id: string; startMs: number; endMs: number } | null {
  const [w] = bossWindows(now, leviathanSchedule(), 1);
  if (!w || now < w.startMs) return null;
  return { id: `lev-${w.startMs}`, startMs: w.startMs, endMs: w.endMs };
}

/** Prochain départ du Léviathan (affichage) : la fenêtre en cours si elle n'est pas finie. */
export function nextLeviathanStart(now: number): number | null {
  return bossWindows(now, leviathanSchedule(), 1)[0]?.startMs ?? null;
}

/** v5.10 : prochaine apparition strictement à venir (pas la fenêtre en cours, déjà ouverte). */
export function upcomingLeviathanStart(now: number): number | null {
  const n = nextLeviathanStart(now);
  if (n === null || n > now) return n;
  return nextLeviathanStart(n + LEVIATHAN_RULES.durationHours * HOUR);
}

export function isActive(state: LeviathanState | null, now: number): boolean {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs && state.hp > 0;
}

/** v5.10.2 : état affiché d'un boss (pages et menu). Un combat dont le temps est écoulé
 *  mais pas encore clôturé par le serveur compte déjà comme terminé. */
export type BossPhase = "dormant" | "active" | "killed" | "failed";

export function bossPhase(state: LeviathanState | null, now: number): BossPhase {
  if (!state) return "dormant";
  if (isActive(state, now)) return "active";
  return state.status === "killed" || state.hp <= 0 ? "killed" : "failed";
}

/** Points de structure : facteur × puissance d'attaque de toute la flotte des joueurs actifs. */
export function leviathanHp(activePlayers: Pick<PlayerState, "units" | "techLevels">[]): number {
  const power = activePlayers.reduce((a, p) => a + computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]), 0);
  return Math.max(LEVIATHAN_RULES.minHp, Math.round(power * LEVIATHAN_RULES.hpFactor));
}

export function spawnLeviathan(window: { id: string; startMs: number; endMs: number }, activePlayers: Pick<PlayerState, "units" | "techLevels">[], previous: LeviathanState | null, bossId?: string): LeviathanState {
  // v5.14 : le boss de la semaine (ou celui choisi par l'équipe), avec sa propre résistance.
  const boss = bossId ? findWorldBoss(bossId) : worldBossForStart(window.startMs);
  const maxHp = Math.max(LEVIATHAN_RULES.minHp, Math.round(leviathanHp(activePlayers) * boss.hpMult));
  return { ...window, bossId: boss.id, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: previous?.titleHolder ?? null, timeline: [{ t: window.startMs, hp: maxHp }] };
}

/** Lancement d'un assaut : Léviathan présent et délai respecté. */
export function checkLeviathanLaunch(state: LeviathanState | null, uid: string, pseudo: string, now: number): LeviathanState {
  if (!state || !isActive(state, now)) throw new GameActionError(`${worldBossName(state)} n'est pas là en ce moment.`);
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * HOUR - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 60_000)} min.`);
  return { ...state, contributions: { ...state.contributions, [uid]: { pseudo, damage: c?.damage ?? 0, assaults: c?.assaults ?? 0, lastLaunchMs: now } } };
}

/* =====================================================
   v5.10.5 : phases de combat. Sous 50 % de structure, le boss riposte
   (pertes accrues) ; sous 25 %, il se replie derrière un bouclier
   (dégâts réduits) mais révèle une faiblesse à un type de vaisseau.
===================================================== */

export const BOSS_PHASE_RULES = {
  /** Phase 2 sous cette part de structure : riposte. */
  ripostePct: 0.5,
  riposteLossFactor: 1.5,
  /** Phase 3 sous cette part : bouclier et faiblesse. */
  shieldPct: 0.25,
  shieldDamageFactor: 0.85,
  weaknessFactor: 1.5,
};

/** Vaisseaux qui peuvent être la faiblesse d'un boss (s'ils existent dans le contenu). */
const WEAKNESS_POOL = ["fregate", "chasseur", "intercepteur", "croiseur_nova", "lance_gravitationnelle", "etoile_noire"];

export type BossFightPhase = 1 | 2 | 3;

export function bossFightPhase(state: Pick<LeviathanState, "hp" | "maxHp">): BossFightPhase {
  const pct = state.maxHp > 0 ? state.hp / state.maxHp : 0;
  return pct <= BOSS_PHASE_RULES.shieldPct ? 3 : pct <= BOSS_PHASE_RULES.ripostePct ? 2 : 1;
}

/** Faiblesse de phase 3 : un type de vaisseau tiré de l'identifiant du combat (stable).
 *  v5.14 : parmi les faiblesses propres au boss mondial du combat. */
export function bossWeakness(state: Pick<LeviathanState, "id"> & { bossId?: string }): string {
  const own = state.bossId ? findWorldBoss(state.bossId).weakness.filter((id) => OFFENSIVE_UNITS.includes(id)) : [];
  const pool = own.length ? own : WEAKNESS_POOL.filter((id) => OFFENSIVE_UNITS.includes(id));
  const list = pool.length ? pool : OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage");
  let h = 0;
  for (const ch of state.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list.length ? list[h % list.length] : "";
}

export const BOSS_PHASE_INFO: Record<BossFightPhase, { name: string; desc: string }> = {
  1: { name: "Assaut", desc: "Le colosse encaisse sans broncher." },
  2: { name: "Riposte", desc: `Blessé, il riposte : pertes ×${BOSS_PHASE_RULES.riposteLossFactor} à chaque assaut.` },
  3: { name: "Carapace fissurée", desc: `Il se replie derrière un bouclier (−${Math.round((1 - BOSS_PHASE_RULES.shieldDamageFactor) * 100)} % de dégâts), mais sa faiblesse est exposée : +${Math.round((BOSS_PHASE_RULES.weaknessFactor - 1) * 100)} % de dégâts pour ce type de vaisseau.` },
};

/** v5.14 : nom et récit d'une phase pour le boss du combat (la mécanique reste commune). */
export function bossPhaseLabel(state: { bossId?: string } | null | undefined, phase: BossFightPhase): { name: string; desc: string } {
  if (!state?.bossId) return BOSS_PHASE_INFO[phase];
  const own = findWorldBoss(state.bossId).phases[phase - 1];
  return { name: own.name, desc: `${own.flavor} ${BOSS_PHASE_INFO[phase].desc}`.replace(" Le colosse encaisse sans broncher.", "") };
}

/** Dégâts et pertes d'un assaut selon la flotte, la formation et la phase du boss (sert aussi à l'estimation). */
export function bossAssaultEstimate(
  state: Pick<LeviathanState, "id" | "hp" | "maxHp">,
  player: Pick<PlayerState, "units" | "techLevels" | "allianceResearch"> & Partial<PlayerState>,
  fleet: Record<string, number>,
  formation: string | undefined,
): { power: number; lossPct: number; phase: BossFightPhase } {
  const fx = formationEffects(formation);
  const base = computeFleetPower(player.units, player.techLevels, fleet, ["attack"]);
  const phase = bossFightPhase(state);
  let phaseFactor = 1;
  if (phase === 3 && base > 0) {
    const weak = bossWeakness(state);
    const weakPower = fleet[weak] ? computeFleetPower(player.units, player.techLevels, { [weak]: fleet[weak] }, ["attack"]) : 0;
    const share = Math.min(1, weakPower / base);
    phaseFactor = share * BOSS_PHASE_RULES.weaknessFactor + (1 - share) * BOSS_PHASE_RULES.shieldDamageFactor;
  }
  const mods = playerModifiers(player as PlayerState);
  const power = Math.round(base * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + mods.attack) * (1 + mods.bossDamage) * phaseFactor);
  const lossMult = "bossId" in state && state.bossId ? findWorldBoss(String(state.bossId)).lossMult : 1;
  const lossPct = Math.min(1, LEVIATHAN_RULES.lossPct * lossMult * fx.attackerLossFactor * (phase >= 2 ? BOSS_PHASE_RULES.riposteLossFactor : 1));
  return { power, lossPct, phase };
}

/** v5.10.5 : fil du combat (derniers assauts et changements de phase). */
export interface BossFeedEntry {
  t: number;
  uid?: string;
  pseudo?: string;
  damage?: number;
  killed?: boolean;
  /** Entrée de changement de phase. */
  phase?: BossFightPhase;
}


/** Assaut à l'arrivée : dégâts, pertes de la flotte (réparées en partie). */
export function resolveLeviathanAssault(
  state: LeviathanState,
  player: PlayerState,
  fleet: Record<string, number>,
  formation: string | undefined,
  now: number,
): { state: LeviathanState; damage: number; survivors: Record<string, number>; lost: Record<string, number>; killed: boolean } {
  const { power, lossPct } = bossAssaultEstimate(state, player, fleet, formation);
  const active = isActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = withRepairBonus(getRepairPercent(player.buildings), player);
  const survivors: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const gone = raw - Math.floor(raw * repair);
    if (gone > 0) lost[id] = gone;
    survivors[id] = qty - gone;
  }
  const c = state.contributions[player.uid] ?? { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: now };
  const hp = state.hp - damage;
  const killed = active && hp <= 0;
  // Fil du combat : l'assaut, puis le passage de phase s'il y en a un.
  let feed = state.feed ?? [];
  if (active && damage > 0) {
    const before = bossFightPhase(state);
    const after = bossFightPhase({ hp: Math.max(0, hp), maxHp: state.maxHp });
    feed = [...feed, { t: now, uid: player.uid, pseudo: player.pseudo, damage, ...(killed ? { killed: true } : {}) }];
    if (!killed && after > before) feed = [...feed, { t: now, phase: after }];
    feed = feed.slice(-FEED_MAX);
  }
  return {
    state: {
      ...state,
      ...(feed.length ? { feed } : {}),
      hp: Math.max(0, hp),
      status: killed ? "killed" : state.status,
      endedAtMs: killed ? now : state.endedAtMs,
      ...(killed ? { killedBy: { uid: player.uid, pseudo: player.pseudo } } : {}),
      contributions: active ? { ...state.contributions, [player.uid]: { ...c, pseudo: player.pseudo, damage: c.damage + damage, assaults: c.assaults + 1 } } : state.contributions,
    },
    damage,
    survivors,
    lost,
    killed,
  };
}

export function leviathanRanking(state: LeviathanState): ({ uid: string } & LeviathanContribution)[] {
  return Object.entries(state.contributions)
    .filter(([, c]) => c.damage > 0)
    .map(([uid, c]) => ({ uid, ...c }))
    .sort((a, b) => b.damage - a.damage);
}

/** Heures de production gagnées par un participant. */
export function rewardHours(state: LeviathanState, uid: string): number {
  const ranking = leviathanRanking(state);
  const top = ranking[0]?.damage ?? 0;
  const mine = state.contributions[uid]?.damage ?? 0;
  if (!(mine > 0) || !(top > 0)) return 0;
  const hours = (LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours * Math.sqrt(mine / top)) * worldBossOf(state).rewardMult;
  if (state.status !== "killed") return hours * LEVIATHAN_RULES.failedRewardFactor;
  const rank = ranking.findIndex((r) => r.uid === uid);
  return hours + (LEVIATHAN_RULES.podiumHours[rank] ?? 0);
}

/** Verse la récompense d'un participant (et le titre au premier). */
export function grantLeviathanReward(state: LeviathanState, player: PlayerState, random: () => number = Math.random): { gain: Partial<Record<ResourceId, number>>; title: boolean; relic?: string; amber?: number } {
  const hours = rewardHours(state, player.uid);
  const gain = hours > 0 ? productionHours(player, hours) : {};
  for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  if (state.status === "killed" && hours > 0) bumpStat(player, "leviathanKills");
  const top = leviathanRanking(state)[0];
  const title = !!top && top.uid === player.uid && state.status === "killed";
  const label = worldBossTitle(state);
  if (title && !(player.titles ?? []).some((t) => t.label === label)) {
    player.titles = [...(player.titles ?? []), { label, seasonId: `leviathan:${state.id}`, rank: 1 }];
    player.activeTitle = label;
  }
  // Léviathan abattu : une relique, épique pour le podium (v5.13 : top 3), rare pour les autres ;
  // collection pleine : de l'Ambre à la place (plus de participant reparti les mains vides).
  if (state.status === "killed" && hours > 0) {
    const rank = leviathanRanking(state).findIndex((r) => r.uid === player.uid);
    const rarity = rank >= 0 && rank < LEVIATHAN_RULES.topRelics ? "epic" : "rare";
    const item = rollRelic("leviathan", Date.now(), random, rarity);
    if (addRelic(player, item)) return { gain, title, relic: relicLabel(item) };
    const amber = LEVIATHAN_RULES.relicAmber[rarity];
    const b = bountyState(player);
    b.amber += amber;
    player.bounties = b;
    return { gain, title, amber };
  }
  return { gain, title };
}

/** Retire le titre temporaire une fois sa durée écoulée. */
export function removeLeviathanTitle(player: PlayerState, label: string = LEVIATHAN_RULES.title): void {
  player.titles = (player.titles ?? []).filter((t) => t.label !== label);
  if (player.activeTitle === label) player.activeTitle = player.titles[0]?.label;
}

/** Fin de partie : tué, ou échéance dépassée sans victoire. */
export function closeLeviathan(state: LeviathanState, now: number): LeviathanState {
  if (state.status === "active" && now >= state.endMs) return { ...state, status: "failed", endedAtMs: now };
  return state;
}

/* ---------- Suivi en direct (admin, v3.3) ---------- */

const TIMELINE_MAX = 120;

/** Ajoute un relevé des points de structure, au plus un par heure. */
export function recordLeviathanTimeline(state: LeviathanState, now: number): LeviathanState {
  if (!isActive(state, now)) return state;
  const last = state.timeline[state.timeline.length - 1];
  if (last && now - last.t < HOUR) return state;
  return { ...state, timeline: [...state.timeline, { t: now, hp: state.hp }].slice(-TIMELINE_MAX) };
}

export interface LeviathanPace {
  elapsedHours: number;
  remainingHours: number;
  /** Dégâts infligés depuis l'apparition. */
  done: number;
  /** Rythme moyen depuis l'apparition (dégâts par heure). */
  ratePerHour: number;
  /** Dégâts de la dernière heure (d'après les relevés). */
  lastHour: number;
  /** Points de structure prévus à l'échéance au rythme moyen (0 = abattu). */
  projectedHp: number;
  /** Heures avant sa chute au rythme moyen (null si le rythme est nul). */
  killInHours: number | null;
  /** Structure qui serait tout juste abattue à l'échéance au rythme moyen. */
  suggestedMaxHp: number;
}

export function leviathanPace(state: LeviathanState, now: number): LeviathanPace {
  const at = Math.min(now, state.endedAtMs || state.endMs);
  const elapsedHours = Math.max(0, (at - state.startMs) / HOUR);
  const remainingHours = Math.max(0, (state.endMs - at) / HOUR);
  const done = Math.max(0, state.maxHp - state.hp);
  const ratePerHour = elapsedHours > 0 ? done / Math.max(elapsedHours, 0.25) : 0;
  const before = [...state.timeline].reverse().find((p) => p.t <= now - HOUR) ?? state.timeline[0];
  const lastHour = before ? Math.max(0, before.hp - state.hp) : 0;
  const projectedHp = Math.max(0, Math.round(state.hp - ratePerHour * remainingHours));
  const killInHours = state.hp <= 0 ? 0 : ratePerHour > 0 ? state.hp / ratePerHour : null;
  const suggestedMaxHp = Math.max(LEVIATHAN_RULES.minHp, Math.round(done + ratePerHour * remainingHours));
  return { elapsedHours, remainingHours, done, ratePerHour, lastHour, projectedHp, killInHours, suggestedMaxHp };
}

/** Ajustement à chaud (admin) : nouvelle structure maximale, dégâts déjà infligés conservés. */
export function resizeLeviathan(state: LeviathanState, maxHp: number, now: number): LeviathanState {
  if (!isActive(state, now)) throw new GameActionError("Le Léviathan n'est pas là en ce moment.");
  const next = Math.round(maxHp);
  const done = state.maxHp - state.hp;
  if (!(next > done)) throw new GameActionError(`La structure doit dépasser les dégâts déjà infligés (${done}).`);
  return { ...state, maxHp: next, hp: next - done, timeline: [...state.timeline, { t: now, hp: next - done }].slice(-TIMELINE_MAX) };
}

/** v5.10.4 : ajustement à chaud (admin) de la fin d'un combat en cours (prolonger ou écourter). */
export function rescheduleBoss(state: LeviathanState | null, endMs: number, now: number): LeviathanState {
  if (!state || !isActive(state, now)) throw new GameActionError("Aucun combat en cours.");
  const end = Math.round(endMs);
  if (!(end > now + 5 * 60_000)) throw new GameActionError("La nouvelle fin doit être dans plus de 5 minutes.");
  if (end - state.startMs > 14 * 24 * HOUR) throw new GameActionError("Un combat ne peut pas durer plus de 14 jours.");
  // Fin repoussée au-delà du rappel : il pourra repartir.
  const next: LeviathanState = { ...state, endMs: end };
  if (end - now > BOSS_REMINDERS.endingHours * HOUR) delete next.endingNotified;
  return next;
}

/** v5.10.5 : faut-il envoyer le rappel « plus que N heures » ? */
export function endingReminderDue(state: LeviathanState | null, now: number): boolean {
  return !!state && isActive(state, now) && !state.endingNotified && state.endMs - now <= BOSS_REMINDERS.endingHours * HOUR;
}
