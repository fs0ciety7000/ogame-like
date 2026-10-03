import { pb } from "@/lib/pocketbase";
import { callGame, ensurePlayerDoc } from "@/services/playerService";

/* =====================================================
   v5.9 : connexion par Google (OAuth2 de PocketBase).
   Les fournisseurs s'activent dans le tableau de bord PocketBase
   (collection users → OAuth2) : le jeu n'affiche que ceux qui sont
   configurés. Un compte dont l'e-mail existe déjà y est rattaché par
   PocketBase ; un nouveau compte choisit d'abord son pseudo.
===================================================== */

export type OAuthProviderId = "google";

export const OAUTH_PROVIDERS: { id: OAuthProviderId; label: string }[] = [
  { id: "google", label: "Google" },
];

/** Fournisseurs activés côté serveur (vide si OAuth2 n'est pas configuré). */
export async function enabledOAuthProviders(): Promise<OAuthProviderId[]> {
  try {
    const methods = await pb.collection("users").listAuthMethods();
    const names = new Set((methods.oauth2?.enabled ? methods.oauth2.providers : []).map((p) => p.name));
    return OAUTH_PROVIDERS.map((p) => p.id).filter((id) => names.has(id));
  } catch {
    return [];
  }
}

export function oauthErrorMessage(err: unknown): string {
  const message = (err as { response?: { message?: string }; message?: string })?.response?.message ?? (err as { message?: string })?.message ?? "";
  if (/cancel|closed|popup/i.test(message)) return "Connexion annulée.";
  return message || "Connexion impossible pour le moment.";
}

/** Ouvre la fenêtre du fournisseur. Retourne true si le compte doit encore choisir son pseudo. */
export async function signInWithProvider(provider: OAuthProviderId): Promise<boolean> {
  const auth = await pb.collection("users").authWithOAuth2({ provider });
  const pseudo = String(auth.record.name || auth.record.username || "");
  if (!pseudo) return true;
  await ensurePlayerDoc(auth.record.id, pseudo);
  return false;
}

/** Premier pseudo d'un compte Google, puis création de l'empire. */
export async function chooseFirstPseudo(pseudo: string): Promise<void> {
  await callGame("account/pseudo", { pseudo });
  const refreshed = await pb.collection("users").authRefresh();
  await ensurePlayerDoc(refreshed.record.id, String(refreshed.record.name || pseudo));
}

export interface LinkedAccount {
  id: string;
  provider: string;
}

export async function listLinkedAccounts(uid: string): Promise<LinkedAccount[]> {
  const rows = await pb.collection("_externalAuths").getFullList({ filter: pb.filter("recordRef = {:u}", { u: uid }) });
  return rows.map((r) => ({ id: r.id, provider: String(r.provider) }));
}

/** Rattache un fournisseur au compte connecté (même fenêtre que la connexion). */
export async function linkProvider(provider: OAuthProviderId): Promise<void> {
  const token = pb.authStore.token;
  const record = pb.authStore.record;
  const auth = await pb.collection("users").authWithOAuth2({ provider });
  // Garde-fou : un autre compte (e-mail différent) ne doit pas remplacer la session.
  if (record && auth.record.id !== record.id) {
    pb.authStore.save(token, record);
    throw new Error("Ce compte est déjà lié à un autre empire.");
  }
}

export async function unlinkAccount(id: string): Promise<void> {
  await pb.collection("_externalAuths").delete(id);
}
