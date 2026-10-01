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
  /** v3.1 : le premier week-end du mois, le Léviathan remplace l'événement. */
  bossMonthly: boolean;
  /** Heure de début le vendredi (heure de Paris). */
  startHour: number;
  rotation: string[];
  types: EventType[];
  scheduled: ScheduledEvent[];
} = {
  rotationEnabled: true,
  bossMonthly: true,
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
function parisLocalToUtc(localMs: number): number {
  return localMs - parisOffsetMs(localMs - 2 * HOUR);
}

export function findEventType(id: string): EventType | undefined {
  return EVENT_RULES.types.find((t) => t.id === id);
}

/** Fenêtre du week-end en cours ou à venir (rotation). */
export function weekendWindow(now: number, weeksAhead = 0): { startMs: number; endMs: number; week: number; firstOfMonth: boolean } {
  const local = now + parisOffsetMs(now);
  const localMidnight = Math.floor(local / DAY) * DAY;
  const daysSinceFriday = (new Date(local).getUTCDay() - 5 + 7) % 7;
  const friday = localMidnight - daysSinceFriday * DAY + weeksAhead * 7 * DAY;
  return {
    startMs: parisLocalToUtc(friday + EVENT_RULES.startHour * HOUR),
    endMs: parisLocalToUtc(friday + 3 * DAY),
    week: Math.round((friday - REFERENCE_FRIDAY) / (7 * DAY)),
    firstOfMonth: new Date(friday).getUTCDate() <= 7,
  };
}

function rotationEvent(window: { startMs: number; endMs: number; week: number; firstOfMonth: boolean }): GameEvent | null {
  const list = EVENT_RULES.rotation.filter((id) => findEventType(id));
  if (!EVENT_RULES.rotationEnabled || list.length === 0) return null;
  // Week-end du Léviathan : pas d'événement de la rotation.
  if (EVENT_RULES.bossMonthly && window.firstOfMonth) return null;
  const type = findEventType(list[((window.week % list.length) + list.length) % list.length])!;
  return { key: `${type.id}:${window.startMs}`, type, startMs: window.startMs, endMs: window.endMs, scheduled: false };
}

function scheduledEvents(): GameEvent[] {
  return (EVENT_RULES.scheduled ?? [])
    .map((s) => {
      const type = findEventType(s.type);
      return type && s.endMs > s.startMs ? { key: `${s.id}:${s.startMs}`, type, startMs: s.startMs, endMs: s.endMs, scheduled: true } : null;
    })
    .filter((e): e is GameEvent => e !== null);
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
