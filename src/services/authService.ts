import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { legacyPseudoEmail, sanitizePseudo } from "@/lib/utils";
import { claimUsername, deletePlayerAccountData, ensurePlayerDoc, resolveEmailForPseudo, setPlayerPseudo } from "@/services/playerService";

export { sanitizePseudo };

export class NoRecoveryEmailError extends Error {}

export function validatePseudo(pseudo: string): string | null {
  const sanitized = sanitizePseudo(pseudo);
  if (sanitized.length < 3) return "Le pseudo doit contenir au moins 3 caractères valides (lettres, chiffres, - ou _).";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Adresse email invalide.";
  return null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Cet email est déjà utilisé par un autre compte.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-credential": "Pseudo ou mot de passe incorrect.",
  "auth/user-not-found": "Pseudo ou mot de passe incorrect.",
  "auth/wrong-password": "Pseudo ou mot de passe incorrect.",
  "auth/invalid-email": "Adresse email invalide.",
  "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
  "auth/network-request-failed": "Problème réseau. Vérifie ta connexion.",
  "auth/operation-not-allowed":
    "La connexion par mot de passe n'est pas activée sur ce projet Firebase (Authentication → Sign-in method → Email/Password).",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Clé API Firebase invalide. Vérifie ton .env.local.",
  "auth/requires-recent-login": "Pour ta sécurité, reconnecte-toi puis réessaie cette action.",
};

export function translateAuthError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Une erreur est survenue. Réessaie.";
}

/** Inscription : l'email est désormais requis et devient directement
 *  l'identifiant Firebase Auth (contrairement à l'ancien schéma "pseudo@
 *  cosmic-empires.local"), ce qui permet un vrai mot de passe oublié. */
export async function registerPlayer(rawPseudo: string, email: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const pseudo = rawPseudo.trim();
  const cleanEmail = email.trim();

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateProfile(credential.user, { displayName: pseudo });
  await ensurePlayerDoc(credential.user.uid, pseudo);
  // Rétablit le pseudo exact même si useGameSync a déjà créé le profil
  // entre-temps avec son nom de repli générique (voir setPlayerPseudo).
  await setPlayerPseudo(credential.user.uid, pseudo);
  await claimUsername(credential.user.uid, sanitized, cleanEmail);
  return credential.user;
}

/** Connexion par pseudo : résout l'email associé (comptes créés avec un
 *  email réel) et retombe sur l'ancien schéma d'email fictif pour les
 *  comptes créés avant l'ajout de cette fonctionnalité. */
export async function loginPlayer(rawPseudo: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const pseudo = rawPseudo.trim();

  const resolvedEmail = await resolveEmailForPseudo(sanitized).catch(() => null);
  const candidates = [...new Set([resolvedEmail, legacyPseudoEmail(sanitized)].filter((e): e is string => !!e))];

  let lastError: unknown = null;
  for (const email of candidates) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensurePlayerDoc(credential.user.uid, pseudo);
      await setPlayerPseudo(credential.user.uid, pseudo);
      return credential.user;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function logout() {
  await signOut(auth);
}

/** Envoie un lien de réinitialisation à l'email de récupération associé au
 *  pseudo. Ne fonctionne que pour les comptes inscrits avec un email réel :
 *  l'ancien schéma d'email fictif n'est jamais un email réellement
 *  joignable, donc aucun lien ne pourrait y être délivré. */
export async function requestPasswordReset(rawPseudo: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const email = await resolveEmailForPseudo(sanitized);
  if (!email) throw new NoRecoveryEmailError();
  await sendPasswordResetEmail(auth, email);
}

async function reauthenticate(currentPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Non connecté.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  return user;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = await reauthenticate(currentPassword);
  await updatePassword(user, newPassword);
}

export async function deleteAccount(currentPassword: string, pseudo: string) {
  const user = await reauthenticate(currentPassword);
  await deletePlayerAccountData(user.uid, pseudo);
  await deleteUser(user);
}

/** Un compte a un email de récupération exploitable seulement s'il ne
 *  s'agit pas de l'ancien domaine fictif interne. */
export function hasRecoveryEmail(email: string | null | undefined): boolean {
  return !!email && !email.endsWith("@cosmic-empires.local");
}
