import { formatInt } from "@/game/format";
import { MISSIONS } from "@/game/missions";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.17.1 : audit de l'XP et de l'activité des joueurs (administration).
   - Registre horaire de l'XP par source (player.stats.xpHours), alimenté
     par applyXpDelta : 1 h, 24 h et 7 jours exacts à partir du déploiement.
   - Reconstitution du passé depuis les notifications (« +60 XP »), qui
     ne sont jamais purgées.
   - Signaux d'alerte chiffrés : plafond théorique des missions, compte
     test, activité 24 h/24, combats répétés entre deux mêmes joueurs,
     actions de l'équipe sur le compte.
===================================================== */

export type XpSource = "mission" | "attack" | "defense" | "expedition" | "bounty" | "pirate" | "achievement" | "contract" | "other";

export const XP_SOURCE_LABELS: Record<XpSource, string> = {
  mission: "Missions",
  attack: "Attaques",
  defense: "Défenses",
  expedition: "Expéditions",
  bounty: "Primes",
  pirate: "Factions",
  achievement: "Succès",
  contract: "Contrats",
  other: "Autre",
};

const HOUR = 3600_000;
const LEDGER_HOURS = 8 * 24;

export const hourIndex = (ms: number) => Math.floor(ms / HOUR);

/** Inscrit un gain (ou une perte) d'XP au registre horaire. */
export function recordXp(player: Pick<PlayerState, "stats">, source: XpSource, delta: number, now: number): void {
  if (!delta || !Number.isFinite(delta)) return;
  const h = hourIndex(now);
  const ledger: NonNullable<NonNullable<PlayerState["stats"]>["xpHours"]> = {};
  for (const [k, v] of Object.entries(player.stats?.xpHours ?? {})) if (h - Number(k) < LEDGER_HOURS) ledger[k] = v;
  const slot = { ...(ledger[String(h)] ?? {}) };
  slot[source] = (slot[source] ?? 0) + Math.round(delta);
  ledger[String(h)] = slot;
  player.stats = { ...(player.stats ?? {}), xpHours: ledger };
}

export type AuditWindow = "1h" | "24h" | "7d";
export const AUDIT_WINDOWS: { id: AuditWindow; label: string; ms: number }[] = [
  { id: "1h", label: "Dernière heure", ms: HOUR },
  { id: "24h", label: "24 heures", ms: 24 * HOUR },
  { id: "7d", label: "7 jours", ms: 7 * 24 * HOUR },
];
export const windowMs = (w: AuditWindow) => AUDIT_WINDOWS.find((x) => x.id === w)?.ms ?? 24 * HOUR;

export interface XpTotals {
  total: number;
  bySource: Partial<Record<XpSource, number>>;
}

/** Totaux du registre sur une fenêtre (heure en cours comprise). */
export function ledgerTotals(stats: PlayerState["stats"], now: number, ms: number): XpTotals {
  const out: XpTotals = { total: 0, bySource: {} };
  const h = hourIndex(now);
  const span = Math.max(1, Math.round(ms / HOUR));
  for (const [k, slot] of Object.entries(stats?.xpHours ?? {})) {
    if (h - Number(k) >= span) continue;
    for (const [src, v] of Object.entries(slot ?? {}) as [XpSource, number][]) {
      out.bySource[src] = (out.bySource[src] ?? 0) + v;
      out.total += v;
    }
  }
  return out;
}

/** Première heure du registre (null : rien d'inscrit). */
export function ledgerSince(stats: PlayerState["stats"]): number | null {
  const keys = Object.keys(stats?.xpHours ?? {}).map(Number);
  return keys.length ? Math.min(...keys) * HOUR : null;
}

/** Le registre couvre-t-il toute la fenêtre ? Sinon (déploiement récent), la reconstitution fait foi. */
export function ledgerCovers(sinceMs: number | null, now: number, ms: number): boolean {
  if (sinceMs === null) return false;
  const span = Math.max(1, Math.round(ms / HOUR));
  return sinceMs <= (hourIndex(now) - span + 1) * HOUR;
}

/** Totaux à afficher : le registre s'il couvre la fenêtre, sinon les notifications. */
export function bestTotals(ledger: XpTotals, rebuilt: XpTotals, sinceMs: number | null, now: number, ms: number): { totals: XpTotals; source: "ledger" | "notifications" } {
  return ledgerCovers(sinceMs, now, ms) ? { totals: ledger, source: "ledger" } : { totals: rebuilt, source: "notifications" };
}

/** XP de missions possible au maximum sur une durée : toutes les missions relancées sans temps mort. */
export function missionXpCeiling(ms: number, eventFactor = 1): number {
  let perHour = 0;
  for (const m of Object.values(MISSIONS)) {
    const xp = Number((m.reward as Record<string, number>).xp) || 0;
    if (xp > 0 && m.duration > 0) perHour += xp / (m.duration / 3600);
  }
  return Math.round(perHour * (ms / HOUR) * eventFactor);
}

/** Notifications qui citent de l'XP sans en rapporter (résumé de la semaine, score de saison). */
const RECAP_KINDS = ["system", "season"];

/** XP portée par une notification : data.xp, sinon « +60 XP » dans le message. */
export function notifXp(n: { kind?: string; message?: string; data?: unknown }): number {
  if (RECAP_KINDS.includes(String(n.kind ?? ""))) return 0;
  const d = n.data as { xp?: unknown } | null | undefined;
  if (d && typeof d.xp === "number" && Number.isFinite(d.xp)) return d.xp;
  const m = /([+−-])\s?(\d[\d\s\u202f]*)\s?XP/.exec(String(n.message ?? ""));
  if (!m) return 0;
  const v = Number(m[2].replace(/[\s\u202f]/g, ""));
  return m[1] === "+" ? v : -v;
}

/** Source probable d'une notification. */
export function notifSource(n: { kind?: string; title?: string }): XpSource {
  const k = String(n.kind ?? "");
  const t = String(n.title ?? "").toLowerCase();
  if (k === "mission" || t.startsWith("mission")) return "mission";
  if (k === "combat-attacker") return "attack";
  if (k === "combat-defender") return "defense";
  if (k === "bounty") return "bounty";
  if (k === "achievement" || t.includes("succès")) return "achievement";
  if (t.includes("expédition")) return "expedition";
  if (k === "pirate" || k === "threat") return "pirate";
  if (k === "contract") return "contract";
  return "other";
}

/** Rythme d'activité : heures distinctes actives et plus longue série d'heures consécutives. */
export function activityProfile(timestamps: number[], now: number, ms: number): { activeHours: number; longestStreak: number; byHour: number[] } {
  const span = Math.max(1, Math.round(ms / HOUR));
  const h0 = hourIndex(now) - span + 1;
  const byHour = new Array<number>(span).fill(0);
  for (const t of timestamps) {
    const i = hourIndex(t) - h0;
    if (i >= 0 && i < span) byHour[i]++;
  }
  let longest = 0;
  let cur = 0;
  for (const c of byHour) {
    cur = c > 0 ? cur + 1 : 0;
    longest = Math.max(longest, cur);
  }
  return { activeHours: byHour.filter((c) => c > 0).length, longestStreak: longest, byHour };
}

export interface BattleLite {
  attackerUid: string;
  attackerPseudo?: string;
  defenderUid: string;
  defenderPseudo?: string;
  outcome: string;
  timestamp: number;
  attackerXpDelta?: number;
  defenderXpDelta?: number;
}

export interface BattlePair {
  uid: string;
  pseudo: string;
  attacks: number;
  defenses: number;
  xp: number;
}

/** Adversaires d'un joueur, du plus fréquent au moins fréquent, avec l'XP que chacun lui a rapportée. */
export function battlePairs(reports: BattleLite[], uid: string): BattlePair[] {
  const by = new Map<string, BattlePair>();
  for (const r of reports) {
    const asAttacker = r.attackerUid === uid;
    if (!asAttacker && r.defenderUid !== uid) continue;
    const other = asAttacker ? r.defenderUid : r.attackerUid;
    const pseudo = (asAttacker ? r.defenderPseudo : r.attackerPseudo) ?? other;
    const row = by.get(other) ?? { uid: other, pseudo, attacks: 0, defenses: 0, xp: 0 };
    if (asAttacker) row.attacks++;
    else row.defenses++;
    row.xp += Number(asAttacker ? r.attackerXpDelta : r.defenderXpDelta) || 0;
    by.set(other, row);
  }
  return [...by.values()].sort((a, b) => b.attacks + b.defenses - (a.attacks + a.defenses) || b.xp - a.xp);
}

export type FlagSeverity = "high" | "medium" | "info";
export interface AuditFlag {
  id: string;
  severity: FlagSeverity;
  title: string;
  detail: string;
}

export interface AuditInput {
  now: number;
  xp: number;
  createdAtMs: number;
  testMode?: boolean;
  /** XP gagnée sur 24 h (registre ou reconstitution) et part des missions. */
  xp24h: number;
  missionXp24h: number;
  /** Médiane et 90e centile de l'XP sur 24 h des joueurs actifs (comparaison). */
  median24h?: number;
  p90_24h?: number;
  /** Heures actives sur les dernières 24 h et plus longue série sur 7 jours. */
  activeHours24h?: number;
  longestStreak7d?: number;
  pairs?: BattlePair[];
  adminActions?: number;
  /** Bonus de missions d'un événement en cours (1 = aucun). */
  eventFactor?: number;
}

/** Signaux d'alerte, du plus grave au moins grave. */
export function auditFlags(i: AuditInput): AuditFlag[] {
  const out: AuditFlag[] = [];
  const fmt = (n: number) => formatInt(Math.round(n));
  if (i.testMode) {
    out.push({
      id: "test-mode",
      severity: "high",
      title: "Compte test actif",
      detail: "Toutes les files (missions comprises) se terminent aussitôt : depuis la 5.17.1, les missions d'un compte test ne rapportent plus d'XP, mais l'XP gagnée avant reste acquise.",
    });
  }
  const cap24 = missionXpCeiling(24 * HOUR, Math.max(1, i.eventFactor ?? 1));
  if (i.missionXp24h > cap24 * 1.05) {
    out.push({ id: "mission-cap", severity: "high", title: "XP de missions impossible en jeu normal", detail: `${fmt(i.missionXp24h)} XP de missions en 24 h, pour un maximum théorique de ${fmt(cap24)} (toutes les missions relancées sans interruption).` });
  } else if (i.missionXp24h > cap24 * 0.7) {
    out.push({ id: "mission-near-cap", severity: "medium", title: "Missions relancées presque sans interruption", detail: `${fmt(i.missionXp24h)} XP de missions en 24 h, soit ${Math.round((i.missionXp24h / cap24) * 100)} % du maximum théorique (${fmt(cap24)}). Possible en jouant beaucoup, ou avec un script.` });
  }
  if ((i.activeHours24h ?? 0) >= 20) {
    out.push({ id: "always-on", severity: "medium", title: "Actif presque 24 h sur 24", detail: `Activité relevée dans ${i.activeHours24h} heures différentes sur les dernières 24 h. Signe possible d'automatisation ou de compte partagé.` });
  }
  if ((i.longestStreak7d ?? 0) >= 30) {
    out.push({ id: "streak", severity: "medium", title: "Longue série sans pause", detail: `${i.longestStreak7d} heures d'affilée avec de l'activité sur les 7 derniers jours.` });
  }
  if (i.p90_24h && i.p90_24h > 0 && i.xp24h > Math.max(3 * i.p90_24h, 500)) {
    out.push({ id: "outlier", severity: "medium", title: "XP très au-dessus des autres joueurs", detail: `${fmt(i.xp24h)} XP en 24 h, contre ${fmt(i.p90_24h)} pour le 90e centile des joueurs actifs (médiane ${fmt(i.median24h ?? 0)}).` });
  }
  for (const p of (i.pairs ?? []).filter((p) => p.attacks + p.defenses >= 6).slice(0, 3)) {
    out.push({ id: `pair-${p.uid}`, severity: p.xp > 200 ? "medium" : "info", title: `Combats répétés avec ${p.pseudo}`, detail: `${p.attacks} attaques et ${p.defenses} défenses sur la période, pour ${fmt(p.xp)} XP. À vérifier : comptes liés ou entente.` });
  }
  if ((i.adminActions ?? 0) > 0) {
    out.push({ id: "admin", severity: "info", title: "Actions de l'équipe sur ce compte", detail: `${i.adminActions} action(s) d'administration enregistrée(s) (ressources, mode test, « tout terminer »…). Voir le détail plus bas.` });
  }
  const days = Math.max(1, (i.now - i.createdAtMs) / (24 * HOUR));
  const perDay = i.xp / days;
  if (perDay > cap24 * 1.05 && !i.testMode) {
    out.push({ id: "lifetime", severity: "high", title: "XP moyenne par jour hors de portée", detail: `${fmt(perDay)} XP par jour en moyenne depuis l'inscription, au-delà du maximum des missions (${fmt(cap24)} par jour) : il faut une autre source pour l'expliquer.` });
  }
  const order: Record<FlagSeverity, number> = { high: 0, medium: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Médiane et 90e centile d'une liste. */
export function percentiles(values: number[]): { median: number; p90: number } {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return { median: 0, p90: 0 };
  return { median: v[Math.floor((v.length - 1) / 2)], p90: v[Math.min(v.length - 1, Math.floor(v.length * 0.9))] };
}

/* 5.26.2 : alerte de l'équipe sur un gain d'XP de succès anormal (24 h glissantes). */
export const ACHIEVEMENT_XP_ALERT = { windowMs: 24 * HOUR, minXp: 2000, minShare: 0.6 };

/** XP de succès sur 24 h si elle dépasse le seuil et la part de l'XP totale (sinon null). */
export function achievementXpAlert(stats: PlayerState["stats"], now: number): { xp: number; total: number; share: number } | null {
  const t = ledgerTotals(stats, now, ACHIEVEMENT_XP_ALERT.windowMs);
  const xp = t.bySource.achievement ?? 0;
  if (xp < ACHIEVEMENT_XP_ALERT.minXp || t.total <= 0) return null;
  const share = xp / t.total;
  return share >= ACHIEVEMENT_XP_ALERT.minShare ? { xp, total: t.total, share } : null;
}
