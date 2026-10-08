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
  /** Bouclier : plus personne ne peut attaquer un joueur battu en défense.
   *  6.14.72 (AU27, AE-7) : 1 h → 3 h, plus long que le délai entre deux attaques d'un même joueur (2 h). */
  shieldAfterDefeatMs: 3 * 60 * 60 * 1000,
  /** Protection débutant (levée dès que le joueur attaque lui-même). */
  newbieProtectionMs: 72 * 60 * 60 * 1000,
  /** v3.4 : bouclier après une ascension. */
  ascensionShieldMs: 72 * 60 * 60 * 1000,
  /** 5.23 : contre un joueur N fois moins expérimenté, butin et XP dégressifs… */
  maxXpRatio: 3,
  /** …jusqu'à ce plancher (part gardée du butin et de l'XP)… */
  weakTargetFloor: 0.25,
  /** …et attaque refusée au-delà de cet écart (protège les tout petits comptes).
   *  6.14.72 (AU27, AE-8, Q100) : 12 → 10, le premier quartile d'XP hors de portée de la médiane. */
  hardXpRatio: 10,
  /** …une fois qu'on a soi-même au moins cette XP (sinon tout le monde se
   *  bloquerait mutuellement en début de partie). */
  xpGapFloor: 500,
  /** 5.18 : XP minimale d'une victoire contre un PNJ (seigneur de guerre). */
  npcWinMinXp: 30,
  /** Perte d'XP maximale en défense sur 24 h glissantes. */
  defenseXpLossCapPer24h: 60,
  defenseXpLossWindowMs: 24 * 60 * 60 * 1000,
  /** 6.14.106 (AU27, AE-7) : défaites en défense sur 24 h glissantes au-delà desquelles plus personne ne peut attaquer ce
   *  joueur, jusqu'à ce que la plus ancienne sorte de la fenêtre (0 = sans limite). Toutes planètes et attaquants réunis. */
  maxDefeatsPer24h: 4,
};

/** Fenêtre du compte des défaites (24 h glissantes). */
const DEFEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 6.14.106 : fin de la protection « trop de défaites » (null : pas de protection). `defeatsMs` : horodatages des défaites
 *  en défense (toutes planètes) ; seules celles des dernières 24 h comptent. Protégé tant qu'il y en a `maxDefeatsPer24h`
 *  ou plus ; la protection tombe quand la plus ancienne des `max` dernières sort de la fenêtre. */
export function defeatLimitUntil(defeatsMs: readonly number[] | null | undefined, now: number, max: number = PVP_RULES.maxDefeatsPer24h): number | null {
  const cap = Math.floor(Number(max) || 0);
  if (!(cap > 0) || !defeatsMs || defeatsMs.length < cap) return null;
  const recent = defeatsMs
    .map(Number)
    .filter((t) => Number.isFinite(t) && t <= now && now - t < DEFEAT_WINDOW_MS)
    .sort((a, b) => a - b);
  if (recent.length < cap) return null;
  return recent[recent.length - cap] + DEFEAT_WINDOW_MS;
}

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
export function computeCombatXp(outcome: CombatOutcome, attackerPower: number, defenderPower: number, defenderIsNpc = false): CombatXp {
  const att = Math.max(attackerPower, 0);
  const def = Math.max(defenderPower, 0);
  // 5.18 : contre un PNJ, une défaite ne coûte pas d'XP et une victoire en rapporte au moins npcWinMinXp.
  if (defenderIsNpc) {
    const base = computeCombatXp(outcome, attackerPower, defenderPower, false);
    if (outcome === "attacker_win") return { ...base, attackerXp: Math.max(PVP_RULES.npcWinMinXp, base.attackerXp) };
    if (outcome === "defender_win") return { ...base, attackerXp: 0 };
    return base;
  }

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
  /** v3.4 : dernière ascension du défenseur (bouclier de 72 h). */
  defenderAscendedAtMs?: number;
  /** v3.2 : délai entre deux attaques sur la même cible (guerre d'alliance) ; défaut : règle JcJ. */
  attackCooldownMs?: number;
  /** v3.9 : Voile de chitine du défenseur (Comptoir Kesh'Vaar), fin en ms. */
  defenderShieldUntilMs?: number;
  /** v4.2 : fin des vacances du défenseur (ms), s'il est en vacances. */
  defenderVacationUntilMs?: number;
  /** v4.2 : un seigneur de guerre n'a pas de bouclier après une défaite. */
  /** Cible PNJ (seigneur de guerre…) : aucune protection de joueur, seulement le délai entre deux attaques. */
  defenderIsWarlord?: boolean;
  /** 6.14.106 (AE-7) : défaites en défense du joueur visé sur 24 h (horodatages, lus par le serveur ; absent = pas de contrôle). */
  defenderDefeatsMs?: number[];
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

/** « 2 h 15 min » : attente lisible (messages des protections). */
export function formatPvpWait(ms: number): string {
  return formatWait(ms);
}

/** Vérifie qu'une attaque est autorisée ; renvoie la raison sinon. */
export function checkAttackAllowed(ctx: AttackContext): AttackCheck {
  const { now } = ctx;
  if (ctx.attackerUid === ctx.defenderUid) {
    return { allowed: false, reason: "self", message: "Tu ne peux pas t'attaquer toi-même !" };
  }

  // 5.17.2 : les PNJ (seigneurs de guerre…) n'ont aucune protection de joueur :
  // ni débutant, ni vacances, ni bouclier, ni Voile, ni ascension, ni écart d'XP.
  // Seul le délai entre deux attaques sur la même cible reste dû.
  const npc = !!ctx.defenderIsWarlord;

  if (!npc && ctx.defenderCreatedAtMs && !ctx.defenderHasAttacked) {
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

  if (!npc && ctx.defenderVacationUntilMs && now < ctx.defenderVacationUntilMs) {
    return { allowed: false, reason: "shield", until: ctx.defenderVacationUntilMs, message: `Ce joueur est en vacances encore ${formatWait(ctx.defenderVacationUntilMs - now)}.` };
  }

  if (!npc && ctx.lastDefenderDefeatMs !== null) {
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

  // 6.14.106 (AE-7) : trop de défaites sur 24 h.
  const limitUntil = npc ? null : defeatLimitUntil(ctx.defenderDefeatsMs, now);
  if (limitUntil !== null && now < limitUntil) {
    return {
      allowed: false,
      reason: "shield",
      until: limitUntil,
      message: `Ce joueur a perdu ${PVP_RULES.maxDefeatsPer24h} combats en défense ces dernières 24 h : il est protégé encore ${formatWait(limitUntil - now)}.`,
    };
  }

  if (!npc && ctx.defenderShieldUntilMs && now < ctx.defenderShieldUntilMs) {
    const until = ctx.defenderShieldUntilMs;
    return { allowed: false, reason: "shield", until, message: `Ce joueur est sous un Voile de chitine encore ${formatWait(until - now)}.` };
  }

  if (!npc && ctx.defenderAscendedAtMs) {
    const until = ctx.defenderAscendedAtMs + PVP_RULES.ascensionShieldMs;
    if (now < until) {
      return { allowed: false, reason: "shield", until, message: `Ce joueur vient de s'élever : bouclier d'ascension encore ${formatWait(until - now)}.` };
    }
  }

  if (ctx.lastAttackOnTargetMs !== null) {
    const until = ctx.lastAttackOnTargetMs + (ctx.attackCooldownMs ?? PVP_RULES.attackCooldownMs);
    if (now < until) {
      return {
        allowed: false,
        reason: "cooldown",
        until,
        message: `Tu as déjà attaqué ce joueur récemment : réessaie dans ${formatWait(until - now)}.`,
      };
    }
  }

  // (voir weakTargetFactor plus bas pour la dégressivité)
// L'XP des seigneurs suit la médiane des joueurs : un joueur très avancé ne pouvait plus en
  // attaquer aucun. Une victoire sur un adversaire bien plus faible rapporte peu d'XP (computeCombatXp).
  // 5.23 : entre ×maxXpRatio et ×hardXpRatio, l'attaque passe avec butin et XP réduits (weakTargetFactor).
  if (!npc && ctx.attackerXp >= PVP_RULES.xpGapFloor && ctx.defenderXp * PVP_RULES.hardXpRatio < ctx.attackerXp) {
    return {
      allowed: false,
      reason: "too_weak",
      message: `Ce joueur est bien trop faible pour toi (moins d'un ${PVP_RULES.hardXpRatio}e de ton XP).`,
    };
  }

  return { allowed: true };
}

/** 5.23 : part du butin et de l'XP gardée contre une cible bien moins expérimentée.
 *  1 jusqu'à ×maxXpRatio d'écart, puis proportionnelle, jamais sous weakTargetFloor. */
export function weakTargetFactor(attackerXp: number, defenderXp: number, defenderIsNpc = false): number {
  if (defenderIsNpc || attackerXp < PVP_RULES.xpGapFloor || !(attackerXp > 0)) return 1;
  const k = (Math.max(0, defenderXp) * PVP_RULES.maxXpRatio) / attackerXp;
  return k >= 1 ? 1 : Math.max(PVP_RULES.weakTargetFloor, Math.round(k * 100) / 100);
}
