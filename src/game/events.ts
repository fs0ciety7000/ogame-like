import { WORLD_BOSS_RULES, weekOfLocal, worldBossDay } from "@/game/worldBosses";
/* =====================================================
   Événements du week-end (v1.8) : chaque semaine, du vendredi 18 h au
   dimanche 23 h 59 (heure de Paris), un événement donne un bonus à tout le
   monde. Ils tournent dans un ordre fixe ; l'administration peut aussi en
   programmer à des dates précises (prioritaires sur la rotation).

   Fonctions pures, sans Intl (absent des hooks PocketBase) : l'heure de
   Paris est calculée avec les règles de l'heure d'été européenne.
===================================================== */

export interface EventEffects {
  /** Multiplicateurs de production, par ressource (1,5 = +50 %). */
  production?: Partial<Record<string, number>>;
  /** Multiplicateur du temps de construction des bâtiments (0,75 = −25 %). */
  buildTime?: number;
  /** Multiplicateur du temps de recherche. */
  researchTime?: number;
  /** Multiplicateur des récompenses de missions (ressources et XP). */
  missionRewards?: number;
  /** Multiplicateur du butin pillé. */
  loot?: number;
  /** Part du coût des vaisseaux détruits laissée en débris (remplace la règle). */
  debrisPercent?: number;
}

export interface EventType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effects: EventEffects;
}

export interface ScheduledEvent {
  id: string;
  type: string;
  startMs: number;
  endMs: number;
  /** 5.16 : récurrence : toutes les N semaines (1 à 8), `repeatCount` occurrences au total (2 à 26). */
  repeatWeeks?: number;
  repeatCount?: number;
}

/** 5.16 : occurrences d'un événement programmé (récurrence comprise). */
export function scheduledOccurrences(s: ScheduledEvent): { startMs: number; endMs: number }[] {
  const weeks = Math.floor(Number(s.repeatWeeks) || 0);
  const count = weeks >= 1 ? Math.max(1, Math.min(26, Math.floor(Number(s.repeatCount) || 1))) : 1;
  const out: { startMs: number; endMs: number }[] = [];
  for (let i = 0; i < count; i++) out.push({ startMs: s.startMs + i * weeks * 7 * DAY, endMs: s.endMs + i * weeks * 7 * DAY });
  return out;
}

export interface GameEvent {
  /** Identifiant de cette occurrence (type + début). */
  key: string;
  type: EventType;
  startMs: number;
  endMs: number;
  scheduled: boolean;
}

export const EVENT_RULES: {
  rotationEnabled: boolean;
  /** v3.1 : un week-end par mois, le Léviathan remplace l'événement. */
  bossMonthly: boolean;
  /** v5.10.4 : week-end du mois du Léviathan (premier par défaut). */
  bossWeekend: BossWeekend;
  /** v5.10.5 : apparitions du Léviathan à date précise (en plus du rendez-vous mensuel). */
  bossDates: BossDate[];
  /** 5.15.14 : apparitions régulières du boss mondial annulées (début exact), depuis le planificateur. */
  bossSkips?: number[];
  /** 5.15.14 : week-ends de la rotation annulés (début exact de la fenêtre). */
  rotationSkips?: number[];
  /** v5.14 : boss mondiaux en rotation hebdomadaire (remplace le rendez-vous mensuel). */
  bossWeekly?: boolean;
  /** Heure de début le vendredi (heure de Paris). */
  startHour: number;
  rotation: string[];
  types: EventType[];
  scheduled: ScheduledEvent[];
} = {
  rotationEnabled: true,
  bossMonthly: true,
  bossWeekend: "first",
  bossDates: [],
  bossSkips: [],
  rotationSkips: [],
  bossWeekly: true,
  startHour: 18,
  rotation: ["tempete_ferraille", "chantiers_acceleres", "recherche_eclair", "chasse_tresor", "guerre_ouverte"],
  types: [
    {
      id: "tempete_ferraille",
      name: "Tempête de ferraille",
      emoji: "🌪️",
      description: "+50 % de production de ferraille et de nanocomposants.",
      effects: { production: { scrap: 1.5, nano: 1.5 } },
    },
    {
      id: "chantiers_acceleres",
      name: "Chantiers accélérés",
      emoji: "🏗️",
      description: "−25 % de temps de construction des bâtiments lancés pendant l'événement.",
      effects: { buildTime: 0.75 },
    },
    {
      id: "recherche_eclair",
      name: "Recherche éclair",
      emoji: "🔬",
      description: "−25 % de temps de recherche pour les recherches lancées pendant l'événement.",
      effects: { researchTime: 0.75 },
    },
    {
      id: "chasse_tresor",
      name: "Chasse au trésor",
      emoji: "💎",
      description: "+50 % de récompenses pour les missions terminées pendant l'événement.",
      effects: { missionRewards: 1.5 },
    },
    {
      id: "guerre_ouverte",
      name: "Guerre ouverte",
      emoji: "⚔️",
      description: "Butin +50 % et 50 % du coût des vaisseaux détruits laissés en débris.",
      effects: { loot: 1.5, debrisPercent: 0.5 },
    },
  ],
  scheduled: [],
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;
/** Un vendredi de référence (2 janvier 2026) pour l'ordre de rotation. */
const REFERENCE_FRIDAY = Date.UTC(2026, 0, 2);

/** Dernier dimanche d'un mois, à 1 h UTC (bascule de l'heure d'été). */
function lastSundayAt1Utc(year: number, month: number): number {
  const d = new Date(Date.UTC(year, month + 1, 0, 1));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.getTime();
}

/** Décalage de l'heure de Paris par rapport à UTC, en ms. */
export function parisOffsetMs(utcMs: number): number {
  const year = new Date(utcMs).getUTCFullYear();
  const summer = utcMs >= lastSundayAt1Utc(year, 2) && utcMs < lastSundayAt1Utc(year, 9);
  return (summer ? 2 : 1) * HOUR;
}

/** Heure locale de Paris (exprimée comme un instant « UTC ») → instant réel. */
export function parisLocalToUtc(localMs: number): number {
  return localMs - parisOffsetMs(localMs - 2 * HOUR);
}

export function findEventType(id: string): EventType | undefined {
  return EVENT_RULES.types.find((t) => t.id === id);
}

/** Fenêtre du week-end en cours ou à venir (rotation). */
export function weekendWindow(now: number, weeksAhead = 0): { startMs: number; endMs: number; week: number; firstOfMonth: boolean; nth: number; lastOfMonth: boolean; fridayMs: number } {
  const local = now + parisOffsetMs(now);
  const localMidnight = Math.floor(local / DAY) * DAY;
  const daysSinceFriday = (new Date(local).getUTCDay() - 5 + 7) % 7;
  const friday = localMidnight - daysSinceFriday * DAY + weeksAhead * 7 * DAY;
  return {
    startMs: parisLocalToUtc(friday + EVENT_RULES.startHour * HOUR),
    endMs: parisLocalToUtc(friday + 3 * DAY),
    week: Math.round((friday - REFERENCE_FRIDAY) / (7 * DAY)),
    firstOfMonth: new Date(friday).getUTCDate() <= 7,
    nth: Math.ceil(new Date(friday).getUTCDate() / 7),
    lastOfMonth: new Date(friday + 7 * DAY).getUTCMonth() !== new Date(friday).getUTCMonth(),
    fridayMs: parisLocalToUtc(friday),
  };
}

/* =====================================================
   v5.10.4 : occurrence des boss mensuels (Léviathan, boss de saison),
   réglable dans l'administration : quel week-end du mois, heure de
   départ le vendredi (heure de Paris) et durée.
===================================================== */

export type BossWeekend = "first" | "second" | "third" | "fourth" | "last";

export const BOSS_WEEKENDS: { id: BossWeekend; label: string }[] = [
  { id: "first", label: "Premier week-end du mois" },
  { id: "second", label: "Deuxième week-end du mois" },
  { id: "third", label: "Troisième week-end du mois" },
  { id: "fourth", label: "Quatrième week-end du mois" },
  { id: "last", label: "Dernier week-end du mois" },
];

const NTH: Record<Exclude<BossWeekend, "last">, number> = { first: 1, second: 2, third: 3, fourth: 4 };

/** v5.10.5 : apparition à une date précise, fixée par l'équipe. */
export interface BossDate {
  startMs: number;
  durationHours: number;
}

export interface BossSchedule {
  /** Rendez-vous mensuel actif (les dates précises restent valables sinon). */
  enabled: boolean;
  weekend: BossWeekend;
  /** Heure de départ le vendredi (heure de Paris). */
  startHour: number;
  durationHours: number;
  /** v5.10.5 : apparitions supplémentaires à date précise. */
  dates?: BossDate[];
  /** 5.15.14 : apparitions régulières annulées (début exact) ; les dates précises ne sont pas concernées. */
  skips?: number[];
  /** v5.14 : rendez-vous hebdomadaire (boss mondiaux) au lieu du week-end du mois.
   *  v5.14.2 : `between` — en alternance avec un autre boss hebdomadaire : une apparition
   *  dans chaque intervalle entre deux de ses passages, sans jamais le chevaucher. */
  weekly?: { minGapDays: number; between?: BossSchedule };
  /** 6.7 (lot V) : jour de départ (0 = dimanche … 6 = samedi, heure de Paris). Rendez-vous mensuel : le n-ième
   *  (ou le dernier) de ce jour dans le mois ; en alternance : premier de ces jours qui tient entre deux passages
   *  de l'autre boss (sinon, placement d'avant). Absent : vendredi (mensuel) ou lendemain de l'autre boss (alternance). */
  weekday?: number | null;
}

export const MAX_BOSS_DATES = 24;

export function onWeekend(w: { nth: number; lastOfMonth: boolean }, which: BossWeekend | undefined): boolean {
  if (which === "last") return w.lastOfMonth;
  return w.nth === NTH[which ?? "first"];
}

/** Prochaines fenêtres (en cours comprise) d'un boss mensuel, dans l'ordre. */
export function bossWindows(now: number, s: BossSchedule, count = 1): { startMs: number; endMs: number; fixed?: boolean }[] {
  const out: { startMs: number; endMs: number; fixed?: boolean }[] = [];
  const skipped = new Set(s.skips ?? []);
  // v5.14.2 : en alternance avec un boss hebdomadaire (le boss mondial).
  const alternating = !!(s.weekly?.between?.enabled && s.weekly.between.weekly);
  if (s.enabled && alternating) {
    for (const win of alternateWindows(now, s, s.weekly!.between!, count + skipped.size)) if (!skipped.has(win.startMs)) out.push(win);
  } else if (s.enabled && s.weekly && !s.weekly.between) {
    // v5.14 : boss mondiaux, un par semaine, un jour différent à chaque fois.
    const w0 = weekOfLocal(now + parisOffsetMs(now));
    for (let w = w0 - 1; w <= w0 + count + skipped.size + 1; w++) {
      const d = worldBossDay(w, s.weekly.minGapDays);
      const startMs = parisLocalToUtc(WORLD_BOSS_RULES.anchorMondayUtc + w * 7 * DAY + d * DAY + s.startHour * HOUR);
      const endMs = startMs + s.durationHours * HOUR;
      if (endMs > now && !skipped.has(startMs)) out.push({ startMs, endMs });
    }
  }
  // Repli mensuel : pas de rythme hebdomadaire, ou alternance sans boss mondial hebdomadaire.
  const monthly = !s.weekly || (!!s.weekly.between && !alternating);
  if (s.enabled && monthly && typeof s.weekday === "number") {
    for (const win of monthlyWeekdayWindows(now, s, count + skipped.size)) if (!skipped.has(win.startMs) && out.length < count) out.push(win);
  }
  for (let i = -1; s.enabled && monthly && typeof s.weekday !== "number" && i < 60 && out.length < count; i++) {
    const w = weekendWindow(now, i);
    if (!onWeekend(w, s.weekend)) continue;
    const startMs = w.fridayMs + s.startHour * HOUR;
    const endMs = startMs + s.durationHours * HOUR;
    if (endMs > now && !skipped.has(startMs)) out.push({ startMs, endMs });
  }
  // v5.10.5 : dates précises, mêlées au rendez-vous mensuel.
  for (const d of s.dates ?? []) {
    const endMs = d.startMs + d.durationHours * HOUR;
    if (Number.isFinite(endMs) && endMs > now) out.push({ startMs: d.startMs, endMs, fixed: true });
  }
  return out.sort((a, b) => a.startMs - b.startMs).slice(0, count);
}

/** 6.7 : le n-ième (ou le dernier) jour `weekday` de chaque mois, à `startHour` (heure de Paris). */
function monthlyWeekdayWindows(now: number, s: BossSchedule, count: number): { startMs: number; endMs: number }[] {
  const out: { startMs: number; endMs: number }[] = [];
  const local = new Date(now + parisOffsetMs(now));
  const dur = s.durationHours * HOUR;
  for (let k = -1; k < 24 && out.length < count; k++) {
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth() + k;
    const first = Date.UTC(y, m, 1);
    const firstDow = new Date(first).getUTCDay();
    const firstMatch = first + (((s.weekday as number) - firstDow + 7) % 7) * DAY;
    let day = s.weekend === "last" ? firstMatch + 4 * 7 * DAY : firstMatch + ((NTH[s.weekend as Exclude<BossWeekend, "last">] ?? 1) - 1) * 7 * DAY;
    if (s.weekend === "last") while (new Date(day).getUTCMonth() !== new Date(first).getUTCMonth()) day -= 7 * DAY;
    if (new Date(day).getUTCMonth() !== new Date(first).getUTCMonth()) continue;
    const startMs = parisLocalToUtc(day + s.startHour * HOUR);
    if (startMs + dur > now) out.push({ startMs, endMs: startMs + dur });
  }
  return out;
}

/** 6.7 : premier jour `weekday` à `startHour` (heure de Paris) au moins égal à `fromMs`. */
function nextWeekdayAt(fromMs: number, weekday: number, startHour: number): number {
  const local = fromMs + parisOffsetMs(fromMs);
  const midnight = Math.floor(local / DAY) * DAY;
  const ahead = (weekday - new Date(local).getUTCDay() + 7) % 7;
  let t = parisLocalToUtc(midnight + ahead * DAY + startHour * HOUR);
  if (t < fromMs) t = parisLocalToUtc(midnight + (ahead + 7) * DAY + startHour * HOUR);
  return t;
}

/** Passage hebdomadaire n° w d'un boss (rotation des jours des boss mondiaux). */
function weeklyWindow(w: number, s: BossSchedule): { startMs: number; endMs: number } {
  const d = worldBossDay(w, s.weekly?.minGapDays);
  const startMs = parisLocalToUtc(WORLD_BOSS_RULES.anchorMondayUtc + w * 7 * DAY + d * DAY + s.startHour * HOUR);
  return { startMs, endMs: startMs + s.durationHours * HOUR };
}

/** v5.14.2 : une apparition entre chaque passage de l'autre boss. Elle démarre un jour après
 *  sa fin si l'intervalle le permet, sinon à sa fin ; trop court, l'intervalle est sauté. */
function alternateWindows(now: number, s: BossSchedule, other: BossSchedule, count: number): { startMs: number; endMs: number }[] {
  const out: { startMs: number; endMs: number }[] = [];
  const w0 = weekOfLocal(now + parisOffsetMs(now));
  for (let w = w0 - 2; w <= w0 + count + 2; w++) {
    const a = weeklyWindow(w, other);
    const b = weeklyWindow(w + 1, other);
    const dur = s.durationHours * HOUR;
    // 6.7 : jour fixé (mardi par défaut pour le boss de la chronique) : le premier qui tient dans l'intervalle.
    const fixedDay = typeof s.weekday === "number" ? nextWeekdayAt(a.endMs, s.weekday, s.startHour) : null;
    // Le jour fixé ne tient pas : placement d'avant (lendemain de l'autre boss), pour garder le même nombre de combats.
    const startMs = fixedDay !== null && fixedDay + dur <= b.startMs ? fixedDay : a.endMs + DAY + dur <= b.startMs ? a.endMs + DAY : a.endMs + dur <= b.startMs ? a.endMs : null;
    if (startMs === null) continue;
    if (startMs + dur > now) out.push({ startMs, endMs: startMs + dur });
  }
  return out;
}

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** 6.7 (lot V) : jours de la semaine pour les réglages (0 = dimanche). */
export const WEEKDAY_OPTIONS: { value: string; label: string }[] = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: DAY_NAMES[d][0].toUpperCase() + DAY_NAMES[d].slice(1) }));
const WEEKEND_WORDS: Record<BossWeekend, string> = { first: "premier", second: "deuxième", third: "troisième", fourth: "quatrième", last: "dernier" };

/** « 18 h », « 23 h 30 » */
function hourLabel(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh} h ${String(mm).padStart(2, "0")}` : `${hh} h`;
}

/** Fin d'un boss : « lundi 18 h » (jour de la semaine et heure de Paris). */
export function bossEndLabel(s: Pick<BossSchedule, "startHour" | "durationHours" | "weekday">): string {
  const end = s.startHour + s.durationHours;
  return `${DAY_NAMES[((typeof s.weekday === "number" ? s.weekday : 5) + Math.floor(end / 24)) % 7]} ${hourLabel(end % 24)}`;
}

const MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** v5.10.5 : « lundi 9 novembre à 18 h » (heure de Paris), sans Intl (code serveur). */
export function parisWhenLabel(ms: number): string {
  const local = new Date(ms + parisOffsetMs(ms));
  return `${DAY_NAMES[local.getUTCDay()]} ${local.getUTCDate()} ${MONTH_NAMES[local.getUTCMonth()]} à ${hourLabel(local.getUTCHours() + local.getUTCMinutes() / 60)}`;
}

/** v5.10.5 : « aujourd'hui à 18 h », « demain à 18 h », sinon « lundi 9 novembre à 18 h ». */
export function parisRelativeLabel(ms: number, now: number): string {
  const day = (t: number) => Math.floor((t + parisOffsetMs(t)) / DAY);
  const local = new Date(ms + parisOffsetMs(ms));
  const at = hourLabel(local.getUTCHours() + local.getUTCMinutes() / 60);
  const diff = day(ms) - day(now);
  if (diff === 0) return `aujourd'hui à ${at}`;
  if (diff === 1) return `demain à ${at}`;
  return parisWhenLabel(ms);
}

/** v5.10.5 : rappels des boss mondiaux (la veille, puis avant la fin s'il tient encore). */
export const BOSS_REMINDERS = {
  /** Annonce envoyée au plus tôt N heures avant l'apparition (et au plus tard 1 h avant). */
  eveHours: 24,
  /** Rappel N heures avant la fin, si le boss n'est pas tombé. */
  endingHours: 6,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const BOSS_REMINDERS_META = {
  eveHours: { label: "Annonce d'un boss : au plus tôt avant l'apparition", unit: "h", min: 1, max: 168, hint: "Envoyée au plus tard 1 h avant." },
  endingHours: { label: "Rappel avant la fin d'un boss", unit: "h", min: 0, max: 72, hint: "Seulement si le boss n'est pas tombé." },
};

/** Apparition à annoncer maintenant (la veille), ou null. */
export function eveReminderDue(next: { startMs: number } | null | undefined, lastAnnounced: number | undefined, now: number): boolean {
  if (!next) return false;
  const left = next.startMs - now;
  return left > HOUR && left <= BOSS_REMINDERS.eveHours * HOUR && lastAnnounced !== next.startMs;
}

/** « le premier week-end de chaque mois, du vendredi 18 h au lundi 18 h » */
export function describeBossSchedule(s: BossSchedule, now = Date.now()): string {
  const extra = (s.dates ?? []).some((d) => d.startMs + d.durationHours * HOUR > now);
  if (!s.enabled) return extra ? "à des dates fixées par l'équipe" : "pas d'apparition programmée pour l'instant";
  const alternating = !!(s.weekly?.between?.enabled && s.weekly.between.weekly);
  if (alternating && typeof s.weekday === "number") return `chaque ${DAY_NAMES[s.weekday]} à ${hourLabel(s.startHour)} pour ${s.durationHours} h (ou le lendemain du boss mondial s'il occupe le ${DAY_NAMES[s.weekday]})${extra ? ", et à des dates fixées par l'équipe" : ""}`;
  if (alternating) return `chaque semaine en alternance avec le boss mondial (entre deux de ses passages), pour ${s.durationHours} h${extra ? ", et à des dates fixées par l'équipe" : ""}`;
  if (s.weekly && !s.weekly.between) return `chaque semaine, un jour différent à ${hourLabel(s.startHour)}, pour ${s.durationHours} h${extra ? ", et à des dates fixées par l'équipe" : ""}`;
  if (typeof s.weekday === "number") return `le ${WEEKEND_WORDS[s.weekend] ?? "premier"} ${DAY_NAMES[s.weekday]} de chaque mois, de ${hourLabel(s.startHour)} au ${bossEndLabel(s)}${extra ? ", et à des dates fixées par l'équipe" : ""}`;
  return `le ${WEEKEND_WORDS[s.weekend] ?? "premier"} week-end de chaque mois, du vendredi ${hourLabel(s.startHour)} au ${bossEndLabel(s)}${extra ? ", et à des dates fixées par l'équipe" : ""}`;
}

/** Une apparition est-elle programmée (rendez-vous mensuel ou date à venir) ? */
export function hasBossSchedule(s: BossSchedule, now = Date.now()): boolean {
  return s.enabled || (s.dates ?? []).some((d) => d.startMs + d.durationHours * HOUR > now);
}

export function validateBossSchedule(label: string, s: Partial<BossSchedule>): string[] {
  const errors: string[] = [];
  if (!BOSS_WEEKENDS.some((w) => w.id === s.weekend)) errors.push(`${label} : week-end inconnu.`);
  if (!(Number(s.startHour) >= 0 && Number(s.startHour) < 24)) errors.push(`${label} : heure de départ entre 0 et 23.`);
  if (!(Number(s.durationHours) >= 1 && Number(s.durationHours) <= 160)) errors.push(`${label} : durée entre 1 et 160 h.`);
  if (typeof s.weekday === "number" && !(Number.isInteger(s.weekday) && s.weekday >= 0 && s.weekday <= 6)) errors.push(`${label} : jour de départ inconnu.`);
  const dates = s.dates ?? [];
  if (dates.length > MAX_BOSS_DATES) errors.push(`${label} : ${MAX_BOSS_DATES} dates précises au plus.`);
  dates.forEach((d, i) => {
    if (!(Number(d.startMs) > 0)) errors.push(`${label} : date n° ${i + 1} invalide.`);
    if (!(Number(d.durationHours) >= 1 && Number(d.durationHours) <= 160)) errors.push(`${label} : date n° ${i + 1}, durée entre 1 et 160 h.`);
  });
  const sorted = [...dates].sort((a, b) => a.startMs - b.startMs);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].startMs < sorted[i - 1].startMs + sorted[i - 1].durationHours * HOUR) errors.push(`${label} : deux dates précises se chevauchent.`);
  return errors;
}

function rotationEvent(window: { startMs: number; endMs: number; week: number; nth: number; lastOfMonth: boolean }): GameEvent | null {
  const list = EVENT_RULES.rotation.filter((id) => findEventType(id));
  if (!EVENT_RULES.rotationEnabled || list.length === 0) return null;
  // 5.15.14 : week-end annulé (ou déplacé) depuis le planificateur.
  if ((EVENT_RULES.rotationSkips ?? []).includes(window.startMs)) return null;
  // Week-end du Léviathan : pas d'événement de la rotation (v5.14 : sauf en rotation hebdomadaire,
  // où les boss mondiaux et les événements se côtoient).
  if (EVENT_RULES.bossMonthly && !EVENT_RULES.bossWeekly && onWeekend(window, EVENT_RULES.bossWeekend)) return null;
  // v5.10.5 : un Léviathan à date précise pendant ce week-end remplace aussi l'événement.
  if ((EVENT_RULES.bossDates ?? []).some((d) => d.startMs < window.endMs && d.startMs + d.durationHours * HOUR > window.startMs)) return null;
  const type = findEventType(list[((window.week % list.length) + list.length) % list.length])!;
  return { key: `${type.id}:${window.startMs}`, type, startMs: window.startMs, endMs: window.endMs, scheduled: false };
}

function scheduledEvents(): GameEvent[] {
  return (EVENT_RULES.scheduled ?? []).flatMap((s) => {
    const type = findEventType(s.type);
    if (!type || !(s.endMs > s.startMs)) return [];
    return scheduledOccurrences(s).map((o) => ({ key: `${s.id}:${o.startMs}`, type, startMs: o.startMs, endMs: o.endMs, scheduled: true }));
  });
}

/** Événement actif à cet instant (un événement programmé passe avant la rotation). */
export function eventAt(now: number): GameEvent | null {
  const scheduled = scheduledEvents().find((e) => e.startMs <= now && now < e.endMs);
  if (scheduled) return scheduled;
  const rotation = rotationEvent(weekendWindow(now));
  return rotation && rotation.startMs <= now && now < rotation.endMs ? rotation : null;
}

/** Événement en cours, sinon le prochain. */
export function currentOrNextEvent(now: number): GameEvent | null {
  const active = eventAt(now);
  if (active) return active;
  const candidates: GameEvent[] = scheduledEvents().filter((e) => e.startMs > now);
  for (let w = 0; w <= 1; w++) {
    const r = rotationEvent(weekendWindow(now, w));
    if (r && r.startMs > now) {
      candidates.push(r);
      break;
    }
  }
  return candidates.sort((a, b) => a.startMs - b.startMs)[0] ?? null;
}

/** v5.10.5 : événements du week-end (rotation et programmés) qui commencent ou durent dans l'intervalle. */
export function weekendEventsBetween(from: number, to: number): GameEvent[] {
  const out = scheduledEvents().filter((e) => e.endMs > from && e.startMs < to);
  for (let w = -1; w < 60; w++) {
    const win = weekendWindow(from, w);
    if (win.startMs >= to) break;
    const r = rotationEvent(win);
    if (r && r.endMs > from && !out.some((e) => e.startMs < r.endMs && e.endMs > r.startMs)) out.push(r);
  }
  return out.sort((a, b) => a.startMs - b.startMs);
}

/** Instants de (fin, début) d'événements entre from et to, triés. */
export function eventBoundaries(from: number, to: number): number[] {
  const points = new Set<number>();
  for (const e of scheduledEvents()) {
    if (e.startMs > from && e.startMs < to) points.add(e.startMs);
    if (e.endMs > from && e.endMs < to) points.add(e.endMs);
  }
  if (EVENT_RULES.rotationEnabled) {
    // Fenêtres du week-end qui recoupent l'intervalle (au plus une par semaine).
    for (let w = 0; ; w++) {
      const win = weekendWindow(from, w);
      if (win.startMs >= to) break;
      if (win.startMs > from) points.add(win.startMs);
      if (win.endMs > from && win.endMs < to) points.add(win.endMs);
      if (w > 60) break;
    }
  }
  return [...points].sort((a, b) => a - b);
}

/* ---------- effets ---------- */

export function productionMultipliers(now: number): Partial<Record<string, number>> {
  return eventAt(now)?.type.effects.production ?? {};
}

export function buildTimeFactor(now: number): number {
  return eventAt(now)?.type.effects.buildTime ?? 1;
}

export function researchTimeFactor(now: number): number {
  return eventAt(now)?.type.effects.researchTime ?? 1;
}

export function missionRewardFactor(now: number): number {
  return eventAt(now)?.type.effects.missionRewards ?? 1;
}

export function lootFactor(now: number): number {
  return eventAt(now)?.type.effects.loot ?? 1;
}

/** Part des débris pendant l'événement (null = règle normale). */
export function eventDebrisPercent(now: number): number | null {
  return eventAt(now)?.type.effects.debrisPercent ?? null;
}
