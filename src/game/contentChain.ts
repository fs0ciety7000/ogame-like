/* =====================================================
   6.14.11 (lot C1) : chaîne de contenu (WORKFLOW.md §7, CLAUDE.md règle n° 4).
   Pour chaque contenu en vigueur (unité, bâtiment, techno, relique, boss, colonie, talent, module, classe d'empire), l'état
   des maillons que l'on peut vérifier dans le moteur. `true` = présent, `false` = manquant, `null` = sans objet pour ce type.
   Lu par `contentChain.test.ts` (garde : un contenu nouveau incomplet fait échouer le test) et, depuis 6.14.114 (AJ27-4),
   par le panneau Admin → Équilibrage → « Chaîne de contenu » (contenu ajouté dans l'admin compris).
   Proposition : docs/proposals/chaine-contenu.md ; revue : docs/audit/2026-10-07-au27-jeu-chaine.md (AJ-1, AJ-10).
===================================================== */
import { ACHIEVEMENTS, type AchievementMetric } from "@/game/achievements";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import { BUILDINGS, DOCK_BUILDING_ID } from "@/game/buildings";
import { chroniclesConfig } from "@/game/chronicles";
import { codexEntries } from "@/game/codex";
import { COLONY_SPECS, RARE_DEPOSITS, BIOMES } from "@/game/colonies";
import { recyclerUnitIds } from "@/game/debris";
import { allEffectPresets } from "@/game/effectCatalog";
import { parseUnitSelector, selectorMatches } from "@/game/effectTargets";
import { empireClasses } from "@/game/empireClass";
import { probeUnitIds } from "@/game/espionage";
import { MODULE_FAMILIES, MODULE_TEMPLATES } from "@/game/modules";
import { RELICS } from "@/game/relics";
import { TALENTS } from "@/game/talents";
import { TECHNOLOGIES, techEffects } from "@/game/technologies";
import { unitClasses } from "@/game/unitClasses";
import { UNITS } from "@/game/units";
import { WORLD_BOSSES } from "@/game/worldBosses";
import type { PlayerState } from "@/types/game";

export type ChainKind = "unit" | "building" | "tech" | "relic" | "worldBoss" | "allianceBoss" | "seasonBoss" | "colony" | "talent" | "module" | "class";
export type ChainLink = "codex" | "achievementEntry" | "achievementMastery" | "achievementOwn" | "effectPreset" | "effectCarrier" | "carrierOwn" | "palette";

export const CHAIN_KIND_LABELS: Record<ChainKind, string> = {
  unit: "Unité",
  building: "Bâtiment",
  tech: "Technologie",
  relic: "Relique",
  worldBoss: "Boss mondial",
  allianceBoss: "Boss d'alliance",
  seasonBoss: "Boss de chronique",
  colony: "Colonie (biome, spécialisation)",
  talent: "Talent d'Ascension",
  module: "Module de vaisseau",
  class: "Classe d'empire",
};

export const CHAIN_LINK_LABELS: Record<ChainLink, string> = {
  codex: "Codex",
  achievementEntry: "Succès d'entrée",
  achievementMastery: "Succès de maîtrise",
  achievementOwn: "Succès propre",
  effectPreset: "Préréglage d'effet",
  effectCarrier: "Porteur d'effet",
  carrierOwn: "Porteur propre",
  palette: "Recherche Ctrl+K",
};

/** 6.14.114 : onglet de l'admin où se règle chaque type de contenu (lien du panneau « Chaîne de contenu »). */
export const CHAIN_KIND_ADMIN_TAB: Record<ChainKind, string> = {
  unit: "units",
  building: "buildings",
  tech: "technologies",
  relic: "relics",
  worldBoss: "bosses",
  allianceBoss: "bosses",
  seasonBoss: "chronicles",
  colony: "rules",
  talent: "rules",
  module: "rules",
  class: "rules",
};

/** 6.14.114 : onglet de l'admin où se règle chaque maillon manquant (succès, Codex…). `null` : se règle dans le code. */
export const CHAIN_LINK_ADMIN_TAB: Record<ChainLink, string | null> = {
  codex: null,
  achievementEntry: "achievements",
  achievementMastery: "achievements",
  achievementOwn: "achievements",
  effectPreset: null,
  effectCarrier: "relics",
  carrierOwn: "relics",
  palette: null,
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
  allianceBoss: { entry: ["allianceBossTypes"], mastery: ["allianceBossAll"] },
  seasonBoss: { entry: ["bossSeals"], mastery: null },
  // 6.14.115 (AJ27-5) : colonies (fondation ; toutes les colonies, convois, base avancée tenue).
  colony: { entry: ["coloniesFounded"], mastery: ["coloniesMaxed", "colonyConvoys", "colonyBaseTours"] },
  // 6.14.114 (AJ27-4) : les talents ne se gagnent que par l'Ascension ; pas encore de succès « branche complète » (AJ27-9).
  talent: { entry: ["ascensionsDone"], mastery: [] },
  module: { entry: ["modulesBuilt"], mastery: ["modulesMounted"] },
  class: { entry: [], mastery: [] },
};

/**
 * 6.14.121 (AU27, AP-L7) : maillon « objectif » (WORKFLOW §7, n° 9). Actions du registre des actions suivies (`trackedActions.ts`)
 * qui font jouer chaque type de contenu dans les objectifs générés (Chroniques, passe, saga, objectifs du jour). Une famille par
 * contenu (`unit`, `building`, `research`) couvre d'office tout contenu ajouté. `null` : sans objet.
 */
export const CHAIN_TRACKED_ACTIONS: Record<ChainKind, string[] | null> = {
  unit: ["unit:*"],
  building: ["building:*"],
  tech: ["research:*"],
  relic: null,
  worldBoss: ["bossAssault"],
  allianceBoss: null,
  seasonBoss: ["bossAssault"],
  colony: ["colonyConvoy", "colonyBase", "colonySpec"],
  talent: null,
  module: null,
  class: null,
};

/**
 * 6.14.114 (AJ27-4, AJ-1) : types où chaque contenu doit avoir **son** succès (QJ1 : unités et bâtiments), et mesures qui ne
 * comptent qu'un contenu précis. Lues à l'usage (identifiants réglables : sonde, drone de recyclage).
 * Une mesure ajoutée ici pour un contenu (ou les succès dérivés par contenu, AJ27-6) comble son maillon « succès propre ».
 */
export function chainOwnMetrics(): Record<string, AchievementMetric[]> {
  // 6.14.123 (AA5) : chaque unité au rôle « sonde » ou « recycleur » (repli : identifiants des règles).
  const out: Record<string, AchievementMetric[]> = {};
  for (const id of probeUnitIds()) out[`unit:${id}`] = ["spies"];
  for (const id of recyclerUnitIds()) out[`unit:${id}`] = [...(out[`unit:${id}`] ?? []), "recycled"];
  return {
    ...out,
    "building:atelier_reparation": ["unitsRepaired"],
    [`building:${DOCK_BUILDING_ID}`]: ["dockFull", "unitsDismantled"],
  };
}
const OWN_ACHIEVEMENT_KINDS: readonly ChainKind[] = ["unit", "building"];

/**
 * 6.14.114 (AJ27-4, AJ-9) : types que la recherche Ctrl+K (`CommandPalette.tsx`) sait trouver. Tenu avec la palette :
 * `contentChain.test.ts` vérifie que la palette lit bien le registre de chaque type listé ici.
 */
export const PALETTE_KINDS: readonly ChainKind[] = ["unit", "building", "tech"];

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

/** Cibles d'unités des porteurs d'effets en vigueur : reliques composées, modules (par classe), technos à effet composé,
 *  classes d'empire à effet ciblé. */
export function unitCarrierSelectors(): string[] {
  const out: string[] = [];
  for (const r of RELICS) if (!r.disabled && r.effect === "custom" && r.custom?.target) out.push(r.custom.target);
  for (const fam of Object.values(MODULE_FAMILIES)) for (const cls of fam.classes) out.push(`class:${cls}`);
  for (const t of TECHNOLOGIES) for (const e of techEffects(t)) if (e.type === "stat" && e.target) out.push(e.target);
  for (const c of empireClasses()) for (const e of c.effects) if (e.target) out.push(e.target);
  // Seules les cibles d'unités comptent (une cible de ressource ou « attack » / « defense » vise autre chose).
  return out.filter((s) => parseUnitSelector(s).kind !== "all");
}

/** Bilan de la chaîne de contenu pour tout le contenu en vigueur. */
export function contentChainReport(): ChainRow[] {
  const codex = codexIds();
  const metrics = activeMetrics();
  const own = chainOwnMetrics();
  const classes = unitClasses();
  const carriers = unitCarrierSelectors();
  const presets = allEffectPresets().map((p) => p.effect.target).filter((t): t is string => !!t);
  const ach = (kind: ChainKind, id: string) => {
    const m = CHAIN_ACHIEVEMENT_METRICS[kind];
    return {
      achievementEntry: m.entry.some((x) => metrics.has(x)),
      achievementMastery: m.mastery === null ? null : m.mastery.some((x) => metrics.has(x)),
      achievementOwn: OWN_ACHIEVEMENT_KINDS.includes(kind) ? (own[`${kind}:${id}`] ?? []).some((x) => metrics.has(x)) : null,
    };
  };
  const row = (kind: ChainKind, id: string, name: string, links: Partial<Record<ChainLink, boolean | null>>): ChainRow => ({
    kind,
    id,
    name,
    links: { codex: null, effectPreset: null, effectCarrier: null, carrierOwn: null, palette: PALETTE_KINDS.includes(kind), ...ach(kind, id), ...links },
  });

  const rows: ChainRow[] = [];
  for (const u of UNITS) {
    rows.push(
      row("unit", u.id, u.name, {
        codex: codex.has(`unit:${u.id}`),
        // Préréglage propre à l'unité : un préréglage de classe ne suffit pas (l'admin cherche l'unité par son nom).
        effectPreset: presets.includes(`unit:${u.id}`),
        effectCarrier: carriers.some((s) => selectorMatches(s, u.id, classes)),
        // 6.14.114 (AJ-1) : porteur qui vise l'unité elle-même (pas sa classe ni sa catégorie).
        carrierOwn: carriers.some((s) => {
          const p = parseUnitSelector(s);
          return p.kind === "unit" && p.value === u.id;
        }),
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
  // 6.14.114 (AJ27-4) : colonies (biomes et spécialisations), talents, modules, classes d'empire.
  for (const b of RARE_DEPOSITS) rows.push(row("colony", b, BIOMES[b].name, { codex: codex.has(`colony:biome:${b}`) }));
  for (const s of COLONY_SPECS) rows.push(row("colony", s.id, s.name, { codex: codex.has(`colony:spec:${s.id}`) }));
  for (const t of TALENTS) rows.push(row("talent", t.id, t.name, { codex: codex.has(`talent:${t.id}`) }));
  for (const m of MODULE_TEMPLATES) rows.push(row("module", m.id, m.name, { codex: codex.has(`module:${m.id}`) }));
  for (const c of empireClasses()) rows.push(row("class", c.id, c.name, { codex: codex.has(`class:${c.id}`) }));
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

/** 6.14.114 : maillons présents et attendus d'une ligne (bilan du panneau d'admin). */
export function chainRowScore(r: ChainRow): { ok: number; expected: number } {
  const vals = Object.values(r.links).filter((v): v is boolean => v !== null);
  return { ok: vals.filter(Boolean).length, expected: vals.length };
}
