import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { EMOJIS_KEY, normalizeCustomEmojis, type CustomEmoji } from "@/game/emojis";

/* Emojis personnalisés (v3.8), reçus avec le reste de game_config. */
export const useEmojiStore = create<{ emojis: CustomEmoji[] }>(() => ({ emojis: [] }));

export function applyEmojisRecord(data: unknown | null) {
  useEmojiStore.setState({ emojis: normalizeCustomEmojis(data) });
}

/** Administration : enregistre la liste complète. */
export async function saveCustomEmojis(emojis: CustomEmoji[]) {
  const existing = await pb
    .collection("game_config")
    .getFirstListItem<{ id: string }>(pb.filter("key = {:key}", { key: EMOJIS_KEY }))
    .catch(() => null);
  if (existing) await pb.collection("game_config").update(existing.id, { data: emojis });
  else await pb.collection("game_config").create({ key: EMOJIS_KEY, data: emojis });
  applyEmojisRecord(emojis);
}
