import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { defaultPlayerState } from "@/game/defaults";
import { GLOSSARY, walletEntries } from "@/game/wallet";
import type { PlayerState } from "@/types/game";

/* 5.31 (lot D) : portefeuille unique et nommage unifié. */

const NOW = Date.UTC(2026, 9, 8, 12);

describe("portefeuille", () => {
  it("chaque entrée dit d'où elle vient, à quoi elle sert, et mène quelque part", () => {
    const p = defaultPlayerState("u1", "Comptable") as PlayerState;
    const list = walletEntries(p, NOW);
    expect(new Set(list.map((e) => e.id)).size).toBe(list.length);
    for (const e of list) {
      expect(e.earn.length).toBeGreaterThan(10);
      expect(e.spend.length).toBeGreaterThan(10);
      expect(e.link.startsWith("/game/")).toBe(true);
    }
  });

  it("le glossaire définit Saison, Passe et Chroniques", () => {
    const terms = GLOSSARY.map((g) => g.term);
    expect(terms).toEqual(expect.arrayContaining(["Saison", "Passe", "Chroniques"]));
  });

  it("nommage : « passe de saison » n'apparaît plus dans les écrans joueurs", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
          if (name !== "admin") walk(path);
        } else if (/\.tsx$/.test(name) && !/\.test\./.test(name) && /[Pp]asse de saison/.test(readFileSync(path, "utf8"))) offenders.push(path);
      }
    };
    walk("src/pages");
    walk("src/components");
    expect(offenders).toEqual([]);
  });
});
