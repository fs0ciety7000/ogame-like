import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performFleetReturn, type Fleet } from "@/game/fleets";
import { modifiersFrom } from "@/game/modifiers";
import type { MoonState } from "@/game/moon";
import { allyJumpAllowed, canJump, checkJump, gateCooldownMs, gateUnlocked, JUMP_GATE_RULES, jumpedFleet, jumpMissions, jumpText, markJump } from "@/game/jumpGate";
import { threatEstimate } from "@/game/threat";
import type { PlayerState } from "@/types/game";

/* 6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md) : porte de saut lunaire, invariant I23. */

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

const moon = (level: number, patch: Partial<MoonState> = {}): MoonState => ({ name: "Nyx", bornAtMs: NOW - 1, fromDebris: 1, level, ...patch });
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState(uid, uid.toUpperCase()), resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;
const fleet = (patch: Partial<Fleet> = {}): Fleet =>
  ({ id: "f1", ownerUid: "mira", ownerPseudo: "Mira", targetUid: "mira", targetPseudo: "Mira", mission: "patrol", units: { fregate: 40 }, departAtMs: NOW - H, arriveAtMs: NOW + H, returnAtMs: NOW + 2 * H, status: "outbound", loot: null, reportId: "", outcome: "", recalled: false, ...patch }) as Fleet;

afterEach(() => applyGameContent({}));

describe("porte de saut : recharge par niveau (§5.1)", () => {
  it("fermée sous le niveau 3 ; 24 h, 22 h, 20 h ; plancher 6 h", () => {
    expect([1, 2].map((l) => gateCooldownMs(l))).toEqual([null, null]);
    expect([3, 4, 5].map((l) => gateCooldownMs(l)! / H)).toEqual([24, 22, 20]);
    expect(gateUnlocked({ moon: moon(2) })).toBe(false);
    expect(gateUnlocked({ moon: moon(3) })).toBe(true);
    applyGameContent({ rules: { jumpGate: { cooldownHours: 4 } } } as never);
    expect(gateCooldownMs(3)! / H).toBe(6);
  });

  it("stat jumpGateCooldown : couche empire, plafond 30 %", () => {
    const g = (value: number) => ({ stat: "jumpGateCooldown" as const, value, layer: "empire" as const, source: { kind: "relic" as const, id: "t", label: "Test" } });
    expect(modifiersFrom([g(0.15)]).jumpGateCooldown).toBeCloseTo(0.15);
    expect(modifiersFrom([g(0.9)]).jumpGateCooldown).toBe(0.3);
  });
});

describe("porte de saut : quelles flottes (I23)", () => {
  const me = () => player("mira", { moon: moon(3) });

  it("patrouille, garnison (en route, stationnée, au retour) et base avancée seulement", () => {
    expect(jumpMissions()).toEqual(["patrol", "garrison", "colonybase"]);
    for (const status of ["outbound", "stationed", "returning"] as const) expect(canJump(me(), fleet({ mission: "garrison", status, targetUid: "ally" }), NOW)).toBe(true);
    expect(canJump(me(), fleet({ mission: "colonybase", status: "stationed" }), NOW)).toBe(true);
    for (const mission of ["attack", "transport", "delivery", "expedition", "spy", "recycle", "leviathan", "bounty", "elite", "seasonboss", "allianceboss", "lair", "pirate"] as const) {
      expect(() => checkJump(me(), fleet({ mission }), NOW)).toThrow("La porte ne ramène que les patrouilles, garnisons et bases avancées.");
    }
  });

  it("refus : flotte d'un autre, déjà rentrée, en décision, chargée ; lune absente ou trop basse ; désactivée", () => {
    expect(() => checkJump(me(), fleet({ ownerUid: "krax" }), NOW)).toThrow(/pas à toi/);
    expect(() => checkJump(me(), fleet({ status: "done" }), NOW)).toThrow(/déjà rentrée/);
    expect(() => checkJump(me(), fleet({ status: "decision" }), NOW)).toThrow(/décision/);
    expect(() => checkJump(me(), fleet({ loot: { scrap: 10 } }), NOW)).toThrow(/chargée/);
    expect(() => checkJump(player("mira"), fleet(), NOW)).toThrow(/lune/);
    expect(() => checkJump(player("mira", { moon: moon(2) }), fleet(), NOW)).toThrow("Ta lune doit atteindre le niveau 3 pour ouvrir la porte de saut.");
    applyGameContent({ rules: { jumpGate: { enabled: false } } } as never);
    expect(() => checkJump(me(), fleet(), NOW)).toThrow(/désactivée/);
  });

  it("l'admin peut retirer une mission, jamais en ajouter une interdite", () => {
    applyGameContent({ rules: { jumpGate: { missions: ["patrol", "attack", "transport"] } } } as never);
    expect(jumpMissions()).toEqual(["patrol"]);
    expect(canJump(me(), fleet({ mission: "attack" }), NOW)).toBe(false);
    expect(canJump(me(), fleet({ mission: "garrison" }), NOW)).toBe(false);
  });

  it("une fois par recharge : markJump pose la recharge et compte le saut", () => {
    const p = me();
    const ready = markJump(p, NOW);
    expect(ready).toBe(NOW + 24 * H);
    expect(p.moon?.gateReadyAtMs).toBe(ready);
    expect(p.stats?.gateJumps).toBe(1);
    expect(() => checkJump(p, fleet(), NOW + H)).toThrow("Ta porte de saut se recharge : encore 23 h.");
    expect(canJump(p, fleet(), ready)).toBe(true);
    expect(jumpText("patrol", ready, NOW).message).toBe("Saut réussi : ta patrouille est à quai. Prochain saut dans 24 h.");
    expect(() => markJump(player("x", { moon: moon(1) }), NOW)).toThrow(/fermée/);
  });

  it("rapatriement : unités conservées (I1), aucune ressource créée", () => {
    const p = player("mira", { moon: moon(3) });
    const before = { units: p.units.fregate?.count ?? 0, resources: { ...p.resources } };
    const f = jumpedFleet(fleet({ units: { fregate: 40 } }), NOW);
    expect(f).toMatchObject({ status: "returning", returnAtMs: NOW, units: { fregate: 40 } });
    const out = performFleetReturn(p, defaultQueues(), f, NOW);
    expect(out.owner.units.fregate.count).toBe(before.units + 40);
    expect(out.owner.resources).toEqual(before.resources);
  });

  it("simulation : la patrouille rapatriée change le verdict (« danger » → « sûr »)", () => {
    const base = defaultPlayerState("mira", "MIRA").units;
    const attack = { mission: "attack" as const, targetUid: "mira", units: { fregate: 300 }, power: 0 };
    const away = player("mira", { units: { ...base, fregate: { level: 1, count: 0 } } });
    const atk = player("mira", { units: { ...base, fregate: { level: 1, count: 300 } } });
    const power = threatEstimate({ ...attack, power: null }, atk).attack;
    const incoming = { ...attack, power };
    expect(threatEstimate(incoming, away).verdict).toBe("danger");
    const back = performFleetReturn(away, defaultQueues(), jumpedFleet(fleet({ units: { fregate: 2000 } }), NOW), NOW).owner;
    expect(threatEstimate(incoming, back).verdict).toBe("safe");
  });

  it("J3 (saut d'allié) désactivé par défaut", () => {
    expect(JUMP_GATE_RULES.allyJump).toBe(false);
    expect(allyJumpAllowed({ moon: moon(5) })).toBe(false);
    applyGameContent({ rules: { jumpGate: { allyJump: true } } } as never);
    expect(allyJumpAllowed({ moon: moon(5) })).toBe(true);
    expect(allyJumpAllowed({ moon: moon(4) })).toBe(false);
  });
});
