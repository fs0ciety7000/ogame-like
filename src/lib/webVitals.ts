import { pb } from "@/lib/pocketbase";

/* 5.26 : Web Vitals mesurés chez les joueurs, sans dépendance : LCP, CLS,
   INP (plus longue interaction), FCP et TTFB, envoyés une fois quand la page
   est quittée ou masquée. Un chargement sur quatre seulement, et uniquement
   connecté ; aucune donnée personnelle (page anonymisée côté serveur). */

const SAMPLE_RATE = 0.25;
let installed = false;

type Values = { lcp?: number; cls?: number; inp?: number; fcp?: number; ttfb?: number };

function observe(type: string, cb: (entries: PerformanceEntry[]) => void, opts: Record<string, unknown> = {}) {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
    new PerformanceObserver((list) => cb(list.getEntries())).observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
  } catch {
    /* navigateur sans cette mesure */
  }
}

export function installWebVitals() {
  if (installed || typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;
  installed = true;
  if (Math.random() >= SAMPLE_RATE) return;

  const values: Values = {};
  const route = window.location.pathname;
  let sent = false;

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav && nav.responseStart > 0) values.ttfb = Math.round(nav.responseStart);
  observe("paint", (entries) => {
    const fcp = entries.find((e) => e.name === "first-contentful-paint");
    if (fcp) values.fcp = Math.round(fcp.startTime);
  });
  observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) values.lcp = Math.round(last.startTime);
  });
  let cls = 0;
  observe("layout-shift", (entries) => {
    for (const e of entries as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) cls += e.value;
    values.cls = Math.round(cls * 1000) / 1000;
  });
  observe(
    "event",
    (entries) => {
      for (const e of entries as (PerformanceEntry & { interactionId?: number })[]) if (e.interactionId) values.inp = Math.max(values.inp ?? 0, Math.round(e.duration));
    },
    { durationThreshold: 40 },
  );

  const send = () => {
    if (sent || !pb.authStore.isValid || Object.keys(values).length === 0) return;
    sent = true;
    const device = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches ? "m" : "d";
    try {
      void fetch(`${pb.baseURL.replace(/\/$/, "")}/api/cosmic/vitals`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", Authorization: pb.authStore.token },
        body: JSON.stringify({ route, device, values }),
      }).catch(() => undefined);
    } catch {
      /* jamais bloquant */
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send();
  });
  window.addEventListener("pagehide", send);
}
