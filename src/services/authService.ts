import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensurePlayerDoc } from "@/services/playerService";

export function sanitizePseudo(pseudo: string): string {
  return pseudo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function pseudoToEmail(sanitized: string): string {
  return `${sanitized}@cosmic-empires.local`;
}

export function validatePseudo(pseudo: string): string | null {
  const sanitized = sanitizePseudo(pseudo);
  if (sanitized.length < 3) return "Le pseudo doit contenir au moins 3 caractères valides (lettres, chiffres, - ou _).";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  return null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Ce pseudo est déjà pris.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-credential": "Pseudo ou mot de passe incorrect.",
  "auth/user-not-found": "Pseudo ou mot de passe incorrect.",
  "auth/wrong-password": "Pseudo ou mot de passe incorrect.",
  "auth/invalid-email": "Pseudo invalide (utilise uniquement lettres, chiffres, - et _).",
  "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
  "auth/network-request-failed": "Problème réseau. Vérifie ta connexion.",
};

export function translateAuthError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Une erreur est survenue. Réessaie.";
}

export async function registerPlayer(rawPseudo: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const email = pseudoToEmail(sanitized);
  const pseudo = rawPseudo.trim();

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: pseudo });
  await ensurePlayerDoc(credential.user.uid, pseudo);
  return credential.user;
}

export async function loginPlayer(rawPseudo: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const email = pseudoToEmail(sanitized);

  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensurePlayerDoc(credential.user.uid, rawPseudo.trim());
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}
