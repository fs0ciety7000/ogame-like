/* =====================================================
   6.14.112 (AU27, lot AC-F, constat AC-16) : erreurs du serveur traduites.
   Avant, `callGame` ne traduisait que 400 et 404 : une 403 (« Parole
   retirée »), une 409, une 429 ou une 503 (maintenance) remontait brute et
   73 écrans affichaient « Action impossible. » sans dire pourquoi.
   Règle : le message du serveur du jeu (français) est gardé ; un message
   générique de PocketBase (anglais) ou absent est remplacé par un texte
   clair selon le statut. Une 500 devient « Erreur du serveur » et part à
   l'équipe (`reports/error`).
===================================================== */

export const GAME_ERROR_TEXTS = {
  network: "Connexion au serveur perdue : vérifie ta connexion et réessaie.",
  badRequest: "Action impossible.",
  forbidden: "Action refusée : tu n'as pas le droit de faire ça.",
  notFound: "Introuvable : la page ou l'objet n'existe plus.",
  conflict: "L'état a changé entre-temps : recharge la page et réessaie.",
  tooMany: "Trop de demandes d'un coup : attends quelques secondes et réessaie.",
  maintenance: "Le jeu est en maintenance : réessaie à la réouverture.",
  // 6.14.164 (S4, NJ-11) : 502, 504, ou 503 sans message du jeu : le relais ne trouve pas le serveur (mise à jour en cours).
  restarting: "Serveur en cours de mise à jour : rien n'a été fait, réessaie dans quelques secondes.",
  server: "Erreur du serveur : réessaie dans un instant. L'équipe est prévenue.",
} as const;

/** Messages par défaut de PocketBase (anglais) : jamais montrés au joueur. */
const GENERIC = /^(Something went wrong|The request|Too Many Requests|You are not allowed|The requested resource|Failed to|An error occurred|Missing or invalid|Only superusers|Bad Request|Forbidden|Not Found|Internal Server Error|Service Unavailable)/i;

/** Message du serveur utilisable tel quel (texte du jeu, en français) ? */
export function isGameMessage(message: unknown): message is string {
  return typeof message === "string" && message.trim().length > 0 && !GENERIC.test(message.trim());
}

/** Texte à montrer au joueur pour un statut HTTP et le message du serveur. */
export function gameErrorText(status: number, serverMessage?: unknown): string {
  const own = isGameMessage(serverMessage) ? serverMessage.trim() : null;
  if (!status) return GAME_ERROR_TEXTS.network;
  if (status === 503) return own ?? GAME_ERROR_TEXTS.restarting;
  if (status === 502 || status === 504) return GAME_ERROR_TEXTS.restarting;
  if (status >= 500) return GAME_ERROR_TEXTS.server;
  if (status === 429) return own ?? GAME_ERROR_TEXTS.tooMany;
  if (status === 409) return own ?? GAME_ERROR_TEXTS.conflict;
  if (status === 403 || status === 401) return own ?? GAME_ERROR_TEXTS.forbidden;
  if (status === 404) return own ?? GAME_ERROR_TEXTS.notFound;
  return own ?? GAME_ERROR_TEXTS.badRequest;
}

/** Faut-il prévenir l'équipe ? (erreur du serveur, pas une règle du jeu) */
export function isServerFault(status: number): boolean {
  // 6.14.164 (S4, NJ-11) : 502 et 504 viennent du relais pendant un redéploiement, pas d'une erreur du jeu.
  return status >= 500 && status !== 502 && status !== 503 && status !== 504;
}
