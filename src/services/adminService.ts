import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/authStore";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   Administration du jeu.

   Un administrateur est un compte dont l'id figure dans la collection
   `admins` (modifiable uniquement par un superuser PocketBase : admin
   PocketBase → collection admins → New record, id = id du compte, ou
   ADMIN_EMAILS dans pocketbase/setup.mjs). Les règles d'accès
   (pocketbase/pb_schema.json) donnent à ces comptes l'écriture sur
   game_config, game_assets et les profils joueurs.
===================================================== */

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    await pb.collection("admins").getOne(uid, { fields: "id" });
    return true;
  } catch {
    return false;
  }
}

/** true si le joueur connecté est administrateur (false pendant la vérification). */
export function useIsAdmin(): boolean {
  const uid = useAuthStore((s) => s.user?.uid);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    checkIsAdmin(uid).then((v) => active && setIsAdmin(v));
    return () => {
      active = false;
    };
  }, [uid]);
  return isAdmin;
}

export type AdminPlayer = PlayerState & { id: string };

export async function adminListPlayers(): Promise<AdminPlayer[]> {
  const records = await pb.collection("players").getFullList<AdminPlayer>({ sort: "-xp" });
  return records.map((r) => ({ ...r, uid: r.id }));
}

/** Modifie un profil joueur (ressources, niveaux, XP…). */
export async function adminUpdatePlayer(id: string, patch: Partial<PlayerState>) {
  const data: Partial<PlayerState> = { ...patch };
  delete data.uid;
  await pb.collection("players").update(id, data);
}

export async function adminGetQueues(id: string): Promise<QueuesState | null> {
  try {
    return await pb.collection("queues").getOne<QueuesState>(id);
  } catch {
    return null;
  }
}

/** Vide les files d'attente d'un joueur (déblocage d'un état incohérent). */
export async function adminClearQueues(id: string) {
  await pb.collection("queues").update(id, {
    buildingUpgrades: {},
    unitQueues: { attack: [], defense: [] },
    activeResearches: [],
    activeMissions: [],
  });
}

/** Remet l'XP (totale et de saison) de tous les joueurs à zéro. */
export async function adminResetAllXp(onProgress?: (done: number, total: number) => void): Promise<number> {
  const players = await pb.collection("players").getFullList({ fields: "id" });
  let done = 0;
  for (const p of players) {
    await pb.collection("players").update(p.id, { xp: 0, seasonXp: 0 });
    onProgress?.(++done, players.length);
  }
  return players.length;
}

/** Envoie une image dans la collection game_assets et renvoie son URL publique. */
export async function adminUploadAsset(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", file.name);
  const record = await pb.collection("game_assets").create(form);
  return pb.files.getURL(record, record.file as string);
}
