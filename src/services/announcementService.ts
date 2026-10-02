import { create } from "zustand";
import { pb } from "@/lib/pocketbase";
import { ANNOUNCEMENTS_KEY, emptyAnnouncementSettings, normalizeAnnouncementSettings, type AnnouncementSettings } from "@/game/announcements";

/* v4.5 : réglages des annonces plein écran, reçus avec game_config. */

export const useAnnouncementSettings = create<AnnouncementSettings>(() => emptyAnnouncementSettings());

export function applyAnnouncementsRecord(data: unknown | null) {
  useAnnouncementSettings.setState(normalizeAnnouncementSettings(data), true);
}

/** Administration : enregistre annonces créées et calendrier. */
export async function saveAnnouncementSettings(settings: AnnouncementSettings) {
  const data = normalizeAnnouncementSettings(settings);
  const existing = await pb
    .collection("game_config")
    .getFirstListItem<{ id: string }>(pb.filter("key = {:key}", { key: ANNOUNCEMENTS_KEY }))
    .catch(() => null);
  if (existing) await pb.collection("game_config").update(existing.id, { data });
  else await pb.collection("game_config").create({ key: ANNOUNCEMENTS_KEY, data });
  applyAnnouncementsRecord(data);
}

/** Aperçu d'une annonce par un administrateur (sans la marquer vue). */
export const useAnnouncementPreview = create<{ id: string | null }>(() => ({ id: null }));
export function previewAnnouncement(id: string | null) {
  useAnnouncementPreview.setState({ id });
}
