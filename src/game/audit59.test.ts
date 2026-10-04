import { describe, expect, it } from "vitest";
import { performGift } from "@/game/actions";
import { METRICS } from "@/game/achievements";
import { ensureContracts } from "@/game/contracts";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const player = (uid: string, patch: Partial<PlayerState> = {}) =>
  ({ ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;

describe("v5.9 audit des workflows", () => {
  it("« Titres de saison » ne compte que les titres de fin de saison", () => {
    const p = player("a", {
      titles: [
        { label: "Champion", seasonId: "2026-09", rank: 1 },
        { label: "Passe", seasonId: "pass:2026-10", rank: 1 },
        { label: "Défi", seasonId: "challenge:w1", rank: 1 },
        { label: "Boss", seasonId: "boss:2026-10", rank: 1 },
        { label: "Succès", seasonId: "achievement:x", rank: 1 },
      ],
    });
    expect(METRICS.seasonTitles.value(p)).toBe(1);
  });

  it("un cadeau ne fait pas avancer le contrat « dépenser »", () => {
    const a = player("a", { createdAtMs: NOW - 10 * 86_400_000, resources: { ...player("x").resources, scrap: 50_000 } });
    const state = ensureContracts(a, NOW);
    state.items = state.items.map((c, i) => (i === 0 ? { ...c, type: "spend", progress: 0, target: 10_000, claimed: false } : c));
    const out = performGift(a, defaultQueues(), player("b", { createdAtMs: NOW - 10 * 86_400_000 }), defaultQueues(), { scrap: 20_000 }, NOW);
    const spend = out.sender.contracts!.items.find((c) => c.type === "spend")!;
    expect(spend.progress).toBe(0);
  });
});

describe("badges du changelog", async () => {
  const { countBadges, splitBadge } = await import("@/lib/changelogBadges");
  it("reconnaît les étiquettes et ignore les liens", () => {
    expect(splitBadge("[Fix] Cloche réparée")?.badge.id).toBe("fix");
    expect(splitBadge("[Améliorations] x")?.badge.id).toBe("improvement");
    expect(splitBadge("[Nouveau]Bilan")?.rest).toBe("Bilan");
    expect(splitBadge("[lien](/game) texte")).toBeNull();
    expect(splitBadge("[Inconnu] texte")).toBeNull();
  });
  it("compte les éléments par type, dans l'ordre des badges", () => {
    const body = "## A\n- [Fix] a\n- [Nouveau] b\n- [fix] c\n- rien\nParagraphe [Fix] pas compté";
    expect(countBadges(body).map((c) => [c.badge.id, c.count])).toEqual([
      ["new", 1],
      ["fix", 2],
    ]);
  });
});
