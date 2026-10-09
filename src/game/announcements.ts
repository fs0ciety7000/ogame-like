/* =====================================================
   v4.5 : annonces plein écran pilotées depuis l'administration
   (game_config « announcements ») : annonces créées sans toucher au code,
   et calendrier (début, fin, désactivation) de toutes les annonces.
===================================================== */

import { normalizePoll, type Poll } from "@/game/polls";

export const ANNOUNCEMENTS_KEY = "announcements";

/* 6.14.161 (S1, NJ-10 et NJ-18) : un compte qui vient d'être créé ne voit ni l'annonce d'une mise à jour (6.14 : lune,
   phalange…) ni la pastille des Nouveautés : rien de ce qui précède son arrivée n'est « nouveau » pour lui. Les annonces
   en ligne pendant ses premières heures sont marquées vues sans s'ouvrir ; les Nouveautés ne comptent que les notes
   publiées après le jour de l'inscription. */
export const NEWCOMER_NEWS_RULES = { quietHours: 24, storyGapMinutes: 10 };

export const NEWCOMER_NEWS_RULES_META = {
  quietHours: {
    label: "Nouveau compte : durée sans annonce ni pastille des Nouveautés",
    unit: "h",
    min: 0,
    max: 720,
    hint: "Pendant ces heures après l'inscription, les annonces en ligne sont marquées vues sans s'ouvrir et les épisodes des Chroniques attendent. 0 : un compte neuf voit l'annonce en cours.",
  },
  storyGapMinutes: {
    label: "Écart entre deux fenêtres d'histoire (Chroniques, coalition)",
    unit: "min",
    min: 0,
    max: 1440,
    hint: "Après une fenêtre d'histoire fermée, un épisode des Chroniques ou une scène de coalition attend ce délai (les chapitres de la prise en main passent tout de suite). 0 : à la suite, comme avant.",
  },
};

/** Le compte a moins de `quietHours` heures (faux sans date de création : ancien compte). */
export function isNewcomer(createdAtMs: number | undefined, now: number): boolean {
  const hours = NEWCOMER_NEWS_RULES.quietHours;
  if (!createdAtMs || !(hours > 0)) return false;
  return now - createdAtMs < hours * 3600_000;
}

/** 5.26 : sondage d'une annonce de l'administration (null si absent). */
export function findPoll(settings: AnnouncementSettings, id: string): Poll | null {
  return settings.custom.find((a) => a.id === id)?.poll ?? null;
}

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
  /** 5.26 : sondage communautaire joint à l'annonce. */
  poll?: Poll | null;
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
      poll: normalizePoll(a.poll),
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
