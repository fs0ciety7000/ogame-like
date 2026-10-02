import { GameActionError } from "@/game/errors";
import { addDossiers } from "@/game/commanders";
import { bountyState } from "@/game/bounties";
import { productionHours } from "@/game/pirates";
import { addRelic, rollRelic, relicLabel, type RelicRarity } from "@/game/relics";
import { CAPSULES, SYNTH_RULES, synthesisState, type CapsuleType } from "@/game/synthesis";
import { currentSeasonId, seasonLabel } from "@/game/seasons";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Passe de saison (v4.1) : gratuit, un par mois, 30 paliers de 40 points.
   Les points viennent de l'activité quotidienne ; chaque palier atteint
   se réclame (le serveur applique la récompense). Un nouveau mois remet
   le passe à zéro ; les cosmétiques gagnés restent.
===================================================== */

export const PASS_RULES = { tiers: 30, pointsPerTier: 40 };

/** Points par action (connexion : une fois par jour). */
export const PASS_POINTS = {
  contract: 10,
  bounty: 8,
  raidRepelled: 6,
  victory: 5,
  bossAssault: 5,
  dailyLogin: 5,
  mission: 2,
  /** v4.2 : vendetta gagnée contre un seigneur de guerre. */
  vendetta: 40,
  /** v4.3 : épisode des Chroniques terminé, participation au boss de saison. */
  chronicle: 40,
  seasonBoss: 60,
  /** v4.6 : boss d'alliance abattu (au moins 5 % des dégâts), ou simple participation. */
  allianceBoss: 40,
  allianceBossTry: 15,
  /** v4.7 : coalition gagnée contre un seigneur (au moins 3 % de l'objectif). */
  coalition: 50,
  /** v4.9 : objectif du jour d'alliance atteint (membre ayant contribué). */
  allianceDaily: 15,
};
export type PassSource = keyof typeof PASS_POINTS;

export type PassReward =
  | { kind: "production"; hours: number }
  | { kind: "amber"; amount: number }
  | { kind: "dossier"; count: number }
  | { kind: "capsule"; capsule: CapsuleType; level: number }
  | { kind: "relic"; rarity: RelicRarity }
  | { kind: "cosmetic" };

/** Récompenses des 30 paliers (370 Ambre, 3 Dossiers, 8 capsules, 2 reliques). */
export const PASS_TIERS: PassReward[][] = [
  [{ kind: "production", hours: 2 }],
  [{ kind: "amber", amount: 20 }],
  [{ kind: "capsule", capsule: "assault", level: 3 }],
  [{ kind: "production", hours: 3 }],
  [{ kind: "dossier", count: 1 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 4 }],
  [{ kind: "capsule", capsule: "armor", level: 3 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }],
  [{ kind: "production", hours: 5 }],
  [{ kind: "capsule", capsule: "decoy", level: 4 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "production", hours: 6 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "veil", level: 4 }],
  [{ kind: "production", hours: 7 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "assault", level: 5 }],
  [{ kind: "relic", rarity: "rare" }],
  [{ kind: "production", hours: 8 }],
  [{ kind: "amber", amount: 30 }],
  [{ kind: "capsule", capsule: "armor", level: 5 }],
  [{ kind: "production", hours: 9 }],
  [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 40 }],
  [{ kind: "production", hours: 10 }],
  [{ kind: "amber", amount: 50 }],
  [{ kind: "capsule", capsule: "decoy", level: 5 }],
  [{ kind: "production", hours: 12 }],
  [{ kind: "relic", rarity: "epic" }, { kind: "amber", amount: 40 }, { kind: "cosmetic" }],
];

/* ---------- v4.3 : réglages modifiables depuis l'administration ---------- */

export interface SeasonPassConfig {
  rules: typeof PASS_RULES;
  points: typeof PASS_POINTS;
  tiers: PassReward[][];
}

const DEFAULT_PASS: SeasonPassConfig = structuredClone({ rules: PASS_RULES, points: PASS_POINTS, tiers: PASS_TIERS });

export function defaultSeasonPassConfig(): SeasonPassConfig {
  return structuredClone(DEFAULT_PASS);
}

/** Applique le passe personnalisé (sections absentes = valeurs du code). */
export function setSeasonPass(cfg: Partial<SeasonPassConfig> | null | undefined): void {
  const d = defaultSeasonPassConfig();
  Object.assign(PASS_RULES, d.rules, cfg?.rules ?? {});
  Object.assign(PASS_POINTS, d.points, cfg?.points ?? {});
  const tiers = Array.isArray(cfg?.tiers) && cfg!.tiers.length > 0 ? cfg!.tiers : d.tiers;
  PASS_TIERS.splice(0, PASS_TIERS.length, ...structuredClone(tiers));
  PASS_RULES.tiers = PASS_TIERS.length;
}

const REWARD_KINDS = ["production", "amber", "dossier", "capsule", "relic", "cosmetic"];

export function validateSeasonPass(cfg: Partial<SeasonPassConfig> | undefined): string[] {
  const errors: string[] = [];
  if (!cfg) return errors;
  if (cfg.rules && !(cfg.rules.pointsPerTier >= 1)) errors.push("Passe : points par palier ≥ 1.");
  for (const [k, v] of Object.entries(cfg.points ?? {})) if (!(typeof v === "number" && v >= 0)) errors.push(`Passe : points invalides pour « ${k} ».`);
  if (cfg.tiers) {
    if (cfg.tiers.length < 1 || cfg.tiers.length > 60) errors.push("Passe : entre 1 et 60 paliers.");
    cfg.tiers.forEach((list, i) =>
      (list ?? []).forEach((r) => {
        if (!REWARD_KINDS.includes(r?.kind)) errors.push(`Passe, palier ${i + 1} : récompense inconnue.`);
        if (r?.kind === "capsule" && !(r.capsule in CAPSULES)) errors.push(`Passe, palier ${i + 1} : capsule inconnue.`);
        if (r?.kind === "relic" && !["common", "rare", "epic", "legendary"].includes(r.rarity)) errors.push(`Passe, palier ${i + 1} : rareté inconnue.`);
      }),
    );
  }
  return errors;
}

/** Ambre donnée à la place d'une capsule quand la réserve est pleine. */
const CAPSULE_AMBER = 15;

export interface PassState {
  seasonId: string;
  points: number;
  /** Paliers réclamés (1 à 30). */
  claimed: number[];
  /** Dernier jour (UTC) compté pour la connexion. */
  loginDay: string;
  /** Saisons dont le passe a été terminé (bannière et titre gardés). */
  completed: string[];
}

export function passTitle(seasonId: string): string {
  const month = seasonLabel(seasonId).toLowerCase();
  return /^[aeiouéâ]/.test(month) ? `Vétéran d'${month}` : `Vétéran de ${month}`;
}

/** Passe de la saison en cours (remis à zéro au changement de mois). */
export function passState(player: Pick<PlayerState, "seasonPass">, now: number): PassState {
  const raw = (player.seasonPass ?? {}) as Partial<PassState>;
  const seasonId = currentSeasonId(now);
  const completed = Array.isArray(raw.completed) ? raw.completed.map(String) : [];
  if (raw.seasonId !== seasonId) return { seasonId, points: 0, claimed: [], loginDay: "", completed };
  return {
    seasonId,
    points: Math.max(0, Number(raw.points) || 0),
    claimed: (Array.isArray(raw.claimed) ? raw.claimed : []).map(Number).filter((n) => n >= 1 && n <= PASS_RULES.tiers),
    loginDay: String(raw.loginDay ?? ""),
    completed,
  };
}

export function passTier(points: number): number {
  return Math.min(PASS_RULES.tiers, Math.floor(points / PASS_RULES.pointsPerTier));
}

/** Ajoute des points (le passe plafonne à 30 paliers). Modifie le joueur. */
/** v4.3 : les Chroniques suivent les mêmes actions que le passe. */
let passHook: ((player: PlayerState, source: PassSource, now: number, times: number) => void) | null = null;
export function onPassPoints(hook: typeof passHook): void {
  passHook = hook;
}

export function addPassPoints(player: PlayerState, source: PassSource, now: number, times = 1): void {
  passHook?.(player, source, now, times);
  const st = passState(player, now);
  const max = PASS_RULES.tiers * PASS_RULES.pointsPerTier;
  st.points = Math.min(max, st.points + PASS_POINTS[source] * Math.max(0, times));
  player.seasonPass = st;
}

/** Connexion du jour : +5 une fois par jour UTC. */
export function passDailyLogin(player: PlayerState, now: number): boolean {
  const st = passState(player, now);
  const day = new Date(now).toISOString().slice(0, 10);
  if (st.loginDay === day) return false;
  st.loginDay = day;
  st.points = Math.min(PASS_RULES.tiers * PASS_RULES.pointsPerTier, st.points + PASS_POINTS.dailyLogin);
  player.seasonPass = st;
  return true;
}

export function describePassReward(r: PassReward, seasonId?: string): string {
  switch (r.kind) {
    case "production":
      return `${r.hours} h de production`;
    case "amber":
      return `${r.amount} Ambre`;
    case "dossier":
      return r.count > 1 ? `${r.count} Dossiers d'entraînement` : "Dossier d'entraînement";
    case "capsule":
      return `${CAPSULES[r.capsule].name} N${r.level}`;
    case "relic":
      return `Relique ${r.rarity === "epic" ? "épique" : "rare"}`;
    case "cosmetic":
      return seasonId ? `Bannière et titre « ${passTitle(seasonId)} »` : "Bannière et titre de la saison";
  }
}

/** Réclame un palier atteint : le serveur applique la récompense. */
export function claimPassTier(player: PlayerState, tierIn: unknown, now: number, random: () => number = Math.random): string[] {
  const tier = Math.floor(Number(tierIn));
  if (!(tier >= 1 && tier <= PASS_RULES.tiers)) throw new GameActionError("Palier inconnu.");
  const st = passState(player, now);
  if (st.claimed.includes(tier)) throw new GameActionError("Palier déjà réclamé.");
  if (passTier(st.points) < tier) throw new GameActionError(`Palier pas encore atteint (${st.points} / ${tier * PASS_RULES.pointsPerTier} points).`);
  const gained: string[] = [];
  for (const r of PASS_TIERS[tier - 1]) {
    if (r.kind === "production") {
      for (const [res, n] of Object.entries(productionHours(player, r.hours)) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
      gained.push(describePassReward(r));
    } else if (r.kind === "amber") {
      const b = bountyState(player);
      b.amber += r.amount;
      player.bounties = b;
      gained.push(describePassReward(r));
    } else if (r.kind === "dossier") {
      addDossiers(player, r.count);
      gained.push(describePassReward(r));
    } else if (r.kind === "capsule") {
      const syn = synthesisState(player);
      if (syn.stock[r.capsule].length < SYNTH_RULES.maxStock) {
        syn.stock[r.capsule] = [...syn.stock[r.capsule], r.level];
        player.synthesis = syn;
        gained.push(describePassReward(r));
      } else {
        const b = bountyState(player);
        b.amber += CAPSULE_AMBER;
        player.bounties = b;
        gained.push(`${CAPSULE_AMBER} Ambre (réserve de capsules pleine)`);
      }
    } else if (r.kind === "relic") {
      // Premier tirage à 0 : exactement la rareté promise, puis modèle au hasard.
      let first = true;
      const item = rollRelic("pass", now, () => (first ? ((first = false), 0) : random()), r.rarity);
      if (addRelic(player, item)) gained.push(`Relique : ${relicLabel(item)}`);
      else {
        const b = bountyState(player);
        b.amber += 40;
        player.bounties = b;
        gained.push("40 Ambre (collection de reliques pleine)");
      }
    } else if (r.kind === "cosmetic") {
      const title = passTitle(st.seasonId);
      if (!(player.titles ?? []).some((t) => t.label === title)) player.titles = [...(player.titles ?? []), { label: title, seasonId: `pass:${st.seasonId}`, rank: 1 }];
      if (!st.completed.includes(st.seasonId)) st.completed = [...st.completed, st.seasonId];
      gained.push(describePassReward(r, st.seasonId));
    }
  }
  st.claimed = [...st.claimed, tier].sort((a, b) => a - b);
  player.seasonPass = st;
  return gained;
}
