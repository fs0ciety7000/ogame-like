import { pb } from "@/lib/pocketbase";

/* 5.16 : réactions des spectateurs sur le fil d'un boss. L'état revient
   par l'abonnement habituel (game_config ou fiche d'alliance). */

export type BossKind = "leviathan" | "season" | "alliance";

export async function reactToBoss(boss: BossKind, key: string, emoji: string): Promise<void> {
  await pb.send("/api/cosmic/boss/react", { method: "POST", body: { boss, key, emoji } });
}
