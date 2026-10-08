import { pb } from "@/lib/pocketbase";
import { claimCodexCategoryAction, claimCodexTitleAction } from "@/services/playerService";

/* v4.8 : Codex. Les seigneurs affrontés se lisent dans les rapports de combat du joueur. */

export async function fetchNpcOpponents(uid: string): Promise<string[]> {
  const list = await pb.collection("battle_reports").getFullList<{ attackerUid: string; defenderUid: string }>({
    filter: pb.filter("(attackerUid = {:u} && defenderUid ~ 'npc') || (defenderUid = {:u} && attackerUid ~ 'npc')", { u: uid }),
    fields: "attackerUid,defenderUid",
  });
  return [...new Set(list.map((r) => (r.attackerUid === uid ? r.defenderUid : r.attackerUid)))];
}

/** 6.14.113 (AC-19) : par l'action du joueur (avant : route `codex/claim`, sans rattrapage ni garde des vacances). */
export function claimCodexTitle() {
  return claimCodexTitleAction();
}

/** 5.15.11 : récompense d'une catégorie complète du Codex (jetons, Ambre). 6.14.113 : par l'action du joueur. */
export async function claimCodexCategoryReward(category: string) {
  const out = await claimCodexCategoryAction(category);
  return { category, ...out };
}
