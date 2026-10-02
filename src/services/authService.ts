import { ClientResponseError } from "pocketbase";
import { pb } from "@/lib/pocketbase";
import { legacyPseudoEmail, sanitizePseudo } from "@/lib/utils";
import { deletePlayerAccountData, ensurePlayerDoc, setPlayerPseudo } from "@/services/playerService";

export { sanitizePseudo };

export class NoRecoveryEmailError extends Error {}

export function validatePseudo(pseudo: string): string | null {
  const sanitized = sanitizePseudo(pseudo);
  if (sanitized.length < 3) return "Le pseudo doit contenir au moins 3 caractères valides (lettres, chiffres, - ou _).";
  return null;
}

export function validatePassword(password: string): string | null {
  // Minimum imposé par PocketBase pour la collection users.
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Adresse email invalide.";
  return null;
}

/** Traduit une erreur PocketBase (statut HTTP + erreurs par champ) en
 *  message lisible pour le joueur. */
export function translateAuthError(err: unknown): string {
  if (!(err instanceof ClientResponseError)) return "Une erreur est survenue. Réessaie.";
  if (err.status === 0) return "Serveur injoignable. Vérifie ta connexion.";
  if (err.status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";

  const fields = (err.response?.data ?? {}) as Record<string, { code?: string }>;
  if (fields.email?.code === "validation_not_unique") return "Cet email est déjà utilisé.";
  if (fields.username?.code === "validation_not_unique") return "Ce pseudo est déjà pris.";
  if (fields.email) return "Adresse email invalide.";
  if (fields.password) return "Mot de passe trop court (8 caractères minimum).";
  if (fields.oldPassword) return "Mot de passe actuel incorrect.";

  if (err.status === 400) return "Pseudo/email ou mot de passe incorrect.";
  if (err.status === 403) return "Action non autorisée.";
  return "Une erreur est survenue. Réessaie.";
}

export async function registerPlayer(rawPseudo: string, email: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const pseudo = rawPseudo.trim();
  const cleanEmail = email.trim();

  await pb.collection("users").create({
    username: sanitized,
    name: pseudo,
    email: cleanEmail,
    emailVisibility: false,
    password,
    passwordConfirm: password,
  });
  const auth = await pb.collection("users").authWithPassword(cleanEmail, password);

  await ensurePlayerDoc(auth.record.id, pseudo);
  // Rétablit le pseudo exact si useGameSync a créé le profil entre-temps
  // avec son nom de repli.
  await setPlayerPseudo(auth.record.id, pseudo);
  // v4.7.1 : e-mail de vérification envoyé dès l'inscription (requis pour la récompense de parrainage).
  void pb.collection("users").requestVerification(cleanEmail).catch(() => undefined);
  return auth.record;
}

/** Connexion par pseudo ou par email. Les comptes créés avant l'ajout de
 *  l'email de récupération ont un email fictif dérivé du pseudo : on le
 *  tente en dernier recours. */
export async function loginPlayer(identity: string, password: string) {
  const trimmed = identity.trim();
  const candidates = trimmed.includes("@")
    ? [trimmed]
    : [sanitizePseudo(trimmed), legacyPseudoEmail(sanitizePseudo(trimmed))];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const auth = await pb.collection("users").authWithPassword(candidate, password);
      await ensurePlayerDoc(auth.record.id, (auth.record.name as string) || trimmed);
      return auth.record;
    } catch (err) {
      lastError = err;
      // Seul un échec d'identifiants justifie d'essayer le candidat suivant.
      if (!(err instanceof ClientResponseError) || err.status !== 400) throw err;
    }
  }
  throw lastError;
}

export function logout() {
  pb.realtime.unsubscribe().catch(() => {});
  pb.authStore.clear();
}

/** PocketBase envoie le lien de réinitialisation à l'email du compte : le
 *  joueur doit donc saisir son email (le pseudo seul ne permet pas de le
 *  retrouver sans exposer les emails de tous les joueurs). */
export async function requestPasswordReset(email: string) {
  const clean = email.trim();
  if (!clean.includes("@")) throw new NoRecoveryEmailError();
  // Réponse identique que le compte existe ou non (pas de fuite d'info).
  await pb.collection("users").requestPasswordReset(clean);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = pb.authStore.record;
  if (!user) throw new Error("Non connecté.");

  await pb.collection("users").update(user.id, {
    oldPassword: currentPassword,
    password: newPassword,
    passwordConfirm: newPassword,
  });
  // Changer le mot de passe invalide les jetons existants : on se reconnecte.
  await pb.collection("users").authWithPassword(user.email as string, newPassword);
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  // PocketBase exige le nouveau mot de passe et sa confirmation (identique)
  await pb.collection("users").confirmPasswordReset(
    token,
    newPassword,
    newPassword
  );
}

export async function deleteAccount(currentPassword: string, pseudo: string) {
  const user = pb.authStore.record;
  if (!user) throw new Error("Non connecté.");

  // Vérifie le mot de passe avant toute suppression.
  await pb.collection("users").authWithPassword(user.email as string, currentPassword);
  await deletePlayerAccountData(user.id, pseudo);
  await pb.collection("users").delete(user.id);
  logout();
}

export function hasRecoveryEmail(email: string | null | undefined): boolean {
  return !!email && !email.endsWith("@cosmic-empires.local");
}
