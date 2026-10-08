import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { performPlayerAction, type GameAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { BUILDINGS, DOCK_TIERS } from "@/game/buildings";
import { RESOURCE_LIST } from "@/game/resources";
import { UNITS } from "@/game/units";
import { TECHNOLOGIES } from "@/game/technologies";
import { MISSIONS } from "@/game/missions";
import { COMMANDERS } from "@/game/commanders";
import { TALENTS } from "@/game/talents";
import { MODULE_TEMPLATES, moduleMountClasses } from "@/game/modules";
import { RARITIES, RELICS } from "@/game/relics";
import { POSTURES } from "@/game/formations";
import { colonyBuildingIds, colonyId, COLONY_SPECS, foundColony } from "@/game/colonies";
import { DEFAULT_FACTIONS } from "@/game/pirates";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { GUIDE_STEPS, guideHidden } from "@/game/advancedGuide";
import { DEFAULT_CASINO, playerCasino } from "@/game/casino";
import { bountyState } from "@/game/bounties";
import { contractDay } from "@/game/contracts";
import { chronicleMonthId } from "@/game/chronicles";
import { passState } from "@/game/seasonPass";
import { empireClasses } from "@/game/empireClass";
import { sendToWorkshop, addReady } from "@/game/workshop";
import { ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { GAME_FIELDS, QUEUE_FIELDS } from "@/game/playerFields";
import { GameActionError } from "@/game/errors";
import type { ClaimContext } from "@/game/claimAll";
import type { CodexContext } from "@/game/codex";
import type { Challenge } from "@/game/challenges";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   6.14.135 (AU27, lot AC-H, constat AC-22) : tour des actions.
   Chaque action du registre (`case` de `applyAction`, actions.ts) est jouée une fois sur un joueur préparé, et
   doit garder les invariants de la chaîne d'actions :
   - rien de négatif (ressources, Ambre, jetons, unités, stocks des colonies), aucun nombre non fini ;
   - pas de double débit : ce qui sort des ressources (et de l'Ambre) est exactement ce qui est compté en dépense
     (`stats.spent`, `stats.amberSpent`, 6.14.110), sauf les transferts listés ; pour les achats en file, la dépense
     est le prix inscrit dans la file ;
   - état sauvé : tout champ modifié est un champ que le serveur écrit (`GAME_FIELDS`, `QUEUE_FIELDS`), et la fiche
     passe en JSON sans perte (pas de `undefined` dans une liste, pas de NaN, pas de `Date`) ;
   - les entrées ne sont pas modifiées (le serveur relit la fiche dans la transaction et n'écrit que la sortie, I24).
   Une action nouvelle sans scénario fait échouer la garde du registre.
===================================================== */

const NOW = Date.UTC(2026, 9, 7, 12);
const UID = "tour";

function rich(): PlayerState {
  const p = { ...defaultPlayerState(UID, "Tour"), createdAtMs: NOW - 90 * 86_400_000, resourcesUpdatedAtMs: NOW, lastActiveMs: NOW } as PlayerState;
  for (const r of RESOURCE_LIST) p.resources[r.id] = 1e9;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: Math.min(10, b.maxLevel), unlocked: true };
  for (const u of UNITS) p.units[u.id] = { level: 1, count: 5 };
  p.xp = 1e7;
  p.bounties = { ...bountyState(p), amber: 1e6 };
  return p;
}

/** Joue une action de préparation et garde son résultat (même chemin que le serveur). */
function play(p: PlayerState, q: QueuesState, action: GameAction): void {
  const out = performPlayerAction(p, q, action, NOW, {}, true, CODEX, claims());
  for (const k of Object.keys(p)) delete (p as unknown as Record<string, unknown>)[k];
  Object.assign(p, out.player);
  Object.assign(q, out.queues);
}

const CODEX: CodexContext = { fought: [], bossesFought: [] };
const DONE_CHALLENGE = {
  id: "w1",
  type: "marketVolume",
  target: 100,
  startMs: NOW - 8 * 86_400_000,
  endMs: NOW - 86_400_000,
  total: 120,
  contributions: { [UID]: { pseudo: "Tour", amount: 120 } },
  status: "done",
  success: true,
  claimed: [],
} as unknown as Challenge;
const claims = (): ClaimContext => ({ casino: DEFAULT_CASINO, challenge: { previous: structuredClone(DONE_CHALLENGE) } });

const COLONY = colonyId(UID, 1);
function withColony(p: PlayerState): void {
  p.colonies = [foundColony(UID, { slot: 1, name: "Nova", endTime: NOW - 86_400_000 }, NOW - 30 * 86_400_000, p.buildings)];
  for (const r of RESOURCE_LIST) p.colonies[0].resources[r.id] = 1e8;
}

const tpl = MODULE_TEMPLATES.find((t) => !t.unit && moduleMountClasses(t).length > 0)!;
const plan = (id: string, built = false) => ({ id, template: tpl.id, rarity: "common", built, foundAtMs: NOW - 1000, source: "test" });
function withModules(p: PlayerState, items: ReturnType<typeof plan>[]): void {
  p.modules = { items, slots: { light: [null, null], medium: [null, null], heavy: [null, null], support: [null, null] } } as unknown as PlayerState["modules"];
}
const relic = (id: string) => ({ id, template: RELICS[0].id, rarity: RARITIES[0].id, foundAtMs: NOW - 1000, source: "test" });

type Scenario = {
  /** Préparation du joueur (état direct, ou actions jouées par `play`). */
  prep?: (p: PlayerState, q: QueuesState) => void;
  action: GameAction | ((p: PlayerState, q: QueuesState) => GameAction);
  /** Refus attendu, avec sa raison : l'action est quand même jouée (refus propre, entrées intactes). */
  refused?: { match: RegExp; why: string };
};

const defenseUnit = UNITS.find((u) => u.category === "defense")!;
const OTHER_BUILDING = BUILDINGS.find((b) => b.id !== "extracteur_ferraille" && b.startsUnlocked && b.maxLevel > 10)!.id;

const SCENARIOS: Record<string, Scenario> = {
  sync: { action: { type: "sync", playtimeDeltaSeconds: 10 } },
  unlockBuilding: { prep: (p) => (p.buildings.reacteur_instable = { level: 0, unlocked: false }), action: { type: "unlockBuilding", buildingId: "reacteur_instable" } },
  upgradeBuilding: { action: { type: "upgradeBuilding", buildingId: "extracteur_ferraille" } },
  buildUnits: { action: { type: "buildUnits", unitId: "chasseur", qty: 2 } },
  sellUnits: { action: { type: "sellUnits", unitId: "chasseur", qty: 2 } },
  research: { action: { type: "research", techId: TECHNOLOGIES[0].id } },
  mission: { action: { type: "mission", missionKey: Object.keys(MISSIONS)[0] } },
  trade: { action: { type: "trade", sellId: "scrap", buyId: "energy", amount: 1000 } },
  claimContract: {
    prep: (p) => (p.contracts = { day: contractDay(NOW), items: [{ id: "c1", type: "spy", target: 1, progress: 1, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false } as PlayerState["contracts"]),
    action: { type: "claimContract", contractId: "c1" },
  },
  rerollContract: {
    prep: (p) => (p.contracts = { day: contractDay(NOW), items: [{ id: "c1", type: "spy", target: 1, progress: 0, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false } as PlayerState["contracts"]),
    action: { type: "rerollContract", contractId: "c1" },
  },
  setTitle: { prep: (p) => (p.titles = [{ label: "Pionnier", seasonId: "onboarding", rank: 1 }]), action: { type: "setTitle", title: "Pionnier" } },
  claimOnboarding: {
    prep: (p) => {
      p.xp = 0;
    },
    action: (p) => ({ type: "claimOnboarding", stepId: (ONBOARDING_STEPS.find((s) => s.done(p)) ?? ONBOARDING_STEPS[0]).id }),
  },
  claimGuide: { action: (p) => ({ type: "claimGuide", stepId: (GUIDE_STEPS.find((s) => s.done(p)) ?? GUIDE_STEPS[0]).id }) },
  codexClaim: { action: { type: "codexClaim", category: "units" } },
  codexTitle: { action: { type: "codexTitle" }, refused: { match: /il faut 100 %/, why: "un Codex complet demande des seigneurs et des boss affrontés (données du serveur) : refus propre vérifié" } },
  casinoDaily: { action: { type: "casinoDaily" } },
  challengeClaim: { action: { type: "challengeClaim" } },
  claimAll: {
    prep: (p) => (p.contracts = { day: contractDay(NOW), items: [{ id: "c1", type: "spy", target: 1, progress: 1, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false } as PlayerState["contracts"]),
    action: { type: "claimAll" },
  },
  hideGuide: { action: { type: "hideGuide", hidden: true } },
  setPosture: { action: { type: "setPosture", posture: POSTURES[POSTURES.length - 1].id } },
  planBuilding: { prep: (p, q) => play(p, q, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }), action: { type: "planBuilding", buildingId: OTHER_BUILDING } },
  unplanBuilding: {
    prep: (p, q) => {
      play(p, q, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" });
      // Le niveau suivant du bâtiment en chantier reste programmé (un bâtiment libre partirait au rattrapage).
      play(p, q, { type: "planBuilding", buildingId: "extracteur_ferraille" });
    },
    action: { type: "unplanBuilding", index: 0 },
  },
  seenAnnouncements: { action: { type: "seenAnnouncements", ids: ["a1"] } },
  hideOnboarding: { action: { type: "hideOnboarding", hidden: true } },
  ascend: { prep: (p) => BUILDINGS.forEach((b) => (p.buildings[b.id] = { level: b.maxLevel, unlocked: true })), action: { type: "ascend" } },
  colonize: { action: { type: "colonize", name: "Tour 2" } },
  colonyUpgrade: { prep: withColony, action: { type: "colonyUpgrade", colonyId: COLONY, buildingId: colonyBuildingIds()[0] } },
  colonyDefense: { prep: withColony, action: { type: "colonyDefense", colonyId: COLONY, unitId: defenseUnit.id, qty: 1 } },
  colonyRename: { prep: withColony, action: { type: "colonyRename", colonyId: COLONY, name: "Nova II" } },
  empireClass: { action: { type: "empireClass", classId: empireClasses()[0].id } },
  moonUpgrade: { prep: (p) => (p.moon = { name: "Lune", level: 1, bornAtMs: NOW - 1000, fromDebris: 1 } as PlayerState["moon"]), action: { type: "moonUpgrade" } },
  prestigeStart: { action: { type: "prestigeStart" } },
  colonySpec: { prep: withColony, action: { type: "colonySpec", colonyId: COLONY, spec: COLONY_SPECS[0].id } },
  locateLair: {
    prep: (p) => (p.pirates = { [DEFAULT_FACTIONS[0].id]: { notoriety: 1, repelled: 5, lairOpen: false } } as unknown as PlayerState["pirates"]),
    action: { type: "locateLair", factionId: DEFAULT_FACTIONS[0].id },
  },
  colonyRoute: { prep: withColony, action: { type: "colonyRoute", colonyId: COLONY, everyHours: 6, keepPct: 20 } },
  commanderRecruit: { action: { type: "commanderRecruit", commanderId: COMMANDERS[0].id, method: "amber" } },
  commanderAssign: { prep: (p, q) => play(p, q, { type: "commanderRecruit", commanderId: COMMANDERS[0].id, method: "amber" }), action: { type: "commanderAssign", ids: [COMMANDERS[0].id] } },
  commanderTrain: {
    prep: (p, q) => {
      play(p, q, { type: "commanderRecruit", commanderId: COMMANDERS[0].id, method: "amber" });
      p.commanders = { ...p.commanders!, dossiers: 1 } as PlayerState["commanders"];
    },
    action: { type: "commanderTrain", commanderId: COMMANDERS[0].id } },
  synthCraft: { action: { type: "synthCraft", capsule: "armor", level: 1 } },
  synthActivate: { prep: (p) => (p.synthesis = { crafting: null, stock: { armor: [1] }, armor: null, veil: null, decoys: {} } as unknown as PlayerState["synthesis"]), action: { type: "synthActivate", capsule: "armor", level: 1 } },
  relicEquip: { prep: (p) => (p.relics = { items: [relic("r1")], slots: [] } as unknown as PlayerState["relics"]), action: { type: "relicEquip", slot: 0, relicId: "r1" } },
  relicFuse: { prep: (p) => (p.relics = { items: [relic("r1"), relic("r2"), relic("r3")], slots: [] } as unknown as PlayerState["relics"]), action: { type: "relicFuse", template: RELICS[0].id, rarity: RARITIES[0].id } },
  relicRecycle: { prep: (p) => (p.relics = { items: [relic("r1")], slots: [] } as unknown as PlayerState["relics"]), action: { type: "relicRecycle", relicId: "r1" } },
  achievementHint: {
    // Succès vides pendant le tour (src/test/setup.ts) : seul un succès secret est chargé ici.
    prep: () => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS).filter((a) => a.secret && a.enabled).slice(0, 1)),
    action: () => ({ type: "achievementHint", achievementId: ACHIEVEMENTS.find((a) => a.secret && a.enabled)!.id }),
  },
  moduleBuild: { prep: (p) => withModules(p, [plan("m1")]), action: { type: "moduleBuild", moduleId: "m1" } },
  moduleMount: { prep: (p) => withModules(p, [plan("m1", true)]), action: { type: "moduleMount", moduleId: "m1", cls: moduleMountClasses(tpl)[0], slot: 0 } },
  moduleUnmount: {
    prep: (p, q) => {
      withModules(p, [plan("m1", true)]);
      play(p, q, { type: "moduleMount", moduleId: "m1", cls: moduleMountClasses(tpl)[0], slot: 0 });
    },
    action: { type: "moduleUnmount", cls: moduleMountClasses(tpl)[0], slot: 0 },
  },
  moduleRecycle: { prep: (p) => withModules(p, [plan("m1")]), action: { type: "moduleRecycle", moduleId: "m1" } },
  chatArchive: { action: { type: "chatArchive", with: "autre", archived: true } },
  moduleFuse: { prep: (p) => withModules(p, [plan("m1"), plan("m2"), plan("m3")]), action: { type: "moduleFuse", moduleIds: ["m1", "m2", "m3"] } },
  modulePresetSave: { action: { type: "modulePresetSave", name: "Essai" } },
  modulePresetApply: { prep: (p, q) => play(p, q, { type: "modulePresetSave", name: "Essai" }), action: { type: "modulePresetApply", index: 0 } },
  modulePresetDelete: { prep: (p, q) => play(p, q, { type: "modulePresetSave", name: "Essai" }), action: { type: "modulePresetDelete", index: 0 } },
  setProfileStyle: { action: { type: "setProfileStyle", style: { motto: "En avant" } } },
  talentLearn: { prep: (p) => (p.ascensions = 1), action: () => ({ type: "talentLearn", talentId: TALENTS.find((t) => !t.retired)!.id }) },
  talentReset: {
    prep: (p, q) => {
      p.ascensions = 1;
      play(p, q, { type: "talentLearn", talentId: TALENTS.find((t) => !t.retired)!.id });
    },
    action: { type: "talentReset" },
  },
  streakClaim: { action: { type: "streakClaim" } },
  passClaim: { prep: (p) => (p.seasonPass = { ...passState(p, NOW), points: 100_000 }), action: { type: "passClaim", tier: 1 } },
  chronicleClaim: {
    prep: (p) => (p.chronicle = { monthId: chronicleMonthId(NOW), progress: [999, 999, 999, 999], claimed: [], emblems: [], chapters: [] } as unknown as PlayerState["chronicle"]),
    action: { type: "chronicleClaim", episode: 0 },
  },
  dailyClaim: { action: { type: "dailyClaim", index: 0 }, refused: { match: /Mission inconnue/, why: "missions du jour fusionnées dans les objectifs du jour depuis 6.2 (`DAILY_RULES.tasks` = 0) : refus propre vérifié" } },
  cancel: { prep: (p, q) => play(p, q, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }), action: { type: "cancel", target: { kind: "building", id: "extracteur_ferraille" } } },
  workshopRush: { prep: (p) => sendToWorkshop(p, { chasseur: 3 }, NOW, "raid", true), action: { type: "workshopRush" } },
  dockCommission: {
    prep: (p) => {
      // Cale sèche sous le palier de remise automatique : les vaisseaux prêts attendent le bouton.
      const dock = BUILDINGS.find((b) => b.effect?.type === "dock")!;
      p.buildings[dock.id] = { level: DOCK_TIERS.auto - 1, unlocked: true };
      p.units.chasseur = { level: 1, count: 0 };
      addReady(p, { chasseur: 2 });
    },
    action: { type: "dockCommission" },
  },
  dockScrap: { prep: (p) => sendToWorkshop(p, { chasseur: 3 }, NOW, "raid", true), action: { type: "dockScrap", unitId: "chasseur", qty: 1 } },
  dockSettings: { action: { type: "dockSettings", policy: "repair" } },
  vacationEnd: { prep: (p) => (p.vacation = { startedAtMs: NOW - 3 * 86_400_000, untilMs: NOW + 4 * 86_400_000 } as unknown as PlayerState["vacation"]), action: { type: "vacationEnd" } },
};

/** Ressources qui sortent sans être une dépense (6.14.110 : transferts hors `spendResources`). */
const TRANSFERS: Record<string, string> = {
  trade: "échange au comptoir : la ressource vendue est un transfert, pas une dépense",
  ascend: "Ascension : l'empire repart de zéro (remise à zéro, pas une dépense)",
};

function registryTypes(): string[] {
  const src = readFileSync("src/game/actions.ts", "utf8");
  const body = src.slice(src.indexOf("function applyAction("), src.indexOf('throw new GameActionError("Action inconnue.")'));
  const re = /case "(\w+)":/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push(m[1]);
  return out;
}

function negatives(p: PlayerState): string[] {
  const bad: string[] = [];
  const check = (label: string, v: unknown) => {
    if (typeof v !== "number") return;
    if (!Number.isFinite(v) || v < 0) bad.push(`${label} = ${v}`);
  };
  for (const [k, v] of Object.entries(p.resources ?? {})) check(`ressource ${k}`, v);
  for (const [k, u] of Object.entries(p.units ?? {})) check(`unité ${k}`, u?.count);
  check("Ambre", bountyState(p).amber);
  check("jetons", playerCasino(p).tokens);
  for (const c of p.colonies ?? []) for (const [k, v] of Object.entries(c.resources ?? {})) check(`colonie ${c.id} ${k}`, v);
  return bad;
}

function changedKeys(a: object, b: object): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => JSON.stringify((a as Record<string, unknown>)[k]) !== JSON.stringify((b as Record<string, unknown>)[k]));
}

const sumPaid = (paid: Partial<Record<string, number>> | undefined) => Object.values(paid ?? {}).reduce<number>((s, v) => s + (Number(v) || 0), 0);

describe("6.14.135 (AC-H) : tour des actions", () => {
  it("chaque action du registre a son scénario (une action ajoutée doit entrer dans le tour)", () => {
    const types = registryTypes();
    expect(types.length).toBeGreaterThan(60);
    expect(types.filter((t) => !SCENARIOS[t])).toEqual([]);
    expect(Object.keys(SCENARIOS).filter((t) => !types.includes(t))).toEqual([]);
  });

  for (const [type, sc] of Object.entries(SCENARIOS)) {
    it(`${type} : invariants gardés`, () => {
      const p = rich();
      const q = defaultQueues();
      sc.prep?.(p, q);
      // Base : fiche déjà rattrapée (production, cadeaux du rattrapage, succès), pour que l'écart mesuré soit celui de l'action.
      play(p, q, { type: "hideGuide", hidden: guideHidden(p) });
      const action = typeof sc.action === "function" ? sc.action(p, q) : sc.action;
      expect(action.type).toBe(type);
      const pBefore = structuredClone(p);
      const qBefore = structuredClone(q);
      const ctx = claims();

      if (sc.refused) {
        expect(() => performPlayerAction(p, q, action, NOW, {}, true, CODEX, ctx)).toThrow(GameActionError);
        expect(() => performPlayerAction(p, q, action, NOW, {}, true, CODEX, claims())).toThrow(sc.refused.match);
        expect(p, "un refus ne touche pas la fiche lue").toEqual(pBefore);
        expect(q).toEqual(qBefore);
        return;
      }

      const out = performPlayerAction(p, q, action, NOW, {}, true, CODEX, ctx);
      // Entrées intactes : le serveur n'écrit que la sortie (I24).
      expect(p, "entrée modifiée").toEqual(pBefore);
      expect(q, "files d'entrée modifiées").toEqual(qBefore);

      // Rien de négatif ni de non fini.
      expect(negatives(out.player)).toEqual([]);

      // État sauvé : champs écrits par le serveur, fiche sans perte en JSON.
      const extra = changedKeys(pBefore, out.player).filter((k) => !(GAME_FIELDS as readonly string[]).includes(k));
      expect(extra, "champ modifié que le serveur n'enregistre pas").toEqual([]);
      const extraQ = changedKeys(qBefore, out.queues).filter((k) => !(QUEUE_FIELDS as readonly string[]).includes(k));
      expect(extraQ, "file modifiée que le serveur n'enregistre pas").toEqual([]);
      expect(JSON.parse(JSON.stringify(out.player))).toEqual(out.player);
      expect(JSON.parse(JSON.stringify(out.queues))).toEqual(out.queues);

      // Pas de double débit : ce qui sort est ce qui est compté en dépense.
      let debited = 0;
      for (const r of RESOURCE_LIST) debited += Math.max(0, (pBefore.resources[r.id] ?? 0) - (out.player.resources[r.id] ?? 0));
      const spent = (out.player.stats?.spent ?? 0) - (pBefore.stats?.spent ?? 0);
      if (TRANSFERS[type]) expect(spent).toBe(0);
      else expect(debited, "ressources débitées hors dépense comptée").toBe(spent);
      const amberOut = Math.max(0, bountyState(pBefore).amber - bountyState(out.player).amber);
      const amberSpent = (out.player.stats?.amberSpent ?? 0) - (pBefore.stats?.amberSpent ?? 0);
      expect(amberOut, "Ambre débitée hors dépense comptée").toBe(amberSpent);

      // Achats en file : la dépense est le prix inscrit (une seule fois).
      if (type === "upgradeBuilding") expect(spent).toBe(sumPaid(out.queues.buildingUpgrades.extracteur_ferraille?.paid));
      if (type === "research") expect(spent).toBe(sumPaid(out.queues.activeResearches[0]?.paid));

      // Rejouée sur la sortie, l'action garde les mêmes invariants (ou refuse proprement).
      const p2 = structuredClone(out.player);
      try {
        const again = performPlayerAction(p2, out.queues, action, NOW, {}, true, CODEX, claims());
        expect(negatives(again.player)).toEqual([]);
      } catch (err) {
        expect(err).toBeInstanceOf(GameActionError);
      }
      expect(p2).toEqual(out.player);
    });
  }
});
