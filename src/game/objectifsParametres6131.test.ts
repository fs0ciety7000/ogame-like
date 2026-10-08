import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateGameContent } from "@/game/content";
import { contractContentCandidates, contractLabel, CONTRACT_PAGES, CONTRACT_RULES, contractDay, ensureContracts, openContractTypes, type ContractType } from "@/game/contracts";
import { defaultPlayerState } from "@/game/defaults";
import { completeFleetReturn, type Fleet } from "@/game/fleets";
import { NAV_SHOW_ALL_ON, NAV_UNLOCK_RULES } from "@/game/navUnlock";
import { challengePool } from "@/game/passGen";
import { generatePassSeason } from "@/game/passSeasons";
import { generateChapter, type WorldDigest } from "@/game/procedural";
import { catalogEntryFor } from "@/game/seasonCatalog";
import { findUnit, UNITS } from "@/game/units";
import { actionAvailable, contentObjective, extraObjectives, NEW_OBJECTIVES, parseContentObjective, themeWeight, TRACKED_ACTION_RULES, TRACKED_ACTIONS, trackAction, trackedWeight, validateTrackedActionRules } from "@/game/trackedActions";
import type { ChronicleMonth } from "@/game/chronicles";
import type { PlayerState } from "@/types/game";

/* 6.14.131 (AU27, lot AJ27-7, constat AJ-2) : objectifs paramétrés par contenu (construire telle unité, rechercher telle techno,
   améliorer tel bâtiment), expédition et recyclage, à partir du registre des actions suivies. Poids 0 par défaut, activables par
   thème du passe ; jamais une page fermée ni un contenu verrouillé ; à règles par défaut, aucun tirage ne change. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const NOW = Date.UTC(2026, 9, 8, 12);
const DAY = 86_400_000;

const digest = (wm: WorldDigest["weeklyMedian"]): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: wm,
  totals: { victory: 30, spy: 12 },
  heroes: {},
  episodes: [0, 1, 2].map((i) => ({ type: "victory" as const, count: 3, completion: 0.5, open: true, daysOpen: 10 + i })),
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  passPace: { median: 60, top: 150 },
  allianceSizeMedian: 4,
});
const MEASURED = { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6, raidRepelled: 1, warlordWin: 0.5, bossAssault: 0.6 };
/** Serveur qui pratique beaucoup les nouvelles actions et construit des chasseurs : tout est « mesuré » au-dessus du seuil. */
const RICH = digest({ ...MEASURED, expedition: 6, recycle: 5, "unit:chasseur": 40, "research:armement": 2, "building:entrepot": 3 } as WorldDigest["weeklyMedian"]);
const types = (m: ChronicleMonth) => m.episodes.map((e) => e.objective.type);
const setRules = (patch: Record<string, unknown>) => applyGameContent({ rules: { ...currentGameContent().rules, ...patch } } as never);
const NEW_TYPES: ContractType[] = ["expedition", "recycle", "unit_content", "research_content", "building_content"];

/** Premiers mois du catalogue dont le thème du passe est `theme`. */
function monthsOfTheme(theme: string, n = 2): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < n && i < 48; i++) {
    const d = new Date(Date.UTC(2026, 10 + i, 1));
    const id = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (catalogEntryFor(id).theme === theme) out.push(id);
  }
  return out;
}

const vet = (uid: string, patch: Partial<PlayerState> = {}): PlayerState =>
  ({ ...defaultPlayerState(uid, uid), createdAtMs: NOW - 30 * DAY, resourcesUpdatedAtMs: NOW, announcementsSeen: [NAV_SHOW_ALL_ON], ...patch }) as PlayerState;

afterEach(() => applyGameContent({}));

describe("6.14.131 : registre et réglages par défaut", () => {
  it("expédition et recyclage : dans le registre en fin de liste, mesurées, poids 0, page du menu", () => {
    expect(NEW_OBJECTIVES.slice(-2)).toEqual(["expedition", "recycle"]);
    for (const k of ["expedition", "recycle"] as const) {
      expect(TRACKED_ACTIONS[k].measured).toBe(true);
      expect(TRACKED_ACTION_RULES.weights[k]).toBe(0);
      expect(NAV_UNLOCK_RULES.pages[TRACKED_ACTIONS[k].page], k).toBeTruthy();
    }
    expect(TRACKED_ACTION_RULES.themeWeights).toEqual({});
    for (const t of NEW_TYPES) expect(CONTRACT_RULES.weights[t], t).toBe(0);
    for (const t of ["expedition", "recycle"] as ContractType[]) for (const page of CONTRACT_PAGES[t] ?? []) expect(NAV_UNLOCK_RULES.pages[page], page).toBeTruthy();
  });

  it("graine stable : à règles par défaut, une activité forte des nouvelles actions ne change aucun tirage", () => {
    const base = digest(MEASURED);
    for (const m of ["2026-12", "2027-01", ...monthsOfTheme("chantiers"), ...monthsOfTheme("colonies")])
      for (let v = 0; v < 3; v++) {
        const a = generateChapter({ monthId: m, digest: base, existing: [], now: OCT_20, variant: v });
        const b = generateChapter({ monthId: m, digest: RICH, existing: [], now: OCT_20, variant: v });
        expect(types(b), `${m}:${v}`).toEqual(types(a));
      }
    for (const m of [...monthsOfTheme("chantiers", 1), "2026-12"])
      expect(generatePassSeason({ monthId: m, digest: RICH, existing: [], now: OCT_20 }).requirements).toEqual(generatePassSeason({ monthId: m, digest: base, existing: [], now: OCT_20 }).requirements);
    expect(extraObjectives("chantiers").filter((k) => parseContentObjective(k) || k === "expedition" || k === "recycle")).toEqual([]);
  });

  it("objectifs du jour : à poids 0, les nouveaux types ne sont jamais tirés (300 joueurs-jours, flotte et recycleur)", () => {
    for (let u = 0; u < 30; u++)
      for (let d = 0; d < 10; d++) {
        const p = vet(`j${u}`, { units: { chasseur: { level: 1, count: 50 }, drone_recuperateur: { level: 1, count: 5 } } as PlayerState["units"] });
        for (const c of ensureContracts(p, NOW + d * DAY).items) expect(NEW_TYPES).not.toContain(c.type);
      }
  });
});

describe("6.14.131 : activés par thème (Q66)", () => {
  it("le poids d'un thème remplace celui de l'action ou de sa famille, pour ce thème seulement", () => {
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, themeWeights: { chantiers: { unit: 2, "unit:chasseur": 5 }, vide: { expedition: 1 } } } });
    expect(themeWeight(contentObjective("unit", "fregate"), "chantiers")).toBe(2);
    expect(themeWeight(contentObjective("unit", "chasseur"), "chantiers")).toBe(5);
    expect(trackedWeight(contentObjective("unit", "fregate"), "vide")).toBe(0);
    expect(trackedWeight("expedition", "vide")).toBe(1);
    expect(trackedWeight("expedition")).toBe(0);
    expect(trackedWeight("victory", "chantiers")).toBe(1);
  });

  it("Chroniques et défis du passe : un mois « chantiers » tire « construire telle unité », un autre thème jamais", () => {
    setRules({ trackedActions: { ...TRACKED_ACTION_RULES, themeWeights: { chantiers: { unit: 50, expedition: 50 } } } });
    const seen = new Set<string>();
    for (const m of monthsOfTheme("chantiers", 2)) for (let v = 0; v < 6; v++) types(generateChapter({ monthId: m, digest: RICH, existing: [], now: OCT_20, variant: v })).forEach((t) => seen.add(t));
    expect([...seen].some((t) => t === "unit:chasseur" || t === "expedition")).toBe(true);
    // Contenu jamais pratiqué par le joueur médian (médiane 0) : jamais tiré, même activé (I31).
    expect([...seen].some((t) => parseContentObjective(t) && t !== "unit:chasseur")).toBe(false);
    for (const m of monthsOfTheme("colonies", 2)) for (let v = 0; v < 4; v++) for (const t of types(generateChapter({ monthId: m, digest: RICH, existing: [], now: OCT_20, variant: v }))) expect(t === "unit:chasseur" || t === "expedition", `${m}:${t}`).toBe(false);
    expect(challengePool(RICH.weeklyMedian, undefined, "chantiers").map((x) => x.key)).toEqual(expect.arrayContaining(["unit:chasseur", "expedition"]));
    expect(challengePool(RICH.weeklyMedian, undefined, "colonies").map((x) => x.key)).not.toContain("unit:chasseur");
    const reqs = Object.values(generatePassSeason({ monthId: monthsOfTheme("chantiers", 1)[0], digest: RICH, existing: [], now: OCT_20 }).requirements).flat();
    expect(reqs.some((r) => r.key === "unit:chasseur" || r.key === "expedition")).toBe(true);
  });

  it("validation : thème et action connus, poids entre 0 et 100", () => {
    expect(validateTrackedActionRules({ themeWeights: { chantiers: { unit: 1, recycle: 2 } } })).toEqual([]);
    expect(validateTrackedActionRules({ themeWeights: { chantiers: { inconnu: 1 } } }).join(" ")).toMatch(/inconnue/);
    expect(validateTrackedActionRules({ themeWeights: { chantiers: { unit: 200 } } }).join(" ")).toMatch(/entre 0 et 100/);
    expect(validateGameContent({ ...currentGameContent(), rules: { ...currentGameContent().rules, trackedActions: { ...TRACKED_ACTION_RULES, themeWeights: { chantiers: { unit: 1 } } } } } as never)).toEqual([]);
  });
});

describe("6.14.131 : objectifs du jour paramétrés", () => {
  it("contenu visé ouvert au joueur seulement (jamais verrouillé), libellé avec son nom, avancé par l'action", () => {
    setRules({ dailyContracts: { ...CONTRACT_RULES, weights: { ...CONTRACT_RULES.weights, unit_content: 50, research_content: 50, building_content: 50 } } });
    let hits = 0;
    for (let u = 0; u < 20; u++) {
      const p = vet(`c${u}`, { units: { chasseur: { level: 1, count: 0 }, fregate: { level: 2, count: 10 } } as PlayerState["units"] });
      const items = ensureContracts(p, NOW).items;
      for (const c of items.filter((x) => x.type === "unit_content")) {
        hits++;
        expect(contractContentCandidates(p, "unit")).toContain(c.content);
        expect((p.units[c.content!]?.level ?? 0) > 0).toBe(true);
        expect(contractLabel(c)).toContain(findUnit(c.content!)!.name);
        trackAction(p, contentObjective("unit", c.content!), NOW, c.target);
        expect(p.contracts!.items.find((x) => x.id === c.id)!.progress).toBe(c.target);
      }
      for (const c of items.filter((x) => x.type === "research_content" || x.type === "building_content")) expect(c.content, c.type).toBeTruthy();
    }
    expect(hits).toBeGreaterThan(0);
    // Une unité verrouillée n'est jamais visée ; un compte sans unité débloquée n'a pas le type.
    const locked = vet("verrou", { units: {} as PlayerState["units"] });
    expect(contractContentCandidates(locked, "unit")).toEqual([]);
    expect(openContractTypes(locked, NOW)).not.toContain("unit_content");
    expect(UNITS.filter((u) => u.elite).every((u) => !contractContentCandidates(vet("e", { units: { [u.id]: { level: 1, count: 1 } } as PlayerState["units"] }), "unit").includes(u.id))).toBe(true);
  });

  it("expédition et recyclage : proposés seulement à qui peut les faire, comptés par la fin d'expédition et le retour du recyclage", () => {
    const empty = vet("vide", { units: {} as PlayerState["units"] });
    expect(actionAvailable("expedition", empty)).toBe(false);
    expect(actionAvailable("recycle", empty)).toBe(false);
    const p = vet("rec", { units: { chasseur: { level: 1, count: 50 }, drone_recuperateur: { level: 1, count: 5 } } as PlayerState["units"] });
    expect(actionAvailable("expedition", p)).toBe(true);
    expect(actionAvailable("recycle", p)).toBe(true);
    setRules({ dailyContracts: { ...CONTRACT_RULES, weights: { ...CONTRACT_RULES.weights, recycle: 100 } } });
    expect(openContractTypes(empty, NOW)).not.toContain("recycle");
    const c = ensureContracts(p, NOW).items.find((x) => x.type === "recycle");
    expect(c).toBeTruthy();
    const fleet = { id: "f1", ownerUid: p.uid, mission: "recycle", units: { drone_recuperateur: 5 }, loot: { scrap: 1000 }, arriveAtMs: NOW, returnAtMs: NOW } as unknown as Fleet;
    completeFleetReturn(p, fleet, NOW);
    expect(p.contracts!.items.find((x) => x.id === c!.id)!.progress).toBe(1);
    expect(p.contracts!.day).toBe(contractDay(NOW));
  });
});
