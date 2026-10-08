import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { generateAllianceSaga } from "@/game/allianceSaga";
import { chronicleState, validateChronicles, type ChronicleMonth } from "@/game/chronicles";
import { CONTRACT_LABELS, CONTRACT_PAGES, ensureContracts, openContractTypes } from "@/game/contracts";
import { advanceColonies, runColonyRoute, setColonyRoute, startColonization } from "@/game/colonies";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { BUILDINGS } from "@/game/buildings";
import { markJump } from "@/game/jumpGate";
import { markScan } from "@/game/phalanx";
import { upgradeMoon } from "@/game/moonUpgrade";
import { NAV_ALWAYS_VISIBLE, NAV_SHOW_ALL_ON, NAV_UNLOCK_RULES, navPageOpen, objectiveGoPage } from "@/game/navUnlock";
import { challengePool } from "@/game/passGen";
import { generatePassSeason } from "@/game/passSeasons";
import { performPlayerAction } from "@/game/actions";
import { BASE_COUNTS, GENERATOR_VERSION, generateChapter, outdatedChapters, worldDigest, type WorldDigest } from "@/game/procedural";
import { passState } from "@/game/seasonPass";
import { findUnit, UNITS } from "@/game/units";
import { TECHNOLOGIES } from "@/game/technologies";
import {
  BASE_OBJECTIVES,
  CONTENT_FAMILIES,
  contentObjective,
  NEW_OBJECTIVES,
  objectiveLabel,
  objectiveOrders,
  STATIC_OBJECTIVES,
  TRACKED_ACTIONS,
  TRACKED_ACTION_RULES,
  trackAction,
} from "@/game/trackedActions";
import { CHAIN_TRACKED_ACTIONS } from "@/game/contentChain";
import type { PlayerState } from "@/types/game";

/* 6.14.121 (AU27, lot AP-L7, constat AP-10) : registre des actions suivies. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const NOW = Date.UTC(2026, 9, 8, 12);
const DAY = 86_400_000;

const digest = (wm: WorldDigest["weeklyMedian"], heroes: WorldDigest["heroes"] = {}): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: wm,
  totals: { victory: 30, spy: 12 },
  heroes,
  episodes: [0, 1, 2].map((i) => ({ type: "victory" as const, count: 3, completion: 0.5, open: true, daysOpen: 10 + i })),
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  passPace: { median: 60, top: 150 },
  allianceSizeMedian: 4,
});
const MEASURED = { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6, raidRepelled: 1, warlordWin: 0.5, bossAssault: 0.6 };
const withNew = (extra: Record<string, number>) => digest({ ...MEASURED, ...extra });
const types = (m: ChronicleMonth) => m.episodes.map((e) => e.objective.type);
const setRules = (patch: Record<string, unknown>) => applyGameContent({ rules: { ...currentGameContent().rules, ...patch } } as never);

afterEach(() => applyGameContent({}));

describe("6.14.121 : le registre", () => {
  it("chaque action a un libellé, un verbe, deux ordres, une base, une page du menu et un système", () => {
    for (const k of STATIC_OBJECTIVES) {
      const d = TRACKED_ACTIONS[k];
      expect(d.key).toBe(k);
      expect(d.label.trim(), k).not.toBe("");
      expect(d.deed, k).toContain("{n}");
      expect(d.orders, k).toHaveLength(2);
      for (const o of d.orders) expect(o, k).toContain("{count}");
      expect(BASE_COUNTS[k], k).toBeGreaterThan(0);
      expect(d.system.trim(), k).not.toBe("");
      expect(Boolean(NAV_UNLOCK_RULES.pages[d.page]) || (NAV_ALWAYS_VISIBLE as readonly string[]).includes(d.page), `${k} : ${d.page}`).toBe(true);
    }
  });

  it("lune, phalange, porte de saut et colonies (convoi, base avancée, spécialisation) y sont ; chaque nouvelle action est « mesurée »", () => {
    // 6.14.131 (AJ27-7) : puis expéditions et recyclage, toujours en fin de liste.
    expect(NEW_OBJECTIVES).toEqual(["moonUpgrade", "phalanxScan", "gateJump", "colonyConvoy", "colonyBase", "colonySpec", "expedition", "recycle"]);
    expect(new Set(NEW_OBJECTIVES.map((k) => TRACKED_ACTIONS[k].system))).toEqual(new Set(["lune", "colonies", "expeditions", "recyclage"]));
    for (const k of NEW_OBJECTIVES) expect(TRACKED_ACTIONS[k].measured, k).toBe(true);
    // Les 9 d'avant gardent leur ordre et ne sont pas « mesurées » (tirages d'avant).
    expect(BASE_OBJECTIVES).toEqual(["contract", "bounty", "raidRepelled", "victory", "bossAssault", "mission", "spy", "market", "warlordWin"]);
    for (const k of BASE_OBJECTIVES) expect(TRACKED_ACTIONS[k].measured, k).toBe(false);
  });

  it("chaque unité, techno et bâtiment a son action par contenu (libellé lu dans le contenu, page du système)", () => {
    const u = UNITS[0];
    expect(objectiveLabel(contentObjective("unit", u.id))).toBe(`Construire : ${u.name}`);
    expect(objectiveLabel(contentObjective("research", TECHNOLOGIES[0].id))).toBe(`Recherche : ${TECHNOLOGIES[0].nom}`);
    expect(objectiveLabel(contentObjective("building", BUILDINGS[0].id))).toBe(`Amélioration : ${BUILDINGS[0].name}`);
    expect(objectiveGoPage(contentObjective("unit", u.id))).toBe("/game/unites");
    expect(objectiveGoPage(contentObjective("research", "x"))).toBe("/game/labo");
    expect(objectiveGoPage(contentObjective("building", "x"))).toBe("/game/batiments");
    expect(objectiveOrders(contentObjective("unit", u.id)).every((o) => o.includes(u.name) && o.includes("{count}"))).toBe(true);
    for (const f of CONTENT_FAMILIES) expect(TRACKED_ACTION_RULES.familyWeights[f], f).toBe(0);
  });

  it("maillon « objectif » de la chaîne de contenu : chaque type déclare ses actions suivies (ou sans objet), toutes connues", () => {
    for (const [kind, keys] of Object.entries(CHAIN_TRACKED_ACTIONS)) {
      if (keys === null) continue;
      expect(keys.length, kind).toBeGreaterThan(0);
      for (const k of keys) expect(k.endsWith(":*") ? (CONTENT_FAMILIES as string[]).includes(k.slice(0, -2)) : k in TRACKED_ACTIONS, `${kind} : ${k}`).toBe(true);
    }
    // Les systèmes de la lune et des colonies ont au moins une action chacun.
    for (const sys of ["lune", "colonies"]) expect(STATIC_OBJECTIVES.some((k) => TRACKED_ACTIONS[k].system === sys), sys).toBe(true);
  });

  it("un chapitre avec une action du registre ou par contenu est valide ; une clé inconnue est refusée", () => {
    const m = generateChapter({ monthId: "2026-12", digest: digest(MEASURED), existing: [], now: OCT_20 });
    m.episodes[1].objective = { type: "gateJump", count: 2 };
    m.episodes[2].objective = { type: contentObjective("unit", "chasseur"), count: 5 };
    expect(validateChronicles({ months: [m] })).toEqual([]);
    m.episodes[3].objective = { type: "inconnue" as never, count: 1 };
    expect(validateChronicles({ months: [m] }).join(" ")).toMatch(/objectif inconnu/);
  });

  it("validation et fusion des réglages (registre des règles)", () => {
    const d = defaultGameContent();
    const bad = validateGameContent({ ...d, rules: { ...d.rules, trackedActions: { ...TRACKED_ACTION_RULES, weights: { gateJump: -1, rien: 1 }, familyBase: { unit: 0 } } } } as never).join(" ");
    expect(bad).toMatch(/poids de gateJump/);
    expect(bad).toMatch(/action « rien » inconnue/);
    expect(bad).toMatch(/quantité de base de unit/);
    applyGameContent({ rules: { trackedActions: { weights: { gateJump: 3 } } } } as never);
    expect(TRACKED_ACTION_RULES.weights.gateJump).toBe(3);
    expect(TRACKED_ACTION_RULES.weights.victory).toBe(1);
    expect(TRACKED_ACTION_RULES.measuredMinWeekly).toBe(0.5);
  });
});

describe("6.14.121 : tirages communs (Chroniques, défis du passe, saga)", () => {
  it("graine stable : sans mesure des nouvelles actions, mêmes chapitres, mêmes sagas qu'avant la 6.14.121", () => {
    // Valeurs relevées avec le générateur d'avant la 6.14.121 (même graine, même photographie du monde).
    const ch = (m: string, v: number, d: WorldDigest) => generateChapter({ monthId: m, digest: d, existing: [], now: OCT_20, variant: v });
    expect(ch("2026-12", 0, digest(MEASURED)).episodes.map((e) => [e.objective.type, e.objective.count])).toEqual([["raidRepelled", 1], ["warlordWin", 1], ["bounty", 2], ["market", 3]]);
    expect(ch("2027-04", 1, digest(MEASURED)).episodes.map((e) => [e.objective.type, e.objective.count])).toEqual([["victory", 3], ["warlordWin", 1], ["bounty", 2], ["contract", 4]]);
    expect(ch("2027-01", 0, digest({})).episodes.map((e) => [e.objective.type, e.objective.count])).toEqual([["mission", 6], ["market", 3], ["bounty", 2], ["victory", 3]]);
    expect(ch("2026-12", 0, digest(MEASURED)).title).toBe("Le Contre-Chant");
    expect(generateAllianceSaga("2026-12", digest(MEASURED), 1, OCT_20).objectives).toEqual([{ type: "contract", count: 38 }, { type: "bounty", count: 19 }, { type: "mission", count: 58 }]);
    // Médiane sous le seuil : la nouvelle action reste hors du tirage, rien ne bouge.
    const below = withNew({ gateJump: 0.4, colonyConvoy: 0.25 });
    expect(types(ch("2026-12", 0, below))).toEqual(types(ch("2026-12", 0, digest(MEASURED))));
    expect(generatePassSeason({ monthId: "2026-12", digest: below, existing: [], now: OCT_20 }).requirements).toEqual(
      generatePassSeason({ monthId: "2026-12", digest: digest(MEASURED), existing: [], now: OCT_20 }).requirements,
    );
  });

  it("une action pratiquée par le joueur médian entre dans les tirages ; jamais sous `measuredMinWeekly`", () => {
    const rich = withNew({ moonUpgrade: 2, gateJump: 3, colonyConvoy: 12, colonyBase: 1, phalanxScan: 1, colonySpec: 1 });
    const seen = new Set<string>();
    for (const m of ["2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05"]) for (let v = 0; v < 6; v++) types(generateChapter({ monthId: m, digest: rich, existing: [], now: OCT_20, variant: v })).forEach((t) => seen.add(t));
    expect([...seen].some((t) => (NEW_OBJECTIVES as string[]).includes(t))).toBe(true);
    // Spécialisation : poids 0 par défaut, jamais tirée.
    expect(seen.has("colonySpec")).toBe(false);
    expect(challengePool(rich.weeklyMedian).map((x) => x.key)).toEqual(expect.arrayContaining(["gateJump", "colonyConvoy", "moonUpgrade"]));
    expect(challengePool(digest(MEASURED).weeklyMedian).map((x) => x.key)).not.toEqual(expect.arrayContaining(["gateJump"]));
    // Seuil réglable : à 5 par semaine, plus aucune.
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, measuredMinWeekly: 5 } });
    expect(challengePool(rich.weeklyMedian).map((x) => x.key)).toEqual(expect.arrayContaining(["colonyConvoy"]));
    expect(challengePool(rich.weeklyMedian).map((x) => x.key)).not.toContain("gateJump");
  });

  it("poids 0 ou registre désactivé : la nouvelle action n'est jamais tirée, même pratiquée", () => {
    const rich = withNew({ gateJump: 3, colonyConvoy: 12, moonUpgrade: 2 });
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, enabled: false } });
    for (let v = 0; v < 8; v++) for (const t of types(generateChapter({ monthId: "2027-02", digest: rich, existing: [], now: OCT_20, variant: v }))) expect(BASE_OBJECTIVES).toContain(t);
    expect(challengePool(rich.weeklyMedian).map((x) => x.key).filter((k) => !(BASE_OBJECTIVES as string[]).includes(k))).toEqual([]);
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, enabled: true, weights: { ...TRACKED_ACTION_RULES.weights, gateJump: 0, colonyConvoy: 0, moonUpgrade: 0 } } });
    for (let v = 0; v < 8; v++) for (const t of types(generateChapter({ monthId: "2027-02", digest: rich, existing: [], now: OCT_20, variant: v }))) expect(BASE_OBJECTIVES).toContain(t);
  });

  it("mois déjà écrit inchangé : la version du générateur ne monte pas, un chapitre écrit n'est pas à régénérer", () => {
    expect(GENERATOR_VERSION).toEqual({ chapter: 3, pass: 3 });
    const written = generateChapter({ monthId: "2026-12", digest: digest(MEASURED), existing: [], now: OCT_20 });
    const before = JSON.stringify(written);
    expect(outdatedChapters([written], OCT_20)).toEqual([]);
    // Une activité nouvelle ne réécrit rien : le mois écrit est une donnée, seul un nouveau mois tire les nouvelles actions.
    worldDigest([], OCT_20);
    expect(JSON.stringify(written)).toBe(before);
  });
});

/* ---------- objectifs du jour : page fermée jamais tirée (I31) ---------- */

function moonPlayer(uid: string, patch: Partial<PlayerState> = {}): PlayerState {
  const p = { ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: NOW - 60 * DAY, resourcesUpdatedAtMs: NOW, ...patch } as PlayerState;
  p.moon = { name: "Séléné", level: 5, bornAtMs: NOW - 10 * DAY, fromDebris: 1e6 };
  return p;
}

describe("6.14.121 : objectifs du jour du registre", () => {
  it("porte de saut : proposée seulement à un joueur dont la porte est ouverte et la page Galaxie ouverte", () => {
    const vet = (uid: string) => moonPlayer(uid, { announcementsSeen: [NAV_SHOW_ALL_ON] });
    expect(openContractTypes(vet("a"), NOW)).toContain("gate_jump");
    const noMoon = { ...defaultPlayerState("b", "B"), createdAtMs: NOW - 60 * DAY, announcementsSeen: [NAV_SHOW_ALL_ON] } as PlayerState;
    expect(openContractTypes(noMoon, NOW)).not.toContain("gate_jump");
    const lowMoon = vet("c");
    lowMoon.moon = { ...lowMoon.moon!, level: 1 };
    expect(openContractTypes(lowMoon, NOW)).not.toContain("gate_jump");
    // Compte neuf (menu progressif) : Galaxie fermée, jamais tirée, même avec une porte ouverte.
    const FROM = NAV_UNLOCK_RULES.newAccountsFrom;
    const recruit = moonPlayer("d", { createdAtMs: FROM + 1000, resourcesUpdatedAtMs: FROM + 2000 });
    expect(navPageOpen(recruit, "/game/galaxie", { now: FROM + 2000 })).toBe(false);
    for (let i = 0; i < 60; i++) expect(ensureContracts(moonPlayer(`n${i}`, { createdAtMs: FROM + 1000, resourcesUpdatedAtMs: FROM + 2000 }), FROM + 2000 + i * DAY).items.map((c) => c.type)).not.toContain("gate_jump");
    // Joueur à porte ouverte : tiré certains jours.
    let drawn = 0;
    for (let i = 0; i < 60; i++) if (ensureContracts(vet(`v${i}`), NOW + i * DAY).items.some((c) => c.type === "gate_jump")) drawn++;
    expect(drawn).toBeGreaterThan(0);
    expect(CONTRACT_PAGES.gate_jump).toEqual([TRACKED_ACTIONS.gateJump.page]);
    expect(CONTRACT_LABELS.gate_jump(1)).toBe("Ramener 1 flotte par la porte de saut");
  });

  it("registre désactivé : ni porte ni convoi dans les objectifs du jour", () => {
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, enabled: false } });
    expect(openContractTypes(moonPlayer("a", { announcementsSeen: [NAV_SHOW_ALL_ON] }), NOW)).not.toContain("gate_jump");
  });
});

/* ---------- comptage ---------- */

describe("6.14.121 : les actions sont comptées (activité du mois, épisode, objectif du jour)", () => {
  it("saut, balayage, amélioration de lune : activité du mois et objectif du jour « porte de saut »", () => {
    const p = moonPlayer("j", { announcementsSeen: [NAV_SHOW_ALL_ON] });
    p.resources = { ...p.resources, energy: 1e12, scrap: 1e12, nano: 1e12, data: 1e12 } as PlayerState["resources"];
    p.moon = { ...p.moon!, level: 3 };
    const contracts = ensureContracts(p, NOW);
    contracts.items[0] = { id: "x-0-gate_jump", type: "gate_jump", target: 1, progress: 0, claimed: false };
    markJump(p, NOW);
    markScan(p, NOW);
    upgradeMoon(p, NOW);
    const act = passState(p, NOW).activity ?? {};
    expect(act.gateJump).toBe(1);
    expect(act.phalanxScan).toBe(1);
    expect(act.moonUpgrade).toBe(1);
    expect(p.contracts!.items[0].progress).toBe(1);
  });

  it("épisode ouvert dont l'objectif est une action du registre : il avance", () => {
    const m = generateChapter({ monthId: "2026-10", digest: digest(MEASURED), existing: [], now: Date.UTC(2026, 8, 20) });
    m.episodes[0].objective = { type: "colonyConvoy", count: 3 };
    applyGameContent({ chronicles: { ...currentGameContent().chronicles, months: [m] } });
    const p = moonPlayer("k");
    trackAction(p, "colonyConvoy", NOW, 2);
    expect(chronicleState(p, NOW).progress[0]).toBe(2);
  });

  it("convoi de colonie arrivé : compté ; objectif du jour proposé à qui a une route", () => {
    const H = 3600_000;
    const p = { ...defaultPlayerState("c", "Colon"), createdAtMs: NOW - 60 * DAY, xp: 5_000_000, announcementsSeen: [NAV_SHOW_ALL_ON] } as PlayerState;
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
    for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
    p.resourcesUpdatedAtMs = NOW;
    startColonization(p, "Néo", NOW);
    advanceColonies(p, NOW + 3 * H);
    const colony = p.colonies![0];
    expect(openContractTypes(p, NOW + 3 * H)).not.toContain("colony_convoy");
    for (const k of Object.keys(colony.resources)) (colony.resources as Record<string, number>)[k] = 5e8;
    setColonyRoute(p, colony.id, 6, 10, NOW + 3 * H);
    expect(openContractTypes(p, NOW + 3 * H)).toContain("colony_convoy");
    runColonyRoute(colony, p, colony.route!.nextAtMs + 1);
    expect(passState(p, colony.route!.lastAtMs ?? NOW).activity?.colonyConvoy).toBe(1);
  });

  it("unités, recherches, améliorations lancées : action par contenu dans l'activité du mois", () => {
    const p = { ...defaultPlayerState("u", "U"), createdAtMs: NOW - 60 * DAY, resourcesUpdatedAtMs: NOW } as PlayerState;
    for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 1e12;
    const unit = UNITS.find((x) => (p.units[x.id]?.level ?? 0) > 0) ?? findUnit("chasseur")!;
    p.units[unit.id] = { level: Math.max(1, p.units[unit.id]?.level ?? 0), count: p.units[unit.id]?.count ?? 0 };
    const res = performPlayerAction(p, defaultQueues(), { type: "buildUnits", unitId: unit.id, qty: 3 } as never, NOW);
    expect(passState(res.player, NOW).activity?.[contentObjective("unit", unit.id)]).toBe(3);
    const b = BUILDINGS.find((x) => res.player.buildings[x.id]?.unlocked || x.startsUnlocked)!;
    const res2 = performPlayerAction(res.player, res.queues, { type: "upgradeBuilding", buildingId: b.id } as never, NOW + 1);
    expect(passState(res2.player, NOW).activity?.[contentObjective("building", b.id)]).toBe(1);
  });
});
