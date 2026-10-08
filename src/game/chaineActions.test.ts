import { describe, expect, it } from "vitest";
import { performPlayerAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { checkNewAchievements, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { contractDay } from "@/game/contracts";
import { upgradeMoon } from "@/game/moonUpgrade";
import { recallFleet, recallNotices, type Fleet } from "@/game/fleets";
import type { PlayerState } from "@/types/game";

/* 6.14.110 (AU27, lot AC-D) : dépenses et traces. */

const NOW = Date.UTC(2026, 9, 8, 10);

function player(patch: Partial<PlayerState> = {}): PlayerState {
  const base = defaultPlayerState("u1", "Testeur") as PlayerState;
  return { ...base, createdAtMs: NOW - 30 * 86_400_000, resourcesUpdatedAtMs: NOW, resources: { ...base.resources, scrap: 1e6, energy: 1e6, nano: 1e5, data: 1e5 }, ...patch } as PlayerState;
}

describe("AC-5 : dépenses comptées", () => {
  it("améliorer sa lune compte la dépense (statistique et objectif « Dépenser »)", () => {
    const p = player({ moon: { name: "Lune", level: 1, bornAtMs: NOW - 1000, fromDebris: 1 } });
    const before = p.resources.scrap;
    upgradeMoon(p, NOW);
    const spent = before - p.resources.scrap;
    expect(spent).toBeGreaterThan(0);
    expect(p.stats?.spent ?? 0).toBeGreaterThanOrEqual(spent);
  });

  it("la revente d'unités compte `unitsSold` (AC-21)", () => {
    const p = player({ units: { chasseur: { level: 1, count: 10 } } });
    const out = performPlayerAction(p, defaultQueues(), { type: "sellUnits", unitId: "chasseur", qty: 4 }, NOW);
    expect(out.player.units.chasseur.count).toBe(6);
    expect(out.player.stats?.unitsSold).toBe(4);
  });
});

describe("AC-6 : réclamations au Journal (Q76, option B)", () => {
  function withDoneContract(): PlayerState {
    return player({
      contracts: { day: contractDay(NOW), items: [{ id: "c1", type: "spy", target: 1, progress: 1, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false },
    });
  }

  it("une réclamation laisse une ligne déjà lue qui dit le gain", () => {
    const out = performPlayerAction(withDoneContract(), defaultQueues(), { type: "claimContract", contractId: "c1" }, NOW);
    const note = out.notifications.find((n) => n.title === "Objectif du jour récupéré");
    expect(note).toBeTruthy();
    expect(note?.read).toBe(true);
    expect(note?.kind).toBe("event");
    expect(note?.message).toMatch(/^Objectif du jour : \+/);
  });

  it("« Tout réclamer » laisse une seule ligne récapitulative, et rien quand rien n'est prêt", () => {
    const out = performPlayerAction(withDoneContract(), defaultQueues(), { type: "claimAll" }, NOW);
    const notes = out.notifications.filter((n) => n.kind === "event" && n.read === true);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Tout réclamé");
    expect(notes[0].message).toMatch(/objectif du jour/);
    const again = performPlayerAction(out.player, out.queues, { type: "claimAll" }, NOW + 1000);
    expect(again.notifications.filter((n) => n.title === "Tout réclamé")).toHaveLength(0);
  });

  it("une réclamation refusée n'écrit rien", () => {
    const p = withDoneContract();
    p.contracts!.items[0].claimed = true;
    expect(() => performPlayerAction(p, defaultQueues(), { type: "claimContract", contractId: "c1" }, NOW)).toThrow();
  });
});

describe("AC-20 : succès gagnés par l'action débloqués tout de suite", () => {
  it("un échange au comptoir qui franchit le palier débloque le succès dans la même réponse", () => {
    setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
    const p = player({ stats: { traded: 999_000 } });
    p.unlockedAchievements = checkNewAchievements(p).map((a) => a.id);
    const out = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "energy", amount: 2_000 }, NOW);
    expect(out.player.unlockedAchievements).toContain("merchant");
    expect(out.notifications.some((n) => n.kind === "achievement")).toBe(true);
  });
});

describe("AC-12 : rappel de flotte tracé", () => {
  const fleet = (patch: Partial<Fleet>): Fleet =>
    ({ id: "f1", ownerUid: "u1", ownerPseudo: "Testeur", targetUid: "u2", targetPseudo: "Allié", mission: "attack", status: "outbound", units: { chasseur: 5 }, departAtMs: NOW - 60_000, arriveAtMs: NOW + 600_000, ...patch }) as Fleet;

  it("le joueur garde une ligne déjà lue ; une attaque ne prévient personne", () => {
    const f = fleet({});
    const next = recallFleet(f, "u1", NOW);
    const n = recallNotices(f, next, "Testeur", NOW);
    expect(n.owner.read).toBe(true);
    expect(n.owner.message).toMatch(/Attaque vers Allié : demi-tour/);
    expect(n.host).toBeNull();
  });

  it("une garnison rappelée prévient l'allié qui l'hébergeait", () => {
    const f = fleet({ mission: "garrison", status: "stationed", arriveAtMs: NOW - 1000, departAtMs: NOW - 601_000 });
    const next = recallFleet(f, "u1", NOW);
    const n = recallNotices(f, next, "Testeur", NOW);
    expect(n.host?.uid).toBe("u2");
    expect(n.host?.notification.read).toBe(false);
    expect(n.host?.notification.message).toMatch(/Testeur a rappelé sa garnison/);
  });
});

/* 6.14.112 (AU27, lot AC-F) : garde de vacances unique (AC-11, Q79). */
describe("AC-11 : garde de vacances unique", () => {
  const away = () => player({ vacation: { startedAtMs: NOW - 3_600_000, untilMs: NOW + 5 * 86_400_000 } });

  it("la liste blanche par défaut garde les 8 actions d'avant, le reste est refusé avec un message clair", async () => {
    const { vacationBlock, VACATION_RULES } = await import("@/game/vacation");
    expect(VACATION_RULES.allowed).toEqual(["sync", "seenAnnouncements", "setTitle", "hideOnboarding", "setProfileStyle", "colonyRename", "vacationEnd", "hideGuide"]);
    expect(vacationBlock(away(), NOW, "sync")).toBeNull();
    expect(vacationBlock(away(), NOW, "codexClaim")).toBe("Tu es en vacances : reviens d'abord (Paramètres) pour récupérer une récompense du Codex.");
    expect(vacationBlock(away(), NOW, "casinoDaily")).toMatch(/jeton du jour du casino/);
    expect(vacationBlock(away(), NOW, "casino:spin")).toMatch(/jouer au casino/);
    expect(vacationBlock(away(), NOW, "research")).toBe("Tu es en vacances : reviens d'abord (Paramètres) pour jouer.");
    // Hors vacances : rien n'est refusé.
    expect(vacationBlock(player(), NOW, "casinoDaily")).toBeNull();
  });

  it("l'action et les routes lisent la même liste, réglable dans l'admin", async () => {
    const { VACATION_RULES } = await import("@/game/vacation");
    const saved = [...VACATION_RULES.allowed];
    try {
      expect(() => performPlayerAction(away(), defaultQueues(), { type: "claimAll" }, NOW)).toThrow(/vacances/);
      VACATION_RULES.allowed = [...saved, "claimAll"];
      expect(() => performPlayerAction(away(), defaultQueues(), { type: "claimAll" }, NOW)).not.toThrow();
    } finally {
      VACATION_RULES.allowed = saved;
    }
  });
});

/* 6.14.113 (AU27, lot AC-G) : réclamations groupées (AC-14, AC-15, AC-19). */
describe("AC-15 : casino du jour, défi et titre du Codex dans « Tout réclamer »", () => {
  const challenge = () =>
    ({ id: "w1", type: "marketVolume", target: 100, startMs: NOW - 8 * 86_400_000, endMs: NOW - 86_400_000, total: 120, contributions: { u1: { pseudo: "Testeur", amount: 120 } }, status: "done", success: true, claimed: [] }) as unknown as import("@/game/challenges").Challenge;

  it("sans les données du serveur, rien n'est proposé (pas de faux positif) ; avec elles, casino et défi le sont", async () => {
    const { pendingClaims } = await import("@/game/claimAll");
    const { normalizeCasinoSettings } = await import("@/game/casino");
    const p = player();
    const bare = pendingClaims(p, NOW).map((c) => c.type);
    expect(bare).not.toContain("casinoDaily");
    expect(bare).not.toContain("challengeClaim");
    expect(bare).not.toContain("codexTitle");
    const ctx = { casino: normalizeCasinoSettings(null), challenge: { previous: challenge() } };
    const types = pendingClaims(p, NOW, undefined, ctx).map((c) => c.type);
    expect(types).toContain("challengeClaim");
    if (ctx.casino.dailyTokens > 0) expect(types).toContain("casinoDaily");
    // Le titre du Codex exige les seigneurs et boss affrontés : jamais sans le contexte du serveur.
    expect(types).not.toContain("codexTitle");
  });

  it("« Tout réclamer » prend le défi et rend l'état du défi à enregistrer ; une ligne au Journal", async () => {
    const { normalizeCasinoSettings } = await import("@/game/casino");
    const claims = { casino: normalizeCasinoSettings(null), challenge: { previous: challenge() } as { previous: import("@/game/challenges").Challenge | null; claimed?: import("@/game/challenges").Challenge | null } };
    const out = performPlayerAction(player(), defaultQueues(), { type: "claimAll" }, NOW, {}, false, undefined, claims);
    expect((out.result as Record<string, number>).challengeClaim).toBe(1);
    expect(claims.challenge.claimed?.claimed).toEqual(["u1"]);
    expect(out.notifications.filter((n) => n.title === "Tout réclamé")).toHaveLength(1);
    // Deuxième passage : déjà réclamé, refusé.
    expect(() => performPlayerAction(out.player, out.queues, { type: "challengeClaim" }, NOW, {}, false, undefined, { challenge: { previous: claims.challenge.claimed ?? null } })).toThrow(/déjà/);
  });
});

describe("AC-14 : « Tout réclamer » isole chaque sous-action", () => {
  it("une erreur de programmation remonte (la route échoue, rien n'est crédité à moitié)", async () => {
    const { normalizeCasinoSettings } = await import("@/game/casino");
    const broken = { ...normalizeCasinoSettings(null), rewards: null } as unknown as import("@/game/casino").CasinoSettings;
    const ch = { id: "w1", type: "marketVolume", target: 100, startMs: 0, endMs: NOW - 1, total: 120, contributions: { u1: { pseudo: "T", amount: 120 } }, status: "done", success: true, claimed: [] } as unknown as import("@/game/challenges").Challenge;
    expect(() => performPlayerAction(player(), defaultQueues(), { type: "claimAll" }, NOW, {}, false, undefined, { casino: broken, challenge: { previous: ch } })).toThrow(TypeError);
  });
});
