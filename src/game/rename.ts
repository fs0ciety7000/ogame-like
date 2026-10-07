import { bountyState } from "@/game/bounties";
import { GameActionError } from "@/game/errors";
import type { PlayerState } from "@/types/game";

/** v5.1 : un seul changement de pseudo par compte, contre de l'Ambre. */
export const RENAME_RULES = {
  amber: 10,
  minLength: 3,
  maxLength: 20,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const RENAME_RULES_META = {
  amber: { label: "Prix d'un changement de pseudo", unit: "Ambre", min: 0, max: 10_000 },
  minLength: { label: "Pseudo : longueur minimale", unit: "caractères", min: 1, max: 20 },
  maxLength: { label: "Pseudo : longueur maximale", unit: "caractères", min: 3, max: 40 },
};

export interface RenameState {
  fromPseudo: string;
  atMs: number;
}

/** Identifiant de connexion dérivé du pseudo (même règle qu'à l'inscription). */
export function pseudoLogin(pseudo: string): string {
  return pseudo.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

/** Pseudo affiché : espaces resserrés ; au moins 3 caractères utilisables pour la connexion. */
export function cleanNewPseudo(raw: unknown): string {
  const pseudo = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (pseudo.length > RENAME_RULES.maxLength) throw new GameActionError(`Le pseudo fait ${RENAME_RULES.maxLength} caractères au plus.`);
  if (pseudoLogin(pseudo).length < RENAME_RULES.minLength) throw new GameActionError("Le pseudo doit contenir au moins 3 caractères valides (lettres, chiffres, - ou _).");
  return pseudo;
}

/** Applique le renommage (vérifie le droit et paie l'Ambre). L'unicité est vérifiée par le serveur. */
export function renamePlayer(player: PlayerState, raw: unknown, now: number): { pseudo: string; login: string } {
  if (player.renamed) throw new GameActionError("Tu as déjà changé de pseudo.");
  const pseudo = cleanNewPseudo(raw);
  if (pseudo === player.pseudo) throw new GameActionError("C'est déjà ton pseudo.");
  const st = bountyState(player);
  if (st.amber < RENAME_RULES.amber) throw new GameActionError(`Il te faut ${RENAME_RULES.amber} Ambre.`);
  st.amber -= RENAME_RULES.amber;
  player.bounties = st;
  player.renamed = { fromPseudo: player.pseudo, atMs: now };
  player.pseudo = pseudo;
  return { pseudo, login: pseudoLogin(pseudo) };
}
