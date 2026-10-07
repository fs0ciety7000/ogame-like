/* =====================================================
   6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md) : phalange lunaire.
   Une phalange DÉFENSIVE à paliers (option P3) :
   - radar d'alliance : une attaque de joueur qui vise un allié dans la portée
     de ta lune t'est signalée (au plus `radarMaxNotified` alliés) ;
   - perce-brouillard : vraie composition (niveau 2) puis capsules (niveau 4)
     des flottes qui TE visent, jamais celles des autres ;
   - balayage de l'agresseur : flottes en vol d'un joueur qui t'attaque ou
     attaque un allié couvert, avec une recharge et un coût en énergie.
   Invariant I22. Moteur pur : le serveur (lot É30-1b) lit les flottes et
   appelle ces fonctions.
   Règles : valeurs littérales seulement (pas de constante importée lue au
   chargement du module, CLAUDE.md « Initialisation des modules »).
===================================================== */
import { GameActionError } from "@/game/errors";
import { hourlyProduction } from "@/game/economy";
import { attackPowerShown, distanceBetween, FLEET_MISSION_LABELS, targetsPlayer, type Fleet, type FleetMission } from "@/game/fleets";
import { formatInt } from "@/game/format";
import { playerModifiers } from "@/game/modifiers";
import { moonLevel, playerMoon } from "@/game/moon";
import { bumpStat } from "@/game/stats";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/** Réglages (Admin → Règles → Lunes : phalange ; registre « phalanx »). */
export const PHALANX_RULES = {
  /** false : routes refusées, radar coupé, rien n'est percé. */
  enabled: true,
  /** Portée en unités de carte par niveau de lune (carte de côté 100). */
  rangePerLevel: 15,
  /** Alerte d'alliance au lancement d'une attaque de joueur. */
  radar: true,
  /** Alliés prévenus au plus, par attaque (les plus proches de la planète visée). */
  radarMaxNotified: 10,
  /** Niveau de lune qui perce le brouilleur d'approche (vraie composition) ; 0 = jamais. */
  revealDecoyLevel: 2,
  /** Niveau de lune qui révèle les capsules embarquées (stimulant d'assaut) ; 0 = jamais. */
  revealBoostLevel: 4,
  /** Recharge du balayage au niveau 1, en minutes. */
  scanCooldownMinutes: 30,
  /** Minutes de recharge en moins par niveau au-delà du premier. */
  scanCooldownCutPerLevel: 5,
  /** Recharge minimale, en minutes. */
  scanCooldownMinMinutes: 5,
  /** Coût d'un balayage : heures de production d'énergie. */
  scanCostHours: 0.5,
  /** Coût minimal d'un balayage, en énergie. */
  scanCostMin: 1000,
};

type MoonPlayer = Partial<Pick<PlayerState, "moon" | "commanders" | "relics" | "ascensions" | "territory" | "talents" | "modules" | "empireClass">>;

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Format court d'une attente (« 6 h 12 min », « 25 min », « moins d'une minute »). */
export function formatWait(ms: number): string {
  const min = Math.ceil(Math.max(0, ms) / 60_000);
  if (min <= 0) return "moins d'une minute";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

export interface PhalanxFeatures {
  /** Niveau de lune (0 : pas de lune ou phalange désactivée). */
  level: number;
  radar: boolean;
  /** Portée de base (sans les effets). */
  range: number;
  revealDecoy: boolean;
  revealBoosts: boolean;
  /** Recharge du balayage. */
  scanCooldownMs: number;
}

/** Ce que donne la phalange à un niveau de lune (§5.1). */
export function phalanxFeatures(level: number): PhalanxFeatures {
  const lvl = PHALANX_RULES.enabled ? Math.max(0, Math.floor(num(level))) : 0;
  const decoyAt = Math.floor(num(PHALANX_RULES.revealDecoyLevel));
  const boostAt = Math.floor(num(PHALANX_RULES.revealBoostLevel));
  const minutes = Math.max(Math.max(0, num(PHALANX_RULES.scanCooldownMinMinutes)), num(PHALANX_RULES.scanCooldownMinutes) - Math.max(0, num(PHALANX_RULES.scanCooldownCutPerLevel)) * Math.max(0, lvl - 1));
  return {
    level: lvl,
    radar: lvl >= 1 && PHALANX_RULES.radar === true,
    range: lvl * Math.max(0, num(PHALANX_RULES.rangePerLevel)),
    revealDecoy: lvl >= 1 && decoyAt > 0 && lvl >= decoyAt,
    revealBoosts: lvl >= 1 && boostAt > 0 && lvl >= boostAt,
    scanCooldownMs: Math.round(minutes * 60_000),
  };
}

/** Niveau de phalange du joueur (0 sans lune ou si la phalange est désactivée). */
export function phalanxLevel(player: Pick<MoonPlayer, "moon"> | null | undefined): number {
  const m = playerMoon(player);
  return m && PHALANX_RULES.enabled ? moonLevel(m) : 0;
}

/** Portée de la phalange du joueur, effet `phalanxRange` compris (couche empire, plafonnée). */
export function phalanxRange(player: MoonPlayer | null | undefined): number {
  const level = phalanxLevel(player);
  if (level <= 0) return 0;
  const mods = playerModifiers(player);
  return phalanxFeatures(level).range * (1 + Math.max(0, mods.phalanxRange));
}

/** Planètes (identifiant de planète mère ou de colonie) couvertes par la phalange de `moonOwner`, de la plus proche à la plus lointaine. */
export function alliesCovered<T extends { uid: string }>(moonOwner: MoonPlayer & { uid: string }, targets: readonly T[]): T[] {
  const range = phalanxRange(moonOwner);
  if (!(range > 0)) return [];
  return targets
    .map((t) => ({ t, d: distanceBetween(moonOwner.uid, t.uid) }))
    .filter((x) => x.d <= range)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.t);
}

/* ---------- radar d'alliance ---------- */

export type RadarCandidate = MoonPlayer & { uid: string; allianceId?: string | null };

/** Alliés de la cible à prévenir au lancement d'une attaque (I22) : même alliance que la cible, une lune, une portée qui
 *  couvre la planète visée ; ni la cible ni l'attaquant ; attaques de joueurs seulement ; `radarMaxNotified` au plus, les plus proches d'abord. */
export function radarRecipients(
  fleet: Pick<Fleet, "mission" | "ownerUid" | "targetUid"> & { targetOwnerUid?: string | null },
  targetAllianceId: string | null | undefined,
  candidates: readonly RadarCandidate[],
  opts: { attackerNpc?: boolean } = {},
): string[] {
  if (!PHALANX_RULES.enabled || PHALANX_RULES.radar !== true || opts.attackerNpc) return [];
  if (fleet.mission !== "attack" || !targetAllianceId) return [];
  const max = Math.max(0, Math.floor(num(PHALANX_RULES.radarMaxNotified)));
  if (max <= 0) return [];
  const victim = fleet.targetOwnerUid || fleet.targetUid;
  const seen = new Set<string>();
  const out: { uid: string; d: number }[] = [];
  for (const c of candidates) {
    if (!c?.uid || seen.has(c.uid) || c.uid === victim || c.uid === fleet.ownerUid || c.allianceId !== targetAllianceId) continue;
    seen.add(c.uid);
    if (!phalanxFeatures(phalanxLevel(c)).radar) continue;
    const d = distanceBetween(c.uid, fleet.targetUid);
    if (d <= phalanxRange(c)) out.push({ uid: c.uid, d });
  }
  return out
    .sort((a, b) => a.d - b.d || (a.uid < b.uid ? -1 : 1))
    .slice(0, max)
    .map((x) => x.uid);
}

/** Texte de l'alerte du radar (§5.5). */
export function radarText(attackerPseudo: string, allyPseudo: string, planetName: string, impactAtMs: number, now: number): { title: string; message: string } {
  const min = Math.max(0, Math.ceil((impactAtMs - now) / 60_000));
  return { title: "Phalange : allié menacé", message: `Phalange : ${attackerPseudo} vise ${allyPseudo} (${planetName}), impact dans ${min} min. Envoie une garnison !` };
}

/* ---------- perce-brouillard ---------- */

/** Champs cachés d'une flotte (lus par le serveur seulement : `trueUnits`, `boosts`), et la vraie puissance calculée par lui. */
export interface PhalanxHidden {
  trueUnits?: Record<string, number> | null;
  boosts?: { assault?: number; decoy?: number } | null;
  /** Puissance d'attaque sur la vraie composition (`attackPowerShown` de l'attaquant). */
  truePower?: number | null;
  /** Bonus d'attaque de l'attaquant (couche empire), pour chiffrer le stimulant comme au combat. */
  attackMod?: number;
}

export interface RevealedFleet {
  units: Record<string, number>;
  /** Puissance à afficher ; null : à recalculer sur `units` (estimation). */
  power: number | null;
  /** Stimulant d'assaut révélé, en % (null : rien de révélé). */
  assault: number | null;
  pierced: { decoy: boolean; boosts: boolean };
}

const hasUnits = (u: Record<string, number> | null | undefined): u is Record<string, number> => !!u && typeof u === "object" && Object.values(u).some((n) => Number(n) > 0);

/** Vue d'une flotte entrante pour `viewerUid` (I22) : la vraie composition au niveau `revealDecoyLevel`, le stimulant au niveau
 *  `revealBoostLevel`, seulement pour la cible de l'attaque. Rien n'est écrit dans la flotte. */
export function revealIncoming(
  fleet: Pick<Fleet, "mission" | "units" | "targetUid"> & { power?: number | null; targetOwnerUid?: string | null },
  hidden: PhalanxHidden | null | undefined,
  level: number,
  viewerUid: string,
): RevealedFleet {
  const shown: RevealedFleet = { units: { ...(fleet.units ?? {}) }, power: fleet.power ?? null, assault: null, pierced: { decoy: false, boosts: false } };
  if (fleet.mission !== "attack" || !targetsPlayer(fleet, viewerUid) || !hidden) return shown;
  const f = phalanxFeatures(level);
  const out: RevealedFleet = { ...shown, pierced: { decoy: false, boosts: false } };
  if (f.revealDecoy && hasUnits(hidden.trueUnits)) {
    out.units = { ...hidden.trueUnits };
    out.power = num(hidden.truePower) > 0 ? num(hidden.truePower) : null;
    out.pierced.decoy = true;
  }
  const assault = Math.max(0, Math.min(50, num(hidden.boosts?.assault)));
  if (f.revealBoosts && assault > 0) {
    out.assault = assault;
    const mod = Math.max(0, num(hidden.attackMod));
    if (out.power !== null) out.power = Math.round((out.power * (1 + mod + assault / 100)) / (1 + mod));
    out.pierced.boosts = true;
  }
  return out;
}

/** Texte « Percé par la phalange » (§5.5), ou null si rien n'est percé. */
export function piercedText(shownUnits: Record<string, number> | null | undefined, revealed: RevealedFleet): string | null {
  if (!revealed.pierced.decoy && !revealed.pierced.boosts) return null;
  const total = (u: Record<string, number> | null | undefined) => Object.values(u ?? {}).reduce((a, n) => a + Math.max(0, Number(n) || 0), 0);
  const parts: string[] = [];
  if (revealed.pierced.decoy) parts.push(`${formatInt(total(revealed.units))} vaisseaux, pas ${formatInt(total(shownUnits))}.`);
  if (revealed.pierced.boosts && revealed.assault) parts.push(`+${Math.round(revealed.assault)} % d'attaque (stimulant).`);
  return `Percé par la phalange : ${parts.join(" ")}`;
}

/* ---------- balayage de l'agresseur ---------- */

type ScanFleet = Pick<Fleet, "ownerUid" | "mission" | "status" | "targetUid"> & { targetOwnerUid?: string | null };

/** Coût d'un balayage, en énergie : `scanCostHours` de production, `scanCostMin` au moins. */
export function scanCost(player: Partial<Pick<PlayerState, "buildings" | "techLevels">>): number {
  const perHour = player.buildings ? hourlyProduction(player.buildings, "energy", player.techLevels) : 0;
  return Math.max(Math.max(0, Math.ceil(num(PHALANX_RULES.scanCostMin))), Math.ceil(Math.max(0, perHour) * Math.max(0, num(PHALANX_RULES.scanCostHours))));
}

/** `targetUid` est-il un agresseur pour `player` ? Une flotte d'attaque de `targetUid` en approche (I22) vers lui, une de ses colonies,
 *  ou un allié (`allyUids`) dont la planète visée est dans sa portée. */
export function isAggressor(player: MoonPlayer & { uid: string }, targetUid: string, fleets: readonly ScanFleet[], allyUids: readonly string[] = []): boolean {
  const allies = new Set(allyUids.filter((u) => u && u !== player.uid));
  let range: number | null = null;
  for (const f of fleets) {
    if (f.ownerUid !== targetUid || f.mission !== "attack" || f.status !== "outbound") continue;
    if (targetsPlayer(f, player.uid)) return true;
    const victim = f.targetOwnerUid || f.targetUid;
    if (!allies.has(victim)) continue;
    if (range === null) range = phalanxRange(player);
    if (distanceBetween(player.uid, f.targetUid) <= range) return true;
  }
  return false;
}

/** Raison du refus d'un balayage, ou null s'il est permis. */
export function scanRefusal(
  player: MoonPlayer & Pick<PlayerState, "uid"> & Partial<Pick<PlayerState, "resources" | "buildings" | "techLevels">>,
  targetUid: string,
  fleets: readonly ScanFleet[],
  now: number,
  opts: { allyUids?: readonly string[] } = {},
): string | null {
  if (!PHALANX_RULES.enabled) return "La phalange est désactivée.";
  const m = playerMoon(player);
  if (!m) return "Il te faut une lune pour balayer un agresseur.";
  if (!targetUid || targetUid === player.uid) return "Choisis un autre joueur à balayer.";
  const ready = num(m.scanReadyAtMs);
  if (ready > now) return `Ta phalange se recharge : encore ${formatWait(ready - now)}.`;
  if (!isAggressor(player, targetUid, fleets, opts.allyUids ?? [])) return "La phalange ne balaie qu'un joueur qui t'attaque, ou qui attaque un allié à ta portée.";
  const cost = scanCost(player);
  if ((player.resources?.energy ?? 0) < cost) return `Il te faut ${formatInt(cost)} d'énergie pour ce balayage.`;
  return null;
}

export function canScan(...args: Parameters<typeof scanRefusal>): boolean {
  return scanRefusal(...args) === null;
}

/** Vérifie un balayage (refus en `GameActionError`). */
export function checkScan(...args: Parameters<typeof scanRefusal>): void {
  const why = scanRefusal(...args);
  if (why) throw new GameActionError(why);
}

/** Après un balayage permis : énergie payée, recharge posée (`moon.scanReadyAtMs`), compteur `phalanxScans`. */
export function markScan(player: PlayerState, now: number): { cost: number; readyAtMs: number } {
  const m = playerMoon(player);
  if (!m) throw new GameActionError("Il te faut une lune pour balayer un agresseur.");
  const cost = scanCost(player);
  player.resources = { ...player.resources, energy: Math.max(0, (player.resources.energy ?? 0) - cost) };
  const readyAtMs = now + phalanxFeatures(phalanxLevel(player)).scanCooldownMs;
  player.moon = { ...m, scanReadyAtMs: readyAtMs };
  bumpStat(player, "phalanxScans");
  return { cost, readyAtMs };
}

export interface ScanFleetLine {
  id: string;
  mission: FleetMission;
  missionLabel: string;
  status: Fleet["status"];
  targetUid: string;
  targetPseudo: string;
  arriveAtMs: number;
  returnAtMs: number | null;
  /** Composition affichée (leurre compris : jamais `trueUnits`). */
  units: Record<string, number>;
  ships: number;
}

export interface ScanReport {
  targetUid: string;
  targetPseudo: string;
  atMs: number;
  fleets: ScanFleetLine[];
  /** Vaisseaux à quai (total seul, pas le détail). */
  docked: number;
}

const sumUnits = (u: Record<string, number> | null | undefined) => Object.values(u ?? {}).reduce((a, n) => a + Math.max(0, Number(n) || 0), 0);

/** Rapport de balayage : flottes en vol de la cible (composition affichée, jamais les champs cachés) et vaisseaux à quai. */
export function buildScanReport(
  target: Pick<PlayerState, "uid" | "pseudo"> & Partial<Pick<PlayerState, "units">>,
  fleets: readonly (Pick<Fleet, "id" | "ownerUid" | "mission" | "status" | "targetUid" | "targetPseudo" | "arriveAtMs" | "returnAtMs" | "units">)[],
  now: number,
): ScanReport {
  const lines: ScanFleetLine[] = fleets
    .filter((f) => f.ownerUid === target.uid && f.status !== "done")
    .map((f) => ({
      id: f.id,
      mission: f.mission,
      missionLabel: FLEET_MISSION_LABELS[f.mission] ?? f.mission,
      status: f.status,
      targetUid: f.targetUid,
      targetPseudo: f.targetPseudo,
      arriveAtMs: f.arriveAtMs,
      returnAtMs: f.returnAtMs ?? null,
      units: { ...(f.units ?? {}) },
      ships: sumUnits(f.units),
    }))
    .sort((a, b) => a.arriveAtMs - b.arriveAtMs || (a.id < b.id ? -1 : 1));
  let docked = 0;
  for (const id of OFFENSIVE_UNITS) docked += Math.max(0, Number(target.units?.[id]?.count) || 0);
  return { targetUid: target.uid, targetPseudo: target.pseudo, atMs: now, fleets: lines, docked };
}

/** Texte de la notification de balayage (§5.5). */
export function scanReportText(report: ScanReport, nextScanAtMs: number, now: number): { title: string; message: string } {
  const n = report.fleets.length;
  return {
    title: `Balayage de ${report.targetPseudo}`,
    message: `Balayage de ${report.targetPseudo} : ${n} flotte${n > 1 ? "s" : ""} en vol, ${formatInt(report.docked)} vaisseau${report.docked > 1 ? "x" : ""} à quai. Prochain balayage dans ${formatWait(nextScanAtMs - now)}.`,
  };
}

/* ---------- 6.14.48 (É30-1b) : aides du serveur ---------- */

/** Champs cachés d'une flotte d'attaque, complétés par la vraie puissance et le bonus d'attaque de l'attaquant (lus par le serveur
 *  seulement, pour `revealIncoming`). `attacker` absent (joueur supprimé) : la puissance sera recalculée par le client. */
export function phalanxHidden(
  attacker: PlayerState | null | undefined,
  trueUnits: Record<string, number> | null | undefined,
  boosts: PhalanxHidden["boosts"],
  formation?: string,
): PhalanxHidden {
  const real = hasUnits(trueUnits) ? { ...trueUnits } : null;
  return {
    trueUnits: real,
    boosts: boosts ?? null,
    truePower: attacker && real ? attackPowerShown(attacker, real, formation) : null,
    attackMod: attacker ? Math.max(0, playerModifiers(attacker).attack) : 0,
  };
}

type ThreatFleet = Pick<Fleet, "ownerUid" | "mission" | "status" | "targetUid"> & { targetOwnerUid?: string | null };

/** Attaques en approche vers un allié (`allyUids`) dont la planète visée est dans la portée de `player` (radar consultable, I22).
 *  Ni les attaques qui visent `player` lui-même, ni celles d'un allié. */
export function alliedThreats<F extends ThreatFleet>(player: MoonPlayer & { uid: string }, fleets: readonly F[], allyUids: readonly string[]): F[] {
  const allies = new Set(allyUids.filter((u) => u && u !== player.uid));
  if (allies.size === 0) return [];
  const range = phalanxRange(player);
  if (!(range > 0)) return [];
  return fleets.filter((f) => {
    if (f.mission !== "attack" || f.status !== "outbound" || allies.has(f.ownerUid) || f.ownerUid === player.uid) return false;
    if (targetsPlayer(f, player.uid)) return false;
    const victim = f.targetOwnerUid || f.targetUid;
    return allies.has(victim) && distanceBetween(player.uid, f.targetUid) <= range;
  });
}
