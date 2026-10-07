/* =====================================================
   6.14.11 (lot C1) : chaîne de contenu (WORKFLOW.md §7, CLAUDE.md règle n° 4).
   Pour chaque contenu en vigueur (unité, bâtiment, techno, relique, boss), l'état des maillons que l'on peut vérifier
   dans le moteur : entrée de Codex, succès d'entrée et de maîtrise, préréglage d'effet qui le vise, porteur d'effet qui
   le vise. `true` = présent, `false` = manquant, `null` = sans objet pour ce type de contenu.
   Lu par `contentChain.test.ts` (garde : un contenu nouveau incomplet fait échouer le test).
   Proposition : docs/proposals/chaine-contenu.md.
===================================================== */
import { ACHIEVEMENTS, type AchievementMetric } from "@/game/achievements";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import { BUILDINGS } from "@/game/buildings";
import { chroniclesConfig } from "@/game/chronicles";
import { codexEntries } from "@/game/codex";
import { EFFECT_PRESETS } from "@/game/effectCatalog";
import { parseUnitSelector, selectorMatches } from "@/game/effectTargets";
import { MODULE_FAMILIES } from "@/game/modules";
import { RELICS } from "@/game/relics";
import { TECHNOLOGIES, techEffects } from "@/game/technologies";
import { unitClasses } from "@/game/unitClasses";
import { UNITS } from "@/game/units";
import { WORLD_BOSSES } from "@/game/worldBosses";
import type { PlayerState } from "@/types/game";

export type ChainKind = "unit" | "building" | "tech" | "relic" | "worldBoss" | "allianceBoss" | "seasonBoss";
export type ChainLink = "codex" | "achievementEntry" | "achievementMastery" | "effectPreset" | "effectCarrier";

export const CHAIN_KIND_LABELS: Record<ChainKind, string> = {
  unit: "Unité",
  building: "Bâtiment",
  tech: "Technologie",
  relic: "Relique",
  worldBoss: "Boss mondial",
  allianceBoss: "Boss d'alliance",
  seasonBoss: "Boss de chronique",
};

export const CHAIN_LINK_LABELS: Record<ChainLink, string> = {
  codex: "Codex",
  achievementEntry: "Succès d'entrée",
  achievementMastery: "Succès de maîtrise",
  effectPreset: "Préréglage d'effet",
  effectCarrier: "Porteur d'effet",
};

/**
 * Mesures de succès qui couvrent chaque type de contenu : la mesure compte les contenus du registre en vigueur, donc un
 * contenu ajouté y entre sans autre code. Liste vide = maillon manquant pour tout le type ; `null` = sans objet.
 */
export const CHAIN_ACHIEVEMENT_METRICS: Record<ChainKind, { entry: AchievementMetric[]; mastery: AchievementMetric[] | null }> = {
  unit: { entry: ["unitTypesPct"], mastery: ["maxUnitLevel"] },
  building: { entry: ["buildingsUnlockedPct"], mastery: ["maxBuildingLevel", "minBuildingLevel"] },
  tech: { entry: ["techCount"], mastery: ["techsMaxedPct", "maxTechLevel"] },
  relic: { entry: ["relicsOwned"], mastery: null },
  worldBoss: { entry: ["worldBossTypes"], mastery: null },
  allianceBoss: { entry: [], mastery: null },
  seasonBoss: { entry: ["bossSeals"], mastery: null },
};

export interface ChainRow {
  kind: ChainKind;
  id: string;
  name: string;
  links: Record<ChainLink, boolean | null>;
}

/** Date lointaine : toutes les fiches datées du Codex (chroniques) sont publiées. */
const FAR_FUTURE = Date.UTC(2100, 0, 1);

function codexIds(): Set<string> {
  const player = { stats: {}, units: {} } as unknown as Pick<PlayerState, "stats" | "units" | "chronicle">;
  return new Set(codexEntries(player, new Set(), FAR_FUTURE).map((e) => e.id));
}

function activeMetrics(): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.enabled).map((a) => a.metric));
}

/** Cibles d'unités des porteurs d'effets en vigueur : reliques composées, modules (par classe), technos à effet composé. */
export function unitCarrierSelectors(): string[] {
  const out: string[] = [];
  for (const r of RELICS) if (!r.disabled && r.effect === "custom" && r.custom?.target) out.push(r.custom.target);
  for (const fam of Object.values(MODULE_FAMILIES)) for (const cls of fam.classes) out.push(`class:${cls}`);
  for (const t of TECHNOLOGIES) for (const e of techEffects(t)) if (e.type === "stat" && e.target) out.push(e.target);
  // Seules les cibles d'unités comptent (une cible de ressource ou « attack » / « defense » vise autre chose).
  return out.filter((s) => parseUnitSelector(s).kind !== "all");
}

/** Bilan de la chaîne de contenu pour tout le contenu en vigueur. */
export function contentChainReport(): ChainRow[] {
  const codex = codexIds();
  const metrics = activeMetrics();
  const classes = unitClasses();
  const carriers = unitCarrierSelectors();
  const presets = EFFECT_PRESETS.map((p) => p.effect.target).filter((t): t is string => !!t);
  const ach = (kind: ChainKind) => {
    const m = CHAIN_ACHIEVEMENT_METRICS[kind];
    return {
      achievementEntry: m.entry.some((x) => metrics.has(x)),
      achievementMastery: m.mastery === null ? null : m.mastery.some((x) => metrics.has(x)),
    };
  };
  const row = (kind: ChainKind, id: string, name: string, links: Partial<Record<ChainLink, boolean | null>>): ChainRow => ({
    kind,
    id,
    name,
    links: { codex: null, effectPreset: null, effectCarrier: null, ...ach(kind), ...links },
  });

  const rows: ChainRow[] = [];
  for (const u of UNITS) {
    rows.push(
      row("unit", u.id, u.name, {
        codex: codex.has(`unit:${u.id}`),
        // Préréglage propre à l'unité : un préréglage de classe ne suffit pas (l'admin cherche l'unité par son nom).
        effectPreset: presets.includes(`unit:${u.id}`),
        effectCarrier: carriers.some((s) => selectorMatches(s, u.id, classes)),
      }),
    );
  }
  for (const b of BUILDINGS) rows.push(row("building", b.id, b.name, { codex: codex.has(`building:${b.id}`) }));
  for (const t of TECHNOLOGIES) rows.push(row("tech", t.id, t.nom, { codex: codex.has(`tech:${t.id}`) }));
  for (const r of RELICS.filter((x) => !x.disabled)) rows.push(row("relic", r.id, r.name, { codex: codex.has(`relic:${r.id}`) }));
  for (const b of WORLD_BOSSES.filter((x) => x.enabled !== false)) {
    rows.push(row("worldBoss", b.id, b.name, { codex: codex.has(b.id === "leviathan" ? "boss:leviathan" : `worldboss:${b.id}`) }));
  }
  for (const b of ALLIANCE_BOSSES) rows.push(row("allianceBoss", b.id, b.name, { codex: codex.has(`allianceboss:${b.id}`) }));
  for (const m of chroniclesConfig().months) rows.push(row("seasonBoss", m.id, m.boss.name, { codex: codex.has(`boss:${m.id}`) }));
  return rows;
}

/** Maillons manquants, sous la forme `<type>:<id>:<maillon>` (clé stable pour la liste des manques connus). */
export function contentChainGaps(rows: ChainRow[] = contentChainReport()): string[] {
  const out: string[] = [];
  for (const r of rows) {
    for (const [link, ok] of Object.entries(r.links)) if (ok === false) out.push(`${r.kind}:${r.id}:${link}`);
  }
  return out;
}
