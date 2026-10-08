import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { canSpendResources, spendAmber, spendHookReady, spendResources } from "@/game/spending";
import { newPlayerProfile } from "@/game/actions";
import { contractDay } from "@/game/contracts";
import type { PlayerState } from "@/types/game";

/* 6.14.110 (AU27, lot AC-D, constat AC-5) : un seul chemin de dépense. */

const NOW = Date.UTC(2026, 9, 8, 12);

function player(): PlayerState {
  const p = newPlayerProfile("u1", "Testeur", NOW).player;
  p.resources.scrap = 10_000;
  p.resources.energy = 5_000;
  return p;
}

describe("spendResources", () => {
  it("l'objectif du jour « Dépenser » est branché dès que le moteur est chargé (contracts.ts)", () => {
    expect(spendHookReady()).toBe(true);
  });

  it("vérifie, débite et compte la dépense (statistique et objectif « Dépenser »)", () => {
    const p = player();
    p.contracts = { day: contractDay(NOW), items: [{ id: "c1", type: "spend", target: 5_000, progress: 0, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false };
    const total = spendResources(p, { scrap: 3_000, energy: 1_000 }, NOW);
    expect(total).toBe(4_000);
    expect(p.resources.scrap).toBe(7_000);
    expect(p.resources.energy).toBe(4_000);
    expect(p.stats?.spent).toBe(4_000);
    expect(p.contracts?.items[0].progress).toBe(4_000);
  });

  it("refuse sans rien débiter quand une ressource manque (message de l'appelant)", () => {
    const p = player();
    expect(() => spendResources(p, { scrap: 3_000, energy: 9_000 }, NOW, { message: "Pas assez." })).toThrow("Pas assez.");
    expect(p.resources.scrap).toBe(10_000);
    expect(p.stats?.spent ?? 0).toBe(0);
  });

  it("refuse un montant négatif ou non numérique (jamais un crédit déguisé)", () => {
    const p = player();
    expect(canSpendResources(p, { scrap: -5 })).toBe(false);
    expect(canSpendResources(p, { scrap: Number.NaN })).toBe(false);
    expect(() => spendResources(p, { scrap: -5 }, NOW)).toThrow();
    expect(p.resources.scrap).toBe(10_000);
  });

  it("un cadeau (count: false) débite sans compter la dépense", () => {
    const p = player();
    spendResources(p, { scrap: 1_000 }, NOW, { count: false });
    expect(p.resources.scrap).toBe(9_000);
    expect(p.stats?.spent ?? 0).toBe(0);
  });
});

describe("spendAmber", () => {
  it("vérifie, débite le portefeuille et compte `amberSpent`", () => {
    const p = player();
    const wallet = { amber: 50 };
    expect(spendAmber(p, wallet, 20)).toBe(20);
    expect(wallet.amber).toBe(30);
    expect(p.stats?.amberSpent).toBe(20);
    expect(() => spendAmber(p, wallet, 31, "Il te faut 31 Ambre.")).toThrow("Il te faut 31 Ambre.");
    expect(wallet.amber).toBe(30);
    expect(spendAmber(p, wallet, 0)).toBe(0);
  });
});

/* Garde : toute soustraction de ressources de la planète mère ou d'Ambre hors de `spending.ts` est un transfert listé ici,
 * avec sa raison. Une nouvelle dépense passe par `spendResources` / `spendAmber`, sinon ce test échoue. */
const PATTERNS = [/resources\[[^\]]+\]\s*-=/, /resources\[[^\]]+\]\s*=\s*[^;]*\)\s*-\s*[a-zA-Z(]/, /\.amber\s*-=/];
const ALLOWED: Record<string, { count: number; why: string }> = {
  "src/game/actions.ts": { count: 2, why: "comptoir (échange, pas une dépense : `traded`) ; butin pris par l'attaquant (ancien rapport)" },
  "src/game/alliances.ts": { count: 1, why: "dépôt au trésor d'alliance (transfert)" },
  "src/game/attack.ts": { count: 1, why: "butin pris au défenseur" },
  "src/game/auctions.ts": { count: 2, why: "mise d'enchère en dépôt, rendue si dépassée (transfert)" },
  "src/game/colonies.ts": { count: 2, why: "stock propre d'une colonie (amélioration, défense, route)" },
  "src/game/expeditions.ts": { count: 1, why: "perte d'expédition (évènement)" },
  "src/game/fleets.ts": { count: 2, why: "cargaison d'une livraison et d'un contrat de commerce (transfert)" },
  "src/game/market.ts": { count: 3, why: "marché : marchandise et paiement (transfert)" },
  "src/game/pirates.ts": { count: 2, why: "tribut d'un ultimatum et pillage d'un raid (perte subie)" },
  "src/game/seasonWars.ts": { count: 1, why: "coffre de guerre d'alliance (pas le joueur)" },
  "src/game/serverPot.ts": { count: 1, why: "pot commun (pas le joueur)" },
  "src/game/spending.ts": { count: 2, why: "le chemin unique" },
  "src/game/tradeContracts.ts": { count: 2, why: "paiement et caution d'un contrat de commerce (transfert)" },
};

function walk(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith(".ts") && !f.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

describe("garde AC-5 : un seul chemin de dépense", () => {
  it("aucune soustraction de ressources ou d'Ambre hors de la liste des transferts", () => {
    const root = path.resolve(__dirname, "../..");
    const files = [...walk(path.join(root, "src/game")), path.join(root, "pocketbase/pb_hooks/cosmic_db.js"), path.join(root, "pocketbase/pb_hooks/cosmic.pb.js")];
    const found: Record<string, number> = {};
    for (const f of files) {
      const rel = path.relative(root, f).split(path.sep).join("/");
      const n = fs
        .readFileSync(f, "utf8")
        .split("\n")
        .filter((l) => PATTERNS.some((r) => r.test(l))).length;
      if (n > 0) found[rel] = n;
    }
    const expected = Object.fromEntries(Object.entries(ALLOWED).map(([k, v]) => [k, v.count]));
    expect(found).toEqual(expected);
  });
});
