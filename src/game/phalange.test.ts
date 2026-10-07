import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { effectCap, type EffectGrant } from "@/game/effects";
import { distanceBetween, type Fleet } from "@/game/fleets";
import { modifiersFrom } from "@/game/modifiers";
import type { MoonState } from "@/game/moon";
import {
  alliedThreats,
  alliesCovered,
  buildScanReport,
  canScan,
  checkScan,
  isAggressor,
  markScan,
  PHALANX_RULES,
  phalanxFeatures,
  phalanxHidden,
  phalanxRange,
  piercedText,
  radarRecipients,
  radarText,
  revealIncoming,
  scanCost,
  scanReportText,
} from "@/game/phalanx";
import { threatEstimate } from "@/game/threat";
import type { PlayerState } from "@/types/game";

/* 6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md) : phalange lunaire, invariant I22. */

const NOW = Date.UTC(2026, 9, 7, 12);
const MIN = 60_000;

const moon = (level: number, patch: Partial<MoonState> = {}): MoonState => ({ name: "Nyx", bornAtMs: NOW - 1, fromDebris: 1, level, ...patch });
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState(uid, uid.toUpperCase()), resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;

/** Premier identifiant dont la distance à `from` respecte `ok`. */
function uidAt(from: string, ok: (d: number) => boolean, prefix = "p"): string {
  for (let i = 0; i < 20_000; i++) {
    const uid = `${prefix}${i}`;
    if (uid !== from && ok(distanceBetween(from, uid))) return uid;
  }
  throw new Error("aucun identifiant trouvé");
}

const attackFleet = (owner: string, target: string, patch: Partial<Fleet> = {}): Fleet =>
  ({ id: `f-${owner}-${target}`, ownerUid: owner, ownerPseudo: owner, targetUid: target, targetPseudo: target, mission: "attack", units: { fregate: 30 }, departAtMs: NOW - MIN, arriveAtMs: NOW + 20 * MIN, returnAtMs: null, status: "outbound", loot: null, reportId: "", outcome: "", recalled: false, power: 1000, ...patch }) as Fleet;

afterEach(() => applyGameContent({}));

describe("phalange : paliers par niveau de lune (§5.1)", () => {
  it("portée 15 par niveau, perce-brouillard au niveau 2, capsules au niveau 4, recharge 30 → 10 min", () => {
    expect([1, 2, 3, 4, 5].map((l) => phalanxFeatures(l).range)).toEqual([15, 30, 45, 60, 75]);
    expect([1, 2, 3, 4, 5].map((l) => phalanxFeatures(l).revealDecoy)).toEqual([false, true, true, true, true]);
    expect([1, 2, 3, 4, 5].map((l) => phalanxFeatures(l).revealBoosts)).toEqual([false, false, false, true, true]);
    expect([1, 2, 3, 4, 5].map((l) => phalanxFeatures(l).scanCooldownMs / MIN)).toEqual([30, 25, 20, 15, 10]);
    expect(phalanxFeatures(1).radar).toBe(true);
    expect(phalanxFeatures(0)).toMatchObject({ radar: false, range: 0, revealDecoy: false, revealBoosts: false });
  });

  it("sans lune, pas de portée ; avec lune, portée × niveau", () => {
    expect(phalanxRange(player("a"))).toBe(0);
    expect(phalanxRange(player("a", { moon: moon(3) }))).toBe(45);
  });

  it("stat phalanxRange : couche empire, plafond 50 % (réglable)", () => {
    const g = (value: number): EffectGrant => ({ stat: "phalanxRange", value, layer: "empire", source: { kind: "relic", id: "t", label: "Test" } });
    expect(modifiersFrom([g(0.2)]).phalanxRange).toBeCloseTo(0.2);
    expect(modifiersFrom([g(0.9)]).phalanxRange).toBe(0.5);
    expect(effectCap("phalanxRange", "empire")).toBe(0.5);
    expect(effectCap("jumpGateCooldown", "empire")).toBe(0.3);
  });

  it("tout se coupe : enabled = false, revealDecoyLevel = 0, radar = false", () => {
    applyGameContent({ rules: { phalanx: { enabled: false } } } as never);
    expect(PHALANX_RULES.enabled).toBe(false);
    expect(phalanxRange(player("a", { moon: moon(5) }))).toBe(0);
    expect(phalanxFeatures(5).revealDecoy).toBe(false);
    applyGameContent({ rules: { phalanx: { revealDecoyLevel: 0, radar: false } } } as never);
    expect(PHALANX_RULES.enabled).toBe(true);
    expect(PHALANX_RULES.rangePerLevel).toBe(15);
    expect(phalanxFeatures(5).revealDecoy).toBe(false);
    expect(phalanxFeatures(5).radar).toBe(false);
  });
});

describe("phalange : perce-brouillard (I22)", () => {
  const hidden = { trueUnits: { fregate: 42 }, boosts: { assault: 15, decoy: 2 }, truePower: 4200 };

  it("rend la vraie composition au niveau 2, le stimulant au niveau 4, à la cible seulement", () => {
    const f = attackFleet("krax", "mira");
    expect(revealIncoming(f, hidden, 1, "mira")).toMatchObject({ units: { fregate: 30 }, power: 1000, assault: null, pierced: { decoy: false, boosts: false } });
    expect(revealIncoming(f, hidden, 2, "mira")).toMatchObject({ units: { fregate: 42 }, power: 4200, assault: null, pierced: { decoy: true, boosts: false } });
    const lvl4 = revealIncoming(f, hidden, 4, "mira");
    expect(lvl4).toMatchObject({ units: { fregate: 42 }, assault: 15, pierced: { decoy: true, boosts: true } });
    expect(lvl4.power).toBe(Math.round(4200 * 1.15));
    // Un allié, un tiers ou l'attaquant ne voient rien de caché, même avec une lune de niveau 5.
    for (const viewer of ["ally", "krax", "autre"]) expect(revealIncoming(f, hidden, 5, viewer).pierced).toEqual({ decoy: false, boosts: false });
    expect(revealIncoming(f, hidden, 5, "ally").units).toEqual({ fregate: 30 });
  });

  it("une colonie visée : son propriétaire est la cible ; un raid pirate n'est jamais percé", () => {
    const col = attackFleet("krax", "mira-c1", { targetOwnerUid: "mira" });
    expect(revealIncoming(col, hidden, 2, "mira").pierced.decoy).toBe(true);
    expect(revealIncoming({ ...col, mission: "pirate" }, hidden, 5, "mira").pierced.decoy).toBe(false);
  });

  it("rien n'est écrit dans la flotte ; sans vraie puissance, la puissance se recalcule (null)", () => {
    const f = attackFleet("krax", "mira");
    const before = structuredClone(f);
    const out = revealIncoming(f, { trueUnits: { fregate: 42 } }, 3, "mira");
    expect(f).toEqual(before);
    expect(out.power).toBeNull();
    expect(piercedText(f.units, revealIncoming(f, hidden, 4, "mira"))).toBe("Percé par la phalange : 42 vaisseaux, pas 30. +15 % d'attaque (stimulant).");
    expect(piercedText(f.units, revealIncoming(f, hidden, 1, "mira"))).toBeNull();
  });

  it("simulation : verdict faux sur la flotte leurrée, juste une fois percée", () => {
    const def = player("mira", { units: { ...defaultPlayerState("mira", "MIRA").units, fregate: { level: 1, count: 60 } } });
    const decoy = attackFleet("krax", "mira", { units: { fregate: 5 }, power: 1 });
    expect(threatEstimate(decoy, def).verdict).toBe("safe");
    const real = revealIncoming(decoy, { trueUnits: { fregate: 4000 } }, 2, "mira");
    expect(threatEstimate({ ...decoy, units: real.units, power: real.power }, def).verdict).toBe("danger");
  });
});

describe("phalange : radar d'alliance (I22)", () => {
  it("prévient les alliés de la cible dont la portée couvre la planète visée, au plus 10, jamais la cible ni l'attaquant", () => {
    const near = uidAt("mira", (d) => d <= 14, "n");
    const far = uidAt("mira", (d) => d > 16 && d < 40, "f");
    const fleet = attackFleet("krax", "mira");
    const cands = [
      { uid: near, allianceId: "A", moon: moon(1) },
      { uid: far, allianceId: "A", moon: moon(1) },
      { uid: "sans-lune", allianceId: "A" },
      { uid: "mira", allianceId: "A", moon: moon(5) },
      { uid: "krax", allianceId: "A", moon: moon(5) },
      { uid: uidAt("mira", (d) => d <= 14, "e"), allianceId: "B", moon: moon(5) },
    ];
    expect(radarRecipients(fleet, "A", cands)).toEqual([near]);
    // Au niveau 3 (portée 45), l'allié lointain est couvert aussi, le plus proche d'abord.
    cands[1] = { ...cands[1], moon: moon(3) };
    expect(radarRecipients(fleet, "A", cands)).toEqual([near, far]);
    expect(radarRecipients(fleet, null, cands)).toEqual([]);
    expect(radarRecipients({ ...fleet, mission: "pirate" }, "A", cands)).toEqual([]);
    expect(radarRecipients(fleet, "A", cands, { attackerNpc: true })).toEqual([]);
  });

  it("plafond radarMaxNotified (10) ; colonie visée : distance à la colonie", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ uid: `m${i}`, allianceId: "A", moon: moon(5) })).filter((c) => distanceBetween(c.uid, "mira") <= 75);
    expect(many.length).toBeGreaterThan(10);
    const out = radarRecipients(attackFleet("krax", "mira"), "A", many);
    expect(out).toHaveLength(PHALANX_RULES.radarMaxNotified);
    const col = attackFleet("krax", "mira-c1", { targetOwnerUid: "mira" });
    const ally = uidAt("mira-c1", (d) => d <= 14, "c");
    expect(radarRecipients(col, "A", [{ uid: ally, allianceId: "A", moon: moon(1) }])).toEqual([ally]);
    expect(radarRecipients(col, "A", [{ uid: "mira", allianceId: "A", moon: moon(5) }])).toEqual([]);
  });

  it("alliesCovered et texte du radar", () => {
    const owner = { uid: "mira", moon: moon(1) };
    const near = uidAt("mira", (d) => d <= 14, "n");
    const far = uidAt("mira", (d) => d > 16, "f");
    expect(alliesCovered(owner, [{ uid: far }, { uid: near }]).map((t) => t.uid)).toEqual([near]);
    expect(alliesCovered({ uid: "mira" }, [{ uid: near }])).toEqual([]);
    expect(radarText("Krax", "Mira", "planète mère", NOW + 23 * MIN, NOW).message).toBe("Phalange : Krax vise Mira (planète mère), impact dans 23 min. Envoie une garnison !");
  });
});

describe("phalange : balayage de l'agresseur (I22)", () => {
  const rich = () => ({ ...defaultPlayerState("x", "X").resources, energy: 1e6 });

  it("ne vise qu'un agresseur : attaque en approche vers soi, une colonie, ou un allié couvert", () => {
    const me = player("mira", { moon: moon(1), resources: rich() });
    const ally = uidAt("mira", (d) => d <= 14, "n");
    const farAlly = uidAt("mira", (d) => d > 16, "f");
    expect(isAggressor(me, "krax", [attackFleet("krax", "mira")])).toBe(true);
    expect(isAggressor(me, "krax", [attackFleet("krax", "mira-c1", { targetOwnerUid: "mira" })])).toBe(true);
    expect(isAggressor(me, "krax", [attackFleet("krax", ally)], [ally])).toBe(true);
    expect(isAggressor(me, "krax", [attackFleet("krax", farAlly)], [farAlly])).toBe(false);
    expect(isAggressor(me, "krax", [attackFleet("krax", ally)], [])).toBe(false);
    expect(isAggressor(me, "krax", [attackFleet("krax", "mira", { status: "returning" })])).toBe(false);
    expect(isAggressor(me, "krax", [attackFleet("krax", "mira", { mission: "spy" })])).toBe(false);
    expect(isAggressor(me, "krax", [attackFleet("autre", "mira")])).toBe(false);
  });

  it("refus : sans lune, soi-même, non-agresseur, recharge, énergie ; puis recharge posée et énergie payée", () => {
    const fleets = [attackFleet("krax", "mira")];
    expect(() => checkScan(player("mira", { resources: rich() }), "krax", fleets, NOW)).toThrow(/lune/);
    const me = player("mira", { moon: moon(2), resources: rich() });
    expect(() => checkScan(me, "mira", fleets, NOW)).toThrow(/autre joueur/);
    expect(() => checkScan(me, "autre", fleets, NOW)).toThrow(/ne balaie qu'un joueur qui t'attaque/);
    expect(canScan(me, "krax", fleets, NOW)).toBe(true);
    const cost = scanCost(me);
    expect(cost).toBeGreaterThanOrEqual(PHALANX_RULES.scanCostMin);
    const { readyAtMs } = markScan(me, NOW);
    expect(readyAtMs).toBe(NOW + 25 * MIN);
    expect(me.resources.energy).toBe(1e6 - cost);
    expect(me.stats?.phalanxScans).toBe(1);
    expect(() => checkScan(me, "krax", fleets, NOW + 10 * MIN)).toThrow("Ta phalange se recharge : encore 15 min.");
    expect(canScan(me, "krax", fleets, readyAtMs)).toBe(true);
    const poor = player("mira", { moon: moon(2) });
    poor.resources = { ...poor.resources, energy: 0 };
    expect(() => checkScan(poor, "krax", fleets, NOW)).toThrow(/d'énergie/);
  });

  it("coût : 30 min de production d'énergie, 1 000 au moins", () => {
    const p = player("mira");
    expect(scanCost(p)).toBe(1000);
    applyGameContent({ rules: { phalanx: { scanCostMin: 0, scanCostHours: 1000 } } } as never);
    expect(scanCost(p)).toBeGreaterThanOrEqual(0);
    expect(currentGameContent().rules.phalanx.scanCostHours).toBe(1000);
  });

  it("rapport : flottes en vol (composition affichée seulement) et total à quai", () => {
    const krax = player("krax", { units: { ...defaultPlayerState("krax", "KRAX").units, fregate: { level: 1, count: 118 } } });
    const leurre = { ...attackFleet("krax", "mira", { units: { fregate: 5 } }), trueUnits: { fregate: 500 } } as Fleet;
    const fleets = [leurre, attackFleet("krax", "zed", { id: "f2", mission: "patrol" }), attackFleet("krax", "old", { id: "f3", status: "done" }), attackFleet("autre", "mira", { id: "f4" })];
    const report = buildScanReport(krax, fleets, NOW);
    expect(report.fleets.map((f) => f.id).sort()).toEqual(["f-krax-mira", "f2"]);
    expect(report.fleets.find((f) => f.id === "f-krax-mira")?.units).toEqual({ fregate: 5 });
    expect(JSON.stringify(report)).not.toContain("trueUnits");
    expect(report.docked).toBeGreaterThanOrEqual(118);
    const text = scanReportText({ ...report, docked: 118 }, NOW + 25 * MIN, NOW).message;
    expect(text).toBe("Balayage de KRAX : 2 flottes en vol, 118 vaisseaux à quai. Prochain balayage dans 25 min.");
  });
});

describe("phalange : aides du serveur (6.14.48, É30-1b)", () => {
  it("alliedThreats : attaques sur un allié dans la portée, jamais sur soi, ni d'un allié, ni hors portée", () => {
    const near = uidAt("mira", (d) => d <= 30, "n");
    const far = uidAt("mira", (d) => d > 80, "x");
    const me = player("mira", { moon: moon(2) });
    const fleets = [
      attackFleet("krax", near, { id: "a" }),
      attackFleet("krax", far, { id: "b" }),
      attackFleet("krax", "mira", { id: "c" }),
      attackFleet(near, far, { id: "d" }),
      attackFleet("krax", near, { id: "e", status: "returning" }),
      attackFleet("krax", near, { id: "f", mission: "spy" }),
    ];
    expect(alliedThreats(me, fleets, [near, far]).map((f) => f.id)).toEqual(["a"]);
    expect(alliedThreats(player("mira"), fleets, [near])).toEqual([]);
    expect(alliedThreats(me, fleets, [])).toEqual([]);
  });

  it("phalanxHidden : vraie puissance calculée sur trueUnits, bonus d'attaque de l'attaquant", () => {
    const krax = player("krax", { units: { ...defaultPlayerState("krax", "KRAX").units, fregate: { level: 1, count: 50 } } });
    const hidden = phalanxHidden(krax, { fregate: 40 }, { assault: 20 }, "balanced");
    expect(hidden.trueUnits).toEqual({ fregate: 40 });
    expect(hidden.truePower).toBeGreaterThan(0);
    expect(hidden.attackMod).toBe(0);
    expect(phalanxHidden(null, { fregate: 40 }, null).truePower).toBeNull();
    expect(phalanxHidden(krax, {}, null)).toMatchObject({ trueUnits: null, truePower: null });
    const shown = attackFleet("krax", "mira", { units: { fregate: 10 } });
    const seen = revealIncoming(shown, hidden, 4, "mira");
    expect(seen.units).toEqual({ fregate: 40 });
    expect(seen.power).toBe(Math.round(hidden.truePower! * 1.2));
    expect(seen.assault).toBe(20);
  });
});
