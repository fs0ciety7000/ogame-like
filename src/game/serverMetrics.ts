/* =====================================================
   5.26 : métriques d'exploitation.
   - Tâches planifiées : durée, dernier passage, échecs, retard.
   - Web Vitals mesurés chez les joueurs (LCP, INP, CLS, FCP, TTFB),
     agrégés par jour en histogrammes pour en tirer le 75e centile.
   Stockées dans la collection `server_metrics` (lecture réservée à
   l'équipe) ; la page de statut publique n'en reçoit qu'un résumé.
===================================================== */

export const METRICS_KEYS = { cron: "cron", vitals: "web_vitals" } as const;

/* ---------- tâches planifiées ---------- */

export interface CronRun {
  lastAtMs: number;
  lastMs: number;
  /** Moyenne glissante (exponentielle) de la durée. */
  avgMs: number;
  maxMs: number;
  runs: number;
  fails: number;
  lastError: string;
  lastErrorAtMs: number;
  everyMs: number;
  /** 6.14.111 (AC-E) : passages sautés parce que le précédent tournait encore (verrou de cadence). */
  skips?: number;
  lastSkipAtMs?: number;
}

export type CronMetrics = Record<string, CronRun>;

/** Intervalle attendu d'une expression cron simple (minute, heure, jour). */
export function cronIntervalMs(spec: string): number {
  const [min = "*", hour = "*", dom = "*"] = spec.trim().split(/\s+/);
  const step = /^\*\/(\d+)$/;
  if (dom !== "*") return 30 * 86_400_000;
  if (hour !== "*" && !step.test(hour)) return 86_400_000;
  if (step.test(hour)) return Number(step.exec(hour)![1]) * 3_600_000;
  if (min === "*") return 60_000;
  if (step.test(min)) return Number(step.exec(min)![1]) * 60_000;
  return 3_600_000;
}

export function normalizeCronMetrics(raw: unknown): CronMetrics {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: CronMetrics = {};
  for (const [name, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    const n = (k: string) => (Number.isFinite(Number(r[k])) ? Number(r[k]) : 0);
    out[name.slice(0, 60)] = {
      lastAtMs: n("lastAtMs"),
      lastMs: n("lastMs"),
      avgMs: n("avgMs"),
      maxMs: n("maxMs"),
      runs: n("runs"),
      fails: n("fails"),
      lastError: typeof r.lastError === "string" ? r.lastError.slice(0, 300) : "",
      lastErrorAtMs: n("lastErrorAtMs"),
      everyMs: n("everyMs") || 60_000,
      skips: n("skips"),
      lastSkipAtMs: n("lastSkipAtMs"),
    };
  }
  return out;
}

export function recordCronRun(metrics: CronMetrics, name: string, spec: string, startedAtMs: number, durationMs: number, error: string | null): CronMetrics {
  const prev = metrics[name];
  const ms = Math.max(0, Math.round(durationMs));
  const run: CronRun = {
    lastAtMs: startedAtMs,
    lastMs: ms,
    avgMs: prev && prev.runs > 0 ? Math.round(prev.avgMs * 0.8 + ms * 0.2) : ms,
    maxMs: Math.max(prev?.maxMs ?? 0, ms),
    runs: (prev?.runs ?? 0) + 1,
    fails: (prev?.fails ?? 0) + (error ? 1 : 0),
    lastError: error ? error.slice(0, 300) : (prev?.lastError ?? ""),
    lastErrorAtMs: error ? startedAtMs : (prev?.lastErrorAtMs ?? 0),
    everyMs: cronIntervalMs(spec),
    skips: prev?.skips ?? 0,
    lastSkipAtMs: prev?.lastSkipAtMs ?? 0,
  };
  return { ...metrics, [name]: run };
}

/** 6.14.111 (AC-E) : passage sauté (la cadence tournait encore). Le dernier passage réel reste celui d'avant : une cadence
 *  bloquée finit « en retard » sur la page Santé. */
export function recordCronSkip(metrics: CronMetrics, name: string, spec: string, now: number): CronMetrics {
  const prev = metrics[name];
  const base: CronRun = prev ?? { lastAtMs: 0, lastMs: 0, avgMs: 0, maxMs: 0, runs: 0, fails: 0, lastError: "", lastErrorAtMs: 0, everyMs: cronIntervalMs(spec) };
  return { ...metrics, [name]: { ...base, skips: (base.skips ?? 0) + 1, lastSkipAtMs: now } };
}

export type CronStatus = "ok" | "late" | "failing" | "slow";

/** État d'une tâche : en retard (plus de 2 intervalles + 2 min sans passage), en échec (dernière erreur après le dernier succès), lente (> 20 s). */
export function cronStatus(run: CronRun, now: number): CronStatus {
  if (now - run.lastAtMs > run.everyMs * 2 + 120_000) return "late";
  if (run.lastErrorAtMs && run.lastErrorAtMs >= run.lastAtMs) return "failing";
  if (run.lastMs > 20_000) return "slow";
  return "ok";
}

export function cronSummary(metrics: CronMetrics, now: number): { total: number; late: number; failing: number; slow: number } {
  const all = Object.values(metrics).map((r) => cronStatus(r, now));
  return { total: all.length, late: all.filter((s) => s === "late").length, failing: all.filter((s) => s === "failing").length, slow: all.filter((s) => s === "slow").length };
}

/* ---------- Web Vitals ---------- */

export type VitalName = "lcp" | "inp" | "cls" | "fcp" | "ttfb";
export const VITALS: { id: VitalName; label: string; unit: "ms" | ""; good: number; poor: number }[] = [
  { id: "lcp", label: "Affichage principal (LCP)", unit: "ms", good: 2500, poor: 4000 },
  { id: "inp", label: "Réactivité (INP)", unit: "ms", good: 200, poor: 500 },
  { id: "cls", label: "Stabilité (CLS)", unit: "", good: 0.1, poor: 0.25 },
  { id: "fcp", label: "Premier affichage (FCP)", unit: "ms", good: 1800, poor: 3000 },
  { id: "ttfb", label: "Réponse du serveur (TTFB)", unit: "ms", good: 800, poor: 1800 },
];

/** Bornes des histogrammes (valeur haute de chaque case ; CLS en millièmes). */
const EDGES = [50, 100, 150, 200, 300, 400, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7000, 10000, 15000, 30000, Infinity];
const KEEP_DAYS = 14;

export interface VitalsDay {
  /** Histogrammes par mesure (et par appareil : m = mobile, d = ordinateur). */
  h: Partial<Record<string, number[]>>;
  /** Échantillons par page (pour repérer les pages lentes). */
  pages: Record<string, { n: number; lcpSum: number }>;
}
export type VitalsStore = Record<string, VitalsDay>;

export interface VitalsSample {
  route: string;
  device: "m" | "d";
  values: Partial<Record<VitalName, number>>;
}

function bucket(v: number): number {
  return EDGES.findIndex((e) => v <= e);
}

/** Nettoie un échantillon envoyé par un navigateur (données libres). */
export function sanitizeVitals(raw: unknown): VitalsSample | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const values: Partial<Record<VitalName, number>> = {};
  const v = (r.values ?? {}) as Record<string, unknown>;
  for (const m of VITALS) {
    const n = Number(v[m.id]);
    if (Number.isFinite(n) && n >= 0 && n < (m.id === "cls" ? 50 : 120_000)) values[m.id] = n;
  }
  if (Object.keys(values).length === 0) return null;
  // Page : chemin sans identifiants (les segments longs ou chiffrés deviennent « : »).
  const route = String(r.route ?? "/")
    .split("?")[0]
    .split("/")
    .map((seg) => (/\d/.test(seg) || seg.length > 24 ? ":" : seg))
    .join("/")
    .slice(0, 60);
  return { route: route || "/", device: r.device === "m" ? "m" : "d", values };
}

function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function addVitals(store: VitalsStore, sample: VitalsSample, now: number): VitalsStore {
  const key = dayKey(now);
  const day: VitalsDay = store[key] ? { h: { ...store[key].h }, pages: { ...store[key].pages } } : { h: {}, pages: {} };
  for (const [metric, value] of Object.entries(sample.values) as [VitalName, number][]) {
    const k = `${metric}.${sample.device}`;
    const hist = [...(day.h[k] ?? new Array(EDGES.length).fill(0))];
    hist[bucket(metric === "cls" ? value * 1000 : value)]++;
    day.h[k] = hist;
  }
  const page = day.pages[sample.route] ?? { n: 0, lcpSum: 0 };
  // 60 pages au plus par jour (taille bornée) ; les pages déjà vues continuent de compter.
  if (day.pages[sample.route] || Object.keys(day.pages).length < 60) {
    day.pages[sample.route] = { n: page.n + 1, lcpSum: page.lcpSum + (sample.values.lcp ?? 0) };
  }
  const out: VitalsStore = { ...store, [key]: day };
  const cutoff = dayKey(now - KEEP_DAYS * 86_400_000);
  for (const d of Object.keys(out)) if (d < cutoff) delete out[d];
  return out;
}

function percentile(hist: number[], p: number): number | null {
  const total = hist.reduce((a, b) => a + b, 0);
  if (!total) return null;
  let acc = 0;
  for (let i = 0; i < hist.length; i++) {
    acc += hist[i];
    if (acc >= total * p) return EDGES[i] === Infinity ? EDGES[i - 1] : EDGES[i];
  }
  return null;
}

export interface VitalsReport {
  samples: number;
  metrics: { id: VitalName; p75: number | null; p75Mobile: number | null; p75Desktop: number | null; rating: "good" | "needs" | "poor" | null }[];
  slowPages: { route: string; n: number; lcpAvg: number }[];
}

/** Résumé sur les `days` derniers jours : 75e centile (borne haute de la case) et pages les plus lentes. */
export function vitalsReport(store: VitalsStore, now: number, days = 7): VitalsReport {
  const keys = Object.keys(store).filter((d) => d >= dayKey(now - (days - 1) * 86_400_000));
  const sum = (k: string) => keys.reduce((acc, d) => (store[d].h[k] ?? []).map((n, i) => n + (acc[i] ?? 0)), [] as number[]);
  const pages: Record<string, { n: number; lcpSum: number }> = {};
  let samples = 0;
  for (const d of keys) {
    for (const [route, p] of Object.entries(store[d].pages)) {
      const cur = pages[route] ?? { n: 0, lcpSum: 0 };
      pages[route] = { n: cur.n + p.n, lcpSum: cur.lcpSum + p.lcpSum };
      samples += p.n;
    }
  }
  const metrics = VITALS.map((m) => {
    const mob = sum(`${m.id}.m`);
    const desk = sum(`${m.id}.d`);
    const both = mob.length ? mob.map((n, i) => n + (desk[i] ?? 0)) : desk;
    const scale = (v: number | null) => (v === null ? null : m.id === "cls" ? v / 1000 : v);
    const p75 = scale(percentile(both, 0.75));
    return {
      id: m.id,
      p75,
      p75Mobile: scale(percentile(mob, 0.75)),
      p75Desktop: scale(percentile(desk, 0.75)),
      rating: p75 === null ? null : p75 <= m.good ? ("good" as const) : p75 <= m.poor ? ("needs" as const) : ("poor" as const),
    };
  });
  const slowPages = Object.entries(pages)
    .filter(([, p]) => p.n >= 3 && p.lcpSum > 0)
    .map(([route, p]) => ({ route, n: p.n, lcpAvg: Math.round(p.lcpSum / p.n) }))
    .sort((a, b) => b.lcpAvg - a.lcpAvg)
    .slice(0, 8);
  return { samples, metrics, slowPages };
}
