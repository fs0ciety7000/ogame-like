/* =====================================================
   v4.5 : annonces plein écran pilotées depuis l'administration
   (game_config « announcements ») : annonces créées sans toucher au code,
   et calendrier (début, fin, désactivation) de toutes les annonces.
===================================================== */

export const ANNOUNCEMENTS_KEY = "announcements";

export interface AnnouncementFeature {
  title: string;
  text: string;
  to: string;
  image?: string;
}

/** Annonce créée dans l'administration (mêmes champs que celles du code). */
export interface CustomAnnouncement {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  art?: string;
  artMobile?: string;
  tone?: "danger" | "gold";
  features?: AnnouncementFeature[];
  cta: { label: string; to: string };
  createdAtMs: number;
}

export interface AnnouncementSchedule {
  startsAtMs?: number | null;
  endsAtMs?: number | null;
  disabled?: boolean;
}

export interface AnnouncementSettings {
  custom: CustomAnnouncement[];
  schedule: Record<string, AnnouncementSchedule>;
}

export function emptyAnnouncementSettings(): AnnouncementSettings {
  return { custom: [], schedule: {} };
}

const str = (v: unknown, max = 600) => String(v ?? "").slice(0, max);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

export function normalizeAnnouncementSettings(raw: unknown): AnnouncementSettings {
  const r = (raw ?? {}) as Partial<AnnouncementSettings>;
  const custom = (Array.isArray(r.custom) ? r.custom : [])
    .filter((a): a is CustomAnnouncement => !!a && typeof a === "object" && typeof (a as { id?: unknown }).id === "string")
    .map((a) => ({
      id: str(a.id, 60),
      eyebrow: str(a.eyebrow, 120),
      title: str(a.title, 120),
      text: str(a.text, 600),
      art: a.art ? str(a.art, 300) : undefined,
      artMobile: a.artMobile ? str(a.artMobile, 300) : undefined,
      tone: a.tone === "gold" ? ("gold" as const) : ("danger" as const),
      features: (Array.isArray(a.features) ? a.features : []).slice(0, 4).map((f) => ({ title: str(f?.title, 80), text: str(f?.text, 200), to: str(f?.to || "/game", 120), image: f?.image ? str(f.image, 300) : undefined })),
      cta: { label: str(a.cta?.label || "Voir", 40), to: str(a.cta?.to || "/game", 120) },
      createdAtMs: num(a.createdAtMs) ?? 0,
    }));
  const schedule: Record<string, AnnouncementSchedule> = {};
  if (r.schedule && typeof r.schedule === "object") {
    for (const [id, s] of Object.entries(r.schedule)) {
      if (!s || typeof s !== "object") continue;
      schedule[id] = { startsAtMs: num(s.startsAtMs), endsAtMs: num(s.endsAtMs), disabled: s.disabled === true };
    }
  }
  return { custom, schedule };
}

/** L'annonce est-elle diffusable maintenant ? */
export function announcementLive(id: string, settings: AnnouncementSettings, now: number): boolean {
  const s = settings.schedule[id];
  if (!s) return true;
  if (s.disabled) return false;
  if (s.startsAtMs && s.startsAtMs > now) return false;
  if (s.endsAtMs && s.endsAtMs <= now) return false;
  return true;
}

/** État affiché dans l'administration. */
export function announcementStatus(id: string, settings: AnnouncementSettings, now: number): "live" | "scheduled" | "ended" | "disabled" {
  const s = settings.schedule[id];
  if (s?.disabled) return "disabled";
  if (s?.startsAtMs && s.startsAtMs > now) return "scheduled";
  if (s?.endsAtMs && s.endsAtMs <= now) return "ended";
  return "live";
}

/** Annonces dans l'ordre de diffusion : créées dans l'admin (les plus
 *  récentes d'abord), puis celles du code, filtrées par le calendrier. */
export function scheduledAnnouncements<T extends { id: string }>(code: T[], settings: AnnouncementSettings, now: number, toAnnouncement: (c: CustomAnnouncement) => T): T[] {
  const custom = [...settings.custom].sort((a, b) => (settings.schedule[b.id]?.startsAtMs ?? b.createdAtMs) - (settings.schedule[a.id]?.startsAtMs ?? a.createdAtMs)).map(toAnnouncement);
  return [...custom, ...code].filter((a) => announcementLive(a.id, settings, now));
}

/* ---------- v4.7.1 : annonces vues, gardées sur le compte ---------- */

export const SEEN_LIMIT = 120;
const SEEN_ID = /^[A-Za-z0-9._:-]{1,60}$/;

/** Ajoute des annonces vues (identifiants valides, 120 gardés au plus). */
export function addSeenAnnouncements(current: string[] | undefined, ids: unknown): string[] {
  const clean = (Array.isArray(ids) ? ids : []).filter((id): id is string => typeof id === "string" && SEEN_ID.test(id));
  const merged = [...(current ?? []).filter((id) => !clean.includes(id)), ...clean];
  return merged.slice(-SEEN_LIMIT);
}

/**
 * Annonce à montrer : la plus récente non vue, seulement si elle est plus
 * récente que toutes celles déjà vues (liste de diffusion, les plus
 * récentes d'abord). Fermer une annonce marque aussi toutes les plus
 * anciennes : pas de défilé des anciennes mises à jour.
 */
export function nextAnnouncement<T extends { id: string }>(list: T[], seen: string[]): { show: T; markIds: string[] } | null {
  const i = list.findIndex((a) => !seen.includes(a.id));
  const lastSeen = list.findIndex((a) => seen.includes(a.id));
  if (i < 0 || (lastSeen >= 0 && lastSeen < i)) return null;
  return { show: list[i], markIds: list.slice(i).map((a) => a.id) };
}
