import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { BANNERS_KEY, dismissKey, normalizeBanners, type Banner } from "@/game/banners";

/* Bandeaux d'annonce (v3.7) : reçus avec le reste de game_config par
   contentService ; bandeaux masqués retenus sur l'appareil. */

const DISMISSED_KEY = "cosmic-empires:banners-dismissed";

function readDismissed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

export const useBannerStore = create<{ banners: Banner[]; dismissed: string[] }>(() => ({ banners: [], dismissed: readDismissed() }));

export function applyBannersRecord(data: unknown | null) {
  useBannerStore.setState({ banners: normalizeBanners(data) });
}

export function dismissBanner(banner: Banner) {
  const key = dismissKey(banner);
  // On ne garde que les clés des bandeaux encore existants.
  const existing = new Set(useBannerStore.getState().banners.map(dismissKey));
  const dismissed = [...new Set([...useBannerStore.getState().dismissed.filter((k) => existing.has(k)), key])];
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  } catch {
    /* navigation privée : masqué jusqu'au prochain chargement */
  }
  useBannerStore.setState({ dismissed });
}

/** Administration : enregistre la liste complète des bandeaux. */
export async function saveBanners(banners: Banner[]) {
  const existing = await pb
    .collection("game_config")
    .getFirstListItem<{ id: string }>(pb.filter("key = {:key}", { key: BANNERS_KEY }))
    .catch(() => null);
  if (existing) await pb.collection("game_config").update(existing.id, { data: banners });
  else await pb.collection("game_config").create({ key: BANNERS_KEY, data: banners });
  applyBannersRecord(banners);
}
