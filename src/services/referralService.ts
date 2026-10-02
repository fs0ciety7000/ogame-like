import { pb } from "@/lib/pocketbase";
import { callGame, GameActionError } from "@/services/playerService";

/* Parrainage (v4.1) : le lien ?parrain=<uid> est mémorisé à l'arrivée sur
   le site, puis déclaré au serveur juste après l'inscription.
   v4.7.1 : le lien ouvre directement l'inscription, le parrain en attente
   n'est oublié qu'une fois déclaré (ou refusé par le serveur), et une
   nouvelle tentative a lieu au chargement du jeu. */

const KEY = "cosmic-empires:parrain";

export function rememberSponsorFromUrl() {
  try {
    const id = new URLSearchParams(window.location.search).get("parrain");
    if (id && /^[a-z0-9]{6,30}$/i.test(id)) localStorage.setItem(KEY, id);
  } catch {
    /* stockage indisponible */
  }
}

export function pendingSponsor(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function forgetSponsor() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien */
  }
}

/** Pseudo du parrain d'un lien (page d'inscription, sans connexion). */
export async function fetchSponsorName(id: string): Promise<string | null> {
  try {
    const out = await pb.send<{ pseudo: string }>(`/api/cosmic/referral/sponsor?id=${encodeURIComponent(id)}`, { method: "GET" });
    return out.pseudo || null;
  } catch {
    return null;
  }
}

/**
 * Rattache le joueur connecté au parrain en attente. Le lien n'est oublié
 * qu'en cas de succès ou de refus du serveur (déjà un parrain, délai
 * dépassé…), pas sur une erreur réseau.
 */
export async function claimPendingSponsor(): Promise<string | null> {
  const sponsor = pendingSponsor();
  if (!sponsor) return null;
  try {
    const out = await callGame<{ sponsor: string }>("referral", { sponsor });
    forgetSponsor();
    return out.sponsor;
  } catch (err) {
    if (err instanceof GameActionError) forgetSponsor();
    return null;
  }
}

export function declareSponsor(sponsor: string) {
  return callGame<{ sponsor: string }>("referral", { sponsor });
}

export interface ReferralInfo {
  recruits: { pseudo: string; xp: number; createdAtMs: number; verified: boolean; rewarded: boolean }[];
  verified: boolean;
  rules: { rewardXp: number; minAgeDays: number };
  now: number;
}

export function fetchReferralInfo(): Promise<ReferralInfo> {
  return pb.send<ReferralInfo>("/api/cosmic/referral", { method: "GET" });
}

/** Envoie (ou renvoie) l'e-mail de vérification du compte connecté. */
export async function sendVerificationEmail(): Promise<void> {
  const email = pb.authStore.record?.email as string | undefined;
  if (!email) throw new Error("Aucun e-mail sur ce compte.");
  await pb.collection("users").requestVerification(email);
}
