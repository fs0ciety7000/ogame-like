import { COMMON_RESOURCES } from "@/game/economy";
import { formatInt } from "@/game/format";
import { getProductionRatesPerSecond } from "@/game/production";
import { getTradeRate, RESOURCE_LIST } from "@/game/resources";
import type { PlayerState, ResourceId, Resources } from "@/types/game";

/* =====================================================
   Alertes de ressources anormales (v3.3) : chaque heure, le serveur compare
   les relevés horaires des stocks de chaque joueur. On mesure la valeur
   totale du stock (une ressource rare vaut son prix à l'échange : 100
   communes), si bien qu'une conversion au comptoir ne déclenche rien. Un
   gain de valeur supérieur à 50 h de production en une heure devient un
   signalement « Compte » réservé à l'équipe.
===================================================== */

export const ANOMALY_RULES = {
  /** Gain de valeur par heure au-delà de N heures de production totale. */
  productionHours: 50,
  /** Seuil minimal par heure (début de partie). */
  minPerHour: 50_000_000,
  /** Clé game_config où le serveur note la dernière analyse. */
  scanKey: "anomaly_scan",
};

export interface ResourceAnomaly {
  /** Gain de valeur (en ressources communes). */
  gain: number;
  threshold: number;
  fromMs: number;
  toMs: number;
  /** Variations de stock par ressource. */
  deltas: Partial<Record<ResourceId, number>>;
}

const HOUR = 3600_000;
const ALL = RESOURCE_LIST.map((r) => r.id) as ResourceId[];

/** Valeur d'une ressource en communes (prix d'achat au comptoir). */
function unitValue(res: ResourceId): number {
  if (COMMON_RESOURCES.includes(res)) return 1;
  return 1 / getTradeRate(COMMON_RESOURCES[0], res);
}

export function stockValue(r: Partial<Resources>): number {
  return ALL.reduce((a, res) => a + Math.max(0, r[res] ?? 0) * unitValue(res), 0);
}

/** Seuil de gain de valeur sur `hours` heures (au moins 1). */
export function anomalyThreshold(player: Pick<PlayerState, "buildings" | "techLevels">, hours: number): number {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels ?? {});
  const perHour = COMMON_RESOURCES.reduce((a, res) => a + (rates[res] ?? 0), 0) * 3600;
  return Math.max(ANOMALY_RULES.minPerHour, ANOMALY_RULES.productionHours * perHour) * Math.max(1, hours);
}

/** Bonds anormaux entre relevés consécutifs (et jusqu'au stock actuel)
 *  dont la fin tombe après `sinceMs`. */
export function detectResourceAnomalies(
  player: Pick<PlayerState, "buildings" | "techLevels" | "resources" | "resourceHistory" | "resourcesUpdatedAtMs">,
  sinceMs: number,
): ResourceAnomaly[] {
  const points = [...(player.resourceHistory ?? [])].sort((a, b) => a.t - b.t);
  const lastT = points[points.length - 1]?.t ?? 0;
  const current = Number(player.resourcesUpdatedAtMs) || 0;
  if (current > lastT) points.push({ t: current, r: player.resources });
  const out: ResourceAnomaly[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (b.t <= sinceMs) continue;
    const gain = stockValue(b.r) - stockValue(a.r);
    const threshold = anomalyThreshold(player, (b.t - a.t) / HOUR);
    if (gain <= threshold) continue;
    const deltas: Partial<Record<ResourceId, number>> = {};
    for (const res of ALL) {
      const d = Math.round((b.r[res] ?? 0) - (a.r[res] ?? 0));
      if (d !== 0) deltas[res] = d;
    }
    out.push({ gain: Math.round(gain), threshold: Math.round(threshold), fromMs: a.t, toMs: b.t, deltas });
  }
  return out;
}

const fmtDate = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** Texte du signalement (une ligne par bond, avec le détail par ressource). */
export function describeAnomalies(list: ResourceAnomaly[]): string {
  return list
    .map((a) => {
      const detail = (Object.entries(a.deltas) as [ResourceId, number][])
        .map(([res, d]) => `${RESOURCE_LIST.find((r) => r.id === res)?.name ?? res} ${d > 0 ? "+" : ""}${formatInt(d)}`)
        .join(", ");
      return `• ${fmtDate(a.fromMs)} → ${fmtDate(a.toMs)} : valeur +${formatInt(a.gain)} (seuil ${formatInt(a.threshold)}). ${detail}.`;
    })
    .join("\n");
}
