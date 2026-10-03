import { pb } from "@/lib/pocketbase";

/** Envoie la carte (image publique) et renvoie le lien d'aperçu à partager. */
export async function uploadVictoryCard(image: Blob, title: string, description: string, target: string, fileName = "victoire.jpg"): Promise<string> {
  const uid = pb.authStore.record?.id;
  if (!uid) throw new Error("Connecte-toi pour partager.");
  const form = new FormData();
  form.append("ownerUid", uid);
  form.append("title", title.slice(0, 120));
  form.append("description", description.slice(0, 300));
  form.append("target", target.slice(0, 200));
  form.append("createdAtMs", String(Date.now()));
  form.append("image", new File([image], fileName, { type: "image/jpeg" }));
  const rec = await pb.collection("victory_cards").create(form);
  return `${pb.baseURL.replace(/\/$/, "")}/api/cosmic/carte/${rec.id}`;
}
