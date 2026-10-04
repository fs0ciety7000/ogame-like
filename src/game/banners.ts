/* =====================================================
   Bandeaux d'annonce (v3.7) : messages de l'équipe affichés en haut du
   site, réglés dans l'administration (game_config « banners »).
   Texte simple avec emojis, **gras** et liens [texte](url) — jamais de
   HTML : le texte est découpé en morceaux rendus par React.
===================================================== */

export const BANNERS_KEY = "banners";

export type BannerKind = "info" | "event" | "alert" | "critical";

export const BANNER_KINDS: Record<BannerKind, { label: string; hint: string }> = {
  info: { label: "Annonce", hint: "Information générale (cyan)." },
  event: { label: "Évènement", hint: "Évènement en jeu, concours, Léviathan… (violet)." },
  alert: { label: "Alerte", hint: "Point d'attention : maintenance prévue, bug connu… (orange)." },
  critical: { label: "Urgent", hint: "Incident en cours. Ne peut pas être masqué (rouge)." },
};

export interface Banner {
  id: string;
  kind: BannerKind;
  text: string;
  /** Texte qui défile (sinon fixe, sur une ou plusieurs lignes). */
  scrolling: boolean;
  /** Le joueur peut le masquer (jamais pour « Urgent »). */
  dismissible: boolean;
  /** Visible aussi sur la page de connexion. */
  public: boolean;
  active: boolean;
  startsAtMs: number | null;
  endsAtMs: number | null;
  updatedAtMs: number;
}

export const BANNER_MAX_LENGTH = 400;
export const BANNER_MAX_SHOWN = 3;

const KIND_ORDER: BannerKind[] = ["critical", "alert", "event", "info"];

export function normalizeBanners(raw: unknown): Banner[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .filter((b): b is Record<string, unknown> => !!b && typeof b === "object" && typeof (b as { id?: unknown }).id === "string")
    .map((b) => {
      const kind = (Object.keys(BANNER_KINDS) as BannerKind[]).includes(b.kind as BannerKind) ? (b.kind as BannerKind) : "info";
      const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
      return {
        id: String(b.id),
        kind,
        text: String(b.text ?? "").slice(0, BANNER_MAX_LENGTH),
        scrolling: b.scrolling === true,
        dismissible: kind !== "critical" && b.dismissible !== false,
        public: b.public === true,
        active: b.active !== false,
        startsAtMs: num(b.startsAtMs),
        endsAtMs: num(b.endsAtMs),
        updatedAtMs: num(b.updatedAtMs) ?? 0,
      };
    });
}

/** Bandeaux à afficher maintenant, les plus graves d'abord. */
export function visibleBanners(banners: Banner[], now: number, options: { dismissed?: string[]; publicOnly?: boolean } = {}): Banner[] {
  const dismissed = new Set(options.dismissed ?? []);
  return banners
    .filter((b) => b.active && b.text.trim())
    .filter((b) => (b.startsAtMs === null || b.startsAtMs <= now) && (b.endsAtMs === null || b.endsAtMs > now))
    .filter((b) => !options.publicOnly || b.public)
    .filter((b) => !b.dismissible || !dismissed.has(dismissKey(b)))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.updatedAtMs - a.updatedAtMs)
    .slice(0, BANNER_MAX_SHOWN);
}

/** Clé de masquage : un bandeau modifié réapparaît. */
export function dismissKey(b: Pick<Banner, "id" | "updatedAtMs">): string {
  return `${b.id}@${b.updatedAtMs}`;
}

export type BannerToken = { type: "text"; text: string } | { type: "bold"; text: string } | { type: "link"; text: string; href: string; internal: boolean };

/** Lien autorisé : chemin du jeu (/game/…), ou http(s). Sinon null. */
export function safeHref(raw: string): { href: string; internal: boolean } | null {
  const href = raw.trim();
  if (/^\/(?!\/)[^\s]*$/.test(href)) return { href, internal: true };
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") return { href: url.toString(), internal: false };
  } catch {
    /* lien invalide */
  }
  return null;
}

/** « Voir **ici** [le Léviathan](/game/uber) » → morceaux typés. */
export function parseBannerText(text: string): BannerToken[] {
  const tokens: BannerToken[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) tokens.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: "bold", text: m[1] });
    else {
      const link = safeHref(m[3]);
      tokens.push(link ? { type: "link", text: m[2], ...link } : { type: "text", text: m[2] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
}

export function newBanner(now: number): Banner {
  return {
    id: `b${now.toString(36)}`,
    kind: "info",
    text: "",
    scrolling: false,
    dismissible: true,
    public: false,
    active: false,
    startsAtMs: null,
    endsAtMs: null,
    updatedAtMs: now,
  };
}
