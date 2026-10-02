import { applyEmojisRecord } from "@/services/emojiService";
import { EMOJIS_KEY } from "@/game/emojis";
import { applyChallengeRecord } from "@/services/challengeService";
import { CHALLENGE_KEY } from "@/game/challenges";
import { applyBannersRecord } from "@/services/bannerService";
import { BANNERS_KEY } from "@/game/banners";
import { create } from "zustand";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import {
  applyGameContent,
  CONTENT_SECTIONS,
  currentGameContent,
  type ContentSection,
  type GameContent,
} from "@/game/content";
import { MAINTENANCE_KEY } from "@/game/maintenance";
import { applyMaintenanceRecord } from "@/services/maintenanceService";
import { STAFF_KEY } from "@/game/staff";
import { applyStaffRecord } from "@/services/staffService";
import { LEVIATHAN_KEY } from "@/game/leviathan";
import { applyLeviathanRecord } from "@/services/leviathanService";

/* =====================================================
   Contenu du jeu (bâtiments, unités, technos, missions, règles) stocké
   dans la collection `game_config` : un enregistrement par section
   { key, data }. Une section absente = valeurs par défaut du code.
===================================================== */

interface ContentState {
  /** Incrémenté à chaque application de contenu : les écrans qui dépendent
   *  des définitions (arbre du Labo…) s'en servent pour se recalculer. */
  version: number;
  loaded: boolean;
  /** Sections actuellement personnalisées en base. */
  customized: ContentSection[];
}

export const useContentStore = create<ContentState>(() => ({ version: 0, loaded: false, customized: [] }));

type ConfigRecord = { id: string; key: ContentSection; data: unknown };

/** Empreinte du contenu appliqué : on ne réapplique (et ne remonte les
 *  écrans) que si une section du contenu a réellement changé — pas à chaque
 *  mise à jour du Léviathan ou de la maintenance. */
let lastSignature: string | null = null;

function applyRecords(records: ConfigRecord[]) {
  applyMaintenanceRecord(records.find((r) => (r.key as string) === MAINTENANCE_KEY)?.data ?? null);
  applyStaffRecord(records.find((r) => (r.key as string) === STAFF_KEY)?.data ?? null);
  applyLeviathanRecord(records.find((r) => (r.key as string) === LEVIATHAN_KEY)?.data ?? null);
  applyBannersRecord(records.find((r) => (r.key as string) === BANNERS_KEY)?.data ?? null);
  applyChallengeRecord(records.find((r) => (r.key as string) === CHALLENGE_KEY)?.data ?? null);
  applyEmojisRecord(records.find((r) => (r.key as string) === EMOJIS_KEY)?.data ?? null);
  const overrides: Partial<GameContent> = {};
  for (const r of records) {
    if (CONTENT_SECTIONS.includes(r.key) && r.data) {
      (overrides as Record<string, unknown>)[r.key] = r.data;
    }
  }
  const signature = JSON.stringify(overrides);
  if (signature === lastSignature) return;
  lastSignature = signature;
  applyGameContent(overrides);
  useContentStore.setState((s) => ({
    version: s.version + 1,
    loaded: true,
    customized: Object.keys(overrides) as ContentSection[],
  }));
}

async function fetchRecords(): Promise<ConfigRecord[]> {
  return pb.collection("game_config").getFullList<ConfigRecord>();
}

let started = false;

/** Charge le contenu au démarrage puis suit ses modifications en direct.
 *  En cas d'échec (collection absente, serveur injoignable), le jeu tourne
 *  avec le contenu par défaut du code. */
export function startContentSync() {
  if (started) return;
  started = true;
  fetchRecords()
    .then(applyRecords)
    .catch((err) => {
      console.warn("Contenu du jeu indisponible, valeurs par défaut utilisées :", err);
      useContentStore.setState({ loaded: true });
      applyMaintenanceRecord(null);
    });
  subscribeRecords("game_config", "*", () => {
    fetchRecords()
      .then(applyRecords)
      .catch(() => {});
  });
}

/* ---------- écriture (administration) ---------- */

async function findSectionRecord(section: ContentSection): Promise<ConfigRecord | null> {
  try {
    return await pb.collection("game_config").getFirstListItem<ConfigRecord>(pb.filter("key = {:key}", { key: section }));
  } catch {
    return null;
  }
}

export async function saveContentSection<K extends ContentSection>(section: K, data: GameContent[K]) {
  const existing = await findSectionRecord(section);
  if (existing) await pb.collection("game_config").update(existing.id, { data });
  else await pb.collection("game_config").create({ key: section, data });
  applyRecords(await fetchRecords());
}

/** Supprime la personnalisation d'une section (retour aux valeurs du code). */
export async function resetContentSection(section: ContentSection) {
  const existing = await findSectionRecord(section);
  if (existing) await pb.collection("game_config").delete(existing.id);
  applyRecords(await fetchRecords());
}

export function exportCurrentContent(): GameContent {
  return currentGameContent();
}
