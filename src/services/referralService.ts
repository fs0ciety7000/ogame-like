import { callGame } from "@/services/playerService";

/* Parrainage (v4.1) : le lien ?parrain=<uid> est mémorisé à l'arrivée sur
   le site, puis déclaré au serveur juste après l'inscription. */

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

/** Après l'inscription : rattache le joueur à son parrain (silencieux en cas d'échec). */
export async function claimPendingSponsor(): Promise<string | null> {
  const sponsor = pendingSponsor();
  if (!sponsor) return null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien */
  }
  try {
    const out = await callGame<{ sponsor: string }>("referral", { sponsor });
    return out.sponsor;
  } catch {
    return null;
  }
}

export function declareSponsor(sponsor: string) {
  return callGame<{ sponsor: string }>("referral", { sponsor });
}
