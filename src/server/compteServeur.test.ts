import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* 6.14.65 (AC-B) et 6.14.66 (AC-C), revue AU27 : la fiche d'un joueur ne s'écrit et ne s'efface que par le serveur.
   - aucun service du client n'écrit `players` pour un autre joueur, ni n'efface `players`, `queues` ou `users` ;
   - règles d'API : écriture de l'état de jeu et suppression réservées (pb_schema.json), recopiées au démarrage ;
   - la suppression de compte passe par `purgePlayer`, partagé avec l'admin. */

const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
const routes = readFileSync("pocketbase/pb_hooks/cosmic.pb.js", "utf8");
const schema = JSON.parse(readFileSync("pocketbase/pb_schema.json", "utf8")) as { name: string; updateRule: string | null; deleteRule: string | null }[];
const ADMIN = '(@request.auth.id != "" && @collection.admins.id ?= @request.auth.id)';

function sources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

/** Écritures directes du client permises sur `players` : sa propre fiche, champs de préférence (guardPlayerUpdate). */
const OWN_PLAYER_WRITES = ["src/services/playerService.ts", "src/services/allianceService.ts", "src/services/mailService.ts"];

describe("fiche joueur écrite et effacée par le serveur seulement (AC-B, AC-C)", () => {
  const files = sources("src").map((f) => ({ f, text: readFileSync(f, "utf8") }));

  it("aucun service n'efface players, queues ou users par l'API des collections", () => {
    const offenders = files.filter(({ text }) => /collection\("(players|queues|users)"\)\.delete\(/.test(text)).map(({ f }) => f);
    expect(offenders).toEqual([]);
  });

  it("seuls les services de sa propre fiche écrivent players (l'admin passe par admin/player-action)", () => {
    const writers = files.filter(({ text }) => /collection\("players"\)\.update\(/.test(text)).map(({ f }) => f.replace(/\\/g, "/"));
    expect(writers.filter((f) => !OWN_PLAYER_WRITES.includes(f))).toEqual([]);
    const admin = readFileSync("src/services/adminService.ts", "utf8");
    expect(admin).toContain('action: "edit"');
    expect(admin).toContain('action: "resetAllXp"');
  });

  it("règles d'API : la fiche et les files ne s'effacent que par un admin, l'état de jeu ne s'écrit pas en direct", () => {
    const players = schema.find((c) => c.name === "players")!;
    const queues = schema.find((c) => c.name === "queues")!;
    expect(players.deleteRule).toBe(ADMIN);
    expect(queues.deleteRule).toBe(ADMIN);
    expect(players.updateRule).not.toContain("@collection.admins");
    expect(players.updateRule).toContain("@request.body.resources:isset = false");
    // Recopiées au démarrage sur une base existante (ensureSchema n'ajoutait que des champs).
    expect(db).toContain('const SCHEMA_RULE_SYNC = { players: ["updateRule", "deleteRule"], queues: ["deleteRule"] };');
  });

  it("suppression de compte : route du joueur, ménage commun, garde sur users", () => {
    expect(routes).toContain('"/api/cosmic/account/delete"');
    expect(routes).toMatch(/onRecordDeleteRequest\([^]*?guardUserDelete\(e\)[^]*?"users"\)/);
    expect(db).toMatch(/function accountDelete\(e\) \{[^]*?validatePassword\(password\)[^]*?purgePlayer\(txApp, game, uid/);
    expect(db).toMatch(/function adminDeletePlayer\(e\) \{[^]*?purgePlayer\(txApp, game, uid/);
    const purge = db.slice(db.indexOf("function purgePlayer("), db.indexOf("function adminDeletePlayer("));
    for (const part of ['"alliances"', '"fleets"', '"market_offers"', '"auctions"', '"trade_contracts"', '"notifications"', '"passkeys"', '"queues"', '"users"', "deleteProfile("]) {
      expect(purge, part).toContain(part);
    }
  });
});
