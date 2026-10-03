import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { empireStats } from "@/game/empireStats";
import { empireStatsCsv, empireStatsJson, empireStatsRows } from "@/lib/empireExport";
import { empireCardFromPlayer } from "@/lib/empireCardFromPlayer";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);
beforeEach(() => applyGameContent({}));

function player(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Nico;tine"), uid: "u1", victories: 3, defeats: 1 } as PlayerState;
  p.titles = [{ label: "Héros de la saga", seasonId: "s", rank: 1 }, { label: "Vétéran d'octobre", seasonId: "t", rank: 1 }];
  p.activeTitle = "Vétéran d'octobre";
  return p;
}

describe("v5.7 export et carte d'empire", () => {
  it("CSV français : BOM, point-virgule, valeurs échappées", () => {
    const csv = empireStatsCsv(empireStats(player(), [], NOW));
    expect(csv.startsWith("﻿Section;Statistique;Valeur")).toBe(true);
    expect(csv).toContain('Joueur;Pseudo;"Nico;tine"');
    expect(csv).toContain("Joueur;Victoires;3");
  });

  it("JSON complet et lignes par section", () => {
    const st = empireStats(player(), [], NOW);
    expect(JSON.parse(empireStatsJson(st, NOW))).toMatchObject({ game: "Cosmic Empires", overview: { victories: 3 } });
    const sections = new Set(empireStatsRows(st).map((r) => r[0]));
    for (const s of ["Joueur", "Ressources", "Économie", "Armée", "Progression", "Carrière"]) expect(sections.has(s)).toBe(true);
  });

  it("carte : six chiffres, titre actif à part, derniers titres d'abord", () => {
    const p = player();
    const st = empireStats(p, [], NOW);
    const card = empireCardFromPlayer(p, st, { kind: "empire", tag: "KRN", now: NOW });
    expect(card.stats).toHaveLength(6);
    expect(card.title).toBe("Vétéran d'octobre");
    expect(card.titles).toEqual(["Héros de la saga"]);
    expect(card.kicker).toBe("État de l'empire");
    expect(empireCardFromPlayer(p, st, { kind: "profile", now: NOW }).stats[0].label).toBe("XP");
  });
});
