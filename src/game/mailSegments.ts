/* =====================================================
   5.16 : segments des campagnes e-mail et suivi des envois.
   Un segment choisit les joueurs joignables selon leur activité, leur
   ancienneté ou leur alliance. Le serveur l'applique au moment de l'envoi
   (immédiat ou programmé) ; l'administration affiche le nombre visé.
===================================================== */

export type MailSegmentId = "all" | "active7" | "inactive7" | "inactive30" | "newcomers14" | "noAlliance" | "alliance";

export const MAIL_SEGMENTS: { id: MailSegmentId; label: string; hint: string }[] = [
  { id: "all", label: "Tous les joueurs joignables", hint: "Adresse vérifiée, pas désinscrit." },
  { id: "active7", label: "Actifs (7 derniers jours)", hint: "Connectés dans la semaine." },
  { id: "inactive7", label: "Inactifs depuis 7 jours", hint: "Pas connectés depuis au moins 7 jours : les faire revenir." },
  { id: "inactive30", label: "Inactifs depuis 30 jours", hint: "Partis depuis un mois ou plus." },
  { id: "newcomers14", label: "Nouveaux (moins de 14 jours)", hint: "Inscrits ces deux dernières semaines." },
  { id: "noAlliance", label: "Sans alliance", hint: "Pour les inviter à en rejoindre une." },
  { id: "alliance", label: "Une alliance", hint: "Les membres d'une alliance choisie." },
];

export interface MailSegment {
  id: MailSegmentId;
  allianceId?: string;
}

export interface SegmentPlayer {
  lastActiveMs?: number;
  createdAtMs?: number;
  allianceId?: string | null;
}

const DAY = 86400_000;

export function normalizeSegment(raw: unknown): MailSegment {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<MailSegment>;
  const id = MAIL_SEGMENTS.some((s) => s.id === r.id) ? (r.id as MailSegmentId) : "all";
  return id === "alliance" ? { id, allianceId: typeof r.allianceId === "string" ? r.allianceId : "" } : { id };
}

export function inSegment(seg: MailSegment, p: SegmentPlayer, now: number): boolean {
  const last = Number(p.lastActiveMs) || 0;
  switch (seg.id) {
    case "active7":
      return now - last < 7 * DAY;
    case "inactive7":
      return now - last >= 7 * DAY;
    case "inactive30":
      return now - last >= 30 * DAY;
    case "newcomers14":
      return now - (Number(p.createdAtMs) || 0) < 14 * DAY;
    case "noAlliance":
      return !p.allianceId;
    case "alliance":
      return !!seg.allianceId && p.allianceId === seg.allianceId;
    default:
      return true;
  }
}

export function segmentLabel(seg: MailSegment, allianceTag?: string): string {
  const def = MAIL_SEGMENTS.find((s) => s.id === seg.id);
  return seg.id === "alliance" ? `Alliance${allianceTag ? ` [${allianceTag}]` : ""}` : def?.label ?? "Tous";
}

/* ---------- suivi : campagnes envoyées ---------- */

export const MAIL_CAMPAIGNS_KEY = "mail_campaigns";
export const MAIL_SCHEDULE_KEY = "mail_scheduled";
export const MAIL_HISTORY_MAX = 20;
export const MAIL_SCHEDULE_MAX = 10;

export interface SentCampaign {
  id: string;
  subject: string;
  segment: MailSegment;
  sentAtMs: number;
  sent: number;
  failed: number;
  /** Joueurs ayant ouvert (pixel) ou cliqué au moins une fois. */
  opened: string[];
  clicked: string[];
}

export interface ScheduledCampaign {
  id: string;
  subject: string;
  html: string;
  text: string;
  fromName: string;
  apiUrl: string;
  segment: MailSegment;
  sendAtMs: number;
  createdBy: string;
}

export function campaignsState(raw: unknown): { list: SentCampaign[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as { list?: SentCampaign[] };
  return { list: Array.isArray(r.list) ? r.list.filter((c) => c && typeof c.id === "string").slice(0, MAIL_HISTORY_MAX) : [] };
}

export function scheduleState(raw: unknown): { list: ScheduledCampaign[] } {
  const r = (raw && typeof raw === "object" ? raw : {}) as { list?: ScheduledCampaign[] };
  return { list: Array.isArray(r.list) ? r.list.filter((c) => c && typeof c.id === "string" && Number(c.sendAtMs) > 0).slice(0, MAIL_SCHEDULE_MAX) : [] };
}

/** Enregistre une ouverture ou un clic (une seule fois par joueur). Un clic vaut aussi ouverture. */
export function trackCampaign(state: { list: SentCampaign[] }, campaignId: string, uid: string, kind: "open" | "click"): { list: SentCampaign[] } {
  return {
    list: state.list.map((c) => {
      if (c.id !== campaignId) return c;
      const opened = c.opened.includes(uid) ? c.opened : [...c.opened, uid];
      const clicked = kind === "click" && !c.clicked.includes(uid) ? [...c.clicked, uid] : c.clicked;
      return { ...c, opened, clicked };
    }),
  };
}

/** Ajoute le pixel d'ouverture et réécrit les liens http(s) vers le compteur de clics.
 *  `track(url)` renvoie l'adresse de suivi d'un lien ; le lien de désinscription n'est pas suivi. */
export function instrumentHtml(html: string, pixelUrl: string, track: (url: string) => string): string {
  const withLinks = html.replace(/href="(https?:\/\/[^"]+)"/g, (m, url: string) => (url.includes("/api/cosmic/unsubscribe") ? m : `href="${track(url.replace(/&amp;/g, "&"))}"`));
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`;
  return withLinks.includes("</body>") ? withLinks.replace("</body>", `${pixel}</body>`) : withLinks + pixel;
}
