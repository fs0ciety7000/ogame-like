import { pb } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";

/* v4.8 : Codex. Les seigneurs affrontés se lisent dans les rapports de combat du joueur. */

export async function fetchNpcOpponents(uid: string): Promise<string[]> {
  const list = await pb.collection("battle_reports").getFullList<{ attackerUid: string; defenderUid: string }>({
    filter: pb.filter("(attackerUid = {:u} && defenderUid ~ 'npc') || (defenderUid = {:u} && attackerUid ~ 'npc')", { u: uid }),
    fields: "attackerUid,defenderUid",
  });
  return [...new Set(list.map((r) => (r.attackerUid === uid ? r.defenderUid : r.attackerUid)))];
}

export function claimCodexTitle() {
  return callGame<{ title: string }>("codex/claim");
}

/** 5.15.11 : récompense d'une catégorie complète du Codex (jetons, Ambre). */
export function claimCodexCategoryReward(category: string) {
  return callGame<{ category: string; tokens: number; amber: number }>("codex/claim", { category });
}
