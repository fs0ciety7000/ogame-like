import { pb } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { legacyPseudoEmail, sanitizePseudo } from "@/lib/utils";
import { 
  claimUsername, 
  deletePlayerAccountData, 
  ensurePlayerDoc, 
  setPlayerPseudo 
} from "@/services/playerService";

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

/** 
 * PocketBase renvoie des erreurs HTTP via ClientResponseError.
 * On traduit ici les statuts ou les messages spécifiques.
 */
export function translateAuthError(err: unknown): string {
  if (err instanceof ClientResponseError) {
    if (err.status === 400) return "Identifiants incorrects ou données invalides.";
    if (err.status === 403) return "Action non autorisée.";
    if (err.status === 404) return "Utilisateur introuvable.";
    if (err.status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  return "Une erreur est survenue. Réessaie.";
}

export async function registerPlayer(rawPseudo: string, email: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const pseudo = rawPseudo.trim();
  const cleanEmail = email.trim();

  // 1. Création de l'utilisateur (PocketBase requiert passwordConfirm)
  const user = await pb.collection("users").create({
    username: sanitized,
    name: pseudo,
    email: cleanEmail,
    password: password,
    passwordConfirm: password,
  });

  // 2. Connexion automatique dans la foulée
  const authData = await pb.collection("users").authWithPassword(cleanEmail, password);

  // 3. Création des documents liés au jeu
  await ensurePlayerDoc(authData.record.id, pseudo);
  await setPlayerPseudo(authData.record.id, pseudo);
  await claimUsername(authData.record.id, sanitized, cleanEmail);

  return authData.record;
}

export async function loginPlayer(rawPseudo: string, password: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  const pseudo = rawPseudo.trim();

  try {
    // PocketBase accepte indifféremment l'email ou l'username dans le premier paramètre.
    // Plus besoin de la boucle sur les "candidates" !
    const authData = await pb.collection("users").authWithPassword(sanitized, password);
    
    await ensurePlayerDoc(authData.record.id, pseudo);
    await setPlayerPseudo(authData.record.id, pseudo);
    
    return authData.record;
  } catch (err) {
    // Fallback pour les très vieux comptes qui n'auraient pas de champ "username" valide dans PB
    try {
      const legacyEmail = legacyPseudoEmail(sanitized);
      const authData = await pb.collection("users").authWithPassword(legacyEmail, password);
      return authData.record;
    } catch (fallbackErr) {
      throw err; // On throw l'erreur d'origine si le fallback échoue
    }
  }
}

export function logout() {
  pb.authStore.clear();
}

export async function requestPasswordReset(rawPseudo: string) {
  const sanitized = sanitizePseudo(rawPseudo);
  
  try {
    // On cherche l'utilisateur par son username pour trouver son email réel
    const user = await pb.collection("users").getFirstListItem(`username="${sanitized}"`);
    
    if (!hasRecoveryEmail(user.email)) {
      throw new NoRecoveryEmailError();
    }
    
    await pb.collection("users").requestPasswordReset(user.email);
  } catch (err) {
    if (err instanceof NoRecoveryEmailError) throw err;
    // Si l'utilisateur n'existe pas, on throw la même erreur pour ne pas fuiter d'infos
    throw new NoRecoveryEmailError(); 
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = pb.authStore.model;
  if (!user) throw new Error("Non connecté.");

  // PocketBase gère le changement de mot de passe via l'API update classique
  // en passant l'ancien mot de passe pour des raisons de sécurité
  await pb.collection("users").update(user.id, {
    oldPassword: currentPassword,
    password: newPassword,
    passwordConfirm: newPassword,
  });
}

export async function deleteAccount(currentPassword: string, pseudo: string) {
  const user = pb.authStore.model;
  if (!user) throw new Error("Non connecté.");

  // On vérifie que le mot de passe actuel est bon avant de tout supprimer
  await pb.collection("users").authWithPassword(user.username || user.email, currentPassword);

  // Suppression des données annexes (planètes, flottes, etc.)
  await deletePlayerAccountData(user.id, pseudo);
  
  // Suppression définitive du compte Auth
  await pb.collection("users").delete(user.id);
  
  pb.authStore.clear();
}

export function hasRecoveryEmail(email: string | null | undefined): boolean {
  return !!email && !email.endsWith("@cosmic-empires.local");
}