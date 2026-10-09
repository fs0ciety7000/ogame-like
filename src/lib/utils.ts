import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Couleur (hex ou var(--…)) à `pct` % d'opacité : marche aussi avec les jetons du thème. */
export function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(pct)}%, transparent)`;
}

/** 6.14.54 (AD-5) : fr-FR sépare les milliers par U+202F (espace fine insécable), qu'aucune police de titre du jeu n'a
    (Saira Condensed, Chakra Petch, Rajdhani… : « 32919 » affiché sans séparateur). On le remplace par U+00A0
    (espace insécable), présente dans toutes. Affichage seulement : les nombres du moteur (`@/game/format`) ne changent pas. */
const NARROW_NBSP = /\u202f/g;
function withNbsp(s: string): string {
  return s.replace(NARROW_NBSP, "\u00a0");
}

export function formatNumber(value: number): string {
  const v = Math.floor(value);
  if (Math.abs(v) < 1000) return String(v);
  return withNbsp(new Intl.NumberFormat("fr-FR").format(v));
}

/** 5.15 : nombre à virgule (fr-FR), `digits` décimales au plus : « 1,25 ». */
export function formatDecimal(value: number, digits = 2): string {
  return withNbsp(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value));
}

export function formatCompact(value: number): string {
  return withNbsp(
    new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.floor(value)),
  );
}

/** 6.14.164 (S4, NJ-7) : stock de l'en-tête, 3 chiffres significatifs au plus (« 150 k », « 42,1 k », « 1,23 M ») : tient dans
 *  une case de 375 px sans ellipse (« 150,2 k » était coupé en « 150,… »). */
export function formatHud(value: number): string {
  const v = Math.floor(value);
  if (Math.abs(v) < 1000) return String(v);
  // « Md » a une lettre de plus que « k » ou « M » : 2 chiffres de 1 à 99 milliards (« 4,3 Md »).
  const sig = Math.abs(v) >= 1e9 && Math.abs(v) < 1e11 ? 2 : 3;
  return withNbsp(new Intl.NumberFormat("fr-FR", { notation: "compact", maximumSignificantDigits: sig }).format(v));
}

/** 6.14.164 (S4, NJ-19) : « de » devant un nom propre ou un mois, avec élision et contraction : « d'octobre »,
 *  « du Silencieux », « des Ombres », « de la Ruche », « de Varan ». */
export function frDe(name: string): string {
  const n = name.trim();
  const art = /^(les|le|la)\s+(\S.*)$/i.exec(n);
  if (art) {
    const a = art[1].toLowerCase();
    return a === "le" ? `du ${art[2]}` : a === "les" ? `des ${art[2]}` : `de la ${art[2]}`;
  }
  if (/^l['’]/i.test(n)) return `de l'${n.slice(2)}`;
  // Pas d'élision devant « h » (aspiré ou non, on ne sait pas le dire) : « de Hurlevent ».
  return /^[aeiouyàâéèêëîïôûü]/i.test(n) ? `d'${n}` : `de ${n}`;
}

const VOWEL = /[aeiouyàâéèêëîïôûü]/i;

/** 6.14.164 (S4, NJ-19) : Chrome n'a pas toujours de dictionnaire français pour `hyphens: auto` : « COMMUNICATIONS » se coupait
 *  en « COMMUNICATIO / NS ». Un mot de plus de 12 lettres reçoit une césure possible (U+00AD) en son milieu, sur une
 *  consonne suivie d'une voyelle (« COMMUNI-CATIONS ») ; le trait d'union ne s'affiche que si le mot est coupé. */
export function softHyphens(label: string): string {
  return label
    .split(" ")
    .map((w) => {
      if (w.length <= 12) return w;
      const mid = Math.floor(w.length / 2);
      for (let d = 0; d < mid - 3; d++) {
        for (const i of [mid + d, mid - d]) {
          if (!VOWEL.test(w[i] ?? "") || VOWEL.test(w[i - 1] ?? "")) continue;
          // « tr », « bl »… restent ensemble : « Adminis-tration ».
          const cut = /[lr]/i.test(w[i - 1]) && !VOWEL.test(w[i - 2] ?? "a") && !/[lr]/i.test(w[i - 2]) ? i - 2 : i - 1;
          return `${w.slice(0, cut)}\u00ad${w.slice(cut)}`;
        }
      }
      return `${w.slice(0, mid)}\u00ad${w.slice(mid)}`;
    })
    .join(" ");
}

/** Débit horaire affiché par seconde, comme l'en-tête de la planète mère. */
export function formatPerSecond(hourly: number): string {
  const v = hourly / 3600;
  if (v >= 1000) return `${formatCompact(v)}/s`;
  if (v >= 10) return `${formatNumber(Math.round(v))}/s`;
  return `${withNbsp(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(v))}/s`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  // Au-delà de 48 h, des jours (« 27j 11h » plutôt que « 659h »).
  if (h >= 48) return `${Math.floor(h / 24)}j ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Compte à rebours : « 4:38 » sous l'heure, « 5 h 06 min » au-delà, « 2 j 03 h » au-delà d'un jour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (d > 0) return `${d} j ${h.toString().padStart(2, "0")} h`;
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} min`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** 6.14.83 (AD-29) : formats de date et d'heure du jeu, en un seul endroit (jamais `toLocale*String` dans un composant). */
const HM = { hour: "2-digit", minute: "2-digit" } as const;
const DATE_STYLES = {
  /** 14:05 */
  time: HM,
  /** 14:05:09 */
  timeSec: { ...HM, second: "2-digit" },
  /** 7 oct. */
  dayShort: { day: "numeric", month: "short" },
  /** 7 octobre */
  day: { day: "numeric", month: "long" },
  /** 7 octobre 2026 */
  date: { day: "numeric", month: "long", year: "numeric" },
  /** 07/10/2026 */
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
  /** mercredi 7 */
  weekdayNum: { weekday: "long", day: "numeric" },
  /** mercredi 7 octobre */
  weekday: { weekday: "long", day: "numeric", month: "long" },
  /** 7 oct. 14:05 */
  dayShortTime: { day: "numeric", month: "short", ...HM },
  /** 7 octobre à 14:05 */
  dayTime: { day: "numeric", month: "long", ...HM },
  /** mer. 7 oct., 14:05 */
  short: { weekday: "short", day: "numeric", month: "short", ...HM },
  /** mercredi 7 octobre à 14:05 */
  long: { weekday: "long", day: "numeric", month: "long", ...HM },
  /** mercredi à 14:05 */
  weekdayTime: { weekday: "long", ...HM },
  /** mercredi 7 octobre 2026 à 14:05 */
  full: { dateStyle: "full", timeStyle: "short" },
  /** 14 h (axe horaire d'un graphique) */
  hour: { hour: "2-digit" },
  /** mer. 7 (axe d'un graphique) */
  weekdayShortNum: { weekday: "short", day: "numeric" },
  /** octobre 2026 (calendrier) */
  monthYear: { month: "long", year: "numeric" },
  /** 07/10 14:05 */
  numericShortTime: { day: "2-digit", month: "2-digit", ...HM },
  /** 07/10/2026 14:05 */
  numericTime: { day: "2-digit", month: "2-digit", year: "numeric", ...HM },
  /** 07/10/2026 14:05:09 (journaux de l'admin) */
  numericSec: { day: "2-digit", month: "2-digit", year: "numeric", ...HM, second: "2-digit" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateTimeStyle = keyof typeof DATE_STYLES;

/** Fuseau des rendez-vous du serveur (boss, maintenance, casino, Chroniques, agenda) : l'heure de Paris, la même pour tous. */
const SERVER_TIME_ZONE = "Europe/Paris";

/**
 * Date ou heure en français. `zone` : `"local"` (défaut) pour un moment propre au joueur (arrivée d'une flotte,
 * message, journal) ; `"server"` pour un rendez-vous fixé par le serveur, affiché à l'heure de Paris partout.
 */
export function formatDateTime(at: number | Date, style: DateTimeStyle = "long", zone: "local" | "server" = "local"): string {
  const d = typeof at === "number" ? new Date(at) : at;
  const opts: Intl.DateTimeFormatOptions = zone === "server" ? { ...DATE_STYLES[style], timeZone: SERVER_TIME_ZONE } : DATE_STYLES[style];
  return withNbsp(new Intl.DateTimeFormat("fr-FR", opts).format(d));
}

export function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

/** Horodatage (millisecondes, ou date ISO pour d'anciennes données) en
 *  millisecondes ; maintenant si la valeur est absente ou illisible. */
export function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function sanitizePseudo(pseudo: string): string {
  return pseudo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/** Domaine fictif utilisé comme email des comptes
 *  créés avant l'ajout d'un email de récupération réel (voir authService). */
export function legacyPseudoEmail(sanitizedPseudo: string): string {
  return `${sanitizedPseudo}@cosmic-empires.local`;
}
