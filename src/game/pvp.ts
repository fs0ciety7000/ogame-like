import type { CombatOutcome } from "@/types/game";

/* =====================================================
   Règles joueur contre joueur : XP de combat et protections.

   Module pur, partagé par le client (affichage : « cible protégée »,
   aperçu de l'XP) et par le serveur (pb_hooks), qui est le seul à
   arbitrer réellement une attaque.
===================================================== */

export const PVP_RULES = {
  /** Délai minimal entre deux attaques d'un même joueur sur la même cible. */
  attackCooldownMs: 2 * 60 * 60 * 1000,
  /** Bouclier : plus personne ne peut attaquer un joueur battu en défense. */
  shieldAfterDefeatMs: 60 * 60 * 1000,
  /** Protection débutant (levée dès que le joueur attaque lui-même). */
  newbieProtectionMs: 72 * 60 * 60 * 1000,
  /** Impossible d'attaquer un joueur N fois moins expérimenté… */
  maxXpRatio: 3,
  /** …une fois qu'on a soi-même au moins cette XP (sinon tout le monde se
   *  bloquerait mutuellement en début de partie). */
  xpGapFloor: 500,
  /** Perte d'XP maximale en défense sur 24 h glissantes. */
  defenseXpLossCapPer24h: 60,
  defenseXpLossWindowMs: 24 * 60 * 60 * 1000,
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export interface CombatXp {
  attackerXp: number;
  /** Avant application du plafond de perte sur 24 h (voir capDefenderXpLoss). */
  defenderXp: number;
}

/** XP gagnée/perdue par chaque camp.
 *  - Attaquant vainqueur : +40 × (défense/attaque), entre ×0,1 et ×2 —
 *    écraser un joueur bien plus faible ne rapporte presque rien.
 *  - Attaquant battu : −20.
 *  - Défenseur qui repousse : +40 × (attaque/défense), entre +20 et +60.
 *  - Défenseur battu : −20 ÷ rapport de force, entre −5 et −20 — perdre de
 *    justesse (défense négligée) coûte plus cher qu'être écrasé.
 *  - Égalité : +5 chacun. */
export function computeCombatXp(outcome: CombatOutcome, attackerPower: number, defenderPower: number): CombatXp {
  const att = Math.max(attackerPower, 0);
  const def = Math.max(defenderPower, 0);

  if (outcome === "attacker_win") {
    const ratio = att > 0 ? def / att : 0;
    return {
      attackerXp: Math.round(40 * clamp(ratio, 0.1, 2)),
      defenderXp: -Math.round(clamp(20 * ratio, 5, 20)),
    };
  }
  if (outcome === "defender_win") {
    const ratio = def > 0 ? att / def : 0;
    return {
      attackerXp: -20,
      defenderXp: Math.round(40 * clamp(ratio, 0.5, 1.5)),
    };
  }
  return { attackerXp: 5, defenderXp: 5 };
}

/** Applique le plafond de perte d'XP en défense : `alreadyLost` = XP déjà
 *  perdue en défense sur les dernières 24 h (valeur positive). */
export function capDefenderXpLoss(defenderXp: number, alreadyLost: number): number {
  if (defenderXp >= 0) return defenderXp;
  const remaining = Math.max(0, PVP_RULES.defenseXpLossCapPer24h - alreadyLost);
  return -Math.min(-defenderXp, remaining);
}

export interface AttackContext {
  now: number;
  attackerUid: string;
  attackerXp: number;
  defenderUid: string;
  defenderXp: number;
  defenderCreatedAtMs: number | undefined;
  /** Le défenseur a-t-il déjà attaqué quelqu'un (fin de sa protection débutant) ? */
  defenderHasAttacked: boolean;
  /** Dernière attaque de cet attaquant sur cette cible (ms), s'il y en a une. */
  lastAttackOnTargetMs: number | null;
  /** Dernière défaite du défenseur en défense (ms), s'il y en a une. */
  lastDefenderDefeatMs: number | null;
}

export type AttackBlockReason = "self" | "cooldown" | "shield" | "newbie" | "too_weak";

export interface AttackCheck {
  allowed: boolean;
  reason?: AttackBlockReason;
  /** Horodatage (ms) à partir duquel l'attaque redevient possible. */
  until?: number;
  message?: string;
}

function formatWait(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** Vérifie qu'une attaque est autorisée ; renvoie la raison sinon. */
export function checkAttackAllowed(ctx: AttackContext): AttackCheck {
  const { now } = ctx;
  if (ctx.attackerUid === ctx.defenderUid) {
    return { allowed: false, reason: "self", message: "Tu ne peux pas t'attaquer toi-même !" };
  }

  if (ctx.defenderCreatedAtMs && !ctx.defenderHasAttacked) {
    const until = ctx.defenderCreatedAtMs + PVP_RULES.newbieProtectionMs;
    if (now < until) {
      return {
        allowed: false,
        reason: "newbie",
        until,
        message: `Ce joueur débute : il est protégé encore ${formatWait(until - now)}.`,
      };
    }
  }

  if (ctx.lastDefenderDefeatMs !== null) {
    const until = ctx.lastDefenderDefeatMs + PVP_RULES.shieldAfterDefeatMs;
    if (now < until) {
      return {
        allowed: false,
        reason: "shield",
        until,
        message: `Ce joueur vient d'être battu : bouclier actif encore ${formatWait(until - now)}.`,
      };
    }
  }

  if (ctx.lastAttackOnTargetMs !== null) {
    const until = ctx.lastAttackOnTargetMs + PVP_RULES.attackCooldownMs;
    if (now < until) {
      return {
        allowed: false,
        reason: "cooldown",
        until,
        message: `Tu as déjà attaqué ce joueur récemment : réessaie dans ${formatWait(until - now)}.`,
      };
    }
  }

  if (ctx.attackerXp >= PVP_RULES.xpGapFloor && ctx.defenderXp * PVP_RULES.maxXpRatio < ctx.attackerXp) {
    return {
      allowed: false,
      reason: "too_weak",
      message: `Ce joueur est trop faible pour toi (moins d'un tiers de ton XP).`,
    };
  }

  return { allowed: true };
}
