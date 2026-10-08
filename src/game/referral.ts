import { GameActionError } from "@/game/errors";
import { bountyState } from "@/game/bounties";
import { formatHours } from "@/game/format";
import { getRankLabel } from "@/game/ranks";
import type { PlayerState } from "@/types/game";
import { noteAmber } from "@/game/healthTrace";

/* =====================================================
   Parrainage (v4.1) : chaque joueur partage un lien. Le filleul se
   rattache à son parrain dans les 48 h qui suivent son inscription ; la
   récompense tombe quand il atteint Bronze I (2 000 XP) avec un compte
   d'au moins 3 jours et un e-mail vérifié. 5 filleuls récompensés par
   mois au plus pour un même parrain.
===================================================== */

export const REFERRAL_RULES = {
  linkWindowHours: 48,
  rewardXp: 2000,
  minAgeDays: 3,
  perMonth: 5,
  amberSponsor: 150,
  amberRecruit: 100,
  banner: "recruteur",
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const REFERRAL_RULES_META = {
  linkWindowHours: { label: "Délai pour déclarer un parrain", unit: "h", min: 1, max: 720, hint: "Après l'inscription du filleul." },
  rewardXp: { label: "XP que le filleul doit atteindre", unit: "XP", min: 0, max: 10_000_000, hint: "2 000 = Bronze I." },
  minAgeDays: { label: "Ancienneté du filleul requise", unit: "j", min: 0, max: 90 },
  perMonth: { label: "Filleuls récompensés par mois, au plus", min: 0, max: 100 },
  amberSponsor: { label: "Ambre du parrain", unit: "Ambre", min: 0, max: 10_000 },
  amberRecruit: { label: "Ambre du filleul", unit: "Ambre", min: 0, max: 10_000 },
  banner: { label: "Bannière du parrain (id)" },
};

/** 6.14.105 (AA4, AA-21) : « 48 h » (délai pour déclarer un parrain), lu dans la règle à l'usage. */
export function referralWindowText(): string {
  return formatHours(REFERRAL_RULES.linkWindowHours);
}

/** 6.14.105 (AA4) : rang à atteindre par le filleul (« Bronze I » pour 2 000 XP), lu dans `rewardXp` et la grille des rangs. */
export function referralGoalLabel(): string {
  return getRankLabel(REFERRAL_RULES.rewardXp);
}

export interface ReferralState {
  /** Côté filleul : son parrain. */
  by?: string;
  byPseudo?: string;
  linkedAtMs?: number;
  rewarded?: boolean;
  /** Côté parrain : filleuls récompensés, au total et par mois (AAAA-MM). */
  recruits?: number;
  monthly?: Record<string, number>;
}

export function referralState(p: Pick<PlayerState, "referral">): ReferralState {
  const raw = (p.referral ?? {}) as ReferralState;
  return { ...raw, recruits: Number(raw.recruits) || 0, monthly: raw.monthly && typeof raw.monthly === "object" ? raw.monthly : {} };
}

export function referralLink(origin: string, uid: string): string {
  return `${origin.replace(/\/$/, "")}/?parrain=${encodeURIComponent(uid)}`;
}

function month(now: number): string {
  return new Date(now).toISOString().slice(0, 7);
}

/** Rattache un nouveau joueur à son parrain (une seule fois, peu après l'inscription). */
export function linkReferrer(recruit: PlayerState, sponsor: Pick<PlayerState, "uid" | "pseudo" | "referral">, now: number): void {
  const st = referralState(recruit);
  if (sponsor.uid === recruit.uid) throw new GameActionError("Tu ne peux pas être ton propre parrain.");
  if (st.by) throw new GameActionError("Tu as déjà un parrain.");
  if (now - (recruit.createdAtMs ?? 0) > REFERRAL_RULES.linkWindowHours * 3600_000) throw new GameActionError(`Le parrainage se déclare dans les ${referralWindowText()} qui suivent l'inscription.`);
  if (referralState(sponsor).by === recruit.uid) throw new GameActionError("Ce joueur est déjà ton filleul.");
  recruit.referral = { ...st, by: sponsor.uid, byPseudo: sponsor.pseudo, linkedAtMs: now, rewarded: false };
}

/** Le filleul remplit-il les conditions de la récompense ? */
export function referralDue(recruit: Pick<PlayerState, "referral" | "xp" | "createdAtMs">, verified: boolean, now: number): boolean {
  const st = referralState(recruit);
  return !!st.by && !st.rewarded && verified && (recruit.xp ?? 0) >= REFERRAL_RULES.rewardXp && now - (recruit.createdAtMs ?? now) >= REFERRAL_RULES.minAgeDays * 86400_000;
}

/** Verse les récompenses (modifie les deux joueurs). `capped` : plafond mensuel du parrain atteint. */
export function grantReferral(sponsor: PlayerState, recruit: PlayerState, now: number): { capped: boolean } {
  const s = referralState(sponsor);
  const r = referralState(recruit);
  const m = month(now);
  const capped = (s.monthly?.[m] ?? 0) >= REFERRAL_RULES.perMonth;
  const rb = bountyState(recruit);
  rb.amber += REFERRAL_RULES.amberRecruit;
  recruit.bounties = rb;
  noteAmber(recruit, "referral", REFERRAL_RULES.amberRecruit, now);
  recruit.referral = { ...r, rewarded: true };
  if (!capped) {
    const sb = bountyState(sponsor);
    sb.amber += REFERRAL_RULES.amberSponsor;
    sponsor.bounties = sb;
    noteAmber(sponsor, "referral", REFERRAL_RULES.amberSponsor, now);
    sponsor.referral = { ...s, recruits: (s.recruits ?? 0) + 1, monthly: { ...s.monthly, [m]: (s.monthly?.[m] ?? 0) + 1 } };
  }
  return { capped };
}
